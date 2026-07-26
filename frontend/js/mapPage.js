// Controls the full-screen map page (map.html): a "real map app" feel —
// search-to-fly-to, switchable weather layers, tap-anywhere-for-weather,
// geolocate, fullscreen, and a floating conditions card.

import { WeatherAPI } from "./api.js";
import { showToast } from "./toast.js";
import {
  initMap,
  focusLocation,
  setWeatherLayer,
  refreshMapTheme,
  onMapClick,
  WEATHER_LAYERS,
} from "./map.js";
import { attachAutocomplete } from "./autocomplete.js";
import { iconMarkup, themeFor, flagEmoji } from "./icons.js";
import { formatTemp, localTimeInfo } from "./utils.js";

const state = {
  unit: localStorage.getItem("atmos-unit") || "C",
  theme: localStorage.getItem("atmos-theme") || "dark",
  mapKey: "",
  activeLayer: "none",
  lastWeather: null,
};

const params = new URLSearchParams(window.location.search);

// ---------------------------------------------------------------------
// Theme + units (kept in sync with the dashboard via localStorage)
// ---------------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  state.theme = theme;
  localStorage.setItem("atmos-theme", theme);
  refreshMapTheme();
}

function applyUnit(unit) {
  state.unit = unit;
  localStorage.setItem("atmos-unit", unit);
  document.getElementById("map-unit-toggle").textContent = `°${unit}`;
  if (state.lastWeather) renderInfoCard(state.lastWeather);
}

// ---------------------------------------------------------------------
// Weather info card
// ---------------------------------------------------------------------
function showInfoCard() {
  document.getElementById("map-info-card").classList.add("is-visible");
}
function hideInfoCard() {
  document.getElementById("map-info-card").classList.remove("is-visible");
}

function renderInfoLoading(label) {
  document.getElementById("map-info-body").innerHTML = `<p class="map-info-loading">Loading conditions${label ? ` for ${label}` : ""}…</p>`;
  showInfoCard();
}

function renderInfoError(message) {
  document.getElementById("map-info-body").innerHTML = `<p class="map-info-loading">${message}</p>`;
  showInfoCard();
}

function renderInfoCard(weather) {
  state.lastWeather = weather;
  const { icon } = themeFor(weather.condition, weather.isDaytime);

  const local = localTimeInfo(weather.timezoneOffset);

  document.getElementById("map-info-body").innerHTML = `
    <div class="map-info-head">
      <span class="map-info-city">${weather.city}</span>
      <span class="map-info-country">${flagEmoji(weather.country)} ${weather.country || ""}</span>
    </div>
    ${local ? `<div class="map-info-time mono">${local.isDay ? "☀️" : "🌙"} ${local.time} local · ${local.gmt}</div>` : ""}
    <div class="map-info-main">
      <div class="map-info-icon">${iconMarkup(icon)}</div>
      <div>
        <div class="map-info-temp">${formatTemp(weather.temperature, state.unit)}</div>
        <div class="map-info-desc">${weather.description}</div>
      </div>
    </div>
    <div class="map-info-stats">
      <div class="map-info-stat"><span class="eyebrow">Feels like</span><span class="mono">${formatTemp(weather.feelsLike, state.unit)}</span></div>
      <div class="map-info-stat"><span class="eyebrow">Humidity</span><span class="mono">${weather.humidity}%</span></div>
      <div class="map-info-stat"><span class="eyebrow">Wind</span><span class="mono">${weather.windSpeed.toFixed(1)} m/s</span></div>
    </div>`;
  showInfoCard();
}

async function showWeatherAt({ lat, lon, label, zoom }) {
  focusLocation(lat, lon, label, zoom);
  renderInfoLoading(label);
  try {
    const weather = await WeatherAPI.getCurrent({ lat, lon });
    renderInfoCard(weather);
  } catch (err) {
    renderInfoError(err.message);
  }
}

// ---------------------------------------------------------------------
// Weather layer switcher
// ---------------------------------------------------------------------
function buildLayerSwitcher() {
  const panel = document.getElementById("map-layers-panel");

  Object.entries(WEATHER_LAYERS).forEach(([key, label]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-layer-btn" + (key === state.activeLayer ? " is-active" : "");
    btn.dataset.layer = key;
    btn.innerHTML = `<span class="map-layer-dot"></span> ${key === "none" ? "None" : label}`;
    btn.addEventListener("click", () => setActiveLayer(key));
    panel.appendChild(btn);
  });
}

function setActiveLayer(key) {
  state.activeLayer = key;
  setWeatherLayer(state.mapKey, key === "none" ? null : key);
  document.querySelectorAll(".map-layer-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.layer === key);
  });
}

// ---------------------------------------------------------------------
// Search, locate, tap-to-check
// ---------------------------------------------------------------------
function wireSearch() {
  const form = document.getElementById("map-search-form");
  const input = document.getElementById("map-city-input");
  const dropdown = document.getElementById("map-suggest-dropdown");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = input.value.trim();
    if (!city) return;
    dropdown.hidden = true;
    searchByCityName(city, form);
  });

  input.addEventListener("input", () => form.classList.remove("is-invalid"));

  attachAutocomplete({
    input,
    dropdown,
    onSelect: (place) => {
      showWeatherAt({ lat: place.lat, lon: place.lon, label: place.name });
    },
  });
}

async function searchByCityName(city, form) {
  renderInfoLoading(city);
  try {
    const weather = await WeatherAPI.getCurrent({ city });
    focusLocation(weather.lat, weather.lon, weather.city);
    renderInfoCard(weather);
  } catch (err) {
    renderInfoError(err.message);
    showToast(err.message, "error");
    if (form) {
      form.classList.remove("is-invalid");
      void form.offsetWidth;
      form.classList.add("is-invalid");
    }
  }
}

function wireLocate() {
  const btn = document.getElementById("map-locate-btn");
  btn.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      showToast("Geolocation isn't supported by this browser.", "error");
      return;
    }
    btn.classList.add("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btn.classList.remove("locating");
        showWeatherAt({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Your location", zoom: 11 });
      },
      () => {
        btn.classList.remove("locating");
        showToast("Location access was denied. Try searching instead.", "error");
      },
      { timeout: 10000 }
    );
  });
}

function wireMapTapToCheck() {
  onMapClick(async ({ lat, lon }) => {
    renderInfoLoading();
    try {
      const [weather, place] = await Promise.allSettled([
        WeatherAPI.getCurrent({ lat, lon }),
        WeatherAPI.reverseGeocode(lat, lon),
      ]);
      if (weather.status !== "fulfilled") throw new Error(weather.reason?.message || "Could not load conditions there.");
      const label =
        place.status === "fulfilled" && place.value
          ? [place.value.name, place.value.country].filter(Boolean).join(", ")
          : weather.value.city;
      focusLocation(lat, lon, label, undefined);
      renderInfoCard(weather.value);
    } catch (err) {
      renderInfoError(err.message);
    }
  });
}

function wireInfoCardClose() {
  document.getElementById("map-info-close").addEventListener("click", hideInfoCard);
}

function wireFullscreen() {
  const btn = document.getElementById("map-fullscreen-toggle");
  btn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        showToast("Full screen isn't available in this browser.", "error");
      });
    } else {
      document.exitFullscreen?.();
    }
  });
}

function wireMisc() {
  document.getElementById("map-theme-toggle").addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });
  document.getElementById("map-unit-toggle").addEventListener("click", () => {
    applyUnit(state.unit === "C" ? "F" : "C");
  });
}

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
async function init() {
  applyTheme(state.theme);
  applyUnit(state.unit);

  const initialLat = parseFloat(params.get("lat"));
  const initialLon = parseFloat(params.get("lon"));
  const hasInitial = Number.isFinite(initialLat) && Number.isFinite(initialLon);

  initMap("full-map", {
    center: hasInitial ? [initialLat, initialLon] : [20, 0],
    zoom: hasInitial ? 9 : 2,
    zoomControlPosition: "bottomright",
  });

  buildLayerSwitcher();
  wireSearch();
  wireLocate();
  wireMapTapToCheck();
  wireInfoCardClose();
  wireFullscreen();
  wireMisc();

  try {
    const config = await WeatherAPI.getConfig();
    state.mapKey = config.mapKey;
  } catch {
    // Layer switcher still renders; layers just won't load without a key.
  }

  if (hasInitial) {
    const label = [params.get("city"), params.get("country")].filter(Boolean).join(", ");
    showWeatherAt({ lat: initialLat, lon: initialLon, label });
  } else if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => showWeatherAt({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Your location", zoom: 10 }),
      () => {}, // no forced default city here — let the user search/tap
      { timeout: 8000 }
    );
  }
}

document.addEventListener("DOMContentLoaded", init);
