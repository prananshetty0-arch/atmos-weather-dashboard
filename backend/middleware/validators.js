const { query, body, param, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Runs after a chain of express-validator checks and turns the first
 * failure into an ApiError, so routes stay declarative:
 *
 *   router.get("/x", validate([...]), handler)
 */
function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const firstError = result.array()[0];
    next(new ApiError(400, firstError.msg));
  };
}

const cityOrCoordsQuery = [
  query("city").optional().trim().isLength({ min: 1, max: 100 }).escape(),
  query("lat").optional().isFloat({ min: -90, max: 90 }),
  query("lon").optional().isFloat({ min: -180, max: 180 }),
];

const coordsQuery = [
  query("lat").notEmpty().withMessage("Latitude is required.").isFloat({ min: -90, max: 90 }),
  query("lon").notEmpty().withMessage("Longitude is required.").isFloat({ min: -180, max: 180 }),
];

const mongoIdParam = [param("id").isMongoId().withMessage("Invalid id.")];

const favoriteBody = [
  body("city").trim().notEmpty().withMessage("City is required.").isLength({ max: 100 }).escape(),
  body("country").optional().trim().isLength({ max: 2 }).escape(),
  body("lat").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required."),
  body("lon").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required."),
];

module.exports = {
  validate,
  cityOrCoordsQuery,
  coordsQuery,
  mongoIdParam,
  favoriteBody,
};
