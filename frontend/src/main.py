"""
api/main.py  —  Virtual Closet AI · FastAPI Backend
Coloca este archivo en la carpeta /api/ en la raíz del proyecto.
Ejecutar con: uvicorn api.main:app --reload --port 8000
"""

import sys
import tempfile
import uuid
import shutil
import logging
from pathlib import Path

# Agrega src/ al path para poder importar predict.py sin modificarlo
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class PredictionResult(BaseModel):
    category: str
    probability: float

class PredictionResponse(BaseModel):
    filename: str
    results: List[PredictionResult]

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Virtual Closet AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # en producción reemplaza * por tu dominio
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Cargar modelo una sola vez al arrancar ────────────────────────────────────

_model = None
_category_names = None

@app.on_event("startup")
async def startup():
    global _model, _category_names
    logger.info("Cargando modelo...")
    from src.predict import load_config, load_category_names, load_model
    cfg = load_config()
    _category_names = load_category_names()
    _model = load_model(cfg)
    logger.info("✅ Modelo cargado correctamente.")

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...), top_k: int = 5):
    if _model is None:
        raise HTTPException(503, "Modelo no disponible todavía.")

    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, f"Formato no soportado: {file.content_type}")

    # Guardar imagen temporalmente (predict_image necesita una ruta de archivo)
    suffix = Path(file.filename).suffix or ".jpg"
    tmp_path = Path(tempfile.mkdtemp()) / f"{uuid.uuid4()}{suffix}"

    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        from src.predict import predict_image
        raw = predict_image(_model, str(tmp_path), _category_names, top_k=top_k)

        return PredictionResponse(
            filename=file.filename,
            results=[
                PredictionResult(category=name, probability=round(float(prob), 4))
                for name, prob in raw
            ],
        )
    finally:
        if tmp_path.exists():
            tmp_path.unlink()
