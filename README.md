# Azimetrik

Aplicación web para clasificar prendas con un modelo entrenado sobre DeepFashion y organizar un closet digital desde una interfaz React.

## Qué incluye

- `frontend/`: app `React + Vite`.
- `api/`: backend `FastAPI` para inferencia.
- `exports/base_model/`: modelo exportado a `TorchScript` y metadata.
- `Dockerfile`: despliegue en un solo servicio.
- `render.yaml`: blueprint básico para Render.

## Arquitectura de despliegue

La app quedó preparada para desplegarse como un único servicio:

- `FastAPI` expone `GET /api/health` y `POST /api/predict`.
- El mismo backend sirve el frontend compilado desde `frontend/dist`.
- La inferencia usa `exports/base_model/fashion_detector_base.ts` y `exports/base_model/metadata.json`.
- En producción ya no depende de `data/raw/` ni de `checkpoints/`.

## Desarrollo local

### Backend

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements_api.txt
.\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

La app web queda en `http://localhost:3000` y usa proxy a `http://localhost:8000/api`.

## Despliegue con Docker

```bash
docker build -t azimetrik .
docker run -p 8000:8000 azimetrik
```

Luego abre `http://localhost:8000`.

## Despliegue en Render

1. Conecta el repositorio `ElViejoH/Azimetrik`.
2. Render detectará `render.yaml`.
3. Crea el servicio web usando `Dockerfile`.
4. Cuando termine el build, la app quedará sirviendo frontend + API en el mismo dominio.

## Variables opcionales

- `MODEL_PATH`: ruta al archivo `TorchScript`.
- `MODEL_METADATA_PATH`: ruta al `metadata.json`.
- `MODEL_DEVICE`: por defecto `cpu`.

## Endpoints

- `GET /api/health`
- `POST /api/predict?top_k=5`

Tipos aceptados: `jpg`, `jpeg`, `png`, `webp`.

## Notas del modelo

- Backbone base: `ResNet50`.
- `50` categorías de DeepFashion.
- Mejor validación registrada: `0.650225`.
- Artefacto exportado listo para inferencia: `exports/base_model/fashion_detector_base.ts`.

## Entrenamiento

El pipeline original de entrenamiento y evaluación se mantiene en `src/`:

- `src/train.py`
- `src/evaluate.py`
- `src/export_model.py`

Ese flujo ya no es necesario para levantar la app desplegada, pero sigue disponible para reentrenar o regenerar artefactos.
