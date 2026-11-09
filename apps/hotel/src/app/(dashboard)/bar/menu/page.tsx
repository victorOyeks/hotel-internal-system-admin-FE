import { MenuScreen } from "@/components/roles/shared-staff/menu-screen";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function BarMenuPage() {
	const outlet = await data.outlets.forRole("BAR");
	if (!outlet)
		return (
			<MenuScreen
				menu={[]}
				outlet={{ id: "", name: "Bar", kind: "BAR" }}
				categories={[]}
				happyHours={[]}
			/>
		);
	const [menu, categories, happyHours, items] = await Promise.all([
		data.outlets.menu(outlet.id, true),
		data.outlets.categories(outlet.id),
		data.outlets.happyHours(outlet.id),
		data.inventory.items(),
	]);
	return (
		<MenuScreen
			menu={menu}
			outlet={outlet}
			categories={categories}
			happyHours={happyHours}
			stock={items.filter((i) => i.storeId === outlet.storeId)}
		/>
	);
}
