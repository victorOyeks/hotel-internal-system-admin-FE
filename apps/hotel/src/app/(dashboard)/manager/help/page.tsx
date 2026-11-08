import { HelpScreen } from "@hospio/ui/screens/help";
import { demoFaq, demoHelpTopics } from "@hospio/api/demo/fixtures/manager-admin";

export const dynamic = "force-dynamic";

export default function HelpPage() {
	return <HelpScreen topics={demoHelpTopics} faq={demoFaq} />;
}
