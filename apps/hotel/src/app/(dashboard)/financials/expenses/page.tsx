import { redirect } from "next/navigation";
import { ExpensesScreen } from "@/components/roles/finance/expenses";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceExpensesPage() {
	const user = await getUser();
	if (!user) redirect("/auth");
	const [expenses, settings, business] = await Promise.all([
		data.finance.expenses(),
		data.hotels.limits(),
		data.business.mine(),
	]);
	return (
		<ExpensesScreen
			expenses={expenses}
			me={user.fullName}
			rules={{
				limits: settings.limits,
				ownerName: business?.ownerName ?? "the owner",
			}}
		/>
	);
}
