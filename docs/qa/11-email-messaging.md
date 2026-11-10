# QA script · Email and guest messaging (staging)

## Purpose

Email now goes out for real through Brevo SMTP from one sender in messaging-service. This script checks that every
email reaches the saved address (any domain), shows who it is from (the hotel's name) and where replies go (the hotel's
front desk email), that a provider refusal never breaks the action, and that the on-screen notice still shows every
message. It also tests the guest messaging screens (Manager · Messaging, Front office · Messages, Message guest on a
booking): send, reply, reassign, mark done, templates and the message to everyone on shift. SMS and WhatsApp are not
connected yet: every place that offers them says "coming soon" and shows the text to copy.

Everything you do writes to the shared staging database **and sends real email** to whatever address you type. Keep
the volume sensible (no loops of hundreds).

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract: `docs/email.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Role | Email | Hotel |
|---|---|---|
| Manager | `tunde@royalsuites.ng` | Simpas Ikeja (Royal Suites) |
| Front office | `victor@royalsuites.ng` | Simpas Ikeja |
| Owner | `godwin@royalsuites.ng` | Royal Suites (all hotels) |
| Finance | `femi@royalsuites.ng` | Simpas Ikeja |
| Inventory | `jide@royalsuites.ng` | Simpas Ikeja |
| Owner B (two hotels) | `qa.ownerb.fcekd@hospio-qa.test` | QA B Ikoyi fcekd, QA B Abuja fcekd |

Use your own inbox (a gmail you read) wherever a step says "your address".

## 1. The on-screen notice

1. As Tunde, Staff → Add staff: any name, **your address**, role Front office. Save.
2. **Expect** the notice at the top: "Email goes out for real · SMS and WhatsApp are coming soon". The two emails
   (temporary password, invite) each say **"Email sent to <your address>"**; the SMS row says **"Not sent · SMS coming
   soon"**. Copy works on each.
3. **Expect** in your inbox within a minute: two emails from **"Simpas Ikeja"** (the hotel's name), address
   `no-reply@coryd.ng`; the header shows the hotel name, a button (Accept the invite / Sign in), a footer "Sent by
   Simpas Ikeja with Hospio360 · Reply to this email to reach Simpas Ikeja". Replying goes to the hotel's email.
4. Repeat with an address on `@hospio-qa.test`. **Expect** the same notice ("Email sent to …"); the address can't
   receive, so Brevo refuses or it bounces later. The staff member is created either way.

## 2. From name per hotel

1. As owner B, Staff → Add staff at **QA B Ikoyi** with your address, then at **QA B Abuja** with your address (or a
   `+abuja` alias).
2. **Expect** one email from "QA B Ikoyi fcekd" and one from "QA B Abuja fcekd". Mail with no hotel (H.M.S staff) comes
   from "Hospio360".

## 3. Guest messaging · Front office (Victor)

1. Bookings → open a booking whose guest has an email → **Message guest**.
2. **Expect** "Send by": Email (the guest's address), **WhatsApp · coming soon**, **SMS · coming soon**. Templates list
   the hotel's templates (empty until section 5).
3. Pick Email, type a message, **Send email**. **Expect** the toast "Email sent to <address>", the notice with the text.
4. Message the same guest again, pick **WhatsApp · coming soon**. **Expect** a yellow note "WhatsApp and SMS are coming
   soon…", the button says **Save and show to copy**, the toast "Saved · WhatsApp is coming soon, so copy the message to
   the guest", the notice row "Not sent · WhatsApp coming soon" with Copy. Nothing claims it was sent by WhatsApp.
5. Messages (sidebar). **Expect** tabs Unanswered, Open, Mine, Done, All with counts; the conversation for the booking
   (booking reference, room, channel) with both messages. Each message shows its status: "Email sent" (or "Not
   delivered" with Brevo's reason in red), "Not sent · WhatsApp coming soon" with Copy.
6. **Add what the guest said** → "I'll arrive at 6pm" → Add. **Expect** it on the left as the guest's, the conversation
   moves to **Unanswered** with "Not answered".
7. Reply by email. **Expect** it leaves Unanswered.
8. **Mark done** → it shows under Done with "Done"; **Reopen** puts it back under Open.
9. Search by guest name, booking reference or room; the channel filter; page 2 when there are more than 25.
10. **New message** (top right): a guest without a booking here, with name and email → Send email.

## 4. Guest messaging · Manager (Tunde)

1. Messaging. Same list and actions as front office, plus **Reassign** and **Templates**, and **Message everyone on
   shift**.
2. Reassign a conversation to Victor. **Expect** "Given to Victor …"; Victor sees it under **Mine** and gets a notification
   that opens it.
3. **Message everyone on shift** lists today's rota (Staff → Rota) with times; Send → "Sent to N people on shift"; each
   gets a notification. With nobody else on today's rota the button is off and the panel says so.

## 5. Templates (manager)

1. Messaging → Templates → **New template**: name "Arrival day", subject "See you on {{check_in}} at {{hotel}}", message
   "Hello {{first_name}}, room {{room}} is ready from {{check_in}} to {{check_out}} ({{nights}} nights), ref
   {{reference}}." The preview fills sample values. Save.
2. Same name again → "There is already a template called Arrival day". A placeholder like `{{balance}}` → refused
   with the list of placeholders.
3. In a conversation: **Use a template** → Arrival day. **Expect** the message filled from that booking (name, room, dates,
   nights, reference, hotel name). A booking with no room yet keeps `{{room}}` and a note says to fill it.
4. From a booking's Message guest, the template fills the same way.
5. Edit and delete a template (Delete → Yes, delete).

## 6. Who may do what

| As | Try | Expect |
|---|---|---|
| Femi (finance), Jide (inventory) | open `/dashboard/messaging` or call the conversations API | no screen; the API answers 403 "Guest messages are for front office, managers and the owner" |
| Victor (front office) | Reassign, Templates, Message everyone on shift | not offered; the API answers 403 "Only a manager or the owner can do that" |
| Owner B | open a Royal Suites conversation id | 404 "Conversation not found" |
| Anyone | email a guest with no email on file | Email is greyed with "No email on file"; the API answers 400 |

## 7. Bookings tell the guest

1. New booking for a guest with your address. **Expect** "Booking saved · confirmation emailed" and an email "Your
   booking … is confirmed" from the hotel's name.
2. Change its dates → "Dates changed · … · email sent to <address>". Cancel it → "Booking cancelled · the guest was
   emailed". A guest with only a phone gets the text shown to copy ("coming soon"), never "told on WhatsApp".

## 8. Other screens

- Owner Messaging, Hotels → Message the manager, Staff → Message: the toggle reads **"WhatsApp copy (coming soon)"**.
- Help → Contact support says the ticket number shows on screen; suppliers say "Orders are emailed here (SMS is coming
  soon)".
- Every invite card (onboarding step 4, manager Staff, owner Users and Staff, admin team and marketers) says "The invite
  was emailed to <address>. SMS and WhatsApp invites are coming soon." The phone field is optional.
- Take payment, Record payment and the folio's "Print or email the folio" offer Email (sent for real) or Print;
  WhatsApp (and SMS on take payment) are greyed "coming soon". "Email receipt again" says "Receipt emailed to …".
- Phone verification at sign-up still shows the code on screen.

## Known limits

- No inbound email or WhatsApp: a guest's reply comes back by hand ("Add what the guest said").
- No attachments; reports and receipts are links.
- Bounces after Brevo accepted a message are in Brevo's log, not in Hospio.
- 2026-11-10: the first start of the sender re-sent 329 old deliveries from the event log (invites, temporary passwords,
  receipts, 8 to gmail addresses). Fixed the same day: events older than 30 minutes are never sent.
