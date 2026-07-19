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
