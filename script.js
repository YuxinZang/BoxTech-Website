const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const revealTargets = document.querySelectorAll(".reveal");
const starfield = document.querySelector("[data-starfield]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
window.__boxtechReduceMotion = reduceMotion;

const setHeaderState = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  header.classList.toggle("is-open", isOpen);
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    header.classList.remove("is-open");
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.18 }
);

revealTargets.forEach((target) => observer.observe(target));

window.addEventListener(
  "pointermove",
  (event) => {
    document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
    document.documentElement.style.setProperty("--my", `${event.clientY}px`);
  },
  { passive: true }
);

const setupStarfield = () => {
  if (!starfield) return;

  const canvas = starfield;
  const context = canvas.getContext("2d");
  if (!context) return;
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
  let width = 0;
  let height = 0;
  let stars = [];
  let comets = [];
  let frameId = 0;
  let lastComet = 0;

  const random = (min, max) => Math.random() * (max - min) + min;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.dataset.ready = "true";

    const starCount = Math.min(260, Math.max(120, Math.floor((width * height) / 6800)));
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: random(0.25, 1),
      size: random(0.6, 2.2),
      twinkle: random(0, Math.PI * 2),
      speed: random(0.06, 0.32)
    }));
  };

  const addComet = () => {
    comets.push({
      x: random(width * 0.18, width * 0.86),
      y: random(-80, height * 0.44),
      length: random(120, 240),
      vx: random(5.5, 8.5),
      vy: random(2.8, 4.6),
      life: 0,
      maxLife: random(72, 110)
    });
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";

    const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 260);
    glow.addColorStop(0, pointer.active ? "rgba(69,199,255,0.18)" : "rgba(69,199,255,0.08)");
    glow.addColorStop(1, "rgba(69,199,255,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    for (const star of stars) {
      star.twinkle += star.speed * 0.04;
      star.y += star.z * 0.018;
      star.x += star.z * 0.006;

      if (star.y > height + 8) star.y = -8;
      if (star.x > width + 8) star.x = -8;

      const dx = pointer.x - star.x;
      const dy = pointer.y - star.y;
      const distance = Math.hypot(dx, dy);
      const pull = pointer.active && distance < 150 ? (150 - distance) / 150 : 0;
      const x = star.x - dx * pull * 0.025;
      const y = star.y - dy * pull * 0.025;
      const alpha = 0.22 + Math.sin(star.twinkle + time * 0.0015) * 0.24 + star.z * 0.5 + pull * 0.3;

      context.beginPath();
      context.fillStyle = `rgba(${star.z > 0.72 ? "168,121,255" : "176,226,255"}, ${Math.min(alpha, 1)})`;
      context.arc(x, y, star.size + pull * 0.9, 0, Math.PI * 2);
      context.fill();
    }

    if (time - lastComet > 4200 && Math.random() > 0.42) {
      addComet();
      lastComet = time;
    }

    comets = comets.filter((comet) => {
      comet.x += comet.vx;
      comet.y += comet.vy;
      comet.life += 1;

      const opacity = 1 - comet.life / comet.maxLife;
      const gradient = context.createLinearGradient(comet.x, comet.y, comet.x - comet.length, comet.y - comet.length * 0.42);
      gradient.addColorStop(0, `rgba(73,230,194,${opacity * 0.75})`);
      gradient.addColorStop(0.35, `rgba(69,199,255,${opacity * 0.42})`);
      gradient.addColorStop(1, "rgba(69,199,255,0)");
      context.strokeStyle = gradient;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(comet.x, comet.y);
      context.lineTo(comet.x - comet.length, comet.y - comet.length * 0.42);
      context.stroke();

      return comet.life < comet.maxLife && comet.x < width + comet.length;
    });

    if (!reduceMotion) {
      frameId = requestAnimationFrame(draw);
    }
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  resize();
  window.__boxtechStarfieldReady = true;
  draw(performance.now());

  window.addEventListener("pagehide", () => cancelAnimationFrame(frameId));
};

const setupTiltCards = () => {
  if (reduceMotion) return;

  const tiltTargets = document.querySelectorAll(
    ".hero__panel, .platform-console, .capability-card, .collab-card, .outcome-card, .process-step, .platform-item"
  );

  tiltTargets.forEach((target) => {
    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 6;
      const rotateY = (x - 0.5) * 8;

      target.style.setProperty("--shine-x", `${x * 100}%`);
      target.style.setProperty("--shine-y", `${y * 100}%`);
      target.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    }, { passive: true });

    target.addEventListener("pointerleave", () => {
      target.style.transform = "";
      target.style.removeProperty("--shine-x");
      target.style.removeProperty("--shine-y");
    });
  });
};

setupStarfield();
setupTiltCards();
