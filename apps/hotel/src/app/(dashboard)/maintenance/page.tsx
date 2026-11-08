import { RepairsScreen } from "@/components/roles/maintenance/repairs";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function MaintenanceHome() {
	const [repairs, parts, staff, user] = await Promise.all([data.maintenance.repairs(), data.maintenance.parts(), data.staff.list(), getUser()]);
	const technicians = staff.filter((s) => s.role === "MAINTENANCE");
	const me = technicians.find((t) => t.fullName === user?.fullName)?.fullName ?? technicians[0]?.fullName ?? "Chinedu Obi";
	return <RepairsScreen repairs={repairs} me={me} technicians={technicians} parts={parts} />;
}
