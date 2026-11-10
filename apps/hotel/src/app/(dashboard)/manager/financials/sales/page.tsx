import { SalesScreen } from "@/components/roles/shared-staff/sales-screen";
import {
	type SalesSearchParams,
	salesFilters,
} from "@/components/roles/shared-staff/sales-params";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Financials → Outlet sales: every outlet's sales with totals per outlet and per attendant. */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const filters = await salesFilters(searchParams);
	const [result, buckets, terminals] = await Promise.all([
		data.outlets.salesHistory(filters),
		data.bookings.buckets(),
		data.payments.terminals(),
	]);
	return (
		<SalesScreen
			result={result}
			filters={filters}
			management={true}
			title="Outlet sales"
			subtitle="Every sale at the restaurant, kitchen and bar · per outlet and per attendant"
			payDesk={"MANAGER"}
			terminals={terminals}
			inHouse={buckets.inHouse}
		/>
	);
}
