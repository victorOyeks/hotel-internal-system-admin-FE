import { RolesScreen } from "@/components/roles/manager/roles";
import { getActiveHotel } from "@/lib/dal";
import { demoManagerOnly, demoPermissions, demoStaffAccess } from "@/lib/demo/fixtures/manager-admin";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
	const hotel = await getActiveHotel();
	return <RolesScreen permissions={demoPermissions} managerOnly={demoManagerOnly} access={demoStaffAccess} hotelName={hotel?.name ?? "This hotel"} />;
}
