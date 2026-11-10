import { InboxScreen } from "@/components/roles/shared-staff/inbox";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Everywhere · Inbox: messages from the owner and managers, for whoever is signed in, with replies (docs/owner-portal.md). */
export default async function InboxPage() {
	const threads = await data.owner.threads();
	return <InboxScreen threads={threads} />;
}
