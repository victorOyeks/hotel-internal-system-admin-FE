import { StockScreen } from "@/components/roles/inventory/stock";
import { getActiveHotel, getUser } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InventoryStockPage() {
	const [user, hotel, stores, items, orders, suppliers] = await Promise.all([getUser(), getActiveHotel(), data.inventory.stores(), data.inventory.items(), data.inventory.purchaseOrders(), data.inventory.suppliers()]);
	return <StockScreen stores={stores} items={items} orders={orders} suppliers={suppliers} hotelName={hotel?.name ?? "Hotel"} keeper={user?.fullName ?? "Storekeeper"} />;
}
