"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	KeyRoundIcon,
	MailPlusIcon,
	PauseCircleIcon,
	PlayCircleIcon,
	ShieldCheckIcon,
	ShieldOffIcon,
	Trash2Icon,
	UserRoundIcon,
	UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	changeAccess,
	createUser,
	grantRole,
	pauseAll,
	resendInvite,
	resetPassword,
} from "@hospio/api/actions/identity";
import { useAction } from "@hospio/api/actions/use-action";
import type { UserCreated } from "@hospio/api/api/schema";
import type { PageResult } from "@hospio/api/data/paging";
import type { OwnerHotelRow, PortalUserRow } from "@hospio/api/data/types";
import { type HotelRole, isHotelRole, roleLabels } from "@hospio/api/roles";
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
import { fmtWhen, humanize, plural } from "@hospio/ui/shared/format";
import { InviteCard } from "@hospio/ui/shared/invite-card";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { useListParams } from "@hospio/ui/shared/list-params";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useParam } from "./common";

const PORTAL_ROLES = [
	{ value: "MANAGER", label: "Manager", hint: "Runs one hotel end to end" },
	{
		value: "FINANCE",
		label: "Finance",
		hint: "Money, tills, night audit, organizations",
	},
	{
		value: "INVENTORY",
		label: "Inventory",
		hint: "Stores, orders and deliveries",
	},
];

type Credentials = {
	user: {
		fullName: string;
		email: string;
		phone?: string;
		role: HotelRole;
		hotels: string[];
	};
	created: UserCreated;
	title: string;
};

const statusTone = (s: PortalUserRow["status"]) =>
	s === "ACTIVE"
		? "success"
		: s === "INVITED"
			? "info"
			: s === "SUSPENDED"
				? "danger"
				: "warning";
const hotelsLabel = (u: PortalUserRow) =>
	u.hotels.length ? u.hotels.join(", ") : "No hotel yet";

/** Hotel Owner · 08 Users (Figma 3079:15815): portal logins, live on identity-service. */
export function OwnerUsers({
	result,
	overall,
	hotels,
	businessName,
	ownerName,
}: {
	/** The page of people on screen (`?q=&status=&page=`). */
	result: PageResult<PortalUserRow>;
	/** Counts over everyone (no search or status), for the cards. */
	overall: PageResult<PortalUserRow>;
	hotels: OwnerHotelRow[];
	businessName: string;
	ownerName: string;
}) {
	const router = useRouter();
	const list = useListParams();
	const users = result.data.content;
	const all = overall.data.counts ?? result.data.counts ?? {};
	const counts = result.data.counts ?? {};
	const [open, setOpen] = useParam("open");
	const [invite, setInvite] = useParam("new");
	const [change, setChange] = useState<PortalUserRow | null>(null);
	const [remove, setRemove] = useState<PortalUserRow | null>(null);
	const [reset, setReset] = useState<PortalUserRow | null>(null);
	const [creds, setCreds] = useState<Credentials | null>(null);
	const { run, pending } = useAction();
	const selected = users.find((u) => u.id === open) ?? null;
	const refresh = () => router.refresh();

	const togglePause = (u: PortalUserRow) =>
		run(
			() => pauseAll(u.userId, u.status !== "PAUSED"),
			u.status === "PAUSED"
				? `${u.fullName} can sign in again`
				: `${u.fullName}'s access is paused`,
			refresh,
		);
	const resend = (u: PortalUserRow) =>
		run(
			() => withDeliveries(resendInvite(u.userId), `Invite for ${u.fullName}`),
			"New invite ready",
			(created) =>
				setCreds({ user: u, created, title: `New invite for ${u.fullName}` }),
		);

	const actionsFor = (u: PortalUserRow) => [
		{
			label: "View profile",
			icon: UserRoundIcon,
			onClick: () => setOpen(u.id),
		},
		{
			label: "Change role & hotels",
			icon: ShieldCheckIcon,
			onClick: () => setChange(u),
			disabled: u.role === "OWNER",
		},
		...(u.inviteStatus === "PENDING" || u.inviteStatus === "EXPIRED"
			? [
					{
						label: "Resend invite",
						icon: MailPlusIcon,
						onClick: () => resend(u),
					},
				]
			: []),
		{ label: "Reset password", icon: KeyRoundIcon, onClick: () => setReset(u) },
		u.status === "PAUSED"
			? {
					label: "Resume access",
					icon: PlayCircleIcon,
					separatorBefore: true,
					onClick: () => togglePause(u),
					disabled: u.role === "OWNER",
				}
			: {
					label: "Pause access",
					icon: PauseCircleIcon,
					separatorBefore: true,
					onClick: () => togglePause(u),
					disabled: u.role === "OWNER",
				},
		{
			label: "Remove access",
			icon: Trash2Icon,
			tone: "danger" as const,
			disabled: u.role === "OWNER",
			onClick: () => setRemove(u),
		},
	];

	const cols: ColumnDef<PortalUserRow, unknown>[] = [
		{
			accessorKey: "fullName",
			header: "User",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.fullName}
					photo={row.original.photo}
					secondary={row.original.email}
					size="sm"
				/>
			),
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => roleLabels[row.original.role],
		},
		{
			accessorKey: "hotels",
			header: "Hotels",
			cell: ({ row }) => hotelsLabel(row.original),
		},
		{
			accessorKey: "inviteStatus",
			header: "Invite",
			cell: ({ row }) =>
				row.original.inviteStatus === "PENDING" ? (
					<StatusPill tone="info" dot={false}>
						Waiting
					</StatusPill>
				) : row.original.inviteStatus === "EXPIRED" ? (
					<StatusPill tone="warning" dot={false}>
						Expired
					</StatusPill>
				) : (
					<span className="text-ink-3">—</span>
				),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone(row.original.status)}>
					{humanize(row.original.status)}
				</StatusPill>
			),
		},
		{
			accessorKey: "lastSignIn",
			header: "Last sign-in",
			cell: ({ row }) => fmtWhen(row.original.lastSignIn),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => <RowActions actions={actionsFor(row.original)} />,
		},
	];

	return (
		<>
			<PageHeader
				title="Users"
				subtitle="People who can sign in to this portal · staff on the tablets are managed by each hotel's manager under Staff"
			>
				<Button className={btn.primary} onClick={() => setInvite("1")}>
					<MailPlusIcon className="size-4" /> Invite user
				</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Portal users"
					value={all.all ?? 0}
					icon={UsersIcon}
					hint={`${all.ACTIVE ?? 0} can sign in`}
				/>
				<KpiCard
					label="Invites waiting"
					value={all.INVITE_PENDING ?? 0}
					icon={MailPlusIcon}
					hint={`${all.INVITE_EXPIRED ?? 0} expired`}
				/>
				<KpiCard
					label="Paused"
					value={(all.PAUSED ?? 0) + (all.SUSPENDED ?? 0)}
					icon={ShieldOffIcon}
				/>
				<KpiCard
					label="Managers"
					value={all.MANAGER ?? 0}
					icon={ShieldCheckIcon}
					hint={`for ${plural(hotels.length, "hotel")}`}
				/>
			</div>
			<Toolbar
				left={
					<SearchBox
						value={list.search}
						onChange={list.setSearch}
						placeholder="Name, email or phone"
					/>
				}
				right={
					<FilterSelect
						value={list.params.status ?? ""}
						onChange={(v) => list.set({ status: v })}
						all={`Everyone (${counts.all ?? 0})`}
						options={[
							{ value: "ACTIVE", label: `Active (${counts.ACTIVE ?? 0})` },
							{ value: "PAUSED", label: `Paused (${counts.PAUSED ?? 0})` },
							{
								value: "SUSPENDED",
								label: `Suspended (${counts.SUSPENDED ?? 0})`,
							},
						]}
					/>
				}
			/>
			<DataTable
				columns={cols}
				data={users}
				server={{
					page: result.data,
					onPage: list.goTo,
					sort: list.sort,
					onSort: list.setSort,
					sortKeys: { fullName: "fullName", lastSignIn: "lastSignInAt" },
				}}
				filtered={list.filtered}
				onClearFilters={list.clear}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={(u) => setOpen(u.id)}
				emptyTitle="No portal users yet"
				emptyHint="Invite a manager, finance or inventory user."
			/>

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && setOpen(null)}
				title={selected?.fullName ?? ""}
				subtitle={
					selected
						? `${roleLabels[selected.role]} · ${hotelsLabel(selected)}`
						: undefined
				}
				icon={UserRoundIcon}
				footer={
					selected && (
						<>
							{selected.role !== "OWNER" && (
								<Button
									variant="outline"
									className={btn.secondary}
									onClick={() => setChange(selected)}
								>
									Change role & hotels
								</Button>
							)}
							{(selected.inviteStatus === "PENDING" ||
								selected.inviteStatus === "EXPIRED") && (
								<Button
									className={btn.primary}
									disabled={pending}
									onClick={() => resend(selected)}
								>
									Resend invite
								</Button>
							)}
						</>
					)
				}
			>
				{selected && (
					<div className="flex flex-col gap-6">
						<div className="flex items-center gap-2">
							<StatusPill tone={statusTone(selected.status)}>
								{humanize(selected.status)}
							</StatusPill>
							{selected.inviteStatus === "PENDING" && (
								<StatusPill tone="info" dot={false}>
									Invite not accepted yet
								</StatusPill>
							)}
							{selected.mustChangePassword && (
								<StatusPill tone="warning" dot={false}>
									Temporary password
								</StatusPill>
							)}
						</div>
						<PanelSection title="Contact">
							<DetailList
								columns={2}
								items={[
									{ label: "Email", value: selected.email },
									{ label: "Phone", value: selected.phone || "—" },
									{
										label: "Last sign-in",
										value: fmtWhen(selected.lastSignIn),
									},
									{ label: "Added", value: fmtWhen(selected.createdAt) },
								]}
							/>
						</PanelSection>
						<PanelSection title="Access">
							{selected.grants.length === 0 ? (
								<Note tone="warning">No roles yet.</Note>
							) : (
								<ul className="divide-y divide-line rounded-xl border border-line">
									{selected.grants.map((g) => (
										<li
											key={g.id}
											className="flex items-center gap-3 px-3 py-[10px] text-[13px]"
										>
											<span className="flex-1 font-medium text-ink">
												{isHotelRole(g.role) ? roleLabels[g.role] : g.role}
											</span>
											<span className="text-ink-2">
												{g.hotelName ?? (g.hotelId ? "Hotel" : "All hotels")}
											</span>
											<StatusPill
												dot={false}
												tone={g.paused ? "warning" : "success"}
											>
												{g.paused
													? "Paused"
													: g.level === "FULL"
														? "Full"
														: g.level === "EDIT"
															? "Can edit"
															: "View"}
											</StatusPill>
										</li>
									))}
								</ul>
							)}
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<InvitePanel
				open={invite === "1"}
				hotels={hotels}
				onClose={() => setInvite(null)}
				businessName={businessName}
				ownerName={ownerName}
			/>
			<ChangeRolePanel
				user={change}
				hotels={hotels}
				onClose={() => setChange(null)}
			/>
			<ConfirmModal
				open={!!reset}
				onOpenChange={(o) => !o && setReset(null)}
				title={`Reset ${reset?.fullName}'s password?`}
				subtitle={reset?.email}
				confirmLabel="Reset password"
				pending={pending}
				onConfirm={() =>
					reset &&
					run(
						() =>
							withDeliveries(
								resetPassword(reset.userId),
								`New password for ${reset.fullName}`,
							),
						"Temporary password ready",
						(created) => {
							setCreds({
								user: reset,
								created,
								title: `New password for ${reset.fullName}`,
							});
							setReset(null);
						},
					)
				}
			>
				<WhatHappens
					items={[
						"Their current password stops working",
						"A temporary password is emailed to them and shown to you once",
						"They choose a new one at their next sign-in",
					]}
				/>
			</ConfirmModal>
			<ConfirmModal
				open={!!remove}
				onOpenChange={(o) => !o && setRemove(null)}
				title={`Remove ${remove?.fullName}'s access?`}
				subtitle={remove?.email}
				tone="danger"
				confirmLabel="Remove access"
				pending={pending}
				onConfirm={() =>
					remove &&
					run(
						async () => {
							for (const g of remove.grants) {
								const r = await changeAccess(remove.userId, g.id, {
									change: "REMOVE",
									allowLastRole: true,
								});
								if (!r.ok) return r;
							}
							return { ok: true as const, data: null };
						},
						`${remove.fullName} removed`,
						() => {
							setRemove(null);
							refresh();
						},
					)
				}
				alternative={{
					label: "Pause access instead",
					onClick: () =>
						remove &&
						run(
							() => pauseAll(remove.userId, true),
							`${remove.fullName} paused`,
							() => {
								setRemove(null);
								refresh();
							},
						),
				}}
			>
				<WhatHappens
					tone="danger"
					items={[
						"Every role they hold is removed and they are signed out",
						"Their actions stay in the activity log",
						"You can invite them again later",
					]}
				/>
			</ConfirmModal>
			<Modal
				open={!!creds}
				onOpenChange={(o) => !o && setCreds(null)}
				title={creds?.title ?? ""}
				subtitle="Emailed to them · shown here once"
				icon={KeyRoundIcon}
				footer={
					<Button
						className={btn.primary}
						onClick={() => {
							setCreds(null);
							refresh();
						}}
					>
						Done
					</Button>
				}
			>
				{creds && (
					<InviteCard
						title={creds.title}
						fullName={creds.user.fullName}
						email={creds.user.email}
						phone={creds.user.phone}
						roleLabel={roleLabels[creds.user.role]}
						hotelName={creds.user.hotels[0]}
						businessName={businessName}
						inviterName={ownerName}
						temporaryPassword={creds.created.temporaryPassword}
						inviteToken={creds.created.inviteToken}
						inviteExpiresAt={creds.created.inviteExpiresAt}
						temporaryPasswordExpiresAt={
							creds.created.temporaryPasswordExpiresAt
						}
					/>
				)}
			</Modal>
		</>
	);
}

/** Invite a user (Figma 3079:16799) → POST /identity/users; the panel then shows the password and link. */
function InvitePanel({
	open,
	hotels,
	onClose,
	businessName,
	ownerName,
}: {
	open: boolean;
	hotels: OwnerHotelRow[];
	onClose: () => void;
	businessName: string;
	ownerName: string;
}) {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [role, setRole] = useState("MANAGER");
	const [hotel, setHotel] = useState(hotels[0]?.hotelId ?? "");
	const [created, setCreated] = useState<UserCreated | null>(null);
	const { run, pending } = useAction();
	const valid =
		name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email) && !!hotel;
	const hotelName = hotels.find((h) => h.hotelId === hotel)?.name;
	const close = () => {
		setCreated(null);
		setName("");
		setEmail("");
		setPhone("");
		onClose();
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && close()}
			title={created ? `${name} is invited` : "Invite a user"}
			subtitle={
				created
					? "Send them the link or the temporary password"
					: "They get a temporary password and a link to set their own"
			}
			icon={MailPlusIcon}
			footer={
				created ? (
					<Button className={btn.primary} onClick={close}>
						Done
					</Button>
				) : (
					<>
						<Button variant="outline" className={btn.secondary} onClick={close}>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || !valid}
							onClick={() =>
								run(
									() =>
										withDeliveries(
											createUser({
												fullName: name.trim(),
												email: email.trim(),
												phone: phone.trim() || null,
												role,
												level: "FULL",
												hotelId: hotel,
											}),
											`Invite for ${name.trim()}`,
										),
									`${name.trim()} invited`,
									setCreated,
								)
							}
						>
							Create login
						</Button>
					</>
				)
			}
		>
			{created ? (
				<InviteCard
					fullName={name.trim()}
					email={email.trim()}
					phone={phone}
					roleLabel={isHotelRole(role) ? roleLabels[role] : role}
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
					<FieldRow>
						<TextField
							label="Full name"
							value={name}
							onChange={setName}
							required
						/>
						<TextField
							label="Email"
							value={email}
							onChange={setEmail}
							type="email"
							required
						/>
					</FieldRow>
					<TextField
						label="Phone"
						value={phone}
						onChange={setPhone}
						type="tel"
						placeholder="+234 …"
						hint="Optional · SMS and WhatsApp invites are coming soon"
					/>
					<ChoiceCards
						label="Role"
						value={role}
						onChange={setRole}
						options={PORTAL_ROLES}
					/>
					<SelectField
						label="Hotel"
						value={hotel}
						onChange={setHotel}
						options={hotels.map((h) => ({ value: h.hotelId, label: h.name }))}
						required
						hint="Every role is given per hotel; add more hotels afterwards from Change role & hotels"
					/>
					{hotels.length === 0 && (
						<Note tone="warning">
							Add a hotel first; portal users are given access per hotel.
						</Note>
					)}
				</div>
			)}
		</SidePanel>
	);
}

/** Change role & hotels (Figma 3079:17182): grants are added with POST /users/{id}/roles and removed with PUT …/roles/{grantId}. */
function ChangeRolePanel({
	user,
	hotels,
	onClose,
}: {
	user: PortalUserRow | null;
	hotels: OwnerHotelRow[];
	onClose: () => void;
}) {
	const [role, setRole] = useState<string>(user?.role ?? "MANAGER");
	const [sel, setSel] = useState<string[]>(user?.hotelIds ?? []);
	const [last, setLast] = useState(user?.id);
	if (user?.id !== last) {
		setLast(user?.id);
		setRole(user?.role ?? "MANAGER");
		setSel(user?.hotelIds ?? []);
	}
	const { run, pending } = useAction();
	const toggle = (id: string) =>
		setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

	function save() {
		if (!user) return;
		run(
			async () => {
				const keep = new Set<string>();
				for (const g of user.grants) {
					if (g.role === role && g.hotelId && sel.includes(g.hotelId))
						keep.add(g.id);
				}
				// New roles first, then the old ones go, so the person is never left without a role in between.
				const have = new Set(
					user.grants.filter((g) => keep.has(g.id)).map((g) => g.hotelId),
				);
				for (const hotelId of sel) {
					if (have.has(hotelId)) continue;
					const r = await grantRole(user.userId, {
						role,
						level: "FULL",
						hotelId,
					});
					if (!r.ok) return r;
				}
				for (const g of user.grants) {
					if (keep.has(g.id) || g.role === "OWNER") continue;
					const r = await changeAccess(user.userId, g.id, {
						change: "REMOVE",
						reason: "Role or hotels changed by the owner",
						allowLastRole: true,
					});
					if (!r.ok) return r;
				}
				return { ok: true as const, data: null };
			},
			"Access updated",
			onClose,
		);
	}

	return (
		<SidePanel
			open={!!user}
			onOpenChange={(o) => !o && onClose()}
			title="Change role & hotels"
			subtitle={user?.fullName}
			icon={ShieldCheckIcon}
			footer={
				<>
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={onClose}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || sel.length === 0}
						onClick={save}
					>
						Save changes
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Role"
					value={role}
					onChange={setRole}
					options={[
						...PORTAL_ROLES.map((r) => ({ value: r.value, label: r.label })),
						{ value: "FRONT_OFFICE", label: "Front office" },
					]}
				/>
				<div className="flex flex-col gap-2">
					<span className="text-[13px] font-medium text-ink-2">Hotels</span>
					{hotels.map((h) => (
						<label
							key={h.hotelId}
							className="flex items-center gap-3 rounded-control border border-line px-4 py-3 text-[13px] text-ink"
						>
							<input
								type="checkbox"
								checked={sel.includes(h.hotelId)}
								onChange={() => toggle(h.hotelId)}
								className="accent-brand"
							/>
							{h.name}
						</label>
					))}
					{sel.length === 0 && (
						<p className="text-xs text-danger">
							Pick at least one hotel, or use Remove access
						</p>
					)}
				</div>
				<WhatHappens
					items={[
						"Roles not ticked here are removed; new ones are added at Full level",
						"They sign in again to pick up the change",
						"The change is logged under your name",
					]}
				/>
			</div>
		</SidePanel>
	);
}
