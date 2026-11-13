# QA script · Guest messages as a paid service (staging)

## Purpose

Hotels now pay for the emails, SMS and WhatsApp messages they send to people outside the hotel (guests, companies,
suppliers). Hospio360 charges per message, sends one invoice per hotel each month, and the owner or manager pays it with
Paystack. An invoice unpaid 10 days after it is issued suspends the hotel's guest messages until it is paid.

This script tests:

- what is charged and what is free;
- switching the service on and off;
- default prices and each hotel's own prices;
- the monthly invoice and every message on it;
- paying with Paystack;
- overdue invoices and suspension;
- the admin-portal screens, including onboarding.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com
- Contract (hospio-backend): `docs/guest-message-billing.md`

## Accounts

Password for every account: `Hospio123!`. Don't change these accounts' roles or passwords.

| Role | Email | Where |
|---|---|---|
| Owner | `godwin@royalsuites.ng` | Hotel app, Simpas Ikeja |
| Manager | `tunde@royalsuites.ng` | Hotel app, Simpas Ikeja |
| Finance | `femi@royalsuites.ng` | Hotel app (should **not** see invoices) |
| Front office | `victor@royalsuites.ng` | Hotel app (sends guest messages) |
| Super admin | `amoria@hospio360.com` | Admin portal |
| Finance admin | `tobi@hospio360.com` | Admin portal |
| Support | `kola@hospio360.com` | Admin portal |

## Before you start

- **Emails are real.** Use your own inbox as the guest's email.
- **SMS and WhatsApp on staging are only sent to allow-listed numbers.** Any other number shows "Held back: not on this
  environment's allow-list". That is expected, not a bug, and a held-back message is not charged. Ask the developer to
  add your number if you need a real text.
- **Paystack is in test mode.** Pay with the test card `4084 0840 8408 4081`, CVV `408`, any future expiry. If asked,
  the PIN is `0000` and the OTP is `123456`. No real money moves.
- **Default prices:** email ₦5, SMS ₦10, WhatsApp ₦25.
- **Name test data `QA GM …`** (guests, bookings).
- **The delivery log has no screen in the hotel app yet.** Check it through the API with the manager's token:
  `GET https://api-staging.hospio360.com/messaging/deliveries?q=<your email>`. Each row has:
  - `status`: SENT, DELIVERED, FAILED or **SKIPPED**;
  - `error`: the reason, e.g. "Guest messages are off for this hotel";
  - `billable`, `sentVia` and `unitPrice`: whether it is charged, how it went, and its price.

## What is charged

| Charged (billable) | Free (always sent, even when the service is off) |
|---|---|
| Booking confirmed, dates changed, cancelled | Phone codes, sign-in, invites, password resets, temporary passwords |
| Receipts, folios, stay summaries | Messages to staff, approvals, reports |
| Messages to guests (Messaging / Inbox) | Handover packs, support |
| Company statements, payment reminders, purchase orders | Hospio360's own fee statements and these invoices |

A message is charged only if it went out (Sent or Delivered). A message the network rejects (e.g. DND), or one that
fails or is held back, costs nothing. A WhatsApp that went out as an SMS is charged as an SMS.

---

## 1. The owner or manager switches it on (hotel app)

1. Sign in as the **manager**. Go to Hotel setup → **Guest messages**. You see:
   - the on/off switch;
   - the price per email, SMS and WhatsApp;
   - this month's count and amount per channel;
   - the Invoices table.
2. If the service is **on**, switch it **off**. A confirm box explains that guest messages will stop. Confirm. The
   page says Off.
3. Front office → Messaging → New message to a guest by **email** (your inbox). The message is **refused** with "Guest
   messages are off for this hotel (Hotel setup → Guest messages)". Nothing arrives.
4. Make a booking with your email as the guest's. The booking is saved, but **no confirmation email arrives**. In the
   delivery log (API), the confirmation is `SKIPPED`, with the reason in `error`.
5. Free messages still go while the service is off. Example: invite a staff member to your own email address, and the
   invite arrives.
6. Switch the service back **on**. "Last changed by Tunde …" updates.
7. Repeat steps 1–6 as the **owner**: same screen, same result.
8. Sign in as **finance** or **front office**. There is no Guest messages section in their Hotel setup, and the API
   refuses `GET /messaging/billing/messages` with 403.

## 2. Messages are counted and priced

With the service **on**:

1. Front office sends a guest an **email** from Messaging. It arrives. Toast: "Email sent to …".
2. Make a booking with your email, then cancel it. You receive the confirmation **and** the cancellation email.
3. Manager → Hotel setup → Guest messages:
   - "Emails this month" went up by **3**, and the amount by **₦15** at ₦5 each.
   - "See each message" lists all three, each with the time, kind, recipient and price.
4. Send an **SMS** to a number that is **not** allow-listed. In the delivery log (API) it is `FAILED`, with "Held back:
   not on this environment's allow-list". This month's SMS count does **not** change.
5. Send to a **WhatsApp** number that is allow-listed, with a free-text message. It goes as an SMS, because free text
   has no WhatsApp template. It is counted under SMS at the SMS price.

## 3. Prices (admin portal)

1. Sign in as **finance admin** (`tobi@`) → Fees & billing. Scroll down to **Guest messages · default prices**, which
   shows ₦5 · ₦10 · ₦25.
2. Change prices → set email **6**. Save, and the card shows ₦6. Set it back to **5**.
   - Saving with a box left empty is refused: "Enter all three prices".
3. Businesses → Royal Suites Ltd → hotel **Simpas Ikeja**. The **Guest messages** card shows:
   - On/Off;
   - the prices, labelled "Default prices";
   - this month's amount;
   - the unpaid amount.
4. Click **Prices** and set SMS to **8**. Save, and the card shows ₦5 · ₦8 · ₦25 with "The hotel's own prices". In the
   hotel app, the manager's Guest messages page shows ₦8 for SMS too.
5. A new price applies only to messages sent **from now on**. Messages already counted keep the price they had.
6. Click Prices again → **Use default prices**. The card is back to ₦5 · ₦10 · ₦25 with "Default prices".
7. Turn the switch on the card off and on again. The hotel app follows within a refresh.

## 4. Opt-in during onboarding (admin portal)

1. Onboarding → open a business in progress (or a QA one) → go to the **Go-live** step.
2. Below the checklist and notes is **Guest messages · opt in?**, with one row per hotel. Ask the owner, and switch on
   the hotels that want it.
3. Open that hotel's page under Businesses. The Guest messages card shows the same On/Off.

## 5. The monthly invoice

Invoices are issued on their own at **00:30 on the 1st (Lagos time)**, for the month before.

1. Admin → Fees & billing → Guest-message invoices → **Issue last month**. A confirm box explains it, and the toast says
   how many were issued. A month with no charged messages gets no invoice.
   - To get an invoice for **this** month on staging, ask the developer to issue one. Afterwards, that hotel's
     messages for the rest of the month are not billed on staging.
2. The new invoice appears in the list with:
   - number `MSG-YYYYMM-0001`;
   - the hotel and the month;
   - the number of messages and the total;
   - a due date **10 days** after issue;
   - status **Due**.
3. The owner and the manager each get an in-app notification, "Guest-message invoice MSG-…". Clicking it opens Hotel
   setup → Guest messages with that invoice open.
4. The owner and manager also get the invoice **email** (from Hospio360). It shows the counts and the amount per
   channel, the total, the due date and a link to pay.
5. In the hotel app, open the invoice. It shows:
   - **Summary:** emails, SMS and WhatsApp with their amounts, and the total;
   - **By kind of message:** e.g. Booking confirmations, Messages to guests, each with a count, the price each and the
     amount;
   - **Every message:** when it was sent, what it was, who it went to, and its price. The prices add up to the total.
6. Issuing the same month again issues nothing new: no duplicate invoice.

## 6. Paying with Paystack

1. As the **owner** (or manager), open a Due invoice and click **Pay ₦…**. The browser goes to Paystack's checkout,
   showing the right amount and your email.
2. Pay with the test card (see Before you start). Paystack sends you back to Guest messages. Toast: "Invoice … paid".
   The invoice shows **Paid**, with when you paid and who paid.
3. Admin → Fees & billing → the invoice shows **Paid · Paystack**.
4. The owner and manager get a notification: "Invoice … paid … guest messages are on".
5. **Negative checks:**
   - Click Pay, then close the Paystack page without paying. The invoice stays **Due**.
   - Click Pay twice (two tabs) and pay in the **first** tab. The invoice still becomes **Paid**.
   - A paid invoice has no Pay button.
6. **Paid by bank transfer:** as finance admin, find a Due invoice → **Mark paid**, with an optional reference. It
   shows Paid · By hand.

## 7. Overdue and suspension

1. **Manual suspension:** Admin → the hotel's Guest messages card → **Suspend**.
   - The hotel app shows a red banner, "Guest messages are paused …".
   - Front office sending a guest email is refused with "Guest messages are suspended …".
   - A new booking's confirmation is `SKIPPED` in the delivery log (API).
   - Free messages (invites, codes) still go.
2. Click **Resume**. The banner goes away, and guest emails go out again.
3. **Unpaid invoice:** every day at 09:00, an invoice past its due date becomes **Overdue**, and the hotel is
   suspended. To test this without waiting 10 days, ask the developer to move a test invoice's due date to yesterday
   and run the check. Then:
   - The invoice shows **Overdue** in the hotel app and the admin portal. The panel footer says "Overdue since …".
   - The red banner names the invoice and its due date.
   - The owner and manager get "Guest messages suspended".
   - Guest messages are refused (as in step 1).
4. Pay the overdue invoice (section 6). The suspension lifts at once: the banner goes, the notification says guest
   messages are on, and the next guest email is sent.
5. If **two** invoices are overdue, paying one keeps the hotel suspended until the other is paid too.

## 8. Wrong roles and other hotels

| Who | Tries | Expected |
|---|---|---|
| Finance, front office, housekeeping | Open or pay invoices, switch the service | No section; API 403 |
| Owner B (another business) | Open Simpas Ikeja's invoice by its id | Not found |
| Support admin (`kola@`) | Fees & billing | Guest-message prices and invoices are hidden (finance only) |
| Anyone | Webhook call to `/messaging/webhooks/paystack` without a valid signature | 401, nothing changes |

## What to report

Report anything that doesn't match the steps, including:

- a message charged when it shouldn't be (or the reverse);
- totals that don't add up;
- a wrong price after an override;
- an invoice that doesn't lift the suspension when it is paid;
- raw codes on screen (e.g. `BOOKING_CONFIRMATION`);
- any screen that breaks at 1280 or 1512 wide.
