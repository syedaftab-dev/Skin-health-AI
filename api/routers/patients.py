from fastapi import APIRouter, Depends, HTTPException
from api.auth.dependencies import get_current_user, require_role
from api.database import get_db
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/patient", tags=["Patient Portal"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    default_city: Optional[str] = None
    default_location_pincode: Optional[str] = None


@router.get("/profile")
async def get_patient_profile(user=Depends(require_role("patient"))):
    db = get_db()
    patient = await db.patients.find_one({"user_id": user["id"]})

    return {
        "id": user["id"],
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "date_of_birth": patient.get("date_of_birth") if patient else None,
        "default_city": patient.get("default_city") if patient else None,
        "default_location_pincode": patient.get("default_location_pincode") if patient else None,
    }


@router.put("/profile")
async def update_patient_profile(
    data: ProfileUpdate,
    user=Depends(require_role("patient")),
):
    db = get_db()

    # Update user fields
    user_updates = {}
    if data.name:
        user_updates["name"] = data.name
    if data.phone:
        user_updates["phone"] = data.phone
    if user_updates:
        user_updates["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": user_updates})

    # Update patient fields
    patient_updates = {}
    if data.date_of_birth is not None:
        patient_updates["date_of_birth"] = data.date_of_birth
    if data.default_city is not None:
        patient_updates["default_city"] = data.default_city
    if data.default_location_pincode is not None:
        patient_updates["default_location_pincode"] = data.default_location_pincode
    if patient_updates:
        await db.patients.update_one({"user_id": user["id"]}, {"$set": patient_updates})

    return {"message": "Profile updated"}


@router.get("/medical-history")
async def get_medical_history(user=Depends(require_role("patient"))):
    db = get_db()
    patient_id = user["id"]

    # Get predictions
    predictions = []
    async for doc in db.predictions.find({"patient_id": patient_id}).sort("created_at", -1):
        predictions.append({
            "id": str(doc["_id"]),
            "type": "prediction",
            "date": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"]),
            "disease_name": doc.get("disease_name", ""),
            "confidence_score": doc.get("confidence_score", 0),
            "severity": doc.get("severity", ""),
            "image_url": doc.get("image_url", ""),
        })

    # Get consultations from completed appointments
    consultations = []
    async for appt in db.appointments.find({
        "patient_id": patient_id,
        "status": "completed",
    }).sort("appointment_date", -1):
        cons = await db.consultations.find_one({"appointment_id": str(appt["_id"])})
        if cons:
            # Get doctor info
            doctor_user = None
            try:
                doctor_user = await db.users.find_one({"_id": ObjectId(appt["doctor_id"])})
            except Exception:
                pass
            doctor = await db.doctors.find_one({"user_id": appt["doctor_id"]})

            consultations.append({
                "id": str(cons["_id"]),
                "type": "consultation",
                "date": appt["appointment_date"],
                "doctor_name": doctor_user.get("name", "") if doctor_user else "",
                "doctor_specialization": doctor.get("specialization", "") if doctor else "",
                "diagnosis": cons.get("doctor_diagnosis", ""),
                "prescription": cons.get("prescription", ""),
                "notes": cons.get("notes", ""),
            })

    # Merge and sort by date
    history = predictions + consultations
    history.sort(key=lambda x: x["date"], reverse=True)

    return {"history": history}
