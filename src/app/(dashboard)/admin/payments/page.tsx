import { PaymentsScreen } from "@/components/roles/admin/payments";
import { getActiveRole } from "@/lib/dal";
import { demoFailedPayouts, demoPayoutBatches, demoSettlements } from "@/lib/demo/fixtures/platform-extra";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function PlatformPaymentsPage() {
	const role = await getActiveRole();
	return <PaymentsScreen role={adminRole(role)} settlements={demoSettlements} batches={demoPayoutBatches} failed={demoFailedPayouts} />;
}
