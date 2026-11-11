# QA script · Front-desk loop (staging)

The first module wired end to end to the backend: rooms, bookings, folios and payments. Everything in
this script writes to the real staging database and shows up for every role.

- Web: https://web-staging.hospio360.com · API: https://api-staging.hospio360.com
- Hotel: Royal Suites Ltd → Simpas Ikeja (120 rooms, A101–A130, A201–A230, A301–A330, B101–B130)
- Accounts (password `Hospio123!`): manager `tunde@royalsuites.ng`, front office `victor@royalsuites.ng` and
  `toyin@royalsuites.ng`, owner `godwin@royalsuites.ng`
- Screens still on sample data: staff, financials, inventory, tasks, messaging, reports, hotel setup (except
  rooms), organizations (the manager's company-account screens), the tablet roles, owner and platform admin.
  They open and behave, but saves do not persist. New booking's "Company account" list is live (folio-service
  organizations); staging has "QA Org Ltd" for testing.
- Test data: start guest names with "QA " so it is recognisable. A new guest is matched by phone number: a
  phone that already belongs to a guest books that guest (their name, not the one typed), so use a fresh
  phone per test guest.

## 1 · Sign in and roles

1. Open the web app; you land on sign-in. A wrong password says "Email or password is wrong".
2. Sign in as the manager → the manager dashboard opens (one role, so no role picker).
3. Avatar menu → Sign out. Sign in as front office → the "Today at the desk" screen opens.

## 2 · Rooms (as manager)

1. Rooms → the board shows 4 floors and 120 rooms; room cards open a details panel.
2. "Room types & prices" → 4 types with their prices. Change base price on Regular to ₦36,000 → the card
   updates; refresh → it stays. Change it back.
3. Add special price on Deluxe (name, price, two dates) → appears under the type after save.
4. Add room: number `A131`, Block A · Floor 1, Regular → it appears on the board as Ready.
5. Open `A131` → "Mark out of order" with a reason and a date → it shows grey/out of order; open it again →
   "Back in service" → Ready. (Edit room → change the note → saved.)

## 3 · Booking to check-out (as front office or manager)

One action opens one panel. The payment method is chosen only when money is taken, as steps inside the
same panel (method, card / transfer / cash, receipt, done); a second panel never opens on top. Every flow
ends on the booking summary.

### 3a · Booking for a later date, with a deposit

1. Bookings → New booking: new guest (name + phone), check-in in three days, check-out the day after,
   Deluxe, Normal price, **50% deposit**. The check-in date is not today, so there is no "Checking in now"
   switch. The buttons read "Save, take payment later" and "Save & take ₦X" (half the total).
   Save stays disabled with a missing name or phone, a check-in date in the past, or a check-out on or before
   the check-in (the footer says why). Front office: Special rate and Complimentary are greyed out ("Manager
   only"); the manager books those prices (a special price needs the nightly rate; complimentary books as
   pay at check-out with nothing due).
2. "Save & take ₦X": the same panel moves on to "How is the guest paying?" → Cash → cash received →
   receipt → done. The panel then ends on the booking summary: Paid = the deposit, Balance = the rest,
   listed under Upcoming.
3. Repeat with "Pay at check-out" → the only button is "Save booking" and it goes straight to the summary.
   With "Save, take payment later" on a deposit booking → the summary opens with nothing paid.
4. Card on the POS: the step shows "sent to the POS" and you can continue to the receipt and finish; the
   summary shows a note that the amount is with the POS (staging terminals stay Processing), also after a
   reload. Cash and transfer are approved at once: a transfer is recorded when the desk confirms it landed
   ("I've confirmed the transfer"); finance matches it to the bank line later. A role with no POS assigned
   (e.g. the manager on staging) gets "The card wasn't sent" with the reason and "Try another way".
5. Closing the panel on any payment step (X or Escape) keeps the booking: the panel lands on the summary with
   nothing paid. Reloading mid-payment records nothing.

### 3b · Walk-in (check in now)

1. New booking with check-in today: the "Arrival" section appears with the "Checking in now" switch.
   Switch it on → a ready-room picker (rooms of the chosen type) and "ID seen and captured" appear; the
   total line says "Due at check-in".
2. Deluxe, Normal price, Pay in full → the button reads "Save, take ₦45,000 & check in" and stays disabled
   until a room is picked and the ID tick is on. (With Pay at check-out or a company account it reads
   "Save & check in".) A deposit plan still takes the whole balance, because the deposit and the rest are
   both due before the key.
3. Click it: one panel goes booking saved → payment steps for ₦45,000 (Cash) → "Checking the guest in…"
   → "Checked in to <room>". "Open booking" lands on the summary showing In house and the room, Paid in
   full. The Rooms board shows the room as occupied; Folios has the guest's folio with the cash payment.
4. If the payment is a card still with the POS, the guest is not checked in; the done step says so and the
   booking summary has Check in for when the POS confirms.

### 3c · Check in an existing booking

1. Open a booked arrival (summary) → Check in. The check-in panel shows the room picker, the amount due
   before the key and "ID seen and captured" (off until you tick it; Check in stays disabled without it).
   The picker offers ready rooms of the type; rooms with a guest in them show as occupied on the Rooms board
   and are never offered (the booked room, when still occupied, shows "Due out today" or "Past departure"
   and is refused, see 3f), and a room held for another arrival can't be picked. A room that isn't clean shows
   a warning: the front office picks another room; the manager can switch on "Check in to this room anyway".
2. "Take ₦X" (front office) runs the payment steps inside that same panel; finishing ("Back to check-in")
   returns to the check-in view with the amount marked paid ("Fully paid") and Check in enabled. Pick the
   ready room, tick the ID, Check in → the summary shows In house.
3. A fully paid or pay-at-check-out booking has nothing to take; Check in is enabled once room and ID are set.
4. Manager only: "Check in without payment" on the manager's own Bookings screen (logged; the balance stays
   on the folio). Front office sees it disabled.

### 3d · Record payment

1. From the booking summary → Record payment: the payment steps open directly on the method step for the
   deposit, or the balance when the deposit is already paid (once checked in: the folio balance, extras
   included). The amount can be changed for a part payment or an overpayment.
2. Transfer or cash → receipt → done; Done returns to the summary with Paid and Balance updated. Paying more
   than the stay shows the extra as "Credit". Zero is refused (the button stays disabled).
3. Cancelled bookings have no Record payment (summary and row menu); a cancelled booking shows nothing owing
   (what was paid shows as credit to refund).

### 3e · Folio and check-out

1. Folios → the guest's folio is open with the room charge and the payment, balance ₦0.
2. In the folio: Post charge "Minibar", ₦4,000 → balance ₦4,000. (Manager only: Discount / void → Discount
   ₦1,000 with a reason → balance ₦3,000; Void the minibar line with a reason → balance back.) Front office:
   Discount / void →
   "Send for approval" → "Sent to the manager to approve"; it shows in the manager's Approvals and the
   discount lands on the folio when approved (over the manager's limit it goes to the owner). Void stays
   manager-only (the button is disabled for front office with a note).
   - Print or email → the window is "Print or email the folio"; "Email" is picked when the guest has an email
     and WhatsApp is greyed "Coming soon" (can't be picked) → Email folio → "Folio emailed to …"; the message
     card says "Email sent to …" (sent for real: use a `@hospio-qa.test` guest). Without a guest email only
     "Print / copy" can be used → Print receipt.
3. Bookings → In-house → Check out: one panel with the bill as the folio has it now (room charges, extras,
   paid, balance). With a balance the button reads "Take ₦X": the payment steps run inside the same panel,
   "Back to check-out" returns with "nothing left to pay", then Check out. Status becomes Checked out and the
   panel lands on the summary; the folio closes at ₦0; the Rooms board shows the room as "Needs cleaning"
   until housekeeping marks it clean. A company-account stay shows "Billed to <company>" and checks out
   with nothing to take. Manager only: "Check out with balance" (logged, folio stays open) and a late
   check-out charge, posted to the folio as its own line before the balance is taken.
4. Payments → the cash payments appear with Approved status and the amounts above.

### 3f · One guest per room: turnover, overstays and refusals

A room is the guest's from check-in until they are checked out, not until their check-out date passes.
Use two `QA ` guests with `@hospio-qa.test` emails. Rule and API details: hospio-backend `docs/occupancy.md`.

1. Guest in, due out today: check guest A in with a stay ending today (or use one made yesterday). Rooms
   board: A's room is "Occupied" with "Due out" on the tile. `GET /reservation/bookings/availability` for
   today leaves the room out of `freeRoomIds` and lists it under `turnoverRoomIds`.
2. Same-day turnover: make guest B's booking for today and give it A's room (API: `roomId` on
   `POST /reservation/bookings`). It saves; Today → "Arriving today" shows B with "Turnover · A not out yet".
3. Check B in to that room (front office or manager): the room shows "Due out today · A still checked in" in
   the picker, the panel says "Room <n> still has a guest checked in (A). Check them out first, or choose
   another room." and Check in stays disabled (the manager gets no "anyway" switch for it). Through the API
   the same check-in answers 409 with that message.
4. Check A out → the room goes to housekeeping as Needs cleaning. Checking B in now follows the dirty-room
   rule: with Hotel setup → Housekeeping → "Inspect departures" on (the default) the front office is
   refused ("Room <n> hasn't been cleaned yet. A manager can check the guest in anyway") and only the manager
   can check in with "Check in to this room anyway"; with it off the check-in goes through with the warning
   "Room not cleaned yet". Once housekeeping marks the room clean, B checks in normally.
5. Walk-in into an occupied room (API: `POST /reservation/bookings` with `roomId` of an occupied room and
   `walkIn: true`): 409 "Room <n> still has a guest checked in (…)…", and no booking is saved. On the web the
   walk-in room picker only offers ready rooms.
6. Moving an in-house guest (`PUT /reservation/bookings/{id}` with `roomId`) into a room somebody else is
   checked in to: 409 with the same message. Owner portal → Bookings → check in at a hotel follows the same
   rules.
7. Overstay: a guest still checked in after their check-out date keeps the room. Today → "Leaving today"
   lists them with "Past departure"; the Bookings row says "In house · past departure"; the room is not in
   `freeRoomIds` and can't be given to today's arrival ("…still has a guest checked in…"). Nothing frees the
   room until they are checked out.
8. Two desks at once: two check-ins into the same free room at the same moment → exactly one succeeds, the
   other gets 409 (a per-room lock, backed by a unique index in the database).
9. Out of order still wins: a room out of order is never in `freeRoomIds` and check-in into it answers
   "Room <n> is out of order · choose another room".

## 4 · Other booking actions

- Change dates on an upcoming booking → nights and total recalculate and persist; the summary shows the new
  total and balance. Zero nights or a check-in in the past keeps "Save new dates" disabled; for a guest in
  house only the check-out date can change.
- Cancel an upcoming booking (manager) with a reason → status Cancelled; the room type is free again. The
  front office has no cancel button.
- A link that names an action that no longer applies (e.g. `?action=check-in` on a guest already in house,
  or on a cancelled booking) opens the booking summary instead.
- No-shows: the manager's "Guest arrived" / "Mark as arrived" are gone (they never reached the server); a
  no-show is rebooked as a new booking.
- Refunds: one payment's refunds together can't exceed it ("Only ₦X of this payment is left to refund").
- Record payment on an in-house booking by Transfer → Approved; by Card → "sent to the POS" and stays
  Processing until the POS confirms (staging has logging-only terminals).
- As front office, "Check in without payment" is shown but disabled (manager only); the manager has it on
  their own Bookings screen (the balance stays on the folio).
- After closing any panel the page stays clickable.

## Money agrees everywhere

After any payment the booking summary (Paid/Balance), the folio (after check-in), Payments, the front office
till (cash only, when a till is open: Till screen) and Today's money (`/finance/today`, manager) agree. Cash
taken with no open till still counts in Today's money and is flagged as unattached cash.
- Payments → request a refund on a payment → it appears for the manager under Payments → Refunds.
- Manager Payments → an approved payment → Email receipt again (panel or row menu) → "Receipt emailed to …"
  and the card shows "Email sent to …". A payment whose guest has only a phone is refused: "This guest has no
  email · print the receipt or email it from the receipt page (WhatsApp receipts are coming soon)".
- Take payment → receipt step: "Receipt" offers Email (picked when the guest has an email, address filled in),
  Print, and "WhatsApp · coming soon" / "SMS · coming soon" greyed out. Email → "Email receipt & record" → the
  toast says "Receipt emailed to …". A bad address keeps the button disabled. Print → "Record payment" → the
  done screen has Print receipt.
- My payments (front office) → a card payment still Processing → "Check with the POS" → the toast says what the
  POS answered; it turns Approved only if the POS approved it (no "I've confirmed it landed" any more).
- Today → "Front desk to-dos" lists only real work from today's bookings and folios (an arrival with no room,
  arrivals to check in, departures to check out, guests in house with a balance); each line opens the screen.
  With none it says "Nothing waiting". There are no tick boxes.
- Manager Payments → a Declined (or No response) card payment → Retry on POS → a new payment for the same
  amount goes to the POS of the desk that took it ("sent to the POS again"); the declined one stays in the
  list. To make a declined payment on staging: take a card payment, then
  `POST /payment/webhooks/pos/logging` with `{"paymentRequestId":"<id>","status":"DECLINED"}`.

