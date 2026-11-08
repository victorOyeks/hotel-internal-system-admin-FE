import { KitchenOrdersScreen } from "@/components/roles/kitchen/orders";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

const tables = ["1", "2", "3", "4", "5", "6", "7", "8", "Terrace 1", "Terrace 2"];

export default async function KitchenHome() {
	const [orders, menu, buckets] = await Promise.all([data.outlets.orders("Restaurant"), data.outlets.menu("kitchen"), data.bookings.buckets()]);
	return <KitchenOrdersScreen orders={orders} menu={menu} inHouse={buckets.inHouse} tables={tables} />;
}
