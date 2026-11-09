import { FinanceToday } from "@/components/roles/finance/today";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";

export const dynamic = "force-dynamic";

export default async function FinanceTodayPage() {
	const [hotel, money, payments, tills, expenses, transactions] =
		await Promise.all([
			getActiveHotel(),
			data.finance.today(),
			data.payments.list(),
			data.finance.tills(),
			data.finance.expenses(),
			data.finance.transactions(),
		]);
	return (
		<FinanceToday
			demo={!live("finance")}
			hotelName={hotel?.name ?? "Hotel"}
			money={money}
			payments={payments}
			tills={tills}
			expenses={expenses}
			transactions={transactions}
		/>
	);
}
