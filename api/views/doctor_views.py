from datetime import datetime, timedelta, timezone
from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.database import get_db
from api.auth.decorators import parse_json, require_role


@csrf_exempt
def list_doctors(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    search = request.GET.get("search")
    specialization = request.GET.get("specialization")
    pincode = request.GET.get("pincode")

    try:
        page = max(1, int(request.GET.get("page", 1)))
    except ValueError:
        page = 1

    try:
        limit = max(1, min(100, int(request.GET.get("limit", 20))))
    except ValueError:
        limit = 20

    db = get_db()
    query = {"is_approved": True}

    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    if pincode:
        query["clinic_pincode"] = pincode

    skip = (page - 1) * limit

    pipeline = [
        {"$match": query},
        {
            "$lookup": {
                "from": "users",
                "let": {"uid": {"$toObjectId": "$user_id"}},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$uid"]}}},
                    {"$project": {"name": 1, "email": 1, "phone": 1}},
                ],
                "as": "user_info",
            }
        },
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
    cursor = db.doctors.aggregate(pipeline)
    for doc in cursor:
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

    total = db.doctors.count_documents(query)
    return JsonResponse({"doctors": doctors, "total": total, "page": page, "limit": limit}, status=200)


@csrf_exempt
@require_role("doctor")
def doctor_profile(request, user):
    db = get_db()
    if request.method == "GET":
        user_doc = db.users.find_one({"_id": ObjectId(user["id"])})
        if not user_doc:
            return JsonResponse({"detail": "User not found"}, status=404)

        doctor = db.doctors.find_one({"user_id": user["id"]})
        if not doctor:
            return JsonResponse({"detail": "Doctor profile not found"}, status=404)

        return JsonResponse({
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
        }, status=200)

    elif request.method == "PUT":
        data = parse_json(request)
        now = datetime.now(timezone.utc)

        db.users.update_one(
            {"_id": ObjectId(user["id"])},
            {"$set": {
                "name": data.get("name", user.get("name")),
                "phone": data.get("phone", user.get("phone")),
                "updated_at": now,
            }}
        )

        db.doctors.update_one(
            {"user_id": user["id"]},
            {"$set": {
                "specialization": data.get("specialization", ""),
                "experience_years": int(data.get("experience_years", 0)),
                "bio": data.get("bio", ""),
                "updated_at": now,
            }}
        )

        return JsonResponse({"message": "Profile updated successfully"}, status=200)

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@csrf_exempt
def get_doctor(request, doctor_id):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    doctor = db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        return JsonResponse({"detail": "Doctor not found"}, status=404)

    try:
        user = db.users.find_one({"_id": ObjectId(doctor_id)}) or {}
    except Exception:
        user = {}

    availability = []
    cursor = db.doctor_availability.find({"doctor_id": doctor_id, "is_active": True})
    for slot in cursor:
        availability.append({
            "day_of_week": slot["day_of_week"],
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "slot_duration_minutes": slot.get("slot_duration_minutes", 30),
        })

    return JsonResponse({
        "id": doctor_id,
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
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
    }, status=200)


@csrf_exempt
def get_availability(request, doctor_id):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    doctor = db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        return JsonResponse({"detail": "Doctor not found"}, status=404)

    schedule = {}
    cursor = db.doctor_availability.find({"doctor_id": doctor_id, "is_active": True})
    for slot in cursor:
        day = slot["day_of_week"]
        schedule[day] = {
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "slot_duration_minutes": slot.get("slot_duration_minutes", 30),
        }

    today = datetime.now(timezone.utc).date()
    end_date = today + timedelta(days=7)
    blocked = []
    cursor = db.blocked_slots.find({
        "doctor_id": doctor_id,
        "date": {"$gte": today.isoformat(), "$lte": end_date.isoformat()},
    })
    for block in cursor:
        blocked.append({
            "date": block["date"],
            "start_time": block.get("start_time"),
            "end_time": block.get("end_time"),
            "reason": block.get("reason", ""),
        })

    booked = []
    cursor = db.appointments.find({
        "doctor_id": doctor_id,
        "appointment_date": {"$gte": today.isoformat(), "$lte": end_date.isoformat()},
        "status": {"$in": ["pending", "confirmed"]},
    })
    for appt in cursor:
        booked.append({
            "date": appt["appointment_date"],
            "time": appt["appointment_time"],
        })

    available_slots = {}
    for i in range(7):
        date = today + timedelta(days=i)
        day_of_week = date.weekday()
        date_str = date.isoformat()

        if day_of_week not in schedule:
            continue

        sched = schedule[day_of_week]
        day_blocked = any(
            b["date"] == date_str and b.get("start_time") is None
            for b in blocked
        )
        if day_blocked:
            continue

        start_h, start_m = map(int, sched["start_time"].split(":"))
        end_h, end_m = map(int, sched["end_time"].split(":"))
        duration = sched["slot_duration_minutes"]

        slots = []
        current = start_h * 60 + start_m
        end = end_h * 60 + end_m

        while current + duration <= end:
            time_str = f"{current // 60:02d}:{current % 60:02d}"
            is_booked = any(
                b["date"] == date_str and b["time"] == time_str
                for b in booked
            )
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

    return JsonResponse({
        "doctor_id": doctor_id,
        "schedule": schedule,
        "available_slots": available_slots,
        "blocked_dates": blocked,
    }, status=200)


@csrf_exempt
@require_role("doctor")
def complete_doctor_appointment(request, appointment_id, user):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    db = get_db()

    try:
        appt = db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        return JsonResponse({"detail": "Invalid appointment ID"}, status=400)

    if not appt:
        return JsonResponse({"detail": "Appointment not found"}, status=404)
    if appt["doctor_id"] != user["id"]:
        return JsonResponse({"detail": "Access denied"}, status=403)
    if appt["status"] != "confirmed":
        return JsonResponse({"detail": "Only confirmed appointments can be completed"}, status=400)

    consultation_doc = {
        "appointment_id": appointment_id,
        "doctor_diagnosis": data.get("doctor_diagnosis"),
        "prescription": data.get("prescription"),
        "notes": data.get("notes"),
        "created_at": datetime.now(timezone.utc),
    }
    db.consultations.insert_one(consultation_doc)

    db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )

    return JsonResponse({"message": "Consultation completed successfully"}, status=200)
