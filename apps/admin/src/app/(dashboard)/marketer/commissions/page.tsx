import { MarketerCommissions } from "@/components/roles/marketer/commissions";
import { adminData } from "@hospio/api/data/admin";
import { NotAMarketer } from "../not-a-marketer";

export const dynamic = "force-dynamic";

export default async function MarketerCommissionsPage() {
	const [me, ledger] = await Promise.all([
		adminData.marketer.me(),
		adminData.marketer.commissions(),
	]);
	if (!me) return <NotAMarketer />;
	return <MarketerCommissions me={me} ledger={ledger} />;
}
