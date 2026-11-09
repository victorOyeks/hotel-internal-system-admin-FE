import { workOrderContext } from "@/components/roles/maintenance/load";
import { PreventiveScreen } from "@/components/roles/maintenance/preventive";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Maintenance · Preventive schedules and assets. */
export default async function MaintenancePreventivePage() {
	const [schedules, assets, ctx] = await Promise.all([
		data.maintenance.schedules(),
		data.maintenance.assets(),
		workOrderContext(),
	]);
	return (
		<PreventiveScreen
			schedules={schedules}
			assets={assets}
			rooms={ctx.rooms}
			technicians={ctx.technicians}
			canEdit={ctx.supervisor}
			canRunNow={false}
		/>
	);
}
