# QA script · Inventory and stores (staging)

## Purpose

This script tests the hotel's stores from the hotel app: the main store and the outlet stores, items and their
levels, teams asking the store and the store issuing (in part or in full) or declining, moving stock between
stores, suppliers, purchase orders (with approval over the limit), deliveries against them, stock counts approved
by a manager, low stock with reorder, and what the stock is worth and what each store used. It also checks that
the kitchen and bar store screens and the stock drawn when an order is settled still work. Everything you do
writes to the shared staging database and shows up for every account. Run the sections in order; later
sections use what earlier ones created.

## Links

- Hotel app: https://web-staging.hospio360.com
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/inventory-stores.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email |
|---|---|---|
| Inventory (Full access: storekeeper) | Jide Alabi | `jide@royalsuites.ng` |
| Manager | Tunde Bakare | `tunde@royalsuites.ng` |
| Owner | Godwin Kwin | `godwin@royalsuites.ng` |
| Finance | Femi Ojo | `femi@royalsuites.ng` |
| Housekeeping | Grace | `grace@royalsuites.ng` |
| Kitchen (Full access: head chef) | Mariam Bello | `mariam@royalsuites.ng` |
| Bar (Full access: bar lead) | Segun Ajayi | `segun@royalsuites.ng` |

Use a separate browser profile (or a private window) per account so you can stay signed in as two people at
once. Jide's menu is Stores & stock, Requests, Purchase orders, Deliveries, Stock counts, Suppliers. Tunde and
Godwin open **Inventory** in their menu and get the same screens as tabs along the top.

## What is set up

- **Main store** (kind Main) holding back stock of every kitchen and bar item plus housekeeping supplies (Bath
  soap, Toilet roll, Hand towel, Detergent, Bin liners).
- **Kitchen store** and **Bar store** (used by the restaurant and the bar; selling draws from them).
- **Housekeeping store** (kind Housekeeping) added by the test run; it may already hold some soap and towels.
- Suppliers: **Lagos Fresh Foods** (food), **Ikeja Drinks Depot** (drinks), **CleanPro Supplies**
  (housekeeping, no email so orders go by SMS), plus test suppliers named "QA …".
- Approval limit for purchase orders: Hotel setup → Approval limits → **Manager expense limit** (₦200,000 on
  this hotel). At or under it an order goes straight to the supplier. Over it: raised by Jide → the manager
  approves; raised by Tunde → the owner approves; raised by Godwin → sent at once.
- Cost is the **weighted average**: a delivery re-averages the item's cost over everything held in every store.

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed.
- Purchase orders are emailed to the supplier for real. A message card at the top shows what was sent, marked
  "Email sent to …"; close it with **Close**. SMS and WhatsApp are "coming soon".
- The **API** button at the bottom left lists every call the screen made, with the answer.
- Quantities are shown with up to 2 decimals; money in naira.

## 1 · Stores & stock (Jide)

1. **Do:** sign in as Jide. **Expect:** Stores & stock opens with four tiles: Items tracked, Running low, On
   order (₦ still to arrive), Stock value. Below them a card per store with its kind and value (e.g. "Main store
   · ₦…"), its item count and a red "N low" pill when items are at or below their minimum, and an **Add a store**
   card.
2. **Do:** add up the store card values. **Expect:** they equal the Stock value tile (the tile is rounded, e.g.
   ₦4.5M).
3. **Do:** click a store card. **Expect:** the table shows only that store's items; click it again to show all.
4. **Expect:** a **Running low** card lists low items with Left, Minimum, a **Suggest** quantity (up to the
   reorder-up-to level, or twice the minimum) and the usual supplier, each with **Reorder**.
5. **Do:** click **View** on any row. **Expect:** a side panel: the level in this store, **In every store** with
   each store's quantity and value, Details (average cost, usual supplier, minimum, reorder up to) and
   **Movements** (received, moved in/out, used, wasted, corrected, counted, who and when). Close it; the page is
   clickable.
6. **Do:** **Add item** → Name "QA Pillow case <your initials>", Category Housekeeping, Unit pcs, Store Main
   store, Opening quantity 40, Minimum 10, Reorder up to 60, Unit cost 1,200 → **Add item**. **Expect:** "… added";
   its panel opens with 40 pcs in Main store and a "Received 40 pcs · Main store · Opening stock" movement.
7. **Do:** in that panel **Edit item** → Minimum 12 → **Save**. **Expect:** "… saved", Details show 12.
8. **Do:** **Correct level** → Store Main store, Actual quantity 38, Reason Breakage → **Save correction**.
   **Expect:** "Level set to 38 pcs · logged"; a red note showed "2 pcs written off · ₦2,400" before saving; a
   "Corrected" movement appears.
9. **Do:** **Move stock** → From Main store, To Housekeeping store, add "QA Pillow case …" with 5 → **Move
   stock**. **Expect:** "Moved to Housekeeping store · TRF-…"; Main store 33, Housekeeping store 5.
10. **Do:** the **Add a store** card → Name "QA Laundry store", Kind Laundry → **Add store**. **Expect:** a new card.
    Edit it (pencil) → switch **In use** off → Save. **Expect:** "QA Laundry store closed" and the card goes
    away (it held nothing).
11. **Expect:** at the bottom, **Stock used and issued** for the last 30 days: per store Received, Moved in,
    Moved out, Used, Wasted, Counts & corrections, and "Issued to teams: Housekeeping ₦… · Kitchen ₦…". Pick
    today in From and To → **Show**. **Expect:** today's figures only.

## 2 · Requests (Grace, Mariam, Jide)

1. **Do:** as Grace (Housekeeping) ask the store. Housekeeping has no ask-the-store screen yet, so use the API
   signed in as Grace: `POST /inventory/requests` `{fromTeam:"HOUSEKEEPING", storeId:"<Housekeeping store id>",
   lines:[{itemId:"90000000-0000-4000-8000-000000000021", quantity:10}, {itemId:"90000000-0000-4000-8000-000000000022",
   quantity:6}]}` (Bath soap and Toilet roll). As Mariam → Kitchen store → **Ask the store** for 5 kg Rice.
2. **Do:** as Jide → Requests. **Expect:** both under **Waiting** with team, who, what, "For store" and
   **Issue**.
3. **Do:** open Grace's request. **Expect:** "Issue from" = Main store ("Stock moves into the Housekeeping
   store"); lines show Asked, Issued so far, In store, Issue now (pre-filled with what's outstanding).
4. **Do:** set Toilet roll to 2 → **Issue**. **Expect:** "Part issued to Housekeeping · the rest stays open"; the
   request stays under Waiting as **Part issued** with "10 issued" / "2 issued". Main store soap −10 and rolls −2;
   Housekeeping store soap +10 and rolls +2.
5. **Do:** open it again → **Close the rest** → Reason "Out of rolls until Friday" → **Close the rest**.
   **Expect:** "Done · the team is told"; it moves to **Declined** as **Closed short** with the reason. Grace gets
   a notification "Rest of your request won't come" with the reason.
6. **Do:** open Mariam's rice request → **Issue** (all). **Expect:** "Issued to Kitchen"; Kitchen store rice +5.
   On Mariam's Kitchen store screen, **Your requests to the store** shows it as Issued.
7. **Do:** have Grace ask for 2 Hand towels with no store; as Jide **Decline** → Reason "Use the laundry stock".
   **Expect:** Declined; Grace's notification "Request declined" carries the reason.

## 3 · Suppliers (Jide)

1. **Do:** Suppliers. **Expect:** In use / Stopped tabs; each supplier with contact, terms, items, open orders,
   received in the last 30 days and last order.
2. **Do:** **Add supplier** → Company "QA Linen Co <initials>", Phone `123` → **Save supplier**. **Expect:** red
   "Enter a phone number like 0803 123 4567"; the panel stays open.
3. **Do:** Phone `0803 555 0777`, Email `orders@qalinen.ng`, Terms 14 days, add "QA Pillow case …" under **Items
   they supply** → **Save supplier**. **Expect:** "… added"; its panel lists the item.
4. **Do:** **Edit** → Address "12 Allen Avenue" → Save. **Expect:** "… saved", Address shown.

## 4 · Purchase orders (Jide, Tunde, Godwin)

1. **Do:** Stores & stock → **Reorder** on a low item. **Expect:** Purchase orders opens **New purchase order**
   with that item and the suggested quantity, the usual supplier picked, Deliver to Main store, Expected in 2
   days.
2. **Do:** **Order stock** (or **New order**) → Supplier "QA Linen Co …" → add "QA Pillow case …" 20 at ₦1,500 →
   **Save draft**. **Expect:** "Saved as a draft"; the panel shows Draft with the lines and total ₦30,000.
3. **Do:** **Edit** → change to 25 → **Save draft**, then **Send**. **Expect:** "PO-… sent to QA Linen Co …";
   the notice shows the **Email to orders@qalinen.ng** with every line, the total, the store and the date. The
   panel says "Sent … to orders@qalinen.ng".
4. **Do:** a new order from **Lagos Fresh Foods** for 150 kg Rice at ₦1,800 (₦270,000) → **Send**. **Expect:**
   "Sent to the manager for approval"; status **Needs approval**; nothing is sent to the supplier.
5. **Do:** as Tunde → Approvals. **Expect:** "Purchase order PO-… · Lagos Fresh Foods · ₦270,000". Approve it.
   **Expect:** within a few seconds Jide sees it **Sent** with "Approved by Tunde Bakare".
6. **Do:** as Tunde → Inventory → Purchase orders → New order over ₦200,000 → Send. **Expect:** "Sent to the owner
   for approval". As Godwin decline it with a note. **Expect:** the order becomes **Cancelled** with "Declined by
   Godwin Kwin · <note>".
7. **Do:** as Godwin order over ₦200,000 → **Send**. **Expect:** sent at once. **Cancel order** → Reason "Ordered
   by mistake". **Expect:** Cancelled with the reason.

## 5 · Deliveries (Jide)

1. **Do:** Deliveries. **Expect:** a card per order on the way. Click the QA Linen order. **Expect:** **Receive a
   delivery** with the order picked, Into Main store, and a line per item with Expected, Received (pre-filled),
   Damaged and Unit cost.
2. **Do:** Received 20, Damaged 2, Unit cost 1,600, Invoice "QA-INV-1" → **Receive ₦32,000**. **Expect:**
   "Delivery received · 1 short · 1 damaged"; the order is **Part received** with "20 (+2 damaged)"; the item's
   average cost moves (38 held across all stores at ₦1,200 + 20 at ₦1,600 → ₦1,337.93).
3. **Do:** the order → **Cancel order**. **Expect:** refused: "Something has already been received on PO-… ·
   close it instead". **Close short** → Reason "Rest not coming". **Expect:** **Closed short**.
4. **Do:** receive the approved rice order in full. **Expect:** "Delivery received · stock updated", the order
   **Received**, Main store rice +150.
5. **Do:** **Receive delivery** → Purchase order "No order (walk-in delivery)" → Supplier CleanPro Supplies,
   Into Main store, add Detergent 5 at ₦1,500 → Receive. **Expect:** received; the row says "No purchase order".
6. **Do:** click a delivery row. **Expect:** details with Expected, Received (short/over), Damaged, Cost, value
   received, store and invoice.

## 6 · Stock counts (Jide, Tunde, Mariam)

1. **Do:** Stock counts → **Start a count** → Store Housekeeping store → **Start**. **Expect:** the count sheet
   with every item in that store and its system quantity.
2. **Do:** **Start a count** again for the same store. **Expect:** refused: "The Housekeeping store already has
   a count open (started by Jide Alabi) · finish or cancel it first".
3. **Do:** enter every quantity, one 2 fewer than the system → **Submit count**. **Expect:** "Count submitted · a
   manager approves the difference"; the card says "Missing worth ₦…" (2 × the item's cost); Jide sees "Waiting
   on a manager".
4. **Do:** as Tunde → Inventory → Stock counts → open it → **Approve**. **Expect:** "Count approved · levels
   corrected"; the item drops by 2 (sales or issues since the count are kept); status Approved by Tunde Bakare.
5. **Do:** as Jide start another count → **Cancel count** → Reason "Wrong store". **Expect:** Cancelled.
6. **Do:** as Segun → Bar stock → **End-of-night count** → submit. **Expect:** it is submitted for approval and
   shows on Stock counts as Needs approval; doing it again before Tunde approves is refused: "The Bar store
   already has a count waiting for approval (started by Segun Ajayi) · finish or cancel it first".

## 7 · Money: numbers that must agree (Jide, Tunde, Godwin, Femi)

Check at the same moment (nobody moving stock in between):

- [ ] Stock value tile (Jide) = sum of the store cards = Tunde's and Godwin's Inventory tile.
- [ ] Femi → Today's money → **Stock** card: Stock value = the same total; Still on order = Jide's On order
      tile; Used (30 days) = the Used total on the usage card.
- [ ] A store's value = Σ (quantity × average cost) of its items (item panel: each store's value).
- [ ] After a delivery: value received = Σ received × unit cost; the supplier's "Received (30 days)" grows by it.
- [ ] Usage for today: Main store "Moved out" = what you issued and moved today at cost; Housekeeping "Moved in"
      = what reached it.

## 8 · Kitchen and bar still work (Mariam, Segun)

1. **Do:** sell a dish with a recipe and take cash (restaurant & bar script, section 2). **Expect:** the Kitchen
   store goes down by the recipe once; the item's Movements show "Used … Sold on order K-…".
2. **Do:** Segun → Bar stock: record a breakage. **Expect:** "Wasted" in the Bar store's movements and in the
   usage card's Wasted column.

## 9 · Negative checks

| Who | Do | Expect (exact message) |
|---|---|---|
| Jide | Add an item called "rice" | "There's already an item called rice" |
| Jide | Item with Minimum 10, Reorder up to 5 | "The reorder-up-to level can't be below the minimum (10)" |
| Jide | Stop stocking an item that still has stock | "<item> still has 12 kg in Main store · count it out or move it first" |
| Jide | Add a store named "main store" | "There's already a store called main store" |
| Jide | Close the Main store | "Main store still holds stock (N items) · move or count it out first" |
| Jide | Move stock from a store to itself | "Pick two different stores" |
| Jide | Move more than the store holds | "Only 5 pcs Hand towel in the Main store" |
| Jide | Issue more than is outstanding (API) | "Only 4 pcs Toilet roll is still outstanding" |
| Jide | Issue from the store the request is for | "That is the store the request is for · issue from another store" |
| Jide | Decline with no reason (API) | "Give a reason so the team knows why" |
| Grace | Ask the store for the kitchen (API `fromTeam:"KITCHEN"`) | 403 "You can only ask the store for your own team (HOUSEKEEPING)" |
| Jide | Supplier phone 0000000000 / email "nope" | "Enter a phone number like 0803 123 4567" / "Enter an email address like orders@supplier.ng" |
| Jide | Order with the same item twice / quantity 0 / expected yesterday (API) | "<item> is on the order twice" / "Enter a quantity above zero for <item>" / "The expected date is in the past" |
| Jide | Edit a sent order (API) | "Only a draft can be changed · PO-… is sent" |
| Jide | Close an order nothing has arrived on | "Nothing has been received on PO-… · cancel it instead" |
| Jide | Receive against an order waiting for approval | "PO-… is waiting for approval · it hasn't gone to the supplier yet" |
| Jide | Receive an item that isn't on the order (API) | "<item> isn't on PO-…" |
| Jide | Walk-in delivery with no supplier (API) | "Name the supplier, or pick the order this delivery is for" |
| Jide | Approve a count (API) | 403 "Approving a count is for a manager" |
| Tunde | Approve a count twice | "This count is already approved" |
| Tunde | Decide an approval meant for the owner | 403 "This one is for the owner" |
| Mariam | Count the Bar store (API) | 403 "Counting the Bar store is for its team, the store or a manager" |
| Mariam | Open stock value or purchase orders (API) | 403 "You don't have access to do that" |
| Femi | Add a supplier or move stock (API) | 403 "You don't have access to do that" |
| Jide | Usage with From after To (API) | "The start date is after the end date" |

## Known limits

- Cancelling an order that is waiting for approval leaves the approval on the approver's list; deciding it later
  does nothing.
- Units are free text and never converted (a carton is not 24 bottles).
- Stock drawn when an order is settled is not given back if the order is cancelled afterwards; correct the level.
- Counts and orders made before this release (with the old line format) show without expected quantities; start
  a new count rather than approving an old one.
- Housekeeping, laundry and maintenance have no ask-the-store screen yet (kitchen and bar do); they ask through
  the API, and see the answer in Notifications.
- The owner sees one hotel's inventory at a time (the branch picked at the top).
- Correct level needs Inventory **Full** access (or a manager); an Edit-access storekeeper doesn't see the button.

