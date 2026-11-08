import { notFound } from "next/navigation";
import { OrganizationScreen } from "@/components/roles/manager/organizations/organization-screen";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Manager · Organizations · one account: overview, stays & bills, staff, invoices & statements, agreement. */
export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [org, members, invoices, bookings, folios] = await Promise.all([
		data.organizations.get(id),
		data.organizations.members(id),
		data.organizations.invoices(id),
		data.bookings.list(),
		data.folios.list(),
	]);
	if (!org) notFound();
	return <OrganizationScreen org={org} members={members} invoices={invoices} stays={bookings.filter((b) => b.organizationId === id)} folios={folios.filter((f) => f.organizationName === org.name)} />;
}
