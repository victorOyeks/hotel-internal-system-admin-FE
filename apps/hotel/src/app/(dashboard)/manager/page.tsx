import { redirect } from "next/navigation";
import { ManagerDashboard } from "@/components/roles/manager/dashboard";
import { getActiveHotel, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { lagosDate } from "@hospio/api/data/mappers/finance";

export const dynamic = "force-dynamic";

export default async function ManagerHomePage() {
	const [user, hotel] = await Promise.all([getUser(), getActiveHotel()]);
	if (!user) redirect("/auth");

	const [
		buckets,
		rooms,
		money,
		approvals,
		repairs,
		items,
		folios,
		shifts,
		outletSales,
	] = await Promise.all([
		data.bookings.buckets(),
		data.rooms.list(),
		data.finance.today(),
		data.approvals.open(),
		data.maintenance.workOrders("open"),
		data.inventory.items(),
		data.folios.list(),
		data.staff.shifts(lagosDate(), lagosDate()),
		data.outlets.managementSales(),
	]);
	const todayShifts = shifts.filter(
		(s) => s.date === lagosDate() && s.status !== "CANCELLED",
	);

	return (
		<ManagerDashboard
			user={user}
			hotel={hotel}
			data={{
				buckets,
				rooms,
				money,
				approvals,
				repairs,
				items,
				folios,
				shifts: todayShifts,
				outletSales,
			}}
		/>
	);
}
