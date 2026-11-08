"use client";

import { CalendarDaysIcon, CheckIcon, PlayIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Timeline } from "@hospio/ui/shared/detail-list";
import { TextareaField } from "@hospio/ui/shared/field";
import { fmtDay, fmtLongDate, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { ScheduledJobRow, SparePartRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";
import { BigButton, BoardCard, ShiftPill, Stepper } from "../shared-staff/tablet";

const checklists: Record<string, string[]> = {
	default: ["Inspected", "Cleaned", "Tested working", "Area left tidy"],
	"Generator service": ["Oil changed", "Oil filter changed", "Fuel filter checked", "Battery terminals cleaned", "Test run 10 min"],
	"Fire extinguisher check": ["Pressure gauge in green", "Pin and seal intact", "Tag dated", "Mounted and visible"],
};

/** Maintenance · Scheduled jobs (3248:14362) and do a job (3248:14555). */
export function ScheduledJobsScreen({ jobs, parts }: { jobs: ScheduledJobRow[]; parts: SparePartRow[] }) {
	const [rows, setRows] = useState(jobs);
	const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("due"));
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [ticks, setTicks] = useState<boolean[]>([]);
	const [note, setNote] = useState("");
	const [used, setUsed] = useState<Record<string, number>>({});
	const { run, pending } = useDemoAction();

	const today = new Date().toISOString().slice(0, 10);
	const bucket = (j: ScheduledJobRow) => (j.paused ? "paused" : j.nextDue < today ? "overdue" : j.nextDue === today ? "due" : "upcoming");
	const current = rows.find((j) => j.id === open) ?? null;
	const list = rows.filter((j) => (tab === "due" ? bucket(j) === "due" || bucket(j) === "overdue" : tab === "upcoming" ? bucket(j) === "upcoming" : true));
	const check = current ? checklists[current.title] ?? checklists.default : [];
	const openJob = (j: ScheduledJobRow) => { setTicks(Array((checklists[j.title] ?? checklists.default).length).fill(false)); setNote(""); setUsed({}); void setOpen(j.id); };

	return (
		<>
			<PageHeader title="Scheduled jobs" subtitle="Repeating maintenance set up by the manager · generator, AC filters, tanks, extinguishers">
				<ShiftPill until="4pm" />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Due today" value={rows.filter((j) => bucket(j) === "due").length} icon={CalendarDaysIcon} />
				<KpiCard label="Overdue" value={rows.filter((j) => bucket(j) === "overdue").length} icon={CalendarDaysIcon} hint="Manager is told after 2 days" />
				<KpiCard label="Next 7 days" value={rows.filter((j) => bucket(j) === "upcoming" && j.nextDue <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length} icon={CalendarDaysIcon} />
				<KpiCard label="Paused" value={rows.filter((j) => j.paused).length} icon={CalendarDaysIcon} />
			</div>
			<PillTabs tabs={[{ key: "due", label: "Due", count: rows.filter((j) => bucket(j) === "due" || bucket(j) === "overdue").length }, { key: "upcoming", label: "Upcoming", count: rows.filter((j) => bucket(j) === "upcoming").length }, { key: "all", label: "All", count: rows.length }]} value={tab} onChange={(k) => void setTab(k === "due" ? null : k)} />
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
				{list.map((j) => {
					const b = bucket(j);
					return (
						<BoardCard key={j.id} onClick={() => openJob(j)} accent={b === "overdue" ? "warning" : "none"}>
							<div className="flex items-center justify-between"><span className="text-[15px] font-bold text-ink">{j.title}</span><StatusPill tone={b === "overdue" ? "danger" : b === "due" ? "warning" : b === "paused" ? "grey" : "info"}>{b === "overdue" ? `Overdue · ${fmtDay(j.nextDue)}` : b === "due" ? "Due today" : b === "paused" ? "Paused" : fmtDay(j.nextDue)}</StatusPill></div>
							<p className="text-[13px] text-ink-3">{j.area} · every {j.everyDays} days · {j.assignedTo ?? "anyone"}</p>
							<p className="text-[13px] text-ink-2">Last done {j.lastDone ? fmtLongDate(j.lastDone) : "never"}</p>
						</BoardCard>
					);
				})}
			</div>

			<SidePanel open={!!current} onOpenChange={(o) => !o && void setOpen(null)} title={current?.title ?? ""} subtitle={current ? `${current.area} · every ${current.everyDays} days · due ${fmtDay(current.nextDue)}` : undefined} icon={CalendarDaysIcon} width="lg"
				footerInfo={`${ticks.filter(Boolean).length} of ${check.length} ticked`}
				footer={current && !current.paused ? <><BigButton tone="secondary" onClick={() => void setOpen(null)}>Later</BigButton><BigButton pending={pending} disabled={!ticks.every(Boolean)} onClick={() => run(`${current.title} done · next due in ${current.everyDays} days`, () => { setRows((r) => r.map((j) => (j.id === current.id ? { ...j, lastDone: today, nextDue: new Date(Date.now() + j.everyDays * 86400000).toISOString().slice(0, 10), runs: [{ on: today, by: "Chinedu Obi", note: note || undefined }, ...j.runs] } : j))); void setOpen(null); })}><CheckIcon className="size-5" /> Mark done</BigButton></> : <BigButton tone="secondary" onClick={() => void setOpen(null)}>Close</BigButton>}>
				{current && (
					<div className="flex flex-col gap-5">
						<PanelSection title="Checklist">
							<ul className="flex flex-col gap-2">{check.map((c, i) => <li key={c}><button type="button" onClick={() => setTicks((t) => t.map((x, j) => (j === i ? !x : x)))} className={cn("flex h-14 w-full items-center gap-3 rounded-control border px-4 text-left text-[15px] font-medium", ticks[i] ? "border-success/40 bg-success-soft" : "border-line bg-card hover:bg-subtle")}><span className={cn("flex size-7 items-center justify-center rounded-full border-2", ticks[i] ? "border-success bg-success text-white" : "border-line-strong")}>{ticks[i] && <CheckIcon className="size-4" />}</span>{c}</button></li>)}</ul>
						</PanelSection>
						<PanelSection title="Parts used">
							<ul className="divide-y divide-line rounded-control border border-line">{parts.map((p) => <li key={p.id} className="flex items-center gap-3 px-4 py-2"><span className="flex-1 text-[15px] font-medium text-ink">{p.name}</span><span className="text-xs text-ink-3">{p.quantity} in stock</span><Stepper value={used[p.name] ?? 0} onChange={(v) => setUsed({ ...used, [p.name]: v })} max={p.quantity} /></li>)}</ul>
						</PanelSection>
						<TextareaField label="Note" value={note} onChange={setNote} rows={2} placeholder="e.g. oil was very dark, check again in 2 weeks" />
						<PanelSection title="History">
							<DetailList columns={2} items={[{ label: "Last done", value: current.lastDone ? fmtLongDate(current.lastDone) : "Never" }, { label: "Runs", value: plural(current.runs.length, "run") }]} />
							{current.runs.length > 0 && <Timeline items={current.runs.map((r) => ({ at: fmtLongDate(r.on), by: r.by, text: r.note ?? "Done" }))} />}
						</PanelSection>
						<span className="hidden"><PlayIcon /></span>
					</div>
				)}
			</SidePanel>
		</>
	);
}
