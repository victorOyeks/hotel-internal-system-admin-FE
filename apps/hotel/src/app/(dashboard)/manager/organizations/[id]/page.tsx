import { notFound } from "next/navigation";
import { OrganizationScreen } from "@/components/roles/manager/organizations/organization-screen";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/**
 * Manager · Organizations · one account: overview, stays & bills (its folios, `?staysPage=`), staff, invoices (`?invPage=`),
 * agreement. The figures come with the account, so no tab needs the whole history.
 */
export default async function OrganizationPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<SearchParamsRecord>;
}) {
	const [{ id }, sp] = await Promise.all([params, searchParams]);
	const [org, members, invoices, stays, openInvoices, inHouse] =
		await Promise.all([
			data.organizations.get(id),
			data.organizations.members(id),
			data.organizations.invoicesPage({
				...listQueryFrom(sp, [], "inv"),
				organizationId: id,
			}),
			data.organizations.staysPage(id, listQueryFrom(sp, [], "stays")),
			data.organizations.invoices(id, { status: "OPEN" }),
			data.organizations.staysPage(id, { status: "OPEN", size: 100 }),
		]);
	if (!org) notFound();
	return (
		<OrganizationScreen
			org={org}
			members={members}
			invoices={invoices}
			stays={stays}
			openInvoices={openInvoices}
			inHouse={inHouse.data}
		/>
	);
}
