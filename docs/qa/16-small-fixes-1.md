# QA script · Small fixes 1 (staging)

## Purpose

This script tests a round of small fixes: bar and kitchen money counted as the outlet's income whoever takes it,
organization screens that never ask for a missing id, searching the email delivery log, Remind and Reset PIN on the
owner's Staff screen, an Inbox link with an unread count for every role, and the Staff, owner Staff and Roles &
permissions lists read a page at a time from the server. Sections 1, 4 and 5 add a few test rows named "QA FIX …".

## Links

- Hotel app: https://web-staging.hospio360.com
- Contracts this follows (hospio-backend): `docs/restaurant-bar.md` (Income by desk), `docs/pagination.md` (People
  lists), `docs/shared-devices.md` (Owner's Staff screen), `docs/owner-portal.md` (Small fixes 1)

## Accounts

Password for every account: `Hospio123!`

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Owner | `godwin@royalsuites.ng` |
| Finance | `femi@royalsuites.ng` |
| Front office | `victor@royalsuites.ng` |
| Housekeeping | `grace@royalsuites.ng` |
| Bar (PIN 2580) | `segun@royalsuites.ng` |
| Kitchen (PIN 3691) | `mariam@royalsuites.ng` |
| Owner B | `qa.ownerb.fcekd@hospio-qa.test` |

Don't change the shared accounts. For PIN and Inbox tests add your own staff with an `@hospio-qa.test` email
(section 4).

## 1 · Bar and kitchen income (Tunde, Femi)

The rule: money for a bar or kitchen order is that outlet's income, whoever takes it. A manager collecting a bar sale
is Bar income; front office taking a room-service payment is Kitchen income. Cash still goes into the payer's own
till (a manager has no till, so their cash shows as cash taken with no till open, as before).

1. Femi → **Today's money**. Note the Bar and Kitchen income. Tunde → **Restaurant & bar sales today** card on the
   dashboard: note the Bar's "paid at the outlet".
2. Expected before you start: Bar income on Today's money equals the Bar's "paid at the outlet".
3. Segun → **Bar today** → a quick sale of one Coca-Cola, leave it unpaid ("QA FIX walk-up").
4. Tunde → **Sales** (sales history) → open the sale → **Take payment** → Cash.
5. Femi → Today's money: Bar income is up by the sale; there is no "Manager" income line. Bar income still equals the
   Bar's "paid at the outlet" on Tunde's card.
6. Victor → **Room service** → a takeaway kitchen order → take the payment by transfer. Femi: Kitchen income is up by
   it; front office income is unchanged.
7. Tunde → **Night audit** for the day (after the day is closed): the report's revenue by desk shows the same split.
8. Negative: Femi can't take a payment for a sale (Sales history shows "View only").

## 2 · Organizations (Tunde, Femi, Godwin)

1. Tunde → **Organizations** → open an account; reload; go back. Every panel loads (no "Something went wrong").
2. Femi → **Organizations** → open the same account: it loads.
3. Godwin → **Financials** → Credit limits: the list and the review panel load; approve or decline nothing.
4. Edge: open `https://web-staging.hospio360.com/dashboard/organizations/undefined` as Tunde. Expected: the "not
   found" screen, not an error page. The API answers 404 "Organization not found" for an id that isn't there.

## 3 · Email delivery log search (API only)

The delivery log (`GET /messaging/deliveries`) has no screen in the hotel app yet; it is checked through the API
(`sf1api.ts` in the QA kit, section "deliveries"). With Tunde's token:

1. `?q=<an address that was emailed>` in any letter case: found.
2. `q` = `100%`, `a_b`, `O'Brien`, `ñandú`, a backslash, `%`: each 200; `%` matches only rows containing `%`.
3. `q` with `status=SENT`: both apply. `status=NOPE` and `size=101`: 400. Victor (front office): 403.
4. While a service restarts (during a deploy) the API answers 503 "This part of Hospio is restarting. Try again in
   a minute." instead of 500.

## 4 · Owner's Staff: Remind and Reset PIN (Tunde, Godwin, your QA FIX staff)

1. Tunde → **Staff** → **Add staff**: "QA FIX <you>", Housekeeping, Can edit, an `@hospio-qa.test` email. Accept the
   invite in a private window and set a password.
2. Godwin → **Staff** → search the email. The row reads **Active · No PIN yet**.
3. Open the row → **PIN for shared devices** → **Remind**. Expected: "Reminder sent to QA FIX …". The QA FIX
   person gets a notice "Set a PIN for the shared devices".
4. As the QA FIX person: **My profile & security** → Security → set a PIN.
5. Godwin → reload Staff: the "No PIN yet" pill is gone. Row menu (⋯) → **Reset PIN** → confirm. Expected: "PIN
   reset"; the person is told "Your PIN was reset"; their PIN no longer unlocks a shared device.
6. Refused: Remind on someone who has a PIN ("already has a PIN"); Reset on someone with none ("has no PIN to
   reset"); the owner's own account has no PIN actions; a manager can't reset the owner's PIN.
7. Owner B can't remind or reset Royal Suites' staff.

## 5 · Inbox for every role (Godwin, your QA FIX staff, each shared account)

1. Sign in as each of: Tunde, Femi, Victor, Grace, Segun, Mariam. Each sidebar has **Inbox** (the owner's
   conversations stay on **Messaging**). Open it: the Inbox loads, no "not found" or "not allowed".
2. Godwin → **Messaging** → new message to your QA FIX person.
3. QA FIX person: the sidebar's **Inbox** shows a red count of 1. Open the conversation: the count goes. Reply.
   Expected: the reply shows in the conversation.
4. Godwin: **Messaging** in the sidebar shows the unread reply count; open it and it goes.
5. Someone else (Grace) can't open that conversation.

## 6 · Staff and Roles lists a page at a time (Tunde, Godwin)

Check the pager on each list: under the table "Showing 1–25 of N"; page 2 reads "Showing 26–…", the address gains
`page=2`, reload keeps it, Back returns to page 1; counts and cards are the same on both pages.

1. Tunde → **Staff** (All staff): pager as above. Search a name from the last page: found (the address gains `q=`).
   **All roles** filter and **Any status** filter narrow the list on the server and go back to page 1. The status
   filter shows counts. The "No PIN yet" pill, photos, status pills and row menus are as before. A profile opened
   from a link (`?open=<id>`) opens even when the person isn't on the page.
2. Tunde → **Staff** → **Rota**: unchanged (it still shows everyone).
3. Tunde → **Roles & permissions**: each role card shows how many hold it. **Who holds it** opens Staff access
   filtered to that role. **Staff access**: pager, search (name, email or phone), the "· you" row, row actions.
4. **Give a role** (no row chosen): type part of a name in **Find a person**; the Person list fills with up to 10
   matches from the server. Pick one, a role, a level: Give role works as before.
5. Godwin → **Staff**: tabs All / Active / Invited / Paused or suspended with counts from the server, the hotel
   filter, search (name, email or phone), pager. A person working at two hotels shows on two rows (the count is
   people). **Export** downloads every row of the filter, not just the page.
6. Godwin → **Roles & permissions** and **Users**: as above.
7. Widths: each screen at 1512 and 1280 wide: no sideways scroll.

## Known limits

- Income by desk is by payment day; the outlet's "paid at the outlet" is by the day the order settled. They differ
  only when an order is paid in parts on different days.
- When fnb can't be reached as a payment is taken, that payment counts for the payer's desk.
- The staff pickers in forms (housekeeping assignment, rota and cover, till handover, lost & found, departments,
  messaging) still read the hotel's whole people list; only "Give a role" searches the server.
- Owner Staff: a page holds 25 people, which can be a few more rows when people work at several hotels. Sorting is by
  name and last sign-in only.
