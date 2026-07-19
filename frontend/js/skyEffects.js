// Signature visual: a full-viewport canvas layered behind the glass UI
// that renders lightweight particle effects matching the current
// condition — stars, drifting clouds, rain, snow, fog bands, and
// lightning flashes for storms. Pure canvas 2D, no dependencies.

const canvas = document.getElementById("sky-canvas");
const ctx = canvas?.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let particles = [];
let mode = "clear-day";
let rafId = null;
let lastFlash = 0;

function resize() {
  if (!canvas) return;
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function buildParticles(forMode) {
  const count = reduceMotion ? 0 : {
    "clear-night": 90,
    clouds: 6,
    rain: 220,
    thunderstorm: 260,
    snow: 140,
    mist: 5,
  }[forMode] ?? 0;

  particles = Array.from({ length: count }, () => makeParticle(forMode));
}

function makeParticle(forMode) {
  switch (forMode) {
    case "clear-night":
      return {
        x: rand(0, width),
        y: rand(0, height * 0.7),
        r: rand(0.4, 1.8),
        tw: rand(0, Math.PI * 2),
        speed: rand(0.4, 1.2),
      };
    case "clouds":
      return {
        x: rand(-200, width),
        y: rand(20, height * 0.4),
        scale: rand(0.6, 1.6),
        speed: rand(6, 16),
      };
    case "rain":
      return {
        x: rand(0, width),
        y: rand(-height, 0),
        len: rand(10, 22),
        speed: rand(500, 800),
        drift: rand(-40, -20),
      };
    case "thunderstorm":
      return {
        x: rand(0, width),
        y: rand(-height, 0),
        len: rand(12, 26),
        speed: rand(600, 950),
        drift: rand(-60, -30),
      };
    case "snow":
      return {
        x: rand(0, width),
        y: rand(-height, 0),
        r: rand(1.5, 3.6),
        speed: rand(30, 80),
        drift: rand(-20, 20),
        sway: rand(0, Math.PI * 2),
      };
    case "mist":
      return {
        x: rand(-width * 0.3, width),
        y: rand(height * 0.3, height * 0.9),
        w: rand(200, 480),
        speed: rand(8, 20),
        opacity: rand(0.04, 0.12),
      };
    default:
      return {};
  }
}

let lastTime = performance.now();

function draw(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  switch (mode) {
    case "clear-night":
      for (const p of particles) {
        p.tw += dt * p.speed;
        const alpha = 0.4 + Math.sin(p.tw) * 0.4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(234,240,247,${Math.max(alpha, 0.15)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case "clouds":
      for (const p of particles) {
        p.x += p.speed * dt;
        if (p.x > width + 200) p.x = -220;
        drawCloudBlob(p.x, p.y, p.scale);
      }
      break;

    case "rain":
    case "thunderstorm":
      ctx.strokeStyle = "rgba(150,205,230,0.55)";
      ctx.lineWidth = 1.4;
      for (const p of particles) {
        p.y += p.speed * dt;
        p.x += p.drift * dt;
        if (p.y > height) {
          p.y = rand(-40, 0);
          p.x = rand(0, width);
        }
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.len * 0.15, p.y + p.len);
        ctx.stroke();
      }
      if (mode === "thunderstorm") drawLightning(now);
      break;

    case "snow":
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const p of particles) {
        p.y += p.speed * dt;
        p.sway += dt;
        p.x += Math.sin(p.sway) * 0.6 + p.drift * dt * 0.05;
        if (p.y > height) {
          p.y = rand(-20, 0);
          p.x = rand(0, width);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case "mist":
      for (const p of particles) {
        p.x += p.speed * dt;
        if (p.x > width + p.w) p.x = -p.w;
        const grad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
        grad.addColorStop(0, "rgba(200,210,225,0)");
        grad.addColorStop(0.5, `rgba(200,210,225,${p.opacity})`);
        grad.addColorStop(1, "rgba(200,210,225,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, p.y, p.w, 60);
      }
      break;

    default:
      break;
  }

  rafId = requestAnimationFrame(draw);
}

function drawCloudBlob(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 26, 0, 0, Math.PI * 2);
  ctx.ellipse(40, -6, 40, 20, 0, 0, Math.PI * 2);
  ctx.ellipse(-40, 4, 44, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLightning(now) {
  if (now - lastFlash > rand(3500, 7500)) {
    lastFlash = now;
    flash();
  }
}

function flash() {
  if (!ctx) return;
  let opacity = 0.55;
  const step = () => {
    ctx.save();
    ctx.fillStyle = `rgba(230,235,255,${opacity})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    opacity -= 0.09;
    if (opacity > 0) requestAnimationFrame(step);
  };
  step();
}

/**
 * Public entry point — switches the active particle mode and repaints
 * the body's `cond-*` class (which drives the gradient in
 * sky-themes.css). Call once per fresh weather reading.
 */
export function setSkyCondition(iconKey, bodyClass) {
  if (mode === iconKey) {
    document.body.className = bodyClass;
    return;
  }
  mode = iconKey;
  document.body.className = bodyClass;
  buildParticles(mode);
}

export function startSky() {
  if (!ctx) return;
  buildParticles(mode);
  lastTime = performance.now();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}
