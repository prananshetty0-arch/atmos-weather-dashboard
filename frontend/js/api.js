// Thin fetch wrapper around the backend REST API. Every function
// resolves with the `data` payload or throws an Error with a
// user-readable message pulled from the API's JSON error body.

const BASE = "/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // no JSON body (rare) — fall through to status-based message
  }

  if (!response.ok) {
    throw new Error(body?.message || `Request failed (${response.status}).`);
  }

  return body?.data ?? body;
}

export const WeatherAPI = {
  getCurrent: ({ city, lat, lon }) => {
    const qs = city
      ? `city=${encodeURIComponent(city)}`
      : `lat=${lat}&lon=${lon}`;
    return request(`/weather?${qs}`);
  },
  getForecast: (lat, lon) => request(`/forecast?lat=${lat}&lon=${lon}`),
  getAirQuality: (lat, lon) => request(`/airquality?lat=${lat}&lon=${lon}`),
  getUV: (lat, lon) => request(`/uv?lat=${lat}&lon=${lon}`),
  getConfig: () => request(`/config`),

  getHistory: () => request(`/history`),
  deleteHistoryEntry: (id) => request(`/history/${id}`, { method: "DELETE" }),
  clearHistory: () => request(`/history`, { method: "DELETE" }),

  getFavorites: () => request(`/favorites`),
  addFavorite: (payload) =>
    request(`/favorites`, { method: "POST", body: JSON.stringify(payload) }),
  removeFavorite: (id) => request(`/favorites/${id}`, { method: "DELETE" }),
};
