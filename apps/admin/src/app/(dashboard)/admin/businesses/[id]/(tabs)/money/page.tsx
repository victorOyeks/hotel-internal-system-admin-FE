import { notFound } from "next/navigation";
import { MoneyTab } from "@/components/roles/admin/business-tabs/money";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";

export const dynamic = "force-dynamic";

export default async function BusinessMoneyPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const business = await data.platform.business(id);
	if (!business) notFound();
	const [statements, settlements, summary] = await Promise.all([
		adminData.fees.statements({ businessId: id, size: 24 }),
		adminData.payments.settlements({ businessId: id, size: 30 }),
		adminData.payments.summary({ businessId: id }),
	]);
	return (
		<MoneyTab
			businessId={id}
			businessName={business.name}
			statements={statements.content}
			settlements={settlements.content}
			summary={summary}
		/>
	);
}
