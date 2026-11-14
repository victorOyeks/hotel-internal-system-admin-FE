# QA script · Clock in, attendance notices and leave (staging)

## Purpose

This script tests that staff can tell the hotel they've started, and that managers find out without opening Staff. It
covers:

- clocking in and out from **My shifts** and from the front desk's **Today**;
- the manager's **Staff** screen showing who is on shift;
- notices for late clock-ins, staff not in for a started shift, and forgotten clock-outs;
- a Hotel setup switch that adds a notice for every clock-in;
- leave: owners are now told too, and staff can withdraw a request that hasn't been decided.

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract (hospio-backend): `docs/workforce.md`

## Accounts

Password for every account: `Hospio123!`. Don't change these accounts' roles.

| Role | Email |
|---|---|
| Front office | `victor@royalsuites.ng` |
| Manager | `tunde@royalsuites.ng` |
| Owner | `godwin@royalsuites.ng` |
| Housekeeping | `grace@royalsuites.ng` |

Use two browsers, or a normal and a private window: one for the staff member and one for the manager.

## 1. Where to clock in

1. Sign in as front office. The sidebar has **My shifts**, above Inbox. It also appears for managers, finance and
   inventory, and already did for housekeeping, laundry, maintenance, bar and kitchen.
2. **My shifts.** The top card says "Not clocked in" and shows today's shift, or "No shift scheduled today".
3. **Clock in.** The card turns green: "On shift since HH:MM", with a running timer.
4. **Clock out.** The card goes back to "Not clocked in", and today's hours count towards the week.
5. **Today (front desk).** The header has **Clock in** next to My payments. Clocking in there changes My shifts too, and
   the reverse. When you're in, the button reads "Clock out · in since HH:MM".
6. **Negative checks:**
   - Clock in twice (two tabs): the second is refused with "You're already clocked in".
   - Clock out when not in: refused with "You're not clocked in".

## 2. The manager sees who is in

1. Manager → **Staff** → **All staff**. The **Today** column shows:
   - **On shift now**: clocked in, whether on the rota or not;
   - **Not in yet**: a rota shift that has started, nobody clocked in;
   - **Starts later**;
   - **Worked today**: clocked out;
   - **Called in sick**, **On leave**, or **Not scheduled**.
2. Victor clocks in. On the manager's side, after a refresh, Victor shows **On shift now** and the **On shift now** card
   goes up by one.
3. **Click the On shift now card.** A list opens with each person, their job and "since HH:MM". Anyone clocked in for
   more than 14 hours shows "forgot to clock out?".
4. **Before the fix:** anyone whose rota shift started before 2pm showed "On shift now" whether they came in or not.
   That must no longer happen.

## 3. Notices to the manager

1. **Late clock-in.**
   - Manager → **Rota** tab, or Staff → a person's row menu → **Change shift / Add to the rota**. Give Victor a shift
     that started more than 15 minutes ago today, e.g. Morning 6am–2pm.
   - Victor clocks in.
   - The manager's bell shows "Victor Adeyemi clocked in late", with the time, the shift and how many minutes late.
2. **On time.** Victor clocks out, the manager gives him a shift starting a few minutes from now, and Victor clocks in.
   No notice is sent, unless the switch in step 3 is on.
3. **Every clock-in (switch).**
   - Manager → Hotel setup → **Staff & shifts** → turn on **Tell managers about every clock-in** → Save.
   - Victor clocks in. The manager gets "Victor Adeyemi clocked in". It includes "not on today's rota" if he has no
     shift, and his note if he left one.
   - Turn the switch off again.
4. **Not in yet.**
   - Give Grace (housekeeping) a shift that started 20+ minutes ago and hasn't ended. She does **not** clock in.
   - Within about 10 minutes, the manager gets "Grace Okafor hasn't clocked in", and Grace gets "You haven't clocked in".
   - Each is sent **once**; waiting another 10 minutes sends nothing new.
5. **Forgot to clock out.**
   - Leave someone clocked in past the end of their shift. About an hour after it ends, they get "You're still clocked
     in" and the manager gets "… is still clocked in", once.
   - After 24 hours the entry is closed for them, at the shift's end (or 12 hours after clocking in when there was no
     shift), with the note "Closed automatically: no clock-out. Check the hours".
   - Both of them are told "… never clocked out".
   - On staging, Lola Eze's clock-in from 10 Nov should already show as closed this way.
6. **Wrong roles.** Front office can't see Staff or another person's clock. The API refuses
   `GET /finance/workforce/clock` for front office with 403.

## 4. Leave

1. **Ask.** Victor → My shifts → **Ask for leave** → reason, dates, note → Send.
   - The **manager and the owner** both get "Victor Adeyemi asked for leave", with the dates and the reason.
   - Before this change, only managers were told.
2. **Withdraw.**
   - On Victor's **My leave** list, the pending request has **Withdraw**. Click it.
   - The toast says "Leave request withdrawn", the status shows **Withdrawn**, and the button disappears.
   - The manager and the owner get "Victor Adeyemi withdrew a leave request".
   - On the manager's **Leave** tab, it is no longer waiting.
3. **Withdraw after the manager suggests dates.** The manager answers **Suggest other dates**. Victor can still
   withdraw it.
4. **Too late to withdraw.** After the manager approves or declines, Victor sees no Withdraw button. The API refuses a
   withdraw with "This leave request was already approved, so it can't be withdrawn".
5. **Someone else's request.** Withdrawing another person's request by its id gives "Leave request not found".
6. **Approve.** The person's rota shifts in those dates are cancelled, and they are told "Your leave was approved".

## What to report

- A notice that doesn't arrive, arrives twice, or goes to the wrong people.
- A wrong time (all times are hotel time, Lagos).
- The Today column or the On shift list disagreeing with who is clocked in.
- A Withdraw button on a decided request.
- Any screen that needs a reload to show the change.
