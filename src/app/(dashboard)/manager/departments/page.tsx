import { DepartmentsScreen } from "@/components/roles/manager/departments";
import { getActiveHotel } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
	const [hotel, departments, approvals, rooms] = await Promise.all([getActiveHotel(), data.departments.live(), data.approvals.list(), data.rooms.list()]);
	return (
		<DepartmentsScreen
			departments={departments}
			hotelName={hotel?.name ?? "This hotel"}
			approvalsWaiting={approvals.filter((a) => a.status === "PENDING" && a.approverLevel === "MANAGER").length}
			roomsReady={rooms.filter((r) => r.state === "ready").length}
			staffOnShift={departments.reduce((s, d) => s + d.onShift, 0)}
			staffScheduled={departments.reduce((s, d) => s + d.scheduled, 0)}
		/>
	);
}
