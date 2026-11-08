import { OwnerInventory } from "@/components/roles/owner/inventory";
import { data } from "@hospio/api/data";
import { ownerHotels } from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 14 Inventory. */
export default async function Page() {
	const items = await data.inventory.items();
	return <OwnerInventory items={items} hotels={ownerHotels} />;
}
