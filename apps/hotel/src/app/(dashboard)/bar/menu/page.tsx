import { MenuScreen } from "@/components/roles/shared-staff/menu-screen";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function BarMenuPage() {
	const menu = await data.outlets.menu("bar");
	return <MenuScreen menu={menu} outlet="Bar" happyHours />;
}
