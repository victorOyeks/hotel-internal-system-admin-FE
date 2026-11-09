import { notFound } from "next/navigation";
import { OrganizationScreen } from "@/components/roles/manager/organizations/organization-screen";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Organizations · one account: overview, stays & bills (its folios), staff, invoices, agreement. */
export default async function OrganizationPage({
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
		<OrganizationScreen
			org={org}
			members={members}
			invoices={invoices}
			stays={stays}
		/>
	);
}
