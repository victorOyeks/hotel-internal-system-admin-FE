import { FinancialsScreen } from "@/components/roles/manager/financials/screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import {
	demoBills,
	demoBudget,
	demoExpenseCategories,
} from "@hospio/api/demo/fixtures/manager-ops";

export const dynamic = "force-dynamic";

/** Manager · Financials: overview, expenses, transactions, spend requests and tills. */
export default async function FinancialsPage() {
	const [
		hotel,
		expenses,
		tills,
		transactions,
		today,
		month,
		week,
		income,
		settings,
		business,
		outletSales,
	] = await Promise.all([
		getActiveHotel(),
		data.finance.expenses(),
		data.finance.tills(),
		data.finance.transactions(),
		data.finance.today(),
		data.finance.month(),
		data.finance.series(),
		data.finance.income(),
		data.hotels.limits(),
		data.business.mine(),
		data.outlets.managementSales(),
	]);
	// Budgets and bills have no endpoint yet: only the demo has them.
	const demo = !live("finance");
	return (
		<FinancialsScreen
			hotelName={hotel?.name ?? "This hotel"}
			expenses={expenses}
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
	);
}
