import { notFound } from "next/navigation";
import { UsageTab } from "@/components/roles/admin/business-tabs/usage";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";

export const dynamic = "force-dynamic";

export default async function BusinessUsagePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const business = await data.platform.business(id);
	if (!business) notFound();
	const [usage, health] = await Promise.all([
		adminData.usage(id),
		adminData.health.list(id),
	]);
	return (
		<UsageTab
			businessId={id}
			businessName={business.name}
			usage={usage}
			health={health[0] ?? null}
		/>
	);
}
