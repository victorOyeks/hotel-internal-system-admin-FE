import { MarketerBusinesses } from "@/components/roles/marketer/businesses";
import { data } from "@/lib/data";
import { demoCommissions } from "@/lib/demo/fixtures/platform-extra";
import { demoMarketer } from "../me";

export const dynamic = "force-dynamic";

export default async function MarketerBusinessesPage() {
	const [me, businesses] = await Promise.all([demoMarketer(), data.platform.businesses()]);
	return <MarketerBusinesses me={me} businesses={businesses} ledger={demoCommissions.filter((c) => c.marketerId === me.id)} />;
}
