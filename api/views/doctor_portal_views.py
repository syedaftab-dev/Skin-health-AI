from datetime import datetime, timezone
from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.database import get_db
from api.auth.decorators import parse_json, require_role


@csrf_exempt
@require_role("doctor")
def schedule(request, user):
    db = get_db()
    doctor_id = user["id"]

    if request.method == "GET":
        slots = []
        cursor = db.doctor_availability.find({"doctor_id": doctor_id})
        for slot in cursor:
            slots.append({
                "id": str(slot["_id"]),
                "day_of_week": slot["day_of_week"],
                "start_time": slot["start_time"],
                "end_time": slot["end_time"],
                "slot_duration_minutes": slot.get("slot_duration_minutes", 30),
                "is_active": slot.get("is_active", True),
            })
        return JsonResponse({"slots": slots}, status=200)

    elif request.method == "PUT":
        data = parse_json(request)
        slots_data = data.get("slots", [])

        db.doctor_availability.delete_many({"doctor_id": doctor_id})

        docs = []
        for slot in slots_data:
            docs.append({
                "doctor_id": doctor_id,
                "day_of_week": slot.get("day_of_week"),
                "start_time": slot.get("start_time"),
                "end_time": slot.get("end_time"),
                "slot_duration_minutes": slot.get("slot_duration_minutes", 30),
                "is_active": slot.get("is_active", True),
            })

        if docs:
            db.doctor_availability.insert_many(docs)

        return JsonResponse({"message": "Schedule updated", "slots_count": len(docs)}, status=200)

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@csrf_exempt
@require_role("doctor")
def block_slots(request, user):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    db = get_db()
    block_doc = {
        "doctor_id": user["id"],
        "date": data.get("date"),
        "start_time": data.get("start_time"),
        "end_time": data.get("end_time"),
        "reason": data.get("reason", "leave"),
        "created_at": datetime.now(timezone.utc),
    }
    result = db.blocked_slots.insert_one(block_doc)
    return JsonResponse({"id": str(result.inserted_id), "message": "Slot blocked"}, status=200)


@csrf_exempt
@require_role("doctor")
def update_clinic(request, user):
    if request.method != "PUT":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    db = get_db()
    allowed_fields = [
        "clinic_name", "clinic_address", "clinic_pincode",
        "clinic_latitude", "clinic_longitude", "consultation_fee",
        "bio", "specialization"
    ]
    update_fields = {k: v for k, v in data.items() if k in allowed_fields and v is not None}

    if not update_fields:
        return JsonResponse({"detail": "No fields to update"}, status=400)

    db.doctors.update_one({"user_id": user["id"]}, {"$set": update_fields})
    return JsonResponse({"message": "Clinic info updated"}, status=200)


@csrf_exempt
@require_role("doctor")
def get_doctor_patients(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    pipeline = [
        {"$match": {"doctor_id": user["id"]}},
        {"$group": {"_id": "$patient_id"}},
    ]
    patient_ids = [doc["_id"] for doc in db.appointments.aggregate(pipeline)]

    patients = []
    for pid in patient_ids:
        try:
            patient_user = db.users.find_one({"_id": ObjectId(pid)})
        except Exception:
            continue
        if patient_user:
            appt_count = db.appointments.count_documents({
                "doctor_id": user["id"],
                "patient_id": pid,
            })
            patients.append({
                "id": str(patient_user["_id"]),
                "name": patient_user.get("name", ""),
                "email": patient_user.get("email", ""),
                "appointments_count": appt_count,
            })

    return JsonResponse({"patients": patients}, status=200)


@csrf_exempt
@require_role("doctor")
def get_dashboard_stats(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    today = datetime.now(timezone.utc).date()

    today_appts = []
    cursor = db.appointments.find({
        "doctor_id": user["id"],
        "appointment_date": {"$gte": today.isoformat()},
    })
    for doc in cursor:
        patient_name = "Unknown"
        try:
            p_user = db.users.find_one({"_id": ObjectId(doc["patient_id"])})
            if p_user:
                patient_name = p_user.get("name", "Unknown")
        except Exception:
            pass

        today_appts.append({
            "id": str(doc["_id"]),
            "patient_name": patient_name,
            "appointment_time": doc.get("appointment_time", ""),
            "appointment_date": doc.get("appointment_date", ""),
        })

    pending_consultations = 0
    cursor = db.appointments.find({
        "doctor_id": user["id"],
        "status": "confirmed",
    })
    for appt in cursor:
        cons = db.consultations.find_one({"appointment_id": str(appt["_id"])})
        if not cons:
            pending_consultations += 1

    pipeline = [
        {"$match": {"doctor_id": user["id"]}},
        {"$group": {"_id": "$patient_id"}},
        {"$count": "total_patients"},
    ]
    result = list(db.appointments.aggregate(pipeline))
    total_patients = result[0]["total_patients"] if result else 0

    return JsonResponse({
        "todayCount": len(today_appts),
        "pendingCount": pending_consultations,
        "totalPatients": total_patients,
        "todaySchedule": today_appts,
    }, status=200)
