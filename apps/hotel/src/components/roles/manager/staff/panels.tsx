"use client";

import {
	CalendarDaysIcon,
	KeyRoundIcon,
	MessageSquareIcon,
	PauseCircleIcon,
	PencilIcon,
	PlayCircleIcon,
	ShieldCheckIcon,
	UserPlusIcon,
	UserXIcon,
} from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	changeAccess,
	createUser,
	pauseAll,
	resetPassword,
} from "@hospio/api/actions/identity";
import { useAction } from "@hospio/api/actions/use-action";
import { addShift } from "@hospio/api/actions/workforce";
import type { UserCreated } from "@hospio/api/api/schema";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import { Button } from "@hospio/ui/primitives/button";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import {
	ChoiceCards,
	FieldRow,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import {
	fmtDay,
	fmtLongDate,
	fmtWhen,
	humanize,
} from "@hospio/ui/shared/format";
import { InviteCard } from "@hospio/ui/shared/invite-card";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { ShiftRow, StaffRow } from "@hospio/api/data/types";
import { toast } from "sonner";
import { cn } from "@hospio/ui/utils";

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
const SHIFT_TIMES: Record<string, [string, string]> = {
	Morning: ["06:00", "14:00"],
	Afternoon: ["14:00", "22:00"],
	Night: ["22:00", "06:00"],
};
export const DEPARTMENTS = [
	"Management",
	"Front office",
	"Housekeeping",
	"Laundry",
	"Maintenance",
	"Kitchen",
	"Bar",
	"Store",
	"Finance",
];

export function staffStatusPill(s: StaffRow) {
	const map = {
		ACTIVE: ["Active", "success"],
		PAUSED: ["Paused", "grey"],
		SUSPENDED: ["Suspended", "danger"],
		ON_LEAVE: ["On leave", "warning"],
	} as const;
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
	onAction: (
		action:
			| "edit"
			| "shift"
			| "message"
			| "reset"
			| "suspend"
			| "resume"
			| "remove",
		staff: StaffRow,
	) => void;
}) {
	const [tab, setTab] = useState<"overview" | "shifts" | "access">("overview");
	const mine = staff
		? shifts
				.filter((s) => s.staffId === staff.id)
				.sort((a, b) => a.date.localeCompare(b.date))
		: [];
	return (
		<SidePanel
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			width="lg"
			title={staff?.fullName ?? ""}
			subtitle={
				staff
					? `${staff.jobTitle} · ${staff.department} · ${staff.shift} shift`
					: ""
			}
			footer={
				staff && (
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => onAction("message", staff)}
						>
							<MessageSquareIcon className="size-4" /> Message
						</Button>
						<Button
							className={btn.primary}
							onClick={() => onAction("edit", staff)}
						>
							<PencilIcon className="size-4" /> Edit
						</Button>
					</>
				)
			}
			footerInfo={
				staff &&
				`Started ${fmtLongDate(staff.startedOn)} · last sign-in ${fmtWhen(staff.lastSignIn)}`
			}
		>
			{staff && (
				<div className="flex flex-col gap-5">
					<div className="flex items-center gap-3">
						<AvatarName
							name={staff.fullName}
							size="lg"
							secondary={`${staff.email} · ${staff.phone}`}
						/>
						<div className="ml-auto">{staffStatusPill(staff)}</div>
					</div>
					<div className="inline-flex w-fit gap-[2px] rounded-[10px] bg-subtle p-1">
						{(["overview", "shifts", "access"] as const).map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => setTab(t)}
								className={cn(
									"rounded-lg px-3 py-[6px] text-xs capitalize",
									tab === t
										? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
										: "font-medium text-ink-2",
								)}
							>
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
									{
										label: "Access level",
										value:
											staff.level === "FULL"
												? "Full"
												: staff.level === "EDIT"
													? "Can edit"
													: "View only",
									},
									{ label: "Department", value: staff.department },
									{ label: "Job title", value: staff.jobTitle },
									{ label: "Shift", value: staff.shift },
									{ label: "Started", value: fmtLongDate(staff.startedOn) },
								]}
							/>
							<PanelSection title="This week">
								<div className="grid grid-cols-3 gap-2">
									{[
										[
											"Hours scheduled",
											`${mine.filter((s) => s.date >= new Date().toISOString().slice(0, 10)).length * 8}h`,
										],
										[
											"Present",
											String(mine.filter((s) => s.status === "PRESENT").length),
										],
										[
											"Absent",
											String(mine.filter((s) => s.status === "ABSENT").length),
										],
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
										{
											label: "Change shift",
											icon: CalendarDaysIcon,
											key: "shift" as const,
										},
										{
											label: "Reset password",
											icon: KeyRoundIcon,
											key: "reset" as const,
										},
										staff.status === "PAUSED" || staff.status === "SUSPENDED"
											? {
													label: "Resume access",
													icon: PlayCircleIcon,
													key: "resume" as const,
													manager: true,
												}
											: {
													label: "Suspend",
													icon: PauseCircleIcon,
													key: "suspend" as const,
													manager: true,
												},
										{
											label: "Remove from hotel",
											icon: UserXIcon,
											key: "remove" as const,
											manager: true,
											danger: true,
										},
									].map((a) => (
										<button
											key={a.key}
											type="button"
											onClick={() => onAction(a.key, staff)}
											className={cn(
												"flex items-center gap-2 rounded-control border border-line px-3 py-[10px] text-left text-[13px] font-medium hover:bg-subtle",
												a.danger ? "text-danger" : "text-ink",
											)}
										>
											<a.icon className="size-4" />{" "}
											<span className="flex-1">{a.label}</span>
											{a.manager && (
												<ShieldCheckIcon className="size-[14px] text-ink-3" />
											)}
										</button>
									))}
								</div>
							</PanelSection>
						</>
					)}

					{tab === "shifts" && (
						<PanelSection title="Next 7 days">
							{mine.length === 0 ? (
								<Note tone="info">
									No shifts on the rota. Add one from the Rota tab.
								</Note>
							) : (
								<ul className="divide-y divide-line rounded-xl border border-line">
									{mine.map((s) => (
										<li
											key={s.id}
											className="flex items-center gap-3 px-3 py-[10px] text-[13px]"
										>
											<span className="w-24 font-medium text-ink">
												{fmtDay(s.date)}
											</span>
											<span className="flex-1 text-ink-2">
												{s.starts} – {s.ends}
											</span>
											<StatusPill
												dot={false}
												tone={
													s.status === "PRESENT"
														? "success"
														: s.status === "ABSENT"
															? "danger"
															: s.status === "SCHEDULED"
																? "grey"
																: "info"
												}
											>
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
							<DetailList
								items={[
									{ label: "Signs in with", value: staff.email },
									{
										label: "Invite",
										value:
											staff.inviteStatus === "PENDING"
												? "Sent, not accepted yet"
												: staff.inviteStatus === "EXPIRED"
													? "Expired · reset the password to send a new one"
													: staff.mustChangePassword
														? "Temporary password, not changed yet"
														: "Accepted",
									},
									{ label: "Last sign-in", value: fmtWhen(staff.lastSignIn) },
								]}
							/>
							<div className="rounded-xl border border-line p-4">
								<div className="flex items-center gap-2">
									<p className="flex-1 text-[13px] font-semibold text-ink">
										{humanize(staff.role)} ·{" "}
										{staff.level === "FULL"
											? "Full"
											: staff.level === "EDIT"
												? "Can edit"
												: "View only"}
									</p>
									<ManagerMark />
								</div>
								<p className="mt-1 text-xs text-ink-3">
									Change what this role can do in Roles & permissions.
								</p>
								<a
									href="/dashboard/roles"
									className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
								>
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

/**
 * Add staff → POST /identity/users (a role on this hotel; the temporary password and invite link are shown
 * once). Editing name, phone, title and shift has no identity endpoint yet, so it still runs on the demo action.
 */
export function StaffFormPanel({
	open,
	staff,
	onClose,
	hotelId,
	hotelName,
	businessName,
	inviterName,
}: {
	open: boolean;
	staff?: StaffRow | null;
	onClose: () => void;
	hotelId?: string;
	hotelName?: string;
	businessName?: string;
	inviterName?: string;
}) {
	const router = useRouter();
	const { run, pending: saving } = useAction();
	const [created, setCreated] = useState<UserCreated | null>(null);
	const pending = saving;
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
	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [k]: v }));
	const editing = !!staff;
	const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
	const close = () => {
		const refresh = !!created;
		setCreated(null);
		onClose();
		if (refresh) router.refresh();
	};
	const add = () => {
		if (!hotelId) return;
		run(
			() =>
				withDeliveries(
					createUser({
						fullName: form.fullName.trim(),
						email: form.email.trim(),
						phone: form.phone.trim() || null,
						role: form.role,
						level: form.level,
						hotelId,
					}),
					`Invite for ${form.fullName.trim()}`,
				),
			`${form.fullName.trim()} added`,
			setCreated,
		);
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && close()}
			icon={editing ? PencilIcon : UserPlusIcon}
			title={
				created
					? `${form.fullName} is added`
					: editing
						? `Edit ${staff?.fullName}`
						: "Add staff"
			}
			subtitle={
				created
					? "Send them the link or read out the temporary password"
					: editing
						? "Changes apply from their next sign-in"
						: "They get a temporary password and an invite link you pass on"
			}
			footerInfo={
				!editing &&
				!created &&
				"Shifts, job titles and departments come from Hotel setup"
			}
			footer={
				created ? (
					<Button className={btn.primary} onClick={close}>
						Done
					</Button>
				) : (
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={close}
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={
								pending ||
								!form.fullName ||
								!form.role ||
								(!editing && (!emailOk || !hotelId))
							}
							onClick={
								editing
									? () => {
											toast.info(
												"Editing a person's details is not connected yet · nothing was changed",
											);
											onClose();
										}
									: add
							}
						>
							{editing ? "Save changes" : "Add staff"}
						</Button>
					</>
				)
			}
		>
			{created ? (
				<InviteCard
					fullName={form.fullName.trim()}
					email={form.email.trim()}
					phone={form.phone}
					roleLabel={isHotelRole(form.role) ? roleLabels[form.role] : form.role}
					hotelName={hotelName}
					businessName={businessName ?? "Hospio360"}
					inviterName={inviterName ?? "Your manager"}
					temporaryPassword={created.temporaryPassword}
					inviteToken={created.inviteToken}
					inviteExpiresAt={created.inviteExpiresAt}
					temporaryPasswordExpiresAt={created.temporaryPasswordExpiresAt}
				/>
			) : (
				<div className="flex flex-col gap-4">
					<TextField
						label="Full name"
						value={form.fullName}
						onChange={(v) => set("fullName", v)}
						placeholder="e.g. Ada Okeke"
						required
					/>
					<FieldRow>
						<TextField
							label="Phone"
							value={form.phone}
							onChange={(v) => set("phone", v)}
							placeholder="+234 …"
							hint="For the WhatsApp invite"
						/>
						<TextField
							label="Email"
							type="email"
							value={form.email}
							onChange={(v) => set("email", v)}
							placeholder="name@hotel.com"
							required={!editing}
							hint={editing ? undefined : "They sign in with this"}
						/>
					</FieldRow>
					<FieldRow>
						<SelectField
							label="Role"
							value={form.role}
							onChange={(v) => set("role", v)}
							options={ROLE_OPTIONS}
							required
						/>
						<SelectField
							label="Department"
							value={form.department}
							onChange={(v) => set("department", v)}
							options={DEPARTMENTS}
							setupLink="departments"
						/>
					</FieldRow>
					<ChoiceCards
						label="Access level"
						value={form.level}
						onChange={(v) => set("level", v)}
						columns={3}
						options={[
							{
								value: "FULL",
								label: "Full",
								hint: "Everything in the module",
							},
							{
								value: "EDIT",
								label: "Can edit",
								hint: "Day-to-day work, no settings",
							},
							{
								value: "VIEW",
								label: "View only",
								hint: "Looks, can't change",
							},
						]}
					/>
					<FieldRow>
						<TextField
							label="Job title"
							value={form.jobTitle}
							onChange={(v) => set("jobTitle", v)}
							placeholder="Room attendant"
						/>
						<SelectField
							label="Shift"
							value={form.shift}
							onChange={(v) => set("shift", v)}
							options={SHIFT_OPTIONS}
							setupLink="shifts"
						/>
					</FieldRow>
					<TextField
						label="Start date"
						type="date"
						value={form.startedOn}
						onChange={(v) => set("startedOn", v)}
					/>
					{!editing && (
						<ToggleField
							label="Show the WhatsApp button after"
							hint="The invite link and temporary password are shown once; WhatsApp opens with the message ready"
							checked={form.invite}
							onChange={(v) => set("invite", v)}
						/>
					)}
					{!editing && (
						<Note tone="info">
							Job title, department, shift and start date are kept on the rota
							for now; identity stores the name, contacts, role and level.
						</Note>
					)}
				</div>
			)}
		</SidePanel>
	);
}

// ---- small modals ----------------------------------------------------------------------------------

export function ChangeShiftModal({
	staff,
	onClose,
}: {
	staff: StaffRow | null;
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [shift, setShift] = useState("");
	const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
	const [days, setDays] = useState("1");
	const times = SHIFT_TIMES[shift];
	return (
		<Modal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			icon={CalendarDaysIcon}
			title="Add to the rota"
			subtitle={staff ? `${staff.fullName} · ${humanize(staff.role)}` : ""}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={!shift || !staff || pending}
						onClick={() =>
							staff &&
							times &&
							run(
								async () => {
									const n = Math.max(1, Math.min(14, Number(days) || 1));
									for (let i = 0; i < n; i++) {
										const date = format(
											addDays(parseISO(from), i),
											"yyyy-MM-dd",
										);
										const r = await addShift({
											userId: staff.userId ?? staff.id,
											userName: staff.fullName,
											role: staff.role,
											date,
											starts: times[0],
											ends: times[1],
										});
										if (!r.ok) return r;
									}
									return { ok: true as const, data: null };
								},
								`${staff.fullName} is on ${shift} from ${fmtDay(from)}`,
								() => {
									setShift("");
									onClose();
								},
							)
						}
					>
						Add shifts
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards
					value={shift}
					onChange={setShift}
					columns={3}
					options={SHIFT_OPTIONS.map((s) => ({
						value: s,
						label: s,
						hint:
							s === "Morning"
								? "6am – 2pm"
								: s === "Afternoon"
									? "2pm – 10pm"
									: "10pm – 6am",
					}))}
				/>
				<FieldRow>
					<TextField
						label="First day"
						type="date"
						value={from}
						onChange={setFrom}
					/>
					<TextField
						label="Number of days"
						type="number"
						value={days}
						onChange={setDays}
					/>
				</FieldRow>
				<Note tone="info">
					One shift is added for each day. They see it under My shifts; shifts
					already on the rota stay as they are.
				</Note>
			</div>
		</Modal>
	);
}

/** POST /identity/users/{id}/reset-password: the temporary password is shown once, with an invite link. */
export function ResetPasswordModal({
	staff,
	onClose,
	hotelName,
	businessName,
	inviterName,
}: {
	staff: StaffRow | null;
	onClose: () => void;
	hotelName?: string;
	businessName?: string;
	inviterName?: string;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [created, setCreated] = useState<UserCreated | null>(null);
	const close = () => {
		const refresh = !!created;
		setCreated(null);
		onClose();
		if (refresh) router.refresh();
	};
	if (staff && created) {
		return (
			<Modal
				open
				onOpenChange={(o) => !o && close()}
				icon={KeyRoundIcon}
				title={`New password for ${staff.fullName}`}
				subtitle="Shown once · pass it on now"
				footer={
					<Button className={btn.primary} onClick={close}>
						Done
					</Button>
				}
			>
				<InviteCard
					title="Temporary password"
					fullName={staff.fullName}
					email={staff.email}
					phone={staff.phone}
					roleLabel={staff.jobTitle}
					hotelName={hotelName}
					businessName={businessName ?? "Hospio360"}
					inviterName={inviterName ?? "Your manager"}
					temporaryPassword={created.temporaryPassword}
					inviteToken={created.inviteToken}
					inviteExpiresAt={created.inviteExpiresAt}
					temporaryPasswordExpiresAt={created.temporaryPasswordExpiresAt}
				/>
			</Modal>
		);
	}
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && close()}
			title="Reset sign-in"
			subtitle={staff?.fullName}
			confirmLabel="Reset password"
			pending={pending}
			onConfirm={() =>
				staff &&
				run(
					() =>
						withDeliveries(
							resetPassword(staff.userId ?? staff.id),
							`New password for ${staff.fullName}`,
						),
					"Temporary password ready",
					setCreated,
				)
			}
		>
			<WhatHappens
				items={[
					"Their current password stops working",
					"You get a temporary password to pass on, shown once",
					"They choose a new one at next sign-in",
				]}
			/>
		</ConfirmModal>
	);
}

/** POST /identity/users/{id}/pause-all?paused=false. */
export function ResumeModal({
	staff,
	onClose,
}: {
	staff: StaffRow | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			title={`Let ${staff?.fullName} sign in again?`}
			subtitle="Manager only · logged"
			confirmLabel="Resume access"
			pending={pending}
			onConfirm={() =>
				staff &&
				run(
					() => pauseAll(staff.userId ?? staff.id, false),
					`${staff.fullName} can sign in again`,
					() => {
						onClose();
						router.refresh();
					},
				)
			}
		>
			<WhatHappens
				items={[
					"Every role they hold is active again",
					"Their shifts stay as they were on the rota",
				]}
			/>
		</ConfirmModal>
	);
}

/** Suspend = POST /identity/users/{id}/pause-all (every role paused; the person cannot sign in). */
export function SuspendModal({
	staff,
	onClose,
}: {
	staff: StaffRow | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
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
			onConfirm={() =>
				staff &&
				run(
					() => pauseAll(staff.userId ?? staff.id, true),
					`${staff.fullName} suspended`,
					() => {
						onClose();
						router.refresh();
					},
				)
			}
		>
			<div className="flex flex-col gap-4">
				<WhatHappens
					tone="danger"
					items={[
						"They can't sign in on the desk or the tablet until you resume them",
						"Their shifts this week show as uncovered on the rota",
						"History (shifts, payments they took) is kept",
					]}
				/>
				<TextareaField
					label="Reason"
					value={reason}
					onChange={setReason}
					placeholder="For your records · the activity log keeps it when it is wired"
				/>
			</div>
		</ConfirmModal>
	);
}

/** Remove = PUT /identity/users/{id}/roles/{grantId} REMOVE on their grant(s) for this hotel. */
export function RemoveModal({
	staff,
	onClose,
	hotelName,
	onSuspend,
}: {
	staff: StaffRow | null;
	onClose: () => void;
	hotelName?: string;
	onSuspend?: (s: StaffRow) => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const remove = () => {
		if (!staff) return;
		const here = (staff.grants ?? []).filter(
			(g) => !g.hotelId || g.hotelId === staff.hotelId,
		);
		run(
			async () => {
				if (here.length === 0)
					return {
						ok: false as const,
						error: "No role on this hotel to remove",
					};
				for (const g of here) {
					const r = await changeAccess(staff.userId ?? staff.id, g.id, {
						change: "REMOVE",
						reason: "Removed from the hotel by the manager",
					});
					if (!r.ok) return r;
				}
				return { ok: true as const, data: null };
			},
			`${staff.fullName} removed`,
			() => {
				onClose();
				router.refresh();
			},
		);
	};
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			tone="danger"
			title={`Remove ${staff?.fullName} from ${hotelName ?? "this hotel"}?`}
			subtitle="Manager only · logged"
			confirmLabel="Remove from hotel"
			pending={pending}
			onConfirm={remove}
			alternative={
				staff && onSuspend
					? { label: "Suspend instead", onClick: () => onSuspend(staff) }
					: undefined
			}
		>
			<WhatHappens
				tone="danger"
				items={[
					"Their access ends now",
					"History (shifts, payments they took) is kept",
					"They can be re-added later by the owner",
				]}
			/>
		</ConfirmModal>
	);
}

export function MessageModal({
	staff,
	onClose,
}: {
	staff: StaffRow | null;
	onClose: () => void;
}) {
	const pending = false;
	const [body, setBody] = useState("");
	return (
		<Modal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			icon={MessageSquareIcon}
			title={`Message ${staff?.fullName.split(" ")[0] ?? ""}`}
			subtitle="Not connected yet · nothing is sent"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={!body || pending}
						onClick={() => {
							toast.info(
								"Messaging staff is not connected yet · nothing was sent",
							);
							onClose();
						}}
					>
						Send
					</Button>
				</>
			}
		>
			<TextareaField
				label="Message"
				value={body}
				onChange={setBody}
				rows={4}
				placeholder="Please come 30 minutes early tomorrow…"
			/>
		</Modal>
	);
}
