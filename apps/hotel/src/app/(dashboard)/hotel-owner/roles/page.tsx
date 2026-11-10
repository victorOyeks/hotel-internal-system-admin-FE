import { RolesScreen } from "@/components/roles/manager/roles";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · Roles & permissions: the same screen as the manager's, for the hotel picked in the switcher. */
export default async function Page() {
	const [hotel, access] = await Promise.all([getActiveHotel(), data.roles.access()]);
	return <RolesScreen access={access} hotelName={hotel?.name ?? "This hotel"} hotelId={hotel?.id} />;
}
