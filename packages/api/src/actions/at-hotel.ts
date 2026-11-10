"use server";

import { atHotel } from "@hospio/api/api/server";
import { getHotels } from "@hospio/api/dal";
import { folioForBooking, postCharge } from "./folio";
import { messageGuest } from "./owner";
import { recordPayment } from "./payment";
import {
	cancelBooking,
	changeBookingDates,
	checkIn,
	checkOut,
	createBooking,
} from "./reservation";

/**
 * The booking and payment actions, run at a named hotel of the caller's business instead of the sidebar's branch
 * (Owner portal · Bookings acts on each booking at its own hotel). The client picks these up through `HotelScope`
 * (`useHotelActions`), so the manager's panels are reused unchanged.
 */
const SCOPED = {
	createBooking,
	checkIn,
	checkOut,
	changeBookingDates,
	cancelBooking,
	folioForBooking,
	postCharge,
	recordPayment,
	messageGuest,
};

export type ScopedActions = typeof SCOPED;
export type ScopedName = keyof ScopedActions;

export async function runAtHotel<K extends ScopedName>(
	hotelId: string,
	name: K,
	args: Parameters<ScopedActions[K]>,
): Promise<Awaited<ReturnType<ScopedActions[K]>>> {
	const hotels = await getHotels();
	if (!hotels.some((h) => h.id === hotelId)) {
		throw new Error("That hotel is not one of yours");
	}
	const action = SCOPED[name] as (
		...a: unknown[]
	) => Promise<Awaited<ReturnType<ScopedActions[K]>>>;
	return atHotel(hotelId, () => action(...(args as unknown[])));
}
