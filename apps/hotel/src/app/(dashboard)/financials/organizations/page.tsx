import { OrganizationsList } from "@/components/roles/finance/organizations";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Finance · Organizations: the accounts a page at a time (`?q=&status=&sort=&page=`) with the hotel's overview. */
export default async function FinanceOrganizationsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams);
	const [result, overview] = await Promise.all([
		data.organizations.page(query),
		data.organizations.overview(),
	]);
	return <OrganizationsList result={result} overview={overview} />;
}
