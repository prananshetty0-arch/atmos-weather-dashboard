const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validate, mongoIdParam, favoriteBody } = require("../middleware/validators");
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/favoriteController");

const router = express.Router();

router.get("/favorites", asyncHandler(getFavorites));
router.post("/favorites", validate(favoriteBody), asyncHandler(addFavorite));
router.delete("/favorites/:id", validate(mongoIdParam), asyncHandler(removeFavorite));

module.exports = router;
