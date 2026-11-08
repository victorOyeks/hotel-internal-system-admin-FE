import { MonthScreen } from "@/components/roles/finance/month";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FinanceMonthPage() {
	const [hotel, expenses] = await Promise.all([getActiveHotel(), data.finance.expenses()]);
	return <MonthScreen expenses={expenses} hotelName={hotel?.name ?? "Hotel"} />;
}
