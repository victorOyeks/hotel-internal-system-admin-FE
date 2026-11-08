import { BookingsScreen } from "@/components/roles/manager/bookings/bookings-screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Bookings: list by tab, details, new booking, check in / out, payments, changes. */
export default async function BookingsPage() {
	const [hotel, bookings, rooms, types, guests, folios, organizations] = await Promise.all([
		getActiveHotel(),
		data.bookings.list(),
		data.rooms.list(),
		data.rooms.types(),
		data.guests.list(),
		data.folios.list(),
		data.organizations.list(),
	]);
	return <BookingsScreen hotelName={hotel?.name ?? "This hotel"} bookings={bookings} rooms={rooms} types={types} guests={guests} folios={folios} organizations={organizations} />;
}
