import { KitchenOrdersScreen } from "@/components/roles/kitchen/orders";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Kitchen · Orders: the board of the kitchen's outlet (the first KITCHEN or RESTAURANT one), its menu, tables and the settings that rule room charging. */
export default async function KitchenHome() {
	const outlet = await data.outlets.forRole("KITCHEN");
	const [orders, menu, categories, buckets, settings, terminals] =
		await Promise.all([
			outlet ? data.outlets.orders(outlet.id) : Promise.resolve([]),
			outlet ? data.outlets.menu(outlet.id) : Promise.resolve([]),
			outlet ? data.outlets.categories(outlet.id) : Promise.resolve([]),
			data.bookings.buckets(),
			data.outlets.settings(),
			data.payments.terminals(),
		]);
	return (
		<KitchenOrdersScreen
			orders={orders}
			menu={menu}
			categories={categories}
			outlet={outlet}
			inHouse={buckets.inHouse}
			settings={settings}
			terminals={terminals}
		/>
	);
}
