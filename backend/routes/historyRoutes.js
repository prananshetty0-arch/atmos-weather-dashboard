const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { validate, mongoIdParam } = require("../middleware/validators");
const {
  getHistory,
  deleteHistoryEntry,
  clearHistory,
} = require("../controllers/historyController");

const router = express.Router();

router.get("/history", asyncHandler(getHistory));
router.delete("/history/:id", validate(mongoIdParam), asyncHandler(deleteHistoryEntry));
router.delete("/history", asyncHandler(clearHistory));

module.exports = router;
