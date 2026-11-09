import { workOrderContext } from "@/components/roles/maintenance/load";
import { ManagerTasks } from "@/components/roles/manager/tasks/lm-tasks";
import { getActiveHotel, getSession } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Tasks & maintenance: work orders, preventive schedules and assets, laundry prices. */
export default async function TasksPage() {
	const [hotel, rows, schedules, assets, prices, ctx, session] =
		await Promise.all([
			getActiveHotel(),
			data.maintenance.workOrders("all"),
			data.maintenance.schedules(),
			data.maintenance.assets(),
			data.laundry.prices(),
			workOrderContext({ parts: true }),
			getSession(),
		]);
	return (
		<ManagerTasks
			rows={rows}
			me={ctx.me}
			technicians={ctx.technicians}
			rooms={ctx.rooms}
			parts={ctx.parts}
			schedules={schedules}
			assets={assets}
			prices={prices}
			hotelName={hotel?.name ?? "This hotel"}
			canEdit={!session.actedBy}
		/>
	);
}
