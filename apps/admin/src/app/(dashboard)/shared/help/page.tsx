import { HelpScreen } from "@hospio/ui/screens/help";
import { demoFaq, demoHelpTopics } from "@hospio/api/demo/fixtures/manager-admin";

export const dynamic = "force-dynamic";

/** Everywhere · Help, served for every role at /dashboard/help. */
export default function SharedHelpPage() {
	return <HelpScreen topics={demoHelpTopics} faq={demoFaq} />;
}
