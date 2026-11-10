# QA script · Bar and kitchen sales history (staging)

## Purpose

This script tests the sales history of the bar and the kitchen from the hotel app: the **Sales** screen in the
bar and kitchen menus (with the count of unpaid sales on it), the sale panel that opens from Sales and from
**Recent sales** on Bar today and Kitchen orders, collecting a sale left unpaid (by payment, part payment or a
charge to a room), cancelling one, and the all-outlets view the manager, owner and finance use. The most
important thing it checks: a quick bar sale left **To pay** can now be found and collected. Everything you do
writes to the shared staging database and shows up for every account. Run the sections in order; later sections
use what earlier ones created.

## Links

- Hotel app: https://web-staging.hospio360.com
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/restaurant-bar.md` → **Sales history** in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email |
|---|---|---|
| Bar (Full access: bar lead) | Segun Ajayi | `segun@royalsuites.ng` |
| Kitchen (Full access: head chef) | Mariam Bello | `mariam@royalsuites.ng` |
| Kitchen (Edit access: cook) | QA Cook | `qa.cook@royalsuites.ng` |
| Manager | Tunde Bakare | `tunde@royalsuites.ng` |
| Owner | Godwin Kwin | `godwin@royalsuites.ng` |
| Finance | Femi Ojo | `femi@royalsuites.ng` |
| Front office | Victor | `victor@royalsuites.ng` |
| Housekeeping (for refusals) | Grace | `grace@royalsuites.ng` |

Use a separate browser profile (or a private window) per account so you can stay signed in as two people at once.

## What is set up

- Outlets: **Restaurant** (kitchen) and **Bar**, with their menus. Sale numbers start again every Lagos day
  (B-0001, K-0001), so the same number appears on different days.
- A guest checked in for room charges: **QA LM Guest 2120** in **A107**. If they have checked out, check in any
  QA guest from Front office and use their room instead.
- Card payments on staging go to a test POS that never answers: a card stays **processing**. Use **Cash** or
  **Bank transfer** to see a sale become Paid.
- The day is the Lagos day: a sale opened at 11:59pm belongs to that day, one opened at 12:00am to the next.

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed.
- The **API** button at the bottom left lists every call the screen made, with the answer. If something fails,
  open it and copy the failing line into your report.
- Money is in whole naira. Where a status is shown it is a word (Paid, To pay, Part paid, On a room, Cancelled,
  In progress), never a code like TO_PAY.

## What the statuses mean

| Status | When |
|---|---|
| Paid | Paid in full (or closed as complimentary, ₦0) |
| To pay | Nothing paid yet: a bar sale that is not a tab, or a kitchen ticket already served |
| Part paid | Some money taken, some still due |
| On a room | Charged to a guest's room (any part paid before stays paid) |
| Cancelled | Cancelled with a reason |
| In progress | An open tab, or a kitchen ticket not yet served |

The money tiles: **Sold** is every sale not cancelled; it splits exactly into **Paid** + **Unpaid** + **On
rooms**. **Unpaid** includes open tabs and tickets still being cooked. Cancelled sales are counted apart.

## 1 · An unpaid quick sale (Segun)

1. **Do:** sign in as Segun → Bar today → **New sale** → 2 Coca-Cola → How they pay **Pay now** → **Take
   payment** → close the payment panel without paying (the X). **Expect:** the sale is on **Recent sales** as
   **To pay**, and the **Sales** item in the menu shows an amber count one higher than before.
2. **Do:** tap that row in Recent sales. **Expect:** a side panel "B-00xx · Bar", subtitle "Takeaway · Today
   h:mm". It shows **To pay**, "Opened by Segun Ajayi", Items "2 × Coca-Cola ₦1,600 · ₦800 each", the totals
   (Subtotal, Tax, **Total**, Paid so far ₦0, **Balance** ₦1,600 in red), a Timeline with **Opened**, and three
   buttons: **Cancel sale**, **Charge to room**, **Take payment**.
3. **Do:** **Take payment** → Cash → **Count cash** → Cash received = the amount due → **Cash received** →
   **Skip receipt** → **Back to the orders**. **Expect:** back on the sale: "Paid", Balance ₦0, "Nothing left to
   pay", Payment "Cash · Taken by Segun Ajayi · Today h:mm", Timeline "Opened · Paid · Closed" with names. Close
   it: the Recent sales row now says **Paid** and the menu count is back down. The page stays clickable.
4. **Do:** on Recent sales tap **All sales →**. **Expect:** the Sales screen (section 3).

## 2 · Part pay, charge to room, cancel (Segun)

1. **Do:** make another unpaid sale of 3 Coca-Cola (₦2,400). On **Sales** tap its row → **Take payment** → set
   **Amount** to 1,000 → Cash → finish as above. **Expect:** **Part paid**, Paid so far ₦1,000, Balance ₦1,400; the
   button now reads **Collect the balance**; **Cancel sale** is gone and a note says "Part paid: collect the
   balance. Cancelling needs the payment refunded first".
2. **Do:** **Collect the balance** → Bank transfer → **Show transfer details** → **I've confirmed the
   transfer** → **Skip receipt** → **Back to the orders**. **Expect:** Paid; two payments (Cash ₦1,000, Transfer
   ₦1,400); the list row shows "Cash + Transfer".
3. **Do:** make an unpaid sale, open it → **Charge to room** → Hotel guest **A107 · QA LM Guest 2120**.
   **Expect:** "What happens: ₦… goes on QA LM Guest 2120's folio". **Charge to room** → **Expect:** "₦… charged to
   room A107"; the sale shows **Room A107**, a Payment line "Charged to room A107 · QA LM Guest 2120 · By Segun
   Ajayi · collected at check-out". As Victor, the guest's folio has a line "Bar · B-00xx" for exactly the sale
   total.
4. **Do:** part pay ₦500 on a new sale of 2 Coca-Cola (₦1,600), then **Charge to room** A107. **Expect:** the
   panel says "₦1,100 goes on … folio (the part already paid stays paid)"; afterwards On a room, Paid so far ₦500,
   On the room ₦1,100. The folio line reads "Bar · B-00xx (balance)" for ₦1,100, not ₦1,600.
5. **Do:** make an unpaid sale → **Cancel sale** → Reason "Guest left" → **Cancel sale**. **Expect:** "B-00xx
   cancelled"; the panel is greyed, says "Cancelled by Segun Ajayi: Guest left", has only **Close**; in the list
   the row is greyed with the amount struck through and **Cancelled**. It is not counted in Sales or Sold.
6. **Refused charge.** **Do:** as Victor check in a QA guest to a free room. As Segun open an unpaid sale →
   **Charge to room** → pick that guest but do not press the button yet. As Victor check the guest out. As Segun
   press **Charge to room**. **Expect:** red "Can't charge to room A1xx: Nobody is checked in to room A1xx. Take
   payment instead." and a **Take payment instead** button that opens the payment steps. Nothing goes on any folio.
7. **Do:** add 12 different drinks to one sale and open it on a small screen (or a 1280×720 window).
   **Expect:** the items scroll; the footer with the buttons stays at the bottom, every button visible (they wrap
   to a second line when narrow).

## 3 · The Sales screen (Segun, then Mariam)

1. **Do:** as Segun open **Sales** in the menu. **Expect:** "Sales · Every bar sale …", **Export CSV** top right,
   the range row (Today · Yesterday · This week, From and To dates), My sales / Whole outlet tabs, a search box
   "Sale number, item or guest", filters **Any status**, **Any payment**, **Anyone**, five tiles (Sales, Sold, Paid,
   Unpaid, On rooms) and the list: Sale, Time, Where, Items ("3 Coca-Cola, 2 Orange juice"), Opened by, Amount (with
   the payment methods under it) and the status pill, newest first by time.
2. **Do:** add up Paid + Unpaid + On rooms. **Expect:** equals Sold. The Sales tile counts the rows that are not
   Cancelled.
3. **Paging.** **Do:** pick a range with more than 25 sales (e.g. **This week**). **Expect:** 25 rows, and under
   the table "Showing 1–25 of N" with the page buttons (previous, 1, 2, …, next). **Do:** press **2**. **Expect:**
   "Showing 26–… of N", `page=2` in the address, the first row is the 26th sale (newest first), and the tiles do
   not change between pages (they are over the whole range). **Do:** change any filter, the search or a date.
   **Expect:** back on page 1 (`page` leaves the address). **Export CSV** on page 2 still holds all N sales.
4. **Do:** **Yesterday**, then **This week**. **Expect:** the tiles and list change; Time shows the date and time
   when the range is more than one day. Pick a From in the past and a To; the "Range" pill appears.
5. **Do:** status **To pay**; then **Unpaid (to pay or part paid)**; payment **Cash**; type "coca" in the search;
   type a sale number like "b-0003"; type a guest's name. **Expect:** each narrows the list and the tiles to what
   matches. **Clear filters** brings everything back (the dates stay).
6. **Do:** search "zzz". **Expect:** "No sales match these filters" with **Clear filters**.
7. **Do:** From and To = 1 Oct 2026. **Expect:** "No sales on this day".
8. **Expect:** if any sale from an earlier day still owes money, an amber bar above the tiles: "N unpaid sales
   from before <day> · ₦… still to collect · oldest <date>" with **Show them**, which shows them (status Unpaid
   from that day). Those rows have an amber background and "Earlier shift" under the pill.
9. **Do:** **Export CSV**. **Expect:** a file `sales-<from>.csv` with one row per sale in the range and the
   columns Number, Date, Time, Outlet, Seat or room, Guest, Items, Opened by, Status (in words), Total, Paid,
   Balance, Methods, Settled by, Cancel reason. It opens in Excel.
10. **Do:** sign in as Mariam → **Orders**. **Expect:** below the board a **Recent sales** card (newest 8 of the
   kitchen) whose rows open the same panel. Her **Sales** shows only the kitchen and restaurant, with the
   kitchen's unpaid count in the menu.

## 4 · Edit access (QA Cook)

1. **Do:** sign in as QA Cook → **Sales**. **Expect:** **My sales** is selected ("only the ones you opened"),
   no **Export CSV**, no **Anyone** filter.
2. **Do:** **Whole outlet**. **Expect:** everyone's kitchen sales; the **Anyone** filter appears.
3. **Do:** open a sale Mariam opened that still owes money. **Expect:** a blue note "Opened by Mariam Bello. Only
   they, someone with Full access or a manager can settle or cancel it" and only **Close**. Open one of your own:
   **Take payment**, **Charge to room** and (if nothing was sent to the kitchen) **Cancel sale**.

## 5 · All outlets (Tunde, Godwin, Femi)

1. **Do:** as Tunde → **Financials** → on the "Restaurant & bar sales today" card tap **Every sale →**.
   **Expect:** "Outlet sales" with an **Every outlet** filter, the tiles, **By outlet** and **By attendant**
   tables (Sales, Sold, Unpaid, Cancelled) and the list with the outlet under each number.
2. **Do:** add up Sold in By outlet, then in By attendant. **Expect:** both equal the Sold tile.
3. **Do:** tap an attendant's name. **Expect:** the list and tiles show only their sales and their row is
   highlighted; the By attendant table still lists everyone. Tap again (or **Clear filters**) to undo. Same for an
   outlet.
4. **Do:** open any sale. **Expect:** the same panel. On a sale that owes money Tunde gets **Take payment**
   (taken as the manager's desk), **Charge to room** and **Cancel sale** (a manager may cancel a sent order).
5. **Do:** as Godwin → Financials → **Every sale →**. **Expect:** the same view.
6. **Do:** as Femi → **Outlet sales** in the menu. **Expect:** the same view with **Export CSV**; a sale opens
   view only (no buttons but Close).

## 6 · Errors and refusals

| Who | Do | Expect |
|---|---|---|
| Anyone | Open `/dashboard/sales?from=2025-01-01` (more than 93 days) | "Sales could not be loaded" with the reason "Choose up to 93 days at a time" and **Try again**; never an empty list |
| Anyone | Pick a From more than 93 days before To | the range keeps its end and starts 93 days before; a note says so |
| Segun | Pay more than the balance (API `POST /payment/payments` with the orderId) | "Only ₦X is due on B-00xx" |
| Segun | Cancel a part-paid sale (API `POST /fnb/orders/{id}/cancel`) | "₦X is already paid on B-00xx. Collect the rest, or a manager refunds it first" |
| Segun | Charge to a room whose guest checked out | "Nobody is checked in to room A1xx"; the sale stays To pay |
| Segun | Ask for the kitchen's sales (API `GET /fnb/sales/history?outletId=<Restaurant>`) | 403 "That outlet's sales aren't yours to see" |
| Mariam | Open a bar sale (API `GET /fnb/sales/history/{bar sale id}`) | 403 "This sale belongs to another outlet" |
| QA Cook | Export (API `GET /fnb/sales/history/export`) | 403 "Exporting sales needs Full access or a manager" |
| Grace, Victor | `GET /fnb/sales/history` | 403 |
| Anyone | `status=FOO`, `method=BTC`, To before From, `size=500` | 400 with the values that work |

## Known limits

- Edit-access staff only see buttons on sales they opened; the order routes themselves keep their old rules (a tab
  is still settled by whoever is on shift on the Tabs screen).
- Choice prices on a line ("Hot +₦500") are read from today's menu, not from the moment of the sale.
- No receipt printing from the panel: there is no receipt print yet (the manager and finance can resend a
  receipt from Payments).
- A card payment that is still processing does not change the sale; when the POS approves it the sale updates (on
  staging the test POS never answers).
- The export stops at 5,000 sales; narrow the range for more.
- Recent sales shows the newest 8; older unpaid sales are on Sales (and counted in the menu).
- The count in the menu updates when a page loads or after an action; it is not live.

## How to report a bug

For anything that does not match, send:

- the account you used,
- the screen (and tab),
- the steps you took,
- what you expected (quote this script),
- what happened (the exact message),
- the time (the server logs are by time),
- a screenshot, and the failing line from the **API** button.
