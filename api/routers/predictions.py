import os
import io
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from api.auth.dependencies import get_current_user, require_role
from api.database import get_db
from bson import ObjectId
from datetime import datetime, timezone
from PIL import Image

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from src.predict import predict_image, load_inference_model
from src.recommend import format_recommendation

router = APIRouter(prefix="/api", tags=["Predictions"])

# Model singleton
_model = None
_device = None


def get_model():
    global _model, _device
    if _model is None:
        try:
            _model, _device = load_inference_model()
        except Exception as e:
            print(f"Model load failed: {e}")
    return _model, _device


@router.post("/predict/upload")
async def upload_and_predict(
    file: UploadFile = File(...),
    user=Depends(require_role("patient")),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    model, device = get_model()
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Train model first.")

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
    try:
        prediction = predict_image(image, model=model, device=device)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    recommendation = format_recommendation(prediction)

    # Save to database
    db = get_db()
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
    result = await db.predictions.insert_one(prediction_doc)

    return {
        "id": str(result.inserted_id),
        "prediction": prediction,
        "recommendation": recommendation,
        "image_url": f"/uploads/{filename}",
    }


@router.get("/predictions")
async def get_predictions(user=Depends(require_role("patient"))):
    db = get_db()
    cursor = db.predictions.find({"patient_id": user["id"]}).sort("created_at", -1)
    predictions = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        predictions.append(doc)
    return predictions


@router.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: str, user=Depends(get_current_user)):
    db = get_db()
    try:
        doc = await db.predictions.find_one({"_id": ObjectId(prediction_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid prediction ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # Patients can only see their own, doctors can see any (for appointments)
    if user["role"] == "patient" and doc["patient_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc
