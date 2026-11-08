"use client";

import { CheckIcon, DoorClosedIcon, MessageSquarePlusIcon, PackageIcon, UserRoundIcon, WrenchIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note, Timeline } from "@/components/shared/detail-list";
import { SelectField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtAgo, fmtWhen, naira, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { RepairRow, SparePartRow, StaffRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";
import { BigButton, BoardCard, ShiftPill, Stepper } from "../shared-staff/tablet";

const priorityTone: Record<RepairRow["priority"], "danger" | "warning" | "info" | "grey"> = { URGENT: "danger", HIGH: "warning", NORMAL: "info", LOW: "grey" };
const statusLabel: Record<RepairRow["status"], string> = { OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In progress", WAITING_PARTS: "Waiting parts", DONE: "Done", CANCELLED: "Cancelled" };

type Sub = "update" | "parts" | "reassign" | "done" | null;

/** Maintenance · My repairs (3247:13987) with details, add update, ask for parts, reassign, mark done. */
export function RepairsScreen({ repairs, me, technicians, parts }: { repairs: RepairRow[]; me: string; technicians: StaffRow[]; parts: SparePartRow[] }) {
	const [rows, setRows] = useState(repairs);
	const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("mine"));
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [sub, setSub] = useState<Sub>(null);
	const [note, setNote] = useState("");
	const [partReq, setPartReq] = useState<Record<string, number>>({});
	const [to, setTo] = useState("");
	const [ooo, setOoo] = useState(false);
	const { run, pending } = useDemoAction();

	const current = rows.find((r) => r.id === open) ?? null;
	const openRows = rows.filter((r) => r.status !== "DONE" && r.status !== "CANCELLED");
	const mine = openRows.filter((r) => r.assignedTo === me);
	const list = tab === "mine" ? mine : tab === "done" ? rows.filter((r) => r.status === "DONE" || r.status === "CANCELLED") : openRows;
	const close = () => { void setOpen(null); setSub(null); setNote(""); };
	const update = (id: string, patch: Partial<RepairRow>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
	const addUpdate = (id: string, text: string) => setRows((r) => r.map((x) => (x.id === id ? { ...x, updates: [...x.updates, { at: new Date().toISOString(), by: me, note: text }] } : x)));

	return (
		<>
			<PageHeader title="My repairs" subtitle={`${me} · ${plural(mine.length, "repair")} on me · ${openRows.filter((r) => r.priority === "URGENT").length} urgent in the hotel`}>
				<ShiftPill until="4pm" />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="On me" value={mine.length} icon={WrenchIcon} />
				<KpiCard label="Urgent" value={openRows.filter((r) => r.priority === "URGENT").length} icon={WrenchIcon} hint="Rooms that can't be sold" />
				<KpiCard label="Waiting for parts" value={openRows.filter((r) => r.status === "WAITING_PARTS").length} icon={PackageIcon} />
				<KpiCard label="Done this week" value={rows.filter((r) => r.status === "DONE").length} icon={CheckIcon} />
			</div>
			<PillTabs tabs={[{ key: "mine", label: "Mine", count: mine.length }, { key: "open", label: "All open", count: openRows.length }, { key: "done", label: "Done", count: rows.filter((r) => r.status === "DONE" || r.status === "CANCELLED").length }]} value={tab} onChange={(k) => void setTab(k === "mine" ? null : k)} />
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
				{list.length === 0 && <Note tone="success" className="col-span-full">Nothing here.</Note>}
				{[...list].sort((a, b) => ["URGENT", "HIGH", "NORMAL", "LOW"].indexOf(a.priority) - ["URGENT", "HIGH", "NORMAL", "LOW"].indexOf(b.priority)).map((r) => (
					<BoardCard key={r.id} onClick={() => void setOpen(r.id)} accent={r.priority === "URGENT" && r.status !== "DONE" ? "warning" : "none"}>
						<div className="flex items-center justify-between"><span className="text-[15px] font-bold text-ink">{r.roomNumber ? `Room ${r.roomNumber}` : r.area}</span><StatusPill tone={priorityTone[r.priority]} dot={false}>{r.priority === "URGENT" ? "Urgent" : r.priority === "HIGH" ? "High" : r.priority === "NORMAL" ? "Normal" : "Low"}</StatusPill></div>
						<p className="text-[15px] font-medium text-ink">{r.title}</p>
						<p className="text-[13px] text-ink-3">{r.reportedBy} · {fmtAgo(r.createdAt)}{r.assignedTo ? ` · ${r.assignedTo === me ? "you" : r.assignedTo}` : " · unassigned"}</p>
						<div className="flex items-center justify-between"><StatusPill tone={r.status === "IN_PROGRESS" ? "info" : r.status === "WAITING_PARTS" ? "warning" : r.status === "DONE" ? "success" : "grey"}>{statusLabel[r.status]}</StatusPill>{r.roomOutOfOrder && <span className="text-xs font-semibold text-danger">Room out of order</span>}</div>
					</BoardCard>
				))}
			</div>

			<SidePanel open={!!current} onOpenChange={(o) => !o && close()} title={current?.title ?? ""} subtitle={current ? `${current.roomNumber ? `Room ${current.roomNumber}` : current.area} · reported by ${current.reportedBy} · ${fmtWhen(current.createdAt)}` : undefined} icon={WrenchIcon} width="lg"
				footer={current && current.status !== "DONE" && current.status !== "CANCELLED" ? (
					<>
						<BigButton tone="ghost" onClick={() => { setTo(""); setSub("reassign"); }}><UserRoundIcon className="size-5" /> Reassign</BigButton>
						<BigButton tone="secondary" onClick={() => { setPartReq({}); setSub("parts"); }}><PackageIcon className="size-5" /> Ask for parts</BigButton>
						{!current.assignedTo ? <BigButton pending={pending} onClick={() => run("Repair is on you", () => update(current.id, { assignedTo: me, status: "ASSIGNED" }))}>Take it</BigButton> : current.status !== "IN_PROGRESS" && current.status !== "WAITING_PARTS" ? <BigButton pending={pending} onClick={() => run("Started", () => { update(current.id, { status: "IN_PROGRESS" }); addUpdate(current.id, "Started work"); })}>Start</BigButton> : <BigButton onClick={() => { setNote(""); setSub("done"); }}><CheckIcon className="size-5" /> Mark done</BigButton>}
					</>
				) : current ? <BigButton tone="secondary" onClick={close}>Close</BigButton> : undefined}>
				{current && (
					<div className="flex flex-col gap-5">
						{current.roomOutOfOrder && <Note tone="danger">Room {current.roomNumber} is out of order until this is done. Front office can't sell it.</Note>}
						<DetailList columns={2} items={[{ label: "Status", value: <StatusPill tone={current.status === "IN_PROGRESS" ? "info" : current.status === "WAITING_PARTS" ? "warning" : current.status === "DONE" ? "success" : "grey"}>{statusLabel[current.status]}</StatusPill> }, { label: "Priority", value: <StatusPill tone={priorityTone[current.priority]} dot={false}>{current.priority.toLowerCase()}</StatusPill> }, { label: "Assigned to", value: current.assignedTo ?? "Nobody yet" }, { label: "Source", value: current.source }]} />
						{current.description && <p className="rounded-control bg-subtle px-4 py-3 text-[15px] text-ink">{current.description}</p>}
						{current.quotes && current.quotes.length > 0 && (
							<PanelSection title="Quotes">
								<ul className="divide-y divide-line rounded-control border border-line">{current.quotes.map((q) => <li key={q.vendor} className="flex items-center justify-between px-4 py-3 text-[15px]"><span className="font-medium text-ink">{q.vendor}</span><span className="flex items-center gap-2">{naira(q.amount)}{q.chosen && <StatusPill tone="success" dot={false}>Chosen</StatusPill>}</span></li>)}</ul>
							</PanelSection>
						)}
						<PanelSection title="Updates">
							{current.updates.length === 0 ? <p className="text-[13px] text-ink-3">No updates yet.</p> : <Timeline items={[...current.updates].reverse().map((u) => ({ at: fmtWhen(u.at), by: u.by, text: u.note }))} />}
							{current.status !== "DONE" && current.status !== "CANCELLED" && <BigButton tone="secondary" onClick={() => { setNote(""); setSub("update"); }}><MessageSquarePlusIcon className="size-5" /> Add an update</BigButton>}
						</PanelSection>
						{current.status !== "DONE" && current.roomNumber && (
							<ToggleField label="Room out of order" hint="Stops front office selling the room until you clear it" checked={!!current.roomOutOfOrder} onChange={(v) => run(v ? `Room ${current.roomNumber} out of order · front office told` : `Room ${current.roomNumber} back in service`, () => update(current.id, { roomOutOfOrder: v }), v ? { tone: "warning" } : undefined)} />
						)}
					</div>
				)}
			</SidePanel>

			<Modal open={sub === "update"} onOpenChange={(o) => !o && setSub(null)} title="Add an update" subtitle={current?.title} icon={MessageSquarePlusIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setSub(null)}>Cancel</BigButton><BigButton pending={pending} disabled={!note} onClick={() => current && run("Update added · reporter told", () => { addUpdate(current.id, note); setSub(null); })}>Add update</BigButton></>}>
				<TextareaField label="What's the situation" value={note} onChange={setNote} placeholder="e.g. compressor is dead, need a quote" />
			</Modal>

			<Modal open={sub === "parts"} onOpenChange={(o) => !o && setSub(null)} title="Ask for parts" subtitle="From spare parts, or the main store orders it" icon={PackageIcon} size="form"
				footer={<><BigButton tone="secondary" onClick={() => setSub(null)}>Cancel</BigButton><BigButton pending={pending} disabled={Object.values(partReq).every((q) => !q)} onClick={() => current && run("Parts requested · repair waiting for parts", () => { update(current.id, { status: "WAITING_PARTS" }); addUpdate(current.id, `Asked for ${Object.entries(partReq).filter(([, q]) => q > 0).map(([n, q]) => `${q} × ${n}`).join(", ")}`); setSub(null); }, { tone: "info" })}>Send request</BigButton></>}>
				<div className="flex flex-col gap-4">
					<ul className="divide-y divide-line rounded-control border border-line">{parts.map((p) => <li key={p.id} className="flex items-center gap-3 px-4 py-2"><span className="min-w-0 flex-1"><span className="block text-[15px] font-medium text-ink">{p.name}</span><span className={cn("block text-xs", p.quantity <= p.minQuantity ? "text-warning" : "text-ink-3")}>{p.quantity} in stock</span></span><Stepper value={partReq[p.name] ?? 0} onChange={(v) => setPartReq({ ...partReq, [p.name]: v })} /></li>)}</ul>
					<TextareaField label="Anything not on the list" value={note} onChange={setNote} rows={2} placeholder="e.g. 1.5HP AC compressor · Alaba Electricals quoted ₦162,000" />
					<WhatHappens items={["Parts in stock are issued at once", "Anything else goes to the manager as a purchase to approve", "This repair shows as Waiting parts until they arrive"]} />
				</div>
			</Modal>

			<Modal open={sub === "reassign"} onOpenChange={(o) => !o && setSub(null)} title="Reassign" subtitle={current?.title} icon={UserRoundIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setSub(null)}>Cancel</BigButton><BigButton pending={pending} disabled={!to} onClick={() => current && run(`Reassigned to ${to}`, () => { update(current.id, { assignedTo: to, status: "ASSIGNED" }); addUpdate(current.id, `Handed to ${to}`); setSub(null); })}>Reassign</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="To" value={to} onChange={setTo} options={technicians.map((t) => ({ value: t.fullName, label: t.fullName, hint: t.jobTitle }))} placeholder="Pick a colleague" />
					<TextareaField label="Why (optional)" value={note} onChange={setNote} rows={2} />
				</div>
			</Modal>

			<Modal open={sub === "done"} onOpenChange={(o) => !o && setSub(null)} title="Mark done" subtitle={current?.title} icon={CheckIcon} size="form"
				footer={<><BigButton tone="secondary" onClick={() => setSub(null)}>Cancel</BigButton><BigButton pending={pending} disabled={!note} onClick={() => current && run(`Done · ${current.reportedBy} told${current.roomOutOfOrder || ooo ? " · room back in service" : ""}`, () => { update(current.id, { status: "DONE", doneAt: new Date().toISOString(), roomOutOfOrder: false }); addUpdate(current.id, `Done: ${note}`); close(); })}>Mark done</BigButton></>}>
				<div className="flex flex-col gap-4">
					<TextareaField label="What was done" value={note} onChange={setNote} placeholder="e.g. refilled gas, cleaned filter, tested cold" />
					{current?.roomNumber && <ToggleField label="Put the room back in service" hint="Housekeeping gets a clean task so it can be sold" checked={ooo || !!current.roomOutOfOrder} onChange={setOoo} />}
					<WhatHappens items={["The person who reported it gets an alert", "It moves to Done and counts on the maintenance log"]} />
					<span className="hidden"><DoorClosedIcon /></span>
				</div>
			</Modal>
		</>
	);
}
