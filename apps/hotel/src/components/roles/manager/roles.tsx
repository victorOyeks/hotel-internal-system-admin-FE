"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, CheckIcon, PauseIcon, PlusIcon, ShieldCheckIcon, Trash2Icon, UserCogIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable } from "@hospio/ui/shared/data-table";
import { AvatarName, Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ManagerMark, RowActions } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { useListParams } from "@hospio/ui/shared/list-params";
import { btn } from "@hospio/ui/shared/ui";
import { changeAccess, grantRole } from "@hospio/api/actions/identity";
import { searchStaffAccess } from "@hospio/api/actions/staff-lists";
import { useAction } from "@hospio/api/actions/use-action";
import type { PageResult } from "@hospio/api/data/paging";
import type { GrantRow, RolesAccessRow } from "@hospio/api/data/types";
import { type HotelRole, MANAGER_ONLY_ACTIONS, ROLE_PERMISSIONS, roleDescriptions, roleIcons, roleLabels } from "@hospio/api/roles";

type Level = "FULL" | "EDIT" | "VIEW";
const levelLabel: Record<Level, string> = { FULL: "Full", EDIT: "Can edit", VIEW: "View only" };
const levelTone: Record<Level, "brand" | "info" | "grey"> = { FULL: "brand", EDIT: "info", VIEW: "grey" };
const LEVEL_OPTIONS: { value: Level; label: string; hint: string }[] = [
	{ value: "FULL", label: "Full", hint: "Everything the role allows" },
	{ value: "EDIT", label: "Can edit", hint: "Day-to-day work" },
	{ value: "VIEW", label: "View only", hint: "Can look, cannot change" },
];

/** The roles a manager or the owner can give at a hotel (the owner role and Hospio360 roles are not given here). */
const GIVABLE: HotelRole[] = ["MANAGER", "FRONT_OFFICE", "HOUSEKEEPING", "LAUNDRY", "MAINTENANCE", "KITCHEN", "BAR", "INVENTORY", "FINANCE"];

const label = (role: string) => roleLabels[role as HotelRole] ?? role;
/** "Tue 1 Dec" from yyyy-mm-dd, read as a calendar day (no time zone shift). */
const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const todayLagos = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);

function statusOf(r: RolesAccessRow): { tone: "success" | "warning" | "info" | "grey" | "danger"; text: string } {
	if (r.status === "INVITED") return { tone: "grey", text: "Invited" };
	if (r.status === "SUSPENDED") return { tone: "danger", text: "Suspended" };
	if (r.status === "PAUSED") return { tone: "warning", text: "Paused" };
	const ends = r.grants.filter((g) => g.until && !g.paused).map((g) => g.until as string).sort()[0];
	if (ends) return { tone: "info", text: `Until ${day(ends)}` };
	if (r.grants.some((g) => g.paused)) return { tone: "warning", text: "Partly paused" };
	return { tone: "success", text: "Active" };
}

type Target = { row: RolesAccessRow; grantId: string };

/**
 * Manager (and owner) · Roles & permissions for the active hotel: what each role allows at each level (from the
 * services' guards, packages/api/src/roles.ts) and who holds which role. Every change goes to identity-service;
 * the person is told in the app and their next page picks up the new roles.
 */
export function RolesScreen({
	result,
	overall,
	hotelName,
	hotelId,
}: {
	/** Staff access, a page at a time from identity (`?q=&holds=&sort=&page=`). */
	result: PageResult<RolesAccessRow>;
	/** The hotel without search or filters: who holds each role (ROLE_<ROLE> counts) and how many people. */
	overall: PageResult<RolesAccessRow>;
	hotelName: string;
	hotelId?: string;
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["holds"] });
	const [tab, setTab] = useQueryState("tab");
	const active = (tab ?? "roles") as "roles" | "access";
	const [openRole, setOpenRole] = useQueryState("role");
	const access = result.data.content;
	const roleCounts = overall.data.counts ?? {};
	const [personId, setPersonId] = useState<string | null>(null);
	const [giveOpen, setGiveOpen] = useState(false);
	const [giveTo, setGiveTo] = useState("");
	const [givePerson, setGivePerson] = useState<RolesAccessRow | null>(null);
	const [find, setFind] = useState("");
	const [found, setFound] = useState<RolesAccessRow[]>([]);
	const [newRole, setNewRole] = useState("");
	const [newLevel, setNewLevel] = useState<Level>("EDIT");
	const [newUntil, setNewUntil] = useState("");
	const [change, setChange] = useState<(Target & { level: Level }) | null>(null);
	const [temp, setTemp] = useState<(Target & { until: string }) | null>(null);
	const [pause, setPause] = useState<Target | null>(null);
	const [remove, setRemove] = useState<Target | null>(null);
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();

	const person = personId ? (access.find((a) => a.id === personId) ?? null) : null;
	const currentRole = openRole && openRole in roleLabels ? (openRole as HotelRole) : null;
	const holders = (role: string) => roleCounts[`ROLE_${role}`] ?? 0;
	const grantOf = (t: Target | null): GrantRow | undefined => t?.row.grants.find((g) => g.id === t.grantId);
	const changeable = (r: RolesAccessRow) => r.grants.filter((g) => g.role !== "OWNER");
	const manageable = (r: RolesAccessRow) => !r.self && changeable(r).length > 0;
	const givable = (r?: RolesAccessRow) => GIVABLE.filter((role) => !r?.grants.some((g) => g.role === role));
	const giveRow = givePerson && givePerson.id === giveTo ? givePerson : (found.find((a) => a.id === giveTo) ?? null);
	// Give a role: people found by a server search (name, email or phone), 10 at a time, never the whole hotel.
	useEffect(() => {
		if (!giveOpen) return;
		const t = setTimeout(() => {
			void searchStaffAccess(find).then((r) => r.ok && setFound(r.data.filter((a) => !a.self)));
		}, 300);
		return () => clearTimeout(t);
	}, [find, giveOpen]);

	const done = (close: () => void) => () => {
		close();
		router.refresh();
	};
	function openGive(r?: RolesAccessRow) {
		setGiveTo(r?.id ?? "");
		setGivePerson(r ?? null);
		setFind("");
		setNewRole("");
		setNewLevel("EDIT");
		setNewUntil("");
		setGiveOpen(true);
	}
	const first = (r: RolesAccessRow) => changeable(r)[0]?.id ?? "";

	const columns: ColumnDef<RolesAccessRow, unknown>[] = [
		{ accessorKey: "fullName", header: "Person", cell: ({ row }) => <AvatarName name={row.original.fullName} photo={row.original.photo} secondary={row.original.self ? `${row.original.department} · you` : row.original.department} size="sm" /> },
		{
			id: "roles",
			header: "Roles & levels",
			accessorFn: (r) => r.grants.map((g) => `${label(g.role)} ${levelLabel[g.level as Level]}`).join(" "),
			cell: ({ row }) => (
				<div className="flex flex-wrap gap-1">
					{row.original.grants.map((g) => (
						<StatusPill key={g.id} dot={false} tone={g.paused ? "grey" : levelTone[g.level as Level]}>
							{label(g.role)} · {levelLabel[g.level as Level]}
							{g.paused ? " · paused" : g.until ? ` · until ${day(g.until)}` : ""}
						</StatusPill>
					))}
					{row.original.otherHotelRoles > 0 && <span className="text-[11px] text-ink-3">+{row.original.otherHotelRoles} at other hotels</span>}
				</div>
			),
		},
		{ id: "status", header: "Status", cell: ({ row }) => { const s = statusOf(row.original); return <StatusPill tone={s.tone}>{s.text}</StatusPill>; } },
		{
			id: "actions",
			header: "",
			size: 48,
			cell: ({ row }) => {
				const r = row.original;
				const can = manageable(r);
				const g = changeable(r)[0];
				return (
					<RowActions
						actions={[
							{ label: "See what they can do", icon: ShieldCheckIcon, onClick: () => setPersonId(r.id) },
							...(r.self
								? []
								: [
										{ label: "Give a role", icon: PlusIcon, onClick: () => openGive(r), managerOnly: true },
										...(can
											? [
													{ label: "Change level", icon: UserCogIcon, onClick: () => setChange({ row: r, grantId: first(r), level: (g?.level ?? "EDIT") as Level }), managerOnly: true },
													{ label: "Temporary access", icon: CalendarIcon, onClick: () => setTemp({ row: r, grantId: first(r), until: g?.until ?? "" }), managerOnly: true },
													{ label: g?.paused && changeable(r).length === 1 ? "Resume role" : "Pause or resume a role", icon: PauseIcon, onClick: () => { setReason(""); setPause({ row: r, grantId: first(r) }); }, managerOnly: true, separatorBefore: true },
													{ label: "Remove a role", icon: Trash2Icon, onClick: () => setRemove({ row: r, grantId: first(r) }), tone: "danger" as const, managerOnly: true },
												]
											: []),
									]),
						]}
					/>
				);
			},
		},
	];

	/** Which role a row action is about, when the person holds more than one here. */
	const rolePicker = (t: Target, set: (grantId: string) => void) =>
		changeable(t.row).length > 1 ? (
			<SelectField label="Role" value={t.grantId} onChange={set} options={changeable(t.row).map((g) => ({ value: g.id, label: `${label(g.role)} · ${levelLabel[g.level as Level]}${g.paused ? " · paused" : ""}` }))} />
		) : null;

	const changeGrant = grantOf(change);
	const tempGrant = grantOf(temp);
	const pauseGrant = grantOf(pause);
	const removeGrant = grantOf(remove);

	return (
		<>
			<PageHeader title="Roles & permissions" subtitle={`${hotelName} · what each role allows and who holds it · three levels: Full, Can edit, View only`}>
				<ManagerMark />
				<Button className={btn.primary} onClick={() => openGive()} disabled={(roleCounts.all ?? 0) < 2 && !access.some((a) => !a.self)}>
					<PlusIcon className="size-4" /> Give a role
				</Button>
			</PageHeader>

			<Toolbar
				left={<PillTabs tabs={[{ key: "roles", label: "Roles", count: GIVABLE.length }, { key: "access", label: "Staff access", count: roleCounts.all ?? 0 }]} value={active} onChange={(k) => void setTab(k === "roles" ? null : k)} />}
				right={
					active === "access" ? (
						<>
							<FilterSelect value={list.params.holds ?? ""} onChange={(v) => list.set({ holds: v })} all="Any role" options={GIVABLE.map((r) => ({ value: r, label: `${roleLabels[r]} (${holders(r)})` }))} />
							<SearchBox value={list.search} onChange={list.setSearch} placeholder="Name, email or phone" />
						</>
					) : undefined
				}
			/>

			{active === "roles" ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{GIVABLE.map((role) => {
						const Icon = roleIcons[role];
						const mods = ROLE_PERMISSIONS[role] ?? [];
						const n = holders(role);
						return (
							<button key={role} type="button" onClick={() => void setOpenRole(role)} className="flex flex-col gap-3 rounded-card border border-line bg-card p-[18px] text-left transition-colors hover:bg-brand-soft/20">
								<div className="flex items-center gap-[10px]">
									<span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><Icon className="size-4" /></span>
									<span className="flex-1 text-[15px] font-bold text-ink">{roleLabels[role]}</span>
									<StatusPill dot={false} tone="grey">{n} {n === 1 ? "person" : "people"}</StatusPill>
								</div>
								<p className="text-[13px] text-ink-2">{roleDescriptions[role]}</p>
								<ul className="flex flex-col gap-[2px] text-xs text-ink-3">
									{role === "MANAGER"
										? MANAGER_ONLY_ACTIONS.slice(0, 3).map((m) => <li key={m} className="flex items-center gap-[6px]"><CheckIcon className="size-3 text-success" /> {m}</li>)
										: mods.slice(0, 3).map((m) => <li key={m.key} className="flex items-center gap-[6px]"><CheckIcon className="size-3 text-success" /> {m.name}: {(m.edit[0] ?? m.view[0] ?? m.full[0]) || ""}</li>)}
								</ul>
							</button>
						);
					})}
					<div className="flex flex-col gap-2 rounded-card border border-dashed border-line-strong bg-subtle/40 p-[18px]">
						<p className="flex items-center gap-2 text-[15px] font-bold text-ink"><ShieldCheckIcon className="size-4 text-brand" /> Managers only</p>
						<ul className="flex flex-col gap-1 text-xs text-ink-2">{MANAGER_ONLY_ACTIONS.map((m) => <li key={m}>· {m}</li>)}</ul>
					</div>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={access}
					server={{ page: result.data, onPage: list.goTo, sort: list.sort, onSort: list.setSort, sortKeys: { fullName: "fullName" } }}
					filtered={list.filtered}
					onClearFilters={list.clear}
					error={result.ok ? null : result.error}
					onRetry={() => router.refresh()}
					onRowClick={(r) => setPersonId(r.id)}
					emptyTitle="No staff yet"
					emptyHint="Add people from Staff, then give them roles here"
				/>
			)}

			{/* What a role allows */}
			<SidePanel open={!!currentRole} onOpenChange={(o) => !o && void setOpenRole(null)} title={currentRole ? roleLabels[currentRole] : ""} subtitle={currentRole ? roleDescriptions[currentRole] : undefined} icon={currentRole ? roleIcons[currentRole] : undefined} width="lg"
				footerInfo="Levels are fixed by Hospio360 · each level includes the one before it"
				footer={currentRole && <Button className={btn.primary} onClick={() => { void setOpenRole(null); void setTab("access"); list.set({ holds: currentRole }); }}>Who holds it ({holders(currentRole)})</Button>}>
				{currentRole && (
					<div className="flex flex-col gap-5">
						{currentRole === "MANAGER" ? (
							<PanelSection title="A manager can do everything every role allows, plus">
								<ul className="flex flex-col gap-1 text-xs text-ink-2">{MANAGER_ONLY_ACTIONS.map((m) => <li key={m} className="flex gap-1"><CheckIcon className="mt-[2px] size-3 shrink-0 text-success" /> {m}</li>)}</ul>
								<Note tone="info">A manager at View only can look at everything but change nothing.</Note>
							</PanelSection>
						) : (
							(ROLE_PERMISSIONS[currentRole] ?? []).map((m) => (
								<PanelSection key={m.key} title={m.name}>
									<div className="grid grid-cols-3 gap-2">
										{(["VIEW", "EDIT", "FULL"] as Level[]).map((lvl) => {
											const items = lvl === "FULL" ? m.full : lvl === "EDIT" ? m.edit : m.view;
											return (
												<div key={lvl} className="flex flex-col gap-2 rounded-xl border border-line p-3">
													<StatusPill dot={false} tone={levelTone[lvl]} className="w-fit">{levelLabel[lvl]}</StatusPill>
													<ul className="flex flex-col gap-1 text-xs text-ink-2">
														{lvl !== "VIEW" && <li className="text-ink-3">{lvl === "EDIT" ? "View only, plus" : "Can edit, plus"}</li>}
														{items.length === 0 ? <li className="text-ink-3">Nothing more here</li> : items.map((i) => <li key={i} className="flex gap-1"><CheckIcon className="mt-[2px] size-3 shrink-0 text-success" /> {i}</li>)}
													</ul>
												</div>
											);
										})}
									</div>
								</PanelSection>
							))
						)}
					</div>
				)}
			</SidePanel>

			{/* One person's access */}
			<SidePanel open={!!person} onOpenChange={(o) => !o && setPersonId(null)} title={person?.fullName ?? ""} subtitle={person ? `${person.department} · ${person.grants.length} ${person.grants.length === 1 ? "role" : "roles"} here${person.otherHotelRoles ? ` · ${person.otherHotelRoles} at other hotels` : ""}` : undefined} icon={UserCogIcon}
				footerInfo={person?.self ? "You can't change your own access. Ask the owner or another manager" : undefined}
				footer={person && !person.self && <Button className={btn.primary} onClick={() => { const p = person; setPersonId(null); openGive(p); }}><PlusIcon className="size-4" /> Give a role</Button>}>
				{person && (
					<div className="flex flex-col gap-5">
						{person.status === "INVITED" && <Note tone="info">Invite not accepted yet. Roles apply from their first sign-in.</Note>}
						{person.grants.map((g) => {
							const mine = person.self || g.role === "OWNER";
							const t = { row: person, grantId: g.id };
							return (
								<PanelSection key={g.id} title={label(g.role)}>
									<div className="flex flex-wrap items-center gap-2">
										<StatusPill dot={false} tone={levelTone[g.level as Level]}>{levelLabel[g.level as Level]}</StatusPill>
										{g.paused && <StatusPill tone="warning">Paused</StatusPill>}
										{g.until && <StatusPill tone="info">Until {day(g.until)}</StatusPill>}
										<span className="flex-1" />
										{!mine && (
											<>
												<button type="button" className="text-xs font-semibold text-brand hover:underline" onClick={() => setChange({ ...t, level: g.level as Level })}>Change level</button>
												<button type="button" className="text-xs font-semibold text-brand hover:underline" onClick={() => setTemp({ ...t, until: g.until ?? "" })}>{g.until ? "End date" : "Make temporary"}</button>
												<button type="button" className="text-xs font-semibold text-brand hover:underline" onClick={() => { setReason(""); setPause(t); }}>{g.paused ? "Resume" : "Pause"}</button>
												<button type="button" className="text-xs font-semibold text-danger hover:underline" onClick={() => setRemove(t)}>Remove</button>
											</>
										)}
									</div>
									<ul className="flex flex-col gap-1 text-xs text-ink-2">
										{g.role === "MANAGER" || g.role === "OWNER"
											? <li className="flex gap-1"><CheckIcon className="mt-[2px] size-3 shrink-0 text-success" /> Every screen at this hotel{g.level === "VIEW" ? ", to look at only" : ""}</li>
											: (ROLE_PERMISSIONS[g.role as HotelRole] ?? []).map((m) => {
													const items = [...m.view, ...(g.level !== "VIEW" ? m.edit : []), ...(g.level === "FULL" ? m.full : [])];
													return items.length ? <li key={m.key} className="flex gap-1"><CheckIcon className="mt-[2px] size-3 shrink-0 text-success" /> {m.name}: {items.join(", ")}</li> : null;
												})}
									</ul>
								</PanelSection>
							);
						})}
					</div>
				)}
			</SidePanel>

			{/* Give a role */}
			<SidePanel open={giveOpen} onOpenChange={(o) => !o && setGiveOpen(false)} title="Give a role" subtitle={giveRow ? `${giveRow.fullName} · ${hotelName}` : hotelName} icon={PlusIcon}
				footerInfo="They are told in the app and can switch to it from their profile menu"
				footer={
					<>
						<Button variant="outline" className={btn.secondary} onClick={() => setGiveOpen(false)}>Cancel</Button>
						<Button className={btn.primary} disabled={pending || !giveRow || !newRole}
							onClick={() => giveRow && run(
								() => grantRole(giveRow.id, { role: newRole, level: newLevel, hotelId: hotelId ?? null, until: newUntil || null }),
								`${giveRow.fullName} now has ${label(newRole)} · ${levelLabel[newLevel]}${newUntil ? ` until ${day(newUntil)}` : ""}`,
								done(() => setGiveOpen(false)),
							)}>Give role</Button>
					</>
				}>
				<div className="flex flex-col gap-5">
					{!givePerson && <TextField label="Find a person" value={find} onChange={setFind} placeholder="Name, email or phone" />}
					<SelectField label="Person" value={giveTo} onChange={(v) => { setGiveTo(v); setGivePerson(found.find((a) => a.id === v) ?? null); setNewRole(""); }} placeholder={found.length || givePerson ? "Choose a person" : "No one matches"} options={[...(givePerson && !found.some((a) => a.id === givePerson.id) ? [givePerson] : []), ...found].map((a) => ({ value: a.id, label: a.fullName, hint: a.grants.map((g) => label(g.role)).join(", ") }))} />
					<SelectField label="Role" value={newRole} onChange={setNewRole} disabled={!giveRow} placeholder={giveRow ? "Choose a role" : "Choose a person first"} options={givable(giveRow ?? undefined).map((r) => ({ value: r, label: roleLabels[r], hint: roleDescriptions[r] }))} />
					<ChoiceCards label="Level" value={newLevel} onChange={setNewLevel} options={LEVEL_OPTIONS} />
					<TextField label="Last day (optional)" type="date" value={newUntil} onChange={setNewUntil} hint="Leave empty for a role with no end. It ends at midnight after this day, Lagos time" />
					{newRole && newRole !== "MANAGER" && (
						<WhatHappens items={(ROLE_PERMISSIONS[newRole as HotelRole] ?? []).map((m) => `${m.name}: ${[...m.view, ...(newLevel !== "VIEW" ? m.edit : []), ...(newLevel === "FULL" ? m.full : [])].join(", ") || "nothing at this level"}`)} />
					)}
					{newRole === "MANAGER" && <Note tone="warning">A manager can open every screen at this hotel and change other people's roles.</Note>}
				</div>
			</SidePanel>

			{/* Change level */}
			<Modal open={!!change} onOpenChange={(o) => !o && setChange(null)} title="Change level" subtitle={change && changeGrant ? `${change.row.fullName} · ${label(changeGrant.role)}` : undefined} size="form" icon={UserCogIcon}
				footer={
					<>
						<Button variant="outline" className={btn.secondary} onClick={() => setChange(null)}>Cancel</Button>
						<Button className={btn.primary} disabled={pending || !changeGrant || changeGrant.level === change?.level}
							onClick={() => change && changeGrant && run(
								() => changeAccess(change.row.id, change.grantId, { change: "CHANGE_LEVEL", level: change.level }),
								`${label(changeGrant.role)} is now ${levelLabel[change.level]} for ${change.row.fullName}`,
								done(() => setChange(null)),
							)}>Save level</Button>
					</>
				}>
				{change && (
					<div className="flex flex-col gap-4">
						{rolePicker(change, (grantId) => setChange({ ...change, grantId, level: (change.row.grants.find((g) => g.id === grantId)?.level ?? "EDIT") as Level }))}
						<ChoiceCards value={change.level} onChange={(level) => setChange({ ...change, level })} options={LEVEL_OPTIONS} />
						<p className="text-xs text-ink-3">Applies on their next page; they are told in the app.</p>
					</div>
				)}
			</Modal>

			{/* Temporary access */}
			<Modal open={!!temp} onOpenChange={(o) => !o && setTemp(null)} title="Temporary access" subtitle={temp && tempGrant ? `${temp.row.fullName} · ${label(tempGrant.role)}` : undefined} size="form" icon={CalendarIcon}
				footer={
					<>
						{tempGrant?.until && (
							<Button variant="outline" className={btn.secondary} disabled={pending}
								onClick={() => temp && tempGrant && run(
									() => changeAccess(temp.row.id, temp.grantId, { change: "SET_UNTIL", until: null }),
									`${label(tempGrant.role)} no longer ends for ${temp.row.fullName}`,
									done(() => setTemp(null)),
								)}>Remove end date</Button>
						)}
						<Button variant="outline" className={btn.secondary} onClick={() => setTemp(null)}>Cancel</Button>
						<Button className={btn.primary} disabled={pending || !temp?.until || temp.until < todayLagos()}
							onClick={() => temp && tempGrant && run(
								() => changeAccess(temp.row.id, temp.grantId, { change: "SET_UNTIL", until: temp.until }),
								`${temp.row.fullName}'s ${label(tempGrant.role)} ends after ${day(temp.until)}`,
								done(() => setTemp(null)),
							)}>Set last day</Button>
					</>
				}>
				{temp && (
					<div className="flex flex-col gap-4">
						{rolePicker(temp, (grantId) => setTemp({ ...temp, grantId, until: temp.row.grants.find((g) => g.id === grantId)?.until ?? "" }))}
						<TextField label="Last day" type="date" value={temp.until} onChange={(until) => setTemp({ ...temp, until })} hint="The role ends at midnight after this day (Lagos time) and they are told" />
						<Note tone="info">Good for cover shifts and trainees.</Note>
					</div>
				)}
			</Modal>

			{/* Pause or resume */}
			<ConfirmModal open={!!pause} onOpenChange={(o) => !o && setPause(null)} title={pauseGrant?.paused ? "Resume role" : "Pause role"} subtitle={pause && pauseGrant ? `${pause.row.fullName} · ${label(pauseGrant.role)}` : undefined} confirmLabel={pauseGrant?.paused ? "Resume role" : "Pause role"} pending={pending} confirmDisabled={!pauseGrant}
				onConfirm={() => pause && pauseGrant && run(
					() => changeAccess(pause.row.id, pause.grantId, pauseGrant.paused ? { change: "RESUME" } : { change: "PAUSE", reason: reason.trim() || null }),
					`${label(pauseGrant.role)} ${pauseGrant.paused ? "resumed" : "paused"} for ${pause.row.fullName}`,
					done(() => setPause(null)),
				)}>
				{pause && (
					<div className="flex flex-col gap-4">
						{rolePicker(pause, (grantId) => setPause({ ...pause, grantId }))}
						{pauseGrant?.paused ? (
							<WhatHappens items={["They can use this role again from their next page", "They are told in the app"]} />
						) : (
							<>
								<WhatHappens tone="warning" items={["They lose this role's screens from their next page", "Their shifts and history stay", "You can resume any time"]} />
								<TextareaField label="Reason (optional)" value={reason} onChange={setReason} placeholder="e.g. On leave until the 10th" rows={2} />
							</>
						)}
					</div>
				)}
			</ConfirmModal>

			{/* Remove */}
			<ConfirmModal open={!!remove} onOpenChange={(o) => !o && setRemove(null)} title="Remove role" subtitle={remove && removeGrant ? `${remove.row.fullName} loses ${label(removeGrant.role)}` : undefined} tone="danger" confirmLabel="Remove role" pending={pending} confirmDisabled={!removeGrant}
				alternative={removeGrant && !removeGrant.paused ? { label: "Pause instead", onClick: () => { if (remove) { setReason(""); setPause(remove); } setRemove(null); } } : undefined}
				onConfirm={() => remove && removeGrant && run(
					() => changeAccess(remove.row.id, remove.grantId, { change: "REMOVE" }),
					`${label(removeGrant.role)} removed from ${remove.row.fullName}`,
					done(() => setRemove(null)),
				)}>
				{remove && (
					<div className="flex flex-col gap-4">
						{rolePicker(remove, (grantId) => setRemove({ ...remove, grantId }))}
						<WhatHappens tone="danger" items={["They can no longer open this role's screens", "Everything they did stays in the activity log", "Their other roles are not affected; a person's only active role can't be removed"]} />
					</div>
				)}
			</ConfirmModal>
		</>
	);
}
