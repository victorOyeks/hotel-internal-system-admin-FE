import { MonthScreen } from "@/components/roles/finance/month";
import { getActiveHotel } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FinanceMonthPage() {
	const [hotel, expenses] = await Promise.all([getActiveHotel(), data.finance.expenses()]);
	return <MonthScreen expenses={expenses} hotelName={hotel?.name ?? "Hotel"} />;
}
