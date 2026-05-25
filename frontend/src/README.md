# Virtual Closet AI — Instrucciones de integración

## Estructura a crear en el proyecto

```
Virtual_Closet_Reformed/          ← raíz existente (no tocar src/)
│
├── api/                          ← PEGAR ESTA CARPETA NUEVA
│   ├── __init__.py
│   └── main.py
│
├── frontend/                     ← PEGAR ESTA CARPETA NUEVA
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       ├── App.module.css
│       ├── api/
│       │   └── predict.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Navbar.module.css
│       │   ├── UploadZone.jsx
│       │   ├── UploadZone.module.css
│       │   ├── ImagePreview.jsx
│       │   ├── ImagePreview.module.css
│       │   ├── ResultCard.jsx
│       │   └── ResultCard.module.css
│       └── pages/
│           ├── Home.jsx
│           └── Home.module.css
│
├── requirements_api.txt          ← PEGAR ESTE ARCHIVO NUEVO
└── src/                          ← INTOCABLE — no modificar nada aquí
```

---

## Paso 1 — Instalar dependencias del backend

```bash
# Desde la raíz del proyecto
pip install -r requirements_api.txt
```

---

## Paso 2 — Levantar el backend FastAPI

```bash
# Desde la raíz del proyecto
uvicorn api.main:app --reload --port 8000
```

Deberías ver en consola:
```
INFO:     Cargando modelo...
INFO:     ✅ Modelo cargado correctamente.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verificación rápida: http://localhost:8000/health → `{"status":"ok","model_loaded":true}`
Docs automáticas:   http://localhost:8000/docs

---

## Paso 3 — Instalar y levantar el frontend

```bash
cd frontend
npm install
npm run dev
```

La app queda en: **http://localhost:3000**

---

## Flujo completo

```
Usuario sube imagen (JPG/PNG/WEBP)
        ↓
React frontend (localhost:3000)
        ↓  POST /predict  multipart/form-data
FastAPI backend (localhost:8000)
        ↓
src/predict.predict_image()   ← SIN MODIFICAR
        ↓
[{"category": "T-shirt", "probability": 0.95}, ...]
        ↓
UI muestra barras de probabilidad animadas
```

---

## Notas

- `src/predict.py` **no fue modificado en absoluto**.
- El backend carga el modelo una sola vez al arrancar (singleton en memoria).
- La imagen se guarda en un archivo temporal, se procesa, y se borra inmediatamente.
- El proxy de Vite redirige `/predict` → `localhost:8000/predict` automáticamente en desarrollo.
  En producción, cambiar `BASE` en `frontend/src/api/predict.js`.
- CORS configurado con `allow_origins=["*"]` para desarrollo.
  En producción reemplazar `*` por el dominio real en `api/main.py`.
