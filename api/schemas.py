from pydantic import BaseModel
from typing import Dict, List, Optional


class PredictionResult(BaseModel):
    predicted_class: str
    class_name: str
    confidence: float
    severity: str
    all_scores: Dict[str, float]


class GeneralSkincare(BaseModel):
    daily: List[str]
    weekly: List[str]
    lifestyle: List[str]


class RecommendationResult(BaseModel):
    diagnosis: str
    confidence_percent: float
    severity: str
    description: str
    urgency: str
    recommended_actions: List[str]
    suggested_products: List[str]
    general_skincare: GeneralSkincare
    consult_doctor: bool
    disclaimer: str
    note: Optional[str] = None


class AnalysisResponse(BaseModel):
    prediction: PredictionResult
    recommendation: RecommendationResult


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
