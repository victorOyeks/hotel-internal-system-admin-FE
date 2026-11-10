# QA script · Owner portal (staging)

## Purpose

This script tests the hotel owner's screens on real data: bookings at every hotel (acted on at the booking's own
hotel), staff accounts (add, edit, pause, suspend, reinstate, new password, remove, message), messaging with managers
and the Inbox everyone has, hotels and operations figures, changes by H.M.S (ask support to undo), credit limits a
manager asks the owner for, payments and settlements, reports (build, download, schedule) and the ownership transfer
request. It also checks that "All hotels" is the sum of the single hotels and that one owner never sees another's
data. Everything you do writes to the shared staging database. Run the sections in order.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal (for section 9): https://admin-staging.hospio360.com
- Contract this follows: `docs/owner-portal.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email | Business |
|---|---|---|---|
| Owner A | Godwin Kwin | `godwin@royalsuites.ng` | Royal Suites Ltd (Simpas Ikeja) |
| Manager | Tunde Bakare | `tunde@royalsuites.ng` | Royal Suites · Simpas Ikeja |
| Front office | Victor | `victor@royalsuites.ng` | Royal Suites · Simpas Ikeja |
| Finance | Femi Ojo | `femi@royalsuites.ng` | Royal Suites · Simpas Ikeja |
| Owner B (two hotels) | QA Owner B fcekd | `qa.ownerb.fcekd@hospio-qa.test` | QA Owner B Hotels fcekd (QA B Ikoyi fcekd, QA B Abuja fcekd) |
| Manager, owner B hotel 1 | QA B Manager 1 fcekd | `qa.ownerb.mgr1.fcekd@hospio-qa.test` (temporary password `2Be2JEjdMm`, change it at first sign-in) | QA B Ikoyi |
| Manager, owner B hotel 2 | QA B Manager 2 fcekd | `qa.ownerb.mgr2.fcekd@hospio-qa.test` (temporary password `tt2KsHjUZm`) | QA B Abuja |
| Super admin | Amoria | `amoria@hospio360.com` | H.M.S |

**Do not pause, suspend or remove an existing account** (Tunde, Victor, Femi, Grace and the others): other QA scripts
use them. Add your own "QA Owner …" staff in section 3 and work on those.

## What is set up

- Royal Suites has one hotel on staging (Simpas Ikeja). Owner B has two (QA B Ikoyi, QA B Abuja), each with four
  Standard rooms, a manager, two bookings and a cash payment (₦10,000 at Ikoyi, ₦20,000 at Abuja). Use owner B for
  everything that needs more than one hotel.
- The owner's credit limit threshold is ₦1,000,000: a manager can set up to that; above it, the owner decides.
- Every owner screen has a **hotel filter** ("All hotels" by default). Lists show every hotel with a Hotel column;
  picking one hotel narrows the list and the tiles. The sidebar's branch only matters for Hotel setup, Roles,
  Inventory and Settings → Taxes / Approval limits.

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed.
- Email, SMS and WhatsApp are not connected on staging. Whenever something would have gone out (an invite, a
  temporary password, a WhatsApp to a guest or a manager, a report email), a yellow message card appears top-centre with the channel, the recipient and the full text. Close it with **Close**. If it does not
  appear after a step marked **(delivery)**, that is a bug.
- The **API** button at the bottom left lists every call the screen made.
- Lists are newest first by time. Money is in naira.

## 1 · Hotels and the dashboard (owner B)

1. **Do:** sign in as owner B → **Hotels**. **Expect:** both hotels, each with rooms (4), manager name, this month's
   revenue and expenses (₦0 until money is posted), occupancy, staff on shift and open repairs. No "Simpas Lekki" or
   other sample hotels.
2. **Do:** open **QA B Abuja**. **Expect:** its own rooms 201–204 (not Ikoyi's 101–104), its staff, and the Money tab
   without payroll or POS figures (those are on Payments & payouts).
3. **Do:** **Contact manager** → type a message → **Send message**. **Expect:** "Message sent to QA B Manager 2 …".
   Tick "Also send on WhatsApp" once: **(delivery)** WhatsApp to the manager's phone.
4. **Do:** **Download report** on the hotel page. **Expect:** a CSV with one row for that hotel. Download on
   **Hotels** gives one row per hotel.

## 2 · Bookings at every hotel (owner B)

1. **Do:** **Bookings** → tab **All**. Note the count. Pick **QA B Ikoyi** in the hotel filter, then **QA B Abuja**.
   **Expect:** the two counts add up to the All count. The table has a Hotel column; newest stay first.
2. **Do:** filter **QA B Abuja**, tab **Arrivals**, open the guest arriving today → **Check in** → pick a room, tick
   **ID seen**, tick **Check in to this room anyway** if the room was never cleaned → **Check in to 20x**.
   **Expect:** "… checked in to 20x"; the booking moves to In-house. (It checks in at Abuja, not at the sidebar's hotel.)
3. **Do:** filter **QA B Ikoyi**, open the second Ikoyi booking → **Take a payment** (or **Record payment**) → Cash
   ₦5,000 → count → skip receipt. **Expect:** "Payment recorded"; Payments & payouts shows ₦5,000 more at Ikoyi only.
4. **Do:** same booking → **Change dates** → new check-in and check-out → **Save new dates**. **Expect:** "Dates changed
   · … · guest told on WhatsApp" and **(delivery)** WhatsApp with the new dates. Pick dates when no room is free:
   the change is refused with the reason and nothing moves.
5. **Do:** same booking → **Message guest** → WhatsApp → pick a template (it names the hotel) → **Send**.
   **Expect:** "Message sent on WhatsApp" **(delivery)**.
6. **Do:** an upcoming Abuja booking → **Cancel** → reason → **Cancel booking**. **Expect:** "Booking cancelled"; it
   moves to Past.
7. **Do:** **New booking** with the filter on All hotels. **Expect:** first "Which hotel is it for?"; pick Abuja →
   the booking form shows Abuja's room types; save a booking. **Expect:** it appears under Abuja.
8. **Do:** **Export** → **Download CSV**. **Expect:** the rows of the tab, hotel and search you are looking at.

## 3 · Staff (owner B; then owner A with your own QA staff)

1. **Do:** **Staff**. **Expect:** one row per person and hotel (a person at two hotels shows twice), never the owner.
   Tiles: total people, active, invite not accepted, paused or suspended. All = Ikoyi + Abuja (hotel filter).
2. **Do:** **Add staff** → name "QA Owner <your initials>", email, phone, hotel Abuja, role Front office, job title →
   **Add staff**. **Expect:** "… added at QA B Abuja", the invite with the temporary password and link
   **(delivery)** (email + SMS). The row shows **Invited**.
3. **Do:** row menu → **Edit details** → change the job title → **Save changes**. **Expect:** "… saved"; the job title
   shows under the name. Saving with nothing changed is not possible (button disabled); typing an email another
   account uses → "Someone already signs in with …".
4. **Do:** row menu → **Pause for 7 days** → **Pause for 7 days**. **Expect:** status **Paused until <the 7th day>**.
   Try to sign in as that person: "This account is paused until …". Then row menu → **End the pause** → **End the
   pause now**. **Expect:** Active.
5. **Do:** row menu → **Suspend** → leave the reason empty → **Suspend**: "Say why … is suspended". Type a reason →
   **Suspend**. **Expect:** **Suspended**; the profile shows "Suspended by <you> on <date>: <reason>"; the person
   cannot sign in ("This account is suspended…"); the hotel's manager gets an in-app notice. **Reinstate** → Active.
6. **Do:** row menu → **New temporary password** → **Reset password**. **Expect:** the temporary password shown once
   and **(delivery)** an email and an **SMS** to the person's phone.
7. **Do:** row menu → **Message** → type → **Send**. **Expect:** "Message sent to …"; the person sees it in
   **Inbox** (sign in as them: Inbox in the notification, or `/dashboard/inbox`) and can reply.
8. **Do:** row menu → **Remove from QA B Abuja** → **Remove from hotel**. **Expect:** "… removed from QA B Abuja"; the
   row is gone; their roles at other hotels stay.
9. Roles and levels are changed on **Roles & permissions** (link in the profile).

## 4 · Messaging and the Inbox (owner B, both managers)

1. **Do:** **Messaging** → **New message** → To **QA B Manager 1** → message → **Send**. **Expect:** the thread opens
   on the right with your message.
2. **Do:** **New message** → To **QA B Abuja · managers** → **Send**. **Expect:** a thread to "Managers" at Abuja.
3. **Do:** **Message all managers** → message → **Send to all**. **Expect:** "Sent to 2 managers"; two threads, one
   per manager.
4. **Do:** sign in as QA B Manager 1 → open the notification "Message from QA Owner B …" (or `/dashboard/inbox`).
   **Expect:** the Inbox with the owner's threads (not the Abuja one); open one, reply. Back as the owner: the thread
   shows the reply in bold with an unread count; opening it clears the count.
5. **Do:** filter Messaging by hotel. **Expect:** only that hotel's threads.

## 5 · Credit limits (Tunde, Godwin)

1. **Do:** sign in as Tunde → **Organizations** → add a company with credit limit ₦1,500,000. **Expect:** "… added ·
   the credit limit of ₦1,500,000 is waiting for the owner"; its limit stays ₦0 and the detail shows "₦1,500,000
   waiting for the owner".
2. **Do:** as Tunde, raise it again to another amount. **Expect:** "A credit limit of ₦1,500,000 for … is already
   waiting for the owner. Wait for their answer first".
3. **Do:** sign in as Godwin → **Financials** → **Organizations**. **Expect:** "Needs your approval" lists it with
   the current and asked-for limit, who asked and the hotel; the table lists every hotel's companies.
4. **Do:** **Review** → **Approve ₦1,500,000**. **Expect:** "… credit limit is now ₦1,500,000" **(delivery)** to
   Tunde; after a refresh the table shows ₦1,500,000.
5. **Do:** as Tunde raise to ₦2,500,000; as Godwin **Review** → **Decline and keep ₦1,500,000** → reason →
   **Decline**. **Expect:** the limit stays ₦1,500,000.
6. **Branch P&L** tab: one row per hotel with revenue, expenses, net, margin (no payroll column: not connected).

## 6 · Payments & payouts (owner B)

1. **Expect:** tiles Taken this month, Cash this month, Card & transfer collected, Waiting to be paid out. With
   owner B's seed: All hotels taken = ₦30K (plus what you took in section 2), Ikoyi ₦10K (+5K), Abuja ₦20K.
2. **Do:** filter by method and status. **Expect:** readable labels (Card, Cash, With the POS…), never codes.
3. **Do:** tab **Settlements this month**. **Expect:** card and transfer days by provider with fee, H.M.S share and
   what you get; cash never appears. (Owner B has only cash: the table is empty with the explanation.)

## 7 · Operations and changes by H.M.S (Godwin, Amoria)

1. **Do:** **Operations** → **Hotels now**. **Expect:** per hotel: staff clocked in / on today's rota, open repairs,
   occupancy, the last action and when.
2. **Departments**: each department's actions in the last hour and staff on shift; All hotels adds the hotels up.
3. **Activity log**: the business's log, newest first, with hotel and department; filter by hotel and department;
   **Export** downloads what you see. Summaries never show codes like REPAIRS.
4. **Do:** as Amoria (admin portal) → Businesses → Royal Suites Ltd → edit a detail (for example the business phone)
   with a reason → save: that records a change by H.M.S. As Godwin → **Operations** → **Changes by H.M.S**. **Expect:** the change with **Ask support to undo**. Click it → note → **Send to support**. **Expect:**
   "Hospio support has your request…"; the row shows "Undo asked · support is on it". Asking again is not possible.
5. **Do:** as Amoria, open Support: a HIGH ticket "Undo a change by H.M.S: …". Put the detail back by hand, then
   Changes → **Undo** on that change. **Expect:** the ticket is resolved **(delivery)** to Godwin; Godwin's row shows
   **Undone**. (Undo marks it; support restores the value themselves.)

## 8 · Reports (owner B)

1. **Do:** **Reports** → **Guest list** → **Open**. **Expect:** this month's guests of both hotels; pick a hotel or
   another period and it rebuilds. **Download CSV** saves exactly the rows.
2. Repeat for Daily summary, Occupancy (max 31 days), Revenue by source, Payments & refunds, Expenses.
3. **Do:** **Schedule** on Daily summary → Daily → 07:00 → All hotels → tick "Also send to the managers" → **Save
   schedule**. **Expect:** it appears under Scheduled reports with the next time. Saving the same report and hotel
   again changes the schedule (no second row).
4. **Do:** **Send now**. **Expect:** **(delivery)** the email with the link; an in-app notice "Daily summary · <day>
   is ready" for you (and each hotel's managers); the run appears under Sent reports and opens the report for that day.
5. **Do:** **Stop** → **Stop schedule**. **Expect:** status Stopped.
6. **Do:** sign in as Tunde → **Reports**. **Expect:** the same live reports for Simpas Ikeja; Schedule offers only his
   hotel and no "send to the managers"; he sees and stops only his own schedules. A report the owner sent to the
   managers opens here from the notice.

## 9 · Ownership transfer (owner B)

1. **Do:** **Settings** → **Transfer ownership** → **Start a transfer** → name, email (try your own: "That is your own
   email…") → **Continue** → **Send to H.M.S support**. **Expect:** "Transfer request sent to H.M.S support"; the tab
   shows the request "With H.M.S support" and the button reads "Request sent".
2. As Amoria: Support has a HIGH ticket "Ownership transfer · <business> → <email>". Resolve it with a note:
   owner B's tab shows Closed with the note.

## 10 · Numbers that must agree

| Check | Expect |
|---|---|
| Bookings All count | = sum of each hotel's count |
| Staff All count | = sum of each hotel's count |
| Payments "Taken this month" All | = sum of each hotel's (and the API `GET /payment/payments` per hotel) |
| A payment taken on a booking | shows on that booking's folio and its Paid figure |
| Financials totals | = sum of the hotels' revenue and expenses (`/finance/owner/summary`) |

## 11 · Negative checks

| Who | Try | Expect |
|---|---|---|
| Tunde | Suspend or pause a manager (API `POST /identity/users/{id}/suspend`) | 403 "Only the owner can suspend a manager" |
| Tunde | Pause the owner | 403 "Only H.M.S can change the owner's account" |
| Godwin | Suspend himself | 403 "You can't suspend your own account here…" |
| Victor | Suspend anyone, start a staff thread, schedule a report | 403 |
| Tunde | Message a hotel's managers or every manager | 403 "Only the owner…" |
| Tunde | Approve the credit limit | 403 "This one is for the owner" |
| Tunde | Read settlements, ask for an undo, request a transfer | 403 |
| Owner B | Any call with `X-Hotel-Id` of Simpas Ikeja | 403 "That hotel is not granted to this user" |
| Owner B | Open Godwin's thread, booking, change or approval by id | 404 |
| Owner B | Message Tunde | 403 "That person is not in your business" |
| Owner B | Schedule a report for Simpas Ikeja | 403 "That hotel is not one of yours" |
| Someone not in a thread | Open it | 403 "This conversation is between other people" |
| Godwin | Mark an H.M.S change undone himself | 403 "Ask Hospio support to undo it…" |

## Known limits

- Reports are CSV built in the browser from live data; no PDF or Excel. A scheduled report arrives as an in-app
  notice and an email link (echoed on staging), not as an attachment.
- A change by H.M.S is put back by support; the owner asks for it (a ticket). Ownership transfers are made by support
  from the ticket; there is no accept-by-email flow yet.
- Staff who are not managers read and reply in Inbox only (opened from the notification or `/dashboard/inbox`; no
  menu item yet); WhatsApp replies do not come back into the thread.
- Payments the owner takes from Bookings show "Taken by <owner> · Owner".
- Financials: payroll, bills and budgets are not connected (no payroll service); transactions and expenses are the
  sidebar's hotel. Settlements are per business and provider, so they are the same whichever hotel you pick.
- Settings → Taxes and Approval limits edit the hotel picked in the sidebar.
- The owner has no folio screen: the booking panel shows the folio totals without "Open full folio".

