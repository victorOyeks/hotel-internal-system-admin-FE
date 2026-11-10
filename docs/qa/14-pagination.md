# QA script · Server-side pagination (staging)

## Purpose

This script tests that every list that grows without limit is now read one page at a time from the server:
payments, bookings, guests, notifications, the Inbox, approvals, expenses, night audits, store requests,
purchase orders, deliveries, stock counts, work orders, laundry orders, linen batches, lost & found,
organizations (with their stays and invoices), the owner's users, and in the admin portal businesses,
onboarding and the marketer's referrals and commissions. On every one you check the pager, that the page and
filters stay in the address across a reload and Back, that tab counts and cards do not change between pages,
that a search finds rows that were not on the first page, and that an export holds every row. Nothing here
changes data except section 0, which adds a few test rows named "QA PG …".

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/pagination.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Front office | `victor@royalsuites.ng` |
| Finance | `femi@royalsuites.ng` |
| Inventory | `jide@royalsuites.ng` |
| Maintenance | `chinedu@royalsuites.ng` |
| Laundry | `lola@royalsuites.ng` |
| Housekeeping | `grace@royalsuites.ng` |
| Kitchen | `mariam@royalsuites.ng` |
| Bar | `segun@royalsuites.ng` |
| Owner | `godwin@royalsuites.ng` |
| Super admin (admin portal) | `amoria@hospio360.com` |

## How every paged list behaves

Check these on each screen below; the sections only list what is particular to a screen.

1. **Pager.** Under the table: "Showing 1–25 of N" and the page numbers. With more than 25 rows, click **2**:
   it reads "Showing 26–50 of N" (or 26–N), the first row is the 26th, and the address gains `page=2`.
2. **Reload and Back.** Reload on page 2: still page 2. Press the browser's Back: page 1 again.
3. **Counts stay.** Tab counts, cards and totals above the list are the same on page 1 and page 2.
4. **Filters go back to page 1.** On page 2, pick a tab or filter, type in the search or change the dates: the
   address loses `page` and the list starts at row 1. The search waits until you stop typing.
5. **Search is on the server.** Search for a name you can only see on the last page: it is found.
6. **Empty states.** A search that matches nothing reads **No matches** with **Clear filters**; Clear filters
   brings every row back. A list with nothing at all reads its own empty message.
7. **Export.** Where there is an Export button, the file holds every row of the filters (N lines plus the
   header), not just the 25 on screen.
8. **Fit.** At a 1280px wide window nothing is cut off and the page does not scroll sideways.
9. **API log.** The **API** button (bottom left) shows each list read with `page=` and `size=25`; no red lines.

## 0 · Test data (once)

Grace (Housekeeping) asks the store six times (Store → New request, any item, note "QA PG request 1" … "6") and
raises eight work orders (Repairs → Report, area "QA PG Area 1" … "8", title "QA PG work order 1" … "8"). With
these, Requests and Work orders have more than 25 rows. Notifications, approvals and expenses already have more.

## 1 · Payments

- **Tunde · Payments.** All payments: the cards (Taken today, Needs a look) and the tab counts come from the
  server and do not change between pages. Refunds and Disputes tabs page on their own (`refundsPage`,
  `disputesPage`) and show the guest's name on each refund. Export from page 2 holds every payment of the
  filters. Open a payment from a link (`?open=` with an id from page 4): its panel opens.
- **Victor · Payments.** Tabs Today, Taken by me, To verify, All: each count stays the same whichever tab is open.
- **Segun, Mariam, Lola · Payments.** "My payments": only their own; the "Taken today" card is today's money.
- **Godwin · Payments.** All hotels: one list across hotels; pick one hotel (`?hotel=`): the list and totals are
  that hotel's, page 1. All hotels' total equals the sum of each hotel's.

## 2 · Bookings and guests

- **Victor · Bookings.** Arrivals, Departures, In-house, Upcoming, Past: counts from the server. Past has more
  than 25 rows: page through it. New booking → the guest picker searches as you type (a guest not among the
  newest is found).
- **Tunde · Bookings.** The same plus Export (every booking of the tab).
- **Victor · Guests.** 160+ guests over seven pages; In-house and Repeat tabs; search by phone finds the guest.
- **Godwin · Bookings.** As for payments: All hotels or one hotel, totals over the whole range.

## 3 · Notifications, Inbox, approvals

- **Tunde · Notifications** (bell → See all). All and Unread tabs with counts; 70+ rows over three pages. The
  bell's number matches the Unread count.
- **Segun · Inbox** and **Godwin · Messaging.** The threads list pages and searches; Godwin's hotel filter
  narrows it on the server.
- **Tunde · Approvals.** Waiting, With the owner, Decided: counts and money from the server; Decided has more
  than 25. Sorting by amount or date reorders the whole list, not just the page.

## 4 · Finance

- **Femi · Expenses.** Tabs Needs approval, Questions, Paid, Requests with counts; newest date first. Export holds
  every expense of the tab. Recorded total says it covers 90 days.
- **Femi · Night audit.** Past audits page. The checklist shows no Bookings or Folios links for Finance (no 404s in
  the API log).
- **Tunde · Financials.** Expenses and Spend requests tabs page with a category filter and search.

## 5 · Stores

- **Jide · Requests.** 28+ requests over two pages; the status tabs count over everything; search "QA PG" finds
  all six test requests.
- **Jide · Purchase orders, Deliveries, Stock counts.** Pager, tabs and search; an order opened from a supplier's
  panel opens even when it is not on the page. Deliveries shows "N deliveries · ₦X received" over every page.
- **Grace, Lola, Chinedu · Store.** The 10 latest requests with "N in all" and the waiting count.

## 6 · Work orders, laundry, lost & found

- **Chinedu · Work orders.** Open work orders stay on the board; the Done tab pages with its own search.
- **Lola · Jobs.** The board shows open orders; All orders pages and searches. **Linen:** open batches stay;
  All batches pages; Written off covers every batch.
- **Grace · Lost & found.** Tabs per status with counts and a search.

## 7 · Organizations and people

- **Tunde, Femi · Organizations.** The accounts table with search, status and sort; the cards come from the hotel
  overview. Open an account: invoices (`invPage`) and stays (`staysPage`) page separately.
- **Godwin · Users.** Search, status filter and sort; the cards count everyone.

## 8 · Admin portal (Amoria)

- **Businesses.** 75 businesses over three pages (before, everything after the 100th was hidden); stage tabs with
  counts; search.
- **Onboarding.** Each column pages on its own (`progressPage`, `readyPage`, `donePage`).
- **Marketers.** Referrals and commissions page; tabs and money from the server.
- **Fees.** The open statements and this month's figures include every statement (more than 100 work).

