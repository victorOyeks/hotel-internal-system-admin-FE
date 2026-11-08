import { OrganizationsScreen } from "@/components/roles/manager/organizations/organizations-screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Organizations: company accounts, outstanding balances, new organization. */
export default async function OrganizationsPage() {
	const [hotel, organizations, invoices] = await Promise.all([getActiveHotel(), data.organizations.list(), data.organizations.invoices()]);
	return <OrganizationsScreen hotelName={hotel?.name ?? "This hotel"} organizations={organizations} invoices={invoices} />;
}
