import { redirect } from "next/navigation";
import { ExpensesScreen } from "@/components/roles/finance/expenses";
import { getUser } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FinanceExpensesPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const expenses = await data.finance.expenses();
	return <ExpensesScreen expenses={expenses} me={user.fullName} />;
}
