const mongoose = require("mongoose");

/**
 * One document per weather lookup. Powers the "recent searches" panel.
 * Kept intentionally denormalized (a snapshot of the reading, not a
 * reference to it) so history stays accurate even if the live weather
 * for that city later changes.
 */
const searchSchema = new mongoose.Schema(
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
    lat: Number,
    lon: Number,
    temperature: {
      type: Number,
      required: true,
    },
    feelsLike: Number,
    humidity: Number,
    windSpeed: Number,
    description: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
    condition: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: "searchedAt", updatedAt: false },
  }
);

// Most-recent-first is the only access pattern for this collection.
searchSchema.index({ searchedAt: -1 });

module.exports = mongoose.model("Search", searchSchema);
