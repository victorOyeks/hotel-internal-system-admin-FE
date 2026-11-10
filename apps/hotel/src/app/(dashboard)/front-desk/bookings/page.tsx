import { BookingsScreen } from "@/components/roles/front-office/bookings";
import { FO_TABS } from "@/components/roles/front-office/tabs";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";
import type { BookingView } from "@hospio/api/data/types";

export const dynamic = "force-dynamic";

/**
 * Front office · Bookings: the tab (arrivals, departures, in-house, upcoming, all) is one page from reservation-service with
 * every tab's count; search and page in the URL. Card payments still with the POS come bounded (the last 30 days).
 */
export default async function FrontDeskBookingsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const tab = urlParam(sp, "tab") as BookingView | undefined;
	const view = tab && (FO_TABS as string[]).includes(tab) ? tab : "arrivals";
	const open = urlParam(sp, "open");
	const { page, q, sort } = listQueryFrom(sp);
	const [
		hotel,
		bookings,
		rooms,
		roomTypes,
		folios,
		organizations,
		terminals,
		pendingOnPos,
		opened,
	] = await Promise.all([
		getActiveHotel(),
		data.bookings.page({ view, page, q, sort }),
		data.rooms.list(),
		data.rooms.types(),
		data.folios.list(),
		data.organizations.forBooking(),
		data.payments.terminals(),
		data.payments.pendingOnPos(),
		open ? data.bookings.get(open) : Promise.resolve(null),
	]);
	return (
		<BookingsScreen
			bookings={bookings}
			opened={opened}
			rooms={rooms}
			roomTypes={roomTypes}
			folios={folios}
			organizations={organizations}
			terminals={terminals}
			pendingOnPos={pendingOnPos}
			hotelName={hotel?.name ?? "Hotel"}
			canCancel={false}
		/>
	);
}
