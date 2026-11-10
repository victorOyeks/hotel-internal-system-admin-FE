# QA script · Operating day (staging)

## Purpose

This script tests one working day at a hotel after the front desk is running: staff on the rota and
clocking in, cash in the tills, rooms cleaned and inspected, spending approved and paid, the day closed, and
the owner and finance seeing real numbers. Everything you do here writes to the shared staging database and
shows up for every account. Run the sections in order; later sections use what earlier ones created.

## Links

- Hotel app: https://web-staging.hospio360.com
- Platform admin (not used in this script): https://admin-staging.hospio360.com
- Hotel used: Royal Suites Ltd → Simpas Ikeja (120 rooms)

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email |
|---|---|---|
| Owner | Godwin Kwin | `godwin@royalsuites.ng` |
| Manager | Tunde Bakare | `tunde@royalsuites.ng` |
| Front office | Victor Adeyemi | `victor@royalsuites.ng` |
| Front office | Toyin Balogun | `toyin@royalsuites.ng` |
| Housekeeping supervisor | Grace Okafor | `grace@royalsuites.ng` |
| Housekeeping attendant | Kemi Adebayo | `kemi@royalsuites.ng` |
| Finance | Femi Ojo | `femi@royalsuites.ng` |

Use a separate browser profile (or a private window) per account so you can stay signed in as two people at
once.

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed. A screen left open across a
  deploy can show an error until it is reloaded.
- Take money by **Cash** or **Bank transfer**. Card payments go to a test terminal that never answers, so they
  stay "Processing".
- If a screen asks for a phone code, use `123456`.
- Emails are sent for real, to the address on the record; SMS and WhatsApp are "coming soon". Where the app
  sends a message (a leave decision, a till that is short, an approval, the day report) a message card appears
  at the top with the text, marked "Email sent to …" or "Not sent · … coming soon". Read it as part of the step. The person it was for also
  gets it in **Notifications** (the bell, top right).
- The **API** button at the bottom left lists every call the screen made to the server, with the answer.
- Name everything you create with "QA " at the start (guests, expenses, notes) so it can be found later.
- Spend limits come from Hotel setup → Approval limits. The steps assume the manager's limit is ₦200,000.
- The night audit closes each business day once. If someone already closed today, section 5 tells you what
  you can still check.

## 1 · Staff and shifts

Shifts are Morning 6am–2pm, Afternoon 2pm–10pm and Night 10pm–6am (the night shift ends the next morning).
Someone who clocks in more than the hotel's late allowance (Hotel setup → Staff & shifts, 15 minutes on
staging) after the start is Late; nobody clocked in by the end of the shift is Absent.

1. **Do:** sign in as Tunde → Staff → All staff → open Toyin → Change shift → Morning, first day tomorrow,
   number of days 2 → Add shifts. **Expect:** "Toyin Balogun is on Morning from Tomorrow".
2. **Do:** open Victor → Change shift → Night, tomorrow → Add shifts; again Morning, the day after tomorrow.
   **Expect:** both are saved; the Rota tab shows Toyin's two mornings and Victor's night as 22:00–06:00.
3. **Do:** Rota → tap Toyin's first shift → Swap with Victor → Swap. **Expect:** "Shift swapped with Victor
   Adeyemi"; the two shifts change places on the rota.
4. **Do:** tap one of Toyin's shifts → Cancel this shift. **Expect:** "Shift cancelled"; the cell is crossed
   out.
5. **Do:** sign in as Victor → My shifts → Clock in. **Expect:** "Clocked in · have a good shift"; the card
   turns green with "On shift since" and a running timer. Clock out → "Clocked out"; Clock in again.
6. **Do:** as Tunde, Staff. **Expect:** "On shift now" counts the people clocked in right now (Victor
   included, even without a shift today). "Attendance this week" is worked shifts out of shifts with a known
   outcome ("—" when none yet). "Payroll · this month" says Not connected yet.
7. **Do:** as Victor, My shifts → open the shift on the day after tomorrow. **Expect:** the panel lists the
   colleagues on that shift. **Do:** Swap → Swap with Toyin, a reason "QA swap" → Send request. **Expect:**
   "Swap request sent to Toyin Balogun".
8. **Do:** as Victor, Ask for leave three times: two days next month, two other days, three other days, each
   with Send request. **Expect:** "Leave request sent to your manager" each time; My leave lists them as
   Pending.
9. **Do:** as Tunde, Staff → Leave. **Expect:** the three requests with dates, days and reason.
   - Approve the first. **Expect:** "Victor Adeyemi's leave approved · their shifts in those days are
     cancelled" and the delivery notice.
   - Decline the second with the reason "QA short-staffed". **Expect:** "Leave declined · they are told why".
   - Change dates on the third: new dates and a message → Send suggestion. **Expect:** "New dates sent for
     them to accept".
10. **Do:** Staff → Requests → Approve Victor's swap. **Expect:** "Request approved"; on the rota that shift
    is now Toyin's and shows Swapped.
11. **Do:** as Victor, My shifts and Notifications. **Expect:** My leave shows Approved, Declined with "QA
    short-staffed", and Change requested with the suggested dates and message. Notifications shows "Your leave
    was approved", "Your leave was declined", "Your manager suggested other dates for your leave" and "Your
    swap request was approved".
12. **Do (attendance):** as Tunde, give Toyin a Morning shift today (it has already ended) and Kemi a shift
    that started earlier today, then ask Kemi to clock in (My shifts). **Expect:** the rota shows Toyin's cell
    as "Needs cover" and Kemi's as "Late"; someone who clocks in within 15 minutes of the start shows "Present".
13. **Do:** tap Toyin's "Needs cover" cell → Find cover → pick Victor → Give the shift. **Expect:** "Victor
    Adeyemi now covers this shift".

Negative checks

- Clock in while already clocked in (second tab, or the API) → "You're already clocked in".
- A leave request whose end date is before the start date → Send request stays disabled.
- A shift that starts and ends at the same time (only possible through the API) → "The shift has to end at a
  different time than it starts".
- Staff cannot decide leave: front office has no Staff screen; through the API the answer is "Access Denied".
- My shifts: Change PIN saves a new 4-digit PIN ("PIN changed"); Language says it is not connected yet.

## 2 · Tills

1. **Do:** as Godwin, Hotel setup → Money & payments → Default till float ₦15,000 → Save changes. **Expect:**
   "Money & payments saved".
2. **Do:** as Victor, Till → Open till. **Expect:** the float is filled in as ₦15,000; "Open with ₦15,000" →
   "Till open · you can take cash".
3. **Do:** Pay in / out → Pay in ₦5,000, reason "QA change from the manager". Then Pay out ₦2,000, reason "QA
   taxi for guest". **Expect:** "₦5,000 paid in", "₦2,000 paid out"; the list shows both (the pay out in red).
4. **Do:** take a cash payment from a stay (Bookings → a QA guest → Record payment → Cash ₦20,000).
   **Expect:** Till → "Cash in this till" lists "Cash payment · <guest name>" ₦20,000.
5. **Do:** request a ₦5,000 cash refund on that payment (Payments → the payment → Refund); as Tunde approve it
   (Payments → Refunds). **Expect:** the till lists "Cash refund" −₦5,000.
6. **Do:** as Femi, record a ₦3,000 expense paid from "Cash / till"; Tunde approves it; Femi opens it → Mark
   paid. **Expect:** "Marked as paid"; Victor's till lists it −₦3,000.
7. **Expect (tiles):** Opening float ₦15,000 · Cash taken ₦25,000 (₦5,000 pay-in + ₦20,000 cash) · Paid out
   ₦10,000 (₦2,000 + ₦5,000 + ₦3,000) · Should be in the drawer ₦30,000.
8. **Do:** Count & close. **Expect:** the dialog shows Opening float ₦15,000, Cash in ₦25,000, Paid out
   −₦10,000, Expected ₦30,000. **Do:** enter ₦29,500. **Expect:** "Short by ₦500", a "What happened" box, and
   Close till disabled until you write a note. **Do:** note "QA ₦500 note missing" → Close till. **Expect:**
   "Till closed · short ₦500 · manager told", the delivery notice to the managers, and Past tills lists the
   till with "short ₦500" and the note. Tunde's Notifications shows "Till short ₦500 · front office".
9. **Do:** Open till again (₦10,000) → Hand over → Handing over to Toyin, Cash counted together ₦10,000 → Hand
   over. **Expect:** "Till handed to Toyin Balogun".
10. **Do:** as Toyin, Till. **Expect:** the till is open by Toyin with a ₦10,000 float. **Do:** Count & close
    with exactly the expected amount. **Expect:** "Counts match" and "Till closed · counts match".

Negative checks

- A second till for the front desk while one is open → "The front office till is already open".
- Pay out with a one-letter reason → the Pay out button stays disabled.
- Close with a difference and no note → Close till stays disabled.
- Housekeeping (Grace) closing the front-desk till (API) → "Only a manager, finance or the front office can
  close this till".

## 3 · Housekeeping

Grace is the supervisor: she sees every room's task and inspects. Kemi is an attendant: she sees only the
rooms given to her. A stay-over clean is due the day after check-in.

1. **Do:** as Victor, check a QA guest into a ready room and check them out the same day (front-desk loop).
   **Expect:** check-in does not mark the room dirty; check-out makes it "Needs cleaning" and creates a
   Departure clean task.
2. **Do:** Victor → Rooms → open that room → Ask housekeeping to rush. **Expect:** "Housekeeping asked to rush
   <room>".
3. **Do:** as Grace, Inspect → Assign rooms → give the room to Kemi.
4. **Do:** as Kemi, My rooms. **Expect:** the room near the top marked "Rush"; the pill at the top shows
   "On shift since …" or "Not clocked in · My shifts". **Do:** Start → tick every checklist line → Mark done.
   **Expect:** "Room <n> started", then "Room <n> done · sent for inspection".
5. **Do:** as Grace, Inspect → open the room → Send back with "QA bathroom mirror smeared". **Expect:** "<room>
   sent back to Kemi Adebayo". Kemi's list shows it "Sent back" with the note.
6. **Do:** Kemi cleans it again (Start → Mark done); Grace opens it → Pass · room ready. **Expect:** "<room>
   passed · room is ready"; Victor's Rooms board shows it Ready.
7. **Do:** Victor → open the ready room → Send to housekeeping. **Expect:** "Room <n> sent to housekeeping"
   (Needs cleaning). Then Mark ready → "Room <n> marked ready".
8. **Do (minibar):** as Tunde → Hotel setup → Housekeeping → Minibar prices → Add item "QA Water" ₦1,000.
   Then for a guest in house, open their stay-over task (Grace) → Minibar → the list shows the Hotel setup
   items → add one QA Water → Post charges. **Expect:** "Minibar charges posted to the folio"; the guest's folio
   has a Minibar line of ₦1,000. With no prices set the panel says "No minibar prices yet".
9. **Do:** Kemi → Report a problem → room, "QA tap dripping", How urgent "Today" → Send to Maintenance.
   **Expect:** "Sent to Maintenance"; the work order shows priority Normal.
9a. **Do:** Kemi → Report a problem → a room nobody is checked into → "Now", keep "Take room … out of order" on,
   add a photo → Send to Maintenance. **Expect:** "Sent to Maintenance · Room <n> is out of order · front
   office told", "Photo added to the work order"; Victor gets "Room <n> is out of order"; the room shows out of
   order on the board and in Maintenance → Rooms out of order. Clear it from the work order afterwards.
9b. **Do:** the same with "Now" + out of order on a room with a guest checked in. **Expect:** refused: "Room <n>
   has a guest checked in (<guest>) · it can't go out of order · …"; nothing is opened. Turn the switch off and
   send: "Sent to Maintenance as urgent · front office told".
9c. **Do:** Kemi → open a room → type a "Note for the supervisor" → Save note. **Expect:** "Note saved for the
   supervisor"; Grace sees it on Inspect ("Note: …" on the row, "Attendant's note" in the panel). Can't clean →
   Do not disturb → Try again at 15:30 → Skip for now. **Expect:** the row says "Do not disturb · try again at
   15:30" for Kemi and on Grace's Inspect.
9d. **Do:** a housekeeping attendant at Edit level (not Grace): **Expect:** no "Inspect" in the sidebar,
   `/dashboard/inspect` says it is for the supervisor, and a held lost & found item has no "Dispose" button.
10. **Do (manager board):** Tunde → Rooms → a room that needs cleaning → Mark ready, or a ready room →
    Assign cleaning to Kemi. **Expect:** "Room <n> marked ready" / "<n> assigned to Kemi Adebayo"; the board
    shows "Needs cleaning · not assigned" for a dirty room nobody has.

Negative checks

- Checking a guest into a room that hasn't been cleaned: front office → "Room <n> hasn't been cleaned yet. A
  manager can check the guest in anyway". The manager can switch on "Check in to this room anyway" on their
  own Bookings screen; the check-in then carries the warning "Room not cleaned yet".
- Ask housekeeping to rush is disabled on a room with no cleaning task (the tooltip says why).

## 4 · Expenses and approvals

Up to ₦200,000 a manager approves; above it the owner does. A manager's own spend within the limit is
recorded straight away.

1. **Do:** as Femi, Expenses → Record expense, four times: "QA A", "QA B", "QA C" by Bank transfer and "QA D"
   by Cash / till, each about ₦10,000, with a note. **Expect:** "Sent to the manager to approve"; the note is
   kept on the expense.
2. **Do:** record "QA E big" for ₦250,000. **Expect:** the form says "Over ₦200,000 · goes to Godwin Kwin";
   after sending "Sent to Godwin Kwin to approve".
3. **Do:** as Tunde, Approvals:
   - QA A → Approve → "Approved · Femi Ojo has been told".
   - QA B → Decline → reason "QA too expensive" → Decline request → "Request declined".
   - QA C → Ask → "QA which supplier?" → Send question → "Question sent · you'll be notified when they reply".
   - QA D → Approve.
4. **Do:** as Femi, Expenses → open QA C → Answer → "QA Bello & Sons" → Send answer. **Expect:** "Answer sent
   · back to the approver"; for Tunde the request is waiting again with the answer.
5. **Do:** as Tunde, open QA C → Send to owner. **Expect:** "Sent to Godwin Kwin".
6. **Do:** as Tunde, Financials → Record expense ₦5,000 → "Expense recorded"; again for ₦260,000 → the button
   reads "Send to owner" → "Sent to Godwin Kwin for approval".
   - **Ask manager:** as Godwin, open Tunde's ₦260,000 expense → Ask → "QA which supplier?". As Tunde,
     Approvals → Waiting shows it with "Answer →" (status "Question asked") and the owner's question → Answer
     → "QA Bello & Sons" → Send answer. **Expect:** "Answer sent · back to Godwin Kwin"; the row leaves
     Waiting and Godwin sees it waiting again with the answer.
7. **Do:** as Godwin, Dashboard → Approvals waiting → Review each QA item → Approve. **Expect:** "<item>
   approved"; the count goes down.
8. **Do:** as Femi, open QA A → Mark paid (bank); open QA D → Mark paid (from the till; a front-desk till
   must be open). **Expect:** "Marked as paid"; QA D comes out of the open till.
9. **Expect (requester):** Femi's list shows A Approved/Paid, B Declined (opening it shows "QA too
   expensive"), C and E Approved; Femi's Notifications shows the decisions.
10. **Do (limits):** as Godwin, Hotel setup → Approval limits → "Expenses above this need the owner" ₦300,000
    → Save. Wait one minute. As Tunde record a ₦250,000 expense. **Expect:** "Expense recorded" (no owner
    needed now). Put the limit back to ₦200,000.

Negative checks

- Record expense with no category, description or amount → Send stays disabled.
- Decline or Ask with an empty reason → the button stays disabled.
- Housekeeping and front office have no Expenses screen; a request to list expenses is refused.
- Mark paid from the till with no till open → "There is no open till to pay this from".

## 5 · Night audit

The manager and the owner close the day; finance can view it (and close it with full finance access). Front
office cannot open it.

1. **Do:** as Tunde, Night audit. **Expect:** the checklist (every arrival checked in or resolved, every
   departure checked out, every till closed, no departure leaving with a balance) with real counts, and
   "Today in numbers" (money by method, spent, occupancy, check-ins/check-outs, no-shows).
2. **Do:** leave a till open (Victor). **Expect:** the till line is not done and "Close the day" is disabled.
   Close the till → reload → the line is done.
3. **Do:** if an expected guest has not checked in today, try to close. **Expect:** the close dialog offers
   "Mark the arrivals still waiting as no-shows"; without it the close is refused with "N expected arrival(s)
   haven't checked in…". With it, those bookings become No-show.
4. **Do:** Close the day → note "QA closed" → Close the day. **Expect:** "<date> closed · summary sent to
   Godwin Kwin", the day-report delivery notice, and the Audit report opens (revenue, rooms occupied,
   arrivals, departures, no-shows, money by method, expenses, cash expected and counted).
5. **Expect:** the page now says "<date> is closed by Tunde Bakare"; Past audits lists the day; Godwin's
   Notifications shows "Day closed · <date> · Revenue ₦…".
6. **Do:** as Femi, Night audit. **Expect:** the same day, closed, with the report.

If today is already closed when you start, you will see "<date> is closed by …" and no Close button. Check
the report, Past audits and the role checks below; closing can be tested on the next day.

Negative checks

- Front office opening Night audit → page not found.
- Closing the same day twice → "This day is already closed".
- Closing a day that hasn't happened (API) → "You can't close a day that hasn't happened yet".
- Closing with a till open (API) → "1 till(s) are still open. Count and close them first".

## 6 · Owner and finance figures

1. **Do:** as Godwin, Dashboard. **Expect:** revenue month to date, net profit and margin, occupancy tonight,
   approvals waiting (count and total), and per branch: revenue today, occupancy and profit this month.
2. **Do:** Financials → Overview. **Expect:** revenue, expenses and profit for the month, the last-30-days
   chart, "Where the money came from" by desk. Bank/bills/payroll, budgets, branch P&L and organization
   credit say "Not connected yet".
3. **Do:** as Tunde, Financials. **Expect:** Net profit, Revenue, Expenses, Taken today (with the number of
   payments), Money taken today by method (Card, Transfer, Cash), cash taken with no till open, the
   7-day chart labelled by weekday, "Where income came from" by desk and Latest money in and out. Budgets and
   Bills say "Not connected yet".
4. **Do:** as Femi, Today / Month / Tills / Expenses. **Expect:** the same figures as the manager's; Tills
   lists today's tills with expected, counted and variance.
5. **Do:** Organizations (Tunde, Femi). **Expect:** the real company accounts from the server (no sample
   companies).
   - Row menu → Send reminder (needs something owed and a contact email or phone) → "Payment reminder sent
     to …" and the message card shows the reminder. With nothing owed: "<name> owes
     nothing right now".
   - Open an account → Send statement (Tunde) / Statement (Femi) → "Statement sent to …" plus the card.
   - Row menu → Put on hold → "<name> is on hold · no new stays on account"; the pill says On hold and the
     booking screens refuse it; Take off hold puts it back.
   - Staff tab → row menu → Remove from account → the person shows as removed; Allow again restores them.
   - Invoice PDF, emailing an invoice and Export are greyed out with a "Not connected yet" tooltip.

## Numbers must agree

Check these at the same moment (nobody taking money in between):

- [ ] Till: float + cash in − paid out = "Should be in the drawer" = Expected in the close dialog.
- [ ] Manager Financials "Money taken today" = Card + Transfer + Cash shown under it.
- [ ] Manager Financials "Taken today" = Femi's Today = the owner's branch "Revenue today".
- [ ] Transactions for today: the payments add up to "Money taken today"; expenses paid and till movements
      appear with a minus.
- [ ] The 7-day chart's bar for today = "Money taken today".
- [ ] After closing the day: the report's revenue and money by method = Today in numbers for that day at the
      moment it was closed; the close dialog showed the same revenue.
- [ ] Approvals waiting on the owner's dashboard = the requests listed under it.

## Known limits

- Card payments on the test terminal stay "Processing"; use cash or transfer.
- A no-show can't be checked in; book a new stay instead.
- A day closed early (for testing, during the day) keeps the report as it was at the close; money taken after
  that still shows in Today's money but not in that day's report.
- Not connected yet (they say so on screen): payroll, bills, budgets, bank balance, branch P&L, organization
  credit, invoice PDFs and emailing invoices, every Export button (greyed out with a tooltip), the terminal
  "Send test", language, receipt photos.
- Any other button that has no server route yet answers "Not connected yet · nothing was saved or sent"
  (blue notice) and leaves the screen as it was. A green success toast always means the server saved it.
- Emails are sent for real, to the address on the record. SMS and WhatsApp are "coming soon". The message card at the top shows each message, marked "Email sent to …" or "Not sent · … coming soon".
- Services read hotel settings at most a minute late: wait a minute after changing a limit or the till float.

