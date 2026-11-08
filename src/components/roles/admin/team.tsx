"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheckIcon, UserPlusIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { ChoiceCards, FieldRow, TextField } from "@/components/shared/field";
import { fmtAgo } from "@/components/shared/format";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { AdminUserRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import type { AdminRole } from "@/lib/demo/fixtures/platform-extra";
import { cn } from "@/lib/utils";
import { adminRoleLabel, can, ReadOnlyNote } from "./shared";

const roleOptions = [
	{ value: "SUPPORT" as const, label: "Support", hint: "Businesses, onboarding, tickets, edits as H.M.S" },
	{ value: "FINANCE_ADMIN" as const, label: "Finance admin", hint: "Fees, payouts, marketer commissions" },
	{ value: "SUPER_ADMIN" as const, label: "Super admin", hint: "Everything, including this team and settings" },
];

export function TeamScreen({ role, users: initial }: { role: AdminRole; users: AdminUserRow[] }) {
	const [users, setUsers] = useState(initial);
	const [isNew, setNew] = useQueryState("new");
	const [edit, setEdit] = useState<AdminUserRow | null>(null);
	const [remove, setRemove] = useState<AdminUserRow | null>(null);
	const { run, pending } = useDemoAction();
	const admin = can.team(role);
	const update = (u: AdminUserRow) => setUsers((all) => all.map((x) => (x.id === u.id ? u : x)));

	const columns: ColumnDef<AdminUserRow, unknown>[] = [
		{ accessorKey: "fullName", header: "Person", cell: ({ row }) => <TwoLine primary={row.original.fullName} secondary={row.original.email} /> },
		{ accessorKey: "role", header: "Role", cell: ({ row }) => <StatusPill tone={row.original.role === "SUPER_ADMIN" ? "brand" : row.original.role === "SUPPORT" ? "info" : "warning"} dot={false}>{adminRoleLabel[row.original.role]}</StatusPill> },
		{ accessorKey: "twoStep", header: "2-step", cell: ({ row }) => (row.original.twoStep ? <StatusPill tone="success">on</StatusPill> : <StatusPill tone="danger">off</StatusPill>) },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "ACTIVE" ? "success" : "grey"}>{row.original.status.toLowerCase()}</StatusPill> },
		{ accessorKey: "lastSignIn", header: "Last sign-in", cell: ({ row }) => <span className="text-ink-3">{row.original.lastSignIn ? fmtAgo(row.original.lastSignIn) : "never"}</span> },
		{ id: "actions", header: "", cell: ({ row }) => admin ? <RowActions actions={[
			{ label: "Change role", onClick: () => setEdit(row.original) },
			{ label: "Reset password", onClick: () => run(`Reset link sent to ${row.original.email}`) },
			{ label: row.original.twoStep ? "Reset 2-step" : "Require 2-step now", onClick: () => run(`${row.original.fullName} will set up 2-step at next sign-in`, () => update({ ...row.original, twoStep: false })) },
			{ label: row.original.status === "ACTIVE" ? "Pause access" : "Unpause", separatorBefore: true, onClick: () => run(`${row.original.fullName} ${row.original.status === "ACTIVE" ? "paused" : "unpaused"}`, () => update({ ...row.original, status: row.original.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })) },
			{ label: "Remove from team", tone: "danger", onClick: () => setRemove(row.original) },
		]} /> : null },
	];

	return (
		<>
			<PageHeader title="Admin team" subtitle={`${users.filter((u) => u.status === "ACTIVE").length} active · everyone needs 2-step sign-in`}>
				{admin && <button type="button" onClick={() => setNew("1")} className={cn(btn.primary, "flex items-center gap-2")}><UserPlusIcon className="size-4" /> Add an admin</button>}
			</PageHeader>
			{!admin && <ReadOnlyNote>Only a Super admin changes the team.</ReadOnlyNote>}
			<DataTable columns={columns} data={users} />

			<AddAdminPanel open={isNew === "1"} onOpenChange={(o) => void setNew(o ? "1" : null)} onCreate={(u) => { setUsers((all) => [u, ...all]); void setNew(null); }} />

			<Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={`Change ${edit?.fullName}'s role`} icon={ShieldCheckIcon} size="form"
				footer={<><button type="button" className={btn.secondary} onClick={() => setEdit(null)}>Cancel</button><button type="button" className={btn.primary} disabled={pending} onClick={() => edit && run(`${edit.fullName} is now ${adminRoleLabel[edit.role]}`, () => { update(edit); setEdit(null); })}>Save role</button></>}
			>
				{edit && <ChoiceCards value={edit.role} onChange={(v) => setEdit({ ...edit, role: v })} options={roleOptions} />}
			</Modal>

			<ConfirmModal open={!!remove} onOpenChange={(o) => !o && setRemove(null)} tone="danger" title={`Remove ${remove?.fullName} from the team?`} subtitle="They are signed out now and can't sign in again" confirmLabel="Remove" pending={pending}
				alternative={{ label: "Pause access instead", onClick: () => remove && run(`${remove.fullName} paused`, () => { update({ ...remove, status: "PAUSED" }); setRemove(null); }) }}
				onConfirm={() => remove && run(`${remove.fullName} removed`, () => { setUsers((all) => all.filter((u) => u.id !== remove.id)); setRemove(null); })}>
				<WhatHappens tone="danger" items={["Their sessions end immediately", "Their past actions stay in the activity log", "Tickets assigned to them become unassigned"]} />
			</ConfirmModal>
		</>
	);
}

function AddAdminPanel({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (u: AdminUserRow) => void }) {
	const { run, pending } = useDemoAction();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<AdminRole>("SUPPORT");
	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="Add an admin" subtitle="They get an email to set a password and 2-step" icon={UserPlusIcon} width="md"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button>
					<button type="button" className={btn.primary} disabled={!name || !email || pending} onClick={() => run(`Invite sent to ${email}`, () => { onCreate({ id: `au-${Date.now()}`, fullName: name, email, role, status: "ACTIVE", twoStep: false }); setName(""); setEmail(""); })}>Send invite</button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<PanelSection title="Who">
					<FieldRow>
						<TextField label="Full name" value={name} onChange={setName} required />
						<TextField label="Work email" type="email" value={email} onChange={setEmail} placeholder="name@hospio360.com" required />
					</FieldRow>
				</PanelSection>
				<PanelSection title="Role">
					<ChoiceCards value={role} onChange={setRole} options={roleOptions} />
				</PanelSection>
			</div>
		</SidePanel>
	);
}
