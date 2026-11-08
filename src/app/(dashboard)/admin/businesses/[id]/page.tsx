import { notFound } from "next/navigation";
import { BusinessPage } from "@/components/roles/admin/business-page";
import { getActiveRole } from "@/lib/dal";
import { data } from "@/lib/data";
import { demoBusinessUsers, demoOtherHotels } from "@/lib/demo/fixtures/platform-extra";
import { adminRole } from "../../role";

export const dynamic = "force-dynamic";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [role, business] = await Promise.all([getActiveRole(), data.platform.business(id)]);
	if (!business) notFound();
	const [summaries, fees, tickets, changes] = await Promise.all([data.hotels.summaries(), data.platform.feeStatements(), data.platform.tickets(), data.platform.changes()]);
	const hotels = business.id === "biz-1" ? summaries : (demoOtherHotels[business.id] ?? []);
	return (
		<BusinessPage
			role={adminRole(role)}
			business={business}
			hotels={hotels}
			users={demoBusinessUsers.filter((u) => u.businessId === business.id)}
			fees={fees.filter((f) => f.businessName === business.name)}
			tickets={tickets.filter((t) => t.businessName === business.name)}
			changes={changes.filter((c) => c.businessName === business.name)}
		/>
	);
}
