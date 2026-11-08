import { MessagesScreen } from "@/components/roles/front-office/messages";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskMessagesPage() {
	const [conversations, templates] = await Promise.all([data.messaging.conversations(), data.messaging.templates()]);
	return <MessagesScreen conversations={conversations} templates={templates} />;
}
