import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_TRAIN_DIR = os.path.join(DATA_RAW_DIR, "Train")
DATA_TEST_DIR = os.path.join(DATA_RAW_DIR, "Test")
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_SAVE_DIR = os.path.join(BASE_DIR, "models", "saved")

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 25
LEARNING_RATE = 1e-4
NUM_WORKERS = 0
VAL_SPLIT = 0.15

ISIC_CLASSES = [
    "actinic keratosis",
    "basal cell carcinoma",
    "dermatofibroma",
    "melanoma",
    "nevus",
    "pigmented benign keratosis",
    "seborrheic keratosis",
    "squamous cell carcinoma",
    "vascular lesion",
]

CLASS_NAMES = {cls: cls.title() for cls in ISIC_CLASSES}

SEVERITY_MAP = {
    "actinic keratosis": "Medium",
    "basal cell carcinoma": "High",
    "dermatofibroma": "Low",
    "melanoma": "High",
    "nevus": "Low",
    "pigmented benign keratosis": "Low",
    "seborrheic keratosis": "Low",
    "squamous cell carcinoma": "High",
    "vascular lesion": "Medium",
}

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

MODEL_PATH = os.path.join(MODEL_SAVE_DIR, "efficientnet_skin.pt")
