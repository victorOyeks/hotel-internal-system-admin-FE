import { SalesScreen } from "@/components/roles/shared-staff/sales-screen";
import {
	type SalesSearchParams,
	salesFilters,
} from "@/components/roles/shared-staff/sales-params";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Kitchen · Sales: every sale of the kitchen and restaurant over the days chosen, with the unpaid ones to collect. */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const filters = await salesFilters(searchParams, "KITCHEN");
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
			subtitle="Every kitchen and restaurant sale · open one to see it, collect it or charge it to a room"
			payDesk={"KITCHEN"}
			terminals={terminals}
			inHouse={buckets.inHouse}
		/>
	);
}
