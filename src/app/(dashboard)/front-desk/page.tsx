import { redirect } from "next/navigation";
import { FrontDeskToday } from "@/components/roles/front-office/today";
import { getActiveHotel, getUser } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskTodayPage() {
	const [user, hotel] = await Promise.all([getUser(), getActiveHotel()]);
	if (!user) redirect("/auth");
	const [buckets, rooms, folios, terminals, tills] = await Promise.all([data.bookings.buckets(), data.rooms.list(), data.folios.list(), data.payments.terminals(), data.finance.tills()]);
	const till = tills.find((t) => t.role === "FRONT_OFFICE" && t.status === "OPEN") ?? null;
	return <FrontDeskToday user={user} hotelName={hotel?.name ?? "Hotel"} buckets={buckets} rooms={rooms} folios={folios} terminals={terminals} till={till} />;
}
