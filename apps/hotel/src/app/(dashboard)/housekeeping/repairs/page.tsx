import { workOrderContext } from "@/components/roles/maintenance/load";
import { WorkOrdersScreen } from "@/components/roles/maintenance/work-orders";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Repairs: report a fault in a room or an area and follow it to done (maintenance does the work). */
export default async function RepairsPage() {
	const [rows, ctx] = await Promise.all([
		data.maintenance.workOrders("all"),
		workOrderContext(),
	]);
	return (
		<WorkOrdersScreen
			rows={rows}
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
