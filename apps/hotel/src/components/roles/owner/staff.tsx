"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	KeyRoundIcon,
	MailIcon,
	MessageSquareIcon,
	PauseCircleIcon,
	PencilIcon,
	PlayCircleIcon,
	PlusIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UserPlusIcon,
	UserRoundIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { createUser } from "@hospio/api/actions/identity";
import { removeFromHotel, updateStaffDetails } from "@hospio/api/actions/owner";
import { useAction } from "@hospio/api/actions/use-action";
import type { UserCreated } from "@hospio/api/api/schema";
import type { OwnerStaffRow } from "@hospio/api/data/types";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable } from "@hospio/ui/shared/data-table";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	SelectField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtLongDate, fmtWhen, plural } from "@hospio/ui/shared/format";
import { InviteCard } from "@hospio/ui/shared/invite-card";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { ResetPasswordModal, ROLE_OPTIONS } from "../manager/staff/panels";
import {
	EditDetailsModal,
	MessageStaffModal,
	PauseModal,
	pauseLastDay,
	ReinstateModal,
	SuspendStaffModal,
} from "../shared-staff/staff-account";
import { DownloadModal, HotelFilter } from "./common";

type Hotel = { hotelId: string; name: string };
type Tab = "all" | "active" | "held" | "invited";
type ModalKind =
	| "edit"
	| "pause"
	| "suspend"
	| "reinstate"
	| "remove"
	| "reset"
	| "message";

const roleName = (role: string) =>
	isHotelRole(role) ? roleLabels[role] : role.replace(/_/g, " ").toLowerCase();
const levelName = {
	FULL: "Full",
	EDIT: "Can edit",
	VIEW: "View only",
} as const;
const invited = (s: OwnerStaffRow) =>
	s.inviteStatus === "PENDING" || s.inviteStatus === "EXPIRED";

/** One status for the row: invited, suspended, paused (until a day), or active. */
function statusOf(s: OwnerStaffRow): {
	label: string;
	tone: "success" | "warning" | "danger" | "info" | "grey";
} {
	if (s.status === "SUSPENDED") return { label: "Suspended", tone: "danger" };
	if (s.status === "PAUSED") {
		const last = pauseLastDay(s.pausedUntil);
		return {
			label: last ? `Paused until ${fmtLongDate(last)}` : "Paused",
			tone: "warning",
		};
	}
	if (invited(s))
		return {
			label: s.inviteStatus === "EXPIRED" ? "Invite expired" : "Invited",
			tone: "info",
		};
	return { label: "Active", tone: "success" };
}

/**
 * Hotel Owner · Staff: everyone with a role at each hotel, one row per person and hotel, live from identity. Add with an
 * invite, edit details, pause for some days, suspend and reinstate, a new temporary password (email and SMS), remove
 * from the hotel and message them. Roles and levels are changed on Roles & permissions.
 */
export function OwnerStaffScreen({
	staff,
	hotels,
	businessName,
	ownerName,
}: {
	staff: OwnerStaffRow[];
	hotels: Hotel[];
	businessName: string;
	ownerName: string;
}) {
	const [hotel, setHotel] = useQueryState("hotel", parseAsString);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [isNew, setIsNew] = useQueryState("new", parseAsString);
	const [tab, setTab] = useState<Tab>("all");
	const [search, setSearch] = useState("");
	const [exportOpen, setExportOpen] = useState(false);
	const [modal, setModal] = useState<{
		kind: ModalKind;
		s: OwnerStaffRow;
	} | null>(null);

	const scoped = useMemo(
		() => staff.filter((s) => !hotel || s.hotelId === hotel),
		[staff, hotel],
	);
	const held = (s: OwnerStaffRow) =>
		s.status === "PAUSED" || s.status === "SUSPENDED";
	const inTab = (s: OwnerStaffRow, t: Tab) =>
		t === "all" ||
		(t === "active" && !held(s) && !invited(s)) ||
		(t === "held" && held(s)) ||
		(t === "invited" && invited(s) && !held(s));
	const rows = scoped.filter((s) => inTab(s, tab));
	const selected = staff.find((s) => s.key === open) ?? null;
	const people = new Set(scoped.map((s) => s.userId ?? s.id)).size;
	const hotelName = hotel
		? (hotels.find((h) => h.hotelId === hotel)?.name ?? "this hotel")
		: null;
	const show = (kind: ModalKind, s: OwnerStaffRow) => setModal({ kind, s });

	const actions = (s: OwnerStaffRow) => [
		{
			label: "View profile",
			icon: UserRoundIcon,
			onClick: () => void setOpen(s.key),
		},
		{ label: "Edit details", icon: PencilIcon, onClick: () => show("edit", s) },
		{
			label: "Message",
			icon: MessageSquareIcon,
			onClick: () => show("message", s),
		},
		{
			label: "New temporary password",
			icon: KeyRoundIcon,
			onClick: () => show("reset", s),
		},
		...(held(s)
			? [
					{
						label: s.status === "SUSPENDED" ? "Reinstate" : "End the pause",
						icon: PlayCircleIcon,
						onClick: () => show("reinstate", s),
					},
				]
			: [
					{
						label: "Pause for 7 days",
						icon: PauseCircleIcon,
						separatorBefore: true,
						onClick: () => show("pause", s),
					},
					{
						label: "Suspend",
						icon: PauseCircleIcon,
						tone: "danger" as const,
						onClick: () => show("suspend", s),
					},
				]),
		{
			label: `Remove from ${s.hotelName}`,
			icon: Trash2Icon,
			tone: "danger" as const,
			separatorBefore: held(s),
			onClick: () => show("remove", s),
		},
	];

	const columns: ColumnDef<OwnerStaffRow, unknown>[] = [
		{
			accessorKey: "fullName",
			header: "Name",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.fullName}
					secondary={row.original.jobTitle}
					size="sm"
				/>
			),
		},
		{ accessorKey: "hotelName", header: "Hotel" },
		{ accessorKey: "department", header: "Department" },
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) =>
				`${roleName(row.original.role)} · ${levelName[row.original.level]}`,
		},
		{
			id: "status",
			header: "Status",
			accessorFn: (s) => statusOf(s).label,
			cell: ({ row }) => {
				const st = statusOf(row.original);
				return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
			},
		},
		{
			accessorKey: "lastSignIn",
			header: "Last sign-in",
			cell: ({ row }) =>
				row.original.lastSignIn ? fmtWhen(row.original.lastSignIn) : "Never",
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => <RowActions actions={actions(row.original)} />,
		},
	];

	return (
		<>
			<PageHeader
				title="Staff"
				subtitle={`${plural(people, "person", "people")} across ${hotelName ?? plural(hotels.length, "hotel")}`}
			>
				<ExportButton onClick={() => setExportOpen(true)} />
				<Button
					className={btn.primary}
					onClick={() => void setIsNew("1")}
					disabled={hotels.length === 0}
				>
					<PlusIcon className="size-4" /> Add staff
				</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Total staff"
					value={people}
					icon={UsersIcon}
					hint={`${plural(scoped.length, "role")} at ${hotelName ?? "your hotels"}`}
				/>
				<KpiCard
					label="Active"
					value={scoped.filter((s) => !held(s) && !invited(s)).length}
					icon={ShieldCheckIcon}
					hint="Signed in at least once"
				/>
				<KpiCard
					label="Invite not accepted"
					value={scoped.filter((s) => invited(s) && !held(s)).length}
					icon={MailIcon}
					hint="Resend from their profile"
				/>
				<KpiCard
					label="Paused or suspended"
					value={scoped.filter(held).length}
					icon={PauseCircleIcon}
					hint="Can't sign in"
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "all", label: "All", count: scoped.length },
							{
								key: "active",
								label: "Active",
								count: scoped.filter((s) => inTab(s, "active")).length,
							},
							{
								key: "invited",
								label: "Invited",
								count: scoped.filter((s) => inTab(s, "invited")).length,
							},
							{
								key: "held",
								label: "Paused or suspended",
								count: scoped.filter(held).length,
							},
						]}
						value={tab}
						onChange={setTab}
					/>
				}
				right={
					<>
						<HotelFilter
							hotels={hotels}
							value={hotel ?? ""}
							onChange={(v) => void setHotel(v || null)}
						/>
						<SearchBox
							value={search}
							onChange={setSearch}
							placeholder="Name, hotel, role"
						/>
					</>
				}
			/>
			<DataTable
				columns={columns}
				data={rows}
				search={search}
				onRowClick={(s) => void setOpen(s.key)}
				emptyTitle="No staff here"
				emptyHint="Try another tab or hotel, or add someone."
			/>

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={selected?.fullName ?? ""}
				subtitle={
					selected ? `${selected.jobTitle} · ${selected.hotelName}` : undefined
				}
				icon={UserRoundIcon}
				footer={
					selected && (
						<>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => show("message", selected)}
							>
								<MessageSquareIcon className="size-4" /> Message
							</Button>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => show("reset", selected)}
							>
								<KeyRoundIcon className="size-4" /> New password
							</Button>
							{held(selected) ? (
								<Button
									className={btn.primary}
									onClick={() => show("reinstate", selected)}
								>
									<PlayCircleIcon className="size-4" />{" "}
									{selected.status === "SUSPENDED"
										? "Reinstate"
										: "End the pause"}
								</Button>
							) : (
								<Button
									className={btn.primary}
									onClick={() => show("edit", selected)}
								>
									<PencilIcon className="size-4" /> Edit
								</Button>
							)}
						</>
					)
				}
			>
				{selected && (
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between gap-3">
							<StatusPill tone={statusOf(selected).tone}>
								{statusOf(selected).label}
							</StatusPill>
							<span className="text-xs text-ink-3">
								Added {fmtLongDate(selected.startedOn)}
							</span>
						</div>
						{held(selected) && (
							<Note
								tone={selected.status === "SUSPENDED" ? "danger" : "warning"}
							>
								{selected.status === "SUSPENDED" ? "Suspended" : "Paused"}
								{selected.statusChangedBy
									? ` by ${selected.statusChangedBy}`
									: ""}
								{selected.statusChangedAt
									? ` on ${fmtLongDate(selected.statusChangedAt)}`
									: ""}
								{selected.statusReason ? `: ${selected.statusReason}` : ""}
							</Note>
						)}
						<PanelSection title="Contact">
							<DetailList
								columns={2}
								items={[
									{ label: "Phone", value: selected.phone || "—" },
									{ label: "Email", value: selected.email },
								]}
							/>
						</PanelSection>
						<PanelSection title="Work">
							<DetailList
								columns={2}
								items={[
									{ label: "Hotel", value: selected.hotelName },
									{ label: "Department", value: selected.department },
									{
										label: "Role",
										value: `${roleName(selected.role)} · ${levelName[selected.level]}`,
									},
									{ label: "Job title", value: selected.jobTitle },
									{
										label: "Last sign-in",
										value: selected.lastSignIn
											? fmtWhen(selected.lastSignIn)
											: "Never",
									},
									{
										label: "Invite",
										value:
											selected.inviteStatus === "PENDING"
												? "Waiting to be accepted"
												: selected.inviteStatus === "EXPIRED"
													? "Expired · send a new password"
													: "Accepted",
									},
								]}
							/>
						</PanelSection>
						<PanelSection title="Access">
							<p className="text-[13px] text-ink-2">
								Roles and levels are changed on{" "}
								<Link
									href="/dashboard/roles"
									className="font-semibold text-brand hover:underline"
								>
									Roles & permissions
								</Link>{" "}
								for the hotel picked in the sidebar.
							</p>
							<Button
								variant="outline"
								className={`${btn.dangerSoft} ${btn.small} mt-3 w-fit`}
								onClick={() => show("remove", selected)}
							>
								<Trash2Icon className="size-3" /> Remove from{" "}
								{selected.hotelName}
							</Button>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<AddStaffPanel
				open={isNew === "1"}
				hotels={hotels}
				defaultHotel={hotel ?? hotels[0]?.hotelId ?? ""}
				businessName={businessName}
				ownerName={ownerName}
				onClose={() => void setIsNew(null)}
			/>
			<EditDetailsModal
				staff={modal?.kind === "edit" ? modal.s : null}
				onClose={() => setModal(null)}
			/>
			<MessageStaffModal
				staff={modal?.kind === "message" ? modal.s : null}
				onClose={() => setModal(null)}
			/>
			<PauseModal
				staff={modal?.kind === "pause" ? modal.s : null}
				onClose={() => setModal(null)}
			/>
			<SuspendStaffModal
				staff={modal?.kind === "suspend" ? modal.s : null}
				onClose={() => setModal(null)}
				onPauseInstead={() => modal && setModal({ kind: "pause", s: modal.s })}
			/>
			<ReinstateModal
				staff={modal?.kind === "reinstate" ? modal.s : null}
				until={
					modal?.kind === "reinstate" ? pauseLastDay(modal.s.pausedUntil) : null
				}
				onClose={() => setModal(null)}
			/>
			<ResetPasswordModal
				staff={modal?.kind === "reset" ? modal.s : null}
				onClose={() => setModal(null)}
				hotelName={modal?.s.hotelName}
				businessName={businessName}
				inviterName={ownerName}
			/>
			<RemoveModal
				staff={modal?.kind === "remove" ? modal.s : null}
				onClose={() => setModal(null)}
			/>
			<DownloadModal
				open={exportOpen}
				onOpenChange={setExportOpen}
				title="Export staff"
				what={`Staff · ${hotelName ?? "All hotels"}`}
				rows={() => [
					[
						"Name",
						"Email",
						"Phone",
						"Hotel",
						"Department",
						"Role",
						"Level",
						"Job title",
						"Status",
						"Last sign-in",
					],
					...rows
						.filter(
							(s) =>
								!search ||
								`${s.fullName} ${s.hotelName} ${roleName(s.role)} ${s.department}`
									.toLowerCase()
									.includes(search.toLowerCase()),
						)
						.map((s) => [
							s.fullName,
							s.email,
							s.phone,
							s.hotelName,
							s.department,
							roleName(s.role),
							levelName[s.level],
							s.jobTitle,
							statusOf(s).label,
							s.lastSignIn ?? "",
						]),
				]}
			/>
		</>
	);
}

function RemoveModal({
	staff,
	onClose,
}: {
	staff: OwnerStaffRow | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	return (
		<ConfirmModal
			open={!!staff}
			onOpenChange={(o) => !o && onClose()}
			tone="danger"
			title={`Remove ${staff?.fullName} from ${staff?.hotelName}?`}
			subtitle={
				staff ? `${plural(staff.grantIdsHere.length, "role")} there` : undefined
			}
			confirmLabel="Remove from hotel"
			pending={pending}
			onConfirm={() =>
				staff &&
				run(
					() =>
						removeFromHotel(
							staff.userId ?? staff.id,
							staff.grantIdsHere,
							staff.hotelName,
						),
					`${staff.fullName} removed from ${staff.hotelName}`,
					() => {
						onClose();
						router.refresh();
					},
				)
			}
		>
			<WhatHappens
				tone="danger"
				items={[
					`Every role they hold at ${staff?.hotelName ?? "this hotel"} ends now`,
					"Roles at your other hotels stay",
					"Their history (shifts, payments they took) is kept",
				]}
			/>
		</ConfirmModal>
	);
}

/** Add staff → POST /identity/users at the chosen hotel; the temporary password and invite link are shown once. */
function AddStaffPanel({
	open,
	hotels,
	defaultHotel,
	businessName,
	ownerName,
	onClose,
}: {
	open: boolean;
	hotels: Hotel[];
	defaultHotel: string;
	businessName: string;
	ownerName: string;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [created, setCreated] = useState<UserCreated | null>(null);
	const blank = {
		fullName: "",
		email: "",
		phone: "",
		hotelId: defaultHotel,
		role: "",
		level: "EDIT",
		jobTitle: "",
	};
	const [form, setForm] = useState(blank);
	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [k]: v }));
	const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim());
	const hotelId = form.hotelId || defaultHotel;
	const hotelName = hotels.find((h) => h.hotelId === hotelId)?.name;
	const close = () => {
		const refresh = !!created;
		setCreated(null);
		setForm({ ...blank, hotelId: defaultHotel });
		onClose();
		if (refresh) router.refresh();
	};
	const add = () =>
		run(
			async () => {
				const r = await withDeliveries(
					createUser({
						fullName: form.fullName.trim(),
						email: form.email.trim(),
						phone: form.phone.trim() || null,
						role: form.role,
						level: form.level,
						hotelId,
					}),
					`Invite for ${form.fullName.trim()}`,
				);
				if (r.ok && form.jobTitle.trim()) {
					const t = await updateStaffDetails(r.data.userId, {
						jobTitle: form.jobTitle.trim(),
					});
					if (!t.ok)
						return {
							ok: false as const,
							error: `${form.fullName.trim()} was added, but the job title was not saved: ${t.error}`,
						};
				}
				return r;
			},
			`${form.fullName.trim()} added at ${hotelName ?? "the hotel"}`,
			setCreated,
		);
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && close()}
			icon={UserPlusIcon}
			title={created ? `${form.fullName} is added` : "Add staff"}
			subtitle={
				created
					? "Send them the link or read out the temporary password"
					: "They get a temporary password and an invite link"
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
								!form.fullName.trim() ||
								!form.role ||
								!emailOk ||
								!hotelId
							}
							onClick={add}
						>
							Add staff
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
					roleLabel={roleName(form.role)}
					hotelName={hotelName}
					businessName={businessName}
					inviterName={ownerName}
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
							label="Email"
							type="email"
							value={form.email}
							onChange={(v) => set("email", v)}
							placeholder="name@hotel.com"
							hint="They sign in with this"
							required
						/>
						<TextField
							label="Phone"
							value={form.phone}
							onChange={(v) => set("phone", v)}
							placeholder="+234 …"
							hint="For the SMS invite"
						/>
					</FieldRow>
					<SelectField
						label="Hotel"
						value={hotelId}
						onChange={(v) => set("hotelId", v)}
						options={hotels.map((h) => ({ value: h.hotelId, label: h.name }))}
					/>
					<FieldRow>
						<SelectField
							label="Role"
							value={form.role}
							onChange={(v) => set("role", v)}
							options={ROLE_OPTIONS}
							required
						/>
						<TextField
							label="Job title"
							value={form.jobTitle}
							onChange={(v) => set("jobTitle", v)}
							placeholder="e.g. Room attendant"
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
							{ value: "EDIT", label: "Can edit", hint: "Day-to-day work" },
							{
								value: "VIEW",
								label: "View only",
								hint: "Looks, can't change",
							},
						]}
					/>
					<Note tone="info">
						The invite email and SMS are not connected on staging: what would
						have been sent is shown at the top.
					</Note>
				</div>
			)}
		</SidePanel>
	);
}
