from fastapi import APIRouter, Depends, HTTPException
from api.auth.dependencies import require_role
from api.database import get_db
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter(prefix="/api/doctor", tags=["Doctor Portal"])


class ScheduleSlot(BaseModel):
    day_of_week: int  # 0=Monday to 6=Sunday
    start_time: str   # HH:MM
    end_time: str      # HH:MM
    slot_duration_minutes: int = 30
    is_active: bool = True


class ScheduleUpdate(BaseModel):
    slots: List[ScheduleSlot]


class BlockSlotRequest(BaseModel):
    date: str  # ISO date
    start_time: Optional[str] = None  # None = full day
    end_time: Optional[str] = None
    reason: str = "leave"


class ClinicUpdate(BaseModel):
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    clinic_pincode: Optional[str] = None
    clinic_latitude: Optional[float] = None
    clinic_longitude: Optional[float] = None
    consultation_fee: Optional[float] = None
    bio: Optional[str] = None
    specialization: Optional[str] = None


@router.get("/schedule")
async def get_schedule(user=Depends(require_role("doctor"))):
    db = get_db()
    slots = []
    async for slot in db.doctor_availability.find({"doctor_id": user["id"]}):
        slots.append({
            "id": str(slot["_id"]),
            "day_of_week": slot["day_of_week"],
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "slot_duration_minutes": slot.get("slot_duration_minutes", 30),
            "is_active": slot.get("is_active", True),
        })
    return {"slots": slots}


@router.put("/schedule")
async def update_schedule(
    data: ScheduleUpdate,
    user=Depends(require_role("doctor")),
):
    db = get_db()
    doctor_id = user["id"]

    # Delete existing schedule
    await db.doctor_availability.delete_many({"doctor_id": doctor_id})

    # Insert new schedule
    docs = []
    for slot in data.slots:
        docs.append({
            "doctor_id": doctor_id,
            "day_of_week": slot.day_of_week,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "slot_duration_minutes": slot.slot_duration_minutes,
            "is_active": slot.is_active,
        })

    if docs:
        await db.doctor_availability.insert_many(docs)

    return {"message": "Schedule updated", "slots_count": len(docs)}


@router.post("/block-slots")
async def block_slots(
    data: BlockSlotRequest,
    user=Depends(require_role("doctor")),
):
    db = get_db()
    block_doc = {
        "doctor_id": user["id"],
        "date": data.date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "reason": data.reason,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.blocked_slots.insert_one(block_doc)
    return {"id": str(result.inserted_id), "message": "Slot blocked"}


@router.put("/clinic")
async def update_clinic(
    data: ClinicUpdate,
    user=Depends(require_role("doctor")),
):
    db = get_db()
    update_fields = {}
    for field, value in data.model_dump(exclude_none=True).items():
        update_fields[field] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db.doctors.update_one(
        {"user_id": user["id"]},
        {"$set": update_fields}
    )
    return {"message": "Clinic info updated"}


@router.get("/patients")
async def get_doctor_patients(user=Depends(require_role("doctor"))):
    db = get_db()
    # Get unique patient IDs from appointments
    pipeline = [
        {"$match": {"doctor_id": user["id"]}},
        {"$group": {"_id": "$patient_id"}},
    ]
    patient_ids = []
    async for doc in db.appointments.aggregate(pipeline):
        patient_ids.append(doc["_id"])
    patients = []
    for pid in patient_ids:
        try:
            patient_user = await db.users.find_one({"_id": ObjectId(pid)})
        except Exception:
            continue
        if patient_user:
            patient_info = await db.patients.find_one({"user_id": pid})
            # Count appointments
            appt_count = await db.appointments.count_documents({
                "doctor_id": user["id"],
                "patient_id": pid,
            })
            patients.append({
                "id": str(patient_user["_id"]),
                "name": patient_user.get("name", ""),
                "email": patient_user.get("email", ""),
                "appointments_count": appt_count,
            })
    return {"patients": patients}


@router.get("/dashboard-stats")
async def get_dashboard_stats(user=Depends(require_role("doctor"))):
    db = get_db()
    today = datetime.now(timezone.utc).date()
    
    # Get today's appointments
    today_appts = []
    async for doc in db.appointments.find({
        "doctor_id": user["id"],
        "appointment_date": {"$gte": today.isoformat()}
    }):
        today_appts.append({
            "id": str(doc["_id"]),
            "patient_name": (await db.users.find_one({"_id": ObjectId(doc["patient_id"])}) or {}).get("name", "Unknown"),
            "appointment_time": doc.get("appointment_time", ""),
            "appointment_date": doc.get("appointment_date", ""),
        })
    
    # Get pending consultations (confirmed appointments without consultation)
    pending_consultations = 0
    async for appt in db.appointments.find({
        "doctor_id": user["id"],
        "status": "confirmed"
    }):
        # Check if consultation exists
        consultation = await db.consultations.find_one({"appointment_id": str(appt["_id"])})
        if not consultation:
            pending_consultations += 1
    
    # Get total unique patients
    pipeline = [
        {"$match": {"doctor_id": user["id"]}},
        {"$group": {"_id": "$patient_id"}},
        {"$count": "total_patients"}
    ]
    result = await db.appointments.aggregate(pipeline).to_list(length=None)
    total_patients = result[0]["total_patients"] if result else 0
    
    return {
        "todayCount": len(today_appts),
        "pendingCount": pending_consultations,
        "totalPatients": total_patients,
        "todaySchedule": today_appts
    }
