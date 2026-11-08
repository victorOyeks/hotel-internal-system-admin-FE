import { MarketerRefer } from "@/components/roles/marketer/refer";
import { demoReferrals } from "@hospio/api/demo/fixtures/platform-extra";
import { demoMarketer } from "../me";

export const dynamic = "force-dynamic";

export default async function MarketerReferPage() {
	const me = await demoMarketer();
	return <MarketerRefer me={me} referrals={demoReferrals.filter((r) => r.marketerId === me.id)} />;
}
