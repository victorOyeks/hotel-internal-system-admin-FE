"use client";

import {
	ArrowRightLeftIcon,
	CalendarDaysIcon,
	ClockIcon,
	GlobeIcon,
	KeyRoundIcon,
	LogInIcon,
	LogOutIcon,
	PalmtreeIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtDay, humanize, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { useAction } from "@hospio/api/actions/use-action";
import {
	clockIn,
	clockOut,
	requestLeave,
	requestShiftChange,
} from "@hospio/api/actions/workforce";
import { setMyPin } from "@hospio/api/actions/identity";
import type {
	ClockStatus,
	LeaveRow,
	ShiftRow,
	StaffRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { BigButton } from "./tablet";

type Panel =
	| { kind: "shift"; id: string }
	| { kind: "swap"; id: string }
	| { kind: "leave" }
	| { kind: "clockout" }
	| { kind: "pin" }
	| { kind: "lang" }
	| null;

/**
 * Staff · Shared: clock in / out (3223:20170, 3222:20725), my shifts (3219:20130), shift details
 * (3222:20196), swap (3222:20364), ask for leave (3222:20545), change PIN (3222:21041), language
 * (3222:21187) and the "still there?" idle check (3222:21317).
 */
const lagosToday = () =>
	new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
		new Date(),
	);
const hoursOf = (s: ShiftRow) => {
	const [a, b] = [s.starts, s.ends].map(
		(t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)),
	);
	return Math.max(0, (b > a ? b - a : b + 1440 - a) / 60);
};
const leaveTone = {
	PENDING: "warning",
	APPROVED: "success",
	DECLINED: "danger",
	CHANGE_REQUESTED: "info",
} as const;

export function ShiftsScreen({
	me,
	shifts,
	colleagues,
	clock,
	leave: leaveRows,
}: {
	me: StaffRow;
	shifts: ShiftRow[];
	colleagues: StaffRow[];
	clock: ClockStatus;
	leave: LeaveRow[];
}) {
	const [rows, setRows] = useState(shifts);
	useEffect(() => setRows(shifts), [shifts]);
	const [asked, setAsked] = useState<Record<string, "SWAP" | "COVER">>({});
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const [clockedIn, setClockedIn] = useState(clock.clockedIn);
	const [since, setSince] = useState(clock.since);
	useEffect(() => {
		setClockedIn(clock.clockedIn);
		setSince(clock.since);
	}, [clock]);
	const [elapsed, setElapsed] = useState(0);
	const [withWho, setWithWho] = useState("");
	const [reason, setReason] = useState("");
	const [leave, setLeave] = useState({
		from: "",
		to: "",
		why: "Annual leave",
		note: "",
	});
	const [pin, setPin] = useState({ next: "", again: "", password: "" });
	const { run, pending } = useAction();

	useEffect(() => {
		if (open && !panel) setPanel({ kind: "shift", id: open });
	}, [open, panel]);
	useEffect(() => {
		if (!clockedIn) return;
		const start = since ? new Date(since).getTime() : Date.now();
		const tick = () =>
			setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
		tick();
		const t = setInterval(tick, 1000);
		return () => clearInterval(t);
	}, [clockedIn, since]);

	const close = () => {
		setPanel(null);
		void setOpen(null);
	};
	const today = lagosToday();
	const todayShift = rows.find((s) => s.date === today);
	const current =
		panel && "id" in panel
			? (rows.find((s) => s.id === panel.id) ?? null)
			: null;
	const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
	const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
	const upcoming = rows.filter((s) => s.date >= today);
	const past = rows.filter((s) => s.date < today);
	const scheduledHours = rows
		.filter((s) => s.status !== "CANCELLED")
		.reduce((h, s) => h + hoursOf(s), 0);
	const leaveDays = leaveRows
		.filter((l) => l.status === "APPROVED" && l.to >= today)
		.reduce((d, l) => d + l.days, 0);

	return (
		<>
			<PageHeader
				title="My shifts"
				subtitle={`${me.fullName} · ${me.jobTitle}${me.shift !== "—" ? ` · ${me.shift} shift` : ""}`}
			>
				<BigButton tone="secondary" onClick={() => setPanel({ kind: "leave" })}>
					<PalmtreeIcon className="size-5" /> Ask for leave
				</BigButton>
			</PageHeader>

			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<div
					className={cn(
						"flex items-center gap-6 rounded-card border p-6",
						clockedIn
							? "border-success/30 bg-success-soft/40"
							: "border-line bg-card",
					)}
				>
					<span
						className={cn(
							"flex size-16 items-center justify-center rounded-2xl",
							clockedIn ? "bg-success text-white" : "bg-subtle text-ink-3",
						)}
					>
						<ClockIcon className="size-8" />
					</span>
					<div className="min-w-0 flex-1">
						<p className="text-[13px] font-medium text-ink-2">
							{clockedIn
								? `On shift since ${since ? new Date(since).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }) : "now"}`
								: "Not clocked in"}
						</p>
						<p className="text-[34px] font-bold leading-none text-ink">
							{clockedIn ? `${hh}:${mm}` : "—"}
						</p>
						<p className="mt-1 text-[13px] text-ink-3">
							{todayShift
								? `Today · ${todayShift.starts} – ${todayShift.ends} · ${me.department}`
								: "No shift scheduled today"}
						</p>
					</div>
					{clockedIn ? (
						<BigButton
							tone="secondary"
							onClick={() => setPanel({ kind: "clockout" })}
						>
							<LogOutIcon className="size-5" /> Clock out
						</BigButton>
					) : (
						<BigButton
							pending={pending}
							onClick={() =>
								run(
									() => clockIn(),
									"Clocked in · have a good shift",
									(c) => {
										setClockedIn(c.clockedIn);
										setSince(c.since);
									},
								)
							}
						>
							<LogInIcon className="size-5" /> Clock in
						</BigButton>
					)}
				</div>
				<SectionCard title="Me" bodyClassName="gap-3 pt-2">
					<AvatarName
						name={me.fullName}
						secondary={`${me.email} · ${me.phone}`}
						size="lg"
					/>
					<div className="grid grid-cols-2 gap-2">
						<BigButton
							tone="secondary"
							className="h-11"
							onClick={() => {
								setPin({ next: "", again: "", password: "" });
								setPanel({ kind: "pin" });
							}}
						>
							<KeyRoundIcon className="size-4" /> Change PIN
						</BigButton>
						<BigButton
							tone="secondary"
							className="h-11"
							onClick={() => setPanel({ kind: "lang" })}
						>
							<GlobeIcon className="size-4" /> English
						</BigButton>
					</div>
				</SectionCard>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Shifts on the rota"
					value={plural(upcoming.length + past.length, "shift")}
					icon={CalendarDaysIcon}
				/>
				<KpiCard
					label="Hours scheduled"
					value={`${Math.round(scheduledHours)}h`}
					icon={ClockIcon}
				/>
				<KpiCard
					label="Leave booked"
					value={plural(leaveDays, "day")}
					icon={PalmtreeIcon}
					hint={`${leaveRows.filter((l) => l.status === "PENDING").length} request waiting`}
				/>
				<KpiCard
					label="Requests sent"
					value={
						Object.keys(asked).length +
						rows.filter((s) => s.status === "SWAPPED").length
					}
					icon={ArrowRightLeftIcon}
					hint="Swaps and cover waiting on your manager"
				/>
			</div>

			<SectionCard
				title="My shifts"
				subtitle="Tap a shift for details, a swap or cover"
				flush
			>
				<ul className="divide-y divide-line">
					{rows.length === 0 && (
						<li className="px-5 py-6 text-center text-sm text-ink-3">
							No shifts on the rota yet. Your manager adds them in Staff → Rota.
						</li>
					)}
					{[...past, ...upcoming].map((s) => (
						<li key={s.id}>
							<button
								type="button"
								onClick={() => {
									setPanel({ kind: "shift", id: s.id });
									void setOpen(s.id);
								}}
								className={cn(
									"flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-subtle/60",
									s.date === today && "bg-brand-soft/20",
								)}
							>
								<span className="w-28 text-[15px] font-bold text-ink">
									{fmtDay(s.date)}
								</span>
								<span className="flex-1 text-[15px] text-ink">
									{s.starts} – {s.ends}{" "}
									<span className="text-ink-3">· {humanize(s.role)}</span>
								</span>
								<StatusPill
									tone={
										s.status === "PRESENT"
											? "success"
											: s.status === "ABSENT"
												? "danger"
												: s.status === "LATE"
													? "warning"
													: s.status === "SWAPPED"
														? "info"
														: s.status === "COVERED"
															? "warning"
															: "grey"
									}
								>
									{asked[s.id]
										? `${humanize(asked[s.id])} asked`
										: s.status === "SCHEDULED"
											? "Scheduled"
											: humanize(s.status)}
								</StatusPill>
							</button>
						</li>
					))}
				</ul>
			</SectionCard>

			<SectionCard
				title="My leave"
				subtitle="Requests you have sent and what your manager decided"
				flush
			>
				<ul className="divide-y divide-line">
					{leaveRows.length === 0 && (
						<li className="px-5 py-6 text-center text-sm text-ink-3">
							No leave requests.
						</li>
					)}
					{leaveRows.map((l) => (
						<li
							key={l.id}
							className="flex items-center gap-4 px-5 py-3 text-[13px]"
						>
							<span className="w-44 font-semibold text-ink">
								{fmtDay(l.from)} → {fmtDay(l.to)}
							</span>
							<span className="flex-1 text-ink-2">
								{plural(l.days, "day")}
								{l.reason ? ` · ${l.reason}` : ""}
								{l.note ? ` · ${l.note}` : ""}
							</span>
							<StatusPill tone={leaveTone[l.status]}>
								{humanize(l.status)}
							</StatusPill>
						</li>
					))}
				</ul>
			</SectionCard>

			{/* Shift details */}
			<SidePanel
				open={panel?.kind === "shift" && !!current}
				onOpenChange={(o) => !o && close()}
				title={
					current
						? `${fmtDay(current.date)} · ${current.starts} – ${current.ends}`
						: ""
				}
				subtitle={
					current ? `${humanize(current.role)} · ${me.department}` : undefined
				}
				icon={CalendarDaysIcon}
				footer={
					current && current.date >= today ? (
						<>
							<BigButton
								tone="secondary"
								onClick={() => {
									setWithWho("");
									setReason("");
									setPanel({ kind: "swap", id: current.id });
								}}
							>
								<ArrowRightLeftIcon className="size-5" /> Ask to swap
							</BigButton>
							<BigButton
								tone="secondary"
								pending={pending}
								onClick={() =>
									run(
										() =>
											requestShiftChange(current.id, { kind: "COVER", reason }),
										"Cover request sent to your manager",
										() => {
											setAsked((a) => ({ ...a, [current.id]: "COVER" }));
											close();
										},
									)
								}
							>
								Ask for cover
							</BigButton>
						</>
					) : (
						<BigButton tone="secondary" onClick={close}>
							Close
						</BigButton>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						<DetailList
							columns={2}
							items={[
								{ label: "Date", value: fmtDay(current.date) },
								{
									label: "Hours",
									value: `${current.starts} – ${current.ends}`,
								},
								{ label: "Status", value: humanize(current.status) },
								{ label: "Department", value: me.department },
							]}
						/>
						<PanelSection title="Also on this shift">
							<div className="grid grid-cols-2 gap-2">
								{colleagues
									.filter((c) => c.id !== me.id)
									.slice(0, 4)
									.map((c) => (
										<div
											key={c.id}
											className="rounded-control border border-line px-3 py-2"
										>
											<AvatarName
												name={c.fullName}
												secondary={c.jobTitle}
												size="sm"
											/>
										</div>
									))}
							</div>
						</PanelSection>
						<Note tone="info">Swaps need your manager's approval.</Note>
					</div>
				)}
			</SidePanel>

			{/* Swap */}
			<Modal
				open={panel?.kind === "swap"}
				onOpenChange={(o) =>
					!o && setPanel(current ? { kind: "shift", id: current.id } : null)
				}
				title="Ask to swap"
				subtitle={
					current
						? `${fmtDay(current.date)} · ${current.starts} – ${current.ends}`
						: undefined
				}
				icon={ArrowRightLeftIcon}
				size="confirm"
				footer={
					<>
						<BigButton
							tone="secondary"
							onClick={() =>
								setPanel(current ? { kind: "shift", id: current.id } : null)
							}
						>
							Back
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!withWho}
							onClick={() =>
								current &&
								run(
									() =>
										requestShiftChange(current.id, {
											kind: "SWAP",
											withUserId: withWho,
											reason,
										}),
									`Swap request sent to ${colleagues.find((c) => (c.userId ?? c.id) === withWho)?.fullName ?? "your colleague"}`,
									() => {
										setAsked((a) => ({ ...a, [current.id]: "SWAP" }));
										close();
									},
								)
							}
						>
							Send request
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<SelectField
						label="Swap with"
						value={withWho}
						onChange={setWithWho}
						options={colleagues
							.filter((c) => c.id !== me.id)
							.map((c) => ({
								value: c.userId ?? c.id,
								label: c.fullName,
								hint:
									c.shift !== "—" ? `${c.jobTitle} · ${c.shift}` : c.jobTitle,
							}))}
						placeholder="A colleague in your department"
					/>
					<TextareaField
						label="Why (they'll see this)"
						value={reason}
						onChange={setReason}
						rows={2}
						placeholder="e.g. hospital appointment"
					/>
					<WhatHappens
						items={[
							"Your manager approves or declines it",
							"Once approved the shift moves to them on the rota",
							"You get an alert in Notifications when it's decided",
						]}
					/>
				</div>
			</Modal>

			{/* Leave */}
			<SidePanel
				open={panel?.kind === "leave"}
				onOpenChange={(o) => !o && close()}
				title="Ask for leave"
				subtitle="Your manager decides"
				icon={PalmtreeIcon}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!leave.from || !leave.to || leave.to < leave.from}
							onClick={() =>
								run(
									() =>
										requestLeave({
											from: leave.from,
											to: leave.to,
											reason: `${leave.why}${leave.note.trim() ? `: ${leave.note.trim()}` : ""}`,
										}),
									"Leave request sent to your manager",
									() => {
										setLeave({
											from: "",
											to: "",
											why: "Annual leave",
											note: "",
										});
										close();
									},
								)
							}
						>
							Send request
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<TextField
							label="From"
							type="date"
							value={leave.from}
							onChange={(v) => setLeave({ ...leave, from: v })}
							required
						/>
						<TextField
							label="To"
							type="date"
							value={leave.to}
							onChange={(v) => setLeave({ ...leave, to: v })}
							required
						/>
					</div>
					<SelectField
						label="Type"
						value={leave.why}
						onChange={(v) => setLeave({ ...leave, why: v })}
						options={[
							"Annual leave",
							"Sick leave",
							"Family emergency",
							"Unpaid leave",
						]}
						setupLink="leave types"
					/>
					<TextareaField
						label="Note"
						value={leave.note}
						onChange={(v) => setLeave({ ...leave, note: v })}
						rows={2}
					/>
					<WhatHappens
						items={[
							"Your manager approves, declines or suggests other dates",
							"You get an alert in Notifications when it's decided",
							"Approved leave cancels your shifts on those days",
						]}
					/>
				</div>
			</SidePanel>

			{/* Clock out */}
			<Modal
				open={panel?.kind === "clockout"}
				onOpenChange={(o) => !o && close()}
				title="Clock out?"
				subtitle={`On shift ${hh}h ${mm}m${todayShift ? ` · scheduled until ${todayShift.ends}` : ""}`}
				icon={LogOutIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Stay on
						</BigButton>
						<BigButton
							pending={pending}
							onClick={() =>
								run(
									() => clockOut(),
									"Clocked out · see you tomorrow",
									(c) => {
										setClockedIn(c.clockedIn);
										setSince(undefined);
										close();
									},
								)
							}
						>
							Clock out
						</BigButton>
					</>
				}
			>
				<WhatHappens
					items={[
						"Your time on shift is saved for attendance",
						"You can clock in again later if you come back",
					]}
				/>
			</Modal>

			{/* Change PIN */}
			<Modal
				open={panel?.kind === "pin"}
				onOpenChange={(o) => !o && close()}
				title="Change PIN"
				subtitle="The 6 digits you switch in with on a shared tablet"
				icon={KeyRoundIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={
								pin.next.length !== 6 || pin.next !== pin.again || !pin.password
							}
							onClick={() =>
								run(() => setMyPin(pin.next, pin.password), "PIN saved", close)
							}
						>
							Change PIN
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<TextField
							label="New PIN"
							type="password"
							value={pin.next}
							onChange={(v) =>
								setPin({ ...pin, next: v.replace(/\D/g, "").slice(0, 6) })
							}
						/>
						<TextField
							label="Again"
							type="password"
							value={pin.again}
							onChange={(v) =>
								setPin({ ...pin, again: v.replace(/\D/g, "").slice(0, 6) })
							}
							error={
								pin.again && pin.again !== pin.next
									? "Doesn't match"
									: undefined
							}
						/>
					</div>
					<TextField
						label="Your password"
						type="password"
						value={pin.password}
						onChange={(v) => setPin({ ...pin, password: v })}
					/>
					<Note tone="info">
						Use it to switch in on a shared tablet. Not 111111, 123456 or the
						end of your phone number.
					</Note>
				</div>
			</Modal>

			{/* Language */}
			<Modal
				open={panel?.kind === "lang"}
				onOpenChange={(o) => !o && close()}
				title="Language"
				subtitle="Not connected yet · the app shows English for now"
				icon={GlobeIcon}
				size="confirm"
				footer={<BigButton onClick={close}>Close</BigButton>}
			>
				<Note tone="info">
					Choosing another language is not connected yet. Everything stays in
					English for now.
				</Note>
			</Modal>
		</>
	);
}
