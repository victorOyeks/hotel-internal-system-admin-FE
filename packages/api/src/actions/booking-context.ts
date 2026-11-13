"use server";

import type { ActionResult } from "@hospio/api/actions";
import { atHotel } from "@hospio/api/api/server";
import { getHotels } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import type {
	FolioSummary,
	OrganizationRow,
	RoomRow,
	RoomTypeRow,
	TerminalRow,
} from "@hospio/api/data/types";

/**
 * What the booking panels work with (new booking, check in and out, take a payment, the summary): the hotel's rooms
 * and room types, open folios (without lines), company accounts, POS terminals and card payments still with the POS.
 * The bookings screens read it when a panel needs it instead of on every page render (a search keystroke or a new
 * page used to re-read all of it). `hotelId` is the owner acting at one of the business's hotels (`HotelScope`).
 */
export type BookingContext = {
	rooms: RoomRow[];
	types: RoomTypeRow[];
	folios: FolioSummary[];
	organizations: OrganizationRow[];
	terminals: TerminalRow[];
	pendingOnPos: Record<string, number>;
};

async function inScope<T>(
	hotelId: string | undefined,
	work: () => Promise<T>,
): Promise<T> {
	if (!hotelId) return work();
	const hotels = await getHotels();
	if (!hotels.some((h) => h.id === hotelId))
		throw new Error("That hotel is not one of yours");
	return atHotel(hotelId, work);
}

export async function bookingContext(
	hotelId?: string,
): Promise<ActionResult<BookingContext>> {
	try {
		return {
			ok: true,
			data: await inScope(hotelId, async () => {
				const [rooms, types, folios, organizations, terminals, pendingOnPos] =
					await Promise.all([
						data.rooms.list(),
						data.rooms.types(),
						data.folios.summaries(),
						data.organizations.forBooking(),
						data.payments.terminals(hotelId),
						data.payments.pendingOnPos(),
					]);
				return { rooms, types, folios, organizations, terminals, pendingOnPos };
			}),
		};
	} catch (e) {
		return {
			ok: false,
			error:
				e instanceof Error ? e.message : "The booking details didn't load",
		};
	}
}

/** The open folios without lines, for a take-payment picker opened on a list screen (Payments). */
export async function openFolios(): Promise<ActionResult<FolioSummary[]>> {
	return { ok: true, data: await data.folios.summaries() };
}
