import { OwnerHotels } from "@/components/roles/owner/hotels";
import { ownerHotels } from "@/lib/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 02 Hotels. */
export default function Page() {
	return <OwnerHotels hotels={ownerHotels} />;
}
