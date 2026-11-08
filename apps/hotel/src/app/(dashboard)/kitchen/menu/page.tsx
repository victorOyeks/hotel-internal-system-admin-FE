import { MenuScreen } from "@/components/roles/shared-staff/menu-screen";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function KitchenMenuPage() {
	const menu = await data.outlets.menu("kitchen");
	return <MenuScreen menu={menu} outlet="Restaurant" />;
}
