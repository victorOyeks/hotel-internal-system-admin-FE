# QA script · Restaurant and bar (staging)

## Purpose

This script tests the kitchen (restaurant and room service) and the bar from the hotel app: taking an order,
the kitchen working it, the guest paying at the outlet or putting it on their room, stock drawn down, the
till, and the money showing up as outlet sales for the manager and owner. It also covers the manager's
Restaurants & tables setup and the menus. Everything you do writes to the shared staging database and shows
up for every account. Run the sections in order; later sections use what earlier ones created.

## Links

- Hotel app: https://web-staging.hospio360.com
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/restaurant-bar.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email |
|---|---|---|
| Kitchen | Mariam Bello | `mariam@royalsuites.ng` |
| Bar | Segun Ajayi | `segun@royalsuites.ng` |
| Front office | Victor Adeyemi | `victor@royalsuites.ng` |
| Manager | Tunde Bakare | `tunde@royalsuites.ng` |
| Owner | Godwin Kwin | `godwin@royalsuites.ng` |
| Finance | Femi Ojo | `femi@royalsuites.ng` |

Use a separate browser profile (or a private window) per account so you can stay signed in as two people at
once.

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed.
- Take money by **Cash** or **Bank transfer**. A card payment goes to a test terminal that never answers, so
  it stays "Processing" (the order stays "to pay" until the payment is approved). Cash is approved on the
  spot and closes the order.
- Name guests and notes with "QA " at the start so they can be found later.
- Cash needs an open till for the desk. Open the Kitchen and Bar tills first (section 8) or the cash payment
  shows as "taken with no till open" on Finance's Today.
- You need two guests checked in with an open bill (two room numbers; use the front-desk loop script to check
  them in). Call them room A and room B. One more checked-out room (room C) is used for the refusal checks.
- The **API** button at the bottom left lists every call the screen made, with the answer. If something fails,
  copy the failing line into your bug report.
- Settings used here (Hotel setup → Restaurant & bar, Taxes & currency): room charge on, tabs on, tab limit
  ₦50,000, VAT 7.5 % included in prices. Services read settings up to a minute late.
- Write down the figures Finance's Today and the manager's "Restaurant & bar sales today" show before you
  start; section 10 compares against them.

## 1 · Hotel setup: Restaurants & tables (Tunde)

1. **Do:** sign in as Tunde → Hotel setup → Restaurants & tables. **Expect:** a Restaurant (Kitchen) with 8
   tables and a Bar with 4 seats, each with "draws from Kitchen store / Bar store" and an Open pill.
2. **Do:** Add a table to the Restaurant: "QA 9", 2 seats → Save. **Expect:** "Table added"; a "QA 9 · 2 seats"
   chip appears and "in use" goes up by one.
3. **Do:** open the QA 9 chip → switch "In use" off → Save. **Expect:** the chip is dashed and says "off".
   Switch it back on.
4. **Do:** Edit the Bar → change the name to "Lobby bar" → Save. **Expect:** "Saved"; the Bar's screens now
   say Lobby bar. Change it back to "Bar".
5. **Do:** Add outlet → name "QA Terrace", kind Restaurant, store "Kitchen store", Open → Save. **Expect:**
   "Outlet added" with its store shown. Edit it → switch Open off → Save: the pill says Closed.
6. **Negative:** sign in as Mariam and open Hotel setup (type `/dashboard/hotel-setup`). **Expect:** the kitchen
   has no Hotel setup screen; she cannot add or edit outlets.
7. **Check:** the kitchen's New order table list (section 2) shows "QA 9" only while it is switched on.

## 2 · Kitchen: new order, board and ticket (Mariam)

1. **Do:** sign in as Mariam → Orders → New order. **Expect:** Dine-in selected, a Table list from step 1
   (not a fixed list), the menu grouped by category, "Pay after" selected.
2. **Do:** Dine-in, Table 4, name "QA Dine", add "Jollof rice & chicken" (a choices window opens: choose
   Grilled) and "Chapman". **Expect:** the cart shows the choice under the dish; the footer shows the total
   (prices already include VAT).
3. **Do:** Send to kitchen. **Expect:** "Sent to the kitchen"; the order is in the **Cooking** column with a
   number like `K-0001` (numbers run per outlet per day).
4. **Do:** open the ticket. **Expect:** each line with its choice, a Ready button per line, and Subtotal,
   "VAT 7.5 % (included)" and Total. Total = the sum of the line prices; Subtotal + VAT = Total.
5. **Do:** tap Ready on the dish only. **Expect:** that line turns "ready"; the order stays in Cooking. Tap
   Ready on the drink. **Expect:** the order moves to **Ready to serve** when every line is ready.
6. **Do:** All served (or Served on the card). **Expect:** the order is in **Served** with "to pay".
7. **Do:** New order → Room service → pick room A → add one dish → Send to kitchen. **Expect:** a room
   service card titled "Room A" in Cooking. Do not pick a room: **Expect:** Send to kitchen stays disabled.
8. **Do:** New order → Takeaway → name "QA Take" → one item → Send. **Expect:** card titled "Takeaway".
9. **Do:** open a Cooking ticket → the X beside a line → reason "QA changed mind" → Cancel item. **Expect:**
   "Item cancelled"; the line is struck through and the total is worked out again (lower by that line).
   Leave the reason empty: **Expect:** the Cancel button is disabled.
10. **Do:** open the Takeaway ticket → Cancel order → reason "QA test" → Cancel order. **Expect:** "Order
    cancelled"; it leaves the board.
11. **Negative:** a sold-out dish (section 6) cannot be added: it is greyed out and says "Sold out".
12. **Check:** as Segun, Bar → Open tabs. **Expect:** no kitchen orders there (the bar sees only its own
    outlet).

## 3 · Charge to room, and why it can't (Mariam)

1. **Do:** open the Served Table 4 order → Charge to room → pick room A → Charge to room. **Expect:** "₦… charged
   to room A"; Sale done shows the amount and "Charged to room A"; the ticket says "Charged to room A · on the
   guest's folio".
2. **Do:** sign in as Victor → Folios → room A's folio. **Expect:** a restaurant charge for the same amount
   (the order total) as a charge line; the folio balance went up by that amount. (Folio posting can take a few
   seconds; reload once.)
3. **Do:** as Mariam, New order → Dine-in → one dish → Payment: Charge to room → pick room C (checked out) →
   Send & charge to room. **Expect:** the order is sent, then a red note on its ticket: "Can't charge to room
   C: Nobody is checked in to room C" (or "Room C has no open bill"). The order is on the board, not on any
   folio.
4. **Do:** on that ticket → Take payment instead (section 4). **Expect:** it can still be paid normally.
5. **Negative:** ask Tunde to switch off "Guests can charge to their room" (Hotel setup → Restaurant & bar), wait a
   minute, reload as Mariam. **Expect:** "Charge to room" is disabled with "Switched off" and the ticket
   says it is off in Hotel setup. Switch it back on.
6. **Check:** Victor's folio for room A shows the order charge once; charging the same order again is refused
   (the Charge to room button is gone once it is settled).

## 4 · Take payment through the shared steps (Mariam)

1. **Do:** open a Served order that is not settled → Take payment. **Expect:** the same steps as the front desk
   (How is the guest paying → method → receipt → done), titled with the order number, not a timer screen.
2. **Do:** Cash → Count cash → enter the exact amount → Cash received → Skip receipt (or send one). **Expect:**
   "Payment recorded"; the done step says the cash is counted in your till; then Sale done shows the total and
   "Paid by cash".
3. **Do:** reload the Orders board. **Expect:** the order is gone from the board (the payment approved it and
   the order closed itself).
4. **Do:** New order → one item → Payment: Pay now → Send & take payment → Bank transfer → confirm → record.
   **Expect:** "Payment sent" / processing; Sale done says "is processing"; the order stays on the board as
   "to pay" until Finance matches the transfer.
5. **Do:** My payments. **Expect:** the cash payment as Approved and the transfer as Processing, both with the
   order number in "What"; "Taken today" counts only Approved.
6. **Do:** open the processing transfer → Check with provider. **Expect:** a message with the provider's
   answer, or "Processing" again. No fake approval, no amount that is always declined.
7. **Negative:** pay an amount ending in 99 (add items so the total ends in 99, or use any total). **Expect:**
   nothing special happens: there is no hidden decline rule.
8. **Check:** Mariam's Till → cash taken equals the sum of her approved cash payments for the day.

## 5 · Kitchen: menu and prices (Mariam, Tunde)

1. **Do:** as Mariam → Menu. **Expect:** items in category tabs with Sold out counted; "Off the menu" appears
   only when something is off.
2. **Do:** Mark sold out on one dish → Mark sold out. **Expect:** "… marked sold out"; the pill turns red; New
   order shows it greyed out ("Sold out") at once. Back on the menu: green again.
3. **Do:** Change price on a dish → new price → why "QA supplier" → Save price. **Expect, as Mariam (no Full
   access):** "Price change sent to the manager"; the row shows "₦… awaiting approval" and the old price stays.
4. **Do:** as Tunde → Approvals. **Expect:** a price change request with the dish, old and new price. Approve it.
   **Expect:** the dish now shows the new price on Mariam's Menu after a reload and in New order.
5. **Do:** as Tunde, Menus (manager menu) → Restaurant → Change price on the same dish back. **Expect:**
   "Price changed" at once (a manager needs no approval).
6. **Do:** Add item (Mariam or Tunde): name "QA Soup", category Mains, price 3000 → Add item. **Expect:**
   "Item added"; it is in the picker. Edit → add a group "Spice" with choices Mild (0) and Hot (+500), Must
   choose on → Save. **Expect:** the picker asks for the choice; Hot adds ₦500 to the cart estimate.
7. **Do:** Edit "QA Soup" → Recipe → Add stock used → pick an item from the kitchen store, quantity 1 → Save.
   **Expect:** it saves; reopening shows the recipe row. (Used in section 7.)
8. **Do:** Edit "QA Soup" → switch "On the menu" off → Save. **Expect:** it disappears from the picker and shows
   under the **Off the menu** tab; switch it back on.
9. **Do:** Categories → add "QA Specials" → Add. **Expect:** "Category added"; Hide it. **Expect:** it is
   struck through and leaves the picker's pills; Show brings it back.
10. **Negative:** as Mariam without Full access, add or edit an item. **Expect:** either it saves (she has
    Full access for the kitchen) or a plain refusal message from the server; no success toast without a saved
    item.

## 6 · Bar: today, quick sale, hotel-guest sale (Segun)

1. **Do:** sign in as Segun → Bar today. **Expect:** seats from the Bar's tables, "Tonight so far" with Sales,
   Open tabs, Charged to rooms and the happy hour window (5pm – 7pm) or "Now · 20 % off".
2. **Do:** New sale → a seat → two drinks → Pay now → Take payment → Cash → exact amount → record. **Expect:**
   Sale done "Paid by cash · receipt sent"; Recent sales shows it as Paid.
3. **Do:** New sale (no seat) → one drink → Charge to room → room A → Charge to room. **Expect:** Sale done
   "Charged to room A"; Recent sales shows a blue "Room A" pill.
4. **Do:** New sale → Charge to room → room C. **Expect:** a red note "Can't charge to room C: …" and the sale
   offers payment instead; nothing is on a folio.
5. **Do:** during a happy hour (or have Tunde change it, section 7) add a drink. **Expect:** a yellow "Happy
   hour on · 20 % off" line, struck-out prices with the new price, and the cart total lower. The ticket
   details later show "Happy hour −₦…" on that line and the total matches the cart estimate.
6. **Negative:** switch tabs off in Hotel setup (wait a minute). **Expect:** "Open a tab" is disabled with
   "Switched off". Switch it back on.
7. **Check:** Sales in "Tonight so far" = paid at the bar + charged to rooms (see section 10).

## 7 · Bar: tabs, menu, happy hours, stock (Segun, Tunde)

1. **Do:** New sale → a free seat → drinks → Open a tab. **Expect:** "Tab opened on …"; Open tabs counts it and
   the seat on Bar today is highlighted with the guest and the amount.
2. **Do:** Open tabs → the tab → Add drinks → add enough to pass ₦50,000 in total → Add to tab (add in
   steps if needed). **Expect:** once the total reaches the limit a red note: "Tab limit ₦50,000 reached ·
   settle or ask the manager" and the drinks are not added; the tab card says "At the limit". Anything
   under the limit is added and the total goes up.
3. **Do:** as Tunde (manager), add to the same tab. **Expect:** a manager may go over the limit (no refusal).
4. **Do:** the tab → Move → a free seat → Move. **Expect:** "Tab moved to …"; the card shows the new seat. A
   seat that has a tab is not offered.
5. **Do:** the X beside a drink → reason → Remove. **Expect:** it is struck through and the total drops.
6. **Do:** Close & pay → Cash → record. **Expect:** the tab closes (leaves Open tabs, "Closed tonight" goes up
   by one).
7. **Do:** open another tab → Charge the tab to a room instead → room A → Charge to room. **Expect:** the tab
   closes and room A's folio shows the bar charge. With room C: the red "Can't charge …" note and the tab
   stays open.
8. **Do:** Menu → Happy hours as Tunde on his Menus → Bar (or as Segun if he has Full access). **Expect:** the
   existing Mon–Fri 17:00–19:00, 20 % hour is listed; change the discount to 25 → Save happy hour. **Expect:**
   "Happy hour saved". Add a second one for today's weekday covering the current time → the Bar sale screen
   shows the happy hour now (after a reload). Switch it off when done.
9. **Do:** Bar stock → a drink → Used → quantity 1 → Record use. **Expect:** "1 … used" and the quantity drops by
   1. Write off: Wasted → reason → Write off: the quantity drops and a manager note appears on the movement
   report (Inventory).
10. **Do:** Breakage → pick a bottle, 1, "Dropped" → Record breakage. **Expect:** "Breakage recorded · manager
    told"; the quantity drops by 1.
11. **Do:** Ask the store → set a quantity → Send request. **Expect:** "Request sent to the main store"; the
    "Requests today" card goes up by one. (Inventory sees it on Requests.)
12. **Do:** End-of-night count → change one count down by 1 → Save count. **Expect:** "Count saved · variance
    sent to the manager" and the variance line under the title matches what you changed (units × unit cost).
    The levels change only when the manager approves the count (Inventory → Stock counts).
13. **Check (stock from sales):** pay an order for a dish or drink that has a recipe (section 5 step 7). After
    a minute reload the store screen. **Expect:** the recipe quantity is gone from that store once, not twice,
    and a "Running low" alert appears if it went under its minimum.

## 8 · Tills for the kitchen and the bar (Mariam, Segun)

1. **Do:** as Mariam → Till (new link in the menu). **Expect:** the same screen the front desk has, titled for
   the kitchen: Open the till with the default float.
2. **Do:** Open till → float ₦10,000 → Open. **Expect:** "Till open"; the Cash taken today list shows only
   kitchen cash payments.
3. **Do:** take a cash payment for an order (section 4). **Expect:** the till's "Should be in the drawer" goes
   up by that amount.
4. **Do:** Pay in ₦1,000 "QA float top-up" / Pay out ₦500 "QA change". **Expect:** the expected cash moves by
   +1,000 and −500 and the entries appear.
5. **Do:** same on Segun's Till; take a bar cash sale. **Expect:** the bar cash goes in the bar's till, not the
   kitchen's and not the front desk's.
6. **Negative:** Close the till without a count. **Expect:** the Close button needs the counted cash.
7. **Check:** Femi → Tills. **Expect:** a Kitchen till and a Bar till, each with its own expected cash.

## 9 · Close shift (Segun)

1. **Do:** with an open tab still on, Bar today → Close shift. **Expect:** the summary (Card, Transfer, Cash
   sales, Charged to rooms, Sales tonight) from the server, and a red "N tabs still open · settle or move
   them first"; Close shift is disabled.
2. **Do:** settle or charge every open tab, reload, Close shift again. **Expect:** the same summary; "Cash in
   the till (expected)" = the Bar till's "Should be in the drawer".
3. **Do:** Cash counted = expected − ₦500 → Close shift. **Expect:** "Short by ₦500. Finance is told" before
   you close; after: "Shift closed · till sent to Finance"; the till closes with a ₦500 variance and Femi gets
   a till-short notice.
4. **Negative:** with no till open, Close shift. **Expect:** "Your till is not open" with a link to Till; Close
   is disabled.
5. **Check:** the figures in the summary: Card + Transfer + Cash sales = paid at the outlet; paid at the outlet +
   Charged to rooms = Sales tonight (cancelled orders count in neither).

## 10 · Sales and income: numbers that must agree (Tunde, Godwin, Femi)

1. **Do:** as Tunde → Dashboard. **Expect:** a "Restaurant & bar sales today" card with each outlet's orders,
   "paid at the outlet", "on rooms" and sales, and the top sellers.
2. **Do:** Financials → Overview. **Expect:** the same card under "Money taken today".
3. **Do:** as Godwin → Dashboard and Financials → Overview. **Expect:** the same card.
4. **Do:** as Femi → Today's money. **Expect:** income by desk includes Kitchen and Bar for the cash, card and
   transfer taken; it does **not** include what was charged to rooms (that is income only when the room's
   folio is paid).

Check these at the same moment (nobody taking money in between):

- [ ] Manager "Restaurant & bar sales today" total = Kitchen sales + Bar sales (the rows under it).
- [ ] Each outlet: sales = paid at the outlet + on rooms.
- [ ] The Bar's close-shift "Sales tonight" = the Bar row on the manager's card = the Bar's "Tonight so far
      → Sales".
- [ ] Paid at the outlet (both outlets) = the Approved Kitchen and Bar payments for today on Femi's Today
      (cash + card + transfer).
- [ ] Charged to rooms = the sum of the restaurant and bar charge lines you saw on rooms' folios today.
- [ ] My payments "Taken today" (Mariam) = the Kitchen row of Femi's income by desk.
- [ ] A transfer that is still Processing is in neither "paid at the outlet" nor income yet; once Finance
      matches it, it is in both.
- [ ] Kitchen till expected = float + cash in − paid out; Bar till the same; neither contains the other's cash.
- [ ] A cancelled order or line is not in sales.
- [ ] Night audit (Tunde → Night audit): the checklist lists open tabs and unsettled orders per outlet, and
      the count equals Open tabs on the Bar plus unsettled kitchen orders.

## Known limits

- Card payments on the test terminal stay "Processing"; use cash or transfer.
- Stock is drawn when an order is settled (paid or charged to a room). A line or order cancelled after that is
  not given back automatically; the manager corrects stock in Inventory.
- A price change waiting for approval shows "awaiting approval" on that screen until you reload; after a
  reload the dish shows the old price with no pending mark (the pending request is in Approvals).
- A choice's extra price (for example Hot +₦500) is added in the cart estimate; the ticket's total is whatever
  the server priced, so check the ticket if they differ.
- The room picker lists guests who are checked in as the kitchen and bar can see them; if a role cannot read
  bookings the list is empty and room charging is not offered.
- Front office can take a room-service order in the service, but there is no room-service screen for front
  office yet; they charge to rooms from the folio.
- The night audit's "carry open tabs" choice is a manager action in the service; the app's Night audit screen
  does not have the button yet.
- Inventory's own purchasing screens (purchase orders, deliveries, counts approval, suppliers) are outside this
  script; once inventory is live they show real data or empty lists, never demo rows.
- The kitchen and bar draw on the first outlet of their kind. Hotels with several kitchens or bars switch
  between them only on the manager's Menus screen.
- Emails and SMS are not sent on staging; read the delivery notice and Notifications instead.
- Services read hotel settings at most a minute late.

## How to report a bug

For anything that does not match, send:

- the account you used,
- the screen (and tab),
- the steps you took,
- what you expected (quote this script),
- what happened (the exact message),
- the time (the server logs are by time),
- a screenshot,
- the failing line from the **API** button (method, path, status and the answer).
