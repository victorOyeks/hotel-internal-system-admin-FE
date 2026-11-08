import { MarketerBusinesses } from "@/components/roles/marketer/businesses";
import { data } from "@hospio/api/data";
import { demoCommissions } from "@hospio/api/demo/fixtures/platform-extra";
import { demoMarketer } from "../me";

export const dynamic = "force-dynamic";

export default async function MarketerBusinessesPage() {
	const [me, businesses] = await Promise.all([demoMarketer(), data.platform.businesses()]);
	return <MarketerBusinesses me={me} businesses={businesses} ledger={demoCommissions.filter((c) => c.marketerId === me.id)} />;
}
