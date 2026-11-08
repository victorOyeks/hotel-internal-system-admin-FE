import { GuestsScreen } from "@/components/roles/front-office/guests";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskGuestsPage() {
	const [guests, bookings] = await Promise.all([data.guests.list(), data.bookings.list()]);
	return <GuestsScreen guests={guests} bookings={bookings} />;
}
