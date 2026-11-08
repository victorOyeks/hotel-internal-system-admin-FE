import { MarketerCommissions } from "@/components/roles/marketer/commissions";
import { demoCommissions } from "@hospio/api/demo/fixtures/platform-extra";
import { demoMarketer } from "../me";

export const dynamic = "force-dynamic";

export default async function MarketerCommissionsPage() {
	const me = await demoMarketer();
	return <MarketerCommissions me={me} ledger={demoCommissions.filter((c) => c.marketerId === me.id)} />;
}
