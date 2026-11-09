import { notFound } from "next/navigation";
import { SupportTab } from "@/components/roles/admin/business-tabs/support";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";

export const dynamic = "force-dynamic";

export default async function BusinessSupportPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const business = await data.platform.business(id);
	if (!business) notFound();
	const tickets = await adminData.support.tickets({ businessId: id, size: 50 });
	return (
		<SupportTab
			businessId={id}
			businessName={business.name}
			tickets={tickets}
		/>
	);
}
