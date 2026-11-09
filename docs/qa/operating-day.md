# QA script · Operating day (staging)

The second module wired end to end after the front-desk loop: the rota and clock, tills, housekeeping,
expenses and approvals, the night audit, and what the owner sees. It follows one day at the hotel. It
writes to the real staging database and shows up for every role. Contract: `docs/operating-day.md` in
hospio-backend.

- Web: https://web-staging.hospio360.com · API: https://api-staging.hospio360.com
- Hotel: Royal Suites Ltd → Simpas Ikeja (120 rooms). Live domains now include `finance` and `housekeeping`.
- Accounts (password `Hospio123!`): manager `tunde@royalsuites.ng`, owner `godwin@royalsuites.ng`, front
  office `victor@royalsuites.ng`, housekeeping `grace@royalsuites.ng`, finance `femi@royalsuites.ng`
- Messages the platform would have sent (leave decisions, approvals, till variances, the day report) appear
  as a "What we would have sent" notice at the top of the screen instead of an email. Read them as part of
  each step.
- Spend limits come from Hotel setup → Approval limits. The steps assume the seeded limit (₦200,000). If it
  is different, pick an amount above it for step 17 and below it for step 15.
- Still on sample data, and that is expected: budgets, bills, income sources, payroll, branch P&L and
  organization credit (they show "Not connected yet"), write-offs, change PIN, language, bank-line matching
  by reference, lost & found writes, the activity log and the owner's other pages.
- Use a fresh day if you can: the night audit closes a business date once.

## 1 · Rota and clock (manager, then staff)

1. As the manager, Staff → All staff → open Victor → Change shift → "Add to the rota": Morning, today,
   1 day → "Add shifts". Repeat for Grace (housekeeping) and Femi (finance), and add a second day for Victor.
   → The Rota tab lists each person with a cell for today; Staff shows "x scheduled".
2. Rota tab → a future shift of Victor's → "Swap or cancel" opens → Cancel this shift → the cell shows
   Cancelled (strikethrough). Add it back with step 1.
3. As Victor, Shared → My shifts → Clock in → the card turns green with "On shift since hh:mm" and a running
   timer; the Staff screen's "on shift right now" count goes up for the manager after a refresh.
4. As Victor, Ask for leave: next week, Annual leave, a note → Send request. As Tunde, Staff → Leave →
   Decline with a reason → the notice shows the message to Victor with the reason. Victor's My shifts → "My
   leave" shows it Declined with the reason. Ask again, Tunde approves → Approved, and any of Victor's
   shifts inside those dates are cancelled on the rota.
5. As Victor, open tomorrow's shift → Ask to swap with a colleague (or Ask for cover) → "request sent". As
   Tunde, Staff → Requests → Approve → the notice shows the message to Victor.

## 2 · The desk opens (front office)

6. As Victor, Till → Open till → the float is filled in from Hotel setup → Money (default till float). Open
   with it → "Till open", Opening float shows it, "Should be in the drawer" equals the float.
7. Pay in / out → Pay out ₦2,000 "Taxi for guest" → KPI "Paid out" ₦2,000, the drawer expectation drops by
   ₦2,000, and the list shows the entry in red.

## 3 · A stay with cash (front office)

8. Bookings → New booking (check-in today, check-out tomorrow, Deluxe, Pay at checkout) → check in
   (front-desk loop section 3), paying ₦45,000 by Cash → Rooms board shows the room occupied.
9. Till → Cash in this till lists "Cash payment ₦45,000"; "Cash taken" and "Should be in the drawer" rise by
   ₦45,000. Folios → balance ₦0.
10. Check the guest out the same day (front-desk loop section 3, step 5) → the Rooms board shows the room "Needs
    cleaning" and housekeeping gets a task for it.

## 4 · The room is cleaned and inspected (housekeeping)

11. As Grace, Housekeeping → My rooms → the room's task (Departure clean) → Start → the card says "Cleaning
    now". Tick every checklist line (the ticks stay after a refresh) → Mark done → "sent for inspection".
12. As Victor, Rooms board → open the room (still Needs cleaning or Being inspected) → "Ask housekeeping to
    rush" → as Grace, My rooms shows "Rush" on the task (sorted first).
13. As the supervisor (Grace or the manager), Housekeeping → Inspect → To inspect lists the room → Inspect →
    Pass · room ready. As Victor, the Rooms board shows the room Ready. Try the other path on a second
    room: Send back with a note → the task returns to the attendant with the note.
14. As Victor, open a Ready room → Send to housekeeping → it shows Needs cleaning; Mark ready → Ready again.

## 5 · Spend and approvals (finance, manager, owner)

15. As Femi, Expenses → Record an expense: Housekeeping, "Detergent", ₦15,000, Cash / till → "Sent to the
    manager to approve". As Tunde, Approvals → Waiting lists it → Review → Approve → toast "Approved" and a
    notice with the message to Femi. As Femi, the expense shows Approved → open it → Mark paid → Paid.
16. As Tunde, Financials → Tills lists the front office till as Open with its expected cash. Overview → "Money
    taken today" includes the ₦45,000 cash; Transactions lists the payment, the paid expense and the till
    pay-out.
17. As Femi, Expenses → Record an expense: Fuel & power, "Diesel · 400 litres", ₦250,000 (above the limit)
    → "Sent to Godwin Kwin to approve".
18. As Tunde, Approvals → "With the owner" lists it; open it → the panel says it is with the owner and
    there is no Approve button. For a MANAGER-level item above the limit the panel offers "Send to owner"
    (escalate) with a note instead.
19. As Godwin, Dashboard → "Approvals waiting" shows the diesel request with the amount → open → Ask
    manager: "Which supplier?" → the request shows Question asked and the notice shows the message. As Femi,
    the expense shows Question → Answer → "Answer sent". The approval is Pending again for Godwin.
20. As Godwin, open it → Approve ₦250,000 → notice with the message to Femi. As Femi the expense is
    Approved → Mark paid → Paid. As Tunde, Approvals → Decided shows "Approved by Godwin Kwin".

## 6 · Closing the till (front office, manager)

21. As Victor, Till → Count & close. Expected = float + ₦45,000 − ₦2,000 (− any cash expenses paid from the
    till). Enter ₦500 less → "Short by ₦500" and "What happened" appears; Close till is disabled until you
    type a note → close → toast "Till closed · short ₦500 · manager told" and the notice shows the message to
    the managers. Past tills lists it with the note.
22. As Tunde, Financials → Tills → the till shows Closed with the ₦500 variance. Financials → Night audit
    still says tills must be closed if another till (e.g. the finance one) is open.
23. As Femi, Tills → Count & close any other open till (needs a note for any variance) → Bank cash:
    amount, bank account → "deposit recorded".
24. Open a till as Victor again (Open till) and, from the till page, Hand over to Toyin: count the
    drawer, pick Toyin → "Till handed to Toyin Balogun" → the drawer shows Toyin as the opener and the
    counted cash as the new float. As Toyin, Till shows the till as hers; close it with the count.

## 7 · Night audit (manager or finance)

25. As Tunde, Night audit → the checklist comes from the service: Arrivals (arrivals still waiting, with the
    count), Departures, Tills, Unpaid balances. No fake counts: the numbers in "Today in numbers" are the
    day's real money by method, spend, occupancy and no-shows.
26. With a till still open, "Close the day" is disabled and the banner says to count and close every till.
    Close the tills (section 6) → Tills turns Done.
27. Leave one arrival unresolved (do not check it in). Close the day → the modal shows the cash counted
    field, a note, and "Mark the arrivals still waiting as no-shows". Turn it on, count the safe, add a note
    → Close the day → "closed · summary sent to Godwin Kwin", the notice shows the daily report message, and
    the audit report opens: revenue, rooms occupied, no-shows (the arrival you left), payments by method,
    expenses, cash expected and counted. Bookings → that arrival is now a No-show.
28. Past audits lists the day; Report reopens it. As Femi, Night audit shows the same checklist and report
    (finance closes with Finance Full).

## 8 · The owner sees the day

29. As Godwin, Dashboard → Revenue today for the hotel equals the money taken, "Approvals waiting" drops to
    zero after step 20, Worth a look lists anything real (a loss-making hotel, an empty one); "Revenue ·
    last 30 days" shows the series with today's bar.
30. Financials → Overview: revenue, expenses and margin for the month (the numbers add up with Financials
    → Transactions: the cash payment, the paid expenses, the till movements). Branch P&L, Payroll,
    Organizations, Budgets and "Where the money came from" say "Not connected yet". Expenses & budgets →
    Needs the owner lists the diesel request as Approved.
31. Hotels → each hotel shows revenue and occupancy for the day and month from finance-service.

## What to report

For anything that does not match: the account used, the screen, what you clicked, what you expected, what
happened, and the time (the server logs are by time). Screenshots help; a room number, till opener or
expense description pins it down. For the notices, copy the text: it is exactly what the platform would have
sent.
