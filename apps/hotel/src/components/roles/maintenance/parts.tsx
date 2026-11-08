"use client";

import { PackageIcon, SendIcon, WrenchIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { RepairRow, SparePartRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { BigButton, ShiftPill, Stepper } from "../shared-staff/tablet";

/** Maintenance · Spare parts (3248:14721), use a part (3248:14924), ask the store. */
export function SparePartsScreen({ parts, repairs }: { parts: SparePartRow[]; repairs: RepairRow[] }) {
	const [rows, setRows] = useState(parts);
	const [using, setUsing] = useState<SparePartRow | null>(null);
	const [qty, setQty] = useState(1);
	const [forRepair, setForRepair] = useState("");
	const [asking, setAsking] = useState(false);
	const [req, setReq] = useState<Record<string, number>>({});
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	const low = rows.filter((p) => p.quantity < p.minQuantity);

	return (
		<>
			<PageHeader title="Spare parts" subtitle={`${plural(rows.length, "part")} in the maintenance cupboard · ${low.length} below minimum`}>
				<ShiftPill until="4pm" />
				<BigButton onClick={() => { setReq(Object.fromEntries(low.map((p) => [p.name, p.minQuantity * 2 - p.quantity]))); setAsking(true); }}><SendIcon className="size-5" /> Ask the store</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Parts" value={rows.length} icon={PackageIcon} />
				<KpiCard label="Below minimum" value={low.length} icon={PackageIcon} hint={low.map((p) => p.name).join(", ") || "All fine"} />
				<KpiCard label="Value on hand" value={nairaShort(rows.reduce((s, p) => s + p.quantity * p.unitCost, 0))} icon={PackageIcon} />
				<KpiCard label="Used this week" value={7} icon={WrenchIcon} />
			</div>
			<DataTable
				data={rows}
				onRowClick={(p) => { setUsing(p); setQty(1); setForRepair(""); }}
				columns={[
					{ accessorKey: "name", header: "Part", cell: ({ row }) => <TwoLine primary={<span className="text-[15px]">{row.original.name}</span>} secondary={`${naira(row.original.unitCost)} each`} /> },
					{ accessorKey: "quantity", header: "In stock", cell: ({ row }) => <div className="flex w-44 flex-col gap-1"><span className="text-[15px] font-semibold">{row.original.quantity} · min {row.original.minQuantity}</span><ProgressBar value={row.original.quantity} max={row.original.minQuantity * 2} tone={row.original.quantity < row.original.minQuantity ? "warning" : undefined} /></div> },
					{ id: "s", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.quantity === 0 ? "danger" : row.original.quantity < row.original.minQuantity ? "warning" : "success"}>{row.original.quantity === 0 ? "Out" : row.original.quantity < row.original.minQuantity ? "Low" : "OK"}</StatusPill> },
					{ id: "a", header: "", cell: ({ row }) => <BigButton tone="secondary" className="h-10" disabled={row.original.quantity === 0} onClick={(e) => { e.stopPropagation(); setUsing(row.original); setQty(1); setForRepair(""); }}><WrenchIcon className="size-4" /> Use</BigButton> },
				]}
			/>

			<Modal open={!!using} onOpenChange={(o) => !o && setUsing(null)} title={`Use ${using?.name ?? ""}`} subtitle={using ? `${using.quantity} in stock` : undefined} icon={WrenchIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setUsing(null)}>Cancel</BigButton><BigButton pending={pending} onClick={() => using && run(`${qty} × ${using.name} used`, () => { setRows((r) => r.map((p) => (p.id === using.id ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p))); setUsing(null); })}>Record use</BigButton></>}>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between rounded-control border border-line px-4 py-3"><span className="text-[15px] font-medium text-ink">How many</span><Stepper value={qty} onChange={setQty} min={1} max={using?.quantity ?? 1} /></div>
					<SelectField label="For which repair" value={forRepair} onChange={setForRepair} options={repairs.filter((r) => r.status !== "DONE" && r.status !== "CANCELLED").map((r) => ({ value: r.id, label: r.title, hint: r.roomNumber ? `Room ${r.roomNumber}` : r.area }))} placeholder="Optional" />
					{using && using.quantity - qty < using.minQuantity && <Note tone="warning">This takes it below minimum ({using.minQuantity}). Ask the store for more.</Note>}
				</div>
			</Modal>

			<SidePanel open={asking} onOpenChange={setAsking} title="Ask the store" subtitle="The main store issues what it has and orders the rest" icon={SendIcon}
				footer={<><BigButton tone="secondary" onClick={() => setAsking(false)}>Cancel</BigButton><BigButton pending={pending} disabled={Object.values(req).every((q) => !q)} onClick={() => run("Request sent to the main store", () => setAsking(false), { tone: "info" })}>Send request</BigButton></>}>
				<div className="flex flex-col gap-4">
					<ul className="divide-y divide-line rounded-control border border-line">{rows.map((p) => <li key={p.id} className="flex items-center gap-3 px-4 py-2"><span className="min-w-0 flex-1"><span className="block text-[15px] font-medium text-ink">{p.name}</span><span className="block text-xs text-ink-3">{p.quantity} in stock · min {p.minQuantity}</span></span><Stepper value={req[p.name] ?? 0} onChange={(v) => setReq({ ...req, [p.name]: v })} /></li>)}</ul>
					<TextareaField label="Note" value={note} onChange={setNote} rows={2} placeholder="e.g. needed for A211 compressor job" />
					<WhatHappens items={["Jide Alabi sees it on the store's Requests tab", "Parts over the manager's limit go for approval first"]} />
				</div>
			</SidePanel>
		</>
	);
}
