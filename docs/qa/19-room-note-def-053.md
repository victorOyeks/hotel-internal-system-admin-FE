# QA script · Room note retest (DEF-053, staging)

## Purpose

DEF-053: deleting a hotel/room note was not saved. The front desk's "Note for housekeeping" had two problems:

- It wrote to a field the board never shows.
- It could not be emptied.

Now the front desk, housekeeping and managers all edit **the room's one board note**:

- the note shown on the room's card;
- the same note as the manager's Edit room → "Note (shows on the board)".

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract (hospio-backend): `PUT /property/rooms/{id}/note` (a blank note removes it)

## Accounts

Password for every account: `Hospio123!`

| Role | Email |
|---|---|
| Front office | `victor@royalsuites.ng` |
| Manager | `tunde@royalsuites.ng` |
| Finance (must not edit) | `femi@royalsuites.ng` |

## 1. Front desk: add, change, remove

1. Front office → **Rooms** → open a room, e.g. A130. "Note for housekeeping" shows the room's current note, or is
   empty if there is none.
2. Type `QA DEF-053 extra pillows` → **Save note**. Toast: "Note saved on A130". The room's card on the board shows the
   note under its status.
3. Refresh the page and reopen the room. The box still holds the note.
4. Delete all the text. The button now reads **Remove note**. Click it. Toast: "Note removed from A130".
5. Refresh and reopen. The box is **empty**, and the card shows no note. **This is DEF-053.**
6. The button is greyed out while the box matches the saved note (nothing to save).

## 2. The same note everywhere

1. Front office saves a note on a room.
2. Manager → Rooms → that room → **Edit room**. "Note (shows on the board)" holds the same text.
3. The manager empties it → **Save changes**. Toast: "Room … updated". The room panel's blue note box disappears
   **at once, without reloading**. On the front desk, the note is gone after a refresh.
4. Manager: type a new note in Edit room → Save. The blue note box shows the new text at once.

## 3. Negative

1. A note over 500 characters is refused: "Keep the note under 500 characters".
2. Finance cannot edit room notes: no box, and the API answers 403.
3. A room held for today's arrival still shows "Arriving today · <guest>" on its panel, and its own note in the box.
