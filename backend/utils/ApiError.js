/**
 * A small typed error so controllers can throw with an explicit HTTP
 * status instead of guessing what the error handler will do with a
 * plain Error.
 *
 *   throw new ApiError(404, "City not found.");
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true; // expected, user-facing error (vs a bug)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
