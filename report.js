// GURUJI PALMISTRY — the written report, as a PDF
//
// Guruji writes the sections in his case area; this turns them, with the birth
// chart, into a document the devotee can download. PDFKit only — no browser,
// no external service.

'use strict';

const PDFDocument = require('pdfkit');

const MAROON = '#6b1220';
const GOLD = '#a86d18';
const INK = '#2b1f1c';
const MUTED = '#7a6a64';

const SIGN_SHORT = ['Me', 'Vr', 'Mi', 'Ka', 'Si', 'Kn', 'Tu', 'Vs', 'Dh', 'Mk', 'Km', 'Mn'];
const PLANET_SHORT = { su: 'Su', mo: 'Mo', ma: 'Ma', me: 'Me', ju: 'Ju', ve: 'Ve', sa: 'Sa', ra: 'Ra', ke: 'Ke' };

/** North Indian chart: a square with fixed houses, signs written in. */
function drawNorthChart(doc, chart, x, y, size) {
  const h = size / 2;
  doc.save().lineWidth(1).strokeColor(GOLD);
  doc.rect(x, y, size, size).stroke();
  doc.moveTo(x, y).lineTo(x + size, y + size).stroke();
  doc.moveTo(x + size, y).lineTo(x, y + size).stroke();
  doc.moveTo(x + h, y).lineTo(x + size, y + h).lineTo(x + h, y + size).lineTo(x, y + h).closePath().stroke();
  doc.restore();

  // centre of each of the twelve houses, house 1 at the top middle
  const q = size / 4;
  const centres = [
    [h, q * 0.75], [q * 0.9, q * 0.35], [q * 0.35, q * 0.9], [q, h], [q * 0.35, size - q * 0.9], [q * 0.9, size - q * 0.35],
    [h, size - q * 0.75], [size - q * 0.9, size - q * 0.35], [size - q * 0.35, size - q * 0.9], [size - q, h],
    [size - q * 0.35, q * 0.9], [size - q * 0.9, q * 0.35]
  ];
  chart.houses.forEach((house, i) => {
    const [cx, cy] = centres[i];
    doc.fontSize(7).fillColor(MUTED).text(SIGN_SHORT[house.signIndex], x + cx - 20, y + cy - 16, { width: 40, align: 'center' });
    const names = house.planets.map(id => PLANET_SHORT[id]).join(' ');
    doc.fontSize(8).fillColor(MAROON).text(names, x + cx - 28, y + cy - 4, { width: 56, align: 'center' });
  });
  doc.fillColor(INK);
}

function section(doc, title) {
  if (doc.y > 690) doc.addPage();
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor(MAROON).text(title);
  doc.moveTo(doc.x, doc.y + 2).lineTo(doc.x + 160, doc.y + 2).strokeColor(GOLD).lineWidth(1).stroke();
  doc.moveDown(0.5).fontSize(10.5).fillColor(INK);
}

const paragraphs = (doc, text) => {
  String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .forEach(p => { doc.text(p, { align: 'left', lineGap: 2 }); doc.moveDown(0.5); });
};

/**
 * Builds the PDF and resolves with a Buffer.
 * @param {object} booking - the booking, with devotee, service, chart and report
 * @param {object} settings - site settings (brand, email, phone)
 */
function buildReportPdf(booking, settings = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 54, info: {
      Title: `Guruji Palmistry — reading for ${booking.devotee.name}`,
      Author: 'Guruji Palmistry', Subject: booking.service && booking.service.title
    } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const r = booking.report || {};
    const chart = booking.chart;
    const d = booking.devotee || {};

    // ---- cover ----
    doc.rect(0, 0, doc.page.width, 150).fill('#2b1113');
    doc.fillColor('#f1d9b0').fontSize(26).text('GURUJI PALMISTRY', 54, 46, { characterSpacing: 2 });
    doc.fillColor('#e9b25c').fontSize(9).text('GUIDANCE · HEALING · DEVOTION · LEARNING', 54, 82, { characterSpacing: 2 });
    doc.fillColor('#f7ece0').fontSize(13).text(booking.service ? booking.service.title : 'Consultation report', 54, 108);

    doc.fillColor(INK).fontSize(10.5);
    doc.y = 180;
    const row = (k, v) => { if (v) doc.fontSize(10).fillColor(MUTED).text(k, { continued: true }).fillColor(INK).text('   ' + v); };
    row('Name', d.name);
    row('Date of birth', [d.dob, d.tob].filter(Boolean).join(' at '));
    row('Place of birth', d.pob + (d.lat != null && d.lon != null ? `  (${d.lat}, ${d.lon})` : ''));
    row('Gotram', d.gotram);
    row('Booking', booking.orderId);
    row('Prepared', new Date(r.readyAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));

    // ---- chart ----
    if (chart) {
      section(doc, 'Part 1 — Kundali');
      const top = doc.y;
      drawNorthChart(doc, chart, 54, top, 210);
      doc.fontSize(9.5).fillColor(INK);
      let ty = top;
      const put = (label, value) => { doc.text(label, 290, ty, { width: 90 }); doc.text(value, 385, ty, { width: 160 }); ty += 14; };
      put('Lagna', `${chart.ascendant.signShort} ${chart.ascendant.degreeText}`);
      put('Moon sign', chart.moonSign);
      put('Nakshatra', `${chart.moonNakshatra.name} (pada ${chart.moonNakshatra.pada})`);
      put('Ayanamsa', `${chart.ayanamsaText} (Lahiri)`);
      const running = (chart.dashas || []).find(x => x.current);
      if (running) put('Mahadasha', `${running.lord} — to ${running.end}`);
      doc.y = Math.max(top + 220, ty + 10);

      doc.moveDown(0.5).fontSize(9.5);
      const cols = [54, 128, 196, 272, 386, 430];
      const widths = [74, 68, 76, 110, 40, 40];
      const headY = doc.y;
      doc.fillColor(MAROON);
      ['Graha', 'Rashi', 'Degree', 'Nakshatra', 'Pada', 'Bhava'].forEach((t, i) => doc.text(t, cols[i], headY, { width: widths[i] }));
      doc.y = headY + 13;
      doc.moveTo(54, doc.y).lineTo(470, doc.y).strokeColor(GOLD).lineWidth(0.5).stroke();
      doc.y += 4;
      doc.fillColor(INK);
      for (const p of chart.planets) {
        if (doc.y > 735) doc.addPage();
        const yy = doc.y;
        const cells = [p.name + (p.retrograde ? ' (R)' : ''), p.signShort, p.degreeText, p.nakshatra, String(p.pada), String(p.house)];
        cells.forEach((t, i) => doc.text(t, cols[i], yy, { width: widths[i] }));
        doc.y = yy + 13;
      }
      doc.x = 54;
    }

    if (r.palm) { section(doc, 'Part 2 — The hands'); paragraphs(doc, r.palm); }
    if (r.correlation) { section(doc, 'Part 3 — Where the chart and the hands agree'); paragraphs(doc, r.correlation); }
    if (r.summary) { section(doc, 'Summary'); paragraphs(doc, r.summary); }
    if (r.remedies) { section(doc, 'Suggested practices'); paragraphs(doc, r.remedies); }

    section(doc, 'Please remember');
    doc.fontSize(9.5).fillColor(MUTED).text(
      'This reading is offered for self-understanding and reflection. It is not a substitute for medical, legal or financial advice, ' +
      'and nothing in it is a prediction you are bound by. Where a practice is suggested, it is a suggestion, never a condition.',
      { lineGap: 2 });
    doc.moveDown(0.6).fillColor(INK).fontSize(9.5)
      .text(`${settings.brand || 'Guruji Palmistry'}${settings.email ? ' · ' + settings.email : ''}${settings.phone ? ' · ' + settings.phone : ''}`);

    doc.end();
  });
}

module.exports = { buildReportPdf };
