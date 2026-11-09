import { notFound } from "next/navigation";
import { ActivityTab } from "@/components/roles/admin/business-tabs/activity";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../../../../role";

export const dynamic = "force-dynamic";

export default async function BusinessActivityPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [role, business] = await Promise.all([
		getActiveRole(),
		data.platform.business(id),
	]);
	if (!business) notFound();
	const [activity, changes, grants] = await Promise.all([
		adminData.activity({ businessId: id, size: 50 }),
		adminData.changes.list({ businessId: id, size: 50 }),
		adminData.supportAccess(id),
	]);
	return (
		<ActivityTab
			business={business}
			activity={activity}
			changes={changes.content}
			grants={grants}
			canEdit={adminRole(role) !== "FINANCE_ADMIN"}
		/>
	);
}
