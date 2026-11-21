# Birth chart engine — how it is built and how it was checked

_Checked 21 November 2026. Re-run any time with `npm run verify:chart`._

## What the engine does

`chart.js` computes a sidereal (Vedic) chart with no outside service and no API key:

- **Planetary positions** from VSOP87D (via the `astronomia` package) for Mercury to Saturn
  and the Earth, turned into geocentric longitudes by vector subtraction, three light-time
  iterations, aberration (Meeus 33.9) and nutation. The Moon comes from the ELP-derived
  series in the same package; Rahu and Ketu are the **mean** lunar node and its opposite.
- **Ayanamsa**: Chitrapaksha (Lahiri), anchored on the defined value 23° 51′ 10.5″ at
  J2000.0 and carried forward and back with the IAU 2006 polynomial for general precession
  in longitude.
- **Houses**: whole-sign (bhava = rashi), the usual scheme in Indian practice.
- **Ascendant**: apparent sidereal time at the birth place, then the standard
  obliquity/latitude formula, minus the ayanamsa.
- **Nakshatra and pada** from the sidereal longitude; **Vimshottari dasha** from the Moon's
  nakshatra, using the sidereal year of 365.256363004 days.

Retrograde motion is measured, not assumed: the longitude is computed a day either side of
the birth moment.

## Results

Numeric checks against published worked examples:

| Check | Expected | Engine | Difference | Tolerance | Result |
|---|---|---|---|---|---|
| Lahiri ayanamsa at J2000.0 (its definition) | 23.85292° | 23.85292° | 0.0″ | 1″ | PASS |
| Lahiri ayanamsa 1 Jan 2025 (published table, 24° 12′ 26″) | 24.20722° | 24.20217° | 18.2″ | 60″ | PASS |
| Meeus, *Astronomical Algorithms*, Example 25.b — Sun's apparent longitude, 1992-10-13.0 TD | 199.90606° | 199.90670° | 2.3″ | 30″ | PASS |
| Meeus Example 47.a — Moon's longitude, 1992-04-12.0 TD | 133.16266° | 133.17230° | 34.7″ | 120″ | PASS |
| Meeus Example 33.a — Venus's apparent longitude, 1992-12-20.0 TD | 313.08102° | 313.08220° | 4.2″ | 60″ | PASS |

Against a widely published chart — **M. K. Gandhi, 2 October 1869, 07:11 LMT, Porbandar**:

| Element | Published | Engine | Result |
|---|---|---|---|
| Lagna sign | Tula | Tula (4° 30′ 33″) | PASS |
| Sun | Kanya | Kanya | PASS |
| Moon sign | Karka | Karka | PASS |
| Moon nakshatra | Ashlesha | Ashlesha | PASS |
| Moon pada | 4 | 4 | PASS |
| Jupiter retrograde | yes | yes | PASS |
| Jupiter sign | Mesha | Mesha | PASS |

Internal consistency: 12 houses; every planet carries a nakshatra and a pada between 1 and
4; the Vimshottari cycle adds up to exactly 120.00 years.

## Honest limits

- The Moon is accurate to roughly half an arcminute, which is far inside one pada
  (3° 20′) but is not an ephemeris-grade lunar theory. Readings that turn on a
  nakshatra boundary within an arcminute should be checked against a professional
  ephemeris.
- Rahu and Ketu are the **mean** node. Some almanacs publish the true node; the two can
  differ by up to about 1.5°, which occasionally changes the nakshatra.
- The time zone is taken as given (IST by default). A birth before 1942 in India, or any
  birth recorded in local mean time, needs the right offset entered by hand — as was done
  for the Gandhi check above (+4h38m LMT).
- Houses are whole-sign only. Placidus, Sripati and bhava-chalit are not computed.
- Divisional charts (D-9 navamsa and the rest) are not computed yet.
