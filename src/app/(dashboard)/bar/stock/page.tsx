import { BarStockScreen } from "@/components/roles/bar/stock";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BarStockPage() {
	const items = await data.inventory.items();
	return <BarStockScreen items={items.filter((i) => i.storeId === "st-bar")} />;
}
