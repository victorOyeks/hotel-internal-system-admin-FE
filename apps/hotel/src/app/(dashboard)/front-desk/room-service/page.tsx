import { RoomServiceScreen } from "@/components/roles/front-office/room-service";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Front office · Room service: in-house guests' orders to the kitchen or bar, charged to the room or paid at the desk. */
export default async function FrontDeskRoomServicePage() {
	const [outlets, orders, buckets, settings, terminals] = await Promise.all([
		data.outlets.list(),
		data.outlets.orders(),
		data.bookings.buckets(),
		data.outlets.settings(),
		data.payments.terminals(),
	]);
	const menus = await Promise.all(
		outlets.map(async (outlet) => {
			const [menu, categories] = await Promise.all([
				data.outlets.menu(outlet.id),
				data.outlets.categories(outlet.id),
			]);
			return { outlet, menu, categories };
		}),
	);
	return (
		<RoomServiceScreen
			orders={orders}
			outlets={menus}
			inHouse={buckets.inHouse}
			settings={settings}
			terminals={terminals}
		/>
	);
}
