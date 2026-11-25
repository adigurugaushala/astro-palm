// GURUJI PALMISTRY — site pages, routing, enquiries, payments and admin
//
// app.js runs the original booking flows (consultation, pooja, upload, chat,
// mantras). This file adds the content-driven pages and real page addresses:
//   /about  /services  /services/<slug>  /services/category/<id>  /reiki-healing
//   /courses  /courses/<slug>  /resources  /resources/<slug>  /faqs  /contact
//   /privacy-policy  /terms  /cancellation-refund-policy  /track  /admin …
// Page content comes from content-data.js and is refreshed from /api/content,
// where the admin dashboard saves edits.

(function () {
  'use strict';

  const SITE = window.SITE = {
    content: window.GURUJI_CONTENT,
    payments: 'simulated',
    paymentEnv: null,
    serverOnline: false
  };
  const C = () => SITE.content;

  // -------------------------------------------------------------------------
  // Small helpers
  // -------------------------------------------------------------------------
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const category = (id) => (C().serviceCategories || []).find(c => c.id === id);
  const servicesIn = (cat) => (C().services || []).filter(s => s.category === cat && s.published !== false);
  const serviceBySlug = (slug) => (C().services || []).find(s => s.slug === slug && s.published !== false);
  const courseBySlug = (slug) => (C().courses || []).find(c => c.slug === slug && c.published !== false);
  const articleBySlug = (slug) => (C().articles || []).find(a => a.slug === slug && a.published !== false);
  const imageFor = (svc) => svc.image || (category(svc.category) || {}).image || '/assets/svc/guidance.svg';
  const waLink = (text) => {
    const n = String((C().settings || {}).whatsapp || '').replace(/\D/g, '');
    return n ? `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}` : '';
  };
  const formatDate = (iso) => {
    const d = new Date(iso + (iso && iso.length === 10 ? 'T00:00:00' : ''));
    return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  // The four slots the seeker's upload form offers, in its order.
  const PALM_SLOTS = { 1: 'Left palm', 2: 'Right palm', 3: 'Side of the palm', 4: 'Back of the hands' };
  const toast = (msg, variant) => (typeof showVedicToast === 'function' ? showVedicToast(msg, variant) : alert(msg));

  async function fetchJson(url, opts = {}) {
    if (!location.protocol.startsWith('http')) return null;
    let res;
    try {
      res = await fetch(url, {
        method: opts.method || 'GET',
        headers: Object.assign(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}, opts.headers || {}),
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
      });
    } catch (e) { return null; }
    let data = {};
    try { data = await res.json(); } catch (e) { /* not JSON */ }
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      // Carry the server's machine-readable detail (code, opensAt, closesAt…) to the caller.
      Object.keys(data).forEach(k => { if (k !== 'error' && err[k] === undefined) err[k] = data[k]; });
      throw err;
    }
    return data;
  }

  /** Consultation (legacy id or slug) → { title, price, duration } for app.js. */
  window.siteConsultation = function (id) {
    const s = (C().services || []).find(x => x.bookingType === 'consultation' && (x.consultationId === id || x.slug === id));
    return s ? { title: s.title, price: Number(s.price) || 0, duration: s.duration ? s.duration.replace(/ minutes?$/, ' Mins') : '' } : null;
  };

  // -------------------------------------------------------------------------
  // Shared page pieces
  // -------------------------------------------------------------------------
  const crumbs = (items) => `<nav class="sp-crumbs" aria-label="Breadcrumb">${items.map((it, i) =>
    i === items.length - 1 ? `<span aria-current="page">${esc(it[0])}</span>` : `<a href="${it[1]}" data-link>${esc(it[0])}</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>`).join('')}</nav>`;

  const hero = ({ eyebrow, title, sub, crumbs: cr, image, dark = true, extra = '' }) => `
    <section class="sp-hero ${dark ? 'sp-hero--dark' : ''}">
      ${image ? `<div class="sp-hero__art" style="background-image:url('${esc(image)}')" aria-hidden="true"></div>` : ''}
      <div class="sp-wrap sp-hero__inner">
        ${cr || ''}
        ${eyebrow ? `<p class="sp-eyebrow">${esc(eyebrow)}</p>` : ''}
        <h1 class="sp-h1">${esc(title)}</h1>
        ${sub ? `<p class="sp-lead">${esc(sub)}</p>` : ''}
        ${extra}
      </div>
    </section>`;

  const sectionHead = (eyebrow, title, sub) => `
    <div class="sp-head">
      ${eyebrow ? `<p class="sp-eyebrow sp-eyebrow--maroon">${esc(eyebrow)}</p>` : ''}
      <h2 class="sp-h2">${esc(title)}</h2>
      ${sub ? `<p class="sp-sub">${esc(sub)}</p>` : ''}
    </div>`;

  const bookLabel = (s) => s.bookingType === 'enquiry' ? 'Enquire &amp; Book' : 'Book Now';

  /** "₹ 549" when the service has a price, '' when it is booked by enquiry. */
  const priceLabel = (s) => (Number(s && s.price) > 0 ? '₹ ' + Number(s.price).toLocaleString('en-IN') : '');

  const serviceCard = (s, { compact = false } = {}) => `
    <article class="sp-card sp-card--service">
      <a href="/services/${esc(s.slug)}" data-link class="sp-card__media" tabindex="-1" aria-hidden="true">
        <img src="${esc(imageFor(s))}" alt="${esc(s.imageAlt || s.title)}" loading="lazy">
        ${s.core ? '<span class="sp-badge">Core consultation</span>' : ''}
      </a>
      <div class="sp-card__body">
        <p class="sp-card__cat">${esc((category(s.category) || {}).title || '')}</p>
        <h2 class="sp-card__title"><a href="/services/${esc(s.slug)}" data-link>${esc(s.title)}</a></h2>
        ${compact ? '' : `<p class="sp-card__text">${esc(s.short)}</p>`}
        <div class="sp-card__foot">
          <span class="sp-price${priceLabel(s) ? '' : ' sp-price--muted'}">${priceLabel(s) || 'Fee on enquiry'}</span>
          <a href="/services/${esc(s.slug)}" data-link class="sp-link">Details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
        </div>
        <button type="button" class="gold-gradient-btn w-full h-11 rounded-xl mt-3" onclick="bookService('${esc(s.slug)}')">Book Now</button>
      </div>
    </article>`;

  const courseCard = (c) => {
    const status = { open: ['Enrolling now', 'sp-pill--green'], enquire: ['Register interest', 'sp-pill--gold'], upcoming: ['Coming soon', 'sp-pill--muted'] }[c.status] || ['', ''];
    const track = (C().courseTracks || []).find(t => t.id === c.track) || {};
    return `
    <article class="sp-card sp-card--course ${c.track === 'palmistry' ? 'sp-card--flagship' : ''}">
      <a href="/courses/${esc(c.slug)}" data-link class="sp-card__media sp-card__media--short" tabindex="-1" aria-hidden="true"><img src="${esc(c.image || track.image || '/assets/svc/guidance.svg')}" alt="${esc(c.title)}" loading="lazy"></a>
      <div class="sp-card__body">
        <div class="flex items-center gap-2 flex-wrap"><span class="sp-pill ${status[1]}">${status[0]}</span><span class="sp-card__cat">${esc(c.mode)}</span></div>
        <h2 class="sp-card__title"><a href="/courses/${esc(c.slug)}" data-link>${esc(c.title)}</a></h2>
        <p class="sp-card__text">${esc(c.overview)}</p>
        <div class="sp-card__foot">
          <span class="sp-price sp-price--muted">Fee on enquiry</span>
          <div class="flex items-center gap-2">
            <button type="button" onclick="openCourseRegisterModal('${esc(c.slug)}', '${esc(c.title)}')" class="gold-gradient-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs">Register Interest</button>
            <a href="/courses/${esc(c.slug)}" data-link class="sp-link">Details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
          </div>
        </div>
      </div>
    </article>`;
  };

  const articleCard = (a) => {
    const cat = (C().resourceCategories || []).find(x => x.id === a.category) || {};
    return `
    <article class="sp-card sp-card--article">
      <a href="/resources/${esc(a.slug)}" data-link class="sp-card__media sp-card__media--short" tabindex="-1" aria-hidden="true"><img src="${esc(a.image || cat.image || '/assets/svc/guidance.svg')}" alt="${esc(a.title)}" loading="lazy">
        ${a.videoUrl ? '<span class="sp-badge"><i class="fa-solid fa-play"></i> Video</span>' : a.pdfUrl ? '<span class="sp-badge"><i class="fa-regular fa-file-pdf"></i> PDF</span>' : ''}</a>
      <div class="sp-card__body">
        <p class="sp-card__cat">${esc(cat.title || '')} · ${esc(formatDate(a.date))}</p>
        <h2 class="sp-card__title"><a href="/resources/${esc(a.slug)}" data-link>${esc(a.title)}</a></h2>
        <p class="sp-card__text">${esc(a.excerpt)}</p>
        <div class="sp-card__foot"><span class="sp-card__cat">${esc(a.type || '')}</span><a href="/resources/${esc(a.slug)}" data-link class="sp-link">Read <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>
      </div>
    </article>`;
  };

  const faqList = (items, idPrefix) => `<div class="sp-faq">${items.map(([q, a], i) => `
      <details class="sp-faq__item" id="${idPrefix}-${i}">
        <summary><span>${esc(q)}</span><i class="fa-solid fa-plus" aria-hidden="true"></i></summary>
        <div class="sp-faq__a">${esc(a)}</div>
      </details>`).join('')}</div>`;

  const ctaBand = (title = 'Ready for clarity?', text = 'Book a consultation with Guruji, or send an enquiry and we will get back to you.') => `
    <section class="sp-cta">
      <div class="sp-wrap sp-cta__inner">
        <div>
          <h2 class="sp-h2 text-cream">${esc(title)}</h2>
          <p class="text-cream/80 mt-2 max-w-xl">${esc(text)}</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="/services" data-link class="gold-gradient-btn h-12 px-6 rounded-full">Book a Consultation</a>
          <a href="/contact" data-link class="h-12 px-6 rounded-full border border-cream/40 text-cream hover:border-gold hover:text-gold flex items-center justify-center font-medium">Send an Enquiry</a>
        </div>
      </div>
    </section>`;

  const reikiNotice = `<div class="sp-notice"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><p><strong>Please note:</strong> Reiki is a complementary wellness practice for relaxation and subjective well-being. It does not diagnose or treat any medical condition and is not a substitute for medical advice or treatment. If you are unwell, please consult a qualified doctor.</p></div>`;

  // -------------------------------------------------------------------------
  // Page renderers — each returns false when the item does not exist
  // -------------------------------------------------------------------------
  const RENDER = {};

  // -------------------------------------------------------------------------
  // Messages: the seeker's side, laid out the way people already expect
  // -------------------------------------------------------------------------
  // One list of conversations, one open thread beside it. A booking thread per
  // booking plus one general thread, and messages never cross between them:
  // each is fetched and posted by its own key, which the server checks against
  // the signed-in account on every call.

  const MSG = { threads: [], openKey: '', timer: null };

  function seekerToken() {
    try { return localStorage.getItem('guruji_cust_token') || ''; } catch (e) { return ''; }
  }

  /** "14:32" today, "Yesterday", "Mon", then a date. WhatsApp's own ladder. */
  function threadStamp(at) {
    if (!at) return '';
    const d = new Date(at);
    const now = new Date();
    const ist = { timeZone: 'Asia/Kolkata' };
    const day = (x) => x.toLocaleDateString('en-CA', ist);
    if (day(d) === day(now)) return d.toLocaleTimeString('en-IN', { ...ist, hour: 'numeric', minute: '2-digit' });
    const y = new Date(now.getTime() - 86400000);
    if (day(d) === day(y)) return 'Yesterday';
    if (now - d < 7 * 86400000) return d.toLocaleDateString('en-IN', { ...ist, weekday: 'short' });
    return d.toLocaleDateString('en-IN', { ...ist, day: 'numeric', month: 'short' });
  }

  RENDER.messages = () => {
    if (!seekerToken()) {
      return `<section class="site-section">
        <div class="wrap-narrow sp-panel text-center space-y-3">
          <h1 class="sp-h2">Messages</h1>
          <p class="sp-text">Sign in to see your conversations with Guruji.</p>
          <a class="gold-gradient-btn inline-flex h-11 px-6 rounded-xl items-center" href="/account">Sign in</a>
        </div>
      </section>`;
    }
    return `<section class="site-section msg-section">
      <div class="wrap">
        <h1 class="sr-only">Messages</h1>
        <div class="msg" data-msg>
          <aside class="msg__list" data-msg-list>
            <div class="msg__listhead">
              <h2>Chats</h2>
              <button type="button" class="msg__new" data-msg-new title="Start a general conversation with Guruji">
                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i><span>New chat</span>
              </button>
            </div>
            <div class="msg__search">
              <input type="search" placeholder="Search your chats" data-msg-search aria-label="Search your chats">
            </div>
            <ul class="msg__threads" data-msg-threads><li class="msg__loading">Loading…</li></ul>
          </aside>
          <section class="msg__pane" data-msg-pane>
            <div class="msg__empty" data-msg-empty>
              <i class="fa-regular fa-comments" aria-hidden="true"></i>
              <p>Pick a conversation, or start a new one with Guruji.</p>
            </div>
          </section>
        </div>
      </div>
    </section>`;
  };

  function threadRow(t, active) {
    const unread = t.unread > 0;
    const who = t.lastFrom === 'devotee' ? 'You: ' : '';
    return `<li>
      <button type="button" class="msg__thread ${active ? 'is-active' : ''} ${unread ? 'is-unread' : ''}"
              data-msg-open="${esc(t.key)}">
        <span class="msg__avatar ${t.kind === 'general' ? 'is-general' : ''}" aria-hidden="true">
          <i class="fa-solid ${t.kind === 'general' ? 'fa-om' : 'fa-hand'}"></i>
        </span>
        <span class="msg__rowmain">
          <span class="msg__rowtop">
            <span class="msg__title">${esc(t.title)}</span>
            <span class="msg__when">${esc(threadStamp(t.lastAt))}</span>
          </span>
          <span class="msg__rowbot">
            <span class="msg__preview">${t.lastText ? esc(who + t.lastText) : `<em>${esc(t.subtitle)}</em>`}</span>
            ${unread ? `<span class="msg__badge">${t.unread > 99 ? '99+' : t.unread}</span>` : ''}
          </span>
        </span>
      </button>
    </li>`;
  }

  async function loadThreads(host, keepOpen) {
    const token = seekerToken();
    const res = await fetchJson('/api/customer/threads', { headers: { Authorization: 'Bearer ' + token } });
    if (!res) return;
    MSG.threads = res.threads || [];
    paintThreads(host);
    if (keepOpen && MSG.openKey) markRowActive(host, MSG.openKey);
  }

  function paintThreads(host) {
    const ul = host.querySelector('[data-msg-threads]');
    const term = (host.querySelector('[data-msg-search]').value || '').toLowerCase().trim();
    const rows = MSG.threads.filter(t => !term
      || t.title.toLowerCase().includes(term)
      || (t.subtitle || '').toLowerCase().includes(term)
      || (t.lastText || '').toLowerCase().includes(term));
    ul.innerHTML = rows.length
      ? rows.map(t => threadRow(t, t.key === MSG.openKey)).join('')
      : '<li class="msg__loading">No chats match that.</li>';
  }

  function markRowActive(host, key) {
    host.querySelectorAll('[data-msg-open]').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-msg-open') === key));
  }

  function openThread(host, key) {
    const t = MSG.threads.find(x => x.key === key);
    if (!t) return;
    MSG.openKey = key;
    markRowActive(host, key);
    host.querySelector('[data-msg]').classList.add('is-open');
    const pane = host.querySelector('[data-msg-pane]');
    pane.innerHTML = `
      <header class="msg__head">
        <button type="button" class="msg__back" data-msg-back aria-label="Back to chats">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        </button>
        <span class="msg__avatar ${t.kind === 'general' ? 'is-general' : ''}" aria-hidden="true">
          <i class="fa-solid ${t.kind === 'general' ? 'fa-om' : 'fa-hand'}"></i>
        </span>
        <span class="msg__headtext">
          <strong>${esc(t.title)}</strong>
          <small>${esc(t.subtitle)}</small>
        </span>
      </header>
      <div class="msg__chat" data-msg-chat>${chatMarkup('', { bare: true })}</div>`;
    // One endpoint family, whichever kind of thread this is.
    startChat(pane.querySelector('[data-msg-chat]'), key, { token: seekerToken() }, {
      base: `/api/customer/threads/${encodeURIComponent(key)}`
    });
    // The badge clears as soon as it is read.
    const row = MSG.threads.find(x => x.key === key);
    if (row) row.unread = 0;
    paintThreads(host);
    markRowActive(host, key);
  }

  function bindMessages() {
    const host = document.getElementById('page-messages');
    if (!host || !seekerToken()) return;
    loadThreads(host);
    host.querySelector('[data-msg-search]')?.addEventListener('input', () => paintThreads(host));
    host.addEventListener('click', async (ev) => {
      const open = ev.target.closest('[data-msg-open]');
      if (open) { openThread(host, open.getAttribute('data-msg-open')); return; }
      if (ev.target.closest('[data-msg-back]')) {
        host.querySelector('[data-msg]').classList.remove('is-open');
        return;
      }
      if (ev.target.closest('[data-msg-new]')) {
        // The general thread always exists; "New chat" simply opens it.
        const general = MSG.threads.find(t => t.kind === 'general');
        if (general) openThread(host, general.key);
        return;
      }
    });
    // Keep the list fresh so a reply shows up without a reload.
    clearInterval(MSG.timer);
    MSG.timer = setInterval(() => {
      if (document.getElementById('page-messages').classList.contains('hidden')) return;
      loadThreads(host, true);
    }, 15000);
  }

  RENDER.about = () => {
    const a = C().about;
    const sec = (id) => (a.sections || []).find(s => s.id === id);
    const block = (s) => !s ? '' : `
      <div class="sp-panel space-y-4">
        <h2 class="sp-h3 text-2xl font-serif text-amber-950">${esc(s.title)}</h2>
        ${s.paragraphs ? s.paragraphs.map(p => `<p class="sp-text leading-relaxed text-ink-2">${p}</p>`).join('') : s.body ? `<p class="sp-text leading-relaxed text-ink-2">${esc(s.body)}</p>` : ''}
        ${s.list ? `<ul class="sp-ticks">${s.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      </div>`;
    return `
      ${hero({ eyebrow: 'About Guruji', title: a.name, sub: a.intro, crumbs: crumbs([['Home', '/'], ['About Guruji']]) })}
      <section class="sp-section">
        <div class="sp-wrap grid gap-10 lg:grid-cols-[340px_1fr] items-start">
          <div class="space-y-4">
            <figure class="sp-portrait">
              <img src="${esc(a.portrait)}" alt="Portrait of ${esc(a.name)}">
              <figcaption><strong>${esc(a.name)}</strong></figcaption>
            </figure>
          </div>
          <div class="space-y-6">
            ${block(sec('journey'))}
            ${sec('approach') ? `<blockquote class="sp-quote"><p class="text-lg italic font-serif leading-relaxed text-amber-900">${esc(sec('approach').body)}</p><cite class="mt-2 block font-sans font-semibold text-xs tracking-wider uppercase text-amber-800">— ${esc(sec('approach').title)}</cite></blockquote>` : ''}
          </div>
        </div>
      </section>`;
  };

  RENDER.services = () => {
    const cats = C().serviceCategories || [];
    const core = (C().services || []).filter(s => s.core && s.published !== false);
    return `
      ${hero({ eyebrow: 'Services', title: 'Guidance, healing and devotion', sub: 'Palmistry, astrology, japa, puja, pitru rituals, muhurta, Reiki and spiritual guidance — choose a service to see what it involves, what we need from you, and how to book.', crumbs: crumbs([['Home', '/'], ['Services']]) })}
      <section class="sp-section">
        <div class="sp-wrap">
          ${sectionHead('Four core consultations', 'Start here', 'Most seekers begin with one of these. The Astro-Palmistry Correlation brings both sciences together, and Reiki Healing offers rest alongside them.')}
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">${core.map(s => serviceCard(s)).join('')}</div>
        </div>
      </section>
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap">
          ${sectionHead('Service directory', 'All service categories')}
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">${cats.map(c => {
      const href = c.link || `/services/category/${c.id}`;
      const list = servicesIn(c.id).slice(0, 4).map(s => s.title.replace(/ —.*$/, '')).join(', ');
      return `
            <a href="${href}" data-link class="sp-cat">
              <span class="sp-cat__media"><img src="${esc(c.image)}" alt="${esc(c.title)}" loading="lazy"></span>
              <span class="sp-cat__body">
                <span class="sp-cat__title">${esc(c.title)}</span>
                <span class="sp-cat__text">${esc(c.tagline)}</span>
                <span class="sp-cat__list">${esc(list)}</span>
              </span>
            </a>`;
    }).join('')}</div>
        </div>
      </section>
      ${ctaBand()}`;
  };

  RENDER['service-category'] = ({ cat }) => {
    const c = category(cat);
    if (!c) return false;
    if (c.link && c.link !== `/services/category/${cat}`) { setTimeout(() => navigate(c.link, { replace: true }), 0); return ''; }
    const list = servicesIn(cat);
    const purohitBanner = c.purohitBanner ? `
      <section class="sp-section pt-0 pb-4">
        <div class="sp-wrap">
          <div class="sp-panel bg-gradient-to-br from-amber-50/90 to-orange-50/60 border border-amber-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-200/80 px-3.5 py-1 rounded-full border border-amber-300">
              <i class="fa-solid fa-om text-amber-800"></i> ${esc(c.purohitBanner.eyebrow || 'Traditional Observance')}
            </div>
            <h2 class="font-serif text-2xl sm:text-3xl font-bold text-amber-950">${esc(c.purohitBanner.title)}</h2>
            ${(c.purohitBanner.paragraphs || []).map(p => `<p class="sp-text leading-relaxed text-ink-2 text-base">${esc(p)}</p>`).join('')}
            ${c.purohitBanner.highlight ? `<div class="p-4 rounded-2xl bg-amber-100/90 border border-amber-300 text-amber-950 font-serif text-lg font-bold text-center italic shadow-2xs">${esc(c.purohitBanner.highlight)}</div>` : ''}
          </div>
        </div>
      </section>` : '';
    return `
      ${hero({ eyebrow: 'Services', title: c.title, sub: c.intro, image: c.image, crumbs: crumbs([['Home', '/'], ['Services', '/services'], [c.title]]) })}
      ${purohitBanner}
      <section class="sp-section">
        <div class="sp-wrap grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${list.map(s => serviceCard(s)).join('')}</div>
      </section>
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap grid gap-6 md:grid-cols-2">
          <div class="sp-panel"><h2 class="sp-h3">How it works</h2><ol class="sp-steps">${(c.howItWorks || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
          <div class="sp-panel"><h2 class="sp-h3">What we will need from you</h2><ul class="sp-ticks">${(c.requiredInfo || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        </div>
      </section>
      ${ctaBand()}`;
  };

  RENDER['service-detail'] = ({ slug }) => {
    const s = serviceBySlug(slug);
    if (!s) return false;
    const c = category(s.category) || {};
    const required = s.requiredInfo || c.requiredInfo || [];
    const related = servicesIn(s.category).filter(x => x.slug !== s.slug).slice(0, 3);
    const parts = s.reportParts ? `
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap">
          ${sectionHead('Combined report scope', 'What the report covers')}
          <div class="grid gap-5 md:grid-cols-3">${s.reportParts.map(p => `<div class="sp-panel"><h3 class="sp-h3">${esc(p.title)}</h3><ul class="sp-ticks">${p.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
          ${s.correlation ? `
          <div class="sp-table-wrap mt-8">
            <table class="sp-table">
              <caption>Part 3 — Correlation: where the two sciences align, complement or differ</caption>
              <thead><tr><th scope="col">Area of life</th><th scope="col">Astrology perspective</th><th scope="col">Palmistry perspective</th></tr></thead>
              <tbody>${s.correlation.map(r => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody>
            </table>
          </div>` : ''}
        </div>
      </section>` : '';

    const sectionsHtml = (s.sections || []).map((sec, idx) => `
      <section class="sp-section ${idx % 2 === 1 ? 'sp-section--tint' : ''}">
        <div class="sp-wrap space-y-6">
          <div class="text-center max-w-3xl mx-auto space-y-2">
            ${sec.eyebrow ? `<p class="sp-eyebrow sp-eyebrow--maroon font-bold uppercase tracking-wider text-xs">${esc(sec.eyebrow)}</p>` : ''}
            ${sec.title ? `<h2 class="sp-h2 font-serif text-3xl sm:text-4xl font-bold text-amber-950">${esc(sec.title)}</h2>` : ''}
            ${sec.subtitle ? `<p class="sp-lead text-ink-2 mt-2">${esc(sec.subtitle)}</p>` : ''}
          </div>

          ${sec.paragraphs ? `
            <div class="max-w-3xl mx-auto space-y-4">
              ${sec.paragraphs.map(p => `<p class="sp-text text-base sm:text-lg leading-relaxed text-ink-2">${p}</p>`).join('')}
            </div>` : ''}

          ${sec.columns ? `
            <div class="grid gap-6 md:grid-cols-2 mt-8">
              ${sec.columns.map(col => `
                <div class="sp-panel bg-cream-1/80 border border-amber-200/80 rounded-2xl p-6 shadow-xs">
                  <h3 class="font-serif text-xl font-bold text-amber-950 mb-4 border-b border-amber-200/60 pb-2">${esc(col.title)}</h3>
                  <ul class="sp-ticks space-y-2.5">${(col.items || []).map(it => `<li>${esc(it)}</li>`).join('')}</ul>
                </div>
              `).join('')}
            </div>` : ''}

          ${sec.chipsTitle || sec.chips ? `
            <div class="sp-panel bg-amber-50/70 border border-amber-300/80 rounded-2xl p-6 text-center space-y-3 mt-6">
              ${sec.chipsTitle ? `<h3 class="font-serif text-sm font-bold text-amber-950 uppercase tracking-wider">${esc(sec.chipsTitle)}</h3>` : ''}
              ${sec.chips ? `<div class="flex flex-wrap items-center justify-center gap-2 pt-1">${sec.chips.map(c => `<span class="inline-block bg-white/95 border border-amber-300 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs">${esc(c)}</span>`).join('')}</div>` : ''}
            </div>` : ''}

          ${sec.steps ? `
            <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-${sec.stepsCols || (sec.steps.length > 4 ? '3' : '2')} mt-8">
              ${sec.steps.map(st => `
                <div class="sp-panel bg-cream-1/90 border border-amber-200/90 rounded-2xl p-6 shadow-xs relative hover:border-amber-400 transition-colors">
                  <div class="font-serif text-3xl font-extrabold text-amber-400/90 mb-1">${esc(st.num)}</div>
                  <h3 class="font-serif text-lg font-bold text-amber-950 mb-2">${esc(st.title)}</h3>
                  <p class="sp-text text-sm leading-relaxed text-ink-2">${esc(st.text)}</p>
                </div>
              `).join('')}
            </div>` : ''}

          ${sec.highlight ? `
            <div class="p-6 rounded-2xl bg-gradient-to-r from-amber-100/90 via-amber-50 to-amber-100/90 border border-amber-300 text-center text-amber-950 font-serif text-xl font-bold italic shadow-xs max-w-3xl mx-auto mt-6">
              ${esc(sec.highlight)}
            </div>` : ''}
        </div>
      </section>
    `).join('');

    return `
      <section class="sp-section sp-detail-top">
        <div class="sp-wrap">
          ${crumbs([['Home', '/'], ['Services', '/services'], [c.title || 'Service', c.link || `/services/category/${s.category}`], [s.title]])}
          <div class="grid gap-10 lg:grid-cols-[1.1fr_.9fr] items-start mt-6">
            <div>
              <p class="sp-eyebrow sp-eyebrow--maroon">${esc(c.title || '')}</p>
              <h1 class="sp-h1 sp-h1--ink">${esc(s.title)}</h1>
              ${s.tagline ? `<p class="sp-tagline">${esc(s.tagline)}</p>` : ''}
              <p class="sp-lead sp-lead--ink">${esc(s.intro || s.short)}</p>
              ${s.description ? `<p class="sp-text mt-4">${esc(s.description)}</p>` : ''}
              ${s.category === 'reiki' ? reikiNotice : ''}
            </div>
            <aside class="sp-book">
              <img src="${esc(imageFor(s))}" alt="${esc(s.imageAlt || s.title)}" class="sp-book__img" width="1200" height="800">
              <div class="sp-book__body">
                <div class="sp-book__price${priceLabel(s) ? '' : ' sp-book__price--muted'}">${priceLabel(s) || 'Fee on enquiry'}</div>
                ${s.duration ? `<p class="sp-book__meta"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(s.duration)}</p>` : ''}
                <p class="sp-book__meta"><i class="fa-solid fa-video" aria-hidden="true"></i> ${s.category === 'puja-rituals' || s.category === 'pitru' || s.category === 'japa-mantra' ? 'Performed on your behalf, with Sankalpa in your name' : 'Online (phone / video) or in person'}</p>
                <button type="button" class="gold-gradient-btn w-full h-12 rounded-xl mt-4" onclick="bookService('${esc(s.slug)}')">${bookLabel(s)}</button>
                <p class="text-xs text-ink-3 mt-2">Send an enquiry — we will confirm the details and the fee on WhatsApp before anything is booked.</p>
                ${waLink() ? `<a class="sp-wa-link" href="${waLink('Namaste, I would like to know more about ' + s.title)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Ask on WhatsApp</a>` : ''}
              </div>
            </aside>
          </div>
        </div>
      </section>
      ${s.sections && s.sections.length ? sectionsHtml : `
      <section class="sp-section">
        <div class="sp-wrap grid gap-6 lg:grid-cols-3">
          <div class="sp-panel"><h2 class="sp-h3">${s.core ? 'What it covers' : 'Benefits &amp; purpose'}</h2><ul class="sp-ticks">${(s.benefits || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>
          <div class="sp-panel"><h2 class="sp-h3">How it works</h2><ol class="sp-steps">${(c.howItWorks || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
          <div class="sp-panel"><h2 class="sp-h3">Information required</h2><ul class="sp-ticks">${required.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        </div>
        ${s.deliverables ? `<div class="sp-wrap mt-6"><div class="sp-panel sp-panel--gold"><h2 class="sp-h3">What you receive</h2><ul class="sp-ticks sp-ticks--cols">${s.deliverables.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div></div>` : ''}
      </section>
      ${parts}`}
      ${related.length ? `<section class="sp-section"><div class="sp-wrap">${sectionHead('', 'Related services')}<div class="grid gap-6 md:grid-cols-3">${related.map(r => serviceCard(r, { compact: true })).join('')}</div></div></section>` : ''}
      ${ctaBand()}`;
  };

  RENDER.reiki = () => {
    const sessions = servicesIn('reiki');
    const reikiCourses = (C().courses || []).filter(c => c.track === 'reiki' && c.published !== false);
    return `
      ${hero({
      eyebrow: 'Reiki Healing', title: 'Reiki — rest, balance and relaxation', sub: 'A gentle, hands-on or distance practice that many people find deeply relaxing. Offered as a complementary wellness practice alongside — never instead of — medical care.', image: '/assets/svc/reiki.svg', crumbs: crumbs([['Home', '/'], ['Reiki Healing']]),
      extra: `<div class="flex flex-col sm:flex-row gap-3 mt-6"><button type="button" onclick="bookService('reiki-individual-session')" class="gold-gradient-btn h-12 px-6 rounded-full">Book a Reiki Session</button><a href="#reiki-sessions" class="h-12 px-6 rounded-full border border-cream/40 text-cream hover:border-gold hover:text-gold flex items-center justify-center font-medium">See Reiki sessions</a></div>`
    })}
      <section class="sp-section">
        <div class="sp-wrap grid gap-6 md:grid-cols-3">
          <div class="sp-panel"><h2 class="sp-h3">What is Reiki?</h2><p class="sp-text">Reiki is a Japanese practice in which the practitioner places their hands lightly on, or just above, the body in a series of positions. It is usually received lying down and fully clothed, in a quiet room — or at a distance, at an agreed time.</p></div>
          <div class="sp-panel"><h2 class="sp-h3">Reiki philosophy</h2><p class="sp-text">Reiki is traditionally taught with five simple principles for daily life: for today, let go of anger; let go of worry; be grateful; work honestly; and be kind to every living being.</p></div>
          <div class="sp-panel"><h2 class="sp-h3">Benefits people describe</h2><ul class="sp-ticks"><li>Deep relaxation and rest</li><li>A calmer, quieter mind</li><li>Feeling more grounded and balanced</li><li>Time set aside for yourself</li></ul><p class="text-xs text-ink-3 mt-3">These are subjective experiences; results differ from person to person.</p></div>
        </div>
        <div class="sp-wrap mt-6">${reikiNotice}</div>
      </section>
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap">
          ${sectionHead('How a session works', 'What to expect')}
          <ol class="sp-timeline">
            <li><strong>Before</strong><span>A short conversation about how you are and what you would like from the session.</span></li>
            <li><strong>The session</strong><span>You rest, lying down or seated, fully clothed, while the practitioner moves through gentle hand positions — or, for distance Reiki, you rest at home at the agreed time.</span></li>
            <li><strong>After</strong><span>A few quiet minutes, a glass of water, and a chance to share how you feel.</span></li>
            <li><strong>At home</strong><span>Simple breathing and relaxation practices to continue on your own.</span></li>
          </ol>
        </div>
      </section>
      <section class="sp-section" id="reiki-sessions">
        <div class="sp-wrap">
          ${sectionHead('Reiki Sessions', 'Reiki services')}
          <div class="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">${sessions.map(s => `
            <article class="sp-panel sp-session">
              <h3 class="sp-h3"><a href="/services/${esc(s.slug)}" data-link>${esc(s.title)}</a></h2>
              <p class="sp-text">${esc(s.short)}</p>
              <div class="sp-session__foot">
                <span class="sp-price${priceLabel(s) ? '' : ' sp-price--muted'}">${priceLabel(s) || 'Fee on enquiry'}</span>
                ${waLink() ? `<a class="sp-btn-outline" href="${waLink('Namaste, I would like to enquire about ' + s.title)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Enquire on WhatsApp</a>` : `<button type="button" class="sp-btn-outline" onclick="bookService('${esc(s.slug)}')">${bookLabel(s)}</button>`}
              </div>
            </article>`).join('')}</div>
        </div>
      </section>
      ${reikiCourses.length ? `<section class="sp-section sp-section--tint"><div class="sp-wrap">${sectionHead('Learn Reiki', 'Reiki courses', ((C().courseTracks || []).find(t => t.id === 'reiki') || {}).note)}<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">${reikiCourses.map(courseCard).join('')}</div></div></section>` : ''}
      ${ctaBand('Book a Reiki session', 'Choose a session above, or send an enquiry and we will help you choose.')}`;
  };

  RENDER.courses = () => {
    const tracks = C().courseTracks || [];
    return `
      ${hero({ eyebrow: 'Courses & Training', title: 'Learn from Guruji', sub: 'Structured courses in palmistry and Reiki, with more on Vedic astrology, mantra and Sanatana Dharma to come.', image: '/assets/svc/course-palmistry.webp', crumbs: crumbs([['Home', '/'], ['Courses']]) })}
      ${tracks.map((t, i) => {
      const list = (C().courses || []).filter(c => c.track === t.id && c.published !== false && (t.id !== 'palmistry' || c.slug === 'palmistry-science-of-palm-reading'));
      if (!list.length) return '';
      return `<section class="sp-section ${i % 2 ? 'sp-section--tint' : ''}" id="${esc(t.id)}">
          <div class="sp-wrap">
            ${sectionHead('', t.title, t.note)}
            <div class="${t.id === 'palmistry' ? 'max-w-xl mx-auto' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'}">${list.map(courseCard).join('')}</div>
          </div>
        </section>`;
    }).join('')}
      ${ctaBand('Interested in a course?', 'Register your interest and we will contact you with dates, fees and the format of the next batch.')}`;
  };

  RENDER['course-detail'] = ({ slug }) => {
    const c = courseBySlug(slug);
    if (!c) return false;
    const track = (C().courseTracks || []).find(t => t.id === c.track) || {};
    const cta = c.status === 'upcoming' ? 'Notify me when it opens' : c.status === 'open' ? 'Enrol now' : 'Register interest';
    return `
      ${hero({ eyebrow: track.title || 'Course', title: c.title, sub: c.overview, image: c.image || track.image, crumbs: crumbs([['Home', '/'], ['Courses', '/courses'], [c.title]]) })}
      <section class="sp-section">
        <div class="sp-wrap grid gap-8 lg:grid-cols-[1fr_340px] items-start">
          <div class="space-y-6">
            <div class="sp-panel"><h2 class="sp-h3">Curriculum</h2><ol class="sp-steps">${(c.curriculum || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
            <div class="sp-panel"><h2 class="sp-h3">Learning outcomes</h2><ul class="sp-ticks">${(c.outcomes || []).filter(x => x && x !== '—').map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
            ${track.note ? `<p class="text-sm text-ink-3">${esc(track.note)}</p>` : ''}
          </div>
          <aside class="sp-book">
            <div class="sp-book__body">
              <div class="sp-book__price sp-book__price--muted">Fee on enquiry</div>
              <dl class="sp-facts">
                <div><dt>Duration</dt><dd>${esc(c.duration)}</dd></div>
                <div><dt>Mode</dt><dd>${esc(c.mode)}</dd></div>
                <div><dt>Instructor</dt><dd>${esc(c.instructor)}</dd></div>
                <div><dt>Certificate</dt><dd>${esc(c.certificate || '—')}</dd></div>
              </dl>
              <button type="button" onclick="openCourseRegisterModal('${esc(c.slug)}', '${esc(c.title)}')" class="gold-gradient-btn w-full h-12 rounded-xl mt-4 font-semibold text-sm shadow-md">${cta}</button>
            </div>
          </aside>
        </div>
        <div class="sp-wrap" data-course-selfpaced></div>
      </section>
      ${ctaBand('Questions about this course?', 'Send an enquiry or message us on WhatsApp.')}`;
  };

  RENDER.resources = (params = {}) => {
    const q = (params.query && params.query.q) || '';
    const cat = (params.query && params.query.category) || '';
    const type = (params.query && params.query.type) || '';
    const cats = C().resourceCategories || [];
    const all = (C().articles || []).filter(a => a.published !== false).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const needle = q.toLowerCase();
    const list = all.filter(a => (!cat || a.category === cat) && (!type || a.type === type) &&
      (!needle || [a.title, a.excerpt, (a.body || []).join(' ')].join(' ').toLowerCase().includes(needle)));
    const featured = all.filter(a => a.featured).slice(0, 3);
    const filtersActive = q || cat || type;
    // The featured three are shown above; don't print them again directly below.
    const featuredSlugs = new Set(featured.map(a => a.slug));
    const rest = filtersActive ? list : list.filter(a => !featuredSlugs.has(a.slug));
    return `
      ${hero({ eyebrow: 'Resources', title: 'Knowledge Hub', sub: 'Articles and guides on palmistry, astrology, Reiki, mantras, rituals, meditation and Sanatana Dharma.', crumbs: crumbs([['Home', '/'], ['Resources']]) })}
      <section class="sp-section">
        <div class="sp-wrap">
          <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">${cats.map(c => `
            <a href="/resources?category=${esc(c.id)}" data-link class="sp-rescat ${cat === c.id ? 'is-active' : ''}">
              <img src="${esc(c.image)}" alt="${esc(c.title)}" loading="lazy"><span>${esc(c.title)}</span>
            </a>`).join('')}</div>
          <form class="sp-filter" onsubmit="event.preventDefault(); resourcesFilter(this)" role="search">
            <label class="sr-only" for="res-q">Search articles</label>
            <div class="sp-filter__search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input id="res-q" name="q" type="search" value="${esc(q)}" placeholder="Search articles…"></div>
            <label class="sr-only" for="res-cat">Category</label>
            <select id="res-cat" name="category" onchange="resourcesFilter(this.form)"><option value="">All categories</option>${cats.map(c => `<option value="${esc(c.id)}" ${cat === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select>
            <label class="sr-only" for="res-type">Resource type</label>
            <select id="res-type" name="type" onchange="resourcesFilter(this.form)"><option value="">All resource types</option>${(C().resourceTypes || []).map(t => `<option ${type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
            <button class="gold-gradient-btn h-11 px-5 rounded-xl" type="submit">Search</button>
          </form>
          ${!filtersActive && featured.length ? `<h2 class="sp-h3 mt-10 mb-4">Featured</h2><div class="grid gap-6 md:grid-cols-3">${featured.map(articleCard).join('')}</div>` : ''}
          <h2 class="sp-h3 mt-10 mb-4">${filtersActive ? `${list.length} result${list.length === 1 ? '' : 's'}` : 'More reading'}${filtersActive ? ' · <a href="/resources" data-link class="sp-link text-sm">Clear filters</a>' : ''}</h2>
          ${rest.length ? `<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${rest.map(articleCard).join('')}</div>`
            : filtersActive ? '<p class="sp-text">No articles match yet. Try another word or category.</p>'
            : '<p class="sp-text">Everything we have published so far is featured above.</p>'}
        </div>
      </section>
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap grid gap-6 md:grid-cols-3">
          <a href="/mantras" data-link class="sp-panel sp-panel--link"><h3 class="sp-h3"><i class="fa-solid fa-om text-gold-deep"></i> Mantras &amp; Stotras library</h3><p class="sp-text">Mantras with meaning, transliteration and guidance for chanting.</p></a>
          <a href="/palmistry" data-link class="sp-panel sp-panel--link"><h3 class="sp-h3"><i class="fa-solid fa-hand text-gold-deep"></i> Palmistry guide</h3><p class="sp-text">Hand types, lines, mounts and fingers — an illustrated guide.</p></a>
          <a href="/faqs" data-link class="sp-panel sp-panel--link"><h3 class="sp-h3"><i class="fa-regular fa-circle-question text-gold-deep"></i> FAQs</h3><p class="sp-text">Answers about readings, rituals, Reiki, courses and payments.</p></a>
        </div>
      </section>`;
  };

  window.resourcesFilter = (form) => {
    const p = new URLSearchParams();
    ['q', 'category', 'type'].forEach(k => { const v = form.elements[k] && form.elements[k].value.trim(); if (v) p.set(k, v); });
    navigate('/resources' + (p.toString() ? '?' + p : ''), { keepScroll: true });
  };

  const youtubeEmbed = (url) => {
    const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : '';
  };

  RENDER.article = ({ slug }) => {
    const a = articleBySlug(slug);
    if (!a) return false;
    const cat = (C().resourceCategories || []).find(x => x.id === a.category) || {};
    const related = (C().articles || []).filter(x => x.published !== false && x.slug !== a.slug && x.category === a.category).slice(0, 3);
    const more = related.length ? related : (C().articles || []).filter(x => x.published !== false && x.slug !== a.slug).slice(0, 3);
    const yt = youtubeEmbed(a.videoUrl);
    return `
      <article class="sp-section sp-article">
        <div class="sp-wrap sp-narrow">
          ${crumbs([['Home', '/'], ['Resources', '/resources'], [cat.title || 'Article', `/resources?category=${a.category}`], [a.title]])}
          <p class="sp-eyebrow sp-eyebrow--maroon mt-6">${esc(cat.title || '')}</p>
          <h1 class="sp-h1 sp-h1--ink">${esc(a.title)}</h1>
          <p class="sp-meta">${esc(a.author)} · <time datetime="${esc(a.date)}">${esc(formatDate(a.date))}</time>${a.type ? ' · ' + esc(a.type) : ''}</p>
          ${a.image ? `<img src="${esc(a.image)}" alt="${esc(a.title)}" class="sp-article__img">` : ''}
          <p class="sp-lead sp-lead--ink">${esc(a.excerpt)}</p>
          <div class="sp-prose">${(a.body || []).map(p => `<p>${esc(p)}</p>`).join('')}</div>
          ${yt ? `<div class="sp-video"><iframe src="${yt}" title="${esc(a.title)}" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>` : ''}
          ${a.pdfUrl ? `<a href="${esc(a.pdfUrl)}" target="_blank" rel="noopener" class="sp-btn-outline mt-6 inline-flex"><i class="fa-regular fa-file-pdf"></i> Download PDF</a>` : ''}
        </div>
      </article>
      ${more.length ? `<section class="sp-section sp-section--tint"><div class="sp-wrap">${sectionHead('', 'Related articles')}<div class="grid gap-6 md:grid-cols-3">${more.map(articleCard).join('')}</div></div></section>` : ''}
      ${ctaBand()}`;
  };

  RENDER.faqs = (params = {}) => {
    const cats = C().faqCategories || [];
    const active = (params.query && params.query.topic) || '';
    return `
      ${hero({ eyebrow: 'FAQs', title: 'Frequently asked questions', sub: 'Organised by topic. Can’t find your answer? Send us a message.', crumbs: crumbs([['Home', '/'], ['FAQs']]) })}
      <section class="sp-section">
        <div class="sp-wrap sp-narrow">
          <nav class="sp-chips sp-chips--nav" aria-label="FAQ topics">${cats.map(c => `<a href="#faq-${esc(c.id)}" class="${active === c.id ? 'is-active' : ''}">${esc(c.title.replace(/ FAQs$/, ''))}</a>`).join('')}</nav>
          ${cats.map(c => `<section id="faq-${esc(c.id)}" class="sp-faq-group"><h2 class="sp-h3">${esc(c.title)}</h2>${faqList(c.items, 'faq-' + c.id)}</section>`).join('')}
        </div>
      </section>
      ${ctaBand('Still have a question?', 'Write to us — we usually reply within a day.')}`;
  };

  RENDER.policy = ({ policy }) => {
    const p = (C().policies || {})[policy];
    if (!p) return false;

    const allPolicies = [
      ['disclaimer', 'Disclaimer & Legal Notice', 'fa-shield-halved'],
      ['terms', 'Terms & Conditions', 'fa-file-contract'],
      ['privacy-policy', 'Privacy Policy (DPDP Act)', 'fa-user-shield'],
      ['cancellation-refund-policy', 'Cancellation & Refund', 'fa-rotate-left'],
      ['consent-policy', 'Customer Consent Policy', 'fa-handshake-angle'],
      ['grievance', 'Grievance Redressal', 'fa-scale-balanced']
    ];

    const currentSlug = policy;

    return `
      ${hero({
        eyebrow: 'Legal Compliance & Governance',
        title: p.title,
        sub: `Version ${esc(p.version || '1.0')} · Last updated ${p.updated ? formatDate(p.updated) : 'November 2026'} · Legally Binding Under Indian Law`,
        crumbs: crumbs([['Home', '/'], ['Legal', '/disclaimer'], [p.title]])
      })}
      <section class="sp-section py-10 sm:py-14 bg-parchment/40">
        <div class="sp-wrap max-w-7xl">
          <div class="grid gap-8 lg:grid-cols-[300px_1fr] items-start">
            
            <!-- Sidebar: Navigation & Quick Jump -->
            <aside class="space-y-6 lg:sticky lg:top-24">
              <div class="sp-panel bg-white border border-line rounded-2xl p-5 shadow-xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-line">
                  <span class="text-xs uppercase tracking-wider font-bold text-amber-900">Legal Documents</span>
                  <span class="sp-pill sp-pill--green text-2xs font-semibold">Active Suite</span>
                </div>
                <nav class="space-y-1">
                  ${allPolicies.map(([slug, title, icon]) => `
                    <a href="/${slug}" data-link class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${slug === currentSlug ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-300/80' : 'text-ink-2 hover:bg-zinc-100 hover:text-ink'}">
                      <i class="fa-solid ${icon} text-amber-700 w-4 text-center"></i>
                      <span>${esc(title)}</span>
                    </a>
                  `).join('')}
                </nav>
              </div>

              <!-- Quick Table of Contents -->
              <div class="sp-panel bg-white border border-line rounded-2xl p-5 shadow-xs space-y-3">
                <span class="text-xs uppercase tracking-wider font-bold text-ink-3">Sections in this Document</span>
                <ol class="space-y-1.5 text-xs text-ink-2">
                  ${p.sections.map(([h], i) => `
                    <li>
                      <a href="#section-${i + 1}" class="hover:text-maroon transition block truncate">
                        ${esc(h)}
                      </a>
                    </li>
                  `).join('')}
                </ol>
              </div>

              <!-- Contact & Grievance Box -->
              <div class="sp-panel bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/90 rounded-2xl p-5 shadow-xs text-xs space-y-3">
                <div class="flex items-center gap-2 text-amber-900 font-bold font-serif text-sm">
                  <i class="fa-solid fa-scale-balanced text-amber-700"></i>
                  <span>Grievance Officer</span>
                </div>
                <p class="text-ink-2 leading-relaxed">
                  For legal notices, data privacy requests or service grievances:
                </p>
                <div class="space-y-1 text-2xs text-ink font-mono bg-white/80 p-2.5 rounded-lg border border-amber-200">
                  <div><strong>Email:</strong> <a href="mailto:support@gurujipalmistry.org" class="text-maroon underline">support@gurujipalmistry.org</a></div>
                  <div><strong>WhatsApp:</strong> <a href="https://wa.me/918977625078" target="_blank" rel="noopener" class="text-maroon underline">+91 89776 25078</a></div>
                  <div><strong>Reg:</strong> SEA/MED/ALO/NR/1439866/2026</div>
                </div>
                <p class="text-2xs text-ink-3">Acknowledgement within 24 hours · Resolution within 15 days.</p>
              </div>

              <div class="flex gap-2">
                <button type="button" onclick="window.print()" class="sp-btn-outline w-full text-xs h-10 rounded-xl flex items-center justify-center gap-2">
                  <i class="fa-solid fa-print"></i> Print Document
                </button>
              </div>
            </aside>

            <!-- Main Document Body -->
            <main class="sp-panel bg-white border border-line rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
              <div class="border-b border-line pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 font-bold text-2xs uppercase tracking-wider border border-amber-300">
                    <i class="fa-solid fa-stamp text-amber-700"></i> ${esc(p.badge || 'Official Website Policy')}
                  </span>
                  <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink mt-2">${esc(p.title)}</h1>
                </div>
                <div class="text-right text-xs text-ink-3 shrink-0">
                  <div>Effective Date: <strong>${p.updated ? formatDate(p.updated) : '22 Nov 2026'}</strong></div>
                  <div>Jurisdiction: <strong>Hyderabad, Telangana, India</strong></div>
                </div>
              </div>

              <!-- Document Sections -->
              <div class="space-y-8 divide-y divide-line/70">
                ${p.sections.map(([heading, body], idx) => `
                  <article id="section-${idx + 1}" class="${idx > 0 ? 'pt-8' : ''} space-y-3 scroll-mt-28">
                    <h2 class="font-serif text-lg sm:text-xl font-bold text-amber-950 flex items-center gap-2.5">
                      <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 text-xs font-mono font-bold flex items-center justify-center shrink-0">${idx + 1}</span>
                      <span>${esc(heading.replace(/^\d+\.\s*/, ''))}</span>
                    </h2>
                    <div class="text-ink-2 text-sm sm:text-[15px] leading-relaxed whitespace-pre-line pl-9">
                      ${esc(body)}
                    </div>
                  </article>
                `).join('')}
              </div>

              <!-- Footer Statement -->
              <div class="mt-10 p-5 bg-parchment/60 rounded-2xl border border-line text-xs text-ink-3 space-y-2">
                <div class="font-semibold text-ink">Guruji Palmistry Legal Compliance & Governance</div>
                <p>
                  This document forms part of the master terms governing your use of gurujipalmistry.org and all consultation, healing and Vedic ritual services provided thereunder. For questions or certified copies of registration certificates, please contact our administrative desk.
                </p>
                <div class="pt-2 flex flex-wrap gap-4 text-maroon font-medium">
                  <a href="/disclaimer" data-link class="underline hover:text-amber-700">Disclaimer</a>
                  <a href="/terms" data-link class="underline hover:text-amber-700">Terms &amp; Conditions</a>
                  <a href="/privacy-policy" data-link class="underline hover:text-amber-700">Privacy Policy</a>
                  <a href="/cancellation-refund-policy" data-link class="underline hover:text-amber-700">Refund Policy</a>
                  <a href="/consent-policy" data-link class="underline hover:text-amber-700">Consent Policy</a>
                  <a href="/grievance" data-link class="underline hover:text-amber-700">Grievance Redressal</a>
                </div>
              </div>

            </main>

          </div>
        </div>
      </section>
    `;
  };

  // --- Contact & enquiry ---------------------------------------------------
  function serviceOptions(selected) {
    const groups = (C().serviceCategories || []).map(c => {
      const items = servicesIn(c.id);
      return items.length ? `<optgroup label="${esc(c.title)}">${items.map(s => `<option value="${esc(s.slug)}" ${s.slug === selected ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</optgroup>` : '';
    }).join('');
    const courses = (C().courses || []).filter(c => c.published !== false);
    return `<option value="">General enquiry</option>${groups}${courses.length ? `<optgroup label="Courses">${courses.map(c => `<option value="${esc(c.slug)}" ${c.slug === selected ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</optgroup>` : ''}`;
  }

  RENDER.contact = (params = {}) => {
    const st = C().settings || {};
    const q = params.query || {};
    const kind = ['booking', 'course', 'contact'].includes(q.kind) ? q.kind : (q.service ? 'booking' : 'contact');
    const minDate = (typeof istDate === 'function' ? istDate(0) : new Date().toISOString().slice(0, 10));
    const svc = q.service && (serviceBySlug(q.service) || courseBySlug(q.service));
    return `
      ${hero({ eyebrow: 'Contact', title: kind === 'course' ? 'Course enquiry' : kind === 'booking' ? 'Book a service' : 'Contact & booking', sub: svc ? `You are enquiring about: ${svc.title}` : 'Send an enquiry for any service or course. We will contact you to confirm the details — nothing is booked until we confirm with you.', crumbs: crumbs([['Home', '/'], ['Contact']]) })}
      <section class="sp-section">
        <div class="sp-wrap grid gap-8 lg:grid-cols-[1fr_360px] items-start">
          <div class="sp-panel" id="enquiry-panel">
            <form id="enquiry-form" class="sp-form" novalidate onsubmit="submitEnquiry(event)">
              <input type="hidden" name="kind" value="${kind}">
              <div class="sp-hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
              <div class="sp-form__grid">
                <label class="sp-field"><span>Full name *</span><input name="name" required autocomplete="name" maxlength="120"></label>
                <label class="sp-field"><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="160"></label>
                <label class="sp-field"><span>Phone / WhatsApp *</span><input name="phone" type="tel" inputmode="numeric" required autocomplete="tel" placeholder="10-digit mobile number" maxlength="14"></label>
                <label class="sp-field"><span>Service</span><select name="service">${serviceOptions(q.service || '')}</select></label>
                <label class="sp-field"><span>Consultation type</span><select name="consultationType">
                  ${['New consultation', 'Follow-up consultation', 'Puja / Japa booking', 'Course enrolment', 'General question'].map(t => `<option ${((kind === 'course' && t === 'Course enrolment') || (kind === 'contact' && t === 'General question')) ? 'selected' : ''}>${t}</option>`).join('')}
                </select></label>
                <fieldset class="sp-field"><legend>Online or in person</legend>
                  <div class="sp-radios"><label><input type="radio" name="mode" value="online" checked> Online</label><label><input type="radio" name="mode" value="offline"> In person</label></div>
                </fieldset>
                <label class="sp-field"><span>Preferred date</span><input name="preferredDate" type="date" min="${minDate}"></label>
                <label class="sp-field"><span>Preferred time</span><select name="preferredTime"><option value="">Any time</option><option>Morning (9 AM – 12 PM)</option><option>Afternoon (12 – 4 PM)</option><option>Evening (4 – 8 PM)</option></select></label>
                <label class="sp-field sp-field--full"><span>Message ${kind === 'contact' ? '*' : ''}</span><textarea name="message" rows="5" maxlength="2000" placeholder="Your questions, birth details (if relevant), or anything we should know"></textarea></label>
                <label class="sp-check sp-field--full"><input type="checkbox" name="whatsapp" checked> You may contact me on WhatsApp</label>
              </div>
              <p class="text-xs text-ink-3">Preferred date and time are requests, not confirmed appointments. We will contact you to confirm.</p>
              <button class="gold-gradient-btn h-12 px-7 rounded-xl" type="submit" id="enquiry-submit"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i> Send enquiry</button>
            </form>
          </div>
          <aside class="space-y-4">
            <div class="sp-panel">
              <h2 class="sp-h3">Reach us directly</h2>
              <ul class="sp-contact space-y-3">
                ${st.email ? `<li><i class="fa-regular fa-envelope" aria-hidden="true"></i><div><strong>Email</strong><br><a href="mailto:${esc(st.email)}">${esc(st.email)}</a></div></li>` : ''}
                ${waLink() ? `<li><i class="fa-brands fa-whatsapp text-emerald-600" aria-hidden="true"></i><div><strong>Phone &amp; WhatsApp</strong><br><a href="${waLink('Namaste')}" target="_blank" rel="noopener">${esc(st.phone || '+91 89776 25078')}</a></div></li>` : ''}
                <li><i class="fa-solid fa-location-dot text-amber-600" aria-hidden="true"></i><div><strong>Wellness Centre:</strong><br><a href="${esc(st.mapUrl || 'https://maps.app.goo.gl/vGo2MHhgGJyLLxrr9')}" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-maroon">2-4-123/E/84/A, Swaroop Nagar, Srinivasa Colony, Uppal, Hyderabad, Telangana - 500039</a><div class="mt-1"><a href="${esc(st.mapUrl || 'https://maps.app.goo.gl/vGo2MHhgGJyLLxrr9')}" target="_blank" rel="noopener" class="text-xs font-semibold text-maroon hover:underline inline-flex items-center gap-1"><i class="fa-solid fa-diamond-turn-right text-2xs"></i> Open Google Maps directions →</a></div></div></li>
                <li><i class="fa-solid fa-building text-zinc-500" aria-hidden="true"></i><div><strong>Registered Shop / Establishment Address:</strong><br><span class="text-xs text-ink-2">${esc(st.registeredAddress || 'GURUJI PALMISTRY, 2-3-123/E, Swaroop Nagar, Ayyappa Swamy Temple Road, Hyderabad, Uppal Bagayath, Uppal, Medchal (Malkajgiri), Telangana')}</span></div></li>
              </ul>
            </div>
            <div class="sp-panel bg-amber-50/70 border border-amber-300">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <i class="fa-solid fa-stamp text-base"></i>
                </div>
                <div class="space-y-1.5 flex-1 text-xs">
                  <div class="font-bold text-night-2 font-serif text-sm">Govt. of Telangana Registered</div>
                  <div class="text-[11px] text-ink-3">Labour Department · Form - II Certificate of Registration</div>
                  <div class="font-mono text-2xs font-bold text-amber-950 bg-white/90 px-2 py-1 rounded border border-amber-300 inline-block">Reg No: SEA/MED/ALO/NR/1439866/2026</div>
                  <div class="text-[11px] text-ink-2">Employer: <strong>Mokkapati Satish Kumar</strong></div>
                  <div class="pt-2 flex flex-wrap gap-2">
                    <button type="button" onclick="openCertificateModal()" class="gold-gradient-btn px-3 py-1.5 rounded-lg text-2xs font-semibold flex items-center gap-1.5 shadow-xs">
                      <i class="fa-regular fa-id-card"></i> View Certificate
                    </button>
                    <a href="/assets/certificate_of_registration_guruji_palmistry.pdf" target="_blank" class="px-3 py-1.5 rounded-lg border border-amber-400 bg-white text-ink text-2xs font-semibold hover:bg-amber-100/50 flex items-center gap-1.5">
                      <i class="fa-solid fa-download"></i> PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div class="sp-panel">
              <h2 class="sp-h3">Book a consultation</h2>
              <p class="sp-text">Most seekers begin with one of these. Message us and we will confirm the fee and a time:</p>
              <ul class="sp-list">${(C().services || []).filter(s => s.core && s.published !== false).map(s => `<li><a href="/services/${esc(s.slug)}" data-link>${esc(s.title)}</a><span>${esc(s.duration || 'On enquiry')}</span></li>`).join('')}</ul>
            </div>
            ${st.mapEmbedUrl && /^https:\/\/(www\.)?google\.com\/maps\/embed/.test(st.mapEmbedUrl) ? `<div class="sp-map"><iframe src="${esc(st.mapEmbedUrl)}" title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ''}
          </aside>
        </div>
      </section>`;
  };

  RENDER.account = () => {
    setTimeout(() => {
      if (typeof window.renderAccountPortal === 'function') {
        window.renderAccountPortal();
      }
    }, 0);
    return `
      ${hero({ eyebrow: 'Seeker Portal', title: 'My Account', sub: 'Access your consultation bookings, pooja sevas, reports and account profile.', crumbs: crumbs([['Home', '/'], ['My Account']]) })}
      <section class="sp-section">
        <div class="sp-wrap max-w-4xl" id="account-portal-container">
          <div class="text-center py-12"><i class="fa-solid fa-spinner fa-spin text-2xl text-maroon"></i><p class="text-xs text-ink-3 mt-2">Loading account portal...</p></div>
        </div>
      </section>
    `;
  };

  window.openCourseRegisterModal = function (slug, title) {
    const modal = document.getElementById('course-register-modal');
    if (!modal) return;
    const titleEl = document.getElementById('course-reg-title');
    const slugEl = document.getElementById('course-reg-slug');
    if (titleEl && title) titleEl.innerText = title;
    if (slugEl && slug) slugEl.value = slug;
    const errEl = document.getElementById('course-reg-error');
    if (errEl) errEl.classList.add('hidden');
    const succEl = document.getElementById('course-reg-success');
    if (succEl) succEl.classList.add('hidden');
    const formEl = document.getElementById('course-register-form');
    if (formEl) formEl.classList.remove('hidden');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  window.closeCourseRegisterModal = function () {
    const modal = document.getElementById('course-register-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  window.handleCourseRegisterSubmit = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('course-reg-btn');
    const errEl = document.getElementById('course-reg-error');
    const name = (document.getElementById('course-reg-name')?.value || '').trim();
    const email = (document.getElementById('course-reg-email')?.value || '').trim();
    const mobile = (document.getElementById('course-reg-mobile')?.value || '').replace(/\D/g, '');
    const mode = (document.querySelector('input[name="course-reg-mode"]:checked')?.value || 'Online');
    const message = (document.getElementById('course-reg-message')?.value || '').trim();
    const slug = document.getElementById('course-reg-slug')?.value || 'palmistry-science-of-palm-reading';
    const title = document.getElementById('course-reg-title')?.innerText || 'PALMISTRY – THE SCIENCE OF PALM READING';

    if (name.length < 2) {
      if (errEl) { errEl.innerText = 'Please enter your full name.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errEl) { errEl.innerText = 'Please enter a valid email address.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (mobile.length !== 10) {
      if (errEl) { errEl.innerText = 'Please enter a valid 10-digit mobile number.'; errEl.classList.remove('hidden'); }
      return;
    }

    if (errEl) errEl.classList.add('hidden');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting…'; }

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'course',
          name,
          email,
          phone: mobile,
          service: slug,
          serviceTitle: title,
          mode,
          message: `Preferred Mode: ${mode}. ${message}`,
          website: '' // honeypot
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to submit registration');

      document.getElementById('course-register-form')?.classList.add('hidden');
      document.getElementById('course-reg-success')?.classList.remove('hidden');
      if (typeof showVedicToast === 'function') {
        showVedicToast('Namaste ' + name + ', your interest has been registered!', 'success');
      }
    } catch (err) {
      if (errEl) { errEl.innerText = err.message || 'Error submitting registration. Please try again.'; errEl.classList.remove('hidden'); }
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i> <span>Submit Registration</span>'; }
    }
  };

  window.submitEnquiry = async function (e) {
    e.preventDefault();
    const form = e.target;
    const f = form.elements;
    const data = {
      kind: f.kind.value, website: f.website.value,
      name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
      service: f.service.value, consultationType: f.consultationType.value,
      mode: (form.querySelector('input[name=mode]:checked') || {}).value || '',
      preferredDate: f.preferredDate.value, preferredTime: f.preferredTime.value,
      message: f.message.value.trim(), whatsapp: f.whatsapp.checked
    };
    // Front-end checks (the server checks again)
    form.querySelectorAll('.sp-field--error').forEach(x => x.classList.remove('sp-field--error'));
    form.querySelectorAll('.field-error-msg').forEach(x => x.remove());
    const errs = [];
    if (data.name.length < 2) errs.push(['name', 'Please enter your full name.']);
    const digits = data.phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) errs.push(['phone', 'Enter a valid 10-digit Indian mobile number.']);
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errs.push(['email', 'Enter a valid email address.']);
    if (data.kind === 'contact' && data.message.length < 5) errs.push(['message', 'Please write a short message.']);
    if (data.kind !== 'contact' && !data.service) errs.push(['service', 'Please choose a service.']);
    if (errs.length) {
      errs.forEach(([name, msg]) => {
        const field = f[name].closest('.sp-field');
        field.classList.add('sp-field--error');
        const p = document.createElement('p'); p.className = 'field-error-msg'; p.textContent = msg; field.appendChild(p);
      });
      f[errs[0][0]].focus();
      return;
    }
    const btn = form.querySelector('#enquiry-submit');
    if (btn.disabled) return;
    if (typeof setButtonLoading === 'function') setButtonLoading(btn, true, 'Sending…'); else btn.disabled = true;
    try {
      const res = await fetchJson('/api/enquiries', { method: 'POST', body: data });
      if (!res) { toast('Could not reach the server. Please check your connection, or message us on WhatsApp.', 'error'); return; }
      const ref = res.enquiry.reference;
      try { localStorage.setItem('guruji_last_enquiry', JSON.stringify({ reference: ref, mobile: digits })); } catch (err) { /* private mode */ }
      const wa = waLink(`Namaste, I have sent an enquiry (reference ${ref}).`);
      $('#enquiry-panel').innerHTML = `
        <div class="sp-confirm" role="status">
          <div class="sp-confirm__icon"><i class="fa-solid fa-check" aria-hidden="true"></i></div>
          <h2 class="sp-h2">Thank you — your enquiry has been received</h2>
          <p class="sp-text">Your reference is <strong class="font-mono">${esc(ref)}</strong>. Please keep it for your records.</p>
          <p class="sp-text">This is not yet a confirmed appointment. We will contact you on <strong>${esc(digits)}</strong>${data.email ? ` or <strong>${esc(data.email)}</strong>` : ''} to confirm the details${res.enquiry.service ? ` for <strong>${esc(res.enquiry.service.title)}</strong>` : ''}.</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            ${wa ? `<a href="${wa}" target="_blank" rel="noopener" class="h-11 px-5 rounded-xl bg-[#25D366] text-white font-semibold flex items-center justify-center gap-2"><i class="fa-brands fa-whatsapp"></i> Message us on WhatsApp</a>` : ''}
            <a href="/" data-link class="sp-btn-outline">Back to home</a>
          </div>
        </div>`;
      $('#enquiry-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      if (typeof setButtonLoading === 'function' && document.body.contains(btn)) setButtonLoading(btn, false);
    }
  };

  /** "Book Now" on any service: pay online, pick a pooja date, or send an enquiry. */
  window.bookService = function (slug) {
    const s = serviceBySlug(slug);
    if (!s) return navigate('/contact');
    if (s.bookingType === 'consultation' && Number(s.price) > 0) {
      if (typeof selectConsultationService === 'function') selectConsultationService(s.consultationId || s.slug, Number(s.price));
      return navigate('/book/consultation');
    }
    if (s.bookingType === 'pooja' && s.poojaId && typeof selectPoojaSeva === 'function') {
      selectPoojaSeva(s.poojaId, s.title, Number(s.price));
      return navigate('/book/pooja');
    }
    return navigate(`/contact?kind=booking&service=${encodeURIComponent(slug)}`);
  };

  // --- Search ---------------------------------------------------------------
  function searchIndex() {
    const out = [];
    (C().services || []).filter(s => s.published !== false).forEach(s => out.push({ t: s.title, d: s.short, u: '/services/' + s.slug, k: 'Service', x: [s.intro, s.description, (s.benefits || []).join(' ')].join(' ') }));
    (C().serviceCategories || []).forEach(c => out.push({ t: c.title, d: c.tagline, u: c.link || '/services/category/' + c.id, k: 'Services', x: c.intro }));
    (C().courses || []).filter(c => c.published !== false).forEach(c => out.push({ t: c.title, d: c.overview, u: '/courses/' + c.slug, k: 'Course', x: (c.curriculum || []).join(' ') }));
    (C().articles || []).filter(a => a.published !== false).forEach(a => out.push({ t: a.title, d: a.excerpt, u: '/resources/' + a.slug, k: 'Article', x: (a.body || []).join(' ') }));
    (C().faqCategories || []).forEach(c => c.items.forEach(([q, a]) => out.push({ t: q, d: a, u: '/faqs?topic=' + c.id + '#faq-' + c.id, k: 'FAQ', x: '' })));
    [['About Guruji', '/about'], ['Reiki Healing', '/reiki-healing'], ['Contact', '/contact'], ['Track Status', '/track'], ['Mantras & Stotras', '/mantras'], ['Palmistry Guide', '/palmistry'], ['Book a Pooja', '/book/pooja']]
      .forEach(([t, u]) => out.push({ t, d: '', u, k: 'Page', x: '' }));
    return out;
  }
  function runSearch(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return searchIndex().map(r => {
      const hay = (r.t + ' ' + r.d + ' ' + r.x).toLowerCase();
      if (!words.every(w => hay.includes(w))) return null;
      const score = words.reduce((n, w) => n + (r.t.toLowerCase().includes(w) ? 3 : 1), 0);
      return { ...r, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 25);
  }
  const resultsHtml = (q, list) => list.length
    ? list.map(r => `<a href="${esc(r.u)}" data-link class="sp-result"><span class="sp-result__kind">${esc(r.k)}</span><span class="sp-result__title">${esc(r.t)}</span>${r.d ? `<span class="sp-result__text">${esc(r.d.slice(0, 140))}</span>` : ''}</a>`).join('')
    : q ? `<p class="p-4 text-sm text-ink-3">Nothing found for “${esc(q)}”.</p>` : '<p class="p-4 text-sm text-ink-3">Try “palm”, “kundali”, “reiki”, “gotram” or “refund”.</p>';

  window.openSiteSearch = function () {
    const box = $('#site-search');
    box.classList.remove('hidden');
    const input = $('#site-search-input');
    input.value = '';
    $('#site-search-results').innerHTML = resultsHtml('', []);
    setTimeout(() => input.focus(), 30);
  };
  window.closeSiteSearch = () => $('#site-search').classList.add('hidden');

  RENDER.search = (params = {}) => {
    const q = (params.query && params.query.q) || '';
    return `${hero({ eyebrow: 'Search', title: q ? `Results for “${q}”` : 'Search', crumbs: crumbs([['Home', '/'], ['Search']]) })}
      <section class="sp-section"><div class="sp-wrap sp-narrow"><div class="sp-results">${resultsHtml(q, runSearch(q))}</div></div></section>`;
  };

  RENDER.notfound = () => `${hero({ title: 'Page not found', sub: 'The page you were looking for has moved or no longer exists.', crumbs: crumbs([['Home', '/'], ['Not found']]) })}
    <section class="sp-section"><div class="sp-wrap sp-narrow flex flex-wrap gap-3"><a href="/" data-link class="gold-gradient-btn h-11 px-5 rounded-xl">Go to home</a><a href="/services" data-link class="sp-btn-outline">Browse services</a><button type="button" class="sp-btn-outline" onclick="openSiteSearch()">Search the site</button></div></section>`;

  // --- Home page blocks ------------------------------------------------------
  function renderHome() {
    const host = $('#home-dynamic-top');
    if (!host) return;
    const st = C().settings || {};
    if (st.hero) {
      if (st.hero.title && $('#hero-title')) $('#hero-title').textContent = st.hero.title;
      if (st.hero.subtitle && $('#hero-subtitle')) $('#hero-subtitle').textContent = st.hero.subtitle;
    }
    const core = (C().services || []).filter(s => s.core && s.published !== false);
    const featuredCourses = (C().courses || []).filter(c => c.featured && c.published !== false).slice(0, 3);
    const testimonials = (C().testimonials || []).filter(t => t.published !== false);
    host.innerHTML = `
      <section class="sp-section sp-pillars-wrap">
        <div class="sp-wrap">
          ${sectionHead('Guruji Palmistry', 'Four pillars', 'Everything we offer grows from four roots.')}
          <div class="grid gap-5 sm:gap-6 grid-cols-2 lg:grid-cols-4">${(C().pillars || []).map((p, i) => `
            <a href="${esc(p.link)}" data-link class="sp-pillar sp-pillar--${i}">
              <span class="sp-pillar-icon-box"><i class="fa-solid ${esc(p.icon)}" aria-hidden="true"></i></span>
              <span class="sp-pillar__title">${esc(p.title)}</span>
              <span class="sp-pillar__text">${esc(p.text)}</span>
            </a>`).join('')}</div>
        </div>
      </section>
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap">
          ${sectionHead('Featured services', 'Four core consultations', 'Detailed Palm Analysis, Comprehensive Kundali Analysis, the Astro-Palmistry Correlation that brings them together — and Reiki Healing.')}
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">${core.map(s => serviceCard(s)).join('')}</div>
          <div class="text-center mt-8"><a href="/services" data-link class="sp-btn-outline">Explore all services</a></div>
        </div>
      </section>

      <section class="sp-section">
        <div class="sp-wrap">
          ${sectionHead('Why Guruji Palmistry', 'Guidance, not fear. Awareness, not dependency.')}
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            ${[['fa-scale-balanced', 'Two sciences, one view', 'Palmistry and astrology read together, with clear explanation of where they agree.'],
      ['fa-heart', 'No fear-based predictions', 'Practical, honest guidance — never pressure to buy remedies.'],
      ['fa-lock', 'Private & secure', 'Your details are used only for your service. Payments by Cashfree.'],
      ['fa-route', 'From reading to practice', 'Japa, puja, Reiki and courses to support what you learn.']]
        .map(([ic, t, d]) => `<div class="sp-why"><i class="fa-solid ${ic}" aria-hidden="true"></i><h3>${t}</h3><p>${d}</p></div>`).join('')}
          </div>
        </div>
      </section>
      ${testimonials.length ? `<section class="sp-section sp-section--tint"><div class="sp-wrap">${sectionHead('Testimonials', 'What seekers say')}<div class="grid gap-5 md:grid-cols-3">${testimonials.slice(0, 6).map(t => `<figure class="sp-panel"><blockquote class="sp-text">“${esc(t.text)}”</blockquote><figcaption class="mt-3 text-sm font-semibold">${esc(t.name)}${t.location ? `<span class="text-ink-3 font-normal"> · ${esc(t.location)}</span>` : ''}</figcaption></figure>`).join('')}</div></div></section>` : ''}`;
  }

  // -------------------------------------------------------------------------
  // Routing
  // -------------------------------------------------------------------------
  const ROUTES = [
    [/^\/$/, 'home'],
    [/^\/messages$/, 'messages'],
    [/^\/about$/, 'about'],
    [/^\/services$/, 'services'],
    [/^\/services\/category\/([a-z0-9-]+)$/, 'service-category', ['cat']],
    [/^\/services\/([a-z0-9-]+)$/, 'service-detail', ['slug']],
    [/^\/reiki-healing$/, 'reiki'],
    [/^\/courses$/, 'courses'],
    [/^\/courses\/([a-z0-9-]+)$/, 'course-detail', ['slug']],
    [/^\/resources$/, 'resources'],
    [/^\/resources\/([a-z0-9-]+)$/, 'article', ['slug']],
    [/^\/faqs$/, 'faqs'],
    [/^\/contact$/, 'contact'],
    [/^\/(disclaimer|privacy-policy|terms|cancellation-refund-policy|consent-policy|grievance)$/, 'policy', ['policy']],
    [/^\/palmistry$/, 'palmistry'],
    [/^\/mantras$/, 'mantras'],
    [/^\/book\/consultation$/, 'book-consultation'],
    [/^\/book\/pooja$/, 'book-pooja'],
    [/^\/book\/(?:details|payment)$/, 'book-consultation'],
    [/^\/book\/upload$/, 'book-status'],
    [/^\/track$/, 'book-status'],
    [/^\/account$/, 'account'],
    [/^\/admin$/, 'admin'],
    [/^\/guruji$/, 'guruji'],
    [/^\/guruji\/([A-Z0-9-]+)$/, 'guruji', ['slug']],
    [/^\/session\/([A-Z0-9-]+)$/, 'session', ['slug']],
    [/^\/learn\/([A-Z0-9-]+)$/, 'learn', ['slug']],
    [/^\/search$/, 'search'],
    [/^\/payment\/return$/, 'payment-return']
  ];
  const STATIC_PATHS = {
    home: '/', about: '/about', services: '/services', reiki: '/reiki-healing', courses: '/courses', resources: '/resources',
    faqs: '/faqs', contact: '/contact', disclaimer: '/disclaimer', 'privacy-policy': '/privacy-policy', terms: '/terms',
    'cancellation-refund-policy': '/cancellation-refund-policy', 'consent-policy': '/consent-policy', grievance: '/grievance',
    messages: '/messages',
    palmistry: '/palmistry', mantras: '/mantras', 'book-consultation': '/book/consultation',
    'book-pooja': '/book/pooja', 'book-status': '/track', account: '/account', admin: '/admin', search: '/search', guruji: '/guruji',
    'book-payment': '/book/payment', 'book-upload': '/book/upload'
  };
  const ALIASES = { 'resource-reiki': ['reiki', {}], 'resource-articles': ['resources', {}], 'resource-astrology': ['resources', { query: { category: 'astrology' } }] };
  const NAV_FOR = {
    home: 'home', about: 'about', services: 'services', 'service-category': 'services', 'service-detail': 'services', reiki: 'reiki',
    courses: 'courses', 'course-detail': 'courses', resources: 'resources', article: 'resources', mantras: 'resources', 'mantra-detail': 'resources',
    palmistry: 'resources', faqs: 'faqs', contact: 'contact', account: 'account', 'book-consultation': 'services', 'book-pooja': 'services',
    policy: 'about'
  };

  function matchRoute(pathname) {
    const p = pathname.replace(/\/+$/, '') || '/';
    for (const [rx, page, keys] of ROUTES) {
      const m = p.match(rx);
      if (m) {
        const params = {};
        (keys || []).forEach((k, i) => { params[k] = m[i + 1]; });
        return { page, params };
      }
    }
    return null;
  }

  function pathFor(pageId, params = {}) {
    switch (pageId) {
      case 'messages': return '/messages';
      case 'service-category': return '/services/category/' + params.cat;
      case 'service-detail': return '/services/' + params.slug;
      case 'course-detail': return '/courses/' + params.slug;
      case 'article': return '/resources/' + params.slug;
      case 'policy': return '/' + params.policy;
      case 'session': return '/session/' + params.slug;
      case 'learn': return '/learn/' + params.slug;
      default: return STATIC_PATHS[pageId] || null;
    }
  }

  const baseShowPage = window.showPage;
  let routerReady = false;

  window.showPage = function (pageId, params, opts) {
    params = params || {};
    opts = opts || {};
    if (ALIASES[pageId]) { const [to, p] = ALIASES[pageId]; pageId = to; params = Object.assign({}, p, params); }
    let target = pageId;
    if (RENDER[pageId] || pageId === 'notfound') {
      const html = (RENDER[pageId] || RENDER.notfound)(params);
      const host = document.getElementById('page-' + (html === false ? 'search' : pageId));
      if (html === false) { host.innerHTML = RENDER.notfound(); target = 'search'; }
      else if (pageId === 'notfound') { document.getElementById('page-search').innerHTML = html; target = 'search'; }
      else host.innerHTML = html;
    }
    if (pageId === 'admin') renderAdmin();
    if (!['guruji', 'book-status', 'messages'].includes(pageId)) stopChat();
    // Guruji's portal is a staff workspace: the public header and footer are hidden there.
    document.body.classList.toggle('staff-portal', pageId === 'guruji');
    if (pageId !== 'guruji' && pageId !== 'admin') refreshSeekerBadge();
    if (pageId === 'guruji') renderGuruji(params.slug || '');
    if (pageId === 'session') setTimeout(() => openSession(params.slug), 0);
    if (pageId === 'learn') setTimeout(() => openCourse(params.slug), 0);
    if (pageId === 'course-detail') setTimeout(() => loadCourseOutline(params.slug), 0);
    if (pageId === 'home') renderHome();
    if (pageId === 'messages') setTimeout(bindMessages, 0);
    baseShowPage(target);
    if (opts.keepScroll) window.scrollTo({ top: 0 });

    // Header highlight
    const nav = NAV_FOR[pageId];
    document.querySelectorAll('[data-nav]').forEach(a => {
      const on = a.dataset.nav === nav;
      a.classList.toggle('nav-pill-active', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });

    // Address bar
    if (routerReady && !opts.fromRouter) {
      let url = opts.url || pathFor(pageId, params);
      if (url && params.query && !opts.url) { const qs = new URLSearchParams(params.query).toString(); if (qs) url += '?' + qs; }
      if (url && url !== location.pathname + location.search + location.hash) {
        history[opts.replace ? 'replaceState' : 'pushState']({ pageId, params }, '', url);
      }
    }
    updateSeo(pageId, params);
    closeSiteSearch();
  };

  function navigate(href, opts = {}) {
    const u = new URL(href, location.origin);
    const r = matchRoute(u.pathname);
    const query = Object.fromEntries(u.searchParams.entries());
    const page = r ? r.page : 'notfound';
    const params = Object.assign({}, r ? r.params : {}, Object.keys(query).length ? { query } : {});
    if (page === 'payment-return') { showPage('payment-return', params, { url: u.pathname + u.search, replace: opts.replace }); handlePaymentReturn(query); return; }
    showPage(page, params, { url: u.pathname + u.search + u.hash, replace: opts.replace, fromRouter: opts.fromRouter, keepScroll: opts.keepScroll });
    if (u.hash) setTimeout(() => { const el = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
  }
  window.navigate = navigate;

  // Intercept internal links so pages change without a reload
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/') || /\.[a-z0-9]{2,5}$/i.test(href.split(/[?#]/)[0])) return;
    e.preventDefault();
    if (typeof closeMobileMenu === 'function') closeMobileMenu();
    navigate(href);
  });

  window.addEventListener('popstate', () => navigate(location.href, { fromRouter: true }));

  // -------------------------------------------------------------------------
  // SEO: title, description, canonical per page
  // -------------------------------------------------------------------------
  function setMeta(selector, attr, value) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
      const m = selector.match(/\[(\w+)="([^"]+)"\]/);
      el.setAttribute(m[1], m[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }
  /**
   * Keeps the head right as the visitor moves between pages.
   *
   * The wording, the canonical address and the structured data all come from
   * seo.js — the same module the server uses to write the head before the page
   * is sent. Describing a page in two places is how the two end up disagreeing.
   */
  function updateSeo(pageId, params) {
    const lib = window.GurujiSeo;
    if (!lib) return;                       // the page keeps the head the server sent
    const path = pathFor(pageId, params) || location.pathname;
    const seo = lib.buildSeo({ pathname: path, content: C(), origin: location.origin });

    document.title = seo.title;
    setMeta('meta[name="description"]', 'content', seo.description);
    setMeta('meta[name="robots"]', 'content', seo.robots);
    setMeta('link[rel="canonical"]', 'href', seo.canonical);
    setMeta('meta[property="og:type"]', 'content', seo.ogType);
    setMeta('meta[property="og:title"]', 'content', seo.title);
    setMeta('meta[property="og:description"]', 'content', seo.description);
    setMeta('meta[property="og:url"]', 'content', seo.canonical);
    setMeta('meta[property="og:image"]', 'content', seo.image);
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', seo.title);
    setMeta('meta[name="twitter:description"]', 'content', seo.description);
    setMeta('meta[name="twitter:image"]', 'content', seo.image);

    let el = document.getElementById('ld-json');
    if (seo.jsonLd) {
      if (!el) {
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = 'ld-json';
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(seo.jsonLd);
    } else if (el) {
      el.remove();                          // a staff page carries no structured data
    }
  }

  // -------------------------------------------------------------------------
  // Settings-driven bits: WhatsApp button, footer, social
  // -------------------------------------------------------------------------
  function applySettings() {
    const st = C().settings || {};
    const fab = $('#whatsapp-fab');
    const wa = waLink('Namaste, I would like to know more.');
    if (fab) { fab.classList.toggle('hidden', !wa); if (wa) fab.href = wa; }
    document.querySelectorAll('[data-setting-whatsapp]').forEach(a => { if (wa) a.href = wa; else a.removeAttribute('href'); });
    document.querySelectorAll('[data-setting-phone]').forEach(el => { el.textContent = st.phone || ''; });
    document.querySelectorAll('[data-setting-email]').forEach(a => { if (st.email) { a.href = 'mailto:' + st.email; a.lastChild.textContent = st.email; } });
    document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
    const social = $('#footer-social');
    if (social) {
      const icons = { instagram: 'fa-instagram', youtube: 'fa-youtube', facebook: 'fa-facebook-f' };
      social.innerHTML = Object.entries(st.social || {}).filter(([, url]) => /^https:\/\//.test(url || ''))
        .map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener" class="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center hover:border-amber-400 hover:text-amber-300" aria-label="${k}"><i class="fa-brands ${icons[k] || 'fa-link'}" aria-hidden="true"></i></a>`).join('');
    }
  }

  // -------------------------------------------------------------------------
  // Gotram picker (searchable list from the master compilation)
  // -------------------------------------------------------------------------
  const GOTRA_UNKNOWN = "I don't know my gotram (Kashyapa used by tradition)";
  function initGotramPickers() {
    const rows = (window.GURUJI_GOTRAS || []).map(([name, variants, group]) => ({ name, variants, group, hay: [name, ...variants].join(' ').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase() }));
    document.querySelectorAll('input[data-gotram-picker]').forEach((input, n) => {
      if (input.dataset.pickerReady) return;
      input.dataset.pickerReady = '1';
      const wrap = input.parentElement;
      wrap.classList.add('gotra-wrap');
      const list = document.createElement('ul');
      list.className = 'gotra-list hidden';
      list.id = 'gotra-list-' + n;
      list.setAttribute('role', 'listbox');
      wrap.appendChild(list);
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-controls', list.id);
      input.setAttribute('aria-expanded', 'false');
      let items = [];
      let active = -1;
      const close = () => { list.classList.add('hidden'); input.setAttribute('aria-expanded', 'false'); active = -1; };
      const choose = (v) => { input.value = v; close(); input.dispatchEvent(new Event('change', { bubbles: true })); input.closest('.bk-field, div')?.classList.remove('field-error'); };
      const render = () => {
        const q = input.value.trim().normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const matches = q ? rows.filter(r => r.hay.includes(q)).sort((a, b) => (a.hay.startsWith(q) ? 0 : 1) - (b.hay.startsWith(q) ? 0 : 1)) : rows.filter(r => r.group === 'rishi');
        items = [GOTRA_UNKNOWN, ...matches.slice(0, 60).map(r => r.name + (r.variants.length ? ` (${r.variants.join(' / ')})` : ''))];
        if (q && !matches.some(r => r.name.toLowerCase() === q)) items.push(`Use “${input.value.trim()}”`);
        list.innerHTML = items.map((t, i) => `<li role="option" id="${list.id}-${i}" class="${i === 0 ? 'gotra-list__unknown' : ''}" aria-selected="false">${esc(t)}</li>`).join('') +
          (q ? '' : '<li class="gotra-list__hint" aria-disabled="true">Type to search all ' + rows.length + ' gotrams</li>');
        list.classList.remove('hidden');
        input.setAttribute('aria-expanded', 'true');
        active = -1;
      };
      const value = (t) => t.startsWith('Use “') ? t.slice(5, -1) : t === GOTRA_UNKNOWN ? 'Not known (Kashyapa)' : t.replace(/ \(.*\)$/, '') + ' Gotram';
      input.addEventListener('focus', render);
      input.addEventListener('input', render);
      input.addEventListener('keydown', (e) => {
        if (list.classList.contains('hidden')) return;
        const opts = list.querySelectorAll('li[role=option]');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
          opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
          input.setAttribute('aria-activedescendant', opts[active].id);
          opts[active].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && active >= 0) {
          e.preventDefault(); choose(value(items[active]));
        } else if (e.key === 'Escape') close();
      });
      list.addEventListener('mousedown', (e) => {
        const li = e.target.closest('li[role=option]');
        if (!li) return;
        e.preventDefault();
        choose(value(items[Number(li.id.split('-').pop())]));
      });
      input.addEventListener('blur', () => setTimeout(close, 120));
    });
  }

  // -------------------------------------------------------------------------
  // Birth place picker — a Kundali needs the latitude and longitude of the place
  // -------------------------------------------------------------------------
  let placesPromise = null;
  const loadPlaces = () => (placesPromise = placesPromise || fetchJson('/assets/places-in.json').catch(() => []));

  function initPlacePicker() {
    const input = $('#devotee-pob');
    const list = $('#pob-list');
    const latEl = $('#devotee-lat');
    const lonEl = $('#devotee-lon');
    if (!input || !list || input.dataset.pickerReady) return;
    input.dataset.pickerReady = '1';
    input.parentElement.classList.add('gotra-wrap');

    let rows = [];
    let shown = [];
    let active = -1;
    const norm = (v) => String(v).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const close = () => { list.classList.add('hidden'); input.setAttribute('aria-expanded', 'false'); active = -1; };
    const note = (text, tone) => {
      const el = $('#pob-coord-note');
      if (el) { el.textContent = text; el.className = 'text-2xs pb-2.5 ' + (tone === 'ok' ? 'text-emerald-700' : 'text-ink-3'); }
    };
    const choose = (r) => {
      input.value = r[1] ? `${r[0]}, ${r[1]}` : r[0];
      latEl.value = r[2];
      lonEl.value = r[3];
      note(`Co-ordinates filled in from ${r[0]}. You can correct them if you know better.`, 'ok');
      close();
    };
    const render = async () => {
      const q = norm(input.value.trim());
      if (!rows.length) {
        const data = await loadPlaces();
        rows = Array.isArray(data) ? data.map(r => [...r, norm(r[0] + ' ' + r[1])]) : [];
      }
      if (q.length < 2) { close(); return; }
      shown = rows.filter(r => r[4].includes(q)).sort((a, b) => (a[4].startsWith(q) ? 0 : 1) - (b[4].startsWith(q) ? 0 : 1)).slice(0, 40);
      list.innerHTML = shown.length
        ? shown.map((r, i) => `<li role="option" id="pob-opt-${i}" aria-selected="false">${esc(r[0])}<span class="text-ink-3"> · ${esc(r[1])}</span></li>`).join('')
        : '<li class="gotra-list__hint" aria-disabled="true">Not in the list — type the place and fill the co-ordinates in yourself.</li>';
      list.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      active = -1;
    };
    input.addEventListener('focus', render);
    input.addEventListener('input', () => { latEl.value = ''; lonEl.value = ''; render(); });
    input.addEventListener('keydown', (e) => {
      const opts = list.querySelectorAll('li[role=option]');
      if (list.classList.contains('hidden') || !opts.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
        opts[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        choose(shown[active]);
      } else if (e.key === 'Escape') close();
    });
    list.addEventListener('mousedown', (e) => {
      const li = e.target.closest('li[role=option]');
      if (!li) return;
      e.preventDefault();
      choose(shown[Number(li.id.split('-').pop())]);
    });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }

  // -------------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------------
  let cashfreeSdk = null;
  function loadCashfree() {
    if (window.Cashfree) return Promise.resolve(window.Cashfree);
    if (cashfreeSdk) return cashfreeSdk;
    cashfreeSdk = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.onload = () => (window.Cashfree ? resolve(window.Cashfree) : reject(new Error('Cashfree did not load')));
      s.onerror = () => { cashfreeSdk = null; reject(new Error('Could not load the payment page. Please check your connection.')); };
      document.head.appendChild(s);
    });
    return cashfreeSdk;
  }

  async function refreshPaymentPage() {
    const test = $('#pay-test-mode');
    const btn = $('#pay-now-btn');
    if (!btn || typeof state === 'undefined') return;
    const svc = state.selectedService || {};
    const price = Number(svc.price) || 0;
    $('#pay-service-title').textContent = svc.title || 'Consultation';
    $('#pay-amount-display').textContent = '₹ ' + price.toLocaleString('en-IN');
    btn.querySelector('span').textContent = `Pay ₹${price.toLocaleString('en-IN')} securely`;
    const live = SITE.payments === 'cashfree';
    test.classList.toggle('hidden', live);
    btn.classList.toggle('hidden', !live);

    // Create (or reuse) the booking now, so the seeker can see the reference and
    // the amount the server will actually charge before paying. Only ever from
    // the payment page itself: this runs on every page load, and creating a
    // booking from, say, the home page filled the records with abandoned ones.
    if (state.currentPage !== 'book-payment') return;
    if (typeof ensureBooking !== 'function' || state.paymentStatus === 'SUCCESS') return;
    try {
      const booking = await ensureBooking();
      if (!booking || state.currentPage !== 'book-payment') return;
      $('#pay-service-title').textContent = booking.service.title;
      $('#pay-amount-display').textContent = '₹ ' + Number(booking.amount).toLocaleString('en-IN');
      btn.querySelector('span').textContent = `Pay ₹${Number(booking.amount).toLocaleString('en-IN')} securely`;
    } catch (err) {
      toast(err.message, 'error');
      if (/filled up/.test(err.message) && state.selectedService.id === 'pooja_sevas') {
        showPage('book-pooja');
        loadPoojaSlots(state.pooja.date);
      }
    }
  }

  window.startOnlinePayment = async function (btn) {
    if (SITE.payments !== 'cashfree') return simulatePaymentSuccess(btn);
    if (state.paymentInFlight) return;
    state.paymentInFlight = true;
    setButtonLoading(btn, true, 'Opening secure payment…');
    try {
      const booking = await ensureBooking();
      if (!booking) throw new Error('Could not reach the server. Please check your connection.');
      const [Cashfree, session] = await Promise.all([
        loadCashfree(),
        fetchJson(`/api/bookings/${encodeURIComponent(booking.orderId)}/payment`, { method: 'POST', body: { mobile: booking.devotee.mobile } })
      ]);
      const cf = Cashfree({ mode: session.mode === 'production' ? 'production' : 'sandbox' });
      await cf.checkout({ paymentSessionId: session.paymentSessionId, redirectTarget: '_self' });
    } catch (err) {
      toast(err.message, 'error');
      if (/filled up/.test(err.message) && state.selectedService.id === 'pooja_sevas') { showPage('book-pooja'); loadPoojaSlots(state.pooja.date); }
      setButtonLoading(btn, false);
    } finally {
      state.paymentInFlight = false;
    }
  };

  async function handlePaymentReturn(query) {
    const host = $('#page-payment-return');
    const ref = (query.ref || '').toUpperCase();
    let mobile = query.mobile || '';
    try { const last = JSON.parse(localStorage.getItem('guruji_last_booking') || 'null'); if (last && last.orderId === ref) mobile = last.mobile; } catch (e) { /* ignore */ }
    const shell = (inner) => `<section class="sp-section"><div class="sp-wrap sp-narrow"><div class="sp-panel sp-confirm">${inner}</div></div></section>`;
    if (!ref) { host.innerHTML = shell('<h1 class="sp-h2">No booking reference</h1><p class="sp-text"><a href="/track" data-link class="sp-link">Track a booking</a></p>'); return; }
    if (!mobile) {
      host.innerHTML = shell(`<h1 class="sp-h2">Confirm your payment</h1><p class="sp-text">Enter the mobile number you booked with to see booking <strong class="font-mono">${esc(ref)}</strong>.</p>
        <form class="flex gap-2 justify-center mt-4" onsubmit="event.preventDefault(); navigate('/payment/return?ref=${encodeURIComponent(ref)}&mobile=' + encodeURIComponent(this.m.value), {replace:true})"><input name="m" class="sp-input" inputmode="numeric" placeholder="10-digit mobile" required><button class="gold-gradient-btn h-11 px-5 rounded-xl">Check</button></form>`);
      return;
    }
    host.innerHTML = shell('<div class="sp-spinner" aria-hidden="true"></div><h1 class="sp-h2">Confirming your payment…</h1><p class="sp-text">Please don’t close this page.</p>');
    let booking = null;
    for (let i = 0; i < 4 && !booking; i++) {
      try {
        const res = await fetchJson(`/api/bookings/${encodeURIComponent(ref)}/verify-payment`, { method: 'POST', body: { mobile } });
        if (res && res.booking && (res.booking.status !== 'PENDING_PAYMENT' || i === 3)) booking = res.booking;
      } catch (err) {
        host.innerHTML = shell(`<h1 class="sp-h2">We could not find that booking</h1><p class="sp-text">${esc(err.message)}</p><a href="/track" data-link class="sp-btn-outline mt-4 inline-flex">Track a booking</a>`);
        return;
      }
      if (!booking) await new Promise(r => setTimeout(r, 2000));
    }
    if (!booking) return;
    state.booking = booking;
    state.orderId = booking.orderId;
    document.querySelectorAll('[data-order-id]').forEach(el => (el.textContent = booking.orderId));
    state.user.mobile = booking.devotee.mobile;
    state.user.name = booking.devotee.name;
    state.selectedService = booking.type === 'pooja'
      ? { id: 'pooja_sevas', title: booking.service.title, price: booking.amount, duration: booking.service.duration }
      : { id: booking.service.id, title: booking.service.title, price: booking.amount, duration: booking.service.duration };
    if (['PAID', 'DETAILS_RECEIVED', 'COMPLETED', 'SCHEDULED'].includes(booking.status)) {
      state.paymentStatus = 'SUCCESS';
      if (typeof completePayment === 'function') completePayment();
      return;
    }
    host.innerHTML = shell(`<div class="sp-confirm__icon sp-confirm__icon--warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></div>
      <h1 class="sp-h2">Payment not completed</h1>
      <p class="sp-text">Booking <strong class="font-mono">${esc(booking.orderId)}</strong> has not been paid${booking.status === 'PAYMENT_FAILED' ? ' — the payment failed or was cancelled' : ' yet'}. If money was deducted, it will be confirmed automatically within a few minutes, or refunded.</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4">
        <button class="gold-gradient-btn h-11 px-5 rounded-xl" onclick="showPage('book-payment')">Try payment again</button>
        <a href="/track" data-link class="sp-btn-outline">Track booking</a>
      </div>`);
  }

  // -------------------------------------------------------------------------
  // Chat between the seeker and Guruji (polled; no websocket on serverless)
  // -------------------------------------------------------------------------
  const CHAT = { timer: null, lastAt: '', orderId: null, auth: null, el: null };

  /** Everyone here keeps Indian time, so the clock is fixed to IST rather than
   *  the reader's device, which may be anywhere. */
  const chatTime = (at) => new Date(at).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata'
  });

  /** A message may carry one file. The URL is built from the base the chat was
   *  opened with, so the same bubble works in Guruji's panel and the seeker's. */
  // fileBase may carry its own query (?mobile=… on the Track page), so the
  // download flag is joined with & when it needs to be.
  const withFlag = (url, flag) => url + (url.includes('?') ? '&' : '?') + flag;
  const chatAttachmentMarkup = (m, fileBase) => {
    const a = m.attachment;
    if (!a || !fileBase) return '';
    const [basePath, baseQs] = fileBase.split('?');
    const url = `${basePath}/${encodeURIComponent(a.mediaId)}${baseQs ? '?' + baseQs : ''}`;
    const kb = Math.max(1, Math.round((a.size || 0) / 1024));
    if (a.kind === 'image') {
      return `<figure class="chat-att chat-att--img">
        <img data-chat-img="${esc(url)}" alt="${esc(a.name || 'Shared photo')}">
        <figcaption>
          <a href="${esc(withFlag(url, 'download=1'))}" data-chat-file="${esc(withFlag(url, 'download=1'))}" download="${esc(a.name || 'photo.jpg')}">Download</a>
          <span>${kb} KB</span>
        </figcaption>
      </figure>`;
    }
    return `<div class="chat-att chat-att--pdf">
      <i class="fa-regular fa-file-pdf" aria-hidden="true"></i>
      <span class="chat-att__name">${esc(a.name || 'reading.pdf')}</span>
      <span class="chat-att__size">${kb} KB</span>
      <a class="chat-att__open" data-chat-file="${esc(url)}" href="${esc(url)}" target="_blank" rel="noopener">Open</a>
      <a class="chat-att__dl" data-chat-file="${esc(withFlag(url, 'download=1'))}" href="${esc(withFlag(url, 'download=1'))}" download="${esc(a.name || 'reading.pdf')}">Download</a>
    </div>`;
  };

  const chatBubble = (m, you, fileBase) => {
    const mine = m.from === you;
    return `
    <li class="chat-msg ${mine ? 'chat-msg--mine' : ''}" data-at="${esc(m.at)}">
      <span class="chat-msg__who">${esc(m.from === 'guruji' ? 'Guruji' : m.name || 'You')}</span>
      ${chatAttachmentMarkup(m, fileBase)}
      ${m.text ? `<p>${esc(m.text).replace(/\n/g, '<br>')}</p>` : ''}
      <span class="chat-msg__foot">
        <time datetime="${esc(m.at)}">${chatTime(m.at)} IST</time>
        ${mine ? '<span class="chat-msg__seen" data-seen>Sent</span>' : ''}
      </span>
    </li>`;
  };

  /** Attachment images are private, so they are fetched rather than linked.
   *  Guruji's headers go with the request; a seeker's session cookie does. */
  const chatImgCache = new Map();
  function loadChatImages(list, headers) {
    list.querySelectorAll('img[data-chat-img]').forEach(async (im) => {
      const url = im.getAttribute('data-chat-img');
      im.removeAttribute('data-chat-img');
      try {
        if (!chatImgCache.has(url)) {
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error('not available');
          chatImgCache.set(url, URL.createObjectURL(await res.blob()));
        }
        im.src = chatImgCache.get(url);
      } catch (e) { im.replaceWith(Object.assign(document.createElement('p'),
        { className: 'chat-att__gone', textContent: 'This photo is no longer available.' })); }
    });
  }

  /** Marks your own messages Seen up to the point the other side has read. */
  function applySeen(list, seenUpTo) {
    list.querySelectorAll('.chat-msg--mine').forEach((li) => {
      const tag = li.querySelector('[data-seen]');
      if (!tag) return;
      const seen = Boolean(seenUpTo) && li.dataset.at <= seenUpTo;
      tag.textContent = seen ? 'Seen' : 'Sent';
      tag.classList.toggle('is-seen', seen);
    });
  }

  function chatMarkup(title, opts = {}) {
    return `<div class="chat${opts.bare ? ' chat--bare' : ''}">
      <div class="chat__head"${opts.bare ? ' hidden' : ''}><h3>${esc(title)}</h3><span class="chat__state" data-chat-state>Connecting…</span></div>
      <ul class="chat__list" data-chat-list aria-live="polite" aria-label="Messages"></ul>
      <form class="chat__form" data-chat-form>
        <label class="sr-only" for="chat-input">Your message</label>
        <textarea id="chat-input" rows="2" maxlength="2000" placeholder="Write to Guruji…" data-chat-input></textarea>
        <button type="submit" class="gold-gradient-btn h-11 px-5 rounded-xl">Send</button>
      </form>
    </div>`;
  }

  /** auth is { mobile } for a seeker, or { pin } for Guruji.
   *  opts.base overrides the endpoint, which is how the same chat serves a
   *  booking thread, a general thread, and either side of both. */
  function startChat(container, orderId, auth, opts = {}) {
    stopChat();
    CHAT.orderId = orderId; CHAT.auth = auth; CHAT.el = container; CHAT.lastAt = '';
    const base = opts.base || `/api/bookings/${encodeURIComponent(orderId)}`;
    const fileBase = opts.fileBase || (opts.base ? `${base}/files`
      : `${base}/files${auth.mobile ? '?mobile=' + encodeURIComponent(auth.mobile) : ''}`);
    const list = container.querySelector('[data-chat-list]');
    const state = container.querySelector('[data-chat-state]');
    const form = container.querySelector('[data-chat-form]');
    const input = container.querySelector('[data-chat-input]');
    let you = auth.pin ? 'guruji' : 'devotee';

    // Guruji signs with a PIN header; a signed-in seeker with a bearer token.
    const headers = auth.pin ? { 'x-admin-pin': auth.pin }
      : auth.token ? { Authorization: 'Bearer ' + auth.token } : {};
    const qs = () => `?${auth.mobile ? 'mobile=' + encodeURIComponent(auth.mobile) + '&' : ''}since=${encodeURIComponent(CHAT.lastAt)}`;

    async function poll() {
      try {
        const res = await fetchJson(`${base}/messages${qs()}`, { headers });
        if (!res) { state.textContent = 'Offline'; return; }
        you = res.you;
        if (res.messages.length) {
          const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
          list.insertAdjacentHTML('beforeend', res.messages.map(m => chatBubble(m, you, fileBase)).join(''));
          loadChatImages(list, headers);
          CHAT.lastAt = res.messages[res.messages.length - 1].at;
          if (atBottom) list.scrollTop = list.scrollHeight;
        }
        if (!list.children.length) list.innerHTML = '<li class="chat__empty">No messages yet. Write the first one.</li>';
        applySeen(list, res.seenUpTo || '');
        state.textContent = 'Live';
      } catch (err) {
        state.textContent = err.status === 404 ? 'Not found' : 'Offline';
      }
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      try {
        await fetchJson(`${base}/messages`, {
          method: 'POST', headers, body: Object.assign({ text }, auth.mobile ? { mobile: auth.mobile } : {})
        });
        list.querySelector('.chat__empty')?.remove();
        await poll();
      } catch (err) { toast(err.message, 'error'); input.value = text; }
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.requestSubmit(); });
    // Open / Download on a shared file. A plain link cannot carry Guruji's PIN
    // or a seeker's token, so the file is fetched with them and handed over.
    if (!list.dataset.fileClicks) {
      list.dataset.fileClicks = '1';
      list.addEventListener('click', async (ev) => {
        const a = ev.target.closest('a[data-chat-file]');
        if (!a) return;
        ev.preventDefault();
        const url = a.getAttribute('data-chat-file');
        const saving = /[?&]download=1/.test(url);
        const tab = saving ? null : window.open('', '_blank');
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error('That file could not be opened.');
          const href = URL.createObjectURL(await res.blob());
          if (tab) { tab.location.href = href; return; }
          const dl = Object.assign(document.createElement('a'), { href, download: a.getAttribute('download') || 'file' });
          document.body.appendChild(dl); dl.click(); dl.remove();
          setTimeout(() => URL.revokeObjectURL(href), 60000);
        } catch (err) {
          if (tab) tab.close();
          toast(err.message, 'error');
        }
      });
    }
    poll();
    // A background tab does not need fresh messages every five seconds; each
    // poll costs the server a read and a write. It catches up the moment the
    // tab is looked at again.
    CHAT.timer = setInterval(() => { if (!document.hidden) poll(); }, 5000);
    CHAT.onVisible = () => { if (!document.hidden && CHAT.timer) poll(); };
    document.addEventListener('visibilitychange', CHAT.onVisible);
  }
  function stopChat() {
    if (CHAT.timer) clearInterval(CHAT.timer);
    CHAT.timer = null;
    if (CHAT.onVisible) document.removeEventListener('visibilitychange', CHAT.onVisible);
    CHAT.onVisible = null;
  }

  // -------------------------------------------------------------------------
  // The session room (Jitsi)
  // -------------------------------------------------------------------------
  let jitsiScript = null;
  function loadJitsi(domain) {
    if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI);
    if (jitsiScript) return jitsiScript;
    jitsiScript = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = `https://${domain}/external_api.js`;
      el.async = true;
      el.onload = () => (window.JitsiMeetExternalAPI ? resolve(window.JitsiMeetExternalAPI) : reject(new Error('The video service did not load')));
      el.onerror = () => { jitsiScript = null; reject(new Error('Could not reach the video service. Check your connection.')); };
      document.head.appendChild(el);
    });
    return jitsiScript;
  }

  const SESSION = { api: null, orderId: null, countdown: null };

  function sessionAuth(orderId) {
    if (ADMIN.pin && ['guruji', 'owner'].includes(ADMIN.role)) return { pin: ADMIN.pin };
    try {
      const last = JSON.parse(localStorage.getItem('guruji_last_booking') || 'null');
      if (last && last.orderId === orderId && last.mobile) return { mobile: last.mobile };
    } catch (e) { /* private mode */ }
    if (typeof state !== 'undefined' && state.booking && state.booking.orderId === orderId && state.user.mobile) return { mobile: state.user.mobile };
    return null;
  }

  const shell = (inner) => `<section class="sp-section"><div class="sp-wrap sp-narrow"><div class="sp-panel sp-confirm">${inner}</div></div></section>`;

  RENDER.session = ({ slug }) => `
    <section class="sp-section session-page" data-session-root data-order="${esc(slug || '')}">
      <div class="sp-wrap">
        <div class="session-head">
          <div>
            <p class="sp-eyebrow sp-eyebrow--maroon">Consultation room</p>
            <h1 class="sp-h2" data-session-title>Preparing your room…</h1>
            <p class="sp-text" data-session-sub>Booking <span class="font-mono">${esc(slug || '')}</span></p>
          </div>
          <a href="/track" data-link class="sp-btn-outline">Back to my booking</a>
        </div>
        <div class="session-stage" data-session-stage>
          <div class="sp-spinner" aria-hidden="true"></div>
        </div>
      </div>
    </section>`;

  async function openSession(orderId) {
    const root = $('[data-session-root]');
    if (!root) return;
    const stage = root.querySelector('[data-session-stage]');
    const title = root.querySelector('[data-session-title]');
    const sub = root.querySelector('[data-session-sub]');
    const auth = sessionAuth(orderId);
    if (!auth) {
      title.textContent = 'Who is joining?';
      stage.innerHTML = `<form class="session-ask" onsubmit="event.preventDefault(); sessionSignIn(this)">
        <p class="sp-text">Enter the mobile number you booked with, and we will open your room.</p>
        <div class="flex gap-2 flex-wrap justify-center mt-3">
          <input name="m" class="sp-input" inputmode="numeric" placeholder="10-digit mobile" required aria-label="Mobile number">
          <button class="gold-gradient-btn h-11 px-5 rounded-xl">Continue</button>
        </div>
        <p class="text-xs text-ink-3 mt-3">Guruji joins from his own case area.</p>
      </form>`;
      return;
    }
    const headers = auth.pin ? { 'x-admin-pin': auth.pin } : {};
    const qs = auth.mobile ? `?mobile=${encodeURIComponent(auth.mobile)}` : '';
    let info;
    try {
      info = await fetchJson(`/api/bookings/${encodeURIComponent(orderId)}/session${qs}`, { headers });
      if (!info) throw new Error('The server could not be reached.');
    } catch (err) {
      const code = err.code || '';
      if (code === 'too_early') {
        title.textContent = 'Your room is not open yet';
        stage.innerHTML = `<div class="session-wait">
          <p class="sp-text">The room opens ten minutes before your time.</p>
          <p class="session-countdown" data-countdown>—</p>
          <p class="sp-text">Appointment: <strong>${new Date(err.opensAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</strong> onwards.</p>
          <button class="sp-btn-outline mt-3" onclick="openSession('${esc(orderId)}')">Check again</button>
        </div>`;
        startCountdown(err.opensAt, orderId);
        return;
      }
      title.textContent = code === 'ended' ? 'This session has ended' : 'The room cannot be opened';
      stage.innerHTML = `<div class="session-wait"><p class="sp-text">${esc(err.message)}</p>
        <div class="flex gap-3 justify-center mt-4 flex-wrap">
          <a href="/track" data-link class="sp-btn-outline">My booking</a>
          <a href="/contact" data-link class="sp-btn-outline">Contact us</a>
        </div></div>`;
      return;
    }

    title.textContent = 'Your consultation room';
    sub.innerHTML = `Booking <span class="font-mono">${esc(orderId)}</span> · open until ${new Date(info.closesAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
    stage.innerHTML = `
      <div class="session-precheck" data-precheck>
        <h2 class="sp-h3">Before you join</h2>
        <ul class="sp-ticks">
          <li>Find a quiet place with a steady connection.</li>
          <li>Your browser will ask for the camera and microphone — please allow them.</li>
          <li>If the camera is blocked, open the padlock in the address bar and allow it, then press Join again.</li>
        </ul>
        ${info.productionSafe ? '' : '<p class="sp-notice" style="margin-top:1rem"><i class="fa-solid fa-triangle-exclamation"></i> This room is on the public Jitsi service, which anyone with the link could enter. Set the Jitsi keys before using it for real consultations.</p>'}
        <div class="session-actions">
          <button class="gold-gradient-btn h-12 px-6 rounded-xl" data-join-video>Join with video</button>
          <button class="sp-btn-outline" data-join-audio>Audio only</button>
        </div>
      </div>
      <div class="session-frame hidden" data-frame></div>`;

    const start = (audioOnly) => joinRoom(orderId, info, auth, audioOnly);
    stage.querySelector('[data-join-video]').addEventListener('click', () => start(false));
    stage.querySelector('[data-join-audio]').addEventListener('click', () => start(true));
  }
  window.openSession = openSession;

  window.sessionSignIn = (form) => {
    const mobile = form.m.value.replace(/\D/g, '').slice(-10);
    try { localStorage.setItem('guruji_last_booking', JSON.stringify({ orderId: $('[data-session-root]').dataset.order, mobile })); } catch (e) { /* ignore */ }
    openSession($('[data-session-root]').dataset.order);
  };

  function startCountdown(opensAt, orderId) {
    clearInterval(SESSION.countdown);
    const el = $('[data-countdown]');
    if (!el) return;
    const tick = () => {
      const ms = new Date(opensAt) - Date.now();
      if (ms <= 0) { clearInterval(SESSION.countdown); openSession(orderId); return; }
      const s = Math.floor(ms / 1000);
      const d = Math.floor(s / 86400);
      el.textContent = d > 0
        ? `opens in ${d} day${d > 1 ? 's' : ''}, ${Math.floor(s % 86400 / 3600)} hours`
        : `opens in ${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    tick();
    SESSION.countdown = setInterval(tick, 1000);
  }

  async function joinRoom(orderId, info, auth, audioOnly) {
    const stage = $('[data-session-stage]');
    const frame = stage.querySelector('[data-frame]');
    stage.querySelector('[data-precheck]').classList.add('hidden');
    frame.classList.remove('hidden');
    frame.innerHTML = '<div class="sp-spinner" aria-hidden="true"></div>';
    let Jitsi;
    try {
      Jitsi = await loadJitsi(info.domain);
    } catch (err) {
      frame.innerHTML = `<div class="session-wait"><p class="sp-text">${esc(err.message)}</p>
        <button class="sp-btn-outline mt-3" onclick="openSession('${esc(orderId)}')">Try again</button></div>`;
      return;
    }
    frame.innerHTML = '';
    const options = {
      roomName: info.roomName,
      parentNode: frame,
      width: '100%', height: '100%',
      userInfo: { displayName: info.displayName },
      configOverwrite: {
        startWithVideoMuted: audioOnly || info.role === 'guest',
        startWithAudioMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        toolbarButtons: ['microphone', 'camera', 'hangup', 'chat', 'tileview', 'settings', 'raisehand', 'fullscreen']
      },
      interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, SHOW_BRAND_WATERMARK: false, MOBILE_APP_PROMO: false }
    };
    if (info.jwt) options.jwt = info.jwt;
    const api = new Jitsi(info.domain, options);
    SESSION.api = api;
    SESSION.orderId = orderId;

    const headers = auth.pin ? { 'x-admin-pin': auth.pin } : {};
    fetchJson(`/api/bookings/${encodeURIComponent(orderId)}/session/joined`, {
      method: 'POST', headers, body: auth.mobile ? { mobile: auth.mobile } : {}
    }).catch(() => { });

    api.addEventListener('videoConferenceLeft', () => leaveSession(orderId));
    api.addEventListener('readyToClose', () => leaveSession(orderId));
    api.addEventListener('participantJoined', () => toast('The other person has joined.'));
  }

  function leaveSession(orderId) {
    if (SESSION.api) { try { SESSION.api.dispose(); } catch (e) { /* already gone */ } SESSION.api = null; }
    const stage = $('[data-session-stage]');
    if (stage) {
      stage.innerHTML = `<div class="session-wait">
        <div class="sp-confirm__icon"><i class="fa-solid fa-check" aria-hidden="true"></i></div>
        <h2 class="sp-h3">You have left the session</h2>
        <p class="sp-text">You can rejoin while the room is open.</p>
        <div class="flex gap-3 justify-center mt-4 flex-wrap">
          <button class="gold-gradient-btn h-11 px-5 rounded-xl" onclick="openSession('${esc(orderId)}')">Rejoin</button>
          <a href="/track" data-link class="sp-btn-outline">My booking</a>
        </div></div>`;
    }
  }

  // -------------------------------------------------------------------------
  // Self-paced courses: enrolment and the lesson player
  // -------------------------------------------------------------------------
  const LEARN = { ref: '', data: null, index: 0 };

  /** Lesson outline + enrolment box, injected into a course page that has lessons. */
  async function loadCourseOutline(slug) {
    const host = $('[data-course-selfpaced]');
    if (!host) return;
    let res;
    try { res = await fetchJson(`/api/courses/${encodeURIComponent(slug)}/outline`); } catch (e) { return; }
    if (!res || !res.outline) return;
    const o = res.outline;
    const free = !o.price;
    host.innerHTML = `
      <div class="sp-panel learn-offer">
        <h2 class="sp-h3">Start today — self-paced</h2>
        <p class="sp-text">${esc(o.blurb)}</p>
        <p class="learn-meta">${o.lessonCount} lessons · about ${o.minutes} minutes in total${free ? ' · no fee' : ''}</p>
        <ol class="learn-outline">${o.lessons.map(l => `<li><strong>${esc(l.title)}</strong><span>${l.minutes} min</span><em>${esc(l.summary)}</em></li>`).join('')}</ol>
        <form class="learn-enrol" onsubmit="event.preventDefault(); enrolCourse(this, '${esc(slug)}')">
          <h3 class="sp-h4">Enrol</h3>
          <p class="text-xs text-ink-3">No account and no password. We keep your reference on this device, and you can open the lessons again from Track Status with your reference and mobile number.</p>
          <div class="learn-enrol__fields">
            <label class="sr-only" for="enrol-name">Your name</label>
            <input id="enrol-name" name="name" class="sp-input" placeholder="Your name" required minlength="2" autocomplete="name">
            <label class="sr-only" for="enrol-mobile">Mobile number</label>
            <input id="enrol-mobile" name="mobile" class="sp-input" placeholder="10-digit mobile" inputmode="numeric" required autocomplete="tel">
            <label class="sr-only" for="enrol-email">Email</label>
            <input id="enrol-email" name="email" type="email" class="sp-input" placeholder="Email" required autocomplete="email">
          </div>
          <button class="gold-gradient-btn h-12 px-6 rounded-xl mt-3">${free ? 'Enrol free and start' : 'Enrol'}</button>
          <p class="learn-enrol__msg" data-enrol-msg role="status"></p>
        </form>
      </div>`;
  }

  window.enrolCourse = async function (form, slug) {
    const msg = form.querySelector('[data-enrol-msg]');
    const btn = form.querySelector('button');
    const mobile = form.mobile.value.replace(/\D/g, '').slice(-10);
    if (mobile.length !== 10) { msg.textContent = 'Please enter the 10-digit mobile number.'; return; }
    btn.disabled = true; msg.textContent = 'Enrolling…';
    try {
      const res = await fetchJson('/api/bookings', {
        method: 'POST',
        body: { type: 'course', courseSlug: slug, devotee: { name: form.name.value.trim(), mobile, email: form.email.value.trim() } }
      });
      if (!res) throw new Error('The server could not be reached.');
      const ref = res.booking.orderId;
      try { localStorage.setItem('guruji_last_booking', JSON.stringify({ orderId: ref, mobile })); } catch (e) { /* private mode */ }
      msg.textContent = `Enrolled. Your reference is ${ref}.`;
      navigate('/learn/' + ref);
    } catch (err) {
      msg.textContent = err.message;
      btn.disabled = false;
    }
  };

  RENDER.learn = ({ slug }) => `
    <section class="sp-section learn-page" data-learn-root data-ref="${esc(slug || '')}">
      <div class="sp-wrap">
        <div class="session-head">
          <div>
            <p class="sp-eyebrow sp-eyebrow--maroon">Your course</p>
            <h1 class="sp-h2" data-learn-title>Opening your lessons…</h1>
            <p class="sp-text" data-learn-sub>Enrolment <span class="font-mono">${esc(slug || '')}</span></p>
          </div>
          <a href="/courses" data-link class="sp-btn-outline">All courses</a>
        </div>
        <div data-learn-stage><div class="sp-spinner" aria-hidden="true"></div></div>
      </div>
    </section>`;

  async function openCourse(ref) {
    const root = $('[data-learn-root]');
    if (!root) return;
    const stage = root.querySelector('[data-learn-stage]');
    const title = root.querySelector('[data-learn-title]');
    const sub = root.querySelector('[data-learn-sub]');
    const auth = sessionAuth(ref);
    if (!auth) {
      title.textContent = 'Who is learning?';
      stage.innerHTML = `<div class="sp-panel"><form class="session-ask" onsubmit="event.preventDefault(); learnSignIn(this)">
        <p class="sp-text">Enter the mobile number you enrolled with.</p>
        <div class="flex gap-2 flex-wrap justify-center mt-3">
          <input name="m" class="sp-input" inputmode="numeric" placeholder="10-digit mobile" required aria-label="Mobile number">
          <button class="gold-gradient-btn h-11 px-5 rounded-xl">Continue</button>
        </div>
      </form></div>`;
      return;
    }
    const headers = auth.pin ? { 'x-admin-pin': auth.pin } : {};
    const qs = auth.mobile ? `?mobile=${encodeURIComponent(auth.mobile)}` : '';
    let data;
    try {
      data = await fetchJson(`/api/bookings/${encodeURIComponent(ref)}/course${qs}`, { headers });
      if (!data) throw new Error('The server could not be reached.');
    } catch (err) {
      title.textContent = 'These lessons cannot be opened';
      stage.innerHTML = `<div class="sp-panel"><p class="sp-text">${esc(err.message)}</p>
        <div class="flex gap-3 mt-4 flex-wrap"><a href="/courses" data-link class="sp-btn-outline">Courses</a>
        <a href="/track" data-link class="sp-btn-outline">Track status</a></div></div>`;
      return;
    }
    LEARN.ref = ref; LEARN.data = data;
    const firstOpen = data.lessons.findIndex(l => !l.done);
    LEARN.index = firstOpen === -1 ? 0 : firstOpen;
    title.textContent = data.course.title;
    sub.innerHTML = `Enrolment <span class="font-mono">${esc(ref)}</span> · ${esc(data.devotee.name)}`;
    paintCourse();
  }
  window.openCourse = openCourse;

  window.learnSignIn = (form) => {
    const mobile = form.m.value.replace(/\D/g, '').slice(-10);
    const ref = $('[data-learn-root]').dataset.ref;
    try { localStorage.setItem('guruji_last_booking', JSON.stringify({ orderId: ref, mobile })); } catch (e) { /* ignore */ }
    openCourse(ref);
  };

  function paintCourse() {
    const stage = $('[data-learn-stage]');
    if (!stage || !LEARN.data) return;
    const d = LEARN.data;
    const l = d.lessons[LEARN.index];
    stage.innerHTML = `
      <div class="learn-layout">
        <nav class="learn-nav" aria-label="Lessons">
          <div class="learn-progress">
            <div class="learn-progress__bar"><span style="width:${d.progress.percent}%"></span></div>
            <p>${d.progress.done} of ${d.progress.total} lessons done</p>
          </div>
          <ol>${d.lessons.map((x, i) => `
            <li><button type="button" class="learn-nav__item ${i === LEARN.index ? 'is-active' : ''} ${x.done ? 'is-done' : ''}" onclick="learnOpen(${i})">
              <span class="learn-nav__tick" aria-hidden="true">${x.done ? '✓' : i + 1}</span>
              <span><strong>${esc(x.title)}</strong><em>${x.minutes} min</em></span>
            </button></li>`).join('')}</ol>
        </nav>
        <article class="learn-body sp-panel">
          <h2 class="sp-h3">${esc(l.title)}</h2>
          <p class="learn-meta">Lesson ${LEARN.index + 1} of ${d.lessons.length} · ${l.minutes} min</p>
          ${l.body.map(par => `<p class="sp-text">${esc(par)}</p>`).join('')}
          ${l.keyPoints && l.keyPoints.length ? `<div class="learn-key"><h3 class="sp-h4">Remember</h3><ul class="sp-ticks">${l.keyPoints.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>` : ''}
          ${l.practice ? `<div class="learn-practice"><h3 class="sp-h4">Practice</h3><p class="sp-text">${esc(l.practice)}</p></div>` : ''}
          <div class="learn-actions">
            <button type="button" class="sp-btn-outline" onclick="learnOpen(${LEARN.index - 1})" ${LEARN.index === 0 ? 'disabled' : ''}>Previous</button>
            <button type="button" class="${l.done ? 'sp-btn-outline' : 'gold-gradient-btn h-11 px-5 rounded-xl'}" onclick="learnToggle('${esc(l.id)}', ${l.done ? 'false' : 'true'})">
              ${l.done ? 'Mark as not done' : 'Mark complete'}
            </button>
            <button type="button" class="sp-btn-outline" onclick="learnOpen(${LEARN.index + 1})" ${LEARN.index >= d.lessons.length - 1 ? 'disabled' : ''}>Next lesson</button>
          </div>
          ${d.progress.percent === 100 ? '<p class="learn-done">You have finished every lesson. Guruji\'s certificate of completion is issued by hand — send an enquiry and we will arrange it.</p>' : ''}
        </article>
      </div>`;
  }

  window.learnOpen = (i) => {
    if (!LEARN.data || i < 0 || i >= LEARN.data.lessons.length) return;
    LEARN.index = i;
    paintCourse();
    const el = $('[data-learn-root]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.learnToggle = async function (lessonId, done) {
    const auth = sessionAuth(LEARN.ref);
    if (!auth) return;
    const headers = auth.pin ? { 'x-admin-pin': auth.pin } : {};
    const body = Object.assign({ lessonId, done }, auth.mobile ? { mobile: auth.mobile } : {});
    try {
      const res = await fetchJson(`/api/bookings/${encodeURIComponent(LEARN.ref)}/course/progress`, { method: 'POST', headers, body });
      if (!res) return;
      const lesson = LEARN.data.lessons.find(x => x.id === lessonId);
      if (lesson) lesson.done = res.done;
      LEARN.data.progress = res.progress;
      if (res.done && LEARN.index < LEARN.data.lessons.length - 1) LEARN.index += 1;
      paintCourse();
      if (res.progress.percent === 100) toast('Course complete. Well done.');
    } catch (err) { toast(err.message, 'error'); }
  };

  // -------------------------------------------------------------------------
  // Admin dashboard
  // -------------------------------------------------------------------------
  const ADMIN = { pin: '', token: '', role: '', email: '', tab: 'overview', data: null, editing: null, filters: {} };
  try { const saved = JSON.parse(sessionStorage.getItem('guruji_admin') || 'null'); if (saved) Object.assign(ADMIN, saved); } catch (e) { /* ignore */ }
  /** Forgets the staff session in this browser. Called whenever the server says
   *  401: a session that has run out must leave no half-signed-in state behind,
   *  or the dashboard draws itself with every panel empty and no way back in. */
  function clearAdminSession() {
    ADMIN.pin = '';
    ADMIN.token = '';
    ADMIN.role = '';
    ADMIN.email = '';
    sessionStorage.removeItem('guruji_admin');
  }

  const adminFetch = (url, opts = {}) => {
    const headers = Object.assign({}, opts.headers);
    if (ADMIN.pin) headers['x-admin-pin'] = ADMIN.pin;
    if (ADMIN.token) headers['x-admin-token'] = ADMIN.token;
    return fetchJson(url, Object.assign({}, opts, { headers }));
  };

  // A palm photo is private, so the server wants the staff header. An <img>
  // tag cannot send one, so the bytes are fetched here and handed over as an
  // object URL. Being same-origin, it also leaves the canvas untainted, which
  // is what lets a marked copy be exported.
  const palmUrlCache = new Map();
  async function palmImageUrl(orderId, photoId) {
    const key = orderId + '/' + photoId;
    if (palmUrlCache.has(key)) return palmUrlCache.get(key);
    const headers = {};
    if (ADMIN.pin) headers['x-admin-pin'] = ADMIN.pin;
    if (ADMIN.token) headers['x-admin-token'] = ADMIN.token;
    const res = await fetch(`/api/bookings/${encodeURIComponent(orderId)}/photos/${encodeURIComponent(photoId)}`, { headers });
    if (!res.ok) throw new Error('That photo could not be opened.');
    const url = URL.createObjectURL(await res.blob());
    palmUrlCache.set(key, url);
    return url;
  }

  const SCHEMAS = {
    services: {
      label: 'Services', key: 'slug', title: 'title', fields: [
        ['title', 'Title', 'text'], ['slug', 'URL slug', 'text'], ['category', 'Category', 'select', () => (C().serviceCategories || []).map(c => [c.id, c.title])],
        ['short', 'Short description', 'textarea'], ['intro', 'Introduction', 'textarea'], ['description', 'Description', 'textarea'],
        ['benefits', 'Benefits / purpose (one per line)', 'lines'], ['requiredInfo', 'Information required (one per line — empty uses the category list)', 'lines'],
        ['deliverables', 'What the client receives (one per line)', 'lines'], ['duration', 'Duration', 'text'],
        ['price', 'Price in ₹ (empty = price on request)', 'number'],
        ['mrp', 'Original price in ₹, shown struck through with "% OFF" (optional, must be higher than the price)', 'number'],
        ['bookingType', 'How it is booked', 'select', () => [['enquiry', 'Enquiry form'], ['consultation', 'Pay online (consultation flow)'], ['pooja', 'Pooja booking (date & slot)']]],
        ['consultationId', 'Consultation id (palmistry_reading / astrology_correlation / combined_consultation)', 'text'], ['poojaId', 'Pooja id (for pooja booking)', 'text'],
        ['image', 'Image', 'image'], ['core', 'Core consultation', 'bool'], ['featured', 'Featured on home', 'bool'], ['published', 'Published', 'bool']
      ], blank: () => ({ slug: '', category: 'palmistry', title: 'New service', short: '', intro: '', description: '', benefits: [], duration: '', price: null, bookingType: 'enquiry', published: false })
    },
    courses: {
      label: 'Courses', key: 'slug', title: 'title', fields: [
        ['title', 'Title', 'text'], ['slug', 'URL slug', 'text'], ['track', 'Track', 'select', () => (C().courseTracks || []).map(t => [t.id, t.title])],
        ['overview', 'Overview', 'textarea'], ['curriculum', 'Curriculum (one per line)', 'lines'], ['outcomes', 'Learning outcomes (one per line)', 'lines'],
        ['duration', 'Duration', 'text'], ['mode', 'Online / offline', 'text'], ['instructor', 'Instructor', 'text'], ['price', 'Fee in ₹ (empty = on enquiry)', 'number'],
        ['certificate', 'Certificate', 'text'], ['status', 'Status', 'select', () => [['open', 'Enrolling now'], ['enquire', 'Register interest'], ['upcoming', 'Coming soon']]],
        ['image', 'Image', 'image'], ['featured', 'Featured on home', 'bool'], ['published', 'Published', 'bool']
      ], blank: () => ({ slug: '', track: 'palmistry', title: 'New course', overview: '', curriculum: [], outcomes: [], duration: '', mode: 'Online & offline', instructor: 'Guruji', price: null, certificate: '', status: 'enquire', published: false })
    },
    articles: {
      label: 'Articles', key: 'slug', title: 'title', fields: [
        ['title', 'Title', 'text'], ['slug', 'URL slug', 'text'], ['category', 'Category', 'select', () => (C().resourceCategories || []).map(c => [c.id, c.title])],
        ['type', 'Resource type', 'select', () => (C().resourceTypes || []).map(t => [t, t])], ['excerpt', 'Summary', 'textarea'],
        ['body', 'Article text (blank line between paragraphs)', 'paras'], ['date', 'Date', 'date'], ['author', 'Author', 'text'],
        ['image', 'Image', 'image'], ['videoUrl', 'YouTube link (optional)', 'text'], ['pdfUrl', 'PDF link (optional)', 'text'],
        ['featured', 'Featured', 'bool'], ['published', 'Published', 'bool']
      ], blank: () => ({ slug: '', category: 'palmistry', type: 'Articles & Blogs', title: 'New article', excerpt: '', body: [], date: new Date().toISOString().slice(0, 10), author: 'Guruji Palmistry', published: false })
    },
    testimonials: {
      label: 'Testimonials', key: null, title: 'name', fields: [
        ['name', 'Name', 'text'], ['location', 'Location', 'text'], ['text', 'Testimonial', 'textarea'], ['published', 'Published', 'bool']
      ], blank: () => ({ name: '', location: '', text: '', published: false })
    },
    faqCategories: {
      label: 'FAQs', key: 'id', title: 'title', fields: [
        ['title', 'Topic title', 'text'], ['id', 'Topic id', 'text'], ['items', 'Questions — one per line as: Question || Answer', 'pairs']
      ], blank: () => ({ id: 'new-topic', title: 'New topic', items: [] })
    },
    serviceCategories: {
      label: 'Service categories', key: 'id', title: 'title', fields: [
        ['title', 'Title', 'text'], ['id', 'Id', 'text'], ['tagline', 'Tagline', 'text'], ['intro', 'Introduction', 'textarea'],
        ['howItWorks', 'How it works (one step per line)', 'lines'], ['requiredInfo', 'Information required (one per line)', 'lines'],
        ['image', 'Image', 'image'], ['icon', 'Icon (Font Awesome name, e.g. fa-hand)', 'text'], ['link', 'Custom page link (optional)', 'text']
      ], blank: () => ({ id: 'new-category', title: 'New category', tagline: '', intro: '', howItWorks: [], requiredInfo: [], image: '', icon: 'fa-star' })
    },
    pillars: { label: 'Home pillars', key: null, title: 'title', fields: [['title', 'Title', 'text'], ['text', 'Text', 'text'], ['icon', 'Icon', 'text'], ['link', 'Link', 'text']], blank: () => ({ title: '', text: '', icon: 'fa-star', link: '/' }) }
  };
  const OBJECT_SECTIONS = {
    settings: {
      label: 'Settings & homepage', fields: [
        ['hero.title', 'Homepage heading', 'text'], ['hero.subtitle', 'Homepage subtitle', 'textarea'],
        ['phone', 'Phone (shown on site)', 'text'], ['whatsapp', 'WhatsApp number with country code (e.g. 919876543210)', 'text'],
        ['email', 'Email', 'text'], ['address', 'Address (optional)', 'textarea'], ['mapEmbedUrl', 'Google Maps embed URL (optional)', 'text'],
        ['social.instagram', 'Instagram URL', 'text'], ['social.youtube', 'YouTube URL', 'text'], ['social.facebook', 'Facebook URL', 'text']
      ]
    },
    about: {
      label: 'About Guruji', fields: [
        ['name', 'Name', 'text'], ['alsoKnownAs', 'Also known as', 'text'], ['role', 'Role / title', 'text'], ['portrait', 'Portrait', 'image'],
        ['intro', 'Introduction', 'textarea'], ['highlights', 'Highlights (one per line)', 'lines'],
        ['sections', 'Page sections — one per block: Title || Text (use ;; to separate list items)', 'sections']
      ]
    }
  };
  const getPath = (o, p) => p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); let x = o; ks.slice(0, -1).forEach(k => { if (x[k] == null || typeof x[k] !== 'object') x[k] = {}; x = x[k]; }); x[ks[ks.length - 1]] = v; };

  function fieldHtml([key, label, type, opts], value) {
    const id = 'adm-f-' + key.replace(/\W/g, '_');
    const v = value == null ? '' : value;
    switch (type) {
      case 'textarea': return `<label class="sp-field sp-field--full"><span>${label}</span><textarea id="${id}" data-key="${key}" data-type="${type}" rows="3">${esc(v)}</textarea></label>`;
      case 'lines': return `<label class="sp-field sp-field--full"><span>${label}</span><textarea id="${id}" data-key="${key}" data-type="${type}" rows="4">${esc((v || []).join('\n'))}</textarea></label>`;
      case 'paras': return `<label class="sp-field sp-field--full"><span>${label}</span><textarea id="${id}" data-key="${key}" data-type="${type}" rows="10">${esc((v || []).join('\n\n'))}</textarea></label>`;
      case 'pairs': return `<label class="sp-field sp-field--full"><span>${label}</span><textarea id="${id}" data-key="${key}" data-type="${type}" rows="10">${esc((v || []).map(p => p.join(' || ')).join('\n'))}</textarea></label>`;
      case 'sections': return `<label class="sp-field sp-field--full"><span>${label}</span><textarea id="${id}" data-key="${key}" data-type="${type}" rows="12">${esc((v || []).map(s => `${s.title} || ${s.body || (s.list || []).join(' ;; ')}${s.list ? ' ;;' : ''}`).join('\n\n'))}</textarea></label>`;
      case 'number': return `<label class="sp-field"><span>${label}</span><input id="${id}" data-key="${key}" data-type="${type}" type="number" min="0" step="1" value="${v === null ? '' : esc(v)}"></label>`;
      case 'date': return `<label class="sp-field"><span>${label}</span><input id="${id}" data-key="${key}" data-type="${type}" type="date" value="${esc(v)}"></label>`;
      case 'bool': return `<label class="sp-check"><input id="${id}" data-key="${key}" data-type="${type}" type="checkbox" ${v !== false && v !== '' && v != null ? 'checked' : ''}> ${label}</label>`;
      case 'select': return `<label class="sp-field"><span>${label}</span><select id="${id}" data-key="${key}" data-type="${type}">${opts().map(([val, t]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
      case 'image': return `<div class="sp-field sp-field--full"><span>${label}</span><div class="adm-image"><img src="${esc(v || '/assets/svc/guidance.svg')}" alt=""><div class="flex-1 space-y-2"><input id="${id}" data-key="${key}" data-type="${type}" value="${esc(v)}" placeholder="/assets/... or uploaded image URL"><label class="sp-btn-outline sp-btn-sm cursor-pointer"><i class="fa-solid fa-upload"></i> Upload image<input type="file" accept="image/*" class="sr-only" onchange="adminUpload(this, '${id}')"></label></div></div></div>`;
      default: return `<label class="sp-field"><span>${label}</span><input id="${id}" data-key="${key}" data-type="${type}" value="${esc(v)}"></label>`;
    }
  }
  function readForm(root, base) {
    const item = JSON.parse(JSON.stringify(base || {}));
    root.querySelectorAll('[data-key]').forEach(el => {
      const t = el.dataset.type; const raw = el.type === 'checkbox' ? el.checked : el.value;
      let v = raw;
      if (t === 'lines') v = raw.split('\n').map(x => x.trim()).filter(Boolean);
      else if (t === 'paras') v = raw.split(/\n\s*\n/).map(x => x.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
      else if (t === 'pairs') v = raw.split('\n').map(l => l.split('||').map(x => x.trim())).filter(p => p[0]).map(p => [p[0], p.slice(1).join(' || ')]);
      else if (t === 'sections') v = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map((b, i) => {
        const [title, ...rest] = b.split('||'); const body = rest.join('||').trim();
        const id = (getPath(base, 'sections.' + i + '.id')) || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return body.includes(';;') ? { id, title: title.trim(), list: body.split(';;').map(x => x.trim()).filter(Boolean) } : { id, title: title.trim(), body };
      });
      else if (t === 'number') v = raw === '' ? null : Number(raw);
      setPath(item, el.dataset.key, v);
    });
    return item;
  }

  window.adminUpload = async function (fileInput, targetId) {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Please choose an image under 2 MB.', 'error');
    const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    try {
      const out = await adminFetch('/api/admin/media', { method: 'POST', body: { name: file.name, type: file.type, data } });
      const input = document.getElementById(targetId);
      input.value = out.media.url;
      const img = input.closest('.adm-image') && input.closest('.adm-image').querySelector('img');
      if (img) img.src = out.media.url;
      toast('Image uploaded.');
    } catch (err) { toast(err.message, 'error'); }
  };

  window.adminExportConsents = async function () {
    try {
      const headers = {};
      if (ADMIN.pin) headers['x-admin-pin'] = ADMIN.pin;
      if (ADMIN.token) headers['x-admin-token'] = ADMIN.token;
      const res = await fetch('/api/admin/consents/export', { headers });
      if (!res.ok) throw new Error('Failed to export consent records');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guruji_consent_records_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast('Consent log exported successfully.');
    } catch (err) { toast(err.message, 'error'); }
  };

  async function adminLoad() {
    const tab = ADMIN.tab;
    const host = $('#adm-body');
    host.innerHTML = '<div class="sp-spinner" aria-hidden="true"></div>';
    try {
      if (tab === 'overview') {
        ADMIN.data = await adminFetch('/api/admin/overview');
      } else if (tab === 'reviews') {
        ADMIN.data = await adminFetch('/api/admin/reviews');
      } else if (tab === 'bookings' || tab === 'enquiries') {
        const f = ADMIN.filters[tab] || {};
        const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
        ADMIN.data = await adminFetch(`/api/admin/${tab}${qs ? '?' + qs : ''}`);
      } else if (tab === 'consents') {
        const f = ADMIN.filters.consents || {};
        const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
        ADMIN.data = await adminFetch(`/api/admin/consents${qs ? '?' + qs : ''}`);
      } else if (tab === 'images') {
        ADMIN.data = await adminFetch('/api/admin/media');
      } else {
        ADMIN.data = await adminFetch('/api/admin/content');
      }
      if (!ADMIN.data) throw new Error('The admin dashboard needs the server.');
      renderAdminBody();
    } catch (err) {
      if (err.status === 401) {
        clearAdminSession();
        toast('Your session has ended. Please sign in again.', 'warn');
        return renderAdmin();
      }
      host.innerHTML = `<p class="sp-notice">${esc(err.message)}</p>`;
    }
  }

  const STATUS_TONE = { PAID: 'green', DETAILS_RECEIVED: 'green', COMPLETED: 'green', CONFIRMED: 'green', SCHEDULED: 'gold', PENDING_PAYMENT: 'muted', NEW: 'gold', CONTACTED: 'gold', PAYMENT_FAILED: 'red', CANCELLED: 'red', REFUNDED: 'muted', CLOSED: 'muted' };
  /** A readable summary of one content section: how many items, and which ones. */
  function contentShape(value) {
    if (Array.isArray(value)) return { kind: 'list', count: value.length, keys: value.map(itemKey) };
    if (value && typeof value === 'object') return { kind: 'fields', count: Object.keys(value).length, keys: Object.keys(value) };
    return { kind: 'value', count: 1, keys: [] };
  }
  // Match on the same thing however it is spelled: a saved copy may key on the
  // title where the code keys on the slug.
  const itemKey = (x) => String((x && (x.slug || x.id || x.title || x.name || x.q)) || JSON.stringify(x).slice(0, 40))
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /** What the saved copy holds that the code does not, and the other way round. */
  function contentDiff(saved, original) {
    const a = contentShape(saved), b = contentShape(original);
    const inSaved = new Set(a.keys), inCode = new Set(b.keys);
    const onlySaved = a.keys.filter(k => !inCode.has(k));
    const onlyCode = b.keys.filter(k => !inSaved.has(k));
    let changed = [];
    if (a.kind === 'list' && b.kind === 'list') {
      const byKey = (arr) => Object.fromEntries(arr.map(x => [itemKey(x), x]));
      const A = byKey(saved), B = byKey(original);
      changed = Object.keys(A).filter(k => B[k] && JSON.stringify(A[k]) !== JSON.stringify(B[k]));
    } else if (a.kind === 'fields' && b.kind === 'fields') {
      changed = Object.keys(saved).filter(k => k in original && JSON.stringify(saved[k]) !== JSON.stringify(original[k]));
    }
    return { onlySaved, onlyCode, changed, savedCount: a.count, codeCount: b.count };
  }

  window.adminDownloadSection = function (section) {
    const value = (ADMIN.data.content || {})[section];
    const blob = new Blob([JSON.stringify({ section, savedAt: new Date().toISOString(), value }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `guruji-${section}-backup.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup downloaded. Keep it until you are happy with the result.');
  };

  function renderContentStatus(host) {
    const d = ADMIN.data || {};
    const sections = d.sections || [];
    const edited = new Set(d.edited || []);
    const savedAt = d.savedAt || {};
    const rows = sections.map(sec => {
      const saved = edited.has(sec);
      const diff = saved ? contentDiff(d.content[sec], (d.defaults || {})[sec]) : null;
      const when = (savedAt[sec] || {}).updatedAt;
      const by = (savedAt[sec] || {}).updatedBy;
      return `
        <div class="sp-panel mb-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong class="text-base">${esc(sec)}</strong>
              <span class="sp-pill ${saved ? 'sp-pill--gold' : 'sp-pill--muted'} ml-2">${saved ? 'saved in the database' : 'using the original'}</span>
              ${when ? `<span class="text-xs text-ink-3 ml-2">last saved ${esc(new Date(when).toLocaleString('en-IN'))}${by ? ' by ' + esc(by) : ''}</span>` : ''}
            </div>
            ${saved ? `<div class="flex gap-2">
              <button type="button" class="sp-btn-outline text-xs" onclick="adminDownloadSection('${esc(sec)}')">Download a backup</button>
              <button type="button" class="sp-btn-outline text-xs" onclick="adminReset('${esc(sec)}')">Restore the original</button>
            </div>` : ''}
          </div>
          ${saved ? `
            <p class="text-xs text-ink-3 mt-2">The database copy has ${diff.savedCount} item${diff.savedCount === 1 ? '' : 's'}; the code has ${diff.codeCount}. Restoring replaces the saved copy with the code's — download the backup first.</p>
            ${diff.onlyCode.length ? `<p class="text-sm mt-2"><strong>Only in the code</strong> (restoring would bring these back): ${diff.onlyCode.slice(0, 12).map(esc).join(', ')}${diff.onlyCode.length > 12 ? ` and ${diff.onlyCode.length - 12} more` : ''}</p>` : ''}
            ${diff.onlySaved.length ? `<p class="text-sm mt-2"><strong>Only in the saved copy</strong> (restoring would lose these): ${diff.onlySaved.slice(0, 12).map(esc).join(', ')}${diff.onlySaved.length > 12 ? ` and ${diff.onlySaved.length - 12} more` : ''}</p>` : ''}
            ${diff.changed.length ? `<p class="text-sm mt-2"><strong>Different in both</strong>: ${diff.changed.slice(0, 12).map(esc).join(', ')}${diff.changed.length > 12 ? ` and ${diff.changed.length - 12} more` : ''}</p>` : ''}
            ${!diff.onlyCode.length && !diff.onlySaved.length && !diff.changed.length ? '<p class="text-sm mt-2 text-emerald-800">The saved copy and the code hold the same thing — restoring would change nothing.</p>' : ''}
          ` : '<p class="text-xs text-ink-3 mt-2">Nothing was ever saved here from the dashboard, so this section shows exactly what the code ships. A new deployment updates it by itself.</p>'}
        </div>`;
    }).join('');
    host.innerHTML = `
      <p class="sp-text mb-4">The site shows the database copy of a section when one exists, and the code's version otherwise. That is why an edit made here survives a deployment — and why a change made in the code may not appear. Nothing on this page changes anything until you press a button.</p>
      ${rows}`;
  }

  // -------------------------------------------------------------------------
  // Overview: the whole business on one screen
  // -------------------------------------------------------------------------
  const rupees = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');
  const whenText = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return (today ? 'Today ' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ')
      + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  };

  function kpi(label, value, note, tone, tab) {
    const click = tab ? ` onclick="adminTab('${tab}')" role="button" tabindex="0"` : '';
    return `<div class="adm-kpi ${tone ? 'adm-kpi--' + tone : ''}${tab ? ' adm-kpi--link' : ''}"${click}>
      <span class="adm-kpi__label">${esc(label)}</span>
      <strong class="adm-kpi__value">${esc(String(value))}</strong>
      ${note ? `<span class="adm-kpi__note">${esc(note)}</span>` : ''}
    </div>`;
  }

  function renderOverview(host) {
    const d = ADMIN.data || {};
    const b = d.bookings || {}, rev = d.revenue || {}, enq = d.enquiries || {},
      rv = d.reviews || {}, msg = d.messages || {}, sys = d.system || {};
    const daily = d.daily || [];
    const peak = Math.max(1, ...daily.map(x => x.bookings));
    const needsAttention = [
      b.pendingPayment && [`${b.pendingPayment} booking${b.pendingPayment === 1 ? '' : 's'} never paid`, 'bookings'],
      enq.new && [`${enq.new} enquir${enq.new === 1 ? 'y has' : 'ies have'} had no reply`, 'enquiries'],
      msg.unread && [`${msg.unread} unread chat message${msg.unread === 1 ? '' : 's'}`, 'bookings'],
      b.awaitingReport && [`${b.awaitingReport} reading${b.awaitingReport === 1 ? '' : 's'} still to write`, 'bookings'],
      b.unclaimed && [`${b.unclaimed} case${b.unclaimed === 1 ? '' : 's'} nobody has claimed`, 'bookings']
    ].filter(Boolean);

    host.innerHTML = `
      <div class="adm-overview">
        <div class="adm-overview__head">
          <p class="text-xs text-ink-3">Figures as of ${esc(whenText(d.generatedAt) || 'now')}</p>
          <div class="flex gap-2">
            <button class="sp-btn-outline sp-btn-sm" onclick="adminLoad()"><i class="fa-solid fa-rotate"></i> Refresh</button>
            <button class="sp-btn-outline sp-btn-sm" onclick="adminExport('bookings')"><i class="fa-solid fa-file-csv"></i> Bookings CSV</button>
          </div>
        </div>

        <div class="adm-kpis">
          ${kpi('Bookings today', b.today || 0, `${b.week || 0} this week · ${b.month || 0} this month`, 'gold', 'bookings')}
          ${kpi('Collected this month', rupees(rev.month), `${rupees(rev.today)} today · ${rupees(rev.total)} all time`, 'green')}
          ${kpi('New enquiries', enq.new || 0, `${enq.week || 0} arrived this week`, (enq.new ? 'red' : ''), 'enquiries')}
          ${kpi('Unread messages', msg.unread || 0, `${msg.threads || 0} conversation${msg.threads === 1 ? '' : 's'}`, (msg.unread ? 'red' : ''))}
          ${kpi('Readings to write', b.awaitingReport || 0, `${b.unclaimed || 0} case${b.unclaimed === 1 ? '' : 's'} unclaimed`, (b.awaitingReport ? 'gold' : ''))}
          ${kpi('Review rating', rv.average || '—', `${rv.total || 0} review${rv.total === 1 ? '' : 's'} · ${rv.hidden || 0} hidden`, '', 'reviews')}
        </div>

        ${needsAttention.length ? `
        <div class="sp-panel adm-attention">
          <h2 class="sp-h3"><i class="fa-solid fa-circle-exclamation text-amber-600"></i> Needs your attention</h2>
          <ul class="adm-attention__list">${needsAttention.map(([text, tab]) =>
            `<li><button type="button" onclick="adminTab('${tab}')">${esc(text)}</button></li>`).join('')}</ul>
        </div>` : `<div class="sp-panel adm-attention adm-attention--clear">
          <h2 class="sp-h3"><i class="fa-solid fa-circle-check text-emerald-600"></i> Nothing waiting on you</h2>
          <p class="sp-text">Every enquiry has been answered, every booking paid, every reading sent.</p>
        </div>`}

        <div class="adm-overview__grid">
          <div class="sp-panel">
            <h2 class="sp-h3">Last fourteen days</h2>
            <div class="adm-chart" role="img" aria-label="Bookings per day over the last fourteen days">
              ${daily.map(x => `<div class="adm-chart__col" title="${esc(x.date)}: ${x.bookings} booking${x.bookings === 1 ? '' : 's'}, ${rupees(x.revenue)}">
                  <span class="adm-chart__bar" style="height:${Math.round((x.bookings / peak) * 100)}%"></span>
                  <span class="adm-chart__tick">${esc(x.date.slice(8))}</span>
                </div>`).join('')}
            </div>
            <p class="text-xs text-ink-3 mt-2">Tallest bar = ${peak} booking${peak === 1 ? '' : 's'} in a day.</p>
          </div>

          <div class="sp-panel">
            <h2 class="sp-h3">Next appointments</h2>
            ${(d.upcoming || []).length ? `<ul class="adm-upcoming">${d.upcoming.map(u => `
              <li>
                <span class="adm-upcoming__when">${esc(whenText(u.startsAt))}</span>
                <span class="adm-upcoming__who">${esc(u.name)}<small>${esc(u.service || '')}</small></span>
                <span class="sp-pill sp-pill--${STATUS_TONE[u.status] || 'muted'}">${esc((u.status || '').replace(/_/g, ' ').toLowerCase())}</span>
                <a href="/guruji/${esc(u.orderId)}" data-link class="sp-link">Open</a>
              </li>`).join('')}</ul>` : '<p class="sp-text">Nothing booked yet.</p>'}
          </div>

          <div class="sp-panel">
            <h2 class="sp-h3">Most booked</h2>
            ${(d.topServices || []).length ? `<ul class="adm-bars">${d.topServices.map(t => `
              <li><span>${esc(t.title)}</span>
                <span class="adm-bars__track"><span style="width:${Math.round((t.count / d.topServices[0].count) * 100)}%"></span></span>
                <strong>${t.count}</strong></li>`).join('')}</ul>` : '<p class="sp-text">No bookings yet.</p>'}
          </div>

          <div class="sp-panel">
            <h2 class="sp-h3">Where every booking stands</h2>
            <ul class="adm-statuses">${Object.entries(b.byStatus || {}).sort((x, y) => y[1] - x[1]).map(([st, n]) =>
              `<li><span class="sp-pill sp-pill--${STATUS_TONE[st] || 'muted'}">${esc(st.replace(/_/g, ' ').toLowerCase())}</span><strong>${n}</strong></li>`).join('')
              || '<li class="sp-text">No bookings yet.</li>'}</ul>
          </div>

          <div class="sp-panel adm-health">
            <h2 class="sp-h3">How the site is set up</h2>
            <dl class="adm-health__list">
              <div><dt>Database</dt><dd>${sys.storage === 'mongo' ? '<span class="sp-pill sp-pill--green">MongoDB</span>' : '<span class="sp-pill sp-pill--red">Files only — records are lost on redeploy</span>'}</dd></div>
              <div><dt>Payments</dt><dd>${sys.payments === 'cashfree' ? `<span class="sp-pill sp-pill--green">Cashfree ${esc(sys.paymentEnv || '')}</span>` : '<span class="sp-pill sp-pill--gold">Simulated — no money moves</span>'}</dd></div>
              <div><dt>Video sessions</dt><dd>${sys.sessionsProductionSafe ? `<span class="sp-pill sp-pill--green">${esc(sys.sessions || '')}</span>` : `<span class="sp-pill sp-pill--gold">${esc(sys.sessions || 'public rooms')}</span>`}</dd></div>
              <div><dt>Email alerts</dt><dd>${sys.emailAlerts ? '<span class="sp-pill sp-pill--green">On</span>' : '<span class="sp-pill sp-pill--muted">Off</span>'}</dd></div>
              <div><dt>Staff Google sign-in</dt><dd>${(sys.staffGoogleSignIn || {}).admin || 0} admin · ${(sys.staffGoogleSignIn || {}).guruji || 0} Guruji</dd></div>
            </dl>
            <button type="button" class="sp-btn-outline sp-btn-sm mt-3" onclick="adminSignInCheck()">
              <i class="fa-solid fa-stethoscope"></i> Test staff Google sign-in
            </button>
            <div id="adm-signin-check" class="mt-3"></div>
            ${(sys.missing || []).length ? `<p class="text-xs text-ink-3 mt-3">Not set in the hosting environment: <strong>${sys.missing.map(esc).join('</strong>, <strong>')}</strong></p>` : ''}
          </div>
        </div>
      </div>`;
  }

  /** Runs the sign-in checks on the server and shows what each one found.
   *  This is what to reach for when the Google button returns a bare 401. */
  window.adminSignInCheck = async () => {
    const host = document.getElementById('adm-signin-check');
    if (!host) return;
    host.innerHTML = '<div class="sp-spinner" aria-hidden="true"></div>';
    try {
      const d = await adminFetch('/api/admin/sign-in-check');
      const hints = [].concat(d.adminEmailHints || [], d.gurujiEmailHints || []);
      host.innerHTML = `
        <ul class="adm-checks">${(d.checks || []).map(c => `
          <li class="${c.ok ? 'is-ok' : 'is-bad'}">
            <i class="fa-solid ${c.ok ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i>
            <div>
              <strong>${esc(c.name)}</strong>
              <span>${esc(c.detail)}</span>
              ${c.ok ? '' : `<em>${esc(c.fix)}</em>`}
            </div>
          </li>`).join('')}</ul>
        ${hints.length ? `<p class="text-xs text-ink-3 mt-2">Configured: ${hints.map(esc).join(', ')}</p>` : ''}
        <p class="text-xs text-ink-3 mt-1">Node ${esc(d.nodeVersion || '')}${(d.proxyEnv || []).length
          ? ' · proxy variables set: ' + d.proxyEnv.map(esc).join(', ')
          : ' · no proxy variables set'}</p>
        ${(d.recentAttempts || []).length ? `
          <h3 class="sp-h3 mt-4" style="font-size:1rem">Recent sign-in attempts</h3>
          <ul class="adm-attempts">${d.recentAttempts.map(a => `
            <li class="${a.outcome === 'allowed' ? 'is-ok' : 'is-bad'}">
              <time>${esc(new Date(a.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }))}</time>
              <span>${esc(a.email || 'address not reached')}</span>
              <strong>${esc(a.outcome === 'allowed' ? 'signed in as ' + a.reason : a.reason.replace(/_/g, ' '))}</strong>
            </li>`).join('')}</ul>` : '<p class="text-xs text-ink-3 mt-2">No staff sign-in has been tried since the last restart.</p>'}
        <p class="text-xs text-ink-3 mt-1">The page signs in against Firebase project
          <strong>${esc(window.GURUJI_FIREBASE_PROJECT || 'palm-56063')}</strong>; the server checks tokens against
          <strong>${esc(d.firebaseProjectId || '')}</strong>.
          ${(window.GURUJI_FIREBASE_PROJECT || 'palm-56063') === d.firebaseProjectId ? 'These match.' : 'These do not match — that alone causes a 401.'}</p>`;
    } catch (err) {
      host.innerHTML = `<p class="sp-notice">${esc(err.message)}</p>`;
    }
  };

  // -------------------------------------------------------------------------
  // Reviews: what the public sees, and what the owner lets them see
  // -------------------------------------------------------------------------
  function renderReviewsAdmin(host) {
    const rows = (ADMIN.data && ADMIN.data.reviews) || [];
    const f = ADMIN.filters.reviews || {};
    const shown = rows.filter(r => f.show === 'hidden' ? r.hidden : f.show === 'verified' ? r.verified : f.show === 'live' ? !r.hidden : true);
    const stars = (n) => Array.from({ length: 5 }, (_, i) => `<i class="fa-${i < n ? 'solid' : 'regular'} fa-star"></i>`).join('');
    host.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="sp-chips sp-chips--nav">
          ${[['', 'All'], ['live', 'On the site'], ['hidden', 'Hidden'], ['verified', 'Verified']].map(([v, label]) =>
            `<a href="#" class="${(f.show || '') === v ? 'is-active' : ''}" onclick="event.preventDefault(); adminReviewFilter('${v}')">${label}</a>`).join('')}
        </div>
        <p class="text-sm text-ink-3">${shown.length} of ${rows.length}</p>
      </div>
      <div class="adm-reviews">${shown.map(r => `
        <article class="adm-review ${r.hidden ? 'is-hidden' : ''}">
          <header>
            <span class="adm-review__stars">${stars(Number(r.rating) || 0)}</span>
            <strong>${esc(r.name || 'Seeker')}</strong>
            ${r.location ? `<small>${esc(r.location)}</small>` : ''}
            ${r.verified ? '<span class="sp-pill sp-pill--green">verified</span>' : '<span class="sp-pill sp-pill--muted">unverified</span>'}
            ${r.hidden ? '<span class="sp-pill sp-pill--red">hidden</span>' : ''}
            <time>${esc((r.createdAt || '').slice(0, 10))}</time>
          </header>
          <p class="adm-review__text">${esc(r.comment || '')}</p>
          ${r.consultation ? `<p class="text-xs text-ink-3">${esc(r.consultation)}</p>` : ''}
          <form class="adm-review__reply" onsubmit="adminReviewReply(event, '${esc(r.id)}')">
            <input name="reply" value="${esc(r.reply || '')}" placeholder="Reply publicly (optional)">
            <button class="sp-btn-outline sp-btn-sm">Save reply</button>
          </form>
          <footer>
            <button class="sp-btn-outline sp-btn-sm" onclick="adminReviewSet('${esc(r.id)}', { hidden: ${r.hidden ? 'false' : 'true'} })">
              ${r.hidden ? 'Show on the site' : 'Hide from the site'}
            </button>
            <button class="sp-btn-outline sp-btn-sm" onclick="adminReviewSet('${esc(r.id)}', { verified: ${r.verified ? 'false' : 'true'} })">
              ${r.verified ? 'Remove verified mark' : 'Mark verified'}
            </button>
            <button class="sp-btn-outline sp-btn-sm adm-review__del" onclick="adminReviewDelete('${esc(r.id)}')">Delete</button>
          </footer>
        </article>`).join('') || '<p class="sp-text">No reviews yet.</p>'}
      </div>`;
  }

  window.adminQuickStatus = (status) => {
    ADMIN.filters[ADMIN.tab] = Object.assign({}, ADMIN.filters[ADMIN.tab], { status });
    adminLoad();
  };
  window.adminReviewFilter = (show) => { ADMIN.filters.reviews = { show }; renderAdminBody(); };
  window.adminReviewSet = async (id, patch) => {
    try { await adminFetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }); toast('Review updated.'); adminLoad(); }
    catch (err) { toast(err.message, 'error'); }
  };
  window.adminReviewReply = async (e, id) => {
    e.preventDefault();
    try { await adminFetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'PATCH', body: { reply: e.target.elements.reply.value } }); toast('Reply saved.'); adminLoad(); }
    catch (err) { toast(err.message, 'error'); }
  };
  window.adminReviewDelete = async (id) => {
    if (!confirm('Delete this review for good?')) return;
    try { await adminFetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' }); toast('Review deleted.'); adminLoad(); }
    catch (err) { toast(err.message, 'error'); }
  };

  /** Downloads the bookings or enquiries list as a spreadsheet. */
  window.adminExport = async function (what) {
    try {
      const headers = {};
      if (ADMIN.pin) headers['x-admin-pin'] = ADMIN.pin;
      if (ADMIN.token) headers['x-admin-token'] = ADMIN.token;
      const res = await fetch(`/api/admin/${what}/export`, { headers });
      if (!res.ok) throw new Error(`Could not export the ${what}`);
      const url = window.URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url; a.download = `guruji_${what}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast(`${what[0].toUpperCase()}${what.slice(1)} exported.`);
    } catch (err) { toast(err.message, 'error'); }
  };

  function renderAdminBody() {
    const host = $('#adm-body');
    const tab = ADMIN.tab;
    if (tab === 'contentStatus') return renderContentStatus(host);
    if (tab === 'overview') return renderOverview(host);
    if (tab === 'reviews') return renderReviewsAdmin(host);
    if (tab === 'consents') {
      const rows = ADMIN.data.consents || [];
      const f = ADMIN.filters.consents || {};
      host.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <form class="sp-filter flex-1" onsubmit="event.preventDefault(); adminFilter(this)">
            <div class="sp-filter__search"><i class="fa-solid fa-magnifying-glass"></i><input name="q" value="${esc(f.q || '')}" placeholder="Search name, mobile, email, consent ID…"></div>
            <select name="serviceType" aria-label="Filter by service" onchange="adminFilter(this.form)">
              <option value="">All services</option>
              <option value="general" ${f.serviceType === 'general' ? 'selected' : ''}>General / Account</option>
              <option value="consultation" ${f.serviceType === 'consultation' ? 'selected' : ''}>Consultation</option>
              <option value="pooja" ${f.serviceType === 'pooja' ? 'selected' : ''}>Pooja &amp; Rituals</option>
              <option value="course" ${f.serviceType === 'course' ? 'selected' : ''}>Courses</option>
            </select>
            <button class="sp-btn-outline">Filter</button>
          </form>
          <button type="button" class="gold-gradient-btn h-10 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs" onclick="adminExportConsents()">
            <i class="fa-solid fa-file-csv"></i> <span>Export CSV</span>
          </button>
        </div>
        <p class="text-sm text-ink-3 my-3">${rows.length} consent records found (Immutable Audit Trail)</p>
        <div class="overflow-x-auto bg-white rounded-2xl border border-line shadow-xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-amber-50/70 text-amber-950 font-bold border-b border-line uppercase tracking-wider text-[11px]">
              <tr>
                <th class="p-3">Timestamp (IST)</th>
                <th class="p-3">Seeker Name</th>
                <th class="p-3">Contact Details</th>
                <th class="p-3 text-center">Consents Granted</th>
                <th class="p-3">Service</th>
                <th class="p-3">Source</th>
                <th class="p-3">IP Address</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line text-ink-2">
              ${rows.map(c => `
                <tr class="hover:bg-parchment/40 transition">
                  <td class="p-3 font-mono text-2xs whitespace-nowrap text-ink-3">
                    ${esc(c.timestamp ? new Date(c.timestamp).toLocaleString('en-IN') : '—')}
                  </td>
                  <td class="p-3 font-semibold text-ink">
                    ${esc(c.name || 'Anonymous')}
                    <div class="font-mono text-2xs text-ink-3">${esc(c.id || '')}</div>
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <div><a href="tel:${esc(c.mobile)}" class="text-maroon hover:underline font-mono">${esc(c.mobile ? '+91 ' + c.mobile : '—')}</a></div>
                    <div class="text-2xs text-ink-3">${esc(c.email || '—')}</div>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1">
                      <span class="sp-pill sp-pill--green text-2xs" title="Disclaimer, Terms & Privacy Accepted">Legal suite: Yes</span>
                      ${c.serviceSpecificAcknowledgement ? '<span class="sp-pill sp-pill--gold text-2xs" title="Service Specific Acknowledged">Service: Yes</span>' : ''}
                    </div>
                  </td>
                  <td class="p-3 capitalize">${esc(c.serviceType || 'general')}</td>
                  <td class="p-3">
                    <span class="sp-pill sp-pill--muted text-2xs">${esc(c.consentSource || 'portal')}</span>
                  </td>
                  <td class="p-3 font-mono text-2xs text-ink-3 whitespace-nowrap">${esc(c.ip || '—')}</td>
                </tr>
              `).join('') || '<tr><td colspan="7" class="p-6 text-center text-ink-3">No consent records found.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
      return;
    }
    if (tab === 'bookings' || tab === 'enquiries') {
      const isB = tab === 'bookings';
      const rows = ADMIN.data[tab] || [];
      const f = ADMIN.filters[tab] || {};
      host.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div class="sp-chips sp-chips--nav">
            ${(isB
            ? [['', 'All'], ['PENDING_PAYMENT', 'Unpaid'], ['PAID', 'Paid'], ['SCHEDULED', 'Scheduled'], ['AWAITING_REPORT', 'Reading due'], ['COMPLETED', 'Finished']]
            : [['', 'All'], ['NEW', 'No reply yet'], ['CONTACTED', 'Contacted'], ['CONFIRMED', 'Confirmed'], ['CLOSED', 'Closed']])
            .map(([v, label]) => `<a href="#" class="${(f.status || '') === v ? 'is-active' : ''}" onclick="event.preventDefault(); adminQuickStatus('${v}')">${label}</a>`).join('')}
          </div>
          <button type="button" class="sp-btn-outline sp-btn-sm" onclick="adminExport('${tab}')"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
        </div>
        <form class="sp-filter" onsubmit="event.preventDefault(); adminFilter(this)">
          <div class="sp-filter__search"><i class="fa-solid fa-magnifying-glass"></i><input name="q" value="${esc(f.q || '')}" placeholder="Search name, mobile, reference…"></div>
          <select name="status" aria-label="Filter by status" onchange="adminFilter(this.form)"><option value="">All statuses</option>${ADMIN.data.statuses.map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          ${isB ? `<select name="type" aria-label="Filter by booking type" onchange="adminFilter(this.form)"><option value="">All types</option><option value="consultation" ${f.type === 'consultation' ? 'selected' : ''}>Consultation</option><option value="pooja" ${f.type === 'pooja' ? 'selected' : ''}>Pooja</option></select>`
          : `<select name="kind" aria-label="Filter by enquiry kind" onchange="adminFilter(this.form)"><option value="">All kinds</option>${['booking', 'course', 'contact'].map(k => `<option ${f.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select>`}
          <button class="sp-btn-outline">Filter</button>
        </form>
        <p class="text-sm text-ink-3 my-3">${rows.length} ${tab}</p>
        <div class="adm-records">${rows.map(r => {
            const ref = isB ? r.orderId : r.reference;
            const who = isB ? r.devotee : r.contact;
            const what = isB ? (r.service && r.service.title) : (r.service ? r.service.title : r.kind);
            const when = isB ? (r.poojaDate ? `${r.poojaDate} · ${(r.poojaSlot || {}).label || ''}` : r.slot ? `${r.slot.date || ''} ${r.slot.time || ''}` : '') : [r.preferredDate, r.preferredTime].filter(Boolean).join(' · ');
            const details = isB ? [
              who.email && `Email: ${who.email}`, who.gotram && `Gotram: ${who.gotram}`, who.dob && `DOB: ${who.dob}`, who.tob && `TOB: ${who.tob}`, who.pob && `POB: ${who.pob}`,
              who.questions && `Questions: ${who.questions}`, r.handedness && `Hand: ${r.handedness}`,
              (who.lat != null && who.lon != null) && `Birth co-ordinates: ${who.lat}, ${who.lon}`,
              r.prasadam && r.prasadam.deliver && r.prasadam.address && `Prasadam to: ${Object.values(r.prasadam.address).filter(Boolean).join(', ')}`,
              r.payment && `Payment: ${r.payment.provider} · ${r.payment.status}${r.payment.gatewayOrderId ? ' · ' + r.payment.gatewayOrderId : ''}`,
              r.photos && r.photos.length && `Photos: ${r.photos.length} (names only)`
            ] : [who.email && `Email: ${who.email}`, r.consultationType && `Type: ${r.consultationType}`, r.mode && `Mode: ${r.mode}`, r.message && `Message: ${r.message}`, `WhatsApp OK: ${who.whatsapp ? 'yes' : 'no'}`];
            return `
          <details class="adm-record">
            <summary>
              <span class="font-mono text-xs">${esc(ref)}</span>
              <span class="font-semibold">${esc(who.name)}</span>
              <span>${esc(what || '')}</span>
              <span class="text-ink-3 text-xs">${esc(when)}</span>
              ${isB ? `<span class="font-semibold">₹${Number(r.amount || 0).toLocaleString('en-IN')}</span>` : '<span></span>'}
              <span class="sp-pill sp-pill--${STATUS_TONE[r.status] || 'muted'}">${esc(r.status)}</span>
            </summary>
            <div class="adm-record__body">
              <p><strong>Mobile:</strong> <a href="tel:${esc(who.mobile || who.phone)}">${esc(who.mobile || who.phone)}</a> · <a href="https://wa.me/91${esc(who.mobile || who.phone)}" target="_blank" rel="noopener">WhatsApp</a> · Created ${esc(new Date(r.createdAt).toLocaleString('en-IN'))}</p>
              <ul>${details.filter(Boolean).map(d => `<li>${esc(d)}</li>`).join('')}</ul>
              ${r.adminNote ? `<p class="text-sm"><strong>Note:</strong> ${esc(r.adminNote)}</p>` : ''}
              <form class="flex flex-wrap gap-2 items-end mt-3" onsubmit="event.preventDefault(); adminUpdateRecord('${tab}', '${esc(ref)}', this)">
                <label class="sp-field"><span>Status</span><select name="status">${ADMIN.data.statuses.map(s => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
                <label class="sp-field flex-1 min-w-[200px]"><span>Note</span><input name="note" maxlength="500" placeholder="Internal note"></label>
                <button class="gold-gradient-btn h-10 px-4 rounded-lg">Save</button>
              </form>
            </div>
          </details>`;
          }).join('') || '<p class="sp-text">Nothing here yet.</p>'}</div>`;
      return;
    }
    if (tab === 'images') {
      const media = ADMIN.data.media || [];
      host.innerHTML = `
        <div class="sp-panel mb-4"><label class="sp-btn-outline cursor-pointer"><i class="fa-solid fa-upload"></i> Upload image (max 2 MB)<input type="file" accept="image/*" class="sr-only" onchange="adminUploadToLibrary(this)"></label><p class="text-xs text-ink-3 mt-2">Copy an image's address into any “Image” field in Services, Courses or Articles.</p></div>
        <div class="grid gap-4 grid-cols-2 md:grid-cols-4">${media.map(m => `<figure class="sp-panel p-2"><img src="/api/media/${esc(m.id)}" alt="" class="w-full h-32 object-cover rounded"><figcaption class="text-xs mt-2 break-all"><code>/api/media/${esc(m.id)}</code><br>${esc(m.name)}</figcaption><button class="text-xs text-rose-700 mt-1" onclick="adminDeleteMedia('${esc(m.id)}')">Delete</button></figure>`).join('') || '<p class="sp-text">No uploaded images yet.</p>'}</div>`;
      return;
    }
    if (tab === 'mantras') {
      host.innerHTML = `<div class="sp-panel"><h3 class="sp-h3">Mantras &amp; Stotras library</h3><p class="sp-text">Add, edit or remove mantras in the library editor.</p><button class="gold-gradient-btn h-11 px-5 rounded-xl mt-3" onclick="openAdminMantraModal()">Open the mantra editor</button></div>`;
      return;
    }
    const content = ADMIN.data.content;
    const edited = ADMIN.data.edited || [];
    const resetBtn = edited.includes(tab) ? `<button type="button" class="text-xs text-rose-700 underline" onclick="adminReset('${tab}')">Reset this section to the original content</button>` : '';
    if (OBJECT_SECTIONS[tab]) {
      const sch = OBJECT_SECTIONS[tab];
      host.innerHTML = `<form class="sp-panel sp-form" id="adm-obj-form" onsubmit="event.preventDefault(); adminSaveObject('${tab}')">
        <div class="sp-form__grid">${sch.fields.map(fd => fieldHtml(fd, getPath(content[tab], fd[0]))).join('')}</div>
        <div class="flex items-center gap-4"><button class="gold-gradient-btn h-11 px-6 rounded-xl">Save ${esc(sch.label)}</button>${resetBtn}</div></form>`;
      return;
    }
    if (tab === 'policies') {
      const pol = content.policies || {};
      host.innerHTML = `<form class="sp-panel sp-form" id="adm-obj-form" onsubmit="event.preventDefault(); adminSavePolicies()">
        <p class="text-sm text-ink-3">One section per line as: Heading || Text. Please have policies reviewed before relying on them.</p>
        ${Object.entries(pol).map(([k, p]) => `<h3 class="sp-h3 mt-4">${esc(p.title)}</h3><textarea data-policy="${k}" rows="8" class="w-full">${esc(p.sections.map(s => s.join(' || ')).join('\n'))}</textarea>`).join('')}
        <div class="flex items-center gap-4 mt-4"><button class="gold-gradient-btn h-11 px-6 rounded-xl">Save policies</button>${resetBtn}</div></form>`;
      return;
    }
    const sch = SCHEMAS[tab];
    const list = content[tab] || [];
    const idx = ADMIN.editing;
    host.innerHTML = `
      <div class="adm-split">
        <div class="adm-list">
          <div class="flex items-center justify-between gap-2 mb-2"><strong>${list.length} ${esc(sch.label.toLowerCase())}</strong><button class="sp-btn-outline sp-btn-sm" onclick="adminAdd('${tab}')"><i class="fa-solid fa-plus"></i> Add</button></div>
          <input class="sp-input w-full mb-2" placeholder="Filter…" oninput="adminListFilter(this.value)">
          <ul id="adm-items">${list.map((it, i) => `<li class="${i === idx ? 'is-active' : ''}" data-text="${esc((it[sch.title] || '') + ' ' + (it.category || it.track || ''))}">
            <button onclick="adminEdit(${i})"><span>${esc(it[sch.title] || '(untitled)')}</span>${it.published === false ? '<em>draft</em>' : ''}</button>
            <span class="adm-move"><button title="Move up" onclick="adminMove(${i},-1)">↑</button><button title="Move down" onclick="adminMove(${i},1)">↓</button></span></li>`).join('')}</ul>
          <div class="mt-3">${resetBtn}</div>
        </div>
        <div class="adm-editor">${idx == null || !list[idx] ? '<p class="sp-text">Choose an item to edit, or add a new one.</p>' : `
          <form class="sp-panel sp-form" id="adm-item-form" onsubmit="event.preventDefault(); adminSaveItem('${tab}', ${idx})">
            <div class="sp-form__grid">${sch.fields.map(fd => fieldHtml(fd, list[idx][fd[0]])).join('')}</div>
            <div class="flex flex-wrap items-center gap-3">
              <button class="gold-gradient-btn h-11 px-6 rounded-xl">Save</button>
              ${sch.key && list[idx][sch.key] && tab !== 'faqCategories' && tab !== 'serviceCategories' ? `<a class="sp-link" target="_blank" href="/${tab === 'services' ? 'services' : tab === 'courses' ? 'courses' : 'resources'}/${esc(list[idx][sch.key])}">View page ↗</a>` : ''}
              <button type="button" class="ml-auto text-sm text-rose-700" onclick="adminDelete('${tab}', ${idx})">Delete</button>
            </div>
          </form>`}</div>
      </div>`;
  }

  async function adminSaveSection(section, value, msg) {
    try {
      await adminFetch('/api/admin/content/' + section, { method: 'PUT', body: { value } });
      ADMIN.data.content[section] = value;
      if (!ADMIN.data.edited.includes(section)) ADMIN.data.edited.push(section);
      SITE.content = Object.assign({}, SITE.content, { [section]: value });
      applySettings();
      toast(msg || 'Saved.');
      renderAdminBody();
      return true;
    } catch (err) { toast(err.message, 'error'); return false; }
  }
  window.adminSaveItem = (tab, idx) => {
    const list = JSON.parse(JSON.stringify(ADMIN.data.content[tab]));
    list[idx] = readForm($('#adm-item-form'), list[idx]);
    adminSaveSection(tab, list, 'Saved — the website is updated.');
  };
  window.adminSaveObject = (tab) => adminSaveSection(tab, readForm($('#adm-obj-form'), ADMIN.data.content[tab]), 'Saved — the website is updated.');
  window.adminSavePolicies = () => {
    const pol = JSON.parse(JSON.stringify(ADMIN.data.content.policies));
    document.querySelectorAll('[data-policy]').forEach(t => {
      pol[t.dataset.policy].sections = t.value.split('\n').map(l => l.split('||').map(x => x.trim())).filter(p => p[0]).map(p => [p[0], p.slice(1).join(' || ')]);
      pol[t.dataset.policy].updated = new Date().toISOString().slice(0, 10);
    });
    adminSaveSection('policies', pol);
  };
  window.adminAdd = (tab) => {
    const sch = SCHEMAS[tab];
    ADMIN.data.content[tab] = [sch.blank(), ...(ADMIN.data.content[tab] || [])];
    ADMIN.editing = 0;
    renderAdminBody();
    toast('New item added as a draft — fill it in and press Save.');
  };
  window.adminEdit = (i) => { ADMIN.editing = i; renderAdminBody(); $('#adm-body .adm-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  window.adminMove = (i, d) => {
    const list = JSON.parse(JSON.stringify(ADMIN.data.content[ADMIN.tab]));
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    ADMIN.editing = j;
    adminSaveSection(ADMIN.tab, list, 'Order saved.');
  };
  window.adminDelete = (tab, i) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    const list = JSON.parse(JSON.stringify(ADMIN.data.content[tab]));
    list.splice(i, 1);
    ADMIN.editing = null;
    adminSaveSection(tab, list, 'Deleted.');
  };
  window.adminReset = async (section) => {
    // Nothing is thrown away silently: the saved copy is downloaded first.
    const edited = (ADMIN.data && ADMIN.data.edited) || [];
    if (!edited.includes(section)) { toast('That section is already the original.'); return; }
    if (!confirm(`Replace the saved "${section}" with the original from the code?\n\nA backup of the saved copy downloads first, so nothing is lost.`)) return;
    try { adminDownloadSection(section); } catch (e) { /* a blocked download must not stop the reset */ }
    try {
      const out = await adminFetch('/api/admin/content/' + section, { method: 'DELETE' });
      ADMIN.data.content[section] = out.value;
      ADMIN.data.edited = ADMIN.data.edited.filter(x => x !== section);
      SITE.content = Object.assign({}, SITE.content, { [section]: out.value });
      ADMIN.editing = null;
      renderAdminBody();
      toast('Section reset.');
    } catch (err) { toast(err.message, 'error'); }
  };
  window.adminListFilter = (q) => {
    const n = q.toLowerCase();
    document.querySelectorAll('#adm-items li').forEach(li => { li.hidden = n && !li.dataset.text.toLowerCase().includes(n); });
  };
  window.adminFilter = (form) => {
    const f = {};
    ['q', 'status', 'type', 'kind'].forEach(k => { if (form.elements[k] && form.elements[k].value) f[k] = form.elements[k].value; });
    ADMIN.filters[ADMIN.tab] = f;
    adminLoad();
  };
  window.adminUpdateRecord = async (tab, ref, form) => {
    try {
      await adminFetch(`/api/admin/${tab}/${encodeURIComponent(ref)}`, { method: 'PATCH', body: { status: form.elements.status.value, note: form.elements.note.value } });
      toast('Updated.');
      adminLoad();
    } catch (err) { toast(err.message, 'error'); }
  };
  window.adminUploadToLibrary = async (input) => {
    const file = input.files[0];
    if (!file) return;
    const data = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    try { await adminFetch('/api/admin/media', { method: 'POST', body: { name: file.name, type: file.type, data } }); toast('Image uploaded.'); adminLoad(); }
    catch (err) { toast(err.message, 'error'); }
  };
  window.adminDeleteMedia = async (id) => {
    if (!confirm('Delete this image? Pages that use it will show no image.')) return;
    try { await adminFetch('/api/admin/media/' + id, { method: 'DELETE' }); adminLoad(); } catch (err) { toast(err.message, 'error'); }
  };
  window.adminTab = (tab) => {
    ADMIN.tab = tab;
    ADMIN.editing = null;
    sessionStorage.setItem('guruji_admin', JSON.stringify({ pin: ADMIN.pin, token: ADMIN.token, role: ADMIN.role, email: ADMIN.email, tab }));
    renderAdmin();
  };
  window.adminLogout = () => {
    // Tell the server to throw the session away as well, so a token copied out
    // of this browser stops working the moment the staff member signs out.
    if (ADMIN.token) {
      const token = ADMIN.token;
      fetch('/api/admin/logout', { method: 'POST', headers: { 'x-admin-token': token } }).catch(() => {});
    }
    clearAdminSession();
    renderAdmin();
  };
  window.adminLogin = async (e) => {
    e.preventDefault();
    const pin = e.target.elements.pin.value;
    try {
      const res = await fetchJson('/api/admin/verify', { method: 'POST', headers: { 'x-admin-pin': pin } });
      if (!res) throw new Error('The admin dashboard needs the server.');
      ADMIN.pin = pin; ADMIN.token = ''; ADMIN.role = res.role; ADMIN.email = '';
      if (res.role !== 'owner' && ['overview', 'bookings', 'enquiries', 'consents', 'reviews', 'contentStatus'].includes(ADMIN.tab)) ADMIN.tab = 'services';
      sessionStorage.setItem('guruji_admin', JSON.stringify({ pin, role: res.role, tab: ADMIN.tab }));
      window.ADMIN_PIN_SESSION = pin;
      renderAdmin();
    } catch (err) { toast(err.message, 'error'); }
  };
  /** Google sign-in only works once the owner has listed the addresses. Say so
   *  here rather than letting someone click and be refused. */
  function staffGoogleNote() {
    const g = SITE.staffGoogle;
    if (!g || (g.admin + g.guruji) > 0) return '';
    return `<p class="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-left">
      Google sign-in is not set up yet. Add the addresses to <strong>ADMIN_EMAILS</strong> (full dashboard)
      or <strong>GURUJI_EMAILS</strong> (case area) in the hosting environment, then redeploy. The PIN below works either way.
    </p>`;
  }

  window.adminLoginWithGoogle = async () => {
    if (!window.firebaseAuth) {
      toast('Connecting to Google Firebase...', 'warn');
      return;
    }
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(window.firebaseAuth, provider);
      const user = res.user;
      if (!user) return;
      const idToken = await user.getIdToken();
      const verifyRes = await fetchJson('/api/admin/verify', {
        method: 'POST',
        body: { idToken }
      });
      if (!verifyRes || !verifyRes.ok) throw new Error('Verification failed');
      ADMIN.token = verifyRes.token;
      ADMIN.pin = '';
      ADMIN.role = verifyRes.role;
      ADMIN.email = verifyRes.email;
      sessionStorage.setItem('guruji_admin', JSON.stringify({ token: verifyRes.token, role: verifyRes.role, email: verifyRes.email, tab: ADMIN.tab }));
      toast(`Welcome, ${user.displayName || user.email}! Signed in as ${verifyRes.role === 'owner' ? 'Admin' : 'Guruji'}.`, 'success');
      renderAdmin();
      if (typeof renderGuruji === 'function') renderGuruji();
    } catch (err) {
      toast(staffSignInReason(err), 'error');
    }
  };

  /** Turns the server's refusal code into something the owner can act on.
   *  Without this the console shows a bare 401 and nothing says why. */
  function staffSignInReason(err) {
    const codes = {
      wrong_project: 'That sign-in belongs to a different Firebase project. Check FIREBASE_PROJECT_ID on the server.',
      wrong_issuer: 'That sign-in belongs to a different Firebase project. Check FIREBASE_PROJECT_ID on the server.',
      google_certs_unreachable: 'The server could not reach Google to check the sign-in. Try again in a moment.',
      token_expired: 'That sign-in has expired. Please try again.',
      no_email: 'That Google account has no email address attached.'
    };
    if (err && err.code && codes[err.code]) return codes[err.code];
    if (err && err.status === 403) return err.message;
    if (err && err.status === 401) return 'That Google sign-in could not be verified (' + ((err && err.code) || 'unverified') + ').';
    return (err && err.message) || 'Google sign-in could not be verified for Admin.';
  }

  function renderAdmin() {
    const host = $('#page-admin');
    if (!host) return;
    if (!ADMIN.pin && !ADMIN.token) {
      host.innerHTML = `<section class="sp-section"><div class="sp-wrap sp-narrow">
        <div class="sp-panel sp-form max-w-sm mx-auto text-center space-y-4">
          <i class="fa-solid fa-shield-halved text-3xl text-gold-deep" aria-hidden="true"></i>
          <div>
            <h1 class="sp-h2">Admin sign in</h1>
            <p class="text-xs text-ink-3 mt-1">For temple staff only</p>
          </div>

          ${staffGoogleNote()}
          <!-- Google sign-in, limited to the addresses in ADMIN_EMAILS / GURUJI_EMAILS -->
          <button type="button" onclick="adminLoginWithGoogle()" class="w-full h-11 flex items-center justify-center gap-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-all shadow-sm">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div class="flex items-center my-1 text-xs text-ink-4">
            <div class="flex-1 border-t border-stone-200 dark:border-stone-700"></div>
            <span class="px-2">OR USE PIN</span>
            <div class="flex-1 border-t border-stone-200 dark:border-stone-700"></div>
          </div>

          <form onsubmit="adminLogin(event)" class="space-y-3">
            <label class="sp-field text-left"><span>Admin PIN</span><input name="pin" type="password" autocomplete="current-password" required placeholder="Enter Owner or Staff PIN"></label>
            <button class="gold-gradient-btn w-full h-11 rounded-xl">Sign in with PIN</button>
          </form>
        </div></div></section>`;
      return;
    }
    const owner = ADMIN.role === 'owner';
    if (ADMIN.role === 'guruji') {
      // Guruji's sign-in opens the case area, not the site's content and prices.
      host.innerHTML = `<section class="sp-section"><div class="sp-wrap sp-narrow">
        <div class="sp-panel sp-form max-w-md mx-auto text-center space-y-4">
          <i class="fa-solid fa-hands-praying text-3xl text-gold-deep" aria-hidden="true"></i>
          <h1 class="sp-h2">Namaste${ADMIN.email ? ', ' + esc(ADMIN.email) : ''}</h1>
          <p class="sp-text">This sign-in opens Guruji's case area: the seekers waiting, their palms and charts, the chat and the readings.</p>
          <div class="flex gap-3 justify-center flex-wrap">
            <a href="/guruji" data-link class="gold-gradient-btn h-11 px-5 rounded-xl inline-flex items-center">Go to my cases</a>
            <button type="button" onclick="adminLogout()" class="sp-btn-outline">Sign out</button>
          </div>
        </div></div></section>`;
      return;
    }
    const tabs = [
      owner && ['overview', 'Overview', 'fa-gauge-high'],
      owner && ['bookings', 'Bookings', 'fa-calendar-check'],
      owner && ['enquiries', 'Enquiries', 'fa-envelope-open-text'],
      owner && ['consents', 'Consent Records', 'fa-shield-halved'],
      owner && ['reviews', 'Reviews', 'fa-star'],
      ['services', 'Services & pricing', 'fa-hand'], ['serviceCategories', 'Service categories', 'fa-layer-group'], ['courses', 'Courses', 'fa-graduation-cap'],
      ['articles', 'Articles', 'fa-newspaper'], ['faqCategories', 'FAQs', 'fa-circle-question'], ['testimonials', 'Testimonials', 'fa-quote-left'],
      ['about', 'About Guruji', 'fa-user'], ['pillars', 'Home pillars', 'fa-table-columns'], ['settings', 'Settings & homepage', 'fa-gear'],
      owner && ['contentStatus', 'Saved vs original', 'fa-code-compare'],
      ['policies', 'Policies', 'fa-file-contract'], ['images', 'Images', 'fa-image'], ['mantras', 'Mantras', 'fa-om']
    ].filter(Boolean);
    host.innerHTML = `
      <section class="adm">
        <aside class="adm-nav">
          <div class="adm-nav__head"><strong>Admin</strong><span class="sp-pill sp-pill--gold">${esc(ADMIN.email || ADMIN.role)}</span></div>
          ${tabs.map(([id, label, ic]) => `<button class="${ADMIN.tab === id ? 'is-active' : ''}" onclick="adminTab('${id}')"><i class="fa-solid ${ic}" aria-hidden="true"></i>${label}</button>`).join('')}
          <button onclick="adminLogout()" class="adm-nav__logout"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>Sign out</button>
        </aside>
        <div class="adm-main">
          <div class="adm-head">
            <h1 class="sp-h2">${esc((tabs.find(t => t[0] === ADMIN.tab) || [])[1] || '')}</h1>
            <button type="button" class="adm-bell" id="adm-bell" title="Unread messages from seekers"
                    aria-label="Unread messages from seekers" onclick="adminOpenMessages()">
              <i class="fa-regular fa-bell" aria-hidden="true"></i>
            </button>
          </div>
          <div id="adm-body"></div>
        </div>
      </section>`;
    adminLoad();
    adminRefreshBell();
  }

  // -------------------------------------------------------------------------
  // What the seeker sees under their booking: session, chat, chart, reading
  // -------------------------------------------------------------------------
  window.renderBookingExtras = function (b) {
    const host = $('#track-live');
    if (!host) return;
    stopChat();
    const paid = ['PAID', 'DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT', 'COMPLETED'].includes(b.status);
    if (!paid || b.type === 'pooja' || b.type === 'course') { host.innerHTML = ''; return; }
    const mobile = b.devotee.mobile;
    const ready = b.report && b.report.status === 'ready';
    const when = b.slotStart ? new Date(b.slotStart) : null;
    // The room only exists while the consultation is still ahead of you.
    const roomOpen = ['PAID', 'DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT'].includes(b.status)
      && (!when || Date.now() < when.getTime() + 30 * 60000);

    host.innerHTML = `
      <div class="track-extras">
        <div class="sp-panel">
          <h3 class="sp-h3">${roomOpen ? 'Your consultation room' : 'Your consultation'}</h3>
          ${when ? `<p class="sp-text">${when.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}.${roomOpen ? ' The room opens ten minutes before.' : ''}</p>`
        : '<p class="sp-text">We will confirm your appointment time with you.</p>'}
          ${roomOpen ? '<p class="session-countdown" data-track-countdown></p>' : '<p class="sp-text">The session is over. Guruji\'s written reading is below once it is ready.</p>'}
          <div class="flex flex-wrap gap-3 mt-2">
            ${roomOpen ? `<a href="/session/${esc(b.orderId)}" data-link class="gold-gradient-btn h-11 px-5 rounded-xl" data-join-link><i class="fa-solid fa-video" aria-hidden="true"></i> Join session</a>` : ''}
            ${ready ? `<a href="/api/bookings/${esc(b.orderId)}/report.pdf?mobile=${encodeURIComponent(mobile)}" target="_blank" rel="noopener" class="sp-btn-outline"><i class="fa-regular fa-file-pdf"></i> Download your reading</a>` : ''}
            ${ready && b.reportFile ? `<a href="/api/bookings/${esc(b.orderId)}/report-file.pdf?mobile=${encodeURIComponent(mobile)}" target="_blank" rel="noopener" class="sp-btn-outline"><i class="fa-regular fa-file-pdf" aria-hidden="true"></i> Read Guruji's PDF</a>` : ''}
            ${b.chart ? '<button type="button" class="sp-btn-outline" data-show-chart>See your Kundali</button>' : ''}
          </div>
          ${ready ? '' : '<p class="text-xs text-ink-3 mt-2">Your written reading appears here once Guruji has finished it.</p>'}
        </div>
        <div data-track-chat>${chatMarkup('Chat with Guruji')}</div>
        <div class="sp-panel hidden" data-track-chart></div>
      </div>`;

    if (when && roomOpen) {
      const el = host.querySelector('[data-track-countdown]');
      const opens = new Date(when.getTime() - 10 * 60000);
      let timer = null;
      const tick = () => {
        const ms = opens - Date.now();
        if (!document.body.contains(el)) return clearInterval(timer);
        if (ms <= 0) { el.textContent = 'The room is open now.'; el.classList.add('is-open'); return clearInterval(timer); }
        const s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
        el.textContent = d > 0 ? `Opens in ${d} day${d > 1 ? 's' : ''}` :
          `Opens in ${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      };
      tick();
      timer = setInterval(tick, 1000);
    }
    const chartBtn = host.querySelector('[data-show-chart]');
    if (chartBtn) chartBtn.addEventListener('click', async () => {
      const panel = host.querySelector('[data-track-chart]');
      panel.classList.remove('hidden');
      chartBtn.remove();
      try {
        const res = await fetchJson(`/api/bookings/${encodeURIComponent(b.orderId)}/chart?mobile=${encodeURIComponent(mobile)}`);
        showChart(panel, res.chart);
      } catch (err) { panel.innerHTML = `<p class="sp-text">${esc(err.message)}</p>`; }
    });
    startChat(host.querySelector('[data-track-chat]'), b.orderId, { mobile });
  };

  // -------------------------------------------------------------------------
  // Guruji's case area
  // -------------------------------------------------------------------------
  // cols holds the filter for each column of the table, which is what the
  // Filter button offers: seeker name, service name, booking id and status.
  const GURUJI = { list: [], current: null, view: 'dashboard', section: '', q: '', sort: 'soonest',
    cols: { seeker: '', service: '', booking: '', status: '' } };
  const gurujiFetch = (url, opts = {}) => {
    const headers = Object.assign({}, opts.headers);
    if (ADMIN.pin) headers['x-admin-pin'] = ADMIN.pin;
    if (ADMIN.token) headers['x-admin-token'] = ADMIN.token;
    return fetchJson(url, Object.assign({}, opts, { headers }));
  };

  RENDER.guruji = ({ slug }) => `<section class="guruji-area" data-guruji-root data-case="${esc(slug || '')}"><div class="sp-wrap py-10"><div class="sp-spinner" aria-hidden="true"></div></div></section>`;

  async function renderGuruji(orderId) {
    const root = $('[data-guruji-root]');
    if (!root) return;
    if ((!ADMIN.pin && !ADMIN.token) || !['guruji', 'owner'].includes(ADMIN.role)) {
      root.innerHTML = `<section class="sp-section"><div class="sp-wrap sp-narrow">
        <div class="sp-panel sp-form max-w-sm mx-auto text-center space-y-4">
          <i class="fa-solid fa-hands-praying text-3xl text-gold-deep" aria-hidden="true"></i>
          <div>
            <h1 class="sp-h2">Guruji's Cases</h1>
            <p class="sp-text">Sign in to see seekers waiting, palms and charts, chat and readings.</p>
            <p class="text-xs text-ink-3 mt-1">For Guruji and temple staff only</p>
          </div>

          ${staffGoogleNote()}
          <!-- Google sign-in, limited to the addresses in ADMIN_EMAILS / GURUJI_EMAILS -->
          <button type="button" onclick="adminLoginWithGoogle()" class="w-full h-11 flex items-center justify-center gap-3 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-all shadow-sm">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div class="flex items-center my-1 text-xs text-ink-4">
            <div class="flex-1 border-t border-stone-200 dark:border-stone-700"></div>
            <span class="px-2">OR USE PIN</span>
            <div class="flex-1 border-t border-stone-200 dark:border-stone-700"></div>
          </div>

          <form onsubmit="gurujiLogin(event)" class="space-y-3">
            <label class="sp-field text-left"><span>Guruji PIN</span><input name="pin" type="password" autocomplete="current-password" required placeholder="Enter Guruji PIN"></label>
            <button class="gold-gradient-btn w-full h-11 rounded-xl font-semibold">Sign in</button>
          </form>
        </div></div></section>`;
      return;
    }
    if (orderId) return renderCase(orderId);
    root.innerHTML = '<div class="sp-wrap py-8"><div class="sp-spinner" aria-hidden="true"></div></div>';
    let data;
    try { data = await gurujiFetch('/api/guruji/cases'); } catch (err) {
      if (err.status === 401) {
        clearAdminSession();
        toast('Your session has ended. Please sign in again.', 'warn');
        return renderGuruji();
      }
      root.innerHTML = `<div class="sp-wrap py-8"><p class="sp-notice">${esc(err.message)}</p></div>`; return;
    }
    GURUJI.list = (data && data.cases) || [];
    renderCaseList();
  }

  /** The case list, with the counts and filters Guruji actually works from. */
  function renderCaseList() {
    const root = $('[data-guruji-root]');
    if (!root) return;
    const all = GURUJI.list;
    const waiting = all.filter(c => c.status !== 'COMPLETED');
    const today = new Date().toISOString().slice(0, 10);
    // The words on the status badge, so the filter offers exactly what the
    // table shows rather than a second vocabulary.
    const statusLabel = (c) => c.kind === 'enquiry'
      ? 'enquiry'
      : String(c.status || '').replace(/_/g, ' ').toLowerCase();

    const row = (c) => {
      const enquiry = c.kind === 'enquiry';
      const marks = [];
      if (enquiry) {
        if ((c.devotee || {}).mobile) marks.push((c.devotee || {}).mobile);
        if (c.preferredDate) marks.push('wants ' + c.preferredDate);
        if (c.message) marks.push(c.message.slice(0, 60));
      } else {
        const photos = (c.photos || []).length;
        if (photos) marks.push(photos + (photos === 1 ? ' photo' : ' photos'));
        if (c.chart) marks.push('chart cast');
        if (c.report && c.report.status === 'ready') marks.push('reading ready');
      }
      const body = `
        <span class="gm-row__dot" aria-hidden="true"></span>
        <span class="gm-row__who">${esc((c.devotee || {}).name || 'Seeker')}</span>
        <span class="gm-row__service">${esc((c.service && c.service.title) || 'Consultation')}
          ${c.section ? `<em class="gm-row__section">${esc(c.section)}</em>` : ''}</span>
        <span class="gm-row__ref">${esc(c.orderId)}${marks.length ? `<em>${esc(marks.join(' · '))}</em>` : ''}</span>
        <span class="gm-row__tags">
          <span class="sp-pill sp-pill--${enquiry ? 'gold' : (STATUS_TONE[c.status] || 'muted')}">${esc(statusLabel(c))}</span>
          ${c.unread ? `<span class="gm-row__unread">${c.unread} new</span>` : ''}
          ${enquiry || c.assignedTo ? '' : '<span class="gm-row__free">unclaimed</span>'}
        </span>`;
      // An enquiry is not a paid case, so there is no case page to open.
      return enquiry
        ? `<div class="gm-row is-enquiry">${body}</div>`
        : `<a href="/guruji/${esc(c.orderId)}" data-link class="gm-row${c.unread ? ' is-unread' : ''}">${body}</a>`;
    };
    const startsAt = (c) => (c.slotStart || '');
    const isToday = (c) => startsAt(c).slice(0, 10) === today;
    // Guruji works a case through three stages, so the folders follow the status.
    const STAGE = {
      pending: (c) => c.status === 'PAID' || c.kind === 'enquiry',
      inprogress: (c) => ['DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT'].includes(c.status),
      completed: (c) => c.status === 'COMPLETED'
    };
    const counts = {
      pending: all.filter(STAGE.pending).length,
      inprogress: all.filter(STAGE.inprogress).length,
      completed: all.filter(STAGE.completed).length,
      unread: all.reduce((t, c) => t + (c.unread || 0), 0)
    };
    const views = {
      all: () => all.slice(),
      pending: () => all.filter(STAGE.pending),
      inprogress: () => all.filter(STAGE.inprogress),
      completed: () => all.filter(STAGE.completed),
      // Not a folder: the bell opens this.
      unread: () => all.filter(c => c.unread)
    };
    const q = GURUJI.q.trim().toLowerCase();
    let list = (views[GURUJI.view] || views.all)();
    if (GURUJI.section) list = list.filter((c) => c.section === GURUJI.section);
    // The filter works on the columns of the table, one control per column.
    const colOf = {
      seeker: (c) => (c.devotee || {}).name || '',
      service: (c) => (c.service || {}).title || '',
      booking: (c) => c.orderId || '',
      status: (c) => statusLabel(c)
    };
    // Each dropdown lists the values actually present, counted against the
    // other filters, so a choice never lands on an empty table.
    const choicesFor = (key) => {
      const others = list.filter((c) => Object.keys(colOf).every((k) =>
        k === key || !GURUJI.cols[k] || colOf[k](c) === GURUJI.cols[k]));
      const seen = new Map();
      for (const c of others) {
        const v = colOf[key](c);
        if (v) seen.set(v, (seen.get(v) || 0) + 1);
      }
      return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    };
    const colChoices = { service: choicesFor('service'), status: choicesFor('status') };
    for (const [key, read] of Object.entries(colOf)) {
      const want = (GURUJI.cols[key] || '').trim();
      if (!want) continue;
      // Names and ids are typed, so they match loosely; the dropdowns exactly.
      list = (key === 'seeker' || key === 'booking')
        ? list.filter((c) => read(c).toLowerCase().includes(want.toLowerCase()))
        : list.filter((c) => read(c) === want);
    }
    const activeCols = Object.values(GURUJI.cols).filter((v) => String(v).trim()).length;
    if (q) list = list.filter(c => [c.orderId, (c.devotee || {}).name, (c.devotee || {}).mobile, (c.service || {}).title]
      .filter(Boolean).join(' ').toLowerCase().includes(q));
    list = list.slice().sort((a, b) => GURUJI.sort === 'newest'
      ? (b.createdAt || '').localeCompare(a.createdAt || '')
      : (startsAt(a) || '9999').localeCompare(startsAt(b) || '9999'));

    const chip = (id, label, n) => `<a href="#" class="${GURUJI.view === id ? 'is-active' : ''}" onclick="event.preventDefault(); gurujiView('${id}')">${label}${n ? ` (${n})` : ''}</a>`;
    const next = all.filter(c => startsAt(c) > new Date().toISOString() && c.status !== 'COMPLETED')
      .sort((a, b) => startsAt(a).localeCompare(startsAt(b)))[0];

    const sections = [...new Set(all.map((c) => c.section).filter(Boolean))].sort();
    // The label can hold quotes or an ampersand, so it travels encoded.
    const sectionLink = (id, label, n) => `<a href="#" class="gm-folder gm-folder--sm${GURUJI.section === id ? ' is-active' : ''}" onclick="event.preventDefault(); gurujiSection(decodeURIComponent('${encodeURIComponent(id)}'))"><span>${esc(label)}</span>${n ? `<em>${n}</em>` : ''}</a>`;

    const folder = (id, label, icon, n) => `<a href="#" class="gm-folder${GURUJI.view === id ? ' is-active' : ''}" onclick="event.preventDefault(); gurujiView('${id}')">
        <i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span>${n ? `<em>${n}</em>` : ''}</a>`;

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const dash = {
      pending: counts.pending,
      inprogress: counts.inprogress,
      doneMonth: all.filter(c => STAGE.completed(c) && new Date(c.updatedAt || c.createdAt || 0) >= monthStart).length,
      dueToday: all.filter(c => isToday(c) && !STAGE.completed(c)).length
    };
    const workspaceCase = all.filter(STAGE.inprogress).sort((a, b) => (startsAt(a) || '9999').localeCompare(startsAt(b) || '9999'))[0]
      || all.filter(c => STAGE.pending(c) && c.kind !== 'enquiry')[0];
    const navItem = (label, icon, on, attrs, n) => `<a ${/href=/.test(attrs) ? '' : 'href="#" '}class="gp-nav${on ? ' is-active' : ''}" ${attrs}><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span>${n ? `<em>${n}</em>` : ''}</a>`;
    const onAssign = ['all', 'pending', 'inprogress', 'completed', 'unread'].includes(GURUJI.view);

    root.innerHTML = `
      <div class="gm gp">
        <header class="gm-top gp-top">
          <a href="/guruji" data-link class="gp-brandmark" aria-label="Guruji Portal home"><i class="fa-solid fa-hand" aria-hidden="true"></i></a>
          <div class="gp-title"><strong>Guruji Palmistry – Guruji Portal <span>(Practitioner Workspace)</span></strong><small>Review · Analyse · Correlate · Create Reports · Guide Seekers</small></div>
          <input class="gm-search" type="search" value="${esc(GURUJI.q)}" placeholder="Search name, mobile or reference…" oninput="gurujiSearch(this.value)" aria-label="Search cases">
          <div class="gm-tools">
            <button type="button" class="gm-icon" title="Unread messages from seekers" aria-label="${counts.unread} unread message${counts.unread === 1 ? '' : 's'}" onclick="gurujiView('unread')">
              <i class="fa-regular fa-bell" aria-hidden="true"></i>${counts.unread ? `<span class="gm-badge">${counts.unread > 99 ? '99+' : counts.unread}</span>` : ''}
            </button>
            <button type="button" class="gm-icon" title="Refresh" aria-label="Refresh the case list" onclick="renderGuruji()"><i class="fa-solid fa-rotate" aria-hidden="true"></i></button>
            <span class="gp-me"><span class="gp-me__avatar" aria-hidden="true">ॐ</span><span>${esc(ADMIN.email ? ADMIN.email.split('@')[0] : 'Guruji')}</span></span>
            <button type="button" class="gm-signout" onclick="adminLogout(); renderGuruji()">Sign out</button>
          </div>
        </header>
        <div class="gm-body">
          <aside class="gm-side gp-side">
            <div class="gp-portal"><i class="fa-solid fa-hand" aria-hidden="true"></i><span><strong>Guruji Portal</strong><small>Guruji Palmistry®</small></span></div>
            <nav class="gp-navs" aria-label="Guruji portal">
              ${navItem('Dashboard', 'fa-house', GURUJI.view === 'dashboard', `onclick="event.preventDefault(); gurujiView('dashboard')"`)}
              ${navItem('Assignments', 'fa-clipboard-list', onAssign, `onclick="event.preventDefault(); gurujiView('all')"`, counts.pending + counts.inprogress)}
              ${navItem('Analysis Workspace', 'fa-hand-sparkles', false, workspaceCase ? `href="/guruji/${esc(workspaceCase.orderId)}" data-link` : `onclick="event.preventDefault(); toast('No case is waiting for analysis.')"`)}
              ${navItem('Assessment Checklist', 'fa-table-list', false, workspaceCase ? `href="/guruji/${esc(workspaceCase.orderId)}" data-link onclick="gurujiOpenChecklist('${esc(workspaceCase.orderId)}')"` : `onclick="event.preventDefault(); toast('Open a case to fill its checklist.')"`)}
              ${navItem('Day Sheet', 'fa-print', false, `onclick="event.preventDefault(); gurujiPrintDay()"`)}
            </nav>
            ${onAssign ? `<nav class="gm-folders" aria-label="Case folders">
              ${folder('pending', 'Pending', 'fa-hourglass-half', counts.pending)}
              ${folder('inprogress', 'In progress', 'fa-spinner', counts.inprogress)}
              ${folder('completed', 'Completed', 'fa-circle-check', counts.completed)}
            </nav>` : ''}
            ${sections.length > 1 && onAssign ? `<nav class="gm-folders gm-folders--sections" aria-label="Sections">
              <span class="gm-sectionhead">Sections</span>
              ${sectionLink('', 'All services', all.length)}
              ${sections.map((sn) => sectionLink(sn, sn, all.filter((c) => c.section === sn).length)).join('')}
            </nav>` : ''}
            <div class="gm-next">
              <span>Next appointment</span>
              <strong>${next ? esc(new Date(next.slotStart).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })) : '—'}</strong>
              ${next ? `<span>${esc((next.devotee || {}).name || '')}</span>` : '<span>Nothing booked ahead</span>'}
            </div>
          </aside>
          ${GURUJI.view === 'dashboard' ? gurujiDashboardHtml({ all, dash, counts, list: all, STAGE, isToday, startsAt, workspaceCase, statusLabel }) : `
          <main class="gm-main">
            <div class="gp-tabs gp-tabs--list">
              ${[['all', 'All', all.length], ['pending', 'Pending', counts.pending], ['inprogress', 'In Progress', counts.inprogress], ['completed', 'Completed', counts.completed]]
                .map(([v, l, n]) => `<a href="#" class="${GURUJI.view === v ? 'is-active' : ''}" onclick="event.preventDefault(); gurujiView('${v}')">${l} (${n})</a>`).join('')}
            </div>
            <div class="gm-listhead">
              <span class="gm-count">${list.length} ${list.length === 1 ? 'case' : 'cases'}</span>
              <details class="gm-filter"${activeCols ? ' open' : ''}>
                <summary class="gm-filterbtn"><i class="fa-solid fa-filter" aria-hidden="true"></i> Filter${activeCols ? ' · ' + activeCols : ''}</summary>
                <div class="gm-filtermenu gm-filtermenu--cols">
                  <label class="gm-colfilter">
                    <span>Seeker Name</span>
                    <input type="search" value="${esc(GURUJI.cols.seeker)}" placeholder="Any seeker"
                           oninput="gurujiColFilter('seeker', this.value)" autocomplete="off">
                  </label>
                  <label class="gm-colfilter">
                    <span>Service Name</span>
                    <select onchange="gurujiColFilter('service', this.value)">
                      <option value="">Any service</option>
                      ${colChoices.service.map(([v, n]) =>
                        `<option value="${esc(v)}"${GURUJI.cols.service === v ? ' selected' : ''}>${esc(v)} (${n})</option>`).join('')}
                    </select>
                  </label>
                  <label class="gm-colfilter">
                    <span>Booking ID</span>
                    <input type="search" value="${esc(GURUJI.cols.booking)}" placeholder="Any reference"
                           oninput="gurujiColFilter('booking', this.value)" autocomplete="off">
                  </label>
                  <label class="gm-colfilter">
                    <span>Status</span>
                    <select onchange="gurujiColFilter('status', this.value)">
                      <option value="">Any status</option>
                      ${colChoices.status.map(([v, n]) =>
                        `<option value="${esc(v)}"${GURUJI.cols.status === v ? ' selected' : ''}>${esc(v)} (${n})</option>`).join('')}
                    </select>
                  </label>
                  <button type="button" class="gm-filterclear" onclick="gurujiClearFilters()"${activeCols ? '' : ' disabled'}>Clear filters</button>
                </div>
              </details>
              <select class="sp-select" aria-label="Sort the cases" onchange="gurujiSort(this.value)">
                <option value="soonest" ${GURUJI.sort === 'soonest' ? 'selected' : ''}>Soonest appointment</option>
                <option value="newest" ${GURUJI.sort === 'newest' ? 'selected' : ''}>Newest booking</option>
              </select>
            </div>
            <div class="gm-colhead">
              <span aria-hidden="true"></span>
              <span>Seeker Name</span>
              <span>Service Name</span>
              <span>Booking ID</span>
              <span>Status</span>
            </div>
            <div class="gm-rows">${list.length ? list.map(row).join('')
              : `<p class="gm-empty">${all.length ? 'Nothing matches that.' : 'No paid bookings yet.'}</p>`}</div>
          </main>`}
        </div>
      </div>`;
  }

  /** Opens a case straight on its assessment checklist tab. */
  window.gurujiOpenChecklist = (orderId) => { GURUJI.caseTab = 'assessment'; GURUJI.caseTabFor = orderId; };

  /** Guruji's home: the day at a glance, then straight into the work. */
  function gurujiDashboardHtml({ all, dash, counts, STAGE, isToday, startsAt, workspaceCase, statusLabel }) {
    const stat = (icon, n, label, sub, view) => `<button type="button" class="gp-stat" onclick="gurujiView('${view}')">
      <i class="fa-solid ${icon}" aria-hidden="true"></i><strong>${n}</strong><span>${label}${sub ? `<small>${sub}</small>` : ''}</span></button>`;
    const pill = (c) => {
      const st = statusLabel(c);
      const cls = STAGE.completed(c) ? 'done' : STAGE.pending(c) ? 'new' : isToday(c) ? 'due' : 'prog';
      const label = STAGE.completed(c) ? 'Completed' : STAGE.pending(c) ? (c.kind === 'enquiry' ? 'Enquiry' : 'New') : isToday(c) ? 'Due today' : 'In progress';
      return `<span class="gp-pill gp-pill--${cls}" title="${esc(st)}">${label}</span>`;
    };
    const today = all.filter(c => isToday(c) && !STAGE.completed(c));
    const upcoming = (today.length ? today : all.filter(c => !STAGE.completed(c) && c.kind !== 'enquiry'))
      .sort((a, b) => (startsAt(a) || '9999').localeCompare(startsAt(b) || '9999')).slice(0, 6);
    const recent = all.filter(c => !STAGE.completed(c)).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);
    const action = (c) => STAGE.pending(c) ? 'Analyse' : 'Continue';
    const link = (c) => c.kind === 'enquiry' ? '' : `href="/guruji/${esc(c.orderId)}" data-link`;
    return `
      <main class="gm-main gp-main">
        <section class="gp-hello">
          <div><h1>Namaste Guruji,</h1><p>Here is your consultation overview for ${esc(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))}.</p></div>
          <span class="gp-hello__art" aria-hidden="true"></span>
        </section>
        <div class="gp-stats">
          ${stat('fa-file-lines', dash.pending, 'Pending Analysis', '', 'pending')}
          ${stat('fa-hourglass-half', dash.inprogress, 'In Progress', '', 'inprogress')}
          ${stat('fa-circle-check', dash.doneMonth, 'Completed', 'This month', 'completed')}
          ${stat('fa-calendar-day', dash.dueToday, 'Due Today', '', 'all')}
        </div>
        <div class="gp-grid">
          <section class="gp-card">
            <header><h2>${today.length ? `Today's Assignments (${today.length})` : 'Coming Up'}</h2><a href="#" onclick="event.preventDefault(); gurujiView('all')">View all</a></header>
            ${upcoming.length ? `<ul class="gp-list">${upcoming.map(c => `<li><a ${link(c)}>
              <i class="fa-regular fa-user" aria-hidden="true"></i>
              <span class="gp-list__ref">${esc(c.orderId)}</span>
              <span class="gp-list__svc">${esc((c.service && c.service.title) || 'Enquiry')}<small>${esc((c.devotee || {}).name || '')}${startsAt(c) ? ' · ' + esc(new Date(startsAt(c)).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })) : ''}</small></span>
              ${pill(c)}<i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a></li>`).join('')}</ul>`
              : '<p class="gm-empty">Nothing waiting. Enjoy the quiet.</p>'}
          </section>
          <section class="gp-card">
            <header><h2>Quick Actions</h2></header>
            <div class="gp-quick">
              <a href="#" onclick="event.preventDefault(); gurujiView('all')"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i><span>View Assignments</span></a>
              <a ${workspaceCase ? `href="/guruji/${esc(workspaceCase.orderId)}" data-link` : 'href="#" onclick="event.preventDefault()"'}><i class="fa-solid fa-hand-sparkles" aria-hidden="true"></i><span>Start Analysis</span></a>
              <a ${workspaceCase ? `href="/guruji/${esc(workspaceCase.orderId)}" data-link onclick="gurujiOpenChecklist('${esc(workspaceCase.orderId)}')"` : 'href="#" onclick="event.preventDefault()"'}><i class="fa-solid fa-table-list" aria-hidden="true"></i><span>Assessment Checklist</span></a>
              <a href="#" onclick="event.preventDefault(); gurujiPrintDay()"><i class="fa-solid fa-print" aria-hidden="true"></i><span>Day Sheet</span></a>
            </div>
          </section>
        </div>
        <section class="gp-card">
          <header><h2>Pending Assignments</h2><div class="gp-tabs">
            ${[['all', 'All', all.length], ['pending', 'Pending', counts.pending], ['inprogress', 'In Progress', counts.inprogress], ['completed', 'Completed', counts.completed]]
              .map(([v, l, n]) => `<a href="#" onclick="event.preventDefault(); gurujiView('${v}')">${l} (${n})</a>`).join('')}</div></header>
          ${recent.length ? `<div class="gp-table" role="table">
            <div class="gp-tr gp-th" role="row"><span>Booking ID</span><span>Seeker Name</span><span>Service</span><span>Submitted On</span><span>Status</span><span>Action</span></div>
            ${recent.map(c => `<div class="gp-tr" role="row">
              <span class="gp-mono">${esc(c.orderId)}</span><span>${esc((c.devotee || {}).name || '—')}</span>
              <span>${esc((c.service && c.service.title) || 'Enquiry')}</span>
              <span>${esc(c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')}</span>
              <span>${pill(c)}</span>
              <span>${c.kind === 'enquiry' ? '' : `<a ${link(c)} class="gp-act${STAGE.pending(c) ? ' gp-act--fill' : ''}">${action(c)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>`}</span>
            </div>`).join('')}
          </div>` : '<p class="gm-empty">No open assignments.</p>'}
        </section>
      </main>`;
  }

  /** Unread chat from seekers, shown on the bell in the admin dashboard. */
  window.adminRefreshBell = async () => {
    const bell = $('#adm-bell');
    if (!bell) return;
    try {
      const data = await gurujiFetch('/api/staff/unread');
      const n = (data && data.unread) || 0;
      bell.querySelector('.adm-bell__count')?.remove();
      if (n) {
        const tag = document.createElement('span');
        tag.className = 'adm-bell__count';
        tag.textContent = n > 99 ? '99+' : String(n);
        bell.appendChild(tag);
      }
      bell.setAttribute('aria-label', n ? `${n} unread message${n === 1 ? '' : 's'} from seekers` : 'No unread messages');
    } catch (e) { /* the bell is a convenience; a failure here must not break the dashboard */ }
  };

  /** The chats live on the cases, so the bell opens the unread cases. */
  window.adminOpenMessages = () => { GURUJI.view = 'unread'; navigate('/guruji'); };

  /** Unread chat from Guruji, shown on the seeker's Track Status button. */
  let seekerBadgeAt = 0;
  window.refreshSeekerBadge = async () => {
    const tag = document.getElementById('seeker-unread');
    if (!tag) return;
    let token = '';
    try { token = localStorage.getItem('guruji_cust_token') || ''; } catch (e) { /* storage blocked */ }
    if (!token) { tag.classList.add('hidden'); return; }
    if (Date.now() - seekerBadgeAt < 30000) return;
    seekerBadgeAt = Date.now();
    try {
      const res = await fetch('/api/customer/unread', { headers: { 'x-customer-token': token } });
      if (!res.ok) { tag.classList.add('hidden'); return; }
      const data = await res.json();
      const n = (data && data.unread) || 0;
      tag.textContent = n > 99 ? '99+' : String(n);
      tag.classList.toggle('hidden', !n);
      // The count now rides the notification bell, which is what it is about.
      const bell = document.getElementById('header-messages-btn');
      if (bell) bell.setAttribute('aria-label',
        n ? `Messages — ${n} new message${n === 1 ? '' : 's'} from Guruji` : 'Messages from Guruji');
    } catch (e) { tag.classList.add('hidden'); }
  };

  window.gurujiColFilter = (key, value) => {
    if (!(key in GURUJI.cols)) return;
    GURUJI.cols[key] = value;
    renderCaseList();
    // Typing re-renders the list, so put the cursor back where it was.
    const back = document.querySelector(`.gm-colfilter input[oninput*="'${key}'"]`);
    if (back) { back.focus(); back.setSelectionRange(back.value.length, back.value.length); }
  };
  window.gurujiClearFilters = () => {
    GURUJI.cols = { seeker: '', service: '', booking: '', status: '' };
    renderCaseList();
  };
  window.gurujiSection = (v) => { GURUJI.section = v; renderCaseList(); };
  window.gurujiView = (v) => { GURUJI.view = v; renderCaseList(); };
  window.gurujiSort = (v) => { GURUJI.sort = v; renderCaseList(); };
  window.gurujiSearch = (v) => {
    GURUJI.q = v;
    clearTimeout(window.__gurujiSearchTimer);
    window.__gurujiSearchTimer = setTimeout(renderCaseList, 200);
  };

  /** A printable list of today's appointments, for the desk. */
  /** A line describing the uploaded reading, with a link to open it. */
  function readingFileLine(c) {
    const f = c && c.reportFile;
    if (!f) return '<p class="case-file case-file--none">No PDF uploaded yet.</p>';
    const kb = Math.max(1, Math.round((f.size || 0) / 1024));
    return `<p class="case-file"><i class="fa-regular fa-file-pdf" aria-hidden="true"></i>
      <a href="/api/bookings/${esc(c.orderId)}/report-file.pdf" target="_blank" rel="noopener">${esc(f.name || 'reading.pdf')}</a>
      <span>${kb} KB · uploaded ${esc(new Date(f.uploadedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }))} IST</span>
      <button type="button" class="case-file__send" data-send-reading="${esc(c.orderId)}"
              data-media-id="${esc(f.mediaId || '')}" data-file-name="${esc(f.name || 'reading.pdf')}"
              data-file-size="${Number(f.size) || 0}">Send to seeker</button></p>`;
  }

  /** Sends the chosen PDF up and refreshes the line under the drop zone. */
  async function uploadReadingPdf(file, orderId) {
    if (!file) return;
    if (file.type && file.type !== 'application/pdf') return toast('Please choose a PDF.', 'error');
    if (file.size > 5 * 1024 * 1024) return toast('The reading must be 5 MB or smaller.', 'error');
    toast('Uploading the reading…');
    try {
      const data = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).replace(/^data:[^,]+,/, ''));
        r.onerror = () => reject(new Error('That file could not be read.'));
        r.readAsDataURL(file);
      });
      const res = await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/report-file`, {
        method: 'POST', body: { name: file.name, data }
      });
      const slot = $('[data-reading-file]');
      if (slot) slot.innerHTML = readingFileLine({ orderId, reportFile: res.reportFile });
      toast('The reading is uploaded.', 'ok');
    } catch (err) {
      toast(err.message || 'The reading could not be uploaded.', 'error');
    }
  }

  window.gurujiDropReading = (ev, orderId) => {
    ev.preventDefault();
    ev.currentTarget.classList.remove('is-over');
    uploadReadingPdf((ev.dataTransfer.files || [])[0], orderId);
  };
  window.gurujiPickReading = (ev, orderId) => {
    uploadReadingPdf((ev.target.files || [])[0], orderId);
    ev.target.value = '';
  };

  window.gurujiPrintDay = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = GURUJI.list.filter(c => (c.slotStart || '').slice(0, 10) === today)
      .sort((a, b) => (a.slotStart || '').localeCompare(b.slotStart || ''));
    const w = window.open('', '_blank');
    if (!w) return toast('Your browser blocked the print window.', 'error');
    w.document.write(`<!doctype html><title>Day sheet</title>
      <style>body{font:14px/1.5 system-ui,sans-serif;padding:2rem;color:#1c1917}
      h1{font-size:1.3rem;margin:0 0 .25rem}p.sub{color:#78716c;margin:0 0 1.5rem}
      table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e7e5e4;padding:.5rem;text-align:left;vertical-align:top}
      th{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#78716c}</style>
      <h1>Guruji Palmistry — day sheet</h1>
      <p class="sub">${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })} · ${rows.length} appointment${rows.length === 1 ? '' : 's'}</p>
      <table><thead><tr><th>Time</th><th>Seeker</th><th>Service</th><th>Reference</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      ${rows.map(c => `<tr>
        <td>${c.slotStart ? new Date(c.slotStart).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—'}</td>
        <td>${esc((c.devotee || {}).name || '')}<br><small>${esc((c.devotee || {}).mobile || '')}</small></td>
        <td>${esc((c.service || {}).title || '')}</td>
        <td>${esc(c.orderId)}</td>
        <td>${esc((c.status || '').replace(/_/g, ' ').toLowerCase())}</td>
        <td></td></tr>`).join('') || '<tr><td colspan="6">Nothing booked today.</td></tr>'}
      </tbody></table>`);
    w.document.close();
    w.print();
  };
  window.renderGuruji = renderGuruji;

  window.gurujiLogin = async (e) => {
    e.preventDefault();
    const pin = e.target.elements.pin.value;
    try {
      const res = await fetchJson('/api/admin/verify', { method: 'POST', headers: { 'x-admin-pin': pin } });
      if (!res) throw new Error('The case area needs the server.');
      if (!['guruji', 'owner'].includes(res.role)) throw new Error('That PIN does not open the case area.');
      ADMIN.pin = pin; ADMIN.role = res.role;
      sessionStorage.setItem('guruji_admin', JSON.stringify({ pin, role: res.role, tab: ADMIN.tab }));
      renderGuruji($('[data-guruji-root]').dataset.case || '');
    } catch (err) { toast(err.message, 'error'); }
  };

  // Guruji's easy-use helpers (voice typing, bigger text, quick replies).
  // Fetched only when a Guruji page opens, so seekers never download them.
  // The version tag the page put on site.js (see stampAssets in server.js);
  // reused for the scripts loaded later so they are never stale either.
  const ASSET_V = (() => { try { return new URL(document.querySelector('script[src*="/site.js"]').src).search; } catch (e) { return ''; } })();
  let assistLoading = null;
  function loadAssist() {
    if (window.GurujiAssist) return Promise.resolve(window.GurujiAssist);
    if (!assistLoading) {
      assistLoading = new Promise((resolve) => {
        const el = document.createElement('script');
        el.src = '/guruji-assist.js' + ASSET_V;
        el.onload = () => resolve(window.GurujiAssist || null);
        el.onerror = () => { assistLoading = null; resolve(null); };
        document.head.appendChild(el);
      });
    }
    return assistLoading;
  }

  // The practitioner assessment checklist (from the assessment workbook).
  // Like the helpers above, fetched only when a Guruji case opens.
  let assessmentLoading = null;
  function loadAssessment() {
    if (window.PalmAssessment && window.PALM_ASSESSMENT) return Promise.resolve(window.PalmAssessment);
    if (!assessmentLoading) {
      const one = (src) => new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src; el.onload = resolve; el.onerror = reject;
        document.head.appendChild(el);
      });
      assessmentLoading = Promise.all([one('/palm-assessment-data.js' + ASSET_V), one('/palm-assessment.js' + ASSET_V)])
        .then(() => window.PalmAssessment || null)
        .catch(() => { assessmentLoading = null; return null; });
    }
    return assessmentLoading;
  }

  /** Switches the case page between the case itself and the assessment checklist. */
  window.caseTab = (tab) => {
    const page = document.querySelector('.case-page');
    if (!page) return;
    GURUJI.caseTab = tab;
    page.classList.toggle('show-assessment', tab === 'assessment');
    page.querySelectorAll('[data-case-tab]').forEach(b => {
      const on = b.dataset.caseTab === tab;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    if (tab === 'assessment') mountAssessment();
    else if (GURUJI.assessment) GURUJI.assessment.flush().catch(() => {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  async function mountAssessment() {
    const host = document.querySelector('[data-assessment-root]');
    const c = GURUJI.current;
    if (!host || !c || host.dataset.mounted === c.orderId) return;
    host.dataset.mounted = c.orderId;
    const PA = await loadAssessment();
    if (!PA) { host.dataset.mounted = ''; host.innerHTML = '<p class="sp-notice">The assessment checklist could not load. Check the connection and try again.</p>'; return; }
    GURUJI.assessment = PA.mount(host, c, async (payload) => {
      await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(c.orderId)}/assessment`, { method: 'PUT', body: payload });
      c.palmAssessment = Object.assign({}, payload, { updatedAt: new Date().toISOString() });
    });
  }

  /** Adds one line to the case's private notes and saves it straight away.
   *  Used by the photo viewer, so a note written on a palm also lands in
   *  "My notes" without Guruji copying it across. */
  async function addToCaseNotes(orderId, line) {
    const box = document.querySelector('.case-notes textarea[name="notes"]');
    const current = box ? box.value : ((GURUJI.current && GURUJI.current.gurujiNotes) || '');
    const next = current.trim() ? current.replace(/\s+$/, '') + '\n' + line : line;
    return writeCaseNotes(orderId, next, box);
  }
  /** Takes the last copy of a line back out of the notes (Undo in the viewer). */
  async function removeFromCaseNotes(orderId, line) {
    const box = document.querySelector('.case-notes textarea[name="notes"]');
    const current = box ? box.value : ((GURUJI.current && GURUJI.current.gurujiNotes) || '');
    const at = current.lastIndexOf(line);
    if (at < 0) return;
    const next = (current.slice(0, at) + current.slice(at + line.length)).replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
    return writeCaseNotes(orderId, next, box);
  }
  async function writeCaseNotes(orderId, text, box) {
    if (box) { box.value = text; box.scrollTop = box.scrollHeight; }
    if (GURUJI.current && GURUJI.current.orderId === orderId) GURUJI.current.gurujiNotes = text;
    notesState('Saving…');
    try {
      await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/notes`, { method: 'PUT', body: { notes: text } });
      notesState('Saved ✓', true);
      return true;
    } catch (err) {
      notesState('Not saved — ' + err.message);
      throw err;
    }
  }
  function notesState(text, ok) {
    const el = document.querySelector('[data-notes-state]');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-ok', Boolean(ok));
  }

  const countAssessment = (a) => Object.values((a && a.rows) || {}).filter(r => r && r.value).length;
  async function renderCase(orderId) {
    GURUJI.assessment = null;
    const root = $('[data-guruji-root]');
    let data;
    const assistReady = loadAssist();
    try { data = await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}`); } catch (err) {
      root.innerHTML = `<div class="sp-wrap py-8"><p class="sp-notice">${esc(err.message)}</p><a href="/guruji" data-link class="sp-btn-outline mt-4 inline-flex">All cases</a></div>`;
      return;
    }
    const c = data.case;
    GURUJI.current = c;
    const d = c.devotee || {};
    const r = c.report || {};
    const when = c.slotStart ? new Date(c.slotStart) : null;
    const field = (label, value) => value ? `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>` : '';
    const assist = await assistReady;
    root.innerHTML = `
      <div class="sp-wrap py-8 case-page">
        <nav class="case-nav" role="tablist" aria-label="Case sections">
          <a href="/guruji" data-link class="case-nav__home"><i class="fa-solid fa-hands-praying" aria-hidden="true"></i> Guruji <b>cases</b></a>
          <button type="button" role="tab" data-case-tab="case" class="is-active" aria-selected="true" onclick="caseTab('case')">
            <i class="fa-solid fa-user" aria-hidden="true"></i> Case · ${esc(d.name || c.orderId)}</button>
          <button type="button" role="tab" data-case-tab="assessment" aria-selected="false" onclick="caseTab('assessment')">
            <i class="fa-solid fa-table-list" aria-hidden="true"></i> Assessment checklist
            <em data-pa-badge>${c.palmAssessment ? countAssessment(c.palmAssessment) : 0}/${window.PALM_ASSESSMENT ? window.PALM_ASSESSMENT.fields.length : 277}</em></button>
          ${(() => {
            // Prev / Next walk the open cases in appointment order.
            const open = (GURUJI.list || []).filter(x => x.kind !== 'enquiry' && x.status !== 'COMPLETED')
              .sort((a, b) => (a.slotStart || a.createdAt || '').localeCompare(b.slotStart || b.createdAt || ''));
            const i = open.findIndex(x => x.orderId === c.orderId);
            if (i < 0 || open.length < 2) return '';
            const prev = open[i - 1], nxt = open[i + 1];
            return `<span class="case-nav__step">
              ${prev ? `<a href="/guruji/${esc(prev.orderId)}" data-link title="${esc((prev.devotee || {}).name || prev.orderId)}"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i> Prev</a>` : ''}
              <span>${i + 1} / ${open.length}</span>
              ${nxt ? `<a href="/guruji/${esc(nxt.orderId)}" data-link title="${esc((nxt.devotee || {}).name || nxt.orderId)}">Next <i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>` : ''}
            </span>`;
          })()}
        </nav>
        <div class="case-assessment" data-assessment-root><div class="sp-spinner" aria-hidden="true"></div></div>
        ${assist ? assist.toolbar() + assist.steps(c) : ''}
        <div class="session-head">
          <div>
            <a href="/guruji" data-link class="sp-link">← All cases</a>
            <h1 class="sp-h2">${esc(d.name)}</h1>
            <p class="sp-text">${esc((c.service && c.service.title) || '')} · <span class="font-mono">${esc(c.orderId)}</span> ·
              <span class="sp-pill sp-pill--${STATUS_TONE[c.status] || 'muted'}">${esc(c.status.replace(/_/g, ' ').toLowerCase())}</span></p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${c.assignedTo ? `<span class="sp-pill sp-pill--gold">with ${esc(c.assignedTo)}</span>` : `<button class="sp-btn-outline sp-btn-sm" onclick="claimCase('${esc(c.orderId)}')">Claim this case</button>`}
            <a href="/session/${esc(c.orderId)}" data-link class="gold-gradient-btn h-10 px-4 rounded-xl text-sm"><i class="fa-solid fa-video"></i> Join session</a>
            <button class="sp-btn-outline sp-btn-sm" onclick="endSession('${esc(c.orderId)}')">End session</button>
            <select class="sp-select sp-btn-sm" onchange="setCaseStatus('${esc(c.orderId)}', this.value)" aria-label="Move this case">
              <option value="">Move to…</option>
              ${['DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT', 'COMPLETED'].filter(st => st !== c.status)
                .map(st => `<option value="${st}">${esc(st.replace(/_/g, ' ').toLowerCase())}</option>`).join('')}
            </select>
            ${(d.mobile && waLink()) ? `<a class="sp-btn-outline sp-btn-sm" target="_blank" rel="noopener" href="https://wa.me/91${esc(String(d.mobile).replace(/\D/g, '').slice(-10))}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
            ${d.mobile ? `<a class="sp-btn-outline sp-btn-sm" href="tel:${esc(d.mobile)}"><i class="fa-solid fa-phone"></i> Call</a>` : ''}
          </div>
        </div>

        <div class="case-layout">
          <div class="case-main">
            <div class="sp-panel">
              <h2 class="sp-h3">Seeker</h2>
              <dl class="case-facts">
                ${field('Mobile', d.mobile)}${field('Email', d.email)}${field('Gotram', d.gotram)}
                ${field('Date of birth', [d.dob, d.tob].filter(Boolean).join(' at '))}
                ${field('Place of birth', d.pob)}${field('Co-ordinates', d.lat != null && d.lon != null ? `${d.lat}, ${d.lon}` : '')}
                ${field('Hand', c.handedness)}${field('Appointment', when ? when.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) : '')}
              </dl>
              ${d.questions ? `<p class="sp-text"><strong>Questions:</strong> ${esc(d.questions)}</p>` : ''}
            </div>

            <div class="sp-panel">
              <h2 class="sp-h3">Palm photos</h2>
              ${(c.photos || []).length
        ? `<ul class="palm-grid">${c.photos.map((p, i) => `
                     <li class="palm-thumb">
                       <button type="button" class="palm-thumb__btn" data-palm-open="${i}"
                               title="Open ${esc(p.name)}">
                         <img data-palm-src="${esc(p.id)}" alt="${esc(PALM_SLOTS[p.slot] || 'Palm photo')} sent by ${esc(c.devotee && c.devotee.name || 'the seeker')}">
                       </button>
                       <small>${esc(PALM_SLOTS[p.slot] || ('Photo ' + (i + 1)))} · ${Math.round((p.size || 0) / 1024)} KB</small>
                     </li>`).join('')}</ul>
                   <p class="text-xs text-ink-3 mt-2">Click a photo to open it full size, zoom and draw on it.</p>`
        : '<p class="sp-text">No photos uploaded yet.</p>'}
            </div>

            <div class="sp-panel" data-case-chart>
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h2 class="sp-h3">Kundali</h2>
                ${c.chart ? '' : `<button class="sp-btn-outline sp-btn-sm" onclick="castChart('${esc(c.orderId)}')">Cast the chart</button>`}
              </div>
              <div data-chart-slot>${c.chart ? '' : '<p class="sp-text">Not cast yet. Needs the date, time and co-ordinates of birth.</p>'}</div>
            </div>

            <div class="sp-panel case-notes">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h2 class="sp-h3">My notes</h2>
                <span class="text-xs text-ink-3">Only staff see these · notes written on a photo appear here too</span>
              </div>
              <form class="sp-form" onsubmit="saveCaseNotes(event, '${esc(c.orderId)}')">
                <label class="sp-field"><span class="sr-only">Private notes</span>
                  <textarea name="notes" rows="6" data-case-notes placeholder="What you noticed, what to follow up, what the seeker asked for.">${esc(c.gurujiNotes || '')}</textarea></label>
                <div class="flex flex-wrap items-center gap-3">
                  <button class="sp-btn-outline sp-btn-sm">Save notes</button>
                  <span class="case-notes__state" data-notes-state aria-live="polite">Saves by itself as you write</span>
                </div>
              </form>
            </div>

            <div class="sp-panel">
              <h2 class="sp-h3">The reading</h2>
              <form class="sp-form" data-report-form oninput="reportTyped(this, '${esc(c.orderId)}')" onsubmit="saveReport(event, '${esc(c.orderId)}')">
                <label class="sp-field"><span>Part 2 — the hands</span><textarea name="palm" rows="7">${esc(r.palm || '')}</textarea></label>
                <label class="sp-field"><span>Part 3 — where the chart and the hands agree</span><textarea name="correlation" rows="6">${esc(r.correlation || '')}</textarea></label>
                <label class="sp-field">
                  <span class="sp-field__row">Summary
                    <button type="button" class="sp-collect" data-collect-summary
                            title="Gather the first line of each point you have written above">Collect my points</button>
                  </span>
                  <textarea name="summary" rows="4" data-summary>${esc(r.summary || '')}</textarea>
                </label>
                <label class="sp-field"><span>Suggested practices</span><textarea name="remedies" rows="4">${esc(r.remedies || '')}</textarea></label>
                <div class="flex flex-wrap items-center gap-3">
                  <button class="gold-gradient-btn h-11 px-6 rounded-xl">Save draft</button>
                  <button type="button" class="sp-btn-outline" onclick="markReportReady('${esc(c.orderId)}')">Mark ready for the seeker</button>
                  <a class="sp-link" href="/api/bookings/${esc(c.orderId)}/report.pdf" target="_blank" rel="noopener">Preview the PDF ↗</a>
                  ${r.status === 'ready' ? `<span class="sp-pill sp-pill--green">sent ${esc((r.readyAt || '').slice(0, 10))}</span>` : r.version ? `<span class="sp-pill sp-pill--muted">draft v${r.version}</span>` : ''}
                </div>
                <p class="case-wordcount" data-wordcount>&nbsp;</p>
                <p class="text-xs text-ink-3">Leave a blank line between paragraphs. A draft saves itself a few seconds after you stop typing; the seeker sees nothing until you mark it ready.</p>
              </form>
            </div>

            <div class="sp-panel">
              <h2 class="sp-h3">Reading as a PDF</h2>
              <p class="text-xs text-ink-3">Drop a finished PDF here instead of typing it. The seeker can read or download it once you mark the reading sent.</p>
              <div class="dropzone" data-drop tabindex="0" role="button" aria-label="Upload the reading as a PDF"
                   ondragover="event.preventDefault(); this.classList.add('is-over')"
                   ondragleave="this.classList.remove('is-over')"
                   ondrop="gurujiDropReading(event, '${esc(c.orderId)}')"
                   onclick="this.querySelector('input').click()"
                   onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.querySelector('input').click(); }">
                <i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i>
                <span>Drop the PDF here, or click to choose one</span>
                <input type="file" accept="application/pdf" hidden onchange="gurujiPickReading(event, '${esc(c.orderId)}')">
              </div>
              <div data-reading-file>${readingFileLine(c)}</div>
            </div>
          </div>

          <aside class="case-side" data-case-chat>${chatMarkup('Chat with ' + (d.name || 'the devotee'))}</aside>
        </div>
      </div>`;

    if (c.chart) showChart(root.querySelector('[data-chart-slot]'), c.chart);
    startChat(root.querySelector('[data-case-chat]'), c.orderId, { pin: ADMIN.pin });

    // Stay on the checklist if the case is redrawn (claimed, moved, …) while it is open.
    if (GURUJI.caseTab === 'assessment' && GURUJI.caseTabFor === c.orderId) caseTab('assessment'); else GURUJI.caseTab = 'case';
    GURUJI.caseTabFor = c.orderId;
    loadAssessment(); // warm it up so the checklist opens instantly

    // My notes save themselves a moment after he stops typing.
    const notesBox = root.querySelector('[data-case-notes]');
    notesBox?.addEventListener('input', () => {
      notesState('Writing…');
      clearTimeout(notesBox.__t);
      notesBox.__t = setTimeout(() => writeCaseNotes(c.orderId, notesBox.value, null).catch(() => {}), 2000);
    });
    if (assist) {
      root.querySelectorAll('.case-page textarea').forEach((t) => { if (!t.hasAttribute('data-chat-input')) assist.attachMic(t); });
      assist.enhanceChat(root.querySelector('[data-case-chat]'));
    }

    // Clicking a palm photo opens it full size, zoomable and drawable.
    root.querySelectorAll('[data-palm-open]').forEach((btn) => {
      btn.addEventListener('click', () => palmViewer(c, Number(btn.getAttribute('data-palm-open'))));
    });
    // The Summary collector. Guruji presses it, reads what came back and
    // edits it; it is his text, never anything written for him.
    const reportForm = root.querySelector('[data-report-form]');
    reportForm?.querySelector('[data-collect-summary]')?.addEventListener('click', () => {
      const box = reportForm.querySelector('[data-summary]');
      const gathered = collectSummaryPoints(reportForm);
      if (!gathered) { toast('Write the sections above first, then collect.', 'error'); return; }
      if (box.value.trim() && !confirm('Replace what is in the Summary box with your collected points?')) return;
      box.value = gathered;
      box.focus();
      toast('Your points are in the Summary. Edit it before you mark it ready.', 'ok');
      reportForm.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Putting the reading PDF into the seeker's chat, where they can open or
    // download it. The file is already stored; this only sends a message.
    root.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('[data-send-reading]');
      if (!btn) return;
      // Read the file from the button, not from the case loaded when the page
      // opened: a PDF uploaded a moment ago is not in that copy.
      const f = {
        mediaId: btn.getAttribute('data-media-id'),
        name: btn.getAttribute('data-file-name') || 'reading.pdf',
        size: Number(btn.getAttribute('data-file-size')) || 0
      };
      if (!f.mediaId) { toast('Upload the reading PDF first.', 'error'); return; }
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending\u2026';
      try {
        await adminFetch(`/api/guruji/threads/${encodeURIComponent(c.orderId)}/messages`, {
          method: 'POST',
          body: {
            text: 'Your reading is ready. You can open or download it here.',
            attachment: { kind: 'pdf', mediaId: f.mediaId, name: f.name, size: f.size }
          }
        });
        toast('Sent. The reading is in the seeker\u2019s chat.', 'success');
        btn.textContent = 'Sent';
      } catch (err) {
        toast(err.message || 'It could not be sent.', 'error');
        btn.disabled = false; btn.textContent = label;
      }
    });

    root.querySelectorAll('img[data-palm-src]').forEach(async (im) => {
      try { im.src = await palmImageUrl(c.orderId, im.getAttribute('data-palm-src')); }
      catch (e) { im.closest('.palm-thumb')?.insertAdjacentHTML('beforeend',
        '<small class="text-rose-700">could not load</small>'); }
    });
  }

  // ---- Palm photo viewer ---------------------------------------------------
  // Opens one photo full size. Guruji can zoom and drag it around, draw on it
  // to mark what he is reading, and save the marked copy. Saving stores a new
  // private image against the case; sending it to the seeker is a second step.

  function palmViewer(caseData, index) {
    const photos = caseData.photos || [];
    let i = Math.max(0, Math.min(index, photos.length - 1));
    let zoom = 1, panX = 0, panY = 0;
    let drawing = false, pencil = false, strokes = [], current = null;
    let colour = '#e3342f', width = 4;
    let noting = false, notes = [];   // words written straight onto the photo
    let lastSaved = null;   // the marked copy stored by the Save button

    const wrap = document.createElement('div');
    wrap.className = 'palm-viewer';
    wrap.innerHTML = `
      <div class="palm-viewer__bar">
        <button type="button" data-pv="prev" title="Previous photo">&#8249;</button>
        <span class="palm-viewer__name" data-pv="name"></span>
        <button type="button" data-pv="next" title="Next photo">&#8250;</button>
        <span class="palm-viewer__sep"></span>
        <button type="button" data-pv="out" title="Zoom out">&minus;</button>
        <span class="palm-viewer__zoom" data-pv="pct">100%</span>
        <button type="button" data-pv="in" title="Zoom in">+</button>
        <button type="button" data-pv="fit" title="Fit to screen">Fit</button>
        <span class="palm-viewer__sep"></span>
        <button type="button" data-pv="pencil" title="Draw on the photo">&#9998; Mark</button>
        <button type="button" data-pv="note" title="Write a note on the photo">&#9997; Note</button>
        <button type="button" data-pv="book" title="Open the notebook beside the photo (B)">&#128211; Notebook</button>
        <span class="palm-viewer__tools" data-pv="tools" hidden>
          ${['#e3342f', '#f6ad26', '#1f9d55', '#2f6fed', '#1b1b1b'].map(c =>
            `<button type="button" class="palm-swatch" data-pv-colour="${c}" style="background:${c}" title="${c}"></button>`).join('')}
          <input type="range" min="2" max="14" value="4" data-pv="width" title="Pen thickness">
          <button type="button" data-pv="undo" title="Undo the last mark">Undo</button>
          <button type="button" data-pv="clear" title="Remove all marks">Clear</button>
          <button type="button" class="palm-viewer__save" data-pv="save">Save marked copy</button>
        <button type="button" class="palm-viewer__send" data-pv="send" disabled>Send to seeker</button>
        </span>
        <span class="palm-viewer__sep"></span>
        <button type="button" data-pv="close" title="Close">&times;</button>
      </div>
      <div class="palm-viewer__body">
        <div class="palm-viewer__stage" data-pv="stage">
          <div class="palm-viewer__canvasbox" data-pv="box">
            <img data-pv="img" alt="">
            <canvas data-pv="ink"></canvas>
          </div>
        </div>
        <aside class="palm-notebook" data-pv="bookpanel" hidden aria-label="Notebook">
          <div class="palm-notebook__head">
            <strong>&#128211; My notes</strong>
            <span class="palm-notebook__actions">
              <button type="button" data-pv="bookside" title="Move the notebook to the other side">&#8644; Side</button>
              <button type="button" data-pv="bookclose" title="Hide the notebook">&times;</button>
            </span>
          </div>
          <p class="palm-notebook__sub">Everything here is the case's <em>My notes</em> and saves by itself.</p>
          <button type="button" class="palm-notebook__label" data-pv="booklabel" title="Start a new line for this photo"></button>
          <textarea data-pv="booktext" spellcheck="true" placeholder="Write what you see while you look at the palm…"></textarea>
          <span class="palm-notebook__state" data-pv="bookstate" aria-live="polite"></span>
        </aside>
      </div>
      <p class="palm-viewer__hint" data-pv="hint"></p>`;
    document.body.appendChild(wrap);
    document.body.classList.add('palm-viewer-open');

    const el = (k) => wrap.querySelector(`[data-pv="${k}"]`);
    const img = el('img'), ink = el('ink'), box = el('box'), stage = el('stage');
    const hint = el('hint');

    // ---- Notebook beside the photo ------------------------------------------
    // The same text as "My notes" on the case page: what he writes here is
    // saved to the case, and the page's box is kept in step with it.
    const book = el('bookpanel'), bookText = el('booktext'), bookStateEl = el('bookstate');
    const mainNotes = () => document.querySelector('.case-notes textarea[name="notes"]');
    const BOOK_PREF = 'guruji_notebook';
    let bookPref = { open: window.innerWidth >= 900, side: 'right' };
    try { bookPref = Object.assign(bookPref, JSON.parse(localStorage.getItem(BOOK_PREF) || '{}')); } catch (e) { /* defaults */ }
    let bookTimer = null;
    const photoLabel = () => PALM_SLOTS[(photos[i] || {}).slot] || ('Photo ' + (i + 1));

    function saveBookPref() { try { localStorage.setItem(BOOK_PREF, JSON.stringify(bookPref)); } catch (e) { /* private mode */ } }
    function bookState(text, ok) { bookStateEl.textContent = text; bookStateEl.classList.toggle('is-ok', Boolean(ok)); }
    function currentNotes() {
      const box = mainNotes();
      return box ? box.value : ((GURUJI.current && GURUJI.current.gurujiNotes) || '');
    }
    function pullBook() {
      if (document.activeElement === bookText && bookTimer) return;   // he is mid-sentence
      bookText.value = currentNotes();
    }
    function paintBook() {
      book.hidden = !bookPref.open;
      wrap.classList.toggle('has-book', bookPref.open);
      wrap.classList.toggle('book-left', bookPref.side === 'left');
      el('book').classList.toggle('is-on', bookPref.open);
      el('booklabel').textContent = '+ ' + photoLabel() + ':';
    }
    function setBook(open) {
      bookPref.open = open; saveBookPref();
      if (open) pullBook();
      paintBook();
      if (open) bookText.focus();
    }
    /** Saves the notebook now; used before closing and before a photo note is added. */
    async function flushBook() {
      if (!bookTimer) return;
      clearTimeout(bookTimer); bookTimer = null;
      const box = mainNotes();
      if (box) clearTimeout(box.__t);
      bookState('Saving…');
      try {
        await writeCaseNotes(caseData.orderId, bookText.value, box);
        bookState('Saved ✓', true);
      } catch (err) {
        bookState('Not saved — ' + err.message);
      }
    }
    bookText.addEventListener('input', () => {
      const box = mainNotes();
      if (box) box.value = bookText.value;          // the page shows it at once
      if (GURUJI.current) GURUJI.current.gurujiNotes = bookText.value;
      bookState('Writing…');
      clearTimeout(bookTimer);
      bookTimer = setTimeout(flushBook, 1200);
    });
    function insertLabel() {
      const tag = '• ' + photoLabel() + ': ';
      const v = bookText.value;
      const needsBreak = v && !v.endsWith('\n');
      bookText.value = v + (needsBreak ? '\n' : '') + tag;
      bookText.focus();
      bookText.setSelectionRange(bookText.value.length, bookText.value.length);
      bookText.scrollTop = bookText.scrollHeight;
      bookText.dispatchEvent(new Event('input'));
    }
    if (window.GurujiAssist && typeof window.GurujiAssist.attachMic === 'function') {
      try { window.GurujiAssist.attachMic(bookText); } catch (e) { /* typing still works */ }
    }
    pullBook();
    paintBook();

    function apply() {
      box.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      el('pct').textContent = Math.round(zoom * 100) + '%';
    }
    function fit() { zoom = 1; panX = 0; panY = 0; apply(); }
    function setZoom(next, originX, originY) {
      const z = Math.max(0.3, Math.min(8, next));
      if (originX != null) {
        // Keep the point under the cursor still while the scale changes.
        const r = box.getBoundingClientRect();
        const dx = originX - (r.left + r.width / 2);
        const dy = originY - (r.top + r.height / 2);
        panX -= dx * (z / zoom - 1);
        panY -= dy * (z / zoom - 1);
      }
      zoom = z; apply();
    }

    function redraw() {
      const ctx = ink.getContext('2d');
      ctx.clearRect(0, 0, ink.width, ink.height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const st of strokes) {
        ctx.strokeStyle = st.colour; ctx.lineWidth = st.width;
        ctx.beginPath();
        st.points.forEach((pt, n) => n ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
        ctx.stroke();
      }
      // Notes sit on the same layer, so they are saved and sent with the marks.
      // The size follows the photo, so a note reads the same on any picture.
      const size = Math.max(16, Math.round(ink.width / 34));
      ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = 'top';
      for (const n of notes) {
        const lines = String(n.text).split('\n');
        const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const pad = Math.round(size * 0.4);
        const lineH = Math.round(size * 1.25);
        const boxH = lines.length * lineH + pad * 2;
        // A quiet backing panel, or the words vanish into the skin tones.
        ctx.fillStyle = 'rgba(20, 14, 12, .78)';
        ctx.beginPath();
        const r = Math.round(size * 0.3);
        const x = n.x, y = n.y, w = widest + pad * 2, h = boxH;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.fill();
        ctx.fillStyle = n.colour;
        lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad + i * lineH));
      }
    }

    function load() {
      const p = photos[i];
      if (!p) return;
      strokes = []; notes = [];
      el('name').textContent = `${PALM_SLOTS[p.slot] || 'Photo'} — ${p.name || ''}`;
      el('booklabel').textContent = '+ ' + (PALM_SLOTS[p.slot] || ('Photo ' + (i + 1))) + ':';
      img.alt = `${PALM_SLOTS[p.slot] || 'Palm photo'} sent by the seeker`;
      hint.textContent = 'Scroll to zoom, drag to move. M to draw, N for a note, B for the notebook, Esc to close.';
      img.onload = () => {
        // The ink layer matches the photo's own pixels, so a saved copy is
        // exactly what Guruji drew, at the photo's resolution.
        ink.width = img.naturalWidth; ink.height = img.naturalHeight;
        redraw(); fit();
      };
      palmImageUrl(caseData.orderId, p.id)
        .then((url) => { img.src = url; })
        .catch((err) => { hint.textContent = err.message; });
    }

    function pointOnPhoto(ev) {
      const r = img.getBoundingClientRect();
      return {
        x: (ev.clientX - r.left) / r.width * ink.width,
        y: (ev.clientY - r.top) / r.height * ink.height
      };
    }

    function setPencil(on) {
      pencil = on;
      if (on) noting = false;
      paintTools();
    }
    function setNoting(on) {
      noting = on;
      if (on) pencil = false;
      paintTools();
    }
    function paintTools() {
      el('tools').hidden = !(pencil || noting);
      el('pencil').classList.toggle('is-on', pencil);
      el('note').classList.toggle('is-on', noting);
      stage.classList.toggle('is-drawing', pencil);
      stage.classList.toggle('is-noting', noting);
      hint.textContent = noting
        ? 'Tap the photo where the note should sit, then type or speak it. It is also added to My notes. The colour swatches set its colour.'
        : pencil
          ? 'Draw on the photo to mark what you are reading. Hold Space to move it instead.'
          : 'Scroll to zoom, drag to move. M to draw, N for a note, B for the notebook, Esc or Back to close.';
    }

    // Pointer handling covers mouse, pen and touch in one path.
    let panning = false, last = null, spaceHeld = false;
    stage.addEventListener('pointerdown', (ev) => {
      if (noting && ev.isPrimary) {
        const where = pointOnPhoto(ev);
        const photoLabel = PALM_SLOTS[(photos[i] || {}).slot] || ('Photo ' + (i + 1));
        const ask = window.GurujiAssist
          ? window.GurujiAssist.askNote(wrap, `Note on the ${photoLabel.toLowerCase()}`)
          : Promise.resolve(prompt('Write the note to place here:'));
        ask.then((text) => {
          if (!text || !text.trim()) return;
          const clean = text.trim();
          const line = `• ${photoLabel}: ${clean}`;
          notes.push({ x: where.x, y: where.y, text: clean, colour, line });
          redraw();
          // The same words go into "My notes" on the case page (and the notebook).
          flushBook()
            .then(() => addToCaseNotes(caseData.orderId, line))
            .then(() => { pullBook(); toast('Note placed and added to My notes.', 'success'); })
            .catch((err) => toast('Placed on the photo, but My notes did not save: ' + err.message, 'error'));
        });
        return;
      }
      if (pencil && !spaceHeld && ev.isPrimary) {
        drawing = true;
        current = { colour, width, points: [pointOnPhoto(ev)] };
        strokes.push(current);
        stage.setPointerCapture(ev.pointerId);
      } else {
        panning = true; last = { x: ev.clientX, y: ev.clientY };
        stage.setPointerCapture(ev.pointerId);
      }
    });
    stage.addEventListener('pointermove', (ev) => {
      if (drawing && current) {
        current.points.push(pointOnPhoto(ev));
        redraw();
      } else if (panning && last) {
        panX += ev.clientX - last.x; panY += ev.clientY - last.y;
        last = { x: ev.clientX, y: ev.clientY };
        apply();
      }
    });
    const stop = () => { drawing = false; panning = false; current = null; last = null; };
    stage.addEventListener('pointerup', stop);
    stage.addEventListener('pointercancel', stop);
    stage.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      setZoom(zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12), ev.clientX, ev.clientY);
    }, { passive: false });

    wrap.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('[data-pv], [data-pv-colour]');
      if (!btn) return;
      const colourPick = btn.getAttribute('data-pv-colour');
      if (colourPick) {
        colour = colourPick;
        wrap.querySelectorAll('.palm-swatch').forEach(b => b.classList.toggle('is-on', b === btn));
        return;
      }
      switch (btn.getAttribute('data-pv')) {
        case 'close': close(); break;
        case 'in': setZoom(zoom * 1.25); break;
        case 'out': setZoom(zoom / 1.25); break;
        case 'fit': fit(); break;
        case 'prev': if (i > 0) { i--; load(); } break;
        case 'next': if (i < photos.length - 1) { i++; load(); } break;
        case 'pencil': setPencil(!pencil); break;
        case 'note': setNoting(!noting); break;
        case 'book': setBook(!bookPref.open); break;
        case 'bookclose': setBook(false); break;
        case 'bookside': bookPref.side = bookPref.side === 'left' ? 'right' : 'left'; saveBookPref(); paintBook(); break;
        case 'booklabel': insertLabel(); break;
        // Undo takes back the last thing added, whichever kind it was.
        case 'undo':
          if (notes.length && (!strokes.length || noting)) {
            const gone = notes.pop();
            if (gone && gone.line) flushBook().then(() => removeFromCaseNotes(caseData.orderId, gone.line)).then(pullBook).catch(() => {});
          } else strokes.pop();
          redraw(); break;
        case 'clear': strokes = []; notes = []; redraw(); break;
        case 'save': await saveMarked(btn); break;
        case 'send': await sendMarked(btn); break;
      }
    });
    wrap.querySelector('[data-pv="width"]').addEventListener('input', (ev) => { width = Number(ev.target.value); });

    async function saveMarked(btn) {
      if (!strokes.length && !notes.length) { toast('Draw or write something on the photo first.', 'error'); return; }
      const out = document.createElement('canvas');
      out.width = ink.width; out.height = ink.height;
      const ctx = out.getContext('2d');
      ctx.drawImage(img, 0, 0, out.width, out.height);
      ctx.drawImage(ink, 0, 0);
      const data = out.toDataURL('image/jpeg', 0.9).replace(/^data:[^,]+,/, '');
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const res = await adminFetch(`/api/guruji/cases/${encodeURIComponent(caseData.orderId)}/marked-photo`, {
          method: 'POST',
          body: { sourceId: photos[i].id, name: `marked-${photos[i].name || 'palm'}.jpg`, type: 'image/jpeg', data }
        });
        lastSaved = res && res.marked ? res.marked : null;
        el('send').disabled = !lastSaved;
        toast('Marked copy saved. Press "Send to seeker" to put it in the chat.', 'success');
      } catch (err) {
        toast(err.message || 'The marked copy could not be saved.', 'error');
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    }

    async function sendMarked(btn) {
      if (!lastSaved) { toast('Save the marked copy first.', 'error'); return; }
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending\u2026';
      try {
        await adminFetch(`/api/guruji/threads/${encodeURIComponent(caseData.orderId)}/messages`, {
          method: 'POST',
          body: {
            text: 'I have marked what I am reading on your palm.',
            attachment: { kind: 'image', mediaId: lastSaved.id, name: lastSaved.name, size: lastSaved.size }
          }
        });
        toast('Sent. It is in the seeker\u2019s chat now.', 'success');
        btn.textContent = 'Sent';
      } catch (err) {
        toast(err.message || 'It could not be sent.', 'error');
        btn.disabled = false; btn.textContent = label;
      }
    }

    function onKey(ev) {
      // Keys typed into a box (the note box, voice text) are words, not shortcuts.
      if (ev.target && ev.target.closest && ev.target.closest('input, textarea, select, [contenteditable]')) return;
      if (wrap.querySelector('.gj-note')) return;
      if (ev.key === 'Escape') close();
      else if (ev.key.toLowerCase() === 'm') setPencil(!pencil);
      else if (ev.key.toLowerCase() === 'n') setNoting(!noting);
      else if (ev.key.toLowerCase() === 'b') setBook(!bookPref.open);
      else if (ev.key === ' ') { spaceHeld = true; }
      else if (ev.key === 'ArrowLeft' && i > 0) { i--; load(); }
      else if (ev.key === 'ArrowRight' && i < photos.length - 1) { i++; load(); }
    }
    function onKeyUp(ev) { if (ev.key === ' ') spaceHeld = false; }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);

    // Pressing Back while a photo is open should shut the photo, not leave the
    // case. A history entry is pushed when it opens so Back has something of
    // its own to undo.
    let pushedHistory = false;
    try {
      history.pushState({ palmViewer: true }, '', location.href);
      pushedHistory = true;
    } catch (e) { /* the viewer still closes with Esc and the X */ }
    const onPop = () => { pushedHistory = false; close(); };
    window.addEventListener('popstate', onPop);

    function close() {
      flushBook();   // whatever is still waiting to save goes now
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('popstate', onPop);
      document.body.classList.remove('palm-viewer-open');
      wrap.remove();
      // Closing by Esc or the X leaves the pushed entry behind; take it back so
      // the next Back goes where it normally would.
      if (pushedHistory) { pushedHistory = false; history.back(); }
    }

    load();
    return { close };
  }

  /** Gathers the points Guruji has already written into the Summary box for
   *  him to edit. It writes nothing of its own: every line below is one he
   *  typed, copied verbatim. Nothing is sent to the seeker until he saves. */
  function collectSummaryPoints(form) {
    const take = (name) => (form.querySelector(`[name="${name}"]`)?.value || '').trim();
    const sections = [
      ['The hands', take('palm')],
      ['Chart and hands together', take('correlation')],
      ['Suggested practices', take('remedies')]
    ];
    const lines = [];
    for (const [heading, body] of sections) {
      if (!body) continue;
      // A "point" is a paragraph or a bulleted line; the opening sentence of
      // each is what carries it.
      const points = body.split(/\n\s*\n|\n(?=\s*[-*•\d]+[.)]?\s)/)
        .map(b => b.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean)
        .map(b => {
          const first = b.split(/(?<=[.!?])\s+/)[0].trim();
          return first.length > 4 ? first : b.slice(0, 160).trim();
        });
      if (!points.length) continue;
      lines.push(heading + ':');
      for (const pt of points.slice(0, 6)) lines.push('• ' + pt);
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  function showChart(slot, chart) {
    if (!slot || !window.GurujiChart) return;
    slot.innerHTML = GurujiChart.chartPanel(chart);
    GurujiChart.bindChartPanel(slot, chart);
  }

  window.claimCase = async (orderId) => {
    try { await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/claim`, { method: 'POST', body: {} }); renderCase(orderId); }
    catch (err) { toast(err.message, 'error'); }
  };
  window.castChart = async (orderId) => {
    try {
      const res = await gurujiFetch(`/api/bookings/${encodeURIComponent(orderId)}/chart`, { method: 'POST', body: {} });
      showChart($('[data-chart-slot]'), res.chart);
      toast('Chart cast.');
    } catch (err) { toast(err.message, 'error'); }
  };
  window.saveReport = async (e, orderId) => {
    e.preventDefault();
    const f = e.target.elements;
    try {
      await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/report`, {
        method: 'PUT', body: { palm: f.palm.value, correlation: f.correlation.value, summary: f.summary.value, remedies: f.remedies.value }
      });
      toast('Draft saved.');
    } catch (err) { toast(err.message, 'error'); }
  };
  window.saveCaseNotes = async (e, orderId) => {
    e.preventDefault();
    try {
      await writeCaseNotes(orderId, e.target.elements.notes.value, null);
      toast('Notes saved.');
    } catch (err) { toast(err.message, 'error'); }
  };

  window.setCaseStatus = async (orderId, status) => {
    if (!status) return;
    try {
      await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/status`, { method: 'POST', body: { status } });
      toast('Case moved.');
      renderCase(orderId);
    } catch (err) { toast(err.message, 'error'); }
  };

  /** Counts the words as Guruji writes, and saves the draft once typing stops. */
  window.reportTyped = (form, orderId) => {
    const f = form.elements;
    const text = ['palm', 'correlation', 'summary', 'remedies'].map(k => (f[k] ? f[k].value : '')).join(' ');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const el = form.querySelector('[data-wordcount]');
    if (el) el.textContent = words ? `${words} word${words === 1 ? '' : 's'} written` : '\u00a0';
    clearTimeout(form.__saveTimer);
    form.__saveTimer = setTimeout(async () => {
      try {
        await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/report`, {
          method: 'PUT', body: { palm: f.palm.value, correlation: f.correlation.value, summary: f.summary.value, remedies: f.remedies.value }
        });
        if (el) el.textContent = `${words} word${words === 1 ? '' : 's'} · draft saved`;
      } catch (err) { if (el) el.textContent = `${words} words · not saved (${err.message})`; }
    }, 4000);
  };

  /**
   * Confirms a case is finished: a tick draws itself, then the panel refreshes.
   * Resolves when the animation is done so the re-render does not cut it short.
   * Anyone who has asked for less motion simply gets the message.
   */
  function completedBurst(title, line) {
    const quiet = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quiet) { toast(`${title} — ${line}`); return Promise.resolve(); }
    const el = document.createElement('div');
    el.className = 'done-burst';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="done-burst__card">
      <svg class="done-burst__tick" viewBox="0 0 52 52" aria-hidden="true">
        <circle class="done-burst__ring" cx="26" cy="26" r="23" />
        <path class="done-burst__check" d="M15 27.5l7.5 7.5L37 20" />
      </svg>
      <strong>${esc(title)}</strong>
      <span>${esc(line)}</span>
    </div>`;
    document.body.appendChild(el);
    return new Promise((resolve) => setTimeout(() => {
      el.classList.add('is-leaving');
      setTimeout(() => { el.remove(); resolve(); }, 260);
    }, 1250));
  }

  window.markReportReady = async (orderId) => {
    if (!confirm('Mark this reading ready? The seeker will be able to download it.')) return;
    try {
      await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/ready`, { method: 'POST' });
      await completedBurst('Completed', 'The seeker can now download the reading.');
      renderCase(orderId);
    }
    catch (err) { toast(err.message, 'error'); }
  };
  window.endSession = async (orderId) => {
    if (!confirm('End this session?')) return;
    try { await gurujiFetch(`/api/bookings/${encodeURIComponent(orderId)}/session/end`, { method: 'POST' }); toast('Session ended.'); renderCase(orderId); }
    catch (err) { toast(err.message, 'error'); }
  };

  // -------------------------------------------------------------------------
  // Start-up
  // -------------------------------------------------------------------------
  async function refreshContent() {
    const [content, health] = await Promise.all([
      fetchJson('/api/content').catch(() => null),
      fetchJson('/api/health').catch(() => null)
    ]);
    if (health) {
      SITE.payments = health.payments; SITE.paymentEnv = health.paymentEnv; SITE.serverOnline = true;
      SITE.staffGoogle = health.staffGoogleSignIn || null;
      if (health.testOneRupee) {
        window.TEST_ONE_RUPEE = true;
        if (typeof applyOneRupeeUI === 'function') applyOneRupeeUI();
      }
    }
    refreshPaymentPage();
    // The staff sign-in panels are drawn before the server answers; redraw them
    // once we know whether Google sign-in is configured at all.
    const path = location.pathname.replace(/\/$/, '');
    if (SITE.staffGoogle && !ADMIN.pin && !ADMIN.token) {
      if (path === '/admin') renderAdmin();
      else if (path.startsWith('/guruji') && typeof renderGuruji === 'function') renderGuruji();
    }
    if (content && content.content) {
      SITE.content = Object.assign({}, window.GURUJI_CONTENT, content.content);
      if (content.content.testOneRupee) {
        window.TEST_ONE_RUPEE = true;
        if (typeof applyOneRupeeUI === 'function') applyOneRupeeUI();
      }
      applySettings();
      // Re-render the current content page with the latest edits
      const cur = window.state && state.currentPage;
      if (cur && (RENDER[cur] || cur === 'home') && cur !== 'admin') navigate(location.href, { fromRouter: true, keepScroll: true });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    routerReady = true;
    applySettings();
    initGotramPickers();
    initPlacePicker();
    navigate(location.href, { replace: true, fromRouter: true });
    refreshContent();
    // The bell is a notification, so it has to notice on its own rather than
    // waiting for the next page change. The call itself is throttled.
    setInterval(() => { if (!document.hidden) refreshSeekerBadge(); }, 30000);
    // keep the payment page in sync whenever it is shown
    const pay = document.getElementById('page-book-payment');
    if (pay) new MutationObserver(() => { if (!pay.classList.contains('hidden')) refreshPaymentPage(); }).observe(pay, { attributes: true, attributeFilter: ['class'] });
    $('#site-search-input')?.addEventListener('input', (e) => { $('#site-search-results').innerHTML = resultsHtml(e.target.value.trim(), runSearch(e.target.value.trim())); });
    $('#site-search-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) navigate('/search?q=' + encodeURIComponent(q)); } });
    $('#site-search')?.addEventListener('click', (e) => { if (e.target.id === 'site-search') closeSiteSearch(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSiteSearch(); });
  });
})();
