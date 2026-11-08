import { OrganizationsList } from "@/components/roles/finance/organizations";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceOrganizationsPage() {
	const [organizations, invoices] = await Promise.all([data.organizations.list(), data.organizations.invoices()]);
	return <OrganizationsList organizations={organizations} invoices={invoices} />;
}
