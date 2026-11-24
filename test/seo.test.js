// SEO tests — run with: npm test
//
// These guard the part of the site a search engine sees before any JavaScript
// runs: the head the server writes, the addresses it offers, and the ones it
// keeps to itself. A page that quietly starts sharing another page's title, or
// a staff address that loses its noindex, is the kind of fault nobody notices
// until the rankings move, so it is checked here rather than by eye.
'use strict';
process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guruji-seo-'));
fs.copyFileSync(path.join(__dirname, '..', 'data', 'mantras.json'), path.join(tmp, 'mantras.json'));
process.env.GURUJI_DATA_DIR = tmp;
process.env.GURUJI_SEED_FILE = path.join(tmp, 'mantras-data.js');
process.env.RATE_LIMIT_MULTIPLIER = '100';
process.env.MONGODB_URI = '';
process.env.PAYMENT_MODE = 'simulated';
process.env.SITE_URL = 'https://gurujipalmistry.org';

const { createServer } = require('../server');
const { createStore } = require('../db');
const seo = require('../seo.js');
const content = require('../content-data.js');

describe('SEO', () => {
  let server, origin;

  before(async () => {
    const store = await createStore();
    server = createServer(store);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    origin = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server && server.close());

  const get = async (p) => {
    const res = await fetch(origin + p, { headers: { Accept: 'text/html' } });
    return { status: res.status, body: await res.text() };
  };
  const pick = (html, rx) => { const m = html.match(rx); return m ? m[1].trim() : ''; };
  const titleOf = (h) => pick(h, /<title>([\s\S]*?)<\/title>/i);
  const metaOf = (h, name) => pick(h, new RegExp('name="' + name + '"\\s+content="([^"]*)"', 'i'));
  const canonOf = (h) => pick(h, /rel="canonical"\s+href="([^"]*)"/i);

  // The addresses a visitor can reach from the site itself.
  const PUBLIC = ['/', '/about', '/services', '/services/category/palmistry',
    '/services/detailed-palm-analysis', '/reiki-healing', '/courses', '/courses/reiki-level-1',
    '/resources', '/resources/the-four-major-lines', '/faqs', '/contact', '/palmistry',
    '/mantras', '/book/consultation', '/book/pooja', '/privacy-policy', '/terms'];

  test('every public address describes itself, and no two describe themselves alike', async () => {
    const titles = new Map();
    const descriptions = new Map();
    for (const p of PUBLIC) {
      const { status, body } = await get(p);
      assert.equal(status, 200, p);
      const title = titleOf(body);
      const description = metaOf(body, 'description');
      assert.ok(title, `${p} has a title`);
      assert.ok(description, `${p} has a description`);
      assert.ok(description.length <= 170, `${p} description is ${description.length} chars`);
      assert.ok(!titles.has(title), `${p} and ${titles.get(title)} share the title "${title}"`);
      assert.ok(!descriptions.has(description), `${p} and ${descriptions.get(description)} share a description`);
      titles.set(title, p);
      descriptions.set(description, p);
    }
  });

  test('each address is canonical to itself, on the live domain', async () => {
    for (const p of PUBLIC) {
      const { body } = await get(p);
      assert.equal(canonOf(body), 'https://gurujipalmistry.org' + (p === '/' ? '/' : p), p);
      assert.equal(metaOf(body, 'robots'), 'index,follow', p);
    }
  });

  test('the same page under a second address still points at the one it is indexed under', async () => {
    // /book/payment and /book/details are steps of the booking, not pages of
    // their own: all three must name one address so they do not compete.
    const { body } = await get('/book/payment');
    assert.equal(canonOf(body), 'https://gurujipalmistry.org/book/consultation');
  });

  test('staff and personal addresses are kept out of the index', async () => {
    for (const p of ['/admin', '/guruji', '/account', '/track', '/search']) {
      const { body } = await get(p);
      assert.equal(metaOf(body, 'robots'), 'noindex,nofollow', p);
      assert.ok(!/application\/ld\+json/.test(body), `${p} carries no structured data`);
    }
  });

  test('an address that does not exist answers 404 and is not indexed', async () => {
    const { status, body } = await get('/no-such-page-here');
    assert.equal(status, 404);
    assert.match(titleOf(body), /Page not found/);
    assert.equal(metaOf(body, 'robots'), 'noindex,nofollow');
  });

  test('a page carries a card for the places people share links', async () => {
    const { body } = await get('/services/detailed-palm-analysis');
    const og = (prop) => pick(body, new RegExp('property="' + prop + '"\\s+content="([^"]*)"', 'i'));
    assert.match(og('og:title'), /Detailed Palm Analysis/);
    assert.equal(og('og:url'), 'https://gurujipalmistry.org/services/detailed-palm-analysis');
    assert.match(og('og:image'), /^https:\/\//, 'the card image is an absolute address');
    assert.equal(metaOf(body, 'twitter:card'), 'summary_large_image');
  });

  test('structured data parses and says what the page is', async () => {
    const cases = [
      ['/', ['Organization', 'WebSite']],
      ['/about', ['Organization', 'Person']],
      ['/services/detailed-palm-analysis', ['Organization', 'Service', 'BreadcrumbList']],
      ['/courses/reiki-level-1', ['Organization', 'Course', 'BreadcrumbList']],
      ['/resources/the-four-major-lines', ['Organization', 'Article', 'BreadcrumbList']],
      ['/faqs', ['Organization', 'FAQPage']]
    ];
    for (const [p, expected] of cases) {
      const { body } = await get(p);
      const raw = pick(body, /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
      assert.ok(raw, `${p} carries structured data`);
      const data = JSON.parse(raw);                       // throws if malformed
      assert.equal(data['@context'], 'https://schema.org');
      const types = data['@graph'].map(n => n['@type']);
      for (const want of expected) assert.ok(types.includes(want), `${p} declares ${want}, got ${types}`);
    }
  });

  test('a reading or an article can be read without running JavaScript', async () => {
    const { body } = await get('/services/detailed-palm-analysis');
    assert.match(body, /<h1>Detailed Palm Analysis<\/h1>/);
    const article = await get('/resources/the-four-major-lines');
    assert.match(article.body, /<h1>The Four Major Lines of the Palm<\/h1>/);
  });

  test('robots.txt opens the site but closes the staff areas', async () => {
    const res = await fetch(origin + '/robots.txt');
    const txt = await res.text();
    assert.equal(res.status, 200);
    assert.match(txt, /User-agent: \*/);
    for (const closed of ['/api/', '/admin', '/guruji', '/session/', '/learn/', '/payment/']) {
      assert.ok(txt.includes('Disallow: ' + closed), `robots.txt closes ${closed}`);
    }
    assert.match(txt, /Sitemap: https:\/\/gurujipalmistry\.org\/sitemap\.xml/);
  });

  test('the sitemap lists the public pages and nothing private', async () => {
    const res = await fetch(origin + '/sitemap.xml');
    const xml = await res.text();
    assert.equal(res.status, 200);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    assert.ok(locs.length > 50, `sitemap holds the catalogue, found ${locs.length}`);
    assert.equal(new Set(locs).size, locs.length, 'no address is listed twice');
    for (const loc of locs) assert.ok(loc.startsWith('https://gurujipalmistry.org/'), loc);
    const paths = locs.map(l => l.replace('https://gurujipalmistry.org', ''));
    for (const p of ['/', '/about', '/services', '/courses', '/resources', '/faqs', '/contact']) {
      assert.ok(paths.includes(p), `sitemap lists ${p}`);
    }
    for (const p of paths) {
      assert.ok(!/^\/(admin|guruji|session|learn|account|track|search|payment)\b/.test(p), `${p} should not be listed`);
    }
  });

  test('Search Console verification is written in only when it is configured', async () => {
    const { body } = await get('/');
    assert.ok(!/google-site-verification/.test(body), 'nothing is written while the token is unset');
    const built = seo.renderHead(
      seo.buildSeo({ pathname: '/', content, origin: 'https://gurujipalmistry.org' }),
      { verification: 'token-123' }
    );
    assert.match(built, /name="google-site-verification" content="token-123"/);
  });

  test('the brand logo is a real square image the schema can point at', async () => {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(__dirname, '..', 'assets', 'guruji-palmistry-logo-512.png');
    const bytes = fs.readFileSync(file);
    assert.deepEqual([...bytes.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], 'it is a PNG');
    assert.equal(bytes.readUInt32BE(16), 512, 'width');
    assert.equal(bytes.readUInt32BE(20), 512, 'height');

    const built = seo.buildSeo({ pathname: '/', content, origin: 'https://gurujipalmistry.org' });
    const org = built.jsonLd['@graph'].find(n => n['@type'] === 'Organization');
    assert.equal(org.logo, 'https://gurujipalmistry.org/assets/guruji-palmistry-logo-512.png');
    assert.ok(org.logo.startsWith('https://'), 'absolute, not a site-relative path');
    assert.ok(org.image.includes(org.logo), 'the square mark is offered as an image too');

    const res = await fetch(origin + '/assets/guruji-palmistry-logo-512.png');
    assert.equal(res.status, 200, 'the file is actually served');
    assert.equal(res.headers.get('content-type'), 'image/png');
    assert.equal(res.headers.get('x-robots-tag'), null, 'nothing stops it being indexed');
  });

  test('opening hours are published for the days the owner confirmed, and no others', async () => {
    const built = seo.buildSeo({ pathname: '/', content, origin: 'https://gurujipalmistry.org' });
    const org = built.jsonLd['@graph'].find(n => n['@type'] === 'Organization');
    const hours = org.openingHoursSpecification;
    assert.equal(hours['@type'], 'OpeningHoursSpecification');
    assert.equal(hours.opens, '09:00');
    assert.equal(hours.closes, '20:00');
    assert.deepEqual(hours.dayOfWeek, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    assert.ok(!hours.dayOfWeek.includes('Sunday'), 'the centre is closed on Sunday');
  });

  test('the address is given as parts, which is what a search engine can place', async () => {
    const built = seo.buildSeo({ pathname: '/', content, origin: 'https://gurujipalmistry.org' });
    const org = built.jsonLd['@graph'].find(n => n['@type'] === 'Organization');
    assert.equal(org.address['@type'], 'PostalAddress', 'not a bare string');
    assert.equal(org.address.postalCode, '500039');
    assert.equal(org.address.addressLocality, 'Hyderabad');
    assert.equal(org.address.addressRegion, 'Telangana');
    assert.equal(org.address.addressCountry, 'IN');
    assert.ok(org.address.streetAddress.startsWith('2-4-123'), org.address.streetAddress);
    // The label the line is written with is not part of the street.
    assert.ok(!/Wellness Centre/.test(org.address.streetAddress));
  });

  test('an address it cannot read apart is still given whole, never guessed at', async () => {
    const odd = { ...content, settings: { ...content.settings, address: 'Behind the old temple', registeredAddress: '' } };
    const built = seo.buildSeo({ pathname: '/', content: odd, origin: 'https://gurujipalmistry.org' });
    const org = built.jsonLd['@graph'].find(n => n['@type'] === 'Organization');
    assert.equal(org.address.streetAddress, 'Behind the old temple');
    assert.equal(org.address.addressLocality, undefined, 'no city is invented');
    assert.equal(org.address.postalCode, undefined, 'no pin code is invented');
  });

  // ---- Images -------------------------------------------------------------
  // Google finds pictures through the pages that carry them. These tests keep
  // the three things it needs in place: the file is served, the sitemap names
  // it, and the page says in words what the picture shows.

  test('the sitemap names the image on each page that has one', async () => {
    const res = await fetch(origin + '/sitemap.xml');
    const xml = await res.text();
    assert.match(xml, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/,
      'the image namespace is declared, or the entries mean nothing');
    const imgs = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m => m[1]);
    assert.ok(imgs.length > 20, `the catalogue's images are listed, found ${imgs.length}`);
    for (const u of imgs) assert.match(u, /^https:\/\/gurujipalmistry\.org\//, 'image URLs are absolute');
    assert.ok(imgs.some(u => u.endsWith('/assets/svc/palm-reading-life-heart-head-fate-lines.webp')));
    assert.ok(imgs.some(u => u.endsWith('/assets/svc/palmistry-one-to-one-consultation.webp')));
  });

  test('every image the sitemap names is actually served', async () => {
    const xml = await (await fetch(origin + '/sitemap.xml')).text();
    const paths = [...new Set([...xml.matchAll(/<image:loc>[^<]*?(\/assets\/[^<]+)<\/image:loc>/g)].map(m => m[1]))];
    assert.ok(paths.length > 20);
    const dead = [];
    for (const path of paths) {
      const r = await fetch(origin + path);
      if (!r.ok || !/^image\//.test(r.headers.get('content-type') || '')) dead.push(`${path} -> ${r.status}`);
    }
    assert.deepEqual(dead, [], 'a sitemap must not point at images that are not there');
  });

  test('the social card is the 1200x630 cut, not the page image', async () => {
    for (const [path, card] of [
      ['/palmistry', '/assets/og/palm-reading-life-heart-head-fate-lines-1200x630.jpg'],
      ['/services/detailed-palm-analysis', '/assets/og/palmistry-one-to-one-consultation-1200x630.jpg']
    ]) {
      const html = await (await fetch(origin + path)).text();
      const og = html.match(/<meta property="og:image" content="([^"]+)"/);
      assert.ok(og, `${path} has an og:image`);
      assert.equal(og[1], 'https://gurujipalmistry.org' + card);
      const r = await fetch(origin + card);
      assert.equal(r.status, 200, `${card} is served`);
    }
  });

  test('the banner carries alt text that says what the picture shows', async () => {
    const html = await (await fetch(origin + '/palmistry')).text();
    const tag = html.match(/<img[^>]*palm-reading-life-heart-head-fate-lines\.webp[^>]*>/);
    assert.ok(tag, 'the banner is in the page, not only in the sitemap');
    const alt = tag[0].match(/alt="([^"]*)"/);
    assert.ok(alt && alt[1].length > 30, 'the alt text is descriptive, not a filename');
    for (const word of ['Life Line', 'Heart Line', 'Head Line', 'Fate Line']) {
      assert.ok(alt[1].includes(word), `alt text names the ${word}`);
    }
    // Width and height stop the page jumping while the image loads.
    assert.match(tag[0], /width="1200"/);
    assert.match(tag[0], /height="800"/);
  });

  test('nothing is claimed about Guruji that the site does not already say', async () => {
    const built = seo.buildSeo({ pathname: '/about', content, origin: 'https://gurujipalmistry.org' });
    const person = built.jsonLd['@graph'].find(n => n['@type'] === 'Person');
    assert.equal(person.name, content.about.name, 'the name is the one in the site content');
    for (const invented of ['award', 'alumniOf', 'hasCredential', 'honorificPrefix', 'aggregateRating']) {
      assert.equal(person[invented], undefined, `nothing is invented for ${invented}`);
    }
  });
});
