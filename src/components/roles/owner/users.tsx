"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { KeyRoundIcon, MailPlusIcon, ShieldCheckIcon, ShieldOffIcon, Trash2Icon, UserRoundIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { AvatarName, DetailList, Note } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, SelectField, TextField, ToggleField } from "@/components/shared/field";
import { fmtWhen, humanize, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { ConfirmModal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { OwnerHotelFinance, PortalUserRow } from "@/lib/demo/fixtures/owner";
import { roleLabels } from "@/lib/roles";
import { useParam } from "./common";

export function OwnerUsers({ users, hotels }: { users: PortalUserRow[]; hotels: OwnerHotelFinance[] }) {
	const [open, setOpen] = useParam("open");
	const [invite, setInvite] = useParam("new");
	const [search, setSearch] = useState("");
	const [change, setChange] = useState<PortalUserRow | null>(null);
	const [remove, setRemove] = useState<PortalUserRow | null>(null);
	const { run, pending } = useDemoAction();
	const selected = users.find((u) => u.id === open) ?? null;
	const cols: ColumnDef<PortalUserRow, unknown>[] = [
		{ accessorKey: "fullName", header: "User", cell: ({ row }) => <AvatarName name={row.original.fullName} secondary={row.original.email} size="sm" /> },
		{ accessorKey: "role", header: "Role", cell: ({ row }) => roleLabels[row.original.role] },
		{ accessorKey: "hotels", header: "Hotels", cell: ({ row }) => row.original.hotels.join(", ") },
		{ accessorKey: "twoStep", header: "2-step", cell: ({ row }) => (row.original.twoStep ? <StatusPill tone="success" dot={false}>On</StatusPill> : <StatusPill tone="warning" dot={false}>Off</StatusPill>) },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "ACTIVE" ? "success" : row.original.status === "INVITED" ? "info" : "warning"}>{humanize(row.original.status)}</StatusPill> },
		{ accessorKey: "lastSignIn", header: "Last sign-in", cell: ({ row }) => fmtWhen(row.original.lastSignIn) },
		{ id: "actions", header: "", cell: ({ row }) => <RowActions actions={[{ label: "View profile", icon: UserRoundIcon, onClick: () => setOpen(row.original.id) }, { label: "Change role & hotels", icon: ShieldCheckIcon, onClick: () => setChange(row.original) }, { label: "Reset password", icon: KeyRoundIcon, onClick: () => run(`Reset link sent to ${row.original.email}`) }, { label: "Remove access", icon: Trash2Icon, tone: "danger", separatorBefore: true, disabled: row.original.role === "OWNER", onClick: () => setRemove(row.original) }]} /> },
	];
	return (
		<>
			<PageHeader title="Users" subtitle="People who can sign in to this portal · staff on the tablets are managed under Staff">
				<Button className={btn.primary} onClick={() => setInvite("1")}><MailPlusIcon className="size-4" /> Invite user</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Portal users" value={users.length} icon={UsersIcon} hint={`${users.filter((u) => u.status === "ACTIVE").length} can sign in`} />
				<KpiCard label="Invites waiting" value={users.filter((u) => u.status === "INVITED").length} icon={MailPlusIcon} />
				<KpiCard label="Without 2-step" value={users.filter((u) => !u.twoStep && u.status === "ACTIVE").length} icon={ShieldOffIcon} pill={<StatusPill tone="warning" dot={false}>Fix</StatusPill>} />
				<KpiCard label="Managers" value={users.filter((u) => u.role === "MANAGER").length} icon={ShieldCheckIcon} hint={`one per ${plural(hotels.length, "hotel")}`} />
			</div>
			<Toolbar left={<SearchBox value={search} onChange={setSearch} placeholder="Name or email" />} />
			<DataTable columns={cols} data={users} search={search} onRowClick={(u) => setOpen(u.id)} />

			<SidePanel open={!!selected} onOpenChange={(o) => !o && setOpen(null)} title={selected?.fullName ?? ""} subtitle={selected ? `${roleLabels[selected.role]} · ${selected.hotels.join(", ")}` : undefined} icon={UserRoundIcon} footer={selected && <><Button variant="outline" className={btn.secondary} onClick={() => setChange(selected)}>Change role & hotels</Button>{selected.status === "INVITED" && <Button className={btn.primary} onClick={() => run("Invite resent")}>Resend invite</Button>}</>}>
				{selected && (
					<div className="flex flex-col gap-6">
						<div className="flex items-center gap-2"><StatusPill tone={selected.status === "ACTIVE" ? "success" : selected.status === "INVITED" ? "info" : "warning"}>{humanize(selected.status)}</StatusPill>{!selected.twoStep && <StatusPill tone="warning" dot={false}>No 2-step login</StatusPill>}</div>
						<PanelSection title="Contact"><DetailList columns={2} items={[{ label: "Email", value: selected.email }, { label: "Phone", value: selected.phone }, { label: "Last sign-in", value: fmtWhen(selected.lastSignIn) }]} /></PanelSection>
						<PanelSection title="Access"><DetailList columns={2} items={[{ label: "Role", value: roleLabels[selected.role] }, { label: "Hotels", value: selected.hotels.join(", ") }]} /></PanelSection>
						{!selected.twoStep && <Note tone="warning">Ask them to turn on 2-step login under My profile & security. You can require it for everyone in Settings.</Note>}
					</div>
				)}
			</SidePanel>

			<InvitePanel open={invite === "1"} hotels={hotels} onClose={() => setInvite(null)} />
			<ChangeRolePanel user={change} hotels={hotels} onClose={() => setChange(null)} />
			<ConfirmModal open={!!remove} onOpenChange={(o) => !o && setRemove(null)} title={`Remove ${remove?.fullName}'s access?`} subtitle={remove?.email} tone="danger" confirmLabel="Remove access" pending={pending} onConfirm={() => run(`${remove?.fullName} removed`, () => setRemove(null))} alternative={{ label: "Pause access instead", onClick: () => run(`${remove?.fullName} paused`, () => setRemove(null)) }}>
				<WhatHappens tone="danger" items={["They are signed out everywhere", "Their actions stay in the activity log", "You can invite them again later"]} />
			</ConfirmModal>
		</>
	);
}

function InvitePanel({ open, hotels, onClose }: { open: boolean; hotels: OwnerHotelFinance[]; onClose: () => void }) {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [role, setRole] = useState("MANAGER");
	const [all, setAll] = useState(false);
	const [hotel, setHotel] = useState(hotels[0]?.hotelId ?? "");
	const { run, pending } = useDemoAction();
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title="Invite a user" subtitle="They get an email to set a password and 2-step login" icon={MailPlusIcon} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !email} onClick={() => run(`Invite sent to ${email}`, onClose)}>Send invite</Button></>}>
			<div className="flex flex-col gap-4">
				<FieldRow><TextField label="Full name" value={name} onChange={setName} /><TextField label="Email" value={email} onChange={setEmail} type="email" required /></FieldRow>
				<ChoiceCards label="Role" value={role} onChange={setRole} options={[{ value: "MANAGER", label: "Manager", hint: "Runs one hotel end to end" }, { value: "FINANCE", label: "Finance", hint: "Money, tills, night audit, organizations" }, { value: "INVENTORY", label: "Inventory", hint: "Stores, orders and deliveries" }]} />
				<ToggleField label="Every hotel" hint="Including hotels you add later" checked={all} onChange={setAll} />
				{!all && <SelectField label="Hotel" value={hotel} onChange={setHotel} options={hotels.map((h) => ({ value: h.hotelId, label: h.name }))} />}
			</div>
		</SidePanel>
	);
}

function ChangeRolePanel({ user, hotels, onClose }: { user: PortalUserRow | null; hotels: OwnerHotelFinance[]; onClose: () => void }) {
	const [role, setRole] = useState(user?.role ?? "MANAGER");
	const [sel, setSel] = useState<string[]>([]);
	const { run, pending } = useDemoAction();
	const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
	return (
		<SidePanel open={!!user} onOpenChange={(o) => !o && onClose()} title="Change role & hotels" subtitle={user?.fullName} icon={ShieldCheckIcon} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Access updated · they are told", onClose)}>Save changes</Button></>}>
			<div className="flex flex-col gap-4">
				<SelectField label="Role" value={role} onChange={(v) => setRole(v as PortalUserRow["role"])} options={[{ value: "MANAGER", label: "Manager" }, { value: "FINANCE", label: "Finance" }, { value: "INVENTORY", label: "Inventory" }, { value: "FRONT_OFFICE", label: "Front office" }]} />
				<div className="flex flex-col gap-2">
					<span className="text-[13px] font-medium text-ink-2">Hotels</span>
					{hotels.map((h) => (
						<label key={h.hotelId} className="flex items-center gap-3 rounded-control border border-line px-4 py-3 text-[13px] text-ink"><input type="checkbox" checked={sel.includes(h.hotelId) || user?.hotels.includes(h.name) || user?.hotels.includes("All hotels")} onChange={() => toggle(h.hotelId)} className="accent-brand" />{h.name}</label>
					))}
				</div>
				<WhatHappens items={["Their current session ends and they sign in again", "The change is logged under your name"]} />
			</div>
		</SidePanel>
	);
}
