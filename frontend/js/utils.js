export function celsiusToFahrenheit(c) {
  return c * 9 / 5 + 32;
}

/** Formats a Celsius value in whichever unit the user has selected. */
export function formatTemp(celsius, unit = "C") {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return "--°";
  const value = unit === "F" ? celsiusToFahrenheit(celsius) : celsius;
  return `${Math.round(value)}°`;
}

export function metersToKm(m) {
  if (m === null || m === undefined) return "--";
  return (m / 1000).toFixed(1);
}

export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Builds local time / date / day-or-night info for a searched location
 * using the UTC offset (in seconds) returned by the weather API — never
 * the browser's own timezone, so it stays correct for any city on earth.
 */
export function localTimeInfo(timezoneOffsetSeconds) {
  if (timezoneOffsetSeconds === undefined || timezoneOffsetSeconds === null) return null;

  const nowUtcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
  const local = new Date(nowUtcMs + timezoneOffsetSeconds * 1000);

  const time = local.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const date = local.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  const totalMinutes = timezoneOffsetSeconds / 60;
  const sign = totalMinutes >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(totalMinutes) / 60)).padStart(2, "0");
  const mm = String(Math.abs(totalMinutes) % 60).padStart(2, "0");
  const gmt = `GMT${sign}${hh}:${mm}`;

  const hour = local.getHours();
  const isDay = hour >= 6 && hour < 18;

  return { time, date, gmt, isDay, localDate: local };
}

export function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
