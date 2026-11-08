import { OwnerMessaging } from "@/components/roles/owner/messaging";
import { data } from "@hospio/api/data";
import { ownerHotels, ownerManagerThreads } from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 13 Messaging. */
export default async function Page() {
	const conversations = await data.messaging.conversations();
	return <OwnerMessaging conversations={[...ownerManagerThreads, ...conversations.filter((c) => c.kind === "STAFF")]} hotels={ownerHotels} />;
}
