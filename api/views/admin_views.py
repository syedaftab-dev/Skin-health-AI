from datetime import datetime, timezone
from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.database import get_db
from api.auth.decorators import parse_json, require_role


@csrf_exempt
@require_role("admin")
def get_stats(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    total_patients = db.users.count_documents({"role": "patient"})
    total_doctors = db.users.count_documents({"role": "doctor"})
    approved_doctors = db.doctors.count_documents({"is_approved": True})
    pending_doctors = db.doctors.count_documents({"is_approved": False})
    total_appointments = db.appointments.count_documents({})
    total_predictions = db.predictions.count_documents({})

    today = datetime.now(timezone.utc).date().isoformat()
    today_appointments = db.appointments.count_documents({"appointment_date": today})
    completed_appointments = db.appointments.count_documents({"status": "completed"})

    return JsonResponse({
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "approved_doctors": approved_doctors,
        "pending_doctors": pending_doctors,
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "completed_appointments": completed_appointments,
        "total_predictions": total_predictions,
    }, status=200)


@csrf_exempt
@require_role("admin")
def get_pending_doctors(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    pipeline = [
        {"$match": {"is_approved": False}},
        {
            "$lookup": {
                "from": "users",
                "let": {"uid": {"$toObjectId": "$user_id"}},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$uid"]}}},
                    {"$project": {"name": 1, "email": 1, "phone": 1, "created_at": 1}},
                ],
                "as": "user_info",
            }
        },
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
    ]
    doctors = []
    for doc in db.doctors.aggregate(pipeline):
        u_info = doc.get("user_info", {})
        created_at = u_info.get("created_at", "")
        doctors.append({
            "id": doc.get("user_id"),
            "name": u_info.get("name", ""),
            "email": u_info.get("email", ""),
            "phone": u_info.get("phone", ""),
            "license_number": doc.get("license_number", ""),
            "specialization": doc.get("specialization", ""),
            "experience_years": doc.get("experience_years", 0),
            "clinic_name": doc.get("clinic_name", ""),
            "clinic_address": doc.get("clinic_address", ""),
            "consultation_fee": doc.get("consultation_fee", 0),
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
        })
    return JsonResponse({"doctors": doctors}, status=200)


@csrf_exempt
@require_role("admin")
def get_all_doctors(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    status = request.GET.get("status")
    try:
        page = max(1, int(request.GET.get("page", 1)))
    except ValueError:
        page = 1

    try:
        limit = max(1, min(100, int(request.GET.get("limit", 20))))
    except ValueError:
        limit = 20

    query = {}
    if status == "approved":
        query["is_approved"] = True
    elif status == "pending":
        query["is_approved"] = False

    skip = (page - 1) * limit
    pipeline = [
        {"$match": query},
        {
            "$lookup": {
                "from": "users",
                "let": {"uid": {"$toObjectId": "$user_id"}},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$uid"]}}},
                    {"$project": {"name": 1, "email": 1, "phone": 1, "is_active": 1, "created_at": 1}},
                ],
                "as": "user_info",
            }
        },
        {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
        {"$skip": skip},
        {"$limit": limit},
    ]

    doctors = []
    for doc in db.doctors.aggregate(pipeline):
        u_info = doc.get("user_info", {})
        doctors.append({
            "id": doc.get("user_id"),
            "name": u_info.get("name", ""),
            "email": u_info.get("email", ""),
            "is_active": u_info.get("is_active", True),
            "is_approved": doc.get("is_approved", False),
            "license_number": doc.get("license_number", ""),
            "specialization": doc.get("specialization", ""),
            "experience_years": doc.get("experience_years", 0),
            "clinic_name": doc.get("clinic_name", ""),
        })

    total = db.doctors.count_documents(query)
    return JsonResponse({"doctors": doctors, "total": total, "page": page}, status=200)


@csrf_exempt
@require_role("admin")
def approve_doctor(request, doctor_id, user):
    if request.method not in ("PUT", "POST"):
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    result = db.doctors.update_one(
        {"user_id": doctor_id},
        {"$set": {"is_approved": True}}
    )
    if result.matched_count == 0:
        return JsonResponse({"detail": "Doctor not found"}, status=404)
    return JsonResponse({"message": "Doctor approved"}, status=200)


@csrf_exempt
@require_role("admin")
def reject_doctor(request, doctor_id, user):
    if request.method not in ("PUT", "POST"):
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    db = get_db()
    result = db.doctors.update_one(
        {"user_id": doctor_id},
        {"$set": {"is_approved": False, "rejection_reason": data.get("reason", "")}}
    )
    if result.matched_count == 0:
        return JsonResponse({"detail": "Doctor not found"}, status=404)
    return JsonResponse({"message": "Doctor rejected"}, status=200)


@csrf_exempt
@require_role("admin")
def toggle_block_user(request, user_id, user):
    if request.method not in ("PUT", "POST"):
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    try:
        target = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return JsonResponse({"detail": "Invalid user ID"}, status=400)

    if not target:
        return JsonResponse({"detail": "User not found"}, status=404)

    if target.get("role") == "admin":
        return JsonResponse({"detail": "Cannot block admin users"}, status=400)

    new_status = not target.get("is_active", True)
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": new_status}}
    )
    return JsonResponse({
        "message": f"User {'unblocked' if new_status else 'blocked'}",
        "is_active": new_status,
    }, status=200)


@csrf_exempt
@require_role("admin")
def get_all_patients(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    search = request.GET.get("search")
    try:
        page = max(1, int(request.GET.get("page", 1)))
    except ValueError:
        page = 1

    try:
        limit = max(1, min(100, int(request.GET.get("limit", 20))))
    except ValueError:
        limit = 20

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
    for doc in cursor:
        uid = str(doc["_id"])
        pred_count = db.predictions.count_documents({"patient_id": uid})
        appt_count = db.appointments.count_documents({"patient_id": uid})
        created_at = doc.get("created_at", "")
        patients.append({
            "id": uid,
            "name": doc.get("name", ""),
            "email": doc.get("email", ""),
            "phone": doc.get("phone", ""),
            "is_active": doc.get("is_active", True),
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
            "predictions_count": pred_count,
            "appointments_count": appt_count,
        })

    total = db.users.count_documents(query)
    return JsonResponse({"patients": patients, "total": total, "page": page}, status=200)
