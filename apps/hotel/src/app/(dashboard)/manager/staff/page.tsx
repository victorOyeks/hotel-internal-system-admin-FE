import { StaffScreen } from "@/components/roles/manager/staff/screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Staff: list, rota, leave and shift requests. */
export default async function StaffPage() {
	const [hotel, staff, shifts, leave, requests] = await Promise.all([getActiveHotel(), data.staff.list(), data.staff.shifts(), data.staff.leave(), data.staff.shiftRequests()]);
	return <StaffScreen staff={staff} shifts={shifts} leave={leave} requests={requests} hotelName={hotel?.name ?? "This hotel"} />;
}
