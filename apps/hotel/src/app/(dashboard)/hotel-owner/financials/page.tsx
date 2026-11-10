import { OwnerFinancials } from "@/components/roles/owner/financials";
import { LaundryMaintenanceMoney } from "@/components/roles/shared-staff/lm-money";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import { lagosDay, withCategoryLabels } from "@hospio/api/data/mappers/finance";
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
		income,
		outletSales,
		laundry,
		maintenance,
		usage,
		budget,
		dueBills,
		categories,
	] = await Promise.all([
		data.owner.hotels(),
		data.finance.transactions(),
		data.finance.expenses(),
		data.owner.organizations(),
		data.owner.approvals(),
		data.finance.series(lagosDay(-29), lagosDay(0)),
		data.business.mine(),
		data.hotels.limits(),
		getActiveHotel(),
		data.finance.income(),
		data.outlets.managementSales(),
		data.laundry.money(),
		data.maintenance.money(),
		data.inventory.usage(),
		data.finance.budget(lagosDay(0).slice(0, 7)),
		data.finance.bills({ status: "UNPAID", size: 6, sort: "dueDate,asc" }),
		data.finance.categories(true),
	]);
	const worth = await data.hotels.worth(hotels, approvals);
	return (
		<>
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
				income={income}
				payMix={ownerPayMix}
				transactions={transactions}
				expenses={withCategoryLabels(expenses, categories)}
				payroll={ownerPayroll}
				organizations={organizations}
				creditRequests={data.owner.creditRequests(approvals, organizations)}
				approvals={approvals}
				outletSales={outletSales}
				budget={budget}
				dueBills={dueBills.data.content}
				categories={categories}
			/>
			<LaundryMaintenanceMoney
				laundry={laundry}
				maintenance={maintenance}
				usage={usage}
			/>
		</>
	);
}
