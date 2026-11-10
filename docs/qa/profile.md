# QA script · My profile & security (staging)

## Purpose

This script tests the Profile screen every signed-in person has (account menu → My profile & security), in the hotel app
and the admin portal: their details and photo, password, the devices they are signed in on, 2-step sign-in with an
authenticator app, and which emails they get. Every action acts on the signed-in person only. Everything you do writes to
the shared staging database.

## Links

- Hotel app: https://web-staging.hospio360.com → account menu → My profile & security (`/dashboard/profile`)
- Admin portal: https://admin-staging.hospio360.com → same menu
- Contract: `docs/profile.md` in hospio-backend

## Accounts

**Never** turn on 2-step or change the password on the shared test accounts (tunde, godwin, victor, grace, segun, mariam,
femi, jide, amoria): other QA scripts sign in with them. Make your own people:

1. Sign in as `tunde@royalsuites.ng` / `Hospio123!` (manager, Royal Suites → Simpas Ikeja).
2. Staff → Add staff: name `QA PROFILE <your initials> <date>`, an email you can make up such as
   `qa.profile.<you>.<n>@hospio-qa.test`, role Front office. Copy the invite link it shows.
3. Open the invite link in a private window and choose a password. That person is yours for this script.

You need an authenticator app on a phone (Google Authenticator, Microsoft Authenticator, 1Password …) for 2-step.

## 1 · My profile

| # | Do | Expect |
|---|---|---|
| 1.1 | Open My profile & security | Tabs My profile, Security, Notification settings. Email is greyed out with "Ask your manager to change your email" |
| 1.2 | Change Full name, Phone (`+234 803 …`, a number nobody uses) and Language (Yoruba), Save changes | "Profile saved". The header shows the new name after the page refreshes. Reload: the values stay |
| 1.3 | Phone `+234 000 000 0000`, Save | Red toast "Phone must be a real phone number …"; nothing saved |
| 1.4 | Phone = Tunde's number, Save | "This phone number is already in use on another account" |
| 1.5 | Full name `1`, Save | "Full name must be a real name, with letters" |
| 1.6 | Discard after typing | The fields go back; Save is greyed while nothing changed |
| 1.7 | Upload a JPEG or PNG portrait | "Photo saved". The round photo shows here and in the header avatar (top right) instead of the initials |
| 1.8 | Replace with a landscape photo | Cropped to the middle square |
| 1.9 | Upload a PDF, or a file over 2 MB | "The photo must be a JPEG or PNG image" / "The photo is too big · keep it under 2 MB" |
| 1.10 | As Tunde: Staff list and the person's panel, Roles & permissions | The QA person shows their photo; everyone without one shows initials |
| 1.11 | Remove | Initials again, here, in the header and on Tunde's Staff list |

## 2 · Password

| # | Do | Expect |
|---|---|---|
| 2.1 | Sign the QA person in on a second browser (or private window) too | Both work |
| 2.2 | First browser: Security → Change password with a wrong current password | "Current password is wrong" under the fields |
| 2.3 | Change it properly | "Password changed · Your other devices were signed out". You stay signed in here; the card says "Last changed …" |
| 2.4 | Second browser: click anything | Within a few seconds it lands on the sign-in page |
| 2.5 | Sign in with the old password, then the new one | Old refused, new works |

## 3 · Where you're signed in

| # | Do | Expect |
|---|---|---|
| 3.1 | Sign in as the QA person in two more browsers (e.g. Chrome and Safari, or a phone) | Security lists each: "Chrome on macOS", "Safari on iPhone" …, last used and signed-in times, and "This device" on the one you are using. No IP address anywhere |
| 3.2 | Sign out one other row → confirm | "Device signed out"; the row goes. That browser lands on sign-in at its next click (a few seconds) |
| 3.3 | Sign out all other devices → confirm | "N other devices signed out"; only "This device" is left; you stay signed in; the others land on sign-in |
| 3.4 | On a shared device (docs/qa/shared-devices.md), unlock as Segun, then open Segun's profile in a normal browser | A row "Bar tablet · PIN". Signing it out sends the tablet back to its lock screen |

## 4 · 2-step sign-in

| # | Do | Expect |
|---|---|---|
| 4.1 | Security → 2-step sign-in → Turn on | A QR code and the key in groups of four |
| 4.2 | Type a wrong code, Turn on | "That code is wrong …"; still off |
| 4.3 | Scan with the app, type its code, Turn on | "2-step sign-in is on"; 10 recovery codes shown once with Copy and Download. Save them, then "I've saved them" |
| 4.4 | Sign out, sign in with email and password | A second step "2-step sign-in · Enter the 6-digit code from your authenticator app" |
| 4.5 | Wrong code | "That code is wrong" (from the third wrong try it says how many are left; the fifth locks sign-in for 15 minutes — don't go that far unless testing the lock) |
| 4.6 | The app's code | Signed in to the dashboard as normal |
| 4.7 | Sign out, sign in, "Lost your phone? Use a recovery code", type one | Signed in. The card says 9 of 10 left. The same code a second time is refused |
| 4.8 | New recovery codes with the app's code | 10 new codes; an old one no longer works |
| 4.9 | Turn off with the password and an app code | "2-step sign-in is off"; sign-in asks only for the password |
| 4.10 | "Back to email and password" on the code step | Returns to the first step |

A PIN unlock on a shared device never asks for the code: the device was set up through a full sign-in.

## 5 · Notification settings

| # | Do | Expect |
|---|---|---|
| 5.1 | Open the tab | 7 rows (Bookings, Approvals, Money, Stock, Maintenance, Staff, Reports). In app is on and can't be switched off; Email on; SMS and WhatsApp say "Coming soon" |
| 5.2 | Turn Email off for Money and Reports, Save | "Notification settings saved"; reload keeps them |
| 5.3 | Reset after changing a switch | Back to the saved values |

## 6 · Admin portal

Sign in as a platform admin (create a fresh one in Admin team for 2-step and password; amoria only to look). The profile
works the same; there is no PIN card. The photo shows in the admin header.

## 7 · Widths and console

Repeat 1.1, the Security tab and the 2-step dialog at 1512 px, 1280 px and 390 px wide: nothing overflows sideways (the
Notification table scrolls inside its card on a phone). The browser console shows no errors.

## API sweep

`bun profapi.ts` in the e2e scratch folder runs the API side of all of this (fresh QA PROFILE people, the 2-step codes
generated from the secret, the sign-out window measured).
