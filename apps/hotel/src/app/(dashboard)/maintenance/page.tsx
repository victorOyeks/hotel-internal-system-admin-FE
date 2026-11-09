import { workOrderContext } from "@/components/roles/maintenance/load";
import { WorkOrdersScreen } from "@/components/roles/maintenance/work-orders";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Maintenance · Work orders (My repairs, 3247:13987). */
export default async function MaintenanceHome() {
	const [rows, ctx] = await Promise.all([
		data.maintenance.workOrders("all"),
		workOrderContext({ parts: true }),
	]);
	return (
		<WorkOrdersScreen
			rows={rows}
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
