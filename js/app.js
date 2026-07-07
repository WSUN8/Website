import { timelineData, legendsData, arenaData, portraitLooks, jerseysData, courtMoments } from './data.js';
import { portraitSVG, jerseySVG, courtSVG } from './graphics.js';

/* ---------- nav ---------- */
const nav = document.getElementById('site-nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

const sections = [...document.querySelectorAll('main .section, #hero')];
const navAnchors = [...navLinks.querySelectorAll('a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAnchors.forEach(a => a.classList.toggle('active', a.dataset.section === id));
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

/* ---------- scroll reveal ---------- */
document.querySelectorAll('.section-inner, #intro .lede').forEach(el => el.classList.add('reveal'));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* hero hint + scroll cue fade */
const heroHint = document.getElementById('hero-hint');
const scrollCue = document.getElementById('scroll-cue');
window.addEventListener('scroll', () => {
  const p = Math.min(window.scrollY / 300, 1);
  scrollCue.style.opacity = String(1 - p);
}, { passive: true });
setTimeout(() => { heroHint.style.opacity = '0'; }, 6000);

/* ---------- timeline ---------- */
const track = document.getElementById('timeline-track');
timelineData.forEach((item, i) => {
  const el = document.createElement('div');
  el.className = 'timeline-item';
  el.innerHTML = `
    <div class="timeline-head">
      <p class="timeline-year">${item.year}</p>
      <p class="timeline-title">${item.title}</p>
    </div>
    <div class="timeline-body"><p>${item.body}</p></div>
  `;
  el.addEventListener('click', () => {
    const wasOpen = el.classList.contains('open');
    track.querySelectorAll('.timeline-item.open').forEach(o => o.classList.remove('open'));
    if (!wasOpen) el.classList.add('open');
  });
  track.appendChild(el);
  if (i === 0) el.classList.add('open');
});

/* ---------- legends ---------- */
const grid = document.getElementById('legends-grid');
legendsData.forEach(player => {
  const card = document.createElement('div');
  card.className = 'legend-card';
  card.innerHTML = `
    <div class="legend-card-inner">
      <div class="legend-face legend-front">
        <div class="legend-portrait">${portraitSVG({ ...player, ...portraitLooks[player.number] })}</div>
        <span class="legend-number">${player.number}</span>
        <div class="legend-caption">
          <h4 class="legend-name">${player.name}</h4>
          <span class="legend-role">${player.role}</span>
        </div>
      </div>
      <div class="legend-face legend-back">
        <h4 class="legend-name">${player.name}</h4>
        ${player.stats.map(([label, value]) => `<div class="legend-stat-row"><span>${label}</span><b>${value}</b></div>`).join('')}
        <p>${player.blurb}</p>
      </div>
    </div>
  `;
  card.addEventListener('click', () => card.classList.toggle('flipped'));
  grid.appendChild(card);
});

/* ---------- jersey gallery ---------- */
const jerseyGrid = document.getElementById('jersey-grid');
jerseysData.forEach(jersey => {
  const card = document.createElement('div');
  card.className = 'jersey-card';
  card.innerHTML = `
    <div class="jersey-art">${jerseySVG(jersey)}</div>
    <div class="jersey-info">
      <span class="jersey-era">${jersey.era}</span>
      <h4 class="jersey-name">${jersey.name}</h4>
      <span class="jersey-years">${jersey.years}</span>
      <p class="jersey-blurb">${jersey.blurb}</p>
    </div>
  `;
  // tap toggles the info on touch devices; hover handles the rest via CSS
  card.addEventListener('click', () => {
    const wasOpen = card.classList.contains('open');
    jerseyGrid.querySelectorAll('.jersey-card.open').forEach(c => c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
  });
  jerseyGrid.appendChild(card);
});

/* ---------- court diagram ---------- */
const courtFigure = document.getElementById('court-figure');
if (courtFigure) {
  courtFigure.innerHTML = courtSVG(courtMoments);
  const detailLabel = document.getElementById('court-detail-label');
  const detailText = document.getElementById('court-detail-text');
  const detailPanel = document.getElementById('court-detail');
  const byHotspot = Object.fromEntries(courtMoments.map(m => [m.hotspot, m]));

  const selectHotspot = (el) => {
    const moment = byHotspot[el.dataset.hotspot];
    if (!moment) return;
    courtFigure.querySelectorAll('.court-hotspot.active').forEach(h => h.classList.remove('active'));
    el.classList.add('active');
    detailLabel.textContent = moment.label;
    detailText.textContent = moment.text;
    detailPanel.classList.add('revealed');
  };

  courtFigure.querySelectorAll('.court-hotspot').forEach(el => {
    el.addEventListener('click', () => selectHotspot(el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectHotspot(el); }
    });
  });
}

/* ---------- arena slider ---------- */
const arenaRoot = document.getElementById('arena-slider');
const track2 = document.createElement('div');
track2.className = 'arena-track';
arenaData.forEach(a => {
  const slide = document.createElement('div');
  slide.className = 'arena-slide';
  slide.innerHTML = `<h4>${a.name}</h4><span class="arena-years">${a.years}</span><p>${a.body}</p>`;
  track2.appendChild(slide);
});

const dots = document.createElement('div');
dots.className = 'arena-dots';
arenaData.forEach((_, i) => {
  const dot = document.createElement('span');
  dot.className = 'arena-dot';
  dot.addEventListener('click', () => goToArenaSlide(i));
  dots.appendChild(dot);
});

const prevBtn = document.createElement('button');
prevBtn.className = 'arena-nav-btn arena-prev';
prevBtn.textContent = '←';
prevBtn.setAttribute('aria-label', 'Previous');

const nextBtn = document.createElement('button');
nextBtn.className = 'arena-nav-btn arena-next';
nextBtn.textContent = '→';
nextBtn.setAttribute('aria-label', 'Next');

arenaRoot.appendChild(track2);
arenaRoot.appendChild(prevBtn);
arenaRoot.appendChild(nextBtn);
arenaRoot.appendChild(dots);

let arenaIndex = 0;
function goToArenaSlide(i) {
  arenaIndex = (i + arenaData.length) % arenaData.length;
  track2.style.transform = `translateX(-${arenaIndex * 100}%)`;
  dots.querySelectorAll('.arena-dot').forEach((d, idx) => d.classList.toggle('active', idx === arenaIndex));
}
prevBtn.addEventListener('click', () => goToArenaSlide(arenaIndex - 1));
nextBtn.addEventListener('click', () => goToArenaSlide(arenaIndex + 1));
goToArenaSlide(0);

let touchStartX = null;
arenaRoot.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
arenaRoot.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) goToArenaSlide(arenaIndex + (dx < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });
