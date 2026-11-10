import { OwnerHotels } from "@/components/roles/owner/hotels";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/**
 * Hotel Owner · 02 Hotels: tenant-service's hotels with this month's money (finance), staff on shift (workforce),
 * open repairs (maintenance) and the last action (activity), per hotel.
 */
export default async function Page() {
	const [hotels, business, user] = await Promise.all([
		data.owner.hotels(),
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
