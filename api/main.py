import logging
import shutil
import sys
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.predict import load_category_names, load_config, load_model, predict_image


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

app = FastAPI(title="Virtual Closet API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

cfg = load_config()
category_names = load_category_names(
    str(PROJECT_ROOT / cfg["data_root"]),
    cfg.get("annotation_dir", "Anno_coarse"),
)
model = load_model(cfg)
logger.info("Modelo cargado correctamente.")


@app.get("/")
def root():
    return {"message": "Virtual Closet API funcionando"}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...), top_k: int = Query(5, ge=1, le=10)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado: {file.content_type or 'desconocido'}",
        )

    uploads_dir = PROJECT_ROOT / "uploads"
    uploads_dir.mkdir(exist_ok=True)

    suffix = Path(file.filename or "").suffix or ".jpg"
    file_path = uploads_dir / f"{uuid.uuid4()}{suffix}"

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        predictions = predict_image(
            model,
            str(file_path),
            category_names,
            top_k=top_k,
        )
    except Exception as exc:
        logger.exception("Error durante la inferencia")
        raise HTTPException(status_code=500, detail="No se pudo procesar la imagen.") from exc
    finally:
        if file_path.exists():
            file_path.unlink()

    return {
        "results": [
            {"category": category, "probability": float(probability)}
            for category, probability in predictions
        ]
    }
