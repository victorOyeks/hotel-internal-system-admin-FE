import { HelpScreen } from "@/components/roles/manager/help";
import { demoFaq, demoHelpTopics } from "@/lib/demo/fixtures/manager-admin";

export const dynamic = "force-dynamic";

/** Everywhere · Help, served for every role at /dashboard/help. */
export default function SharedHelpPage() {
	return <HelpScreen topics={demoHelpTopics} faq={demoFaq} />;
}
