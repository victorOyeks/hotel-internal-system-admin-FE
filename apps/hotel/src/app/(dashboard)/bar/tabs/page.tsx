import { BarTabsScreen } from "@/components/roles/bar/tabs";
import { data } from "@hospio/api/data";
import { demoSeats } from "@hospio/api/demo/fixtures/tablet";

export const dynamic = "force-dynamic";

export default async function BarTabsPage() {
	const [orders, menu, buckets] = await Promise.all([data.outlets.orders("Bar"), data.outlets.menu("bar"), data.bookings.buckets()]);
	return <BarTabsScreen orders={orders} menu={menu} inHouse={buckets.inHouse} seats={demoSeats} />;
}
