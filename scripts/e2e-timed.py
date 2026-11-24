#!/usr/bin/env python3
"""Seeker <-> Guruji end-to-end check, with the time each step takes.

    BASE=http://localhost:3456 GURUJI_PIN=... python3 scripts/e2e-timed.py

Covers: page speed, services animation, booking, palm photo, chat both ways,
quick replies, the note-on-photo -> "My notes" link, notes autosave, marked
photo to the seeker, the written reading + PDF, an uploaded reading PDF sent
into the chat, and Guruji's easy-use tools. Creates real records, so run it
against a local or test server, never the live site.
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3456").rstrip("/")
PIN = os.environ.get("GURUJI_PIN", "")
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
MOBILE = "98765" + str(int(time.time()))[-5:]
NAME = "Ravi Timing"
rows = []


def step(name, fn):
    t0 = time.perf_counter()
    try:
        ok, detail = fn()
    except Exception as e:  # a failed step is reported, the run goes on
        ok, detail = False, f"{type(e).__name__}: {e}"
    secs = time.perf_counter() - t0
    rows.append((name, bool(ok), secs, str(detail or "")[:90]))
    print(f"{'PASS' if ok else 'FAIL'}  {secs:6.2f}s  {name}  {detail or ''}"[:160])
    return ok


def wait_for(fn, timeout=12.0, every=0.2):
    end = time.perf_counter() + timeout
    while time.perf_counter() < end:
        v = fn()
        if v:
            return v
        time.sleep(every)
    return None


def main():
    if not PIN:
        sys.exit("Set GURUJI_PIN first.")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROME, args=["--use-fake-ui-for-media-stream"])
        S = browser.new_context(viewport={"width": 1366, "height": 900}).new_page()
        # Where the test machine cannot reach the CDN, serve the same library file.
        local_tilt = os.environ.get("TILT_FILE")
        if local_tilt:
            S.route("**/vanilla-tilt.min.js", lambda r: r.fulfill(path=local_tilt, content_type="application/javascript"))
        G = browser.new_context(viewport={"width": 1440, "height": 950}).new_page()
        errors = {"seeker": [], "guruji": []}
        S.on("pageerror", lambda e: errors["seeker"].append(str(e)))
        G.on("pageerror", lambda e: errors["guruji"].append(str(e)))
        ctx = {}

        # ---------------------------------------------------------- speed
        def home():
            S.goto(BASE + "/", wait_until="domcontentloaded")
            S.wait_for_selector("#guruji-loader", state="detached", timeout=8000)
            t = S.evaluate("Math.round(performance.now())")
            return t < 3000, f"page usable after {t} ms (loader gone)"
        step("Seeker: home page opens", home)

        def no_jspdf():
            n = S.evaluate("performance.getEntriesByType('resource').filter(r => r.name.includes('jspdf')).length")
            return n == 0, "jsPDF not downloaded on page view" if n == 0 else "jsPDF still loaded"
        step("Seeker: heavy PDF library not loaded up front", no_jspdf)

        def second_page():
            S.goto(BASE + "/about", wait_until="domcontentloaded")
            gone = S.evaluate("!document.getElementById('guruji-loader')")
            return gone, "no welcome screen on the second page of a visit"
        step("Seeker: later pages skip the welcome screen", second_page)

        def services():
            S.goto(BASE + "/services", wait_until="networkidle")
            card = S.locator(".sp-card--service:visible").first
            card.wait_for(timeout=8000)
            card.hover()
            S.mouse.move(5, 5); card.hover(position={"x": 30, "y": 30})
            ok = wait_for(lambda: S.evaluate("[...document.querySelectorAll('.sp-card--service')].some(c => c.vanillaTilt)"), 8)
            return ok, "cards tilt with glare (vanilla-tilt loaded on hover)"
        step("Seeker: services cards animate", services)

        # ---------------------------------------------------------- booking
        def book():
            b = S.evaluate("""async ([mobile, name]) => {
              const r = await (await fetch('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ type:'consultation', serviceId:'combined_consultation',
                  slot:{ date:'Wed, 26 Nov 2026', time:'10:30 AM', iso:'2026-11-26' },
                  devotee:{ name, mobile, email:'ravi.timing@example.com', dob:'1996-09-08', tob:'06:20', pob:'Hyderabad' } }) })).json();
              const order = r.booking && r.booking.orderId;
              const p = await (await fetch('/api/bookings/' + order, { method:'PATCH', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ event:'payment_success', mobile }) })).json();
              return { order, status: p.booking && p.booking.status };
            }""", [MOBILE, NAME])
            ctx["order"] = b["order"]
            return b["status"] == "PAID", f"{b['order']} {b['status']}"
        step("Seeker: books and pays", book)
        order = ctx.get("order")

        def photo():
            r = S.evaluate("""async ([order, mobile]) => {
              const c = document.createElement('canvas'); c.width = 900; c.height = 1200;
              const x = c.getContext('2d'); x.fillStyle = '#a0705a'; x.fillRect(0, 0, 900, 1200);
              x.strokeStyle = '#4a2a20'; x.lineWidth = 6; x.beginPath(); x.moveTo(150, 700); x.quadraticCurveTo(450, 500, 750, 650); x.stroke();
              const data = c.toDataURL('image/jpeg', .85);
              const res = await fetch('/api/bookings/' + order + '/photos', { method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ mobile, slot: 1, name: 'left-palm.jpg', type: 'image/jpeg', data }) });
              return { status: res.status };
            }""", [order, MOBILE])
            return r["status"] == 201, f"HTTP {r['status']}"
        step("Seeker: uploads a palm photo", photo)

        def seeker_msg():
            S.goto(BASE + "/track", wait_until="networkidle")
            S.fill("#track-order", order); S.fill("#track-mobile", MOBILE); S.click("#track-submit")
            S.wait_for_selector("#track-result [data-chat-input]", timeout=10000)
            S.fill("#track-result [data-chat-input]", "Namaste Guruji, na job gurinchi cheppandi.")
            S.click("#track-result .chat__form button[type=submit]")
            ok = wait_for(lambda: "job gurinchi" in S.inner_text("#track-result"), 6)
            ctx["sent_at"] = time.perf_counter()
            return ok, "message shows in the seeker's chat"
        step("Seeker: sends a message", seeker_msg)

        # ---------------------------------------------------------- Guruji
        def login():
            G.goto(BASE + "/guruji", wait_until="networkidle")
            G.fill("#page-guruji input[name=pin]", PIN)
            G.click("#page-guruji form button")
            return wait_for(lambda: NAME in G.inner_text("#page-guruji"), 10), "case appears in the list"
        step("Guruji: signs in, sees the new case", login)

        def open_case():
            G.goto(BASE + "/guruji/" + order, wait_until="domcontentloaded")
            G.wait_for_selector(".case-page", timeout=10000)
            return True, "case page drawn"
        step("Guruji: opens the case", open_case)

        def tools():
            have = G.evaluate("""() => ({ bar: !!document.querySelector('.gj-bar'), steps: document.querySelectorAll('.gj-step').length,
              next: (document.querySelector('.gj-step.is-next') || {}).innerText || '',
              mics: document.querySelectorAll('.gj-mic').length, chips: document.querySelectorAll('.gj-replies .gj-chip').length })""")
            ok = have["bar"] and have["steps"] == 4 and have["chips"] >= 5
            return ok, f"steps={have['steps']} next='{have['next'].strip()}' speak-buttons={have['mics']} quick-replies={have['chips']}"
        step("Guruji: easy tools present (steps, Speak, quick replies)", tools)

        def sees_msg():
            ok = wait_for(lambda: "job gurinchi" in G.inner_text("[data-case-chat]"), 12)
            lag = time.perf_counter() - ctx.get("sent_at", time.perf_counter())
            return ok, f"seen {lag:.1f}s after the seeker pressed Send"
        step("Guruji: sees the seeker's message", sees_msg)

        def listen():
            n = G.evaluate("document.querySelectorAll('[data-case-chat] .gj-say').length")
            return n >= 1, f"{n} Listen button(s) on seeker messages"
        step("Guruji: Listen (read aloud) on seeker messages", listen)

        def quick_reply():
            G.click(".gj-replies .gj-chip >> nth=3")
            val = G.input_value("[data-case-chat] [data-chat-input]")
            G.click("[data-case-chat] .chat__form button[type=submit]")
            ctx["reply_at"] = time.perf_counter()
            return wait_for(lambda: "Your reading will be ready soon" in G.inner_text("[data-case-chat]"), 6), val[:50]
        step("Guruji: taps a quick reply and sends it", quick_reply)

        def seeker_gets_reply():
            ok = wait_for(lambda: "ready soon" in S.inner_text("#track-result"), 12)
            return ok, f"arrived {time.perf_counter() - ctx['reply_at']:.1f}s after Send"
        step("Seeker: receives Guruji's reply", seeker_gets_reply)

        def note_on_photo():
            G.wait_for_selector("[data-palm-open]", timeout=8000)
            G.click("[data-palm-open]")
            G.wait_for_selector(".palm-viewer img[data-pv=img]", timeout=8000)
            wait_for(lambda: G.evaluate("(document.querySelector('.palm-viewer img') || {}).naturalWidth > 0"), 8)
            G.click("[data-pv=note]")
            box = G.locator("[data-pv=stage]").bounding_box()
            G.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            G.wait_for_selector(".gj-note textarea", timeout=4000)
            G.click(".gj-note [data-word='Heart line']")
            G.type(".gj-note textarea", " is long and clear")
            t0 = time.perf_counter()
            G.click(".gj-note__ok")
            shown = wait_for(lambda: "Heart line is long and clear" in G.input_value("[data-case-notes]"), 5)
            saved = wait_for(lambda: "Heart line is long and clear" in (G.evaluate("""async ([o, p]) => (await (await fetch('/api/guruji/cases/' + o,
                {headers:{'x-admin-pin': p}})).json()).case.gurujiNotes || ''""", [order, PIN]) or ""), 6)
            took = time.perf_counter() - t0
            return bool(shown and saved), f"in My notes and saved {took:.1f}s after Place note: \"{G.input_value('[data-case-notes]')[:60]}\""
        step("Guruji: note on photo appears in My notes (and saves)", note_on_photo)

        def undo_note():
            G.click("[data-pv=undo]")
            gone = wait_for(lambda: "Heart line" not in G.input_value("[data-case-notes]"), 5)
            return gone, "Undo also takes it out of My notes"
        step("Guruji: Undo removes the note from My notes", undo_note)

        def marked_send():
            box = G.locator("[data-pv=stage]").bounding_box()
            G.mouse.click(box["x"] + box["width"] / 2, box["y"] + 80)
            G.wait_for_selector(".gj-note textarea", timeout=4000)
            G.fill(".gj-note textarea", "Strong fate line")
            G.click(".gj-note__ok")
            wait_for(lambda: "Strong fate line" in G.input_value("[data-case-notes]"), 5)
            G.click("[data-pv=save]")
            wait_for(lambda: G.evaluate("!document.querySelector('[data-pv=send]').disabled"), 10)
            G.click("[data-pv=send]")
            sent = wait_for(lambda: G.inner_text("[data-pv=send]").strip() == "Sent", 10)
            ctx["img_at"] = time.perf_counter()
            G.click("[data-pv=close]")
            return sent, "marked copy saved and sent"
        step("Guruji: saves the marked photo and sends it", marked_send)

        def seeker_gets_image():
            ok = wait_for(lambda: "marked what I am reading" in S.inner_text("#track-result"), 12)
            img = wait_for(lambda: S.evaluate("[...document.querySelectorAll('#track-result .chat img')].some(i => i.naturalWidth > 0)"), 8)
            return bool(ok and img), f"image shown {time.perf_counter() - ctx['img_at']:.1f}s after Send"
        step("Seeker: sees the marked palm photo", seeker_gets_image)

        def notes_autosave():
            G.fill("[data-case-notes]", G.input_value("[data-case-notes]") + "\nFollow up about job change.")
            t0 = time.perf_counter()
            ok = wait_for(lambda: "Follow up about job" in (G.evaluate("""async ([o, p]) => (await (await fetch('/api/guruji/cases/' + o,
                {headers:{'x-admin-pin': p}})).json()).case.gurujiNotes || ''""", [order, PIN]) or ""), 8)
            return ok, f"saved by itself {time.perf_counter() - t0:.1f}s after typing stopped"
        step("Guruji: My notes save themselves", notes_autosave)

        def reading():
            G.fill("[data-report-form] textarea[name=palm]", "The heart line is long and clear.\n\nThe fate line is strong.")
            t0 = time.perf_counter()
            ok = wait_for(lambda: "draft saved" in G.inner_text("[data-wordcount]"), 10)
            return ok, f"draft saved by itself in {time.perf_counter() - t0:.1f}s"
        step("Guruji: writes the reading (autosave)", reading)

        def upload_pdf():
            pdf = (b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj "
                   b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n")
            G.set_input_files("[data-drop] input[type=file]", files=[{"name": "reading.pdf", "mimeType": "application/pdf", "buffer": pdf}])
            ok = wait_for(lambda: G.query_selector("[data-send-reading]") is not None, 10)
            G.click("[data-send-reading]")
            sent = wait_for(lambda: G.inner_text("[data-send-reading]").strip() == "Sent", 10)
            ctx["pdf_at"] = time.perf_counter()
            return bool(ok and sent), "uploaded and sent into the chat"
        step("Guruji: uploads the reading PDF and sends it", upload_pdf)

        def seeker_pdf():
            ok = wait_for(lambda: "reading is ready" in S.inner_text("#track-result"), 12)
            href = S.evaluate("(document.querySelector('#track-result .chat-att__dl') || {}).getAttribute && document.querySelector('#track-result .chat-att__dl').getAttribute('href')")
            got = S.evaluate("""async (u) => { const r = await fetch(u); const b = new Uint8Array(await r.arrayBuffer());
              return r.status + ' ' + new TextDecoder().decode(b.slice(0, 5)); }""", href) if href else ""
            return bool(ok and got.endswith("%PDF-")), f"PDF in chat {time.perf_counter() - ctx['pdf_at']:.1f}s after Send; download {got}"
        step("Seeker: gets and downloads the PDF", seeker_pdf)

        def ready():
            G.once("dialog", lambda d: d.accept())
            G.click("text=Mark ready for the seeker")
            ok = wait_for(lambda: G.query_selector(".gj-step.is-done >> nth=3") is not None, 12)
            r = S.evaluate("""async ([o, m]) => { const res = await fetch('/api/bookings/' + o + '/report.pdf?mobile=' + m);
              const b = new Uint8Array(await res.arrayBuffer()); return res.status + ' ' + new TextDecoder().decode(b.slice(0, 5)); }""", [order, MOBILE])
            return bool(ok) and r.endswith("%PDF-"), f"all 4 steps ticked; seeker report.pdf {r}"
        step("Guruji: marks ready; seeker downloads written reading", ready)

        def bigger():
            G.click("[data-gj=big]")
            z = G.evaluate("getComputedStyle(document.querySelector('[data-guruji-root]')).zoom")
            G.click("[data-gj=big]")
            return str(z) in ("1.2", "1.2000000476837158"), f"zoom {z}"
        step("Guruji: Bigger text button", bigger)

        for who in errors:
            step(f"No JavaScript errors ({who})", lambda w=who: (not errors[w], errors[w][:1]))
        browser.close()

    passed = sum(1 for r in rows if r[1])
    print(json.dumps({"passed": passed, "failed": len(rows) - passed,
                      "rows": [{"step": n, "ok": o, "seconds": round(s, 2), "detail": d} for n, o, s, d in rows]}))
    sys.exit(0 if passed == len(rows) else 1)


if __name__ == "__main__":
    main()
