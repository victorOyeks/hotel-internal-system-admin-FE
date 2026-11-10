import { LinenScreen } from "@/components/roles/housekeeping/linen";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Housekeeping · Linen: clean linen on hand, batches sent to the laundry. */
export default async function LinenPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams);
	const [batches, all, stores, items] = await Promise.all([
		data.laundry.batches(),
		data.laundry.batchesPage({ page: query.page }),
		data.inventory.stores(),
		data.inventory.items(),
	]);
	const hk = stores.find((s) => s.kind === "HOUSEKEEPING");
	const laundry = stores.find((s) => s.kind === "LAUNDRY");
	const isLinen = (c: string) => c.toLowerCase() === "linen";
	return (
		<LinenScreen
			clean={
				hk
					? items.filter((i) => i.storeId === hk.id && isLinen(i.category))
					: []
			}
			atLaundry={
				laundry
					? items.filter((i) => i.storeId === laundry.id && isLinen(i.category))
					: []
			}
			batches={batches}
			all={all}
			hasStore={!!hk}
		/>
	);
}
