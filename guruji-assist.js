/* Guruji Palmistry — helpers for Guruji's own screens.
 *
 * Guruji is an elder and works alone. Everything here is meant to save him a
 * step or a squint:
 *   - speak instead of type (a microphone on every box, Telugu, Hindi or English)
 *   - bigger text, remembered on this computer
 *   - a large "write a note" box on a palm photo, in place of the small browser
 *     prompt, with tap-to-add palm words
 *   - seeker messages read aloud
 *   - ready-made replies he can tap, edit and send
 *   - a "what is left to do" strip on every case
 *
 * Nothing here writes a reading for him. Quick replies and palm words only
 * fill a box; he reads, edits and presses Send himself.
 *
 * Loaded only when a Guruji page opens, so seekers never download it.
 */
(function () {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gj_' + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gj_' + k, v); } catch (e) { /* private mode */ } }
  };

  /* ------------------------------------------------------------ voice typing */

  const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LANGS = [['en-IN', 'English'], ['te-IN', 'తెలుగు'], ['hi-IN', 'हिन्दी']];
  const lang = () => store.get('lang', 'en-IN');
  let live = null;   // the one microphone that is listening

  function stopListening() {
    if (!live) return;
    try { live.rec.stop(); } catch (e) { /* already stopped */ }
    live.btn.classList.remove('is-live');
    live.btn.setAttribute('aria-pressed', 'false');
    live.btn.querySelector('span').textContent = 'Speak';
    live = null;
  }

  /** Speak text option removed per user request */
  function attachMic(box, opts = {}) {
    return null;
  }

  function say(msg, variant) {
    if (typeof window.showVedicToast === 'function') window.showVedicToast(msg, variant);
  }

  /* -------------------------------------------------------------- read aloud */

  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang();
    u.rate = Number(store.get('rate', '0.9'));
    const voice = speechSynthesis.getVoices().find(v => v.lang === u.lang) ||
                  speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith(u.lang.slice(0, 2)));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  /* ------------------------------------------------------------ bigger text */

  function applySize() {
    document.documentElement.classList.toggle('gj-big', store.get('big', '0') === '1');
  }

  /* ----------------------------------------------------------- the toolbar */

  /** The strip at the top of a Guruji page: text size, voice language, help. */
  function toolbar() {
    applySize();
    const big = store.get('big', '0') === '1';
    return `
      <div class="gj-bar" role="toolbar" aria-label="Easy reading tools">
        <button type="button" class="gj-bar__btn${big ? ' is-on' : ''}" data-gj="big" aria-pressed="${big}">
          <span class="gj-bar__aa" aria-hidden="true">A<b>A</b></span> ${big ? 'Normal text' : 'Bigger text'}</button>
        ${Recog || 'speechSynthesis' in window ? `
        <label class="gj-bar__lang"><i class="fa-solid fa-language" aria-hidden="true"></i>
          <span>Voice language</span>
          <select data-gj="lang">${LANGS.map(([v, l]) => `<option value="${v}"${v === lang() ? ' selected' : ''}>${l}</option>`).join('')}</select>
        </label>` : ''}
      </div>`;
  }

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-gj="big"]');
    if (!b) return;
    const on = store.get('big', '0') !== '1';
    store.set('big', on ? '1' : '0');
    applySize();
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
    b.lastChild.textContent = on ? ' Normal text' : ' Bigger text';
  });
  document.addEventListener('change', (ev) => {
    const s = ev.target.closest('[data-gj="lang"]');
    if (!s) return;
    store.set('lang', s.value);
    document.querySelectorAll('[data-gj="lang"]').forEach(o => { o.value = s.value; });
    stopListening();
  });

  /* ------------------------------------------------- what is left to do strip */

  function steps(c) {
    const r = c.report || {};
    const wrote = ['palm', 'correlation', 'summary', 'remedies'].some(k => String(r[k] || '').trim());
    const list = [
      ['Photos received', (c.photos || []).some(p => !p.markedFrom)],
      ['Notes written', Boolean(String(c.gurujiNotes || '').trim())],
      ['Reading written', wrote || Boolean(c.reportFile)],
      ['Sent to the seeker', r.status === 'ready' || c.status === 'COMPLETED']
    ];
    const next = list.findIndex(([, done]) => !done);
    return `
      <ol class="gj-steps" aria-label="Progress on this case">
        ${list.map(([label, done], i) => `
          <li class="gj-step${done ? ' is-done' : ''}${i === next ? ' is-next' : ''}">
            <span class="gj-step__dot" aria-hidden="true">${done ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>
            <span>${esc(label)}${i === next ? ' <em>— next</em>' : ''}</span>
          </li>`).join('')}
      </ol>`;
  }

  /* ---------------------------------------------------------- quick replies */

  const REPLIES = [
    'Namaste. I have received your details and photos.',
    'Please send a clearer photo of your palm, taken in daylight.',
    'Please send your exact time and place of birth.',
    'I am studying your palm now. Your reading will be ready soon.',
    'Please join the video call now.',
    'God bless you. Follow the practices I have suggested.'
  ];

  /** Quick replies, a microphone and read-aloud for the case chat. */
  function enhanceChat(container) {
    const form = container.querySelector('[data-chat-form]');
    const input = container.querySelector('[data-chat-input]');
    const list = container.querySelector('[data-chat-list]');
    if (!form || !input || form.dataset.gjDone) return;
    form.dataset.gjDone = '1';
    input.placeholder = 'Write to the seeker…';
    const chips = document.createElement('div');
    chips.className = 'gj-replies';
    chips.innerHTML = '<p class="gj-replies__label">Tap a reply, check it, then press Send:</p>' +
      REPLIES.map((t) => `<button type="button" class="gj-chip" data-reply="${esc(t)}">${esc(t)}</button>`).join('');
    form.insertAdjacentElement('beforebegin', chips);
    chips.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-reply]');
      if (!b) return;
      input.value = b.getAttribute('data-reply');
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });

    if (!('speechSynthesis' in window) || !list) return;
    const addSpeakers = () => list.querySelectorAll('.chat-msg:not(.chat-msg--mine):not([data-gj-tts])').forEach((li) => {
      li.setAttribute('data-gj-tts', '1');
      const text = li.querySelector('p') ? li.querySelector('p').innerText : '';
      if (!text) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gj-say';
      b.title = 'Read this message aloud';
      b.innerHTML = '<i class="fa-solid fa-volume-high" aria-hidden="true"></i> Listen';
      b.addEventListener('click', () => speak(text));
      li.appendChild(b);
    });
    addSpeakers();
    new MutationObserver(addSpeakers).observe(list, { childList: true });
  }

  /* --------------------------------------------------- the note-writing box */

  const PALM_WORDS = ['Life line', 'Head line', 'Heart line', 'Fate line', 'Sun line', 'Mercury line',
    'Marriage line', 'Mount of Jupiter', 'Mount of Saturn', 'Mount of Sun', 'Mount of Venus', 'Mount of Moon',
    'Island', 'Cross', 'Star', 'Break', 'Chain', 'Fork', 'Strong', 'Weak', 'Long', 'Short'];

  /** A big, calm box for a note on a palm photo. Resolves with the text, or
   *  null if he cancels. Shown inside the photo viewer. */
  function askNote(host, title) {
    return new Promise((resolve) => {
      const shade = document.createElement('div');
      shade.className = 'gj-note';
      shade.setAttribute('role', 'dialog');
      shade.setAttribute('aria-modal', 'true');
      shade.setAttribute('aria-label', title);
      shade.innerHTML = `
        <form class="gj-note__card">
          <h2 class="gj-note__title">${esc(title)}</h2>
          <p class="gj-note__sub">It is written on the photo and added to <b>My notes</b> at the same time.</p>
          <textarea rows="3" maxlength="400" placeholder="Type or press Speak…" data-gj-note-text></textarea>
          <div class="gj-note__words" aria-label="Tap to add a palm word">
            ${PALM_WORDS.map(w => `<button type="button" class="gj-chip gj-chip--sm" data-word="${esc(w)}">${esc(w)}</button>`).join('')}
          </div>
          <div class="gj-note__actions">
            <button type="button" class="gj-note__cancel" data-gj-note-cancel>Cancel</button>
            <button type="submit" class="gj-note__ok">Place note</button>
          </div>
        </form>`;
      host.appendChild(shade);
      const form = shade.querySelector('form');
      const box = shade.querySelector('textarea');
      attachMic(box);
      // The viewer listens for M, N and Esc; typing here must not reach it.
      shade.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Escape') done(null);
        if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); form.requestSubmit(); }
      });
      shade.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      shade.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const w = ev.target.closest('[data-word]');
        if (w) {
          const word = w.getAttribute('data-word');
          box.value = box.value ? box.value.replace(/\s*$/, ' ') + word.toLowerCase() : word;
          box.focus();
        }
        if (ev.target.closest('[data-gj-note-cancel]') || ev.target === shade) done(null);
      });
      form.addEventListener('submit', (ev) => { ev.preventDefault(); done(box.value.trim() || null); });
      function done(value) {
        stopListening();
        shade.remove();
        resolve(value);
      }
      setTimeout(() => box.focus(), 30);
    });
  }

  window.GurujiAssist = { attachMic, speak, toolbar, steps, enhanceChat, askNote, applySize, stopListening, hasVoice: Boolean(Recog) };
  applySize();
})();
