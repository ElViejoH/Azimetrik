from __future__ import annotations

import json
import os
from dataclasses import dataclass
import io
from pathlib import Path

import numpy as np
from PIL import Image
import torch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_METADATA_PATH = PROJECT_ROOT / "exports" / "base_model" / "metadata.json"
DEFAULT_MODEL_PATH = PROJECT_ROOT / "exports" / "base_model" / "fashion_detector_base.ts"
DEVICE_NAME = os.getenv("MODEL_DEVICE", "cpu")
DEVICE = torch.device(DEVICE_NAME)


def project_path(path: str | Path) -> Path:
    path = Path(path)
    return path if path.is_absolute() else PROJECT_ROOT / path


@dataclass
class InferenceBundle:
    model: torch.jit.ScriptModule
    class_names: list[str]
    image_size: int
    mean: torch.Tensor
    std: torch.Tensor


def load_inference_bundle() -> InferenceBundle:
    metadata_path = project_path(os.getenv("MODEL_METADATA_PATH", DEFAULT_METADATA_PATH))
    model_path = project_path(os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH))

    if not metadata_path.exists():
        raise FileNotFoundError(f"No se encontró la metadata del modelo: {metadata_path}")
    if not model_path.exists():
        raise FileNotFoundError(f"No se encontró el modelo exportado: {model_path}")

    with open(metadata_path, encoding="utf-8") as handle:
        metadata = json.load(handle)

    image_size = int(metadata.get("input_shape", [1, 3, 224, 224])[2])
    normalization = metadata.get("normalization", {})
    mean = torch.tensor(normalization.get("mean", [0.485, 0.456, 0.406]), dtype=torch.float32)
    std = torch.tensor(normalization.get("std", [0.229, 0.224, 0.225]), dtype=torch.float32)

    model = torch.jit.load(str(model_path), map_location=DEVICE)
    model.eval()

    return InferenceBundle(
        model=model,
        class_names=list(metadata["class_names"]),
        image_size=image_size,
        mean=mean,
        std=std,
    )


def preprocess_image(image: Image.Image, bundle: InferenceBundle) -> torch.Tensor:
    image = image.convert("RGB").resize((bundle.image_size, bundle.image_size))
    array = np.asarray(image, dtype=np.float32) / 255.0
    tensor = torch.from_numpy(array).permute(2, 0, 1)
    tensor = (tensor - bundle.mean[:, None, None]) / bundle.std[:, None, None]
    return tensor.unsqueeze(0).to(DEVICE)


@torch.no_grad()
def predict_image_bytes(bundle: InferenceBundle, image_bytes: bytes, top_k: int = 5):
    with Image.open(io.BytesIO(image_bytes)) as image:
        tensor = preprocess_image(image, bundle)

    logits = bundle.model(tensor)
    probs = torch.softmax(logits, dim=1).squeeze(0)
    topk = probs.topk(top_k)

    return [
        {
            "category": bundle.class_names[idx.item()],
            "probability": float(prob.item()),
        }
        for prob, idx in zip(topk.values, topk.indices)
    ]
