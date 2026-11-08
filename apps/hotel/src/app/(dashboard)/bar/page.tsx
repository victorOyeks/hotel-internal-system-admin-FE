import { BarTodayScreen } from "@/components/roles/bar/today";
import { data } from "@hospio/api/data";
import { demoSeats } from "@hospio/api/demo/fixtures/tablet";

export const dynamic = "force-dynamic";

export default async function BarHome() {
	const [orders, menu, buckets, items] = await Promise.all([data.outlets.orders("Bar"), data.outlets.menu("bar"), data.bookings.buckets(), data.inventory.items()]);
	return <BarTodayScreen orders={orders} menu={menu} inHouse={buckets.inHouse} seats={demoSeats} stock={items.filter((i) => i.storeId === "st-bar")} />;
}
