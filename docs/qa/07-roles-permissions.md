# QA script · Roles & permissions (staging)

## Purpose

This script tests **Roles & permissions** in the hotel app (Manager → Roles, and the same screen for the
owner). It covers:

- the **Roles** tab: what each role allows at each level;
- the **Staff access** tab: the hotel's real people with their roles, levels and status;
- the actions on a role: give it (optionally until a day), change its level, make it temporary or remove the end
  date, pause and resume it, and remove it;
- the refusals, each with its sentence;
- what the affected person sees: a notice in the app, and on their next page their screens and role switcher
  change without signing out.

Everything you do writes to the shared staging database. **Put every role back the way it was** (section 8),
because other QA scripts sign in with these accounts.

## Links

- Hotel app: https://web-staging.hospio360.com → Roles (`/dashboard/roles`)
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Contract this follows: `docs/roles-permissions.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email | Roles before you start |
|---|---|---|---|
| Manager | Tunde Bakare | `tunde@royalsuites.ng` | Manager · Full |
| Owner | Godwin Kwin | `godwin@royalsuites.ng` | Hotel owner · Full (every hotel) |
| Front office | Victor Adeyemi | `victor@royalsuites.ng` | Front office · Full |
| Housekeeping | Grace Okafor | `grace@royalsuites.ng` | Housekeeping · Full |
| Kitchen | Mariam Bello | `mariam@royalsuites.ng` | Kitchen · Full |
| Bar | Segun Ajayi | `segun@royalsuites.ng` | Bar · Full |
| Finance | Femi Ojo | `femi@royalsuites.ng` | Finance · Full |
| Inventory | Jide Alabi | `jide@royalsuites.ng` | Inventory · Full |
| Maintenance (supervisor) | Chinedu Obi | `chinedu@royalsuites.ng` | Maintenance · Full |
| Maintenance (technician) | QA Technician | `qa.tech@royalsuites.ng` | Maintenance · Can edit |
| Laundry | Lola Eze | `lola@royalsuites.ng` | Laundry · Full |

Use a separate browser profile, or a private window, for each account. That way you can stay signed in as the
manager and as the person whose roles you change at the same time.

## Before you start

- Reload the page (Ctrl/Cmd + R) whenever you are told a new version was deployed.
- Levels build on each other: **Full** includes **Can edit**, which includes **View only**. A manager and the
  owner can do everything every role allows.
- A change reaches the person on their **next page**. Their open session swaps its token for one with the new
  roles; they do not need to sign out.
- A "last day" means the role works through that day and ends at midnight after it (Lagos time). The server
  removes ended roles every hour at :05.
- The **API** button at the bottom left lists every call the screen made, with the answer.

## 1 · Roles tab (Tunde)

1. **Do:** sign in as Tunde → **Roles**. **Expect:** nine cards: Manager, Front office, Housekeeping, Laundry,
   Maintenance, Kitchen, Bar, Inventory, Finance. Each shows how many people hold it here. A dashed
   **Managers only** card lists approvals, voids, hotel setup, staff and roles, and so on.
2. **Do:** click **Kitchen**. **Expect:** a side panel with Orders & tickets, Menu and Stock. Each has three
   columns: View only, Can edit ("View only, plus …") and Full ("Can edit, plus …"). For example, Full adds
   "Cancel an item already sent" and "Add and edit categories, items and happy hours".
3. **Do:** click **Who holds it** at the bottom. **Expect:** the Staff access tab opens.
4. **Do:** click **Maintenance**. **Expect:** "Assign jobs to anyone and run any job (supervisor)" and assets and
   scheduled jobs are under Full. Taking an unassigned job and running your own jobs are under Can edit.

## 2 · Staff access (Tunde)

1. **Expect:** the hotel's real people, with roles and levels as chips (for example "Front office · Full"). The
   Status column reads Active, Paused, Until <day>, Invited or Suspended. None of the old sample names (Toyin
   Balogun, Sade Williams, Ada Okeke) appear.
2. **Expect:** Tunde's own row says "Management · you". Its menu only offers **See what they can do**, and
   opening it says "You can't change your own access".
3. **Do:** type "kitchen" in the search. **Expect:** only people holding Kitchen. Clear it.
4. **Do:** click Victor's row. **Expect:** a panel with each role and what it allows at his level, plus the
   buttons Change level, Make temporary, Pause and Remove.

## 3 · Give a role (Tunde, Victor)

1. **Do:** as Victor, sign in in a second window and open the role switcher (profile menu → **Switch role**).
   **Expect:** only Front office.
2. **Do:** as Tunde → **Give a role** (top right) → Person **Victor Adeyemi**. **Expect:** the Role list leaves
   out Front office (he has it) and never offers Hotel owner.
3. **Do:** Role **Kitchen**, Level **View only**, leave Last day empty → **Give role**. **Expect:** the toast
   "Victor Adeyemi now has Kitchen · View only". The panel closes and his row shows "Kitchen · View only".
4. **Do:** as Victor, open any page, or **Switch role**. **Expect:** Kitchen is offered and he did not have to
   sign in again. Notifications shows "You now have Kitchen · View only · Given by Tunde Bakare".
5. **Do:** as Victor switch to Kitchen. **Expect:** the kitchen board opens, but marking a dish sold out is
   refused (View only).

## 4 · Change level and temporary access (Tunde)

1. **Do:** Victor's row menu → **Change level** → Role **Kitchen** → **Can edit** → **Save level**. **Expect:**
   "Kitchen is now Can edit for Victor Adeyemi"; the chip reads "Kitchen · Can edit". Victor is told.
2. **Do:** the row menu → **Temporary access** → Role Kitchen → Last day = three days from today → **Set last
   day**. **Expect:** "Victor Adeyemi's Kitchen ends after <day>". The chip adds "until <day>" and Status reads
   "Until <day>".
3. **Do:** open the same modal → **Remove end date**. **Expect:** "Kitchen no longer ends for Victor Adeyemi";
   Status is Active.
4. **Do:** try a Last day in the past. **Expect:** **Set last day** stays disabled.

## 5 · Pause, resume and remove (Tunde, Victor)

1. **Do:** click Victor's row → under Kitchen → **Pause** → Reason "QA" → **Pause role**. **Expect:** "Kitchen
   paused for Victor Adeyemi"; the chip is grey with "paused" and Status reads "Partly paused".
2. **Do:** as Victor, open any page. **Expect:** Kitchen is no longer offered, and Notifications shows "Your
   Kitchen access is paused · QA".
3. **Do:** as Tunde → Kitchen → **Resume** → **Resume role**. **Expect:** "Kitchen resumed for Victor Adeyemi";
   Victor gets Kitchen back on his next page.
4. **Do:** Kitchen → **Remove** → **Remove role**. **Expect:** "Kitchen removed from Victor Adeyemi"; his row
   shows only Front office. Victor loses Kitchen on his next page and is told.
5. **Do:** the row menu → **Remove a role** (Front office, his only role) → **Remove role**. **Expect:** the red
   toast "Front office is Victor Adeyemi's only active role. Give them another role first, or pause this one
   instead". Nothing changes.

## 6 · The owner (Godwin, Grace)

1. **Do:** sign in as Godwin → **Roles**. **Expect:** the same screen for the branch picked at the top, with the
   hotel's staff, Tunde included.
2. **Do:** Grace's row → **Give a role** → **Bar** · **View only** → **Give role**. **Expect:** "Grace Okafor now
   has Bar · View only"; Grace is offered Bar on her next page.
3. **Do:** Grace's panel → Bar → **Change level** → Full → Save; then **Pause** → **Pause role**; then
   **Remove** → **Remove role**. **Expect:** a toast each time and the chip changes; at the end Grace has only
   Housekeeping.
4. **Do:** Godwin can also give **Manager**. Give Grace Manager · View only, check her role switcher offers
   Manager, then remove it.

## 7 · Refusals

| Who | Action | Expect |
|---|---|---|
| Femi (Finance) | Give or change anyone's role (API `POST /identity/users/{id}/roles`) | 403 "You don't have access to do that" |
| Tunde | Give OWNER (API) | 403 "The owner role is given by Hospio360 or by transferring ownership" |
| Tunde | Give himself a role or change his own (API) | 403 "You can't change your own access. Ask the owner or another manager" |
| Tunde | Remove someone's only active role | "<Role> is <name>'s only active role. Give them another role first, or pause this one instead" |
| Tunde | Give a role the person already holds (API) | 409 "<name> already has <Role> here (<level>). Change the level instead" |
| Tunde | Role "BOSS" or level "SUPER" (API) | "\"BOSS\" is not a valid role. Use one of: …" / "\"SUPER\" is not a valid level. Use one of: VIEW, EDIT, FULL" |
| Tunde | A last day before today (API) | "The last day must be today or later" |
| Tunde | Set the level it already has, or pause a paused role (API) | "Kitchen is already Can edit for …" / "…'s Kitchen is already paused" |
| Tunde | Change the owner's role (API) | 403 "Only Hospio360 can change the owner's access" |
| Any person | A call with a token from before their roles changed (API) | 401 "Your access has changed. Sign in again to continue" (the app swaps the token by itself) |

## 8 · Put everything back

1. **Do:** as Tunde → Staff access. **Expect:** every account in the table above holds exactly the roles in
   "Roles before you start", none paused and none with "until".
2. Remove any extra role you gave. Resume anything you paused. Clear any end date with **Temporary access** →
   **Remove end date**.

## Known limits

- The **Roles** tab describes the services' guards. Levels are fixed by Hospio360, and a hotel can't edit what a role
  allows.
- A temporary role stops working at midnight after its last day. It stays on the list (with "until") for up to an
  hour, until the hourly clean-up removes it and tells the person.
- A manager sees and changes only people with a role at their own hotels. The owner, whose role covers every
  hotel, is not on the manager's list.
- If the event stream is down, a person whose roles changed keeps their old roles until their token runs out
  (at most an hour), or until they open a page (the app checks their roles on every page).
- **Pause all access** (the Staff screen) is separate from pausing one role here. A person paused there can't
  sign in, whatever their roles say.

