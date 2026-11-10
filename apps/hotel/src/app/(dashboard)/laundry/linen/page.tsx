import { LaundryLinenScreen } from "@/components/roles/laundry/linen";
import { LinenRequestsCard } from "@/components/roles/laundry/linen-requests";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Laundry · Linen in & out: batches from housekeeping, condemned linen, chemicals used. */
export default async function LaundryLinenPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams);
	const [batches, all, stores, items, user, open, sent] = await Promise.all([
		data.laundry.batches(),
		data.laundry.batchesPage({ page: query.page }),
		data.inventory.stores(),
		data.inventory.items(),
		getUser(),
		data.housekeeping.linenRequests(),
		data.housekeeping.linenRequests("SENT"),
	]);
	const store = stores.find((s) => s.kind === "LAUNDRY");
	const full =
		user?.roleLevels.some((g) => g.role === "LAUNDRY" && g.level === "FULL") ??
		false;
	// Mark sent: laundry Edit or Full, or a manager (housekeeping-service decides the same).
	const canSend =
		user?.roleLevels.some(
			(g) => g.role === "LAUNDRY" && (g.level === "FULL" || g.level === "EDIT"),
		) ||
		user?.roles.some((r) => r === "MANAGER" || r === "OWNER") ||
		false;
	return (
		<>
			<LaundryLinenScreen
				batches={batches}
				all={all}
				storeItems={store ? items.filter((i) => i.storeId === store.id) : []}
				storeId={store?.id}
				canClose={full}
			/>
			<LinenRequestsCard
				open={open.rows}
				sent={sent.rows}
				canSend={canSend}
				failed={!open.ok}
			/>
		</>
	);
}
