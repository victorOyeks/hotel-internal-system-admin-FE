import { redirect } from "next/navigation";
import { ProfileScreen } from "@/components/roles/shared/profile";
import { getActiveRole, getUser } from "@/lib/dal";
import { demoNotificationPrefs, demoSessions } from "@/lib/demo/fixtures/manager-admin";

export const dynamic = "force-dynamic";

/** Everywhere · My profile & security, served for every role at /dashboard/profile. */
export default async function ProfilePage() {
	const [user, role] = await Promise.all([getUser(), getActiveRole()]);
	if (!user) redirect("/auth");
	return <ProfileScreen user={user} role={role} sessions={demoSessions} prefs={demoNotificationPrefs} />;
}
