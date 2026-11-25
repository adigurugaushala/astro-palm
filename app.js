// GURUJI - Production Application Controller

// Seeker Session & Booking State
const state = {
  currentPage: "home",
  selectedService: {
    id: "palmistry_reading",
    title: "Detailed Palm Analysis",
    price: 549,
    duration: "30 Mins"
  },
  handedness: "Right-handed",
  selectedDate: "",
  selectedDateISO: "",
  selectedTime: "",
  slotTimerSeconds: 600, // 10 minutes hold
  slotTimerInterval: null,
  isSlotHeld: true,
  // Starts empty: these are filled from the seeker's own sign-in and forms.
  // (Sample values here once leaked into real bookings and the payment page.)
  user: { name: "", email: "", mobile: "", gotram: "", dob: "", tob: "", pob: "", questions: "" },
  orderId: "GURUJI-PLM-7843",
  paymentStatus: "PENDING",
  uploadedPhotos: [
    "/assets/hand_guide_2_left.jpg",
    "/assets/hand_guide_3_right.jpg",
    "/assets/hand_guide_side.svg",
    "/assets/hand_guide_5_back.jpg"
  ],
  chatMessages: [
    { sender: "user", time: "10:32 AM", text: "Namaste Guruji 🙏 I have uploaded my hand images. Please analyse and guide me about my career and future." },
    { sender: "guru", time: "10:40 AM", text: "Namaste, I have received your details and hand images. I am analysing your palm lines now. Please give me some time. I will share a detailed reading shortly. 🙏" },
    { sender: "user", time: "10:41 AM", isImages: true, text: "5 Images • 8.4 MB" },
    { sender: "guru", time: "11:24 AM", isAudio: true, duration: "2:18", text: "Audio blessing from Guruji" }
  ],
  isAudioPlaying: false,
  audioInterval: null,
  reviewRating: 5
};

// =========================================================================
// SLOT PERSISTENCE ENGINE (Protects seeker appointment slot across reloads & auth)
// =========================================================================
function persistHeldSlot() {
  try {
    sessionStorage.setItem("guruji_held_slot", JSON.stringify({
      service: state.selectedService,
      date: state.selectedDate,
      time: state.selectedTime,
      dateISO: state.selectedDateISO,
      handedness: state.handedness,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

function restoreHeldSlot() {
  try {
    const raw = sessionStorage.getItem("guruji_held_slot");
    if (!raw) return;
    const held = JSON.parse(raw);
    if (!held || Date.now() - (held.timestamp || 0) > 45 * 60 * 1000) return;
    if (held.service) state.selectedService = held.service;
    if (held.date) state.selectedDate = held.date;
    if (held.time) state.selectedTime = held.time;
    if (held.dateISO) state.selectedDateISO = held.dateISO;
    if (held.handedness) state.handedness = held.handedness;

    const authSlotInfo = document.getElementById("auth-slot-held-info");
    if (authSlotInfo) authSlotInfo.innerText = `${state.selectedDate} at ${state.selectedTime}`;
    const timeDisplay = document.getElementById("consult-summary-time");
    if (timeDisplay) timeDisplay.innerText = `${state.selectedDate}, ${state.selectedTime}`;
    const failSlotTime = document.getElementById("fail-slot-time");
    if (failSlotTime) failSlotTime.innerText = `${state.selectedDate} at ${state.selectedTime}`;
    const payTitle = document.getElementById("pay-service-title");
    if (payTitle && state.selectedService?.title) payTitle.innerText = state.selectedService.title;
    const payAmount = document.getElementById("pay-amount-display");
    if (payAmount && state.selectedService?.price) payAmount.innerText = `₹ ${state.selectedService.price}`;
  } catch (e) {}
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  restoreHeldSlot();
  renderReviews();
  loadSavedReviews();
  renderLinesAccordion();
  if (typeof renderPoojaCards === 'function') renderPoojaCards();
  renderCalendarDays();
  updatePoojaSummaryUI();
  updateConsultSummary();
  initMantrasLibrary();

  // Handedness Selector Listeners
  document.querySelectorAll("input[name='consult-handedness']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      state.handedness = e.target.value;
      const handDisplay = document.getElementById("consult-summary-hand");
      if (handDisplay) handDisplay.innerText = state.handedness;
    });
  });

  // Show home page on startup
  showPage("home");
});

// ==========================================
// NATURAL WEBSITE PAGE NAVIGATION
// ==========================================

/** True once the seeker has registered or signed in (token kept by /api/customer/register). */
function isCustomerSignedIn() {
  try { return Boolean(localStorage.getItem("guruji_cust_token")); } catch (e) { return false; }
}

function showPage(pageId) {
  if (!document.getElementById(`page-${pageId}`)) {
    console.warn(`Unknown page "${pageId}", showing home instead.`);
    pageId = "home";
  }

  // Login first: the consultation booking flow needs a signed-in seeker.
  if (pageId === "book-consultation" && !isCustomerSignedIn()) pageId = "book-auth";

  state.currentPage = pageId;
  closeMobileMenu();
  if (pageId === "book-pooja") initPoojaDatePicker();
  if (pageId === "book-status") prepareTrackPage();
  if (pageId === "book-upload") applyBirthDetailVisibility();

  // Hide all views
  document.querySelectorAll(".page-view").forEach(el => {
    el.classList.add("hidden");
  });

  // Display target page
  const target = document.getElementById(`page-${pageId}`);
  if (target) {
    target.classList.remove("hidden");
  }

  // Track Status has its own header button
  const trackBtn = document.getElementById("header-track-btn");
  if (trackBtn) {
    const on = pageId === "book-status";
    trackBtn.classList.toggle("is-active", on);
    on ? trackBtn.setAttribute("aria-current", "page") : trackBtn.removeAttribute("aria-current");
  }

  // Update Header Navigation Active Links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("nav-pill-active");
    link.removeAttribute("aria-current");
  });

  if (pageId === "home") {
    document.getElementById("nav-home")?.classList.add("nav-pill-active");
  } else if (pageId === "palmistry") {
    document.getElementById("nav-palmistry")?.classList.add("nav-pill-active");
  } else if (pageId.startsWith("book-consultation") || pageId.startsWith("book-pooja") || pageId.startsWith("book-service") || pageId.startsWith("book-datetime")) {
    document.getElementById("nav-services")?.classList.add("nav-pill-active");
  } else if (pageId === "mantras" || pageId === "mantra-detail" || pageId.startsWith("resource-")) {
    document.getElementById("nav-resources")?.classList.add("nav-pill-active");
    if (pageId === "mantras") {
      renderMantrasLibrary();
    }
  }

  // Header Slot Timer Pill Visibility (Active during booking steps)
  const timerBadge = document.getElementById("slot-timer-container");
  if (timerBadge) {
    if ((pageId === "book-consultation" || pageId === "book-pooja" || pageId === "book-datetime" || pageId === "book-auth" || pageId === "book-payment") && state.isSlotHeld) {
      timerBadge.classList.remove("hidden");
      timerBadge.classList.add("flex");
    } else {
      timerBadge.classList.add("hidden");
    }
  }

  document.querySelector(".nav-link.nav-pill-active")?.setAttribute("aria-current", "page");

  // Smooth scroll to top of window
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// SERVER API
// ==========================================

/**
 * Calls the JSON API. Returns the parsed body on success.
 * Throws Error(message) when the server rejects the request (validation etc.).
 * Returns null when the page runs without the server (offline / file://),
 * so the site keeps working as a demo.
 */
async function api(path, { method = "GET", body } = {}) {
  if (!window.location.protocol.startsWith("http")) return null;
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    return null; // network down / server not running
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function showOrderId(orderId) {
  state.orderId = orderId;
  document.querySelectorAll("[data-order-id]").forEach(el => (el.textContent = orderId));
}

/** What the server needs to create the current booking. */
function currentBookingRequest() {
  if (state.selectedService.id === "pooja_sevas") {
    return {
      type: "pooja",
      poojaIds: selectedPoojas.map(p => p.id),
      poojaDate: state.pooja.date,
      poojaSlot: state.pooja.slot && state.pooja.slot.id,
      prasadam: state.pooja.prasadam || { deliver: false },
      devotee: { name: state.user.name, mobile: state.user.mobile, gotram: state.user.gotram, dob: state.user.dob },
      consent: Boolean(state.payConsent)
    };
  }
  return {
    type: "consultation",
    serviceId: state.selectedService.id,
    handedness: state.handedness,
    slot: { date: state.selectedDate, time: state.selectedTime, iso: state.selectedDateISO || '' },
    devotee: { name: state.user.name, mobile: state.user.mobile, email: state.user.email },
    consent: Boolean(state.payConsent)
  };
}

/** Creates the booking in the database once per distinct selection. */
async function ensureBooking() {
  const request = currentBookingRequest();
  const key = JSON.stringify(request);
  if (state.booking && state.bookingKey === key) return state.booking;
  const data = await api("/api/bookings", { method: "POST", body: request });
  if (!data) return null; // offline demo mode
  state.booking = data.booking;
  state.bookingKey = key;
  showOrderId(data.booking.orderId);
  rememberBooking(data.booking);
  return data.booking;
}

// ==========================================
// TRACK STATUS
// ==========================================

const LAST_BOOKING_KEY = "guruji_last_booking";
function rememberBooking(b) {
  try { localStorage.setItem(LAST_BOOKING_KEY, JSON.stringify({ orderId: b.orderId, mobile: b.devotee.mobile })); } catch (e) {}
}

/** Pre-fills the lookup with the seeker's latest booking (this session, or saved on this device). */
function prepareTrackPage() {
  let last = state.booking ? { orderId: state.booking.orderId, mobile: state.booking.devotee.mobile } : null;
  if (!last) { try { last = JSON.parse(localStorage.getItem(LAST_BOOKING_KEY) || "null"); } catch (e) {} }
  if (!last) return;
  document.getElementById("track-order").value = last.orderId;
  document.getElementById("track-mobile").value = last.mobile;
  if (state.booking && state.booking.orderId === last.orderId) renderTrackedBooking(state.booking);
  trackBooking(null, { quiet: true });
}

async function trackBooking(event, { quiet = false } = {}) {
  if (event) event.preventDefault();
  const orderEl = document.getElementById("track-order");
  orderEl.value = orderEl.value.trim().toUpperCase();
  // Bookings look like GURUJI-PJA-ABC12F3, enquiries like GPE-ABC12F3
  const isEnquiry = /^GPE-[A-Z0-9]{4,}$/.test(orderEl.value);
  VALIDATORS.orderId = (v) => /^(GURUJI-[A-Z]{3}|GPE)-[A-Z0-9]{4,}$/.test(v.trim().toUpperCase());
  
  const contactVal = (document.getElementById("track-mobile")?.value || "").trim();
  const isEmail = contactVal.includes("@");
  
  VALIDATORS.contact = (v) => {
    const val = v.trim();
    if (val.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const digits = val.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
  };

  if (!validateFields([
    { id: "track-order", rule: "orderId", msg: "Enter the reference from your confirmation, e.g. GURUJI-PJA-ABC12F3 or GPE-ABC12F3." },
    { id: "track-mobile", rule: "contact", msg: "Enter the 10-digit mobile number or email address you booked with." }
  ])) return;

  const btn = document.getElementById("track-submit");
  if (!quiet) setButtonLoading(btn, true, "Checking…");
  try {
    const path = isEnquiry ? "/api/enquiries/" : "/api/bookings/";
    const queryParam = isEmail ? `email=${encodeURIComponent(contactVal.toLowerCase())}` : `mobile=${encodeURIComponent(contactVal.replace(/\D/g, ""))}`;
    const data = await api(`${path}${encodeURIComponent(orderEl.value)}?${queryParam}`);
    if (!data) { if (!quiet) showVedicToast("Tracking needs an internet connection to Guruji's server.", "error"); return; }
    if (isEnquiry) {
      renderTrackedEnquiry(data.enquiry);
    } else {
      rememberBooking(data.booking);
      renderTrackedBooking(data.booking);
    }
  } catch (err) {
    if (!quiet) {
      document.getElementById("track-result").classList.add("hidden");
      showVedicToast(/not found/i.test(err.message) ? "Nothing matches that reference and contact details." : err.message, "error");
    }
  } finally {
    if (!quiet) setButtonLoading(btn, false);
  }
}

const ENQUIRY_STATUS_LABELS = {
  NEW: ["Received — we will contact you", "bg-amber-100 text-amber-800"],
  CONTACTED: ["We have been in touch", "bg-sky-100 text-sky-800"],
  CONFIRMED: ["Confirmed", "bg-emerald-100 text-emerald-800"],
  COMPLETED: ["Completed", "bg-emerald-100 text-emerald-800"],
  CLOSED: ["Closed", "bg-zinc-200 text-zinc-700"],
  CANCELLED: ["Cancelled", "bg-zinc-200 text-zinc-700"]
};

function renderTrackedEnquiry(e) {
  const box = document.getElementById("track-result");
  const [label, tone] = ENQUIRY_STATUS_LABELS[e.status] || [e.status, "bg-zinc-200 text-zinc-700"];
  const row = (k, v) => v ? `<div class="flex justify-between gap-4 px-4 py-3"><dt class="text-ink-3">${k}</dt><dd class="font-medium text-ink text-right">${escapeHTML(String(v))}</dd></div>` : "";
  const when = [e.preferredDate, e.preferredTime].filter(Boolean).join(" · ");
  box.innerHTML = `
    <div class="rounded-2xl border border-line bg-white shadow-sm overflow-hidden">
      <div class="px-5 py-4 bg-night text-cream flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div class="text-2xs uppercase tracking-[0.2em] text-gold-soft font-semibold">Enquiry</div>
          <div class="font-mono text-lg">${escapeHTML(e.reference)}</div>
        </div>
        <span class="px-3 py-1.5 rounded-full text-xs font-semibold ${tone}">${label}</span>
      </div>
      <dl class="text-sm divide-y divide-line">
        ${row("Service", e.service && e.service.title)}
        ${row("Type", e.consultationType)}
        ${row("Preferred", when)}
        ${row("Online / in person", e.mode)}
        ${row("Sent on", new Date(e.createdAt).toLocaleString("en-IN"))}
      </dl>
      <p class="px-5 py-4 text-sm text-ink-2 border-t border-line">An enquiry is not a confirmed appointment. We will contact you on the number you gave us; if it is urgent, message us on WhatsApp.</p>
    </div>`;
  box.classList.remove("hidden");
}

const STATUS_LABELS = {
  PENDING_PAYMENT: ["Awaiting payment", "bg-amber-100 text-amber-800"],
  SCHEDULED: ["Scheduled", "bg-sky-100 text-sky-800"],
  AWAITING_REPORT: ["Guruji is preparing your reading", "bg-sky-100 text-sky-800"],
  PAYMENT_FAILED: ["Payment failed", "bg-rose-100 text-rose-800"],
  PAID: ["Payment confirmed", "bg-emerald-100 text-emerald-800"],
  DETAILS_RECEIVED: ["In progress", "bg-sky-100 text-sky-800"],
  COMPLETED: ["Completed", "bg-emerald-100 text-emerald-800"],
  CANCELLED: ["Cancelled", "bg-zinc-200 text-zinc-700"]
};

const courseDoneCount = (b) => Object.keys((b.course && b.course.lessons) || {}).length;
function courseProgressText(b) {
  const done = courseDoneCount(b);
  return done ? `${done} lesson${done === 1 ? "" : "s"} finished` : "Nothing finished yet";
}

function renderTrackedBooking(b) {
  const box = document.getElementById("track-result");
  const isPooja = b.type === "pooja";
  const isCourse = b.type === "course";
  const level = { PENDING_PAYMENT: 1, PAYMENT_FAILED: 1, PAID: 2, DETAILS_RECEIVED: 3, SCHEDULED: 3, AWAITING_REPORT: 3, COMPLETED: 4, CANCELLED: 1 }[b.status] || 1;
  const steps = isPooja
    ? [["Booked", "Order created"], ["Payment confirmed", "Seva reserved"],
       ["Pooja scheduled", b.poojaDate ? `${formatPoojaDate(b.poojaDate)} · ${b.poojaSlot.label}` : ""],
       ["Pooja performed", b.prasadam && b.prasadam.deliver ? "Prasadam dispatched" : "Blessings shared"]]
    : isCourse
    ? [["Enrolled", "Place confirmed"], ["Lessons open", "Start any time"],
       ["In progress", courseProgressText(b)], ["Course complete", "Every lesson done"]]
    : [["Booked", "Order created"], ["Payment confirmed", "Slot confirmed"],
       ["Details received", "Birth details & palm photos"], ["Reading completed", "Report ready"]];
  // a paid pooja is already scheduled for its date
  const done = isPooja && level >= 2 ? Math.max(level, 3) : isCourse && level >= 2 && courseDoneCount(b) > 0 ? Math.max(level, 3) : level;
  const failed = b.status === "PAYMENT_FAILED" || b.status === "CANCELLED";
  const [label, cls] = STATUS_LABELS[b.status] || [b.status, "bg-zinc-100 text-zinc-700"];
  const when = isPooja ? `${formatPoojaDate(b.poojaDate)} · ${b.poojaSlot.label}`
    : isCourse ? (b.service && b.service.duration) || ""
    : [b.slot && b.slot.date, b.slot && b.slot.time].filter(Boolean).join(" at ");
  const what = isPooja ? b.poojas.map(p => p.name).join(", ") : b.service.title;
  const addr = isPooja && b.prasadam && b.prasadam.deliver && b.prasadam.address
    ? `${b.prasadam.address.city}, ${b.prasadam.address.state} – ${b.prasadam.address.pincode}` : (isPooja ? "Not requested" : "");
  const pct = failed ? 0 : ((done - 1) / (steps.length - 1)) * 100;

  let action = "";
  if (failed) action = `<button onclick="showPage('${isPooja ? "book-pooja" : "book-consultation"}')" class="bk-cta !mt-0 !w-auto px-6 !h-11 !text-[15.5px]">Book again</button>`;
  else if (isCourse) action = `<a href="/learn/${encodeURIComponent(b.orderId)}" data-link class="bk-cta !mt-0 !w-auto px-6 !h-11 !text-[15.5px] inline-flex items-center">Open your lessons</a>`;
  else if (!isPooja && b.status === "PAID") action = `<button onclick="showPage('book-upload')" class="bk-cta !mt-0 !w-auto px-6 !h-11 !text-[15.5px]">Upload palm photos</button>`;

  box.innerHTML = `
    <div class="bg-white p-6 sm:p-8 rounded-2xl border border-line shadow-sm space-y-7">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="text-xs uppercase tracking-[0.18em] text-ink-3 font-semibold">${isPooja ? "Pooja Seva" : isCourse ? "Course" : "Consultation"}</div>
          <div class="font-mono text-lg font-bold text-ink mt-1">${escapeHTML(b.orderId)}</div>
        </div>
        <span class="px-3 py-1.5 rounded-full text-sm font-semibold ${cls}">${escapeHTML(label)}</span>
      </div>

      <div class="relative">
        <div class="absolute left-5 right-5 top-5 h-1 rounded-full bg-line"></div>
        <div class="absolute left-5 top-5 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all" style="width: calc((100% - 2.5rem) * ${pct / 100})"></div>
        <ol class="relative grid grid-cols-4 gap-2 text-center">
          ${steps.map(([t, sub], i) => {
            const n = i + 1, isDone = !failed && n <= done, isNext = !failed && n === done + 1;
            return `<li class="flex flex-col items-center">
              <span class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${isDone ? "bg-emerald-600 text-white" : isNext ? "bg-amber-500 text-white ring-4 ring-amber-200" : "bg-white border-2 border-line text-ink-3"}">${isDone ? '<i class="fa-solid fa-check"></i>' : n}</span>
              <span class="mt-2 text-xs sm:text-sm font-semibold text-ink">${escapeHTML(t)}</span>
              <span class="text-2xs sm:text-xs text-ink-3 mt-0.5">${escapeHTML(sub)}</span>
            </li>`;
          }).join("")}
        </ol>
      </div>

      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-[15.5px] border-t border-line pt-6">
        <div><dt class="text-ink-3 text-sm">${isPooja ? "Poojas" : isCourse ? "Course" : "Service"}</dt><dd class="font-semibold text-ink">${escapeHTML(what)}</dd></div>
        <div><dt class="text-ink-3 text-sm">${isPooja ? "Pooja date & slot" : isCourse ? "Lessons" : "Consultation slot"}</dt><dd class="font-semibold text-ink">${escapeHTML(when || "—")}</dd></div>
        <div><dt class="text-ink-3 text-sm">Seeker</dt><dd class="font-semibold text-ink">${escapeHTML(b.devotee.name)}${b.devotee.gotram ? ` · ${escapeHTML(b.devotee.gotram)}` : ""}</dd></div>
        <div><dt class="text-ink-3 text-sm">Amount</dt><dd class="font-semibold text-ink">₹ ${Number(b.amount).toLocaleString("en-IN")}</dd></div>
        ${isPooja ? `<div class="sm:col-span-2"><dt class="text-ink-3 text-sm">Prasadam delivery</dt><dd class="font-semibold text-ink">${escapeHTML(addr)}</dd></div>` : ""}
      </dl>
      ${action ? `<div class="flex justify-end">${action}</div>` : ""}
    </div>
    <div id="track-live"></div>`;
  box.classList.remove("hidden");
  showOrderId(b.orderId);
  // the session link, the chat, the chart and the reading (site.js)
  if (typeof renderBookingExtras === "function") renderBookingExtras(b);
}

/** Shrinks a photo before upload. A phone picture is often 4-8 MB, far more
 *  than anyone needs to read a palm line, and the slow upload is what makes
 *  people abandon the form. 2000px on the long edge keeps the lines crisp
 *  under Guruji's zoom while cutting the file to a fraction of its size. */
function shrinkPhoto(file, maxEdge = 2000, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      // A palm photo is a photograph, so JPEG beats PNG by a wide margin here.
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ type: "image/jpeg", data: dataUrl.replace(/^data:[^,]+,/, "") });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That photo could not be read.")); };
    img.src = url;
  });
}

/** Sends the palm photos themselves, not just their names. Runs before the
 *  details are submitted, so a failure here stops the form with a message
 *  rather than silently recording a reading with no hands to read. */
async function uploadHandPhotos(orderId, mobile, onProgress) {
  const entries = Object.entries(state.handPhotos);
  let done = 0;
  for (const [slot, file] of entries) {
    if (onProgress) onProgress(++done, entries.length);
    const { type, data } = await shrinkPhoto(file);
    await api(`/api/bookings/${encodeURIComponent(orderId)}/photos`, {
      method: "POST",
      body: { mobile, slot: Number(slot), name: file.name, type, data }
    });
  }
  return entries.length;
}

async function updateBooking(event, extra = {}) {
  if (!state.booking) return null;
  const data = await api(`/api/bookings/${encodeURIComponent(state.booking.orderId)}`, {
    method: "PATCH",
    body: { event, mobile: state.booking.devotee.mobile, ...extra }
  });
  if (data) state.booking = data.booking;
  return data;
}

/** Puts reviews saved in the database above the built-in testimonials. */
async function loadSavedReviews() {
  try {
    const data = await api("/api/reviews");
    if (!data || !data.reviews.length) return;
    const known = new Set(GURUJI_DATA.reviews.map(r => String(r.id)));
    const fresh = data.reviews.filter(r => !known.has(String(r.id))).map(r => ({
      id: r.id, name: r.name, location: r.location, rating: r.rating, comment: r.comment,
      consultation: r.consultation, verified: r.verified,
      date: new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    }));
    GURUJI_DATA.reviews.unshift(...fresh);
    renderReviews();
  } catch (e) { /* keep the built-in testimonials */ }
}

// ==========================================
// MOBILE MENU
// ==========================================

function toggleMobileMenu(force) {
  const menu = document.getElementById("mobile-menu");
  const btn = document.getElementById("mobile-menu-btn");
  if (!menu || !btn) return;
  const open = typeof force === "boolean" ? force : menu.classList.contains("is-closed");
  menu.classList.toggle("is-closed", !open);
  btn.setAttribute("aria-expanded", String(open));
  btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  btn.innerHTML = open ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
}

function closeMobileMenu() { toggleMobileMenu(false); }

function mobileNav(action) {
  closeMobileMenu();
  if (typeof action === "function") action();
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeMobileMenu();
  // Close whichever modal is open
  document.querySelectorAll(".fixed.inset-0:not(.hidden)").forEach(m => {
    if (m.id && m.id.endsWith("-modal")) m.classList.add("hidden");
  });
});

// ==========================================
// PALMISTRY TOPIC BAR & EXPLORE CARDS
// ==========================================

const PALM_TOPICS = {
  "overview":      { page: "home",      anchor: "overview-explore-section" },
  "overview-page": { page: "palmistry", anchor: "palm-intro" },
  "hand-types":    { page: "palmistry", anchor: "palm-hand-types" },
  "lines":         { page: "palmistry", anchor: "palm-lines" },
  "mounts":        { page: "palmistry", anchor: "palm-mounts" },
  "fingers":       { page: "palmistry", anchor: "palm-fingers" }
};

function openPalmTopic(btn, topic) {
  if (btn) switchTab(btn, topic);
  if (topic === "learn") {
    openCourseModal("palmistry");
    return;
  }
  const t = PALM_TOPICS[topic];
  if (!t) return;
  if (state.currentPage !== t.page) showPage(t.page);
  setTimeout(() => document.getElementById(t.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 140);
}

// ==========================================
// FORM VALIDATION HELPERS
// ==========================================

const VALIDATORS = {
  required: (v) => v.trim().length > 0,
  name: (v) => v.trim().length >= 2,
  mobile: (v) => /^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(v.trim()),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  emailOrMobile: (v) => VALIDATORS.email(v) || VALIDATORS.mobile(v)
};

/** Validates [{id, rule, msg}] — marks invalid fields inline and focuses the first one. */
function validateFields(rules) {
  let firstBad = null;
  rules.forEach(({ id, rule, msg }) => {
    const el = document.getElementById(id);
    if (!el) return;
    document.querySelector(`.field-error-msg[data-for="${id}"]`)?.remove();
    el.classList.remove("field-error");
    el.removeAttribute("aria-invalid");
    if (!VALIDATORS[rule](el.value || "")) {
      el.classList.add("field-error");
      el.setAttribute("aria-invalid", "true");
      const m = document.createElement("p");
      m.className = "field-error-msg";
      m.dataset.for = id;
      m.textContent = msg;
      const anchor = el.closest(".relative") || (getComputedStyle(el.parentElement).display.includes("flex") ? el.parentElement : el);
      anchor.insertAdjacentElement("afterend", m);
      if (!firstBad) firstBad = el;
    }
  });
  if (firstBad) firstBad.focus({ preventScroll: false });
  return !firstBad;
}

// Clear a field's error as soon as the user edits it
document.addEventListener("input", (e) => {
  const el = e.target;
  if (!el.classList || !el.classList.contains("field-error")) return;
  el.classList.remove("field-error");
  el.removeAttribute("aria-invalid");
  document.querySelector(`.field-error-msg[data-for="${el.id}"]`)?.remove();
});

/** Puts a button into a loading state for the duration of an async action (prevents double submits). */
function setButtonLoading(btn, loading, label) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${label || "Please wait…"}</span>`;
  } else {
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
}

function goToSection(sectionId) {
  showPage("home");
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, 120);
}

function startBooking() {
  // The booking page no longer offers a choice of service, so a seeker who has
  // not picked one starts at the services list rather than being sent in with
  // whatever happened to be selected.
  if (typeof navigate === "function") return navigate("/services");
  showPage("services");
}

function selectServiceAndStart(serviceId) {
  selectConsultationService(serviceId, serviceId === 'combined_consultation' ? 10 : 549);
  showPage("book-consultation");
}

function switchTab(btn, tabId) {
  document.querySelectorAll('.subnav-tab').forEach(t => {
    t.classList.remove('active', 'bg-maroon', 'text-cream', 'shadow-sm');
    t.classList.add('text-ink', 'hover:bg-line');
    const svg = t.querySelector('svg');
    if (svg) svg.classList.remove('text-gold');
  });

  if (btn) {
    btn.classList.add('active', 'bg-maroon', 'text-cream', 'shadow-sm');
    btn.classList.remove('text-ink', 'hover:bg-line');
    const activeSvg = btn.querySelector('svg');
    if (activeSvg) activeSvg.classList.add('text-gold');
  }
}

// ==========================================
// 10-MINUTE SLOT HOLD COUNTDOWN TIMER
// ==========================================

function startSlotTimer() {
  if (state.slotTimerInterval) clearInterval(state.slotTimerInterval);

  state.slotTimerInterval = setInterval(() => {
    if (state.slotTimerSeconds > 0) {
      state.slotTimerSeconds--;
      updateSlotTimerDisplays();
    } else {
      clearInterval(state.slotTimerInterval);
      state.slotTimerInterval = null;
      state.isSlotHeld = false;
      state.slotTimerSeconds = 600;
      updateSlotTimerDisplays();
      document.getElementById("slot-timer-container")?.classList.add("hidden");
      if (state.currentPage === "book-payment") {
        showPage(state.selectedService.id === "pooja_sevas" ? "book-pooja" : "book-consultation");
      }
      showVedicToast("Your 10-minute slot hold expired. Please choose your slot again.", "error");
    }
  }, 1000);
}

function updateSlotTimerDisplays() {
  const mins = Math.floor(state.slotTimerSeconds / 60);
  const secs = state.slotTimerSeconds % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const displays = [
    document.getElementById("slot-timer-display"),
    document.getElementById("slot-timer-inner"),
    document.getElementById("fail-slot-timer")
  ];

  displays.forEach(d => {
    if (d) d.innerText = timeString;
  });
}

// ==========================================
// REVIEWS RENDERER
// ==========================================

/**
 * A palm reading is taken from the hands, so the chart fields (time and place
 * of birth, and the co-ordinates derived from them) are not asked for there.
 */
function applyBirthDetailVisibility() {
  const id = (state.selectedService && state.selectedService.id) || '';
  const palmOnly = id === 'palmistry_reading';
  document.querySelectorAll('[data-birth-detail]').forEach(el => el.classList.toggle('hidden', palmOnly));
}

function renderReviews() {
  const container = document.getElementById("reviews-container");
  if (!container || !GURUJI_DATA.reviews) return;

  container.innerHTML = GURUJI_DATA.reviews.map(r => `
    <div class="bg-white p-5 rounded-2xl border border-line shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex text-amber-500 text-xs">
            ${Array(r.rating).fill('<i class="fa-solid fa-star"></i>').join('')}
          </div>
          <span class="text-2xs text-ink-3">${r.date}</span>
        </div>
        <p class="text-xs text-ink-2 leading-relaxed italic">
          "${r.comment}"
        </p>
        ${r.reply ? `<div class="mt-3 pl-3 border-l-2 border-amber-300 text-xs text-ink-2">
          <span class="font-semibold text-maroon">Guruji Palmistry:</span> ${r.reply}
        </div>` : ''}
      </div>

      <div class="mt-4 pt-3 border-t border-sand flex items-center justify-between text-xs">
        <div>
          <div class="font-bold text-ink flex items-center gap-1">
            ${r.name}
            ${r.verified ? '<i class="fa-solid fa-circle-check text-emerald-600 text-2xs" title="Verified Consultation"></i>' : ''}
          </div>
          <span class="text-2xs text-ink-3">${r.location}</span>
        </div>
        <span class="text-2xs bg-rose-50 text-maroon px-2 py-0.5 rounded-full font-medium">
          ${r.consultation.includes("Pooja") ? "Pooja" : "Reading"}
        </span>
      </div>
    </div>
  `).join('');
}

// ==========================================
// PALMISTRY LINES ACCORDION (Learn Page)
// ==========================================

function renderLinesAccordion() {
  const container = document.getElementById("lines-accordion");
  if (!container || !GURUJI_DATA.linesGuide) return;

  container.innerHTML = GURUJI_DATA.linesGuide.map((line, idx) => `
    <div class="border border-line rounded-xl overflow-hidden transition" id="accordion-item-${line.id}">
      <button onclick="toggleLineDetails('${line.id}')" class="w-full p-3.5 bg-paper hover:bg-rose-50/50 text-left flex items-center justify-between text-xs font-semibold text-ink transition">
        <div class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${line.color}"></span>
          <span>${line.name}</span>
          <span class="text-2xs font-normal text-maroon font-serif">(${line.sanskrit})</span>
        </div>
        <i class="fa-solid fa-chevron-down text-2xs text-zinc-400 transition transform" id="icon-${line.id}"></i>
      </button>
      <div id="details-${line.id}" class="${idx === 0 ? 'block' : 'hidden'} p-3.5 bg-white border-t border-line text-xs text-ink-2 space-y-1.5">
        <p class="leading-relaxed"><strong>Significance:</strong> ${line.meaning}</p>
        <p class="text-emerald-800 leading-relaxed"><strong>Vedic Interpretation:</strong> ${line.indications}</p>
      </div>
    </div>
  `).join('');
}

function toggleLineDetails(lineId) {
  GURUJI_DATA.linesGuide.forEach(line => {
    const details = document.getElementById(`details-${line.id}`);
    const icon = document.getElementById(`icon-${line.id}`);
    if (line.id === lineId) {
      const isHidden = details.classList.contains("hidden");
      if (isHidden) {
        details.classList.remove("hidden");
        icon.classList.add("rotate-180");
      } else {
        details.classList.add("hidden");
        icon.classList.remove("rotate-180");
      }
    } else {
      details.classList.add("hidden");
      icon.classList.remove("rotate-180");
    }
  });
}

// ==========================================
// CONSULTATION BOOKING CONTROLLER (Screenshot 4)
// ==========================================

function selectConsultationService(serviceId, price, element) {
  if (window.TEST_ONE_RUPEE) price = 1;
  let title = "Detailed Palm Analysis";
  let duration = "30 Mins";
  if (serviceId === "astrology_correlation") {
    title = "Comprehensive Kundali Analysis";
    duration = "30 Mins";
  } else if (serviceId === "combined_consultation") {
    title = "Astro-Palmistry Correlation";
    duration = "45 Mins";
  }
  // Titles and prices are managed in the admin dashboard (site.js keeps them in sync)
  const managed = typeof siteConsultation === "function" ? siteConsultation(serviceId) : null;
  if (managed) {
    title = managed.title;
    duration = managed.duration || duration;
    if (managed.price > 0) price = window.TEST_ONE_RUPEE ? 1 : managed.price;
  }

  state.selectedService = {
    id: serviceId,
    title: title,
    price: price,
    duration: duration
  };

  // Update card styling
  document.querySelectorAll(".consult-card").forEach(c => {
    c.classList.remove("selected", "border-2", "border-maroon", "bg-rose-50/40");
    c.classList.add("border", "border-line", "bg-white");
    const checkBadge = c.querySelector(".fa-check");
    if (checkBadge) {
      const parent = checkBadge.closest("div.absolute");
      if (parent) parent.remove();
    }
  });

  const targetCard = element || document.querySelector(`.consult-card[onclick*="'${serviceId}'"]`);
  if (targetCard) {
    targetCard.classList.remove("border", "border-line", "bg-white");
    targetCard.classList.add("selected", "border-2", "border-maroon", "bg-rose-50/40");

    const badge = document.createElement("div");
    badge.className = "absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-maroon text-white flex items-center justify-center text-2xs";
    badge.innerHTML = '<i class="fa-solid fa-check"></i>';
    targetCard.appendChild(badge);
  }

  // Update right sidebar summary
  const summaryService = document.getElementById("consult-summary-service");
  if (summaryService) summaryService.innerText = title;

  const summaryFee = document.getElementById("consult-summary-fee");
  if (summaryFee) summaryFee.innerText = `₹ ${price.toLocaleString()}`;

  // Sync to payment displays
  const payDisplay = document.getElementById("pay-amount-display");
  if (payDisplay) payDisplay.innerText = `₹ ${price.toLocaleString()}`;
}

function updateConsultSummary() {
  const dateSel = document.getElementById("consult-date-select");
  const timeSel = document.getElementById("consult-time-select");
  if (dateSel && timeSel) {
    if (dateSel.value) state.selectedDate = dateSel.value;
    if (timeSel.value) state.selectedTime = timeSel.value;
  }

  const timeDisplay = document.getElementById("consult-summary-time");
  if (timeDisplay) {
    const formattedDate = state.selectedDate ? state.selectedDate.replace(' 2026', '') : 'Today, 20 Nov';
    timeDisplay.innerText = `${formattedDate}, ${state.selectedTime || '10:45 AM'}`;
  }

  const authSlotInfo = document.getElementById("auth-slot-held-info");
  if (authSlotInfo) authSlotInfo.innerText = `${state.selectedDate} at ${state.selectedTime}`;
  
  const failSlotTime = document.getElementById("fail-slot-time");
  if (failSlotTime) failSlotTime.innerText = `${state.selectedDate} at ${state.selectedTime}`;

  const handRadio = document.querySelector("input[name='consult-handedness']:checked");
  if (handRadio) {
    state.handedness = handRadio.value;
    const handDisplay = document.getElementById("consult-summary-hand");
    if (handDisplay) handDisplay.innerText = handRadio.value;
  }
}

// The Vedic consultation calendar and its time slots used to live here.
// A booking no longer carries a date or a slot, so the controller went
// with the markup it drove.

// ==========================================
// POOJA SEVA BOOKING CONTROLLER (Screenshot 2)
// ==========================================

let selectedPoojas = [
  { id: 'navagraha_shanti', name: 'Navagraha Shanti', price: 5100 }
];

function setPoojaCardState(card, selected) {
  if (!card) return;
  card.classList.toggle("selected", selected);
  card.setAttribute("aria-checked", String(selected));
  // the tick is drawn from the card's own state (see .pooja-card.selected .pooja-check)
}

function togglePoojaSelection(poojaId, price, element) {
  if (window.TEST_ONE_RUPEE) price = 1;
  const poojaNamesMap = {
    'ganapathi_homam': 'Ganapathi Homam',
    'navagraha_shanti': 'Navagraha Shanti',
    'shani_shanti': 'Shani Shanti',
    'pitru_runa_vimochana': 'Pitru Runa Vimochana',
    'ayushya_homam': 'Ayushya Homam',
    'santana_prapti': 'Santana Prapti'
  };
  const name = poojaNamesMap[poojaId] || poojaId;

  const existingIdx = selectedPoojas.findIndex(p => p.id === poojaId);
  if (existingIdx >= 0) {
    selectedPoojas.splice(existingIdx, 1);
    setPoojaCardState(element, false);
  } else {
    selectedPoojas.push({ id: poojaId, name: name, price: price });
    setPoojaCardState(element, true);
  }

  updatePoojaSummaryUI();
}

function removeSelectedPooja() {
  selectedPoojas = [];
  document.querySelectorAll(".pooja-card").forEach(c => setPoojaCardState(c, false));
  updatePoojaSummaryUI();
}

function removeSinglePooja(id) {
  const idx = selectedPoojas.findIndex(p => p.id === id);
  if (idx >= 0) selectedPoojas.splice(idx, 1);
  setPoojaCardState(document.querySelector(`.pooja-card[onclick*="'${id}'"]`), false);
  updatePoojaSummaryUI();
}

const TRASH_ICON = '<svg class="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>';

function updatePoojaSummaryUI() {
  const container = document.getElementById("pooja-selection-item");
  const totalDisplay = document.getElementById("pooja-total-amount");
  if (window.TEST_ONE_RUPEE && selectedPoojas.length) {
    selectedPoojas.forEach(p => p.price = 1);
  }
  if (window.TEST_ONE_RUPEE && selectedPoojas.length) {
    selectedPoojas.forEach(p => p.price = 1);
  }
  const total = window.TEST_ONE_RUPEE ? 1 : selectedPoojas.reduce((acc, p) => acc + p.price, 0);

  if (container) {
    container.innerHTML = selectedPoojas.length === 0
      ? `<p class="bk-selection__empty">No pooja selected yet — choose one on the left.</p>`
      : selectedPoojas.map(p => `
        <div class="bk-selection__row">
          <span>${escapeHTML(p.name)}</span>
          <span class="bk-selection__price">₹ ${p.price.toLocaleString("en-IN")}
            <button type="button" onclick="event.stopPropagation(); removeSinglePooja('${p.id}')" class="bk-selection__remove" aria-label="Remove ${escapeHTML(p.name)}">${TRASH_ICON}</button>
          </span>
        </div>`).join('');
  }
  if (totalDisplay) totalDisplay.innerText = `₹ ${total.toLocaleString("en-IN")}`;
}

// Space / Enter toggles any card that behaves like a checkbox
document.addEventListener("keydown", (e) => {
  const el = e.target;
  if ((e.key === " " || e.key === "Enter") && el.getAttribute && el.getAttribute("role") === "checkbox" && el.hasAttribute("onclick")) {
    e.preventDefault();
    el.click();
  }
});
// "Book" buttons on the landing page: open the Pooja booking page with that seva selected
function selectPoojaSeva(poojaId, title, price) {
  if (window.TEST_ONE_RUPEE) price = 1;
  const ID_ALIASES = { pitru_runa: "pitru_runa_vimochana" };
  poojaId = ID_ALIASES[poojaId] || poojaId;
  removeSelectedPooja();
  const card = document.querySelector(`.pooja-card[onclick*="'${poojaId}'"]`);
  if (card) {
    togglePoojaSelection(poojaId, price, card);
  } else {
    selectedPoojas.push({ id: poojaId, name: title, price: price });
    updatePoojaSummaryUI();
  }
  showPage("book-pooja");
}

// ==========================================
// POOJA DATE, TIME SLOT & PRASADAM ADDRESS
// ==========================================

const POOJA_SLOTS_OFFLINE = [
  { id: "pratah", label: "6:00 – 8:00 AM", name: "Pratah Kaal", available: true },
  { id: "morning", label: "8:00 – 10:00 AM", name: "Morning", available: true },
  { id: "madhyahna", label: "10:00 AM – 12:00 PM", name: "Madhyahna", available: true },
  { id: "sandhya", label: "5:00 – 7:00 PM", name: "Sandhya Kaal", available: true }
];
state.pooja = { date: "", slot: null };

/** YYYY-MM-DD in India, n days from today. */
function istDate(n) {
  return new Date(Date.now() + n * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function formatPoojaDate(iso) {
  const d = new Date(iso + "T00:00:00");
  const wd = d.toLocaleDateString("en-IN", { weekday: "short" });
  const mon = d.toLocaleDateString("en-IN", { month: "short" });
  return `${wd}, ${d.getDate()} ${mon} ${d.getFullYear()}`;   // e.g. "Sun, 22 Nov 2026"
}

function initPoojaDatePicker() {
  const input = document.getElementById("pooja-date");
  if (!input) return;
  input.min = istDate(1);
  input.max = istDate(90);
}

async function loadPoojaSlots(date) {
  const grid = document.getElementById("pooja-slot-grid");
  state.pooja.date = date;
  state.pooja.slot = null;
  updatePoojaWhen();
  if (!grid) return;
  if (!date) {
    grid.innerHTML = `<p class="col-span-full text-sm text-ink-3 italic py-3">Choose a date to see available slots.</p>`;
    return;
  }
  grid.innerHTML = `<p class="col-span-full text-sm text-ink-3 py-3 flex items-center gap-2"><span class="btn-spinner"></span> Checking available slots…</p>`;
  let slots = POOJA_SLOTS_OFFLINE;
  try {
    const data = await api(`/api/pooja-slots?date=${encodeURIComponent(date)}`);
    if (data) slots = data.slots;
  } catch (err) {
    grid.innerHTML = `<p class="col-span-full text-sm text-rose-700 py-3">${escapeHTML(err.message)}</p>`;
    return;
  }
  if (state.pooja.date !== date) return; // a newer date was picked meanwhile
  grid.innerHTML = slots.map(sl => `
    <button type="button" role="radio" aria-checked="false" data-slot="${sl.id}" ${sl.available ? "" : "disabled"}
      onclick="selectPoojaSlot('${sl.id}', '${escapeHTML(sl.label)}', '${escapeHTML(sl.name)}')" class="slot-chip">
      <span class="slot-chip__time">${escapeHTML(sl.label)}</span>
      <span class="slot-chip__name">${escapeHTML(sl.name)}</span>
      <span class="slot-chip__left">${sl.available ? (sl.remaining !== undefined ? `${sl.remaining} left` : "Available") : "Full"}</span>
    </button>`).join("");
}

function selectPoojaSlot(id, label, name) {
  state.pooja.slot = { id, label, name };
  document.querySelectorAll("#pooja-slot-grid .slot-chip").forEach(b => {
    const on = b.dataset.slot === id;
    b.classList.toggle("is-selected", on);
    b.setAttribute("aria-checked", String(on));
  });
  document.getElementById("pooja-slot-grid").classList.remove("field-error-group");
  document.querySelector('.field-error-msg[data-for="pooja-slot-grid"]')?.remove();
  updatePoojaWhen();
}

function updatePoojaWhen() {
  const el = document.getElementById("pooja-summary-when");
  if (!el) return;
  el.textContent = state.pooja.date
    ? `${formatPoojaDate(state.pooja.date)}${state.pooja.slot ? " · " + state.pooja.slot.label : ""}`
    : "Not chosen yet";
}

function togglePrasadamAddress() {
  const on = document.getElementById("prasadam-deliver").checked;
  document.getElementById("prasadam-address").classList.toggle("hidden", !on);
}

VALIDATORS.pincode = (v) => /^[1-9]\d{5}$/.test(v.trim());
VALIDATORS.isoDateInWindow = (v) => !!v && v >= istDate(1) && v <= istDate(90);

function proceedToPoojaPayment() {
  if (selectedPoojas.length === 0) {
    showVedicToast("Please select at least one Pooja Seva to continue.", "error");
    return;
  }
  const deliver = document.getElementById("prasadam-deliver").checked;
  const rules = [
    { id: "pooja-name", rule: "name", msg: "Please enter the seeker's full name." },
    { id: "pooja-gotram", rule: "required", msg: "Please enter your gotram, or choose “I don't know my gotram”." },
    { id: "pooja-mobile", rule: "mobile", msg: "Enter a valid 10-digit Indian mobile number." },
    { id: "pooja-date", rule: "isoDateInWindow", msg: "Choose a pooja date from tomorrow up to 90 days ahead." }
  ];
  if (deliver) rules.push(
    { id: "addr-line1", rule: "required", msg: "Please enter the house / flat number and street." },
    { id: "addr-city", rule: "name", msg: "Please enter the city or town." },
    { id: "addr-state", rule: "required", msg: "Please choose the state." },
    { id: "addr-pincode", rule: "pincode", msg: "Enter a valid 6-digit PIN code." }
  );
  let ok = validateFields(rules);
  if (ok && !state.pooja.slot) {
    ok = false;
    const grid = document.getElementById("pooja-slot-grid");
    grid.classList.add("field-error-group");
    if (!document.querySelector('.field-error-msg[data-for="pooja-slot-grid"]')) {
      const m = document.createElement("p");
      m.className = "field-error-msg"; m.dataset.for = "pooja-slot-grid";
      m.textContent = "Please choose a time slot for the pooja.";
      grid.insertAdjacentElement("afterend", m);
    }
    grid.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (!ok) return;

  state.pooja.prasadam = deliver ? {
    deliver: true,
    address: {
      line1: document.getElementById("addr-line1").value.trim(),
      line2: document.getElementById("addr-line2").value.trim(),
      city: document.getElementById("addr-city").value.trim(),
      state: document.getElementById("addr-state").value,
      pincode: document.getElementById("addr-pincode").value.trim()
    }
  } : { deliver: false };
  state.selectedDate = formatPoojaDate(state.pooja.date);
  state.selectedTime = state.pooja.slot.label;

  if (window.TEST_ONE_RUPEE && selectedPoojas.length) {
    selectedPoojas.forEach(p => p.price = 1);
  }
  const total = window.TEST_ONE_RUPEE ? 1 : selectedPoojas.reduce((acc, p) => acc + p.price, 0);
  const titles = selectedPoojas.map(p => p.name).join(", ");

  const nameInput = document.getElementById("pooja-name");
  const gotramInput = document.getElementById("pooja-gotram");
  const dobInput = document.getElementById("pooja-dob");
  const mobileInput = document.getElementById("pooja-mobile");

  if (nameInput) state.user.name = nameInput.value;
  if (gotramInput) state.user.gotram = gotramInput.value;
  if (dobInput) state.user.dob = dobInput.value;
  if (mobileInput) state.user.mobile = mobileInput.value;

  state.selectedService = {
    id: "pooja_sevas",
    title: `Pooja Seva: ${titles}`,
    price: total,
    duration: "45-60 Mins Ritual"
  };

  const payDisplay = document.getElementById("pay-amount-display");
  if (payDisplay) payDisplay.innerText = `₹ ${total.toLocaleString()}`;

  showPage("book-payment");
}

function selectServiceCard(serviceId) {
  selectConsultationService(serviceId, serviceId === 'combined_consultation' ? 10 : 549);
}

// Handedness Selector Listener
document.querySelectorAll("input[name='handedness']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    state.handedness = e.target.value;
    document.getElementById("summary-handedness").innerText = state.handedness;
  });
});

// ==========================================
// CALENDAR & TIME SLOTS
// ==========================================

function renderCalendarDays() {
  const container = document.getElementById("calendar-days-container");
  if (!container) return;

  const days = [
    { label: "Today", date: "20 Nov", day: "Fri", openSlots: 8, selected: true },
    { label: "Tomorrow", date: "21 Nov", day: "Sat", openSlots: 12, selected: false },
    { label: "Sun", date: "22 Nov", day: "Sun", openSlots: 6, selected: false },
    { label: "Mon", date: "23 Nov", day: "Mon", openSlots: 14, selected: false },
    { label: "Tue", date: "24 Nov", day: "Tue", openSlots: 10, selected: false }
  ];

  container.innerHTML = days.map((d, index) => `
    <button onclick="selectDateTab(this, '${d.label}, ${d.date} 2026')" class="calendar-day-btn p-3 rounded-xl border text-center transition ${d.selected ? 'border-2 border-maroon bg-rose-50/50 font-bold' : 'border-line bg-white hover:border-amber-400'}">
      <span class="text-2xs uppercase font-semibold text-maroon block">${d.label}</span>
      <span class="text-sm font-bold text-ink block mt-0.5">${d.date}</span>
      <span class="text-2xs text-emerald-700 font-medium block mt-1">${d.openSlots} open slots</span>
    </button>
  `).join('');
}

function selectDateTab(btn, dateString) {
  document.querySelectorAll(".calendar-day-btn").forEach(b => {
    b.classList.remove("border-2", "border-maroon", "bg-rose-50/50", "font-bold");
    b.classList.add("border-line", "bg-white");
  });

  btn.classList.remove("border-line", "bg-white");
  btn.classList.add("border-2", "border-maroon", "bg-rose-50/50", "font-bold");

  state.selectedDate = dateString;
  document.getElementById("slot-summary-date").innerText = dateString;
  document.getElementById("auth-slot-held-info").innerText = `${dateString} at ${state.selectedTime}`;
}

function selectTimeSlot(slotTime) {
  state.selectedTime = slotTime;

  document.querySelectorAll(".time-slot-btn").forEach(btn => {
    btn.classList.remove("border-2", "border-maroon", "bg-rose-50", "font-bold");
    btn.classList.add("border-line", "text-ink", "font-medium");
    if (btn.innerText.includes("(Selected)")) {
      btn.innerText = btn.getAttribute("data-slot");
    }
  });

  const activeBtn = document.querySelector(`.time-slot-btn[data-slot="${slotTime}"]`);
  if (activeBtn) {
    activeBtn.classList.remove("border-line", "text-ink", "font-medium");
    activeBtn.classList.add("border-2", "border-maroon", "bg-rose-50", "font-bold");
    activeBtn.innerText = `${slotTime} (Selected)`;
  }

  document.getElementById("summary-slot-time").innerText = `${state.selectedDate} • ${slotTime}`;
  document.getElementById("slot-summary-time").innerText = slotTime;
  document.getElementById("auth-slot-held-info").innerText = `${state.selectedDate} at ${slotTime}`;
  document.getElementById("fail-slot-time").innerText = `${state.selectedDate} at ${slotTime}`;
}

// ==========================================
// SEEKER AUTH CONTROLLER (PRESERVES SLOT!)
// ==========================================

async function handleAuthSubmit(event) {
  event.preventDefault();
  // Only who they are here. The mobile number and the agreement to the terms
  // are asked once, on the payment page (see collectPayDetails).
  VALIDATORS.password6 = (v) => v.length >= 6;
  const ok = validateFields([
    { id: "auth-name", rule: "name", msg: "Please enter your full name." },
    { id: "auth-email", rule: "email", msg: "Please enter a valid email address." },
    { id: "auth-password", rule: "password6", msg: "Please create a password of at least 6 characters, so you can sign in again." }
  ]);
  if (!ok) return;

  const name = document.getElementById("auth-name").value.trim();
  const email = (document.getElementById("auth-email")?.value || "").trim().toLowerCase();
  const password = document.getElementById("auth-password") ? document.getElementById("auth-password").value : "";

  state.user.name = name;
  state.user.email = email;

  // Persist slot hold immediately so it cannot be lost (only when one is held)
  if (state.selectedDateISO) persistHeldSlot();

  try {
    const res = await fetch("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: password || undefined })
    });
    const data = await res.json();
    if ((data.ok || data.success) && data.token) {
      localStorage.setItem("guruji_cust_token", data.token);
      if (data.customer) {
        state.user.customerId = data.customer.id;
        if (data.customer.mobile) state.user.mobile = data.customer.mobile;
      }
    } else if (data.error) {
      showVedicToast(data.error, "error");
      if (res.status === 409 && typeof setBookAuthMode === "function") {
        setBookAuthMode("signin");
        const id = document.getElementById("book-login-id");
        if (id) id.value = email;
      }
      return;
    }
  } catch (e) {
    console.warn("[Customer Account Register]", e);
  }

  // Sync to birth details form
  const devName = document.getElementById("devotee-fullname");
  if (devName) devName.value = state.user.name;

  // Signed in: now choose the service and the slot.
  showPage("book-consultation");
}

// ==========================================
// BOOKING SIGN-IN CARD (sign in / create account)
// ==========================================

/** Switches the booking login card between "Welcome back" and "Create your account". */
window.setBookAuthMode = function(mode) {
  const signin = document.getElementById("book-signin-form");
  const register = document.getElementById("book-register-form");
  if (!signin || !register) return;
  const isRegister = mode === "register";
  signin.classList.toggle("hidden", isRegister);
  register.classList.toggle("hidden", !isRegister);
  const title = document.getElementById("gp-auth-title");
  const sub = document.getElementById("gp-auth-sub");
  if (title) title.textContent = isRegister ? "Create your account" : "Welcome back";
  if (sub) sub.textContent = isRegister
    ? "One quick step so Guruji can reach you and your slot stays held."
    : "Track your consultations, reports and bookings in one place.";
  const first = document.getElementById(isRegister ? "auth-name" : "book-login-id");
  if (first && !first.value) first.focus();
};

window.togglePwdVisibility = function(inputId, btn) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const show = el.type === "password";
  el.type = show ? "text" : "password";
  if (btn) {
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    btn.innerHTML = `<i class="fa-regular ${show ? "fa-eye-slash" : "fa-eye"}"></i>`;
  }
};

/** There is no self-serve reset yet, so send the seeker to the WhatsApp helpline. */
window.bookForgotPassword = function() {
  const id = (document.getElementById("book-login-id")?.value || "").trim();
  const msg = `Namaste, I forgot my Guruji Palmistry account password.${id ? " My login: " + id : ""}`;
  window.open(`https://wa.me/918977625078?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
};

window.handleBookSignIn = async function(e) {
  e.preventDefault();
  const identifier = (document.getElementById("book-login-id")?.value || "").trim();
  const password = document.getElementById("book-login-pwd")?.value || "";
  const errEl = document.getElementById("book-login-err");
  const btn = document.getElementById("book-login-btn");
  const fail = (msg) => { if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); } };

  if (!identifier || !password) return fail("Please enter your email or mobile number and password.");
  if (errEl) errEl.classList.add("hidden");
  if (btn) { btn.disabled = true; btn.textContent = "Signing in…"; }

  try {
    const res = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !(data.ok || data.success) || !data.token) throw new Error(data.error || "Invalid email/mobile or password.");

    localStorage.setItem("guruji_cust_token", data.token);
    if (data.customer) {
      state.user.name = data.customer.name || state.user.name;
      state.user.email = data.customer.email || state.user.email;
      state.user.mobile = data.customer.mobile || state.user.mobile;
      state.user.customerId = data.customer.id;
    }
    const devName = document.getElementById("devotee-fullname");
    if (devName && state.user.name) devName.value = state.user.name;
    if (state.selectedDateISO) persistHeldSlot();
    if (typeof showVedicToast === "function") showVedicToast(`Namaste ${state.user.name || ""}, welcome back!`.replace(" ,", ","), "success");
    showPage("book-consultation");
  } catch (err) {
    fail(err.message || "Invalid email/mobile or password.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Sign in"; }
  }
};

// ==========================================
// PAYU GATEWAY SIMULATION
// ==========================================

/** Fills the payment page's mobile box from what we already know. */
function prefillPayDetails() {
  const box = document.getElementById("pay-mobile");
  if (box && !box.value && state.user.mobile) box.value = String(state.user.mobile).replace(/\D/g, "").slice(-10);
}
window.prefillPayDetails = prefillPayDetails;

/** The payment page asks for the mobile number and the agreement to the terms
 *  (they used to be on the login card). Returns true when both are given. */
function collectPayDetails() {
  const box = document.getElementById("pay-mobile");
  const tick = document.getElementById("pay-consent");
  const err = document.getElementById("pay-details-err");
  const fail = (msg, el) => {
    if (err) { err.textContent = msg; err.classList.remove("hidden"); }
    if (el) el.focus();
    return false;
  };
  if (!box) return true; // older page without the block
  let digits = box.value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return fail("Please enter your 10-digit mobile number, so Guruji can reach you.", box);
  if (tick && !tick.checked) return fail("Please tick the box to agree to the Disclaimer, Terms & Conditions and Privacy Policy.", tick);
  if (err) err.classList.add("hidden");
  box.value = digits;
  state.user.mobile = digits;
  state.payConsent = true;
  return true;
}
window.collectPayDetails = collectPayDetails;

async function simulatePaymentSuccess(btn) {
  if (state.paymentInFlight || state.paymentStatus === "SUCCESS") return;
  if (!collectPayDetails()) return;
  state.paymentInFlight = true;
  setButtonLoading(btn, true, "Processing payment…");
  try {
    await ensureBooking();
    await updateBooking("payment_success");
    completePayment();
  } catch (err) {
    showVedicToast(err.message, "error");
    if (/filled up/.test(err.message) && state.selectedService.id === "pooja_sevas") {
      showPage("book-pooja");
      loadPoojaSlots(state.pooja.date);
    }
  } finally {
    state.paymentInFlight = false;
    setButtonLoading(btn, false);
  }
}

function completePayment() {
  state.paymentStatus = "SUCCESS";
  // Slot is confirmed: stop the hold countdown
  clearInterval(state.slotTimerInterval);
  state.slotTimerInterval = null;
  state.isSlotHeld = false;
  document.getElementById("slot-timer-container")?.classList.add("hidden");

  // Trigger celebratory confetti
  if (typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Consultations continue to the palm-photo upload; poojas go straight to their status
  setTimeout(() => {
    if (state.selectedService.id === "pooja_sevas") {
      showPage("book-status");
      showVedicToast(`Pooja booked for ${state.selectedDate}, ${state.selectedTime}.`);
    } else {
      showPage("book-upload");
    }
  }, 400);
}

function simulatePaymentFailure() {
  ensureBooking().then(() => updateBooking("payment_failed")).catch(() => {});
  // Show Payment Failure modal (which explicitly shows slot is still held)
  const failModal = document.getElementById("payment-failure-modal");
  if (failModal) {
    failModal.classList.remove("hidden");
  }
}

function closeFailureModalAndRetry() {
  const failModal = document.getElementById("payment-failure-modal");
  if (failModal) {
    failModal.classList.add("hidden");
  }
  showPage("book-payment");
}

// ==========================================
// PALM PHOTO UPLOADER
// ==========================================

state.handPhotos = {};
state.selectedHand = "Right";

window.handleHandChoiceChange = function(choice) {
  state.selectedHand = choice;
  state.handedness = choice === "Left" ? "Left-handed" : "Right-handed";
  const hintText = document.getElementById("palm-hand-hint-text");
  if (hintText) {
    hintText.textContent = choice === "Left"
      ? "Key Hint: Please upload ONLY Left hand images."
      : "Key Hint: Please upload ONLY Right hand images.";
  }
  updateRequiredSlotsForHand(choice);
};

function getRequiredSlots() {
  const hand = state.selectedHand || "Right";
  // Hand chosen slot (1 for Left Palm, 2 for Right Palm) + Slot 3 (Side of Palm)
  return hand === "Left" ? [1, 3] : [2, 3];
}

function updateRequiredSlotsForHand(choice) {
  const leftCard = document.querySelector("input[onchange*='(1,']'")?.closest("div.border");
  const rightCard = document.querySelector("input[onchange*='(2,']'")?.closest("div.border");
  const leftBadge = leftCard?.querySelector("[data-upload-badge]");
  const rightBadge = rightCard?.querySelector("[data-upload-badge]");

  if (choice === "Left") {
    if (leftCard) leftCard.classList.remove("opacity-40");
    if (leftBadge && !state.handPhotos[1]) {
      leftBadge.className = "inline-block mt-1.5 text-2xs font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full";
      leftBadge.innerText = "Required";
    }
    if (rightCard) rightCard.classList.add("opacity-40");
    if (rightBadge && !state.handPhotos[2]) {
      rightBadge.className = "inline-block mt-1.5 text-2xs font-semibold text-ink-3 bg-sand px-2 py-0.5 rounded-full";
      rightBadge.innerText = "Not needed (Left Hand chosen)";
    }
  } else {
    if (rightCard) rightCard.classList.remove("opacity-40");
    if (rightBadge && !state.handPhotos[2]) {
      rightBadge.className = "inline-block mt-1.5 text-2xs font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full";
      rightBadge.innerText = "Required";
    }
    if (leftCard) leftCard.classList.add("opacity-40");
    if (leftBadge && !state.handPhotos[1]) {
      leftBadge.className = "inline-block mt-1.5 text-2xs font-semibold text-ink-3 bg-sand px-2 py-0.5 rounded-full";
      leftBadge.innerText = "Not needed (Right Hand chosen)";
    }
  }
}

function handleHandPhotoUpload(slotIndex, event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    showVedicToast("Please upload a JPG, PNG or WEBP photo.", "error");
    event.target.value = "";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showVedicToast("That photo is larger than 10 MB. Please choose a smaller one.", "error");
    event.target.value = "";
    return;
  }
  state.handPhotos[slotIndex] = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const parentCard = event.target.closest("div.border");
    if (parentCard) {
      const img = parentCard.querySelector("img");
      if (img) img.src = e.target.result;
      
      const label = parentCard.querySelector("span[data-upload-label]");
      if (label) label.innerText = file.name.length > 18 ? `${file.name.substring(0, 16)}…` : file.name;

      const badge = parentCard.querySelector("[data-upload-badge]");
      if (badge) {
        badge.className = "inline-block mt-1.5 text-2xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full";
        badge.innerText = "✓ Uploaded";
      }
      parentCard.classList.remove("border-rose-400");
      parentCard.classList.add("border-emerald-400");
    }
  };
  reader.readAsDataURL(file);
}

async function submitPalmPhotosAndProceed(btn) {
  const okDetails = validateFields([
    { id: "devotee-fullname", rule: "name", msg: "Please enter your full name." },
    { id: "devotee-gender", rule: "required", msg: "Please select your gender." },
    { id: "devotee-dob", rule: "required", msg: "Date of birth is needed for the reading." }
  ]);
  if (!okDetails) return;

  const requiredSlots = getRequiredSlots();
  const missing = requiredSlots.filter(i => !state.handPhotos[i]);
  if (missing.length) {
    document.querySelectorAll("input[onchange^='handleHandPhotoUpload(']").forEach(inp => {
      const idx = Number(inp.getAttribute("onchange").match(/\((\d)/)[1]);
      const card = inp.closest("div.border");
      if (card && missing.includes(idx)) card.classList.add("border-rose-400");
    });
    showVedicToast(`Please upload your required ${state.selectedHand || ""} hand photo(s) (marked in red).`, "error");
    return;
  }
  if (btn && btn.disabled) return;
  setButtonLoading(btn, true, "Submitting…");

  const details = {
    name: document.getElementById("devotee-fullname").value,
    gender: (document.getElementById("devotee-gender") ? document.getElementById("devotee-gender").value : "").trim(),
    language: (document.getElementById("devotee-language") ? document.getElementById("devotee-language").value : "Telugu").trim(),
    hand: state.selectedHand || "Right",
    gotram: document.getElementById("devotee-gotram").value,
    dob: document.getElementById("devotee-dob").value,
    tob: document.getElementById("devotee-tob").value,
    pob: document.getElementById("devotee-pob").value,
    lat: document.getElementById("devotee-lat").value,
    lon: document.getElementById("devotee-lon").value,
    questions: document.getElementById("devotee-questions").value
  };
  try {
    // The photos go up first. Until this worked, Guruji received a list of
    // file names and had to ask for the pictures on WhatsApp.
    await uploadHandPhotos(state.booking.orderId, state.booking.devotee.mobile,
      (n, total) => setButtonLoading(btn, true, `Uploading photo ${n} of ${total}…`));
    setButtonLoading(btn, true, "Submitting…");
    await updateBooking("details_submitted", { details });
  } catch (err) {
    setButtonLoading(btn, false);
    showVedicToast(err.message, "error");
    return;
  }

  // Sync birth details
  state.user.name = document.getElementById("devotee-fullname").value;
  state.user.gender = document.getElementById("devotee-gender") ? document.getElementById("devotee-gender").value : "";
  state.user.language = document.getElementById("devotee-language") ? document.getElementById("devotee-language").value : "";
  state.user.gotram = document.getElementById("devotee-gotram").value;
  state.user.dob = document.getElementById("devotee-dob").value;
  state.user.tob = document.getElementById("devotee-tob").value;
  state.user.pob = document.getElementById("devotee-pob").value;
  state.user.lat = document.getElementById("devotee-lat").value;
  state.user.lon = document.getElementById("devotee-lon").value;
  state.user.questions = document.getElementById("devotee-questions").value;

  // Trigger confetti for submission
  if (typeof confetti === "function") {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  }

  setButtonLoading(btn, false);
  showDetailsReceived(() => showPage("book-status"));
}

/** What the seeker sees the moment their details land: a tick that draws
 *  itself, then plain words saying what happens next. Without this the page
 *  simply changed and nobody knew whether anything had been received. */
function showDetailsReceived(onDone) {
  const prev = document.getElementById("details-done");
  if (prev) prev.remove();

  const el = document.createElement("div");
  el.id = "details-done";
  el.className = "details-done";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.innerHTML = `
    <div class="details-done__card">
      <svg class="details-done__tick" viewBox="0 0 52 52" aria-hidden="true">
        <circle class="details-done__circle" cx="26" cy="26" r="24" fill="none"/>
        <path class="details-done__check" fill="none" d="M14 27l8 8 16-16"/>
      </svg>
      <h2>Details received</h2>
      <p class="details-done__lead">Your palm photos and birth details are with Guruji.</p>
      <p class="details-done__wait">Please wait a little while &mdash; we will consult you soon.</p>
      <div class="details-done__lotus" aria-hidden="true"><span></span><span></span><span></span></div>
      <button type="button" class="details-done__btn">See my booking</button>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add("details-done-open");

  const finish = () => {
    if (!el.isConnected) return;
    document.body.classList.remove("details-done-open");
    el.remove();
    if (typeof onDone === "function") onDone();
  };
  el.querySelector(".details-done__btn").addEventListener("click", finish);
  // It moves on by itself if they just sit and read it.
  setTimeout(finish, 6500);
}

// ==========================================
// CHAT & LIVE AUDIO CONTROLLER
// ==========================================

function handleSendChatMessage(event) {
  event.preventDefault();
  const input = document.getElementById("chat-input-field");
  const text = input.value.trim();
  if (!text) return;

  const container = document.getElementById("chat-messages-container");
  
  // Seeker message
  const userMsg = document.createElement("div");
  userMsg.className = "flex justify-end";
  userMsg.innerHTML = `
    <div class="bg-sand border border-amber-200/80 p-3 rounded-2xl rounded-tr-none max-w-[85%] space-y-1 shadow-sm">
      <p class="text-ink leading-relaxed">${escapeHTML(text)}</p>
      <div class="flex items-center justify-end gap-1 text-2xs text-ink-3">
        <span>Just now</span>
        <i class="fa-solid fa-check text-zinc-400"></i>
      </div>
    </div>
  `;
  container.appendChild(userMsg);
  input.value = "";
  container.scrollTop = container.scrollHeight;

  // Simulated Guruji Response after 2 seconds
  setTimeout(() => {
    const guruMsg = document.createElement("div");
    guruMsg.className = "flex items-start gap-2.5 animate-fadeIn";
    guruMsg.innerHTML = `
      <img src="/assets/adiguru_swamiji_portrait.jpg" class="w-7 h-7 rounded-full object-cover mt-1">
      <div class="bg-white border border-line p-3 rounded-2xl rounded-tl-none max-w-[85%] space-y-1 shadow-sm">
        <p class="text-ink leading-relaxed">
          Kalyanam Astu 🙏. I have reviewed your question. The Sun line in your right palm shows a distinct upward branch forming after age 32. Maintain disciplined sadhana and follow the prescribed remedies.
        </p>
        <div class="text-2xs text-ink-3 text-right">
          Just now
        </div>
      </div>
    `;
    container.appendChild(guruMsg);
    container.scrollTop = container.scrollHeight;
  }, 1800);
}

function insertEmoji(emoji) {
  const input = document.getElementById("chat-input-field");
  input.value += ` ${emoji} `;
  input.focus();
}

function appendDevoteeChatBubble(innerHtml) {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "flex justify-end";
  row.innerHTML = `
    <div class="bg-sand border border-amber-200/80 p-3 rounded-2xl rounded-tr-none max-w-[85%] space-y-2 shadow-sm">
      ${innerHtml}
      <div class="flex items-center justify-end gap-1 text-2xs text-ink-3"><span>Just now</span><i class="fa-solid fa-check text-zinc-400"></i></div>
    </div>`;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function triggerPhotoAttach() {
  let input = document.getElementById("chat-attach-input");
  if (!input) {
    input = document.createElement("input");
    input.type = "file";
    input.id = "chat-attach-input";
    input.accept = "image/jpeg,image/png,image/webp,application/pdf";
    input.multiple = true;
    input.className = "sr-only";
    input.addEventListener("change", () => {
      const files = [...input.files].filter(f => f.size <= 10 * 1024 * 1024);
      if (files.length < input.files.length) showVedicToast("Files over 10 MB were skipped.", "error");
      files.forEach(f => {
        if (f.type.startsWith("image/")) {
          const url = URL.createObjectURL(f);
          appendDevoteeChatBubble(`<img src="${url}" alt="${escapeHTML(f.name)}" class="max-h-48 rounded-lg">`);
        } else {
          appendDevoteeChatBubble(`<p class="text-ink flex items-center gap-2"><i class="fa-regular fa-file-pdf text-maroon"></i>${escapeHTML(f.name)}</p>`);
        }
      });
      input.value = "";
    });
    document.body.appendChild(input);
  }
  input.click();
}

let voiceRecorder = null;
async function simulateVoiceRecord(btn) {
  btn = btn || document.getElementById("chat-mic-btn");
  if (voiceRecorder && voiceRecorder.state === "recording") {
    voiceRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    showVedicToast("Voice notes aren't supported in this browser.", "error");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    voiceRecorder = new MediaRecorder(stream);
    voiceRecorder.ondataavailable = (e) => chunks.push(e.data);
    voiceRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      btn?.classList.remove("text-rose-600", "animate-pulse");
      const blob = new Blob(chunks, { type: voiceRecorder.mimeType || "audio/webm" });
      if (blob.size > 0) appendDevoteeChatBubble(`<audio controls src="${URL.createObjectURL(blob)}" class="h-9 max-w-full"></audio>`);
    };
    voiceRecorder.start();
    btn?.classList.add("text-rose-600", "animate-pulse");
    showVedicToast("Recording… tap the microphone again to send.");
  } catch (err) {
    showVedicToast("Microphone permission was denied.", "error");
  }
}

function filterChatThreads(btn, status) {
  btn.parentElement.querySelectorAll("button").forEach(b => {
    const active = b === btn;
    b.classList.toggle("bg-maroon", active);
    b.classList.toggle("text-white", active);
    b.classList.toggle("font-semibold", active);
    b.setAttribute("aria-pressed", String(active));
  });
  let shown = 0;
  document.querySelectorAll("[data-thread-status]").forEach(t => {
    const visible = status === "all" || t.dataset.threadStatus === status;
    t.classList.toggle("hidden", !visible);
    if (visible) shown++;
  });
  const empty = document.getElementById("chat-threads-empty");
  if (empty) empty.classList.toggle("hidden", shown > 0);
}

function showSessionInfo() {
  showVedicToast(`Order ${state.orderId} · ${state.selectedService.title} · ${state.paymentStatus === "SUCCESS" ? "Paid" : "Payment pending"}`);
}

function toggleAudioVoiceNote(btn) {
  const icon = btn.querySelector("i");
  const bars = document.querySelectorAll("#audio-waveform-bars .wave-bar");
  const timer = document.getElementById("voice-timer");

  if (!state.isAudioPlaying) {
    state.isAudioPlaying = true;
    icon.className = "fa-solid fa-pause text-xs";
    
    // Animate waveform bars
    state.audioInterval = setInterval(() => {
      bars.forEach(b => {
        const h = Math.floor(Math.random() * 20) + 6;
        b.style.height = `${h}px`;
      });
    }, 200);

    // Audio tone synthesizer simulation
    playSacredAudioChime();
  } else {
    state.isAudioPlaying = false;
    icon.className = "fa-solid fa-play text-xs ml-0.5";
    clearInterval(state.audioInterval);
  }
}

function playSacredAudioChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4 meditative tone
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) {
    // AudioContext fallback
  }
}

// ==========================================
// VIDEO CALL ROOM CONTROLLER
// ==========================================

// ==========================================
// REPORT VIEWER & PDF EXPORT
// ==========================================

// jsPDF is large, so it is fetched the first time a report is downloaded
// instead of on every page view.
let jspdfLoading = null;
function loadJsPdf() {
  if (window.jspdf) return Promise.resolve(window.jspdf);
  if (!jspdfLoading) {
    jspdfLoading = new Promise((resolve) => {
      const el = document.createElement('script');
      el.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      el.async = true;
      el.onload = () => resolve(window.jspdf || null);
      el.onerror = () => { jspdfLoading = null; resolve(null); };
      document.head.appendChild(el);
    });
  }
  return jspdfLoading;
}

function generateAndDownloadPDF() {
  if (typeof window.jspdf === "undefined" && !generateAndDownloadPDF.tried) {
    generateAndDownloadPDF.tried = true;
    showVedicToast("Preparing your PDF…");
    loadJsPdf().then(() => { generateAndDownloadPDF(); generateAndDownloadPDF.tried = false; });
    return;
  }
  if (typeof window.jspdf === "undefined") {
    showVedicToast("Opening the print dialog — choose “Save as PDF”.");
    window.print();
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header Banner
  doc.setFillColor(35, 12, 14); // Deep Vedic Burgundy
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(247, 227, 191);
  doc.text("GURUJI VEDIC SANSTHAN", pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont("times", "italic");
  doc.setTextColor(212, 175, 55);
  doc.text("HASTAREKHA SAMUDRIKA SHASTRA & KUNDALI DOSSIER", pageWidth / 2, 65, { align: 'center' });

  // Seeker Meta
  doc.setFillColor(250, 245, 236);
  doc.rect(40, 105, pageWidth - 80, 50, 'F');
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(44, 18, 20);
  doc.text(`Seeker Name: ${state.user.name}`, 55, 125);
  doc.text(`Date of Birth: ${state.user.dob}`, 55, 142);
  doc.text(`Order ID: ${state.orderId}`, pageWidth - 200, 125);
  doc.text(`Consultant: Adiguru Swamiji`, pageWidth - 200, 142);

  // Sections
  let yPos = 180;
  GURUJI_DATA.sampleReport.sections.forEach((sec, idx) => {
    if (yPos > 720) {
      doc.addPage();
      yPos = 50;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(135, 34, 40); // Crimson
    doc.text(sec.title, 45, yPos);
    yPos += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 50, 50);
    const splitText = doc.splitTextToSize(sec.summary, pageWidth - 90);
    doc.text(splitText, 45, yPos);
    yPos += (splitText.length * 13) + 12;
  });

  // Footer Seal
  if (yPos > 730) {
    doc.addPage();
    yPos = 60;
  }
  doc.setDrawColor(212, 175, 55);
  doc.line(45, yPos, pageWidth - 45, yPos);
  yPos += 20;

  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(35, 12, 14);
  doc.text("Blessed by Adiguru Swamiji (Hastarekha Peetham)", 45, yPos);
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.text("✓ CERTIFIED VEDIC SAMUDRIKA DOSSIER", pageWidth - 240, yPos);

  // Save PDF
  doc.save(`Guruji_Vedic_Palmistry_Report_${state.orderId}.pdf`);
  
  // Confetti
  if (typeof confetti === "function") {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 }
    });
  }
}

// Review Dialog
function openReviewModal() {
  document.getElementById("review-modal").classList.remove("hidden");
}

function closeReviewModal() {
  document.getElementById("review-modal").classList.add("hidden");
}

function setReviewRating(rating) {
  state.reviewRating = rating;
  const stars = document.querySelectorAll("#review-stars-container i");
  stars.forEach((s, idx) => {
    if (idx < rating) {
      s.className = "fa-solid fa-star cursor-pointer hover:scale-110 transition text-amber-400";
    } else {
      s.className = "fa-regular fa-star cursor-pointer hover:scale-110 transition text-zinc-300";
    }
  });
}

async function submitDevoteeReview() {
  const textarea = document.getElementById("review-feedback-text");
  const text = textarea.value.trim();
  if (text.length < 10) {
    textarea.classList.add("field-error");
    textarea.focus();
    showVedicToast("Please write a few words about your experience (10+ characters).", "error");
    return;
  }
  try {
    await api("/api/reviews", {
      method: "POST",
      body: {
        name: state.user.name, rating: state.reviewRating, comment: text,
        consultation: state.selectedService.title,
        orderId: state.booking?.orderId, mobile: state.booking?.devotee?.mobile
      }
    });
  } catch (err) {
    showVedicToast(err.message, "error");
    return;
  }
  textarea.value = "";

  // Prepend to reviews
  GURUJI_DATA.reviews.unshift({
    id: Date.now(),
    name: state.user.name,
    location: "",
    rating: state.reviewRating,
    date: "Just now",
    consultation: state.selectedService.title,
    comment: text,
    verified: !!(state.booking && state.paymentStatus === "SUCCESS")
  });

  renderReviews();
  closeReviewModal();

  if (typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 }
    });
  }

  showVedicToast("Thank you! Your review has been added.");
}

// Sample Report Modal
function openSampleReportModal() {
  document.getElementById("sample-report-modal").classList.remove("hidden");
}

function closeSampleReportModal() {
  document.getElementById("sample-report-modal").classList.add("hidden");
}

// ==========================================
// NEXT STEPS BOOKINGS
// ==========================================

function bookFollowUpSession() {
  state.selectedService = {
    id: "followup_session",
    title: "15-Min Follow-up Consultation with Guruji",
    price: 750,
    duration: "15 Mins"
  };
  document.getElementById("consult-summary-service") && (document.getElementById("consult-summary-service").innerText = state.selectedService.title);
  document.getElementById("consult-summary-fee") && (document.getElementById("consult-summary-fee").innerText = "₹ 750");
  const payDisplay = document.getElementById("pay-amount-display");
  if (payDisplay) payDisplay.innerText = "₹ 750";
  showPage("book-consultation");
}

function bookRemedialPooja() {
  selectPoojaSeva("navagraha_shanti", "Navagraha Shanti Mahapuja", 5100);
}

function enrollInCourse() {
  openCourseModal("palmistry");
}

// Helper: Escape HTML
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}


// =============================================================================
// MANTRAS & STOTRAS VEDIC SACRED KNOWLEDGE LIBRARY ENGINE
// =============================================================================

const mantrasState = {
  activeCategory: 'all',
  searchQuery: '',
  filterDeity: 'all',
  filterPurpose: 'all',
  filterType: 'all',
  bookmarkedOnly: false,
  sortBy: 'featured',
  currentMantraId: null,
  fontSize: 'md',
  isAudioPlaying: false,
  audioContext: null,
  audioTimerInterval: null,
  audioSecondsElapsed: 0,
  bookmarks: []
};

// Initialize Mantras Library on load
document.addEventListener("mantras:updated", () => {
  renderMantrasLibrary();
  document.querySelectorAll("[data-mantra-count]").forEach(el => el.textContent = MantrasDB.getAll().length);
});

function initMantrasLibrary() {
  loadMantraBookmarks();
  updateBookmarkCounters();
  renderMantraCategories();
  renderFeaturedMantras();
  renderMantrasGrid();

  const count = (typeof MantrasDB !== "undefined") ? MantrasDB.getAll().length : 0;
  document.querySelectorAll("[data-mantra-count]").forEach(el => el.textContent = count);
}

// Load bookmarks from LocalStorage
function loadMantraBookmarks() {
  try {
    const raw = localStorage.getItem('guruji_mantras_bookmarks_v1');
    mantrasState.bookmarks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    mantrasState.bookmarks = [];
  }
}

// Save bookmarks to LocalStorage
function saveMantraBookmarks() {
  try {
    localStorage.setItem('guruji_mantras_bookmarks_v1', JSON.stringify(mantrasState.bookmarks));
  } catch (e) {}
  updateBookmarkCounters();
}

function updateBookmarkCounters() {
  const count = mantrasState.bookmarks.length;
  const heroCount = document.getElementById('hero-bookmarks-count');
  const pillCount = document.getElementById('pill-bookmarks-count');
  if (heroCount) heroCount.innerText = count;
  if (pillCount) pillCount.innerText = count;
}

// Master Render Function
function renderMantrasLibrary() {
  renderMantraCategories();
  renderFeaturedMantras();
  renderMantrasGrid();

  updateBookmarkCounters();
}

// Render 7 Categories Cards with Live Counts
function renderMantraCategories() {
  const container = document.getElementById('categories-showcase-grid');
  if (!container) return;

  const categories = (typeof GURUJI_MANTRAS_CATEGORIES !== 'undefined') ? GURUJI_MANTRAS_CATEGORIES : [
    { id: 'navagraha', name: 'Navagraha Mantras & Stotras', telugu_name: 'నవగ్రహ మంత్రాలు', icon: 'fa-solid fa-sun', count: 11, description: 'Planetary Beeja Mantras & Vyasa Navagraha Stotram' },
    { id: 'ganapati', name: 'Ganapati Mantras', telugu_name: 'గణపతి మంత్రాలు', icon: 'fa-solid fa-om', count: 3, description: 'Vighnaharta Beeja & Runa Hara prayers' },
    { id: 'guru_knowledge', name: 'Guru & Knowledge Mantras', telugu_name: 'గురు & విద్యా మంత్రాలు', icon: 'fa-solid fa-graduation-cap', count: 5, description: 'Hayagriva, Dakshinamurthy & Medha Suktam' },
    { id: 'devi', name: 'Devi Mantras & Stotras', telugu_name: 'దేవీ మంత్రాలు & స్తోత్రాలు', icon: 'fa-solid fa-spa', count: 4, description: 'Durga Saptashloki & Mahalakshmi prayers' },
    { id: 'debt_financial', name: 'Debt Relief & Financial Prayers', telugu_name: 'రుణ విమోచన స్తోత్రాలు', icon: 'fa-solid fa-hand-holding-dollar', count: 3, description: 'Runa Vimochana Narasimha & Kanakadhara' },
    { id: 'specific_purpose', name: 'Specific Purpose Mantras', telugu_name: 'విశిష్ట ప్రయోజన మంత్రాలు', icon: 'fa-solid fa-crosshairs', count: 4, description: 'Desired spouse, recovering lost items & protection' },
    { id: 'daily_prayers', name: 'Daily Prayers', telugu_name: 'నిత్య ప్రార్థనలు', icon: 'fa-solid fa-hands-praying', count: 5, description: 'Prithvi Vandana, Karaagre, Gayatri & Mrityunjaya' }
  ];

  const allMantras = (typeof MantrasDB !== 'undefined') ? MantrasDB.getAll() : [];

  container.innerHTML = categories.map(cat => {
    const liveCount = allMantras.filter(m => m.category === cat.id || (m.categories && m.categories.includes(cat.id))).length || cat.count;
    const isActive = mantrasState.activeCategory === cat.id;

    return `
      <div 
        onclick="setCategoryPill('${cat.id}')"
        class="group cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden shadow-xs hover:shadow-md ${
          isActive 
            ? 'border-amber-600 ring-2 ring-amber-500/30 bg-paper' 
            : 'border-line hover:border-amber-400'
        }"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center text-lg group-hover:scale-110 transition">
            <i class="${cat.icon}"></i>
          </div>
          <span class="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            ${liveCount} Mantras
          </span>
        </div>

        <div class="text-2xs font-telugu text-amber-800 font-medium truncate mb-0.5">
          ${cat.telugu_name || ''}
        </div>
        <h3 class="font-serif font-bold text-sm text-night-2 group-hover:text-amber-900 transition mb-1.5">
          ${cat.name}
        </h3>
        <p class="text-2xs text-ink-3 line-clamp-2 leading-relaxed">
          ${cat.description}
        </p>
      </div>
    `;
  }).join('');
}

// Render Featured Mantras Section
function renderFeaturedMantras() {
  const container = document.getElementById('featured-mantras-grid');
  if (!container) return;

  const all = (typeof MantrasDB !== 'undefined') ? MantrasDB.getAll() : [];
  const featured = all.filter(m => m.featured).slice(0, 6);

  container.innerHTML = featured.map(m => createMantraCardHTML(m, true)).join('');
}

// Filter and Render All Mantras Grid
function renderMantrasGrid() {
  const container = document.getElementById('mantras-card-grid');
  const emptyState = document.getElementById('mantras-empty-state');
  const countDisplay = document.getElementById('current-count-display');
  if (!container) return;

  let list = (typeof MantrasDB !== 'undefined') ? MantrasDB.getAll() : [];

  // 1. Filter by Bookmarked Only
  if (mantrasState.bookmarkedOnly) {
    list = list.filter(m => mantrasState.bookmarks.includes(m.id));
  }

  // 2. Filter by Category
  if (mantrasState.activeCategory !== 'all') {
    list = list.filter(m => 
      m.category === mantrasState.activeCategory || 
      (m.categories && m.categories.includes(mantrasState.activeCategory))
    );
  }

  // 3. Filter by Deity
  if (mantrasState.filterDeity !== 'all') {
    const q = mantrasState.filterDeity.toLowerCase();
    list = list.filter(m => 
      (m.deity && m.deity.toLowerCase().includes(q)) || 
      (m.planet && m.planet.toLowerCase().includes(q))
    );
  }

  // 4. Filter by Purpose
  if (mantrasState.filterPurpose !== 'all') {
    const q = mantrasState.filterPurpose.toLowerCase();
    list = list.filter(m => 
      m.purpose_tags && m.purpose_tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // 5. Filter by Mantra Type
  if (mantrasState.filterType !== 'all') {
    const q = mantrasState.filterType.toLowerCase();
    list = list.filter(m => 
      m.mantra_type && m.mantra_type.toLowerCase().includes(q)
    );
  }

  // 6. Search Query
  if (mantrasState.searchQuery.trim() !== '') {
    const query = mantrasState.searchQuery.toLowerCase().trim();
    list = list.filter(m => {
      const inTitle = m.title && m.title.toLowerCase().includes(query);
      const inSanskritTitle = m.sanskrit_title && m.sanskrit_title.includes(query);
      const inTeluguTitle = m.telugu_title && m.telugu_title.includes(query);
      const inDeity = m.deity && m.deity.toLowerCase().includes(query);
      const inPlanet = m.planet && m.planet.toLowerCase().includes(query);
      const inTranslit = m.english_transliteration && m.english_transliteration.toLowerCase().includes(query);
      const inSanskritText = m.sanskrit_text && m.sanskrit_text.includes(query);
      const inTeluguText = m.telugu_text && m.telugu_text.includes(query);
      const inShortDesc = m.short_description && m.short_description.toLowerCase().includes(query);
      const inTags = m.purpose_tags && m.purpose_tags.some(t => t.toLowerCase().includes(query));
      return inTitle || inSanskritTitle || inTeluguTitle || inDeity || inPlanet || inTranslit || inSanskritText || inTeluguText || inShortDesc || inTags;
    });
  }

  // 7. Sort
  if (mantrasState.sortBy === 'name_asc') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (mantrasState.sortBy === 'category') {
    list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  } else if (mantrasState.sortBy === 'deity') {
    list.sort((a, b) => (a.deity || '').localeCompare(b.deity || ''));
  } else {
    // Featured first
    list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  // While nothing is filtered, the six in the Featured strip above are not
  // printed again here — the same card appearing twice on one screen reads as
  // a fault. A search or a category filter shows everything that matches.
  const untouched = !mantrasState.bookmarkedOnly
    && mantrasState.activeCategory === 'all' && mantrasState.filterDeity === 'all'
    && mantrasState.filterPurpose === 'all' && mantrasState.filterType === 'all'
    && mantrasState.searchQuery.trim() === '';
  const featuredIds = untouched
    ? new Set(((typeof MantrasDB !== 'undefined') ? MantrasDB.getAll() : []).filter(m => m.featured).slice(0, 6).map(m => m.id))
    : new Set();
  const shown = untouched ? list.filter(m => !featuredIds.has(m.id)) : list;

  if (countDisplay) countDisplay.innerText = list.length;
  // The note only makes sense while the featured strip is showing.
  const featuredNote = document.getElementById('mantras-featured-note');
  if (featuredNote) featuredNote.classList.toggle('hidden', !untouched);

  if (shown.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.toggle('hidden', list.length > 0);
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = shown.map(m => createMantraCardHTML(m, false)).join('');
  }
}

// HTML Generator for Individual Mantra Card
function createMantraCardHTML(m, isFeatured = false) {
  const isBookmarked = mantrasState.bookmarks.includes(m.id);
  const categoryLabel = m.category_names ? m.category_names[0] : (m.category || 'Vedic Mantra');

  return `
    <div class="bg-white rounded-2xl border ${
      isFeatured 
        ? 'border-amber-400 shadow-md ring-1 ring-amber-300/40 bg-gradient-to-b from-white to-paper' 
        : 'border-line shadow-xs hover:shadow-md hover:border-amber-400'
    } p-6 flex flex-col justify-between transition-all duration-300 group relative">
      
      <div>
        <!-- Card Top Badges & Bookmark Action -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 truncate max-w-[200px]">
            ${categoryLabel}
          </span>
          <button 
            onclick="toggleMantraBookmark('${m.id}', event)" 
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs transition ${
              isBookmarked 
                ? 'text-amber-500 bg-amber-50' 
                : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100'
            }" 
            title="${isBookmarked ? 'Remove Bookmark' : 'Add to Bookmarks'}"
          >
            <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star"></i>
          </button>
        </div>

        <!-- Mantra Titles -->
        <div class="space-y-1 mb-2">
          <h3 
            onclick="openMantraDetail('${m.id}')" 
            class="font-serif font-bold text-base sm:text-lg text-night-2 group-hover:text-amber-900 transition cursor-pointer"
          >
            ${m.title}
          </h3>
          <div class="flex items-center gap-2 text-xs">
            <span class="font-sanskrit text-amber-900 font-semibold">${m.sanskrit_title || ''}</span>
            <span class="text-zinc-300">•</span>
            <span class="font-telugu text-amber-800 text-2xs">${m.telugu_title || ''}</span>
          </div>
        </div>

        <!-- Deity / Planet -->
        <div class="text-2xs text-zinc-500 mb-3 flex items-center gap-1.5">
          <i class="fa-solid fa-om text-amber-700 text-2xs"></i>
          <span>${m.deity || 'Universal'}</span>
          ${m.planet ? `<span class="text-zinc-300">|</span> <span>${m.planet}</span>` : ''}
        </div>

        <!-- Sanskrit Verse Teaser Preview -->
        <div class="bg-parchment rounded-xl p-3 border border-line my-3">
          <div class="font-sanskrit text-sm font-semibold text-ink text-center line-clamp-2 select-all">
            ${m.sanskrit_text || ''}
          </div>
        </div>

        <!-- Short Description -->
        <p class="text-xs text-ink-2 line-clamp-2 leading-relaxed mb-4 font-light">
          ${m.short_description || m.introduction || ''}
        </p>

        <!-- Purpose Tags -->
        ${m.purpose_tags && m.purpose_tags.length > 0 ? `
          <div class="flex flex-wrap gap-1 mb-4">
            ${m.purpose_tags.slice(0, 2).map(tag => `
              <span class="text-2xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md">${tag}</span>
            `).join('')}
            ${m.purpose_tags.length > 2 ? `<span class="text-2xs text-zinc-400 self-center">+${m.purpose_tags.length - 2} more</span>` : ''}
          </div>
        ` : ''}

      </div>

      <!-- Card Action Footer -->
      <div class="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 mt-auto">
        <button 
          onclick="copyMantraCardText('${m.id}', event)" 
          class="text-xs text-zinc-600 hover:text-amber-800 font-medium flex items-center gap-1 py-1 px-2 rounded hover:bg-amber-50 transition"
          title="Copy Sanskrit Verse"
        >
          <i class="fa-regular fa-copy text-amber-600"></i>
          <span>Copy</span>
        </button>

        <button 
          onclick="openMantraDetail('${m.id}')" 
          class="text-xs font-semibold text-maroon hover:text-maroon-dark flex items-center gap-1 group-hover:translate-x-0.5 transition"
        >
          <span>Read &amp; Recite</span>
          <i class="fa-solid fa-arrow-right text-2xs"></i>
        </button>
      </div>

    </div>
  `;
}

// Open Dedicated Mantra Detail View
function openMantraDetail(mantraId) {
  renderMantraDetail(mantraId);
  showPage('mantra-detail');
}

// Render Complete Mantra Detail Page
function renderMantraDetail(mantraId) {
  const m = (typeof MantrasDB !== 'undefined') ? MantrasDB.getById(mantraId) : null;
  if (!m) {
    showVedicToast('Mantra details loading...');
    return;
  }

  mantrasState.currentMantraId = m.id;

  // Breadcrumbs & Titles
  document.getElementById('detail-breadcrumb-title').innerText = m.title;
  document.getElementById('detail-title').innerText = m.title;
  document.getElementById('detail-sanskrit-title').innerText = m.sanskrit_title || '';
  document.getElementById('detail-telugu-title').innerText = m.telugu_title || '';
  document.getElementById('detail-intro').innerText = m.introduction || m.short_description || '';

  // Badges
  document.getElementById('detail-category-badge').innerText = m.category_names ? m.category_names[0] : (m.category || 'Mantra');
  document.getElementById('detail-deity-badge').innerText = m.deity || 'Universal Deity';
  document.getElementById('detail-type-badge').innerText = m.mantra_type || 'Mantra';

  // Bookmark Button State
  const isBookmarked = mantrasState.bookmarks.includes(m.id);
  const bookmarkIcon = document.getElementById('detail-bookmark-icon');
  const bookmarkText = document.getElementById('detail-bookmark-text');
  if (bookmarkIcon && bookmarkText) {
    bookmarkIcon.className = isBookmarked ? 'fa-solid fa-star text-amber-500' : 'fa-regular fa-star text-amber-500';
    bookmarkText.innerText = isBookmarked ? 'Bookmarked' : 'Save to Bookmarks';
  }

  // Verses Display
  document.getElementById('detail-sanskrit-box').innerText = m.sanskrit_text || 'Text coming soon';
  document.getElementById('detail-telugu-box').innerText = m.telugu_text || 'తెలుగు లిపి త్వరలో చేర్చబడును';
  document.getElementById('detail-transliteration-box').innerText = m.english_transliteration || 'Transliteration coming soon';

  // Meanings
  document.getElementById('detail-english-meaning').innerText = m.english_meaning || 'Deep spiritual meaning coming soon.';
  document.getElementById('detail-telugu-meaning').innerText = m.telugu_meaning || 'తాత్పర్యం త్వరలో అందించబడును.';

  // Traditional Purpose & Significance
  document.getElementById('detail-significance').innerText = m.traditional_significance || m.short_description || '';
  
  const tagsContainer = document.getElementById('detail-purpose-tags');
  if (tagsContainer) {
    tagsContainer.innerHTML = (m.purpose_tags || []).map(t => `
      <span class="text-xs bg-amber-50 text-amber-900 border border-amber-200/70 px-2.5 py-1 rounded-lg font-medium">${t}</span>
    `).join('');
  }

  // Recitation Vidhi & Guidance
  document.getElementById('detail-method-text').innerText = m.recitation_method || 'Recite with a clean body and focused devotion during peaceful morning hours.';

  const guidance = m.recitation_guidance || {};
  document.getElementById('detail-count').innerText = guidance.recommended_count || '108 times daily';
  document.getElementById('detail-time').innerText = guidance.best_time || 'Brahma Muhurta / Sunrise';
  document.getElementById('detail-mala').innerText = guidance.rosary_mala || 'Rudraksha or Tulasi Mala';
  document.getElementById('detail-direction').innerText = guidance.facing_direction || 'East or North';

  const dhyanaContainer = document.getElementById('detail-dhyana-container');
  const dhyanaEl = document.getElementById('detail-dhyana');
  if (guidance.dhyana_shloka) {
    dhyanaContainer.classList.remove('hidden');
    dhyanaEl.innerText = guidance.dhyana_shloka;
  } else {
    dhyanaContainer.classList.add('hidden');
  }

  const notesEl = document.getElementById('detail-important-notes');
  if (notesEl) {
    notesEl.innerText = m.important_notes || 'Maintain physical cleanliness and sattvic thoughts while chanting.';
  }

  // Reset Font Size
  setMantraFontSize(mantrasState.fontSize);

  // Stop any active audio from previous mantra
  stopMantraAudio();

  // Setup Previous & Next Navigation
  setupAdjacentMantraNavigation(m.id);

  // Setup Related Mantras
  setupRelatedMantras(m);
}

// Previous & Next Mantra Navigation Setup
function setupAdjacentMantraNavigation(currentId) {
  const all = (typeof MantrasDB !== 'undefined') ? MantrasDB.getAll() : [];
  const idx = all.findIndex(m => m.id === currentId);

  const prevBtn = document.getElementById('btn-prev-mantra');
  const nextBtn = document.getElementById('btn-next-mantra');
  const prevTitle = document.getElementById('prev-mantra-title');
  const nextTitle = document.getElementById('next-mantra-title');

  if (idx > 0) {
    const prev = all[idx - 1];
    prevBtn.classList.remove('opacity-40', 'pointer-events-none');
    prevTitle.innerText = prev.title;
  } else {
    prevBtn.classList.add('opacity-40', 'pointer-events-none');
    prevTitle.innerText = 'First Mantra';
  }

  if (idx < all.length - 1) {
    const next = all[idx + 1];
    nextBtn.classList.remove('opacity-40', 'pointer-events-none');
    nextTitle.innerText = next.title;
  } else {
    nextBtn.classList.add('opacity-40', 'pointer-events-none');
    nextTitle.innerText = 'Last Mantra';
  }
}

function navigateAdjacentMantra(direction) {
  const all = (typeof MantrasDB !== 'undefined') ? MantrasDB.getAll() : [];
  const idx = all.findIndex(m => m.id === mantrasState.currentMantraId);
  const targetIdx = idx + direction;
  if (targetIdx >= 0 && targetIdx < all.length) {
    openMantraDetail(all[targetIdx].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Setup Related Mantras Section
function setupRelatedMantras(currentMantra) {
  const container = document.getElementById('related-mantras-grid');
  if (!container) return;

  const all = (typeof MantrasDB !== 'undefined') ? MantrasDB.getAll() : [];
  const related = all.filter(m => 
    m.id !== currentMantra.id && 
    (m.category === currentMantra.category || m.deity === currentMantra.deity)
  ).slice(0, 3);

  if (related.length === 0) {
    container.innerHTML = all.filter(m => m.id !== currentMantra.id).slice(0, 3).map(m => createMantraCardHTML(m, false)).join('');
  } else {
    container.innerHTML = related.map(m => createMantraCardHTML(m, false)).join('');
  }
}

// Font Size Adjustment in Mantra Detail
function setMantraFontSize(size) {
  mantrasState.fontSize = size;
  const sanskritBox = document.getElementById('detail-sanskrit-box');
  const teluguBox = document.getElementById('detail-telugu-box');

  ['font-scale-sm', 'font-scale-md', 'font-scale-lg'].forEach(cls => {
    sanskritBox?.classList.remove(cls);
    teluguBox?.classList.remove(cls);
  });

  const targetClass = `font-scale-${size}`;
  sanskritBox?.classList.add(targetClass);
  teluguBox?.classList.add(targetClass);

  // Update button highlights
  ['sm', 'md', 'lg'].forEach(s => {
    const btn = document.getElementById(`btn-font-${s}`);
    if (btn) {
      if (s === size) {
        btn.className = 'px-2 py-0.5 rounded bg-white font-bold text-amber-900 shadow-xs font-serif';
      } else {
        btn.className = 'px-2 py-0.5 rounded hover:bg-white text-zinc-700 font-serif';
      }
    }
  });
}

// Copy Text Handlers
function copyCurrentMantra(type) {
  const m = (typeof MantrasDB !== 'undefined') ? MantrasDB.getById(mantrasState.currentMantraId) : null;
  if (!m) return;

  let textToCopy = '';
  if (type === 'sanskrit') {
    textToCopy = m.sanskrit_text;
    showVedicToast('Sanskrit Devanagari verse copied!');
  } else if (type === 'telugu') {
    textToCopy = m.telugu_text;
    showVedicToast('Telugu verse copied!');
  } else if (type === 'transliteration') {
    textToCopy = m.english_transliteration;
    showVedicToast('English transliteration copied!');
  }

  copyToClipboard(textToCopy);
}

function copyMantraCardText(mantraId, event) {
  if (event) event.stopPropagation();
  const m = (typeof MantrasDB !== 'undefined') ? MantrasDB.getById(mantraId) : null;
  if (!m) return;
  copyToClipboard(m.sanskrit_text);
  showVedicToast(`"${m.title}" Sanskrit verse copied!`);
}

function copyToClipboard(text) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// Bookmark Handlers
function toggleMantraBookmark(id, event) {
  if (event) event.stopPropagation();
  const idx = mantrasState.bookmarks.indexOf(id);
  if (idx === -1) {
    mantrasState.bookmarks.push(id);
    showVedicToast('Saved to your sacred bookmarks!');
  } else {
    mantrasState.bookmarks.splice(idx, 1);
    showVedicToast('Removed from bookmarks.');
  }

  saveMantraBookmarks();
  renderMantrasGrid();
  renderFeaturedMantras();

  if (mantrasState.currentMantraId === id) {
    const bookmarkIcon = document.getElementById('detail-bookmark-icon');
    const bookmarkText = document.getElementById('detail-bookmark-text');
    const isBookmarked = mantrasState.bookmarks.includes(id);
    if (bookmarkIcon && bookmarkText) {
      bookmarkIcon.className = isBookmarked ? 'fa-solid fa-star text-amber-500' : 'fa-regular fa-star text-amber-500';
      bookmarkText.innerText = isBookmarked ? 'Bookmarked' : 'Save to Bookmarks';
    }
  }
}

function toggleCurrentMantraBookmark() {
  if (mantrasState.currentMantraId) {
    toggleMantraBookmark(mantrasState.currentMantraId);
  }
}

// Filter and Search Handlers
function handleMantraSearch(query) {
  mantrasState.searchQuery = query;
  const clearBtn = document.getElementById('mantras-search-clear');
  if (clearBtn) {
    if (query.trim() !== '') clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }
  renderMantrasGrid();
}

function clearMantraSearch() {
  const input = document.getElementById('mantras-search-input');
  if (input) input.value = '';
  mantrasState.searchQuery = '';
  document.getElementById('mantras-search-clear')?.classList.add('hidden');
  renderMantrasGrid();
}

function setCategoryPill(catId) {
  mantrasState.activeCategory = catId;
  mantrasState.bookmarkedOnly = false;

  // Update pills UI
  document.querySelectorAll('.category-pill').forEach(btn => {
    if (btn.getAttribute('data-cat') === catId) {
      btn.className = 'category-pill active-pill px-3 py-1 rounded-full border border-amber-600/30 bg-maroon text-white whitespace-nowrap transition';
    } else {
      btn.className = 'category-pill px-3 py-1 rounded-full border border-zinc-200 bg-white hover:bg-amber-50 text-zinc-700 whitespace-nowrap transition';
    }
  });

  const catSelect = document.getElementById('filter-category');
  if (catSelect) catSelect.value = catId;

  renderMantraCategories();
  renderMantrasGrid();

  // Scroll to all mantras section
  const target = document.getElementById('all-mantras-section');
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

function handleCategoryFilter(catId) {
  setCategoryPill(catId);
}

function handleDeityFilter(deity) {
  mantrasState.filterDeity = deity;
  renderMantrasGrid();
}

function handlePurposeFilter(purpose) {
  mantrasState.filterPurpose = purpose;
  renderMantrasGrid();
}

function handleTypeFilter(type) {
  mantrasState.filterType = type;
  renderMantrasGrid();
}

function handleMantraSort(sortBy) {
  mantrasState.sortBy = sortBy;
  renderMantrasGrid();
}

function filterByBookmarks() {
  mantrasState.bookmarkedOnly = !mantrasState.bookmarkedOnly;
  const pill = document.getElementById('pill-bookmarked');
  if (pill) {
    if (mantrasState.bookmarkedOnly) {
      pill.className = 'category-pill px-3 py-1 rounded-full border border-amber-600 bg-maroon text-white whitespace-nowrap font-medium transition flex items-center gap-1';
    } else {
      pill.className = 'category-pill px-3 py-1 rounded-full border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 whitespace-nowrap font-medium transition flex items-center gap-1';
    }
  }
  renderMantrasGrid();
}

function resetAllMantraFilters() {
  mantrasState.activeCategory = 'all';
  mantrasState.searchQuery = '';
  mantrasState.filterDeity = 'all';
  mantrasState.filterPurpose = 'all';
  mantrasState.filterType = 'all';
  mantrasState.bookmarkedOnly = false;
  mantrasState.sortBy = 'featured';

  const sInput = document.getElementById('mantras-search-input');
  if (sInput) sInput.value = '';
  document.getElementById('mantras-search-clear')?.classList.add('hidden');

  const catSel = document.getElementById('filter-category');
  if (catSel) catSel.value = 'all';

  const deitySel = document.getElementById('filter-deity');
  if (deitySel) deitySel.value = 'all';

  const purpSel = document.getElementById('filter-purpose');
  if (purpSel) purpSel.value = 'all';

  const typeSel = document.getElementById('filter-type');
  if (typeSel) typeSel.value = 'all';

  setCategoryPill('all');
  renderMantrasLibrary();
  showVedicToast('All filters have been reset.');
}

// Share Mantra Handler
function shareCurrentMantra() {
  const m = (typeof MantrasDB !== 'undefined') ? MantrasDB.getById(mantrasState.currentMantraId) : null;
  if (!m) return;

  const shareData = {
    title: `${m.title} - GURUJI Mantras Library`,
    text: `${m.sanskrit_title} — ${m.sanskrit_text}\n${m.english_meaning}`,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    copyToClipboard(`${m.title}\n${m.sanskrit_text}\n${m.english_meaning}\nRead on Guruji Sanctuary: ${window.location.href}`);
    showVedicToast('Sacred mantra link and text copied to share!');
  }
}

// Sacred Audio Chime / Singing Bowl Player with Web Audio API
function toggleMantraAudio() {
  if (mantrasState.isAudioPlaying) {
    stopMantraAudio();
  } else {
    startMantraAudio();
  }
}

function startMantraAudio() {
  mantrasState.isAudioPlaying = true;
  const playIcon = document.getElementById('audio-play-icon');
  const statusPill = document.getElementById('audio-status-pill');
  const waveContainer = document.getElementById('audio-wave-container');

  if (playIcon) playIcon.className = 'fa-solid fa-pause';
  if (statusPill) statusPill.classList.remove('hidden');

  if (waveContainer) {
    waveContainer.querySelectorAll('span').forEach(bar => {
      bar.classList.add('audio-bar-playing');
    });
  }

  // Play peaceful Vedic resonant chime
  playSacredBellTone();

  // Timer simulation
  mantrasState.audioSecondsElapsed = 0;
  clearInterval(mantrasState.audioTimerInterval);
  mantrasState.audioTimerInterval = setInterval(() => {
    mantrasState.audioSecondsElapsed++;
    const timerDisplay = document.getElementById('audio-timer-display');
    if (timerDisplay) {
      const mins = String(Math.floor(mantrasState.audioSecondsElapsed / 60)).padStart(2, '0');
      const secs = String(mantrasState.audioSecondsElapsed % 60).padStart(2, '0');
      timerDisplay.innerText = `${mins}:${secs} / 01:08`;
    }

    // Auto loop bell chime every 10 seconds
    if (mantrasState.audioSecondsElapsed % 12 === 0) {
      playSacredBellTone();
    }

    if (mantrasState.audioSecondsElapsed >= 68) {
      stopMantraAudio();
    }
  }, 1000);
}

function stopMantraAudio() {
  mantrasState.isAudioPlaying = false;
  clearInterval(mantrasState.audioTimerInterval);
  mantrasState.audioSecondsElapsed = 0;

  const playIcon = document.getElementById('audio-play-icon');
  const statusPill = document.getElementById('audio-status-pill');
  const waveContainer = document.getElementById('audio-wave-container');
  const timerDisplay = document.getElementById('audio-timer-display');

  if (playIcon) playIcon.className = 'fa-solid fa-play';
  if (statusPill) statusPill.classList.add('hidden');
  if (timerDisplay) timerDisplay.innerText = '00:00 / 01:08';

  if (waveContainer) {
    waveContainer.querySelectorAll('span').forEach(bar => {
      bar.classList.remove('audio-bar-playing');
    });
  }
}

// Synthesize authentic Vedic singing bowl / temple bell acoustic resonance
function playSacredBellTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const fundamentalFreq = 432; // Sacred cosmic tuning 432Hz
    const harmonics = [1, 2.01, 3.02, 4.2];
    const gains = [0.4, 0.2, 0.1, 0.05];

    harmonics.forEach((harmonic, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = fundamentalFreq * harmonic;

      gain.gain.setValueAtTime(gains[i], ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 4.5);
    });
  } catch (err) {
    console.warn('Web Audio note initialized:', err);
  }
}

// Devotional Floating Toast
function showVedicToast(message, variant) {
  const toast = document.getElementById('vedic-toast');
  const toastText = document.getElementById('vedic-toast-text');
  if (!toast || !toastText) return;

  toastText.innerText = message;
  toast.classList.toggle('is-error', variant === 'error');
  toast.classList.add('show');

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, variant === 'error' ? 4200 : 2800);
}

// Help Modal Controls
function openHelpModal() {
  document.getElementById('help-modal')?.classList.remove('hidden');
}

function closeHelpModal() {
  document.getElementById('help-modal')?.classList.add('hidden');
}

// Certificate Proof Modal Controls
function openCertificateModal() {
  const m = document.getElementById('certificate-modal');
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function closeCertificateModal() {
  const m = document.getElementById('certificate-modal');
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

window.openCertificateModal = openCertificateModal;
window.closeCertificateModal = closeCertificateModal;

// =============================================================================
// ADMIN PIN & MANTRA CURATION MODAL (PIN: 1008)
// =============================================================================

function openAdminMantraModal(editId = null) {
  const modal = document.getElementById('admin-mantra-modal');
  const pinScreen = document.getElementById('admin-pin-screen');
  const formScreen = document.getElementById('admin-form-screen');
  const pinInput = document.getElementById('admin-pin-input');
  const pinError = document.getElementById('admin-pin-error');
  const deleteBtn = document.getElementById('admin-delete-btn');

  if (!modal) return;

  modal.classList.remove('hidden');
  pinScreen.classList.remove('hidden');
  formScreen.classList.add('hidden');
  if (pinError) pinError.classList.add('hidden');
  if (pinInput) { pinInput.value = ''; pinInput.focus(); }

  // If already authorized in this tab, go direct to form
  if (sessionStorage.getItem('guruji_admin_pin')) {
    showAdminForm(editId);
  } else {
    document.getElementById('admin-edit-id').value = editId || '';
  }
}

function closeAdminMantraModal() {
  document.getElementById('admin-mantra-modal')?.classList.add('hidden');
}

async function verifyAdminPin() {
  const pin = document.getElementById('admin-pin-input').value.trim();
  const pinError = document.getElementById('admin-pin-error');
  if (!pin) { pinError?.classList.remove('hidden'); return; }

  // The PIN is checked by the server (ADMIN_PIN in .env), never in the browser
  let ok = false;
  try {
    const res = await fetch('/api/admin/verify', { method: 'POST', headers: { 'X-Admin-Pin': pin } });
    ok = res.ok;
    if (res.status === 429) showVedicToast('Too many attempts — please wait a minute.', 'error');
  } catch (e) {
    showVedicToast('Could not reach the server to check the PIN.', 'error');
  }
  if (ok) {
    sessionStorage.setItem('guruji_admin_pin', pin);
    pinError?.classList.add('hidden');
    showAdminForm(document.getElementById('admin-edit-id').value);
  } else {
    pinError?.classList.remove('hidden');
  }
}

function showAdminForm(editId) {
  document.getElementById('admin-pin-screen')?.classList.add('hidden');
  const formScreen = document.getElementById('admin-form-screen');
  const modalTitle = document.getElementById('admin-modal-title');
  const deleteBtn = document.getElementById('admin-delete-btn');

  if (!formScreen) return;
  formScreen.classList.remove('hidden');

  if (editId) {
    const m = (typeof MantrasDB !== 'undefined') ? MantrasDB.getById(editId) : null;
    if (m) {
      if (modalTitle) modalTitle.innerText = `Edit Sacred Mantra: ${m.title}`;
      document.getElementById('admin-edit-id').value = m.id;
      document.getElementById('admin-input-title').value = m.title || '';
      document.getElementById('admin-input-sanskrit-title').value = m.sanskrit_title || '';
      document.getElementById('admin-input-telugu-title').value = m.telugu_title || '';
      document.getElementById('admin-input-category').value = m.category || 'navagraha';
      document.getElementById('admin-input-type').value = m.mantra_type || 'Mantra';
      document.getElementById('admin-input-deity').value = m.deity || '';
      document.getElementById('admin-input-planet').value = m.planet || '';
      document.getElementById('admin-input-tags').value = (m.purpose_tags || []).join(', ');
      document.getElementById('admin-input-short-desc').value = m.short_description || '';
      document.getElementById('admin-input-sanskrit-text').value = m.sanskrit_text || '';
      document.getElementById('admin-input-telugu-text').value = m.telugu_text || '';
      document.getElementById('admin-input-translit').value = m.english_transliteration || '';
      document.getElementById('admin-input-eng-meaning').value = m.english_meaning || '';
      document.getElementById('admin-input-tel-meaning').value = m.telugu_meaning || '';
      document.getElementById('admin-input-count').value = m.recitation_guidance?.recommended_count || '';
      document.getElementById('admin-input-time').value = m.recitation_guidance?.best_time || '';
      if (deleteBtn) deleteBtn.classList.remove('hidden');
      return;
    }
  }

  // Adding new mantra
  if (modalTitle) modalTitle.innerText = 'Add New Sacred Mantra';
  document.getElementById('admin-edit-id').value = '';
  document.getElementById('admin-input-title').value = '';
  document.getElementById('admin-input-sanskrit-title').value = '';
  document.getElementById('admin-input-telugu-title').value = '';
  document.getElementById('admin-input-tags').value = '';
  document.getElementById('admin-input-short-desc').value = '';
  document.getElementById('admin-input-sanskrit-text').value = '';
  document.getElementById('admin-input-telugu-text').value = '';
  document.getElementById('admin-input-translit').value = '';
  document.getElementById('admin-input-eng-meaning').value = '';
  document.getElementById('admin-input-tel-meaning').value = '';
  document.getElementById('admin-input-count').value = '108 times daily';
  document.getElementById('admin-input-time').value = 'Brahma Muhurta';
  if (deleteBtn) deleteBtn.classList.add('hidden');
}

async function saveAdminMantra() {
  const title = document.getElementById('admin-input-title').value.trim();
  const sanskritTitle = document.getElementById('admin-input-sanskrit-title').value.trim();
  const teluguTitle = document.getElementById('admin-input-telugu-title').value.trim();
  const sanskritText = document.getElementById('admin-input-sanskrit-text').value.trim();
  const teluguText = document.getElementById('admin-input-telugu-text').value.trim();
  const translit = document.getElementById('admin-input-translit').value.trim();

  if (!title || !sanskritText || !teluguText || !translit) {
    showVedicToast('Please fill in Title, Sanskrit verse, Telugu verse and Transliteration.', 'error');
    return;
  }

  const editId = document.getElementById('admin-edit-id').value;
  const category = document.getElementById('admin-input-category').value;
  const deity = document.getElementById('admin-input-deity').value.trim();
  const planet = document.getElementById('admin-input-planet').value.trim();
  const mantraType = document.getElementById('admin-input-type').value.trim() || 'Vedic Mantra';
  const tags = document.getElementById('admin-input-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const shortDesc = document.getElementById('admin-input-short-desc').value.trim();
  const engMeaning = document.getElementById('admin-input-eng-meaning').value.trim();
  const telMeaning = document.getElementById('admin-input-tel-meaning').value.trim();
  const count = document.getElementById('admin-input-count').value.trim() || '108 times daily';
  const bestTime = document.getElementById('admin-input-time').value.trim() || 'Brahma Muhurta';

  const mantraObj = {
    title,
    sanskrit_title: sanskritTitle,
    telugu_title: teluguTitle,
    category,
    categories: [category],
    mantra_type: mantraType,
    deity,
    planet,
    purpose_tags: tags,
    short_description: shortDesc,
    introduction: shortDesc,
    sanskrit_text: sanskritText,
    telugu_text: teluguText,
    english_transliteration: translit,
    english_meaning: engMeaning,
    telugu_meaning: telMeaning,
    traditional_significance: shortDesc,
    recitation_method: 'Recite with a clean disposition and pure focus.',
    recitation_guidance: {
      recommended_count: count,
      best_time: bestTime,
      rosary_mala: 'Rudraksha or Tulasi Mala',
      facing_direction: 'East or North'
    },
    published: true,
    featured: false
  };

  try {
    if (editId) {
      await MantrasDB.updateMantra(editId, mantraObj);
      showVedicToast(`Sacred mantra "${title}" successfully updated!`);
    } else {
      await MantrasDB.addMantra(mantraObj);
      showVedicToast(`New sacred mantra "${title}" successfully added!`);
    }
  } catch (err) {
    showVedicToast(`Not saved: ${err.message}`, 'error');
    if (!sessionStorage.getItem('guruji_admin_pin')) openAdminMantraModal(editId);
    return;
  }

  closeAdminMantraModal();
  renderMantrasLibrary();

  // Update total count in hero
  const statEl = document.getElementById('stat-total-mantras');
  if (statEl) statEl.innerText = MantrasDB.getAll().length;
}

async function deleteCurrentAdminMantra() {
  const editId = document.getElementById('admin-edit-id').value;
  if (!editId) return;

  if (confirm('Are you sure you wish to remove this sacred mantra from the sanctuary library?')) {
    try {
      await MantrasDB.deleteMantra(editId);
    } catch (err) {
      showVedicToast(`Not deleted: ${err.message}`, 'error');
      return;
    }
    showVedicToast('Mantra has been removed from the library.');
    closeAdminMantraModal();
    renderMantrasLibrary();
  }
}

// =============================================================================
// LANDING PAGE INTERACTIVE EXPLORER & FAQ ACCORDION
// =============================================================================

const HOME_LINES_DATA = {
  heart: {
    badge: 'Primary Line Analysis',
    title: 'Heart Line (హృదయ రేఖ) — Emotional Nature & Relationships',
    desc: 'Originating beneath the index or middle finger and extending across the upper palm, the Heart Line reveals how you process emotions, express devotion, connect in intimate partnerships, and withstand emotional trials.',
    checkpoints: 'Depth and curvature toward the Mount of Jupiter; breaks indicating emotional resets; chained links denoting empathy; timing of soulmate intersections.'
  },
  head: {
    badge: 'Intellectual Faculty',
    title: 'Head Line (శిరో రేఖ) — Intellect, Focus & Mental Clarity',
    desc: 'Starting near the thumb and traversing across the mid-palm, the Head Line maps your intellectual focus, learning capacity, decision-making style, and mental endurance.',
    checkpoints: 'Straight line indicating pragmatic logical reasoning; curved line indicating creative artistic intuition; forks (Writer\'s Fork) signaling dual talents.'
  },
  life: {
    badge: 'Vital Pranic Force',
    title: 'Life Line (జీవన రేఖ) — Physical Vitality & Major Transitions',
    desc: 'Encircling the Mount of Venus, the Life Line reflects physical vitality, constitutional stamina, recovery power, changes of residence, and major life transitions.',
    checkpoints: 'Wide sweeping arc denoting radiant vitality and enthusiasm; branches pointing toward Jupiter denoting early life ambition; protective sister lines.'
  },
  fate: {
    badge: 'Karmic Destiny',
    title: 'Fate Line (భాగ్య రేఖ) — Career Trajectory & Material Destiny',
    desc: 'Rising vertically from the base of the palm toward the Mount of Saturn, the Fate Line reflects career milestones, financial shifts, and outer worldly achievements.',
    checkpoints: 'Ascent from the Moon mount showing career fueled by public support; changes in direction marking career pivots; intersections with head line around age 35.'
  },
  mounts: {
    badge: 'Planetary Vortexes',
    title: 'Planetary Mounts (గ్రహ పర్వతాలు) — Cosmic Archetype Energy Zones',
    desc: 'The 7 planetary mounts correspond to the energetic archetypes of Vedic astrology: Jupiter (leadership/guru), Saturn (discipline/karma), Apollo/Sun (fame/dharma), and Venus (vitality/love).',
    checkpoints: 'Elevation and firmness of mounts; auspicious symbols like fish (Matsya), lotus (Padma), and trident (Trishula) that magnify planetary blessings.'
  }
};

function selectHomeLine(lineKey) {
  const data = HOME_LINES_DATA[lineKey];
  if (!data) return;

  const badgeEl = document.getElementById('home-line-badge');
  const titleEl = document.getElementById('home-line-title');
  const descEl = document.getElementById('home-line-desc');
  const checkEl = document.getElementById('home-line-checkpoints');

  if (badgeEl) badgeEl.innerText = data.badge;
  if (titleEl) titleEl.innerText = data.title;
  if (descEl) descEl.innerText = data.desc;
  if (checkEl) checkEl.innerText = data.checkpoints;

  // Toggle button active styles
  ['heart', 'head', 'life', 'fate', 'mounts'].forEach(key => {
    const btn = document.getElementById(`home-line-btn-${key}`);
    if (btn) {
      if (key === lineKey) {
        btn.className = 'w-full text-left p-3.5 rounded-xl border border-amber-600/40 bg-maroon text-white flex items-center justify-between transition shadow-xs';
      } else {
        btn.className = 'w-full text-left p-3.5 rounded-xl border border-zinc-200 bg-paper text-night-2 hover:bg-amber-50 flex items-center justify-between transition';
      }
    }
  });
}

function toggleFaq(faqId) {
  const el = document.getElementById(faqId);
  const icon = document.getElementById(`icon-${faqId}`);
  if (!el) return;

  const isHidden = el.classList.contains('hidden');
  if (isHidden) {
    el.classList.remove('hidden');
    if (icon) icon.className = 'fa-solid fa-chevron-up text-xs text-amber-700';
  } else {
    el.classList.add('hidden');
    if (icon) icon.className = 'fa-solid fa-chevron-down text-xs text-amber-700';
  }
}

// =============================================================================
// OFFERINGS TABS, COURSES MODAL & DAAN SEVA HANDLERS
// =============================================================================

function switchOfferingsTab(tabName) {
  const tabs = ['showcase', 'courses', 'daan'];
  tabs.forEach(t => {
    const view = document.getElementById(`offerings-view-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (view) {
      if (t === tabName) view.classList.remove('hidden');
      else view.classList.add('hidden');
    }
    if (btn) {
      if (t === tabName) {
        btn.className = 'px-4 py-2 rounded-full border border-amber-600/40 bg-maroon text-white font-semibold shadow-xs transition flex items-center gap-1.5 whitespace-nowrap';
      } else {
        btn.className = 'px-4 py-2 rounded-full border border-line-strong bg-white hover:bg-amber-50 text-night-2 font-medium transition flex items-center gap-1.5 whitespace-nowrap';
      }
    }
  });
}

const COURSES_DATA = {
  palmistry: {
    title: 'Palmistry Course — Hasta Samudrika Shastra',
    badge: 'Hasta Samudrika Shastra',
    duration: '6 Weeks • Live Zoom with Swamiji',
    price: '₹4,999',
    desc: 'Comprehensive certified curriculum directly taught by Adiguru Swamiji. Learn to accurately identify hand shapes, analyze line curvatures, planetary mounts, age markers, and prescribe Vedic remedies.'
  },
  astrology: {
    title: 'Vedic Astrology Course — Jyotisha Shastra',
    badge: 'Jyotisha Shastra Fundamentals',
    duration: '8 Weeks • Live Interactive Cohort',
    price: '₹5,999',
    desc: 'Foundational and predictive Vedic Astrology. Covers the 12 Rashis, 9 Grahas, 27 Nakshatras, Kundali casting, Dasha-Bhukti analysis, and Muhurta calculation.'
  },
  sanatana: {
    title: 'Sanatana Dharma & Vedic Wisdom Course',
    badge: 'Veda & Upanishad Philosophy',
    duration: '4 Weeks • Guided Sadhana',
    price: '₹2,999',
    desc: 'Deep dive into Sanatana Dharma, the law of Karma (Sanchita, Prarabdha, Agami), Bhagavad Gita teachings, and daily Vedic living principles.'
  },
  practices: {
    title: 'Spiritual Practices Course — Poojas, Mantras & Remedies',
    badge: 'Agama & Mantra Vidya',
    duration: '4 Weeks • Daily Practice',
    price: '₹3,499',
    desc: 'Learn proper Sanskrit acoustic pronunciation, Beeja mantra chanting methods, Sandhyavandanam, and home puja rituals for spiritual purification and peace.'
  }
};

let currentSelectedCourse = 'palmistry';

// The course pages carry the real curriculum, fees and dates (Admin → Courses),
// so the old modal now simply opens the matching course page.
const COURSE_PAGES = {
  palmistry: '/courses/foundation-course-in-palmistry',
  astrology: '/courses/introduction-to-vedic-astrology',
  sanatana: '/courses/sanatana-dharma-and-practical-living',
  practices: '/courses/chakra-awareness-and-meditation'
};

function openCourseModal(type = 'palmistry') {
  if (typeof navigate === 'function') return navigate(COURSE_PAGES[type] || '/courses');
  currentSelectedCourse = type;
  const course = COURSES_DATA[type] || COURSES_DATA.palmistry;
  
  const titleEl = document.getElementById('course-modal-title');
  const badgeEl = document.getElementById('course-modal-badge');
  const durationEl = document.getElementById('course-modal-duration');
  const priceEl = document.getElementById('course-modal-price');
  const descEl = document.getElementById('course-modal-desc');

  if (titleEl) titleEl.innerText = course.title;
  if (badgeEl) badgeEl.innerText = course.badge;
  if (durationEl) durationEl.innerText = course.duration;
  if (priceEl) priceEl.innerText = 'On enquiry';
  if (descEl) descEl.innerText = course.desc;

  document.getElementById('course-details-modal')?.classList.remove('hidden');
}

function closeCourseModal() {
  document.getElementById('course-details-modal')?.classList.add('hidden');
}

function confirmCourseRegistration() {
  // Nothing is confirmed until we have spoken to the student: this opens the enquiry form.
  closeCourseModal();
  const slug = (COURSE_PAGES[currentSelectedCourse] || '').split('/').pop();
  if (typeof navigate === 'function') navigate('/contact?kind=course' + (slug ? '&service=' + encodeURIComponent(slug) : ''));
  else showPage('contact');
}

// Daan & Charity Modal
let currentDaan = { title: 'Gau Seva & Daan', amount: 1100 };

function openDaanModal(title, amount) {
  currentDaan = { title, amount };
  const titleEl = document.getElementById('daan-modal-title');
  const amountEl = document.getElementById('daan-modal-amount');
  const descEl = document.getElementById('daan-modal-desc');

  if (titleEl) titleEl.innerText = title;
  if (amountEl) amountEl.innerText = `₹${amount.toLocaleString('en-IN')}`;
  if (descEl) descEl.innerText = `Your sacred contribution of ₹${amount} for ${title} will be performed with sankalpa in your family's name at Varanasi Peetham.`;

  document.getElementById('daan-seva-modal')?.classList.remove('hidden');
}

function closeDaanModal() {
  document.getElementById('daan-seva-modal')?.classList.add('hidden');
}

function confirmDaanDonation() {
  // Daan is arranged personally: we take the request here and send payment details back.
  closeDaanModal();
  showVedicToast(`Please tell us about the ${currentDaan.title} you wish to offer — we will send the details.`);
  if (typeof navigate === 'function') navigate('/contact'); else showPage('contact');
}

// ---------------------------------------------------------------------------
// Manual Testing Support: 1 Rupee Mode
// ---------------------------------------------------------------------------
function applyOneRupeeUI() {
  window.TEST_ONE_RUPEE = true;
  if (window.state && window.state.selectedService) {
    window.state.selectedService.price = 1;
  }
  if (Array.isArray(window.selectedPoojas)) {
    window.selectedPoojas.forEach(p => p.price = 1);
  }
  const consultFee = document.getElementById("consult-summary-fee");
  if (consultFee) consultFee.textContent = "₹ 1";
  const poojaTotal = document.getElementById("pooja-total-amount");
  if (poojaTotal) poojaTotal.textContent = "₹ 1";
  const payDisplay = document.getElementById("pay-amount-display");
  if (payDisplay) payDisplay.textContent = "₹ 1";

  document.querySelectorAll(".pooja-card__price").forEach(el => {
    el.textContent = "₹ 1";
  });
  document.querySelectorAll(".consult-card .text-ink").forEach(el => {
    if (el.textContent.trim().startsWith("₹")) el.textContent = "₹ 1";
  });
  document.querySelectorAll(".text-maroon, .text-gold, .text-ink").forEach(el => {
    const txt = el.textContent.trim();
    if (txt === "₹549" || txt === "₹749" || txt === "₹3,100" || txt === "₹5,100" || txt === "₹2,100" || txt === "₹4,100" || txt === "₹ 549" || txt === "₹ 749" || txt === "₹ 3,100" || txt === "₹ 5,100") {
      el.textContent = "₹ 1";
    }
  });
  document.querySelectorAll("button, a").forEach(el => {
    if (el.textContent.includes("₹549") || el.textContent.includes("₹749") || el.textContent.includes("₹3,100") || el.textContent.includes("₹5,100") || el.textContent.includes("₹2,100") || el.textContent.includes("₹4,100")) {
      el.textContent = el.textContent.replace(/₹\s*[0-9,]+/g, "₹1");
    }
  });
}
window.applyOneRupeeUI = applyOneRupeeUI;
if (typeof window !== 'undefined' && window.TEST_ONE_RUPEE) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOneRupeeUI);
  } else {
    applyOneRupeeUI();
  }
}

// =========================================================================
// SEEKER ACCOUNT PORTAL CONTROLLER
// =========================================================================
window.toggleAuthTab = function(tab) {
  const signinForm = document.getElementById("cust-signin-form");
  const signupForm = document.getElementById("cust-signup-form");
  const tabSignin = document.getElementById("tab-btn-signin");
  const tabSignup = document.getElementById("tab-btn-signup");
  if (!signinForm || !signupForm) return;

  if (tab === 'signup') {
    signinForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    tabSignup.classList.add("border-maroon", "text-maroon");
    tabSignup.classList.remove("border-transparent", "text-ink-3");
    tabSignin.classList.remove("border-maroon", "text-maroon");
    tabSignin.classList.add("border-transparent", "text-ink-3");
  } else {
    signupForm.classList.add("hidden");
    signinForm.classList.remove("hidden");
    tabSignin.classList.add("border-maroon", "text-maroon");
    tabSignin.classList.remove("border-transparent", "text-ink-3");
    tabSignup.classList.remove("border-maroon", "text-maroon");
    tabSignup.classList.add("border-transparent", "text-ink-3");
  }
};

window.handleCustomerLogin = async function(e) {
  e.preventDefault();
  const idEl = document.getElementById("cust-login-id");
  const pwdEl = document.getElementById("cust-login-pwd");
  const errEl = document.getElementById("cust-login-err");
  const btn = document.getElementById("cust-login-btn");
  if (!idEl || !pwdEl) return;

  const identifier = idEl.value.trim();
  const password = pwdEl.value;

  if (!identifier || !password) {
    if (errEl) { errEl.textContent = "Please enter your mobile/email and password."; errEl.classList.remove("hidden"); }
    return;
  }

  if (errEl) errEl.classList.add("hidden");
  if (btn) { btn.disabled = true; btn.textContent = "Signing In..."; }

  try {
    const res = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok || !(data.ok || data.success)) throw new Error(data.error || "Login failed");

    localStorage.setItem("guruji_cust_token", data.token);
    if (data.customer && typeof state !== 'undefined' && state.user) {
      state.user.name = data.customer.name || state.user.name;
      state.user.email = data.customer.email || state.user.email;
      state.user.mobile = data.customer.mobile || state.user.mobile;
      state.user.customerId = data.customer.id;
    }
    if (typeof showVedicToast === "function") {
      showVedicToast(`Namaste ${data.customer.name}, welcome back!`, "success");
    }
    renderAccountPortal();
  } catch (err) {
    if (errEl) { errEl.textContent = err.message || "Invalid credentials. Please try again."; errEl.classList.remove("hidden"); }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
  }
};

window.handleCustomerSignup = async function(e) {
  e.preventDefault();
  // Name, email and password only: the mobile number and the agreement to the
  // terms are asked on the payment page, before any booking is paid for.
  const name = (document.getElementById("cust-reg-name")?.value || "").trim();
  const email = (document.getElementById("cust-reg-email")?.value || "").trim().toLowerCase();
  const password = document.getElementById("cust-reg-pwd")?.value || "";
  const errEl = document.getElementById("cust-signup-err");
  const btn = document.getElementById("cust-signup-btn");
  const fail = (msg) => { if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); } };

  if (name.length < 2) return fail("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email address.");
  if (password.length < 6) return fail("Password must be at least 6 characters.");

  if (errEl) errEl.classList.add("hidden");
  if (btn) { btn.disabled = true; btn.textContent = "Creating Account..."; }
  try {
    const res = await fetch("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok || !(data.ok || data.success)) throw new Error(data.error || "Registration failed");

    localStorage.setItem("guruji_cust_token", data.token);
    if (data.customer && typeof state !== 'undefined' && state.user) {
      state.user.name = data.customer.name;
      state.user.email = data.customer.email;
      state.user.mobile = data.customer.mobile;
      state.user.customerId = data.customer.id;
    }
    if (typeof showVedicToast === "function") showVedicToast(`Namaste ${data.customer.name}, your account is created!`, "success");
    renderAccountPortal();
  } catch (err) {
    fail(err.message || "Failed to create account.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
  }
};

window.toggleProfileEdit = function() {
  const form = document.querySelector("[data-profile-form]");
  const label = document.querySelector("[data-edit-label]");
  if (!form) return;
  const opening = form.classList.contains("hidden");
  form.classList.toggle("hidden", !opening);
  if (label) label.textContent = opening ? "Close" : "Edit profile";
  if (opening) form.querySelector("input")?.focus();
};

/** Saves the profile: used by the edit form and by the "almost there" card. */
window.saveCustomerProfile = async function(e, form) {
  e.preventDefault();
  const token = localStorage.getItem("guruji_cust_token");
  const errEl = form.querySelector("[data-profile-error]");
  const btn = form.querySelector("button[type=submit]");
  const body = {};
  ["name", "mobile", "email"].forEach(k => {
    const field = form.elements[k];
    if (field) body[k] = k === "mobile" ? field.value.replace(/\D/g, "").slice(-10) : field.value.trim();
  });
  const pwd = form.elements.password;
  if (pwd && pwd.value) body.password = pwd.value;
  if (errEl) errEl.classList.add("hidden");
  if (btn) { btn.disabled = true; btn.dataset.was = btn.textContent; btn.textContent = "Saving…"; }
  try {
    const res = await fetch("/api/customer/me", {
      method: "PATCH",
      headers: custHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || !(data.ok || data.success)) throw new Error(data.error || "Could not save your details.");
    if (data.customer && typeof state !== "undefined" && state.user) {
      state.user.name = data.customer.name;
      state.user.email = data.customer.email;
      state.user.mobile = data.customer.mobile;
    }
    if (typeof showVedicToast === "function") showVedicToast("Your details are saved.", "success");
    renderAccountPortal();
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.was || "Save"; }
  }
};

/** The server accepts the session token as a Bearer header, an x-customer-token
 *  header or a cookie. Send the first two so no deployment can miss it. */
function custHeaders(token, extra) {
  return Object.assign({
    "Authorization": `Bearer ${token}`,
    "x-customer-token": token
  }, extra || {});
}

window.handleCustomerLogout = async function() {
  // The server holds a session cookie as well, so ending the session has to
  // tell it; clearing localStorage alone would leave the cookie signed in.
  const token = localStorage.getItem("guruji_cust_token");
  localStorage.removeItem("guruji_cust_token");
  try {
    await fetch("/api/customer/logout", {
      method: "POST",
      headers: token ? { "x-customer-token": token } : {}
    });
  } catch (e) { /* the local session is gone either way */ }
  if (typeof showVedicToast === "function") {
    showVedicToast("You have signed out of your account.", "info");
  }
  if (window.setBottomNav) { window.setBottomNav('site'); window.markBottomNav('account'); }
  renderAccountPortal();
};

window.fillAndTrack = function(orderId, contact) {
  setTimeout(() => {
    const orderInput = document.getElementById("track-order");
    const contactInput = document.getElementById("track-mobile");
    if (orderInput && orderId) orderInput.value = orderId;
    if (contactInput && contact) contactInput.value = contact;
    if (typeof trackBooking === "function") trackBooking(null);
  }, 100);
};

window.resumeHeldBooking = function() {
  restoreHeldSlot();
  if (typeof showPage === "function") {
    showPage("book-payment");
  }
};

// ==========================================
// REPORT CAROUSELS (seeker dashboard)
// ==========================================
// Two swipeable rows of book-style cards: the seeker's own readings, and the
// reading services they can order. Covers are drawn in CSS from the service's
// own photo, so every report looks like a bound book without extra artwork.

const rpEsc = (v) => escapeHTML(String(v == null ? '' : v));
const rpRupees = (n) => '₹' + Number(n).toLocaleString('en-IN');

function rpServiceFor(b) {
  const services = ((window.SITE && window.SITE.content) || window.GURUJI_CONTENT || {}).services || [];
  const sv = b.service || {};
  return services.find(s => s.consultationId && s.consultationId === sv.id) ||
         services.find(s => s.slug === sv.id) ||
         services.find(s => s.title === sv.title) || null;
}
function rpImage(svc) {
  const content = (window.SITE && window.SITE.content) || window.GURUJI_CONTENT || {};
  if (svc && svc.image) return svc.image;
  const cat = svc && (content.serviceCategories || []).find(c => c.id === svc.category);
  return (cat && cat.image) || '/assets/hero_palm_art_clean.jpg';
}

/** The cover: a bound book standing in the service's own photograph. */
function rpCover(title, image, kicker, byline) {
  return `
    <span class="rp-scene" style="--rp-img:url('${rpEsc(image)}')" aria-hidden="true">
      <span class="rp-book">
        <span class="rp-book__inner">
          <span class="rp-book__brand">✦ Guruji Palmistry ✦</span>
          <span class="rp-book__title">${rpEsc(title)}</span>
          <span class="rp-book__rule">${rpEsc(kicker)}</span>
          <span class="rp-book__medal" style="background-image:url('${rpEsc(image)}')"></span>
          <span class="rp-book__by">${rpEsc(byline)}</span>
        </span>
      </span>
      <span class="rp-plinth"></span>
    </span>`;
}

function rpCarousel(id, eyebrow, heading, lead, cards) {
  return `
    <section class="rp" data-rp="${id}" aria-labelledby="rp-${id}-h">
      <p class="rp__eyebrow">${rpEsc(eyebrow)}</p>
      <h3 class="rp__h" id="rp-${id}-h">${heading}</h3>
      ${lead ? `<p class="rp__lead">${rpEsc(lead)}</p>` : ''}
      <div class="rp__viewport">
        <button type="button" class="rp__nav rp__nav--prev" data-rp-prev aria-label="Previous report"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>
        <div class="rp__track" data-rp-track tabindex="0" role="list">${cards.join('')}</div>
        <button type="button" class="rp__nav rp__nav--next" data-rp-next aria-label="Next report"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </div>
      <div class="rp__dots" data-rp-dots aria-hidden="true">${cards.map((_, i) => `<i${i ? '' : ' class="is-on"'}></i>`).join('')}</div>
    </section>`;
}

/** The seeker's own readings: ready ones download, the rest say where they are. */
function myReportsHtml(bookings, cust) {
  const mine = bookings.filter(b => b.type !== 'pooja' && !['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(b.status));
  if (!mine.length) return '';
  const cards = mine.map((b) => {
    // The booking's own mobile: a booking found by email may carry another number.
    const m = (b.devotee && b.devotee.mobile) || cust.mobile;
    const mobileQs = m ? '?mobile=' + encodeURIComponent(m) : '';
    const svc = rpServiceFor(b);
    const title = (b.service && b.service.title) || (svc && svc.title) || 'Your reading';
    const ready = b.report && b.report.status === 'ready';
    const id = encodeURIComponent(b.orderId);
    const file = ready && b.reportFile ? `/api/bookings/${id}/report-file.pdf${mobileQs}` : '';
    const written = ready ? `/api/bookings/${id}/report.pdf${mobileQs}` : '';
    const main = file || written;
    const when = b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return `
      <article class="rp-card${ready ? ' rp-card--ready' : ''}" role="listitem">
        ${main
          ? `<a class="rp-card__cover" href="${main}" target="_blank" rel="noopener" aria-label="Open your ${rpEsc(title)} reading">${rpCover(title, rpImage(svc), 'Report', 'Prepared for ' + (cust.name || 'you').split(' ')[0])}</a>`
          : `<a class="rp-card__cover" href="/track" data-link onclick="fillAndTrack('${rpEsc(b.orderId)}', '${rpEsc(cust.mobile || cust.email || '')}')" aria-label="See how your ${rpEsc(title)} reading is coming along">${rpCover(title, rpImage(svc), 'Report', 'Prepared for ' + (cust.name || 'you').split(' ')[0])}</a>`}
        <div class="rp-card__foot">
          <div class="rp-card__text">
            <h4 class="rp-card__title">${rpEsc(title)}</h4>
            <p class="rp-card__meta">${ready
              ? '<span class="rp-pill rp-pill--ready"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Ready</span>'
              : '<span class="rp-pill"><i class="fa-regular fa-hourglass-half" aria-hidden="true"></i> Being prepared</span>'}
              <span>${rpEsc(when)}</span></p>
            ${file && written ? `<a class="rp-card__alt" href="${written}" target="_blank" rel="noopener">Also: the typed reading ↗</a>` : ''}
          </div>
          ${main
            ? `<a class="rp-go" href="${main}" target="_blank" rel="noopener" download aria-label="Download ${rpEsc(title)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></a>`
            : `<a class="rp-go rp-go--muted" href="/track" data-link onclick="fillAndTrack('${rpEsc(b.orderId)}', '${rpEsc(cust.mobile || cust.email || '')}')" aria-label="Track ${rpEsc(title)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`}
        </div>
      </article>`;
  });
  return rpCarousel('mine', 'Your readings', 'My <em>Reports</em>',
    'Readings Guruji has prepared for you. Tap a ready one to open or download it.', cards);
}

/** Reading services the seeker can order, priced ones first. A struck-through
 *  price and "% OFF" appear only when the owner has set an original price. */
function reportShopHtml() {
  const content = (window.SITE && window.SITE.content) || window.GURUJI_CONTENT || {};
  const list = (content.services || [])
    .filter(s => s.published !== false && ['palmistry', 'astrology'].includes(s.category))
    .sort((a, b) => (Number(b.price) > 0) - (Number(a.price) > 0) || (b.core ? 1 : 0) - (a.core ? 1 : 0))
    .slice(0, 10);
  if (!list.length) return '';
  const cards = list.map((s) => {
    const price = Number(s.price) > 0 ? Number(s.price) : 0;
    const mrp = Number(s.mrp) > price ? Number(s.mrp) : 0;
    const off = price && mrp ? Math.round((mrp - price) / mrp * 100) : 0;
    const href = '/services/' + encodeURIComponent(s.slug);
    return `
      <article class="rp-card" role="listitem">
        <a class="rp-card__cover" href="${href}" data-link aria-label="${rpEsc(s.title)}">${rpCover(s.title.replace(/ —.*$/, ''), rpImage(s), s.category === 'astrology' ? 'Kundali Report' : 'Palm Report', 'By Guruji')}</a>
        <div class="rp-card__foot">
          <div class="rp-card__text">
            <h4 class="rp-card__title">${rpEsc(s.title)}</h4>
            <p class="rp-price">${price
              ? `<b>${rpRupees(price)}</b>${mrp ? ` <s>${rpRupees(mrp)}</s> <span class="rp-off">${off}% OFF</span>` : ''}`
              : '<span class="rp-price--ask">Fee on enquiry</span>'}</p>
          </div>
          <a class="rp-go" href="${href}" data-link aria-label="See ${rpEsc(s.title)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        </div>
      </article>`;
  });
  return rpCarousel('shop', 'Personalised reports', 'Kundli &amp; Palm <em>Reports</em>',
    'Detailed, personalised reports prepared from your birth chart and your palms.', cards);
}

/** Arrows, dots and the "front" card for every report row on the page. */
function initReportCarousels(scope) {
  (scope || document).querySelectorAll('[data-rp]').forEach((row) => {
    const track = row.querySelector('[data-rp-track]');
    const cards = [...track.children];
    const dots = [...row.querySelectorAll('[data-rp-dots] i')];
    const step = () => (cards[0] ? cards[0].getBoundingClientRect().width + 16 : 300);
    const mark = () => {
      const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
      let best = 0, dist = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      cards.forEach((c, i) => c.classList.toggle('is-active', i === best));
      dots.forEach((d, i) => d.classList.toggle('is-on', i === best));
      row.querySelector('[data-rp-prev]').disabled = track.scrollLeft < 4;
      row.querySelector('[data-rp-next]').disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
    };
    let raf = 0;
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); }, { passive: true });
    row.querySelector('[data-rp-prev]').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    row.querySelector('[data-rp-next]').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    addEventListener('resize', mark, { passive: true });
    mark();
  });
}

window.renderAccountPortal = async function() {
  const container = document.getElementById("account-portal-container") || document.getElementById("page-account");
  if (!container) return;

  const token = localStorage.getItem("guruji_cust_token");
  if (!token) {
    container.innerHTML = `
      <div class="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-line shadow-lg space-y-6">
        <div class="text-center space-y-1">
          <div class="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl mb-2">
            <i class="fa-regular fa-user"></i>
          </div>
          <h2 class="font-serif text-2xl font-bold text-night-2">Seeker Account</h2>
          <p class="text-xs text-ink-3">Sign in or create an account to view your consultations, pooja bookings and reports.</p>
        </div>

        <!-- Google Continue -->
        <button type="button" onclick="loginWithGoogle()" class="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-line bg-white hover:bg-zinc-50 font-medium text-ink shadow-xs transition text-xs">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span class="font-semibold">Continue with Google</span>
        </button>

        <div class="relative flex items-center justify-center">
          <div class="border-t border-line w-full"></div>
          <span class="bg-white px-3 text-2xs text-ink-3 uppercase whitespace-nowrap">or with password</span>
          <div class="border-t border-line w-full"></div>
        </div>

        <div class="flex border-b border-line text-xs font-semibold">
          <button type="button" onclick="toggleAuthTab('signin')" id="tab-btn-signin" class="flex-1 py-2.5 text-center border-b-2 border-maroon text-maroon">Sign In</button>
          <button type="button" onclick="toggleAuthTab('signup')" id="tab-btn-signup" class="flex-1 py-2.5 text-center border-b-2 border-transparent text-ink-3 hover:text-ink">Create Account</button>
        </div>

        <!-- Sign In Form -->
        <form id="cust-signin-form" onsubmit="handleCustomerLogin(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-ink mb-1">Mobile Number or Email</label>
            <input type="text" id="cust-login-id" required placeholder="98765 43210 or seeker@example.com" class="w-full px-3.5 py-2.5 rounded-xl border border-line focus:border-maroon focus:outline-none text-ink">
          </div>
          <div>
            <label class="block font-semibold text-ink mb-1">Password</label>
            <input type="password" id="cust-login-pwd" required placeholder="Your password" class="w-full px-3.5 py-2.5 rounded-xl border border-line focus:border-maroon focus:outline-none text-ink">
          </div>
          <div id="cust-login-err" class="hidden text-red-600 text-xs bg-red-50 p-2.5 rounded-xl border border-red-200"></div>
          <button type="submit" id="cust-login-btn" class="w-full crimson-gradient-btn py-3 rounded-xl font-medium text-xs shadow-md">Sign In</button>
        </form>

        <!-- Sign Up Form -->
        <form id="cust-signup-form" onsubmit="handleCustomerSignup(event)" class="space-y-4 text-xs hidden">
          <div>
            <label class="block font-semibold text-ink mb-1">Full Name <span class="text-red-500">*</span></label>
            <input type="text" id="cust-reg-name" required placeholder="Your full name" class="w-full px-3.5 py-2.5 rounded-xl border border-line focus:border-maroon focus:outline-none text-ink">
          </div>
          <div>
            <label class="block font-semibold text-ink mb-1">Email Address <span class="text-red-500">*</span></label>
            <input type="email" id="cust-reg-email" required placeholder="you@example.com" class="w-full px-3.5 py-2.5 rounded-xl border border-line focus:border-maroon focus:outline-none text-ink">
          </div>
          <div>
            <label class="block font-semibold text-ink mb-1">Password <span class="text-red-500">*</span></label>
            <input type="password" id="cust-reg-pwd" required minlength="6" placeholder="At least 6 characters" class="w-full px-3.5 py-2.5 rounded-xl border border-line focus:border-maroon focus:outline-none text-ink">
          </div>

          <p class="text-2xs text-ink-3"><i class="fa-solid fa-circle-info text-amber-700"></i> Your mobile number and the terms are asked once, on the payment page.</p>
          <div id="cust-signup-err" class="hidden text-red-600 text-xs bg-red-50 p-2.5 rounded-xl border border-red-200"></div>
          <button type="submit" id="cust-signup-btn" class="w-full gold-gradient-btn py-3 rounded-xl font-semibold text-xs shadow-md">Create Account</button>
        </form>

        <div class="text-center pt-2 border-t border-line">
          <a href="/track" data-link class="text-xs text-maroon hover:underline">Quick track a consultation with Booking ID →</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="text-center py-12"><i class="fa-solid fa-spinner fa-spin text-2xl text-maroon"></i><p class="text-xs text-ink-3 mt-2">Loading your account...</p></div>`;

  try {
    const res = await fetch("/api/customer/me", { headers: custHeaders(token) });
    const data = await res.json();
    if (!res.ok || !(data.ok || data.success || data.customer)) {
      localStorage.removeItem("guruji_cust_token");
      renderAccountPortal();
      return;
    }

    const cust = data.customer;
    const bRes = await fetch("/api/customer/bookings", { headers: custHeaders(token) });
    const bData = await bRes.json();
    const bookings = Array.isArray(bData.bookings) ? bData.bookings : [];

    let slotResumeHtml = "";
    const rawSlot = sessionStorage.getItem("guruji_held_slot");
    if (rawSlot) {
      try {
        const held = JSON.parse(rawSlot);
        if (held && Date.now() - (held.timestamp || 0) < 45 * 60 * 1000) {
          slotResumeHtml = `
            <div class="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-2xs font-bold uppercase"><i class="fa-solid fa-calendar-check"></i> Reserved Slot</span>
                <div class="font-serif font-bold text-night-2 text-base mt-1">${held.service?.title || 'Consultation'} on ${held.date} at ${held.time}</div>
                <div class="text-xs text-ink-3">Your appointment slot is safely held. Continue to payment.</div>
              </div>
              <button type="button" onclick="resumeHeldBooking()" class="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm">
                Continue to Payment →
              </button>
            </div>
          `;
        }
      } catch (e) {}
    }

    if (window.AccountUI) {
      window.AccountUI.render(container, { cust, bookings, token, slotResumeHtml });
      return;
    }
    container.innerHTML = `<div class="space-y-6">${slotResumeHtml}${myReportsHtml(bookings, cust)}${reportShopHtml()}</div>`;
    initReportCarousels(container);
  } catch (e) {
    container.innerHTML = `<div class="bg-white p-6 rounded-2xl border border-line text-center text-xs text-red-600">Failed to load account details. <button onclick="renderAccountPortal()" class="underline font-semibold ml-2">Retry</button></div>`;
  }
};

// ==========================================
// LEGAL POLICY MODAL CONTROLLER
// ==========================================

window.openPolicyModal = function(policySlug, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const modal = document.getElementById("policy-modal");
  if (!modal) return;
  const titleEl = document.getElementById("policy-modal-title");
  const subEl = document.getElementById("policy-modal-sub");
  const bodyEl = document.getElementById("policy-modal-body");

  const content = (typeof GURUJI_CONTENT !== 'undefined' ? GURUJI_CONTENT : (window.GURUJI_CONTENT || {}));
  const policies = content.policies || {};
  const p = policies[policySlug];

  if (!p) {
    if (bodyEl) bodyEl.innerHTML = `<p class="text-xs text-red-600">Policy not found.</p>`;
    modal.classList.remove("hidden");
    return;
  }

  if (titleEl) titleEl.innerText = p.title || 'Legal Document';
  if (subEl) subEl.innerText = `Version ${p.version || '1.0'} · Updated ${p.updated || 'November 2026'}`;
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="space-y-6 text-ink-2 text-xs sm:text-sm leading-relaxed">
        <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-2xs text-amber-900 flex items-center gap-2">
          <i class="fa-solid fa-stamp text-amber-700 text-sm"></i>
          <span>Official policy document of Guruji Palmistry. Certified compliant with DPDP Act 2023 and Indian Laws.</span>
        </div>
        ${p.sections.map(([h, b], i) => `
          <div class="space-y-1.5 pb-4 ${i > 0 ? 'border-t border-line/60 pt-4' : ''}">
            <h4 class="font-serif font-bold text-sm sm:text-base text-amber-950 flex items-center gap-2">
              <span class="w-5 h-5 rounded bg-amber-100 text-amber-900 text-2xs font-bold flex items-center justify-center shrink-0">${i + 1}</span>
              <span>${escapeHtml(h.replace(/^\d+\.\s*/, ''))}</span>
            </h4>
            <div class="whitespace-pre-line text-ink-2 pl-7">${escapeHtml(b)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

window.closePolicyModal = function() {
  const modal = document.getElementById("policy-modal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
};

// Close modal on Escape key or backdrop click
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    window.closePolicyModal();
  }
});

document.addEventListener("click", function(e) {
  const modal = document.getElementById("policy-modal");
  if (modal && !modal.classList.contains("hidden") && e.target === modal) {
    window.closePolicyModal();
  }
});




