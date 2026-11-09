import { BookingsScreen } from "@/components/roles/front-office/bookings";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { pendingByBooking } from "@hospio/api/data/types";

export const dynamic = "force-dynamic";

export default async function FrontDeskBookingsPage() {
	const [hotel, buckets, all, rooms, roomTypes, guests, folios, organizations, terminals, payments] = await Promise.all([getActiveHotel(), data.bookings.buckets(), data.bookings.list(), data.rooms.list(), data.rooms.types(), data.guests.list(), data.folios.list(), data.organizations.list(), data.payments.terminals(), data.payments.list()]);
	return <BookingsScreen buckets={buckets} all={all} rooms={rooms} roomTypes={roomTypes} guests={guests} folios={folios} organizations={organizations} terminals={terminals} pendingOnPos={pendingByBooking(payments)} hotelName={hotel?.name ?? "Hotel"} canCancel={false} />;
}
