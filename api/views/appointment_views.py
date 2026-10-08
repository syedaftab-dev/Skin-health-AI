import os
import io
import sys
import uuid
from datetime import datetime, timezone
from PIL import Image
from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.database import get_db
from api.auth.decorators import parse_json, jwt_required, require_role

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from src.predict import predict_image, load_inference_model
from src.recommend import format_recommendation


@csrf_exempt
@require_role("patient")
def book_appointment(request, user):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    doctor_id = data.get("doctor_id")
    appointment_date = data.get("appointment_date")
    appointment_time = data.get("appointment_time")
    prediction_id = data.get("prediction_id")
    patient_notes = data.get("patient_notes")

    if not doctor_id or not appointment_date or not appointment_time:
        return JsonResponse({"detail": "Missing required fields"}, status=400)

    db = get_db()
    doctor = db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        return JsonResponse({"detail": "Doctor not found"}, status=404)
    if not doctor.get("is_approved"):
        return JsonResponse({"detail": "Doctor is not approved yet"}, status=400)

    existing = db.appointments.find_one({
        "doctor_id": doctor_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": {"$in": ["pending", "confirmed"]},
    })
    if existing:
        return JsonResponse({"detail": "This time slot is already booked"}, status=409)

    now = datetime.now(timezone.utc)
    appointment_doc = {
        "patient_id": user["id"],
        "doctor_id": doctor_id,
        "prediction_id": prediction_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": "confirmed",
        "cancellation_reason": None,
        "patient_notes": patient_notes,
        "created_at": now,
        "updated_at": now,
    }
    result = db.appointments.insert_one(appointment_doc)

    return JsonResponse({
        "id": str(result.inserted_id),
        "message": "Appointment booked successfully",
        "appointment": {
            "id": str(result.inserted_id),
            "doctor_id": doctor_id,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "status": "confirmed",
        },
    }, status=200)


@csrf_exempt
@require_role("patient")
def book_appointment_with_image(request, user):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    doctor_id = request.POST.get("doctor_id")
    appointment_date = request.POST.get("appointment_date")
    appointment_time = request.POST.get("appointment_time")
    patient_notes = request.POST.get("patient_notes", "")

    if "file" not in request.FILES:
        return JsonResponse({"detail": "File must be an image"}, status=400)

    uploaded_file = request.FILES["file"]
    if not uploaded_file.content_type.startswith("image/"):
        return JsonResponse({"detail": "File must be an image"}, status=400)

    db = get_db()
    doctor = db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        return JsonResponse({"detail": "Doctor not found"}, status=404)
    if not doctor.get("is_approved"):
        return JsonResponse({"detail": "Doctor is not approved yet"}, status=400)

    existing = db.appointments.find_one({
        "doctor_id": doctor_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": {"$in": ["pending", "confirmed"]},
    })
    if existing:
        return JsonResponse({"detail": "This time slot is already booked"}, status=409)

    try:
        model, device = load_inference_model()
        contents = uploaded_file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        uploads_dir = os.path.join(root_dir, "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex}_{uploaded_file.name}"
        filepath = os.path.join(uploads_dir, filename)
        with open(filepath, "wb") as f:
            f.write(contents)

        prediction = predict_image(image, model=model, device=device)
        recommendation = format_recommendation(prediction)

        now = datetime.now(timezone.utc)
        prediction_doc = {
            "patient_id": user["id"],
            "image_url": f"/uploads/{filename}",
            "disease_name": recommendation["diagnosis"],
            "disease_medical_term": prediction["predicted_class"],
            "confidence_score": prediction["confidence"],
            "description": recommendation["description"],
            "severity": prediction["severity"],
            "recommendation": recommendation["urgency"],
            "recommended_actions": recommendation["recommended_actions"],
            "suggested_products": recommendation["suggested_products"],
            "consult_doctor": recommendation["consult_doctor"],
            "all_scores": prediction["all_scores"],
            "created_at": now,
        }
        pred_res = db.predictions.insert_one(prediction_doc)
        prediction_id = str(pred_res.inserted_id)

    except Exception as e:
        return JsonResponse({"detail": f"Image processing failed: {str(e)}"}, status=500)

    appointment_doc = {
        "patient_id": user["id"],
        "doctor_id": doctor_id,
        "prediction_id": prediction_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": "confirmed",
        "cancellation_reason": None,
        "patient_notes": patient_notes,
        "created_at": now,
        "updated_at": now,
    }
    result = db.appointments.insert_one(appointment_doc)

    return JsonResponse({
        "id": str(result.inserted_id),
        "message": "Appointment booked successfully with AI analysis",
        "appointment": {
            "id": str(result.inserted_id),
            "doctor_id": doctor_id,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "status": "confirmed",
            "prediction_id": prediction_id,
            "prediction": {
                "disease_name": recommendation["diagnosis"],
                "confidence_score": prediction["confidence"],
                "severity": prediction["severity"],
                "image_url": f"/uploads/{filename}",
            },
        },
    }, status=200)


@csrf_exempt
def debug_all_appointments(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    appointments = []
    for doc in db.appointments.find({}):
        created_at = doc.get("created_at")
        appointments.append({
            "id": str(doc["_id"]),
            "patient_id": doc.get("patient_id"),
            "doctor_id": doc.get("doctor_id"),
            "appointment_date": doc.get("appointment_date"),
            "appointment_time": doc.get("appointment_time"),
            "status": doc.get("status"),
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
        })
    return JsonResponse({"total": len(appointments), "appointments": appointments}, status=200)


@csrf_exempt
@require_role("patient")
def get_patient_appointments(request, user):
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

    query = {"patient_id": user["id"]}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    cursor = db.appointments.find(query).sort("appointment_date", -1).skip(skip).limit(limit)

    appointments = []
    for doc in cursor:
        doctor = db.doctors.find_one({"user_id": doc["doctor_id"]})
        doctor_user = None
        if doctor:
            try:
                doctor_user = db.users.find_one({"_id": ObjectId(doc["doctor_id"])})
            except Exception:
                pass

        consultation = None
        if doc.get("status") == "completed":
            cons = db.consultations.find_one({"appointment_id": str(doc["_id"])})
            if cons:
                consultation = {
                    "id": str(cons["_id"]),
                    "doctor_diagnosis": cons.get("doctor_diagnosis"),
                    "prescription": cons.get("prescription"),
                    "notes": cons.get("notes"),
                }

        created_at = doc.get("created_at")
        appt = {
            "id": str(doc["_id"]),
            "doctor_id": doc["doctor_id"],
            "doctor_name": doctor_user.get("name", "") if doctor_user else "",
            "doctor_specialization": doctor.get("specialization", "") if doctor else "",
            "clinic_name": doctor.get("clinic_name", "") if doctor else "",
            "appointment_date": doc["appointment_date"],
            "appointment_time": doc["appointment_time"],
            "status": doc["status"],
            "patient_notes": doc.get("patient_notes"),
            "cancellation_reason": doc.get("cancellation_reason"),
            "consultation": consultation,
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
        }
        appointments.append(appt)

    total = db.appointments.count_documents(query)
    return JsonResponse({"appointments": appointments, "total": total, "page": page}, status=200)


@csrf_exempt
@require_role("doctor")
def get_doctor_appointments(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    status = request.GET.get("status")
    date = request.GET.get("date")

    try:
        page = max(1, int(request.GET.get("page", 1)))
    except ValueError:
        page = 1

    try:
        limit = max(1, min(100, int(request.GET.get("limit", 20))))
    except ValueError:
        limit = 20

    query = {"doctor_id": user["id"]}
    if status:
        query["status"] = status
    if date:
        query["appointment_date"] = date

    skip = (page - 1) * limit
    cursor = db.appointments.find(query).sort("appointment_date", -1).skip(skip).limit(limit)

    appointments = []
    for doc in cursor:
        patient_user = None
        try:
            patient_user = db.users.find_one({"_id": ObjectId(doc["patient_id"])})
        except Exception:
            pass

        prediction = None
        if doc.get("prediction_id"):
            try:
                pred_doc = db.predictions.find_one({"_id": ObjectId(doc["prediction_id"])})
                if pred_doc:
                    created_at = pred_doc.get("created_at")
                    prediction = {
                        "id": str(pred_doc["_id"]),
                        "disease_name": pred_doc.get("disease_name"),
                        "disease_medical_term": pred_doc.get("disease_medical_term"),
                        "confidence_score": pred_doc.get("confidence_score"),
                        "severity": pred_doc.get("severity"),
                        "description": pred_doc.get("description"),
                        "recommendation": pred_doc.get("recommendation"),
                        "recommended_actions": pred_doc.get("recommended_actions"),
                        "suggested_products": pred_doc.get("suggested_products"),
                        "consult_doctor": pred_doc.get("consult_doctor"),
                        "all_scores": pred_doc.get("all_scores"),
                        "image_url": pred_doc.get("image_url"),
                        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
                    }
            except Exception:
                pass

        consultation = None
        cons_doc = db.consultations.find_one({"appointment_id": str(doc["_id"])})
        if cons_doc:
            consultation = {
                "id": str(cons_doc["_id"]),
                "doctor_diagnosis": cons_doc.get("doctor_diagnosis"),
                "prescription": cons_doc.get("prescription"),
                "notes": cons_doc.get("notes"),
            }

        created_at = doc.get("created_at")
        appt = {
            "id": str(doc["_id"]),
            "patient_id": doc["patient_id"],
            "patient_name": patient_user.get("name", "") if patient_user else "",
            "patient_phone": patient_user.get("phone", "") if patient_user else "",
            "appointment_date": doc["appointment_date"],
            "appointment_time": doc["appointment_time"],
            "status": doc["status"],
            "patient_notes": doc.get("patient_notes"),
            "prediction": prediction,
            "consultation": consultation,
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
        }
        appointments.append(appt)

    total = db.appointments.count_documents(query)
    return JsonResponse({"appointments": appointments, "total": total, "page": page}, status=200)


@csrf_exempt
@jwt_required
def cancel_appointment(request, appointment_id, user):
    if request.method not in ("PATCH", "POST"):
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data = parse_json(request)
    db = get_db()
    try:
        appt = db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        return JsonResponse({"detail": "Invalid appointment ID"}, status=400)

    if not appt:
        return JsonResponse({"detail": "Appointment not found"}, status=404)

    if user["role"] == "patient" and appt["patient_id"] != user["id"]:
        return JsonResponse({"detail": "Access denied"}, status=403)
    if user["role"] == "doctor" and appt["doctor_id"] != user["id"]:
        return JsonResponse({"detail": "Access denied"}, status=403)

    if appt["status"] in ["completed", "cancelled"]:
        return JsonResponse({"detail": f"Cannot cancel {appt['status']} appointment"}, status=400)

    db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {
            "status": "cancelled",
            "cancellation_reason": data.get("reason"),
            "updated_at": datetime.now(timezone.utc),
        }}
    )
    return JsonResponse({"message": "Appointment cancelled"}, status=200)


@csrf_exempt
@require_role("doctor")
def complete_appointment(request, appointment_id, user):
    if request.method not in ("PATCH", "POST"):
        return JsonResponse({"detail": "Method not allowed"}, status=405)

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

    db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )
    return JsonResponse({"message": "Appointment marked as completed"}, status=200)


@csrf_exempt
@require_role("doctor")
def add_consultation(request, appointment_id, user):
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

    existing = db.consultations.find_one({"appointment_id": appointment_id})
    now = datetime.now(timezone.utc)
    if existing:
        db.consultations.update_one(
            {"appointment_id": appointment_id},
            {"$set": {
                "doctor_diagnosis": data.get("doctor_diagnosis", ""),
                "prescription": data.get("prescription", ""),
                "notes": data.get("notes"),
                "updated_at": now,
            }}
        )
        return JsonResponse({"message": "Consultation updated"}, status=200)

    consultation_doc = {
        "appointment_id": appointment_id,
        "doctor_diagnosis": data.get("doctor_diagnosis", ""),
        "prescription": data.get("prescription", ""),
        "notes": data.get("notes"),
        "created_at": now,
    }
    result = db.consultations.insert_one(consultation_doc)

    db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed", "updated_at": now}}
    )

    return JsonResponse({"id": str(result.inserted_id), "message": "Consultation added"}, status=200)
