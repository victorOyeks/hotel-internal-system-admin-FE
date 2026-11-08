"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, CheckIcon, PauseIcon, PlusIcon, ShieldCheckIcon, Trash2Icon, UserCogIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable } from "@hospio/ui/shared/data-table";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtDay } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ManagerMark, RowActions } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { PermissionModule, StaffAccessRow } from "@hospio/api/demo/fixtures/manager-admin";
import { type HotelRole, roleDescriptions, roleIcons, roleLabels } from "@hospio/api/roles";

type Level = "FULL" | "EDIT" | "VIEW";
const levelLabel: Record<Level, string> = { FULL: "Full", EDIT: "Can edit", VIEW: "View only" };
const levelTone: Record<Level, "brand" | "info" | "grey"> = { FULL: "brand", EDIT: "info", VIEW: "grey" };

const HOTEL_ROLE_LIST: HotelRole[] = ["MANAGER", "FRONT_OFFICE", "HOUSEKEEPING", "LAUNDRY", "MAINTENANCE", "KITCHEN", "BAR", "INVENTORY", "FINANCE"];

/** Manager · Roles & permissions: what each role allows, and who holds which role at what level. */
export function RolesScreen({ permissions, managerOnly, access, hotelName }: { permissions: Record<string, PermissionModule[]>; managerOnly: string[]; access: StaffAccessRow[]; hotelName: string }) {
	const [tab, setTab] = useQueryState("tab");
	const active = (tab ?? "roles") as "roles" | "access";
	const [openRole, setOpenRole] = useQueryState("role");
	const [search, setSearch] = useState("");
	const [person, setPerson] = useState<StaffAccessRow | null>(null);
	const [give, setGive] = useState<StaffAccessRow | null>(null);
	const [change, setChange] = useState<{ row: StaffAccessRow; role: string; level: Level } | null>(null);
	const [remove, setRemove] = useState<{ row: StaffAccessRow; role: string } | null>(null);
	const [pause, setPause] = useState<{ row: StaffAccessRow; role: string } | null>(null);
	const [temp, setTemp] = useState<{ row: StaffAccessRow; role: string } | null>(null);
	const [newRole, setNewRole] = useState("");
	const [newLevel, setNewLevel] = useState<Level>("EDIT");
	const [until, setUntil] = useState("");
	const [reason, setReason] = useState("");
	const { run, pending } = useDemoAction();

	const currentRole = openRole && openRole in roleLabels ? (openRole as HotelRole) : null;
	const holders = (role: string) => access.filter((a) => a.grants.some((g) => g.role === role));

	const columns: ColumnDef<StaffAccessRow, unknown>[] = [
		{ accessorKey: "fullName", header: "Person", cell: ({ row }) => <AvatarName name={row.original.fullName} secondary={row.original.department} size="sm" /> },
		{ id: "roles", header: "Roles & levels", cell: ({ row }) => (
			<div className="flex flex-wrap gap-1">
				{row.original.grants.map((g) => (
					<span key={g.role} className="inline-flex items-center gap-1">
						<StatusPill dot={false} tone={g.paused ? "grey" : levelTone[g.level]}>{roleLabels[g.role as HotelRole] ?? g.role} · {levelLabel[g.level]}</StatusPill>
					</span>
				))}
			</div>
		) },
		{ id: "flags", header: "Status", cell: ({ row }) => {
			const paused = row.original.grants.some((g) => g.paused);
			const temp = row.original.grants.find((g) => g.until);
			return paused ? <StatusPill tone="warning">Paused</StatusPill> : temp ? <StatusPill tone="info">Until {fmtDay(temp.until)}</StatusPill> : <StatusPill tone="success">Active</StatusPill>;
		} },
		{ id: "actions", header: "", size: 48, cell: ({ row }) => {
			const r = row.original;
			const first = r.grants[0];
			return (
				<RowActions actions={[
					{ label: "See what they can do", icon: ShieldCheckIcon, onClick: () => setPerson(r) },
					{ label: "Give a role", icon: PlusIcon, onClick: () => setGive(r), managerOnly: true },
					{ label: "Change level", icon: UserCogIcon, onClick: () => setChange({ row: r, role: first.role, level: first.level }), managerOnly: true },
					{ label: "Temporary access", icon: CalendarIcon, onClick: () => setTemp({ row: r, role: first.role }), managerOnly: true },
					{ label: first.paused ? "Resume access" : "Pause access", icon: PauseIcon, onClick: () => setPause({ row: r, role: first.role }), managerOnly: true, separatorBefore: true },
					{ label: "Remove role", icon: Trash2Icon, onClick: () => setRemove({ row: r, role: first.role }), tone: "danger", managerOnly: true },
				]} />
			);
		} },
	];

	return (
		<>
			<PageHeader title="Roles & permissions" subtitle={`${hotelName} · what each role allows and who holds it · three levels: Full, Can edit, View only`}>
				<ManagerMark />
				<Button className={btn.primary} onClick={() => setGive(access[0])}><PlusIcon className="size-4" /> Give a role</Button>
			</PageHeader>

			<Toolbar
				left={<PillTabs tabs={[{ key: "roles", label: "Roles", count: HOTEL_ROLE_LIST.length }, { key: "access", label: "Staff access", count: access.length }]} value={active} onChange={(k) => void setTab(k === "roles" ? null : k)} />}
				right={active === "access" ? <SearchBox value={search} onChange={setSearch} placeholder="Search people…" /> : undefined}
			/>

			{active === "roles" ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{HOTEL_ROLE_LIST.map((role) => {
						const Icon = roleIcons[role];
						const mods = permissions[role] ?? [];
						return (
							<button key={role} type="button" onClick={() => void setOpenRole(role)} className="flex flex-col gap-3 rounded-card border border-line bg-card p-[18px] text-left transition-colors hover:bg-brand-soft/20">
								<div className="flex items-center gap-[10px]">
									<span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><Icon className="size-4" /></span>
									<span className="flex-1 text-[15px] font-bold text-ink">{roleLabels[role]}</span>
									<StatusPill dot={false} tone="grey">{holders(role).length} {holders(role).length === 1 ? "person" : "people"}</StatusPill>
								</div>
								<p className="text-[13px] text-ink-2">{roleDescriptions[role]}</p>
								<ul className="flex flex-col gap-[2px] text-xs text-ink-3">
									{mods.slice(0, 3).map((m) => <li key={m.key} className="flex items-center gap-[6px]"><CheckIcon className="size-3 text-success" /> {m.name}: {m.full[0]}</li>)}
								</ul>
							</button>
						);
					})}
					<div className="flex flex-col gap-2 rounded-card border border-dashed border-line-strong bg-subtle/40 p-[18px]">
						<p className="flex items-center gap-2 text-[15px] font-bold text-ink"><ShieldCheckIcon className="size-4 text-brand" /> Managers only</p>
						<ul className="flex flex-col gap-1 text-xs text-ink-2">{managerOnly.map((m) => <li key={m}>· {m}</li>)}</ul>
					</div>
				</div>
			) : (
				<DataTable columns={columns} data={access} search={search} onRowClick={(r) => setPerson(r)} emptyTitle="No staff yet" />
			)}

			{/* Role permissions */}
			<SidePanel open={!!currentRole} onOpenChange={(o) => !o && void setOpenRole(null)} title={currentRole ? roleLabels[currentRole] : ""} subtitle={currentRole ? roleDescriptions[currentRole] : undefined} icon={currentRole ? roleIcons[currentRole] : undefined} width="lg"
				footerInfo="Levels are fixed by H.M.S · pick the level per person in Staff access"
				footer={currentRole && <Button className={btn.primary} onClick={() => { void setOpenRole(null); void setTab("access"); }}>Who holds it ({holders(currentRole).length})</Button>}>
				{currentRole && (
					<div className="flex flex-col gap-5">
						{(permissions[currentRole] ?? []).map((m) => (
							<PanelSection key={m.key} title={m.name}>
								<div className="grid grid-cols-3 gap-2">
									{(["FULL", "EDIT", "VIEW"] as Level[]).map((lvl) => {
										const items = lvl === "FULL" ? m.full : lvl === "EDIT" ? m.edit : m.view;
										return (
											<div key={lvl} className="flex flex-col gap-2 rounded-xl border border-line p-3">
												<StatusPill dot={false} tone={levelTone[lvl]} className="w-fit">{levelLabel[lvl]}</StatusPill>
												<ul className="flex flex-col gap-1 text-xs text-ink-2">
													{items.length === 0 ? <li className="text-ink-3">Same as Full</li> : items.map((i) => <li key={i} className="flex gap-1"><CheckIcon className="mt-[2px] size-3 shrink-0 text-success" /> {i}</li>)}
												</ul>
											</div>
										);
									})}
								</div>
								{m.managerOnly && m.managerOnly.length > 0 && <p className="text-xs text-ink-3"><ShieldCheckIcon className="mr-1 inline size-3" /> Manager only: {m.managerOnly.join(" · ")}</p>}
							</PanelSection>
						))}
					</div>
				)}
			</SidePanel>

			{/* Person access */}
			<SidePanel open={!!person} onOpenChange={(o) => !o && setPerson(null)} title={person?.fullName ?? ""} subtitle={person ? `${person.department} · ${person.grants.length} ${person.grants.length === 1 ? "role" : "roles"}` : undefined} icon={UserCogIcon}
				footer={person && <Button className={btn.primary} onClick={() => { setGive(person); setPerson(null); }}><PlusIcon className="size-4" /> Give a role</Button>}>
				{person && (
					<div className="flex flex-col gap-5">
						{person.grants.map((g) => (
							<PanelSection key={g.role} title={roleLabels[g.role as HotelRole] ?? g.role}>
								<div className="flex items-center gap-2">
									<StatusPill dot={false} tone={levelTone[g.level]}>{levelLabel[g.level]}</StatusPill>
									{g.paused && <StatusPill tone="warning">Paused</StatusPill>}
									{g.until && <StatusPill tone="info">Until {fmtDay(g.until)}</StatusPill>}
									<span className="flex-1" />
									<button type="button" className="text-xs font-semibold text-brand hover:underline" onClick={() => setChange({ row: person, role: g.role, level: g.level })}>Change level</button>
									<button type="button" className="text-xs font-semibold text-danger hover:underline" onClick={() => setRemove({ row: person, role: g.role })}>Remove</button>
								</div>
								<ul className="flex flex-col gap-1 text-xs text-ink-2">
									{(permissions[g.role] ?? []).map((m) => <li key={m.key} className="flex gap-1"><CheckIcon className="mt-[2px] size-3 shrink-0 text-success" /> {m.name}: {(g.level === "FULL" ? m.full : g.level === "EDIT" ? m.edit : m.view).join(", ") || m.full.join(", ")}</li>)}
								</ul>
							</PanelSection>
						))}
					</div>
				)}
			</SidePanel>

			{/* Give a role */}
			<SidePanel open={!!give} onOpenChange={(o) => !o && setGive(null)} title="Give a role" subtitle={give?.fullName} icon={PlusIcon}
				footerInfo="They can switch roles from their profile menu"
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setGive(null)}>Cancel</Button><Button className={btn.primary} disabled={pending || !newRole} onClick={() => run(`${give?.fullName} now has ${roleLabels[newRole as HotelRole] ?? newRole}`, () => setGive(null))}>Give role</Button></>}>
				<div className="flex flex-col gap-5">
					<SelectField label="Person" value={give?.fullName ?? ""} onChange={(v) => setGive(access.find((a) => a.fullName === v) ?? give)} options={access.map((a) => a.fullName)} />
					<SelectField label="Role" value={newRole} onChange={setNewRole} options={HOTEL_ROLE_LIST.filter((r) => r !== "MANAGER").map((r) => ({ value: r, label: roleLabels[r], hint: roleDescriptions[r] }))} placeholder="Choose a role" />
					<ChoiceCards label="Level" value={newLevel} onChange={setNewLevel} options={[{ value: "FULL", label: "Full", hint: "Everything the role allows" }, { value: "EDIT", label: "Can edit", hint: "Day-to-day work, no approvals" }, { value: "VIEW", label: "View only", hint: "Can look, cannot change" }]} />
					{newRole && <WhatHappens items={(permissions[newRole] ?? []).map((m) => `${m.name}: ${(newLevel === "FULL" ? m.full : newLevel === "EDIT" ? m.edit : m.view)[0] ?? m.full[0]}`)} />}
				</div>
			</SidePanel>

			{/* Change level */}
			<Modal open={!!change} onOpenChange={(o) => !o && setChange(null)} title="Change level" subtitle={change ? `${change.row.fullName} · ${roleLabels[change.role as HotelRole] ?? change.role}` : undefined} size="form" icon={UserCogIcon}
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setChange(null)}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Level changed", () => setChange(null), { description: "Takes effect the next time they sign in." })}>Save level</Button></>}>
				{change && <ChoiceCards value={change.level} onChange={(level) => setChange({ ...change, level })} options={[{ value: "FULL", label: "Full" }, { value: "EDIT", label: "Can edit" }, { value: "VIEW", label: "View only" }]} />}
			</Modal>

			{/* Temporary */}
			<Modal open={!!temp} onOpenChange={(o) => !o && setTemp(null)} title="Temporary access" subtitle={temp ? `${temp.row.fullName} · ${roleLabels[temp.role as HotelRole] ?? temp.role}` : undefined} size="form" icon={CalendarIcon}
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setTemp(null)}>Cancel</Button><Button className={btn.primary} disabled={pending || !until} onClick={() => run(`Access ends ${fmtDay(until)}`, () => setTemp(null))}>Set end date</Button></>}>
				<div className="flex flex-col gap-4">
					<TextField label="Access ends on" type="date" value={until} onChange={setUntil} hint="At midnight that day the role is removed automatically" />
					<Note tone="info">Good for cover shifts and trainees. You get a reminder the day before.</Note>
				</div>
			</Modal>

			{/* Pause */}
			<ConfirmModal open={!!pause} onOpenChange={(o) => !o && setPause(null)} title={pause?.row.grants.find((g) => g.role === pause.role)?.paused ? "Resume access" : "Pause access"} subtitle={pause ? `${pause.row.fullName} · ${roleLabels[pause.role as HotelRole] ?? pause.role}` : undefined} confirmLabel={pause?.row.grants.find((g) => g.role === pause.role)?.paused ? "Resume access" : "Pause access"} pending={pending}
				onConfirm={() => run(pause?.row.grants.find((g) => g.role === pause.role)?.paused ? "Access resumed" : "Access paused", () => setPause(null))}>
				<div className="flex flex-col gap-4">
					<WhatHappens tone="warning" items={["They are signed out of this role now", "Their shifts and history stay", "You can resume any time"]} />
					<TextareaField label="Reason (optional)" value={reason} onChange={setReason} placeholder="e.g. On leave until the 10th" rows={2} />
				</div>
			</ConfirmModal>

			{/* Remove */}
			<ConfirmModal open={!!remove} onOpenChange={(o) => !o && setRemove(null)} title="Remove role" subtitle={remove ? `${remove.row.fullName} loses ${roleLabels[remove.role as HotelRole] ?? remove.role}` : undefined} tone="danger" confirmLabel="Remove role" pending={pending}
				alternative={{ label: "Pause instead", onClick: () => { if (remove) setPause(remove); setRemove(null); } }}
				onConfirm={() => run("Role removed", () => setRemove(null))}>
				<div className="flex flex-col gap-4">
					<WhatHappens tone="danger" items={["They can no longer open this role's screens", "Everything they did stays in the activity log", "Their other roles are not affected"]} />
					{remove && <DetailList columns={2} items={[{ label: "Person", value: remove.row.fullName }, { label: "Department", value: remove.row.department }]} />}
				</div>
			</ConfirmModal>
		</>
	);
}

