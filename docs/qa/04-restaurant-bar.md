# QA script · Restaurant and bar (staging)

## Purpose

This script tests the kitchen (restaurant and room service), the bar and front office's room service from the
hotel app: taking an order, the kitchen working it, the guest paying at the outlet or putting it on their
room, stock drawn down, the tills, and the money showing up as outlet sales for the manager, the owner and
finance, through to the night audit. It also covers the manager's Restaurants & tables setup, the Restaurant &
bar settings and the menus. Everything you do writes to the shared staging database and shows up for every
account. Run the sections in order; later sections use what earlier ones created.

## Links

- Hotel app: https://web-staging.hospio360.com
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/restaurant-bar.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email |
|---|---|---|
| Kitchen (Full access: head chef) | Mariam Bello | `mariam@royalsuites.ng` |
| Kitchen (Edit access: cook) | QA Cook | `qa.cook@royalsuites.ng` |
| Bar (Full access: bar lead) | Segun Ajayi | `segun@royalsuites.ng` |
| Front office | Victor Adeyemi | `victor@royalsuites.ng` |
| Manager | Tunde Bakare | `tunde@royalsuites.ng` |
| Owner | Godwin Kwin | `godwin@royalsuites.ng` |
| Finance | Femi Ojo | `femi@royalsuites.ng` |

Use a separate browser profile (or a private window) per account so you can stay signed in as two people at
once.

## What is set up

- **Restaurant** (kind Kitchen) with tables T1–T8 and a table "QA 9" (2 seats), drawing from **Kitchen store**.
- **Bar** with seats B1–B4, drawing from **Bar store**.
- **QA Terrace** (Restaurant, Kitchen store), switched to Closed: an outlet that takes no orders.
- 12 dishes and 12 drinks, each with a recipe (the stock one portion uses). Dishes named "QA Soup …" are test
  items with a Spice choice: Mild (+₦0) or Hot (+₦500), one must be chosen.
- Happy hour at the Bar: Mon–Fri 17:00–19:00, 20 % off every drink added in that window.
- Settings (Hotel setup → Restaurant & bar): guests can charge to their room **on**, bar tabs **on**, tab limit
  **₦50,000**. Taxes: VAT 7.5 % **included** in prices (the total is the sum of the prices; the VAT inside it
  is shown on the ticket).

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed.
- **Money:** Cash and Bank transfer are both approved on the spot (a transfer is recorded once the desk has
  seen it land; Finance matches it to the bank line later) and close the order at once. A **card** goes to a
  test terminal that never answers, so it stays "Processing" and the order stays "to pay"; it does not stop
  you charging the order to a room or taking cash instead.
- **Guests:** you need two guests checked in with an open bill (call their rooms **room A** and **room B**).
  As Victor: Bookings → New booking → today, 2 nights, Pay at check-out → Check in (room picked, ID seen). Name
  them "QA <your name> A" and "QA <your name> B".
- **Tills:** cash needs an open till for the desk. Open the Kitchen and Bar tills first (section 11 step 1).
  Cash taken with no till open still counts, but shows on Finance's Today and the manager's night audit as
  "cash taken with no till open".
- The **API** button at the bottom left lists every call the screen made, with the answer.
- Name guests and notes with "QA " at the start so they can be found later.
- Services read hotel settings up to a minute late: after changing a setting wait a minute, then reload.
- Write down the figures on Tunde's "Restaurant & bar sales today" card and Femi's Today before you start;
  section 14 compares against them.

## 1 · Hotel setup: Restaurants & tables (Tunde)

1. **Do:** sign in as Tunde → Hotel setup → Restaurants & tables. **Expect:** Bar, QA Terrace and Restaurant,
   each with "draws from Bar store / Kitchen store", an Open or Closed pill, and their tables as chips.
2. **Do:** on the Restaurant card → Add a table → "QA 10", 2 seats → Save. **Expect:** "Table added"; a
   "QA 10 · 2 seats" chip appears and "in use" goes up by one.
3. **Do:** open the QA 10 chip → switch "In use" off → Save. **Expect:** "Saved"; the chip is dashed and says
   "off"; the kitchen's New order table list no longer offers it. Switch it back on.
4. **Do:** Add outlet → name "QA Patio", kind Restaurant, store "Kitchen store", Open → Save. **Expect:** "Outlet
   added" with "draws from Kitchen store". Edit it → switch Open off → Save: the pill says Closed.
5. **Negative:** an order at a closed outlet is refused: "QA Terrace is closed" (through the API; the kitchen
   and bar screens work their own open outlet).
6. **Negative:** sign in as Mariam and open `/dashboard/hotel-setup/restaurants`. **Expect:** "404 - Page Not
   Found"; the kitchen cannot add or edit outlets.

## 2 · Kitchen: new order, board and ticket (Mariam)

1. **Do:** sign in as Mariam → Orders. **Expect:** the board (New · Cooking · Ready to serve · Served) loads
   with no error; each card shows where (Table, Room or Takeaway), the minutes since it was opened and the
   dishes. → New order. **Expect:** Dine-in selected, a Table list from section 1, the menu grouped by
   category, "Pay after" selected.
2. **Do:** Dine-in, Table T3, name "QA Dine", add a "QA Soup" dish (a choices window opens: pick **Hot** → Add
   to order) and "Chips". **Expect:** the cart shows "Hot" under the soup and the total includes the +₦500
   (QA Soup ₦3,000 + ₦500 + Chips ₦3,000 = ₦6,500).
3. **Do:** Send to kitchen. **Expect:** "Sent to the kitchen"; the order is in **Cooking** with a number like
   `K-0001` (numbers run per outlet per day).
4. **Do:** open the ticket. **Expect:** each line with its choice and a Ready button, then Subtotal, "VAT 7.5 %
   (included)" and Total **₦6,500** (the server charges the Hot choice too). Subtotal + VAT = Total.
5. **Do:** tap Ready on the soup only. **Expect:** that line turns "ready"; the order stays in Cooking. Tap
   Ready on the chips. **Expect:** the order moves to **Ready to serve**; whoever opened it gets "Order K-… is
   ready" in Notifications.
6. **Do:** Served. **Expect:** the order is in **Served** with "to pay".
7. **Do:** New order → **Room service** → pick room A → add one dish. Without a room, Send to kitchen stays
   disabled. Send. **Expect:** a "Room A…" card in Cooking.
8. **Do:** New order → Takeaway → name "QA Take" → one item → Send. **Expect:** a "Takeaway" card.
9. **Do:** open a Cooking ticket → the ✕ beside a line → **Expect:** the Cancel item button is disabled until
   you type a reason. Reason "QA changed mind" → Cancel item. **Expect:** "Item cancelled"; the line is struck
   through and the total drops by that line.
10. **Check:** a ticket already sent has **no Cancel order** button; it says "This order already went to the
    kitchen: take single dishes off with ✕, or ask a manager to cancel the whole order". An order still in the
    **New** column (nothing sent yet) has Cancel order: reason "QA test" → "Order cancelled", it leaves the
    board.
11. **Check:** as Segun, Tabs and Bar today show no kitchen orders (each outlet sees only its own).

## 3 · Charge to room, and when it can't (Mariam, Victor)

1. **Do:** open the Served Table T3 order (or any unsettled one) → Charge to room → pick room A → Charge to
   room. **Expect:** "₦… charged to room A…"; Sale done shows the amount and "Charged to room A…".
2. **Do:** as Victor → Folios → room A's folio. **Expect:** a line "Restaurant · K-…" for the order. The line
   shows the price before VAT and the VAT is added on the folio, so the folio balance goes up by the order's
   total (for example ₦3,000 Chips = ₦2,790.70 + ₦209.30 VAT). Reload once if it isn't there yet.
3. **Do:** charge the same order again. **Expect:** the Charge to room button is gone once it is settled
   (through the API: "This order is already settled").
4. **Negative (guest left):** New order → Room service → pick a guest → add a dish → Charge to room. Before
   pressing Send, have Victor check that guest out. Press Send & charge to room. **Expect:** a red message
   "Nobody is checked in to room …" and nothing is created (the room list only offers guests checked in when
   the screen was opened, so this is the only way to hit it on screen). For an order already on the board
   charged to a room whose bill is closed: a red note "Can't charge to room …: Room … has no open bill" on the
   ticket, and Take payment still works.
5. **Negative (switched off):** see section 12.

## 4 · Take payment through the shared steps (Mariam)

1. **Do:** open a Served order that is not settled → Take payment. **Expect:** the same steps as the front desk
   (How is the guest paying → method → receipt → done), titled with the order, not a timer screen.
2. **Do:** Cash → Count cash → enter the amount due → Cash received → Skip receipt. **Expect:** "Payment
   recorded"; Sale done shows the total and "Paid by cash".
3. **Do:** reload the board. **Expect:** the order is gone (the payment closed it). The kitchen till's "Should
   be in the drawer" went up by the order total.
4. **Do:** New order → Takeaway → one item → Payment: Pay now → Send & take payment → Bank transfer → Show
   transfer details → I've confirmed the transfer → Skip receipt. **Expect:** "Paid by bank transfer"; the
   order closes at once (it does not wait for Finance).
5. **Do:** New order → one item → Send → Take payment → Card on the POS → Send to POS. **Expect:** it stays
   "Processing" (test terminal); the order stays on the board as "to pay". Charge it to a room or take cash
   instead: both work.
6. **Do:** My payments. **Expect:** the cash and transfer as Approved and the card as Processing, each with
   the order number; "Taken today" counts only Approved.
7. **Negative:** pay an order that is already paid, or cancelled. **Expect** (through the API, the screens
   don't offer it): "Order K-… is already settled" / "Order K-… is cancelled. It can't take a payment". Paying
   more than is due: "Only ₦… is due on K-…".

## 5 · Menu and prices (Mariam, QA Cook, Tunde)

1. **Do:** as Mariam → Menu. **Expect:** items in category tabs, Sold out counted, "Off the menu" only when
   something is off; buttons Categories and Add item.
2. **Do:** an item's ⋯ → Mark sold out → Mark sold out. **Expect:** "… marked sold out"; the pill turns red;
   New order shows it greyed out with "Sold out". ⋯ → Back on the menu: green again.
3. **Do:** Add item: name "QA Soup <your initials>", category Mains, price 3000; Add a group of choices →
   Group "Spice", Must choose on, choices Mild 0 and Hot 500; Recipe → Add stock used → a kitchen store item,
   quantity 1 → Add item. **Expect:** "Item added"; reopening shows the choices and the recipe row; in New order
   the picker asks for the spice and Hot adds ₦500.
4. **Do:** Edit the item → switch "On the menu" off → Save. **Expect:** it disappears from the picker and is
   listed under **Off the menu**; switch it back on.
5. **Do:** Categories → add "QA Specials" → Add. **Expect:** "Category added". Hide it: it is struck through and
   leaves the picker's pills; Show brings it back.
6. **Do:** as **QA Cook** (Edit access) → Menu. **Expect:** no Add item, Categories or Edit item (a note says
   these need Full access or the manager); Mark sold out and Change price are there.
7. **Do:** QA Cook → Pancakes ⋯ → Change price → ₦3,800, why "QA supplier" → Save price. **Expect:** "Price change
   sent to the manager"; the row shows "₦3,800 awaiting approval" and the price stays ₦3,500.
8. **Do:** as Tunde → Approvals. **Expect:** "Change Pancakes (Restaurant) from ₦3,500 to ₦3,800: QA supplier".
   Open it → Approve. **Expect:** Pancakes is ₦3,800 on the kitchen menu and in New order (reload).
9. **Do:** as Tunde → Menus → Restaurant → Pancakes → Change price → ₦3,500. **Expect:** "Price changed" at once
   (a manager needs no approval). Mariam (Full access) also changes prices at once.
10. **Negative:** a price of 0 or below: "Enter the new price". Bar staff editing the kitchen menu, or front
    office editing any menu: refused (403 "Managing the Restaurant menu needs Full access…").

## 6 · Kitchen store (Mariam)

1. **Do:** Kitchen store. **Expect:** items on the shelf with their minimum, unit cost and an OK / Low /
   Critical pill.
2. **Do:** tap an item → Used → quantity 1 → Record use. **Expect:** "1 … used"; the quantity drops by 1.
3. **Do:** tap an item → Wasted → Reason Spoiled → Write off. **Expect:** "1 … written off · manager told"; the
   quantity drops by 1.
4. **Do:** Ask the store → pick an item from "Pick from your stock list" → quantity → Send request. **Expect:**
   "Request sent to the main store"; "Requests today" goes up by one.
5. **Negative:** another desk using this store is refused ("Using or wasting stock in the … store is for its
   team, the store or a manager"); front office is refused.

## 7 · Front office: room service (Victor)

1. **Do:** sign in as Victor → **Room service** (new in the menu). **Expect:** today's room-service orders with
   room, items, total, the kitchen's progress (New / Cooking / Ready / Delivered) and the bill (To pay / Paid /
   On room …).
2. **Do:** New room-service order → Room: room B → Restaurant → "Chips" → Payment: Charge to room → Send &
   charge to room. **Expect:** "Sent to the kitchen"; "Order sent · K-… · Room B… · Charged to room B…".
3. **Check:** as Mariam, the order is on the board in Cooking ("Room B…", opened by Victor Adeyemi); Mariam's
   Notifications show "New kitchen order K-…". Room B's folio has the line.
4. **Do:** New room-service order → room B → **Bar** → Coca-Cola → Pay now → Send & take payment → Cash.
   **Expect:** "Paid by cash"; the bar has the ticket; the cash is in the **front desk** till (Victor took it).
5. **Do:** New room-service order → Pay on delivery → Send. **Expect:** the order opens with "Not paid yet" and
   buttons Take payment and Charge to room …; either settles it.
6. **Negative:** front office cannot take a dine-in order or open a bar tab (through the API: "This order belongs
   to the Restaurant/Bar"), and sees only room-service orders.

## 8 · Bar: today, quick sale, hotel-guest sale (Segun)

1. **Do:** sign in as Segun → Bar today. **Expect:** seats from the Bar's tables (Free or the tab's guest and
   amount), "Tonight so far" (Sales, Open tabs, Charged to rooms, Happy hour 17:00 – 19:00 or "Now · 20 %
   off"), Recent sales.
2. **Do:** New sale → Seat B1 → 2 Star lager → Pay now → Take payment → Cash → amount due → record. **Expect:**
   Sale done "Paid by cash"; Recent sales shows it as Paid; Bar stock's Star lager is 2 lower.
3. **Do:** New sale → Coca-Cola → Charge to room → Hotel guest: room A → Charge to room. **Expect:** "Sale
   recorded"; Sale done "Charged to room A…" stays on screen; Recent sales shows a blue "Room A…" pill.
4. **Negative:** if the room can't take the charge (guest left / bill closed) **Expect:** a red message "Can't
   charge to room …: … Take payment instead" and the payment steps open for that sale.

## 9 · Bar: tabs (Segun, Tunde)

1. **Do:** New sale → Open a tab → Seat B2 → name "QA Tab" → 2 Heineken → Open a tab. **Expect:** "Tab opened on
   B2"; Open tabs counts it; seat B2 shows the guest and amount. A seat with a tab is not offered for another
   tab.
2. **Do:** Tabs → the tab → Add drinks → 3 × Red wine bottle → Add to tab. **Expect:** a red note "Tab limit
   ₦50,000 reached · settle or ask the manager" (the drinks that would pass the limit are not added; if some
   went on before the refusal the note says how many) and Tunde gets "Tab limit reached · Bar".
3. **Do:** as Tunde (through the API, the manager has no tab screen) add drinks over the limit. **Expect:** it is
   allowed; Segun's tab card shows "At limit" in red.
4. **Do:** the tab → Move → New seat B4 → Move. **Expect:** "Tab moved to B4".
5. **Do:** the ✕ beside a drink → reason "QA poured wrong" → Remove. **Expect:** "Removed from the tab"; it is
   struck through and the total drops.
6. **Do:** Close & pay → Cash. **Expect:** "Payment recorded"; the tab leaves Open tabs, "Closed tonight" goes up.
7. **Do:** open another tab → "Charge the tab to a room instead" → room A → Charge to room. **Expect:** "₦…
   charged to room A…"; the tab closes; room A's folio has "Bar · B-…".

## 10 · Bar: menu, happy hours, stock (Segun, Tunde)

1. **Do:** as Segun → Menu → Happy hours. **Expect:** the Mon–Fri 17:00–19:00, 20 % hour.
2. **Do (inside the window):** between 17:00 and 19:00 on a weekday, New sale → 2 Star lager. **Expect:** a yellow
   "Happy hour on · 20 % off every drink that is added now", struck-out ₦1,500 with ₦1,200, cart ₦2,400; the
   payment asks for **₦2,400** (the server priced it the same); the ticket shows "Happy hour −₦600".
   Outside the window: no banner, ₦3,000. To test outside 17:00–19:00, add a happy hour for today covering now
   (Happy hours → Add a happy hour, 20 %) and switch it off when done.
3. **Do:** Bar stock → Breakage → What: Star lager → Record breakage. **Expect:** "Breakage recorded · manager
   told"; the quantity drops by 1.
4. **Do:** End-of-night count → change one count down by 1 → Save count. **Expect:** "Count saved · variance
   sent to the manager". Levels change only when the manager approves the count (Inventory → Stock counts).
5. **Do:** Ask the store → pick an item → Send request. **Expect:** "Request sent to the main store".
6. **Check (stock from sales):** after any paid or room-charged sale, the store drops by the recipe quantities
   once (Star lager 1 per bottle, Red wine glass 0.2 bottle…). A cancelled order draws nothing.
7. **Check (low stock):** when a sale takes an item under its minimum, Tunde gets "Red wine is low · 5.00 bottles
   left in Bar store" (and the store screen shows Low / Critical).

## 11 · Tills and close shift (Mariam, Segun, Femi)

1. **Do:** as Mariam → Till → Open till → Opening float ₦10,000 → Open with ₦10,000. **Expect:** "Till open · you
   can take cash". Same for Segun.
2. **Do:** take a kitchen cash payment (section 4). **Expect:** the kitchen till's "Should be in the drawer" goes
   up by it; the bar till does not move. A bar cash sale goes in the bar till only.
3. **Do:** as Segun, with a tab still open → Bar today → Close shift. **Expect:** the summary (Card, Transfer,
   Cash sales, Charged to rooms, Sales tonight) and "1 tab still open. Settle or move them first."; Close shift
   is disabled.
4. **Do:** settle the tab, reload, Close shift. **Expect:** "Cash in the till (expected)" = the Bar till's
   "Should be in the drawer". Enter expected − ₦500. **Expect:** "Short by ₦500. Finance is told." and a "Why the
   cash is different" box; Close shift stays disabled until you write a reason. Write "QA change" → Close shift.
   **Expect:** "Shift closed · till sent to Finance"; Femi → Tills shows the bar till closed with −₦500.
5. **Negative:** with no till open, Close shift says "Your till is not open · Open it on the Till screen" and
   Close is disabled.
6. **Check:** cash taken at the kitchen or bar with no till open shows on Femi's Today and on Tunde's night audit
   as "cash was taken with no till open".

## 12 · Restaurant & bar settings (Tunde, Mariam, Segun)

1. **Do:** as Tunde → Hotel setup → Restaurant & bar → switch off "Guests can charge to their room" and "Bar tabs
   allowed" → Save changes. Wait a minute.
2. **Expect (Segun, New sale):** "Open a tab" and "Charge to room" both say "Switched off" and can't be picked.
   Through the API: "Tabs are switched off for this hotel".
3. **Expect (Mariam, any unsettled ticket):** Charge to room is disabled and the ticket says "Charging to rooms is
   switched off in Hotel setup → Restaurant & bar". Through the API: "Charging to a room is switched off for this
   hotel".
4. **Do:** set the tab limit to ₦5,000, wait a minute, add drinks past it. **Expect:** "Tab limit ₦5,000 reached".
5. **Do:** put everything back: room charge on, tabs on, ₦50,000. Wait a minute before the next section.

## 13 · Negative checks (any section)

| Try | Expect |
|---|---|
| Mariam adds to, sends or marks a **bar** order (API) | 403 "This order belongs to the Bar" |
| Segun sends or marks a **kitchen** order (API) | 403 "This order belongs to the Restaurant" |
| Victor takes a dine-in order or a tab (API) | 403 |
| Charge to a room nobody is checked in to | "Nobody is checked in to room …" |
| Charge to a room whose bill is closed | "Room … has no open bill" |
| Pay a cancelled order (API) | "Order K-… is cancelled. It can't take a payment" |
| Pay an order already paid or on a room (API) | "Order K-… is already settled" |
| Cancel a settled order | "This order is closed" / "already settled. It can't be cancelled" |
| Kitchen cancels an order already sent | not offered; API: 403 "Cancelling an order already sent needs a manager" |
| Quantity 0 or below (API) | "The quantity must be at least 1" |
| A dish with a must-choose group and no choice (API) | "Choose the spice for QA Soup …" |
| Price change to 0 or below | "Enter the new price" |
| Menu edit by QA Cook / bar staff / front office | not offered; API 403 "…needs Full access…" |
| Stock use by another desk | 403 "Using or wasting stock in the … store is for its team…" |
| Bar reads the kitchen's sales (API) | 403 |

## 14 · Sales and income: numbers that must agree (Tunde, Godwin, Femi)

1. **Do:** as Tunde → Dashboard, and Financials. **Expect:** a "Restaurant & bar sales today" card: the total,
   each outlet's orders, "paid at the outlet", "on rooms", cancelled, sales, and top sellers.
2. **Do:** as Godwin → Dashboard and Financials. **Expect:** the same card with the same figures.
3. **Do:** as Femi → Today's money. **Expect:** income by desk includes **Bar** and **Kitchen** for the cash,
   card and transfer they took; it does **not** include what was charged to rooms.

Check these at the same moment (nobody taking money in between):

- [ ] Tunde's card total = Godwin's card total = the sum of the outlet rows.
- [ ] Each outlet: sales = paid at the outlet + on rooms (cancelled orders count in neither).
- [ ] The Bar's close-shift "Sales tonight" = the Bar row on the card.
- [ ] Bar income by desk (Femi) = the Bar's "paid at the outlet".
- [ ] Kitchen income by desk = the Restaurant's "paid at the outlet" minus room-service orders front office was
      paid for (those count as front-office income).
- [ ] What went on rooms becomes income only when the folio is paid: check out a QA guest paying the folio
      (cash). **Expect:** the folio closes at ₦0 and front office income goes up by the whole folio, outlet
      lines included.
- [ ] Kitchen till expected = float + cash in − paid out; Bar till the same; neither holds the other's cash.

## 15 · Night audit (Tunde)

Royal Suites closes each business day once, so this section is easiest on a day that is not closed yet (ask for
a fresh test hotel if today is already closed: the Night audit screen then says "… is closed").

1. **Do:** leave one bar tab open → Night audit. **Expect:** check 5 "No open tabs or unsettled orders at the
   outlets" is not done: "1 open tab at the Bar · settle or move them".
2. **Do:** Close the day. **Expect:** a red note with the same sentence and "Settle them first, or carry them to
   tomorrow"; the Close the day button is disabled.
3. **Do:** switch on **Carry open tabs to tomorrow**. **Expect:** the button becomes "Close and carry the tabs".
   Press it. **Expect:** "… closed · summary sent to Godwin Kwin"; the report opens with **Restaurant & bar
   sales** (each outlet, orders, paid, on rooms, sales) and **Carried to tomorrow** listing each tab or order
   ("Bar · B-0001 · open tab · Table B2 · ₦4,000"). The tab stays open at the bar.
4. **Negative:** Femi (Finance) sees a note that a manager has to carry open tabs; through the API Finance gets
   "Only a manager can close the day with open tabs and unsettled orders". Without the carry choice the API
   answers "1 open tab at the Bar · settle or move them. Settle them, or a manager can close the day carrying
   them over".

## Known limits

- Card payments on the test terminal stay "Processing"; use cash or transfer.
- Stock is drawn when an order is settled (paid or charged to a room). A line or order cancelled after that is
  not given back automatically; the manager corrects stock in Inventory.
- The kitchen and bar work the first open outlet of their kind. Hotels with several kitchens or bars switch
  between them only on the manager's Menus screen.
- The manager has no tab screen; going over a tab limit as a manager is done through the API (or by the bar lead
  after the manager settles part of it).
- On the folio, outlet lines show the price before VAT with the VAT as its own amount; the folio total equals
  the order total.
- Room charges are refused when the outlet's guest list is out of date only at the moment of sending (the room
  list shows guests checked in when the screen was opened).
- Inventory's purchasing screens (purchase orders, deliveries, counts approval, suppliers) are outside this
  script.
- Emails are sent for real, to the address on the record. SMS and WhatsApp are not sent yet ("coming soon"). The message card at the top shows each message, marked "Email sent to …" or "Not sent · … coming soon".
- Services read hotel settings at most a minute late.

