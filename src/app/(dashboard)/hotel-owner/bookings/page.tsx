import { OwnerBookings } from "@/components/roles/owner/bookings";
import { data } from "@/lib/data";
import { ownerHotels } from "@/lib/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 04 Bookings, every hotel. Fixtures are Ikeja; a few are spread to other branches. */
export default async function Page() {
	const bookings = await data.bookings.list();
	const spread = bookings.map((b, i) => {
		const h = ownerHotels[i % 5 === 3 ? 1 : i % 7 === 5 ? 2 : i % 11 === 9 ? 3 : 0];
		return { ...b, hotelId: h.hotelId, hotelName: h.name };
	});
	return <OwnerBookings bookings={spread} hotels={ownerHotels} />;
}
