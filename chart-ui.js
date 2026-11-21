// GURUJI PALMISTRY — drawing a Kundali in the browser
//
// Two traditional layouts from the same data: North Indian (diamond, houses
// fixed, signs move) and South Indian (square ring, signs fixed, houses move).
// Pure SVG, no library.

(function (root) {
  'use strict';

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SHORT = { su: 'Su', mo: 'Mo', ma: 'Ma', me: 'Me', ju: 'Ju', ve: 'Ve', sa: 'Sa', ra: 'Ra', ke: 'Ke' };
  const SIGN_ABBR = ['Me', 'Vr', 'Mi', 'Ka', 'Si', 'Kn', 'Tu', 'Vs', 'Dh', 'Mk', 'Km', 'Mn'];

  const planetLabel = (chart, id) => {
    const p = chart.planets.find(x => x.id === id);
    return SHORT[id] + (p && p.retrograde ? 'ᴿ' : '');
  };

  /** North Indian: house 1 is the top-centre diamond and never moves. */
  function northChart(chart, size = 320) {
    const S = size, H = S / 2, Q = S / 4;
    const centres = [
      [H, Q * 0.78], [Q * 0.88, Q * 0.36], [Q * 0.36, Q * 0.88], [Q, H], [Q * 0.36, S - Q * 0.88], [Q * 0.88, S - Q * 0.36],
      [H, S - Q * 0.78], [S - Q * 0.88, S - Q * 0.36], [S - Q * 0.36, S - Q * 0.88], [S - Q, H],
      [S - Q * 0.36, Q * 0.88], [S - Q * 0.88, Q * 0.36]
    ];
    const cells = chart.houses.map((house, i) => {
      const [cx, cy] = centres[i];
      const names = house.planets.map(id => planetLabel(chart, id));
      const lines = [];
      for (let j = 0; j < names.length; j += 3) lines.push(names.slice(j, j + 3).join(' '));
      const body = lines.map((t, k) => `<tspan x="${cx}" dy="${k ? 12 : 0}">${esc(t)}</tspan>`).join('');
      return `<g class="kc-house">
        <text class="kc-sign" x="${cx}" y="${cy - 10}" text-anchor="middle">${SIGN_ABBR[house.signIndex]}</text>
        ${names.length ? `<text class="kc-planets" x="${cx}" y="${cy + 6}" text-anchor="middle">${body}</text>` : ''}
        ${i === 0 ? `<text class="kc-asc" x="${cx}" y="${cy + 22}" text-anchor="middle">Lagna</text>` : ''}
      </g>`;
    }).join('');
    return `<svg class="kundali" viewBox="0 0 ${S} ${S}" role="img" aria-label="North Indian chart">
      <rect x="1" y="1" width="${S - 2}" height="${S - 2}" class="kc-frame"/>
      <path d="M1 1 L${S - 1} ${S - 1} M${S - 1} 1 L1 ${S - 1} M${H} 1 L${S - 1} ${H} L${H} ${S - 1} L1 ${H} Z" class="kc-line"/>
      ${cells}
    </svg>`;
  }

  /** South Indian: the twelve signs sit in a fixed ring, Pisces top-left. */
  function southChart(chart, size = 320) {
    const S = size, C = S / 4;
    // grid position of each sign, Meena (11) top-left then clockwise
    const pos = { 11: [0, 0], 0: [1, 0], 1: [2, 0], 2: [3, 0], 3: [3, 1], 4: [3, 2], 5: [3, 3], 6: [2, 3], 7: [1, 3], 8: [0, 3], 9: [0, 2], 10: [0, 1] };
    const bySign = {};
    chart.planets.forEach(p => { (bySign[p.signIndex] = bySign[p.signIndex] || []).push(p.id); });
    const cells = Object.entries(pos).map(([signIndex, [gx, gy]]) => {
      const x = gx * C, y = gy * C;
      const i = Number(signIndex);
      const names = (bySign[i] || []).map(id => planetLabel(chart, id));
      const lines = [];
      for (let j = 0; j < names.length; j += 2) lines.push(names.slice(j, j + 2).join(' '));
      const isAsc = chart.ascendant.signIndex === i;
      return `<g class="kc-house">
        <rect x="${x}" y="${y}" width="${C}" height="${C}" class="${isAsc ? 'kc-cell kc-cell--asc' : 'kc-cell'}"/>
        <text class="kc-sign" x="${x + 5}" y="${y + 13}">${SIGN_ABBR[i]}</text>
        ${isAsc ? `<text class="kc-asc" x="${x + C - 5}" y="${y + 13}" text-anchor="end">Lagna</text>` : ''}
        <text class="kc-planets" x="${x + C / 2}" y="${y + C / 2 + 2}" text-anchor="middle">${lines.map((t, k) => `<tspan x="${x + C / 2}" dy="${k ? 12 : 0}">${esc(t)}</tspan>`).join('')}</text>
      </g>`;
    }).join('');
    return `<svg class="kundali" viewBox="0 0 ${S} ${S}" role="img" aria-label="South Indian chart">
      <rect x="1" y="1" width="${S - 2}" height="${S - 2}" class="kc-frame"/>${cells}</svg>`;
  }

  /** The planet table that sits beside the chart. */
  function planetTable(chart) {
    return `<div class="kc-table-wrap"><table class="kc-table">
      <caption>Graha positions — sidereal, Lahiri ayanamsa ${esc(chart.ayanamsaText)}</caption>
      <thead><tr><th scope="col">Graha</th><th scope="col">Rashi</th><th scope="col">Degree</th><th scope="col">Nakshatra</th><th scope="col">Pada</th><th scope="col">Bhava</th></tr></thead>
      <tbody>${chart.planets.map(p => `<tr>
        <th scope="row">${esc(p.name)}${p.retrograde ? ' <span class="kc-r" title="retrograde">R</span>' : ''}</th>
        <td>${esc(p.signShort)}</td><td>${esc(p.degreeText)}</td><td>${esc(p.nakshatra)}</td><td>${p.pada}</td><td>${p.house}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function dashaTable(chart) {
    const current = (chart.currentDasha && chart.currentDasha.antar) || [];
    return `<div class="kc-table-wrap"><table class="kc-table">
      <caption>Vimshottari Mahadasha</caption>
      <thead><tr><th scope="col">Lord</th><th scope="col">From</th><th scope="col">To</th></tr></thead>
      <tbody>${chart.dashas.map(d => `<tr class="${d.current ? 'is-now' : ''}"><th scope="row">${esc(d.lord)}${d.current ? ' <span class="kc-now">now</span>' : ''}</th><td>${esc(d.start)}</td><td>${esc(d.end)}</td></tr>`).join('')}</tbody>
      </table>
      ${current.length ? `<table class="kc-table mt-3"><caption>Antardasha inside the running Mahadasha</caption>
      <thead><tr><th scope="col">Lord</th><th scope="col">From</th><th scope="col">To</th></tr></thead>
      <tbody>${current.map(a => `<tr class="${a.current ? 'is-now' : ''}"><th scope="row">${esc(a.lord)}${a.current ? ' <span class="kc-now">now</span>' : ''}</th><td>${esc(a.start)}</td><td>${esc(a.end)}</td></tr>`).join('')}</tbody></table>` : ''}
    </div>`;
  }

  /** The whole panel: both layouts, the tables, and a summary line. */
  function chartPanel(chart, { style = 'north' } = {}) {
    const asc = chart.ascendant;
    return `<div class="kc" data-chart-panel>
      <div class="kc-head">
        <div>
          <p class="sp-eyebrow sp-eyebrow--maroon">Kundali</p>
          <p class="kc-summary"><strong>${esc(asc.signShort)} Lagna</strong> ${esc(asc.degreeText)} ·
            Moon in <strong>${esc(chart.moonSign)}</strong> · ${esc(chart.moonNakshatra.name)} pada ${chart.moonNakshatra.pada}</p>
        </div>
        <div class="kc-toggle" role="group" aria-label="Chart style">
          <button type="button" data-kc-style="north" class="${style === 'north' ? 'is-on' : ''}">North Indian</button>
          <button type="button" data-kc-style="south" class="${style === 'south' ? 'is-on' : ''}">South Indian</button>
        </div>
      </div>
      <div class="kc-body">
        <div class="kc-figure" data-kc-figure>${style === 'south' ? southChart(chart) : northChart(chart)}</div>
        <div class="kc-tables">${planetTable(chart)}${dashaTable(chart)}</div>
      </div>
      <p class="kc-note">Whole-sign houses (Bhava = Rashi). Positions from VSOP87D and Meeus, sidereal with the Chitrapaksha (Lahiri) ayanamsa; Rahu and Ketu are the mean node. Cast ${esc((chart.computedAt || '').slice(0, 10))}.</p>
    </div>`;
  }

  /** Switches the drawing when one of the two buttons is pressed. */
  function bindChartPanel(container, chart) {
    container.querySelectorAll('[data-kc-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        const style = btn.dataset.kcStyle;
        container.querySelectorAll('[data-kc-style]').forEach(b => b.classList.toggle('is-on', b === btn));
        container.querySelector('[data-kc-figure]').innerHTML = style === 'south' ? southChart(chart) : northChart(chart);
      });
    });
  }

  root.GurujiChart = { northChart, southChart, planetTable, dashaTable, chartPanel, bindChartPanel };
})(typeof window !== 'undefined' ? window : globalThis);
