/**
 * Converts a Unix UTC timestamp (seconds) plus a timezone offset
 * (seconds, as returned by OpenWeather) into a "HH:MM" local time
 * string, without pulling in a date library for one calculation.
 */
function formatLocalTime(unixUTC, timezoneOffsetSeconds) {
  if (!unixUTC && unixUTC !== 0) return null;
  const localMs = (unixUTC + timezoneOffsetSeconds) * 1000;
  const date = new Date(localMs);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Determines whether "now" (in the city's local time) falls between
 * sunrise and sunset, so the frontend can pick a day/night theme
 * without doing its own timezone math.
 */
function isDaytime(nowUnixUTC, sunriseUnixUTC, sunsetUnixUTC) {
  return nowUnixUTC >= sunriseUnixUTC && nowUnixUTC < sunsetUnixUTC;
}

module.exports = { formatLocalTime, isDaytime };
