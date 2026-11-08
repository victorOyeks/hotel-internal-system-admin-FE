import { OwnerInventory } from "@/components/roles/owner/inventory";
import { data } from "@/lib/data";
import { ownerHotels } from "@/lib/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 14 Inventory. */
export default async function Page() {
	const items = await data.inventory.items();
	return <OwnerInventory items={items} hotels={ownerHotels} />;
}
