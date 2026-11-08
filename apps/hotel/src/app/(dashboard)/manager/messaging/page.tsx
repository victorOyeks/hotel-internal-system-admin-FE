import { MessagingScreen } from "@/components/roles/manager/messaging";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function MessagingPage() {
	const [hotel, conversations, templates, staff] = await Promise.all([getActiveHotel(), data.messaging.conversations(), data.messaging.templates(), data.staff.list()]);
	return <MessagingScreen conversations={conversations} templates={templates} staff={staff} hotelName={hotel?.name ?? "This hotel"} />;
}
