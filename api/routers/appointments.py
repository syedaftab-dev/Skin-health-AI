from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from api.auth.dependencies import get_current_user, require_role
from api.database import get_db
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os
import uuid
from PIL import Image
import io

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


class AppointmentCreate(BaseModel):
    doctor_id: str
    appointment_date: str  # ISO date string
    appointment_time: str  # HH:MM
    prediction_id: Optional[str] = None
    patient_notes: Optional[str] = None


class AppointmentCreateWithImage(BaseModel):
    doctor_id: str
    appointment_date: str  # ISO date string
    appointment_time: str  # HH:MM
    patient_notes: Optional[str] = None


class ConsultationCreate(BaseModel):
    doctor_diagnosis: str
    prescription: str
    notes: Optional[str] = None


class CancelRequest(BaseModel):
    reason: Optional[str] = None


@router.post("")
async def book_appointment(
    data: AppointmentCreate,
    user=Depends(require_role("patient")),
):
    print(f"DEBUG: Creating appointment for user {user['id']} with doctor {data.doctor_id}")  # Debug log
    db = get_db()

    # Verify doctor exists and is approved
    doctor = await db.doctors.find_one({"user_id": data.doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not doctor.get("is_approved"):
        raise HTTPException(status_code=400, detail="Doctor is not approved yet")

    # Check if slot is available
    existing = await db.appointments.find_one({
        "doctor_id": data.doctor_id,
        "appointment_date": data.appointment_date,
        "appointment_time": data.appointment_time,
        "status": {"$in": ["pending", "confirmed"]},
    })
    if existing:
        raise HTTPException(status_code=409, detail="This time slot is already booked")

    now = datetime.now(timezone.utc)
    appointment_doc = {
        "patient_id": user["id"],
        "doctor_id": data.doctor_id,
        "prediction_id": data.prediction_id,
        "appointment_date": data.appointment_date,
        "appointment_time": data.appointment_time,
        "status": "confirmed",
        "cancellation_reason": None,
        "patient_notes": data.patient_notes,
        "created_at": now,
        "updated_at": now,
    }
    print(f"DEBUG: Inserting appointment: {appointment_doc}")  # Debug log
    result = await db.appointments.insert_one(appointment_doc)
    print(f"DEBUG: Appointment inserted with ID: {result.inserted_id}")  # Debug log

    return {
        "id": str(result.inserted_id),
        "message": "Appointment booked successfully",
        "appointment": {
            "id": str(result.inserted_id),
            "doctor_id": data.doctor_id,
            "appointment_date": data.appointment_date,
            "appointment_time": data.appointment_time,
            "status": "confirmed",
        }
    }


@router.post("/with-image")
async def book_appointment_with_image(
    doctor_id: str = Form(...),
    appointment_date: str = Form(...),
    appointment_time: str = Form(...),
    patient_notes: Optional[str] = Form(""),
    file: UploadFile = File(...),
    user=Depends(require_role("patient")),
):
    print(f"DEBUG: With-image booking for doctor {doctor_id}")  # Debug log
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    db = get_db()

    # Verify doctor exists and is approved
    doctor = await db.doctors.find_one({"user_id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not doctor.get("is_approved"):
        raise HTTPException(status_code=400, detail="Doctor is not approved yet")

    # Check if slot is available
    existing = await db.appointments.find_one({
        "doctor_id": doctor_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": {"$in": ["pending", "confirmed"]},
    })
    if existing:
        raise HTTPException(status_code=409, detail="This time slot is already booked")

    # Save image and run AI prediction
    try:
        # Import prediction functions
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        from src.predict import predict_image, load_inference_model
        from src.recommend import format_recommendation

        # Get model
        model, device = load_inference_model()
        if model is None:
            raise HTTPException(status_code=503, detail="AI model not available")

        # Process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Save image to uploads directory
        upload_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "uploads"
        )
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, "wb") as f:
            f.write(contents)

        # Run prediction
        prediction = predict_image(image, model=model, device=device)
        recommendation = format_recommendation(prediction)

        # Save prediction to database
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
        prediction_result = await db.predictions.insert_one(prediction_doc)
        prediction_id = str(prediction_result.inserted_id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

    # Create appointment with prediction
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
    result = await db.appointments.insert_one(appointment_doc)

    return {
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
            }
        }
    }


@router.get("/debug/all")
async def debug_all_appointments():
    """Debug endpoint to see all appointments in database"""
    db = get_db()
    appointments = []
    async for doc in db.appointments.find({}):
        appointments.append({
            "id": str(doc["_id"]),
            "patient_id": doc["patient_id"],
            "doctor_id": doc["doctor_id"],
            "appointment_date": doc["appointment_date"],
            "appointment_time": doc["appointment_time"],
            "status": doc["status"],
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else doc["created_at"],
        })
    return {"total": len(appointments), "appointments": appointments}


@router.get("/patient")
async def get_patient_appointments(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_role("patient")),
):
    print(f"DEBUG: Fetching appointments for user {user['id']} with status {status}")  # Debug log
    db = get_db()
    query = {"patient_id": user["id"]}
    if status:
        query["status"] = status

    print(f"DEBUG: Query: {query}")  # Debug log
    skip = (page - 1) * limit
    cursor = db.appointments.find(query).sort("appointment_date", -1).skip(skip).limit(limit)

    appointments = []
    async for doc in cursor:
        print(f"DEBUG: Found appointment: {doc}")  # Debug log
        # Get doctor info
        print(f"DEBUG: Looking up doctor with user_id: {doc['doctor_id']}")  # Debug log
        doctor = await db.doctors.find_one({"user_id": doc["doctor_id"]})
        print(f"DEBUG: Doctor found: {doctor is not None}")  # Debug log
        doctor_user = None
        if doctor:
            try:
                print(f"DEBUG: Looking up user with ObjectId: {doc['doctor_id']}")  # Debug log
                doctor_user = await db.users.find_one({"_id": ObjectId(doc["doctor_id"])})
                print(f"DEBUG: Doctor user found: {doctor_user is not None}")  # Debug log
                if doctor_user:
                    print(f"DEBUG: Doctor user name: {doctor_user.get('name', 'NO_NAME')}")  # Debug log
            except Exception as e:
                print(f"DEBUG: Error finding doctor user: {e}")  # Debug log
        else:
            print(f"DEBUG: No doctor found for user_id: {doc['doctor_id']}")  # Debug log

        # Get consultation if completed
        consultation = None
        if doc["status"] == "completed":
            consultation = await db.consultations.find_one({"appointment_id": str(doc["_id"])})
            if consultation:
                consultation["id"] = str(consultation["_id"])
                del consultation["_id"]

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
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else doc["created_at"],
        }
        print(f"DEBUG: Constructed appointment object: {appt}")  # Debug log
        appointments.append(appt)

    total = await db.appointments.count_documents(query)
    print(f"DEBUG: Returning {len(appointments)} appointments")  # Debug log
    return {"appointments": appointments, "total": total, "page": page}


@router.get("/doctor")
async def get_doctor_appointments(
    status: Optional[str] = None,
    date: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(require_role("doctor")),
):
    db = get_db()
    query = {"doctor_id": user["id"]}
    if status:
        query["status"] = status
    if date:
        query["appointment_date"] = date

    skip = (page - 1) * limit
    cursor = db.appointments.find(query).sort("appointment_date", -1).skip(skip).limit(limit)

    appointments = []
    async for doc in cursor:
        # Get patient info
        patient_user = None
        try:
            patient_user = await db.users.find_one({"_id": ObjectId(doc["patient_id"])})
        except Exception:
            pass

        # Get prediction if linked
        prediction = None
        if doc.get("prediction_id"):
            try:
                pred_doc = await db.predictions.find_one({"_id": ObjectId(doc["prediction_id"])})
                if pred_doc:
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
                        "created_at": pred_doc.get("created_at"),
                    }
            except Exception:
                pass

        # Get consultation if exists
        consultation = None
        cons_doc = await db.consultations.find_one({"appointment_id": str(doc["_id"])})
        if cons_doc:
            consultation = {
                "id": str(cons_doc["_id"]),
                "doctor_diagnosis": cons_doc.get("doctor_diagnosis"),
                "prescription": cons_doc.get("prescription"),
                "notes": cons_doc.get("notes"),
            }

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
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else doc["created_at"],
        }
        appointments.append(appt)

    total = await db.appointments.count_documents(query)
    return {"appointments": appointments, "total": total, "page": page}


@router.patch("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    data: CancelRequest,
    user=Depends(get_current_user),
):
    db = get_db()
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Check ownership
    if user["role"] == "patient" and appt["patient_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if user["role"] == "doctor" and appt["doctor_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if appt["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel {appt['status']} appointment")

    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {
            "status": "cancelled",
            "cancellation_reason": data.reason,
            "updated_at": datetime.now(timezone.utc),
        }}
    )
    return {"message": "Appointment cancelled"}


@router.patch("/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: str,
    user=Depends(require_role("doctor")),
):
    db = get_db()
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt["doctor_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if appt["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed appointments can be completed")

    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Appointment marked as completed"}


@router.post("/{appointment_id}/consultation")
async def add_consultation(
    appointment_id: str,
    data: ConsultationCreate,
    user=Depends(require_role("doctor")),
):
    db = get_db()
    try:
        appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt["doctor_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if consultation already exists
    existing = await db.consultations.find_one({"appointment_id": appointment_id})
    if existing:
        # Update existing
        await db.consultations.update_one(
            {"appointment_id": appointment_id},
            {"$set": {
                "doctor_diagnosis": data.doctor_diagnosis,
                "prescription": data.prescription,
                "notes": data.notes,
                "updated_at": datetime.now(timezone.utc),
            }}
        )
        return {"message": "Consultation updated"}

    consultation_doc = {
        "appointment_id": appointment_id,
        "doctor_diagnosis": data.doctor_diagnosis,
        "prescription": data.prescription,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.consultations.insert_one(consultation_doc)

    # Also mark appointment as completed
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc)}}
    )

    return {"id": str(result.inserted_id), "message": "Consultation added"}
