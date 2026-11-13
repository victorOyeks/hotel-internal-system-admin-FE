# QA script · Two people at once, and screens with a lot of data (staging)

## Purpose

When two staff act on the same thing at the same moment, the system must do it once and keep correct totals. This
script checks the fixes from the scale and race-condition audit. Examples of "the same moment":

- two desks checking in one guest;
- a card approved while the waiter charges the order to the room;
- two cashiers taking money on one folio.

It also checks that the busy screens stay quick and correct when a hotel has a lot of data. You test with **two
browsers (or a normal and a private window) signed in as two people**, and click at the same time. A count of "1, 2,
3, click" is good enough.

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract (hospio-backend): `docs/scale-audit-2026-11.md`

## Accounts

Password for every account: `Hospio123!`

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Front office | `victor@royalsuites.ng` |
| Owner | `godwin@royalsuites.ng` |
| Bar (PIN 258013) | `segun@royalsuites.ng` |
| Kitchen (PIN 369150) | `mariam@royalsuites.ng` |

Name test guests `QA RACE …`.

**What a correct "someone else got there first" looks like.** A plain sentence in the toast, for example:

- "The guest is already in";
- "Someone else changed this booking just now; reload and try again";
- "This payment is still waiting at the terminal…".

A raw error code, a 500, or "Something went wrong" is a defect.

## 1. Front desk: one booking, two desks

1. **Check-in.** Make a walk-in booking for today with a ready room. Open it in both windows. Click **Check in** in both
   at the same time.
   - Exactly one check-in happens. The other gets a sentence.
   - The room shows one guest, and there is one folio.
2. **Check-out against cancel.** On an in-house booking, window A clicks **Check out** while window B clicks
   **Cancel**.
   - Only one of them happens, and the booking ends in that state.
   - It is never "Cancelled" while the guest is still shown in the room.
3. **Change against check-in.** On a booked stay, window A changes the room while window B checks in.
   - Either the check-in uses the new room, or one side is told to reload.
   - The two rooms never both show the guest.
4. **Same room, two bookings.** Two desks book the same room for the same night at the same time. One is refused:
   "Room … is booked …".

## 2. Money on one folio

1. Open the same folio in both windows. Both post a charge of ₦1,000 at the same time. Expected: both lines are there,
   and the balance goes up by exactly ₦2,000.
2. Both take a **cash** payment of ₦2,500 at the same time.
   - Two payments with **different receipt numbers**.
   - Folio balance down ₦5,000.
   - The booking's "paid" up ₦5,000.
   - No "Something went wrong". (Before the fix one of them failed.)
3. **Discounts.** Manager gives a discount equal to the whole balance in both windows at once. Expected: one is
   applied; the other is refused, because there is nothing left to discount. The balance never goes below zero.
4. **Close against charge.** One window closes the folio while the other posts a charge. Expected: either the charge
   lands before the close and is in the closing total, or the charge is refused because the folio is closed. Never a
   closed folio with a hidden charge.

## 3. Card payments

You can't approve a card on staging; the test terminal never answers.

1. Take a card payment. When it shows "no response", click **Try again on POS**. Expected: it says the payment is
   still waiting at the terminal, and does **not** send a second card request.
2. Double-click **Send to POS** quickly. Expected: one request appears in Payments.

## 4. Bar and kitchen

1. Open the same order on two devices. Device A adds a line while device B **charges to room**. Expected: either the
   new line is on the room charge, or device A is told the order is settled. A line is never left unbilled.
2. **Tab limit.** On a guest tab close to its limit, add an item from two devices at once. Expected: the limit holds,
   and the second item is refused if it would go over.
3. **Stock.** With an item that has 2 left, sell 2 from the bar and 1 from the kitchen at the same time. Expected:
   stock never shows below zero, and one sale is refused for not enough stock. The stock movements add up to the
   level.

## 5. Tills

1. Two cashiers with the same role click **Open till** at the same time. Expected: one till opens; the other is told
   one is already open.
2. Close a till while a cash payment is being taken at the desk. Expected: the payment lands either before the close,
   counted in "expected cash", or on the next till. Never on a closed till.

## 6. Refunds (manager)

1. Two managers refund the same payment at once, each for the full amount. Expected: one refund. The other is told
   nothing is left to refund.
2. Approve and decline the same pending refund in two windows. Expected: one decision wins; the other is told it was
   already decided.

## 7. Screens with a lot of data

1. **Bookings search.** Bookings (manager and front desk): type a guest name letter by letter.
   - The list updates without the page freezing.
   - Opening a booking panel shows rooms, folios and company accounts. They may take a moment the first time; this is
     expected.
2. **Payments.** Open **Take payment**. The folio list appears when the panel opens.
3. **Reload check.** After any save, the change shows without reloading (see the README rule).
4. **Long lists.** Leave each of these open for a minute and scroll; the browser should not slow down:
   - Owner: Bookings with several hotels;
   - Owner: Reports;
   - Owner: Financials.
5. **Notifications.** The bell shows the newest notices. **Mark all read** clears the count at once.

## What to report

- Anything that happened twice: two check-ins, two receipts for one payment, a charge on the folio twice.
- A total that doesn't add up after a two-window test.
- A 500, a raw error, or a frozen page.
- Any screen that needs a reload to show a change.
