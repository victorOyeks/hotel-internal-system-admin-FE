import { TeamStorePage } from "@/components/roles/shared-staff/team-store";

export const dynamic = "force-dynamic";

/** Housekeeping · Housekeeping store: supplies and linen on the shelf, and asking the main store for more. */
export default function HousekeepingStorePage() {
	return (
		<TeamStorePage
			team="HOUSEKEEPING"
			title="Housekeeping store"
			subtitle="Room supplies and clean linen on the shelf"
		/>
	);
}
