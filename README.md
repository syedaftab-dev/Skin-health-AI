# SkinAI — AI-Powered Skin Health Analyzer

## Dataset Structure
```
data/
  raw/
    Train/
      actinic keratosis/
      basal cell carcinoma/
      dermatofibroma/
      melanoma/
      nevus/
      pigmented benign keratosis/
      seborrheic keratosis/
      squamous cell carcinoma/
      vascular lesion/
    Test/
      actinic keratosis/
      ...
```

## Setup
```bash
pip install -r requirements.txt
```

## Train
```bash
python -m src.train
```

## Run API
```bash
uvicorn api.main:app --reload
```

## Open Frontend
Open `frontend/index.html` in a browser.

## Single Image Prediction
```bash
python -m src.predict --image path/to/skin.jpg
```

## API Endpoints
- `GET  /health`   — health check
- `POST /analyze`  — upload image → returns diagnosis + recommendations

## Classes
| Folder Name | Severity |
|---|---|
| actinic keratosis | Medium |
| basal cell carcinoma | High |
| dermatofibroma | Low |
| melanoma | High |
| nevus | Low |
| pigmented benign keratosis | Low |
| seborrheic keratosis | Low |
| squamous cell carcinoma | High |
| vascular lesion | Medium |

## Disclaimer
For informational purposes only. Not a substitute for professional medical advice.
