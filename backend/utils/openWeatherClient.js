const axios = require("axios");
const ApiError = require("./ApiError");

const BASE_URL = "https://api.openweathermap.org/data/2.5";
const ONE_CALL_URL = "https://api.openweathermap.org/data/3.0/onecall";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const REVERSE_GEO_URL = "https://api.openweathermap.org/geo/1.0/reverse";

/**
 * Thin wrapper around axios that centralizes the API key, base URL,
 * and error translation so controllers never touch axios directly.
 */
const client = axios.create({ timeout: 8000 });

function apiKey() {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    throw new ApiError(
      500,
      "Server is missing WEATHER_API_KEY. Add it to backend/.env."
    );
  }
  return key;
}

async function request(url, params) {
  try {
    const response = await client.get(url, { params: { ...params, appid: apiKey() } });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const status = error.response?.status;
    if (status === 404) {
      throw new ApiError(404, "That city could not be found. Check the spelling and try again.");
    }
    if (status === 401) {
      throw new ApiError(500, "Weather provider rejected the API key. Check WEATHER_API_KEY.");
    }
    if (status === 429) {
      throw new ApiError(429, "Weather provider rate limit reached. Try again shortly.");
    }
    throw new ApiError(502, "Could not reach the weather provider. Please try again.");
  }
}

const getCurrentWeather = (params) => request(`${BASE_URL}/weather`, { ...params, units: "metric" });

const getForecast = (params) => request(`${BASE_URL}/forecast`, { ...params, units: "metric" });

const getAirQuality = (params) => request(`${BASE_URL}/air_pollution`, params);

/**
 * UV Index lives behind OpenWeather's One Call 3.0 endpoint, which
 * requires a separate (still free) subscription opt-in. Callers should
 * treat a null return as "unavailable" rather than an error, so the
 * rest of the dashboard keeps working for API keys without it enabled.
 */
async function getUVIndex(params) {
  try {
    const data = await request(ONE_CALL_URL, {
      ...params,
      exclude: "minutely,hourly,daily,alerts",
    });
    return typeof data.current?.uvi === "number" ? data.current.uvi : null;
  } catch {
    return null;
  }
}

/**
 * Powers the search-bar autocomplete dropdown: given a partial city
 * name, returns up to `limit` matching places with coordinates so the
 * frontend can let the user pick the exact one they meant (handles
 * duplicate city names in different countries/states).
 */
const getGeocodeSuggestions = (q, limit = 5) => request(GEO_URL, { q, limit });

/** Reverse geocoding — used to label a point the user clicks/taps on the map. */
const reverseGeocode = (params) => request(REVERSE_GEO_URL, { ...params, limit: 1 });

module.exports = {
  getCurrentWeather,
  getForecast,
  getAirQuality,
  getUVIndex,
  getGeocodeSuggestions,
  reverseGeocode,
  apiKey,
};
