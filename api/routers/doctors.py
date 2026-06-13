from fastapi import APIRouter, Depends, HTTPException, Query
from api.auth.dependencies import get_current_user, require_role
from api.database import get_db
from bson import ObjectId
from typing import Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])


class DoctorProfileUpdate(BaseModel):
    name: str
    phone: str
    specialization: str
    experience_years: int
    bio: str


@router.get("")
async def list_doctors(
    search: Optional[str] = None,
    specialization: Optional[str] = None,
    pincode: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    db = get_db()
    query = {"is_approved": True}

    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    if pincode:
        query["clinic_pincode"] = pincode

    skip = (page - 1) * limit

    pipeline = [
        {"$match": query},
        {"$lookup": {
            "from": "users",
            "let": {"uid": {"$toObjectId": "$user_id"}},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$_id", "$$uid"]}}},
                {"$project": {"name": 1, "email": 1, "phone": 1}}
            ],
            "as": "user_info"
        }},
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
    ]

    if search:
        pipeline.append({
            "$match": {
                "$or": [
                    {"clinic_name": {"$regex": search, "$options": "i"}},
                    {"specialization": {"$regex": search, "$options": "i"}},
                    {"user_info.name": {"$regex": search, "$options": "i"}},
                ]
            }
        })

    pipeline.extend([
        {"$skip": skip},
        {"$limit": limit},
    ])

    doctors = []
    async for doc in db.doctors.aggregate(pipeline):
        doctor = {
            "id": doc.get("user_id"),
            "name": doc.get("user_info", {}).get("name", ""),
            "email": doc.get("user_info", {}).get("email", ""),
            "specialization": doc.get("specialization", ""),
            "experience_years": doc.get("experience_years", 0),
            "consultation_fee": doc.get("consultation_fee", 0),
            "clinic_name": doc.get("clinic_name", ""),
            "clinic_address": doc.get("clinic_address", ""),
            "clinic_pincode": doc.get("clinic_pincode", ""),
            "clinic_latitude": doc.get("clinic_latitude"),
            "clinic_longitude": doc.get("clinic_longitude"),
            "bio": doc.get("bio", ""),
            "rating": doc.get("rating", 0),
            "profile_photo_url": doc.get("profile_photo_url"),
        }
        doctors.append(doctor)

    total = await db.doctors.count_documents(query)
    return {"doctors": doctors, "total": total, "page": page, "limit": limit}


@router.get("/{doctor_id}")
async def get_doctor(doctor_id: str):
    db = get_db()
    doctor = await db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        user = await db.users.find_one({"_id": ObjectId(doctor_id)})
    except Exception:
        user = {}

    # Get availability
    availability = []
    async for slot in db.doctor_availability.find({"doctor_id": doctor_id, "is_active": True}):
        availability.append({
            "day_of_week": slot["day_of_week"],
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "slot_duration_minutes": slot.get("slot_duration_minutes", 30),
        })

    return {
        "id": doctor_id,
        "name": user.get("name", "") if user else "",
        "email": user.get("email", "") if user else "",
        "phone": user.get("phone", "") if user else "",
        "specialization": doctor.get("specialization", ""),
        "experience_years": doctor.get("experience_years", 0),
        "consultation_fee": doctor.get("consultation_fee", 0),
        "clinic_name": doctor.get("clinic_name", ""),
        "clinic_address": doctor.get("clinic_address", ""),
        "clinic_pincode": doctor.get("clinic_pincode", ""),
        "clinic_latitude": doctor.get("clinic_latitude"),
        "clinic_longitude": doctor.get("clinic_longitude"),
        "license_number": doctor.get("license_number", ""),
        "bio": doctor.get("bio", ""),
        "rating": doctor.get("rating", 0),
        "profile_photo_url": doctor.get("profile_photo_url"),
        "is_approved": doctor.get("is_approved", False),
        "availability": availability,
    }


@router.get("/{doctor_id}/availability")
async def get_availability(doctor_id: str):
    db = get_db()
    doctor = await db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Get weekly schedule
    schedule = {}
    async for slot in db.doctor_availability.find({"doctor_id": doctor_id, "is_active": True}):
        day = slot["day_of_week"]
        schedule[day] = {
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "slot_duration_minutes": slot.get("slot_duration_minutes", 30),
        }

    # Get blocked slots for next 7 days
    today = datetime.now(timezone.utc).date()
    end_date = today + timedelta(days=7)
    blocked = []
    async for block in db.blocked_slots.find({
        "doctor_id": doctor_id,
        "date": {"$gte": today.isoformat(), "$lte": end_date.isoformat()}
    }):
        blocked.append({
            "date": block["date"],
            "start_time": block.get("start_time"),
            "end_time": block.get("end_time"),
            "reason": block.get("reason", ""),
        })

    # Get booked appointments for next 7 days
    booked = []
    async for appt in db.appointments.find({
        "doctor_id": doctor_id,
        "appointment_date": {"$gte": today.isoformat(), "$lte": end_date.isoformat()},
        "status": {"$in": ["pending", "confirmed"]},
    }):
        booked.append({
            "date": appt["appointment_date"],
            "time": appt["appointment_time"],
        })

    # Generate available slots for each day
    available_slots = {}
    for i in range(7):
        date = today + timedelta(days=i)
        day_of_week = date.weekday()  # 0=Monday
        date_str = date.isoformat()

        if day_of_week not in schedule:
            continue

        sched = schedule[day_of_week]
        # Check if day is fully blocked
        day_blocked = any(
            b["date"] == date_str and b.get("start_time") is None
            for b in blocked
        )
        if day_blocked:
            continue

        # Generate time slots
        start_h, start_m = map(int, sched["start_time"].split(":"))
        end_h, end_m = map(int, sched["end_time"].split(":"))
        duration = sched["slot_duration_minutes"]

        slots = []
        current = start_h * 60 + start_m
        end = end_h * 60 + end_m

        while current + duration <= end:
            time_str = f"{current // 60:02d}:{current % 60:02d}"
            # Check if slot is booked
            is_booked = any(
                b["date"] == date_str and b["time"] == time_str
                for b in booked
            )
            # Check if slot is blocked
            is_blocked = any(
                b["date"] == date_str and
                b.get("start_time") and b.get("end_time") and
                b["start_time"] <= time_str < b["end_time"]
                for b in blocked
            )
            if not is_booked and not is_blocked:
                slots.append(time_str)
            current += duration

        if slots:
            available_slots[date_str] = slots

    return {
        "doctor_id": doctor_id,
        "schedule": schedule,
        "available_slots": available_slots,
        "blocked_dates": blocked,
    }


@router.get("/profile")
async def get_doctor_profile(user=Depends(require_role("doctor"))):
    db = get_db()
    
    # Get user info
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get doctor info
    doctor = await db.doctors.find_one({"user_id": user["id"]})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    return {
        "id": user["id"],
        "name": user_doc.get("name", ""),
        "email": user_doc.get("email", ""),
        "phone": user_doc.get("phone", ""),
        "specialization": doctor.get("specialization", ""),
        "experience_years": doctor.get("experience_years", 0),
        "bio": doctor.get("bio", ""),
        "license_number": doctor.get("license_number", ""),
        "consultation_fee": doctor.get("consultation_fee", 0),
        "clinic_name": doctor.get("clinic_name", ""),
        "clinic_address": doctor.get("clinic_address", ""),
        "clinic_pincode": doctor.get("clinic_pincode", ""),
        "is_approved": doctor.get("is_approved", False),
        "rating": doctor.get("rating", 0),
        "profile_photo_url": doctor.get("profile_photo_url"),
    }


@router.put("/profile")
async def update_doctor_profile(
    data: DoctorProfileUpdate,
    user=Depends(require_role("doctor"))
):
    db = get_db()
    
    # Update user info
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {
            "name": data.name,
            "phone": data.phone,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Update doctor info
    await db.doctors.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "specialization": data.specialization,
            "experience_years": data.experience_years,
            "bio": data.bio,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Profile updated successfully"}


@router.post("/appointments/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: str,
    data: dict,
    user=Depends(require_role("doctor"))
):
    print(f"DEBUG: Completing appointment {appointment_id} for doctor {user['id']}")  # Debug log
    print(f"DEBUG: Consult data: {data}")  # Debug log
    db = get_db()
    
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception as e:
        print(f"DEBUG: Invalid appointment ID: {e}")  # Debug log
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    
    if not appt:
        print(f"DEBUG: Appointment not found with ID: {appointment_id}")  # Debug log
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt["doctor_id"] != user["id"]:
        print(f"DEBUG: Access denied - appointment doctor_id: {appt['doctor_id']}, user_id: {user['id']}")  # Debug log
        raise HTTPException(status_code=403, detail="Access denied")
    if appt["status"] != "confirmed":
        print(f"DEBUG: Invalid status - current: {appt['status']}")  # Debug log
        raise HTTPException(status_code=400, detail="Only confirmed appointments can be completed")
    
    print(f"DEBUG: All checks passed, creating consultation")  # Debug log
    
    # Create consultation
    consultation_doc = {
        "appointment_id": appointment_id,
        "doctor_diagnosis": data.get("doctor_diagnosis"),
        "prescription": data.get("prescription"),
        "notes": data.get("notes"),
        "created_at": datetime.now(timezone.utc),
    }
    print(f"DEBUG: Creating consultation: {consultation_doc}")  # Debug log
    await db.consultations.insert_one(consultation_doc)
    
    # Update appointment status
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )
    
    print(f"DEBUG: Consultation completed successfully")  # Debug log
    return {"message": "Consultation completed successfully"}
