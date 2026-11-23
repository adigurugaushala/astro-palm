/* Guruji Palmistry — the motion layer.
 *
 * Scroll reveals, staggered grids, counters, a reading progress bar, page
 * transitions and the small hover touches that make the site feel alive.
 *
 * Three rules it keeps:
 *   1. Nothing is hidden unless this file is running. The "before" state lives
 *      under html.motion-ready, which only this file sets, so a reader whose
 *      JavaScript never arrives sees the whole page.
 *   2. prefers-reduced-motion means what it says: everything is shown at once,
 *      no transforms, no parallax, no counters running up.
 *   3. Only transform and opacity are animated, so nothing reflows mid-scroll.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  // The selectors that get a reveal without anyone having to mark them up.
  const AUTO = [
    '.sp-section > .sp-wrap > *',
    '.sp-card', '.sp-cat', '.sp-pillar', '.learn-outline li',
    '.sp-panel', '.sp-h2', '.sp-h3', '.sp-feature-img',
    '[data-reveal]'
  ].join(',');

  const STAGGER_PARENTS = '.grid, .sp-grid, .learn-outline, .sp-cards';

  let io = null;
  let scheduled = false;

  const prefersStill = () => reduced.matches;

  /* ---------------------------------------------------------------- reveals */

  function markup(el, index) {
    if (el.dataset.revealReady) return;
    el.dataset.revealReady = '1';
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
    // Items that sit side by side come in one after another, not all at once.
    const parent = el.parentElement;
    if (parent && parent.matches && parent.matches(STAGGER_PARENTS)) {
      const i = Math.min(index, 7);
      el.style.setProperty('--reveal-delay', (i * 70) + 'ms');
    }
  }

  function reveal(el) {
    el.classList.add('is-revealed');
    el.style.willChange = '';
  }

  function scan() {
    scheduled = false;
    if (prefersStill()) {
      document.querySelectorAll('[data-reveal]').forEach(reveal);
      return;
    }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          reveal(e.target);
          io.unobserve(e.target);
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    const seen = new Map();
    document.querySelectorAll(AUTO).forEach((el) => {
      if (el.closest('#guruji-loader, header, footer, .adm, .guruji-area, #page-admin, #page-guruji')) return;
      if (el.dataset.revealReady) return;
      const parent = el.parentElement;
      const n = seen.get(parent) || 0;
      seen.set(parent, n + 1);
      markup(el, n);
      // Anything already on screen when the page loads is shown at once —
      // a reveal the reader never sees is just a flash.
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.92 && box.bottom > 0) reveal(el);
      else io.observe(el);
    });
    counters();
    sweepSoon(260);
  }

  const refresh = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  };

  /* A safety net. An observer can miss an element during a fast scroll or a
   * jump to an anchor, and an element that stays invisible is far worse than
   * one that appears without its animation. After every scroll — and on a
   * timer — anything the reader could already have seen is simply shown. */
  function sweep() {
    const limit = window.innerHeight * 1.05;
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
      const box = el.getBoundingClientRect();
      if (box.top < limit) {
        reveal(el);
        if (io) io.unobserve(el);
      }
    });
  }

  let sweepTimer = null;
  function sweepSoon(delay) {
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(sweep, delay || 160);
  }

  /* --------------------------------------------------------------- counters */

  function counters() {
    document.querySelectorAll('[data-countup]').forEach((el) => {
      if (el.dataset.countDone) return;
      el.dataset.countDone = '1';
      const target = Number(el.dataset.countup || el.textContent.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(target) || target <= 0) return;
      const suffix = el.dataset.countSuffix || '';
      if (prefersStill()) { el.textContent = target + suffix; return; }
      const run = () => {
        const started = performance.now();
        const ms = 1100;
        const tick = (now) => {
          const t = Math.min(1, (now - started) / ms);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      const once = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { run(); once.disconnect(); }
      }, { threshold: 0.4 });
      once.observe(el);
    });
  }

  /* -------------------------------------------------------- reading progress */

  function progressBar() {
    const bar = document.createElement('div');
    bar.className = 'motion-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------ page change */

  function pageTransition() {
    // site.js swaps the visible page in place; a short fade hides the jump.
    const main = document.querySelector('main') || document.body;
    let last = location.pathname;
    const onChange = () => {
      if (location.pathname === last) return;
      last = location.pathname;
      if (prefersStill()) return;
      main.classList.remove('is-entering');
      void main.offsetWidth;          // restart the animation
      main.classList.add('is-entering');
      setTimeout(() => main.classList.remove('is-entering'), 420);
    };
    addEventListener('popstate', onChange);
    const push = history.pushState;
    history.pushState = function () { push.apply(this, arguments); onChange(); refresh(); };
    const replace = history.replaceState;
    history.replaceState = function () { replace.apply(this, arguments); refresh(); };
  }

  /* ------------------------------------------------------- pointer reactions */

  function pointerPolish() {
    if (prefersStill() || !fine.matches) return;
    // The main calls to action lean very slightly towards the cursor.
    document.addEventListener('pointermove', (e) => {
      const btn = e.target.closest && e.target.closest('.gold-gradient-btn, .crimson-gradient-btn');
      if (!btn || btn.dataset.noMagnet) return;
      const r = btn.getBoundingClientRect();
      if (r.width > 420) return;                       // not full-width buttons
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      btn.style.setProperty('--magnet-x', (dx * 5).toFixed(2) + 'px');
      btn.style.setProperty('--magnet-y', (dy * 4).toFixed(2) + 'px');
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const btn = e.target.closest && e.target.closest('.gold-gradient-btn, .crimson-gradient-btn');
      if (!btn) return;
      btn.style.removeProperty('--magnet-x');
      btn.style.removeProperty('--magnet-y');
    }, { passive: true });
  }

  /* -------------------------------------------------------------------- boot */

  function boot() {
    root.classList.add('motion-ready');
    if (prefersStill()) root.classList.add('motion-still');
    scan();
    progressBar();
    pageTransition();
    pointerPolish();
    addEventListener('scroll', () => sweepSoon(140), { passive: true });
    addEventListener('resize', () => sweepSoon(200), { passive: true });
    addEventListener('hashchange', () => sweepSoon(240));
    addEventListener('load', () => sweepSoon(400));
    setInterval(sweep, 1500);   // nothing stays hidden for longer than this

    // Pages are rendered after the fact, so watch for new content.
    const mo = new MutationObserver(() => refresh());
    mo.observe(document.body, { childList: true, subtree: true });

    reduced.addEventListener('change', () => {
      root.classList.toggle('motion-still', prefersStill());
      document.querySelectorAll('[data-reveal]').forEach(reveal);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.GurujiMotion = { refresh, reveal: (el) => reveal(el), get reduced() { return prefersStill(); } };
})();
