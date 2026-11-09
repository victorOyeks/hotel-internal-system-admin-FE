import { ShiftsScreen } from "@/components/roles/shared-staff/shifts-screen";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import type { StaffRow } from "@hospio/api/data/types";
import { humanize } from "@hospio/ui/shared/format";

export const dynamic = "force-dynamic";

/** Staff · Shared: clock in/out, my shifts, swaps, cover, leave, PIN, language: for whoever is signed in. */
export default async function ShiftsPage() {
	const [user, role, staff] = await Promise.all([
		getUser(),
		getActiveRole(),
		data.staff.list(),
	]);
	// Staff roles may not list everyone (that is a manager's view), so the list can be empty: fall back to the
	// signed-in person themselves rather than to someone else's record.
	const fromList =
		staff.find((s) => s.userId === user?.id || s.id === user?.id) ??
		staff.find((s) => s.email === user?.email);
	const me: StaffRow = fromList ?? {
		id: user?.id ?? "me",
		userId: user?.id,
		fullName: user?.fullName ?? "Me",
		email: user?.email ?? "",
		phone: user?.phoneNumber ?? "",
		role: role ?? "",
		level: "FULL",
		department: role ? humanize(role) : "—",
		jobTitle: role ? humanize(role) : "Staff",
		status: "ACTIVE",
		shift: "—",
		startedOn: user?.createdAt ?? "",
		hotelId: "",
	};
	const [mine, clock, leave] = await Promise.all([
		data.staff.myShifts(me.userId ?? me.id),
		data.staff.clock(),
		data.staff.myLeave(),
	]);
	const colleagues = staff.filter((s) => s.department === me.department);
	return (
		<ShiftsScreen
			me={me}
			shifts={mine}
			colleagues={colleagues}
			clock={clock}
			leave={leave}
		/>
	);
}
