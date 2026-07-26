const ApiError = require("../utils/ApiError");

/**
 * Catches 404s for any /api/* route that doesn't match a router.
 * Must be mounted after all real routes, before errorHandler.
 */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Single place that turns any thrown/rejected error into a consistent
 * JSON response. Handles our own ApiError, Mongoose validation/cast
 * errors, duplicate-key errors, and anything unexpected.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong on the server.";

  // Mongoose validation error → 400 with a readable message
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
  }

  // Mongoose bad ObjectId → 400 instead of a scary 500
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for "${err.path}".`;
  }

  // Duplicate key (e.g. favoriting the same city twice)
  if (err.code === 11000) {
    statusCode = 409;
    message = "That entry already exists.";
  }

  if (!err.isOperational && process.env.NODE_ENV !== "production") {
    // Unexpected (programmer) errors are worth seeing in full while developing.
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
