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
  const priceText = (p) => (window.TEST_ONE_RUPEE && Number(p) > 0 ? '₹1' : Number(p) > 0 ? '₹' + Number(p).toLocaleString('en-IN') : 'Price on request');
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

  const serviceCard = (s, { compact = false } = {}) => `
    <article class="sp-card sp-card--service">
      <a href="/services/${esc(s.slug)}" data-link class="sp-card__media" tabindex="-1" aria-hidden="true">
        <img src="${esc(imageFor(s))}" alt="" loading="lazy">
        ${s.core ? '<span class="sp-badge">Core consultation</span>' : ''}
      </a>
      <div class="sp-card__body">
        <p class="sp-card__cat">${esc((category(s.category) || {}).title || '')}</p>
        <h3 class="sp-card__title"><a href="/services/${esc(s.slug)}" data-link>${esc(s.title)}</a></h3>
        ${compact ? '' : `<p class="sp-card__text">${esc(s.short)}</p>`}
        <div class="sp-card__foot">
          <span class="sp-price ${Number(s.price) > 0 ? '' : 'sp-price--muted'}">${priceText(s.price)}${s.duration ? `<small> · ${esc(s.duration)}</small>` : ''}</span>
          <a href="/services/${esc(s.slug)}" data-link class="sp-link">Details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
        </div>
      </div>
    </article>`;

  const courseCard = (c) => {
    const status = { open: ['Enrolling now', 'sp-pill--green'], enquire: ['Register interest', 'sp-pill--gold'], upcoming: ['Coming soon', 'sp-pill--muted'] }[c.status] || ['', ''];
    const track = (C().courseTracks || []).find(t => t.id === c.track) || {};
    return `
    <article class="sp-card sp-card--course">
      <a href="/courses/${esc(c.slug)}" data-link class="sp-card__media sp-card__media--short" tabindex="-1" aria-hidden="true"><img src="${esc(c.image || track.image || '/assets/svc/guidance.svg')}" alt="" loading="lazy"></a>
      <div class="sp-card__body">
        <div class="flex items-center gap-2 flex-wrap"><span class="sp-pill ${status[1]}">${status[0]}</span><span class="sp-card__cat">${esc(c.mode)}</span></div>
        <h3 class="sp-card__title"><a href="/courses/${esc(c.slug)}" data-link>${esc(c.title)}</a></h3>
        <p class="sp-card__text">${esc(c.overview)}</p>
        <div class="sp-card__foot">
          <span class="sp-price ${Number(c.price) > 0 ? '' : 'sp-price--muted'}">${Number(c.price) > 0 ? priceText(c.price) : 'Fee on enquiry'}</span>
          <a href="/courses/${esc(c.slug)}" data-link class="sp-link">Course details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
        </div>
      </div>
    </article>`;
  };

  const articleCard = (a) => {
    const cat = (C().resourceCategories || []).find(x => x.id === a.category) || {};
    return `
    <article class="sp-card sp-card--article">
      <a href="/resources/${esc(a.slug)}" data-link class="sp-card__media sp-card__media--short" tabindex="-1" aria-hidden="true"><img src="${esc(a.image || cat.image || '/assets/svc/guidance.svg')}" alt="" loading="lazy">
        ${a.videoUrl ? '<span class="sp-badge"><i class="fa-solid fa-play"></i> Video</span>' : a.pdfUrl ? '<span class="sp-badge"><i class="fa-regular fa-file-pdf"></i> PDF</span>' : ''}</a>
      <div class="sp-card__body">
        <p class="sp-card__cat">${esc(cat.title || '')} · ${esc(formatDate(a.date))}</p>
        <h3 class="sp-card__title"><a href="/resources/${esc(a.slug)}" data-link>${esc(a.title)}</a></h3>
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
          <a href="/services/astro-palmistry-correlation" data-link class="gold-gradient-btn h-12 px-6 rounded-full">Book a Consultation</a>
          <a href="/contact" data-link class="h-12 px-6 rounded-full border border-cream/40 text-cream hover:border-gold hover:text-gold flex items-center justify-center font-medium">Send an Enquiry</a>
        </div>
      </div>
    </section>`;

  const reikiNotice = `<div class="sp-notice"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><p><strong>Please note:</strong> Reiki is a complementary wellness practice for relaxation and subjective well-being. It does not diagnose or treat any medical condition and is not a substitute for medical advice or treatment. If you are unwell, please consult a qualified doctor.</p></div>`;

  // -------------------------------------------------------------------------
  // Page renderers — each returns false when the item does not exist
  // -------------------------------------------------------------------------
  const RENDER = {};

  RENDER.about = () => {
    const a = C().about;
    const sec = (id) => (a.sections || []).find(s => s.id === id);
    const block = (s) => !s ? '' : `
      <div class="sp-panel">
        <h2 class="sp-h3">${esc(s.title)}</h2>
        ${s.body ? `<p class="sp-text">${esc(s.body)}</p>` : ''}
        ${s.list ? `<ul class="sp-ticks">${s.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      </div>`;
    const others = (a.sections || []).filter(s => !['journey', 'approach'].includes(s.id));
    return `
      ${hero({ eyebrow: 'About Guruji', title: a.name, sub: a.intro, crumbs: crumbs([['Home', '/'], ['About Guruji']]) })}
      <section class="sp-section">
        <div class="sp-wrap grid gap-10 lg:grid-cols-[340px_1fr] items-start">
          <div class="space-y-4">
            <figure class="sp-portrait">
              <img src="${esc(a.portrait)}" alt="Portrait of ${esc(a.name)}">
              <figcaption><strong>${esc(a.name)}</strong>${a.alsoKnownAs ? `<span>Also known as ${esc(a.alsoKnownAs)}</span>` : ''}${a.role ? `<span>${esc(a.role)}</span>` : ''}</figcaption>
            </figure>
            <div class="sp-panel bg-amber-50/70 border border-amber-300 text-center space-y-2 p-4 rounded-2xl shadow-xs">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
                <i class="fa-solid fa-stamp text-amber-700"></i> Govt. of Telangana Registered
              </div>
              <div class="font-mono text-xs font-bold text-night-2">Reg: SEA/MED/ALO/NR/1439866/2026</div>
              <p class="text-[11px] text-ink-3">Labour Dept · Telangana Shops &amp; Establishments Act, 1988</p>
              <button type="button" onclick="openCertificateModal()" class="gold-gradient-btn text-xs px-4 py-2 rounded-xl w-full flex items-center justify-center gap-2 font-semibold shadow-xs">
                <i class="fa-regular fa-id-card"></i> View Certificate Proof
              </button>
            </div>
          </div>
          <div class="space-y-6">
            ${block(sec('journey'))}
            ${sec('approach') ? `<blockquote class="sp-quote"><p>${esc(sec('approach').body)}</p><cite>— ${esc(sec('approach').title)}</cite></blockquote>` : ''}
            ${(a.highlights || []).length ? `<ul class="sp-chips">${a.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
      </section>
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap grid gap-5 md:grid-cols-2">${others.map(block).join('')}</div>
      </section>
      ${ctaBand('Speak with Guruji', 'Begin with a palm analysis, a Kundali analysis, or the combined Astro-Palmistry Correlation.')}`;
  };

  RENDER.services = () => {
    const cats = C().serviceCategories || [];
    const core = (C().services || []).filter(s => s.core && s.published !== false);
    return `
      ${hero({ eyebrow: 'Services', title: 'Guidance, healing and devotion', sub: 'Palmistry, astrology, japa, puja, pitru rituals, muhurta, Reiki and spiritual guidance — choose a service to see what it involves, what we need from you, and how to book.', crumbs: crumbs([['Home', '/'], ['Services']]) })}
      <section class="sp-section">
        <div class="sp-wrap">
          ${sectionHead('Three core consultations', 'Start here', 'Most seekers begin with one of these. The Astro-Palmistry Correlation brings both sciences together.')}
          <div class="grid gap-6 md:grid-cols-3">${core.map(s => serviceCard(s)).join('')}</div>
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
              <span class="sp-cat__media"><img src="${esc(c.image)}" alt="" loading="lazy"></span>
              <span class="sp-cat__body">
                <span class="sp-cat__title">${esc(c.title)}</span>
                <span class="sp-cat__text">${esc(c.tagline)}</span>
                <span class="sp-cat__list">${esc(list)}</span>
              </span>
            </a>`;
          }).join('')}</div>
        </div>
      </section>
      <section class="sp-section">
        <div class="sp-wrap">
          ${sectionHead('', 'Every service at a glance')}
          <div class="grid gap-8 md:grid-cols-2">${cats.map(c => `
            <div class="sp-panel">
              <h3 class="sp-h3 flex items-center gap-2"><i class="fa-solid ${esc(c.icon)} text-gold-deep" aria-hidden="true"></i>${esc(c.title)}</h3>
              <ul class="sp-list">${servicesIn(c.id).map(s => `<li><a href="/services/${esc(s.slug)}" data-link>${esc(s.title)}</a><span>${priceText(s.price)}</span></li>`).join('')}</ul>
            </div>`).join('')}</div>
        </div>
      </section>
      ${ctaBand()}`;
  };

  RENDER['service-category'] = ({ cat }) => {
    const c = category(cat);
    if (!c) return false;
    if (c.link && c.link !== `/services/category/${cat}`) { setTimeout(() => navigate(c.link, { replace: true }), 0); return ''; }
    const list = servicesIn(cat);
    return `
      ${hero({ eyebrow: 'Services', title: c.title, sub: c.intro, image: c.image, crumbs: crumbs([['Home', '/'], ['Services', '/services'], [c.title]]) })}
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
              <img src="${esc(imageFor(s))}" alt="" class="sp-book__img">
              <div class="sp-book__body">
                <div class="sp-book__price">${priceText(s.price)}</div>
                ${s.duration ? `<p class="sp-book__meta"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(s.duration)}</p>` : ''}
                <p class="sp-book__meta"><i class="fa-solid fa-video" aria-hidden="true"></i> ${s.category === 'puja-rituals' || s.category === 'pitru' || s.category === 'japa-mantra' ? 'Performed on your behalf, with Sankalpa in your name' : 'Online (phone / video) or in person'}</p>
                <button type="button" class="gold-gradient-btn w-full h-12 rounded-xl mt-4" onclick="bookService('${esc(s.slug)}')">${bookLabel(s)}</button>
                ${Number(s.price) > 0 ? '' : '<p class="text-xs text-ink-3 mt-2">Send an enquiry — we will confirm the details and price before anything is booked.</p>'}
                ${waLink() ? `<a class="sp-wa-link" href="${waLink('Namaste, I would like to know more about ' + s.title)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Ask on WhatsApp</a>` : ''}
              </div>
            </aside>
          </div>
        </div>
      </section>
      <section class="sp-section">
        <div class="sp-wrap grid gap-6 lg:grid-cols-3">
          <div class="sp-panel"><h2 class="sp-h3">${s.core ? 'What it covers' : 'Benefits &amp; purpose'}</h2><ul class="sp-ticks">${(s.benefits || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>
          <div class="sp-panel"><h2 class="sp-h3">How it works</h2><ol class="sp-steps">${(c.howItWorks || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
          <div class="sp-panel"><h2 class="sp-h3">Information required</h2><ul class="sp-ticks">${required.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        </div>
        ${s.deliverables ? `<div class="sp-wrap mt-6"><div class="sp-panel sp-panel--gold"><h2 class="sp-h3">What you receive</h2><ul class="sp-ticks sp-ticks--cols">${s.deliverables.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div></div>` : ''}
      </section>
      ${parts}
      ${related.length ? `<section class="sp-section"><div class="sp-wrap">${sectionHead('', 'Related services')}<div class="grid gap-6 md:grid-cols-3">${related.map(r => serviceCard(r, { compact: true })).join('')}</div></div></section>` : ''}
      ${ctaBand()}`;
  };

  RENDER.reiki = () => {
    const sessions = servicesIn('reiki');
    const faq = (C().faqCategories || []).find(f => f.id === 'reiki');
    const reikiCourses = (C().courses || []).filter(c => c.track === 'reiki' && c.published !== false);
    return `
      ${hero({ eyebrow: 'Reiki Healing', title: 'Reiki — rest, balance and relaxation', sub: 'A gentle, hands-on or distance practice that many people find deeply relaxing. Offered as a complementary wellness practice alongside — never instead of — medical care.', image: '/assets/svc/reiki.svg', crumbs: crumbs([['Home', '/'], ['Reiki Healing']]),
        extra: `<div class="flex flex-col sm:flex-row gap-3 mt-6"><button type="button" onclick="bookService('reiki-individual-session')" class="gold-gradient-btn h-12 px-6 rounded-full">Book a Reiki Session</button><a href="#reiki-sessions" class="h-12 px-6 rounded-full border border-cream/40 text-cream hover:border-gold hover:text-gold flex items-center justify-center font-medium">See sessions &amp; packages</a></div>` })}
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
          ${sectionHead('Sessions & packages', 'Reiki services')}
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${sessions.map(s => `
            <article class="sp-panel sp-session">
              <h3 class="sp-h3"><a href="/services/${esc(s.slug)}" data-link>${esc(s.title)}</a></h3>
              <p class="sp-text">${esc(s.short)}</p>
              <div class="sp-session__foot">
                <span class="sp-price ${Number(s.price) > 0 ? '' : 'sp-price--muted'}">${priceText(s.price)}${s.duration ? `<small> · ${esc(s.duration)}</small>` : ''}</span>
                <button type="button" class="sp-btn-outline" onclick="bookService('${esc(s.slug)}')">${bookLabel(s)}</button>
              </div>
            </article>`).join('')}</div>
        </div>
      </section>
      ${reikiCourses.length ? `<section class="sp-section sp-section--tint"><div class="sp-wrap">${sectionHead('Learn Reiki', 'Reiki courses', ((C().courseTracks || []).find(t => t.id === 'reiki') || {}).note)}<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">${reikiCourses.map(courseCard).join('')}</div></div></section>` : ''}
      ${faq ? `<section class="sp-section"><div class="sp-wrap sp-narrow">${sectionHead('Questions', 'Reiki FAQs')}${faqList(faq.items, 'reiki-faq')}</div></section>` : ''}
      ${ctaBand('Book a Reiki session', 'Choose a session above, or send an enquiry and we will help you choose.')}`;
  };

  RENDER.courses = () => {
    const tracks = C().courseTracks || [];
    return `
      ${hero({ eyebrow: 'Courses & Training', title: 'Learn from Guruji', sub: 'Structured courses in palmistry and Reiki, with more on Vedic astrology, mantra and Sanatana Dharma to come.', image: '/assets/svc/course-palmistry.webp', crumbs: crumbs([['Home', '/'], ['Courses']]) })}
      ${tracks.map((t, i) => {
        const list = (C().courses || []).filter(c => c.track === t.id && c.published !== false);
        if (!list.length) return '';
        return `<section class="sp-section ${i % 2 ? 'sp-section--tint' : ''}" id="${esc(t.id)}">
          <div class="sp-wrap">
            ${sectionHead('', t.title, t.note)}
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${list.map(courseCard).join('')}</div>
          </div>
        </section>`;
      }).join('')}
      ${(() => { const f = (C().faqCategories || []).find(x => x.id === 'courses'); return f ? `<section class="sp-section"><div class="sp-wrap sp-narrow">${sectionHead('Questions', 'Courses FAQs')}${faqList(f.items, 'course-faq')}</div></section>` : ''; })()}
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
              <div class="sp-book__price">${Number(c.price) > 0 ? priceText(c.price) : 'Fee on enquiry'}</div>
              <dl class="sp-facts">
                <div><dt>Duration</dt><dd>${esc(c.duration)}</dd></div>
                <div><dt>Mode</dt><dd>${esc(c.mode)}</dd></div>
                <div><dt>Instructor</dt><dd>${esc(c.instructor)}</dd></div>
                <div><dt>Certificate</dt><dd>${esc(c.certificate || '—')}</dd></div>
              </dl>
              <a href="/contact?kind=course&service=${encodeURIComponent(c.slug)}" data-link class="gold-gradient-btn w-full h-12 rounded-xl mt-4">${cta}</a>
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
    return `
      ${hero({ eyebrow: 'Resources', title: 'Knowledge Hub', sub: 'Articles and guides on palmistry, astrology, Reiki, mantras, rituals, meditation and Sanatana Dharma.', crumbs: crumbs([['Home', '/'], ['Resources']]) })}
      <section class="sp-section">
        <div class="sp-wrap">
          <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">${cats.map(c => `
            <a href="/resources?category=${esc(c.id)}" data-link class="sp-rescat ${cat === c.id ? 'is-active' : ''}">
              <img src="${esc(c.image)}" alt="" loading="lazy"><span>${esc(c.title)}</span>
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
          <h2 class="sp-h3 mt-10 mb-4">${filtersActive ? `${list.length} result${list.length === 1 ? '' : 's'}` : 'Recent posts'}${filtersActive ? ' · <a href="/resources" data-link class="sp-link text-sm">Clear filters</a>' : ''}</h2>
          ${list.length ? `<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${list.map(articleCard).join('')}</div>` : '<p class="sp-text">No articles match yet. Try another word or category.</p>'}
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
          ${a.image ? `<img src="${esc(a.image)}" alt="" class="sp-article__img">` : ''}
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
    return `
      ${hero({ title: p.title, sub: p.updated ? `Last updated ${formatDate(p.updated)}` : '', crumbs: crumbs([['Home', '/'], [p.title]]) })}
      <section class="sp-section"><div class="sp-wrap sp-narrow sp-prose">${p.sections.map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(t)}</p>`).join('')}</div></section>`;
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
                <li><i class="fa-solid fa-location-dot text-amber-600" aria-hidden="true"></i><div><strong>Heritage Centre:</strong><br><a href="${esc(st.mapUrl || 'https://maps.app.goo.gl/vGo2MHhgGJyLLxrr9')}" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-maroon">2-4-123/E/84/A, Swaroop Nagar, Srinivasa Colony, Uppal, Hyderabad, Telangana - 500039</a><div class="mt-1"><a href="${esc(st.mapUrl || 'https://maps.app.goo.gl/vGo2MHhgGJyLLxrr9')}" target="_blank" rel="noopener" class="text-xs font-semibold text-maroon hover:underline inline-flex items-center gap-1"><i class="fa-solid fa-diamond-turn-right text-2xs"></i> Open Google Maps directions →</a></div></div></li>
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
              <h2 class="sp-h3">Pay online instead</h2>
              <p class="sp-text">These consultations can be booked and paid straight away:</p>
              <ul class="sp-list">${(C().services || []).filter(s => s.core && s.published !== false).map(s => `<li><a href="/services/${esc(s.slug)}" data-link>${esc(s.title)}</a><span>${priceText(s.price)}</span></li>`).join('')}</ul>
            </div>
            ${st.mapEmbedUrl && /^https:\/\/(www\.)?google\.com\/maps\/embed/.test(st.mapEmbedUrl) ? `<div class="sp-map"><iframe src="${esc(st.mapEmbedUrl)}" title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ''}
          </aside>
        </div>
      </section>`;
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
          <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">${(C().pillars || []).map((p, i) => `
            <a href="${esc(p.link)}" data-link class="sp-pillar sp-pillar--${i}">
              <i class="fa-solid ${esc(p.icon)}" aria-hidden="true"></i>
              <span class="sp-pillar__title">${esc(p.title)}</span>
              <span class="sp-pillar__text">${esc(p.text)}</span>
            </a>`).join('')}</div>
        </div>
      </section>
      <section class="sp-section sp-section--tint">
        <div class="sp-wrap">
          ${sectionHead('Featured services', 'Three core consultations', 'Detailed Palm Analysis, Comprehensive Kundali Analysis — and the Astro-Palmistry Correlation that brings them together.')}
          <div class="grid gap-6 md:grid-cols-3">${core.map(s => serviceCard(s)).join('')}</div>
          <div class="text-center mt-8"><a href="/services" data-link class="sp-btn-outline">Explore all services</a></div>
        </div>
      </section>
      <section class="sp-section">
        <div class="sp-wrap grid gap-10 lg:grid-cols-2 items-center">
          <img src="/assets/svc/reiki.svg" alt="" class="sp-feature-img" loading="lazy">
          <div>
            <p class="sp-eyebrow sp-eyebrow--maroon">Healing</p>
            <h2 class="sp-h2">Reiki Healing</h2>
            <p class="sp-text mt-3">Individual, extended and distance Reiki sessions, chakra awareness and Reiki meditation — offered for relaxation and a sense of balance, as a complementary practice alongside medical care.</p>
            <div class="flex flex-wrap gap-3 mt-6"><a href="/reiki-healing" data-link class="gold-gradient-btn h-12 px-6 rounded-full">Explore Reiki</a><button type="button" onclick="bookService('reiki-individual-session')" class="sp-btn-outline">Book a session</button></div>
          </div>
        </div>
      </section>
      ${featuredCourses.length ? `<section class="sp-section sp-section--tint"><div class="sp-wrap">${sectionHead('Learning', 'Popular courses')}<div class="grid gap-6 md:grid-cols-3">${featuredCourses.map(courseCard).join('')}</div><div class="text-center mt-8"><a href="/courses" data-link class="sp-btn-outline">All courses</a></div></div></section>` : ''}
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
    [/^\/(privacy-policy|terms|cancellation-refund-policy)$/, 'policy', ['policy']],
    [/^\/palmistry$/, 'palmistry'],
    [/^\/mantras$/, 'mantras'],
    [/^\/book\/consultation$/, 'book-consultation'],
    [/^\/book\/pooja$/, 'book-pooja'],
    [/^\/book\/(?:details|payment)$/, 'book-consultation'],
    [/^\/book\/upload$/, 'book-status'],
    [/^\/track$/, 'book-status'],
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
    faqs: '/faqs', contact: '/contact', palmistry: '/palmistry', mantras: '/mantras', 'book-consultation': '/book/consultation',
    'book-pooja': '/book/pooja', 'book-status': '/track', admin: '/admin', search: '/search', guruji: '/guruji',
    'book-payment': '/book/payment', 'book-upload': '/book/upload'
  };
  const ALIASES = { 'resource-reiki': ['reiki', {}], 'resource-articles': ['resources', {}], 'resource-astrology': ['resources', { query: { category: 'astrology' } }] };
  const NAV_FOR = {
    home: 'home', about: 'about', services: 'services', 'service-category': 'services', 'service-detail': 'services', reiki: 'reiki',
    courses: 'courses', 'course-detail': 'courses', resources: 'resources', article: 'resources', mantras: 'resources', 'mantra-detail': 'resources',
    palmistry: 'resources', faqs: 'faqs', contact: 'contact', 'book-consultation': 'services', 'book-pooja': 'services'
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
    if (pageId !== 'guruji' && pageId !== 'book-status') stopChat();
    if (pageId === 'guruji') renderGuruji(params.slug || '');
    if (pageId === 'session') setTimeout(() => openSession(params.slug), 0);
    if (pageId === 'learn') setTimeout(() => openCourse(params.slug), 0);
    if (pageId === 'course-detail') setTimeout(() => loadCourseOutline(params.slug), 0);
    if (pageId === 'home') renderHome();
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
  function updateSeo(pageId, params) {
    const brand = 'Guruji Palmistry';
    let title = brand + ' | Palmistry, Astrology, Reiki & Spiritual Guidance';
    let desc = 'Palm analysis, Kundali analysis, Astro-Palmistry correlation, Reiki healing, japa, puja, muhurta, courses and spiritual knowledge with Guruji.';
    const s = params.slug && serviceBySlug(params.slug);
    const c = params.slug && courseBySlug(params.slug);
    const a = params.slug && articleBySlug(params.slug);
    const map = {
      about: ['About Guruji', C().about.intro],
      services: ['Services', 'Palmistry, astrology, japa & mantra, puja, pitru services, muhurta, Reiki and spiritual guidance.'],
      'service-category': [(category(params.cat) || {}).title, (category(params.cat) || {}).intro],
      'service-detail': s && [s.title, s.intro || s.short],
      reiki: ['Reiki Healing', 'Individual, extended and distance Reiki sessions and packages — a complementary wellness practice.'],
      courses: ['Courses', 'Palmistry courses, Reiki Level 1–3 and upcoming courses on Vedic astrology, mantra and Sanatana Dharma.'],
      'course-detail': c && [c.title, c.overview],
      resources: ['Resources & Articles', 'Articles and guides on palmistry, astrology, Reiki, mantras, rituals and meditation.'],
      article: a && [a.title, a.excerpt],
      faqs: ['FAQs', 'Answers about palmistry, astrology, japa, puja, Reiki, courses, booking and payment.'],
      contact: ['Contact & Booking', 'Send an enquiry or book a consultation with Guruji.'],
      'book-consultation': ['Book a Consultation', 'Book a Detailed Palm Analysis, Kundali Analysis or Astro-Palmistry Correlation.'],
      'book-pooja': ['Book a Pooja Seva', 'Book a pooja with Sankalpa in your name, on your chosen date and time slot.'],
      'book-status': ['Track Your Booking', 'Check the status of your booking.'],
      mantras: ['Mantras & Stotras', 'A library of mantras and stotras with meaning and guidance.'],
      palmistry: ['Palmistry Guide', 'Hand types, lines, mounts and fingers explained.'],
      policy: params.policy && (C().policies || {})[params.policy] && [(C().policies || {})[params.policy].title, ''],
      admin: ['Admin', ''], guruji: ['Guruji — cases', ''], session: ['Consultation room', '']
    };
    const m = map[pageId];
    if (m && m[0]) { title = `${m[0]} | ${brand}`; if (m[1]) desc = m[1]; }
    document.title = title;
    setMeta('meta[name="description"]', 'content', String(desc).slice(0, 300));
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', String(desc).slice(0, 300));
    setMeta('link[rel="canonical"]', 'href', location.origin + (pathFor(pageId, params) || location.pathname));
    setMeta('meta[name="robots"]', 'content', ['admin', 'guruji', 'session', 'learn', 'payment-return'].includes(pageId) ? 'noindex' : 'index,follow');
    setStructuredData(pageId, params, title, desc);
  }

  /** Schema.org data, so search engines can show services, FAQs and articles properly. */
  function setStructuredData(pageId, params, title, desc) {
    const st = C().settings || {};
    const org = {
      '@type': 'Organization', '@id': location.origin + '/#organization', name: 'Guruji Palmistry',
      url: location.origin, email: st.email || undefined,
      telephone: st.phone || undefined,
      description: 'Palmistry, Vedic astrology, Reiki healing and spiritual guidance.',
      sameAs: Object.values(st.social || {}).filter(u => /^https:\/\//.test(u || ''))
    };
    const graph = [org];
    const crumbList = (items) => ({
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: location.origin + (it[1] || location.pathname) }))
    });
    if (pageId === 'home') {
      graph.push({ '@type': 'WebSite', url: location.origin, name: 'Guruji Palmistry', potentialAction: { '@type': 'SearchAction', target: location.origin + '/search?q={search_term_string}', 'query-input': 'required name=search_term_string' } });
    }
    if (pageId === 'service-detail') {
      const s = serviceBySlug(params.slug);
      if (s) {
        graph.push({
          '@type': 'Service', name: s.title, description: s.intro || s.short, provider: { '@id': org['@id'] },
          serviceType: (category(s.category) || {}).title, url: location.origin + '/services/' + s.slug,
          offers: Number(s.price) > 0 ? { '@type': 'Offer', price: String(s.price), priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: location.origin + '/services/' + s.slug } : undefined
        });
        graph.push(crumbList([['Home', '/'], ['Services', '/services'], [s.title, '/services/' + s.slug]]));
      }
    }
    if (pageId === 'course-detail') {
      const c = courseBySlug(params.slug);
      if (c) graph.push({
        '@type': 'Course', name: c.title, description: c.overview,
        provider: { '@id': org['@id'] }, url: location.origin + '/courses/' + c.slug,
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: /online/i.test(c.mode) ? 'online' : 'onsite', courseWorkload: c.duration }
      });
    }
    if (pageId === 'article') {
      const a = articleBySlug(params.slug);
      if (a) graph.push({
        '@type': 'Article', headline: a.title, description: a.excerpt, datePublished: a.date, dateModified: a.date,
        author: { '@type': 'Organization', name: a.author || 'Guruji Palmistry' }, publisher: { '@id': org['@id'] },
        mainEntityOfPage: location.origin + '/resources/' + a.slug
      });
    }
    if (pageId === 'faqs' || pageId === 'reiki') {
      const cats = pageId === 'reiki' ? (C().faqCategories || []).filter(c => c.id === 'reiki') : (C().faqCategories || []);
      const items = cats.flatMap(c => c.items).slice(0, 40);
      if (items.length) graph.push({
        '@type': 'FAQPage',
        mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
      });
    }
    let el = document.getElementById('ld-json');
    if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'ld-json'; document.head.appendChild(el); }
    el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
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

    // Create (or reuse) the booking now, so the devotee can see the reference and
    // the amount the server will actually charge before paying.
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
  // Chat between the devotee and Guruji (polled; no websocket on serverless)
  // -------------------------------------------------------------------------
  const CHAT = { timer: null, lastAt: '', orderId: null, auth: null, el: null };

  const chatBubble = (m, you) => `
    <li class="chat-msg ${m.from === you ? 'chat-msg--mine' : ''}">
      <span class="chat-msg__who">${esc(m.from === 'guruji' ? 'Guruji' : m.name || 'You')}</span>
      <p>${esc(m.text).replace(/\n/g, '<br>')}</p>
      <time datetime="${esc(m.at)}">${new Date(m.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</time>
    </li>`;

  function chatMarkup(title) {
    return `<div class="chat">
      <div class="chat__head"><h3>${esc(title)}</h3><span class="chat__state" data-chat-state>Connecting…</span></div>
      <ul class="chat__list" data-chat-list aria-live="polite" aria-label="Messages"></ul>
      <form class="chat__form" data-chat-form>
        <label class="sr-only" for="chat-input">Your message</label>
        <textarea id="chat-input" rows="2" maxlength="2000" placeholder="Write to Guruji…" data-chat-input></textarea>
        <button type="submit" class="gold-gradient-btn h-11 px-5 rounded-xl">Send</button>
      </form>
    </div>`;
  }

  /** auth is { mobile } for a devotee, or { pin } for Guruji. */
  function startChat(container, orderId, auth) {
    stopChat();
    CHAT.orderId = orderId; CHAT.auth = auth; CHAT.el = container; CHAT.lastAt = '';
    const list = container.querySelector('[data-chat-list]');
    const state = container.querySelector('[data-chat-state]');
    const form = container.querySelector('[data-chat-form]');
    const input = container.querySelector('[data-chat-input]');
    let you = auth.pin ? 'guruji' : 'devotee';

    const headers = auth.pin ? { 'x-admin-pin': auth.pin } : {};
    const qs = () => `?${auth.mobile ? 'mobile=' + encodeURIComponent(auth.mobile) + '&' : ''}since=${encodeURIComponent(CHAT.lastAt)}`;

    async function poll() {
      try {
        const res = await fetchJson(`/api/bookings/${encodeURIComponent(orderId)}/messages${qs()}`, { headers });
        if (!res) { state.textContent = 'Offline'; return; }
        you = res.you;
        if (res.messages.length) {
          const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
          list.insertAdjacentHTML('beforeend', res.messages.map(m => chatBubble(m, you)).join(''));
          CHAT.lastAt = res.messages[res.messages.length - 1].at;
          if (atBottom) list.scrollTop = list.scrollHeight;
        }
        if (!list.children.length) list.innerHTML = '<li class="chat__empty">No messages yet. Write the first one.</li>';
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
        await fetchJson(`/api/bookings/${encodeURIComponent(orderId)}/messages`, {
          method: 'POST', headers, body: Object.assign({ text }, auth.mobile ? { mobile: auth.mobile } : {})
        });
        list.querySelector('.chat__empty')?.remove();
        await poll();
      } catch (err) { toast(err.message, 'error'); input.value = text; }
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.requestSubmit(); });
    poll();
    CHAT.timer = setInterval(poll, 5000);
  }
  function stopChat() { if (CHAT.timer) clearInterval(CHAT.timer); CHAT.timer = null; }

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
    }).catch(() => {});

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
        <p class="learn-meta">${o.lessonCount} lessons · about ${o.minutes} minutes in total · ${free ? 'no fee' : priceText(o.price)}</p>
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
  const ADMIN = { pin: '', token: '', role: '', email: '', tab: 'bookings', data: null, editing: null, filters: {} };
  try { const saved = JSON.parse(sessionStorage.getItem('guruji_admin') || 'null'); if (saved) Object.assign(ADMIN, saved); } catch (e) { /* ignore */ }
  const adminFetch = (url, opts = {}) => {
    const headers = Object.assign({}, opts.headers);
    if (ADMIN.pin) headers['x-admin-pin'] = ADMIN.pin;
    if (ADMIN.token) headers['x-admin-token'] = ADMIN.token;
    return fetchJson(url, Object.assign({}, opts, { headers }));
  };

  const SCHEMAS = {
    services: { label: 'Services', key: 'slug', title: 'title', fields: [
      ['title', 'Title', 'text'], ['slug', 'URL slug', 'text'], ['category', 'Category', 'select', () => (C().serviceCategories || []).map(c => [c.id, c.title])],
      ['short', 'Short description', 'textarea'], ['intro', 'Introduction', 'textarea'], ['description', 'Description', 'textarea'],
      ['benefits', 'Benefits / purpose (one per line)', 'lines'], ['requiredInfo', 'Information required (one per line — empty uses the category list)', 'lines'],
      ['deliverables', 'What the client receives (one per line)', 'lines'], ['duration', 'Duration', 'text'],
      ['price', 'Price in ₹ (empty = price on request)', 'number'],
      ['bookingType', 'How it is booked', 'select', () => [['enquiry', 'Enquiry form'], ['consultation', 'Pay online (consultation flow)'], ['pooja', 'Pooja booking (date & slot)']]],
      ['consultationId', 'Consultation id (palmistry_reading / astrology_correlation / combined_consultation)', 'text'], ['poojaId', 'Pooja id (for pooja booking)', 'text'],
      ['image', 'Image', 'image'], ['core', 'Core consultation', 'bool'], ['featured', 'Featured on home', 'bool'], ['published', 'Published', 'bool']
    ], blank: () => ({ slug: '', category: 'palmistry', title: 'New service', short: '', intro: '', description: '', benefits: [], duration: '', price: null, bookingType: 'enquiry', published: false }) },
    courses: { label: 'Courses', key: 'slug', title: 'title', fields: [
      ['title', 'Title', 'text'], ['slug', 'URL slug', 'text'], ['track', 'Track', 'select', () => (C().courseTracks || []).map(t => [t.id, t.title])],
      ['overview', 'Overview', 'textarea'], ['curriculum', 'Curriculum (one per line)', 'lines'], ['outcomes', 'Learning outcomes (one per line)', 'lines'],
      ['duration', 'Duration', 'text'], ['mode', 'Online / offline', 'text'], ['instructor', 'Instructor', 'text'], ['price', 'Fee in ₹ (empty = on enquiry)', 'number'],
      ['certificate', 'Certificate', 'text'], ['status', 'Status', 'select', () => [['open', 'Enrolling now'], ['enquire', 'Register interest'], ['upcoming', 'Coming soon']]],
      ['image', 'Image', 'image'], ['featured', 'Featured on home', 'bool'], ['published', 'Published', 'bool']
    ], blank: () => ({ slug: '', track: 'palmistry', title: 'New course', overview: '', curriculum: [], outcomes: [], duration: '', mode: 'Online & offline', instructor: 'Guruji', price: null, certificate: '', status: 'enquire', published: false }) },
    articles: { label: 'Articles', key: 'slug', title: 'title', fields: [
      ['title', 'Title', 'text'], ['slug', 'URL slug', 'text'], ['category', 'Category', 'select', () => (C().resourceCategories || []).map(c => [c.id, c.title])],
      ['type', 'Resource type', 'select', () => (C().resourceTypes || []).map(t => [t, t])], ['excerpt', 'Summary', 'textarea'],
      ['body', 'Article text (blank line between paragraphs)', 'paras'], ['date', 'Date', 'date'], ['author', 'Author', 'text'],
      ['image', 'Image', 'image'], ['videoUrl', 'YouTube link (optional)', 'text'], ['pdfUrl', 'PDF link (optional)', 'text'],
      ['featured', 'Featured', 'bool'], ['published', 'Published', 'bool']
    ], blank: () => ({ slug: '', category: 'palmistry', type: 'Articles & Blogs', title: 'New article', excerpt: '', body: [], date: new Date().toISOString().slice(0, 10), author: 'Guruji Palmistry', published: false }) },
    testimonials: { label: 'Testimonials', key: null, title: 'name', fields: [
      ['name', 'Name', 'text'], ['location', 'Location', 'text'], ['text', 'Testimonial', 'textarea'], ['published', 'Published', 'bool']
    ], blank: () => ({ name: '', location: '', text: '', published: false }) },
    faqCategories: { label: 'FAQs', key: 'id', title: 'title', fields: [
      ['title', 'Topic title', 'text'], ['id', 'Topic id', 'text'], ['items', 'Questions — one per line as: Question || Answer', 'pairs']
    ], blank: () => ({ id: 'new-topic', title: 'New topic', items: [] }) },
    serviceCategories: { label: 'Service categories', key: 'id', title: 'title', fields: [
      ['title', 'Title', 'text'], ['id', 'Id', 'text'], ['tagline', 'Tagline', 'text'], ['intro', 'Introduction', 'textarea'],
      ['howItWorks', 'How it works (one step per line)', 'lines'], ['requiredInfo', 'Information required (one per line)', 'lines'],
      ['image', 'Image', 'image'], ['icon', 'Icon (Font Awesome name, e.g. fa-hand)', 'text'], ['link', 'Custom page link (optional)', 'text']
    ], blank: () => ({ id: 'new-category', title: 'New category', tagline: '', intro: '', howItWorks: [], requiredInfo: [], image: '', icon: 'fa-star' }) },
    pillars: { label: 'Home pillars', key: null, title: 'title', fields: [['title', 'Title', 'text'], ['text', 'Text', 'text'], ['icon', 'Icon', 'text'], ['link', 'Link', 'text']], blank: () => ({ title: '', text: '', icon: 'fa-star', link: '/' }) }
  };
  const OBJECT_SECTIONS = {
    settings: { label: 'Settings & homepage', fields: [
      ['hero.title', 'Homepage heading', 'text'], ['hero.subtitle', 'Homepage subtitle', 'textarea'],
      ['phone', 'Phone (shown on site)', 'text'], ['whatsapp', 'WhatsApp number with country code (e.g. 919876543210)', 'text'],
      ['email', 'Email', 'text'], ['address', 'Address (optional)', 'textarea'], ['mapEmbedUrl', 'Google Maps embed URL (optional)', 'text'],
      ['social.instagram', 'Instagram URL', 'text'], ['social.youtube', 'YouTube URL', 'text'], ['social.facebook', 'Facebook URL', 'text']
    ] },
    about: { label: 'About Guruji', fields: [
      ['name', 'Name', 'text'], ['alsoKnownAs', 'Also known as', 'text'], ['role', 'Role / title', 'text'], ['portrait', 'Portrait', 'image'],
      ['intro', 'Introduction', 'textarea'], ['highlights', 'Highlights (one per line)', 'lines'],
      ['sections', 'Page sections — one per block: Title || Text (use ;; to separate list items)', 'sections']
    ] }
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

  async function adminLoad() {
    const tab = ADMIN.tab;
    const host = $('#adm-body');
    host.innerHTML = '<div class="sp-spinner" aria-hidden="true"></div>';
    try {
      if (tab === 'bookings' || tab === 'enquiries') {
        const f = ADMIN.filters[tab] || {};
        const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
        ADMIN.data = await adminFetch(`/api/admin/${tab}${qs ? '?' + qs : ''}`);
      } else if (tab === 'images') {
        ADMIN.data = await adminFetch('/api/admin/media');
      } else {
        ADMIN.data = await adminFetch('/api/admin/content');
      }
      if (!ADMIN.data) throw new Error('The admin dashboard needs the server.');
      renderAdminBody();
    } catch (err) {
      if (err.status === 401) { ADMIN.pin = ''; sessionStorage.removeItem('guruji_admin'); return renderAdmin(); }
      host.innerHTML = `<p class="sp-notice">${esc(err.message)}</p>`;
    }
  }

  const STATUS_TONE = { PAID: 'green', DETAILS_RECEIVED: 'green', COMPLETED: 'green', CONFIRMED: 'green', SCHEDULED: 'gold', PENDING_PAYMENT: 'muted', NEW: 'gold', CONTACTED: 'gold', PAYMENT_FAILED: 'red', CANCELLED: 'red', REFUNDED: 'muted', CLOSED: 'muted' };
  function renderAdminBody() {
    const host = $('#adm-body');
    const tab = ADMIN.tab;
    if (tab === 'bookings' || tab === 'enquiries') {
      const isB = tab === 'bookings';
      const rows = ADMIN.data[tab] || [];
      const f = ADMIN.filters[tab] || {};
      host.innerHTML = `
        <form class="sp-filter" onsubmit="event.preventDefault(); adminFilter(this)">
          <div class="sp-filter__search"><i class="fa-solid fa-magnifying-glass"></i><input name="q" value="${esc(f.q || '')}" placeholder="Search name, mobile, reference…"></div>
          <select name="status" onchange="adminFilter(this.form)"><option value="">All statuses</option>${ADMIN.data.statuses.map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          ${isB ? `<select name="type" onchange="adminFilter(this.form)"><option value="">All types</option><option value="consultation" ${f.type === 'consultation' ? 'selected' : ''}>Consultation</option><option value="pooja" ${f.type === 'pooja' ? 'selected' : ''}>Pooja</option></select>`
                : `<select name="kind" onchange="adminFilter(this.form)"><option value="">All kinds</option>${['booking', 'course', 'contact'].map(k => `<option ${f.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select>`}
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
    if (!confirm('Replace your edits in this section with the original content?')) return;
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
    ADMIN.pin = '';
    ADMIN.token = '';
    ADMIN.role = '';
    ADMIN.email = '';
    sessionStorage.removeItem('guruji_admin');
    renderAdmin();
  };
  window.adminLogin = async (e) => {
    e.preventDefault();
    const pin = e.target.elements.pin.value;
    try {
      const res = await fetchJson('/api/admin/verify', { method: 'POST', headers: { 'x-admin-pin': pin } });
      if (!res) throw new Error('The admin dashboard needs the server.');
      ADMIN.pin = pin; ADMIN.token = ''; ADMIN.role = res.role; ADMIN.email = '';
      if (res.role !== 'owner' && ['bookings', 'enquiries'].includes(ADMIN.tab)) ADMIN.tab = 'services';
      sessionStorage.setItem('guruji_admin', JSON.stringify({ pin, role: res.role, tab: ADMIN.tab }));
      window.ADMIN_PIN_SESSION = pin;
      renderAdmin();
    } catch (err) { toast(err.message, 'error'); }
  };
  window.adminLoginWithGoogle = async () => {
    if (!window.firebaseAuth) {
      toast('Connecting to Google Firebase...', 'warn');
      return;
    }
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      const provider = new GoogleAuthProvider();
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
      toast(`Welcome, ${user.displayName || user.email}! Signed in as Admin.`, 'success');
      renderAdmin();
    } catch (err) {
      toast(err.message || 'Google sign-in could not be verified for Admin.', 'error');
    }
  };

  function renderAdmin() {
    const host = $('#page-admin');
    if (!host) return;
    if (!ADMIN.pin && !ADMIN.token) {
      host.innerHTML = `<section class="sp-section"><div class="sp-wrap sp-narrow">
        <div class="sp-panel sp-form max-w-sm mx-auto text-center space-y-4">
          <i class="fa-solid fa-shield-halved text-3xl text-gold-deep" aria-hidden="true"></i>
          <div>
            <h1 class="sp-h2">Admin sign in</h1>
            <p class="text-xs text-ink-3 mt-1">Authorized for <strong>gsrikar888@gmail.com</strong> & Temple Staff</p>
          </div>

          <!-- Google 1-Click Sign-in for gsrikar888@gmail.com -->
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
    const tabs = [
      owner && ['bookings', 'Bookings', 'fa-calendar-check'], owner && ['enquiries', 'Enquiries', 'fa-envelope-open-text'],
      ['services', 'Services & pricing', 'fa-hand'], ['serviceCategories', 'Service categories', 'fa-layer-group'], ['courses', 'Courses', 'fa-graduation-cap'],
      ['articles', 'Articles', 'fa-newspaper'], ['faqCategories', 'FAQs', 'fa-circle-question'], ['testimonials', 'Testimonials', 'fa-quote-left'],
      ['about', 'About Guruji', 'fa-user'], ['pillars', 'Home pillars', 'fa-table-columns'], ['settings', 'Settings & homepage', 'fa-gear'],
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
          <h1 class="sp-h2 mb-4">${esc((tabs.find(t => t[0] === ADMIN.tab) || [])[1] || '')}</h1>
          <div id="adm-body"></div>
        </div>
      </section>`;
    adminLoad();
  }

  // -------------------------------------------------------------------------
  // What the devotee sees under their booking: session, chat, chart, reading
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
  const GURUJI = { list: [], current: null, filter: '' };
  const gurujiFetch = (url, opts = {}) => fetchJson(url, Object.assign({}, opts, { headers: Object.assign({ 'x-admin-pin': ADMIN.pin }, opts.headers || {}) }));

  RENDER.guruji = ({ slug }) => `<section class="guruji-area" data-guruji-root data-case="${esc(slug || '')}"><div class="sp-wrap py-10"><div class="sp-spinner" aria-hidden="true"></div></div></section>`;

  async function renderGuruji(orderId) {
    const root = $('[data-guruji-root]');
    if (!root) return;
    if (!ADMIN.pin || !['guruji', 'owner'].includes(ADMIN.role)) {
      root.innerHTML = `<section class="sp-section"><div class="sp-wrap sp-narrow">
        <form class="sp-panel sp-form max-w-sm mx-auto text-center" onsubmit="gurujiLogin(event)">
          <i class="fa-solid fa-hands-praying text-3xl text-gold-deep" aria-hidden="true"></i>
          <h1 class="sp-h2">Guruji's cases</h1>
          <p class="sp-text">Sign in to see the devotees waiting, their palms and charts, the chat and the reading.</p>
          <label class="sp-field"><span>Your PIN</span><input name="pin" type="password" autocomplete="current-password" required></label>
          <button class="gold-gradient-btn h-11 rounded-xl">Sign in</button>
        </form></div></section>`;
      return;
    }
    if (orderId) return renderCase(orderId);
    root.innerHTML = '<div class="sp-wrap py-8"><div class="sp-spinner" aria-hidden="true"></div></div>';
    let data;
    try { data = await gurujiFetch('/api/guruji/cases'); } catch (err) {
      if (err.status === 401) { ADMIN.pin = ''; sessionStorage.removeItem('guruji_admin'); return renderGuruji(); }
      root.innerHTML = `<div class="sp-wrap py-8"><p class="sp-notice">${esc(err.message)}</p></div>`; return;
    }
    GURUJI.list = (data && data.cases) || [];
    const waiting = GURUJI.list.filter(c => c.status !== 'COMPLETED');
    const today = new Date().toISOString().slice(0, 10);
    const card = (c) => {
      const when = c.slotStart ? new Date(c.slotStart) : null;
      const isToday = when && when.toISOString().slice(0, 10) === today;
      return `<a href="/guruji/${esc(c.orderId)}" data-link class="case-card ${isToday ? 'case-card--today' : ''}">
        <div class="case-card__top">
          <span class="sp-pill sp-pill--${STATUS_TONE[c.status] || 'muted'}">${esc(c.status.replace(/_/g, ' ').toLowerCase())}</span>
          ${c.unread ? `<span class="case-card__unread">${c.unread} new</span>` : ''}
          ${c.assignedTo ? `<span class="case-card__who">${esc(c.assignedTo)}</span>` : '<span class="case-card__who case-card__who--free">unclaimed</span>'}
        </div>
        <h3>${esc(c.devotee.name)}</h3>
        <p>${esc((c.service && c.service.title) || '')}</p>
        <p class="case-card__when">${when ? when.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'No appointment time'}</p>
        <p class="case-card__meta">${esc(c.orderId)} · ${(c.photos || []).length} photo${(c.photos || []).length === 1 ? '' : 's'}${c.chart ? ' · chart cast' : ''}${c.report && c.report.status === 'ready' ? ' · reading sent' : ''}</p>
      </a>`;
    };
    root.innerHTML = `
      <div class="sp-wrap py-8">
        <div class="session-head">
          <div><p class="sp-eyebrow sp-eyebrow--maroon">Guruji</p><h1 class="sp-h2">Cases</h1>
            <p class="sp-text">${waiting.length} waiting · ${GURUJI.list.length - waiting.length} finished</p></div>
          <button class="sp-btn-outline" onclick="adminLogout(); renderGuruji()">Sign out</button>
        </div>
        <div class="case-grid">${GURUJI.list.length ? GURUJI.list.map(card).join('') : '<p class="sp-text">No paid bookings yet.</p>'}</div>
      </div>`;
  }
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

  async function renderCase(orderId) {
    const root = $('[data-guruji-root]');
    let data;
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
    root.innerHTML = `
      <div class="sp-wrap py-8 case-page">
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
          </div>
        </div>

        <div class="case-layout">
          <div class="case-main">
            <div class="sp-panel">
              <h2 class="sp-h3">Devotee</h2>
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
                ? `<ul class="case-photos">${c.photos.map(p => `<li><span>${esc(p.name)}</span><small>slot ${p.slot} · ${Math.round((p.size || 0) / 1024)} KB</small></li>`).join('')}</ul>
                   <p class="text-xs text-ink-3 mt-2">The devotee's photos are listed by name here. Ask for them on WhatsApp or by email until file storage is connected.</p>`
                : '<p class="sp-text">No photos uploaded yet.</p>'}
            </div>

            <div class="sp-panel" data-case-chart>
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h2 class="sp-h3">Kundali</h2>
                ${c.chart ? '' : `<button class="sp-btn-outline sp-btn-sm" onclick="castChart('${esc(c.orderId)}')">Cast the chart</button>`}
              </div>
              <div data-chart-slot>${c.chart ? '' : '<p class="sp-text">Not cast yet. Needs the date, time and co-ordinates of birth.</p>'}</div>
            </div>

            <div class="sp-panel">
              <h2 class="sp-h3">The reading</h2>
              <form class="sp-form" onsubmit="saveReport(event, '${esc(c.orderId)}')">
                <label class="sp-field"><span>Part 2 — the hands</span><textarea name="palm" rows="7">${esc(r.palm || '')}</textarea></label>
                <label class="sp-field"><span>Part 3 — where the chart and the hands agree</span><textarea name="correlation" rows="6">${esc(r.correlation || '')}</textarea></label>
                <label class="sp-field"><span>Summary</span><textarea name="summary" rows="4">${esc(r.summary || '')}</textarea></label>
                <label class="sp-field"><span>Suggested practices</span><textarea name="remedies" rows="4">${esc(r.remedies || '')}</textarea></label>
                <div class="flex flex-wrap items-center gap-3">
                  <button class="gold-gradient-btn h-11 px-6 rounded-xl">Save draft</button>
                  <button type="button" class="sp-btn-outline" onclick="markReportReady('${esc(c.orderId)}')">Mark ready for the devotee</button>
                  <a class="sp-link" href="/api/bookings/${esc(c.orderId)}/report.pdf" target="_blank" rel="noopener">Preview the PDF ↗</a>
                  ${r.status === 'ready' ? `<span class="sp-pill sp-pill--green">sent ${esc((r.readyAt || '').slice(0, 10))}</span>` : r.version ? `<span class="sp-pill sp-pill--muted">draft v${r.version}</span>` : ''}
                </div>
                <p class="text-xs text-ink-3">Snippets: leave a blank line between paragraphs. The devotee sees this only after you mark it ready.</p>
              </form>
            </div>
          </div>

          <aside class="case-side" data-case-chat>${chatMarkup('Chat with ' + (d.name || 'the devotee'))}</aside>
        </div>
      </div>`;

    if (c.chart) showChart(root.querySelector('[data-chart-slot]'), c.chart);
    startChat(root.querySelector('[data-case-chat]'), c.orderId, { pin: ADMIN.pin });
  }

  function showChart(slot, chart) {
    if (!slot || !window.GurujiChart) return;
    slot.innerHTML = GurujiChart.chartPanel(chart);
    GurujiChart.bindChartPanel(slot, chart);
  }

  window.claimCase = async (orderId) => {
    try { await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/claim`, { method: 'POST', body: { name: 'Guruji' } }); renderCase(orderId); }
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
  window.markReportReady = async (orderId) => {
    if (!confirm('Mark this reading ready? The devotee will be able to download it.')) return;
    try { await gurujiFetch(`/api/guruji/cases/${encodeURIComponent(orderId)}/ready`, { method: 'POST' }); toast('The devotee can now download the reading.'); renderCase(orderId); }
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
      if (health.testOneRupee) {
        window.TEST_ONE_RUPEE = true;
        if (typeof applyOneRupeeUI === 'function') applyOneRupeeUI();
      }
    }
    refreshPaymentPage();
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
    // keep the payment page in sync whenever it is shown
    const pay = document.getElementById('page-book-payment');
    if (pay) new MutationObserver(() => { if (!pay.classList.contains('hidden')) refreshPaymentPage(); }).observe(pay, { attributes: true, attributeFilter: ['class'] });
    $('#site-search-input')?.addEventListener('input', (e) => { $('#site-search-results').innerHTML = resultsHtml(e.target.value.trim(), runSearch(e.target.value.trim())); });
    $('#site-search-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) navigate('/search?q=' + encodeURIComponent(q)); } });
    $('#site-search')?.addEventListener('click', (e) => { if (e.target.id === 'site-search') closeSiteSearch(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSiteSearch(); });
  });
})();
