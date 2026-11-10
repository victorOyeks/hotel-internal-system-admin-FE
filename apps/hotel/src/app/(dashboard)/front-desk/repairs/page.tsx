import {
	loadWorkOrders,
	workOrderContext,
} from "@/components/roles/maintenance/load";
import { WorkOrdersScreen } from "@/components/roles/maintenance/work-orders";
import type { SearchParamsRecord } from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Repairs: report a fault in a room or an area and follow it to done (maintenance does the work). */
export default async function RepairsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const [{ rows, done }, ctx] = await Promise.all([
		loadWorkOrders(searchParams),
		workOrderContext(),
	]);
	return (
		<WorkOrdersScreen
			rows={rows}
			done={done}
			mode="desk"
			me={ctx.me}
			supervisor={false}
			technicians={[]}
			rooms={ctx.rooms}
			title="Repairs"
			subtitle="Report a fault and see where maintenance is with it"
		/>
	);
}
