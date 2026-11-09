import { ShiftsScreen } from "@/components/roles/shared-staff/shifts-screen";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Staff · Shared: clock in/out, my shifts, swaps, cover, leave, PIN, language: for whoever is signed in. */
export default async function ShiftsPage() {
	const [user, role, staff] = await Promise.all([
		getUser(),
		getActiveRole(),
		data.staff.list(),
	]);
	const me =
		staff.find((s) => s.fullName === user?.fullName) ??
		staff.find((s) => s.role === role && s.shift !== "—") ??
		staff.find((s) => s.shift !== "—") ??
		staff[0];
	const [mine, clock, leave] = await Promise.all([
		data.staff.myShifts(me?.id),
		data.staff.clock(),
		data.staff.myLeave(),
	]);
	const colleagues = staff.filter((s) => s.department === me?.department);
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
