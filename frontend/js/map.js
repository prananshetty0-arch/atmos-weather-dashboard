// Wraps Leaflet so main.js never touches the map library directly.
// A single marker+popup tracks whatever city is currently shown.

let map = null;
let marker = null;
let weatherTileLayer = null;

const isDark = () => document.documentElement.getAttribute("data-theme") !== "light";

function baseTileUrl() {
  return isDark()
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}

export function initMap() {
  if (map || typeof L === "undefined") return;

  map = L.map("map", { zoomControl: true, attributionControl: true }).setView([20, 0], 2);

  L.tileLayer(baseTileUrl(), {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
  }).addTo(map);
}

/** Swaps the base layer to match the current light/dark theme. */
export function refreshMapTheme() {
  if (!map) return;
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer && !layer.options.isWeatherLayer) {
      map.removeLayer(layer);
    }
  });
  L.tileLayer(baseTileUrl(), { maxZoom: 19 }).addTo(map);
}

/** Overlays OpenWeather's precipitation tile layer once a map key is known. */
export function setWeatherOverlay(mapKey, layerName = "precipitation_new") {
  if (!map || !mapKey) return;
  if (weatherTileLayer) map.removeLayer(weatherTileLayer);
  weatherTileLayer = L.tileLayer(
    `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${mapKey}`,
    { opacity: 0.55, isWeatherLayer: true }
  ).addTo(map);
}

export function focusLocation(lat, lon, label) {
  if (!map) return;
  map.setView([lat, lon], 9, { animate: true });

  if (marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map);
  if (label) marker.bindPopup(label).openPopup();
}
