import {
	loadWorkOrders,
	workOrderContext,
} from "@/components/roles/maintenance/load";
import { WorkOrdersScreen } from "@/components/roles/maintenance/work-orders";
import type { SearchParamsRecord } from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Maintenance · Work orders (My repairs, 3247:13987). */
export default async function MaintenanceHome({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const [{ rows, done }, ctx] = await Promise.all([
		loadWorkOrders(searchParams),
		workOrderContext({ parts: true }),
	]);
	return (
		<WorkOrdersScreen
			rows={rows}
			done={done}
			mode="maintenance"
			me={ctx.me}
			supervisor={ctx.supervisor}
			technicians={ctx.technicians}
			rooms={ctx.rooms}
			parts={ctx.parts}
			title="Work orders"
		/>
	);
}
