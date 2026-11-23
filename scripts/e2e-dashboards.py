#!/usr/bin/env python3
"""End-to-end check of the three dashboards at once: devotee, admin, Guruji.

    pip install playwright && playwright install chromium
    BASE=http://localhost:3456 ADMIN_PIN=... GURUJI_PIN=... python3 scripts/e2e-dashboards.py

It books a consultation, pays it (simulated gateway), signs the admin and
Guruji in, opens the case, chats both ways, casts the chart, writes the
reading, downloads the PDF as the devotee, creates a devotee account and files
a course enquiry — in three browser windows, at the same time, as three
different people.

Run it against a test deployment, not a live one: it creates real records.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3456").rstrip("/")
ADMIN_PIN = os.environ.get("ADMIN_PIN", "")
GURUJI_PIN = os.environ.get("GURUJI_PIN", "")
MOBILE = os.environ.get("E2E_MOBILE", "9876500011")
EMAIL = os.environ.get("E2E_EMAIL", "devotee.e2e@example.com")
NAME = "Satish E2E"

steps = []


def ok(name, cond, detail=""):
    steps.append((name, bool(cond), str(detail)[:120]))
    print(("PASS  " if cond else "FAIL  ") + name + (("   " + str(detail)[:90]) if detail else ""))


def main():
    if not ADMIN_PIN or not GURUJI_PIN:
        sys.exit("Set ADMIN_PIN and GURUJI_PIN in the environment first.")

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        devotee, admin, guruji = (browser.new_context(viewport={"width": 1440, "height": 950}) for _ in range(3))
        D, A, G = devotee.new_page(), admin.new_page(), guruji.new_page()
        errors = {"devotee": [], "admin": [], "guruji": []}
        for who, page in (("devotee", D), ("admin", A), ("guruji", G)):
            page.on("pageerror", lambda e, w=who: errors[w].append(str(e)))

        # --- devotee books and pays -----------------------------------------
        D.goto(BASE + "/book/consultation", wait_until="networkidle")
        booking = D.evaluate("""async ([mobile, email, name]) => (await (await fetch('/api/bookings', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ type:'consultation', serviceId:'combined_consultation',
              slot:{ date:'Tue, 25 Nov 2026', time:'10:30 AM', iso:'2026-11-25' },
              devotee:{ name, mobile, email } }) })).json())""", [MOBILE, EMAIL, NAME])
        order = booking.get("booking", {}).get("orderId")
        ok("Devotee creates a consultation booking", order, order)

        paid = D.evaluate("""async ([order, mobile]) => (await (await fetch('/api/bookings/' + order, {
            method:'PATCH', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ event:'payment_success', mobile }) })).json())""", [order, MOBILE])
        ok("Payment marks the booking paid", paid.get("booking", {}).get("status") == "PAID")

        D.goto(BASE + "/track", wait_until="networkidle")
        D.fill("#track-order", order); D.fill("#track-mobile", MOBILE); D.click("#track-submit")
        D.wait_for_timeout(2500)
        ok("Devotee sees it on Track Status", order in D.inner_text("#track-result"))

        # --- admin ----------------------------------------------------------
        A.goto(BASE + "/admin", wait_until="networkidle"); A.wait_for_timeout(800)
        A.fill("#page-admin input[name=pin]", ADMIN_PIN); A.click("#page-admin form button")
        A.wait_for_timeout(2500)
        ok("Admin dashboard lists the booking", order in A.inner_text("#page-admin"))

        # --- Guruji ---------------------------------------------------------
        G.goto(BASE + "/guruji", wait_until="networkidle"); G.wait_for_timeout(800)
        pin = G.query_selector("#page-guruji input[name=pin]")
        if pin:
            pin.fill(GURUJI_PIN); G.click("#page-guruji form button"); G.wait_for_timeout(2500)
        ok("The case is in Guruji's list", NAME in G.inner_text("#page-guruji"))

        case = [a for a in G.query_selector_all("#page-guruji a, #page-guruji button") if NAME in (a.inner_text() or "")]
        if case:
            case[0].click(); G.wait_for_timeout(2000)
        claim = [b for b in G.query_selector_all("#page-guruji button") if "claim" in (b.inner_text() or "").lower()]
        if claim:
            claim[0].click(); G.wait_for_timeout(1800)
        ok("Guruji opens and claims the case", NAME in G.inner_text("#page-guruji"))

        # --- chat both ways --------------------------------------------------
        box = G.query_selector("#page-guruji .chat__form textarea")
        if box:
            box.fill("Namaste. Please send your palm photographs in daylight.")
            send = [b for b in G.query_selector_all("#page-guruji button") if (b.inner_text() or "").strip().lower() == "send"]
            if send:
                send[0].click(); G.wait_for_timeout(2000)
        ok("Guruji sends a chat message", "daylight" in G.inner_text("#page-guruji"))

        D.goto(BASE + "/track", wait_until="networkidle")
        D.fill("#track-order", order); D.fill("#track-mobile", MOBILE); D.click("#track-submit")
        D.wait_for_timeout(3000)
        ok("Devotee sees Guruji's message", "daylight" in D.inner_text("#track-result"))
        reply = D.query_selector("#track-result textarea")
        if reply:
            reply.fill("Namaste Guruji, sending them this evening.")
            sb = [b for b in D.query_selector_all("#track-result button") if "send" in (b.inner_text() or "").lower()]
            if sb:
                sb[0].click(); D.wait_for_timeout(1800)
        ok("Devotee replies", "this evening" in D.inner_text("#track-result"))

        G.reload(wait_until="networkidle"); G.wait_for_timeout(2500)
        ok("Guruji sees the reply", "this evening" in G.inner_text("#page-guruji"))

        # --- chart, reading, PDF ---------------------------------------------
        chart = G.evaluate("""async ([order, pin]) => (await (await fetch('/api/bookings/' + order + '/chart', {
            method:'POST', headers:{'Content-Type':'application/json','x-admin-pin':pin},
            body: JSON.stringify({ date:'1990-04-12', time:'06:20', lat:17.385, lon:78.4867, tzMinutes:330, place:'Hyderabad' }) })).json())""",
                           [order, GURUJI_PIN])
        ok("Guruji casts the chart", bool(chart.get("chart")), (chart.get("chart") or {}).get("ascendant", {}).get("sign"))

        rep = G.evaluate("""async ([order, pin]) => {
            const put = await fetch('/api/guruji/cases/' + order + '/report', { method:'PUT',
              headers:{'Content-Type':'application/json','x-admin-pin':pin},
              body: JSON.stringify({ summary:'A steady hand with a clear head line.', palm:'The head line runs clear.',
                                     correlation:'Mercury is strong.', remedies:'Chant on Wednesdays.' }) });
            const ready = await fetch('/api/guruji/cases/' + order + '/ready', { method:'POST', headers:{'x-admin-pin':pin} });
            return { draft: (await put.json()).ok, ready: (await ready.json()).ok };
        }""", [order, GURUJI_PIN])
        ok("Guruji writes the reading and marks it ready", rep.get("draft") and rep.get("ready"))

        pdf = D.evaluate("""async ([order, mobile]) => {
            const res = await fetch('/api/bookings/' + order + '/report.pdf?mobile=' + mobile);
            const buf = await res.arrayBuffer();
            return { status: res.status, bytes: buf.byteLength, magic: new TextDecoder().decode(new Uint8Array(buf).slice(0,5)) };
        }""", [order, MOBILE])
        ok("Devotee downloads the reading", pdf["status"] == 200 and pdf["magic"] == "%PDF-", pdf)

        # --- devotee account --------------------------------------------------
        D.goto(BASE + "/account", wait_until="networkidle")
        reg = D.evaluate("""async ([mobile, email, name]) => {
            const d = await (await fetch('/api/customer/register', { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ name, mobile, email, password:'SecretPass1', consent:true }) })).json();
            if (d.token) localStorage.setItem('guruji_cust_token', d.token);
            return { ok: d.ok, token: !!d.token };
        }""", [MOBILE, EMAIL, NAME])
        ok("Devotee account is created", reg.get("ok") and reg.get("token"))
        D.reload(wait_until="networkidle"); D.wait_for_timeout(2500)
        account = D.inner_text("#page-account")
        ok("Account page shows the profile and the booking", NAME in account and order in account)

        # --- enquiry ----------------------------------------------------------
        enq = D.evaluate("""async () => (await (await fetch('/api/enquiries', { method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ kind:'course', name:'Interested Student', phone:'9876500022',
              email:'student.e2e@example.com', service:'foundation-course-in-palmistry',
              serviceTitle:'Foundation Course in Palmistry', message:'Next batch dates please.', website:'' }) })).json())""")
        ref = enq.get("enquiry", {}).get("reference")
        ok("Register interest files an enquiry", bool(ref), ref)
        ok("Enquiry email was sent", enq.get("emailed") is True,
           "set RESEND_API_KEY and NOTIFY_EMAIL to turn alerts on" if not enq.get("emailed") else "")

        A.reload(wait_until="networkidle"); A.wait_for_timeout(2500)
        tab = [b for b in A.query_selector_all(".adm-nav button") if "enquir" in (b.inner_text() or "").lower()]
        if tab:
            tab[0].click(); A.wait_for_timeout(2000)
        ok("Admin sees the enquiry", (ref or "zz") in A.inner_text("#page-admin"))

        for who in errors:
            ok(f"No JavaScript errors in the {who} browser", not errors[who], errors[who][:1])

        browser.close()

    passed = sum(1 for _, c, _ in steps if c)
    print("\n" + json.dumps({"passed": passed, "failed": len(steps) - passed}))
    sys.exit(0 if passed == len(steps) else 1)


if __name__ == "__main__":
    main()
