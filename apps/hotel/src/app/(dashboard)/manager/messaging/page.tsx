import { MessagingScreen } from "@/components/roles/manager/messaging";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { guestMessagesData } from "@hospio/api/data/guest-messages";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Manager · Messaging: guest conversations at the hotel, a page at a time (messaging-service, docs/email.md). */
export default async function MessagingPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const [hotel, result, templates, staff, onShift] = await Promise.all([
		getActiveHotel(),
		guestMessagesData.conversations(listQueryFrom(sp, ["tab", "channel"])),
		guestMessagesData.templates(),
		data.staff.list(),
		guestMessagesData.onShift(),
	]);
	const people = staff
		.filter(
			(s) =>
				s.status === "ACTIVE" &&
				(["FRONT_OFFICE", "MANAGER"].includes(s.role) ||
					(s.grants ?? []).some((g) =>
						["FRONT_OFFICE", "MANAGER"].includes(g.role),
					)),
		)
		.map((s) => ({
			userId: s.userId ?? s.id,
			name: s.fullName,
			hint: s.jobTitle || s.role,
		}));
	return (
		<MessagingScreen
			result={result}
			templates={templates}
			people={[...new Map(people.map((p) => [p.userId, p])).values()]}
			onShift={onShift}
			hotelName={hotel?.name ?? "This hotel"}
		/>
	);
}
