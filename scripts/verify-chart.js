#!/usr/bin/env node
// Checks the chart engine against published worked examples and known charts.
// Run: node scripts/verify-chart.js
'use strict';
const { computeChart, lahiriAyanamsa, julianDay } = require('../chart');

const rows = [];
const dms = (deg) => {
  const d = Math.floor(deg), m = Math.floor((deg - d) * 60), s = ((deg - d) * 60 - m) * 60;
  return `${d}° ${String(m).padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
};
const add = (what, expected, got, tol, unit = '°') => {
  const diff = Math.abs(got - expected);
  rows.push({ what, expected: expected.toFixed(5) + unit, got: got.toFixed(5) + unit, diff: (diff * 3600).toFixed(1) + '"', tol: (tol * 3600).toFixed(0) + '"', ok: diff <= tol });
};

// 1. Lahiri ayanamsa at J2000.0 — defined as 23° 51' 10.5"
add('Lahiri ayanamsa at J2000.0 (definition)', 23 + 51 / 60 + 10.5 / 3600, lahiriAyanamsa(2451545.0), 1 / 3600);

// 2. Lahiri ayanamsa on 1 Jan 2025, published tables give 24° 12' 26"
add('Lahiri ayanamsa 2025-01-01 (published table)', 24 + 12 / 60 + 26 / 3600, lahiriAyanamsa(julianDay('2025-01-01', '00:00', 0)), 60 / 3600);

// 3. Meeus, Astronomical Algorithms, Example 25.b — apparent geocentric
//    longitude of the Sun, 1992 October 13.0 TD = 199° 54' 21.8"
{
  const c = computeChart({ date: '1992-10-13', time: '00:00', lat: 0, lon: 0, tzMinutes: 0 });
  const sun = c.planets.find(p => p.name === 'Sun');
  add('Meeus 25.b — Sun tropical longitude', 199 + 54 / 60 + 21.8 / 3600, sun.lonTropical, 30 / 3600);
}

// 4. Meeus Example 47.a — the Moon's apparent longitude, 1992 April 12.0 TD
{
  const c = computeChart({ date: '1992-04-12', time: '00:00', lat: 0, lon: 0, tzMinutes: 0 });
  const moon = c.planets.find(p => p.name === 'Moon');
  add('Meeus 47.a — Moon tropical longitude', 133.162655, moon.lonTropical, 120 / 3600);
}

// 5. Meeus Example 33.a — apparent geocentric longitude of Venus,
//    1992 December 20.0 TD = 313°.08102
{
  const c = computeChart({ date: '1992-12-20', time: '00:00', lat: 0, lon: 0, tzMinutes: 0 });
  const venus = c.planets.find(p => p.name === 'Venus');
  add('Meeus 33.a — Venus tropical longitude', 313.08102, venus.lonTropical, 60 / 3600);
}

// 6. A published Vedic chart: M. K. Gandhi, 2 Oct 1869, 07:11 LMT, Porbandar
const gandhi = computeChart({ date: '1869-10-02', time: '07:11', lat: 21.6417, lon: 69.6293, tzMinutes: 278, place: 'Porbandar' });
const checks = [
  ['Lagna (ascendant) sign', 'Tula', gandhi.ascendant.sign.split(' ')[0]],
  ['Sun sign', 'Kanya', gandhi.planets.find(p => p.name === 'Sun').sign.split(' ')[0]],
  ['Moon sign', 'Karka', gandhi.planets.find(p => p.name === 'Moon').sign.split(' ')[0]],
  ['Moon nakshatra', 'Ashlesha', gandhi.planets.find(p => p.name === 'Moon').nakshatra],
  ['Moon pada', '4', String(gandhi.planets.find(p => p.name === 'Moon').pada)],
  ['Jupiter retrograde', 'true', String(gandhi.planets.find(p => p.name === 'Jupiter').retrograde)],
  ['Jupiter sign', 'Mesha', gandhi.planets.find(p => p.name === 'Jupiter').sign.split(' ')[0]]
];

// 7. Internal consistency
const sumHouses = gandhi.houses.length;
const nakOk = gandhi.planets.every(p => p.nakshatra && p.pada >= 1 && p.pada <= 4);
const dashaYears = gandhi.dashas.reduce((s, d) => s + d.years, 0);

console.log('\nNumeric checks (tolerance in arcseconds)\n');
console.log('| Check | Expected | Engine | Difference | Tolerance | Result |');
console.log('|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.what} | ${r.expected} | ${r.got} | ${r.diff} | ${r.tol} | ${r.ok ? 'PASS' : 'FAIL'} |`);

console.log('\nPublished chart — M. K. Gandhi, 2 Oct 1869, 07:11 LMT, Porbandar\n');
console.log('| Element | Published | Engine | Result |');
console.log('|---|---|---|---|');
for (const [what, exp, got] of checks) console.log(`| ${what} | ${exp} | ${got} | ${exp === got ? 'PASS' : 'FAIL'} |`);
console.log(`\nLagna ${gandhi.ascendant.sign} ${gandhi.ascendant.degreeText} · ayanamsa ${dms(gandhi.ayanamsa)}`);
console.log(`Houses: ${sumHouses} (expect 12) · every planet has a nakshatra and pada: ${nakOk} · Vimshottari cycle: ${dashaYears.toFixed(2)} years (expect 120.00)`);

const failed = rows.filter(r => !r.ok).length + checks.filter(([, e, g]) => e !== g).length
  + (sumHouses === 12 ? 0 : 1) + (nakOk ? 0 : 1) + (Math.abs(dashaYears - 120) < 0.05 ? 0 : 1);
console.log(`\n${failed === 0 ? 'All checks passed.' : failed + ' check(s) failed.'}`);
process.exit(failed === 0 ? 0 : 1);
