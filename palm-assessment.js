/* Guruji Palmistry — practitioner assessment checklist.
 *
 * The same structure as Guruji_Palmistry_Selectable_Assessment_Checklist.xlsx:
 * one row per palm parameter (Field ID, Category, Aspect, Selected Value from a
 * dropdown, Additional description, Hand, Observation Status, Confidence,
 * Location, Practitioner Notes), plus the "Seeker Details" and "Instructions"
 * sheets. Loaded only on Guruji's case page, so seekers never download it.
 *
 * The parameter list and dropdown values live in palm-assessment-data.js.
 */
(function () {
  'use strict';

  const COLS = ['value', 'extra', 'hand', 'status', 'confidence', 'location', 'notes'];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const opt = (list, cur, blank) => (blank != null ? `<option value="">${esc(blank)}</option>` : '') +
    list.map(v => `<option${v === cur ? ' selected' : ''}>${esc(v)}</option>`).join('') +
    (cur && !list.includes(cur) ? `<option selected>${esc(cur)}</option>` : '');

  /** Mounts the checklist into `host` for one case.
   *  save(payload) must return a promise; it is called (debounced) on every change. */
  function mount(host, c, save) {
    const D = window.PALM_ASSESSMENT;
    if (!D) { host.innerHTML = '<p class="sp-notice">The assessment checklist could not load. Refresh the page and try again.</p>'; return null; }
    const saved = c.palmAssessment || {};
    const S = {
      rows: JSON.parse(JSON.stringify(saved.rows || {})),
      details: Object.assign({}, saved.details || {}),
      cat: 'All', q: '', show: 'all', tab: 'checklist'
    };
    // Start the details sheet from what the booking already knows.
    const d = c.devotee || {};
    const prefill = {
      'Seeker Name': d.name, 'Report Reference': c.orderId, 'Date of Birth': [d.dob, d.tob].filter(Boolean).join(' at '),
      'Dominant Hand': c.handedness, 'Date of Assessment': new Date().toISOString().slice(0, 10), 'Practitioner': c.assignedTo
    };
    if (!saved.details) for (const [k, v] of Object.entries(prefill)) if (v) S.details[k] = String(v);

    const cats = [...new Set(D.fields.map(f => f.category))];
    const byId = Object.fromEntries(D.fields.map(f => [f.id, f]));
    const row = (id) => S.rows[id] || {};
    const filled = (id) => Boolean(row(id).value);
    const status = (id) => row(id).status || D.defaultStatus;

    let timer = null;
    let stateText = saved.updatedAt ? ['Saved ✓', true] : ['Saves by itself as you select', false];
    function setState(text, ok) {
      stateText = [text, ok];
      const el = host.querySelector('[data-pa-state]');
      if (el) { el.textContent = text; el.classList.toggle('is-ok', Boolean(ok)); }
    }
    function queueSave() {
      setState('Saving…');
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try { await save({ rows: S.rows, details: S.details }); setState('Saved ✓', true); }
        catch (err) { setState('Not saved — ' + (err && err.message || 'try again')); }
      }, 700);
    }

    function progress() {
      const done = D.fields.filter(f => filled(f.id)).length;
      return { done, total: D.fields.length, pct: Math.round(done * 100 / D.fields.length) };
    }

    function visible() {
      const q = S.q.trim().toLowerCase();
      return D.fields.filter(f => {
        if (S.cat !== 'All' && f.category !== S.cat) return false;
        if (S.show === 'filled' && !filled(f.id)) return false;
        if (S.show === 'empty' && filled(f.id)) return false;
        if (q) {
          const r = row(f.id);
          const hay = [f.id, f.category, f.aspect, r.value, r.extra, r.location, r.notes].join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }

    function rowHtml(f) {
      const r = row(f.id);
      const st = status(f.id);
      return `<tr data-pa-row="${esc(f.id)}" class="${r.value ? 'is-filled' : ''}">
        <td class="pa-id">${esc(f.id)}</td>
        <td class="pa-cat">${esc(f.category)}</td>
        <td class="pa-aspect">${esc(f.aspect)}</td>
        <td class="pa-val"><select data-k="value" aria-label="${esc(f.aspect)} — selected value" title="${esc(D.hint)}">${opt(f.options, r.value, '— select —')}</select></td>
        <td><input data-k="extra" value="${esc(r.extra || '')}" aria-label="${esc(f.aspect)} — additional selection / description"></td>
        <td><select data-k="hand" aria-label="${esc(f.aspect)} — hand">${opt(D.hands, r.hand, '')}</select></td>
        <td><select data-k="status" class="pa-st pa-st--${esc(st.replace(/\s+/g, '-').toLowerCase())}" aria-label="${esc(f.aspect)} — observation status">${opt(D.statuses, st)}</select></td>
        <td><select data-k="confidence" aria-label="${esc(f.aspect)} — confidence">${opt(D.confidence, r.confidence, '')}</select></td>
        <td><input data-k="location" value="${esc(r.location || '')}" aria-label="${esc(f.aspect)} — location / exact detail"></td>
        <td><input data-k="notes" value="${esc(r.notes || '')}" placeholder="${esc(D.hint)}" aria-label="${esc(f.aspect)} — practitioner notes"></td>
      </tr>`;
    }

    function renderTable() {
      const list = visible();
      const body = host.querySelector('[data-pa-body]');
      body.innerHTML = list.length ? list.map(rowHtml).join('')
        : '<tr><td colspan="10" class="pa-empty">No parameters match this filter.</td></tr>';
      renderCounts();
    }

    function renderCounts() {
      const p = progress();
      const bar = host.querySelector('[data-pa-progress]');
      if (bar) bar.innerHTML = `<span style="width:${p.pct}%"></span>`;
      const t = host.querySelector('[data-pa-count]');
      if (t) t.textContent = `${p.done} of ${p.total} parameters selected`;
      host.querySelectorAll('[data-pa-cat]').forEach(b => {
        const name = b.dataset.paCat;
        const fs = name === 'All' ? D.fields : D.fields.filter(f => f.category === name);
        b.querySelector('em').textContent = `${fs.filter(f => filled(f.id)).length}/${fs.length}`;
      });
      const badge = document.querySelector('[data-pa-badge]');
      if (badge) badge.textContent = `${p.done}/${p.total}`;
    }

    function checklistHtml() {
      return `
        <div class="pa-tools">
          <div class="pa-cats" role="group" aria-label="Category">
            ${['All', ...cats].map(cName => `<button type="button" data-pa-cat="${esc(cName)}" class="${S.cat === cName ? 'is-active' : ''}">${esc(cName)} <em></em></button>`).join('')}
          </div>
          <div class="pa-filters">
            <input type="search" class="pa-search" data-pa-q value="${esc(S.q)}" placeholder="Search parameter, ID or note…" aria-label="Search parameters">
            <select class="sp-select" data-pa-show aria-label="Show">
              <option value="all"${S.show === 'all' ? ' selected' : ''}>All rows</option>
              <option value="empty"${S.show === 'empty' ? ' selected' : ''}>Not yet selected</option>
              <option value="filled"${S.show === 'filled' ? ' selected' : ''}>Selected</option>
            </select>
          </div>
        </div>
        <div class="pa-sheet" tabindex="0" aria-label="Assessment checklist">
          <table class="pa-table">
            <thead><tr>
              <th>Field ID</th><th>Category</th><th>Aspect / Parameter</th><th>Selected Value</th>
              <th>Additional Selection / Description</th><th>Hand</th><th>Observation Status</th>
              <th>Confidence</th><th>Location / Exact Detail</th><th>Practitioner Notes</th>
            </tr></thead>
            <tbody data-pa-body></tbody>
          </table>
        </div>`;
    }

    function detailsHtml() {
      return `<form class="pa-details" onsubmit="event.preventDefault()">
        <h3 class="sp-h3">Seeker &amp; assessment details</h3>
        ${D.details.map(label => {
          const long = /notes|limitations/i.test(label);
          const v = S.details[label] || '';
          return `<label class="sp-field"><span>${esc(label)}</span>${long
            ? `<textarea rows="3" data-pa-detail="${esc(label)}">${esc(v)}</textarea>`
            : `<input data-pa-detail="${esc(label)}" value="${esc(v)}">`}</label>`;
        }).join('')}
      </form>`;
    }

    function guideHtml() {
      return `<div class="pa-guide">
        <h3 class="sp-h3">${esc(D.title)}</h3>
        <dl>${D.instructions.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </div>`;
    }

    function draw() {
      host.innerHTML = `
        <div class="pa-head">
          <div class="pa-sheets" role="tablist" aria-label="Workbook sheets">
            ${[['checklist', 'Assessment Checklist'], ['details', 'Seeker Details'], ['guide', 'Instructions']]
              .map(([id, label]) => `<button type="button" role="tab" aria-selected="${S.tab === id}" data-pa-tab="${id}" class="${S.tab === id ? 'is-active' : ''}">${label}</button>`).join('')}
          </div>
          <div class="pa-meta">
            <span data-pa-count></span>
            <div class="pa-progress" data-pa-progress></div>
            <span class="case-notes__state" data-pa-state aria-live="polite">${esc(stateText[0])}</span>
            <button type="button" class="sp-btn-outline sp-btn-sm" data-pa-export><i class="fa-solid fa-file-excel" aria-hidden="true"></i> Export for Excel</button>
          </div>
        </div>
        <div class="pa-body">${S.tab === 'checklist' ? checklistHtml() : S.tab === 'details' ? detailsHtml() : guideHtml()}</div>`;
      host.querySelector('[data-pa-state]').classList.toggle('is-ok', Boolean(stateText[1]));
      if (S.tab === 'checklist') renderTable(); else renderCounts();
    }

    function setCell(id, k, v) {
      const r = Object.assign({}, row(id));
      if (v) r[k] = v; else delete r[k];
      // Picking a value marks the row Observed, unless Guruji already set a status
      // or the value itself says the feature could not be assessed.
      if (k === 'value' && v && (!r.status || r.status === D.defaultStatus) && !/^not /i.test(v)) r.status = 'Observed';
      if (k === 'status' && v === D.defaultStatus) delete r.status;
      if (Object.keys(r).length) S.rows[id] = r; else delete S.rows[id];
      queueSave();
    }

    host.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-pa-show]')) { S.show = t.value; renderTable(); return; }
      const tr = t.closest('[data-pa-row]');
      if (tr && t.dataset.k) {
        const id = tr.dataset.paRow;
        setCell(id, t.dataset.k, t.value.trim());
        if (t.dataset.k === 'value' || t.dataset.k === 'status') {
          const fresh = document.createElement('tbody');
          fresh.innerHTML = rowHtml(byId[id]);
          tr.replaceWith(fresh.firstElementChild);
          host.querySelector(`[data-pa-row="${id}"] [data-k="${t.dataset.k}"]`)?.focus();
        }
        renderCounts();
      }
    });
    host.addEventListener('input', (e) => {
      const t = e.target;
      if (t.matches('[data-pa-q]')) { S.q = t.value; clearTimeout(host._qT); host._qT = setTimeout(renderTable, 150); return; }
      if (t.dataset.paDetail) {
        const k = t.dataset.paDetail; const v = t.value;
        if (v.trim()) S.details[k] = v; else delete S.details[k];
        queueSave();
        return;
      }
      const tr = t.closest('[data-pa-row]');
      if (tr && t.tagName === 'INPUT' && t.dataset.k) setCell(tr.dataset.paRow, t.dataset.k, t.value.trim());
    });
    host.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-pa-tab]');
      if (tab) { S.tab = tab.dataset.paTab; draw(); return; }
      const cat = e.target.closest('[data-pa-cat]');
      if (cat) {
        S.cat = cat.dataset.paCat;
        host.querySelectorAll('[data-pa-cat]').forEach(b => b.classList.toggle('is-active', b === cat));
        renderTable(); return;
      }
      if (e.target.closest('[data-pa-export]')) exportCsv();
    });

    function exportCsv() {
      const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
      const lines = [[D.title], []];
      D.details.forEach(k => lines.push([k, S.details[k] || '']));
      lines.push([]);
      lines.push(['Field ID', 'Category', 'Aspect / Parameter', 'Selected Value', 'Additional Selection / Description', 'Hand', 'Observation Status', 'Confidence', 'Location / Exact Detail', 'Practitioner Notes']);
      D.fields.forEach(f => {
        const r = row(f.id);
        lines.push([f.id, f.category, f.aspect, r.value, r.extra, r.hand, status(f.id), r.confidence, r.location, r.notes]);
      });
      const blob = new Blob(['﻿' + lines.map(l => l.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `assessment_${c.orderId}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    draw();
    return {
      progress,
      /** Saves straight away (used when Guruji leaves the tab). */
      flush() { if (timer) { clearTimeout(timer); return save({ rows: S.rows, details: S.details }).then(() => setState('Saved ✓', true)); } return Promise.resolve(); }
    };
  }

  /** Counts selected parameters in a saved assessment (for the nav badge). */
  function countDone(saved) {
    const rows = (saved && saved.rows) || {};
    return Object.values(rows).filter(r => r && r.value).length;
  }

  window.PalmAssessment = { mount, countDone };
})();
