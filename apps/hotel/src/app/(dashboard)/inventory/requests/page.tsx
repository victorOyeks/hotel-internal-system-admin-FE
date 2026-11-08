import { RequestsScreen } from "@/components/roles/inventory/requests";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function InventoryRequestsPage() {
	const [requests, items] = await Promise.all([data.inventory.requests(), data.inventory.items()]);
	return <RequestsScreen requests={requests} items={items} />;
}
