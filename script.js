/* ══════════════════════════════════════════════
   PERFORMANCE: reduce canvas work on low-end devices
══════════════════════════════════════════════ */
const isLowEnd = navigator.hardwareConcurrency <= 4 || window.innerWidth < 500;

/* ── BACKGROUND WATER & LANTERN ANIMATION ── */
(function() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  // Debounce resize for performance
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  let t = 0;

  // Fewer waves on low-end
  const NUM_WAVES = isLowEnd ? 3 : 5;
  const waves = [];
  for (let i = 0; i < NUM_WAVES; i++) {
    waves.push({
      amp: 10 + Math.random() * 15,
      freq: 0.002 + Math.random() * 0.003,
      speed: 0.2 + Math.random() * 0.4,
      verticalOffset: i * 0.15,
      opacity: 0.08 + (NUM_WAVES - i) * 0.04
    });
  }

  // Fewer lanterns on low-end
  const NUM_LANTERNS = isLowEnd ? 4 : 8;
  const lanterns = Array.from({length: NUM_LANTERNS}, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    speedY: 0.3 + Math.random() * 1.2,
    speedX: -0.4 + Math.random() * 0.8,
    size: 10 + Math.random() * 14,
    phase: Math.random() * TAU,
  }));

  function drawBg(){
    const W = canvas.width, H = canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#02050a');
    g.addColorStop(0.3, '#040b16');
    g.addColorStop(0.7, '#071526');
    g.addColorStop(1, '#0b1f38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawLake() {
    const W = canvas.width, H = canvas.height;
    for(let i = 0; i < NUM_WAVES; i++) {
      let w = waves[i];
      ctx.beginPath();
      ctx.moveTo(0, H + 20);
      let startY = H * (0.2 + w.verticalOffset);
      // Larger step on low-end for speed
      const step = isLowEnd ? 20 : 10;
      for (let x = 0; x <= W; x += step) {
        let y = startY
              + Math.sin(x * w.freq + t * w.speed) * w.amp
              + Math.cos(x * w.freq * 1.5 - t * w.speed * 0.7) * (w.amp * 0.5);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H + 20);
      ctx.lineTo(0, H + 20);
      ctx.closePath();
      ctx.fillStyle = `rgba(15, 60, 110, ${w.opacity})`;
      ctx.fill();
    }
  }

  function drawLanterns() {
    const W = canvas.width, H = canvas.height;
    lanterns.sort((a,b) => a.size - b.size);

    for (let l of lanterns) {
      l.y += l.speedY;
      l.x += l.speedX + Math.sin(t * 0.5 + l.phase) * 0.6;

      if (l.y > H + l.size * 5) { l.y = -l.size * 5; l.x = Math.random() * W; }
      if (l.x > W + l.size * 2) l.x = -l.size * 2;
      else if (l.x < -l.size * 2) l.x = W + l.size * 2;

      let currentY = l.y + Math.sin(t * 1.5 + l.phase) * (l.size * 0.25);
      let basePulse = 0.6 + 0.4 * Math.sin(t * 2 + l.phase);

      // Skip blur effects on low-end for big perf gain
      if (!isLowEnd) {
        ctx.beginPath();
        ctx.ellipse(l.x, currentY + l.size * 1.8, l.size * 1.2, l.size * 0.4, 0, 0, TAU);
        ctx.fillStyle = `rgba(255, 140, 0, ${0.4 * basePulse})`;
        ctx.filter = 'blur(10px)';
        ctx.fill();
        ctx.filter = 'none';

        ctx.beginPath();
        ctx.ellipse(l.x - l.speedX * 10, currentY + l.size * 2.5, l.size * 1.5, l.size * 0.6, 0, 0, TAU);
        ctx.fillStyle = `rgba(255, 100, 0, ${0.15 * basePulse})`;
        ctx.filter = 'blur(15px)';
        ctx.fill();
        ctx.filter = 'none';
      }

      // Lantern body
      ctx.beginPath();
      ctx.moveTo(l.x - l.size * 0.7, currentY - l.size);
      ctx.lineTo(l.x + l.size * 0.7, currentY - l.size);
      ctx.lineTo(l.x + l.size * 0.9, currentY + l.size);
      ctx.lineTo(l.x - l.size * 0.9, currentY + l.size);
      ctx.closePath();

      let gradient = ctx.createLinearGradient(l.x, currentY - l.size, l.x, currentY + l.size);
      gradient.addColorStop(0, 'rgba(255, 220, 100, 0.95)');
      gradient.addColorStop(0.4, 'rgba(255, 130, 20, 0.9)');
      gradient.addColorStop(1, 'rgba(200, 40, 0, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.fillStyle = '#1a0b00';
      ctx.fillRect(l.x - l.size * 0.6, currentY - l.size - 3, l.size * 1.2, 5);
      ctx.fillRect(l.x - l.size * 0.8, currentY + l.size, l.size * 1.6, 6);

      ctx.beginPath();
      ctx.ellipse(l.x, currentY + l.size * 0.3, l.size * 0.25, l.size * 0.4, 0, 0, TAU);
      ctx.fillStyle = `rgba(255, 255, 200, ${0.8 + 0.2 * basePulse})`;
      ctx.fill();

      // Glow – skip on low-end
      if (!isLowEnd) {
        let glowGrad = ctx.createRadialGradient(l.x, currentY, 0, l.x, currentY, l.size * 5);
        glowGrad.addColorStop(0, `rgba(255, 160, 20, ${0.45 * basePulse})`);
        glowGrad.addColorStop(0.4, `rgba(255, 100, 0, ${0.15 * basePulse})`);
        glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.beginPath();
        ctx.arc(l.x, currentY, l.size * 5, 0, TAU);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      }
    }
  }

  // Throttle to ~30fps on low-end, 60fps on high-end
  let lastFrame = 0;
  const FPS_CAP = isLowEnd ? 33 : 16;

  function frame(ts) {
    if (ts - lastFrame < FPS_CAP) { requestAnimationFrame(frame); return; }
    lastFrame = ts;
    t += isLowEnd ? 0.025 : 0.015;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBg();
    drawLake();
    drawLanterns();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ── TYPED ANIMATION IN HERO ── */
(function() {
  const el = document.getElementById('heroTyped');
  if (!el) return;
  const phrases = [
    'Alfa Byte Computers',
    'Learn. Grow. Succeed.',
    'MS-CIT | Tally | Python',
    'Quality Training Since 1993',
    'Indapur\'s #1 Computer Institute',
  ];
  let phraseIdx = 0, charIdx = 0, deleting = false;

  function tick() {
    const current = phrases[phraseIdx];
    if (!deleting) {
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(tick, 1800);
        return;
      }
      setTimeout(tick, 65);
    } else {
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 35);
    }
  }
  setTimeout(tick, 800);
})();

/* ── STATS COUNTER ── */
function animateCounters(){
  document.querySelectorAll('.counter').forEach(el=>{
    const target = +el.dataset.target;
    let current = 0;
    const step = target / 80;
    const timer = setInterval(()=>{
      current += step;
      if(current >= target){ current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString();
    }, 20);
  });
}
const statsObs = new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting){ animateCounters(); statsObs.disconnect(); }
},{threshold:0.3});
const statsEl = document.querySelector('.stats-section');
if(statsEl) statsObs.observe(statsEl);

/* ── HEADER SCROLL EFFECT ── */
window.addEventListener('scroll',()=>{
  const h = document.getElementById('mainHeader');
  if(window.scrollY > 80){ h.style.boxShadow = '0 4px 30px rgba(74,29,150,0.15)'; }
  else { h.style.boxShadow = '0 2px 20px rgba(74,29,150,0.10)'; }
}, {passive: true});

/* ── COURSE TAB FILTER ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // 1. Update active tab styling
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 2. Filter courses
    const filterValue = btn.getAttribute('data-filter');
    const courses = document.querySelectorAll('.course-card');

    courses.forEach(course => {
      if (filterValue === 'all') {
        course.style.display = ''; // Reset to default display
      } else if (course.getAttribute('data-category') === filterValue) {
        course.style.display = '';
      } else {
        course.style.display = 'none';
      }
    });
  });
});

/* ── ENROLL LINK: pass course name to enroll.html ── */
document.querySelectorAll('.course-enroll').forEach(link => {
  link.addEventListener('click', function(e) {
    // href already has ?course= param, just let it navigate
  });
});

/* ── CLICK GLOW EFFECT ── */
document.addEventListener("click", function(e) {
  const glow = document.createElement("span");
  glow.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:30px;height:30px;border-radius:50%;background:rgba(255,140,0,0.8);transform:translate(-50%,-50%) scale(0);transition:transform 0.4s ease-out, opacity 0.6s ease-out;pointer-events:none;z-index:9999;box-shadow: 0 0 20px 10px rgba(255,140,0,0.6);`;
  document.body.appendChild(glow);
  glow.getBoundingClientRect(); // force reflow
  glow.style.transform = 'translate(-50%,-50%) scale(5)';
  glow.style.opacity = '0';
  setTimeout(() => glow.remove(), 600);
});

/* ── CUSTOM CURSOR (desktop only) ── */
const dotWrapper = document.getElementById('cursor-dot-wrapper');
const auraWrapper = document.getElementById('cursor-aura-wrapper');
const aura = document.querySelector('.cursor-aura');

if (dotWrapper && auraWrapper && !('ontouchstart' in window)) {
  let mouseX = 0, mouseY = 0, auraX = 0, auraY = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    dotWrapper.style.transform = `translate3d(${mouseX}px,${mouseY}px,0)`;
  }, {passive: true});

  function animateCursor() {
    auraX += (mouseX - auraX) * 0.2;
    auraY += (mouseY - auraY) * 0.2;
    auraWrapper.style.transform = `translate3d(${auraX}px,${auraY}px,0)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter', () => aura.classList.add('hovered'));
    el.addEventListener('mouseleave', () => aura.classList.remove('hovered'));
  });
} else if (dotWrapper) {
  // Hide cursor elements on touch devices
  dotWrapper.style.display = 'none';
  if (auraWrapper) auraWrapper.style.display = 'none';
}

/* =========================
   SCROLL REVEAL
========================= */

function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");

  reveals.forEach((el) => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;

    if (elementTop < windowHeight - 50) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("DOMContentLoaded", revealOnScroll);
revealOnScroll(); // call initially

/* ══════════════════════════════
   MOBILE MENU TOGGLE
══════════════════════════════ */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navLinks = document.querySelector('.nav-links');

if (hamburgerBtn && navLinks) {
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('open');
    navLinks.classList.toggle('active-menu');
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('open');
      navLinks.classList.remove('active-menu');
    });
  });
}