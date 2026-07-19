import { WeatherAPI } from "./api.js";
import { showToast } from "./toast.js";
import { startClock } from "./clock.js";
import { setSkyCondition, startSky } from "./skyEffects.js";
import { initMap, focusLocation, setWeatherOverlay, refreshMapTheme } from "./map.js";
import { debounce } from "./utils.js";
import {
  el,
  setHeroLoading,
  setHeroEmpty,
  renderHero,
  renderMetrics,
  renderForecastSkeleton,
  renderForecast,
  renderFavorites,
  renderHistory,
} from "./dom.js";

// ---------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------
const state = {
  unit: localStorage.getItem("atmos-unit") || "C",
  theme: localStorage.getItem("atmos-theme") || "dark",
  current: null, // last successful weather reading
  favorites: [],
  mapKey: "",
};

// ---------------------------------------------------------------------
// Theme + units
// ---------------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  state.theme = theme;
  localStorage.setItem("atmos-theme", theme);
  refreshMapTheme();
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
}

function applyUnit(unit) {
  state.unit = unit;
  localStorage.setItem("atmos-unit", unit);
  document.getElementById("unit-toggle").textContent = `°${unit}`;
  if (state.current) renderHero(state.current, state.unit, isFavoriteCity(state.current));
  if (state.lastForecast) renderForecast(state.lastForecast, state.unit);
}

function toggleUnit() {
  applyUnit(state.unit === "C" ? "F" : "C");
}

// ---------------------------------------------------------------------
// Favorites helpers
// ---------------------------------------------------------------------
function isFavoriteCity(weather) {
  return state.favorites.some(
    (f) => f.city.toLowerCase() === weather.city.toLowerCase() && (f.country || "") === (weather.country || "")
  );
}

async function loadFavorites() {
  try {
    state.favorites = await WeatherAPI.getFavorites();
    renderFavorites(state.favorites, selectSavedPlace, removeFavorite);
  } catch (err) {
    console.error(err);
  }
}

async function toggleFavorite() {
  if (!state.current) return;
  const w = state.current;

  if (isFavoriteCity(w)) {
    const match = state.favorites.find(
      (f) => f.city.toLowerCase() === w.city.toLowerCase() && (f.country || "") === (w.country || "")
    );
    if (match) await removeFavorite(match);
    return;
  }

  try {
    await WeatherAPI.addFavorite({ city: w.city, country: w.country, lat: w.lat, lon: w.lon });
    showToast(`${w.city} added to favorites.`, "success");
    await loadFavorites();
    renderHero(state.current, state.unit, true);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function removeFavorite(fav) {
  try {
    await WeatherAPI.removeFavorite(fav._id);
    await loadFavorites();
    if (state.current) {
      renderHero(state.current, state.unit, isFavoriteCity(state.current));
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------------------------------------------------------------------
// History
// ---------------------------------------------------------------------
async function loadHistory() {
  try {
    const history = await WeatherAPI.getHistory();
    renderHistory(history, selectSavedPlace, removeHistoryEntry);
  } catch (err) {
    console.error(err);
  }
}

async function removeHistoryEntry(item) {
  try {
    await WeatherAPI.deleteHistoryEntry(item._id);
    await loadHistory();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function clearAllHistory() {
  try {
    await WeatherAPI.clearHistory();
    await loadHistory();
    showToast("Search history cleared.", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function selectSavedPlace(place) {
  loadWeatherFor({ lat: place.lat, lon: place.lon, label: place.city });
}

// ---------------------------------------------------------------------
// Core weather loading flow
// ---------------------------------------------------------------------
async function loadWeatherFor({ city, lat, lon }) {
  setHeroLoading(true);
  renderForecastSkeleton();

  try {
    const weather = await WeatherAPI.getCurrent({ city, lat, lon });
    state.current = weather;

    const cls = renderHero(weather, state.unit, isFavoriteCity(weather));
    setSkyCondition(cls.replace("cond-", ""), cls);

    focusLocation(weather.lat, weather.lon, `${weather.city}${weather.country ? ", " + weather.country : ""}`);

    // Parallel secondary requests — none of them should block the hero.
    const [forecast, aqi, uv] = await Promise.allSettled([
      WeatherAPI.getForecast(weather.lat, weather.lon),
      WeatherAPI.getAirQuality(weather.lat, weather.lon),
      WeatherAPI.getUV(weather.lat, weather.lon),
    ]);

    if (forecast.status === "fulfilled") {
      state.lastForecast = forecast.value;
      renderForecast(forecast.value, state.unit);
    } else {
      el.forecastStrip.innerHTML = `<p class="empty-state">Forecast unavailable right now.</p>`;
    }

    renderMetrics({
      weather,
      aqi: aqi.status === "fulfilled" ? aqi.value : null,
      uvi: uv.status === "fulfilled" ? uv.value.uvi : null,
    });

    loadHistory();
  } catch (err) {
    setHeroEmpty();
    showToast(err.message, "error");
  }
}

// ---------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------
function wireSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("city-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = input.value.trim();
    if (!city) return;
    loadWeatherFor({ city });
  });
}

function wireLocate() {
  const btn = document.getElementById("locate-btn");
  btn.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      showToast("Geolocation isn't supported by this browser.", "error");
      return;
    }
    btn.classList.add("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btn.classList.remove("locating");
        loadWeatherFor({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        btn.classList.remove("locating");
        showToast("Location access was denied. Try searching a city instead.", "error");
      },
      { timeout: 10000 }
    );
  });
}

function wireTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
        document.getElementById(t.dataset.panel).hidden = true;
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      document.getElementById(tab.dataset.panel).hidden = false;
    });
  });
}

function wireMisc() {
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  document.getElementById("unit-toggle").addEventListener("click", toggleUnit);
  document.getElementById("favorite-btn").addEventListener("click", toggleFavorite);
  document.getElementById("clear-history-btn").addEventListener("click", clearAllHistory);

  window.addEventListener(
    "resize",
    debounce(() => {}, 200)
  );
}

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
async function init() {
  applyTheme(state.theme);
  applyUnit(state.unit);
  startClock();
  initMap();
  startSky();

  wireSearch();
  wireLocate();
  wireTabs();
  wireMisc();

  await loadFavorites();
  await loadHistory();

  try {
    const config = await WeatherAPI.getConfig();
    state.mapKey = config.mapKey;
    setWeatherOverlay(state.mapKey);
  } catch {
    // Map still works without the precipitation overlay.
  }

  // Try to greet the user with their own location; fall back quietly.
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeatherFor({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => loadWeatherFor({ city: "London" }),
      { timeout: 8000 }
    );
  } else {
    loadWeatherFor({ city: "London" });
  }
}

document.addEventListener("DOMContentLoaded", init);
