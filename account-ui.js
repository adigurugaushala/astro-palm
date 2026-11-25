/* Guruji Palmistry — the seeker's account ("My Account").
 *
 * One page with sections, chosen by ?tab=: overview, consultations, reports,
 * palm, payments, profile. A side list on wide screens, a row of chips on
 * phones (where the bottom bar also links Reports and Account).
 *
 * Everything shown comes from /api/customer/me and /api/customer/bookings;
 * nothing here is sample data. Helpers it reuses from app.js: rpServiceFor,
 * rpImage, rpCover, fillAndTrack, saveCustomerProfile, toggleProfileEdit,
 * handleCustomerLogout, custHeaders, loadJsPdf, resumeHeldBooking.
 */
(function () {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const rupees = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const day = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const dayTime = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  const TABS = [
    ['overview', 'Dashboard', 'fa-house', 'Namaste', 'Your consultations, readings and payments in one place.'],
    ['consultations', 'Consultations', 'fa-calendar-check', 'My Consultations', 'Upcoming and past sessions. Join live with Guruji when your room opens.'],
    ['reports', 'Reports', 'fa-file-lines', 'My Reports & Downloads', 'Access, download and manage all your consultation reports.'],
    ['palm', 'Palm Images', 'fa-hand', 'My Palm Images', 'View and update your palm photographs for analysis.'],
    ['payments', 'Payments', 'fa-wallet', 'Payments & Receipts', 'Your payment history, receipts and transaction status.'],
    ['profile', 'My Profile', 'fa-user', 'My Profile & Account Settings', 'Manage your personal details, birth information and account security.']
  ];

  const UNPAID = ['PENDING', 'FAILED', 'PENDING_PAYMENT', 'PAYMENT_FAILED'];
  const FAILED = ['FAILED', 'PAYMENT_FAILED'];
  const LIVE_OPEN = ['PAID', 'DETAILS_RECEIVED', 'SCHEDULED', 'AWAITING_REPORT'];

  const isPaid = (b) => !UNPAID.includes(b.status);
  const isReady = (b) => Boolean(b.report && b.report.status === 'ready');
  const title = (b) => (b.service && b.service.title) || (b.type === 'pooja' ? 'Pooja Seva' : 'Consultation');
  /** palmistry | kundali | astro | pooja | course | other */
  function kind(b) {
    if (b.type === 'pooja') return 'pooja';
    if (b.type === 'course') return 'course';
    const t = (title(b) + ' ' + ((b.service && b.service.id) || '')).toLowerCase();
    if (/correlation|astro[- ]?palm|combined/.test(t)) return 'astro';
    if (/kundali|kundli|horoscope|jyotish|astrolog/.test(t)) return 'kundali';
    if (/palm|hasta/.test(t)) return 'palmistry';
    return 'other';
  }
  const KIND_LABEL = { palmistry: 'Palmistry', kundali: 'Kundali', astro: 'Astro-Palmistry', pooja: 'Puja & Seva', course: 'Courses', other: 'Other' };
  const KIND_ICON = { palmistry: 'fa-hand', kundali: 'fa-dharmachakra', astro: 'fa-sun', pooja: 'fa-fire', course: 'fa-book-open', other: 'fa-star' };

  const mobileQs = (b, cust) => {
    const m = (b.devotee && b.devotee.mobile) || cust.mobile;
    return m ? '?mobile=' + encodeURIComponent(m) : '';
  };
  function reportUrls(b, cust) {
    if (!isReady(b)) return {};
    const id = encodeURIComponent(b.orderId);
    const q = mobileQs(b, cust);
    const file = b.reportFile ? `/api/bookings/${id}/report-file.pdf${q}` : '';
    const written = `/api/bookings/${id}/report.pdf${q}`;
    return { main: file || written, file, written };
  }
  function slotWhen(b) {
    if (b.slotStart) return new Date(b.slotStart);
    return null;
  }
  const liveOpen = (b) => LIVE_OPEN.includes(b.status) && b.type !== 'pooja' && b.type !== 'course';

  function statusPill(b) {
    if (FAILED.includes(b.status)) return '<span class="ac-pill ac-pill--bad"><i class="fa-solid fa-xmark"></i> Payment failed</span>';
    if (!isPaid(b)) return '<span class="ac-pill ac-pill--wait"><i class="fa-regular fa-clock"></i> Payment pending</span>';
    if (isReady(b) || b.status === 'COMPLETED') return '<span class="ac-pill ac-pill--ok"><i class="fa-solid fa-check"></i> Completed</span>';
    if (b.status === 'AWAITING_REPORT') return '<span class="ac-pill ac-pill--info"><i class="fa-regular fa-hourglass-half"></i> Report in progress</span>';
    return '<span class="ac-pill ac-pill--ok"><i class="fa-solid fa-check"></i> Confirmed</span>';
  }

  let S = null; // { container, cust, bookings, token, slotResumeHtml, tab, filter, q }

  function render(container, data) {
    const q = new URLSearchParams(location.search);
    const tab = TABS.some(t => t[0] === q.get('tab')) ? q.get('tab') : 'overview';
    if (window.setBottomNav) window.setBottomNav('account');
    if (window.markBottomNav) window.markBottomNav(tab === 'payments' ? 'overview' : tab);
    S = Object.assign({ container, tab, filter: 'all', q: '' }, data);
    draw();
  }

  function go(tab) {
    if (!S) return;
    S.tab = tab; S.filter = 'all'; S.q = '';
    const url = tab === 'overview' ? '/account' : '/account?tab=' + tab;
    try { history.pushState({ pageId: 'account', params: { query: tab === 'overview' ? {} : { tab } } }, '', url); } catch (e) { /* ignore */ }
    if (window.setBottomNav) window.setBottomNav('account');
    if (window.markBottomNav) window.markBottomNav(tab === 'payments' ? 'overview' : tab);
    draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function draw() {
    const t = TABS.find(x => x[0] === S.tab);
    const first = (S.cust.name || 'Seeker').split(' ')[0];
    const head = S.tab === 'overview' ? `Namaste, ${esc(first)}` : esc(t[3]);
    S.container.innerHTML = `
      <div class="ac-shell">
        <aside class="ac-side" aria-label="My account">
          <div class="ac-me">
            <span class="ac-avatar">${esc((S.cust.name || 'S').charAt(0).toUpperCase())}</span>
            <div><strong>${esc(S.cust.name || 'Seeker')}</strong><small>${esc(S.cust.email || (S.cust.mobile ? '+91 ' + S.cust.mobile : ''))}</small></div>
          </div>
          <nav class="ac-tabs" role="tablist">
            ${TABS.map(([id, label, icon]) => `<button type="button" role="tab" aria-selected="${S.tab === id}" class="${S.tab === id ? 'is-active' : ''}" onclick="AccountUI.go('${id}')"><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span></button>`).join('')}
          </nav>
          <button type="button" class="ac-signout" onclick="handleCustomerLogout()"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Sign out</button>
        </aside>
        <div class="ac-main">
          <header class="ac-banner">
            <div><h1>${head}</h1><p>${esc(t[4])}</p></div>
            <span class="ac-banner__art" aria-hidden="true"></span>
          </header>
          ${S.slotResumeHtml || ''}
          ${({ overview, consultations, reports, palm, payments, profile })[S.tab]()}
        </div>
      </div>`;
    if (S.tab === 'overview' && typeof initReportCarousels === 'function') initReportCarousels(S.container);
  }

  // ------------------------------------------------------------- Overview
  function overview() {
    const b = S.bookings;
    const paid = b.filter(isPaid);
    const ready = b.filter(isReady);
    const total = paid.reduce((n, x) => n + Number(x.amount || 0), 0);
    const now = Date.now();
    const upcoming = paid.filter(x => liveOpen(x) && slotWhen(x) && slotWhen(x).getTime() > now - 2 * 3600e3)
      .sort((a, c) => slotWhen(a) - slotWhen(c));
    const next = upcoming[0] || paid.find(liveOpen);
    return `
      <div class="ac-stats">
        ${stat('fa-calendar-check', paid.length, 'Consultations', 'consultations')}
        ${stat('fa-file-lines', ready.length, 'Reports ready', 'reports')}
        ${stat('fa-clock', upcoming.length, 'Upcoming', 'consultations')}
        ${stat('fa-wallet', rupees(total), 'Total paid', 'payments')}
      </div>
      ${next ? `<section class="ac-card ac-next">
        <div class="ac-next__icon"><i class="fa-solid fa-video" aria-hidden="true"></i></div>
        <div class="ac-next__text">
          <span class="ac-kicker">Next with Guruji</span>
          <h3>${esc(title(next))}</h3>
          <p>${slotWhen(next) ? esc(dayTime(slotWhen(next).toISOString())) : esc([next.slot && next.slot.date, next.slot && next.slot.time].filter(Boolean).join(' at ') || 'Time to be confirmed')}</p>
        </div>
        <div class="ac-next__actions">${liveActions(next)}</div>
      </section>` : `<section class="ac-card ac-empty">
        <i class="fa-regular fa-calendar" aria-hidden="true"></i>
        <h3>No upcoming consultation</h3>
        <p>Book a palm reading, Kundali or Astro-Palmistry session with Guruji.</p>
        <a href="/services" data-link class="ac-btn ac-btn--gold">Book a consultation</a>
      </section>`}
      <div class="ac-quick">
        ${quick('consultations', 'fa-calendar-check', 'Consultations', 'Join live, track status')}
        ${quick('reports', 'fa-file-arrow-down', 'Reports', 'Download your readings')}
        ${quick('palm', 'fa-hand', 'Palm images', 'View or replace photos')}
        ${quick('payments', 'fa-receipt', 'Payments', 'Receipts and history')}
      </div>
      ${typeof reportShopHtml === 'function' ? reportShopHtml() : ''}`;
  }
  const stat = (icon, value, label, tab) => `<button type="button" class="ac-stat" onclick="AccountUI.go('${tab}')"><i class="fa-solid ${icon}" aria-hidden="true"></i><strong>${esc(value)}</strong><span>${esc(label)}</span></button>`;
  const quick = (tab, icon, label, sub) => `<button type="button" class="ac-quick__item" onclick="AccountUI.go('${tab}')"><i class="fa-solid ${icon}" aria-hidden="true"></i><span><strong>${label}</strong><small>${sub}</small></span><i class="fa-solid fa-chevron-right ac-quick__go" aria-hidden="true"></i></button>`;

  function liveActions(b) {
    const when = slotWhen(b);
    const opensAt = when ? when.getTime() - 10 * 60e3 : 0;
    const roomOpen = liveOpen(b) && (!when || Date.now() >= opensAt);
    const asked = b._liveAsked;
    return `
      ${roomOpen ? `<a href="/session/${esc(b.orderId)}" data-link class="ac-btn ac-btn--maroon"><i class="fa-solid fa-video" aria-hidden="true"></i> Join live with Guruji</a>` : ''}
      ${liveOpen(b) ? `<button type="button" class="ac-btn ac-btn--outline" ${asked ? 'disabled' : ''} onclick="AccountUI.requestLive('${esc(b.orderId)}', this)"><i class="fa-solid fa-hand-point-up" aria-hidden="true"></i> ${asked ? 'Request sent' : 'Request a live session'}</button>` : ''}`;
  }

  // -------------------------------------------------------- Consultations
  function consultations() {
    const list = S.bookings.filter(b => b.type !== 'course');
    if (!list.length) return emptyCard('fa-calendar', 'No consultations yet', 'Your bookings appear here once you book.', '/services', 'Explore services');
    return `<div class="ac-list">${list.map(b => `
      <article class="ac-card ac-row">
        <span class="ac-thumb ac-thumb--${kind(b)}"><i class="fa-solid ${KIND_ICON[kind(b)]}" aria-hidden="true"></i></span>
        <div class="ac-row__body">
          <h3>${esc(title(b))}</h3>
          <p class="ac-meta"><span><i class="fa-solid fa-hashtag" aria-hidden="true"></i> ${esc(b.orderId)}</span>
            <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${esc(slotWhen(b) ? dayTime(slotWhen(b).toISOString()) : [b.slot && b.slot.date, b.slot && b.slot.time].filter(Boolean).join(' · ') || (b.poojaDate || day(b.createdAt)))}</span></p>
          <div class="ac-row__pills">${statusPill(b)}</div>
        </div>
        <div class="ac-row__actions">
          ${isPaid(b) ? liveActions(b) : `<button type="button" class="ac-btn ac-btn--gold" onclick="resumeHeldBooking()">Complete payment</button>`}
          <a href="/track" data-link class="ac-btn ac-btn--outline" onclick="fillAndTrack('${esc(b.orderId)}', '${esc((b.devotee && b.devotee.mobile) || S.cust.mobile || S.cust.email || '')}')"><i class="fa-regular fa-eye" aria-hidden="true"></i> View details</a>
        </div>
      </article>`).join('')}</div>`;
  }

  // -------------------------------------------------------------- Reports
  function reports() {
    const all = S.bookings.filter(b => isPaid(b) && b.type !== 'pooja' && b.type !== 'course');
    const counts = { all: all.length };
    all.forEach(b => { counts[kind(b)] = (counts[kind(b)] || 0) + 1; });
    const q = S.q.trim().toLowerCase();
    const list = all.filter(b => (S.filter === 'all' || kind(b) === S.filter) &&
      (!q || (title(b) + ' ' + b.orderId + ' ' + day(b.createdAt)).toLowerCase().includes(q)));
    const chips = [['all', 'All Reports', 'fa-layer-group'], ['palmistry', 'Palmistry', 'fa-hand'], ['kundali', 'Kundali', 'fa-dharmachakra'], ['astro', 'Astro-Palmistry', 'fa-sun']]
      .filter(([id]) => id === 'all' || counts[id]);
    return `
      ${filterBar(chips, counts, 'Search by report, service or date')}
      ${list.length ? `<div class="ac-list">${list.map(b => {
        const u = reportUrls(b, S.cust);
        const svc = typeof rpServiceFor === 'function' ? rpServiceFor(b) : null;
        const img = typeof rpImage === 'function' ? rpImage(svc) : '/assets/hero_palm_art_clean.jpg';
        return `<article class="ac-card ac-row ac-report">
          <span class="ac-cover" style="background-image:url('${esc(img)}')"><span>${esc(title(b))}</span></span>
          <div class="ac-row__body">
            <h3>${esc(title(b))} Report</h3>
            <p class="ac-meta"><span><i class="fa-solid ${KIND_ICON[kind(b)]}" aria-hidden="true"></i> ${esc(KIND_LABEL[kind(b)])}</span>
              <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${esc(day((b.report && (b.report.readyAt || b.report.at)) || b.updatedAt || b.createdAt))}</span>
              <span><i class="fa-regular fa-file-pdf" aria-hidden="true"></i> PDF</span></p>
            <div class="ac-row__pills">${isReady(b) ? '<span class="ac-pill ac-pill--ok"><i class="fa-solid fa-check"></i> Completed</span>' : '<span class="ac-pill ac-pill--info"><i class="fa-regular fa-hourglass-half"></i> Being prepared</span>'}</div>
          </div>
          <div class="ac-row__actions">
            ${u.main ? `<a href="${u.main}" download class="ac-btn ac-btn--maroon"><i class="fa-solid fa-download" aria-hidden="true"></i> Download PDF</a>
              <a href="${u.main}" target="_blank" rel="noopener" class="ac-btn ac-btn--outline"><i class="fa-regular fa-eye" aria-hidden="true"></i> View report</a>
              ${u.file && u.written ? `<a href="${u.written}" target="_blank" rel="noopener" class="ac-link">Typed reading ↗</a>` : ''}`
              : `<a href="/track" data-link class="ac-btn ac-btn--outline" onclick="fillAndTrack('${esc(b.orderId)}', '${esc((b.devotee && b.devotee.mobile) || S.cust.mobile || S.cust.email || '')}')"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Track progress</a>`}
          </div>
        </article>`;
      }).join('')}</div>` : emptyCard('fa-file-lines', all.length ? 'No reports match' : 'No reports yet', all.length ? 'Try another filter or search.' : 'Guruji\'s written readings appear here when they are ready.', all.length ? '' : '/services', 'Book a reading')}
      <div class="ac-info-grid">
        <section class="ac-card ac-info"><h3><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Report access</h3>
          <ul><li>Your reports stay here to download any time.</li><li>PDF format, works on phone and computer.</li><li>If Guruji updates a report, the new version replaces the old one.</li></ul></section>
        ${helpCard('Need a past report?', 'Cannot find an older reading? Message us and we will help.')}
      </div>`;
  }

  // ----------------------------------------------------------- Palm images
  function palm() {
    const withPhotos = S.bookings.filter(b => Array.isArray(b.photos) && b.photos.length);
    const needs = S.bookings.filter(b => isPaid(b) && b.type === 'consultation' && !(b.photos && b.photos.length) && !isReady(b));
    const tip = (icon, a, b) => `<li><i class="fa-solid ${icon}" aria-hidden="true"></i><span><strong>${a}</strong><small>${b}</small></span></li>`;
    return `
      <section class="ac-card ac-guide"><h3><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Photo guidelines for an accurate reading</h3>
        <ul>${tip('fa-hand', 'Clear & well lit', 'Whole palm in focus')}${tip('fa-expand', 'Full palm', 'Wrist to fingertips')}${tip('fa-sun', 'Natural light', 'No flash')}${tip('fa-mobile-screen', 'High resolution', 'Up to 6 MB each')}</ul></section>
      ${needs.map(b => `<section class="ac-card ac-upload">
        <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
        <h3>Upload palm images for ${esc(title(b))}</h3>
        <p>Booking ${esc(b.orderId)} · Add clear photos of your left and right palms.</p>
        <div class="ac-upload__btns">
          <label class="ac-btn ac-btn--maroon"><i class="fa-solid fa-upload" aria-hidden="true"></i> Left palm<input type="file" accept="image/*" hidden onchange="AccountUI.upload('${esc(b.orderId)}', 1, this)"></label>
          <label class="ac-btn ac-btn--maroon"><i class="fa-solid fa-upload" aria-hidden="true"></i> Right palm<input type="file" accept="image/*" hidden onchange="AccountUI.upload('${esc(b.orderId)}', 2, this)"></label>
        </div>
      </section>`).join('')}
      ${withPhotos.map(b => `<section class="ac-card ac-photos">
        <header><div><h3>${esc(title(b))}</h3><p class="ac-meta"><span><i class="fa-solid fa-hashtag"></i> ${esc(b.orderId)}</span><span><i class="fa-regular fa-calendar"></i> Submitted ${esc(day(b.photos[0].at))}</span></p></div>
          <span class="ac-pill ac-pill--ok"><i class="fa-solid fa-check"></i> ${isReady(b) ? 'Used for analysis' : 'Images received'}</span></header>
        <div class="ac-photo-grid">${b.photos.map(p => `<figure>
          <span class="ac-photo-tag">${p.via === 'chat' ? 'Sent in chat' : p.slot === 1 ? 'Left palm' : p.slot === 2 ? 'Right palm' : 'Photo ' + esc(p.slot || '')}</span>
          <a href="/api/bookings/${encodeURIComponent(b.orderId)}/photos/${encodeURIComponent(p.id)}" target="_blank" rel="noopener"><img loading="lazy" src="/api/bookings/${encodeURIComponent(b.orderId)}/photos/${encodeURIComponent(p.id)}" alt="${esc(p.slot === 1 ? 'Left palm' : p.slot === 2 ? 'Right palm' : 'Palm photo')}"></a>
          ${isReady(b) || p.via === 'chat' ? '' : `<label class="ac-photo-act"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Replace<input type="file" accept="image/*" hidden onchange="AccountUI.upload('${esc(b.orderId)}', ${Number(p.slot) || 0}, this)"></label>`}
        </figure>`).join('')}</div>
      </section>`).join('')}
      ${!withPhotos.length && !needs.length ? emptyCard('fa-hand', 'No palm images yet', 'After you book a palm reading you can upload your photos here.', '/services', 'Book a palm reading') : ''}`;
  }

  // -------------------------------------------------------------- Payments
  function payments() {
    const all = S.bookings;
    const ok = all.filter(isPaid), pend = all.filter(b => !isPaid(b) && !FAILED.includes(b.status)), bad = all.filter(b => FAILED.includes(b.status));
    const group = (b) => b.type === 'pooja' ? 'pooja' : b.type === 'course' ? 'other' : 'consult';
    const counts = { all: all.length };
    all.forEach(b => { counts[group(b)] = (counts[group(b)] || 0) + 1; });
    const q = S.q.trim().toLowerCase();
    const list = all.filter(b => (S.filter === 'all' || group(b) === S.filter) &&
      (!q || (title(b) + ' ' + b.orderId + ' ' + day(b.createdAt)).toLowerCase().includes(q)));
    const chips = [['all', 'All Transactions', 'fa-layer-group'], ['consult', 'Consultations', 'fa-hand'], ['pooja', 'Puja & Seva', 'fa-fire'], ['other', 'Others', 'fa-ellipsis']]
      .filter(([id]) => id === 'all' || counts[id]);
    const payPill = (b) => FAILED.includes(b.status) ? '<span class="ac-pill ac-pill--bad"><i class="fa-solid fa-xmark"></i> Failed</span>'
      : isPaid(b) ? '<span class="ac-pill ac-pill--ok"><i class="fa-solid fa-check"></i> Payment successful</span>'
      : '<span class="ac-pill ac-pill--wait"><i class="fa-regular fa-clock"></i> Pending</span>';
    return `
      <div class="ac-stats">
        <div class="ac-stat"><i class="fa-solid fa-wallet"></i><strong>${rupees(ok.reduce((n, b) => n + Number(b.amount || 0), 0))}</strong><span>Total payments</span></div>
        <div class="ac-stat ac-stat--ok"><i class="fa-solid fa-check"></i><strong>${ok.length}</strong><span>Successful</span></div>
        <div class="ac-stat ac-stat--wait"><i class="fa-regular fa-clock"></i><strong>${pend.length}</strong><span>Pending</span></div>
        <div class="ac-stat ac-stat--bad"><i class="fa-solid fa-xmark"></i><strong>${bad.length}</strong><span>Failed</span></div>
      </div>
      ${filterBar(chips, counts, 'Search by booking ID, service or date')}
      ${list.length ? `<div class="ac-list">${list.map(b => `
        <article class="ac-card ac-row">
          <span class="ac-thumb ac-thumb--${kind(b)}"><i class="fa-solid ${KIND_ICON[kind(b)]}" aria-hidden="true"></i></span>
          <div class="ac-row__body">
            <h3>${esc(title(b))}</h3>
            <p class="ac-meta"><span><i class="fa-solid fa-hashtag"></i> ${esc(b.orderId)}</span><span><i class="fa-regular fa-calendar"></i> ${esc(dayTime((b.payment && b.payment.paidAt) || b.createdAt))}</span></p>
            <div class="ac-row__pills">${payPill(b)}<strong class="ac-amount">${rupees(b.amount)}</strong></div>
          </div>
          <div class="ac-row__actions">
            ${isPaid(b) ? `<button type="button" class="ac-btn ac-btn--outline" onclick="AccountUI.receipt('${esc(b.orderId)}', this)"><i class="fa-solid fa-download" aria-hidden="true"></i> Receipt (PDF)</button>` : ''}
            ${!isPaid(b) ? `<button type="button" class="ac-btn ac-btn--gold" onclick="resumeHeldBooking()">Pay now</button>` : ''}
            <a href="/track" data-link class="ac-btn ac-btn--outline" onclick="fillAndTrack('${esc(b.orderId)}', '${esc((b.devotee && b.devotee.mobile) || S.cust.mobile || S.cust.email || '')}')"><i class="fa-regular fa-eye" aria-hidden="true"></i> View details</a>
          </div>
        </article>`).join('')}</div>` : emptyCard('fa-receipt', all.length ? 'No payments match' : 'No payments yet', all.length ? 'Try another filter or search.' : 'Your payments appear here after you book.', '', '')}
      <div class="ac-info-grid">
        <section class="ac-card ac-info"><h3><i class="fa-regular fa-file-lines" aria-hidden="true"></i> About your receipt</h3>
          <ul><li>A receipt is available for every successful payment.</li><li>Download it any time from this section.</li><li>Payments are processed securely by Cashfree.</li></ul></section>
        ${helpCard('Need help with a payment?', 'For payment issues, refunds or receipt requests, contact our support team.')}
      </div>`;
  }

  // --------------------------------------------------------------- Profile
  function profile() {
    const c = S.cust;
    const birth = S.bookings.map(b => b.devotee || {}).find(d => d.dob || d.tob || d.pob) || {};
    const row = (icon, label, value) => `<div class="ac-field"><i class="fa-solid ${icon}" aria-hidden="true"></i><span><small>${label}</small><strong>${esc(value || '—')}</strong></span></div>`;
    return `
      <section class="ac-card ac-section">
        <header><h3><i class="fa-regular fa-user" aria-hidden="true"></i> Personal information</h3>
          <button type="button" class="ac-link" onclick="toggleProfileEdit()"><i class="fa-solid fa-pen" aria-hidden="true"></i> <span data-edit-label>Edit</span></button></header>
        <div class="ac-profile">
          <span class="ac-avatar ac-avatar--lg">${esc((c.name || 'S').charAt(0).toUpperCase())}</span>
          <div class="ac-fields">
            ${row('fa-user', 'Name', c.name)}${row('fa-envelope', 'Email', c.email)}
            ${row('fa-phone', 'Mobile', c.mobile ? '+91 ' + c.mobile : 'Added at your first payment')}
            ${row('fa-shield-halved', 'Signed in with', c.provider === 'google' ? 'Google' : 'Email & password')}
          </div>
        </div>
        <form onsubmit="saveCustomerProfile(event, this)" class="hidden ac-form" data-profile-form>
          <label>Full name<input name="name" required minlength="2" value="${esc(c.name || '')}"></label>
          <label>Mobile number<input name="mobile" inputmode="numeric" maxlength="10" value="${esc(c.mobile || '')}" placeholder="Optional"></label>
          <label>Email<input name="email" type="email" value="${esc(c.email || '')}"></label>
          <label class="ac-form__wide">${c.provider === 'google' ? 'Set a password (optional)' : 'New password (optional)'}<input name="password" type="password" minlength="8" autocomplete="new-password" placeholder="${c.provider === 'google' ? 'Add one to also sign in without Google' : 'Leave blank to keep your current password'}"></label>
          <p class="ac-form__wide ac-error hidden" data-profile-error role="alert"></p>
          <div class="ac-form__wide ac-form__btns"><button type="button" class="ac-btn ac-btn--outline" onclick="toggleProfileEdit()">Cancel</button><button type="submit" class="ac-btn ac-btn--maroon">Save changes</button></div>
        </form>
      </section>
      <section class="ac-card ac-section">
        <header><h3><i class="fa-regular fa-calendar" aria-hidden="true"></i> Birth details <small>(for astrology &amp; Kundali)</small></h3></header>
        ${birth.dob || birth.tob || birth.pob ? `<div class="ac-fields ac-fields--3">${row('fa-calendar', 'Date of birth', birth.dob)}${row('fa-clock', 'Time of birth', birth.tob)}${row('fa-location-dot', 'Birth place', birth.pob)}</div>
          <p class="ac-note">From your latest booking. Guruji uses the details given with each consultation.</p>`
          : '<p class="ac-note">You give your birth details with each Kundali or Astro-Palmistry booking.</p>'}
      </section>
      <section class="ac-card ac-section">
        <header><h3><i class="fa-solid fa-lock" aria-hidden="true"></i> Account &amp; security</h3></header>
        <button type="button" class="ac-line" onclick="toggleProfileEdit()"><i class="fa-solid fa-key" aria-hidden="true"></i><span>${c.provider === 'google' ? 'Set a password' : 'Change password'}</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
        <button type="button" class="ac-line" onclick="AccountUI.go('payments')"><i class="fa-solid fa-receipt" aria-hidden="true"></i><span>Payments &amp; receipts</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
        <button type="button" class="ac-line" onclick="handleCustomerLogout()"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i><span>Sign out of this device</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
      </section>
      <div class="ac-info-grid">
        <a href="/privacy-policy" data-link class="ac-card ac-tile"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span><strong>Privacy &amp; Terms</strong><small>Privacy Policy, Terms of Service and Disclaimer.</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>
        <button type="button" class="ac-card ac-tile" onclick="AccountUI.exportData()"><i class="fa-solid fa-download" aria-hidden="true"></i><span><strong>Data &amp; account</strong><small>Download your data. To delete your account, contact support.</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
      </div>`;
  }

  // ---------------------------------------------------------------- shared
  function filterBar(chips, counts, placeholder) {
    return `<div class="ac-filter">
      <div class="ac-chips">${chips.map(([id, label, icon]) => `<button type="button" class="${S.filter === id ? 'is-active' : ''}" onclick="AccountUI.filter('${id}')"><i class="fa-solid ${icon}" aria-hidden="true"></i> ${label} (${counts[id] || 0})</button>`).join('')}</div>
      <label class="ac-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" value="${esc(S.q)}" placeholder="${esc(placeholder)}" oninput="AccountUI.search(this.value)" aria-label="${esc(placeholder)}"></label>
    </div>`;
  }
  function emptyCard(icon, h, p, href, cta) {
    return `<section class="ac-card ac-empty"><i class="fa-regular ${icon}" aria-hidden="true"></i><h3>${h}</h3><p>${p}</p>${href ? `<a href="${href}" data-link class="ac-btn ac-btn--gold">${cta}</a>` : ''}</section>`;
  }
  function helpCard(h, p) {
    const wa = (window.SITE && window.SITE.content && window.SITE.content.settings && window.SITE.content.settings.whatsapp) || '918977625078';
    return `<section class="ac-card ac-help"><h3><i class="fa-solid fa-headset" aria-hidden="true"></i> ${h}</h3><p>${p}</p>
      <a class="ac-btn ac-btn--maroon" target="_blank" rel="noopener" href="https://wa.me/${String(wa).replace(/\D/g, '')}?text=${encodeURIComponent('Namaste, I need help with my Guruji Palmistry account.')}"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Contact support</a></section>`;
  }

  // ---------------------------------------------------------------- actions
  let searchTimer = null;
  const api = {
    render, go,
    filter(id) { S.filter = id; draw(); },
    search(v) {
      S.q = v; clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const el = S.container.querySelector('.ac-search input');
        const pos = el ? el.selectionStart : 0;
        draw();
        const again = S.container.querySelector('.ac-search input');
        if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } }
      }, 200);
    },

    /** Asks Guruji for a live session: a message in the booking's chat, which
     *  Guruji already sees on the case and in his inbox. */
    async requestLive(orderId, btn) {
      const b = S.bookings.find(x => x.orderId === orderId);
      if (!b) return;
      btn.disabled = true;
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(orderId)}/messages`, {
          method: 'POST',
          headers: custHeaders(S.token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ mobile: (b.devotee && b.devotee.mobile) || S.cust.mobile, text: '🙏 Namaste Guruji, I would like to join a live session with you for my ' + title(b) + ' (' + orderId + '). Please let me know a suitable time.' })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not send the request.');
        b._liveAsked = true;
        if (typeof showVedicToast === 'function') showVedicToast('Request sent. Guruji will reply in your messages.', 'success');
        draw();
      } catch (err) {
        btn.disabled = false;
        if (typeof showVedicToast === 'function') showVedicToast(err.message, 'error');
      }
    },

    async upload(orderId, slot, input) {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 6 * 1024 * 1024) { showVedicToast('Photos must be 6 MB or smaller.', 'error'); return; }
      const b = S.bookings.find(x => x.orderId === orderId);
      const data = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
      const label = input.closest('label');
      if (label) label.classList.add('is-busy');
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(orderId)}/photos`, {
          method: 'POST',
          headers: custHeaders(S.token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ mobile: (b && b.devotee && b.devotee.mobile) || S.cust.mobile, slot, type: file.type, name: file.name, data })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error || 'Upload failed.');
        if (b) b.photos = (b.photos || []).filter(p => p.slot !== out.photo.slot).concat([out.photo]).sort((x, y) => (x.slot || 0) - (y.slot || 0));
        showVedicToast('Photo saved. Guruji will see it on your case.', 'success');
        draw();
      } catch (err) {
        if (label) label.classList.remove('is-busy');
        showVedicToast(err.message, 'error');
      }
    },

    /** A payment receipt, made in the browser from the booking record. */
    async receipt(orderId, btn) {
      const b = S.bookings.find(x => x.orderId === orderId);
      if (!b) return;
      btn.disabled = true;
      const lib = typeof loadJsPdf === 'function' ? await loadJsPdf() : window.jspdf;
      btn.disabled = false;
      if (!lib) { showVedicToast('Could not load the PDF maker. Check your connection and try again.', 'error'); return; }
      const doc = new lib.jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      doc.setFillColor(107, 29, 54); doc.rect(0, 0, W, 90, 'F');
      doc.setTextColor(247, 217, 160); doc.setFont('times', 'bold'); doc.setFontSize(24); doc.text('Guruji Palmistry', 40, 52);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text('Palmistry · Astrology · Spiritual Guidance', 40, 72);
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text('PAYMENT RECEIPT', W - 40, 56, { align: 'right' });
      doc.setTextColor(40, 30, 30); doc.setFontSize(11);
      const rows = [
        ['Receipt for booking', b.orderId],
        ['Date of payment', dayTime((b.payment && b.payment.paidAt) || b.updatedAt || b.createdAt)],
        ['Received from', (b.devotee && b.devotee.name) || S.cust.name || ''],
        ['Mobile', (b.devotee && b.devotee.mobile) ? '+91 ' + b.devotee.mobile : ''],
        ['Email', (b.devotee && b.devotee.email) || S.cust.email || ''],
        ['Service', title(b)],
        ['Payment method', 'Online (Cashfree)' + (b.payment && b.payment.reference ? ' · Ref ' + b.payment.reference : '')],
        ['Status', 'Paid']
      ].filter(r => r[1]);
      let y = 140;
      rows.forEach(([k, v]) => {
        doc.setFont('helvetica', 'bold'); doc.text(k, 40, y);
        doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(String(v), W - 260), 220, y);
        y += 26;
      });
      doc.setDrawColor(200, 170, 120); doc.line(40, y, W - 40, y); y += 34;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('Amount paid', 40, y);
      doc.text('INR ' + Number(b.amount || 0).toLocaleString('en-IN') + '.00', W - 40, y, { align: 'right' });
      y += 50;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110, 100, 100);
      doc.text(doc.splitTextToSize('This receipt confirms a payment received by Guruji Palmistry for the service above. It was generated from your account at gurujipalmistry.org. For questions, refunds or a tax invoice, please contact support.', W - 80), 40, y);
      doc.save(`Receipt_${b.orderId}.pdf`);
    },

    exportData() {
      const data = { exportedAt: new Date().toISOString(), account: S.cust, bookings: S.bookings };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = 'guruji-palmistry-my-data.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    }
  };

  window.AccountUI = api;
})();
