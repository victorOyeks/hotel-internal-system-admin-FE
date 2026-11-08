"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { differenceInMinutes } from "date-fns";
import { CalendarDaysIcon, ClockIcon, PlusIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtDay, fmtTime, fmtWhen, initials, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { RepairRow, ScheduledJobRow, SparePartRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";
import { JobPanel, MarkDoneModal, NewTaskPanel, TaskPanel, UsePartModal, teamOf } from "./panels";

type Tab = "board" | "jobs" | "parts" | "past";
const today = () => new Date().toISOString().slice(0, 10);

function age(iso: string) {
	const m = differenceInMinutes(new Date(), new Date(iso));
	if (m < 60) return `${m} min`;
	if (m < 60 * 24) return `${Math.round(m / 60)}h`;
	return `${Math.round(m / 60 / 24)}d`;
}

const teamTone: Record<string, string> = { Housekeeping: "bg-brand-soft text-brand", Maintenance: "bg-info-soft text-info", "Front desk": "bg-warning-soft text-warning", Store: "bg-subtle text-ink-2", You: "bg-danger-soft text-danger" };

function TaskCard({ t, onOpen }: { t: RepairRow; onOpen: () => void }) {
	const done = t.status === "DONE";
	return (
		<button type="button" onClick={onOpen} className={cn("flex w-full flex-col gap-2 rounded-xl border bg-card p-3 text-left hover:border-brand/40", t.priority === "URGENT" && !done ? "border-brand/30" : "border-line")}>
			<div className="flex items-center gap-[6px]">
				<span className={cn("rounded-[6px] px-[6px] py-[2px] text-[10px] font-semibold", teamTone[teamOf(t)] ?? "bg-subtle text-ink-2")}>{teamOf(t)}</span>
				{(t.roomNumber || t.area) && <span className="rounded-[6px] bg-subtle px-[6px] py-[2px] text-[10px] font-semibold text-ink-2">{t.roomNumber ?? t.area}</span>}
				{t.priority === "URGENT" && !done && <StatusPill tone="danger" dot={false} className="ml-auto">Urgent</StatusPill>}
			</div>
			<p className={cn("text-[13px] font-semibold text-ink", done && "line-through text-ink-3")}>{t.title}</p>
			{t.status === "WAITING_PARTS" && t.updates[t.updates.length - 1] && <p className="text-xs text-warning">{t.updates[t.updates.length - 1].note}</p>}
			{t.description && !done && <p className="line-clamp-1 text-xs text-ink-3">{t.description}</p>}
			<div className="flex items-center gap-2 text-xs text-ink-3">
				{t.assignedTo ? <><span className="flex size-5 items-center justify-center rounded-full bg-brand-soft text-[9px] font-bold text-brand">{initials(t.assignedTo)}</span><span className="flex-1 truncate">{t.assignedTo}</span></> : <span className="flex-1 text-danger">Unassigned</span>}
				<ClockIcon className="size-3" /> {done ? fmtTime(t.doneAt) : t.priority === "URGENT" ? "Now" : `${age(t.createdAt)} ago`}
			</div>
		</button>
	);
}

export function TasksScreen({ hotelName, tasks, jobs, parts, areas }: { hotelName: string; tasks: RepairRow[]; jobs: ScheduledJobRow[]; parts: SparePartRow[]; areas: string[] }) {
	const [tab] = useQueryState("tab");
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [team, setTeam] = useState("");
	const [search, setSearch] = useState("");
	const [jobId, setJobId] = useState<string | "new" | null>(null);
	const [part, setPart] = useState<SparePartRow | null>(null);
	const [markDone, setMarkDone] = useState<RepairRow | null>(null);
	const { run } = useDemoAction();
	const active = (tab as Tab) || "board";

	const openTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
	const doneToday = tasks.filter((t) => t.status === "DONE" && t.doneAt?.slice(0, 10) === today());
	const urgent = openTasks.filter((t) => t.priority === "URGENT").length;
	const teams = [...new Set(tasks.map(teamOf))];
	const visible = tasks.filter((t) => !team || teamOf(t) === team);
	const byPriority = (a: RepairRow, b: RepairRow) => ["URGENT", "HIGH", "NORMAL", "LOW"].indexOf(a.priority) - ["URGENT", "HIGH", "NORMAL", "LOW"].indexOf(b.priority);
	const columns = [
		{ key: "todo", label: "To do", items: visible.filter((t) => t.status === "OPEN").sort(byPriority) },
		{ key: "doing", label: "In progress", items: visible.filter((t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS").sort(byPriority) },
		{ key: "waiting", label: "Waiting", items: visible.filter((t) => t.status === "WAITING_PARTS").sort(byPriority) },
		{ key: "done", label: "Done today", items: visible.filter((t) => t.status === "DONE" && t.doneAt?.slice(0, 10) === today()) },
	];
	const selected = tasks.find((t) => t.id === openId) ?? null;
	const job = jobId && jobId !== "new" ? (jobs.find((j) => j.id === jobId) ?? null) : null;

	const jobColumns: ColumnDef<ScheduledJobRow, unknown>[] = [
		{ header: "Job", accessorKey: "title", cell: ({ row }) => <TwoLine primary={row.original.title} secondary={`${row.original.area} · every ${row.original.everyDays} days`} /> },
		{ header: "Assigned", accessorKey: "assignedTo", cell: ({ row }) => (row.original.assignedTo ? <AvatarName name={row.original.assignedTo} size="sm" /> : <span className="text-ink-3">Anyone</span>) },
		{ header: "Last done", accessorKey: "lastDone", cell: ({ row }) => <span className="text-ink-2">{row.original.lastDone ? fmtDay(row.original.lastDone) : "Never"}</span> },
		{ header: "Next due", accessorKey: "nextDue", cell: ({ row }) => <span className={cn("font-medium", row.original.nextDue <= today() && !row.original.paused ? "text-danger" : "text-ink")}>{fmtDay(row.original.nextDue)}</span> },
		{ header: "Status", id: "status", accessorFn: (r) => (r.paused ? 2 : r.nextDue <= today() ? 0 : 1), cell: ({ row }) => (row.original.paused ? <StatusPill tone="grey">Paused</StatusPill> : row.original.nextDue < today() ? <StatusPill tone="danger">Overdue</StatusPill> : row.original.nextDue === today() ? <StatusPill tone="warning">Due today</StatusPill> : <StatusPill tone="success">On track</StatusPill>) },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <RowActions actions={[{ label: "Open", onClick: () => setJobId(row.original.id) }, { label: "Done today", onClick: () => run(`${row.original.title} done · next in ${row.original.everyDays} days`) }, { label: row.original.paused ? "Resume" : "Pause", onClick: () => run(row.original.paused ? "Job resumed" : "Job paused", undefined, { tone: "info" }) }, { label: "Delete job", onClick: () => setJobId(row.original.id), tone: "danger", managerOnly: true, separatorBefore: true }]} /> },
	];

	const partColumns: ColumnDef<SparePartRow, unknown>[] = [
		{ header: "Part", accessorKey: "name", cell: ({ row }) => <span className="font-semibold text-ink">{row.original.name}</span> },
		{ header: "In stock", accessorKey: "quantity", cell: ({ row }) => <div className="w-36"><ProgressBar value={row.original.quantity} max={row.original.minQuantity * 2} tone={row.original.quantity < row.original.minQuantity ? "danger" : "brand"} /><p className="mt-1 text-xs text-ink-2">{row.original.quantity} · min {row.original.minQuantity}</p></div> },
		{ header: "Unit cost", accessorKey: "unitCost", cell: ({ row }) => naira(row.original.unitCost) },
		{ header: "Status", id: "status", accessorFn: (r) => r.quantity / r.minQuantity, cell: ({ row }) => (row.original.quantity < row.original.minQuantity ? <StatusPill tone="danger">Low</StatusPill> : <StatusPill tone="success">OK</StatusPill>) },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end gap-2"><Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={() => setPart(row.original)}>Use a part</Button><Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={() => run(`${row.original.name} added to the store's next order`, undefined, { tone: "info" })}>Ask store</Button></div> },
	];

	const pastColumns: ColumnDef<RepairRow, unknown>[] = [
		{ header: "Task", accessorKey: "title", cell: ({ row }) => <TwoLine primary={row.original.title} secondary={`${teamOf(row.original)} · ${row.original.roomNumber ? `Room ${row.original.roomNumber}` : row.original.area ?? ""}`} /> },
		{ header: "Done by", accessorKey: "assignedTo", cell: ({ row }) => row.original.assignedTo ?? "—" },
		{ header: "Opened", accessorKey: "createdAt", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.createdAt)}</span> },
		{ header: "Closed", accessorKey: "doneAt", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.doneAt ?? row.original.updates[row.original.updates.length - 1]?.at)}</span> },
		{ header: "Outcome", accessorKey: "status", cell: ({ row }) => <StatusPill tone={row.original.status === "DONE" ? "success" : "grey"}>{row.original.status === "DONE" ? "Done" : "Cancelled"}</StatusPill> },
	];

	return (
		<>
			<PageHeader title="Tasks & maintenance" subtitle={`${hotelName} · ${openTasks.length} open · ${urgent} urgent · ${doneToday.length} done today`}>
				<Button variant="outline" className={btn.secondary} onClick={() => setJobId("new")}><CalendarDaysIcon className="size-4" /> Maintenance schedule</Button>
				<Button className={btn.primary} onClick={() => setIsNew("1")}><PlusIcon className="size-4" /> New task</Button>
			</PageHeader>

			<Toolbar
				left={<PillTabs<Tab> param="tab" tabs={[{ key: "board", label: "Board", count: openTasks.length }, { key: "jobs", label: "Scheduled jobs", count: jobs.filter((j) => !j.paused && j.nextDue <= today()).length }, { key: "parts", label: "Spare parts", count: parts.filter((x) => x.quantity < x.minQuantity).length }, { key: "past", label: "Past" }]} />}
				right={
					active === "board" ? (
						<div className="inline-flex gap-[2px] rounded-[10px] bg-subtle p-1">
							{["", ...teams].map((t) => (
								<button key={t || "all"} type="button" onClick={() => setTeam(t)} className={cn("rounded-lg px-3 py-[6px] text-xs", team === t ? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "font-medium text-ink-2")}>
									{t || "All teams"} <span className="ml-1 text-[10px] text-ink-3">{t ? tasks.filter((x) => teamOf(x) === t && x.status !== "DONE" && x.status !== "CANCELLED").length : openTasks.length}</span>
								</button>
							))}
						</div>
					) : (
						<>
							{active === "jobs" && <Button className={btn.primary} onClick={() => setJobId("new")}><PlusIcon className="size-4" /> Repeating job</Button>}
							<SearchBox value={search} onChange={setSearch} placeholder="Search…" />
						</>
					)
				}
			/>

			{active === "board" && (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{columns.map((c) => (
						<div key={c.key} className="flex flex-col gap-2 rounded-card border border-line bg-subtle/50 p-3">
							<div className="flex items-center gap-2 px-1">
								<span className="text-[13px] font-semibold text-ink">{c.label}</span>
								<span className="rounded-[6px] bg-card px-[6px] py-px text-[10px] font-semibold text-ink-2">{c.items.length}</span>
								<button type="button" onClick={() => setIsNew("1")} className="ml-auto text-ink-3 hover:text-ink" aria-label="New task"><PlusIcon className="size-4" /></button>
							</div>
							{c.items.length === 0 ? <EmptyState title={c.key === "done" ? "Nothing done yet" : "Empty"} className="py-6" /> : c.items.slice(0, 6).map((t) => <TaskCard key={t.id} t={t} onOpen={() => setOpenId(t.id)} />)}
							{c.items.length > 6 && <p className="px-1 text-xs font-semibold text-ink-2">+ {c.items.length - 6} more</p>}
						</div>
					))}
				</div>
			)}
			{active === "jobs" && <DataTable columns={jobColumns} data={jobs} search={search} onRowClick={(j) => setJobId(j.id)} emptyTitle="No repeating jobs" emptyHint="Generator service, AC filters, water tanks — add the jobs that come round." />}
			{active === "parts" && <DataTable columns={partColumns} data={parts} search={search} emptyTitle="No spare parts tracked" />}
			{active === "past" && <DataTable columns={pastColumns} data={tasks.filter((t) => t.status === "DONE" || t.status === "CANCELLED")} search={search} onRowClick={(t) => setOpenId(t.id)} emptyTitle="Nothing finished yet" footer={<span>{plural(tasks.filter((t) => t.status === "DONE").length, "task")} done</span>} />}

			<TaskPanel task={selected} areas={areas} onClose={() => setOpenId(null)} />
			{isNew && <NewTaskPanel kind={isNew === "issue" ? "issue" : "task"} areas={areas} onClose={() => setIsNew(null)} />}
			{jobId && <JobPanel job={job} areas={areas} isNew={jobId === "new"} onClose={() => setJobId(null)} />}
			<UsePartModal part={part} onClose={() => setPart(null)} />
			<MarkDoneModal task={markDone} onClose={() => setMarkDone(null)} />
		</>
	);
}
