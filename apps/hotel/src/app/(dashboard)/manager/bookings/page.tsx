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
	// The list page and two small lookups only: the panels' rooms, folios, accounts, terminals and POS payments are read
	// when a panel needs them (useBookingContext), not again on every search keystroke or page.
	const [hotel, bookings, opened, occupancy] = await Promise.all([
		getActiveHotel(),
		data.bookings.page({ view, page, q, sort }),
		open ? data.bookings.get(open) : Promise.resolve(null),
		data.rooms.occupancy(),
	]);
	const [rows, openedRow] = await Promise.all([
		data.bookings.named(bookings.data.content),
		opened ? data.bookings.named([opened]).then((r) => r[0]) : null,
	]);
	return (
		<BookingsScreen
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id ?? ""}
			bookings={{ ...bookings, data: { ...bookings.data, content: rows } }}
			opened={openedRow}
			occupancy={occupancy}
		/>
	);
}
