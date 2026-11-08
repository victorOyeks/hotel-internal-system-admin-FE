import { FinancialsScreen } from "@/components/roles/manager/financials/screen";
import { getActiveHotel } from "@/lib/dal";
import { data } from "@/lib/data";
import { demoBills, demoBudget, demoExpenseCategories, demoIncomeSources, demoMonth, demoWeekRevenue } from "@/lib/demo/fixtures/manager-ops";

export const dynamic = "force-dynamic";

/** Manager · Financials: overview, expenses, transactions, spend requests and tills. */
export default async function FinancialsPage() {
	const [hotel, expenses, tills, transactions, today] = await Promise.all([getActiveHotel(), data.finance.expenses(), data.finance.tills(), data.finance.transactions(), data.finance.today()]);
	return (
		<FinancialsScreen
			hotelName={hotel?.name ?? "This hotel"}
			expenses={expenses}
			tills={tills}
			transactions={transactions}
			today={today}
			month={demoMonth}
			budget={demoBudget}
			income={demoIncomeSources}
			bills={demoBills}
			week={demoWeekRevenue}
			categories={demoExpenseCategories}
		/>
	);
}
