"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	ArrowRightLeftIcon,
	ClipboardCheckIcon,
	PackageIcon,
	PencilIcon,
	PlusIcon,
	ShoppingCartIcon,
	StoreIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, Timeline } from "@hospio/ui/shared/detail-list";
import {
	FieldRow,
	MoneyField,
	SelectField,
	TextareaField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import {
	fmtDay,
	fmtWhen,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn, input } from "@hospio/ui/shared/ui";
import {
	adjustLevel,
	loadItemDetail,
	saveItem,
	saveStore,
	transferStock,
} from "@hospio/api/actions/inventory";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	PurchaseOrderRow,
	StockItemDetail,
	StockItemRow,
	StockUsage,
	StockValue,
	StoreRow,
	SupplierRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { useInvHref, useInvPerms } from "./nav";

export function stockStatus(i: StockItemRow, onOrder: boolean) {
	if (i.quantity <= 0) return { label: "Out", tone: "danger" as const };
	if (onOrder && i.quantity <= i.minLevel)
		return { label: "Ordered", tone: "info" as const };
	if (i.quantity <= i.minLevel * 0.5)
		return { label: "Low", tone: "danger" as const };
	if (i.quantity <= i.minLevel)
		return { label: "Near minimum", tone: "warning" as const };
	return { label: "OK", tone: "success" as const };
}

export const KIND_LABEL: Record<string, string> = {
	MAIN: "Main",
	KITCHEN: "Kitchen",
	BAR: "Bar",
	HOUSEKEEPING: "Housekeeping",
	LAUNDRY: "Laundry",
	MAINTENANCE: "Maintenance",
	OTHER: "Other",
};
const MOVE_LABEL: Record<string, string> = {
	RECEIVED: "Received",
	ISSUED: "Issued",
	TRANSFER_OUT: "Moved out",
	TRANSFER_IN: "Moved in",
	USED: "Used",
	WASTE: "Wasted",
	ADJUSTED: "Corrected",
	COUNTED: "Counted",
};
const UNITS = [
	"pcs",
	"kg",
	"litres",
	"bottles",
	"cartons",
	"packs",
	"tots",
	"rolls",
];
const CATEGORIES = [
	"Dry goods",
	"Produce",
	"Meat",
	"Fish",
	"Dairy",
	"Beer",
	"Spirits",
	"Wine",
	"Soft drinks",
	"Housekeeping",
	"Linen",
	"Cleaning",
	"Maintenance",
	"Office",
];
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
const q = (n: number) => Number(n.toFixed(2)).toLocaleString("en-NG");

/** Inventory 1.x · Stores & stock: value, low stock with reorder, stores, items with their panel, add/edit item, correct level, move stock, usage. */
export function StockScreen({
	stores,
	items,
	orders,
	suppliers,
	value,
	usage,
	hotelName,
}: {
	stores: StoreRow[];
	items: StockItemRow[];
	orders: PurchaseOrderRow[];
	suppliers: SupplierRow[];
	value: StockValue | null;
	usage: StockUsage | null;
	hotelName: string;
}) {
	const perms = useInvPerms();
	const href = useInvHref();
	const [openId, setOpenId] = useQueryState("open");
	const [at, setAt] = useQueryState("at");
	const [isNew, setIsNew] = useQueryState("new");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [store, setStore] = useState("");
	const [editing, setEditing] = useState<StockItemDetail | null>(null);
	const [correcting, setCorrecting] = useState(false);
	const [moving, setMoving] = useState(false);
	const [storeEdit, setStoreEdit] = useState<StoreRow | "new" | null>(null);
	const [detail, setDetail] = useState<StockItemDetail | null>(null);
	const active = tab ?? "all";
	const onOrderIds = new Set(
		orders
			.filter((o) => ["SENT", "PARTIAL", "PENDING_APPROVAL"].includes(o.status))
			.flatMap((o) => o.lines.map((l) => l.itemId ?? l.name)),
	);
	const isOnOrder = (i: StockItemRow) =>
		onOrderIds.has(i.id) || onOrderIds.has(i.name);
	const low = items.filter((i) => i.quantity <= i.minLevel);
	const lists: Record<string, StockItemRow[]> = {
		all: items,
		low,
		ordered: items.filter(isOnOrder),
	};
	const shown = (lists[active] ?? items).filter(
		(i) => !store || i.storeId === store,
	);
	const row =
		items.find((i) => i.id === openId && (!at || i.storeId === at)) ??
		items.find((i) => i.id === openId) ??
		null;
	const total =
		value?.total ?? items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
	const itemCount = new Set(items.map((i) => i.id)).size;

	// The item panel reads the item across every store with its movements.
	useEffect(() => {
		setDetail(null);
		if (!openId) return;
		let live = true;
		void loadItemDetail(openId).then((r) => {
			if (live && r.ok) setDetail(r.data);
		});
		return () => {
			live = false;
		};
	}, [openId]);

	const columns = useMemo<ColumnDef<StockItemRow, unknown>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Item",
				cell: ({ row }) => (
					<TwoLine
						primary={row.original.name}
						secondary={`${row.original.category}${row.original.supplierName ? ` · ${row.original.supplierName}` : ""}`}
					/>
				),
			},
			{
				accessorKey: "storeName",
				header: "Store",
				cell: ({ row }) => (
					<span className="text-ink-2">{row.original.storeName}</span>
				),
			},
			{
				accessorKey: "quantity",
				header: "In stock",
				cell: ({ row }) => {
					const i = row.original;
					const s = stockStatus(i, isOnOrder(i));
					return (
						<div className="w-36">
							<ProgressBar
								value={i.quantity}
								max={Math.max(i.minLevel * 2, 1)}
								tone={
									s.tone === "success"
										? "brand"
										: s.tone === "info"
											? "info"
											: s.tone
								}
							/>
							<p className="mt-1 text-[11px] text-ink-2">
								{q(i.quantity)} {i.unit} · min {q(i.minLevel)}
							</p>
						</div>
					);
				},
			},
			{
				accessorKey: "unitCost",
				header: "Unit cost",
				cell: ({ row }) => naira(row.original.unitCost),
			},
			{
				id: "value",
				header: "Value",
				accessorFn: (i) => i.quantity * i.unitCost,
				cell: ({ row }) => (
					<span className="font-semibold">
						{naira(row.original.quantity * row.original.unitCost)}
					</span>
				),
			},
			{
				id: "status",
				header: "Status",
				enableSorting: false,
				cell: ({ row }) => {
					const s = stockStatus(row.original, isOnOrder(row.original));
					return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
				},
			},
			{
				id: "act",
				header: "",
				enableSorting: false,
				cell: ({ row }) => {
					const s = stockStatus(row.original, isOnOrder(row.original));
					return (
						<div className="flex justify-end">
							{perms.store && (s.tone === "danger" || s.tone === "warning") ? (
								<Link
									href={href("orders", { new: 1, item: row.original.id })}
									className={`${btn.primary} ${btn.small}`}
									onClick={(e) => e.stopPropagation()}
								>
									Reorder
								</Link>
							) : (
								<button
									type="button"
									className={`${btn.secondary} ${btn.small}`}
									onClick={(e) => {
										e.stopPropagation();
										void setAt(row.original.storeId);
										void setOpenId(row.original.id);
									}}
								>
									View
								</button>
							)}
						</div>
					);
				},
			},
		],
		[orders, perms.store, href, setAt, setOpenId],
	);

	return (
		<>
			<PageHeader
				title="Inventory"
				subtitle={`${hotelName} · ${plural(stores.length, "store")} · ${plural(itemCount, "item")} tracked`}
			>
				{perms.store && (
					<>
						<Link href={href("counts", { new: 1 })} className={btn.secondary}>
							<ClipboardCheckIcon className="mr-1 inline size-4" /> Stock count
						</Link>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setMoving(true)}
						>
							<ArrowRightLeftIcon className="mr-1 inline size-4" /> Move stock
						</button>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => void setIsNew("1")}
						>
							Add item
						</button>
						<Link href={href("orders", { new: 1 })} className={btn.primary}>
							<ShoppingCartIcon className="mr-1 inline size-4" /> Order stock
						</Link>
					</>
				)}
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Items tracked"
					value={itemCount}
					icon={PackageIcon}
					hint={`In ${plural(stores.length, "store")}`}
				/>
				<KpiCard
					label="Running low"
					value={value?.low.length ?? low.length}
					icon={AlertTriangleIcon}
					hint="At or below their minimum"
					pill={
						low.length ? (
							<StatusPill tone="danger">reorder</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label="On order"
					value={nairaShort(value?.onOrder ?? 0)}
					icon={TruckIcon}
					hint={`${plural(orders.filter((o) => o.status === "SENT" || o.status === "PARTIAL").length, "order")} still to arrive`}
				/>
				<KpiCard
					label="Stock value"
					value={nairaShort(total)}
					icon={PackageIcon}
					hint="At average cost"
				/>
			</div>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{stores.map((s) => (
					<div
						key={s.id}
						className={cn(
							"relative flex flex-col gap-1 rounded-card border bg-card p-4 text-left hover:shadow-md",
							store === s.id ? "border-brand" : "border-line",
						)}
					>
						<button
							type="button"
							className="absolute inset-0"
							aria-label={`Show ${s.name}`}
							onClick={() => setStore(store === s.id ? "" : s.id)}
						/>
						<span className="flex items-center gap-2 text-sm font-bold text-ink">
							{s.name}
							{perms.store && (
								<button
									type="button"
									className="relative z-10 ml-auto text-ink-3 hover:text-ink"
									aria-label={`Edit ${s.name}`}
									onClick={() => setStoreEdit(s)}
								>
									<PencilIcon className="size-3.5" />
								</button>
							)}
						</span>
						<span className="text-xs text-ink-3">
							{KIND_LABEL[s.kind] ?? s.kind} store
							{s.value !== undefined ? ` · ${naira(s.value)}` : ""}
						</span>
						<span className="mt-1 flex items-center gap-2 text-xs">
							<span className="text-ink-2">{plural(s.items, "item")}</span>
							{s.lowItems > 0 && (
								<StatusPill tone="danger">{s.lowItems} low</StatusPill>
							)}
						</span>
					</div>
				))}
				{perms.store && (
					<button
						type="button"
						onClick={() => setStoreEdit("new")}
						className="flex flex-col items-center justify-center gap-1 rounded-card border border-dashed border-line p-4 text-sm text-ink-2 hover:border-brand hover:text-brand"
					>
						<StoreIcon className="size-4" /> Add a store
					</button>
				)}
			</div>
			{value && value.low.length > 0 && (
				<SectionCard
					title={`Running low · ${plural(value.low.length, "item")}`}
					flush
				>
					<table className="w-full text-left text-[13px]">
						<thead>
							<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
								<th className="px-5 py-2">Item</th>
								<th className="py-2">Store</th>
								<th className="py-2 text-right">Left</th>
								<th className="py-2 text-right">Minimum</th>
								<th className="py-2 text-right">Suggest</th>
								<th className="py-2">Supplier</th>
								<th className="px-5 py-2" />
							</tr>
						</thead>
						<tbody>
							{value.low.slice(0, 8).map((l) => (
								<tr
									key={`${l.itemId}-${l.storeId}`}
									className="border-b border-line last:border-b-0"
								>
									<td className="px-5 py-2 font-medium text-ink">{l.name}</td>
									<td className="py-2 text-ink-2">{l.storeName}</td>
									<td className="py-2 text-right text-danger">
										{q(l.quantity)} {l.unit}
									</td>
									<td className="py-2 text-right text-ink-2">
										{q(l.minLevel)}
									</td>
									<td className="py-2 text-right">
										{q(l.suggest)} {l.unit}
									</td>
									<td className="py-2 text-ink-2">{l.supplierName ?? "—"}</td>
									<td className="px-5 py-2 text-right">
										{perms.store && (
											<Link
												href={href("orders", {
													new: 1,
													item: l.itemId,
													qty: l.suggest,
												})}
												className={`${btn.primary} ${btn.small}`}
											>
												Reorder
											</Link>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</SectionCard>
			)}
			<Toolbar
				left={
					<PillTabs
						value={active}
						onChange={(k) => void setTab(k === "all" ? null : k)}
						tabs={[
							{ key: "all", label: "All items", count: items.length },
							{ key: "low", label: "Running low", count: low.length },
							{
								key: "ordered",
								label: "On order",
								count: lists.ordered.length,
							},
						]}
					/>
				}
				right={
					<>
						<FilterSelect
							value={store}
							onChange={setStore}
							options={stores.map((s) => ({ value: s.id, label: s.name }))}
							all="All stores"
						/>
						<SearchBox
							value={search}
							onChange={setSearch}
							placeholder="Item, category, supplier…"
						/>
					</>
				}
			/>
			<DataTable
				columns={columns}
				data={shown}
				search={search}
				onRowClick={(i) => {
					void setAt(i.storeId);
					void setOpenId(i.id);
				}}
			/>
			<UsageCard usage={usage} />

			<SidePanel
				open={!!row}
				onOpenChange={(o) => {
					if (!o) {
						void setOpenId(null);
						void setAt(null);
					}
				}}
				title={row?.name ?? ""}
				subtitle={
					row
						? `${row.category} · ${row.supplierName ?? "no usual supplier"}`
						: undefined
				}
				icon={PackageIcon}
				width="lg"
				footer={
					row &&
					perms.store && (
						<>
							<button
								type="button"
								className={btn.secondary}
								disabled={!detail}
								onClick={() => setEditing(detail)}
							>
								Edit item
							</button>
							{perms.full && (
								<button
									type="button"
									className={btn.secondary}
									onClick={() => setCorrecting(true)}
								>
									Correct level
								</button>
							)}
							<Link
								href={href("orders", { new: 1, item: row.id })}
								className={btn.primary}
							>
								Order more
							</Link>
						</>
					)
				}
				footerInfo={
					row &&
					(() => {
						const s = stockStatus(row, isOnOrder(row));
						return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
					})()
				}
			>
				{row && (
					<div className="flex flex-col gap-6">
						<div className="rounded-xl border border-line px-4 py-3">
							<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
								In {row.storeName}
							</p>
							<p className="text-2xl font-bold text-ink">
								{q(row.quantity)}{" "}
								<span className="text-base font-medium text-ink-2">
									{row.unit}
								</span>
							</p>
							<ProgressBar
								value={row.quantity}
								max={Math.max(row.minLevel * 2, 1)}
								className="mt-2"
								tone={row.quantity <= row.minLevel ? "danger" : "brand"}
							/>
							<p className="mt-1 text-xs text-ink-3">
								Minimum {q(row.minLevel)} {row.unit} · worth{" "}
								{naira(row.quantity * row.unitCost)}
							</p>
						</div>
						{row.quantity <= row.minLevel && (
							<Note tone="warning">
								At or below minimum.{" "}
								{isOnOrder(row)
									? "An order is already on the way."
									: "Reorder before it runs out."}
							</Note>
						)}
						{!detail && (
							<p className="text-[13px] text-ink-3">
								Loading stores and movements…
							</p>
						)}
						{detail && (
							<>
								<PanelSection
									title={`In every store · ${q(detail.onHand)} ${detail.unit}`}
								>
									<ul className="divide-y divide-line text-[13px]">
										{detail.levels.map((l) => (
											<li key={l.storeId} className="flex justify-between py-2">
												<span className="text-ink">{l.storeName}</span>
												<span className="text-ink-2">
													{q(l.quantity)} {detail.unit}
													{l.value !== undefined ? ` · ${naira(l.value)}` : ""}
												</span>
											</li>
										))}
									</ul>
								</PanelSection>
								<PanelSection title="Details">
									<DetailList
										columns={2}
										items={[
											{ label: "Average cost", value: naira(detail.unitCost) },
											{
												label: "Usual supplier",
												value: detail.supplierName ?? "—",
											},
											{
												label: "Minimum",
												value: `${q(detail.minLevel)} ${detail.unit}`,
											},
											{
												label: "Reorder up to",
												value: detail.parLevel
													? `${q(detail.parLevel)} ${detail.unit}`
													: "Twice the minimum",
											},
										]}
									/>
								</PanelSection>
								<PanelSection title="Movements">
									{detail.movements.length === 0 ? (
										<p className="text-[13px] text-ink-3">
											Nothing has moved yet.
										</p>
									) : (
										<Timeline
											items={detail.movements.slice(0, 15).map((m) => ({
												at: fmtWhen(m.at),
												by: m.by,
												text: `${MOVE_LABEL[m.kind] ?? m.kind} ${q(Math.abs(m.quantity))} ${m.unit} · ${m.storeName}${m.note ? ` · ${m.note}` : ""}${m.value !== undefined ? ` (${naira(Math.abs(m.value))})` : ""}`,
											}))}
										/>
									)}
								</PanelSection>
							</>
						)}
					</div>
				)}
			</SidePanel>

			{row && (
				<CorrectModal
					open={correcting}
					onOpenChange={setCorrecting}
					row={row}
					stores={stores}
					detail={detail}
					onDone={() => {
						setCorrecting(false);
						void loadItemDetail(row.id).then((r) => r.ok && setDetail(r.data));
					}}
				/>
			)}
			<ItemPanel
				open={isNew === "1" || !!editing}
				item={editing}
				onOpenChange={(o) => {
					if (!o) {
						void setIsNew(null);
						setEditing(null);
					}
				}}
				stores={stores}
				suppliers={suppliers}
				onSaved={(id, created) => {
					void setIsNew(null);
					setEditing(null);
					if (created) {
						void setAt(null);
						void setOpenId(id);
					} else void loadItemDetail(id).then((r) => r.ok && setDetail(r.data));
				}}
			/>
			<MoveModal
				open={moving}
				onOpenChange={setMoving}
				stores={stores}
				items={items}
			/>
			<StoreModal
				store={storeEdit}
				onOpenChange={(o) => !o && setStoreEdit(null)}
			/>
		</>
	);
}

function CorrectModal({
	open,
	onOpenChange,
	row,
	stores,
	detail,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	row: StockItemRow;
	stores: StoreRow[];
	detail: StockItemDetail | null;
	onDone: () => void;
}) {
	const [storeId, setStoreId] = useState(row.storeId);
	const [newQty, setNewQty] = useState("");
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setStoreId(row.storeId);
			setNewQty("");
			setReason("");
		}
	}, [open, row.storeId]);
	const current =
		detail?.levels.find((l) => l.storeId === storeId)?.quantity ??
		(storeId === row.storeId ? row.quantity : 0);
	const diff = newQty === "" ? 0 : Number(newQty) - current;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Correct the level"
			subtitle={`${row.name} · the system says ${q(current)} ${row.unit}`}
			icon={PackageIcon}
			size="confirm"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={newQty === "" || !reason.trim() || pending}
						onClick={() =>
							void run(
								() =>
									adjustLevel({
										itemId: row.id,
										storeId,
										quantity: Number(newQty),
										reason: reason.trim(),
									}),
								`Level set to ${newQty} ${row.unit} · logged`,
								onDone,
							)
						}
					>
						Save correction
					</button>
				</>
			}
			footerInfo="Corrections are logged with your name and reason"
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Store"
					value={storeId}
					onChange={setStoreId}
					options={stores.map((s) => ({ value: s.id, label: s.name }))}
				/>
				<TextField
					label={`Actual quantity (${row.unit})`}
					type="number"
					value={newQty}
					onChange={setNewQty}
				/>
				<SelectField
					label="Reason"
					value={reason}
					onChange={setReason}
					options={[
						"Miscount",
						"Breakage",
						"Expired",
						"Theft / missing",
						"Found extra",
						"Other",
					]}
				/>
				{newQty !== "" && diff !== 0 && (
					<Note tone={diff < 0 ? "danger" : "info"}>
						{diff < 0
							? `${q(-diff)} ${row.unit} written off · ${naira(-diff * row.unitCost)}`
							: `${q(diff)} ${row.unit} added · ${naira(diff * row.unitCost)}`}
					</Note>
				)}
			</div>
		</Modal>
	);
}

function ItemPanel({
	open,
	item,
	onOpenChange,
	stores,
	suppliers,
	onSaved,
}: {
	open: boolean;
	item: StockItemDetail | null;
	onOpenChange: (o: boolean) => void;
	stores: StoreRow[];
	suppliers: SupplierRow[];
	onSaved: (id: string, created: boolean) => void;
}) {
	const [f, setF] = useState({
		name: "",
		category: "",
		unit: "pcs",
		min: "",
		par: "",
		qty: "",
		note: "",
		supplier: "",
		storeId: "",
		active: true,
	});
	const [cost, setCost] = useState<number | "">("");
	const { run, pending } = useAction();
	const main = stores.find((s) => s.kind === "MAIN") ?? stores[0];
	useEffect(() => {
		if (!open) return;
		if (item) {
			setF({
				name: item.name,
				category: item.category,
				unit: item.unit,
				min: String(item.minLevel),
				par: item.parLevel ? String(item.parLevel) : "",
				qty: "",
				note: "",
				supplier: item.supplierId ?? "",
				storeId: "",
				active: true,
			});
			setCost(item.unitCost);
		} else {
			setF({
				name: "",
				category: "",
				unit: "pcs",
				min: "",
				par: "",
				qty: "",
				note: "",
				supplier: "",
				storeId: main?.id ?? "",
				active: true,
			});
			setCost("");
		}
	}, [open, item, main?.id]);
	const set = (k: keyof typeof f) => (v: string) =>
		setF((x) => ({ ...x, [k]: v }));
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={item ? `Edit ${item.name}` : "Add an item"}
			subtitle={
				item ? "Changes apply in every store" : "Something new to track"
			}
			icon={item ? PencilIcon : PlusIcon}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!f.name.trim() || pending}
						onClick={() =>
							void run(
								() =>
									saveItem({
										id: item?.id,
										name: f.name,
										category: f.category,
										unit: f.unit,
										minLevel: num(f.min),
										parLevel: num(f.par),
										unitCost: cost === "" ? undefined : cost,
										supplierId: f.supplier,
										active: item ? f.active : undefined,
										storeId: item ? undefined : f.storeId || undefined,
										openingQuantity: item ? undefined : num(f.qty),
									}),
								item
									? f.active
										? `${f.name} saved`
										: `${f.name} is no longer stocked`
									: `${f.name} added`,
								(r) => onSaved(r.id, !item),
							)
						}
					>
						{item ? "Save" : "Add item"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Name"
					value={f.name}
					onChange={set("name")}
					required
					placeholder="e.g. Hand towel · white"
				/>
				<FieldRow>
					<SelectField
						label="Category"
						value={f.category}
						onChange={set("category")}
						options={Array.from(
							new Set([...CATEGORIES, ...(f.category ? [f.category] : [])]),
						)}
					/>
					<SelectField
						label="Unit"
						value={f.unit}
						onChange={set("unit")}
						options={Array.from(new Set([...UNITS, f.unit]))}
					/>
				</FieldRow>
				{!item && (
					<FieldRow>
						<SelectField
							label="Store"
							value={f.storeId}
							onChange={set("storeId")}
							options={stores.map((s) => ({ value: s.id, label: s.name }))}
						/>
						<TextField
							label="Opening quantity"
							type="number"
							value={f.qty}
							onChange={set("qty")}
						/>
					</FieldRow>
				)}
				<FieldRow>
					<TextField
						label="Minimum (reorder level)"
						type="number"
						value={f.min}
						onChange={set("min")}
						hint="Low at or below this"
					/>
					<TextField
						label="Reorder up to"
						type="number"
						value={f.par}
						onChange={set("par")}
						hint="Blank = twice the minimum"
					/>
				</FieldRow>
				<FieldRow>
					<MoneyField
						label={item ? "Average cost" : "Unit cost"}
						value={cost}
						onChange={setCost}
						hint={item ? "Deliveries re-average it" : undefined}
					/>
					<SelectField
						label="Usual supplier"
						value={f.supplier}
						onChange={set("supplier")}
						options={[
							{ value: "", label: "None" },
							...suppliers
								.filter((s) => s.active !== false)
								.map((s) => ({ value: s.id, label: s.name })),
						]}
					/>
				</FieldRow>
				{item && (
					<ToggleField
						label="Still stocked"
						hint="Turn off to stop tracking it (only once no store holds any)"
						checked={f.active}
						onChange={(v) => setF((x) => ({ ...x, active: v }))}
					/>
				)}
			</div>
		</SidePanel>
	);
}

function MoveModal({
	open,
	onOpenChange,
	stores,
	items,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	stores: StoreRow[];
	items: StockItemRow[];
}) {
	const main = stores.find((s) => s.kind === "MAIN") ?? stores[0];
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [lines, setLines] = useState<{ itemId: string; quantity: string }[]>(
		[],
	);
	const [pick, setPick] = useState("");
	const [note, setNote] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setFrom(main?.id ?? "");
			setTo("");
			setLines([]);
			setNote("");
		}
	}, [open, main?.id]);
	const held = items.filter((i) => i.storeId === from && i.quantity > 0);
	const ready =
		from &&
		to &&
		from !== to &&
		lines.length > 0 &&
		lines.every((l) => Number(l.quantity) > 0);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Move stock between stores"
			subtitle="Both stores' levels change at once and the move is logged"
			icon={ArrowRightLeftIcon}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!ready || pending}
						onClick={() =>
							void run(
								() =>
									transferStock({
										fromStoreId: from,
										toStoreId: to,
										lines: lines.map((l) => ({
											itemId: l.itemId,
											quantity: Number(l.quantity),
										})),
										note,
									}),
								(t) => `Moved to ${t.toStore ?? "the store"} · ${t.reference}`,
								() => onOpenChange(false),
							)
						}
					>
						Move stock
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<SelectField
						label="From"
						value={from}
						onChange={(v) => {
							setFrom(v);
							setLines([]);
						}}
						options={stores.map((s) => ({ value: s.id, label: s.name }))}
					/>
					<SelectField
						label="To"
						value={to}
						onChange={setTo}
						options={stores
							.filter((s) => s.id !== from)
							.map((s) => ({ value: s.id, label: s.name }))}
					/>
				</FieldRow>
				{lines.map((l, idx) => {
					const i = held.find((x) => x.id === l.itemId);
					return (
						<div
							key={l.itemId}
							className="flex items-center gap-2 rounded-control border border-line px-3 py-2"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-medium text-ink">
									{i?.name}
								</p>
								<p className="text-xs text-ink-3">
									{q(i?.quantity ?? 0)} {i?.unit} in the store
								</p>
							</div>
							<input
								type="number"
								min={0}
								aria-label={`Quantity of ${i?.name}`}
								value={l.quantity}
								onChange={(e) =>
									setLines((ls) =>
										ls.map((x, k) =>
											k === idx ? { ...x, quantity: e.target.value } : x,
										),
									)
								}
								className={cn(
									input,
									"w-24 py-1 text-right",
									Number(l.quantity) > (i?.quantity ?? 0) && "border-danger",
								)}
							/>
							<button
								type="button"
								className="text-xs text-ink-3 hover:text-danger"
								onClick={() => setLines((ls) => ls.filter((_, k) => k !== idx))}
							>
								Remove
							</button>
						</div>
					);
				})}
				<SelectField
					label="Add an item"
					value={pick}
					onChange={(v) => {
						if (v) setLines((ls) => [...ls, { itemId: v, quantity: "" }]);
						setPick("");
					}}
					options={held
						.filter((i) => !lines.some((l) => l.itemId === i.id))
						.map((i) => ({
							value: i.id,
							label: i.name,
							hint: `${q(i.quantity)} ${i.unit}`,
						}))}
					placeholder={
						from ? "Items held in this store…" : "Pick the store first"
					}
				/>
				<TextareaField
					label="Note"
					value={note}
					onChange={setNote}
					rows={2}
					placeholder="Why it moved (optional)"
				/>
			</div>
		</Modal>
	);
}

function StoreModal({
	store,
	onOpenChange,
}: {
	store: StoreRow | "new" | null;
	onOpenChange: (o: boolean) => void;
}) {
	const existing = store && store !== "new" ? store : null;
	const [name, setName] = useState("");
	const [kind, setKind] = useState("MAIN");
	const [activeStore, setActiveStore] = useState(true);
	const { run, pending } = useAction();
	useEffect(() => {
		if (store) {
			setName(existing?.name ?? "");
			setKind(existing?.kind ?? "OTHER");
			setActiveStore(true);
		}
	}, [store, existing?.name, existing?.kind]);
	return (
		<Modal
			open={!!store}
			onOpenChange={onOpenChange}
			title={existing ? `Edit ${existing.name}` : "Add a store"}
			subtitle="A store holds stock: the main store or an outlet's shelf"
			icon={StoreIcon}
			size="confirm"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!name.trim() || pending}
						onClick={() =>
							void run(
								() =>
									saveStore({
										id: existing?.id,
										name,
										kind,
										active: existing ? activeStore : undefined,
									}),
								existing
									? activeStore
										? "Store saved"
										: `${existing.name} closed`
									: `${name.trim()} added`,
								() => onOpenChange(false),
							)
						}
					>
						{existing ? "Save" : "Add store"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Name"
					value={name}
					onChange={setName}
					required
					placeholder="e.g. Housekeeping store"
				/>
				<SelectField
					label="Kind"
					value={kind}
					onChange={setKind}
					options={Object.entries(KIND_LABEL).map(([value, label]) => ({
						value,
						label,
					}))}
					hint="A Kitchen, Bar, Housekeeping, Laundry or Maintenance store belongs to that team"
				/>
				{existing && (
					<ToggleField
						label="In use"
						hint="Close a store only once it holds no stock"
						checked={activeStore}
						onChange={setActiveStore}
					/>
				)}
			</div>
		</Modal>
	);
}

/** Stock received, moved, used and wasted at cost for a date range: per store, and issued per team. */
function UsageCard({ usage }: { usage: StockUsage | null }) {
	const router = useRouter();
	const path = usePathname();
	const sp = useSearchParams();
	const [from, setFrom] = useState(usage?.from ?? "");
	const [to, setTo] = useState(usage?.to ?? "");
	if (!usage) return null;
	const apply = () => {
		const p = new URLSearchParams(sp.toString());
		if (from) p.set("from", from);
		else p.delete("from");
		if (to) p.set("to", to);
		else p.delete("to");
		router.push(`${path}?${p.toString()}`, { scroll: false });
	};
	return (
		<SectionCard
			title={`Stock used and issued · ${fmtDay(usage.from)} to ${fmtDay(usage.to)}`}
			flush
		>
			<div className="flex flex-wrap items-end gap-3 px-5 py-3">
				<label className="flex flex-col gap-1 text-xs text-ink-3">
					From
					<input
						type="date"
						value={from}
						onChange={(e) => setFrom(e.target.value)}
						className={cn(input, "py-1")}
					/>
				</label>
				<label className="flex flex-col gap-1 text-xs text-ink-3">
					To
					<input
						type="date"
						value={to}
						onChange={(e) => setTo(e.target.value)}
						className={cn(input, "py-1")}
					/>
				</label>
				<button
					type="button"
					className={`${btn.secondary} ${btn.small}`}
					onClick={apply}
				>
					Show
				</button>
				<span className="ml-auto text-[13px] text-ink-2">
					Used {naira(usage.totals.used)} · wasted {naira(usage.totals.wasted)}{" "}
					· issued to teams {naira(usage.totals.issued)} · received{" "}
					{naira(usage.totals.received)}
				</span>
			</div>
			<table className="w-full text-left text-[13px]">
				<thead>
					<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<th className="px-5 py-2">Store</th>
						<th className="py-2 text-right">Received</th>
						<th className="py-2 text-right">Moved in</th>
						<th className="py-2 text-right">Moved out</th>
						<th className="py-2 text-right">Used</th>
						<th className="py-2 text-right">Wasted</th>
						<th className="px-5 py-2 text-right">Counts & corrections</th>
					</tr>
				</thead>
				<tbody>
					{usage.stores.map((s) => (
						<tr
							key={s.storeId}
							className="border-b border-line last:border-b-0"
						>
							<td className="px-5 py-2 font-medium text-ink">{s.name}</td>
							<td className="py-2 text-right">{naira(s.received)}</td>
							<td className="py-2 text-right">{naira(s.transferredIn)}</td>
							<td className="py-2 text-right">{naira(s.issuedOut)}</td>
							<td className="py-2 text-right font-semibold">{naira(s.used)}</td>
							<td className="py-2 text-right text-danger">{naira(s.wasted)}</td>
							<td
								className={cn(
									"px-5 py-2 text-right",
									s.counted < 0 ? "text-danger" : "text-ink-2",
								)}
							>
								{naira(s.counted)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{usage.teams.length > 0 && (
				<p className="px-5 py-3 text-[13px] text-ink-2">
					Issued to teams:{" "}
					{usage.teams
						.map((t) => `${KIND_LABEL[t.team] ?? t.team} ${naira(t.issued)}`)
						.join(" · ")}
				</p>
			)}
		</SectionCard>
	);
}
