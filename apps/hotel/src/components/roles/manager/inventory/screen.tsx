"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, ClipboardCheckIcon, PackageIcon, PlusIcon, ShoppingCartIcon, TruckIcon, WalletIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { fmtDay, fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { DeliveryRow, PurchaseOrderRow, StockCountRow, StockItemRow, StockRequestRow, StoreRow, SupplierRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";
import { AdjustModal, CountPanel, IssueModal, ItemPanel, NewOrderPanel, OrderPanel, ReceivePanel, RequestPanel, StartCountModal, SupplierPanel, poLabel, poTone, stockStatus } from "./panels";

type Tab = "stock" | "requests" | "orders" | "deliveries" | "counts" | "suppliers";

export type InventoryProps = { hotelName: string; stores: StoreRow[]; items: StockItemRow[]; requests: StockRequestRow[]; orders: PurchaseOrderRow[]; deliveries: DeliveryRow[]; counts: StockCountRow[]; suppliers: SupplierRow[] };

export function InventoryScreen(p: InventoryProps) {
	const [tab] = useQueryState("tab");
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const [store, setStore] = useState("");
	const [lowOnly, setLowOnly] = useState(false);
	const [issue, setIssue] = useState<StockItemRow | null>(null);
	const [adjust, setAdjust] = useState<StockItemRow | null>(null);
	const [orderFor, setOrderFor] = useState<StockItemRow | null>(null);
	const [receive, setReceive] = useState<PurchaseOrderRow | null>(null);
	const [startCount, setStartCount] = useState(false);
	const [supplier, setSupplier] = useState<SupplierRow | null | "new">(null);
	const { run } = useDemoAction();

	const active = (tab as Tab) || "stock";
	const low = p.items.filter((i) => i.quantity <= i.minLevel);
	const onOrder = p.orders.filter((o) => o.status === "SENT" || o.status === "PENDING_APPROVAL");
	const stockValue = p.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
	const keeper = p.stores[0]?.keeper ?? "the storekeeper";

	const item = active === "stock" ? (p.items.find((i) => i.id === openId) ?? null) : null;
	const request = active === "requests" ? (p.requests.find((r) => r.id === openId) ?? null) : null;
	const order = active === "orders" ? (p.orders.find((o) => o.id === openId) ?? null) : null;
	const count = active === "counts" ? (p.counts.find((c) => c.id === openId) ?? null) : null;

	const itemColumns: ColumnDef<StockItemRow, unknown>[] = [
		{ header: "Item", accessorKey: "name", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={row.original.category} /> },
		{ header: "Store", accessorKey: "storeName", cell: ({ row }) => <span className="text-ink-2">{row.original.storeName.replace(" store", "")}</span> },
		{
			header: "In stock",
			accessorKey: "quantity",
			cell: ({ row }) => {
				const s = stockStatus(row.original);
				return (
					<div className="w-40">
						<div className="relative"><ProgressBar value={row.original.quantity} max={row.original.minLevel * 2} tone={s.tone === "success" ? "brand" : s.tone} /><span className="absolute top-[-2px] h-[10px] w-px bg-ink" style={{ left: "50%" }} /></div>
						<p className="mt-1 text-xs font-medium text-ink">{row.original.quantity} {row.original.unit} · min {row.original.minLevel}</p>
					</div>
				);
			},
		},
		{ header: "Unit cost", accessorKey: "unitCost", cell: ({ row }) => naira(row.original.unitCost) },
		{ header: "Last moved", accessorKey: "lastMovement", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.lastMovement)}</span> },
		{
			header: "Status",
			id: "status",
			accessorFn: (r) => r.quantity / Math.max(1, r.minLevel),
			cell: ({ row }) => {
				const s = stockStatus(row.original);
				const ordered = p.orders.some((o) => o.status === "SENT" && o.lines.some((l) => l.name === row.original.name));
				return ordered ? <TwoLine primary={<StatusPill tone="info">Ordered</StatusPill>} secondary="arrives soon" /> : <StatusPill tone={s.tone}>{s.label}</StatusPill>;
			},
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => {
				const s = stockStatus(row.original);
				return (
					<div className="flex items-center justify-end gap-2">
						{s.tone === "success" ? <Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); setOpenId(row.original.id); }}>View</Button> : <Button size="sm" className={`${btn.primary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); setOrderFor(row.original); }}>Reorder</Button>}
						<RowActions actions={[{ label: "View item", onClick: () => setOpenId(row.original.id) }, { label: "Issue to a team", onClick: () => setIssue(row.original) }, { label: "Correct level", onClick: () => setAdjust(row.original), managerOnly: true }, { label: "Reorder", onClick: () => setOrderFor(row.original) }]} />
					</div>
				);
			},
		},
	];

	const requestColumns: ColumnDef<StockRequestRow, unknown>[] = [
		{ header: "From", accessorKey: "fromTeam", cell: ({ row }) => <TwoLine primary={row.original.fromTeam} secondary={`${row.original.requestedBy} · ${fmtWhen(row.original.createdAt)}`} /> },
		{ header: "Items", id: "lines", accessorFn: (r) => r.lines.length, cell: ({ row }) => <TwoLine primary={row.original.lines.map((l) => `${l.name.split(" · ")[0]} ×${l.quantity}`).join(", ")} secondary={row.original.note} /> },
		{ header: "Status", accessorKey: "status", cell: ({ row }) => <StatusPill tone={row.original.status === "ISSUED" ? "success" : row.original.status === "DECLINED" ? "danger" : row.original.status === "PART_ISSUED" ? "info" : "warning"}>{row.original.status === "REQUESTED" ? "Waiting" : row.original.status === "PART_ISSUED" ? "Part issued" : row.original.status === "ISSUED" ? "Issued" : "Declined"}</StatusPill> },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="text-right">{row.original.status === "REQUESTED" ? <Button size="sm" className={`${btn.primary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); setOpenId(row.original.id); }}>Issue</Button> : <Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); setOpenId(row.original.id); }}>View</Button>}</div> },
	];

	const orderColumns: ColumnDef<PurchaseOrderRow, unknown>[] = [
		{ header: "Order", accessorKey: "number", cell: ({ row }) => <TwoLine primary={`${row.original.number} · ${row.original.supplierName}`} secondary={`${plural(row.original.lines.length, "line")} · ${row.original.createdBy}`} /> },
		{ header: "Total", accessorKey: "total", cell: ({ row }) => <span className="font-semibold">{naira(row.original.total)}</span> },
		{ header: "Expected", accessorKey: "expectedOn", cell: ({ row }) => <span className="text-ink-2">{row.original.expectedOn ? fmtDay(row.original.expectedOn) : "—"}</span> },
		{ header: "Raised", accessorKey: "createdAt", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.createdAt)}</span> },
		{ header: "Status", accessorKey: "status", cell: ({ row }) => <StatusPill tone={poTone[row.original.status]}>{poLabel[row.original.status]}</StatusPill> },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="text-right">{row.original.status === "PENDING_APPROVAL" ? <Button size="sm" className={`${btn.primary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); setOpenId(row.original.id); }}>Review</Button> : row.original.status === "SENT" ? <Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); setReceive(row.original); }}>Receive</Button> : <Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); setOpenId(row.original.id); }}>View</Button>}</div> },
	];

	const deliveryColumns: ColumnDef<DeliveryRow, unknown>[] = [
		{ header: "Delivery", accessorKey: "supplierName", cell: ({ row }) => <TwoLine primary={row.original.supplierName} secondary={row.original.poNumber ? `Against ${row.original.poNumber}` : "No purchase order"} /> },
		{ header: "Lines", accessorKey: "lines" },
		{ header: "Value", accessorKey: "total", cell: ({ row }) => <span className="font-semibold">{naira(row.original.total)}</span> },
		{ header: "Received", accessorKey: "receivedAt", cell: ({ row }) => <TwoLine primary={fmtWhen(row.original.receivedAt)} secondary={`by ${row.original.receivedBy}`} /> },
		{ header: "Note", accessorKey: "note", cell: ({ row }) => (row.original.note ? <StatusPill tone="warning" dot={false}>{row.original.note}</StatusPill> : <span className="text-xs text-ink-3">As ordered</span>) },
	];

	const countColumns: ColumnDef<StockCountRow, unknown>[] = [
		{ header: "Store", accessorKey: "storeName", cell: ({ row }) => <TwoLine primary={row.original.storeName} secondary={`${row.original.startedBy} · ${fmtWhen(row.original.startedAt)}`} /> },
		{ header: "Status", accessorKey: "status", cell: ({ row }) => <StatusPill tone={row.original.status === "OPEN" ? "info" : row.original.status === "COUNTED" ? "warning" : "success"}>{row.original.status === "OPEN" ? "Counting" : row.original.status === "COUNTED" ? "Needs your OK" : "Approved"}</StatusPill> },
		{ header: "Variance", accessorKey: "variance", cell: ({ row }) => (row.original.variance == null ? <span className="text-ink-3">—</span> : <span className={cn("font-semibold", row.original.variance < 0 ? "text-danger" : row.original.variance > 0 ? "text-success" : "text-ink-2")}>{row.original.variance === 0 ? "Matched" : `${row.original.variance > 0 ? "+" : ""}${row.original.variance} units`}</span>) },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="text-right"><Button size="sm" variant="outline" className={cn(btn.small, row.original.status === "COUNTED" ? btn.primary : btn.secondary)} onClick={(e) => { e.stopPropagation(); setOpenId(row.original.id); }}>{row.original.status === "COUNTED" ? "Review" : "View"}</Button></div> },
	];

	const supplierColumns: ColumnDef<SupplierRow, unknown>[] = [
		{ header: "Supplier", accessorKey: "name", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={`${row.original.contactName} · ${row.original.phone}`} /> },
		{ header: "Terms", accessorKey: "terms" },
		{ header: "Items", accessorKey: "items" },
		{ header: "Last order", accessorKey: "lastOrder", cell: ({ row }) => <span className="text-ink-2">{row.original.lastOrder ? fmtDay(row.original.lastOrder) : "—"}</span> },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <RowActions actions={[{ label: "Edit supplier", onClick: () => setSupplier(row.original) }, { label: "Order from them", onClick: () => { setOrderFor(p.items.find((i) => i.supplierName === row.original.name) ?? null); setIsNew("order"); } }, { label: "Message on WhatsApp", onClick: () => run(`Opening WhatsApp · ${row.original.phone}`, undefined, { tone: "info" }) }]} /> },
	];

	return (
		<>
			<PageHeader title="Inventory" subtitle={`${p.hotelName} · ${plural(p.stores.length, "store")} · ${keeper} looks after stock`}>
				<Button variant="outline" className={btn.secondary} onClick={() => setStartCount(true)}><ClipboardCheckIcon className="size-4" /> Stock count</Button>
				<Button className={btn.primary} onClick={() => setIsNew("order")}><PlusIcon className="size-4" /> Order stock</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Items tracked" value={p.items.length} icon={PackageIcon} hint={`In ${plural(p.stores.length, "store")}`} />
				<KpiCard label="Running low" value={low.length} icon={AlertTriangleIcon} pill={low.length > 0 ? <StatusPill tone="danger">{low.filter((i) => stockStatus(i).tone === "danger").length} low</StatusPill> : undefined} hint="Below their minimum" />
				<KpiCard label="On order" value={nairaShort(onOrder.reduce((s, o) => s + o.total, 0))} icon={ShoppingCartIcon} pill={<StatusPill tone="grey" dot={false}>{plural(onOrder.length, "order")}</StatusPill>} hint={onOrder.find((o) => o.expectedOn) ? `next arrives ${fmtDay(onOrder.find((o) => o.expectedOn)?.expectedOn)}` : "nothing due"} />
				<KpiCard label="Stock value" value={nairaShort(stockValue)} icon={WalletIcon} pill={<StatusPill tone="grey" dot={false}>Counted {fmtDay(p.counts.find((c) => c.status === "APPROVED")?.startedAt.slice(0, 10))}</StatusPill>} hint="Next count on the 1st" />
			</div>

			<Toolbar
				left={<PillTabs<Tab> param="tab" tabs={[{ key: "stock", label: "Stock", count: p.items.length }, { key: "requests", label: "Requests", count: p.requests.filter((r) => r.status === "REQUESTED").length }, { key: "orders", label: "Purchase orders", count: onOrder.length }, { key: "deliveries", label: "Deliveries" }, { key: "counts", label: "Counts", count: p.counts.filter((c) => c.status !== "APPROVED").length }, { key: "suppliers", label: "Suppliers" }]} />}
				right={
					<>
						{active === "stock" && (
							<>
								<button type="button" onClick={() => setLowOnly((v) => !v)} className={cn(btn.secondary, "py-[9px]", lowOnly && "border-danger/40 bg-danger-soft text-danger")}>Running low · {low.length}</button>
								<FilterSelect value={store} onChange={setStore} all="All stores" options={p.stores.map((s) => ({ value: s.name, label: s.name }))} />
							</>
						)}
						{active === "suppliers" && <Button className={btn.primary} onClick={() => setSupplier("new")}><PlusIcon className="size-4" /> Add supplier</Button>}
						<SearchBox value={search} onChange={setSearch} placeholder="Search…" />
						<ExportButton onClick={() => run("Export ready", undefined, { tone: "info" })} />
					</>
				}
			/>

			{active === "stock" && (
				<>
					<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
						{p.stores.map((s) => (
							<button key={s.id} type="button" onClick={() => setStore(store === s.name ? "" : s.name)} className={cn("flex items-center gap-3 rounded-card border bg-card px-4 py-3 text-left hover:bg-subtle/50", store === s.name ? "border-brand" : "border-line")}>
								<span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><PackageIcon className="size-4" /></span>
								<span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-ink">{s.name}</span><span className="block text-xs text-ink-3">{s.items} items · {s.keeper}</span></span>
								{s.lowItems > 0 && <StatusPill tone="danger" dot={false}>{s.lowItems} low</StatusPill>}
							</button>
						))}
					</div>
					<DataTable columns={itemColumns} data={p.items.filter((i) => (!store || i.storeName === store) && (!lowOnly || i.quantity <= i.minLevel))} search={search} onRowClick={(i) => setOpenId(i.id)} emptyTitle="No items match" />
				</>
			)}
			{active === "requests" && <DataTable columns={requestColumns} data={p.requests} search={search} onRowClick={(r) => setOpenId(r.id)} emptyTitle="No requests" emptyHint="Teams ask for stock from their tablet; requests land here." />}
			{active === "orders" && <DataTable columns={orderColumns} data={p.orders} search={search} onRowClick={(o) => setOpenId(o.id)} emptyTitle="No purchase orders" />}
			{active === "deliveries" && <DataTable columns={deliveryColumns} data={p.deliveries} search={search} emptyTitle="No deliveries yet" footer={<Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={() => setReceive(p.orders.find((o) => o.status === "SENT") ?? null)}><TruckIcon className="size-3" /> Receive a delivery</Button>} />}
			{active === "counts" && <DataTable columns={countColumns} data={p.counts} search={search} onRowClick={(c) => setOpenId(c.id)} emptyTitle="No stock counts" />}
			{active === "suppliers" && <DataTable columns={supplierColumns} data={p.suppliers} search={search} onRowClick={(s) => setSupplier(s)} emptyTitle="No suppliers" />}

			<ItemPanel item={item} onClose={() => setOpenId(null)} onIssue={setIssue} onAdjust={setAdjust} onOrder={(i) => { setOrderFor(i); setIsNew("order"); }} />
			<IssueModal item={issue} onClose={() => setIssue(null)} />
			{adjust && <AdjustModal item={adjust} onClose={() => setAdjust(null)} />}
			{(isNew === "order" || orderFor) && <NewOrderPanel open prefill={orderFor} items={p.items} suppliers={p.suppliers} onClose={() => { setIsNew(null); setOrderFor(null); }} />}
			<OrderPanel po={order} onClose={() => setOpenId(null)} onReceive={(po) => { setOpenId(null); setReceive(po); }} />
			<ReceivePanel po={receive} onClose={() => setReceive(null)} />
			<RequestPanel request={request} onClose={() => setOpenId(null)} />
			<StartCountModal open={startCount} stores={p.stores} onClose={() => setStartCount(false)} />
			<CountPanel count={count} onClose={() => setOpenId(null)} />
			{supplier && <SupplierPanel open supplier={supplier === "new" ? null : supplier} onClose={() => setSupplier(null)} />}
		</>
	);
}
