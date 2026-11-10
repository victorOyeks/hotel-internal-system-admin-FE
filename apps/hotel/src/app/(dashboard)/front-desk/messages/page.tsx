import { MessagesScreen } from "@/components/roles/front-office/messages";
import { getActiveHotel } from "@hospio/api/dal";
import { guestMessagesData } from "@hospio/api/data/guest-messages";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Front office · Messages: guest conversations at the hotel, a page at a time (messaging-service, docs/email.md). */
export default async function FrontDeskMessagesPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const [hotel, result, templates] = await Promise.all([
		getActiveHotel(),
		guestMessagesData.conversations(listQueryFrom(sp, ["tab", "channel"])),
		guestMessagesData.templates(),
	]);
	return (
		<MessagesScreen
			result={result}
			templates={templates}
			hotelName={hotel?.name ?? "This hotel"}
		/>
	);
}
