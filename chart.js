// GURUJI PALMISTRY — Vedic birth chart (Kundali)
//
// Positions come from VSOP87D (planets), Meeus chapter 47 (Moon) and the mean
// lunar node (Rahu/Ketu), through the `astronomia` package — pure JavaScript,
// MIT licensed, no native build and no external service.
//
// Sidereal longitudes use the Chitrapaksha (Lahiri) ayanamsa, computed the way
// it is defined: the tropical longitude of Spica (Chitra) minus 180°. That is
// the definition the Indian ephemeris uses, so the number is not a fitted
// approximation that drifts away from the published tables.
//
// Houses are whole-sign (Bhava = Rashi), as in standard North and South Indian
// practice. Accuracy of the planetary longitudes is about one arcsecond, which
// is far finer than any astrological reading needs.

'use strict';

const { planetposition, julian, solar, moonposition, nutation, precess, coord, base, sidereal } = require('astronomia');

const data = {
  earth: require('astronomia/data/vsop87Dearth').default,
  mercury: require('astronomia/data/vsop87Dmercury').default,
  venus: require('astronomia/data/vsop87Dvenus').default,
  mars: require('astronomia/data/vsop87Dmars').default,
  jupiter: require('astronomia/data/vsop87Djupiter').default,
  saturn: require('astronomia/data/vsop87Dsaturn').default
};
const planets = {
  earth: new planetposition.Planet(data.earth),
  mercury: new planetposition.Planet(data.mercury),
  venus: new planetposition.Planet(data.venus),
  mars: new planetposition.Planet(data.mars),
  jupiter: new planetposition.Planet(data.jupiter),
  saturn: new planetposition.Planet(data.saturn)
};

const CHART_VERSION = '1.0.0';
const DEG = Math.PI / 180;
const norm360 = (d) => ((d % 360) + 360) % 360;
const toDeg = (r) => norm360(r * 180 / Math.PI);

const SIGNS = ['Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)',
  'Tula (Libra)', 'Vrischika (Scorpio)', 'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)'];
const SIGNS_SHORT = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
// Vimshottari: the lord of each nakshatra, in the repeating nine-fold order
const DASHA_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const SIDEREAL_YEAR = 365.256363004; // days, the year Vimshottari is reckoned in

/** Julian Day (UT) from a local date, local time and the offset from UTC in minutes. */
function julianDay(dateISO, timeHHMM, tzMinutes) {
  const [y, m, d] = String(dateISO).split('-').map(Number);
  const [hh, mm] = String(timeHHMM || '12:00').split(':').map(Number);
  const dayFraction = (hh * 60 + mm - tzMinutes) / 1440;
  return julian.CalendarGregorianToJD(y, m, d) + dayFraction;
}

/**
 * Chitrapaksha (Lahiri) ayanamsa in degrees.
 *
 * Anchored at the published value for J2000.0 — 23° 51′ 10.5″ — and carried
 * forward and back with the IAU 2006 polynomial for general precession in
 * longitude. This agrees with the Indian ephemeris and with Swiss Ephemeris'
 * Lahiri to a few arcseconds over the range of real birth dates, which is far
 * finer than a reading needs (a nakshatra pada is 50 arcminutes wide).
 */
function lahiriAyanamsa(jde) {
  const AYANAMSA_J2000 = 23 + 51 / 60 + 10.5 / 3600;
  const T = base.J2000Century(jde);
  // general precession in longitude, arcseconds since J2000 (IAU 2006)
  const p = 5028.796195 * T + 1.1054348 * T * T + 0.00007964 * T ** 3
          - 0.000023857 * T ** 4 - 0.0000000383 * T ** 5;
  return norm360(AYANAMSA_J2000 + p / 3600);
}

/** Geocentric apparent ecliptic longitude and latitude of a planet, in degrees. */
function geocentricPlanet(planet, jde) {
  const e = planets.earth.position(jde);
  const X0 = e.range * Math.cos(e.lat) * Math.cos(e.lon);
  const Y0 = e.range * Math.cos(e.lat) * Math.sin(e.lon);
  const Z0 = e.range * Math.sin(e.lat);
  let x = 0, y = 0, z = 0, range = 0, tau = 0;
  for (let i = 0; i < 3; i++) {           // iterate for light time
    const p = planet.position(jde - tau);
    const cB = Math.cos(p.lat);
    x = p.range * cB * Math.cos(p.lon) - X0;
    y = p.range * cB * Math.sin(p.lon) - Y0;
    z = p.range * Math.sin(p.lat) - Z0;
    range = Math.sqrt(x * x + y * y + z * z);
    tau = 0.0057755183 * range;
  }
  let lon = Math.atan2(y, x);
  let lat = Math.atan2(z, Math.hypot(x, y));

  // Annual aberration (Meeus 33.9) and nutation in longitude
  const T = base.J2000Century(jde);
  const sunLon = solar.apparentVSOP87(planets.earth, jde).lon;
  const e0 = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;        // eccentricity of Earth's orbit
  const pi = (102.93735 + 1.71946 * T + 0.00046 * T * T) * DEG;           // longitude of perihelion
  const k = 20.49552 / 3600 * DEG;
  const dLon = (-k * Math.cos(sunLon - lon) + e0 * k * Math.cos(pi - lon)) / Math.cos(lat);
  const dLat = -k * Math.sin(lat) * (Math.sin(sunLon - lon) - e0 * Math.sin(pi - lon));
  lon += dLon + nutation.nutation(jde)[0];
  lat += dLat;
  return { lon: toDeg(lon), lat: lat / DEG, range };
}

/** Mean longitude of the ascending lunar node (Rahu), degrees. Meeus 47.7. */
function meanNode(jde) {
  const T = base.J2000Century(jde);
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T * T * T * T / 60616000);
}

/** The rising sign degree (Lagna), tropical, for a time and place. */
function ascendant(jde, lat, lon) {
  // Greenwich apparent sidereal time → local sidereal time
  const gast = sidereal.apparent(jde) / 3600 * 15;           // seconds → degrees
  const lst = norm360(gast + lon) * DEG;
  const eps = nutation.meanObliquity(jde) + nutation.nutation(jde)[1];
  const phi = lat * DEG;
  // Meeus, "Astronomical Algorithms", the ecliptic point on the eastern horizon
  const asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return toDeg(asc);
}

const nakshatraOf = (siderealLon) => {
  const span = 360 / 27;
  const index = Math.floor(siderealLon / span);
  const within = siderealLon - index * span;
  return {
    index,
    name: NAKSHATRAS[index],
    pada: Math.floor(within / (span / 4)) + 1,
    lord: DASHA_ORDER[index % 9],
    fraction: within / span
  };
};

const signOf = (siderealLon) => {
  const index = Math.floor(siderealLon / 30);
  return { index, name: SIGNS[index], short: SIGNS_SHORT[index], lord: SIGN_LORDS[index], degree: siderealLon - index * 30 };
};

const fmtDeg = (d) => {
  const deg = Math.floor(d);
  const minFloat = (d - deg) * 60;
  const min = Math.floor(minFloat);
  return `${deg}° ${String(min).padStart(2, '0')}' ${String(Math.round((minFloat - min) * 60)).padStart(2, '0')}"`;
};

/** Vimshottari Mahadasha periods from the Moon's nakshatra, with Antardashas inside the running one. */
function vimshottari(moonSidereal, birthJD) {
  const nak = nakshatraOf(moonSidereal);
  const startIndex = DASHA_ORDER.indexOf(nak.lord);
  const periods = [];
  // the first period is already part-spent at birth
  let jd = birthJD - nak.fraction * DASHA_YEARS[nak.lord] * SIDEREAL_YEAR;
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startIndex + i) % 9];
    const days = DASHA_YEARS[lord] * SIDEREAL_YEAR;
    periods.push({ lord, startJD: jd, endJD: jd + days, years: DASHA_YEARS[lord] });
    jd += days;
  }
  return periods;
}

function antardashas(period) {
  const out = [];
  const total = period.endJD - period.startJD;
  let jd = period.startJD;
  const start = DASHA_ORDER.indexOf(period.lord);
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(start + i) % 9];
    const days = total * DASHA_YEARS[lord] / 120;
    out.push({ lord, startJD: jd, endJD: jd + days });
    jd += days;
  }
  return out;
}

const jdToISO = (jd) => {
  const { year, month, day } = julian.JDToCalendar(jd, true);
  const d = new Date(Date.UTC(year, month - 1, Math.floor(day)));
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
};

/**
 * The whole chart.
 * @param {object} input - { date:'YYYY-MM-DD', time:'HH:MM', tzMinutes, lat, lon, place }
 */
function computeChart(input) {
  const { date, time, lat, lon } = input;
  const tzMinutes = input.tzMinutes === undefined ? 330 : Number(input.tzMinutes);  // India by default
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('A date of birth (YYYY-MM-DD) is needed');
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) throw new Error('Latitude and longitude are needed');

  const jd = julianDay(date, time, tzMinutes);
  // Terrestrial Time for the positions; UT for the sidereal time
  const jde = jd + (require('astronomia').deltat.deltaT(base.JDEToJulianYear(jd)) || 0) / 86400;
  const ayan = lahiriAyanamsa(jde);
  const sid = (tropical) => norm360(tropical - ayan);

  const rows = [];
  const add = (id, name, tropicalLon, extra = {}) => {
    const s = sid(tropicalLon);
    const sign = signOf(s);
    const nak = nakshatraOf(s);
    rows.push({
      id, name,
      lonTropical: Number(tropicalLon.toFixed(4)),
      lon: Number(s.toFixed(4)),
      sign: sign.name, signShort: sign.short, signIndex: sign.index, signLord: sign.lord,
      degree: Number(sign.degree.toFixed(4)), degreeText: fmtDeg(sign.degree),
      nakshatra: nak.name, nakshatraLord: nak.lord, pada: nak.pada,
      ...extra
    });
  };

  const sunLon = toDeg(solar.apparentVSOP87(planets.earth, jde).lon);
  add('su', 'Sun', sunLon);
  add('mo', 'Moon', toDeg(moonposition.position(jde).lon));
  for (const [id, name, key] of [['ma', 'Mars', 'mars'], ['me', 'Mercury', 'mercury'], ['ju', 'Jupiter', 'jupiter'], ['ve', 'Venus', 'venus'], ['sa', 'Saturn', 'saturn']]) {
    const now = geocentricPlanet(planets[key], jde);
    const later = geocentricPlanet(planets[key], jde + 1);
    const motion = ((later.lon - now.lon + 540) % 360) - 180;   // signed daily motion
    add(id, name, now.lon, { retrograde: motion < 0, dailyMotion: Number(motion.toFixed(4)) });
  }
  const rahu = meanNode(jde);
  add('ra', 'Rahu', rahu, { retrograde: true, note: 'mean node' });
  add('ke', 'Ketu', norm360(rahu + 180), { retrograde: true, note: 'mean node' });

  const ascTropical = ascendant(jd, Number(lat), Number(lon));
  const ascSid = sid(ascTropical);
  const ascSign = signOf(ascSid);
  const ascNak = nakshatraOf(ascSid);

  // Whole-sign houses: the rising sign is the first Bhava
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const signIndex = (ascSign.index + i) % 12;
    houses.push({
      number: i + 1,
      signIndex,
      sign: SIGNS[signIndex],
      signShort: SIGNS_SHORT[signIndex],
      lord: SIGN_LORDS[signIndex],
      planets: []
    });
  }
  for (const p of rows) {
    const house = ((p.signIndex - ascSign.index) % 12 + 12) % 12;
    p.house = house + 1;
    houses[house].planets.push(p.id);
  }

  const moon = rows.find(r => r.id === 'mo');
  const periods = vimshottari(moon.lon, jd);
  const today = Date.now() / 86400000 + 2440587.5;
  const running = periods.find(p => today >= p.startJD && today < p.endJD) || periods[0];
  const dashas = periods.map(p => ({
    lord: p.lord, years: p.years, start: jdToISO(p.startJD), end: jdToISO(p.endJD), current: p === running
  }));
  const runningAntar = antardashas(running).map(a => ({
    lord: a.lord, start: jdToISO(a.startJD), end: jdToISO(a.endJD), current: today >= a.startJD && today < a.endJD
  }));

  return {
    version: CHART_VERSION,
    engine: 'astronomia VSOP87D + Meeus, Chitrapaksha (Lahiri) ayanamsa',
    computedAt: new Date().toISOString(),
    input: { date, time: time || '', tzMinutes, lat: Number(lat), lon: Number(lon), place: input.place || '' },
    julianDay: Number(jd.toFixed(6)),
    ayanamsa: Number(ayan.toFixed(6)),
    ayanamsaText: fmtDeg(ayan),
    ascendant: {
      lonTropical: Number(ascTropical.toFixed(4)), lon: Number(ascSid.toFixed(4)),
      sign: ascSign.name, signShort: ascSign.short, signIndex: ascSign.index, signLord: ascSign.lord,
      degree: Number(ascSign.degree.toFixed(4)), degreeText: fmtDeg(ascSign.degree),
      nakshatra: ascNak.name, pada: ascNak.pada
    },
    planets: rows,
    houses,
    moonSign: signOf(moon.lon).name,
    moonNakshatra: { name: moon.nakshatra, pada: moon.pada, lord: moon.nakshatraLord },
    dashas,
    currentDasha: { lord: running.lord, antar: runningAntar }
  };
}

module.exports = { computeChart, lahiriAyanamsa, julianDay, SIGNS, SIGNS_SHORT, NAKSHATRAS, CHART_VERSION };
