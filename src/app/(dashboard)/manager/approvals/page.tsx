import { ApprovalsScreen } from "@/components/roles/manager/approvals";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
	const rows = await data.approvals.list();
	return <ApprovalsScreen rows={rows} />;
}
