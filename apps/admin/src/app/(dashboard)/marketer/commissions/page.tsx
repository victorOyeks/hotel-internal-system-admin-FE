import { MarketerCommissions } from "@/components/roles/marketer/commissions";
import type { SearchParams } from "@/components/roles/admin/params";
import { adminData } from "@hospio/api/data/admin";
import { urlPage, urlParam } from "@hospio/api/data/paging";
import { NotAMarketer } from "../not-a-marketer";

export const dynamic = "force-dynamic";

/** Marketer · Commissions: the ledger a page at a time (`?status=&page=`), the cards over every line. */
export default async function MarketerCommissionsPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const [me, result, overall] = await Promise.all([
		adminData.marketer.me(),
		adminData.marketer.commissionsPage({
			status: urlParam(sp, "status"),
			page: urlPage(sp),
		}),
		adminData.marketer.commissionsPage({ size: 1 }),
	]);
	if (!me) return <NotAMarketer />;
	return <MarketerCommissions me={me} result={result} overall={overall} />;
}
