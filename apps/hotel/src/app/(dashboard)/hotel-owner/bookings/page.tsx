import { OwnerBookings } from "@/components/roles/owner/bookings";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 04 Bookings: every hotel's bookings, each acted on at its own hotel (docs/owner-portal.md). */
export default async function Page() {
	const { bookings, contexts } = await data.owner.bookings();
	return <OwnerBookings bookings={bookings} contexts={contexts} />;
}
