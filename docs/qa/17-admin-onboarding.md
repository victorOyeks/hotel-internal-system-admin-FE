# QA script · Admin back-office onboarding: Set up a business and steps 1–7 (staging)

The platform admin sets up a business for an owner: the "Set up a business for them" panel, then the 10-step wizard.
This script covers the panel and steps 1–7 (Business & legal, Owner & contacts, Fee & contract, Hotels, Rooms, Hotel
setup, People) and the manager's first sign-in. The screen and the API apply the same rules, so a value refused here is
also refused if sent straight to the API.

- Admin portal: https://admin-staging.hospio360.com · hotel app: https://web-staging.hospio360.com
- Sign in as `amoria@hospio360.com` (password `Hospio123!`).
- Use `@hospio-qa.test` addresses for every owner, manager and business you create (emails are sent for real).
  Phone codes on staging are `123456`.
- Name businesses after yourself ("QA Ada Abuja Palms …"): the business name must be unique.

## The rules

| Field | Accepted |
|---|---|
| Owner's full name, business (trading) name, registered name, hotel name | 2–120 characters with at least two letters. `0000`, `@#$%` and blanks are refused. The registered name is optional. |
| City | Required. Letters only (no digits), 2–80 characters. |
| Address | Optional. 5–200 characters with at least three letters. |
| Email | `name@domain.tld`. `owner@` and `owner@hotel` are refused. The owner email is required; the others are optional. |
| Phone | Optional. 10–15 digits, with an optional `+`, spaces, brackets or dashes. The last ten digits can't all be the same digit. `+234 803 555 0192` and `0803 555 0192` count as the same number. |
| CAC / registration number | Optional. `RC`, `BN` or `IT` followed by 1–8 digits (`RC 1873402`). Plain digits count as RC. All zeros is refused. |
| Share (%) | Required. 0 to 100 inclusive, with at most two decimals. |
| Fee per room night | Required. ₦0 to ₦1,000,000. |
| Check-in / check-out | Required time, like 14:00. |
| Room row | Type: 2–60 characters with letters. Price a night: ₦100 or more. Rooms: 1–500. First number: up to 3 letters then 1–5 digits (`101`, `A101`), not 0. Floor: optional, a number from -5 to 200, or `G`. |

These must be unique:

- **A business name, an owner email, an owner phone and a CAC number** can only belong to one business. A duplicate is
  refused with a sentence under the field: "A business called X already exists…", "x already has an account…",
  "This phone number is already in use…" or "CAC number RC n is already used by X…". The check ignores capitals and
  extra spaces, and treats `0…` and `+234…` as the same phone. An email or phone that a staff login already uses is
  refused too.
- **A hotel name** can only be used once within a business.
- **A room type name** can only be used once within a hotel, and each type has one price. A row that names an existing
  type adds rooms to that type: leave the price blank, or enter the same price.
- **A room number** can only be used once in a hotel. Overlaps are refused before anything is made, and the message
  names the numbers.

Grey text in an empty field is only a hint. It is never saved, and a required field left empty shows an error.

## 1 · Set up a business (panel)

1. Businesses → **Set up a business for them**. Share (%) is empty with a grey "e.g. 1.5". Pick each fee model:
   the field stays empty. Type `2`: the field shows `2`.
2. Enter `0000` as the owner name, `owner@` as the email, `0000` as the phone, `0000` as the business name and `0000` as
   the city, then press **Create business**. A red error shows under each field, the panel stays open and nothing is
   created.
3. Change the email to `owner@hotel`, the phone to `abc123` and the business name to `@#$%`. Each is refused. The fields
   you fixed keep their values and lose their errors.
4. Try Share values `-1`, `100.1`, `abc`, `1.555` and blank: each is refused. `0` and `100` are accepted.
5. Enter an existing business's owner email. It's refused under Email. Then enter an existing business name in
   different capitals: it's refused under Business name. Then enter an existing owner phone in the `0…` form: it's
   refused under Phone.
6. Enter valid details and create the business. The wizard opens at Step 1.

## 2 · Step 1 · Business & legal

1. Enter `0000` in every field, then **Save and continue**. Each field shows an error and you stay on Step 1. Try
   `000000000` for the CAC number and the phone: both are refused.
2. Enter a CAC number another business uses, written differently (`rc-1873402` or `1873402`). It's refused under the
   field, and the other business keeps its number.
3. Enter valid values. Step 2 opens. Clearing an optional field and saving clears it.

## 3 · Step 2 · Owner & contacts

1. Clear Full name and Email, then save. You get "required" errors.
2. Enter `0000` as the name, `owner@` as the email and `000000000` as the phone. Each is refused and you stay on Step 2.
3. Leave the owner valid. In the second contact, enter `hauwa@` and `0000`: both are refused. Clear them and save: an
   empty second contact is fine.

## 4 · Step 3 · Fee & contract

1. Share shows the value you chose in the panel. That is the saved fee, not an automatic number. Choose Per room night:
   the field is empty with a hint. Choose a % model again: the saved share is back.
2. Clear the share and save. You get "Enter the share (%)". `100.1` is refused. `2` saves.

## 5 · Step 4 · Hotels

1. **Add a hotel** with the name and city blank → **Add hotel**. You get required errors and no hotel is made.
2. Enter `000000`, `00000`, `00000`, `0000`, `wuse@` and a blank check-in. Each field is refused.
3. Add "Abuja Palms Wuse", Abuja. Then add "abuja palms WUSE" again: it's refused under the name, and the list still
   has one hotel. The same name in a different business is fine.

## 6 · Step 5 · Rooms

1. Every field in the row is empty, with grey hints only (Standard, ₦48,000, 20, 101, 1). **Add a row**: the new row
   is empty too.
2. Enter invalid values: a blank type, a price of `abc`, `-1` or `0`, rooms of `0`, `-5` or `100000`, a first number
   of `0` or `abc`, and a floor of `abc`. **Make rooms** shows an error under each field and makes nothing. **Save and
   continue** stays on Step 5.
3. Leave the first number blank → "Enter the first room number". 101 is never used unless you type it.
4. Enter two rows that both start at 101. The overlap is refused and the message names 101–120.
5. Make Standard ₦48,000 × 20 from 101, floor 1. "Rooms made · 20" lists Standard 101–120, and the header says
   "· 20 rooms". A new row from 101 is refused with "Rooms 101–120 already exist… Start from 121".
6. Enter a row of "standard" at ₦60,000. It's refused: one type has one price. Leave the price blank, enter 5 rooms
   from 121, and make them. They join Standard, which now has 25 rooms and is still one type.
7. **Paste a room list**. The dialog explains the format: number, type, price a night, floor, with the price optional
   for a known type. Paste a list that has a number twice, a number already in the hotel, and a second price for one
   type. Each problem is listed by line and **Import** stays disabled. Paste a clean list
   (`301, Suite, 120000, 3` / `302, Suite, , 3` / `401, Family, 90000, 4`) and import it. The rooms appear with the
   right type, price and floor, and the total goes up.
8. In Rooms made, **Edit** Standard and change the price to ₦50,000. Open **Rooms**, then edit a room: renumbering it to
   a number that's taken is refused, while a free number saves. **Delete** a room: a confirmation appears, and the
   total goes down. A room that has had a booking can't be deleted ("…take it out of order instead").
9. Type a row without making it, then **Save and continue**. If the row is incomplete, you get errors. If it's
   complete, it is made and Step 6 opens.
10. Click **Back**, use the step list on the left, and use the browser's Back. Step 5 shows the same rooms each time.
    Continuing again creates no duplicates. A row you typed but didn't make is still there after you come back.

## 7 · Step 6 · Hotel setup

1. Tick the hotel, then **Apply to 1 hotel and continue**. Step 7 opens.
2. Click Back, use the step list, and reload the page. Each time, the template is still chosen, the hotel is still
   ticked, and it shows "applied" with the date. The applied values are in that hotel's Hotel setup.

## 8 · Manager's first sign-in

1. In Step 7 (People), add a manager with a `@hospio-qa.test` email. Note the temporary password.
2. In a private window, sign in at the hotel app with that email and password. "Choose your password" opens. Each of
   the three password fields has an eye that shows the text and hides it again. The same applies to "Choose your
   password" in the admin portal.
