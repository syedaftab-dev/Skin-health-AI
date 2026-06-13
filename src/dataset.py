import os
import numpy as np
from PIL import Image
from torch.utils.data import DataLoader, random_split
from torchvision import datasets
import torchvision.transforms as transforms
import albumentations as A
from albumentations.pytorch import ToTensorV2
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    DATA_TRAIN_DIR, DATA_TEST_DIR, IMAGE_SIZE,
    BATCH_SIZE, NUM_WORKERS, VAL_SPLIT, MEAN, STD
)


class AlbumentationsWrapper(datasets.ImageFolder):
    def __init__(self, root, transform=None, albu_transform=None):
        super().__init__(root, transform=None)
        self.albu_transform = albu_transform
        self.basic_transform = transform

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        image = np.array(Image.open(path).convert("RGB"))

        if self.albu_transform:
            image = self.albu_transform(image=image)["image"]
        elif self.basic_transform:
            image = self.basic_transform(Image.fromarray(image))

        return image, label


def get_train_transforms():
    return A.Compose([
        A.Resize(*IMAGE_SIZE),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.Rotate(limit=30, p=0.5),
        A.RandomBrightnessContrast(p=0.3),
        A.HueSaturationValue(p=0.3),
        A.GaussNoise(p=0.2),
        A.Normalize(mean=MEAN, std=STD),
        ToTensorV2(),
    ])


def get_val_transforms():
    return A.Compose([
        A.Resize(*IMAGE_SIZE),
        A.Normalize(mean=MEAN, std=STD),
        ToTensorV2(),
    ])


def get_predict_transforms():
    return transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=MEAN, std=STD),
    ])


def get_dataloaders():
    full_train = AlbumentationsWrapper(DATA_TRAIN_DIR, albu_transform=get_train_transforms())
    classes = full_train.classes

    val_size = int(len(full_train) * VAL_SPLIT)
    train_size = len(full_train) - val_size
    train_ds, val_ds = random_split(full_train, [train_size, val_size])

    val_ds.dataset = AlbumentationsWrapper(DATA_TRAIN_DIR, albu_transform=get_val_transforms())

    test_ds = AlbumentationsWrapper(DATA_TEST_DIR, albu_transform=get_val_transforms())

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)

    return train_loader, val_loader, test_loader, classes


def get_class_weights(dataset):
    from collections import Counter
    import torch
    labels = [label for _, label in dataset.samples]
    counts = Counter(labels)
    total = len(labels)
    num_classes = len(dataset.classes)
    weights = [total / (num_classes * counts.get(i, 1)) for i in range(num_classes)]
    return torch.FloatTensor(weights)
