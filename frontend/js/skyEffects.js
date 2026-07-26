// ============================================================================
// Advanced weather background animation engine.
// Pure canvas 2D, no dependencies. Renders a distinct, realistic animated
// scene per condition (sunny, cloudy, rain, thunderstorm, snow, fog, night)
// and cross-fades smoothly whenever the condition changes.
// ============================================================================

const canvas = document.getElementById("sky-canvas");
const ctx = canvas?.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallScreen = () => window.innerWidth < 640;

let width = 0;
let height = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

let mode = "clear-day";
let rafId = null;
let lastFlash = 0;
let lastShootingStar = 0;

// Cross-fade state: `sceneAlpha` ramps 0 -> 1 whenever the mode changes so
// the new scene fades in smoothly instead of popping.
let sceneAlpha = 1;

let sun = null;
let moon = null;
let stars = [];
let shootingStars = [];
let clouds = [];
let rain = [];
let splashes = [];
let snow = [];
let fog = [];
let sunParticles = [];
let windGust = 0;

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildScene(mode);
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 150);
});
resize();

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// ---------------------------------------------------------------------
// Scene builders — populate lightweight particle arrays per condition.
// Counts are scaled down on small screens for performance.
// ---------------------------------------------------------------------
function scale(count) {
  if (reduceMotion) return 0;
  return isSmallScreen() ? Math.round(count * 0.5) : count;
}

function buildScene(forMode) {
  sun = null;
  moon = null;
  stars = [];
  shootingStars = [];
  clouds = [];
  rain = [];
  splashes = [];
  snow = [];
  fog = [];
  sunParticles = [];

  switch (forMode) {
    case "clear-day":
      sun = { x: width * 0.82, y: height * 0.22, r: 54 };
      sunParticles = Array.from({ length: scale(26) }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        r: rand(0.6, 2.2),
        speed: rand(4, 14),
        drift: rand(-8, 8),
        alpha: rand(0.15, 0.5),
      }));
      clouds = Array.from({ length: scale(4) }, () => makeCloud(true));
      break;

    case "clear-night":
      moon = { x: width * 0.8, y: height * 0.2, r: 40 };
      stars = Array.from({ length: scale(120) }, () => ({
        x: rand(0, width),
        y: rand(0, height * 0.75),
        r: rand(0.4, 1.8),
        tw: rand(0, Math.PI * 2),
        speed: rand(0.4, 1.4),
      }));
      clouds = Array.from({ length: scale(3) }, () => makeCloud(false, true));
      break;

    case "clouds":
      clouds = Array.from({ length: scale(7) }, () => makeCloud(true));
      break;

    case "rain":
    case "drizzle":
      clouds = Array.from({ length: scale(4) }, () => makeCloud(true, false, true));
      rain = Array.from({ length: scale(180) }, () => makeDrop());
      break;

    case "thunderstorm":
      clouds = Array.from({ length: scale(5) }, () => makeCloud(true, false, true));
      rain = Array.from({ length: scale(220) }, () => makeDrop(true));
      break;

    case "snow":
      clouds = Array.from({ length: scale(4) }, () => makeCloud(true, false, true));
      snow = Array.from({ length: scale(130) }, () => makeFlake());
      break;

    case "mist":
      fog = Array.from({ length: scale(6) }, () => makeFogBand());
      break;

    default:
      break;
  }
}

function makeCloud(day, night = false, storm = false) {
  return {
    x: rand(-250, width + 250),
    y: rand(height * 0.05, height * (storm ? 0.32 : 0.42)),
    scale: rand(0.7, storm ? 2.1 : 1.7),
    speed: rand(storm ? 14 : 6, storm ? 30 : 18),
    opacity: storm ? rand(0.22, 0.4) : night ? rand(0.1, 0.22) : rand(0.14, 0.3),
    depth: rand(0.5, 1),
  };
}

function makeDrop(storm = false) {
  return {
    x: rand(0, width),
    y: rand(-height, 0),
    len: rand(storm ? 16 : 10, storm ? 30 : 22),
    speed: rand(storm ? 650 : 480, storm ? 1000 : 760),
    drift: rand(storm ? -90 : -50, storm ? -40 : -20),
  };
}

function makeFlake() {
  return {
    x: rand(0, width),
    y: rand(-height, 0),
    r: rand(1.4, 3.8),
    speed: rand(24, 75),
    drift: rand(-25, 25),
    sway: rand(0, Math.PI * 2),
  };
}

function makeFogBand() {
  return {
    x: rand(-width * 0.4, width),
    y: rand(height * 0.25, height * 0.95),
    w: rand(260, 560),
    h: rand(50, 110),
    speed: rand(8, 24),
    opacity: rand(0.05, 0.14),
  };
}

// ---------------------------------------------------------------------
// Draw routines
// ---------------------------------------------------------------------
let lastTime = performance.now();

function draw(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (!ctx) return;

  if (sceneAlpha < 1) sceneAlpha = Math.min(1, sceneAlpha + dt * 1.4);

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = sceneAlpha;

  windGust = Math.sin(now / 4000) * 0.5 + 0.5; // slow oscillating gust factor 0..1

  switch (mode) {
    case "clear-day":
      drawSun(dt, now);
      drawFloatingParticles(dt);
      drawClouds(dt, "rgba(255,255,255,0.55)");
      break;

    case "clear-night":
      drawStars(dt, now);
      drawMoon();
      drawClouds(dt, "rgba(180,195,220,0.28)");
      break;

    case "clouds":
      drawClouds(dt, "rgba(255,255,255,0.5)");
      break;

    case "rain":
    case "drizzle":
      drawClouds(dt, "rgba(200,210,225,0.4)");
      drawRain(dt);
      break;

    case "thunderstorm":
      drawClouds(dt, "rgba(150,155,180,0.5)");
      drawRain(dt);
      drawLightning(now);
      break;

    case "snow":
      drawClouds(dt, "rgba(220,228,240,0.45)");
      drawSnow(dt);
      break;

    case "mist":
      drawFog(dt);
      break;

    default:
      break;
  }

  ctx.restore();
  rafId = requestAnimationFrame(draw);
}

// --- Sun: glowing disc + rotating light rays + heat shimmer particles ---
function drawSun(dt, now) {
  if (!sun) return;
  const t = now / 1000;

  ctx.save();
  ctx.translate(sun.x, sun.y);

  const glow = ctx.createRadialGradient(0, 0, sun.r * 0.2, 0, 0, sun.r * 5);
  glow.addColorStop(0, "rgba(255,214,140,0.55)");
  glow.addColorStop(1, "rgba(255,214,140,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, sun.r * 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(t * 0.08);
  ctx.strokeStyle = "rgba(255,220,160,0.35)";
  ctx.lineWidth = 3;
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const pulse = 1 + Math.sin(t * 1.5 + i) * 0.12;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * sun.r * 1.3, Math.sin(angle) * sun.r * 1.3);
    ctx.lineTo(Math.cos(angle) * sun.r * 2.4 * pulse, Math.sin(angle) * sun.r * 2.4 * pulse);
    ctx.stroke();
  }
  ctx.restore();

  const core = ctx.createRadialGradient(-sun.r * 0.25, -sun.r * 0.25, sun.r * 0.1, 0, 0, sun.r);
  core.addColorStop(0, "#fff6df");
  core.addColorStop(0.6, "#ffd68c");
  core.addColorStop(1, "#f2a65a");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, sun.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- Floating warm dust/light particles for sunny scenes ---
function drawFloatingParticles(dt) {
  ctx.fillStyle = "rgba(255,236,200,1)";
  for (const p of sunParticles) {
    p.y -= p.speed * dt;
    p.x += p.drift * dt;
    if (p.y < -10) { p.y = height + 10; p.x = rand(0, width); }
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    ctx.globalAlpha = p.alpha * sceneAlpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = sceneAlpha;
}

// --- Moon: soft glow + craters ---
function drawMoon() {
  if (!moon) return;
  ctx.save();
  ctx.translate(moon.x, moon.y);

  const glow = ctx.createRadialGradient(0, 0, moon.r * 0.5, 0, 0, moon.r * 3.4);
  glow.addColorStop(0, "rgba(200,220,245,0.35)");
  glow.addColorStop(1, "rgba(200,220,245,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, moon.r * 3.4, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(-moon.r * 0.3, -moon.r * 0.3, moon.r * 0.1, 0, 0, moon.r);
  core.addColorStop(0, "#fdfefe");
  core.addColorStop(1, "#c9d9ea");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, moon.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(150,170,195,0.4)";
  [[-10, -8, 6], [8, 4, 8], [-4, 14, 4]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// --- Stars: twinkling + occasional shooting stars ---
function drawStars(dt, now) {
  for (const p of stars) {
    p.tw += dt * p.speed;
    const alpha = 0.4 + Math.sin(p.tw) * 0.4;
    ctx.beginPath();
    ctx.fillStyle = `rgba(234,240,247,${Math.max(alpha, 0.15)})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (now - lastShootingStar > rand(4000, 9000)) {
    lastShootingStar = now;
    shootingStars.push({
      x: rand(width * 0.2, width * 0.9),
      y: rand(0, height * 0.25),
      vx: rand(-380, -260),
      vy: rand(140, 220),
      life: 1,
    });
  }

  ctx.lineCap = "round";
  shootingStars = shootingStars.filter((s) => s.life > 0);
  for (const s of shootingStars) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt * 0.9;
    ctx.strokeStyle = `rgba(255,255,255,${Math.max(s.life, 0)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 0.08, s.y - s.vy * 0.08);
    ctx.stroke();
  }
}

// --- Clouds: multi-layer, parallax drifting ---
function drawClouds(dt, color) {
  for (const c of clouds) {
    c.x += c.speed * dt * (0.6 + windGust * 0.5);
    if (c.x > width + 260) c.x = -260;
    drawCloudBlob(c.x, c.y, c.scale, color, c.opacity);
  }
}

function drawCloudBlob(x, y, cscale, color, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(cscale, cscale);
  ctx.globalAlpha = opacity * sceneAlpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 26, 0, 0, Math.PI * 2);
  ctx.ellipse(42, -8, 42, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(-42, 4, 46, 19, 0, 0, Math.PI * 2);
  ctx.ellipse(10, -20, 30, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- Rain: falling streaks with wind drift + ground splash ---
function drawRain(dt) {
  ctx.strokeStyle = "rgba(170,210,235,0.55)";
  ctx.lineWidth = 1.4;
  const groundY = height - 4;
  for (const p of rain) {
    p.y += p.speed * dt;
    p.x += (p.drift + windGust * -30) * dt;
    if (p.y > groundY) {
      if (Math.random() < 0.35) {
        splashes.push({ x: p.x, y: groundY, r: 1, alpha: 0.6 });
      }
      p.y = rand(-40, 0);
      p.x = rand(0, width);
    }
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.len * 0.18, p.y + p.len);
    ctx.stroke();
  }

  splashes = splashes.filter((s) => s.alpha > 0);
  for (const s of splashes) {
    s.r += dt * 40;
    s.alpha -= dt * 3.2;
    ctx.globalAlpha = Math.max(s.alpha, 0) * sceneAlpha;
    ctx.strokeStyle = "rgba(190,220,240,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.r, s.r * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = sceneAlpha;
}

// --- Snow: falling flakes with sway + wind drift ---
function drawSnow(dt) {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const p of snow) {
    p.y += p.speed * dt;
    p.sway += dt;
    p.x += Math.sin(p.sway) * 0.6 + (p.drift + windGust * 20) * dt * 0.06;
    if (p.y > height) {
      p.y = rand(-20, 0);
      p.x = rand(0, width);
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Fog: soft moving translucent bands ---
function drawFog(dt) {
  for (const p of fog) {
    p.x += p.speed * dt;
    if (p.x > width + p.w) p.x = -p.w;
    const grad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    grad.addColorStop(0, "rgba(200,210,225,0)");
    grad.addColorStop(0.5, `rgba(200,210,225,${p.opacity})`);
    grad.addColorStop(1, "rgba(200,210,225,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
}

// --- Lightning: irregular full-screen flash with occasional double-strike ---
function drawLightning(now) {
  if (now - lastFlash > rand(3200, 7000)) {
    lastFlash = now;
    flash();
    if (Math.random() < 0.35) setTimeout(flash, rand(120, 260));
  }
}

function flash() {
  if (!ctx) return;
  let opacity = 0.6;
  const step = () => {
    ctx.save();
    ctx.fillStyle = `rgba(230,235,255,${opacity})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    opacity -= 0.1;
    if (opacity > 0) requestAnimationFrame(step);
  };
  step();
}

/**
 * Public entry point — switches the active scene and repaints the body's
 * `cond-*` class (which drives the gradient in sky-themes.css). Cross-fades
 * smoothly rather than popping between scenes.
 */
export function setSkyCondition(iconKey, bodyClass) {
  document.body.className = bodyClass;
  if (mode === iconKey) return;
  mode = iconKey;
  sceneAlpha = 0;
  buildScene(mode);
}

export function startSky() {
  if (!ctx) return;
  buildScene(mode);
  lastTime = performance.now();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

// Pause rendering when the tab is hidden — saves CPU/battery.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  } else if (ctx && !rafId) {
    lastTime = performance.now();
    rafId = requestAnimationFrame(draw);
  }
});
