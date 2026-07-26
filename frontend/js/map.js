// Wraps Leaflet so the rest of the app never touches the map library
// directly. Shared by the dashboard's inline map panel (small, id="map")
// and the full-page map (large, id="full-map") — whichever page loads
// this module gets its own independent Leaflet instance.

let map = null;
let marker = null;
let weatherTileLayer = null;
let clickHandler = null;

// Human-readable labels for OpenWeather's tile-layer overlay names, used
// by the full map page's layer switcher.
export const WEATHER_LAYERS = {
  none: null,
  precipitation_new: "Precipitation",
  clouds_new: "Clouds",
  temp_new: "Temperature",
  wind_new: "Wind speed",
  pressure_new: "Pressure",
};

const isDark = () => document.documentElement.getAttribute("data-theme") !== "light";

function baseTileUrl() {
  return isDark()
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}

/**
 * @param {string} containerId  id of the element Leaflet should mount into
 * @param {object} [opts]
 * @param {[number,number]} [opts.center]
 * @param {number} [opts.zoom]
 * @param {string} [opts.zoomControlPosition]
 */
export function initMap(containerId = "map", opts = {}) {
  if (map || typeof L === "undefined") return map;

  const { center = [20, 0], zoom = 2, zoomControlPosition } = opts;

  map = L.map(containerId, {
    zoomControl: !zoomControlPosition, // add it manually below if repositioned
    attributionControl: true,
  }).setView(center, zoom);

  if (zoomControlPosition) {
    L.control.zoom({ position: zoomControlPosition }).addTo(map);
  }

  L.tileLayer(baseTileUrl(), {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
  }).addTo(map);

  return map;
}

export function getMap() {
  return map;
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

/**
 * Full replacement for the overlay layer — used by the layer-switcher UI
 * on the full map page. Passing "none" (or a falsy layerName) just clears
 * whatever overlay is currently showing.
 */
export function setWeatherLayer(mapKey, layerName) {
  if (!map) return;
  if (weatherTileLayer) {
    map.removeLayer(weatherTileLayer);
    weatherTileLayer = null;
  }
  if (!layerName || layerName === "none" || !mapKey) return;
  setWeatherOverlay(mapKey, layerName);
}

export function focusLocation(lat, lon, label, zoom = 9) {
  if (!map) return;
  map.setView([lat, lon], zoom, { animate: true });

  if (marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map);
  if (label) marker.bindPopup(label).openPopup();
  return marker;
}

export function clearMarker() {
  if (marker) marker.remove();
  marker = null;
}

/**
 * Registers a callback fired with {lat, lng} whenever the user clicks
 * (or taps) anywhere on the map — the "tap a spot, get its weather"
 * behaviour of a real map app. Only one handler is kept at a time.
 */
export function onMapClick(handler) {
  if (!map) return;
  if (clickHandler) map.off("click", clickHandler);
  clickHandler = (e) => handler({ lat: e.latlng.lat, lon: e.latlng.lng });
  map.on("click", clickHandler);
}

/** Leaflet needs an explicit nudge after its container is resized or unhidden. */
export function invalidateSize() {
  if (map) map.invalidateSize();
}
