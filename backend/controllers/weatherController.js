const owm = require("../utils/openWeatherClient");
const Search = require("../models/Search");
const ApiError = require("../utils/ApiError");
const { formatLocalTime, isDaytime } = require("../utils/formatTime");

/**
 * Builds the location params for OpenWeather from either a city name
 * or lat/lon query params — whichever the request provided.
 */
function locationParams(req) {
  const { city, lat, lon } = req.query;
  if (city) return { q: city };
  if (lat && lon) return { lat, lon };
  throw new ApiError(400, "Provide either a city name or lat/lon coordinates.");
}

// GET /api/weather?city=Mumbai  OR  /api/weather?lat=..&lon=..
async function getCurrentWeather(req, res) {
  const data = await owm.getCurrentWeather(locationParams(req));

  // OpenWeather's sunrise/sunset are UTC unix seconds, directly
  // comparable to the current UTC time — no timezone math needed here.
  const nowUTC = Math.floor(Date.now() / 1000);

  const result = {
    city: data.name,
    country: data.sys.country || "",
    lat: data.coord.lat,
    lon: data.coord.lon,
    timezoneOffset: data.timezone,
    temperature: Math.round(data.main.temp * 10) / 10,
    feelsLike: Math.round(data.main.feels_like * 10) / 10,
    tempMin: Math.round(data.main.temp_min * 10) / 10,
    tempMax: Math.round(data.main.temp_max * 10) / 10,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    visibility: data.visibility, // meters
    windSpeed: data.wind.speed, // m/s
    windDeg: data.wind.deg ?? null,
    cloudiness: data.clouds?.all ?? null,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    condition: data.weather[0].main, // e.g. "Clear", "Rain" — drives the frontend theme
    sunrise: formatLocalTime(data.sys.sunrise, data.timezone),
    sunset: formatLocalTime(data.sys.sunset, data.timezone),
    isDaytime: isDaytime(nowUTC, data.sys.sunrise, data.sys.sunset),
  };

  // Best-effort: don't fail the whole request if history logging fails.
  Search.create({
    city: result.city,
    country: result.country,
    lat: result.lat,
    lon: result.lon,
    temperature: result.temperature,
    feelsLike: result.feelsLike,
    humidity: result.humidity,
    windSpeed: result.windSpeed,
    description: result.description,
    icon: result.icon,
    condition: result.condition,
  }).catch((err) => console.error("History save failed:", err.message));

  res.status(200).json({ success: true, data: result });
}

// GET /api/forecast?lat=..&lon=..
// Returns one entry per day (5 days), using the 3-hour slot closest to
// midday as the representative reading for that day.
async function getForecast(req, res) {
  const { lat, lon } = req.query;
  const data = await owm.getForecast({ lat, lon });

  const byDate = {};
  for (const entry of data.list) {
    const dateKey = entry.dt_txt.split(" ")[0];
    (byDate[dateKey] ??= []).push(entry);
  }

  const dailyForecast = Object.keys(byDate)
    .slice(0, 5)
    .map((dateKey) => {
      const entries = byDate[dateKey];
      const midday = entries.reduce((closest, entry) => {
        const hour = Number(entry.dt_txt.split(" ")[1].split(":")[0]);
        const closestHour = Number(closest.dt_txt.split(" ")[1].split(":")[0]);
        return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? entry : closest;
      });
      const temps = entries.map((e) => e.main.temp);

      return {
        date: dateKey,
        minTemp: Math.round(Math.min(...temps)),
        maxTemp: Math.round(Math.max(...temps)),
        description: midday.weather[0].description,
        icon: midday.weather[0].icon,
        condition: midday.weather[0].main,
        humidity: midday.main.humidity,
        windSpeed: midday.wind.speed,
        pop: Math.round((midday.pop ?? 0) * 100), // probability of precipitation, %
      };
    });

  res.status(200).json({ success: true, data: dailyForecast });
}

// GET /api/airquality?lat=..&lon=..
async function getAirQuality(req, res) {
  const { lat, lon } = req.query;
  const data = await owm.getAirQuality({ lat, lon });
  const reading = data.list[0];
  const labels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };

  res.status(200).json({
    success: true,
    data: {
      aqi: reading.main.aqi,
      label: labels[reading.main.aqi] || "Unknown",
      components: reading.components,
    },
  });
}

// GET /api/uv?lat=..&lon=..
async function getUVIndex(req, res) {
  const { lat, lon } = req.query;
  const uvi = await owm.getUVIndex({ lat, lon });
  res.status(200).json({ success: true, data: { uvi } });
}

module.exports = { getCurrentWeather, getForecast, getAirQuality, getUVIndex };
