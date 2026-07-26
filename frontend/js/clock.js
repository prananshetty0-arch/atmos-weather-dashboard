const timeEl = document.getElementById("clock-time");
const dateEl = document.getElementById("clock-date");
const footerYearEl = document.getElementById("footer-year");

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function tick() {
  const now = new Date();
  if (timeEl) timeEl.textContent = now.toLocaleTimeString(undefined, { hour12: false });
  if (dateEl) dateEl.textContent = dateFormatter.format(now);
}

export function startClock() {
  tick();
  setInterval(tick, 1000);
  if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();
}

export function formatToday(date = new Date()) {
  return dateFormatter.format(date);
}
