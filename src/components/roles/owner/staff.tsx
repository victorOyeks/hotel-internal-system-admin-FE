"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, IdCardIcon, KeyRoundIcon, MessageSquareIcon, PauseCircleIcon, PencilIcon, PlusIcon, Trash2Icon, UserRoundIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { AvatarName, DetailList, Note } from "@/components/shared/detail-list";
import { FieldRow, SelectField, TextField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtLongDate, fmtWhen, humanize, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { RowActions } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { StaffRow } from "@/lib/data/types";
import type { OwnerHotelFinance } from "@/lib/demo/fixtures/owner";
import { roleLabels, isHotelRole } from "@/lib/roles";
import { DownloadModal, HotelFilter, useParam } from "./common";

export type OwnerStaff = StaffRow & { hotelName: string };

const statusPill: Record<StaffRow["status"], { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
	ACTIVE: { label: "Active", tone: "success" },
	PAUSED: { label: "Paused", tone: "warning" },
	SUSPENDED: { label: "Suspended", tone: "danger" },
	ON_LEAVE: { label: "On leave", tone: "info" },
};

export function OwnerStaffScreen({ staff, hotels }: { staff: OwnerStaff[]; hotels: OwnerHotelFinance[] }) {
	const [hotel, setHotel] = useParam("hotel");
	const [open, setOpen] = useParam("open");
	const [newOpen, setNewOpen] = useParam("new");
	const [tab, setTab] = useState<"all" | "active" | "leave" | "paused">("all");
	const [search, setSearch] = useState("");
	const [exportOpen, setExportOpen] = useState(false);
	const [modal, setModal] = useState<{ kind: "suspend" | "remove" | "reset" | "shift" | "message" | "edit"; s: OwnerStaff } | null>(null);
	const { run, pending } = useDemoAction();

	const scoped = useMemo(() => staff.filter((s) => !hotel || s.hotelId === hotel), [staff, hotel]);
	const rows = scoped.filter((s) => tab === "all" || (tab === "active" && s.status === "ACTIVE") || (tab === "leave" && s.status === "ON_LEAVE") || (tab === "paused" && (s.status === "PAUSED" || s.status === "SUSPENDED")));
	const selected = staff.find((s) => s.id === open) ?? null;

	const actions = (s: OwnerStaff) => [
		{ label: "View profile", icon: UserRoundIcon, onClick: () => setOpen(s.id) },
		{ label: "Edit", icon: PencilIcon, onClick: () => setModal({ kind: "edit", s }) },
		{ label: "Change shift", icon: CalendarIcon, onClick: () => setModal({ kind: "shift", s }) },
		{ label: "Message", icon: MessageSquareIcon, onClick: () => setModal({ kind: "message", s }) },
		{ label: "Reset password", icon: KeyRoundIcon, onClick: () => setModal({ kind: "reset", s }) },
		{ label: s.status === "SUSPENDED" ? "Lift suspension" : "Suspend", icon: PauseCircleIcon, tone: "danger" as const, separatorBefore: true, onClick: () => (s.status === "SUSPENDED" ? run(`${s.fullName} reinstated`) : setModal({ kind: "suspend", s })) },
		{ label: "Remove from hotel", icon: Trash2Icon, tone: "danger" as const, onClick: () => setModal({ kind: "remove", s }) },
	];

	const columns: ColumnDef<OwnerStaff, unknown>[] = [
		{ accessorKey: "fullName", header: "Name", cell: ({ row }) => <AvatarName name={row.original.fullName} secondary={row.original.jobTitle} size="sm" /> },
		{ accessorKey: "hotelName", header: "Hotel" },
		{ accessorKey: "department", header: "Department" },
		{ accessorKey: "role", header: "Role", cell: ({ row }) => (isHotelRole(row.original.role) ? roleLabels[row.original.role] : row.original.role) },
		{ accessorKey: "shift", header: "Shift" },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={statusPill[row.original.status].tone}>{statusPill[row.original.status].label}</StatusPill> },
		{ accessorKey: "lastSignIn", header: "Last sign-in", cell: ({ row }) => fmtWhen(row.original.lastSignIn) },
		{ id: "actions", header: "", cell: ({ row }) => <RowActions actions={actions(row.original)} /> },
	];

	return (
		<>
			<PageHeader title="Staff" subtitle={`${plural(scoped.length, "person", "people")} across ${hotel ? hotels.find((h) => h.hotelId === hotel)?.name : plural(hotels.length, "hotel")}`}>
				<ExportButton onClick={() => setExportOpen(true)} />
				<Button className={btn.primary} onClick={() => setNewOpen("1")}><PlusIcon className="size-4" /> Add staff</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Total staff" value={scoped.length} icon={UsersIcon} hint={`${scoped.filter((s) => s.status === "ACTIVE").length} active`} />
				<KpiCard label="On shift now" value={hotels.filter((h) => !hotel || h.hotelId === hotel).reduce((s, h) => s + h.onShift, 0)} icon={IdCardIcon} hint={`of ${hotels.filter((h) => !hotel || h.hotelId === hotel).reduce((s, h) => s + h.scheduled, 0)} scheduled`} />
				<KpiCard label="On leave" value={scoped.filter((s) => s.status === "ON_LEAVE").length} icon={CalendarIcon} hint="1 request waiting" />
				<KpiCard label="Paused or suspended" value={scoped.filter((s) => s.status === "PAUSED" || s.status === "SUSPENDED").length} icon={PauseCircleIcon} />
			</div>
			<Toolbar
				left={<PillTabs tabs={[{ key: "all", label: "All", count: scoped.length }, { key: "active", label: "Active", count: scoped.filter((s) => s.status === "ACTIVE").length }, { key: "leave", label: "On leave", count: scoped.filter((s) => s.status === "ON_LEAVE").length }, { key: "paused", label: "Paused", count: scoped.filter((s) => s.status === "PAUSED" || s.status === "SUSPENDED").length }]} value={tab} onChange={setTab} />}
				right={<><HotelFilter hotels={hotels} value={hotel ?? ""} onChange={(v) => setHotel(v || null)} /><SearchBox value={search} onChange={setSearch} placeholder="Name, email, role" /></>}
			/>
			<DataTable columns={columns} data={rows} search={search} onRowClick={(s) => setOpen(s.id)} />

			<SidePanel open={!!selected} onOpenChange={(o) => !o && setOpen(null)} title={selected?.fullName ?? ""} subtitle={selected ? `${selected.jobTitle} · ${selected.hotelName}` : undefined} icon={UserRoundIcon} footer={selected && <><Button variant="outline" className={btn.secondary} onClick={() => setModal({ kind: "message", s: selected })}><MessageSquareIcon className="size-4" /> Message</Button><Button className={btn.primary} onClick={() => setModal({ kind: "edit", s: selected })}>Edit</Button></>}>
				{selected && (
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between"><StatusPill tone={statusPill[selected.status].tone}>{statusPill[selected.status].label}</StatusPill><span className="text-xs text-ink-3">Started {fmtLongDate(selected.startedOn)}</span></div>
						<PanelSection title="Contact"><DetailList columns={2} items={[{ label: "Phone", value: selected.phone }, { label: "Email", value: selected.email }]} /></PanelSection>
						<PanelSection title="Work"><DetailList columns={2} items={[{ label: "Hotel", value: selected.hotelName }, { label: "Department", value: selected.department }, { label: "Role", value: `${isHotelRole(selected.role) ? roleLabels[selected.role] : selected.role} · ${humanize(selected.level)}` }, { label: "Shift", value: selected.shift }, { label: "Last sign-in", value: fmtWhen(selected.lastSignIn) }]} /></PanelSection>
						<PanelSection title="This month"><DetailList columns={2} items={[{ label: "Shifts worked", value: "22 of 24" }, { label: "Late", value: "1" }, { label: "Leave days", value: selected.status === "ON_LEAVE" ? "4" : "0" }, { label: "Actions logged", value: "318" }]} /></PanelSection>
					</div>
				)}
			</SidePanel>

			<AddStaffPanel open={newOpen === "1"} hotels={hotels} onClose={() => setNewOpen(null)} />
			<StaffModals modal={modal} onClose={() => setModal(null)} />
			<ConfirmModal open={modal?.kind === "suspend"} onOpenChange={(o) => !o && setModal(null)} title={`Suspend ${modal?.s.fullName}?`} subtitle="They lose access immediately" tone="danger" confirmLabel="Suspend" pending={pending} onConfirm={() => run(`${modal?.s.fullName} suspended`, () => setModal(null))} alternative={{ label: "Pause access for a few days instead", onClick: () => run(`${modal?.s.fullName} paused for 7 days`, () => setModal(null)) }}>
				<WhatHappens tone="danger" items={["They are signed out of every device", "Their shifts stay on the rota until the manager reassigns them", "The manager is told"]} />
			</ConfirmModal>
			<ConfirmModal open={modal?.kind === "remove"} onOpenChange={(o) => !o && setModal(null)} title={`Remove ${modal?.s.fullName} from ${modal?.s.hotelName}?`} tone="danger" confirmLabel="Remove" pending={pending} onConfirm={() => run(`${modal?.s.fullName} removed`, () => setModal(null))}>
				<WhatHappens tone="danger" items={["Their login stops working", "Past actions stay in the activity log", "Payroll for this month is still due"]} />
			</ConfirmModal>
			<ConfirmModal open={modal?.kind === "reset"} onOpenChange={(o) => !o && setModal(null)} title="Reset password?" subtitle={modal?.s.email} confirmLabel="Send temporary password" pending={pending} onConfirm={() => run("Temporary password sent by SMS", () => setModal(null))}>
				<WhatHappens items={["A one-time password goes to their phone", "They must choose a new one at next sign-in"]} />
			</ConfirmModal>
			<DownloadModal open={exportOpen} onOpenChange={setExportOpen} title="Export staff" what="Staff list" />
		</>
	);
}

function StaffModals({ modal, onClose }: { modal: { kind: string; s: OwnerStaff } | null; onClose: () => void }) {
	const [shift, setShift] = useState("Morning");
	const [msg, setMsg] = useState("");
	const { run, pending } = useDemoAction();
	const s = modal?.s;
	return (
		<>
			<Modal open={modal?.kind === "shift"} onOpenChange={(o) => !o && onClose()} title="Change shift" subtitle={`${s?.fullName} · now ${s?.shift}`} icon={CalendarIcon} size="form" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run(`${s?.fullName} moved to ${shift} shift`, onClose)}>Change shift</Button></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="New shift" value={shift} onChange={setShift} options={["Morning", "Afternoon", "Night"]} setupLink="shifts" />
					<TextField label="From" value={new Date().toISOString().slice(0, 10)} onChange={() => undefined} type="date" />
					<Note tone="info">The manager and the staff member are told. The rota updates from that date.</Note>
				</div>
			</Modal>
			<Modal open={modal?.kind === "message"} onOpenChange={(o) => !o && onClose()} title={`Message ${s?.fullName}`} subtitle={s?.phone} icon={MessageSquareIcon} size="form" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !msg} onClick={() => run("Message sent", () => { setMsg(""); onClose(); })}>Send</Button></>}>
				<TextareaField label="Message" value={msg} onChange={setMsg} rows={4} />
			</Modal>
			<Modal open={modal?.kind === "edit"} onOpenChange={(o) => !o && onClose()} title="Edit staff" subtitle={s?.fullName} icon={PencilIcon} size="form" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Staff updated", onClose)}>Save changes</Button></>}>
				<div className="flex flex-col gap-4">
					<FieldRow><TextField label="Full name" value={s?.fullName ?? ""} onChange={() => undefined} /><TextField label="Phone" value={s?.phone ?? ""} onChange={() => undefined} /></FieldRow>
					<FieldRow><TextField label="Job title" value={s?.jobTitle ?? ""} onChange={() => undefined} /><SelectField label="Department" value={s?.department ?? ""} onChange={() => undefined} options={["Front office", "Housekeeping", "Laundry", "Maintenance", "Kitchen", "Bar", "Store", "Finance", "Management"]} setupLink="departments" /></FieldRow>
				</div>
			</Modal>
		</>
	);
}

function AddStaffPanel({ open, hotels, onClose }: { open: boolean; hotels: OwnerHotelFinance[]; onClose: () => void }) {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [hotel, setHotel] = useState(hotels[0]?.hotelId ?? "");
	const [role, setRole] = useState("FRONT_OFFICE");
	const [level, setLevel] = useState("EDIT");
	const [invite, setInvite] = useState(true);
	const { run, pending } = useDemoAction();
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title="Add staff" subtitle="They sign in on the staff tablet with a PIN" icon={PlusIcon} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name} onClick={() => run(`${name} added${invite ? " · invite sent" : ""}`, onClose)}>Add staff</Button></>}>
			<div className="flex flex-col gap-4">
				<FieldRow><TextField label="Full name" value={name} onChange={setName} required /><TextField label="Phone" value={phone} onChange={setPhone} placeholder="+234…" /></FieldRow>
				<SelectField label="Hotel" value={hotel} onChange={setHotel} options={hotels.map((h) => ({ value: h.hotelId, label: h.name }))} />
				<FieldRow>
					<SelectField label="Role" value={role} onChange={setRole} options={["FRONT_OFFICE", "HOUSEKEEPING", "LAUNDRY", "MAINTENANCE", "KITCHEN", "BAR", "INVENTORY", "FINANCE", "MANAGER"].map((r) => ({ value: r, label: isHotelRole(r) ? roleLabels[r] : r }))} />
					<SelectField label="Access level" value={level} onChange={setLevel} options={[{ value: "FULL", label: "Full" }, { value: "EDIT", label: "Can edit" }, { value: "VIEW", label: "View only" }]} />
				</FieldRow>
				<ToggleField label="Send invite now" hint="SMS with a one-time PIN" checked={invite} onChange={setInvite} />
			</div>
		</SidePanel>
	);
}
