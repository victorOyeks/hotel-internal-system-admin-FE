# QA script · Front-desk loop (staging)

The first module wired end to end to the backend: rooms, bookings, folios and payments. Everything in
this script writes to the real staging database and shows up for every role.

- Web: https://web-staging.hospio360.com · API: https://api-staging.hospio360.com
- Hotel: Royal Suites Ltd → Simpas Ikeja (120 rooms, A101–A130, A201–A230, A301–A330, B101–B130)
- Accounts (password `Hospio123!`): manager `tunde@royalsuites.ng`, front office `victor@royalsuites.ng` and
  `toyin@royalsuites.ng`, owner `godwin@royalsuites.ng`
- Screens still on sample data: staff, financials, inventory, tasks, messaging, reports, hotel setup (except
  rooms), the tablet roles, owner and platform admin. They open and behave, but saves do not persist.

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

1. Bookings → New booking: new guest (name + phone), check-in today, check-out tomorrow, Deluxe, Normal
   price, Pay in full → "Save & collect ₦45,000". The booking appears under Arrivals with a reference like
   `HBxxxxxx`, status "Arriving", payment "Unpaid".
2. Row → Check in: pick a ready Deluxe room, "Paid by: Cash", leave "ID seen" on → "Collect ₦45,000 & check
   in". The row moves to In-house, payment shows Paid, Rooms board shows that room as occupied.
3. Folios → the guest's folio is open with the room charge and the cash payment, balance ₦0.
4. In the folio: Post a charge "Minibar", ₦4,000 → balance ₦4,000. (Manager only: Discount ₦1,000 with a
   reason → balance ₦3,000; Void the minibar line with a reason → balance back.)
5. Bookings → In-house → Check out: the balance from the folio is shown; "Collect balance now", Cash →
   "Collect … & check out". Status becomes Checked out; the folio closes; Rooms board shows the room as
   "Needs cleaning".
6. Payments → the cash payments appear with Approved status and the amounts above.

## 4 · Other booking actions

- Change dates on an upcoming booking → nights and total recalculate and persist.
- Cancel an upcoming booking (manager) with a reason → status Cancelled; the room type is free again.
- Record payment on an in-house booking by Transfer → Approved; by Card → "sent to the POS" and stays
  Processing (no real terminal on staging).
- Payments → request a refund on a payment → it appears for the manager under Payments → Refunds.

## What to report

For anything that does not match: the account used, the screen, what you clicked, what you expected, what
happened, and the time (the server logs are by time). Screenshots help; the booking reference or room number
pins it down.
