import { InboxScreen } from "@/components/roles/shared-staff/inbox";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Everywhere · Inbox: messages from the owner and managers, for whoever is signed in, with replies (docs/owner-portal.md). */
export default async function InboxPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const threads = await data.owner.threads(listQueryFrom(await searchParams));
	return <InboxScreen threads={threads} />;
}
