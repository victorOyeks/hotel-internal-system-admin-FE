import { SalesScreen } from "@/components/roles/shared-staff/sales-screen";
import {
	type SalesSearchParams,
	salesFilters,
} from "@/components/roles/shared-staff/sales-params";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Bar · Sales: every sale of the bar over the days chosen, with the unpaid ones to collect. */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const filters = await salesFilters(searchParams, "BAR");
	const [result, buckets, terminals] = await Promise.all([
		data.outlets.salesHistory(filters),
		data.bookings.buckets(),
		data.payments.terminals(),
	]);
	return (
		<SalesScreen
			result={result}
			filters={filters}
			management={false}
			title="Sales"
			subtitle="Every bar sale · open one to see it, collect it or charge it to a room"
			payDesk={"BAR"}
			terminals={terminals}
			inHouse={buckets.inHouse}
		/>
	);
}
