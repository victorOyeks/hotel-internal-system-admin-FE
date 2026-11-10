# QA scripts: test in this order

Staging: https://web-staging.hospio360.com · admin: the admin portal on staging · password for every test account: `Hospio123!`

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
| 14 | `14-pagination.md` | Paged lists, search and filters on every growing list | Hold: Staff and Roles lists are being changed |
| 15 | `15-admin-portal.md` | H.M.S admin and marketer portals | Ready |

## Before you start

- **Emails are real.** Invites, receipts and guest messages go to the address typed. Use your own inbox, or `@hospio-qa.test` for throwaway accounts.
- **Accept invites in a private window**, not the owner's browser; accepting signs the invited person in on that browser.
- **SMS and WhatsApp show "coming soon"**: expected, not a bug. Phone codes on staging are `123456`.
- **Card payments can't complete on staging** (the test terminal never confirms). Test cash, transfer and charge to room.
- **Don't change the shared accounts** (tunde, godwin, victor, grace, segun, mariam, femi, jide): no role, password or 2-step changes. Invite your own staff for anything that changes an account.
