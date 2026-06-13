try:
    import torch
    import numpy as np
    TORCH_AVAILABLE = True
except (ImportError, OSError):
    TORCH_AVAILABLE = False
    import numpy as np

from PIL import Image
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ISIC_CLASSES, CLASS_NAMES, SEVERITY_MAP

if TORCH_AVAILABLE:
    from src.dataset import get_predict_transforms
    from src.model import load_model
else:
    def get_predict_transforms(): return None
    def load_model(*args, **kwargs): return None


def load_inference_model(device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(num_classes=len(ISIC_CLASSES), device=device)
    model = model.to(device)
    return model, device


def predict_image(image_input, model=None, device=None):
    if not TORCH_AVAILABLE:
        # Mock prediction for demonstration
        import random
        pred_idx = random.randint(0, len(ISIC_CLASSES) - 1)
        pred_class = ISIC_CLASSES[pred_idx]
        confidence = 0.85 + (random.random() * 0.1)
        
        all_scores = {
            CLASS_NAMES.get(k, k.title()): round((10.0 if k == pred_class else 1.0) * 10, 2)
            for k in ISIC_CLASSES
        }
        
        return {
            "predicted_class": pred_class,
            "class_name": CLASS_NAMES.get(pred_class, pred_class.title()),
            "confidence": round(confidence * 100, 2),
            "severity": SEVERITY_MAP.get(pred_class, "Unknown"),
            "all_scores": all_scores,
            "is_mock": True
        }

    if model is None:
        model, device = load_inference_model()

    transform = get_predict_transforms()

    if isinstance(image_input, str):
        image = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, np.ndarray):
        image = Image.fromarray(image_input).convert("RGB")
    else:
        image = image_input.convert("RGB")

    tensor = transform(image).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1).squeeze().cpu().numpy()

    pred_idx = int(np.argmax(probs))
    pred_class = ISIC_CLASSES[pred_idx]
    confidence = float(probs[pred_idx])

    all_scores = {ISIC_CLASSES[i]: float(probs[i]) for i in range(len(ISIC_CLASSES))}

    result = {
        "predicted_class": pred_class,
        "class_name": CLASS_NAMES.get(pred_class, pred_class.title()),
        "confidence": round(confidence * 100, 2),
        "severity": SEVERITY_MAP.get(pred_class, "Unknown"),
        "all_scores": {
            CLASS_NAMES.get(k, k.title()): round(v * 100, 2)
            for k, v in all_scores.items()
        },
    }

    return result


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Path to skin image")
    args = parser.parse_args()
    result = predict_image(args.image)
    print("\nPrediction Result:")
    for k, v in result.items():
        print(f"  {k}: {v}")
