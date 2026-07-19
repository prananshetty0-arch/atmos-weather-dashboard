/**
 * Wraps an async Express route/controller so any rejected promise is
 * forwarded to next(err) instead of crashing the process or hanging
 * the request. Avoids repeating try/catch in every controller.
 *
 *   router.get("/x", asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
