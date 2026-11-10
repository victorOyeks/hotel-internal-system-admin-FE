import { redirect } from "next/navigation";
import { ProfileScreen } from "@hospio/ui/screens/profile";
import {
	getEmailPrefs,
	getTwoStep,
	listSessions,
} from "@hospio/api/actions/profile";
import { getActiveRole, getUser } from "@hospio/api/dal";

export const dynamic = "force-dynamic";

/** Everywhere · My profile & security, served for every role at /dashboard/profile (docs/profile.md in hospio-backend). */
export default async function ProfilePage() {
	const [user, role, sessions, twoStep, emailPrefs] = await Promise.all([
		getUser(),
		getActiveRole(),
		listSessions(),
		getTwoStep(),
		getEmailPrefs(),
	]);
	if (!user) redirect("/auth");
	return (
		<ProfileScreen
			user={user}
			role={role}
			sessions={sessions}
			twoStep={twoStep}
			emailPrefs={emailPrefs}
		/>
	);
}
