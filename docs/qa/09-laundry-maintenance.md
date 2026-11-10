# QA script · Laundry and maintenance (staging)

## Purpose

This script tests maintenance and laundry from the hotel app: work orders raised by the front desk, housekeeping,
maintenance or the manager, assigned, started, put on hold, completed with parts from the Maintenance store, labour
and vendor cost, reopened or cancelled; a room taken out of order from a work order and given back to housekeeping
when the work is done; preventive schedules that open work orders on their own; guest laundry charged to an
in-house guest's bill or paid at the desk; hotel linen sent soiled by housekeeping and returned clean by laundry
with missing and condemned linen written off; chemicals used from the Laundry store; the ask-the-store screens
for housekeeping, laundry and maintenance; and the laundry & maintenance money on the finance, manager and owner
screens. Everything you do writes to the shared staging database and shows up for every account. Run the
sections in order; later sections use what earlier ones created.

## Links

- Hotel app: https://web-staging.hospio360.com
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/laundry-maintenance.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email |
|---|---|---|
| Maintenance (Full access: supervisor) | Chinedu Obi | `chinedu@royalsuites.ng` |
| Maintenance (Edit access: technician) | QA Technician | `qa.tech@royalsuites.ng` |
| Laundry (Full access: supervisor) | Lola Eze | `lola@royalsuites.ng` |
| Housekeeping (Full access) | Grace Okafor | `grace@royalsuites.ng` |
| Front office | Victor Adeyemi | `victor@royalsuites.ng` |
| Manager | Tunde Bakare | `tunde@royalsuites.ng` |
| Owner | Godwin Kwin | `godwin@royalsuites.ng` |
| Finance | Femi Ojo | `femi@royalsuites.ng` |
| Inventory (storekeeper) | Jide Alabi | `jide@royalsuites.ng` |
| Kitchen (for the wrong-role checks) | Mariam Bello | `mariam@royalsuites.ng` |

Use a separate browser profile (or a private window) per account so you can stay signed in as two people at once.

Menus: Chinedu and the technician get **Work orders, Preventive, Maintenance store, Rooms out of order**. Lola gets
**Jobs, Linen, Laundry store, My payments**. Grace gets **Linen, Housekeeping store, Repairs** besides her rooms.
Victor gets **Guest laundry** and **Repairs**. Tunde runs everything from **Tasks** (tabs Work orders, Preventive,
Laundry prices).

## What is set up

- Stores: **Maintenance store** (LED bulb 9W, AC filter, Refrigerant gas R410A, Fuse 13A, Tap washer set, Door
  hinge), **Laundry store** (Laundry detergent, Bleach, Fabric softener), **Housekeeping store** (supplies plus the
  linen: Bed sheet, Pillowcase, Bath towel, Duvet cover), and the Main store with back stock.
- Laundry price list: Shirt ₦1,500, Trousers ₦1,500, Dress ₦2,500, Suit (2-piece) ₦6,000, Native attire ₦3,000,
  Bedsheet (guest) ₦2,000, Underwear (pair) ₦500. Express is one and a half times unless the manager sets it.
- Assets: Block A AC units, Generator 1 (60 kVA), Pool pump. Schedules: AC service every 90 days, Generator service
  every 30 days.
- A checked-in test guest for laundry: **QA LM Guest 2120 in room A107** (pay at check-out, open bill). If they have
  been checked out, check a new guest in from Bookings and use their room.
- Due times by priority: Urgent 4 hours, High 24 hours, Normal 3 days, Low 7 days. Past due shows **Overdue** (red)
  and the manager and the technician are told once.

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed.
- Emails are sent for real, to the address on the record; SMS and WhatsApp are "coming soon". In-app notifications (the bell) are real.
- The **API** button at the bottom left lists every call the screen made, with the answer.
- Money is shown in whole naira; quantities with up to 2 decimals.

## 1 · Raise a work order (Victor, Grace)

1. **Do:** as Victor → **Repairs** → **Report a fault** → A guest room → pick a **free** room (not A107) → Category
   AC / cooling → Priority Urgent → What is wrong "QA AC not cooling <initials>" → **Raise work order**.
   **Expect:** "WO-2026-NNNNN raised · maintenance told"; it is listed under Open with Urgent, Open and a due time 4
   hours from now. Chinedu gets "New repair · <room>"; Tunde gets "Urgent work order WO-…".
2. **Do:** as Grace → **Repairs** → **Report a fault** → Somewhere else → "QA Pool tap <initials>" → Plumbing → Low →
   **Raise work order**. **Expect:** raised, due in 7 days.
3. **Do:** open Grace's work order → **Cancel** → reason "Raised twice" → **Cancel work order**. **Expect:**
   "… cancelled"; it moves to Done as Cancelled with the reason.
4. **Do:** open any work order → **Add a photo** → pick a JPEG under 2 MB → **Upload**. **Expect:** "Photo added"; the
   photo shows in the panel. A file over 2 MB is refused before upload ("over 2 MB").

## 2 · Run it (Chinedu, the technician)

1. **Do:** as Chinedu → Work orders → **All open** → open Victor's urgent one. **Expect:** status, priority,
   category, where, assigned (Nobody yet), due, raised by Victor · Front desk, the description and Updates.
2. **Do:** **Assign** → Technician "QA Technician" → **Assign**. **Expect:** "… given to QA Technician · they're
   told"; the technician gets "Work order for you · WO-…".
3. **Do:** as the technician → Work orders (tab **Mine**) → open it → **Start**. **Expect:** In progress.
4. **Do:** **Put on hold** → "Waiting for a filter" → **Put on hold**. **Expect:** On hold with the reason; Victor is
   told "WO-… on hold".
5. **Do:** **Resume**. **Expect:** In progress again.
6. **Do:** **Take room … out of order** → Expected back = tomorrow → **Take out of order**. **Expect:** "Room … out of
   order · front desk told"; a red note in the panel; Rooms out of order lists the room with this work order.
7. **Do:** as Victor → Bookings → new booking for that room / check a guest into that room. **Expect:** refused with
   "… is out of order". The room is not offered in availability.
8. **Do:** as the technician → **Complete** → What was done "Replaced filter, regassed" → Labour 75 → press + on AC
   filter once and LED bulb 9W twice → Outside vendor "CoolAir" → Vendor cost 15,000 → **Mark done**. **Expect:**
   "WO-… done · room … back in service · Victor told"; the Done section shows Labour 1 h 15 min, Parts ₦… (= the
   items' costs), Vendor CoolAir · ₦15,000 and Total cost. The Maintenance store shows 1 filter and 2 bulbs fewer.
9. **Expect:** as Grace → My rooms: the room is dirty with a clean on today's list; it goes through cleaning and
   inspection as usual. As Victor the room is bookable again.
10. **Do:** as Victor → Repairs → Done → open it → **Reopen** → "Warm again overnight" → **Reopen**. **Expect:**
    Assigned again to the technician (told "WO-… reopened"), due time restarted. Complete it again with one LED
    bulb: the parts cost adds only that bulb; labour adds up.

## 3 · Preventive (Chinedu, Tunde)

1. **Do:** as Chinedu → **Preventive**. **Expect:** Schedules (AC service every 90 days, Generator service every 30
   days, next due, last done, goes to) and Assets (with open work orders).
2. **Do:** **Add asset** → "QA Boiler <initials>" → Plumbing → Elsewhere "Boiler room" → **Add asset**. Then **New
   schedule** → Job "QA Boiler check" → Every 30 → First due = today → For An asset → QA Boiler → **Add schedule**.
3. **Do:** as Tunde → Tasks → **Preventive** → **Open due jobs now**. **Expect:** "1 work order opened". Press it
   again: "Nothing is due today" (never a second one). The schedule's next due moves on 30 days; the work order
   appears on Work orders with source Schedule.
4. **Do:** pause the schedule (pause icon), then delete it (bin). **Expect:** Paused; then gone. The work order it
   opened stays.

## 4 · Guest laundry (Victor, Lola)

1. **Do:** as Victor → **Guest laundry** → **New guest order** → In-house guest "A107 · QA LM Guest 2120" → Shirt × 2,
   Trousers × 1 → leave **Charge to the room now** on → **Take order & charge room**. **Expect:** "LDR-NNNNN taken ·
   ₦4,500 charged to room A107"; the card shows Room. The folio for A107 (Folios) has a Laundry line of ₦4,500.
2. **Do:** **New guest order** → Express on → Suit × 1 → Charge to the room off → **Take order**. **Expect:** the
   price shows ₦9,000 (express); the order shows **Not settled**.
3. **Do:** as Lola → Jobs → open the express order → **Start washing** → **Mark ready**. **Expect:** Mark delivered
   is greyed out with a note "Charge it to the room or take payment before it goes back to the guest".
4. **Do:** **Take payment** → Cash → count ₦9,000 → Skip receipt. **Expect:** "LDR-… paid"; it shows Paid · cash;
   **Mark delivered** works.
5. **Do:** take a third order (Shirt × 1, not charged) → **Cancel** → "Guest took it back" → **Cancel order**.
   **Expect:** Cancelled with the reason. Try to cancel the first (charged) order: there is no Cancel button and the
   API answers "… is already on the guest's bill · it can't be cancelled here".
6. **Do:** **Found something in a pocket** on any open order → "₦2,000 note" → **Save**. **Expect:** the card shows
   "Found in pocket".

## 5 · Linen (Grace, Lola)

1. **Do:** as Grace → **Linen**. **Expect:** By type: Bed sheet, Pillowcase, Bath towel, Duvet cover with Clean (the
   Housekeeping store), At the laundry and Of par.
2. **Do:** **Send soiled linen** → Bed sheet 10, Bath towel 6 → note "Floor A2" → **Send to laundry**. **Expect:**
   "LNB-NNNNN sent · laundry told"; Lola gets "Soiled linen on its way".
3. **Do:** as Lola → **Linen** → open the batch → **Count it in** → set Bed sheet to 9 → **Count in**. **Expect:** "… 1
   missing, housekeeping told"; the batch shows 1 missing (red) and Written off ₦6,500. Housekeeping store −10
   sheets, Laundry store +9.
4. **Do:** **Send back clean** → Bed sheet clean 6, condemned 1, Bath towel clean 6 → Why condemned "Torn" → **Send
   back**. **Expect:** Part returned, 2 sheets still at the laundry; Grace sees the sheets back in her store and gets
   "Clean linen back".
5. **Do:** **Close short** → "Not found after search" → **Close short**. **Expect:** Closed short; the 2 sheets are
   written off as lost; nothing of this batch is left in the Laundry store.
6. **Do:** **Chemicals used** → Laundry detergent + 2 → **Record**. **Expect:** "Chemicals recorded"; the Laundry
   store shows 2 kg less.

## 5b · Linen requests and housekeeping problems (Grace, Lola, Victor)

1. **Do:** as Grace → My rooms → **Ask for linen** → 4 Bath towel → **Send request**. **Expect:** "Linen request sent
   · it is on laundry's Linen screen".
2. **Do:** as Lola → Linen. **Expect:** "Linen asked for by housekeeping" lists "4 × Bath towel · Grace Okafor · asked
   …". **Mark sent** → "Marked sent · Grace Okafor is told"; the row moves under "Recently sent"; Grace gets "Linen on
   its way". Marking the same request again (API `POST /housekeeping/linen-requests/{id}/sent`) → "This request was
   already sent by …".
3. **Do:** as Grace → Report a problem → a vacant room → "Now" with "Take room … out of order" on → Send to Maintenance.
   **Expect:** an Urgent work order (due 4 hours) raised by Grace; the room is out of order (Chinedu → Rooms out of
   order); Victor gets "Room … is out of order". Complete or cancel the work order to put it back.
4. **Do:** the same on a room with a guest checked in. **Expect:** refused "Room … has a guest checked in (…) · it can't
   go out of order · send the report without taking it out of order, or move the guest first"; no work order opened.
5. **Do:** Report a problem → a public area (e.g. Lobby) → "Today". **Expect:** "Sent to Maintenance"; the work order's
   place is the area, not a room.

## 6 · Ask the store (Grace, Lola, Chinedu, Jide)

1. **Do:** as Chinedu → **Maintenance store** → **Ask the store** → add AC filter (Add an item lists the main
   store's items too) → **Send request**. Do the same as Lola (Laundry store, Bleach) and Grace (Housekeeping store,
   Bath soap).
2. **Do:** as Jide → Requests → issue one, decline another with a reason. **Expect:** the issued stock appears in the
   team's own store; on the team's screen **Your requests to the store** shows Issued, or Declined with "Store said:
   <reason>"; the team gets a notification.

## 7 · Money (Tunde, Godwin, Femi)

1. **Do:** as Femi → **Today's money**. **Expect:** a **Laundry & maintenance · last 30 days** card: Laundry income
   (on guests' bills + paid), Laundry stock used, Maintenance cost (parts + vendors) and Work orders done.
2. **Expect:** Laundry income = the sum of charged and paid laundry orders in the last 30 days; Maintenance cost =
   the sum of Total cost on work orders done in the last 30 days (check two or three by hand).
3. **Do:** as Tunde → **Financials**; as Godwin → **Financials**. **Expect:** the same card with the same figures.

## Negative cases

| Who | Do | Expect |
|---|---|---|
| Victor | Raise a work order with no room/place, or no category (API) | "Pick a room or say where it is" / "Pick a category: plumbing, electrical, …" |
| Technician | Give a work order to someone else (API) | 403 "You can take a work order for yourself; giving it to someone else is for the supervisor or a manager" |
| Victor | Start or complete a work order (API) | 403 "You don't have access to do that" |
| Technician | Complete before starting / hold before starting | "Start WO-… before completing it" / "Start WO-… before putting it on hold" |
| Technician | Hold with no reason, complete with no note | "Say why it is on hold" / "Say what was done" |
| Technician | Complete with more parts than the store holds | "Only 3 pcs AC filter in the Maintenance store" and nothing is taken |
| Technician | Vendor cost with no vendor name | "Name the vendor you paid" |
| Chinedu | Take room A107 (guest in) out of order | "Room A107 has a guest checked in (QA LM Guest 2120) · move them to another room first" |
| Chinedu | Out of order with an end date in the past | "The end date can't be in the past" |
| Victor | Cancel a work order the technician has started | 403 "WO-… has started · ask the maintenance supervisor or a manager to cancel it" |
| Technician | Reopen a work order someone else raised | 403 "Only whoever raised WO-… or a manager can reopen it" |
| Anyone | Cancel a done work order | "WO-… is done · reopen it first" |
| Technician | Add an asset or schedule (API) | 403 "Assets and schedules are for the maintenance supervisor or a manager" |
| Chinedu | Schedule every 0 days / due yesterday | "Repeat every 1 to 730 days" / "The next due date can't be in the past" |
| Lola | Laundry order for a room nobody is in (API) | "Nobody is checked in to that room" |
| Lola | Half a shirt / an item taken off the price list (API) | "Quantities are whole numbers above zero" / "<item> is no longer on the price list" |
| Lola | Charge an order twice / charge a paid order | "LDR-… is already charged to the room" / "LDR-… is already paid" |
| Lola | Deliver an unsettled order (API) | "Charge it to the room or take payment before it goes back to the guest" |
| Lola | Mark a payment smaller than the order, or one used for another order (API) | "That payment (₦…) is less than LDR-… (…)" / "That payment is already used for another laundry order" |
| Lola | Charge after the guest checked out | "Nobody is checked in to room … now · take payment instead" |
| Lola | Change a price (API) | 403 "You don't have access to do that" (prices are the manager's) |
| Tunde | Price 0, or express below the price | "Enter a price above zero" / "The express price can't be below the normal price" |
| Grace | Send detergent as linen (API) | "Laundry detergent isn't linen" |
| Lola | Count in more than was sent / return more than is at the laundry | "More Bed sheet counted (11) than were sent (10)" / "Only 9 Bed sheet still at the laundry on LNB-…" |
| Lola | Condemn with no reason | "Say why the linen is condemned" |
| Grace | Close a batch (API) | 403 "You don't have access to do that" |
| Grace | Mark a linen request sent (API) | 403 "Only laundry or a manager can mark linen sent" |
| Mariam | List linen requests (API `GET /housekeeping/linen-requests`) | 403 "Only laundry, housekeeping and managers can see linen requests" |
| Lola (Edit access) | Close a batch short | 403 "Closing a batch short is for the laundry supervisor or a manager" |
| Mariam | Open /dashboard/repairs or read work orders (API) | 404 page / 403 "You don't have access to do that" |
| Femi | Raise a work order (API) | 403; Femi reads only the money summaries |

## Known limits

- Out of order starts now and lasts until the work order is done or cancelled; a future out-of-order period isn't
  supported, and a booking already given that room is not moved (check-in refuses it and the desk picks another).
- Parts drawn on a completed work order are not put back when it is reopened.
- A laundry charge already on the guest's bill can't be cancelled from laundry; correct the folio.
- Linen on floors and trolleys is not counted separately from the Housekeeping store.
- One photo per work order, kept on the staging server.
- A role opening another role's screen gets the 404 page (each role's menu shows only its screens); the services
  refuse with a sentence.

