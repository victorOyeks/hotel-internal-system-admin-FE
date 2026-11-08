"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, SendIcon, ShoppingCartIcon, Trash2Icon, TruckIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList, Note, TotalsList } from "@/components/shared/detail-list";
import { SelectField, TextareaField, TextField } from "@/components/shared/field";
import { fmtDay, fmtWhen, naira, plural } from "@/components/shared/format";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { ManagerMark } from "@/components/shared/row-actions";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn, input } from "@/components/shared/ui";
import type { PurchaseOrderRow, StockItemRow, SupplierRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";

export const poTone: Record<PurchaseOrderRow["status"], { label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }> = { DRAFT: { label: "Draft", tone: "grey" }, PENDING_APPROVAL: { label: "Needs approval", tone: "warning" }, SENT: { label: "Sent", tone: "info" }, RECEIVED: { label: "Received", tone: "success" }, CANCELLED: { label: "Cancelled", tone: "danger" } };
const LIMIT = 200000;
type Line = { itemId: string; name: string; unit: string; quantity: number; unitCost: number };

/** Inventory 3.x · Purchase orders: list, new order, order details. */
export function OrdersScreen({ orders: initial, items, suppliers, me, isManager = false }: { orders: PurchaseOrderRow[]; items: StockItemRow[]; suppliers: SupplierRow[]; me: string; isManager?: boolean }) {
	const [orders, setOrders] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [seedItem] = useQueryState("item");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const active = tab ?? "all";
	const lists: Record<string, PurchaseOrderRow[]> = { all: orders, draft: orders.filter((o) => o.status === "DRAFT"), approval: orders.filter((o) => o.status === "PENDING_APPROVAL"), sent: orders.filter((o) => o.status === "SENT"), received: orders.filter((o) => o.status === "RECEIVED") };
	const po = orders.find((o) => o.id === openId) ?? null;
	const { run, pending } = useDemoAction();
	const patch = (id: string, p: Partial<PurchaseOrderRow>) => setOrders((xs) => xs.map((o) => (o.id === id ? { ...o, ...p } : o)));

	const columns = useMemo<ColumnDef<PurchaseOrderRow, unknown>[]>(
		() => [
			{ accessorKey: "number", header: "Order", cell: ({ row }) => <TwoLine primary={row.original.number} secondary={`${row.original.createdBy} · ${fmtWhen(row.original.createdAt)}`} /> },
			{ accessorKey: "supplierName", header: "Supplier" },
			{ id: "lines", header: "Items", enableSorting: false, cell: ({ row }) => <span className="text-ink-2">{row.original.lines.map((l) => `${l.quantity} ${l.unit} ${l.name.split(" · ")[0]}`).join(", ")}</span> },
			{ accessorKey: "total", header: "Total", cell: ({ row }) => <span className="font-semibold">{naira(row.original.total)}</span> },
			{ accessorKey: "expectedOn", header: "Expected", cell: ({ row }) => <span className="text-ink-2">{row.original.expectedOn ? fmtDay(row.original.expectedOn) : "—"}</span> },
			{ accessorKey: "status", header: "Status", enableSorting: false, cell: ({ row }) => <StatusPill tone={poTone[row.original.status].tone}>{poTone[row.original.status].label}</StatusPill> },
		],
		[],
	);

	return (
		<>
			<PageHeader title="Purchase orders" subtitle={`${plural(lists.sent.length, "order")} on the way · ${plural(lists.approval.length, "order")} waiting for approval · orders over ${naira(LIMIT)} need the manager`}>
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}><PlusIcon className="mr-1 inline size-4" /> New order</button>
			</PageHeader>
			<Toolbar left={<PillTabs value={active} onChange={(k) => void setTab(k === "all" ? null : k)} tabs={[{ key: "all", label: "All", count: orders.length }, { key: "draft", label: "Draft", count: lists.draft.length }, { key: "approval", label: "Needs approval", count: lists.approval.length }, { key: "sent", label: "Sent", count: lists.sent.length }, { key: "received", label: "Received", count: lists.received.length }]} />} right={<SearchBox value={search} onChange={setSearch} placeholder="Order, supplier, item…" />} />
			<DataTable columns={columns} data={lists[active] ?? orders} search={search} onRowClick={(o) => void setOpenId(o.id)} />

			<SidePanel open={!!po} onOpenChange={(o) => !o && void setOpenId(null)} title={po ? `${po.number} · ${po.supplierName}` : ""} subtitle={po ? `${po.createdBy} · ${fmtWhen(po.createdAt)}${po.expectedOn ? ` · expected ${fmtDay(po.expectedOn)}` : ""}` : undefined} icon={ShoppingCartIcon} footer={po && (
				<>
					{po.status === "DRAFT" && <button type="button" className={btn.primary} disabled={pending} onClick={() => void run(po.total > LIMIT ? "Sent to the manager to approve" : `${po.number} sent to ${po.supplierName}`, () => patch(po.id, { status: po.total > LIMIT ? "PENDING_APPROVAL" : "SENT" }), po.total > LIMIT ? { tone: "info" } : undefined)}><SendIcon className="mr-1 inline size-4" /> {po.total > LIMIT ? "Send for approval" : "Send to supplier"}</button>}
					{po.status === "PENDING_APPROVAL" && isManager && <button type="button" className={btn.primary} disabled={pending} onClick={() => void run(`${po.number} approved and sent`, () => patch(po.id, { status: "SENT" }))}>Approve & send</button>}
					{po.status === "SENT" && <Link href={`/dashboard/deliveries?new=1&po=${po.id}`} className={btn.primary}><TruckIcon className="mr-1 inline size-4" /> Receive delivery</Link>}
					{(po.status === "DRAFT" || po.status === "PENDING_APPROVAL") && <button type="button" className={btn.dangerSoft} disabled={pending} onClick={() => void run("Order cancelled", () => patch(po.id, { status: "CANCELLED" }), { tone: "warning" })}>Cancel</button>}
				</>
			)} footerInfo={po && <span className="flex items-center gap-2"><StatusPill tone={poTone[po.status].tone}>{poTone[po.status].label}</StatusPill>{po.total > LIMIT && <ManagerMark />}</span>}>
				{po && (
					<div className="flex flex-col gap-5">
						{po.status === "PENDING_APPROVAL" && <Note tone="warning">Over {naira(LIMIT)} · waiting on {po.total > 500000 ? "the owner" : "the manager"}. Nothing is sent to the supplier yet.</Note>}
						<PanelSection title="Lines">
							<table className="w-full text-left text-[13px]"><thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Total</th></tr></thead><tbody>{po.lines.map((l) => <tr key={l.name} className="border-b border-line last:border-b-0"><td className="py-2 font-medium text-ink">{l.name}</td><td className="py-2 text-right">{l.quantity} {l.unit}</td><td className="py-2 text-right text-ink-2">{naira(l.unitCost)}</td><td className="py-2 text-right font-semibold">{naira(l.quantity * l.unitCost)}</td></tr>)}</tbody></table>
							<TotalsList rows={[{ label: "Order total", value: naira(po.total), strong: true }]} />
						</PanelSection>
						<PanelSection title="Supplier"><DetailList columns={2} items={[{ label: "Name", value: po.supplierName }, { label: "Terms", value: suppliers.find((s) => s.name === po.supplierName)?.terms ?? "—" }, { label: "Contact", value: suppliers.find((s) => s.name === po.supplierName)?.phone ?? "—" }, { label: "Expected", value: po.expectedOn ? fmtDay(po.expectedOn) : "—" }]} /></PanelSection>
					</div>
				)}
			</SidePanel>

			<NewOrderPanel open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} items={items} suppliers={suppliers} seedItemId={seedItem} me={me} onSaved={(o) => { setOrders((xs) => [o, ...xs]); void setIsNew(null); void setOpenId(o.id); }} />
		</>
	);
}

function NewOrderPanel({ open, onOpenChange, items, suppliers, seedItemId, me, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; items: StockItemRow[]; suppliers: SupplierRow[]; seedItemId: string | null; me: string; onSaved: (o: PurchaseOrderRow) => void }) {
	const [supplierId, setSupplierId] = useState("");
	const [lines, setLines] = useState<Line[]>([]);
	const [pick, setPick] = useState("");
	const [expected, setExpected] = useState(format(addDays(new Date(), 2), "yyyy-MM-dd"));
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	useEffect(() => {
		if (!open) return;
		const seed = items.find((i) => i.id === seedItemId);
		if (seed) {
			setSupplierId(suppliers.find((s) => s.name === seed.supplierName)?.id ?? "");
			setLines([{ itemId: seed.id, name: seed.name, unit: seed.unit, quantity: Math.max(seed.minLevel * 2 - seed.quantity, 1), unitCost: seed.unitCost }]);
		} else setLines([]);
	}, [open, seedItemId, items, suppliers]);
	const supplier = suppliers.find((s) => s.id === supplierId);
	const candidates = items.filter((i) => !supplier || i.supplierName === supplier.name);
	const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
	const lowSuggestions = candidates.filter((i) => i.quantity <= i.minLevel && !lines.some((l) => l.itemId === i.id));
	const add = (i: StockItemRow) => setLines((ls) => [...ls, { itemId: i.id, name: i.name, unit: i.unit, quantity: Math.max(i.minLevel * 2 - i.quantity, 1), unitCost: i.unitCost }]);

	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="New purchase order" subtitle="Pick a supplier, add lines, send" icon={ShoppingCartIcon} width="lg" footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.secondary} disabled={!supplier || lines.length === 0 || pending} onClick={() => void run("Saved as draft", () => onSaved({ id: `po-${Date.now()}`, number: `PO-0${232 + Math.floor(Math.random() * 50)}`, supplierName: supplier?.name ?? "", lines, total, status: "DRAFT", expectedOn: expected, createdBy: me, createdAt: new Date().toISOString() }))}>Save draft</button><button type="button" className={btn.primary} disabled={!supplier || lines.length === 0 || pending} onClick={() => void run(total > LIMIT ? "Order sent to the manager to approve" : `Order sent to ${supplier?.name}`, () => onSaved({ id: `po-${Date.now()}`, number: `PO-0${232 + Math.floor(Math.random() * 50)}`, supplierName: supplier?.name ?? "", lines, total, status: total > LIMIT ? "PENDING_APPROVAL" : "SENT", expectedOn: expected, createdBy: me, createdAt: new Date().toISOString() }), total > LIMIT ? { tone: "info" } : undefined)}>{total > LIMIT ? "Send for approval" : "Send order"}</button></>} footerInfo={total > LIMIT ? <span className="flex items-center gap-2"><ManagerMark /> Over {naira(LIMIT)} needs the manager</span> : `${plural(lines.length, "line")} · ${naira(total)}`}>
			<div className="flex flex-col gap-5">
				<SelectField label="Supplier" value={supplierId} onChange={setSupplierId} options={suppliers.map((s) => ({ value: s.id, label: s.name, hint: `${s.terms} · ${s.items} items` }))} setupLink="suppliers" required />
				<PanelSection title="Lines">
					{lines.length === 0 && <p className="text-[13px] text-ink-3">No lines yet · pick items below.</p>}
					{lines.map((l, idx) => (
						<div key={l.itemId} className="flex items-center gap-2 rounded-control border border-line px-3 py-2">
							<div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-ink">{l.name}</p><p className="text-xs text-ink-3">{naira(l.unitCost)} per {l.unit}</p></div>
							<input type="number" min={1} value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, i) => (i === idx ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x)))} className={`${input} w-20 py-1 text-right`} />
							<span className="w-24 text-right text-[13px] font-semibold">{naira(l.quantity * l.unitCost)}</span>
							<button type="button" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} className="text-ink-3 hover:text-danger" aria-label="Remove"><Trash2Icon className="size-4" /></button>
						</div>
					))}
					<SelectField label="Add an item" value={pick} onChange={(v) => { const i = items.find((x) => x.id === v); if (i) add(i); setPick(""); }} options={candidates.filter((i) => !lines.some((l) => l.itemId === i.id)).map((i) => ({ value: i.id, label: i.name, hint: `${i.quantity} ${i.unit} in stock · min ${i.minLevel}` }))} placeholder="Search items from this supplier…" />
					{lowSuggestions.length > 0 && <div className="flex flex-wrap gap-1">{lowSuggestions.map((i) => <button key={i.id} type="button" onClick={() => add(i)} className="rounded-pill border border-warning/40 bg-warning-soft px-2 py-[3px] text-[11px] font-medium text-warning">+ {i.name.split(" · ")[0]} (low)</button>)}</div>}
				</PanelSection>
				<TotalsList rows={[{ label: "Order total", value: naira(total), strong: true }]} />
				{total > LIMIT && <Note tone="warning">Orders over {naira(LIMIT)} go to the manager{total > 500000 ? " and the owner" : ""} first.</Note>}
				<TextField label="Expected on" type="date" value={expected} onChange={setExpected} />
				<TextareaField label="Note to supplier" value={note} onChange={setNote} rows={2} />
			</div>
		</SidePanel>
	);
}
