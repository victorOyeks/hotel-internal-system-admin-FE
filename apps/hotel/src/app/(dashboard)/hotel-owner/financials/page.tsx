import { OwnerFinancials } from "@/components/roles/owner/financials";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import { lagosDay } from "@hospio/api/data/mappers/finance";
import {
	ownerBudgets,
	ownerPayMix,
	ownerPayroll,
	ownerRevenueSources,
	ownerTrend,
} from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/**
 * Hotel Owner · 06 Financials. KPIs, the series, transactions, expenses and approvals are live; payroll,
 * bills, budgets, branch P&L and organization credit show "Not connected yet" until their services are.
 */
export default async function Page() {
	const [
		hotels,
		transactions,
		expenses,
		organizations,
		approvals,
		series,
		business,
		settings,
		active,
	] = await Promise.all([
		data.hotels.withMoney(),
		data.finance.transactions(),
		data.finance.expenses(),
		data.organizations.list(),
		data.approvals.list(),
		data.finance.series(lagosDay(-29), lagosDay(0)),
		data.business.mine(),
		data.hotels.limits(),
		getActiveHotel(),
	]);
	const worth = await data.hotels.worth(hotels, approvals);
	return (
		<OwnerFinancials
			demo={!live("finance")}
			businessName={business?.name ?? "Your business"}
			hotelName={active?.name ?? "This hotel"}
			hotels={hotels}
			series={series}
			worth={worth}
			limit={settings.limits.managerExpenseLimit}
			trend={ownerTrend}
			budgets={ownerBudgets}
			sources={ownerRevenueSources}
			payMix={ownerPayMix}
			transactions={transactions}
			expenses={expenses}
			payroll={ownerPayroll}
			organizations={organizations}
			approvals={approvals}
		/>
	);
}
