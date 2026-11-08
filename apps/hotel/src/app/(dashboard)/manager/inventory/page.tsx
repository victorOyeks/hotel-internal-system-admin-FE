import { InventoryScreen } from "@/components/roles/manager/inventory/screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Inventory: stock, requests, purchase orders, deliveries, counts and suppliers. */
export default async function InventoryPage() {
	const [hotel, stores, items, requests, orders, deliveries, counts, suppliers] = await Promise.all([
		getActiveHotel(),
		data.inventory.stores(),
		data.inventory.items(),
		data.inventory.requests(),
		data.inventory.purchaseOrders(),
		data.inventory.deliveries(),
		data.inventory.counts(),
		data.inventory.suppliers(),
	]);
	return <InventoryScreen hotelName={hotel?.name ?? "This hotel"} stores={stores} items={items} requests={requests} orders={orders} deliveries={deliveries} counts={counts} suppliers={suppliers} />;
}
