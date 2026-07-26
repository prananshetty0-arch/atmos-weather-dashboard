require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const apiLimiter = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const weatherRoutes = require("./routes/weatherRoutes");
const historyRoutes = require("./routes/historyRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// ---------------------------------------------------------------------
// Security & parsing middleware
// ---------------------------------------------------------------------
app.use(
  helmet({
    // Relaxed CSP so the vanilla-JS frontend can load the Leaflet map
    // tiles/CDN assets it needs, while still blocking inline event
    // handlers and third-party script injection.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*.basemaps.cartocdn.com", "https://tile.openweathermap.org", "https://unpkg.com"],
        connectSrc: ["'self'", "https://api.openweathermap.org"],
      },
    },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize()); // strips $/. keys that could be used for NoSQL injection
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ---------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------
app.use("/api", apiLimiter, weatherRoutes);
app.use("/api", apiLimiter, historyRoutes);
app.use("/api", apiLimiter, favoriteRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Atmos API is running." });
});

// ---------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------
app.use(express.static(FRONTEND_DIR));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// 404 + error handling must be registered last
app.use("/api", notFound);
app.use(errorHandler);

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
async function start() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Atmos server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
