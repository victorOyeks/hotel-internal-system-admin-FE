import { RolesScreen } from "@/components/roles/manager/roles";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Roles & permissions: what each role allows, and who holds which role at this hotel (identity-service). */
export default async function RolesPage() {
	const [hotel, access] = await Promise.all([getActiveHotel(), data.roles.access()]);
	return <RolesScreen access={access} hotelName={hotel?.name ?? "This hotel"} hotelId={hotel?.id} />;
}
