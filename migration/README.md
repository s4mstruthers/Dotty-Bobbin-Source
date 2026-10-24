# SimplyBook → Wix import (24 Oct 2026)

`import_to_wix.py` moved every upcoming SimplyBook booking into Wix:

- 18 clients → Wix contacts, labelled **SimplyBook client** (a second email for the same person is kept as an additional email)
- 33 class bookings → the matching Wix class sessions, confirmed and marked **paid**, with no customer email or SMS
- 24 retreat / Savile Row places → paid event orders (pay-in-person, then confirmed), sent silently

It reads `simplybook-upcoming.json` and writes `import-log.json`, which hold client names, emails and
phone numbers, so **they are not kept in this repository** (see `.gitignore`). Every step skips what
the log already has, so a re-run never duplicates anything.

Lesson for next time: `markAsPaid` at Events checkout left orders `INITIATED` (they expire after 20
minutes, and confirming them emails tickets). Pay-in-person + Confirm Order gives a silent `PAID` order.
