"use client";

import { AlertTriangleIcon, PackageIcon, SendIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { Note } from "@/components/shared/detail-list";
import { ChoiceCards, SelectField, TextareaField } from "@/components/shared/field";
import { naira, nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import type { StockItemRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { BigButton, ShiftPill, Stepper } from "./tablet";

export type RequestLine = { item: StockItemRow; qty: number };

/**
 * A department's own store (Kitchen store 3251:12915, Bar stock 3264:12805): what is on the shelf,
 * what is running low, "Ask the store" to request more from the main store, and "Use or waste".
 * `extraActions` lets the Bar add breakage / count / close shift to the header.
 */
export function StoreScreen({ items, title, subtitle, extraActions, children }: { items: StockItemRow[]; title: string; subtitle: string; extraActions?: React.ReactNode; children?: React.ReactNode }) {
	const [rows, setRows] = useState(items);
	const [q, setQ] = useState("");
	const [asking, setAsking] = useState(false);
	const [lines, setLines] = useState<RequestLine[]>([]);
	const [note, setNote] = useState("");
	const [using, setUsing] = useState<StockItemRow | null>(null);
	const [useQty, setUseQty] = useState(1);
	const [useKind, setUseKind] = useState<"USE" | "WASTE">("USE");
	const [wasteReason, setWasteReason] = useState("Expired");
	const { run, pending } = useDemoAction();

	const low = rows.filter((i) => i.quantity <= i.minLevel);
	const value = rows.reduce((s, i) => s + i.quantity * i.unitCost, 0);
	const addLine = (item: StockItemRow) => setLines((ls) => (ls.some((l) => l.item.id === item.id) ? ls : [...ls, { item, qty: Math.max(1, item.minLevel - item.quantity) }]));
	const openAsk = (prefill?: StockItemRow[]) => {
		setLines((prefill ?? low).map((item) => ({ item, qty: Math.max(1, item.minLevel * 2 - item.quantity) })));
		setAsking(true);
	};

	return (
		<>
			<PageHeader title={title} subtitle={subtitle}>
				<ShiftPill />
				{extraActions}
				<BigButton onClick={() => openAsk()}>
					<SendIcon className="size-5" /> Ask the store
				</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Items on the shelf" value={rows.length} icon={PackageIcon} />
				<KpiCard label="Running low" value={low.length} icon={AlertTriangleIcon} hint={low.length ? low.map((i) => i.name.split(" ·")[0]).slice(0, 2).join(", ") : "Everything above minimum"} />
				<KpiCard label="Stock value" value={nairaShort(value)} icon={PackageIcon} />
				<KpiCard label="Requests today" value={1} icon={SendIcon} hint="1 part-issued by the main store" />
			</div>
			{low.length > 0 && (
				<div className="flex items-center gap-3 rounded-card border border-[#dbab00]/40 bg-warning-soft px-5 py-4">
					<AlertTriangleIcon className="size-5 shrink-0 text-warning" />
					<div className="flex-1 text-[15px]">
						<p className="font-semibold text-ink">Running low</p>
						<p className="text-ink-2">{low.map((i) => `${i.name} · ${i.quantity} ${i.unit} left (min ${i.minLevel})`).join(" · ")}</p>
					</div>
					<BigButton tone="secondary" onClick={() => openAsk(low)}>Request these</BigButton>
				</div>
			)}
			{children}
			<Toolbar left={<SearchBox value={q} onChange={setQ} placeholder="Search stock…" />} />
			<DataTable
				data={rows}
				search={q}
				pageSize={15}
				onRowClick={(i) => { setUsing(i); setUseQty(1); setUseKind("USE"); }}
				columns={[
					{ accessorKey: "name", header: "Item", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={row.original.category} /> },
					{ accessorKey: "quantity", header: "On the shelf", cell: ({ row }) => (
						<div className="flex min-w-[160px] flex-col gap-1">
							<span className="text-[15px] font-semibold">{row.original.quantity} {row.original.unit}</span>
							<ProgressBar value={row.original.quantity} max={Math.max(row.original.minLevel * 2, 1)} tone={row.original.quantity <= row.original.minLevel * 0.4 ? "danger" : row.original.quantity <= row.original.minLevel ? "warning" : undefined} />
						</div>
					) },
					{ accessorKey: "minLevel", header: "Minimum", cell: ({ row }) => `${row.original.minLevel} ${row.original.unit}` },
					{ accessorKey: "unitCost", header: "Unit cost", cell: ({ row }) => naira(row.original.unitCost) },
					{ id: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.quantity <= row.original.minLevel * 0.4 ? "danger" : row.original.quantity <= row.original.minLevel ? "warning" : "success"}>{row.original.quantity <= row.original.minLevel * 0.4 ? "Critical" : row.original.quantity <= row.original.minLevel ? "Low" : "OK"}</StatusPill> },
					{ id: "ask", header: "", cell: ({ row }) => <button type="button" onClick={(e) => { e.stopPropagation(); openAsk([row.original]); }} className="text-[13px] font-semibold text-brand hover:underline">Ask for more</button> },
				]}
			/>

			<SidePanel open={asking} onOpenChange={setAsking} title="Ask the store" subtitle="A request to the main store · Jide Alabi issues it" icon={SendIcon}
				footerInfo={`${plural(lines.length, "line")}`}
				footer={<><BigButton tone="secondary" onClick={() => setAsking(false)}>Cancel</BigButton><BigButton pending={pending} disabled={lines.length === 0} onClick={() => run("Request sent to the main store", () => setAsking(false), { tone: "info" })}>Send request</BigButton></>}>
				<div className="flex flex-col gap-5">
					<PanelSection title="Items">
						{lines.length === 0 ? <Note tone="info">Add items below.</Note> : (
							<ul className="divide-y divide-line rounded-control border border-line">
								{lines.map((l) => (
									<li key={l.item.id} className="flex items-center gap-3 px-4 py-3">
										<span className="min-w-0 flex-1">
											<span className="block text-[15px] font-semibold text-ink">{l.item.name}</span>
											<span className="block text-xs text-ink-3">{l.item.quantity} {l.item.unit} on the shelf · min {l.item.minLevel}</span>
										</span>
										<Stepper value={l.qty} onChange={(v) => setLines((ls) => (v <= 0 ? ls.filter((x) => x.item.id !== l.item.id) : ls.map((x) => (x.item.id === l.item.id ? { ...x, qty: v } : x))))} />
										<span className="w-12 text-xs text-ink-3">{l.item.unit}</span>
									</li>
								))}
							</ul>
						)}
						<SelectField label="Add an item" value="" onChange={(id) => { const it = rows.find((r) => r.id === id); if (it) addLine(it); }} options={rows.filter((r) => !lines.some((l) => l.item.id === r.id)).map((r) => ({ value: r.id, label: r.name }))} placeholder="Pick from your stock list" />
					</PanelSection>
					<TextareaField label="Note for the store" value={note} onChange={setNote} placeholder="e.g. needed before dinner service" rows={2} />
					<WhatHappens items={["The main store sees it on their Requests tab", "They issue what they have and you get an alert", "Anything they can't issue goes on a purchase order"]} />
				</div>
			</SidePanel>

			<Modal open={!!using} onOpenChange={(o) => !o && setUsing(null)} title={using?.name ?? ""} subtitle={using ? `${using.quantity} ${using.unit} on the shelf` : undefined} icon={useKind === "WASTE" ? TrashIcon : PackageIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setUsing(null)}>Cancel</BigButton><BigButton tone={useKind === "WASTE" ? "danger" : "primary"} pending={pending} onClick={() => using && run(useKind === "WASTE" ? `${useQty} ${using.unit} written off · manager told` : `${useQty} ${using.unit} used`, () => { setRows((r) => r.map((i) => (i.id === using.id ? { ...i, quantity: Math.max(0, i.quantity - useQty) } : i))); setUsing(null); }, useKind === "WASTE" ? { tone: "warning" } : undefined)}>{useKind === "WASTE" ? "Write off" : "Record use"}</BigButton></>}>
				<div className="flex flex-col gap-4">
					<ChoiceCards value={useKind} onChange={setUseKind} columns={2} options={[{ value: "USE", label: "Used", hint: "Went into service" }, { value: "WASTE", label: "Wasted", hint: "Expired, spoiled, broken" }]} />
					<div className="flex items-center justify-between rounded-control border border-line px-4 py-3">
						<span className="text-[15px] font-medium text-ink">Quantity ({using?.unit})</span>
						<Stepper value={useQty} onChange={setUseQty} min={1} max={using?.quantity ?? 1} />
					</div>
					{useKind === "WASTE" && <SelectField label="Reason" value={wasteReason} onChange={setWasteReason} options={["Expired", "Spoiled", "Broken", "Spilled", "Other"]} setupLink="reasons" />}
					{useKind === "WASTE" && <WhatHappens tone="warning" items={[`${naira((using?.unitCost ?? 0) * useQty)} of stock is written off`, "The manager is told and it shows on the stock movement report"]} />}
				</div>
			</Modal>
		</>
	);
}
