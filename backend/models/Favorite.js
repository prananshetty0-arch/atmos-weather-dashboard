const mongoose = require("mongoose");

/**
 * A city the user has pinned for quick access. Only stable identity
 * fields are stored here (name + coordinates) — live conditions are
 * always fetched fresh, never cached on the favorite itself.
 */
const favoriteSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2,
    },
    lat: {
      type: Number,
      required: [true, "Latitude is required."],
      min: -90,
      max: 90,
    },
    lon: {
      type: Number,
      required: [true, "Longitude is required."],
      min: -180,
      max: 180,
    },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: false },
  }
);

// Prevent the exact same city/country pair being favorited twice.
favoriteSchema.index({ city: 1, country: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
