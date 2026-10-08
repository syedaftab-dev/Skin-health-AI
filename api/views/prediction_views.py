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
from api.auth.decorators import jwt_required, require_role

# Add root directory to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from src.predict import predict_image, load_inference_model
from src.recommend import format_recommendation

_model = None
_device = None


def get_model():
    global _model, _device
    if _model is None:
        try:
            _model, _device = load_inference_model()
        except Exception as e:
            print(f"Model load notice: {e}")
    return _model, _device


@csrf_exempt
@require_role("patient")
def upload_and_predict(request, user):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    if "file" not in request.FILES:
        return JsonResponse({"detail": "No file uploaded"}, status=400)

    uploaded_file = request.FILES["file"]
    if not uploaded_file.content_type.startswith("image/"):
        return JsonResponse({"detail": "File must be an image"}, status=400)

    model, device = get_model()

    contents = uploaded_file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        return JsonResponse({"detail": f"Invalid image format: {str(e)}"}, status=400)

    # Save to uploads directory
    uploads_dir = os.path.join(root_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{uploaded_file.name}"
    filepath = os.path.join(uploads_dir, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Run prediction
    try:
        prediction = predict_image(image, model=model, device=device)
    except Exception as e:
        return JsonResponse({"detail": f"Prediction failed: {str(e)}"}, status=500)

    recommendation = format_recommendation(prediction)

    db = get_db()
    now = datetime.now(timezone.utc)
    prediction_doc = {
        "patient_id": user["id"],
        "image_url": f"/uploads/{filename}",
        "disease_name": recommendation.get("diagnosis", ""),
        "disease_medical_term": prediction.get("predicted_class", ""),
        "confidence_score": prediction.get("confidence", 0),
        "description": recommendation.get("description", ""),
        "severity": prediction.get("severity", ""),
        "recommendation": recommendation.get("urgency", ""),
        "recommended_actions": recommendation.get("recommended_actions", []),
        "suggested_products": recommendation.get("suggested_products", []),
        "consult_doctor": recommendation.get("consult_doctor", False),
        "all_scores": prediction.get("all_scores", {}),
        "created_at": now,
    }
    result = db.predictions.insert_one(prediction_doc)

    return JsonResponse({
        "id": str(result.inserted_id),
        "prediction": prediction,
        "recommendation": recommendation,
        "image_url": f"/uploads/{filename}",
    }, status=200)


@csrf_exempt
@require_role("patient")
def get_predictions(request, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    cursor = db.predictions.find({"patient_id": user["id"]}).sort("created_at", -1)
    predictions = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        predictions.append(doc)

    return JsonResponse(predictions, safe=False, status=200)


@csrf_exempt
@jwt_required
def get_prediction(request, prediction_id, user):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    db = get_db()
    try:
        doc = db.predictions.find_one({"_id": ObjectId(prediction_id)})
    except Exception:
        return JsonResponse({"detail": "Invalid prediction ID"}, status=400)

    if not doc:
        return JsonResponse({"detail": "Prediction not found"}, status=404)

    if user["role"] == "patient" and doc.get("patient_id") != user["id"]:
        return JsonResponse({"detail": "Access denied"}, status=403)

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()

    return JsonResponse(doc, status=200)
