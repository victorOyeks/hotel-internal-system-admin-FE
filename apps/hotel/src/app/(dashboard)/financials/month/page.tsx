import { MonthScreen } from "@/components/roles/finance/month";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import { lagosDate } from "@hospio/api/data/mappers/finance";

export const dynamic = "force-dynamic";

export default async function FinanceMonthPage({
	searchParams,
}: {
	searchParams: Promise<{ month?: string }>;
}) {
	const { month } = await searchParams;
	const today = lagosDate();
	const first = `${today.slice(0, 8)}01`;
	const prevEnd = lagosDate(
		new Date(Date.parse(`${first}T12:00:00Z`) - 86_400_000),
	);
	const [from, to] =
		month === "last" ? [`${prevEnd.slice(0, 8)}01`, prevEnd] : [first, today];
	const [hotel, expenses, series, income] = await Promise.all([
		getActiveHotel(),
		// The month's expenses only (every page of them), not the 90-day list.
		data.finance.expenses({ from, to }),
		data.finance.series(from, to),
		data.finance.income(from, to),
	]);
	return (
		<MonthScreen
			demo={!live("finance")}
			expenses={expenses}
			series={series}
			income={income}
			from={from}
			to={to}
			hotelName={hotel?.name ?? "Hotel"}
		/>
	);
}
