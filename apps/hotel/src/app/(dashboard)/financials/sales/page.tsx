import { SalesScreen } from "@/components/roles/shared-staff/sales-screen";
import {
	type SalesSearchParams,
	salesFilters,
} from "@/components/roles/shared-staff/sales-params";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Finance · Outlet sales: every outlet's sales with totals per outlet and per attendant, and the CSV export. Finance looks; it takes no payments here. */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const filters = await salesFilters(searchParams);
	const [result, buckets, terminals] = await Promise.all([
		data.outlets.salesHistory(filters),
		Promise.resolve({ inHouse: [] }),
		Promise.resolve([]),
	]);
	return (
		<SalesScreen
			result={result}
			filters={filters}
			management={true}
			title="Outlet sales"
			subtitle="Every sale at the restaurant, kitchen and bar · per outlet and per attendant · export for the books"
			payDesk={null}
			terminals={terminals}
			inHouse={buckets.inHouse}
		/>
	);
}
