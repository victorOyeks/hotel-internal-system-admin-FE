import { TeamStorePage } from "@/components/roles/shared-staff/team-store";

export const dynamic = "force-dynamic";

/** Maintenance · Maintenance store: parts on the shelf and asking the main store for more. */
export default function MaintenanceStorePage() {
	return (
		<TeamStorePage
			team="MAINTENANCE"
			title="Maintenance store"
			subtitle="Parts on the shelf · what you use on a work order comes off here"
		/>
	);
}
