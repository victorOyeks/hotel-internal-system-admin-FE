import { TeamStorePage } from "@/components/roles/shared-staff/team-store";

export const dynamic = "force-dynamic";

/** Laundry · Laundry store: chemicals and linen here, and asking the main store for more. */
export default function LaundryStorePage() {
	return (
		<TeamStorePage
			team="LAUNDRY"
			title="Laundry store"
			subtitle="Detergent, chemicals and linen at the laundry"
		/>
	);
}
