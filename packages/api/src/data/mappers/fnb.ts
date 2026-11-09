import type { z } from "zod";
import type {
	CategoryItem,
	HappyHourItem,
	MenuItemItem,
	OrderItem,
	OutletItem,
	OutletSalesItem,
	SalesDay,
	StockItemFull,
	StockLevelItem,
	StockRequestItem,
	StoreItem,
	TableItem,
} from "@hospio/api/api/routes-fnb";
import type {
	CategoryRow,
	HappyHourRow,
	MenuItemRow,
	OptionGroup,
	OrderRow,
	OutletKind,
	OutletRow,
	OutletSalesDayRow,
	OutletSalesRow,
	StockItemRow,
	StockRequestRow,
	StoreRow,
	TableRow,
} from "@hospio/api/data/types";

/** fnb-service and inventory-service responses → the rows the kitchen, bar and manager screens render. */

type Menu = z.infer<typeof MenuItemItem>;
type Order = z.infer<typeof OrderItem>;
type Outlet = z.infer<typeof OutletItem>;
type Table = z.infer<typeof TableItem>;
type Category = z.infer<typeof CategoryItem>;
type HappyHour = z.infer<typeof HappyHourItem>;
type Sales = z.infer<typeof SalesDay>;
type SalesOutlet = z.infer<typeof OutletSalesItem>;
type Item = z.infer<typeof StockItemFull>;
type Level = z.infer<typeof StockLevelItem>;
type Store = z.infer<typeof StoreItem>;
type Request = z.infer<typeof StockRequestItem>;

const num = (v: unknown, d = 0) => {
	const n = typeof v === "string" ? Number(v) : v;
	return typeof n === "number" && Number.isFinite(n) ? n : d;
};

/** JSON text or already-parsed JSON; anything that is not JSON comes back as null. */
function json(raw: unknown): unknown {
	if (typeof raw !== "string") return raw ?? null;
	const t = raw.trim();
	if (!t || (t[0] !== "[" && t[0] !== "{")) return null;
	try {
		return JSON.parse(t);
	} catch {
		return null;
	}
}

/**
 * The choices on a menu item: the contract's JSON `[{group, choices:[{name, priceDelta}], required, multiple}]`,
 * a JSON list of names, or the older comma list ("Grilled, Fried").
 */
export function parseOptionGroups(raw: unknown): OptionGroup[] {
	const parsed = json(raw);
	if (Array.isArray(parsed)) {
		if (parsed.every((p) => typeof p === "string"))
			return parsed.length
				? [
						{
							group: "Choice",
							choices: parsed.map((name) => ({ name, priceDelta: 0 })),
							required: true,
							multiple: false,
						},
					]
				: [];
		return parsed.flatMap((g): OptionGroup[] => {
			if (!g || typeof g !== "object") return [];
			const o = g as Record<string, unknown>;
			const choices = Array.isArray(o.choices)
				? o.choices.flatMap((c) => {
						if (typeof c === "string") return [{ name: c, priceDelta: 0 }];
						if (
							c &&
							typeof c === "object" &&
							typeof (c as { name?: unknown }).name === "string"
						)
							return [
								{
									name: (c as { name: string }).name,
									priceDelta: num((c as { priceDelta?: unknown }).priceDelta),
								},
							];
						return [];
					})
				: [];
			if (!choices.length) return [];
			return [
				{
					group: typeof o.group === "string" && o.group ? o.group : "Choice",
					choices,
					required: o.required === true,
					multiple: o.multiple === true,
				},
			];
		});
	}
	if (typeof raw === "string" && raw.trim() && parsed === null) {
		const names = raw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		return names.length
			? [
					{
						group: "Choice",
						choices: names.map((name) => ({ name, priceDelta: 0 })),
						required: true,
						multiple: false,
					},
				]
			: [];
	}
	return [];
}

/** The JSON text the service stores for a menu item's choices (empty groups mean no choices). */
export function serializeOptionGroups(groups: OptionGroup[]): string | null {
	const clean = groups
		.map((g) => ({ ...g, choices: g.choices.filter((c) => c.name.trim()) }))
		.filter((g) => g.choices.length);
	return clean.length ? JSON.stringify(clean) : null;
}

export function parseRecipe(
	raw: unknown,
): { stockItemId: string; quantity: number }[] {
	const parsed = json(raw);
	if (!Array.isArray(parsed)) return [];
	return parsed.flatMap((r) => {
		if (!r || typeof r !== "object") return [];
		const o = r as Record<string, unknown>;
		const id = o.stockItemId ?? o.itemId;
		return typeof id === "string"
			? [{ stockItemId: id, quantity: num(o.quantity) }]
			: [];
	});
}

export function toMenuItemRow(
	m: Menu,
	outlet?: Pick<OutletRow, "id" | "name">,
): MenuItemRow {
	const groups = parseOptionGroups(m.options);
	const recipe = parseRecipe(m.recipe);
	return {
		id: m.id,
		outletId: m.outletId ?? outlet?.id ?? "",
		outlet: outlet?.name ?? "",
		category: m.category,
		name: m.name,
		price: num(m.price),
		available: m.available !== false,
		active: m.active !== false,
		description: m.description ?? undefined,
		options: groups.length
			? groups.flatMap((g) => g.choices.map((c) => c.name))
			: undefined,
		optionGroups: groups.length ? groups : undefined,
		taxRate: m.taxRate ?? undefined,
		sortOrder: m.sortOrder ?? undefined,
		recipe: recipe.length ? recipe : undefined,
	};
}

const KINDS = new Set(["DINE_IN", "ROOM_SERVICE", "TAB", "TAKEAWAY"]);
const STATUSES = new Set([
	"OPEN",
	"SENT",
	"READY",
	"SERVED",
	"CLOSED",
	"CANCELLED",
]);

/** The text on a line for what the guest chose: names the choices were saved as, or the JSON turned into words. */
export function lineOptionsText(
	raw: string | null | undefined,
): string | undefined {
	if (!raw?.trim()) return undefined;
	const parsed = json(raw);
	if (Array.isArray(parsed)) {
		const names = parsed.flatMap((p) =>
			typeof p === "string"
				? [p]
				: p &&
						typeof p === "object" &&
						typeof (p as { name?: unknown }).name === "string"
					? [(p as { name: string }).name]
					: [],
		);
		return names.length ? names.join(", ") : undefined;
	}
	return raw.trim();
}

export function toOrderRow(o: Order, outletName?: string): OrderRow {
	return {
		id: o.id,
		number: o.number,
		outlet: outletName ?? "",
		outletId: o.outletId,
		kind: (KINDS.has(o.kind) ? o.kind : "DINE_IN") as OrderRow["kind"],
		tableId: o.tableId ?? undefined,
		tableNo: o.tableNo ?? undefined,
		roomId: o.roomId ?? undefined,
		roomNumber: o.roomNumber ?? undefined,
		bookingId: o.bookingId ?? undefined,
		guestName: o.guestName ?? undefined,
		status: (STATUSES.has(o.status) ? o.status : "OPEN") as OrderRow["status"],
		lines: (o.lines ?? []).map((l) => ({
			id: l.id,
			menuItemId: l.menuItemId ?? undefined,
			name: l.name,
			qty: l.quantity,
			price: num(l.unitPrice),
			discount: l.discount ?? undefined,
			options: lineOptionsText(l.options),
			notes: l.notes ?? undefined,
			status: l.status,
		})),
		subtotal: num(o.subtotal),
		tax: num(o.tax),
		discount: o.discount ?? undefined,
		total: num(o.total),
		paid: o.paid === true,
		chargedToRoom: o.chargedToRoom === true,
		paymentId: o.paymentId ?? undefined,
		openedBy: o.openedByName ?? "—",
		openedAt: o.createdAt ?? new Date().toISOString(),
		sentAt: o.sentAt ?? undefined,
		closedAt: o.closedAt ?? undefined,
		closedByName: o.closedByName ?? undefined,
		settledBy: o.settledBy ?? undefined,
		notes: o.notes ?? undefined,
	};
}

export function toTableRow(t: Table, outletId?: string): TableRow {
	return {
		id: t.id,
		outletId: t.outletId ?? outletId ?? "",
		number: t.number,
		seats: t.seats ?? 4,
		active: t.active !== false,
	};
}

export function toOutletRow(o: Outlet, tables: Table[] = []): OutletRow {
	return {
		id: o.id,
		name: o.name,
		kind: (["KITCHEN", "BAR", "RESTAURANT"].includes(o.kind)
			? o.kind
			: "KITCHEN") as OutletKind,
		status: o.status === "CLOSED" ? "CLOSED" : "OPEN",
		storeId: o.storeId ?? undefined,
		tables: tables.map((t) => toTableRow(t, o.id)),
	};
}

export function toCategoryRow(c: Category): CategoryRow {
	return {
		id: c.id,
		name: c.name,
		sortOrder: c.sortOrder ?? 0,
		active: c.active !== false,
	};
}

const hhmm = (t: string) => t.slice(0, 5);
export function toHappyHourRow(h: HappyHour): HappyHourRow {
	return {
		id: h.id,
		name: h.name,
		from: hhmm(h.fromTime),
		to: hhmm(h.toTime),
		days: h.days,
		discountPct: num(h.discountPct),
		active: h.active !== false,
	};
}

const emptyTotals = (): OutletSalesDayRow["totals"] => ({
	orders: 0,
	sales: 0,
	paidAtOutlet: 0,
	chargedToRooms: 0,
	cancelled: 0,
	byMethod: {},
});

export function toSalesOutletRow(o: SalesOutlet): OutletSalesRow {
	return {
		outletId: o.outletId,
		name: o.name,
		kind: o.kind ?? undefined,
		orders: num(o.orders),
		sales: num(o.sales),
		paidAtOutlet: num(o.paidAtOutlet),
		chargedToRooms: num(o.chargedToRooms),
		cancelled: num(o.cancelled),
		byMethod: o.byMethod ?? {},
		topItems: o.topItems ?? [],
	};
}

export function toSalesDay(s: Sales): OutletSalesDayRow {
	const outlets = s.outlets.map(toSalesOutletRow);
	const t = s.totals;
	const sum = (pick: (o: OutletSalesRow) => number) =>
		outlets.reduce((a, o) => a + pick(o), 0);
	const byMethod: Record<string, number> = {};
	for (const o of outlets)
		for (const [k, v] of Object.entries(o.byMethod))
			byMethod[k] = (byMethod[k] ?? 0) + v;
	return {
		date: s.date ?? undefined,
		outlets,
		totals: t
			? {
					orders: num(
						t.orders,
						sum((o) => o.orders),
					),
					sales: num(
						t.sales,
						sum((o) => o.sales),
					),
					paidAtOutlet: num(
						t.paidAtOutlet,
						sum((o) => o.paidAtOutlet),
					),
					chargedToRooms: num(
						t.chargedToRooms,
						sum((o) => o.chargedToRooms),
					),
					cancelled: num(
						t.cancelled,
						sum((o) => o.cancelled),
					),
					byMethod: t.byMethod ?? byMethod,
				}
			: {
					orders: sum((o) => o.orders),
					sales: sum((o) => o.sales),
					paidAtOutlet: sum((o) => o.paidAtOutlet),
					chargedToRooms: sum((o) => o.chargedToRooms),
					cancelled: sum((o) => o.cancelled),
					byMethod,
				},
	};
}

/** finance `/today`'s `outletSales`: the day's sales object, a bare list of outlets, or just a total. */
export function toTodayOutletSales(
	raw: unknown,
): OutletSalesDayRow | undefined {
	if (raw == null) return undefined;
	if (typeof raw === "number")
		return { outlets: [], totals: { ...emptyTotals(), sales: raw } };
	const list = Array.isArray(raw)
		? raw
		: raw &&
				typeof raw === "object" &&
				Array.isArray((raw as { outlets?: unknown }).outlets)
			? (raw as { outlets: unknown[] }).outlets
			: null;
	if (!list) {
		const o = raw as { sales?: unknown; totals?: { sales?: unknown } };
		const total =
			typeof o.sales === "number"
				? o.sales
				: typeof o.totals?.sales === "number"
					? o.totals.sales
					: null;
		return total === null
			? undefined
			: { outlets: [], totals: { ...emptyTotals(), sales: total } };
	}
	const outlets: OutletSalesRow[] = list.flatMap((x) => {
		if (!x || typeof x !== "object") return [];
		const o = x as Record<string, unknown>;
		const bm =
			o.byMethod && typeof o.byMethod === "object"
				? (o.byMethod as Record<string, number>)
				: {};
		return [
			{
				outletId: String(o.outletId ?? o.name ?? ""),
				name: String(o.name ?? "Outlet"),
				kind: typeof o.kind === "string" ? o.kind : undefined,
				orders: num(o.orders),
				sales: num(o.sales),
				paidAtOutlet: num(o.paidAtOutlet),
				chargedToRooms: num(o.chargedToRooms),
				cancelled: num(o.cancelled),
				byMethod: bm,
				topItems: [],
			},
		];
	});
	const totals = emptyTotals();
	for (const o of outlets) {
		totals.orders += o.orders;
		totals.sales += o.sales;
		totals.paidAtOutlet += o.paidAtOutlet;
		totals.chargedToRooms += o.chargedToRooms;
		totals.cancelled += o.cancelled;
	}
	return { outlets, totals };
}

// ---- inventory ---------------------------------------------------------------------------------------

/** One row per item per store it has a level in: what is on that shelf now. */
export function toStockItemRows(
	items: Item[],
	levels: Level[],
	stores: Store[],
): StockItemRow[] {
	const byItem = new Map(items.map((i) => [i.id, i]));
	const byStore = new Map(stores.map((s) => [s.id, s]));
	return levels.flatMap((l) => {
		const it = byItem.get(l.itemId);
		if (!it) return [];
		return [
			{
				id: it.id,
				name: it.name,
				category: it.category ?? "Other",
				unit: it.unit ?? "pcs",
				minLevel: num(it.minLevel),
				quantity: num(l.quantity),
				unitCost: num(it.unitCost),
				storeId: l.storeId,
				storeName: byStore.get(l.storeId)?.name ?? "Store",
				lastMovement: l.updatedAt ?? undefined,
				supplierId: it.supplierId ?? undefined,
				supplierName: it.supplierName ?? undefined,
				parLevel: num(it.parLevel),
				onHand: it.onHand == null ? undefined : num(it.onHand),
			},
		];
	});
}

export function toStoreRows(stores: Store[], rows: StockItemRow[]): StoreRow[] {
	return stores
		.filter((s) => s.active !== false)
		.map((s) => {
			const mine = rows.filter((r) => r.storeId === s.id);
			return {
				id: s.id,
				name: s.name,
				kind: s.kind ?? "General",
				items: mine.length,
				lowItems: mine.filter((r) => r.quantity <= r.minLevel).length,
				keeper: "—",
				value: s.value == null ? undefined : num(s.value),
			};
		});
}

export function toStockRequestRow(r: Request, items: Item[]): StockRequestRow {
	const byItem = new Map(items.map((i) => [i.id, i]));
	const parsed = json(r.lines);
	const lines = Array.isArray(parsed)
		? parsed.flatMap((l) => {
				if (!l || typeof l !== "object") return [];
				const o = l as Record<string, unknown>;
				const it =
					typeof o.itemId === "string" ? byItem.get(o.itemId) : undefined;
				return [
					{
						name: String(o.name ?? it?.name ?? "Item"),
						quantity: num(o.quantity),
						unit: typeof o.unit === "string" ? o.unit : (it?.unit ?? "pcs"),
						itemId: typeof o.itemId === "string" ? o.itemId : undefined,
						issued: num(o.issued),
					},
				];
			})
		: [];
	const status = [
		"REQUESTED",
		"ISSUED",
		"PART_ISSUED",
		"DECLINED",
		"CLOSED",
	].includes(r.status)
		? r.status
		: "REQUESTED";
	return {
		id: r.id,
		fromTeam: r.fromTeam,
		requestedBy: r.requestedByName ?? r.requestedBy ?? "—",
		lines,
		note: r.note ?? undefined,
		status: status as StockRequestRow["status"],
		createdAt: r.createdAt ?? new Date().toISOString(),
		storeId: r.storeId ?? undefined,
		storeName: r.storeName ?? undefined,
		issuedBy: r.issuedByName ?? undefined,
		issuedAt: r.issuedAt ?? undefined,
		reason: r.reason ?? undefined,
	};
}
