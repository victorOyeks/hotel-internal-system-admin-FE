"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PackageCheckIcon, TruckIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { SelectField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtWhen, naira, plural } from "@/components/shared/format";
import { PageHeader } from "@/components/shared/page-header";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn, input } from "@/components/shared/ui";
import type { DeliveryRow, PurchaseOrderRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

/** Inventory 4.x · Deliveries + receive delivery against a PO. */
export function DeliveriesScreen({ deliveries: initial, orders, me }: { deliveries: DeliveryRow[]; orders: PurchaseOrderRow[]; me: string }) {
	const [deliveries, setDeliveries] = useState(initial);
	const [isNew, setIsNew] = useQueryState("new");
	const [poParam] = useQueryState("po");
	const [search, setSearch] = useState("");
	const [poId, setPoId] = useState("");
	const [received, setReceived] = useState<Record<string, number>>({});
	const [damaged, setDamaged] = useState(false);
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	const open = orders.filter((o) => o.status === "SENT");
	const po = orders.find((o) => o.id === poId) ?? null;
	useEffect(() => {
		if (isNew === "1") setPoId(poParam && orders.some((o) => o.id === poParam) ? poParam : "");
	}, [isNew, poParam, orders]);
	useEffect(() => {
		if (po) setReceived(Object.fromEntries(po.lines.map((l) => [l.name, l.quantity])));
	}, [po]);
	const short = po ? po.lines.filter((l) => (received[l.name] ?? 0) < l.quantity) : [];
	const total = po ? po.lines.reduce((s, l) => s + (received[l.name] ?? 0) * l.unitCost, 0) : 0;

	const columns = useMemo<ColumnDef<DeliveryRow, unknown>[]>(
		() => [
			{ accessorKey: "receivedAt", header: "Received", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.receivedAt)}</span> },
			{ accessorKey: "supplierName", header: "Supplier", cell: ({ row }) => <TwoLine primary={row.original.supplierName} secondary={row.original.poNumber ? `Against ${row.original.poNumber}` : "No purchase order"} /> },
			{ accessorKey: "lines", header: "Lines", cell: ({ row }) => plural(row.original.lines, "line") },
			{ accessorKey: "total", header: "Value", cell: ({ row }) => <span className="font-semibold">{naira(row.original.total)}</span> },
			{ accessorKey: "receivedBy", header: "By" },
			{ accessorKey: "note", header: "Note", enableSorting: false, cell: ({ row }) => (row.original.note ? <StatusPill tone="warning">{row.original.note}</StatusPill> : <StatusPill tone="success">Complete</StatusPill>) },
		],
		[],
	);

	return (
		<>
			<PageHeader title="Deliveries" subtitle={`${plural(open.length, "order")} on the way · stock goes up the moment you receive`}>
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}><TruckIcon className="mr-1 inline size-4" /> Receive delivery</button>
			</PageHeader>
			{open.length > 0 && (
				<div className="grid gap-3 md:grid-cols-3">
					{open.map((o) => (
						<button key={o.id} type="button" onClick={() => { setPoId(o.id); void setIsNew("1"); }} className="flex flex-col gap-1 rounded-card border border-info/30 bg-info-soft/40 p-4 text-left hover:shadow-md">
							<span className="flex items-center gap-2 text-sm font-bold text-ink">{o.number} <StatusPill tone="info">on the way</StatusPill></span>
							<span className="text-xs text-ink-2">{o.supplierName} · {plural(o.lines.length, "line")} · {naira(o.total)}</span>
							<span className="text-xs text-ink-3">Expected {o.expectedOn ? fmtWhen(`${o.expectedOn}T09:00:00`).split(",")[0] : "soon"}</span>
						</button>
					))}
				</div>
			)}
			<Toolbar right={<SearchBox value={search} onChange={setSearch} placeholder="Supplier, order…" />} />
			<DataTable columns={columns} data={deliveries} search={search} />

			<SidePanel open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} title="Receive a delivery" subtitle="Tick off what arrived · short or damaged items are noted for the supplier" icon={PackageCheckIcon} width="lg" footer={<><button type="button" className={btn.secondary} onClick={() => void setIsNew(null)}>Cancel</button><button type="button" className={btn.primary} disabled={!po || pending} onClick={() => void run(short.length ? "Delivery received · supplier credited for the shortfall" : "Delivery received · stock updated", () => { if (po) setDeliveries((xs) => [{ id: `dl-${Date.now()}`, supplierName: po.supplierName, poNumber: po.number, lines: po.lines.length, total, receivedBy: me, receivedAt: new Date().toISOString(), note: short.length ? `${short.length} short` : damaged ? "Damage noted" : undefined }, ...xs]); void setIsNew(null); })}>Receive {naira(total)}</button></>} footerInfo={po ? `${plural(po.lines.length, "line")} · ${naira(po.total)} ordered` : undefined}>
				<div className="flex flex-col gap-5">
					<SelectField label="Purchase order" value={poId} onChange={setPoId} options={open.map((o) => ({ value: o.id, label: `${o.number} · ${o.supplierName}`, hint: `${plural(o.lines.length, "line")} · ${naira(o.total)}` }))} placeholder="Match to an order on the way…" hint="Delivery without an order? Ask the storekeeper to raise one first." />
					{po && (
						<>
							<PanelSection title="What arrived">
								<table className="w-full text-left text-[13px]"><thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="py-2">Item</th><th className="py-2 text-right">Ordered</th><th className="py-2 text-right">Received</th></tr></thead><tbody>{po.lines.map((l) => <tr key={l.name} className="border-b border-line last:border-b-0"><td className="py-2 font-medium text-ink">{l.name}</td><td className="py-2 text-right">{l.quantity} {l.unit}</td><td className="py-2 text-right"><input type="number" min={0} value={received[l.name] ?? 0} onChange={(e) => setReceived((r) => ({ ...r, [l.name]: Math.max(0, Number(e.target.value)) }))} className={cn(input, "w-20 py-1 text-right", (received[l.name] ?? 0) < l.quantity && "border-warning")} /></td></tr>)}</tbody></table>
							</PanelSection>
							{short.length > 0 && <Note tone="warning">{short.map((l) => `${l.quantity - (received[l.name] ?? 0)} ${l.unit} ${l.name.split(" · ")[0]}`).join(", ")} short · the supplier is credited and told.</Note>}
							<ToggleField label="Something arrived damaged" checked={damaged} onChange={setDamaged} />
							<TotalsList rows={[{ label: "Ordered", value: naira(po.total) }, { label: "Received", value: naira(total), strong: true }]} />
							<TextareaField label="Note" value={note} onChange={setNote} rows={2} placeholder="Driver, invoice number, what was damaged…" />
						</>
					)}
				</div>
			</SidePanel>
		</>
	);
}
