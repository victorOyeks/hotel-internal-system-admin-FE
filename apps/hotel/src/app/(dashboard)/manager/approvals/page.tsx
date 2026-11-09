import { ApprovalsScreen } from "@/components/roles/manager/approvals";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
	const [rows, settings, business] = await Promise.all([
		data.approvals.list(),
		data.hotels.limits(),
		data.business.mine(),
	]);
	return (
		<ApprovalsScreen
			rows={rows}
			limit={settings.limits.managerExpenseLimit}
			ownerName={business?.ownerName ?? "the owner"}
		/>
	);
}
