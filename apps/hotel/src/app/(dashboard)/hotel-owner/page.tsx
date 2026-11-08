import { redirect } from "next/navigation";
import { OwnerDashboard } from "@/components/roles/owner/dashboard";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { ownerDaily, ownerHotels, ownerWorthALook } from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 01 Dashboard. */
export default async function OwnerHomePage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [approvals, activity] = await Promise.all([data.approvals.list(), data.activity.list()]);
	return <OwnerDashboard user={user} hotels={ownerHotels} approvals={approvals} activity={activity} daily={ownerDaily} worth={ownerWorthALook} />;
}
