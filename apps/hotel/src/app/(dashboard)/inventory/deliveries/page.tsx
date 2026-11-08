import { redirect } from "next/navigation";
import { DeliveriesScreen } from "@/components/roles/inventory/deliveries";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function InventoryDeliveriesPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [deliveries, orders] = await Promise.all([data.inventory.deliveries(), data.inventory.purchaseOrders()]);
	return <DeliveriesScreen deliveries={deliveries} orders={orders} me={user.fullName} />;
}
