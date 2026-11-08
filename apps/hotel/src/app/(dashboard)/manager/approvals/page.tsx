import { ApprovalsScreen } from "@/components/roles/manager/approvals";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
	const rows = await data.approvals.list();
	return <ApprovalsScreen rows={rows} />;
}
