/**
 * api/predict.js
 * Toda la comunicación con el backend FastAPI en un solo lugar.
 * Si cambias el puerto del backend, solo editas aquí.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '/';

/**
 * Envía una imagen al backend y devuelve los resultados de clasificación.
 * @param {File} file        - imagen seleccionada por el usuario
 * @param {number} topK      - cuántas predicciones pedir (default 5)
 * @returns {Promise<Array>} - [{ category: string, probability: number }, ...]
 */
export async function classifyImage(file, topK = 5) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${BASE}predict?top_k=${topK}`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  const data = await res.json();
  return data.results;  // [{ category, probability }]
}

export async function checkHealth() {
  const res = await fetch(`${BASE}health`);
  return res.json();
}
