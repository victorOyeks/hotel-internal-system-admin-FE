import { notFound } from "next/navigation";
import { OrganizationAccount } from "@/components/roles/finance/organizations";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Finance · one account: its invoices (`?invPage=`) and stays (`?staysPage=`) a page at a time, with its figures. */
export default async function FinanceOrganizationPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<SearchParamsRecord>;
}) {
	const [{ id }, sp] = await Promise.all([params, searchParams]);
	const [org, members, invoices, stays, openInvoices] = await Promise.all([
		data.organizations.get(id),
		data.organizations.members(id),
		data.organizations.invoicesPage({
			...listQueryFrom(sp, [], "inv"),
			organizationId: id,
		}),
		data.organizations.staysPage(id, listQueryFrom(sp, [], "stays")),
		data.organizations.invoices(id, { status: "OPEN" }),
	]);
	if (!org) notFound();
	return (
		<OrganizationAccount
			org={org}
			members={members}
			invoices={invoices}
			stays={stays}
			openInvoices={openInvoices}
		/>
	);
}
