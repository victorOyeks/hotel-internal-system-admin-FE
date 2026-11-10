import { FinanceToday } from "@/components/roles/finance/today";
import { StockMoney } from "@/components/roles/inventory/stock-money";
import { LaundryMaintenanceMoney } from "@/components/roles/shared-staff/lm-money";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import { lagosDate } from "@hospio/api/data/mappers/finance";

export const dynamic = "force-dynamic";

export default async function FinanceTodayPage() {
	const [
		hotel,
		money,
		payments,
		tills,
		expenses,
		transactions,
		stock,
		usage,
		laundry,
		maintenance,
	] = await Promise.all([
		getActiveHotel(),
		data.finance.today(),
		data.payments.list(),
		data.finance.tills(),
		// Today's paid-out list reads today's expenses only.
		data.finance.expenses({ from: lagosDate(), to: lagosDate() }),
		data.finance.transactions(),
		data.inventory.value(),
		data.inventory.usage(),
		data.laundry.money(),
		data.maintenance.money(),
	]);
	return (
		<>
			<FinanceToday
				demo={!live("finance")}
				hotelName={hotel?.name ?? "Hotel"}
				money={money}
				payments={payments}
				tills={tills}
				expenses={expenses}
				transactions={transactions}
			/>
			<StockMoney value={stock} usage={usage} />
			<LaundryMaintenanceMoney
				laundry={laundry}
				maintenance={maintenance}
				usage={usage}
			/>
		</>
	);
}
