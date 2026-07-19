# Atmos — Weather Dashboard

A full-stack weather dashboard with live conditions, a 5-day forecast, air
quality and UV data, an interactive map, and MongoDB-backed favorites and
search history — wrapped in a glassmorphism UI with a canvas-animated sky
that shifts with the weather.

> Built with HTML5, modern CSS, and vanilla JavaScript on the frontend;
> Node.js, Express, and MongoDB on the backend; data from the OpenWeather API.

---

## ✨ Features

**Weather data**
- Current conditions by city search or GPS location
- 5-day forecast (min/max, condition, chance of precipitation)
- Air Quality Index with pollutant breakdown
- UV Index (when your OpenWeather key has One Call 3.0 enabled)
- Feels-like temperature, humidity, pressure, visibility, wind speed & direction, cloudiness
- Sunrise & sunset times, computed day/night state
- Country flag, local date

**Interactive map**
- Leaflet map centered on the searched city
- Marker + popup for the active location
- Live precipitation overlay from OpenWeather's tile layer

**Personalization**
- Favorites and search history persisted in MongoDB
- °C / °F toggle
- Dark / light mode, saved across sessions
- Live clock

**Interface**
- Glassmorphism panels over a canvas sky that animates rain, snow,
  drifting clouds, stars, fog, and lightning depending on conditions
- Skeleton loading states, toast notifications, smooth transitions
- Fully responsive, keyboard-accessible, respects `prefers-reduced-motion`

---

## 🗂 Folder structure

```
weather-dashboard/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── weatherController.js   # current weather, forecast, AQI, UV
│   │   ├── historyController.js   # search history CRUD
│   │   └── favoriteController.js  # favorites CRUD
│   ├── middleware/
│   │   ├── errorHandler.js        # centralized error + 404 handling
│   │   ├── rateLimiter.js         # per-IP request throttling
│   │   └── validators.js          # express-validator request schemas
│   ├── models/
│   │   ├── Search.js
│   │   └── Favorite.js
│   ├── routes/
│   │   ├── weatherRoutes.js
│   │   ├── historyRoutes.js
│   │   └── favoriteRoutes.js
│   ├── utils/
│   │   ├── asyncHandler.js        # wraps async routes for error handling
│   │   ├── ApiError.js            # typed HTTP error
│   │   ├── formatTime.js          # sunrise/sunset + day/night helpers
│   │   └── openWeatherClient.js   # OpenWeather API wrapper
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # app entry point
├── frontend/
│   ├── css/                       # variables, reset, layout, components, animations, themes, responsive
│   ├── js/                        # ES modules: api, dom, icons, map, skyEffects, clock, toast, utils, main
│   ├── assets/
│   │   └── favicon.svg
│   └── index.html
├── .gitignore
└── README.md
```

---

## 🚀 Getting started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) 18 or later
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A free [OpenWeather API key](https://openweathermap.org/api)

### 2. Configure environment variables
```bash
cd backend
cp .env.example .env
```
Then open `.env` and fill in:

| Variable          | Description                                                        |
|-------------------|---------------------------------------------------------------------|
| `WEATHER_API_KEY` | Your OpenWeatherMap API key                                        |
| `MONGO_URI`       | Local (`mongodb://127.0.0.1:27017/atmos`) or Atlas connection string |
| `PORT`            | Port the server runs on (defaults to `5000`)                       |
| `CLIENT_ORIGIN`   | Allowed CORS origin in production (not needed in local dev)        |

> **UV Index note:** the current-weather, forecast, and air-quality
> endpoints work with any free OpenWeather key. UV Index uses the One Call
> 3.0 endpoint, which requires a separate (still free) subscription
> opt-in on your OpenWeather account. Without it, the dashboard shows
> "N/A" for UV instead of failing.

### 3. Install & run
```bash
cd backend
npm install
npm run dev
```
The backend also serves the frontend as static files, so once it's
running, open:

```
http://localhost:5000
```

### 4. MongoDB setup
- **Local:** install MongoDB Community Server and make sure `mongod` is
  running before you start the backend.
- **Atlas:** create a free cluster, add your IP to the network access
  list, create a database user, and paste the provided connection
  string into `MONGO_URI` (with your password filled in).

The app will create the `atmos` database and its `searches` /
`favorites` collections automatically on first use — no manual setup
required.

---

## 🔌 API reference

All endpoints are mounted under `/api` and return `{ success, data }` on
success or `{ success: false, message }` on error.

| Method | Endpoint              | Description                              |
|--------|------------------------|-------------------------------------------|
| GET    | `/api/weather`         | `?city=` or `?lat=&lon=` — current weather |
| GET    | `/api/forecast`        | `?lat=&lon=` — 5-day forecast              |
| GET    | `/api/airquality`      | `?lat=&lon=` — air quality index           |
| GET    | `/api/uv`               | `?lat=&lon=` — UV index (may return `null`)|
| GET    | `/api/config`           | Public map tile key                       |
| GET    | `/api/history`          | Last 20 searches                          |
| DELETE | `/api/history/:id`      | Remove one history entry                  |
| DELETE | `/api/history`          | Clear all history                         |
| GET    | `/api/favorites`        | List favorites                            |
| POST   | `/api/favorites`        | Add a favorite `{ city, country, lat, lon }` |
| DELETE | `/api/favorites/:id`    | Remove a favorite                         |

---

## 🔒 Security

- Environment variables for all secrets (never hardcoded)
- [Helmet](https://helmetjs.github.io/) with a locked-down Content Security Policy
- CORS configured explicitly
- Per-IP rate limiting on all `/api` routes
- Request validation via `express-validator` on every route that accepts input
- MongoDB query sanitization against NoSQL injection
- Centralized error handling — no stack traces leaked in production

---

## 🛠 Tech stack

| Layer     | Technology                                          |
|-----------|------------------------------------------------------|
| Frontend  | HTML5, modern CSS (glassmorphism, Canvas 2D), vanilla JS (ES modules) |
| Mapping   | [Leaflet](https://leafletjs.com/)                    |
| Backend   | Node.js, Express.js                                  |
| Database  | MongoDB with Mongoose                                |
| Weather   | [OpenWeather API](https://openweathermap.org/api)    |

---

## 📸 Screenshots

_Add screenshots of the dashboard here once deployed — e.g. hero panel,
metrics grid, forecast strip, and map view._

```
docs/
├── screenshot-hero.png
├── screenshot-metrics.png
└── screenshot-map.png
```

---

## 🧭 Future improvements

- Hourly forecast view alongside the 5-day outlook
- Multi-city comparison view
- PWA support for offline access to the last-viewed city
- User accounts so favorites/history sync across devices
- Severe weather alerts (One Call API `alerts` field)
- Automated tests (Jest + Supertest for the API, Playwright for the UI)

---

## 📄 License

MIT — free to use for learning, portfolio, or interview purposes.
