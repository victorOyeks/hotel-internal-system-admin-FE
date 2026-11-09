import { data } from "@hospio/api/data";
import { StoreScreen } from "./store-screen";

/**
 * Ask the store for Housekeeping, Laundry and Maintenance (docs/laundry-maintenance.md): the team's own store (the
 * hotel's store of that kind), its requests with the store's answer, and anything the main store holds to ask for.
 * Issued stock arrives in the team's store by itself (the store moves it in when it issues).
 */
export async function TeamStorePage({
	team,
	title,
	subtitle,
}: {
	team: "HOUSEKEEPING" | "LAUNDRY" | "MAINTENANCE";
	title: string;
	subtitle: string;
}) {
	const [stores, items, requests] = await Promise.all([
		data.inventory.stores(),
		data.inventory.items(),
		data.inventory.requests(),
	]);
	const store = stores.find((s) => s.kind === team);
	const main = stores.filter((s) => s.kind === "MAIN").map((s) => s.id);
	return (
		<StoreScreen
			items={store ? items.filter((i) => i.storeId === store.id) : []}
			catalogue={items.filter((i) => main.includes(i.storeId))}
			requests={requests}
			team={team}
			storeId={store?.id}
			title={title}
			subtitle={subtitle}
		/>
	);
}
