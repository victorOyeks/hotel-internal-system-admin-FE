import { getActiveRole, getSession } from "@hospio/api/dal";
import { helpFor } from "@hospio/ui/help";
import { HelpScreen } from "@hospio/ui/screens/help";

export const dynamic = "force-dynamic";

/** Everywhere · Help at /dashboard/help: the guides for the roles this person holds (content in packages/ui/src/help). */
export default async function HelpPage() {
	const [session, role] = await Promise.all([getSession(), getActiveRole()]);
	return (
		<HelpScreen app="admin" content={helpFor("admin", session.roleSet, role)} />
	);
}
