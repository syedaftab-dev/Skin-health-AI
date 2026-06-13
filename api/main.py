import os
import sys
import io

try:
    import torch
    import numpy as np
    from PIL import Image
    TORCH_AVAILABLE = True
except (ImportError, OSError) as e:
    TORCH_AVAILABLE = False
    print(f"WARNING: ML dependencies (torch/numpy) load failed: {e}")
    # Define mocks if needed or just handle downstream
    from PIL import Image
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.predict import predict_image, load_inference_model
from src.recommend import format_recommendation
from api.schemas import AnalysisResponse, HealthResponse
from api.database import connect_db, close_db

# Import routers
from api.auth.routes import router as auth_router
from api.routers.predictions import router as predictions_router
from api.routers.doctors import router as doctors_router
from api.routers.appointments import router as appointments_router
from api.routers.doctor_portal import router as doctor_portal_router
from api.routers.admin import router as admin_router
from api.routers.patients import router as patients_router

model = None
device = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, device
    # Startup
    await connect_db()
    try:
        model, device = load_inference_model()
        print("ML Model loaded successfully.")
    except Exception as e:
        print(f"ML Model load failed: {e}")
        model = None
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="SkinAI Platform API",
    description="AI-powered skin disease detection with doctor discovery and appointment management",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving images
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register routers
app.include_router(auth_router)
app.include_router(predictions_router)
app.include_router(doctors_router)
app.include_router(appointments_router)
app.include_router(doctor_portal_router)
app.include_router(admin_router)
app.include_router(patients_router)


@app.get("/")
def root():
    return {
        "message": "SkinAI Platform API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        version="2.0.0",
    )


# Keep the legacy /analyze endpoint for backward compatibility
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_skin(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Train model first.")

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    try:
        prediction = predict_image(image, model=model, device=device)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    recommendation = format_recommendation(prediction)

    return AnalysisResponse(
        prediction=prediction,
        recommendation=recommendation,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
