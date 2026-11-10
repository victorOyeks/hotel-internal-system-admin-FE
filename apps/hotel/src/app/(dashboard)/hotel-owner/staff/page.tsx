import { OwnerStaffScreen } from "@/components/roles/owner/staff";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 05 Staff: everyone with a role at each hotel of the business, from identity (docs/owner-portal.md). */
export default async function Page() {
	const [staff, hotels, business, user] = await Promise.all([
		data.owner.staff(),
		data.owner.hotelList(),
		data.business.mine(),
		getUser(),
	]);
	return (
		<OwnerStaffScreen
			staff={staff}
			hotels={hotels.map((h) => ({ hotelId: h.id, name: h.name }))}
			businessName={business?.name ?? "Your business"}
			ownerName={user?.fullName ?? business?.ownerName ?? "The owner"}
		/>
	);
}
