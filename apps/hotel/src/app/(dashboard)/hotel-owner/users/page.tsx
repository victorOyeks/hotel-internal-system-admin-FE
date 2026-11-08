import { OwnerUsers } from "@/components/roles/owner/users";
import { ownerHotels, ownerPortalUsers } from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 08 Users. */
export default function Page() {
	return <OwnerUsers users={ownerPortalUsers} hotels={ownerHotels} />;
}
