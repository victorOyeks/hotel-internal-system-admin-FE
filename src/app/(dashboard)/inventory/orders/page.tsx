import { redirect } from "next/navigation";
import { OrdersScreen } from "@/components/roles/inventory/orders";
import { getUser } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InventoryOrdersPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [orders, items, suppliers] = await Promise.all([data.inventory.purchaseOrders(), data.inventory.items(), data.inventory.suppliers()]);
	return <OrdersScreen orders={orders} items={items} suppliers={suppliers} me={user.fullName} />;
}
