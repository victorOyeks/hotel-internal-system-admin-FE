import { redirect } from "next/navigation";
import { ExpensesScreen } from "@/components/roles/finance/expenses";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { withCategoryLabels } from "@hospio/api/data/mappers/finance";
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
	const [result, settings, business, categories] = await Promise.all([
		data.finance.expensesPage(query),
		data.hotels.limits(),
		data.business.mine(),
		data.finance.categories(),
	]);
	const labelled = {
		...result,
		data: { ...result.data, content: withCategoryLabels(result.data.content, categories) },
	};
	return (
		<ExpensesScreen
			result={labelled}
			me={user.fullName}
			categories={categories.map((c) => c.label)}
			rules={{
				limits: settings.limits,
				ownerName: business?.ownerName ?? "the owner",
			}}
		/>
	);
}
