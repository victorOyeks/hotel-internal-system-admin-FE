"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, ClipboardCheckIcon, PackageIcon, PlusIcon, ShoppingCartIcon, TruckIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, Timeline } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, FieldRow, MoneyField, SelectField, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { PurchaseOrderRow, StockItemRow, StoreRow, SupplierRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";

export function stockStatus(i: StockItemRow, onOrder: boolean) {
	if (i.quantity <= 0) return { label: "Out", tone: "danger" as const };
	if (onOrder) return { label: "Ordered", tone: "info" as const };
	if (i.quantity <= i.minLevel * 0.5) return { label: "Low", tone: "danger" as const };
	if (i.quantity <= i.minLevel) return { label: "Near minimum", tone: "warning" as const };
	return { label: "OK", tone: "success" as const };
}

/** Inventory 1.1–1.4 · Stores & stock, item panel, add item, correct level. */
export function StockScreen({ stores, items: initial, orders, suppliers, hotelName, keeper }: { stores: StoreRow[]; items: StockItemRow[]; orders: PurchaseOrderRow[]; suppliers: SupplierRow[]; hotelName: string; keeper: string }) {
	const [items, setItems] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [store, setStore] = useState("");
	const [correcting, setCorrecting] = useState(false);
	const [newQty, setNewQty] = useState("");
	const [reason, setReason] = useState("");
	const { run, pending } = useDemoAction();
	const active = tab ?? "all";
	const onOrderNames = new Set(orders.filter((o) => o.status === "SENT" || o.status === "PENDING_APPROVAL").flatMap((o) => o.lines.map((l) => l.name)));
	const low = items.filter((i) => i.quantity <= i.minLevel);
	const lists: Record<string, StockItemRow[]> = {
		all: items,
		low: low,
		ordered: items.filter((i) => onOrderNames.has(i.name)),
	};
	const shown = (lists[active] ?? items).filter((i) => !store || i.storeId === store);
	const item = items.find((i) => i.id === openId) ?? null;
	const value = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
	const onOrderValue = orders.filter((o) => o.status === "SENT").reduce((s, o) => s + o.total, 0);

	const columns = useMemo<ColumnDef<StockItemRow, unknown>[]>(
		() => [
			{ accessorKey: "name", header: "Item", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={row.original.category} /> },
			{ accessorKey: "storeName", header: "Store", cell: ({ row }) => <span className="text-ink-2">{row.original.storeName.replace(" store", "")}</span> },
			{ accessorKey: "quantity", header: "In stock", cell: ({ row }) => { const i = row.original; const s = stockStatus(i, onOrderNames.has(i.name)); return <div className="w-36"><ProgressBar value={i.quantity} max={Math.max(i.minLevel * 2, 1)} tone={s.tone === "success" ? "brand" : s.tone === "info" ? "info" : s.tone} /><p className="mt-1 text-[11px] text-ink-2">{i.quantity} {i.unit} · min {i.minLevel}</p></div>; } },
			{ accessorKey: "unitCost", header: "Unit cost", cell: ({ row }) => naira(row.original.unitCost) },
			{ accessorKey: "lastMovement", header: "Last moved", cell: ({ row }) => <span className="text-ink-2">{row.original.lastMovement ? fmtWhen(row.original.lastMovement) : "—"}</span> },
			{ id: "status", header: "Status", enableSorting: false, cell: ({ row }) => { const s = stockStatus(row.original, onOrderNames.has(row.original.name)); return <StatusPill tone={s.tone}>{s.label}</StatusPill>; } },
			{ id: "act", header: "", enableSorting: false, cell: ({ row }) => { const s = stockStatus(row.original, onOrderNames.has(row.original.name)); return <div className="flex justify-end">{s.tone === "danger" || s.tone === "warning" ? <Link href={`/dashboard/orders?new=1&item=${row.original.id}`} className={`${btn.primary} ${btn.small}`} onClick={(e) => e.stopPropagation()}>Reorder</Link> : <button type="button" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); void setOpenId(row.original.id); }}>View</button>}</div>; } },
		],
		[onOrderNames, setOpenId],
	);

	return (
		<>
			<PageHeader title="Inventory" subtitle={`${hotelName} · ${stores.length} stores · ${keeper} looks after stock`}>
				<Link href="/dashboard/counts?new=1" className={btn.secondary}><ClipboardCheckIcon className="mr-1 inline size-4" /> Stock count</Link>
				<button type="button" className={btn.secondary} onClick={() => void setIsNew("1")}>Add item</button>
				<Link href="/dashboard/orders?new=1" className={btn.primary}><ShoppingCartIcon className="mr-1 inline size-4" /> Order stock</Link>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Items tracked" value={items.length} icon={PackageIcon} hint={`In ${plural(stores.length, "store")}`} />
				<KpiCard label="Running low" value={low.length} icon={AlertTriangleIcon} hint="Below their minimum" pill={low.length ? <StatusPill tone="danger">reorder</StatusPill> : undefined} />
				<KpiCard label="On order" value={nairaShort(onOrderValue)} icon={TruckIcon} hint={`${plural(orders.filter((o) => o.status === "SENT").length, "order")} · next arrives tomorrow`} />
				<KpiCard label="Stock value" value={nairaShort(value)} icon={PackageIcon} hint="At last unit cost" />
			</div>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{stores.map((s) => (
					<button key={s.id} type="button" onClick={() => setStore(store === s.id ? "" : s.id)} className={cn("flex flex-col gap-1 rounded-card border bg-card p-4 text-left hover:shadow-md", store === s.id ? "border-brand" : "border-line")}>
						<span className="text-sm font-bold text-ink">{s.name}</span>
						<span className="text-xs text-ink-3">{s.kind} · {s.keeper}</span>
						<span className="mt-1 flex items-center gap-2 text-xs"><span className="text-ink-2">{items.filter((i) => i.storeId === s.id).length} items</span>{items.filter((i) => i.storeId === s.id && i.quantity <= i.minLevel).length > 0 && <StatusPill tone="danger">{items.filter((i) => i.storeId === s.id && i.quantity <= i.minLevel).length} low</StatusPill>}</span>
					</button>
				))}
			</div>
			<Toolbar left={<PillTabs value={active} onChange={(k) => void setTab(k === "all" ? null : k)} tabs={[{ key: "all", label: "All items", count: items.length }, { key: "low", label: "Running low", count: low.length }, { key: "ordered", label: "On order", count: lists.ordered.length }]} />} right={<><FilterSelect value={store} onChange={setStore} options={stores.map((s) => ({ value: s.id, label: s.name }))} all="All stores" /><SearchBox value={search} onChange={setSearch} placeholder="Item, category, supplier…" /></>} />
			<DataTable columns={columns} data={shown} search={search} onRowClick={(i) => void setOpenId(i.id)} />

			<SidePanel open={!!item} onOpenChange={(o) => !o && void setOpenId(null)} title={item?.name ?? ""} subtitle={item ? `${item.category} · ${item.storeName} · ${item.supplierName ?? "no supplier"}` : undefined} icon={PackageIcon} footer={item && <><button type="button" className={btn.secondary} onClick={() => { setCorrecting(true); setNewQty(String(item.quantity)); }}>Correct level</button><Link href={`/dashboard/orders?new=1&item=${item.id}`} className={btn.primary}>Order more</Link></>} footerInfo={item && (() => { const s = stockStatus(item, onOrderNames.has(item.name)); return <StatusPill tone={s.tone}>{s.label}</StatusPill>; })()}>
				{item && (
					<div className="flex flex-col gap-6">
						<div className="rounded-xl border border-line px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">In stock</p><p className="text-2xl font-bold text-ink">{item.quantity} <span className="text-base font-medium text-ink-2">{item.unit}</span></p><ProgressBar value={item.quantity} max={Math.max(item.minLevel * 2, 1)} className="mt-2" tone={item.quantity <= item.minLevel ? "danger" : "brand"} /><p className="mt-1 text-xs text-ink-3">Minimum {item.minLevel} {item.unit} · worth {naira(item.quantity * item.unitCost)}</p></div>
						{item.quantity <= item.minLevel && <Note tone="warning">Below minimum. {onOrderNames.has(item.name) ? "An order is already on the way." : "Reorder before it runs out."}</Note>}
						<PanelSection title="Details"><DetailList columns={2} items={[{ label: "Unit cost", value: naira(item.unitCost) }, { label: "Supplier", value: item.supplierName ?? "—" }, { label: "Store", value: item.storeName }, { label: "Last movement", value: fmtWhen(item.lastMovement) }]} /></PanelSection>
						<PanelSection title="Movements">
							<Timeline items={[{ at: fmtWhen(item.lastMovement), by: "Grace Okafor", text: `Issued 2 ${item.unit} to Housekeeping` }, { at: "Yesterday 12:05pm", by: keeper, text: `Received 10 ${item.unit} · ${item.supplierName ?? "delivery"}` }, { at: "Mon 3 Nov", by: keeper, text: "Counted · matched" }]} />
						</PanelSection>
					</div>
				)}
			</SidePanel>

			{item && (
				<Modal open={correcting} onOpenChange={setCorrecting} title="Correct the level" subtitle={`${item.name} · system says ${item.quantity} ${item.unit}`} icon={PackageIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => setCorrecting(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!newQty || !reason || pending} onClick={() => void run(`Level set to ${newQty} ${item.unit} · logged`, () => { setItems((xs) => xs.map((i) => (i.id === item.id ? { ...i, quantity: Number(newQty), lastMovement: new Date().toISOString() } : i))); setCorrecting(false); })}>Save correction</button></>} footerInfo="Corrections are logged with your name and reason">
					<div className="flex flex-col gap-4">
						<TextField label={`Actual count (${item.unit})`} type="number" value={newQty} onChange={setNewQty} />
						<SelectField label="Reason" value={reason} onChange={setReason} options={["Miscount", "Breakage", "Expired", "Theft / missing", "Found extra", "Other"]} setupLink="reasons" />
						{newQty && Number(newQty) !== item.quantity && <Note tone={Number(newQty) < item.quantity ? "danger" : "info"}>{Number(newQty) < item.quantity ? `${item.quantity - Number(newQty)} ${item.unit} written off · ${naira((item.quantity - Number(newQty)) * item.unitCost)}` : `${Number(newQty) - item.quantity} ${item.unit} added`}</Note>}
					</div>
				</Modal>
			)}

			<AddItemPanel open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} stores={stores} suppliers={suppliers} onSaved={(i) => { setItems((xs) => [i, ...xs]); void setIsNew(null); void setOpenId(i.id); }} />
		</>
	);
}

function AddItemPanel({ open, onOpenChange, stores, suppliers, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; stores: StoreRow[]; suppliers: SupplierRow[]; onSaved: (i: StockItemRow) => void }) {
	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [unit, setUnit] = useState("pcs");
	const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
	const [min, setMin] = useState("");
	const [qty, setQty] = useState("");
	const [cost, setCost] = useState<number | "">("");
	const [supplier, setSupplier] = useState("");
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="Add an item" subtitle="Something new to track in a store" icon={PlusIcon} footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!name || !category || !storeId || pending} onClick={() => void run(`${name} added`, () => { const s = stores.find((x) => x.id === storeId); onSaved({ id: `it-${Date.now()}`, name, category, unit, minLevel: Number(min) || 0, quantity: Number(qty) || 0, unitCost: typeof cost === "number" ? cost : 0, supplierName: suppliers.find((x) => x.id === supplier)?.name, storeId, storeName: s?.name ?? "", lastMovement: new Date().toISOString() }); setName(""); setQty(""); setMin(""); setCost(""); })}>Add item</button></>}>
			<div className="flex flex-col gap-4">
				<TextField label="Name" value={name} onChange={setName} required placeholder="e.g. Hand towel · white" />
				<FieldRow><SelectField label="Category" value={category} onChange={setCategory} options={["Amenities", "Linen", "Cleaning", "Beer", "Spirits", "Wine", "Soft drinks", "Dry goods", "Protein", "Fuel", "Office", "Maintenance"]} setupLink="categories" required /><ChoiceCards label="Unit" value={unit} onChange={setUnit} columns={3} options={[{ value: "pcs", label: "pcs" }, { value: "carton", label: "carton" }, { value: "kg", label: "kg" }]} /></FieldRow>
				<SelectField label="Store" value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} setupLink="stores" />
				<FieldRow><TextField label="Opening quantity" type="number" value={qty} onChange={setQty} /><TextField label="Minimum level" type="number" value={min} onChange={setMin} hint="Alert below this" /></FieldRow>
				<FieldRow><MoneyField label="Unit cost" value={cost} onChange={setCost} /><SelectField label="Usual supplier" value={supplier} onChange={setSupplier} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} /></FieldRow>
				<TextareaField label="Note" value={note} onChange={setNote} rows={2} />
			</div>
		</SidePanel>
	);
}
