import { notFound } from "next/navigation";
import { OrganizationAccount } from "@/components/roles/finance/organizations";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceOrganizationPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [org, members, invoices, stays] = await Promise.all([
		data.organizations.get(id),
		data.organizations.members(id),
		data.organizations.invoices(id),
		data.organizations.stays(id),
	]);
	if (!org) notFound();
	return (
		<OrganizationAccount
			org={org}
			members={members}
			invoices={invoices}
			stays={stays}
		/>
	);
}
