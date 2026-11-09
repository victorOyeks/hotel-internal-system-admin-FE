import { StaffScreen } from "@/components/roles/manager/staff/screen";
import { getActiveHotel, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Staff: list, rota, leave and shift requests. */
export default async function StaffPage() {
	const [hotel, staff, shifts, leave, requests, business, user, clockedIn] =
		await Promise.all([
			getActiveHotel(),
			data.staff.list(),
			data.staff.shifts(),
			data.staff.leave(),
			data.staff.shiftRequests(),
			data.business.mine(),
			getUser(),
			data.staff.clockedIn(),
		]);
	return (
		<StaffScreen
			staff={staff}
			shifts={shifts}
			leave={leave}
			requests={requests}
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			businessName={business?.name}
			inviterName={user?.fullName}
			clockedIn={[...clockedIn.keys()]}
		/>
	);
}
