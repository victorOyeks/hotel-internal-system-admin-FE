import { OwnerFinancials } from "@/components/roles/owner/financials";
import { data } from "@/lib/data";
import { ownerBudgets, ownerHotels, ownerPayMix, ownerPayroll, ownerRevenueSources, ownerTrend } from "@/lib/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 06 Financials. */
export default async function Page() {
	const [transactions, expenses, organizations, approvals] = await Promise.all([data.finance.transactions(), data.finance.expenses(), data.organizations.list(), data.approvals.list()]);
	return <OwnerFinancials hotels={ownerHotels} trend={ownerTrend} budgets={ownerBudgets} sources={ownerRevenueSources} payMix={ownerPayMix} transactions={transactions} expenses={expenses} payroll={ownerPayroll} organizations={organizations} approvals={approvals} />;
}
