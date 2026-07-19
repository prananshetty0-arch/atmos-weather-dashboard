// Hand-drawn inline SVG weather icons (no external icon set) so the
// look stays consistent with the rest of the UI and themes with
// currentColor. Selection is driven by OpenWeather's coarse "main"
// condition field plus a day/night flag.

const sunSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="20" fill="var(--amber)"/>
  <g stroke="var(--amber)" stroke-width="4" stroke-linecap="round">
    <line x1="50" y1="10" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="90"/>
    <line x1="10" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="90" y2="50"/>
    <line x1="21" y1="21" x2="28" y2="28"/><line x1="72" y1="72" x2="79" y2="79"/>
    <line x1="79" y1="21" x2="72" y2="28"/><line x1="28" y1="72" x2="21" y2="79"/>
  </g>
</svg>`;

const moonSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M65 20a32 32 0 1 0 15 60 26 26 0 0 1-15-60Z" fill="var(--cyan)"/>
  <circle cx="30" cy="25" r="1.6" fill="var(--cloud-200)"/>
  <circle cx="20" cy="45" r="1.2" fill="var(--cloud-200)"/>
  <circle cx="38" cy="15" r="1" fill="var(--cloud-200)"/>
</svg>`;

const cloudPath = `M27 68h44a15 15 0 0 0 2-29.9 22 22 0 0 0-42.6-7A17 17 0 0 0 27 68Z`;

const cloudsSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${cloudPath}" fill="var(--slate-400)" opacity="0.55" transform="translate(-6,-6) scale(0.85)" />
  <path d="${cloudPath}" fill="var(--cloud-200)"/>
</svg>`;

const rainSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${cloudPath}" fill="var(--slate-400)"/>
  <g stroke="var(--cyan)" stroke-width="4" stroke-linecap="round">
    <line x1="35" y1="76" x2="30" y2="90"/><line x1="50" y1="76" x2="45" y2="90"/><line x1="65" y1="76" x2="60" y2="90"/>
  </g>
</svg>`;

const thunderSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${cloudPath}" fill="var(--slate-500)"/>
  <path d="M52 70 40 88h12l-6 14 22-22H56l6-10Z" fill="var(--amber)"/>
</svg>`;

const snowSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${cloudPath}" fill="var(--slate-400)"/>
  <g fill="var(--cloud-200)">
    <circle cx="35" cy="80" r="2.6"/><circle cx="50" cy="88" r="2.6"/><circle cx="65" cy="80" r="2.6"/>
  </g>
</svg>`;

const mistSvg = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="var(--slate-400)" stroke-width="5" stroke-linecap="round">
    <line x1="18" y1="40" x2="82" y2="40"/><line x1="26" y1="54" x2="74" y2="54"/>
    <line x1="14" y1="68" x2="86" y2="68"/>
  </g>
</svg>`;

const ICONS = {
  "clear-day": sunSvg,
  "clear-night": moonSvg,
  clouds: cloudsSvg,
  rain: rainSvg,
  drizzle: rainSvg,
  thunderstorm: thunderSvg,
  snow: snowSvg,
  mist: mistSvg,
  haze: mistSvg,
  fog: mistSvg,
  smoke: mistSvg,
};

/**
 * Maps OpenWeather's "main" field + a day flag to one of the icon keys
 * above and a matching body class used to theme the sky background.
 */
export function themeFor(condition, isDay = true) {
  const c = (condition || "").toLowerCase();
  if (c === "clear") return { icon: isDay ? "clear-day" : "clear-night", cls: isDay ? "cond-clear-day" : "cond-clear-night" };
  if (c === "clouds") return { icon: "clouds", cls: "cond-clouds" };
  if (c === "rain" || c === "drizzle") return { icon: "rain", cls: "cond-rain" };
  if (c === "thunderstorm") return { icon: "thunderstorm", cls: "cond-thunderstorm" };
  if (c === "snow") return { icon: "snow", cls: "cond-snow" };
  if (["mist", "haze", "fog", "smoke", "dust", "sand"].includes(c)) return { icon: "mist", cls: "cond-mist" };
  return { icon: isDay ? "clear-day" : "clear-night", cls: isDay ? "cond-clear-day" : "cond-clear-night" };
}

export function iconMarkup(iconKey) {
  return ICONS[iconKey] || ICONS["clear-day"];
}

/** Converts an ISO 3166-1 alpha-2 country code into its flag emoji. */
export function flagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function aqiLevel(aqi) {
  if (aqi <= 1) return "good";
  if (aqi <= 2) return "moderate";
  if (aqi <= 3) return "moderate";
  return "poor";
}

export function uvLevel(uvi) {
  if (uvi == null) return null;
  if (uvi < 3) return "good";
  if (uvi < 6) return "moderate";
  return "poor";
}
