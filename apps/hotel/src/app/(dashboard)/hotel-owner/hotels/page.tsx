import { OwnerHotels } from "@/components/roles/owner/hotels";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 02 Hotels: live on tenant-service when it is on; finance figures wait for finance-service. */
export default async function Page() {
	const [hotels, business, user] = await Promise.all([
		data.hotels.list(),
		data.business.mine(),
		getUser(),
	]);
	return (
		<OwnerHotels
			hotels={hotels}
			businessName={business?.name}
			ownerName={user?.fullName ?? business?.ownerName ?? undefined}
		/>
	);
}
