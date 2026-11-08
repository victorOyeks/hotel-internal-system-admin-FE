"use client";

import { AlertTriangleIcon, CameraIcon, CheckIcon, ClipboardCheckIcon, MoonIcon, PlayIcon, ShirtIcon, SparklesIcon, WineIcon, WrenchIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtTime, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { CleaningTaskRow, RoomRow, StaffRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";
import { BigButton, RoomBadge, ShiftPill, Stepper } from "../shared-staff/tablet";

const minibar = [
	{ name: "Water · 75cl", price: 1000 },
	{ name: "Coca-Cola", price: 1200 },
	{ name: "Star Lager", price: 2000 },
	{ name: "Pringles", price: 2500 },
	{ name: "Peanuts", price: 1500 },
	{ name: "Chocolate bar", price: 1800 },
];

type Panel = { kind: "task"; id: string } | { kind: "minibar"; id: string } | { kind: "problem"; id?: string } | { kind: "linen" } | { kind: "cant"; id: string } | null;

function statusPill(t: CleaningTaskRow) {
	switch (t.status) {
		case "IN_PROGRESS": return <StatusPill tone="brand">Cleaning now</StatusPill>;
		case "DONE": return <StatusPill tone="info">Waiting inspection</StatusPill>;
		case "INSPECTED": return <StatusPill tone="success">Done</StatusPill>;
		case "SENT_BACK": return <StatusPill tone="danger">Sent back</StatusPill>;
		case "SKIPPED": return <StatusPill tone="grey">Do not disturb</StatusPill>;
		default: return <StatusPill tone="warning">To do</StatusPill>;
	}
}

/** Housekeeping · My rooms today (Figma 3238:14342) with the checklist, minibar, problem, linen and can't-clean flows. */
export function MyRoomsScreen({ tasks, rooms, me }: { tasks: CleaningTaskRow[]; rooms: RoomRow[]; me: StaffRow | null }) {
	const [list, setList] = useState(tasks);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const { run, pending } = useDemoAction();

	useEffect(() => {
		if (open && !panel) setPanel({ kind: "task", id: open });
	}, [open, panel]);

	const close = () => { setPanel(null); void setOpen(null); };
	const update = (id: string, patch: Partial<CleaningTaskRow>) => setList((ls) => ls.map((t) => (t.id === id ? { ...t, ...patch } : t)));
	const current = panel && "id" in panel && panel.id ? list.find((t) => t.id === panel.id) ?? null : null;
	const roomOf = (t: CleaningTaskRow) => rooms.find((r) => r.id === t.roomId);

	const done = list.filter((t) => t.status === "DONE" || t.status === "INSPECTED").length;
	const order = (t: CleaningTaskRow) => (t.status === "IN_PROGRESS" ? 0 : t.priority && t.status === "TODO" ? 1 : t.status === "SENT_BACK" ? 2 : t.status === "TODO" ? 3 : t.status === "SKIPPED" ? 4 : 5);
	const sorted = [...list].sort((a, b) => order(a) - order(b));

	// checklist panel state
	const [note, setNote] = useState("");
	const [reason, setReason] = useState("DND");
	const [retry, setRetry] = useState("15:00");
	const [problem, setProblem] = useState({ room: "", what: "", priority: "NORMAL" });
	const [linen, setLinen] = useState({ "Bath towel": 6, "Hand towel": 6, "Bed sheet": 4, Pillowcase: 8 });
	const [bar, setBar] = useState<Record<string, number>>({});

	return (
		<>
			<PageHeader title="My rooms today" subtitle={`Simpas Ikeja · ${me?.fullName ?? "Housekeeping"} · floor A2`}>
				<ShiftPill until="2pm" />
			</PageHeader>

			<div className="flex items-center gap-5 rounded-card border border-line bg-card px-5 py-4">
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<p className="text-[17px] font-bold text-ink">{done} of {list.length} rooms done</p>
					<ProgressBar value={done} max={list.length} />
				</div>
				<BigButton tone="secondary" onClick={() => setPanel({ kind: "linen" })}>
					<ShirtIcon className="size-5" /> Ask for linen
				</BigButton>
				<BigButton tone="secondary" onClick={() => { setProblem({ room: "", what: "", priority: "NORMAL" }); setPanel({ kind: "problem" }); }}>
					<WrenchIcon className="size-5" /> Report a problem
				</BigButton>
			</div>

			<ul className="flex flex-col gap-3">
				{sorted.map((t) => {
					const room = roomOf(t);
					const active = t.status === "IN_PROGRESS";
					const title = `${t.kind === "DEPARTURE" ? "Departure clean" : t.kind === "DEEP" ? "Deep clean" : "Stay-over"}${room?.guestName && t.kind === "STAYOVER" ? ` · ${room.guestName}` : ""} · ${room?.typeName ?? ""}`;
					const sub = t.status === "SKIPPED" ? `${t.note ?? "Do not disturb"} · try again after 3pm` : t.status === "SENT_BACK" ? `Sent back · ${t.note}` : t.status === "DONE" || t.status === "INSPECTED" ? `Done ${fmtTime(t.due)}` : active ? `${t.guestArrives ? `Arrival ${t.guestArrives} · ` : ""}Started ${fmtTime(new Date(Date.now() - 12 * 60000))}` : `${t.guestArrives ? `Arrival ${t.guestArrives}` : t.kind === "DEEP" ? "Scheduled" : "Guest out after 12pm"}${t.priority ? " · Next" : ""}`;
					return (
						<li key={t.id} className={cn("flex items-center gap-4 rounded-card border bg-card px-4 py-3", active ? "border-brand bg-brand-soft/20" : "border-line", (t.status === "INSPECTED" || t.status === "DONE") && "opacity-70")}>
							<RoomBadge number={t.roomNumber} active={active} />
							<button type="button" onClick={() => { setPanel({ kind: "task", id: t.id }); void setOpen(t.id); }} className="min-w-0 flex-1 text-left">
								<p className={cn("text-[15px] font-semibold", active ? "text-brand" : "text-ink")}>{title}</p>
								<p className="text-[13px] text-ink-3">{sub}</p>
							</button>
							{statusPill(t)}
							{t.status === "TODO" || t.status === "SENT_BACK" ? (
								<BigButton tone="secondary" onClick={() => { update(t.id, { status: "IN_PROGRESS" }); setPanel({ kind: "task", id: t.id }); void setOpen(t.id); }}>
									<PlayIcon className="size-4" /> Start
								</BigButton>
							) : active ? (
								<BigButton onClick={() => { setPanel({ kind: "task", id: t.id }); void setOpen(t.id); }}>
									<PlayIcon className="size-4" /> Continue
								</BigButton>
							) : t.status === "SKIPPED" ? (
								<BigButton tone="secondary" onClick={() => update(t.id, { status: "TODO", note: undefined })}>
									<MoonIcon className="size-4" /> Try again
								</BigButton>
							) : null}
						</li>
					);
				})}
			</ul>

			{/* Checklist panel */}
			<SidePanel open={panel?.kind === "task" && !!current} onOpenChange={(o) => !o && close()} title={current ? `Room ${current.roomNumber}` : ""} subtitle={current ? `${current.kind === "DEPARTURE" ? "Departure clean" : current.kind === "DEEP" ? "Deep clean" : "Stay-over"} · ${roomOf(current)?.typeName ?? ""}${current.guestArrives ? ` · guest arrives ${current.guestArrives}` : ""}` : undefined} icon={SparklesIcon} width="lg"
				footerInfo={current ? `${current.checklist.filter((c) => c.done).length} of ${current.checklist.length} ticked` : undefined}
				footer={current && (current.status === "IN_PROGRESS" || current.status === "TODO" || current.status === "SENT_BACK") ? (
					<>
						<BigButton tone="ghost" onClick={() => setPanel({ kind: "cant", id: current.id })}>Can't clean</BigButton>
						<BigButton pending={pending} disabled={!current.checklist.every((c) => c.done)} onClick={() => run(`Room ${current.roomNumber} done · sent for inspection`, () => { update(current.id, { status: "DONE" }); close(); })}>
							<CheckIcon className="size-5" /> Mark done
						</BigButton>
					</>
				) : current ? <BigButton tone="secondary" onClick={close}>Close</BigButton> : undefined}>
				{current && (
					<div className="flex flex-col gap-5">
						{current.status === "SENT_BACK" && <Note tone="danger">Sent back by Grace Okafor: {current.note}</Note>}
						{current.status === "DONE" && <Note tone="info">Waiting for the supervisor to inspect.</Note>}
						{current.status === "INSPECTED" && <Note tone="success">Inspected and passed.</Note>}
						<PanelSection title="Checklist">
							<ul className="flex flex-col gap-2">
								{current.checklist.map((c, i) => (
									<li key={c.label}>
										<button type="button" disabled={current.status === "DONE" || current.status === "INSPECTED"} onClick={() => update(current.id, { status: current.status === "TODO" ? "IN_PROGRESS" : current.status, checklist: current.checklist.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })} className={cn("flex h-14 w-full items-center gap-3 rounded-control border px-4 text-left text-[15px] font-medium", c.done ? "border-success/40 bg-success-soft text-ink" : "border-line bg-card text-ink hover:bg-subtle")}>
											<span className={cn("flex size-7 items-center justify-center rounded-full border-2", c.done ? "border-success bg-success text-white" : "border-line-strong")}>{c.done && <CheckIcon className="size-4" />}</span>
											{c.label}
										</button>
									</li>
								))}
							</ul>
						</PanelSection>
						<div className="grid grid-cols-3 gap-2">
							<BigButton tone="secondary" onClick={() => { setBar({}); setPanel({ kind: "minibar", id: current.id }); }}><WineIcon className="size-5" /> Minibar</BigButton>
							<BigButton tone="secondary" onClick={() => { setProblem({ room: current.roomNumber, what: "", priority: "NORMAL" }); setPanel({ kind: "problem", id: current.id }); }}><WrenchIcon className="size-5" /> Problem</BigButton>
							<BigButton tone="secondary" onClick={() => run("Photo added", undefined, { tone: "info" })}><CameraIcon className="size-5" /> Photo</BigButton>
						</div>
						<TextareaField label="Note for the supervisor" value={note} onChange={setNote} placeholder="e.g. stain on the carpet near the window" rows={2} />
					</div>
				)}
			</SidePanel>

			{/* Minibar panel */}
			<SidePanel open={panel?.kind === "minibar"} onOpenChange={(o) => !o && setPanel(current ? { kind: "task", id: current.id } : null)} title="Minibar" subtitle={current ? `Room ${current.roomNumber} · what was used goes on the guest's bill` : undefined} icon={WineIcon}
				footerInfo={`${naira(Object.entries(bar).reduce((s, [n, q]) => s + (minibar.find((m) => m.name === n)?.price ?? 0) * q, 0))} to post`}
				footer={<><BigButton tone="secondary" onClick={() => setPanel(current ? { kind: "task", id: current.id } : null)}>Back</BigButton><BigButton pending={pending} disabled={Object.values(bar).every((q) => !q)} onClick={() => run("Minibar charges posted to the folio", () => setPanel(current ? { kind: "task", id: current.id } : null))}>Post charges</BigButton></>}>
				<ul className="divide-y divide-line rounded-control border border-line">
					{minibar.map((m) => (
						<li key={m.name} className="flex items-center gap-3 px-4 py-3">
							<span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink">{m.name}</span><span className="block text-xs text-ink-3">{naira(m.price)}</span></span>
							<Stepper value={bar[m.name] ?? 0} onChange={(v) => setBar({ ...bar, [m.name]: v })} />
						</li>
					))}
				</ul>
				<p className="mt-3 text-xs text-ink-3">Restock what was used from the housekeeping store. Prices come from Hotel setup → Charges.</p>
			</SidePanel>

			{/* Report problem */}
			<SidePanel open={panel?.kind === "problem"} onOpenChange={(o) => !o && (current ? setPanel({ kind: "task", id: current.id }) : close())} title="Report a problem" subtitle="Goes to Maintenance as a repair" icon={WrenchIcon} tone={problem.priority === "URGENT" ? "danger" : "default"}
				footer={<><BigButton tone="secondary" onClick={() => (current ? setPanel({ kind: "task", id: current.id }) : close())}>Cancel</BigButton><BigButton pending={pending} disabled={!problem.what} onClick={() => run("Repair reported · Maintenance alerted", () => (current ? setPanel({ kind: "task", id: current.id }) : close()))}>Send to Maintenance</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="Where" value={problem.room} onChange={(v) => setProblem({ ...problem, room: v })} options={[...list.map((t) => ({ value: t.roomNumber, label: `Room ${t.roomNumber}` })), { value: "Floor 2 corridor", label: "Floor 2 corridor" }, { value: "Lobby", label: "Lobby" }]} placeholder="Room or area" required />
					<TextareaField label="What's wrong" value={problem.what} onChange={(v) => setProblem({ ...problem, what: v })} placeholder="e.g. AC blowing warm air, shower head leaking" />
					<ChoiceCards label="How urgent" value={problem.priority} onChange={(v) => setProblem({ ...problem, priority: v })} columns={3} options={[{ value: "LOW", label: "Can wait" }, { value: "NORMAL", label: "Today" }, { value: "URGENT", label: "Now", hint: "Room can't be sold" }]} />
					<BigButton tone="secondary" onClick={() => run("Photo added", undefined, { tone: "info" })}><CameraIcon className="size-5" /> Add a photo</BigButton>
					{problem.priority === "URGENT" && <WhatHappens tone="danger" items={["The room is put out of order until Maintenance clears it", "Front office is told so nobody is checked in there"]} />}
				</div>
			</SidePanel>

			{/* Ask for linen */}
			<Modal open={panel?.kind === "linen"} onOpenChange={(o) => !o && close()} title="Ask for linen" subtitle="Laundry brings it to your floor" icon={ShirtIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} onClick={() => run("Linen request sent to Laundry", close, { tone: "info" })}>Send request</BigButton></>}>
				<ul className="divide-y divide-line rounded-control border border-line">
					{Object.entries(linen).map(([n, q]) => (
						<li key={n} className="flex items-center gap-3 px-4 py-3"><span className="flex-1 text-[15px] font-medium text-ink">{n}</span><Stepper value={q} onChange={(v) => setLinen({ ...linen, [n]: v })} /></li>
					))}
				</ul>
				<p className="mt-3 text-xs text-ink-3">Deliver to: floor A2 trolley.</p>
			</Modal>

			{/* Can't clean */}
			<Modal open={panel?.kind === "cant"} onOpenChange={(o) => !o && (current ? setPanel({ kind: "task", id: current.id }) : close())} title={`Can't clean ${current?.roomNumber ?? ""}`} subtitle="Say why so the supervisor can plan" icon={AlertTriangleIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => (current ? setPanel({ kind: "task", id: current.id }) : close())}>Back</BigButton><BigButton pending={pending} onClick={() => current && run(`Room ${current.roomNumber} skipped · supervisor told`, () => { update(current.id, { status: reason === "OOO" ? "TODO" : "SKIPPED", note: reason === "DND" ? "Do not disturb" : reason === "GUEST" ? "Guest in the room" : "Out of order" }); close(); }, { tone: "warning" })}>Skip for now</BigButton></>}>
				<div className="flex flex-col gap-4">
					<ChoiceCards value={reason} onChange={setReason} options={[{ value: "DND", label: "Do not disturb sign", hint: "Try again later" }, { value: "GUEST", label: "Guest is in the room", hint: "They asked to come back" }, { value: "OOO", label: "Something is broken", hint: "Report it to Maintenance" }]} />
					{reason !== "OOO" && <TextField label="Try again at" type="time" value={retry} onChange={setRetry} />}
					{reason === "OOO" && <Note tone="warning">Use Report a problem after this so Maintenance gets it.</Note>}
				</div>
			</Modal>
			<span className="hidden"><ClipboardCheckIcon /></span>
		</>
	);
}
