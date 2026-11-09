import { MenuScreen } from "@/components/roles/shared-staff/menu-screen";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function KitchenMenuPage() {
	const outlet = await data.outlets.forRole("KITCHEN");
	if (!outlet)
		return (
			<MenuScreen
				menu={[]}
				outlet={{ id: "", name: "Restaurant", kind: "KITCHEN" }}
				categories={[]}
			/>
		);
	const [menu, categories, items] = await Promise.all([
		data.outlets.menu(outlet.id, true),
		data.outlets.categories(outlet.id),
		data.inventory.items(),
	]);
	return (
		<MenuScreen
			menu={menu}
			outlet={outlet}
			categories={categories}
			stock={items.filter((i) => i.storeId === outlet.storeId)}
		/>
	);
}
