const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validate, cityOrCoordsQuery, coordsQuery } = require("../middleware/validators");
const {
  getCurrentWeather,
  getForecast,
  getAirQuality,
  getUVIndex,
} = require("../controllers/weatherController");

const router = express.Router();

router.get("/weather", validate(cityOrCoordsQuery), asyncHandler(getCurrentWeather));
router.get("/forecast", validate(coordsQuery), asyncHandler(getForecast));
router.get("/airquality", validate(coordsQuery), asyncHandler(getAirQuality));
router.get("/uv", validate(coordsQuery), asyncHandler(getUVIndex));

// Public map layer key — OpenWeather's tile layers accept the same key
// as the REST API. Never expose anything more sensitive than this.
router.get("/config", (req, res) => {
  res.status(200).json({ success: true, data: { mapKey: process.env.WEATHER_API_KEY || "" } });
});

module.exports = router;
