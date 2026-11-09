import { MarketerBusinesses } from "@/components/roles/marketer/businesses";
import { adminData } from "@hospio/api/data/admin";
import { NotAMarketer } from "../not-a-marketer";

export const dynamic = "force-dynamic";

export default async function MarketerBusinessesPage() {
	const [me, businesses, ledger] = await Promise.all([
		adminData.marketer.me(),
		adminData.marketer.businesses(),
		adminData.marketer.commissions(),
	]);
	if (!me) return <NotAMarketer />;
	return <MarketerBusinesses me={me} businesses={businesses} ledger={ledger} />;
}
