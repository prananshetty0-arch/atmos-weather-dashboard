const Favorite = require("../models/Favorite");
const ApiError = require("../utils/ApiError");

// GET /api/favorites
async function getFavorites(req, res) {
  const favorites = await Favorite.find().sort({ addedAt: -1 });
  res.status(200).json({ success: true, data: favorites });
}

// POST /api/favorites
async function addFavorite(req, res) {
  const { city, country, lat, lon } = req.body;

  const existing = await Favorite.findOne({ city, country: country || "" });
  if (existing) {
    throw new ApiError(409, "This city is already in your favorites.");
  }

  const favorite = await Favorite.create({ city, country, lat, lon });
  res.status(201).json({ success: true, data: favorite });
}

// DELETE /api/favorites/:id
async function removeFavorite(req, res) {
  const favorite = await Favorite.findByIdAndDelete(req.params.id);
  if (!favorite) {
    throw new ApiError(404, "Favorite not found.");
  }
  res.status(200).json({ success: true, message: "Removed from favorites." });
}

module.exports = { getFavorites, addFavorite, removeFavorite };
