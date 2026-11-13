import { OwnerBookings } from "@/components/roles/owner/bookings";
import { BOOKING_TABS } from "@/components/roles/manager/bookings/tabs";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";
import type { BookingView } from "@hospio/api/data/types";

export const dynamic = "force-dynamic";

/**
 * Hotel Owner · 04 Bookings: every hotel's bookings, one page at a time from reservation-service across the business
 * (`?hotel=` narrows to one hotel, `?tab=` is the view), each acted on at its own hotel (docs/owner-portal.md).
 */
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const tab = urlParam(sp, "tab") as BookingView | undefined;
	const view =
		tab && (BOOKING_TABS as readonly string[]).includes(tab) ? tab : "arrivals";
	const { page, q, sort } = listQueryFrom(sp);
	const { bookings, hotels } = await data.owner.bookings({
		view,
		page,
		q,
		sort,
		hotelId: urlParam(sp, "hotel"),
	});
	return <OwnerBookings bookings={bookings} hotels={hotels} />;
}
