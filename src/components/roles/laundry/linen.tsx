"use client";

import { ArrowDownToLineIcon, ArrowUpFromLineIcon, ShirtIcon, TrashIcon, WashingMachineIcon } from "lucide-react";
import { useState } from "react";
import { Note } from "@/components/shared/detail-list";
import { SelectField, TextareaField } from "@/components/shared/field";
import { fmtTime, naira, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { LinenMoveRow, LinenRow, MachineLoadRow } from "@/lib/demo/fixtures/tablet";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";
import { BigButton, ShiftPill, Stepper } from "../shared-staff/tablet";

type Panel = "in" | "out" | "load" | "damaged" | null;
const floors = ["Floor A1", "Floor A2", "Floor A3", "Floor B1"];

/** Laundry · Linen in/out (3244:13987): count linen in, machine loads, send clean linen, damaged linen → write-off request. */
export function LaundryLinenScreen({ linen, machines, moves }: { linen: LinenRow[]; machines: MachineLoadRow[]; moves: LinenMoveRow[] }) {
	const [stock, setStock] = useState(linen);
	const [loads, setLoads] = useState(machines);
	const [log, setLog] = useState(moves);
	const [panel, setPanel] = useState<Panel>(null);
	const [counts, setCounts] = useState<Record<string, number>>({});
	const [floor, setFloor] = useState(floors[1]);
	const [machine, setMachine] = useState("Washer 1");
	const [kind, setKind] = useState("Towels");
	const [damaged, setDamaged] = useState({ type: linen[0]?.name ?? "", qty: 1, reason: "Torn", note: "" });
	const { run, pending } = useDemoAction();

	const zero = () => Object.fromEntries(stock.map((l) => [l.name, 0]));
	const total = Object.values(counts).reduce((s, q) => s + q, 0);
	const applyMove = (direction: "IN" | "OUT") => {
		setStock((st) => st.map((l) => { const q = counts[l.name] ?? 0; return direction === "IN" ? { ...l, dirty: l.dirty + q } : { ...l, clean: l.clean + q, inLaundry: Math.max(0, l.inLaundry - q) }; }));
		setLog((lg) => [{ id: `lm-${Date.now()}`, at: new Date().toISOString(), direction, from: `${floor} · ${direction === "IN" ? "dirty" : "clean"}`, items: Object.entries(counts).filter(([, q]) => q > 0).map(([name, qty]) => ({ name, qty })), by: "Lola Eze" }, ...lg]);
	};

	return (
		<>
			<PageHeader title="Linen in & out" subtitle="Hotel linen: what came down dirty, what's in the machines, what went back up clean">
				<ShiftPill />
				<BigButton tone="secondary" onClick={() => { setCounts(zero()); setPanel("in"); }}><ArrowDownToLineIcon className="size-5" /> Count linen in</BigButton>
				<BigButton onClick={() => { setCounts(zero()); setPanel("out"); }}><ArrowUpFromLineIcon className="size-5" /> Send clean linen</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Dirty waiting" value={stock.reduce((s, l) => s + l.dirty, 0)} icon={ShirtIcon} />
				<KpiCard label="In machines" value={loads.filter((m) => m.status === "RUNNING").reduce((s, m) => s + m.items, 0)} icon={WashingMachineIcon} hint={`${loads.filter((m) => m.status === "FREE").length} machine free`} />
				<KpiCard label="Clean, to send up" value={stock.reduce((s, l) => s + l.inLaundry, 0)} icon={ArrowUpFromLineIcon} />
				<KpiCard label="Damaged this week" value={stock.reduce((s, l) => s + l.damaged, 0)} icon={TrashIcon} />
			</div>
			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<SectionCard title="Machines" subtitle="Tap a free machine to start a load" bodyClassName="grid grid-cols-2 gap-3 pt-2">
					{loads.map((m) => (
						<button key={m.id} type="button" onClick={() => { setMachine(m.machine); setPanel("load"); }} disabled={m.status === "RUNNING"} className={cn("flex flex-col gap-2 rounded-xl border p-4 text-left", m.status === "RUNNING" ? "border-info/40 bg-info-soft/40" : m.status === "DONE" ? "border-success/40 bg-success-soft/50" : "border-line bg-card hover:bg-subtle")}>
							<div className="flex items-center justify-between"><span className="text-[15px] font-bold text-ink">{m.machine}</span><StatusPill tone={m.status === "RUNNING" ? "info" : m.status === "DONE" ? "success" : "grey"}>{m.status === "RUNNING" ? `Ready ${fmtTime(m.readyAt)}` : m.status === "DONE" ? "Done · unload" : "Free"}</StatusPill></div>
							<span className="text-[13px] text-ink-2">{m.status === "FREE" ? "Tap to start a load" : `${m.items} ${m.kind.toLowerCase()} · started ${fmtTime(m.startedAt)}`}</span>
							{m.status === "DONE" && <BigButton tone="secondary" className="mt-1 h-10" onClick={(e) => { e.stopPropagation(); run(`${m.machine} unloaded`, () => setLoads((ls) => ls.map((x) => (x.id === m.id ? { ...x, status: "FREE", items: 0, kind: "—" } : x)))); }}>Unload</BigButton>}
						</button>
					))}
				</SectionCard>
				<SectionCard title="Damaged linen" subtitle="Write-offs need the supervisor" bodyClassName="gap-3 pt-2">
					<ul className="flex flex-col gap-2">{stock.filter((l) => l.damaged > 0).map((l) => <li key={l.id} className="flex items-center justify-between rounded-control bg-subtle px-3 py-2 text-[13px]"><span className="font-medium text-ink">{l.name}</span><span className="text-ink-2">{l.damaged} waiting</span></li>)}</ul>
					<BigButton tone="dangerSoft" onClick={() => setPanel("damaged")}><TrashIcon className="size-5" /> Report damaged linen</BigButton>
				</SectionCard>
			</div>
			<SectionCard title="Stock by type" flush>
				<table className="w-full text-left">
					<thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-3">Type</th><th className="py-3">Dirty here</th><th className="py-3">Clean here</th><th className="py-3">On floors</th><th className="py-3 pr-5">Of par</th></tr></thead>
					<tbody>{stock.map((l) => <tr key={l.id} className="border-b border-line last:border-b-0"><td className="px-5 py-3 text-[15px] font-semibold text-ink">{l.name}</td><td className="py-3 text-[15px]">{l.dirty}</td><td className="py-3 text-[15px]">{l.inLaundry}</td><td className="py-3 text-[15px] text-ink-2">{l.clean}</td><td className="py-3 pr-5"><div className="w-40"><ProgressBar value={l.clean + l.inLaundry} max={l.par} /></div></td></tr>)}</tbody>
				</table>
			</SectionCard>
			<SectionCard title="Today's movements" flush>
				<ul className="divide-y divide-line">{log.map((m) => <li key={m.id} className="flex items-center gap-3 px-5 py-3"><span className={cn("flex size-8 items-center justify-center rounded-lg", m.direction === "IN" ? "bg-warning-soft text-warning" : "bg-success-soft text-success")}>{m.direction === "IN" ? <ArrowDownToLineIcon className="size-4" /> : <ArrowUpFromLineIcon className="size-4" />}</span><div className="min-w-0 flex-1"><p className="text-[15px] font-semibold text-ink">{m.direction === "IN" ? "Received from" : "Sent to"} {m.from}</p><p className="text-[13px] text-ink-3">{m.items.map((i) => `${i.qty} ${i.name}`).join(", ")} · {m.by}</p></div><span className="text-xs text-ink-3">{fmtTime(m.at)}</span></li>)}</ul>
			</SectionCard>

			<SidePanel open={panel === "in" || panel === "out"} onOpenChange={(o) => !o && setPanel(null)} title={panel === "in" ? "Count linen in" : "Send clean linen"} subtitle={panel === "in" ? "Dirty linen from a floor trolley" : "Clean linen going up to a floor"} icon={panel === "in" ? ArrowDownToLineIcon : ArrowUpFromLineIcon}
				footerInfo={plural(total, "piece")}
				footer={<><BigButton tone="secondary" onClick={() => setPanel(null)}>Cancel</BigButton><BigButton pending={pending} disabled={total === 0} onClick={() => { const d = panel === "in" ? "IN" : "OUT"; run(d === "IN" ? `${total} pieces counted in from ${floor}` : `${total} clean pieces sent to ${floor} · housekeeping told`, () => { applyMove(d); setPanel(null); }); }}>{panel === "in" ? "Count in" : "Mark sent"}</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label={panel === "in" ? "From" : "To"} value={floor} onChange={setFloor} options={floors} />
					<ul className="divide-y divide-line rounded-control border border-line">{stock.map((l) => <li key={l.id} className="flex items-center gap-3 px-4 py-2"><span className="flex-1 text-[15px] font-medium text-ink">{l.name}</span>{panel === "out" && <span className="text-xs text-ink-3">{l.inLaundry} clean</span>}<Stepper value={counts[l.name] ?? 0} onChange={(v) => setCounts({ ...counts, [l.name]: v })} max={panel === "out" ? l.inLaundry : 999} /></li>)}</ul>
					{panel === "out" && <Note tone="info">Housekeeping gets an alert that the trolley is on its way.</Note>}
				</div>
			</SidePanel>

			<Modal open={panel === "load"} onOpenChange={(o) => !o && setPanel(null)} title={`Start ${machine}`} subtitle="What's going in" icon={WashingMachineIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setPanel(null)}>Cancel</BigButton><BigButton pending={pending} onClick={() => run(`${machine} started · ready in 55 min`, () => { setLoads((ls) => ls.map((m) => (m.machine === machine ? { ...m, status: "RUNNING", kind, items: 30, startedAt: new Date().toISOString(), readyAt: new Date(Date.now() + 55 * 60000).toISOString() } : m))); setPanel(null); })}>Start load</BigButton></>}>
				<div className="flex flex-col gap-4"><SelectField label="Load" value={kind} onChange={setKind} options={["Towels", "Bed sheets", "Pillowcases", "Guest clothes", "Mixed"]} /><Note tone="info">The timer shows on the machine card; you'll get an alert when it's done.</Note></div>
			</Modal>

			<Modal open={panel === "damaged"} onOpenChange={(o) => !o && setPanel(null)} title="Damaged linen" subtitle="Goes to the housekeeping supervisor as a write-off request" icon={TrashIcon} tone="danger" size="form"
				footer={<><BigButton tone="secondary" onClick={() => setPanel(null)}>Cancel</BigButton><BigButton tone="danger" pending={pending} onClick={() => run("Write-off request sent to the supervisor", () => { setStock((st) => st.map((l) => (l.name === damaged.type ? { ...l, damaged: l.damaged + damaged.qty } : l))); setPanel(null); }, { tone: "warning" })}>Send request</BigButton></>}>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3"><SelectField label="Type" value={damaged.type} onChange={(v) => setDamaged({ ...damaged, type: v })} options={stock.map((l) => l.name)} /><div className="flex flex-col gap-[6px]"><span className="text-[13px] font-medium text-ink-2">How many</span><Stepper value={damaged.qty} onChange={(v) => setDamaged({ ...damaged, qty: v })} min={1} /></div></div>
					<SelectField label="What happened" value={damaged.reason} onChange={(v) => setDamaged({ ...damaged, reason: v })} options={["Torn", "Bleach stains", "Burn", "Worn out", "Missing after wash"]} setupLink="reasons" />
					<TextareaField label="Note" value={damaged.note} onChange={(v) => setDamaged({ ...damaged, note: v })} rows={2} />
					<WhatHappens tone="warning" items={[`About ${naira(4200 * damaged.qty)} of linen leaves the count if approved`, "The supervisor approves or declines on their Inspect screen"]} />
					<PanelSection><span /></PanelSection>
				</div>
			</Modal>
		</>
	);
}
