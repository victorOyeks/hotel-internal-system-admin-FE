import { MarketerRefer } from "@/components/roles/marketer/refer";
import { adminData } from "@hospio/api/data/admin";
import { NotAMarketer } from "../not-a-marketer";

export const dynamic = "force-dynamic";

export default async function MarketerReferPage() {
	const [me, referrals] = await Promise.all([
		adminData.marketer.me(),
		adminData.marketer.referrals(),
	]);
	if (!me) return <NotAMarketer />;
	return <MarketerRefer me={me} referrals={referrals} />;
}
