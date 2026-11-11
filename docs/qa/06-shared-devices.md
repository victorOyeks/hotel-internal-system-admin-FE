# QA script · Shared devices and PIN switching (staging)

## Purpose

This script tests shared devices: one tablet at the bar, the kitchen or the front desk used by several people in a
shift. Someone with Full access, a manager or the owner sets the tablet up from the normal sign-in; after that it
shows a lock screen where each person taps their name and enters their PIN. It checks PIN rules and wrong-PIN locks,
switching person, the Lock button and the idle lock, people with no PIN yet, the PIN prompt after signing in, the
manager's Staff and Hotel setup screens, removing a device, and that every action is recorded under the person who
unlocked. The normal sign-in page stays the only sign-in page. Everything you do writes to the shared staging database.

## Links

- Hotel app: https://web-staging.hospio360.com (use a tablet, or a desktop browser window about 1024 px wide)
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/shared-devices.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email | PIN |
|---|---|---|---|
| Manager | Tunde Bakare | `tunde@royalsuites.ng` | (has one; not needed) |
| Owner | Godwin Kwin | `godwin@royalsuites.ng` | none: owners never have a PIN |
| Bar (Full access) | Segun Ajayi | `segun@royalsuites.ng` | **258013** |
| Kitchen (Full access) | Mariam Bello | `mariam@royalsuites.ng` | **369150** |
| Kitchen (Edit) | QA Cook | `qa.cook@royalsuites.ng` | none |
| Front office | Victor | `victor@royalsuites.ng` | none |
| Housekeeping | Grace | `grace@royalsuites.ng` | none |
| Second owner (two hotels) | QA Owner B | `qa.ownerb.fcekd@hospio-qa.test` | none |

Bar staff left by the automated runs (bar role at Simpas Ikeja, password `Hospio123!`):

| Name | Email | PIN |
|---|---|---|
| QA PIN Ada l184h | `qa.pin.ada.l184h@hospio-qa.test` | **513794** |
| QA PIN Kemi l184h | `qa.pin.kemi.l184h@hospio-qa.test` | **619428** |
| QA PIN Newbie l184h | `qa.pin.newbie.l184h@hospio-qa.test` | none (a "No PIN yet" tile) |

Other "QA PIN …" people from earlier runs were taken off the hotel. For lockout, pause and suspend tests make fresh
staff through **Staff → Add staff** (invite), named "QA PIN <your initials>", and accept the invite from the link in
the yellow message card.

Use a separate browser profile (or private window) per person when you need two people at once: one window is the
tablet, the other is the manager's desk.

## How it works (what to expect)

- A shared device keeps a device token in its own cookie. Clearing the browser's cookies forgets the device.
- On a shared device with nobody signed in, every page goes to the **lock screen** (`/lock`), not the sign-in page.
- Unlocking gives that person a normal session **for this hotel only**, on the role the device is for. Everything they
  do is recorded under their name.
- **Lock** (top right) or the idle time ends that person's session on this device only; their phone stays signed in.
- Unsaved form state is lost when the device locks.

## 1 · Set up a bar tablet (Tunde)

1. **Do:** in the tablet window, sign in as Tunde on the normal sign-in page. Open the menu under your name.
   **Expect:** "Use this device as a shared device" between Switch role and Sign out.
2. **Do:** choose it. **Expect:** a form: Device name, Who uses it (a button per role, none picked for a manager),
   Lock after (5 minutes by default). With more than one hotel a Hotel picker shows.
3. **Do:** Device name "QA Bar tablet <initials>", pick **Bar**, Lock after 5 minutes → **Set up device**.
   **Expect:** "… is a shared device"; the window shows the lock screen: **Simpas Ikeja**, "QA Bar tablet … · Bar",
   the time, "Who's using this device?", a search box, tiles for the bar staff (Segun, QA PIN …) and **Sign in with
   email instead** at the bottom. Tunde (manager), Mariam (kitchen) and Godwin (owner) are not tiles.
4. **Do:** type "Seg" in the search box. **Expect:** only Segun's tile.
5. **Do:** go to `/dashboard` in the address bar. **Expect:** back on the lock screen.
6. **Do:** as Segun (Full access at the bar) on another device, the menu shows "Use this device as a shared device"
   with only **Bar** to pick. As QA Cook (Edit) the item is not in the menu. Godwin sees it with every role.

## 2 · Switch people (Segun, QA PIN Ada)

1. **Do:** tap Segun → type **999999** on the keyboard. **Expect:** "Wrong PIN. 4 tries left before your PIN
   is locked for 15 minutes". Escape closes the pad.
2. **Do:** tap Segun → tap **2**, **5**, **8**, **0**, **1**, **3** on the pad. **Expect:** the sixth digit unlocks without pressing Unlock: Bar today as Segun;
   the header has **Lock** (wide screens: "Lock · Switch person"); the branch is Simpas Ikeja only.
3. **Do:** **New sale** → Star lager → **Open a tab** → **Open a tab**. **Expect:** the tab opens; on Tabs (or via
   the API `GET /fnb/orders?outletId=…`) it shows **Opened by Segun Ajayi**.
4. **Do:** **Lock**. **Expect:** the lock screen. Tap "QA PIN Ada …" → PIN 513794 → make a sale the same way.
   **Expect:** that sale is opened by QA PIN Ada, not Segun.
5. **Do:** Lock → Segun → 258013. **Expect:** back as Segun. The account menu's last item now reads **Lock**, not
   Sign out (signing out on a shared device locks it).

## 3 · No PIN yet and the PIN prompt (a fresh "QA PIN" bar person)

1. **Expect:** your fresh bar person's tile says **No PIN yet · sign in**.
2. **Do:** tap it. **Expect:** the normal sign-in page with their email filled in and a blue note "Signing in on a
   shared device … Back to the lock screen".
3. **Do:** enter the password → sign in. **Expect:** Bar today with a prompt "Set a PIN so you can switch in quickly
   on this device" (New PIN, New PIN again; **Not now**, **Set PIN**). No password is asked.
4. **Do:** **Not now**. **Expect:** the prompt closes; you work as normal; reloading doesn't bring it back.
5. **Do:** Lock → tap the tile again → sign in. **Expect:** the prompt comes back.
6. **Do:** enter 1234 twice → Set PIN. **Expect:** "A PIN is 6 digits". Then 123456 twice. **Expect:** "Don't use digits in a row, like 123456 …". Try 111111 (repeated),
   the last 6 digits of their phone (if they have one), then a good PIN like 619428. **Expect:** "PIN set".
7. **Do:** Lock. **Expect:** their tile no longer says No PIN yet. Tap it → the new PIN → in.

## 4 · First sign-in prompt (new staff, any device)

1. **Do:** as Tunde add a new Bar (or Front office, Kitchen, Housekeeping, Laundry, Maintenance, Inventory) person;
   open the invite link in a normal browser (not the tablet) and choose a password.
   **Expect:** after the dashboard loads, "Set a PIN for the shared tablets" with **Not now**. It is skippable.
2. A first sign-in with a temporary password (after changing it) asks the same.

## 5 · PIN in My profile & security (Segun)

1. **Do:** My profile & security → **Security**. **Expect:** a "PIN for shared devices" card ("Set") with
   **Change PIN**. Owners don't have this card.
2. **Do:** Change PIN → new 258013, again 258013, password → Change PIN. **Expect:** "That's your current PIN. Pick a new
   one". With a wrong password: "Your password is wrong". (Leave Segun on 258013.)
3. My shifts → Change PIN does the same (exactly 6 digits, with the password).

## 6 · Wrong PINs lock the person, not the device (a fresh QA PIN person with a PIN)

1. **Do:** on the tablet tap them and enter a wrong PIN five times. **Expect:** tries 1-4 say "N tries left …"; the
   fifth "Wrong PIN. Your PIN is now locked for 15 minutes. Sign in with email instead, or ask your manager".
2. **Do:** enter the right PIN. **Expect:** "Your PIN is locked for 15 more minutes …"; their tile shows "PIN locked ·
   15 min".
3. **Expect:** Segun can still unlock: the device is not locked.
4. **Do:** as Tunde, Notifications. **Expect:** "<name>'s PIN is locked" — "5 wrong PINs on QA Bar tablet …".

## 7 · Idle lock (Tunde sets a short time)

1. **Do:** as Tunde (manager window) → Hotel setup → **Shared devices**. **Expect:** a table: Device (and who set it
   up), Desk, Last used, Last person, Auto-lock, with edit and remove buttons.
2. **Do:** edit "QA Bar tablet …" → Lock after **1 minute** → Save. **Expect:** "Device saved", 1 min.
3. **Do:** on the tablet unlock as Segun (reload first), then don't touch it. **Expect:** after about 30 seconds a toast
   "Locking in 30 seconds — Tap anywhere to stay signed in …"; after 1 minute the lock screen with "Locked after 1
   minute without use".
4. **Do:** unlock again and keep tapping every 10-20 seconds for 2 minutes. **Expect:** it stays open; the toast goes
   away when you tap.

## 8 · Manager's Staff screen (Tunde)

1. **Do:** Staff. **Expect:** people with no PIN show **No PIN yet** next to their status.
2. **Do:** open one → **PIN for shared devices** → **Remind**. **Expect:** "Reminder sent …"; the person gets a
   notification "Set a PIN for the shared devices" that opens My profile & security → Security.
3. **Do:** open someone with a PIN → **Reset PIN** → confirm. **Expect:** "PIN reset"; their PIN stops working on the
   tablet ("No PIN yet …"); they get "Your PIN was reset". There is no way for a manager to choose someone's PIN.

## 9 · Paused, suspended, role removed (fresh QA PIN staff)

1. **Do:** as Tunde pause a QA PIN person for 1 day. **Expect:** their tile disappears; unlocking via the API says
   "This account is paused until …". Reinstate → they unlock again.
2. **Do:** while they are unlocked on the tablet, suspend them. **Expect:** the tablet's next page sends it to the lock
   screen; they can't unlock ("This account is suspended …"). Reinstate them after.
3. **Do:** give a QA PIN bar person Kitchen too, then remove Bar. **Expect:** they are no longer a tile on the bar
   tablet, and a session they had there ends at its next refresh.

## 10 · Sign in with email instead

1. **Do:** on the lock screen tap **Sign in with email instead**. **Expect:** the normal sign-in page with "Back to the
   lock screen". Sign in as Tunde. **Expect:** his normal dashboard (all his roles), with Lock in the header; Lock or
   the idle time brings the lock screen back.

## 11 · Remove the device (Tunde)

1. **Do:** with Segun unlocked on the tablet, Tunde → Hotel setup → Shared devices → remove (bin) → **Remove device**.
   **Expect:** "… removed"; it leaves the list.
2. **Do:** on the tablet click anything (or wait up to a minute). **Expect:** the normal sign-in page with "This
   device was removed as a shared device by a manager". `/lock` now goes to sign-in too.

## 12 · Widths

1. Phone width (390 px): the lock screen has one column of tiles, the PIN pad slides up from the bottom, and the
   dashboard header shows **Lock** without sideways scrolling.
2. Tablet width (1024 px): four tiles per row; long names are cut short (hover shows the full name).

## 13 · Activity log (Tunde → Activity log)

**Expect** lines like: "Tunde Bakare set up QA Bar tablet … as a shared device (Bar)", "Segun Ajayi signed in with PIN
on QA Bar tablet …", "Wrong PIN for … on QA Bar tablet … (1 of 5)", "…'s PIN was locked on …", "Segun Ajayi locked QA
Bar tablet … (switch person / idle 1 min)", "Tunde Bakare changed shared device …", "… set a PIN (first PIN)", "Tunde
Bakare reset …'s PIN", "Tunde Bakare removed shared device …". Sales made on the tablet show under the person who
unlocked.

## Things that must be refused

| Who | Try | Expect |
|---|---|---|
| QA Cook (Edit) | Set up a device (API `POST /identity/devices`) | 403 "Only someone with Full access, a manager or the owner …" |
| Segun | Set up a Kitchen device | 403 "You can set up a device for the roles you have Full access to …" |
| Anyone | A device for Owner | 400 "A shared device can't be for Owner …" |
| Godwin | Set a PIN | 403 "Owners and H.M.S staff sign in with email and password …" |
| Segun | Change PIN without the password | 400 "Enter your password to change your PIN" |
| Mariam | Unlock the Bar tablet | 403 "Mariam Bello doesn't work on QA Bar tablet …" |
| QA Owner B | Set up a device at Simpas Ikeja, or list/remove its devices | 403 / 404 |
| Owner B's device | Unlock Segun | 401 "We don't know that person at this hotel" |
| Segun | Reset or remind someone's PIN, list or change devices | 403 |
| Any device | Unlock with no device token (API) | 401 |

## Known limits

- An access token lives an hour: after a device is removed, a token already issued on it still works against the API
  until it expires, but the web drops it at its next page or within a minute.
- A change made in the same second a session was opened (suspend straight after an unlock) only takes effect at the
  session's next refresh; that is how access changes already work everywhere.
- The lock screen lists everyone who fits the device; a big team uses the search box.
- The owner's Staff screen has no PIN reset or remind yet (the manager's has).
- Unsaved form state is lost when the device locks.

