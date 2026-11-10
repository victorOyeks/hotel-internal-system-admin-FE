import { redirect } from "next/navigation";
import { ExpensesScreen } from "@/components/roles/finance/expenses";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Finance · Expenses: one tab a page at a time (`?tab=&q=&category=&page=`), counts and totals from finance-service. */
export default async function FinanceExpensesPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const user = await getUser();
	if (!user) redirect("/auth");
	const query = listQueryFrom(await searchParams, ["tab", "category"]);
	const [result, settings, business] = await Promise.all([
		data.finance.expensesPage(query),
		data.hotels.limits(),
		data.business.mine(),
	]);
	return (
		<ExpensesScreen
			result={result}
			me={user.fullName}
			rules={{
				limits: settings.limits,
				ownerName: business?.ownerName ?? "the owner",
			}}
		/>
	);
}
