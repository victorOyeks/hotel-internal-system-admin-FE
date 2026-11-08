import { SuppliersScreen } from "@/components/roles/inventory/suppliers";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InventorySuppliersPage() {
	const [suppliers, items, orders] = await Promise.all([data.inventory.suppliers(), data.inventory.items(), data.inventory.purchaseOrders()]);
	return <SuppliersScreen suppliers={suppliers} items={items} orders={orders} />;
}
