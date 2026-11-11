# QA script · Hotel business onboarding and setup (staging)

How a hotel business gets into Hospio360 and sets itself up, on both paths. Everything in this script
writes to the real staging database: businesses, hotels, room types, rooms and logins you create stay
there and show up for every role, so name them after yourself (e.g. "QA Ada Hotels").

- Web: https://web-staging.hospio360.com (hotel app) · https://admin-staging.hospio360.com (platform
  admin) · API: https://api-staging.hospio360.com
- Seed accounts (password `Hospio123!`): owner `godwin@royalsuites.ng` (Royal Suites Ltd, 4 hotels,
  onboarded by Hospio360 and already live), manager `tunde@royalsuites.ng`, super admin
  `amoria@hospio360.com`, support `kola@hospio360.com`.
- Phone code on staging: `123456` (no SMS is sent; the real code is in the identity-service log).
- Live: sign-up, phone check, invites, the owner wizard (tenant, identity, hotel-config, property),
  owner Hotels / Users / Settings / Hotel setup, manager Staff (list, add, reset password, suspend,
  resume, remove) and Hotel setup (saves and the danger zone).
- Still sample data: finance figures on the Hotels screen (revenue, expenses, margin, occupancy show
  "—" until finance-service is wired), the manager's rota, leave and shift requests, Contact manager /
  Message, Transfer ownership, exports.
- Invites and temporary passwords are emailed for real to the address typed; SMS and WhatsApp invites are
  "coming soon" and the phone is optional. Every new login also shows its temporary password and invite link
  once, with Copy buttons and a "Share in your WhatsApp" button that opens your own WhatsApp with the message
  ready. The card says "The invite was emailed to <address>". Use `@hospio-qa.test` addresses.

## Deliveries

Emails are sent for real, to the address typed. SMS and WhatsApp are not sent yet ("coming soon"); the
phone code on staging is always `123456`. Whenever the platform sends something (an invite, a temporary
password, a handover pack), a yellow message card appears top-centre of the hotel app with the channel,
the recipient, the subject and the full text, each with a Copy button, marked "Email sent to …" or
"Not sent · … coming soon"; it stays until you press Close and several can
stack. The invite card inside the panel still shows the password and link as before; the notice is in
addition. Steps marked **(delivery)** must show it: sign-up (the phone code), the phone-check page
when the code is sent or re-sent, Invite user, Resend invite, Reset password, the wizard's manager
step and the manager sub-step of Add new hotel. If it does not appear, that is a bug.

## Self-serve path (an owner signs up on the web)

### 1 · Create the account

1. Open the web app signed out → sign-in page → "New here? Create your hotel account" → `/sign-up`.
2. Fill full name, a **new** work email, phone (`+234…`), password (8+ characters), business name,
   city → "Create account" → you land on "Check your phone" **(delivery)**: the notice shows the SMS
   with the code.
3. Try the same email again in another window → under Work email: "Someone already signs in with
   <email>. Sign in instead".

### 2 · Phone check

1. The code is sent when the page opens; "Resend in 0:45" counts down, then "Send the code again".
2. Enter `123456` (the staging hint under the boxes says so) → "Phone confirmed" → the Welcome
   checklist at `/onboarding`.
3. Alternative: "Skip for now" → the checklist opens without confirming the phone.

### 3 · The wizard

1. Welcome, {first name}: four steps, none ticked, "Start setup" → Step 1.
2. **Step 1 Your business**: trading name is pre-filled from sign-up; add registered name, RC
   number, address, business email → Continue → "Business saved". The right card previews the receipt.
3. **Step 2 Your first hotel**: name, address, city, front-desk phone/email, check-in 14:00, check-out
   12:00 → Continue → "Hotel created". The dark card on the right lists it.
4. **Step 3 Rooms & prices**: two rows are suggested (Regular from 101, Deluxe from 201). Put how many
   and a price per night for each (e.g. 3 × ₦46,000 and 2 × ₦68,500), keep "Number the rooms for me"
   on → "Create rooms & continue" → the green note says "2 room types and 5 rooms created"; Continue.
5. **Step 4 Your first manager**: full name, phone, a **new** email → "Create login & continue" → the
   invite card shows the temporary password and the invite link with Copy buttons and "Send on
   WhatsApp"; note both. Continue. (Or "Skip for now".)
6. **All set**: the summary lists business, hotel + rooms, the manager's pending invite, and what is
   still open → "Go to my dashboard" → the owner dashboard opens with the new hotel in the sidebar.
7. Leave and come back: at any step click "Save and finish later" → you are sent back to the
   checklist (the dashboard sends an owner still onboarding back here); sign out and in again → still
   the checklist, done steps ticked, "Continue setup" opens the next one; Step 1 and 2 are pre-filled
   from the saved draft; Step 3 shows the types already created as locked rows.

### 4 · The manager's first day

1. Open the invite link from step 3.5 in a private window → "Set up your account": name and email
   read-only, role "Manager · {hotel}" → set a password → "Accept and continue" → the manager
   dashboard for the new hotel.
2. Open the same link again → "This invite has expired or was already used" with "Ask for a new invite".
3. Alternative sign-in: the manager's email + the temporary password on the sign-in page → "Choose your
   password" → sign in again with the new one.
4. As the new manager: Staff lists the manager; Hotel setup opens with the default sections (check-in
   14:00, VAT 7.5% under "Set by the owner", greyed), Rooms shows the 5 rooms.

### 5 · Owner screens (as the new owner, or as `godwin@royalsuites.ng`)

1. **Hotels**: the list from tenant-service; finance columns show "—" for hotels without figures.
   "Add new hotel" → Basics, Address, Rooms & prices (optional: a count and a starting price create a
   "Standard" type and rooms 101…), Manager (optional invite), Review → "Add hotel" → the panel shows
   the result and, if invited, the manager's temporary password and link; Done → the hotel is in the
   list and in the sidebar switcher at once.
2. Row → Edit hotel: change the phone, email and check-out time → Save → the row updates after refresh.
   Status "Paused" in the same panel → the status pill changes.
3. Row menu → Pause new bookings / Reopen hotel / Close hotel (close offers "Pause instead").
4. Hotel row → Details & rooms → the detail page opens for that hotel.
5. **Users**: the business's portal users from identity. "Invite user": name, email, phone, role
   (Manager / Finance / Inventory), hotel → "Create login" → the invite card **(delivery)**. Row menu →
   Resend invite (pending invites only) → a new password and link **(delivery)**; the earlier
   temporary password stops working. Reset password → confirm → a new temporary password shown once
   **(delivery)**; Pause access → status Paused, Resume access → Active; Change role & hotels →
   tick another hotel → Save → the Hotels column lists both; Remove access → the user is gone (or
   "Pause access instead").
6. **Settings → Company**: pre-filled from the business; change the RC number and address → Save →
   refresh → kept. **Taxes & currency** and **Approval limits** show the active hotel's name and save
   to that hotel's Hotel setup (change VAT to 7.5 → Save → Hotel setup → Taxes shows the same value);
   switch hotel in the sidebar → the other hotel's values.
7. **Hotel setup** in the owner's sidebar → the same screen as the manager's, with Taxes & currency,
   Approval limits and the danger zone unlocked. Danger zone → "Pause this hotel" → confirm → Hotels
   shows it Paused; "Reopen this hotel" puts it back.

### 6 · Manager screens (as `tunde@royalsuites.ng`, Simpas Ikeja)

1. **Staff**: the hotel's people from identity (every grant on this hotel plus the owner). "Add staff":
   name, phone, email, role (e.g. Front office), level → "Add staff" → the invite card with the
   temporary password and link. Refresh → they are in the list.
2. Row menu → Reset password → confirm → a new temporary password (shown once). Suspend → Paused;
   Resume access → Active. Remove from hotel → the row is gone ("Suspend instead" is the alternative).
3. Sign in as the new staff member with the temporary password → "Choose your password" → their
   tablet screen opens.
4. **Hotel setup**: Hotel basics → change check-out to 11:00 → Save → "Hotel basics saved"; refresh →
   kept. Reasons & lists → add a cancellation reason → Save → it stays; remove it → Save → gone. The
   owner-only sections are visible but greyed with "Only the owner can change this section".

## Back-office path (Hospio360 onboards the hotel)

See the admin section: the platform admin's 10-step wizard, the handover and the owner's first sign-in
(`/reset-password` → `/handover` → dashboard) are scripted there. The hotel app's part is `/handover`:
after the handed-over owner changes the temporary password and signs in, "Your hotels are ready" lists
the hotels, people and setup Hospio360 created; tick "I've checked the setup" → "Accept and go to my
dashboard" → the business goes live and the owner dashboard opens. Until they accept, every `/dashboard`
visit returns them to `/handover`.


### The admin's walk-through (action → expected)

The steps below run in the admin portal as `amoria@hospio360.com` / `Hospio123!` (support
`kola@hospio360.com` can do the same). Use a fresh business name each run, for example
`QA Palms <date>`, and owner / manager emails you can tell apart (`qa-owner+<date>@example.com`,
`qa-manager+<date>@example.com`). Keep a notepad open: temporary passwords are shown once.

### A. Sign in and create the business (C1 · C3)

1. Open https://admin-staging.hospio360.com and sign in as `amoria@hospio360.com` / `Hospio123!` →
   the admin dashboard opens; the "Onboarding" KPI shows how many businesses are in progress and a
   link "Open the board".
2. Sidebar → Hotel businesses → the list shows every business with its stage; the stage tabs count
   them; the search box narrows by name, owner or city.
3. Click "Set up a business for them" → the side panel opens. Fill owner name `QA Owner`, email
   `qa-owner+<date>@example.com`, phone `+2348010000099`, business name `QA Palms <date>`, city
   `Abuja`, fee model "% of payments" with `1.5`, leave the marketer empty → "Create business" is
   enabled.
4. Click "Create business" → toast "QA Palms <date> created · onboarding started" and the browser
   lands on `/dashboard/onboarding/<businessId>` with a full page load, at **Step 1 of 10 · Business
   & legal**. The header reads "Set up QA Palms <date>" with the Onboarding pill; the left rail shows
   10 steps, none done. After each step is saved its subtitle reads "saved just now".
5. Sidebar → Onboarding → the board shows the new business under "In progress" as "Hospio360 · <you> ·
   Step 1 of 10 · Business & legal". Click the card → back in the wizard.

### B. Walk the 10 steps (J2–J12)

6. **Step 1 · Business & legal**: registered name `QA Palms Hotels Ltd`, registration `RC 1873402`,
   type "Limited company", address `Plot 41 Aminu Kano Crescent, Wuse 2`, city stays `Abuja`, business
   email `accounts@qapalms.ng`, phone `+2349000000001` → "Save and continue" → toast-free save, the
   rail marks step 1 with a check and **Step 2 of 10 · Owner & contacts** opens. Reload the page →
   the wizard reopens on step 2 (the draft remembers the step).
7. **Step 2 · Owner & contacts**: the owner fields are prefilled from the create panel; add a second
   contact `QA Co-owner`, `qa-co@example.com` → "Save and continue" → step 2 done, **Step 3 · Fee &
   contract** opens.
8. **Step 3 · Fee & contract**: "% of payments" is selected with `1.5`; set "Agreement starts on" to
   today, notes `First 30 days free` → "Save and continue" → step 3 done, **Step 4 · Hotels** opens with
   an empty table; "Save and continue" is disabled until a hotel exists.
9. **Step 4 · Hotels** → "Add a hotel": name `QA Palms Wuse`, city `Abuja`, address `Plot 41 Aminu
   Kano Cres`, phone `+2349000000002`, check-in `14:00`, check-out `12:00` → "Add hotel" → toast
   "Hotel added", the row appears with 0 rooms. Click "Edit" on the row, change the phone, "Save
   hotel" → the row updates. Add a second hotel `QA Palms Maitama` → two rows. "Save and continue" →
   step 4 done, **Step 5 · Rooms** opens with a tab per hotel.
10. **Step 5 · Rooms**, tab `QA Palms Wuse`: type `Standard`, price `48000`, rooms `10`, first number
    `101`, floor `1` → "Make rooms" → toast "Standard: 10 rooms made", the "Room types made" card lists
    Standard · ₦48,000 · 10, the tab count reads 10, the green line reads "10 rooms made as Standard".
11. Still on step 5: "Paste a room list" → paste
    ```
    201, Deluxe, 2
    202, Deluxe, 2
    101, Standard, 1
    ```
    → the footer reads "3 rooms ready" → "Import 3 rooms" → the result line reads "2 of 3 rooms
    imported · 1 skipped (already there)" (101 already exists), Deluxe appears with "Set in Hotel
    setup" as its price. Switch to `QA Palms Maitama`, make `Standard · 45000 · 5 · from 101` → 5 rooms.
    "Save and continue" → step 5 done, **Step 6 · Hotel setup** opens.
12. **Step 6 · Hotel setup**: the templates from tenant are listed (the default "Standard Nigerian
    hotel" is selected); "What it fills in" lists its sections; both hotels are ticked → "Apply to 2
    hotels and continue" → toast "… applied to 2 hotels", step 6 done, **Step 7 · People** opens.
13. **Step 7 · People** → "Add a person": `QA Manager`, `qa-manager+<date>@example.com`,
    `+2348010000098`, role Manager, hotel `QA Palms Wuse` → "Add person" → toast "QA Manager added";
    the row shows the temporary password in brand colour and the status "invited". Row menu →
    "Copy invite link" → toast "Invite link copied"; paste it somewhere: it is
    `https://web-staging.hospio360.com/accept-invite?token=…`. Keep the manager's temporary password.
14. Still on step 7: "Paste a staff list" → paste
    ```
    QA Reception, qa-fo+<date>@example.com, , Front office, QA Palms Wuse
    QA Nobody, not-an-email, , Manager, QA Palms Wuse
    ```
    → the footer reads "1 ready · 1 with problems (skipped)" → "Add 1 people" → the result line reads
    "1 of 1 people added"; the table has three rows. Row menu on QA Reception → "Resend invite" →
    toast "New invite for QA Reception" and the password in the row changes. "Save and continue" →
    step 7 done, **Step 8 · Connections** opens.
15. **Step 8 · Connections**, tab `QA Palms Wuse`: WhatsApp number `+2349091120041` → "Save number" →
    toast "WhatsApp number saved", status pill "number saved". Add a terminal: name `Front desk POS`,
    provider "Logging (test)", reference `QA-FD-01` → "Add terminal" → toast "Terminal added", the row
    shows "linked · not seen yet". Switch to Maitama, type a number but do not click save. "Save and
    continue" → both numbers are saved, step 8 done, **Step 9 · Go-live checklist** opens.
16. **Step 9 · Go-live checklist**: the card reads "QA Palms <date> · 8 of 8 ready" with every item
    ticked (business details, owner contact, fee, at least one hotel, every hotel has rooms, template
    applied, at least one manager login, WhatsApp on every hotel). Untick nothing; add the note
    `Training Thu 10am at Wuse` → "Mark ready for handover" → step 9 done, **Step 10 · Logins &
    handover** opens. Sidebar → Onboarding → the card now sits under "Ready for handover" (after
    step 10 is saved in the next section it stays there until the handover is sent).

### C. Handover (J14–J16)

17. **Step 10 · Logins & handover**: the table lists the owner (password "Made when the handover is
    sent"), QA Manager and QA Reception with their temporary passwords. "Preview handover pack" →
    the pack modal shows the logins, the two hotels with their room and staff counts and WhatsApp
    numbers, the fee line and the note from step 9. "Print" opens the browser's print dialog with the
    pack alone on the page; cancel. "Close".
18. "Copy passwords" → toast "2 logins copied".
19. "Send handover" → the confirm modal "Hand QA Palms <date> over to QA Owner?" names the owner's
    email; optional note → "Send handover" → toast "QA Palms <date> handed over to QA Owner"; the stage
    pill in the header reads **Handed over**; an "Owner login · QA Owner" card appears with the email,
    the temporary password and the invite link, each with a copy button. **Write the password down:
    it is not shown again.**
20. Reload the page → the wizard opens on step 10 in its done state: a green note "… was handed
    over", the owner row in the table reads "invited", the owner card is gone, and "Reset the owner's
    temporary password" is available. Do not reset yet.
21. Sidebar → Onboarding → the card sits under "Handed over" with 10 / 10. Hotel businesses → the
    row shows the stage Handed over → open it → the overview shows the owner, source "Set up by
    Hospio360", the fee and two hotels; the Hotels tab lists both with their rooms; the People tab lists
    the owner, QA Manager and QA Reception as "invited".

### D. The owner signs in (hotel app)

22. In a private window open https://web-staging.hospio360.com, sign in as
    `qa-owner+<date>@example.com` with the temporary password from step 19 → the app asks for a new
    password (must change on first sign-in). Set `QaOwner-2026!` → the handover screen opens
    ("/handover"): it lists the two hotels, the logins Hospio360 made and the settings.
23. "Accept and continue" → the owner dashboard opens; the branch switcher lists both hotels. Back in
    the admin wizard, "Send handover" is now refused with "The owner has already accepted the
    handover; reset their password from People instead".
24. Back in the admin portal → Hotel businesses → QA Palms → the stage is **Live** (reload if the page
    was open); the People tab shows the owner as "active" with a last sign-in.

### E. Manager's invite and admin people actions (J17 · C2e)

25. In another private window open the manager's invite link copied in step 13 → the accept-invite
    screen shows "QA Manager", the email read-only and the hotel; set a password → the manager lands
    on the manager dashboard for QA Palms Wuse.
26. Admin → QA Palms → People → row menu on QA Reception → "Reset password" → a modal shows a new
    temporary password with a copy button, once. Row menu → "Pause access" → toast "QA Reception
    paused", the status pill reads "paused"; "Resume access" brings it back.
27. Admin → QA Palms → "Change stage" → pick Suspended → the button stays disabled until the reason
    has 8+ characters; type `QA: testing suspension` → "Suspend business" → the pill reads Suspended.
    Change stage back to Live with no reason → Live again.
28. Row menu (⋯) → "Change account manager" → pick another admin → toast; the subtitle shows the new
    name. "Edit business" → change the trading name to `QA Palms <date> v2` → "Save business" → the
    title updates.

### Not covered on purpose

- Fee statements, support tickets and the "Changes by Hospio360" timeline stay on sample data until
  platform-service lands.
- Invites and passwords are emailed for real; SMS and WhatsApp are "coming soon" (shown on screen, not sent).
- Phone verification is the self-serve path (hotel app); see the owner section of `onboarding.md`.

