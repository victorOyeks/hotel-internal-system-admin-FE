import { redirect } from "next/navigation";
import { ExpensesScreen } from "@/components/roles/finance/expenses";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceExpensesPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const expenses = await data.finance.expenses();
	return <ExpensesScreen expenses={expenses} me={user.fullName} />;
}
