import { notFound } from "next/navigation";
import { BusinessPage } from "@/components/roles/admin/business-page";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../../role";

export const dynamic = "force-dynamic";

export default async function BusinessDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [role, business] = await Promise.all([
		getActiveRole(),
		data.platform.business(id),
	]);
	// Null means tenant-service answered 404; any other failure threw and error.tsx offers a retry.
	if (!business) notFound();
	const [hotels, users, admins, fees, tickets, changes] = await Promise.all([
		data.platform.businessHotels(business.id),
		data.platform.businessUsers(business.id),
		adminData.team.list(),
		adminData.fees.statements({ businessId: business.id, size: 24 }),
		adminData.support.tickets({ businessId: business.id, size: 50 }),
		adminData.changes.list({ businessId: business.id, size: 50 }),
	]);
	return (
		<BusinessPage
			role={adminRole(role)}
			business={business}
			hotels={hotels}
			users={users}
			admins={admins}
			fees={fees.content}
			tickets={tickets.content}
			changes={changes.content}
		/>
	);
}
