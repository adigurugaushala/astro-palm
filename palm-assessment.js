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

  /* ------------------------------------------------ minimal .xlsx writer
   * Builds an Office Open XML workbook (an uncompressed zip) in the browser,
   * so the download keeps sheets, header styling, frozen header, filters and
   * the dropdowns, without loading a spreadsheet library. */
  const colName = (i) => { let n = i + 1, s = ''; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const xml = (v) => String(v).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  function zip(files) {
    const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0;
    const u16 = (v) => [v & 255, (v >>> 8) & 255]; const u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    for (const [name, text] of files) {
      const nb = enc.encode(name); const data = enc.encode(text); const crc = crc32(data);
      const common = [...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0)];
      const local = new Uint8Array([...u32(0x04034b50), ...common]);
      parts.push(local, nb, data);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nb);
      offset += local.length + nb.length + data.length;
    }
    const cdSize = central.reduce((n, p) => n + p.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
    return new Blob([...parts, ...central, end]);
  }

  function sheetXml(sh) {
    const rows = sh.rows.map((r, ri) => `<row r="${ri + 1}">` + r.map((cell, ci) => {
      const o = (cell && typeof cell === 'object') ? cell : { v: cell };
      if (o.v == null || o.v === '') return o.s ? `<c r="${colName(ci)}${ri + 1}" s="${o.s}"/>` : '';
      return `<c r="${colName(ci)}${ri + 1}" t="inlineStr"${o.s ? ` s="${o.s}"` : ''}><is><t xml:space="preserve">${xml(o.v)}</t></is></c>`;
    }).join('') + '</row>').join('');
    const view = sh.freeze ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '';
    const cols = sh.cols ? '<cols>' + sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>' : '';
    const filter = sh.filter ? `<autoFilter ref="${sh.filter}"/>` : '';
    const dv = sh.validations && sh.validations.length ? `<dataValidations count="${sh.validations.length}">` + sh.validations.map(v =>
      `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="${v.sqref}"><formula1>${xml(v.formula)}</formula1></dataValidation>`).join('') + '</dataValidations>' : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${view}${cols}<sheetData>${rows}</sheetData>${filter}${dv}</worksheet>`;
  }

  function buildXlsx(sheets) {
    const NS = 'http://schemas.openxmlformats.org/';
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS}spreadsheetml/2006/main">
<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF6B2140"/><name val="Calibri"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF6B2140"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7EBE7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFBF6F0"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>
<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const names = sheets.map((sh, i) => sh.filter ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xml(sh.name)}'!${sh.filter.replace(/([A-Z]+)(\d+)/g, '$$$1$$$2')}</definedName>` : '').join('');
    const active = Math.max(0, sheets.findIndex(sh => sh.freeze && sh.validations));
    const files = [
      ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${NS}package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
      ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS}package/2006/relationships"><Relationship Id="rId1" Type="${NS}officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS}spreadsheetml/2006/main" xmlns:r="${NS}officeDocument/2006/relationships"><bookViews><workbookView activeTab="${active}"/></bookViews><sheets>${sheets.map((sh, i) => `<sheet name="${xml(sh.name)}" sheetId="${i + 1}"${sh.hidden ? ' state="hidden"' : ''} r:id="rId${i + 1}"/>`).join('')}</sheets>${names ? `<definedNames>${names}</definedNames>` : ''}</workbook>`],
      ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS}package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS}officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="${NS}officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', styles]
    ].concat(sheets.map((sh, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sh)]));
    return zip(files);
  }

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
    let stateText = saved.updatedAt ? ['Saved ✓', true] : ['Saves by itself · fill only what you observe', false];
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
      if (t) t.textContent = `${p.done} of ${p.total} filled · every field is optional`;
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
        <dl><div><dt>Nothing is mandatory</dt><dd>Fill only the parameters you can observe. Empty rows are fine; they stay "Not assessed" and can be completed later.</dd></div>${D.instructions.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
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
            <button type="button" class="sp-btn-outline sp-btn-sm" data-pa-export><i class="fa-solid fa-file-excel" aria-hidden="true"></i> Download .xlsx</button>
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
      if (e.target.closest('[data-pa-export]')) exportXlsx();
    });

    function exportXlsx() {
      const HEAD = ['Field ID', 'Category', 'Aspect / Parameter', 'Selected Value', 'Additional Selection / Description', 'Hand', 'Observation Status', 'Confidence', 'Location / Exact Detail', 'Practitioner Notes'];
      const checklist = [HEAD.map(v => ({ v, s: 1 }))].concat(D.fields.map(f => {
        const r = row(f.id);
        return [f.id, { v: f.category, s: 2 }, { v: f.aspect, s: 3 }, r.value, r.extra, r.hand, status(f.id), r.confidence, r.location, r.notes];
      }));
      const lists = [D.fields.map(f => ({ v: f.id, s: 1 }))];
      const longest = Math.max(...D.fields.map(f => f.options.length));
      for (let i = 0; i < longest; i++) lists.push(D.fields.map(f => f.options[i] || ''));
      const book = [
        { name: 'Instructions', cols: [34, 110], rows: [[{ v: D.title, s: 4 }], []].concat(D.instructions.map(([k, v]) => [{ v: k, s: 3 }, { v, s: 5 }])) },
        { name: 'Assessment Checklist', cols: [10, 16, 34, 30, 36, 14, 18, 12, 30, 40], rows: checklist, freeze: true, filter: 'A1:J' + checklist.length,
          validations: D.fields.map((f, i) => ({ sqref: 'D' + (i + 2), formula: `'Validation Lists'!$${colName(i)}$2:$${colName(i)}$${f.options.length + 1}` }))
            .concat([['F', D.hands], ['G', D.statuses], ['H', D.confidence]].map(([col, l]) => ({ sqref: `${col}2:${col}${checklist.length}`, formula: '"' + l.join(',') + '"' }))) },
        { name: 'Dropdown Options', cols: [44, 120], rows: [[{ v: 'Option Group / Aspect', s: 1 }, { v: 'Selectable Values', s: 1 }]].concat(D.fields.map(f => [f.category + ' | ' + f.aspect, f.options.join(' | ')])), freeze: true },
        { name: 'Seeker Details', cols: [32, 70], rows: [[{ v: 'GURUJI PALMISTRY | SEEKER & ASSESSMENT DETAILS', s: 4 }], []].concat(D.details.map(k => [{ v: k, s: 3 }, { v: S.details[k] || '', s: 5 }])) },
        { name: 'Validation Lists', rows: lists, hidden: true }
      ];
      const blob = new Blob([buildXlsx(book)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Guruji_Assessment_${c.orderId}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
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

  window.PalmAssessment = { mount, countDone, buildXlsx };
})();
