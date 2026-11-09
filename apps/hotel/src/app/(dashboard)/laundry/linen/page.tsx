import { LaundryLinenScreen } from "@/components/roles/laundry/linen";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Laundry · Linen in & out: batches from housekeeping, condemned linen, chemicals used. */
export default async function LaundryLinenPage() {
	const [batches, stores, items, user] = await Promise.all([
		data.laundry.batches("all"),
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
			storeItems={store ? items.filter((i) => i.storeId === store.id) : []}
			storeId={store?.id}
			canClose={full}
		/>
	);
}
