import { StoreScreen } from "@/components/roles/shared-staff/store-screen";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function KitchenStorePage() {
	const outlet = await data.outlets.forRole("KITCHEN");
	const [items, requests] = await Promise.all([
		data.inventory.items(),
		data.inventory.teamRequests("KITCHEN"),
	]);
	return (
		<StoreScreen
			items={items.filter((i) => i.storeId === outlet?.storeId)}
			requests={requests}
			team="KITCHEN"
			storeId={outlet?.storeId}
			title="Kitchen store"
			subtitle="Food and dry goods on the kitchen shelf"
		/>
	);
}
