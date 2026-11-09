import { redirect } from "next/navigation";
import { getActiveHotel, getActiveRole, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { CountsScreen } from "./counts";
import { DeliveriesScreen } from "./deliveries";
import {
	InventoryProvider,
	type InvPerms,
	type InvScreen,
	InventoryTabs,
} from "./nav";
import { OrdersScreen } from "./orders";
import { RequestsScreen } from "./requests";
import { StockScreen } from "./stock";
import { SuppliersScreen } from "./suppliers";

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const SCREENS: InvScreen[] = [
	"stock",
	"requests",
	"orders",
	"deliveries",
	"counts",
	"suppliers",
];

/**
 * Every inventory screen, for the INVENTORY role (one route each, mode "role") and for managers and
 * owners (one Inventory page with tabs, mode "tabs"). Loads only what the shown screen needs.
 */
export async function InventoryPage({
	screen: fixed,
	searchParams,
	mode,
}: {
	screen?: InvScreen;
	searchParams: Promise<Search>;
	mode: "role" | "tabs";
}) {
	const [user, role, hotel, sp] = await Promise.all([
		getUser(),
		getActiveRole(),
		getActiveHotel(),
		searchParams,
	]);
	if (!user) redirect("/auth");
	const asked = one(sp.screen) as InvScreen | undefined;
	const screen: InvScreen =
		fixed ?? (asked && SCREENS.includes(asked) ? asked : "stock");
	const levels = user.roleLevels.filter(
		(r) => !r.hotelId || r.hotelId === hotel?.id,
	);
	const level = (r: string) =>
		levels.find((l) => l.role === r)?.level ??
		(user.roles.includes(r) ? "EDIT" : null);
	const isManager = role === "MANAGER" || role === "OWNER";
	const inv = level("INVENTORY");
	const perms: InvPerms = {
		manager: isManager,
		store: isManager || inv === "EDIT" || inv === "FULL",
		full: isManager || inv === "FULL",
	};

	let body: React.ReactNode;
	if (screen === "stock") {
		const from = one(sp.from);
		const to = one(sp.to);
		const [stores, items, orders, value, usage] = await Promise.all([
			data.inventory.stores(),
			data.inventory.items(),
			data.inventory.purchaseOrders(),
			data.inventory.value(),
			data.inventory.usage(from, to),
		]);
		const suppliers = perms.store ? await data.inventory.suppliers() : [];
		body = (
			<StockScreen
				stores={stores}
				items={items}
				orders={orders}
				suppliers={suppliers}
				value={value}
				usage={usage}
				hotelName={hotel?.name ?? "Hotel"}
			/>
		);
	} else if (screen === "requests") {
		const [requests, items, stores] = await Promise.all([
			data.inventory.requests(),
			data.inventory.items(),
			data.inventory.stores(),
		]);
		body = <RequestsScreen requests={requests} items={items} stores={stores} />;
	} else if (screen === "orders") {
		const [orders, items, suppliers, stores, deliveries] = await Promise.all([
			data.inventory.purchaseOrders(),
			data.inventory.items(),
			data.inventory.suppliers(),
			data.inventory.stores(),
			data.inventory.deliveries(),
		]);
		body = (
			<OrdersScreen
				orders={orders}
				items={items}
				suppliers={suppliers}
				stores={stores}
				deliveries={deliveries}
			/>
		);
	} else if (screen === "deliveries") {
		const [deliveries, orders, items, stores, suppliers] = await Promise.all([
			data.inventory.deliveries(),
			data.inventory.purchaseOrders(),
			data.inventory.items(),
			data.inventory.stores(),
			data.inventory.suppliers(),
		]);
		body = (
			<DeliveriesScreen
				deliveries={deliveries}
				orders={orders}
				items={items}
				stores={stores}
				suppliers={suppliers}
			/>
		);
	} else if (screen === "counts") {
		const [counts, stores, items] = await Promise.all([
			data.inventory.counts(),
			data.inventory.stores(),
			data.inventory.items(),
		]);
		body = <CountsScreen counts={counts} stores={stores} items={items} />;
	} else {
		const [suppliers, items, orders] = await Promise.all([
			data.inventory.suppliers(),
			data.inventory.items(),
			data.inventory.purchaseOrders(),
		]);
		body = (
			<SuppliersScreen suppliers={suppliers} items={items} orders={orders} />
		);
	}

	return (
		<InventoryProvider mode={mode} perms={perms}>
			{mode === "tabs" && <InventoryTabs active={screen} />}
			{body}
		</InventoryProvider>
	);
}
