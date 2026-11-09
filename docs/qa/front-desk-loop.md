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

One action opens one panel. The payment method is chosen only when money is taken, as steps inside the
same panel (method, card / transfer / cash, receipt, done); a second panel never opens on top. Every flow
ends on the booking summary.

### 3a · Booking for a later date, with a deposit

1. Bookings → New booking: new guest (name + phone), check-in in three days, check-out the day after,
   Deluxe, Normal price, **50% deposit**. The check-in date is not today, so there is no "Checking in now"
   switch. The buttons read "Save, take payment later" and "Save & take ₦X" (half the total).
2. "Save & take ₦X": the same panel moves on to "How is the guest paying?" → Cash → cash received →
   receipt → done. The panel then ends on the booking summary: Paid = the deposit, Balance = the rest,
   listed under Upcoming.
3. Repeat with "Pay at check-out" → the only button is "Save booking" and it goes straight to the summary.
   With "Save, take payment later" on a deposit booking → the summary opens with nothing paid.
4. Card on the POS: the step shows "sent to the POS" and you can continue to the receipt and finish; the
   summary shows a note that the amount is with the POS (staging terminals stay Processing). Cash and
   transfer are approved at once.

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
   before the key and "ID seen and captured".
2. "Take ₦X" (front office) runs the payment steps inside that same panel; finishing ("Back to check-in")
   returns to the check-in view with the amount marked paid ("Fully paid") and Check in enabled. Pick the
   ready room, tick the ID, Check in → the summary shows In house.
3. A fully paid or pay-at-check-out booking has nothing to take; Check in is enabled once room and ID are set.
4. Manager only: "Check in without payment" on the manager's own Bookings screen (logged; the balance stays
   on the folio). Front office sees it disabled.

### 3d · Record payment

1. From the booking summary → Record payment: the payment steps open directly on the method step for the
   deposit, or the balance when the deposit is already paid (amount can be changed for a part payment).
2. Transfer or cash → receipt → done; Done returns to the summary with Paid and Balance updated.

### 3e · Folio and check-out

1. Folios → the guest's folio is open with the room charge and the payment, balance ₦0.
2. In the folio: Post a charge "Minibar", ₦4,000 → balance ₦4,000. (Manager only: Discount ₦1,000 with a
   reason → balance ₦3,000; Void the minibar line with a reason → balance back.)
3. Bookings → In-house → Check out: the balance from the folio is shown; "Collect balance now", Cash →
   "Collect … & check out". Status becomes Checked out; the folio closes; Rooms board shows the room as
   "Needs cleaning".
4. Payments → the cash payments appear with Approved status and the amounts above.

## 4 · Other booking actions

- Change dates on an upcoming booking → nights and total recalculate and persist.
- Cancel an upcoming booking (manager) with a reason → status Cancelled; the room type is free again.
- Record payment on an in-house booking by Transfer → Approved; by Card → "sent to the POS" and stays
  Processing until the POS confirms (staging has logging-only terminals).
- As front office, "Check in without payment" is shown but disabled (manager only); the manager has it on
  their own Bookings screen.
- Payments → request a refund on a payment → it appears for the manager under Payments → Refunds.

## What to report

For anything that does not match: the account used, the screen, what you clicked, what you expected, what
happened, and the time (the server logs are by time). Screenshots help; the booking reference or room number
pins it down.
