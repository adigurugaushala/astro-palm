# Guruji Palmistry — Technical SEO Audit

Nov 24, 2026 · @g srikar

## Summary

The site's SEO was built to run in the browser, and most of it worked — for Google. Every other reader saw one page.

Three faults mattered. The canonical tag was hardcoded to `https://palm1-s3w9.vercel.app/`, a Vercel domain the site no longer uses, so every page told search engines it was a copy of somewhere else. Nothing in the head existed until JavaScript ran, so the scrapers behind WhatsApp, Facebook, LinkedIn and X — none of which run JavaScript — showed the same home-page card for every link anyone shared. And there were no Twitter Card tags at all.

The head is now written on the server, before a byte is sent. One module, `seo.js`, describes each address once; the server reads it to build the head, and the browser reads the same module to keep those tags right as pages change.

| Measure | Result |
| --- | --- |
| Public addresses checked | 108 |
| With a title of their own | 108 of 108 |
| With a description of their own | 108 of 108 |
| Duplicate titles or descriptions | 0 |
| Faults in the final pass | 0 |
| Tests passing | 193, including 12 new SEO tests |

Nothing in the design, the booking flow or the payment path changed. Every public address was fetched and checked on its own, with JavaScript off and again with it on.

## Why not Unhead

The brief asked for `@unhead/react`. It cannot be used here, and it would not have fixed the problem.

**There is no React.** The site is a vanilla JavaScript application — `index.html`, `app.js`, `site.js` — with no bundler, no Vite, no build step for the app. `@unhead/react` is a React composable library; there is nothing for it to attach to. Installing it would have added a dependency that never runs.

**It would not have helped either.** Unhead manages the head in the browser. The site already did that, and did it reasonably well: per-page titles, descriptions, canonical tags, `noindex` on private pages and a structured-data graph. The gap was never the quality of that layer — it was that none of it exists until JavaScript runs. Unhead is also client-side, so a WhatsApp or Facebook scraper would still have seen the fallback head.

**What was done instead.** The server already reads `index.html` on every page request, so it now writes the head for that address into the page before sending it. Crawlers and social scrapers get correct tags in the raw HTML with no JavaScript at all; the browser keeps them right afterwards during in-app navigation.

This is stronger than Unhead for search, and it needed no bundler, no server-side rendering framework and no change to how the site is built or deployed.

**Does the site need prerendering or SSR?** No. Google renders JavaScript and already saw the pages. What it needed was the head, and the body of detail pages, present without JavaScript — both of which are now served directly. A full SSR rewrite would be a large change to a working payment site for very little further gain.

## Completed

The fourteen items in the brief, with what was done and how it was checked.

**1. Unique titles and descriptions for every public route.** Written on the server from `seo.js`. All 108 addresses in the sitemap were fetched and compared: 108 distinct titles, 108 distinct descriptions, no collisions. Descriptions are trimmed at a word boundary to about 155 characters so Google shows them whole.

**2. Dynamic canonical URLs.** Each address is canonical to itself. The stale Vercel canonical is gone. Set `SITE_URL=https://gurujipalmistry.org` in production and every canonical, `og:url` and sitemap entry is pinned to that domain — without it they follow whatever host the request arrived on, which splits ranking between the www, bare and platform addresses.

**3. Open Graph and Twitter Cards.** Both on every page, with `og:url`, a per-page image where the content has one, `og:locale` and `summary_large_image`. There were no Twitter tags before.

**4 and 5. Structured data.** Organization on every page; WebSite with a search action on the home page; Person on About; Service with its price offer; Course; Article with its publication date; FAQPage; BreadcrumbList. Each page's JSON-LD was parsed in the final pass — all valid, all with the right types.

**6. XML sitemap.** Already existed and is well built — it reads from live content, so new services and articles appear by themselves. Verified: 108 addresses, valid XML, no duplicates, all absolute, every key page present, no private address leaking in.

**7. robots.txt.** Rewritten. `/api/`, `/admin`, `/guruji`, `/session/`, `/learn/` and `/payment/` are closed. `/account`, `/track` and `/search` are deliberately left open to crawling and carry `noindex` instead — they are linked from the header, so a crawler has to be able to fetch them to read the instruction not to index them. Blocking them would have left bare URLs in the index with no way to remove them.

**8. Search Console verification.** Put the token from the HTML-tag method into `GOOGLE_SITE_VERIFICATION` and it is written into every page. Nothing appears while it is unset.

**9. Heading hierarchy.** Audited across fourteen page types. Two faults found and fixed: service cards jumped from H1 to H3 on category pages (card titles are now H2 — the styling is class-based, so nothing moved on screen), and the Palmistry guide had its H1 a third of the way down the page, below two H2s. Every page now has exactly one H1, in document order.

**10. Image alt text.** No image was missing an `alt` attribute, but 60 or so content images were marked decorative with `alt=""`, which hides them from image search. Service, course, article and category images now name what they show. Genuinely decorative art — the mandalas, the hero overlay — correctly keeps `alt=""`. Images are lazy-loaded and their containers reserve space with `aspect-ratio`, so they do not shift the layout as they load.

**11. Internal linking and breadcrumbs.** BreadcrumbList on every page but the home page. The server-rendered body of detail pages also carries a real breadcrumb trail and links to related services, courses or articles — so those links exist for a crawler that runs no JavaScript.

**12. 404s, redirects, noindex and duplicates.** A missing address returns a real HTTP 404 with a "Page not found" title and `noindex` — it did return 404 before, but with the home page's title. Staff and personal pages carry `noindex,nofollow` and no structured data. Duplicate addresses are handled: `/book/payment` and `/book/details` are steps of one booking, and all three now name `/book/consultation` as canonical so they do not compete.

**13. Mobile and Core Web Vitals.** Covered in its own section below.

**14. Crawlable content.** This was the real finding. Every address served the same 26,500 characters — the shell — and no service, article or course text at all. Google renders JavaScript and saw the content; nothing else did. The body of service, article, course and category pages is now written into the HTML, inside the container the app replaces wholesale when it starts, so it is never shown twice. A separate fault: with scripting off, the loading screen covered the page forever and hid everything behind it. It is now dismissed when there is no JavaScript.

## Pending

These are not oversights. Each is either yours to do, or a change I would not make to a live payment site without agreeing it with you first.

**Yours to do, on the server (five minutes).** Set `SITE_URL=https://gurujipalmistry.org` and `GOOGLE_SITE_VERIFICATION=<your token>` in hPanel. Until `SITE_URL` is set, canonicals follow the request host, which is the one thing from the old setup still worth fixing.

**Yours to do, in Search Console.** Add the property, verify it, and submit `https://gurujipalmistry.org/sitemap.xml`. Then ask for indexing on the home page and the main service pages so the rewritten head is picked up rather than waiting for a natural recrawl.

**The Palmistry guide's H1 reads "What You'll Explore".** I fixed the ordering, not the wording — rewriting your copy is your call. For a page you would like to rank for palmistry, something like "Palmistry Guide: Hand Shapes, Lines and Mounts" would do considerably more work. One line to change if you want it.

**The registration details still appear in several places.** The Contact page, the footer, and the help and certificate modals. You asked only for the About card, which is gone. Say the word and the rest follow.

**Social profile links are empty.** `settings.social` holds blank strings for Instagram, YouTube and Facebook, so the Organization schema has no `sameAs`. Fill those in and the links appear in the structured data by themselves — this is how Google ties a site to its social accounts.

**Nothing was invented about Guruji.** The Person schema carries only the name, portrait and introduction already on your About page. No qualification, award, rating or review is claimed anywhere, because the content does not state any. If you want review stars in search results you will need real, verifiable reviews with a policy for collecting them — fabricated ones are a manual-action risk, not a shortcut.

**The booking pages are indexable but now ask for sign-in first.** `/book/consultation` carries the title "Book a Consultation" while a signed-out visitor arriving from Google sees a sign-in form. It is a legitimate landing page, so I left it indexed, but you may prefer it to explain itself before asking for an account.

## Core Web Vitals

One large problem, which is a build decision rather than an SEO tag, and a few small ones.

**Tailwind is loaded from the Play CDN in production.** This is the single biggest thing standing between the site and good Core Web Vitals. The Play CDN ships a compiler to the browser, which then generates the stylesheet at runtime — render-blocking on every visit, on every page, and heaviest on the phones most of your visitors use. Tailwind's own documentation says it is not for production.

The fix is to build the stylesheet once and serve it as a file. It is very achievable — a build already exists in this project's test harness — but swapping the production CSS pipeline can change how the whole site looks if the build misses a class, so I did not do it unannounced at the end of a long session. It deserves its own change, with a careful look at the result. It is the first thing I would do next.

**Smaller items.** Article hero images are the one image type whose container does not reserve space, so they can shift the layout as they load — everything else uses `aspect-ratio` and is fine. Four third-party origins are contacted on load (Tailwind, Google Fonts, cdnjs, jsdelivr); two already have `preconnect`. Self-hosting the fonts would remove two of them.

**Already sound.** The viewport meta tag is correct and the layout is responsive. Images are lazy-loaded. Static assets are cached for an hour, HTML is not. The server sets `X-Content-Type-Options` and a sensible opener policy.

## Deploy day, in order

1. **Set the two variables in hPanel** before the deploy: `SITE_URL=https://gurujipalmistry.org` and `GOOGLE_SITE_VERIFICATION=<token>`. The first is the one that matters — without it canonicals follow the request host.
2. **Deploy from `main`.** The work is in commit `4748d81`.
3. **Check the head arrived.** Open the page source of `gurujipalmistry.org/services/detailed-palm-analysis` and look for the title, the canonical on your own domain and a `<script type="application/ld+json">` block. If the title still reads "Guruji Palmistry | Palmistry, Astrology, Reiki", the deploy has not restarted.
4. **Paste a service page link into WhatsApp.** The card should now show that service, not the home page. This is the fastest proof the server-side head is live.
5. **Verify in Search Console** and submit `https://gurujipalmistry.org/sitemap.xml`. Request indexing on the home page and three or four main service pages.
6. **Run two validators** on a service page and an article: Google's Rich Results Test, and `validator.schema.org`. Both read the raw HTML, so they will see what has been added.
7. **A week later**, check Search Console's Pages report for anything newly excluded, and Core Web Vitals for the Tailwind problem described above.

### Where the work lives

`seo.js` is the one place titles, descriptions and schema are decided — change wording there and both the server and the browser follow. `server.js` writes it into the page. `test/seo.test.js` holds twelve tests that fail if a page loses its title, starts sharing another page's description, drops its `noindex`, or if the sitemap starts listing a staff address.
