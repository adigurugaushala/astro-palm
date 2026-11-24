/**
 * Shared SEO metadata for every public address of the site.
 *
 * One file, two homes. The server requires it to write the head into
 * index.html before a byte is sent, so crawlers and the scrapers behind
 * WhatsApp, Facebook, LinkedIn and X — none of which run JavaScript — read
 * real tags. The browser loads the same file to keep those tags right as the
 * visitor moves between pages without a reload.
 *
 * Keeping it in one place is the point: a title written twice is a title that
 * will disagree with itself.
 *
 * Nothing here invents anything. Every name, figure and link is read from the
 * site's own content; where a fact is missing the field is left out rather
 * than filled in.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GurujiSeo = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BRAND = 'Guruji Palmistry';
  var DEFAULT_IMAGE = '/assets/hero_palm_art_clean.jpg';
  // The brand lotus as a square still: the same four paths as the mark in the
  // header and the loading screen, drawn once and saved, so neither of those
  // animated marks had to be touched. On the brand tile, so it stays legible
  // on a white search result.
  var LOGO = '/assets/guruji-palmistry-logo-512.png';
  // Some page images have a 1200x630 twin cut for social cards, which is the
  // shape Facebook, WhatsApp, X and LinkedIn all crop to. The page keeps the
  // lighter WebP; only the card swaps to the JPEG.
  var SOCIAL_CARDS = {
    '/assets/svc/palm-reading-life-heart-head-fate-lines.webp':
      '/assets/og/palm-reading-life-heart-head-fate-lines-1200x630.jpg',
    '/assets/svc/palmistry-one-to-one-consultation.webp':
      '/assets/og/palmistry-one-to-one-consultation-1200x630.jpg'
  };

  // Confirmed by the owner for the Adiguru Wellness Centre. Sunday is absent
  // because the centre is closed, not because the day is unknown.
  var OPEN_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var OPEN_FROM = '09:00';
  var OPEN_TO = '20:00';

  /** Addresses that must never reach an index: staff areas and a seeker's own pages. */
  var PRIVATE_PAGES = ['admin', 'guruji', 'session', 'learn', 'account', 'messages', 'payment-return', 'book-status', 'search'];

  /* The address table, in the order the first match wins. It mirrors the
     browser router so a page cannot be described one way by the server and
     another way by the app. */
  var ROUTES = [
    [/^\/$/, 'home'],
    [/^\/about$/, 'about'],
    [/^\/services$/, 'services'],
    [/^\/services\/category\/([a-z0-9-]+)$/, 'service-category', ['cat']],
    [/^\/services\/([a-z0-9-]+)$/, 'service-detail', ['slug']],
    [/^\/reiki-healing$/, 'reiki'],
    [/^\/courses$/, 'courses'],
    [/^\/courses\/([a-z0-9-]+)$/, 'course-detail', ['slug']],
    [/^\/resources$/, 'resources'],
    [/^\/resources\/([a-z0-9-]+)$/, 'article', ['slug']],
    [/^\/faqs$/, 'faqs'],
    [/^\/contact$/, 'contact'],
    [/^\/(disclaimer|privacy-policy|terms|cancellation-refund-policy|consent-policy|grievance)$/, 'policy', ['policy']],
    [/^\/palmistry$/, 'palmistry'],
    [/^\/mantras$/, 'mantras'],
    [/^\/book\/consultation$/, 'book-consultation'],
    [/^\/book\/pooja$/, 'book-pooja'],
    [/^\/book\/(?:details|payment)$/, 'book-consultation'],
    [/^\/book\/upload$/, 'book-status'],
    [/^\/track$/, 'book-status'],
    [/^\/account$/, 'account'],
    [/^\/messages$/, 'messages'],
    [/^\/admin$/, 'admin'],
    [/^\/guruji$/, 'guruji'],
    [/^\/guruji\/([A-Z0-9-]+)$/, 'guruji', ['slug']],
    [/^\/session\/([A-Z0-9-]+)$/, 'session', ['slug']],
    [/^\/learn\/([A-Z0-9-]+)$/, 'learn', ['slug']],
    [/^\/search$/, 'search'],
    [/^\/payment\/return$/, 'payment-return']
  ];

  /** The one address each page is indexed under, so two paths never compete. */
  var CANONICAL_PATHS = {
    home: '/', about: '/about', services: '/services', reiki: '/reiki-healing',
    courses: '/courses', resources: '/resources', faqs: '/faqs', contact: '/contact',
    palmistry: '/palmistry', mantras: '/mantras',
    'book-consultation': '/book/consultation', 'book-pooja': '/book/pooja',
    'book-status': '/track', account: '/account', messages: '/messages', admin: '/admin', guruji: '/guruji',
    search: '/search', 'payment-return': '/payment/return'
  };

  function trimPath(pathname) {
    var p = String(pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '');
    return p || '/';
  }

  function matchRoute(pathname) {
    var p = trimPath(pathname);
    for (var i = 0; i < ROUTES.length; i++) {
      var m = p.match(ROUTES[i][0]);
      if (m) {
        var params = {};
        (ROUTES[i][2] || []).forEach(function (k, j) { params[k] = m[j + 1]; });
        return { page: ROUTES[i][1], params: params };
      }
    }
    return null;
  }

  function canonicalPathFor(pageId, params) {
    params = params || {};
    switch (pageId) {
      case 'service-category': return '/services/category/' + params.cat;
      case 'service-detail': return '/services/' + params.slug;
      case 'course-detail': return '/courses/' + params.slug;
      case 'article': return '/resources/' + params.slug;
      case 'policy': return '/' + params.policy;
      case 'session': return '/session/' + params.slug;
      case 'learn': return '/learn/' + params.slug;
      default: return CANONICAL_PATHS[pageId] || null;
    }
  }

  /** Plain text from a content field, with any markup and runs of space removed. */
  function plain(value) {
    return String(value == null ? '' : value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * A description a search engine will show whole. Google renders roughly 155
   * characters, so longer text is cut at a word, not mid-word, and never ends
   * on a stray comma.
   */
  function clamp(text, limit) {
    var t = plain(text);
    limit = limit || 155;
    if (t.length <= limit) return t;
    var cut = t.slice(0, limit + 1);
    var stop = cut.lastIndexOf(' ');
    return (stop > 60 ? cut.slice(0, stop) : t.slice(0, limit)).replace(/[\s,;:.\-–—]+$/, '') + '…';
  }

  function find(list, key, value) {
    var rows = list || [];
    for (var i = 0; i < rows.length; i++) if (rows[i] && rows[i][key] === value) return rows[i];
    return null;
  }

  function absolute(origin, pathOrUrl) {
    var v = String(pathOrUrl || '');
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    return String(origin || '').replace(/\/+$/, '') + (v.charAt(0) === '/' ? v : '/' + v);
  }

  /* ----------------------------------------------------------------------- */
  /* Titles and descriptions                                                  */
  /* ----------------------------------------------------------------------- */

  /**
   * Every public address gets wording of its own. A page that shares another
   * page's title is a page Google has to choose between, so nothing here is
   * reused.
   */
  function describe(pageId, params, content) {
    var c = content || {};
    var s = params.slug ? find(c.services, 'slug', params.slug) : null;
    var course = params.slug ? find(c.courses, 'slug', params.slug) : null;
    var article = params.slug ? find(c.articles, 'slug', params.slug) : null;
    var cat = params.cat ? find(c.serviceCategories, 'id', params.cat) : null;
    var policy = params.policy ? (c.policies || {})[params.policy] : null;

    switch (pageId) {
      case 'home': return {
        title: BRAND + ' | Palmistry, Astrology, Reiki & Spiritual Guidance',
        description: 'Palm analysis, Kundali analysis and the combined Astro-Palmistry Correlation with Guruji, alongside Reiki healing, pooja sevas, courses and a library of mantras.',
        ogType: 'website'
      };
      case 'about': return {
        title: 'About ' + ((c.about || {}).name || 'Guruji'),
        description: (c.about || {}).intro,
        ogType: 'profile',
        image: (c.about || {}).portrait
      };
      case 'services': return {
        title: 'Services',
        description: 'Palmistry, Vedic astrology, japa and mantra, pooja sevas, pitru services, muhurta, Reiki and spiritual guidance with Guruji.'
      };
      case 'service-category': return cat ? {
        title: cat.title, description: cat.intro || ('Services for ' + cat.title + ' with Guruji.')
      } : null;
      case 'service-detail': return s ? {
        title: s.title,
        description: s.intro || s.short || s.description,
        ogType: 'product',
        image: s.image
      } : null;
      case 'reiki': return {
        title: 'Reiki Healing',
        description: 'In-person sessions at Adiguru Wellness Centre and distance Reiki, offered for relaxation and a sense of balance alongside medical care.'
      };
      case 'courses': return {
        title: 'Courses',
        description: 'Learn palmistry and Reiki with Guruji — foundational to advanced study of Hasta Samudrika Shastra, and Reiki Levels 1 to 3.'
      };
      case 'course-detail': return course ? {
        title: course.title, description: course.overview, ogType: 'article', image: course.image
      } : null;
      case 'resources': return {
        title: 'Resources & Articles',
        description: 'Articles and guides on palmistry, Vedic astrology, Reiki, mantras, rituals and meditation, written by Guruji.'
      };
      case 'article': return article ? {
        title: article.title, description: article.excerpt, ogType: 'article', image: article.image
      } : null;
      case 'faqs': return {
        title: 'Frequently Asked Questions',
        description: 'Answers about palm readings, Kundali analysis, Reiki, pooja sevas, courses, booking a consultation and payment.'
      };
      case 'contact': return {
        title: 'Contact & Enquiries',
        description: 'Send an enquiry to Guruji, or reach the Adiguru Wellness Centre in Uppal, Hyderabad.'
      };
      case 'book-consultation': return {
        title: 'Book a Consultation',
        description: 'Book a Detailed Palm Analysis, a Comprehensive Kundali Analysis or the combined Astro-Palmistry Correlation with Guruji Palmistry.'
      };
      case 'book-pooja': return {
        title: 'Book a Pooja Seva',
        description: 'Request a pooja or homam performed with Sankalpa in your name, on a date and time that suits you, with prasadam sent to your home.'
      };
      case 'palmistry': return {
        title: 'Palmistry Guide',
        description: 'Hand shapes, the major and minor lines, the mounts and the fingers explained — a plain guide to reading a hand.',
        image: '/assets/svc/palm-reading-life-heart-head-fate-lines.webp'
      };
      case 'mantras': return {
        title: 'Mantras & Stotras',
        description: 'A library of mantras and stotras with their meaning, the occasion for each and guidance on how they are chanted.'
      };
      case 'policy': return policy ? {
        title: policy.title,
        description: clamp(policy.body || policy.intro || (policy.title + ' for ' + BRAND + '.'), 155)
      } : null;
      /* The pages below belong to one person or to staff. They are described
         plainly and kept out of the index. */
      case 'book-status': return { title: 'Track Your Booking', description: 'Check where your booking has reached.' };
      case 'account': return { title: 'My Account', description: 'Your bookings and readings.' };
      case 'messages': return { title: 'Messages', description: 'Your conversations with Guruji.' };
      case 'search': return { title: 'Search', description: 'Search the site.' };
      case 'admin': return { title: 'Admin', description: 'Staff area.' };
      case 'guruji': return { title: 'Guruji — cases', description: 'Staff area.' };
      case 'session': return { title: 'Consultation room', description: 'Your consultation room.' };
      case 'learn': return { title: 'Course lesson', description: 'Your course lesson.' };
      case 'payment-return': return { title: 'Payment', description: 'Returning from payment.' };
      default: return null;
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Structured data                                                          */
  /* ----------------------------------------------------------------------- */

  /**
   * The address as its parts, which is what a search engine can place on a map.
   * Written as one line in the site's content, so it is read back carefully:
   * the pin code, then the state and the city before it. Anything it cannot
   * read confidently is left in the street line rather than guessed at, and
   * the whole thing is still an address either way.
   */
  function postalAddress(line) {
    var text = plain(line).replace(/^[^:]{0,24}:\s*/, '');   // drop a "Wellness Centre:" style label
    if (!text) return null;
    var addr = { '@type': 'PostalAddress', addressCountry: 'IN' };
    var pin = text.match(/(\d{6})\s*$/);
    if (pin) {
      addr.postalCode = pin[1];
      text = text.slice(0, pin.index).replace(/[\s,\-–—]+$/, '');
    }
    var parts = text.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length >= 3) {
      addr.addressRegion = parts.pop();
      addr.addressLocality = parts.pop();
    }
    addr.streetAddress = parts.join(', ');
    return addr.streetAddress ? addr : null;
  }

  function crumbs(origin, items) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map(function (it, i) {
        return { '@type': 'ListItem', position: i + 1, name: it[0], item: absolute(origin, it[1]) };
      })
    };
  }

  /**
   * The graph for a page. Only facts the site already states are included:
   * where a detail is absent the property is dropped rather than guessed.
   */
  function structuredData(pageId, params, content, origin, seo) {
    var c = content || {};
    var st = c.settings || {};
    var about = c.about || {};
    var orgId = absolute(origin, '/') + '#organization';

    var org = {
      '@type': 'Organization',
      '@id': orgId,
      name: st.brand || BRAND,
      url: absolute(origin, '/'),
      description: 'Palmistry, Vedic astrology, Reiki healing and spiritual guidance.'
    };
    if (st.email) org.email = st.email;
    if (st.phone) org.telephone = st.phone;
    // The visitor-facing centre is the address people are directed to.
    var addr = postalAddress(st.address || st.registeredAddress);
    if (addr) org.address = addr;
    if (st.mapUrl) org.hasMap = st.mapUrl;
    org.logo = absolute(origin, LOGO);
    // Square mark first, then the wider brand image: Google picks the shape it needs.
    org.image = [absolute(origin, LOGO), absolute(origin, DEFAULT_IMAGE)];

    // Hours confirmed by the owner: Monday to Saturday, 09:00 to 20:00, closed
    // on Sunday. Days are never guessed — wrong days send someone to a closed
    // door. Settings can override them without a code change.
    var days = st.openingDays || OPEN_DAYS;
    var opens = st.openingFrom || OPEN_FROM;
    var closes = st.openingTo || OPEN_TO;
    if (days && days.length && opens && closes) {
      org.openingHoursSpecification = {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [].concat(days),
        opens: opens,
        closes: closes
      };
    }
    var social = Object.keys(st.social || {})
      .map(function (k) { return st.social[k]; })
      .filter(function (u) { return /^https:\/\//.test(u || ''); });
    if (social.length) org.sameAs = social;

    var graph = [org];

    if (pageId === 'home') {
      graph.push({
        '@type': 'WebSite',
        '@id': absolute(origin, '/') + '#website',
        url: absolute(origin, '/'),
        name: st.brand || BRAND,
        publisher: { '@id': orgId },
        potentialAction: {
          '@type': 'SearchAction',
          target: absolute(origin, '/search') + '?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      });
    }

    // Guruji's own page. Name, portrait and introduction come from the site's
    // About content; no qualification or award is added.
    if (pageId === 'about' && about.name) {
      var person = {
        '@type': 'Person',
        '@id': absolute(origin, '/about') + '#person',
        name: about.name,
        url: absolute(origin, '/about'),
        worksFor: { '@id': orgId }
      };
      if (about.intro) person.description = clamp(about.intro, 300);
      if (about.portrait) person.image = absolute(origin, about.portrait);
      graph.push(person);
    }

    if (pageId === 'service-detail') {
      var s = find(c.services, 'slug', params.slug);
      if (s) {
        var cat = find(c.serviceCategories, 'id', s.category);
        var service = {
          '@type': 'Service',
          name: s.title,
          description: clamp(s.intro || s.short || s.description, 300),
          provider: { '@id': orgId },
          url: absolute(origin, '/services/' + s.slug)
        };
        if (cat) service.serviceType = cat.title;
        if (s.image) service.image = absolute(origin, s.image);
        if (Number(s.price) > 0) {
          service.offers = {
            '@type': 'Offer',
            price: String(s.price),
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            url: absolute(origin, '/services/' + s.slug)
          };
        }
        graph.push(service);
        graph.push(crumbs(origin, [['Home', '/'], ['Services', '/services'],
          cat ? [cat.title, '/services/category/' + cat.id] : null, [s.title, '/services/' + s.slug]]
          .filter(Boolean)));
      }
    }

    if (pageId === 'course-detail') {
      var course = find(c.courses, 'slug', params.slug);
      if (course) {
        var courseLd = {
          '@type': 'Course',
          name: course.title,
          description: clamp(course.overview, 300),
          provider: { '@id': orgId },
          url: absolute(origin, '/courses/' + course.slug)
        };
        if (course.image) courseLd.image = absolute(origin, course.image);
        graph.push(courseLd);
        graph.push(crumbs(origin, [['Home', '/'], ['Courses', '/courses'], [course.title, '/courses/' + course.slug]]));
      }
    }

    if (pageId === 'article') {
      var a = find(c.articles, 'slug', params.slug);
      if (a) {
        var art = {
          '@type': 'Article',
          headline: a.title,
          description: clamp(a.excerpt, 300),
          url: absolute(origin, '/resources/' + a.slug),
          publisher: { '@id': orgId },
          mainEntityOfPage: absolute(origin, '/resources/' + a.slug)
        };
        if (a.date) { art.datePublished = a.date; art.dateModified = a.date; }
        if (a.image) art.image = absolute(origin, a.image);
        if (a.author) art.author = { '@type': 'Person', name: a.author };
        graph.push(art);
        graph.push(crumbs(origin, [['Home', '/'], ['Resources', '/resources'], [a.title, '/resources/' + a.slug]]));
      }
    }

    if (pageId === 'service-category') {
      var sc = find(c.serviceCategories, 'id', params.cat);
      if (sc) graph.push(crumbs(origin, [['Home', '/'], ['Services', '/services'], [sc.title, '/services/category/' + sc.id]]));
    }

    if (pageId === 'faqs') {
      var items = (c.faqCategories || []).reduce(function (all, group) {
        return all.concat(group.items || []);
      }, []).slice(0, 40);
      if (items.length) {
        graph.push({
          '@type': 'FAQPage',
          mainEntity: items.map(function (qa) {
            return {
              '@type': 'Question',
              name: plain(qa[0]),
              acceptedAnswer: { '@type': 'Answer', text: plain(qa[1]) }
            };
          })
        });
      }
    }

    // A trail for the simple pages too, so every page but the home page says
    // where it sits.
    var flat = { about: 'About', services: 'Services', reiki: 'Reiki Healing', courses: 'Courses',
      resources: 'Resources', faqs: 'FAQs', contact: 'Contact', palmistry: 'Palmistry Guide',
      mantras: 'Mantras & Stotras', 'book-consultation': 'Book a Consultation', 'book-pooja': 'Book a Pooja Seva' };
    if (flat[pageId]) graph.push(crumbs(origin, [['Home', '/'], [flat[pageId], seo.path]]));
    if (pageId === 'policy') graph.push(crumbs(origin, [['Home', '/'], [seo.rawTitle, seo.path]]));

    return { '@context': 'https://schema.org', '@graph': graph };
  }

  /* ----------------------------------------------------------------------- */
  /* The whole head for one address                                           */
  /* ----------------------------------------------------------------------- */

  function buildSeo(options) {
    var opts = options || {};
    var origin = String(opts.origin || '').replace(/\/+$/, '');
    var content = opts.content || {};
    var pathname = trimPath(opts.pathname);

    var route = matchRoute(pathname);
    var pageId = route ? route.page : null;
    var params = route ? route.params : {};
    var found = pageId ? describe(pageId, params, content) : null;

    // An address we do not know, or a slug that no longer exists, is a missing
    // page: it is described as one and kept out of the index.
    var missing = !found;
    if (missing) {
      found = {
        title: 'Page not found',
        description: 'This page could not be found. Browse the services, courses and articles instead.'
      };
    }

    var rawTitle = plain(found.title);
    var title = pageId === 'home' ? rawTitle : rawTitle + ' | ' + BRAND;
    var path = (!missing && canonicalPathFor(pageId, params)) || pathname;
    var isPrivate = missing || PRIVATE_PAGES.indexOf(pageId) !== -1;

    var seo = {
      pageId: pageId,
      params: params,
      missing: missing,
      rawTitle: rawTitle,
      title: title,
      description: clamp(found.description, 155),
      path: path,
      canonical: absolute(origin, path),
      robots: isPrivate ? 'noindex,nofollow' : 'index,follow',
      ogType: found.ogType || 'website',
      image: absolute(origin, SOCIAL_CARDS[found.image || DEFAULT_IMAGE] || found.image || DEFAULT_IMAGE),
      indexable: !isPrivate
    };

    // Structured data is for pages a search engine may show. A staff page or a
    // missing one gets none.
    seo.jsonLd = seo.indexable ? structuredData(pageId, params, content, origin, seo) : null;
    return seo;
  }

  var ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return ESCAPES[ch]; });
  }

  /** The head block, ready to drop into the page the server sends. */
  function renderHead(seo, extra) {
    var o = extra || {};
    var tags = [
      '<title>' + escapeHtml(seo.title) + '</title>',
      '<meta name="description" content="' + escapeHtml(seo.description) + '">',
      '<meta name="robots" content="' + escapeHtml(seo.robots) + '">',
      '<link rel="canonical" href="' + escapeHtml(seo.canonical) + '">',
      '<meta property="og:type" content="' + escapeHtml(seo.ogType) + '">',
      '<meta property="og:site_name" content="' + escapeHtml(BRAND) + '">',
      '<meta property="og:title" content="' + escapeHtml(seo.title) + '">',
      '<meta property="og:description" content="' + escapeHtml(seo.description) + '">',
      '<meta property="og:url" content="' + escapeHtml(seo.canonical) + '">',
      '<meta property="og:image" content="' + escapeHtml(seo.image) + '">',
      '<meta property="og:locale" content="en_IN">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + escapeHtml(seo.title) + '">',
      '<meta name="twitter:description" content="' + escapeHtml(seo.description) + '">',
      '<meta name="twitter:image" content="' + escapeHtml(seo.image) + '">'
    ];
    if (o.verification) {
      tags.push('<meta name="google-site-verification" content="' + escapeHtml(o.verification) + '">');
    }
    if (seo.jsonLd) {
      // "</script>" inside the data would end the tag early.
      tags.push('<script type="application/ld+json" id="ld-json">'
        + JSON.stringify(seo.jsonLd).replace(/<\//g, '<\\/') + '</script>');
    }
    return tags.join('\n  ');
  }

  /**
   * The body of a detail page, written into the HTML the server sends.
   *
   * The site renders itself in the browser, so without this every address
   * arrives carrying the same shell and a crawler that does not run
   * JavaScript sees no service, article or course text at all. Google runs
   * JavaScript and would manage; plenty of other crawlers do not.
   *
   * The app replaces this wholesale on boot (host.innerHTML = …), so it is
   * never seen twice and the page behaves exactly as before.
   */
  function renderBody(seo, content) {
    var c = content || {};
    var p = seo.params || {};
    var e = escapeHtml;
    var link = function (href, text) { return '<a href="' + e(href) + '">' + e(text) + '</a>'; };
    var trail, head, body = '', facts = [], related = [];

    if (seo.pageId === 'service-detail') {
      var s = find(c.services, 'slug', p.slug);
      if (!s) return '';
      var cat = find(c.serviceCategories, 'id', s.category);
      trail = [['Home', '/'], ['Services', '/services']];
      if (cat) trail.push([cat.title, '/services/category/' + cat.id]);
      head = s.title;
      body = plain(s.description || s.intro || s.short);
      if (s.duration) facts.push('Duration: ' + plain(s.duration));
      if (Number(s.price) > 0) facts.push('Fee: ₹' + e(String(s.price)));
      (s.benefits || []).slice(0, 8).forEach(function (b) { facts.push(plain(b)); });
      (c.services || []).filter(function (x) {
        return x.category === s.category && x.slug !== s.slug && x.published !== false;
      }).slice(0, 6).forEach(function (x) { related.push(['/services/' + x.slug, x.title]); });

    } else if (seo.pageId === 'article') {
      var a = find(c.articles, 'slug', p.slug);
      if (!a) return '';
      trail = [['Home', '/'], ['Resources', '/resources']];
      head = a.title;
      body = plain(a.body || a.excerpt);
      if (a.date) facts.push('Published: ' + plain(a.date));
      if (a.author) facts.push('By ' + plain(a.author));
      (c.articles || []).filter(function (x) {
        return x.slug !== a.slug && x.published !== false;
      }).slice(0, 6).forEach(function (x) { related.push(['/resources/' + x.slug, x.title]); });

    } else if (seo.pageId === 'course-detail') {
      var co = find(c.courses, 'slug', p.slug);
      if (!co) return '';
      trail = [['Home', '/'], ['Courses', '/courses']];
      head = co.title;
      body = plain(co.overview);
      if (co.duration) facts.push('Duration: ' + plain(co.duration));
      if (co.mode) facts.push('Mode: ' + plain(co.mode));
      (co.curriculum || []).slice(0, 10).forEach(function (x) {
        facts.push(plain(typeof x === 'string' ? x : (x && (x.title || x.name)) || ''));
      });
      (c.courses || []).filter(function (x) {
        return x.slug !== co.slug && x.published !== false;
      }).slice(0, 6).forEach(function (x) { related.push(['/courses/' + x.slug, x.title]); });

    } else if (seo.pageId === 'service-category') {
      var sc = find(c.serviceCategories, 'id', p.cat);
      if (!sc) return '';
      trail = [['Home', '/'], ['Services', '/services']];
      head = sc.title;
      body = plain(sc.intro);
      (c.services || []).filter(function (x) {
        return x.category === sc.id && x.published !== false;
      }).slice(0, 24).forEach(function (x) { related.push(['/services/' + x.slug, x.title]); });

    } else {
      return '';
    }

    var html = '<nav aria-label="Breadcrumb"><ol>'
      + trail.map(function (t) { return '<li>' + link(t[1], t[0]) + '</li>'; }).join('')
      + '<li>' + e(head) + '</li></ol></nav>'
      + '<h1>' + e(head) + '</h1>';
    if (body) html += '<p>' + e(clamp(body, 1200)) + '</p>';
    if (facts.filter(Boolean).length) {
      html += '<ul>' + facts.filter(Boolean).map(function (f) { return '<li>' + e(f) + '</li>'; }).join('') + '</ul>';
    }
    if (related.length) {
      html += '<h2>Related</h2><ul>'
        + related.map(function (r) { return '<li>' + link(r[0], r[1]) + '</li>'; }).join('') + '</ul>';
    }
    return html;
  }

  return {
    BRAND: BRAND,
    renderBody: renderBody,
    PRIVATE_PAGES: PRIVATE_PAGES,
    ROUTES: ROUTES,
    matchRoute: matchRoute,
    canonicalPathFor: canonicalPathFor,
    buildSeo: buildSeo,
    renderHead: renderHead,
    escapeHtml: escapeHtml,
    clamp: clamp
  };
}));
