from fastapi import APIRouter, Depends, HTTPException, Query
from api.auth.dependencies import require_role
from api.database import get_db
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class RejectRequest(BaseModel):
    reason: str


@router.get("/stats")
async def get_stats(user=Depends(require_role("admin"))):
    db = get_db()

    total_patients = await db.users.count_documents({"role": "patient"})
    total_doctors = await db.users.count_documents({"role": "doctor"})
    approved_doctors = await db.doctors.count_documents({"is_approved": True})
    pending_doctors = await db.doctors.count_documents({"is_approved": False})
    total_appointments = await db.appointments.count_documents({})
    total_predictions = await db.predictions.count_documents({})

    # Today's stats
    today = datetime.now(timezone.utc).date().isoformat()
    today_appointments = await db.appointments.count_documents({"appointment_date": today})
    completed_appointments = await db.appointments.count_documents({"status": "completed"})

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "approved_doctors": approved_doctors,
        "pending_doctors": pending_doctors,
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "completed_appointments": completed_appointments,
        "total_predictions": total_predictions,
    }


@router.get("/doctors/pending")
async def get_pending_doctors(user=Depends(require_role("admin"))):
    db = get_db()
    pipeline = [
        {"$match": {"is_approved": False}},
        {"$lookup": {
            "from": "users",
            "let": {"uid": {"$toObjectId": "$user_id"}},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$_id", "$$uid"]}}},
                {"$project": {"name": 1, "email": 1, "phone": 1, "created_at": 1}}
            ],
            "as": "user_info"
        }},
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
    ]
    doctors = []
    async for doc in db.doctors.aggregate(pipeline):
        doctors.append({
            "id": doc.get("user_id"),
            "name": doc.get("user_info", {}).get("name", ""),
            "email": doc.get("user_info", {}).get("email", ""),
            "phone": doc.get("user_info", {}).get("phone", ""),
            "license_number": doc.get("license_number", ""),
            "specialization": doc.get("specialization", ""),
            "experience_years": doc.get("experience_years", 0),
            "clinic_name": doc.get("clinic_name", ""),
            "clinic_address": doc.get("clinic_address", ""),
            "consultation_fee": doc.get("consultation_fee", 0),
            "created_at": doc.get("user_info", {}).get("created_at", ""),
        })
    return {"doctors": doctors}


@router.get("/doctors/all")
async def get_all_doctors(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_role("admin")),
):
    db = get_db()
    query = {}
    if status == "approved":
        query["is_approved"] = True
    elif status == "pending":
        query["is_approved"] = False

    skip = (page - 1) * limit
    pipeline = [
        {"$match": query},
        {"$lookup": {
            "from": "users",
            "let": {"uid": {"$toObjectId": "$user_id"}},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$_id", "$$uid"]}}},
                {"$project": {"name": 1, "email": 1, "phone": 1, "is_active": 1, "created_at": 1}}
            ],
            "as": "user_info"
        }},
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
        {"$skip": skip},
        {"$limit": limit},
    ]

    doctors = []
    async for doc in db.doctors.aggregate(pipeline):
        doctors.append({
            "id": doc.get("user_id"),
            "name": doc.get("user_info", {}).get("name", ""),
            "email": doc.get("user_info", {}).get("email", ""),
            "is_active": doc.get("user_info", {}).get("is_active", True),
            "is_approved": doc.get("is_approved", False),
            "license_number": doc.get("license_number", ""),
            "specialization": doc.get("specialization", ""),
            "experience_years": doc.get("experience_years", 0),
            "clinic_name": doc.get("clinic_name", ""),
        })

    total = await db.doctors.count_documents(query)
    return {"doctors": doctors, "total": total, "page": page}


@router.put("/doctors/{doctor_id}/approve")
async def approve_doctor(doctor_id: str, user=Depends(require_role("admin"))):
    db = get_db()
    result = await db.doctors.update_one(
        {"user_id": doctor_id},
        {"$set": {"is_approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor approved"}


@router.put("/doctors/{doctor_id}/reject")
async def reject_doctor(
    doctor_id: str,
    data: RejectRequest,
    user=Depends(require_role("admin")),
):
    db = get_db()
    # Keep the record but mark as not approved and add rejection reason
    result = await db.doctors.update_one(
        {"user_id": doctor_id},
        {"$set": {"is_approved": False, "rejection_reason": data.reason}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor rejected"}


@router.put("/users/{user_id}/block")
async def toggle_block_user(user_id: str, user=Depends(require_role("admin"))):
    db = get_db()
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot block admin users")

    new_status = not target.get("is_active", True)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": new_status}}
    )
    return {"message": f"User {'unblocked' if new_status else 'blocked'}", "is_active": new_status}


@router.get("/patients")
async def get_all_patients(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_role("admin")),
):
    db = get_db()
    query = {"role": "patient"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    cursor = db.users.find(query).skip(skip).limit(limit)

    patients = []
    async for doc in cursor:
        uid = str(doc["_id"])
        pred_count = await db.predictions.count_documents({"patient_id": uid})
        appt_count = await db.appointments.count_documents({"patient_id": uid})
        patients.append({
            "id": uid,
            "name": doc.get("name", ""),
            "email": doc.get("email", ""),
            "phone": doc.get("phone", ""),
            "is_active": doc.get("is_active", True),
            "created_at": doc.get("created_at", ""),
            "predictions_count": pred_count,
            "appointments_count": appt_count,
        })

    total = await db.users.count_documents(query)
    return {"patients": patients, "total": total, "page": page}
