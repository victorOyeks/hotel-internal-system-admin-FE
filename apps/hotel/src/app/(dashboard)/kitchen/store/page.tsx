import { StoreScreen } from "@/components/roles/shared-staff/store-screen";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function KitchenStorePage() {
	const items = await data.inventory.items();
	return <StoreScreen items={items.filter((i) => i.storeId === "st-kitchen")} title="Kitchen store" subtitle="Food and dry goods on the kitchen shelf · Mariam Bello keeps it" />;
}
