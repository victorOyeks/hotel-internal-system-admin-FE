"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { KeyRoundIcon, ShieldCheckIcon, UserPlusIcon } from "lucide-react";
import { useQueryState } from "nuqs";
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
import type { TeamMemberRow } from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { ChoiceCards, FieldRow, TextField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtLongDate } from "@hospio/ui/shared/format";
import { CopyValue, InviteCard } from "@hospio/ui/shared/invite-card";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { useRefresh } from "./live";
import { adminRoleLabel, can, ReadOnlyNote } from "./shared";

const roleOptions = [
	{
		value: "SUPPORT" as const,
		label: "Support",
		hint: "Businesses, onboarding, tickets, edits as H.M.S",
	},
	{
		value: "FINANCE_ADMIN" as const,
		label: "Finance admin",
		hint: "Fees, payouts, marketer commissions",
	},
	{
		value: "SUPER_ADMIN" as const,
		label: "Super admin",
		hint: "Everything, including this team and settings",
	},
];

/** Admin — H1 · Admin team: identity users with scope=platform; every action writes to identity. */
export function TeamScreen({
	role,
	users: initial,
	inviterName,
}: {
	role: AdminRole;
	users: TeamMemberRow[];
	inviterName: string;
}) {
	const [users, setUsers] = useState(initial);
	const [isNew, setNew] = useQueryState("new");
	const [edit, setEdit] = useState<TeamMemberRow | null>(null);
	const [editRole, setEditRole] = useState<AdminRole>("SUPPORT");
	const [remove, setRemove] = useState<TeamMemberRow | null>(null);
	const [secret, setSecret] = useState<{
		user: TeamMemberRow;
		created: UserCreated;
		what: "password" | "invite";
	} | null>(null);
	const { run, pending } = useAction();
	const { refresh } = useRefresh();
	const admin = can.team(role);
	const update = (u: TeamMemberRow) =>
		setUsers((all) => all.map((x) => (x.id === u.id ? u : x)));

	const columns: ColumnDef<TeamMemberRow, unknown>[] = [
		{
			accessorKey: "fullName",
			header: "Person",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.fullName}
					secondary={row.original.email}
				/>
			),
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => (
				<StatusPill
					tone={
						row.original.role === "SUPER_ADMIN"
							? "brand"
							: row.original.role === "SUPPORT"
								? "info"
								: "warning"
					}
					dot={false}
				>
					{adminRoleLabel[row.original.role]}
				</StatusPill>
			),
		},
		{
			accessorKey: "twoStep",
			header: "2-step",
			cell: ({ row }) =>
				row.original.twoStep ? (
					<StatusPill tone="success">on</StatusPill>
				) : (
					<StatusPill tone="grey">off</StatusPill>
				),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) =>
				row.original.inviteStatus === "PENDING" ||
				row.original.inviteStatus === "EXPIRED" ? (
					<StatusPill tone="info">invited</StatusPill>
				) : (
					<StatusPill
						tone={row.original.status === "ACTIVE" ? "success" : "grey"}
					>
						{row.original.status.toLowerCase()}
					</StatusPill>
				),
		},
		{
			accessorKey: "lastSignIn",
			header: "Last sign-in",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{row.original.lastSignIn ? fmtAgo(row.original.lastSignIn) : "never"}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const u = row.original;
				if (!admin) return null;
				return (
					<RowActions
						actions={[
							{
								label: "Change role",
								onClick: () => {
									setEdit(u);
									setEditRole(u.role);
								},
							},
							{
								label: "Reset password",
								icon: KeyRoundIcon,
								onClick: () =>
									run(
										() =>
											withDeliveries(
												resetPassword(u.userId),
												`Password reset for ${u.fullName}`,
											),
										"Temporary password ready",
										(created) =>
											setSecret({ user: u, created, what: "password" }),
									),
							},
							...(u.inviteStatus === "PENDING" || u.inviteStatus === "EXPIRED"
								? [
										{
											label: "Resend invite",
											onClick: () =>
												run(
													() =>
														withDeliveries(
															resendInvite(u.userId),
															`Invite for ${u.fullName}`,
														),
													"Invite ready",
													(created: UserCreated) =>
														setSecret({ user: u, created, what: "invite" }),
												),
										},
									]
								: []),
							{
								label: u.status === "ACTIVE" ? "Pause access" : "Resume access",
								separatorBefore: true,
								onClick: () =>
									run(
										() => pauseAll(u.userId, u.status === "ACTIVE"),
										u.status === "ACTIVE"
											? `${u.fullName} paused`
											: `${u.fullName} can sign in again`,
										() =>
											update({
												...u,
												status: u.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
											}),
									),
							},
							{
								label: "Remove from team",
								tone: "danger",
								onClick: () => setRemove(u),
							},
						]}
					/>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				title="Admin team"
				subtitle={`${users.filter((u) => u.status === "ACTIVE").length} active · H.M.S staff who can use this portal`}
			>
				{admin && (
					<button
						type="button"
						onClick={() => setNew("1")}
						className={cn(btn.primary, "flex items-center gap-2")}
					>
						<UserPlusIcon className="size-4" /> Add an admin
					</button>
				)}
			</PageHeader>
			{!admin && (
				<ReadOnlyNote>Only a Super admin changes the team.</ReadOnlyNote>
			)}
			<DataTable
				columns={columns}
				data={users}
				emptyTitle="No platform staff yet"
			/>

			<AddAdminPanel
				open={isNew === "1"}
				inviterName={inviterName}
				onOpenChange={(o) => void setNew(o ? "1" : null)}
				onCreated={() => refresh()}
			/>

			<Modal
				open={!!edit}
				onOpenChange={(o) => !o && setEdit(null)}
				title={`Change ${edit?.fullName}'s role`}
				subtitle="The new role is given first, then the old one is removed"
				icon={ShieldCheckIcon}
				size="form"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setEdit(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || !edit || editRole === edit.role}
							onClick={() =>
								edit &&
								run(
									async () => {
										const granted = await grantRole(edit.userId, {
											role: editRole,
											level: "FULL",
										});
										if (!granted.ok) return granted;
										if (edit.grantId) {
											const removed = await changeAccess(
												edit.userId,
												edit.grantId,
												{
													change: "REMOVE",
													reason: "Role changed from the admin team",
												},
											);
											if (!removed.ok) return removed;
										}
										return granted;
									},
									`${edit.fullName} is now ${adminRoleLabel[editRole]}`,
									() => {
										update({ ...edit, role: editRole });
										setEdit(null);
										refresh();
									},
								)
							}
						>
							Save role
						</button>
					</>
				}
			>
				<ChoiceCards
					value={editRole}
					onChange={setEditRole}
					options={roleOptions}
				/>
			</Modal>

			<ConfirmModal
				open={!!remove}
				onOpenChange={(o) => !o && setRemove(null)}
				tone="danger"
				title={`Remove ${remove?.fullName} from the team?`}
				subtitle="Their platform role is removed; they can no longer sign in here"
				confirmLabel="Remove"
				pending={pending}
				alternative={{
					label: "Pause access instead",
					onClick: () =>
						remove &&
						run(
							() => pauseAll(remove.userId, true),
							`${remove.fullName} paused`,
							() => {
								update({ ...remove, status: "PAUSED" });
								setRemove(null);
							},
						),
				}}
				onConfirm={() =>
					remove &&
					run(
						() =>
							remove.grantId
								? changeAccess(remove.userId, remove.grantId, {
										change: "REMOVE",
										reason: "Removed from the admin team",
										allowLastRole: true,
									})
								: pauseAll(remove.userId, true),
						`${remove.fullName} removed`,
						() => {
							setUsers((all) => all.filter((u) => u.id !== remove.id));
							setRemove(null);
						},
					)
				}
			>
				<WhatHappens
					tone="danger"
					items={[
						"Their sessions end at the next request",
						"Their past actions stay in the activity log",
						"Tickets assigned to them stay assigned until someone reassigns them",
					]}
				/>
			</ConfirmModal>

			<Modal
				open={!!secret}
				onOpenChange={(o) => !o && setSecret(null)}
				title={
					secret?.what === "invite"
						? "Invite ready"
						: "Temporary password ready"
				}
				subtitle={
					secret ? `${secret.user.fullName} · ${secret.user.email}` : undefined
				}
				icon={KeyRoundIcon}
				size="form"
				footer={
					<button
						type="button"
						className={btn.primary}
						onClick={() => setSecret(null)}
					>
						Done
					</button>
				}
			>
				{secret && (
					<div className="flex flex-col gap-3">
						{secret.what === "invite" ? (
							<InviteCard
								fullName={secret.user.fullName}
								email={secret.user.email}
								phone={secret.user.phone}
								roleLabel={adminRoleLabel[secret.user.role]}
								businessName="H.M.S"
								inviterName={inviterName}
								temporaryPassword={secret.created.temporaryPassword}
								inviteToken={secret.created.inviteToken}
								inviteExpiresAt={secret.created.inviteExpiresAt}
								temporaryPasswordExpiresAt={
									secret.created.temporaryPasswordExpiresAt
								}
							/>
						) : (
							<>
								<CopyValue
									label="Temporary password"
									value={secret.created.temporaryPassword ?? ""}
									icon={KeyRoundIcon}
								/>
								<p className="text-xs text-ink-3">
									Shown only now.{" "}
									{secret.created.temporaryPasswordExpiresAt
										? `Works until ${fmtLongDate(secret.created.temporaryPasswordExpiresAt)}; `
										: ""}
									they set their own password at the next sign-in.
								</p>
							</>
						)}
					</div>
				)}
			</Modal>
		</>
	);
}

function AddAdminPanel({
	open,
	onOpenChange,
	onCreated,
	inviterName,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onCreated: () => void;
	inviterName: string;
}) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [role, setRole] = useState<AdminRole>("SUPPORT");
	const [created, setCreated] = useState<UserCreated | null>(null);
	const reset = () => {
		setName("");
		setEmail("");
		setPhone("");
		setRole("SUPPORT");
		setCreated(null);
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => {
				if (!o) reset();
				onOpenChange(o);
			}}
			title="Add an admin"
			subtitle="The invite is emailed to them; the temporary password and link are also shown here once"
			icon={UserPlusIcon}
			width="md"
			footer={
				created ? (
					<button
						type="button"
						className={btn.primary}
						onClick={() => {
							reset();
							onOpenChange(false);
						}}
					>
						Done
					</button>
				) : (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!name || !email || pending}
							onClick={() =>
								run(
									() =>
										withDeliveries(
											createUser({
												fullName: name,
												email,
												phone: phone || null,
												role,
											}),
											`Invite for ${name}`,
										),
									`${name} added`,
									(c) => {
										setCreated(c);
										onCreated();
									},
								)
							}
						>
							Add admin
						</button>
					</>
				)
			}
		>
			{created ? (
				<InviteCard
					fullName={name}
					email={email}
					phone={phone}
					roleLabel={adminRoleLabel[role]}
					businessName="H.M.S"
					inviterName={inviterName}
					temporaryPassword={created.temporaryPassword}
					inviteToken={created.inviteToken}
					inviteExpiresAt={created.inviteExpiresAt}
					temporaryPasswordExpiresAt={created.temporaryPasswordExpiresAt}
				/>
			) : (
				<div className="flex flex-col gap-5">
					<PanelSection title="Who">
						<TextField
							label="Full name"
							value={name}
							onChange={setName}
							required
						/>
						<FieldRow>
							<TextField
								label="Work email"
								type="email"
								value={email}
								onChange={setEmail}
								placeholder="name@hospio360.com"
								required
							/>
							<TextField
								label="Phone"
								value={phone}
								onChange={setPhone}
								placeholder="+234 …"
							/>
						</FieldRow>
					</PanelSection>
					<PanelSection title="Role">
						<ChoiceCards
							value={role}
							onChange={setRole}
							options={roleOptions}
						/>
					</PanelSection>
				</div>
			)}
		</SidePanel>
	);
}
