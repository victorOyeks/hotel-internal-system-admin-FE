import { redirect } from "next/navigation";
import { FrontDeskToday } from "@/components/roles/front-office/today";
import { getActiveHotel, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskTodayPage() {
	const [user, hotel] = await Promise.all([getUser(), getActiveHotel()]);
	if (!user) redirect("/auth");
	const [buckets, rooms, folios, terminals, till, clock] = await Promise.all([
		data.bookings.buckets(),
		data.rooms.list(),
		data.folios.summaries(),
		data.payments.terminals(),
		data.finance.myTill(),
		data.staff.clock(),
	]);
	return (
		<FrontDeskToday
			user={user}
			hotelName={hotel?.name ?? "Hotel"}
			buckets={buckets}
			rooms={rooms}
			folios={folios}
			terminals={terminals}
			till={till}
			clock={clock}
		/>
	);
}
