import { DepartmentsScreen } from "@/components/roles/manager/departments";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
	const [hotel, departments, approvals, rooms] = await Promise.all([getActiveHotel(), data.departments.live(), data.approvals.page({ tab: "waiting", size: 1 }), data.rooms.list()]);
	return (
		<DepartmentsScreen
			departments={departments}
			hotelName={hotel?.name ?? "This hotel"}
			approvalsWaiting={approvals.data.counts?.waiting ?? 0}
			roomsReady={rooms.filter((r) => r.state === "ready").length}
			staffOnShift={departments.reduce((s, d) => s + d.onShift, 0)}
			staffScheduled={departments.reduce((s, d) => s + d.scheduled, 0)}
		/>
	);
}
