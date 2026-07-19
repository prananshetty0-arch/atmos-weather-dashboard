const Search = require("../models/Search");

// GET /api/history
async function getHistory(req, res) {
  const history = await Search.find().sort({ searchedAt: -1 }).limit(20);
  res.status(200).json({ success: true, data: history });
}

// DELETE /api/history/:id
async function deleteHistoryEntry(req, res) {
  await Search.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Entry removed." });
}

// DELETE /api/history
async function clearHistory(req, res) {
  await Search.deleteMany({});
  res.status(200).json({ success: true, message: "History cleared." });
}

module.exports = { getHistory, deleteHistoryEntry, clearHistory };
