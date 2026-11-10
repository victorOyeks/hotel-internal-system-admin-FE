import { FinancialsScreen } from "@/components/roles/manager/financials/screen";
import { LaundryMaintenanceMoney } from "@/components/roles/shared-staff/lm-money";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";
import { live } from "@hospio/api/data/live";
import {
	demoBills,
	demoBudget,
	demoExpenseCategories,
} from "@hospio/api/demo/fixtures/manager-ops";

export const dynamic = "force-dynamic";

/** Manager · Financials: overview, expenses, transactions, spend requests and tills. */
export default async function FinancialsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams, ["tab", "category"]);
	// The Expenses tab pages every expense, Spend requests the waiting and questioned ones; the overview card shows the newest requests.
	const onRequests = query.tab === "requests";
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
		month,
		week,
		income,
		settings,
		business,
		outletSales,
		laundry,
		maintenance,
		usage,
	] = await Promise.all([
		getActiveHotel(),
		data.finance.expensesPage(listQuery),
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
	]);
	// Budgets and bills have no endpoint yet: only the demo has them.
	const demo = !live("finance");
	return (
		<>
			<FinancialsScreen
				hotelName={hotel?.name ?? "This hotel"}
				expenses={expenses}
				requests={(requests ?? expenses).data.content}
				tills={tills}
				transactions={transactions}
				today={today}
				outletSales={outletSales}
				month={month}
				budget={demo ? demoBudget : null}
				income={income}
				bills={demo ? demoBills : null}
				week={week}
				categories={demoExpenseCategories}
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
