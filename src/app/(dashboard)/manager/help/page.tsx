import { HelpScreen } from "@/components/roles/manager/help";
import { demoFaq, demoHelpTopics } from "@/lib/demo/fixtures/manager-admin";

export const dynamic = "force-dynamic";

export default function HelpPage() {
	return <HelpScreen topics={demoHelpTopics} faq={demoFaq} />;
}
