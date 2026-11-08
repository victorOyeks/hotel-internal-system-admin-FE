import { redirect } from "next/navigation";
import { ManagerDashboard } from "@/components/roles/manager/dashboard";
import { getActiveHotel, getUser } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ManagerHomePage() {
	const [user, hotel] = await Promise.all([getUser(), getActiveHotel()]);
	if (!user) redirect("/auth");

	const [buckets, rooms, money, approvals, repairs, items, folios, shifts] = await Promise.all([
		data.bookings.buckets(),
		data.rooms.list(),
		data.finance.today(),
		data.approvals.list(),
		data.maintenance.repairs(),
		data.inventory.items(),
		data.folios.list(),
		data.staff.shifts(undefined, undefined),
	]);
	const todayShifts = shifts.filter((s) => s.date === new Date().toISOString().slice(0, 10));

	return <ManagerDashboard user={user} hotel={hotel} data={{ buckets, rooms, money, approvals, repairs, items, folios, shifts: todayShifts }} />;
}
