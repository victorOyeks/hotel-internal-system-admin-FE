import { MarketerRefer } from "@/components/roles/marketer/refer";
import type { SearchParams } from "@/components/roles/admin/params";
import { adminData } from "@hospio/api/data/admin";
import { urlPage } from "@hospio/api/data/paging";
import { NotAMarketer } from "../not-a-marketer";

export const dynamic = "force-dynamic";

/** Marketer · Refer: the form and my referrals a page at a time (`?page=`). */
export default async function MarketerReferPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const page = urlPage(await searchParams);
	const [me, result] = await Promise.all([
		adminData.marketer.me(),
		adminData.marketer.referralsPage({ page }),
	]);
	if (!me) return <NotAMarketer />;
	return <MarketerRefer me={me} result={result} />;
}
