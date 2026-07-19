import { iconMarkup, themeFor, flagEmoji, aqiLevel, uvLevel } from "./icons.js";
import { formatTemp, metersToKm, capitalize, timeAgo } from "./utils.js";

export const el = {
  heroSkeleton: document.getElementById("hero-skeleton"),
  heroContent: document.getElementById("hero-content"),
  heroEmpty: document.getElementById("hero-empty"),
  cityName: document.getElementById("city-name"),
  countryFlag: document.getElementById("country-flag"),
  countryName: document.getElementById("country-name"),
  todayDate: document.getElementById("today-date"),
  heroIcon: document.getElementById("hero-icon"),
  heroTemp: document.getElementById("hero-temp"),
  heroDesc: document.getElementById("hero-desc"),
  heroFeels: document.getElementById("hero-feels"),
  heroHilo: document.getElementById("hero-hilo"),
  heroSunrise: document.getElementById("hero-sunrise"),
  heroSunset: document.getElementById("hero-sunset"),
  favoriteBtn: document.getElementById("favorite-btn"),

  valHumidity: document.getElementById("val-humidity"),
  dialHumidity: document.getElementById("dial-humidity"),
  valWind: document.getElementById("val-wind"),
  compassNeedle: document.getElementById("compass-needle"),
  valPressure: document.getElementById("val-pressure"),
  valVisibility: document.getElementById("val-visibility"),
  valUv: document.getElementById("val-uv"),
  badgeUv: document.getElementById("badge-uv"),
  valAqi: document.getElementById("val-aqi"),
  badgeAqi: document.getElementById("badge-aqi"),

  forecastStrip: document.getElementById("forecast-strip"),
  favoritesList: document.getElementById("favorites-list"),
  historyList: document.getElementById("history-list"),
};

export function setHeroLoading(isLoading) {
  el.heroSkeleton.hidden = !isLoading;
  el.heroContent.hidden = isLoading;
  el.heroEmpty.hidden = true;
}

export function setHeroEmpty() {
  el.heroSkeleton.hidden = true;
  el.heroContent.hidden = true;
  el.heroEmpty.hidden = false;
}

export function renderHero(weather, unit, isFavorite) {
  const { icon, cls } = themeFor(weather.condition, weather.isDaytime);

  el.heroSkeleton.hidden = true;
  el.heroEmpty.hidden = true;
  el.heroContent.hidden = false;
  el.heroContent.classList.add("fade-in");

  el.cityName.textContent = weather.city;
  el.countryFlag.textContent = flagEmoji(weather.country);
  el.countryName.textContent = weather.country;
  el.todayDate.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  el.heroIcon.innerHTML = iconMarkup(icon);
  el.heroTemp.textContent = formatTemp(weather.temperature, unit);
  el.heroDesc.textContent = weather.description;
  el.heroFeels.textContent = `Feels like ${formatTemp(weather.feelsLike, unit)}`;
  el.heroHilo.textContent = `${formatTemp(weather.tempMax, unit)} / ${formatTemp(weather.tempMin, unit)}`;
  el.heroSunrise.textContent = weather.sunrise || "--:--";
  el.heroSunset.textContent = weather.sunset || "--:--";

  el.favoriteBtn.classList.toggle("is-active", isFavorite);
  el.favoriteBtn.setAttribute("aria-pressed", String(isFavorite));

  return cls;
}

export function renderMetrics({ weather, aqi, uvi }) {
  el.valHumidity.textContent = `${weather.humidity}%`;
  el.dialHumidity.style.setProperty("--pct", weather.humidity);

  el.valWind.textContent = `${weather.windSpeed.toFixed(1)} m/s`;
  el.compassNeedle.style.setProperty("--deg", `${weather.windDeg ?? 0}deg`);

  el.valPressure.textContent = weather.pressure ?? "--";
  el.valVisibility.textContent = metersToKm(weather.visibility);

  if (uvi === null || uvi === undefined) {
    el.valUv.textContent = "N/A";
    el.badgeUv.textContent = "unavailable";
    el.badgeUv.removeAttribute("data-level");
  } else {
    el.valUv.textContent = uvi.toFixed(1);
    const level = uvLevel(uvi);
    el.badgeUv.textContent = level === "good" ? "Low" : level === "moderate" ? "Moderate" : "High";
    el.badgeUv.setAttribute("data-level", level);
  }

  if (aqi) {
    el.valAqi.textContent = aqi.aqi;
    el.badgeAqi.textContent = aqi.label;
    el.badgeAqi.setAttribute("data-level", aqiLevel(aqi.aqi));
  } else {
    el.valAqi.textContent = "--";
    el.badgeAqi.textContent = "—";
    el.badgeAqi.removeAttribute("data-level");
  }
}

export function renderForecastSkeleton() {
  el.forecastStrip.innerHTML = Array.from({ length: 5 })
    .map(() => `<div class="glass forecast-card"><div class="skel forecast-skeleton" style="width:100%"></div></div>`)
    .join("");
}

export function renderForecast(days, unit) {
  el.forecastStrip.innerHTML = days
    .map((day, i) => {
      const { icon } = themeFor(day.condition, true);
      const date = new Date(day.date + "T12:00:00");
      const label = i === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" });
      return `
        <article class="glass forecast-card fade-in" style="animation-delay:${i * 60}ms">
          <span class="forecast-day">${label}</span>
          <div class="forecast-icon">${iconMarkup(icon)}</div>
          <span class="forecast-temps"><span class="max">${formatTemp(day.maxTemp, unit)}</span> <span class="min">${formatTemp(day.minTemp, unit)}</span></span>
          <span class="forecast-pop">💧 ${day.pop}%</span>
        </article>`;
    })
    .join("");
}

export function renderFavorites(favorites, onSelect, onRemove) {
  if (!favorites.length) {
    el.favoritesList.innerHTML = `<li class="empty-state">No favorites yet — star a city to save it here.</li>`;
    return;
  }
  el.favoritesList.innerHTML = "";
  favorites.forEach((fav, i) => {
    const li = document.createElement("li");
    li.className = "entry-item";
    li.style.animationDelay = `${i * 40}ms`;
    li.innerHTML = `
      <div class="entry-main">
        <span class="entry-city">${flagEmoji(fav.country)} ${fav.city}</span>
        <span class="entry-sub">${fav.country || ""}</span>
      </div>
      <button class="entry-remove" type="button" aria-label="Remove ${fav.city} from favorites">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>`;
    li.addEventListener("click", (e) => {
      if (e.target.closest(".entry-remove")) return;
      onSelect(fav);
    });
    li.querySelector(".entry-remove").addEventListener("click", () => onRemove(fav));
    el.favoritesList.appendChild(li);
  });
}

export function renderHistory(history, onSelect, onRemove) {
  if (!history.length) {
    el.historyList.innerHTML = `<li class="empty-state">Your recent searches will appear here.</li>`;
    return;
  }
  el.historyList.innerHTML = "";
  history.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "entry-item";
    li.style.animationDelay = `${i * 30}ms`;
    li.innerHTML = `
      <div class="entry-main">
        <span class="entry-city">${flagEmoji(item.country)} ${item.city}</span>
        <span class="entry-sub">${capitalize(item.description)} · ${timeAgo(item.searchedAt)}</span>
      </div>
      <span class="entry-temp">${formatTemp(item.temperature, "C")}</span>
      <button class="entry-remove" type="button" aria-label="Remove entry">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>`;
    li.addEventListener("click", (e) => {
      if (e.target.closest(".entry-remove")) return;
      onSelect(item);
    });
    li.querySelector(".entry-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      onRemove(item);
    });
    el.historyList.appendChild(li);
  });
}
