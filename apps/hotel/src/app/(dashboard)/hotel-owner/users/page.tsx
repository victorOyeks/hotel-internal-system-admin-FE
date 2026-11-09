import { OwnerUsers } from "@/components/roles/owner/users";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 08 Users: portal logins from identity-service. */
export default async function Page() {
	const [users, hotels, business, user] = await Promise.all([
		data.users.list(),
		data.hotels.list(),
		data.business.mine(),
		getUser(),
	]);
	return (
		<OwnerUsers
			users={users}
			hotels={hotels}
			businessName={business?.name ?? "Hospio360"}
			ownerName={user?.fullName ?? business?.ownerName ?? "The owner"}
		/>
	);
}
