const rateLimit = require("express-rate-limit");

/**
 * Applies to every /api/* request. Generous enough for normal use
 * (typing a city, switching tabs) while blocking accidental hammering
 * of the OpenWeather API through our backend.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please wait a moment and try again.",
  },
});

module.exports = apiLimiter;
