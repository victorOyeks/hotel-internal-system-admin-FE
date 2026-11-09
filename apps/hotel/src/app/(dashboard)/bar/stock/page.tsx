import { BarStockScreen } from "@/components/roles/bar/stock";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function BarStockPage() {
	const outlet = await data.outlets.forRole("BAR");
	const [items, requests] = await Promise.all([
		data.inventory.items(),
		data.inventory.requests(),
	]);
	return (
		<BarStockScreen
			items={items.filter((i) => i.storeId === outlet?.storeId)}
			requests={requests}
			storeId={outlet?.storeId}
		/>
	);
}
