import logging
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from api.inference import load_inference_bundle, predict_image_bytes


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

app = FastAPI(title="Azimetrik API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

bundle = load_inference_bundle()
logger.info("Modelo cargado correctamente con %s categorías.", len(bundle.class_names))


@app.get("/api")
def api_root():
    return {"message": "Azimetrik API funcionando"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_loaded": bundle.model is not None,
        "categories": len(bundle.class_names),
    }


@app.post("/api/predict")
async def predict(file: UploadFile = File(...), top_k: int = Query(5, ge=1, le=10)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado: {file.content_type or 'desconocido'}",
        )

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="El archivo está vacío.")

        predictions = predict_image_bytes(bundle, image_bytes, top_k=top_k)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error durante la inferencia")
        raise HTTPException(status_code=500, detail="No se pudo procesar la imagen.") from exc

    return {"results": predictions}


@app.get("/")
def spa_index():
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return JSONResponse(
        {
            "message": "Frontend no compilado todavía.",
            "hint": "Ejecuta `npm run build` dentro de frontend/ antes del despliegue.",
        },
        status_code=503,
    )


@app.get("/{full_path:path}")
def spa_assets(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Ruta API no encontrada.")

    asset_path = FRONTEND_DIST / full_path
    if asset_path.exists() and asset_path.is_file():
        return FileResponse(asset_path)

    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    raise HTTPException(status_code=404, detail="Frontend no disponible.")
