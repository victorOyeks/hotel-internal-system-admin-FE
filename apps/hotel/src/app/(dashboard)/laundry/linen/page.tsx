import { LaundryLinenScreen } from "@/components/roles/laundry/linen";
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
	const [batches, all, stores, items, user] = await Promise.all([
		data.laundry.batches(),
		data.laundry.batchesPage({ page: query.page }),
		data.inventory.stores(),
		data.inventory.items(),
		getUser(),
	]);
	const store = stores.find((s) => s.kind === "LAUNDRY");
	const full =
		user?.roleLevels.some((g) => g.role === "LAUNDRY" && g.level === "FULL") ??
		false;
	return (
		<LaundryLinenScreen
			batches={batches}
			all={all}
			storeItems={store ? items.filter((i) => i.storeId === store.id) : []}
			storeId={store?.id}
			canClose={full}
		/>
	);
}
