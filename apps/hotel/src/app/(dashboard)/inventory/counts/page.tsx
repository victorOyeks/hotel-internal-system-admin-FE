import { redirect } from "next/navigation";
import { CountsScreen } from "@/components/roles/inventory/counts";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function InventoryCountsPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [counts, stores, items] = await Promise.all([data.inventory.counts(), data.inventory.stores(), data.inventory.items()]);
	return <CountsScreen counts={counts} stores={stores} items={items} me={user.fullName} />;
}
