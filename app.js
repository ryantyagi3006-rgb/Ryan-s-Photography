/* ═══════════════════════════════════════════════════
   RYAN TYAGI — Photography
   Dynamic chapter builder + Apple scroll engine
   ═══════════════════════════════════════════════════ */
'use strict';

/* ── Intro hero = first photo in the config ─────── */
const heroImg = document.getElementById('introHeroImg');
if (heroImg && window.PHOTOS?.length) {
  heroImg.src = 'photos/' + window.PHOTOS[0].file;
  heroImg.alt = window.PHOTOS[0].title + ' ' + window.PHOTOS[0].titleItalic;
}

/* ── Build chapters from window.PHOTOS config ────── */
const photos = window.PHOTOS || [];
const root   = document.getElementById('chaptersRoot');
const dotNav = document.getElementById('dotNav');

const PIN_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

// Derive a URL-safe slug from a filename  (e.g. "haridwar.jpg" → "haridwar")
const slug = f => f.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Full section list for keyboard navigation
const SECTIONS = ['intro', ...photos.map(p => slug(p.file)), 'end'];

// ── Seed dot nav with intro dot ──────────────────
dotNav.innerHTML = `<a href="#intro" class="dot active" data-section="intro" title="Intro"></a>`;

photos.forEach((photo, i) => {
  const id         = slug(photo.file);
  const num        = String(i + 1).padStart(2, '0');
  const shortTitle = photo.titleItalic || photo.title;

  /* ── Dot only (no nav chapter links) ── */
  dotNav.insertAdjacentHTML('beforeend',
    `<a href="#${id}" class="dot" data-section="${id}" title="${shortTitle}"></a>`
  );

  /* ── Chapter HTML ── */
  const quoteLines = (photo.quote || '').split('\n').join('<br>');

  root.insertAdjacentHTML('beforeend', `
    <section class="chapter" id="${id}" data-section="${id}">
      <div class="chapter-pin">
        <div class="chapter-img-wrap">
          <img src="photos/${photo.file}" alt="${photo.title} ${photo.titleItalic}" class="chapter-img" loading="lazy">
          <div class="chapter-vignette"></div>
        </div>

        <!-- Main text overlay (appears ~12%–52% through chapter scroll) -->
        <div class="chapter-overlay" data-enter="0.12" data-exit="0.52">
          <span class="chapter-num-badge">${num}</span>
          <h2 class="chapter-title">
            ${photo.title}<br><em>${photo.titleItalic}</em>
          </h2>
          <div class="chapter-rule"></div>
          <p class="chapter-location">${PIN_SVG} ${photo.location}</p>
          <p class="chapter-body">${photo.body}</p>
        </div>

        <!-- Pull quote overlay (appears ~56%–88% through chapter scroll) -->
        <div class="chapter-overlay quote-overlay" data-enter="0.56" data-exit="0.88">
          <p class="chapter-quote">${quoteLines}</p>
        </div>

      </div>
      <div class="chapter-scroll-space"></div>

      <!-- Full-photo reveal — separate sticky section, outside the pin -->
      <div class="chapter-reveal-section" data-enter="0.88">
        <div class="chapter-reveal-img-wrap">
          <img src="photos/${photo.file}" alt="${photo.title} ${photo.titleItalic}" class="chapter-reveal-img" loading="lazy">
        </div>
        <div class="chapter-reveal-caption">
          <span class="chapter-reveal-title">${photo.title} <em>${photo.titleItalic}</em></span>
          <div class="chapter-reveal-dot"></div>
          <span class="chapter-reveal-loc">${photo.location}</span>
        </div>
      </div>
    </section>
  `);
});

/* ── End dot ──────────────────────────────────────── */
dotNav.insertAdjacentHTML('beforeend',
  `<a href="#end" class="dot" data-section="end" title="Fin"></a>`
);

/* ── Update end section photo count ─────────────── */
const n = photos.length;
const countEl = document.getElementById('endCount');
if (countEl) countEl.textContent = `${n} Photograph${n !== 1 ? 's' : ''}`;

/* ── Progress bar ───────────────────────────────── */
const bar = document.createElement('div');
bar.id = 'progressBar';
document.body.appendChild(bar);

/* ── Nav scroll state ───────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () =>
  nav.classList.toggle('scrolled', window.scrollY > 50), { passive: true });

/* ── Scroll-begin button ────────────────────────── */
document.getElementById('scrollBegin').addEventListener('click', () => {
  const first = photos[0] ? document.getElementById(slug(photos[0].file)) : null;
  (first || document.getElementById('end'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ── Active section tracking ────────────────────── */
let activeSect = 'intro';

function setActive(id) {
  if (id === activeSect) return;
  activeSect = id;
  document.querySelectorAll('.dot').forEach(d =>
    d.classList.toggle('active', d.dataset.section === id)
  );
  document.querySelectorAll('.nav-chap').forEach(a =>
    a.classList.toggle('active', a.dataset.section === id)
  );
}

const sectIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) setActive(e.target.dataset.section); });
}, { threshold: 0.3 });
document.querySelectorAll('[data-section]').forEach(s => sectIO.observe(s));

/* ── End section reveal ─────────────────────────── */
const endIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.end-reveal').forEach(el => el.classList.add('visible'));
    endIO.unobserve(e.target);
  });
}, { threshold: 0.15 });
const endSect = document.getElementById('end');
if (endSect) endIO.observe(endSect);

/* ── Chapter scroll engine ──────────────────────── */
const chapters = [...document.querySelectorAll('.chapter')];

function getProgress(chapter) {
  const rect     = chapter.getBoundingClientRect();
  const scrollable = chapter.offsetHeight - window.innerHeight;
  return Math.max(0, Math.min(1, -rect.top / scrollable));
}

function tickChapters() {
  chapters.forEach(ch => {
    const rect = ch.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight * 1.5) return;

    const p   = getProgress(ch);
    const img = ch.querySelector('.chapter-img');

    /* Apple-style: subtle zoom + brighten on scroll */
    img.style.transform = `scale(${(1 + p * 0.07).toFixed(4)})`;
    img.style.filter    = `brightness(${(0.52 + p * 0.22).toFixed(3)}) saturate(1.12)`;

    /* Show/hide text overlays at their thresholds */
    ch.querySelectorAll('.chapter-overlay').forEach(ov => {
      const enter = parseFloat(ov.dataset.enter ?? 0.12);
      const exit  = parseFloat(ov.dataset.exit  ?? 0.52);
      ov.classList.toggle('visible', p >= enter && p <= exit);
    });

    /* Full-photo reveal section (sits after the pin in flow) */
    const reveal = ch.querySelector('.chapter-reveal-section');
    if (reveal) {
      const enter = parseFloat(reveal.dataset.enter ?? 0.88);
      reveal.classList.toggle('visible', p >= enter);
    }
  });
}

function tickBar() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = ((window.scrollY / total) * 100).toFixed(2) + '%';
}

/* ── rAF-throttled scroll loop ──────────────────── */
window._tick = () => { tickChapters(); tickBar(); }; // exposed for debug
let pending = false;
window.addEventListener('scroll', () => {
  if (!pending) {
    pending = true;
    requestAnimationFrame(() => { window._tick(); pending = false; });
  }
}, { passive: true });

/* ── Smooth anchor clicks ───────────────────────── */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ── Keyboard navigation ────────────────────────── */
document.addEventListener('keydown', e => {
  const i = SECTIONS.indexOf(activeSect);
  if (e.key === 'ArrowDown' && i < SECTIONS.length - 1) {
    e.preventDefault();
    document.getElementById(SECTIONS[i + 1])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (e.key === 'ArrowUp' && i > 0) {
    e.preventDefault();
    document.getElementById(SECTIONS[i - 1])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* ── Init ───────────────────────────────────────── */
tickChapters();
tickBar();
