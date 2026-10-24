"""Import Dotty Bobbin's upcoming SimplyBook bookings (24 Oct 2026) into Wix.

    WIX_TOKEN=... python3 import_to_wix.py contacts | test-class | classes | events | verify

Every step writes what it created to import-log.json and skips anything already in the log, so a
re-run never duplicates a contact, booking or ticket order.

  contacts    one Wix contact per client (upsert by email), labelled "SimplyBook client"; a second
              SimplyBook email for the same person is kept as an additional email.
  classes     each class booking on its matching Wix session: created with NO customer email and
              NO SMS (notifyParticipants false, sendSmsReminder false), then marked PAID, which
              confirms it. Already paid by Stripe on SimplyBook, so nothing is charged.
  events      retreats / Savile Row: the ticket limit goes back to the real capacity, then each
              guest gets a reserved ticket checked out with markAsPaid + silent (no email).
  verify      reads everything back from Wix and compares with SimplyBook.

Wix calls follow the official docs (Bookings Writer V2 Create Booking / Confirm or Decline Booking,
Time Slots V2 List Event Time Slots, Events ticket reservations + checkout, Contacts V5 upsert).
"""
import json, os, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = json.load(open(os.path.join(HERE, "simplybook-upcoming.json")))
LOG_PATH = os.path.join(HERE, "import-log.json")
LOG = json.load(open(LOG_PATH)) if os.path.exists(LOG_PATH) else {"contacts": {}, "classes": {}, "events": {}}
TOKEN = os.environ["WIX_TOKEN"]
API = "https://www.wixapis.com"

ADULT_CLASS_SERVICE = "e6b66939-9887-4362-9dbd-eaef6342ab79"
EVENTS = {  # SimplyBook list -> (Wix event id, ticket definition id, real capacity)
    "savile_row_2026-11-09": ("782dde8f-fb57-4c21-80a8-b6e8e1aac397", "4e49c02d-6047-4b5b-8944-dd51eafd4e34", 10),
    "november_retreat_2026-11-21": ("3d2f919b-0675-483c-bdaa-41a176ed45ec", "c946e638-fa2d-4136-a887-a37206aec51f", 9),
    "christmas_retreat_2026-12-12": ("7a52f55c-f143-4c6f-8971-871216a8d5fe", "58a54980-5a66-416f-88df-bef1aa985549", 10),
}
# Same person, second SimplyBook record (found by phone). The email used for the upcoming
# bookings stays the main one; the other is kept on the contact as an additional email.
OTHER_EMAILS = {"41": ["the_jeffries@hotmail.com"], "283": ["annelirobinson16@gmail.com"], "309": ["monika.alison@gmail.com"]}


def save():
    json.dump(LOG, open(LOG_PATH, "w"), indent=1)


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": TOKEN, "Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req) as r:
                txt = r.read().decode()
                return json.loads(txt) if txt else {}
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(2 + attempt * 3)
                continue
            raise RuntimeError(f"{method} {path} -> {e.code} {e.read().decode()[:700]}")


def split_name(full):
    full = full.strip().rstrip(".").strip()
    parts = full.split()
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


# ── contacts ─────────────────────────────────────────────────────────────────────────────
def label_key():
    res = call("POST", "/contacts/v4/labels", {"displayName": "SimplyBook client"})
    return res["label"]["key"]


def do_contacts():
    key = label_key()
    for sid, (name, email, phone) in SRC["clients"].items():
        if sid in LOG["contacts"]:
            continue
        first, last = split_name(name)
        contact = {"name": {"first": first, **({"last": last} if last else {})}, "email": {"email": email}, "phone": {"phone": phone}}
        if sid in OTHER_EMAILS:
            contact["additionalEmails"] = [{"email": e} for e in OTHER_EMAILS[sid]]
        res = call("POST", "/contacts/v5/contacts/upsert", {"contact": contact, "upsertMode": "APPEND"})
        c = res.get("contact") or {}
        cid = c.get("id") or c.get("_id")
        if not cid or (c.get("email") or {}).get("email", "").lower() != email.lower():
            raise RuntimeError(f"contact {sid} not stored as expected: {json.dumps(res)[:500]}")
        LOG["contacts"][sid] = cid
        save()
        print(f"contact {sid:>4} {name:<20} -> {cid}")
    ids = list(LOG["contacts"].values())
    call("POST", "/contacts/v4/bulk/contacts/add-remove-labels", {"filter": {"id": {"$in": ids}}, "labelKeysToAdd": [key]})
    print(f"labelled {len(ids)} contacts '{key}'")


def do_all_clients():
    """Every client in the SimplyBook export (simplybook-clients.csv) as a Wix contact. Records that
    share a phone number are one person: one contact, the other emails kept as additional emails.
    SimplyBook's own test records ("temp ...") are skipped. Marketing opt-ins are NOT carried over."""
    import csv
    from collections import defaultdict
    MAIN_EMAIL = {  # for shared-phone pairs: the email that stays the main one
        "+447710194277": "frostflexsculputed@gmail.com", "+447818438990": "monikapinterova@yahoo.co.uk",
        "+447890888823": "the_jefferies@hotmail.com", "+447753242017": "alisonsavage@live.co.uk",
        "+447426746746": "beleuzabrambilla@gmail.com",
    }
    rows = csv.DictReader(open(os.path.join(HERE, "simplybook-clients.csv"), encoding="utf-8-sig"))
    people = defaultdict(list)
    for r in rows:
        name, email, phone = r["Name"].strip(), r["E-mail"].strip(), r["Phone"].strip().lstrip("'")
        if name.lower().startswith("temp "):
            continue
        people[phone or email].append((name, email, phone))
    key = label_key()
    done = LOG.setdefault("all_clients", {})
    for pkey, recs in people.items():
        main_email = MAIN_EMAIL.get(pkey, recs[0][1])
        main = next(r for r in recs if r[1].lower() == main_email.lower())
        if main[1].lower() in done:
            continue
        name, email, phone = main
        first, last = split_name(name)
        contact = {"name": {"first": first, **({"last": last} if last else {})}, "email": {"email": email}, **({"phone": {"phone": phone}} if phone else {})}
        others = [r[1] for r in recs if r[1].lower() != email.lower()]
        if others:
            contact["additionalEmails"] = [{"email": e} for e in others]
        try:
            res = call("POST", "/contacts/v5/contacts/upsert", {"contact": contact, "upsertMode": "APPEND"})
        except RuntimeError as e:
            if "CANNOT_UPDATE_MEMBER" not in str(e):
                raise
            # Already a site member: their own record wins; nothing to import.
            done[email.lower()] = "member"
            save()
            print(f"{name:<24} {email:<36} -> already a site member, left as is")
            continue
        c = res.get("contact") or {}
        cid = c.get("id") or c.get("_id")
        stored = (c.get("email") or {}).get("email", "")
        if not cid:
            raise RuntimeError(f"contact not stored: {json.dumps(res)[:400]}")
        done[email.lower()] = cid
        save()
        print(f"{name:<24} {email:<36} -> {cid[:8]}{'' if stored.lower() == email.lower() else '  (kept existing main email ' + stored + ')'}{'  +' + ','.join(others) if others else ''}")
    ids = sorted(set(v for v in done.values() if v != "member"))
    for i in range(0, len(ids), 100):
        call("POST", "/contacts/v4/bulk/contacts/add-remove-labels", {"filter": {"id": {"$in": ids[i:i + 100]}}, "labelKeysToAdd": [key]})
    print(f"{len(ids)} contacts labelled '{key}'")


# ── classes ──────────────────────────────────────────────────────────────────────────────
def class_sessions():
    res = call("POST", "/_api/service-availability/v2/time-slots/event", {
        "serviceIds": [ADULT_CLASS_SERVICE], "fromLocalDate": "2026-10-24T00:00:00", "toLocalDate": "2027-01-01T00:00:00",
        "timeZone": "Europe/London", "includeNonBookable": True, "cursorPaging": {"limit": 1000}})
    return {s["localStartDate"][:16]: s for s in res["timeSlots"]}


def book_class(sb_id, client, start, sessions):
    key = str(sb_id)
    if key in LOG["classes"]:
        return LOG["classes"][key], "skipped"
    slot = sessions.get(start)
    if not slot:
        raise RuntimeError(f"no Wix session at {start} for SimplyBook booking {sb_id}")
    name, email, phone = SRC["clients"][str(client)]
    first, last = split_name(name)
    body = {
        "booking": {
            "bookedEntity": {"slot": {"serviceId": ADULT_CLASS_SERVICE, "eventId": slot["eventInfo"]["eventId"]}},
            "contactDetails": {"contactId": LOG["contacts"][str(client)], "firstName": first, **({"lastName": last} if last else {}), "email": email, "phone": phone},
            "totalParticipants": 1,
        },
        "participantNotification": {"notifyParticipants": False},
        "sendSmsReminder": False,
        "flowControlSettings": {"skipBusinessConfirmation": True},
    }
    created = call("POST", "/_api/bookings-service/v2/bookings", body)["booking"]
    bid = created["id"]
    LOG["classes"][key] = bid
    save()
    confirmed = call("POST", f"/bookings/v2/confirmation/{bid}:confirmOrDecline", {"paymentStatus": "PAID"}).get("booking", {})
    return bid, f"{confirmed.get('status')} / {confirmed.get('paymentStatus')}"


def do_classes(only_first=False):
    sessions = class_sessions()
    for sb_id, client, start in SRC["classes"][: 1 if only_first else None]:
        bid, state = book_class(sb_id, client, start, sessions)
        print(f"class {sb_id} {start} {SRC['clients'][str(client)][0]:<20} -> {bid} {state}")


# ── events ───────────────────────────────────────────────────────────────────────────────
def do_events():
    for list_name, (event_id, ticket_id, capacity) in EVENTS.items():
        guests = {}
        for sb_id, client in SRC[list_name]:
            guests.setdefault(str(client), []).append(sb_id)
        done = LOG["events"].setdefault(list_name, {})
        done = {c: n for c, n in done.items() if not str(n).startswith("RELEASED:")}
        LOG["events"][list_name] = {**LOG["events"][list_name]}
        todo = {c: ids for c, ids in guests.items() if c not in done}
        if not todo:
            continue
        # Restore the real capacity so the imported guests take real places.
        td = call("POST", "/events/v3/ticket-definitions/query", {"query": {"filter": {"id": {"$eq": ticket_id}}}})["ticketDefinitions"][0]
        if td["initialLimit"] != capacity:
            td = call("PATCH", f"/events/v3/ticket-definitions/{ticket_id}", {"ticketDefinition": {"id": ticket_id, "revision": td["revision"], "initialLimit": capacity}})["ticketDefinition"]
            print(f"{list_name}: ticket limit -> {td['initialLimit']}")
            time.sleep(2)
        for client, sb_ids in todo.items():
            name, email, phone = SRC["clients"][client]
            first, last = split_name(name)
            qty = len(sb_ids)
            res = call("POST", "/events/v1/ticket-reservations", {"ticketReservation": {"tickets": [{"ticketDefinitionId": ticket_id, "quantity": qty}]}})
            rid = res["ticketReservation"]["id"]
            form = {"inputValues": [{"inputName": "firstName", "value": first}, {"inputName": "lastName", "value": last or first}, {"inputName": "email", "value": email}]}
            try:
                order = call("POST", "/events/v1/checkout", {
                    "eventId": event_id, "reservationId": rid,
                    "buyer": {"firstName": first, "lastName": last or first, "email": email},
                    "guests": [{"form": form} for _ in range(qty)],
                    # Pay-in-person keeps the place as OFFLINE_PENDING; Confirm Order then records it
                    # PAID. (markAsPaid at checkout left orders INITIATED, which would email tickets
                    # on confirmation and expire after 20 minutes.)
                    "options": {"silent": True, "payInPerson": True, "ignoreFormValidation": True},
                })["order"]
                confirmed = call("POST", f"/events/v1/events/{event_id}/orders/confirm", {"orderNumber": [order["orderNumber"]]})
                order["status"] = (confirmed.get("orders") or [{}])[0].get("status", order.get("status"))
            except Exception:
                call("DELETE", f"/events/v1/ticket-reservations/{rid}")
                raise
            LOG["events"][list_name][client] = order["orderNumber"]
            save()
            if order.get("status") != "PAID":
                raise RuntimeError(f"order {order['orderNumber']} ended {order.get('status')}, stopping")
            print(f"{list_name}: {name:<20} x{qty} -> order {order['orderNumber']} {order.get('status')}")


def do_release():
    """Release the reservations behind the first attempt's INITIATED orders (Wix: delete the
    reservation when a checkout didn't complete as intended) and mark them for redoing."""
    for list_name, (event_id, ticket_id, capacity) in EVENTS.items():
        orders = call("GET", f"/events/v1/orders?eventId={event_id}&fieldset=DETAILS&limit=100").get("orders", [])
        by_number = {o["orderNumber"]: o for o in orders}
        for client, number in list(LOG["events"].get(list_name, {}).items()):
            o = by_number.get(number)
            if not o or o.get("status") != "INITIATED":
                continue
            try:
                call("DELETE", f"/events/v1/ticket-reservations/{o['reservationId']}")
            except RuntimeError as e:
                if "404" not in str(e) and "not found" not in str(e).lower():
                    print("  release failed", number, e)
            LOG["events"][list_name][client] = f"RELEASED:{number}"
            save()
            print(f"{list_name}: released {number} ({SRC['clients'][client][0]})")


# ── verify ───────────────────────────────────────────────────────────────────────────────
def do_verify():
    ids = list(LOG["classes"].values())
    found = {}
    for i in range(0, len(ids), 50):
        res = call("POST", "/_api/bookings-reader/v2/extended-bookings/query", {"query": {"filter": {"id": {"$in": ids[i:i + 50]}}, "cursorPaging": {"limit": 100}}})
        for eb in res.get("extendedBookings", []):
            b = eb["booking"]
            found[b["id"]] = (b.get("status"), b.get("paymentStatus"), b.get("startDate"), b.get("contactDetails", {}).get("email"))
    bad = [k for k, v in found.items() if v[:2] != ("CONFIRMED", "PAID")]
    print(f"classes: {len(found)}/{len(SRC['classes'])} in Wix; not confirmed+paid: {bad or 'none'}")
    sessions = class_sessions()
    from collections import Counter
    need = Counter(t for _, _, t in SRC["classes"])
    for t, n in sorted(need.items()):
        s = sessions[t]
        print(f"  {t}  booked {s['totalCapacity'] - s['remainingCapacity']}/{s['totalCapacity']} (SimplyBook {n})")
    for list_name, (event_id, ticket_id, capacity) in EVENTS.items():
        res = call("GET", f"/events/v1/orders?eventId={event_id}&fieldset=DETAILS&limit=100")
        orders = [o for o in res.get("orders", []) if o.get("status") in ("PAID", "FREE", "OFFLINE_PENDING")]
        tickets = sum(int(o.get("ticketsQuantity", 0)) for o in orders)
        td = call("POST", "/events/v3/ticket-definitions/query", {"query": {"filter": {"id": {"$eq": ticket_id}}}, "fields": ["SALES_DETAILS"]})["ticketDefinitions"][0]
        print(f"{list_name}: {len(orders)} orders, {tickets} places (SimplyBook {len(SRC[list_name])}); limit {td['initialLimit']}, unsold {td.get('salesDetails', {}).get('unsoldCount')}")


if __name__ == "__main__":
    step = sys.argv[1]
    {"contacts": do_contacts, "all-clients": do_all_clients, "test-class": lambda: do_classes(only_first=True), "classes": do_classes, "events": do_events, "release": do_release, "verify": do_verify}[step]()
