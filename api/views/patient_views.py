from datetime import datetime, timezone
from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.database import get_db
from api.auth.decorators import parse_json, require_role


@csrf_exempt
@require_role("patient")
def patient_profile(request, user):
    db = get_db()
    user_id = user["id"]

    if request.method == "GET":
        patient = db.patients.find_one({"user_id": user_id})
        return JsonResponse({
            "id": user_id,
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "date_of_birth": patient.get("date_of_birth") if patient else None,
            "default_city": patient.get("default_city") if patient else None,
            "default_location_pincode": patient.get("default_location_pincode") if patient else None,
        }, status=200)

    elif request.method == "PUT":
        data = parse_json(request)

        user_updates = {}
        if data.get("name"):
            user_updates["name"] = data["name"]
        if data.get("phone"):
            user_updates["phone"] = data["phone"]
        if user_updates:
            user_updates["updated_at"] = datetime.now(timezone.utc)
            db.users.update_one({"_id": ObjectId(user_id)}, {"$set": user_updates})

        patient_updates = {}
        for key in ["date_of_birth", "default_city", "default_location_pincode"]:
            if key in data:
                patient_updates[key] = data[key]
        if patient_updates:
            db.patients.update_one({"user_id": user_id}, {"$set": patient_updates})

        return JsonResponse({"message": "Profile updated"}, status=200)

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@csrf_exempt
@require_role("patient")
def get_medical_history(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    patient_id = user["id"]

    predictions = []
    cursor = db.predictions.find({"patient_id": patient_id}).sort("created_at", -1)
    for doc in cursor:
        created_at = doc.get("created_at")
        predictions.append({
            "id": str(doc["_id"]),
            "type": "prediction",
            "date": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
            "disease_name": doc.get("disease_name", ""),
            "confidence_score": doc.get("confidence_score", 0),
            "severity": doc.get("severity", ""),
            "image_url": doc.get("image_url", ""),
        })

    consultations = []
    cursor = db.appointments.find({
        "patient_id": patient_id,
        "status": "completed",
    }).sort("appointment_date", -1)

    for appt in cursor:
        cons = db.consultations.find_one({"appointment_id": str(appt["_id"])})
        if cons:
            doctor_user = None
            try:
                doctor_user = db.users.find_one({"_id": ObjectId(appt["doctor_id"])})
            except Exception:
                pass
            doctor = db.doctors.find_one({"user_id": appt["doctor_id"]})

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

    history = predictions + consultations
    history.sort(key=lambda x: x["date"], reverse=True)

    return JsonResponse({"history": history}, status=200)
