import { FinancialsScreen } from "@/components/roles/manager/financials/screen";
import { LaundryMaintenanceMoney } from "@/components/roles/shared-staff/lm-money";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	lagosDate,
	withCategoryLabels,
} from "@hospio/api/data/mappers/finance";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Manager · Financials: overview (budget against actual, bills), expenses, bills, transactions, spend requests and tills. */
export default async function FinancialsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const query = listQueryFrom(sp, ["tab", "category"]);
	const month =
		typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month)
			? sp.month
			: lagosDate().slice(0, 7);
	// The Expenses tab pages every expense, Spend requests the waiting and questioned ones; the overview card shows the newest requests.
	const onRequests = query.tab === "requests";
	const onBills = query.tab === "bills";
	const listQuery = {
		...query,
		tab: onRequests ? "requests" : undefined,
		category: query.tab === "expenses" ? query.category : undefined,
	};
	const [
		hotel,
		expenses,
		requests,
		tills,
		transactions,
		today,
		monthSummary,
		week,
		income,
		settings,
		business,
		outletSales,
		laundry,
		maintenance,
		usage,
		categories,
		budget,
		dueBills,
		bills,
	] = await Promise.all([
		getActiveHotel(),
		data.finance.expensesPage(onBills ? { size: 1 } : listQuery),
		onRequests
			? null
			: data.finance.expensesPage({ tab: "requests", size: 10 }),
		data.finance.tills(),
		data.finance.transactions(),
		data.finance.today(),
		data.finance.month(),
		data.finance.series(),
		data.finance.income(),
		data.hotels.limits(),
		data.business.mine(),
		data.outlets.managementSales(),
		data.laundry.money(),
		data.maintenance.money(),
		data.inventory.usage(),
		data.finance.categories(true),
		data.finance.budget(month),
		data.finance.bills({ status: "UNPAID", size: 6, sort: "dueDate,asc" }),
		onBills
			? data.finance.bills({
					q: query.q,
					status: query.status,
					page: query.page,
				})
			: null,
	]);
	const label = <T extends { category: string; categoryCode?: string }>(
		rows: T[],
	) => withCategoryLabels(rows, categories);
	const labelled = {
		...expenses,
		data: { ...expenses.data, content: label(expenses.data.content) },
	};
	return (
		<>
			<FinancialsScreen
				hotelName={hotel?.name ?? "This hotel"}
				expenses={labelled}
				requests={label((requests ?? expenses).data.content)}
				tills={tills}
				transactions={transactions}
				today={today}
				outletSales={outletSales}
				month={{
					...monthSummary,
					budget:
						budget && budget.totals.budget > 0
							? budget.totals.budget
							: monthSummary.budget,
				}}
				budget={budget}
				budgetMonth={month}
				income={income}
				dueBills={dueBills.data.content}
				bills={bills}
				week={week}
				categories={categories}
				rules={{
					limits: settings.limits,
					ownerName: business?.ownerName ?? "the owner",
				}}
			/>
			<LaundryMaintenanceMoney
				laundry={laundry}
				maintenance={maintenance}
				usage={usage}
			/>
		</>
	);
}
