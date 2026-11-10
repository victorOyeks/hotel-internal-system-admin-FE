import { ApprovalsScreen } from "@/components/roles/manager/approvals";
import { data } from "@hospio/api/data";
import { getSession } from "@hospio/api/dal";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Manager · Approvals: one tab a page at a time (`?tab=&q=&kind=&page=`), counts and money from platform-service. */
export default async function ApprovalsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const query = listQueryFrom(sp, ["tab", "kind"]);
	const tab = ["owner", "decided"].includes(String(query.tab))
		? query.tab
		: "waiting";
	const open = urlParam(sp, "open");
	const [result, settings, business, session] = await Promise.all([
		data.approvals.page({ ...query, tab }),
		data.hotels.limits(),
		data.business.mine(),
		getSession(),
	]);
	const opened =
		open && !result.data.content.some((a) => a.id === open)
			? await data.approvals.get(open)
			: null;
	return (
		<ApprovalsScreen
			result={result}
			opened={opened}
			limit={settings.limits.managerExpenseLimit}
			ownerName={business?.ownerName ?? "the owner"}
			meId={session.sub}
		/>
	);
}
