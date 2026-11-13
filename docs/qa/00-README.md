# QA scripts: test in this order

Staging: https://web-staging.hospio360.com · admin: the admin portal on staging · password for every test account: `Hospio123!`

**Scope.** The scripts set the order and the main flows; they are not the limit of the testing. Each area should
also be covered beyond them: positive and negative scenarios and any edge cases you find, such as boundary
values, empty or invalid input, wrong roles, another hotel's data, repeated or cancelled actions, and
refreshing or going back in the middle of a flow.

| # | Script | What it covers | Status |
|---|---|---|---|
| 01 | `01-onboarding.md` | Sign-up, phone code, the 4 setup steps, invite acceptance | Tested (29 defects closed) |
| 02 | `02-front-desk-loop.md` | Rooms, bookings, check-in/out, folios, payments | Ready |
| 03 | `03-operating-day.md` | A full hotel day across desks, tills and night audit | Ready |
| 04 | `04-restaurant-bar.md` | Kitchen and bar orders, tabs, room charges, stock drawn | Ready |
| 05 | `05-sales-history.md` | Bar/kitchen sales list, sale details, collecting unpaid sales | Ready |
| 06 | `06-shared-devices.md` | Shared tablets, PIN switching, auto-lock, device removal | Ready |
| 07 | `07-roles-permissions.md` | Giving, changing, pausing and removing roles | Ready |
| 08 | `08-inventory-stores.md` | Stores, requests, purchase orders, deliveries, counts | Ready |
| 09 | `09-laundry-maintenance.md` | Work orders, out-of-order rooms, guest laundry, linen | Ready |
| 10 | `10-manager-housekeeping-receipts.md` | Reports, activity log, price approvals, budgets, bills, lost & found, inspection, receipts | Ready |
| 11 | `11-email-messaging.md` | Real emails, guest conversations, templates | Ready |
| 12 | `12-profile.md` | Profile, photo, password, devices, 2-step sign-in, email settings | Ready |
| 13 | `13-owner-portal.md` | Owner screens across several hotels | Ready |
| 14 | `14-pagination.md` | Paged lists, search and filters on every growing list | Ready (Staff and Roles lists: see 16) |
| 15 | `15-admin-portal.md` | Hospio360 admin and marketer portals | Ready |
| 16 | `16-small-fixes-1.md` | Bar/kitchen income by outlet, organizations, delivery-log search, owner PIN actions, Inbox for every role, paged Staff and Roles lists | Ready |
| 17 | `17-admin-onboarding.md` | Admin back-office onboarding: Set up a business, steps 1–7 field rules and duplicates, rooms (overlaps, one price per type, paste, edit and delete), data kept on Back, the manager's Choose your password | Ready |
| 18 | `18-guest-message-billing.md` | Guest messages as a paid service: what is charged, on/off, prices (default and per hotel), opt-in at onboarding, monthly invoice, Paystack payment, overdue and suspension | Ready |
| 19 | `19-room-note-def-053.md` | DEF-053 retest: the room's board note is added, changed and removed from the front desk and stays removed | Ready |
| 20 | `20-concurrency-and-scale.md` | Two people at once (check-in, folio money, card retry, bar orders, stock, tills, refunds) done once with correct totals; busy screens with a lot of data | Ready |

## Before you start

- **Every change must show without reloading.** After you save, add, delete or change anything, the screen updates on
  its own: the panel, the list, counts and badges elsewhere on the page. If a change only appears after you reload the
  page, log it as a defect (say which screen and which action).

- **Emails are real.** Invites, receipts and guest messages go to the address typed. Use your own inbox, or `@hospio-qa.test` for throwaway accounts.
- **Accept invites in a private window**, not the owner's browser; accepting signs the invited person in on that browser.
- **SMS and WhatsApp are live, but staging texts only allow-listed numbers**; other numbers show "Held back: not on this environment's allow-list" (expected). Phone codes on staging are `123456`.
- **Card payments can't complete on staging** (the test terminal never confirms). Test cash, transfer and charge to room.
- **Don't change the shared accounts** (tunde, godwin, victor, grace, segun, mariam, femi, jide): no role, password or 2-step changes. Invite your own staff for anything that changes an account.
