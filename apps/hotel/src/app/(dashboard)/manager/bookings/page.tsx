import { BookingsScreen } from "@/components/roles/manager/bookings/bookings-screen";
import { BOOKING_TABS } from "@/components/roles/manager/bookings/tabs";
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
 * Manager · Bookings: the tab is one page of reservation-service's view (search and page in the URL) with every tab's
 * count; details, new booking, check in / out, payments, changes.
 */
export default async function BookingsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const tab = urlParam(sp, "tab") as BookingView | undefined;
	const view =
		tab && (BOOKING_TABS as readonly string[]).includes(tab) ? tab : "arrivals";
	const open = urlParam(sp, "open");
	const { page, q, sort } = listQueryFrom(sp);
	const [
		hotel,
		bookings,
		rooms,
		types,
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
			hotelName={hotel?.name ?? "This hotel"}
			bookings={bookings}
			opened={opened}
			rooms={rooms}
			types={types}
			folios={folios}
			organizations={organizations}
			terminals={terminals}
			pendingOnPos={pendingOnPos}
		/>
	);
}
