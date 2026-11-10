# QA script · H.M.S admin portal and marketer portal (staging)

The platform admin side wired end to end: dashboard, admin team, fees and billing, payments, support, marketers,
changes by H.M.S, settings, the business detail tabs, and the marketer portal. Everything in this script writes to
the real staging database and shows up for every admin, so name what you create after yourself ("QA Ada …").

- Admin portal: https://admin-staging.hospio360.com · hotel app: https://web-staging.hospio360.com · API:
  https://api-staging.hospio360.com
- Accounts (password `Hospio123!`): super admin `amoria@hospio360.com`, support `kola@hospio360.com`, finance admin
  `tobi@hospio360.com`, marketer `ese@hospio360.com`. The seeded business is Royal Suites Ltd (owner
  `godwin@royalsuites.ng`, 4 hotels).
- Live: every admin screen reads platform-service, payment-service, identity and tenant; every button writes to them.
  Nothing on these screens is sample data any more.
- Emails are sent for real, to the address on the record; SMS and WhatsApp are "coming soon". Whenever the platform
  sends something (an invite, a temporary password, a statement, a ticket reply), a yellow message card appears top-centre with the
  channel, the recipient, the subject and the full text, each with a Copy button. It stays until you press Close; several
  can stack. If it does not appear after one of the steps marked **(delivery)** below, that is a bug.

## Who can do what

| Action | Super admin | Support | Finance admin |
|---|---|---|---|
| See every screen | yes | yes | yes |
| Add admins, change roles, pause, reset passwords (Admin team) | yes | read only | read only |
| Record fee payments, send statements, generate statements, fee models | yes | read only | yes |
| Run settlements, payout batches, mark paid, fail, retry | yes | read only | yes |
| Tickets: open, assign, priority, comment, resolve, reopen | yes | yes | yes |
| Marketers: invite, approve, change share, end; referral stages | yes | yes | read only |
| Pay commissions (Commissions tab) | yes | hidden | yes |
| Undo a change by H.M.S | yes | yes | no |
| Save platform settings | yes | read only | read only |
| View as owner (support access) | yes | yes | yes |

Sign in as each account once and check the buttons match the table (the read-only screens show a grey lock note).

## 1 · Dashboard (any admin)

1. Sign in as `amoria@hospio360.com` → "Hello Amoria". The eight tiles are real: businesses by stage, hotels and rooms,
   MRR (this month's statements), fees due with an overdue pill, open tickets, at risk, health buckets.
2. The Pipeline bars add up to the total number of businesses; clicking a stage opens Businesses filtered on it.
3. System alerts: if any are open, **Dismiss** removes the row at once and it is gone after a refresh. "Open" goes to the
   business.
4. "Changes by H.M.S" and "Recent activity" show the latest rows from the Changes screen; "All changes" opens it.

## 2 · Admin team (as super admin)

1. Admin team → the H.M.S staff from identity (Amoria, Kola, Tobi …) with role, 2-step and last sign-in.
2. **Add an admin**: full name, a new `qa.admin.<you>@example.com`, role Support → "Add admin". The panel turns into the
   invite card with the temporary password and invite link (Copy buttons) **(delivery)**. Refresh → the person is listed
   as "invited".
3. Row menu → **Reset password** → a modal with a new temporary password **(delivery)**.
4. Row menu → **Resend invite** (only on invited people) → invite card again **(delivery)**.
5. Row menu → **Change role** → Finance admin → "Save role" → the pill changes; refresh → it stays. Change it back.
6. Row menu → **Pause access** → status "paused"; **Resume access** → "active".
7. Row menu → **Remove from team** → the row disappears; the account can no longer open the portal.
8. Sign in as `kola@hospio360.com` → the screen is read only, no "Add an admin", no row menus.

## 3 · Fees & billing (as finance admin `tobi@hospio360.com`)

1. Fees & billing → statements paged from the server; tabs All / Due / Part paid / Overdue / Paid and the month and
   business filters change the URL and the list. The tiles: due now, overdue, collected this month, MRR.
2. **Generate this month** → leave "Every live business" → Generate → the result shows created / skipped counts and
   notes. Running it again creates 0 and skips every business already covered.
3. Click a statement → the panel loads its lines (per hotel) and payments. **Record payment**: an amount, date and
   reference → "Record ₦…" → the paid amount and balance update, the status becomes Part paid or Paid, the payment is
   listed. Refresh → it stays.
4. **Send statement** → a toast, the subtitle shows "sent …" and the statement text appears **(delivery)**.
5. **Fee models** → choose Royal Suites Ltd → the rules so far load → pick "% of guest payments", 2, applies from the
   1st of next month → "Save model". Open it again → the new rule is listed.
6. As `kola@hospio360.com` the buttons are hidden and the lock note says Finance admin does these.

## 4 · Payments (as finance admin)

1. Payments → tabs Settlements / Payout batches / Failed payouts / Payments. Filters (status, business, dates) change
   the URL and the lists; the pager shows "Showing x–y of n".
2. **Run settlements for yesterday** → a toast with created and skipped; the Settlements tab lists one row per business
   and provider for yesterday (0 created is right when no card or transfer payment was approved yesterday — make one
   in the hotel app first if you need rows).
3. Click a settlement → the breakdown panel (gross, provider fee, H.M.S share, to the hotel).
4. **Create payout batch** → "All pending settlements" → Create → the batch opens: ref `PB-YYYY-NNN`, status
   processing, the settlements in it. (With no pending settlements the server answers that there is nothing to pay out.)
5. In the batch: **Bank bounced it** on one settlement, a reason and a bank label → the settlement turns failed, the batch
   part failed, and the row appears under Failed payouts.
6. **Mark paid** with a reference and date → the batch is paid, the settlements settled.
7. Failed payouts → **Retry** → attempts go up; **Resolve** → the row leaves the list.
8. Payments tab → the cross-business list of guest payments with status pills (read only).
9. As `kola@hospio360.com`: everything is visible, the money buttons are gone.

## 5 · Support (any admin)

1. Support → open alerts on the left (Dismiss works; "Ticket" opens a new ticket pre-filled with the business and
   title). Tickets on the right, paged from the server; tabs Waiting on us / In progress / Resolved / All; filters by
   priority, business, assignee; the search box filters on the server after a short pause.
2. **New ticket** → Royal Suites Ltd → a hotel appears as an optional pick → subject "QA <you> printer offline",
   details, priority High → Create → the panel opens on the new ticket.
3. In the panel: **Assigned to** Kola → status becomes In progress. **Priority** Normal → pill changes.
4. Reply "We are looking into it" (Internal note off) → Send reply → the comment appears and the email to the owner
   is shown **(delivery)**. Toggle **Internal note** on, write a note → Add note → the comment shows a lock pill and
   there is no delivery card.
5. Write what fixed it → **Resolve** → status Resolved, the footer shows the resolution **(delivery)**.
6. **Reopen** → status Waiting on us again. Refresh → everything persisted.

## 6 · Marketers (as super admin; commissions tab as finance admin too)

1. Marketers → Ese Okoro from the seed (active, 20% for 24 months, code `HM-ESE001`).
2. **Invite a marketer** → name, `qa.marketer.<you>@example.com`, phone → Send invite → the invite card with the
   temporary password, invite link and referral code **(delivery)**. The new row is Pending.
3. Row menu → **Approve marketer** → Active. **Change share** → 25% / 12 months → Save → the row shows it.
4. Open Ese → the panel loads agreements, referrals (each with a stage select) and the ledger. Move a referral to
   Contacted → the pill changes; refresh → it stays.
5. Referrals tab → the board by stage; moving a card's stage works the same way.
6. Commissions tab (finance admin or super admin): filter Due → **Pay** → reference and date → the line becomes Paid
   with the reference shown. (No lines yet means no referred business has paid a fee this month.)
7. Row menu → **End agreement** → Ended; **Reactivate** → Active again.

## 7 · Changes by H.M.S (any admin)

1. Changes → the paged list with business filter; each row shows the reason and who made it. Rows inside the 7-day
   window show **Undo · Nd left** (Support and Super admin only).
2. Undo one → confirm → it shows "undone"; the business's owner sees it in their activity log.
3. Admin activity tab → the platform team's actions from the activity log.

## 8 · Settings (as super admin, then as support)

1. Settings → General: change the support WhatsApp number → "Save changes" (enabled only once something changed) →
   toast; refresh → it stays. Put it back.
2. Fee defaults → change grace days → Save. Marketer defaults → Save. Security → toggle 2-step → Save.
3. Integrations → database, Kafka and the payment provider are connected; WhatsApp, email, SMS and KYC are "not
   configured" with the note that messages are shown on screen. **Refresh** re-reads them.
4. As `kola@hospio360.com` every field is disabled and there is no Save.

## 9 · Business detail tabs (any admin)

Open Businesses → Royal Suites Ltd. The business page carries the strip Usage · Money · Support · Contract &
activity on the right of its own tabs, and each hotel row has "Today →" for the hotel page. The page's Fees,
Support and Contract & activity tabs now read platform-service (statements, tickets and changes for this
business); the header's "View as owner" is the real support access (section 11); **Edit as H.M.S** (row menu ⋯)
is the business form with a required reason: change the phone → "Save change" → toast "Change saved and logged"
and the change appears at once under Contract & activity → Changes by H.M.S as "Phone changed" with the reason
and your name (and on `/activity` and on the Changes screen, with Undo). Saving without changing anything is
refused with "Nothing has changed yet".

1. `/dashboard/businesses/<id>/usage` → active users 7/30 days, bookings, payments, messages, the 8-week bars, feature
   adoption and the health score with its factors. **Recompute health** updates the score now.
2. `/money` → fee statements, settlements and guest payments for this business, each row linking to the full screen.
3. `/support` → this business's tickets; a row opens it on the Support screen; **New ticket** is pre-filled.
4. `/activity` → the contract fields, the activity log for the business, changes by H.M.S (undo), and "Viewed as owner".
5. `/hotels/<hotelId>` → today for one hotel: occupancy, arrivals, departures, open folios, payments today, manager.
6. **View as owner** (on the activity tab and in the business page header): see section 11.

## 11 · View as owner (support access, any admin)

1. On a business page (or its Contract & activity tab) → **View as owner** → a reason of at least 8 characters and a
   time box (15, 30 or 60 minutes) → "Open as owner" → a new tab opens the hotel app at `/auth/support?token=…`,
   shows "Opening the hotel app as the owner…" for a moment and lands on the owner dashboard.
2. An orange bar is fixed across the top: **"Viewing as H.M.S support · read only · ends at HH:MM"** (the end of the
   time box) with a **Leave** button. The sidebar and the page sit below it. Hotels, Users, Settings and the rest
   render as the owner sees them.
3. Try to save something (Settings → Company → change the address → Save) → the toast reads **"Read-only support
   access cannot change anything"**; nothing changes.
4. Back in the admin portal the grant appears under Contract & activity → "Viewed as owner" with your name, the reason
   and the end time; the owner sees the visit in their activity log as "H.M.S · <your name>".
5. **Leave** signs the tab out and returns to the hotel app's sign-in. Opening the same link again after the time box
   (or any mangled token) shows "This support link has expired. Ask for a new one from the admin portal."
6. If the browser already held an owner or manager session in that profile, the support link replaces it with the
   read-only view; sign in again afterwards.

## 10 · Marketer portal (as `ese@hospio360.com`)

1. Sign in → "Hello Ese" with real totals; the referral link carries her code (`…/sign-up?ref=HM-ESE001`) and Copy
   copies it.
2. My businesses → the businesses she brought (empty until a referred business goes live).
3. Refer a hotel → hotel name "QA <you> Suites", owner, phone, city → Send referral → it appears under "Your referrals"
   as Lead; on the admin side it is on the Marketers → Referrals board.
4. Commissions → Bank details → bank, account number, name → Save → the warning about missing bank details goes away.
   **Download statement** → pick a month → a `hms-commissions-<month>.txt` file downloads with the month's lines.

