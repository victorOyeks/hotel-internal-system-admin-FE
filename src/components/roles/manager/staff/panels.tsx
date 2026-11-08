"use client";

import { CalendarDaysIcon, KeyRoundIcon, MessageSquareIcon, PauseCircleIcon, PencilIcon, ShieldCheckIcon, UserPlusIcon, UserXIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AvatarName, DetailList, Note } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, SelectField, TextField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtDay, fmtLongDate, fmtWhen, humanize } from "@/components/shared/format";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { ManagerMark } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { ShiftRow, StaffRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

export const ROLE_OPTIONS = [
	{ value: "MANAGER", label: "Manager" },
	{ value: "FRONT_OFFICE", label: "Front office" },
	{ value: "HOUSEKEEPING", label: "Housekeeping" },
	{ value: "LAUNDRY", label: "Laundry" },
	{ value: "MAINTENANCE", label: "Maintenance" },
	{ value: "KITCHEN", label: "Kitchen" },
	{ value: "BAR", label: "Bar" },
	{ value: "INVENTORY", label: "Store" },
	{ value: "FINANCE", label: "Finance" },
];
export const SHIFT_OPTIONS = ["Morning", "Afternoon", "Night"];
export const DEPARTMENTS = ["Management", "Front office", "Housekeeping", "Laundry", "Maintenance", "Kitchen", "Bar", "Store", "Finance"];

export function staffStatusPill(s: StaffRow) {
	const map = { ACTIVE: ["Active", "success"], PAUSED: ["Paused", "grey"], SUSPENDED: ["Suspended", "danger"], ON_LEAVE: ["On leave", "warning"] } as const;
	const [label, tone] = map[s.status];
	return <StatusPill tone={tone}>{label}</StatusPill>;
}

// ---- profile ---------------------------------------------------------------------------------------

export function StaffProfilePanel({
	staff,
	shifts,
	onClose,
	onAction,
}: {
	staff: StaffRow | null;
	shifts: ShiftRow[];
	onClose: () => void;
	onAction: (action: "edit" | "shift" | "message" | "reset" | "suspend" | "remove", staff: StaffRow) => void;
}) {
	const [tab, setTab] = useState<"overview" | "shifts" | "access">("overview");
	const mine = staff ? shifts.filter((s) => s.staffId === staff.id).sort((a, b) => a.date.localeCompare(b.date)) : [];
	return (
		<SidePanel
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			width="lg"
			title={staff?.fullName ?? ""}
			subtitle={staff ? `${staff.jobTitle} · ${staff.department} · ${staff.shift} shift` : ""}
			footer={
				staff && (
					<>
						<Button variant="outline" className={btn.secondary} onClick={() => onAction("message", staff)}>
							<MessageSquareIcon className="size-4" /> Message
						</Button>
						<Button className={btn.primary} onClick={() => onAction("edit", staff)}>
							<PencilIcon className="size-4" /> Edit
						</Button>
					</>
				)
			}
			footerInfo={staff && `Started ${fmtLongDate(staff.startedOn)} · last sign-in ${fmtWhen(staff.lastSignIn)}`}
		>
			{staff && (
				<div className="flex flex-col gap-5">
					<div className="flex items-center gap-3">
						<AvatarName name={staff.fullName} size="lg" secondary={`${staff.email} · ${staff.phone}`} />
						<div className="ml-auto">{staffStatusPill(staff)}</div>
					</div>
					<div className="inline-flex w-fit gap-[2px] rounded-[10px] bg-subtle p-1">
						{(["overview", "shifts", "access"] as const).map((t) => (
							<button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-lg px-3 py-[6px] text-xs capitalize", tab === t ? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "font-medium text-ink-2")}>
								{t}
							</button>
						))}
					</div>

					{tab === "overview" && (
						<>
							<DetailList
								columns={2}
								items={[
									{ label: "Role", value: humanize(staff.role) },
									{ label: "Access level", value: staff.level === "FULL" ? "Full" : staff.level === "EDIT" ? "Can edit" : "View only" },
									{ label: "Department", value: staff.department },
									{ label: "Job title", value: staff.jobTitle },
									{ label: "Shift", value: staff.shift },
									{ label: "Started", value: fmtLongDate(staff.startedOn) },
								]}
							/>
							<PanelSection title="This week">
								<div className="grid grid-cols-3 gap-2">
									{[
										["Hours scheduled", `${mine.filter((s) => s.date >= new Date().toISOString().slice(0, 10)).length * 8}h`],
										["Present", String(mine.filter((s) => s.status === "PRESENT").length)],
										["Absent", String(mine.filter((s) => s.status === "ABSENT").length)],
									].map(([k, v]) => (
										<div key={k} className="rounded-xl bg-subtle/70 px-3 py-2">
											<p className="text-[11px] text-ink-3">{k}</p>
											<p className="text-base font-bold text-ink">{v}</p>
										</div>
									))}
								</div>
							</PanelSection>
							<PanelSection title="Quick actions">
								<div className="grid grid-cols-2 gap-2">
									{[
										{ label: "Change shift", icon: CalendarDaysIcon, key: "shift" as const },
										{ label: "Reset password", icon: KeyRoundIcon, key: "reset" as const },
										{ label: "Suspend", icon: PauseCircleIcon, key: "suspend" as const, manager: true },
										{ label: "Remove from hotel", icon: UserXIcon, key: "remove" as const, manager: true, danger: true },
									].map((a) => (
										<button key={a.key} type="button" onClick={() => onAction(a.key, staff)} className={cn("flex items-center gap-2 rounded-control border border-line px-3 py-[10px] text-left text-[13px] font-medium hover:bg-subtle", a.danger ? "text-danger" : "text-ink")}>
											<a.icon className="size-4" /> <span className="flex-1">{a.label}</span>
											{a.manager && <ShieldCheckIcon className="size-[14px] text-ink-3" />}
										</button>
									))}
								</div>
							</PanelSection>
						</>
					)}

					{tab === "shifts" && (
						<PanelSection title="Next 7 days">
							{mine.length === 0 ? (
								<Note tone="info">No shifts on the rota. Add one from the Rota tab.</Note>
							) : (
								<ul className="divide-y divide-line rounded-xl border border-line">
									{mine.map((s) => (
										<li key={s.id} className="flex items-center gap-3 px-3 py-[10px] text-[13px]">
											<span className="w-24 font-medium text-ink">{fmtDay(s.date)}</span>
											<span className="flex-1 text-ink-2">
												{s.starts} – {s.ends}
											</span>
											<StatusPill dot={false} tone={s.status === "PRESENT" ? "success" : s.status === "ABSENT" ? "danger" : s.status === "SCHEDULED" ? "grey" : "info"}>
												{humanize(s.status)}
											</StatusPill>
										</li>
									))}
								</ul>
							)}
						</PanelSection>
					)}

					{tab === "access" && (
						<>
							<DetailList items={[{ label: "Signs in with", value: `${staff.email} · PIN on the tablet` }, { label: "Two-step", value: "Not set up" }, { label: "Last sign-in", value: fmtWhen(staff.lastSignIn) }]} />
							<div className="rounded-xl border border-line p-4">
								<div className="flex items-center gap-2">
									<p className="flex-1 text-[13px] font-semibold text-ink">{humanize(staff.role)} · {staff.level === "FULL" ? "Full" : staff.level === "EDIT" ? "Can edit" : "View only"}</p>
									<ManagerMark />
								</div>
								<p className="mt-1 text-xs text-ink-3">Change what this role can do in Roles & permissions.</p>
								<a href="/dashboard/roles" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">
									Open roles & permissions →
								</a>
							</div>
						</>
					)}
				</div>
			)}
		</SidePanel>
	);
}

// ---- add / edit ------------------------------------------------------------------------------------

export function StaffFormPanel({ open, staff, onClose }: { open: boolean; staff?: StaffRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [form, setForm] = useState({
		fullName: staff?.fullName ?? "",
		phone: staff?.phone ?? "",
		email: staff?.email ?? "",
		role: staff?.role ?? "",
		level: staff?.level ?? "EDIT",
		department: staff?.department ?? "",
		jobTitle: staff?.jobTitle ?? "",
		shift: staff?.shift ?? "",
		startedOn: staff?.startedOn ?? new Date().toISOString().slice(0, 10),
		invite: true,
	});
	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
	const editing = !!staff;
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={editing ? PencilIcon : UserPlusIcon}
			title={editing ? `Edit ${staff?.fullName}` : "Add staff"}
			subtitle={editing ? "Changes apply from their next sign-in" : "They get a WhatsApp invite with a sign-in link and a first PIN"}
			footerInfo={!editing && "Shifts, job titles and departments come from Hotel setup"}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose} disabled={pending}>
						Cancel
					</Button>
					<Button className={btn.primary} disabled={pending || !form.fullName || !form.role} onClick={() => run(editing ? "Staff details saved" : `${form.fullName} added · invite sent`, onClose)}>
						{editing ? "Save changes" : "Add staff"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField label="Full name" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="e.g. Ada Okeke" required />
				<FieldRow>
					<TextField label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+234 …" required />
					<TextField label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="name@hotel.com" />
				</FieldRow>
				<FieldRow>
					<SelectField label="Role" value={form.role} onChange={(v) => set("role", v)} options={ROLE_OPTIONS} required />
					<SelectField label="Department" value={form.department} onChange={(v) => set("department", v)} options={DEPARTMENTS} setupLink="departments" />
				</FieldRow>
				<ChoiceCards
					label="Access level"
					value={form.level}
					onChange={(v) => set("level", v)}
					columns={3}
					options={[
						{ value: "FULL", label: "Full", hint: "Everything in the module" },
						{ value: "EDIT", label: "Can edit", hint: "Day-to-day work, no settings" },
						{ value: "VIEW", label: "View only", hint: "Looks, can't change" },
					]}
				/>
				<FieldRow>
					<TextField label="Job title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} placeholder="Room attendant" />
					<SelectField label="Shift" value={form.shift} onChange={(v) => set("shift", v)} options={SHIFT_OPTIONS} setupLink="shifts" />
				</FieldRow>
				<TextField label="Start date" type="date" value={form.startedOn} onChange={(v) => set("startedOn", v)} />
				{!editing && <ToggleField label="Send invite by WhatsApp" hint="A sign-in link and a one-time PIN go to their phone" checked={form.invite} onChange={(v) => set("invite", v)} />}
			</div>
		</SidePanel>
	);
}

// ---- small modals ----------------------------------------------------------------------------------

export function ChangeShiftModal({ staff, onClose }: { staff: StaffRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [shift, setShift] = useState("");
	const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
	return (
		<Modal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			icon={CalendarDaysIcon}
			title="Change shift"
			subtitle={staff ? `${staff.fullName} · currently ${staff.shift}` : ""}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
					<Button className={btn.primary} disabled={!shift || pending} onClick={() => run(`${staff?.fullName} moves to ${shift} from ${fmtDay(from)}`, onClose)}>
						Change shift
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards value={shift} onChange={setShift} columns={3} options={SHIFT_OPTIONS.map((s) => ({ value: s, label: s, hint: s === "Morning" ? "6am – 2pm" : s === "Afternoon" ? "2pm – 10pm" : "10pm – 6am", disabled: s === staff?.shift }))} />
				<TextField label="From" type="date" value={from} onChange={setFrom} />
				<Note tone="info">They are told on WhatsApp. Shifts already on the rota before this date stay as they are.</Note>
			</div>
		</Modal>
	);
}

export function ResetPasswordModal({ staff, onClose }: { staff: StaffRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	return (
		<ConfirmModal open={!!staff} onOpenChange={(o) => !o && onClose()} title="Reset sign-in" subtitle={staff?.fullName} confirmLabel="Send new PIN" pending={pending} onConfirm={() => run(`New sign-in sent to ${staff?.phone}`, onClose)}>
			<WhatHappens items={["Their current password and tablet PIN stop working", `A one-time PIN goes to ${staff?.phone} by WhatsApp`, "They choose a new PIN at next sign-in"]} />
		</ConfirmModal>
	);
}

export function SuspendModal({ staff, onClose }: { staff: StaffRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [reason, setReason] = useState("");
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			tone="danger"
			title={`Suspend ${staff?.fullName}?`}
			subtitle="Manager only · logged in the activity log"
			confirmLabel="Suspend"
			pending={pending}
			onConfirm={() => run(`${staff?.fullName} suspended`, onClose, { tone: "warning" })}
			alternative={{ label: "Pause access instead (keeps their shifts)", onClick: () => run(`${staff?.fullName}'s access paused`, onClose) }}
		>
			<div className="flex flex-col gap-4">
				<WhatHappens tone="danger" items={["They can't sign in on the desk or the tablet", "Their shifts this week show as uncovered on the rota", "Pay for the suspended days is held until you lift it"]} />
				<TextareaField label="Reason" value={reason} onChange={setReason} placeholder="Shown to the owner and in the activity log" />
			</div>
		</ConfirmModal>
	);
}

export function RemoveModal({ staff, onClose }: { staff: StaffRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	return (
		<ConfirmModal open={!!staff} onOpenChange={(o) => !o && onClose()} tone="danger" title={`Remove ${staff?.fullName} from Simpas Ikeja?`} subtitle="Manager only · logged" confirmLabel="Remove from hotel" pending={pending} onConfirm={() => run(`${staff?.fullName} removed`, onClose, { tone: "warning" })} alternative={{ label: "Suspend instead", onClick: onClose }}>
			<WhatHappens tone="danger" items={["Their access ends now", "History (shifts, payments they took) is kept", "They can be re-added later by the owner"]} />
		</ConfirmModal>
	);
}

export function MessageModal({ staff, onClose }: { staff: StaffRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [body, setBody] = useState("");
	return (
		<Modal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			icon={MessageSquareIcon}
			title={`Message ${staff?.fullName.split(" ")[0] ?? ""}`}
			subtitle="Goes to the app and WhatsApp"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
					<Button className={btn.primary} disabled={!body || pending} onClick={() => run("Message sent", onClose)}>Send</Button>
				</>
			}
		>
			<TextareaField label="Message" value={body} onChange={setBody} rows={4} placeholder="Please come 30 minutes early tomorrow…" />
		</Modal>
	);
}
