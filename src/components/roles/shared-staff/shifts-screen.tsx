"use client";

import { ArrowRightLeftIcon, CalendarDaysIcon, ClockIcon, GlobeIcon, KeyRoundIcon, LogInIcon, LogOutIcon, PalmtreeIcon, TimerIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { AvatarName, DetailList, Note } from "@/components/shared/detail-list";
import { SelectField, TextField, TextareaField } from "@/components/shared/field";
import { fmtDay, humanize, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { ShiftRow, StaffRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";
import { BigButton } from "./tablet";

type Panel = { kind: "shift"; id: string } | { kind: "swap"; id: string } | { kind: "leave" } | { kind: "clockout" } | { kind: "pin" } | { kind: "lang" } | { kind: "idle" } | null;

/**
 * Staff · Shared: clock in / out (3223:20170, 3222:20725), my shifts (3219:20130), shift details
 * (3222:20196), swap (3222:20364), ask for leave (3222:20545), change PIN (3222:21041), language
 * (3222:21187) and the "still there?" idle check (3222:21317).
 */
export function ShiftsScreen({ me, shifts, colleagues }: { me: StaffRow; shifts: ShiftRow[]; colleagues: StaffRow[] }) {
	const [rows, setRows] = useState(shifts);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const [clockedIn, setClockedIn] = useState(true);
	const [elapsed, setElapsed] = useState(0);
	const [withWho, setWithWho] = useState("");
	const [reason, setReason] = useState("");
	const [leave, setLeave] = useState({ from: "", to: "", why: "Annual leave", note: "" });
	const [pin, setPin] = useState({ current: "", next: "", again: "" });
	const [lang, setLang] = useState("English");
	const { run, pending } = useDemoAction();

	useEffect(() => { if (open && !panel) setPanel({ kind: "shift", id: open }); }, [open, panel]);
	useEffect(() => {
		if (!clockedIn) return;
		const start = new Date(); start.setHours(6, 58, 0, 0);
		const t = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000))), 1000);
		return () => clearInterval(t);
	}, [clockedIn]);

	const close = () => { setPanel(null); void setOpen(null); };
	const today = new Date().toISOString().slice(0, 10);
	const todayShift = rows.find((s) => s.date === today);
	const current = panel && "id" in panel ? rows.find((s) => s.id === panel.id) ?? null : null;
	const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
	const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
	const upcoming = rows.filter((s) => s.date >= today);
	const past = rows.filter((s) => s.date < today);

	return (
		<>
			<PageHeader title="My shifts" subtitle={`${me.fullName} · ${me.jobTitle} · ${me.shift} shift`}>
				<BigButton tone="secondary" onClick={() => setPanel({ kind: "leave" })}><PalmtreeIcon className="size-5" /> Ask for leave</BigButton>
				<BigButton tone="ghost" onClick={() => setPanel({ kind: "idle" })}><TimerIcon className="size-5" /> Idle check demo</BigButton>
			</PageHeader>

			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<div className={cn("flex items-center gap-6 rounded-card border p-6", clockedIn ? "border-success/30 bg-success-soft/40" : "border-line bg-card")}>
					<span className={cn("flex size-16 items-center justify-center rounded-2xl", clockedIn ? "bg-success text-white" : "bg-subtle text-ink-3")}><ClockIcon className="size-8" /></span>
					<div className="min-w-0 flex-1">
						<p className="text-[13px] font-medium text-ink-2">{clockedIn ? "On shift since 6:58am" : "Not clocked in"}</p>
						<p className="text-[34px] font-bold leading-none text-ink">{clockedIn ? `${hh}:${mm}` : "—"}</p>
						<p className="mt-1 text-[13px] text-ink-3">{todayShift ? `Today · ${todayShift.starts} – ${todayShift.ends} · ${me.department}` : "No shift scheduled today"}</p>
					</div>
					{clockedIn ? <BigButton tone="secondary" onClick={() => setPanel({ kind: "clockout" })}><LogOutIcon className="size-5" /> Clock out</BigButton> : <BigButton pending={pending} onClick={() => run("Clocked in · have a good shift", () => setClockedIn(true))}><LogInIcon className="size-5" /> Clock in</BigButton>}
				</div>
				<SectionCard title="Me" bodyClassName="gap-3 pt-2">
					<AvatarName name={me.fullName} secondary={`${me.email} · ${me.phone}`} size="lg" />
					<div className="grid grid-cols-2 gap-2">
						<BigButton tone="secondary" className="h-11" onClick={() => { setPin({ current: "", next: "", again: "" }); setPanel({ kind: "pin" }); }}><KeyRoundIcon className="size-4" /> Change PIN</BigButton>
						<BigButton tone="secondary" className="h-11" onClick={() => setPanel({ kind: "lang" })}><GlobeIcon className="size-4" /> {lang}</BigButton>
					</div>
				</SectionCard>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="This week" value={plural(upcoming.length + past.length, "shift")} icon={CalendarDaysIcon} />
				<KpiCard label="Hours scheduled" value={`${(upcoming.length + past.length) * 8}h`} icon={ClockIcon} />
				<KpiCard label="Leave left" value="12 days" icon={PalmtreeIcon} hint="Of 20 this year" />
				<KpiCard label="Swaps pending" value={rows.filter((s) => s.status === "SWAPPED").length} icon={ArrowRightLeftIcon} />
			</div>

			<SectionCard title="This week" subtitle="Tap a shift for details, a swap or cover" flush>
				<ul className="divide-y divide-line">
					{[...past, ...upcoming].map((s) => (
						<li key={s.id}>
							<button type="button" onClick={() => { setPanel({ kind: "shift", id: s.id }); void setOpen(s.id); }} className={cn("flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-subtle/60", s.date === today && "bg-brand-soft/20")}>
								<span className="w-28 text-[15px] font-bold text-ink">{fmtDay(s.date)}</span>
								<span className="flex-1 text-[15px] text-ink">{s.starts} – {s.ends} <span className="text-ink-3">· {humanize(s.role)}</span></span>
								<StatusPill tone={s.status === "PRESENT" ? "success" : s.status === "ABSENT" ? "danger" : s.status === "SWAPPED" ? "info" : s.status === "COVERED" ? "warning" : "grey"}>{s.status === "SCHEDULED" ? "Scheduled" : humanize(s.status)}</StatusPill>
							</button>
						</li>
					))}
				</ul>
			</SectionCard>

			{/* Shift details */}
			<SidePanel open={panel?.kind === "shift" && !!current} onOpenChange={(o) => !o && close()} title={current ? `${fmtDay(current.date)} · ${current.starts} – ${current.ends}` : ""} subtitle={current ? `${humanize(current.role)} · ${me.department}` : undefined} icon={CalendarDaysIcon}
				footer={current && current.date >= today ? <><BigButton tone="secondary" onClick={() => { setWithWho(""); setReason(""); setPanel({ kind: "swap", id: current.id }); }}><ArrowRightLeftIcon className="size-5" /> Ask to swap</BigButton><BigButton tone="secondary" pending={pending} onClick={() => run("Cover request sent to your manager", close, { tone: "info" })}>Ask for cover</BigButton></> : <BigButton tone="secondary" onClick={close}>Close</BigButton>}>
				{current && (
					<div className="flex flex-col gap-5">
						<DetailList columns={2} items={[{ label: "Date", value: fmtDay(current.date) }, { label: "Hours", value: `${current.starts} – ${current.ends}` }, { label: "Status", value: humanize(current.status) }, { label: "Department", value: me.department }]} />
						<PanelSection title="Also on this shift">
							<div className="grid grid-cols-2 gap-2">{colleagues.filter((c) => c.shift === me.shift && c.id !== me.id).slice(0, 4).map((c) => <div key={c.id} className="rounded-control border border-line px-3 py-2"><AvatarName name={c.fullName} secondary={c.jobTitle} size="sm" /></div>)}</div>
						</PanelSection>
						<Note tone="info">Swaps need the other person to accept and your manager to approve.</Note>
					</div>
				)}
			</SidePanel>

			{/* Swap */}
			<Modal open={panel?.kind === "swap"} onOpenChange={(o) => !o && setPanel(current ? { kind: "shift", id: current.id } : null)} title="Ask to swap" subtitle={current ? `${fmtDay(current.date)} · ${current.starts} – ${current.ends}` : undefined} icon={ArrowRightLeftIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setPanel(current ? { kind: "shift", id: current.id } : null)}>Back</BigButton><BigButton pending={pending} disabled={!withWho} onClick={() => current && run(`Swap request sent to ${withWho}`, () => { setRows((r) => r.map((s) => (s.id === current.id ? { ...s, status: "SWAPPED" } : s))); close(); }, { tone: "info" })}>Send request</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="Swap with" value={withWho} onChange={setWithWho} options={colleagues.filter((c) => c.id !== me.id).map((c) => ({ value: c.fullName, label: c.fullName, hint: `${c.jobTitle} · ${c.shift}` }))} placeholder="A colleague in your department" />
					<TextareaField label="Why (they'll see this)" value={reason} onChange={setReason} rows={2} placeholder="e.g. hospital appointment" />
					<WhatHappens items={["They accept or decline on their tablet", "Your manager approves the swap", "Both rotas update"]} />
				</div>
			</Modal>

			{/* Leave */}
			<SidePanel open={panel?.kind === "leave"} onOpenChange={(o) => !o && close()} title="Ask for leave" subtitle="12 days left this year" icon={PalmtreeIcon}
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} disabled={!leave.from || !leave.to} onClick={() => run("Leave request sent to your manager", close, { tone: "info" })}>Send request</BigButton></>}>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3"><TextField label="From" type="date" value={leave.from} onChange={(v) => setLeave({ ...leave, from: v })} required /><TextField label="To" type="date" value={leave.to} onChange={(v) => setLeave({ ...leave, to: v })} required /></div>
					<SelectField label="Type" value={leave.why} onChange={(v) => setLeave({ ...leave, why: v })} options={["Annual leave", "Sick leave", "Family emergency", "Unpaid leave"]} setupLink="leave types" />
					<TextareaField label="Note" value={leave.note} onChange={(v) => setLeave({ ...leave, note: v })} rows={2} />
					<WhatHappens items={["Your manager approves, declines or suggests other dates", "You get an alert when it's decided", "Approved leave shows on the rota so cover can be found"]} />
				</div>
			</SidePanel>

			{/* Clock out */}
			<Modal open={panel?.kind === "clockout"} onOpenChange={(o) => !o && close()} title="Clock out?" subtitle={`On shift ${hh}h ${mm}m · scheduled until ${todayShift?.ends ?? "—"}`} icon={LogOutIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={close}>Stay on</BigButton><BigButton pending={pending} onClick={() => run("Clocked out · see you tomorrow", () => { setClockedIn(false); close(); })}>Clock out</BigButton></>}>
				<WhatHappens items={["Anything still assigned to you is handed to the next shift", "Your hours go to the attendance report", "Clocking out early is flagged to your manager"]} />
			</Modal>

			{/* Change PIN */}
			<Modal open={panel?.kind === "pin"} onOpenChange={(o) => !o && close()} title="Change PIN" subtitle="The 4 digits you sign in with on the tablet" icon={KeyRoundIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} disabled={pin.next.length !== 4 || pin.next !== pin.again || !pin.current} onClick={() => run("PIN changed", close)}>Change PIN</BigButton></>}>
				<div className="flex flex-col gap-4">
					<TextField label="Current PIN" type="password" value={pin.current} onChange={(v) => setPin({ ...pin, current: v.replace(/\D/g, "").slice(0, 4) })} />
					<div className="grid grid-cols-2 gap-3"><TextField label="New PIN" type="password" value={pin.next} onChange={(v) => setPin({ ...pin, next: v.replace(/\D/g, "").slice(0, 4) })} /><TextField label="Again" type="password" value={pin.again} onChange={(v) => setPin({ ...pin, again: v.replace(/\D/g, "").slice(0, 4) })} error={pin.again && pin.again !== pin.next ? "Doesn't match" : undefined} /></div>
					<Note tone="info">Forgot it? Your manager can reset it from Staff.</Note>
				</div>
			</Modal>

			{/* Language */}
			<Modal open={panel?.kind === "lang"} onOpenChange={(o) => !o && close()} title="Language" subtitle="For this tablet only" icon={GlobeIcon} size="confirm"
				footer={<BigButton onClick={() => run(`Language set to ${lang}`, close)}>Done</BigButton>}>
				<div className="grid grid-cols-2 gap-2">{["English", "Yorùbá", "Hausa", "Igbo", "Pidgin", "Français"].map((l) => <button key={l} type="button" onClick={() => setLang(l)} className={cn("h-12 rounded-control border text-[15px] font-semibold", lang === l ? "border-brand bg-brand-soft/40 text-brand" : "border-line text-ink hover:bg-subtle")}>{l}</button>)}</div>
			</Modal>

			{/* Still there? */}
			<Modal open={panel?.kind === "idle"} onOpenChange={(o) => !o && close()} title="Still there?" subtitle="You've been away for 5 minutes · the tablet locks in 30 seconds" icon={TimerIcon} size="confirm"
				footer={<><BigButton tone="secondary" pending={pending} onClick={() => run("Signed out · the next person can sign in", () => { setClockedIn(false); close(); }, { tone: "info" })}>Sign out</BigButton><BigButton onClick={close}>I'm here</BigButton></>}>
				<Note tone="warning">Shared tablets lock when nobody touches them so the next person signs in as themselves. Clock-in is not affected.</Note>
			</Modal>
		</>
	);
}
