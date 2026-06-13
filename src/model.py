import torch
import torch.nn as nn
import timm
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ISIC_CLASSES, MODEL_SAVE_DIR


class SkinClassifier(nn.Module):
    def __init__(self, num_classes=None, model_name="efficientnet_b3", pretrained=True):
        super(SkinClassifier, self).__init__()
        self.num_classes = num_classes or len(ISIC_CLASSES)
        self.backbone = timm.create_model(model_name, pretrained=pretrained, num_classes=0)
        in_features = self.backbone.num_features
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, self.num_classes),
        )

    def forward(self, x):
        features = self.backbone(x)
        out = self.classifier(features)
        return out

    def get_features(self, x):
        return self.backbone(x)


def build_model(num_classes=None, model_name="efficientnet_b3", pretrained=True):
    model = SkinClassifier(num_classes=num_classes, model_name=model_name, pretrained=pretrained)
    return model


def save_model(model, filename="efficientnet_skin.pt"):
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    path = os.path.join(MODEL_SAVE_DIR, filename)
    torch.save(model.state_dict(), path)
    return path


def load_model(filename="efficientnet_skin.pt", num_classes=None, device="cpu"):
    path = os.path.join(MODEL_SAVE_DIR, filename)
    model = build_model(num_classes=num_classes)
    model.load_state_dict(torch.load(path, map_location=device))
    model.eval()
    return model
