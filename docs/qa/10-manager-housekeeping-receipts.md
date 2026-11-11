# QA · Manager leftovers, housekeeping leftovers and receipts

Contract: `hospio-backend/docs/manager-leftovers.md`. Staging: https://web-staging.hospio360.com (API
https://api-staging.hospio360.com). Password for every account: `Hospio123!`. Name anything you create "QA ML …".

| Role | Account |
|---|---|
| Manager | tunde@royalsuites.ng |
| Owner | godwin@royalsuites.ng |
| Finance | femi@royalsuites.ng |
| Front office | victor@royalsuites.ng |
| Housekeeping (supervisor) | grace@royalsuites.ng |
| Bar (PIN 258013) | segun@royalsuites.ng |

Check every screen at 1512 and 1280 wide (housekeeping also at 390). No console errors, no raw codes (FUEL_AND_POWER,
ROOM_PRICE, SENT_BACK), lists newest first.

## 1. Activity log (manager)

1. Manager → Activity log. The table shows "Showing 1–25 of N"; page 2 shows the next 25.
2. Pick a department (Finance). The count drops and every row is a Finance action. Pick Today: only today's entries.
3. Search "tunde": only Tunde's actions or summaries mentioning him.
4. Export → the modal says how many entries and the filters → Download CSV. The file has exactly that many rows (all
   pages, not just the one on screen).
5. Open a row: who, department, when, what changed, details in words.
6. Front office can't open /dashboard/activity data (the API refuses: 403).

## 2. Reports · Email me (manager, owner)

1. Reports → open Expenses → Email me. Toast "Report emailed to tunde@…"; the delivery notice shows the email. The email
   holds a link to `/dashboard/reports?report=EXPENSES&from…`; opening it shows the same report.
2. Schedule, Stop and Send now work as before.

## 3. Room price → owner approval

1. Hotel setup → Approval limits (owner): "Room price changes need the owner" on, "Only price changes above this need
   the owner" = 0 (every change).
2. Manager → Rooms → Types & prices → Change base price on a QA ML type. The note says the owner approves it; Send to
   owner. The card shows "₦X waiting for the owner"; the price stays.
3. Another price while one waits: refused ("already waiting for the owner").
4. Owner → Approvals: "Room price" with the old and new price. Approve → the new price applies. Decline (next time) → the
   old price stays.
5. The owner changing a price applies at once.

## 4. Hotel setup

Every section shows the hotel's real values (Brand, Payments & POS, Reasons & lists, Taxes); no sample terminals or
provider keys. Housekeeping has "Days lost & found items are kept" (90).

## 5. Financials

1. Manager → Financials → Overview: "Spend vs budget" with a bar per category that has a budget or spending; the total
   is the sum of the rows.
2. Categories & budgets: set a monthly budget for a category, save; the bar updates. Add "QA ML Generator", rename it,
   archive it (Other can't be archived). The expense form's Category list follows.
3. Record an expense in a category: Spent for that category grows by exactly that amount.
4. Bills tab: Add bill (payee, category, amount, due, repeats). Overdue ones are marked. Open one → Mark paid (Bank) →
   the toast says the expense was recorded; Expenses shows a paid expense of the same amount and category; a monthly
   bill gets its next copy a month later. Cancel an unpaid bill.
5. Owner → Financials: "Where the money went" shows the same budget lines; Bills to pay lists the unpaid bills; Expenses
   → Budgets shows the budgets. Payroll still says "Not connected yet" (no payroll service).
6. Finance → Expenses → Record: categories are the hotel's list.

## 6. Lost & found (housekeeping, front office)

1. Housekeeping → Lost & found → Log a found item: what, a room (or a public area / somewhere else), details, found by
   (defaults to you), photo (optional, ≤ 2 MB), Tell the front office (on). Log item.
2. Front office gets a notice "Found in Room …"; Front office → Lost & found lists it.
3. Open the item: photo, where, by, when, "Told …". Tell front office again works.
4. Return: name, ID shown, how → Returned, with who handed it over.
5. Dispose on a new item: refused until the hold days are over, with the date it can be disposed of. Only a
   supervisor (Housekeeping Full) or a manager sees "Dispose"; an Edit-level attendant doesn't, and the note says
   it can be disposed of "by a housekeeping supervisor or a manager".
6. Tabs Held / Returned / Disposed of / All with counts; search; paging.

## 7. Inspection (housekeeping supervisor)

1. A cleaned room shows under To inspect. Send back needs the reason; the attendant gets a notice with it and the room
   goes back to Dirty.
2. Clean it again → Pass · room ready: the room shows Ready (inspected) on the front desk board.
3. No "Write-offs" tab (linen losses live with the laundry's linen batches).
4. The attendant's "Note for the supervisor" (saved with Save note on My rooms) shows on the row ("Note: …") and in the
   inspect panel as "Attendant's note"; a skipped room shows its "try again at" time.
5. An Edit-level housekeeping attendant has no "Inspect" in the sidebar; opening `/dashboard/inspect` says it is for the
   supervisor.

## 8. Receipts

1. Front office → take a cash payment → the success step has Print receipt. The receipt page shows the hotel name,
   address and phone, receipt number (RCP-yyyy-nnnnnn), date and time, item, total, payment method and reference, who
   took it, and the guest.
2. Print receipt opens the print dialog; only the receipt prints. Switch "80 mm roll": a narrow receipt sized for a
   thermal printer. A4 has margins.
3. Email receipt: the guest's email is filled in when known; the toast says where it went (sent for real). The take-payment
   receipt step offers Email (default with a guest email) or Print; WhatsApp and SMS show "coming soon" and can't be picked.
4. Bar → Sales → a paid sale → Print receipt: every item, discount, tax, total, each payment with its receipt number;
   paid = total.
5. Front office → check-out panel → Print receipt; Folios → Print or email → Print receipt: the stay's charges,
   discounts, tax, payments and balance.
6. Manager → Payments → an approved payment → Print receipt; "Email receipt again" → "Receipt emailed to …" (a guest with
   only a phone is refused: WhatsApp receipts are coming soon).
7. Manager sidebar → "Approvals" with the number waiting; it opens the same screen as Dashboard → All approvals.
8. Hotel setup → Housekeeping → Minibar prices: Add item, Edit, Switch off / Offer again; a negative price is refused.
   Housekeeping → Minibar lists only the offered items.

## Automated runs

`scratchpad/e2e/mlapi.ts` (API sweep) and `scratchpad/e2e/mlui.ts` (browser sweep and print PDFs), plus the regressions
`shapi.ts`, `rbmoney.ts`, `lmapi.ts`, `ownapi.ts`. Results are in the contract's verification section.
