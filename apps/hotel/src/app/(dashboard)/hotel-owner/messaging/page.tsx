import { OwnerMessaging } from "@/components/roles/owner/messaging";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Hotel Owner · 13 Messaging: the owner's staff threads across every hotel (messaging-service, docs/owner-portal.md). */
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	// "All hotels" reads business-wide; one hotel reads with that hotel's X-Hotel-Id.
	const [threads, hotels, staff] = await Promise.all([
		data.owner.threads(listQueryFrom(sp), urlParam(sp, "hotel")),
		data.owner.hotelList(),
		data.owner.staff(),
	]);
	return (
		<OwnerMessaging
			threads={threads}
			hotels={hotels.map((h) => ({ hotelId: h.id, name: h.name }))}
			managers={staff
				.filter((s) => s.isManager && s.status !== "SUSPENDED")
				.map((s) => ({
					userId: s.userId ?? s.id,
					fullName: s.fullName,
					phone: s.phone,
					hotelId: s.hotelId,
					hotelName: s.hotelName,
				}))}
		/>
	);
}
