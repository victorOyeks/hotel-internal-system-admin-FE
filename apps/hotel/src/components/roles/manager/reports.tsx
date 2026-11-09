"use client";

import { CalendarClockIcon, DownloadIcon, FileTextIcon, FolderIcon, MailIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import type { ReportRow } from "@hospio/api/data/types";

const previewRows = [
	["Sat 1 Nov", "96", "80%", "₦1,310,200", "₦642,500"],
	["Sun 2 Nov", "92", "77%", "₦1,098,000", "₦118,000"],
	["Mon 3 Nov", "88", "73%", "₦960,500", "₦384,000"],
	["Tue 4 Nov", "94", "78%", "₦1,205,000", "₦86,500"],
	["Wed 5 Nov", "101", "84%", "₦1,485,500", "₦520,000"],
	["Thu 6 Nov", "98", "82%", "₦1,232,000", "₦64,300"],
];

/** Manager · Reports: the library, a preview with download, and scheduling. */
export function ReportsScreen({ reports, hotelName }: { reports: ReportRow[]; hotelName: string }) {
	const [search, setSearch] = useState("");
	const [open, setOpen] = useQueryState("open");
	const [schedule, setSchedule] = useState<ReportRow | null>(null);
	const [range, setRange] = useState("7");
	const [format, setFormat] = useState("PDF");
	const [frequency, setFrequency] = useState("Daily");
	const [time, setTime] = useState("06:00");
	const [recipients, setRecipients] = useState("Owner, Manager");
	const { run, pending } = useNotConnectedAction();

	const current = reports.find((r) => r.id === open) ?? null;
	const kinds = Array.from(new Set(reports.map((r) => r.kind)));
	const visible = reports.filter((r) => !search || `${r.name} ${r.description} ${r.kind}`.toLowerCase().includes(search.toLowerCase()));

	return (
		<>
			<PageHeader title="Reports" subtitle={`${hotelName} · every report the owner can see, ready to preview, download or schedule`}>
				<SearchBox value={search} onChange={setSearch} placeholder="Search reports…" />
			</PageHeader>

			{kinds.map((kind) => {
				const group = visible.filter((r) => r.kind === kind);
				if (group.length === 0) return null;
				return (
					<section key={kind} className="flex flex-col gap-3">
						<h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{kind}</h2>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{group.map((r) => (
								<button key={r.id} type="button" onClick={() => void setOpen(r.id)} className="flex flex-col gap-3 rounded-card border border-line bg-card p-[18px] text-left transition-colors hover:bg-brand-soft/20">
									<div className="flex items-center gap-[10px]">
										<span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><FileTextIcon className="size-4" /></span>
										<span className="flex-1 text-[15px] font-bold text-ink">{r.name}</span>
										{r.schedule && <StatusPill tone="info" dot={false}>Scheduled</StatusPill>}
									</div>
									<p className="text-[13px] text-ink-2">{r.description}</p>
									<div className="mt-auto flex items-center gap-2 text-xs text-ink-3">
										<span className="flex-1">{r.lastRun ? `Last run ${fmtWhen(r.lastRun)}` : "Never run"}</span>
										{r.formats.map((f) => <span key={f} className="rounded-md bg-subtle px-[6px] py-[2px] font-semibold text-ink-2">{f}</span>)}
									</div>
								</button>
							))}
						</div>
					</section>
				);
			})}

			<SidePanel open={!!current} onOpenChange={(o) => !o && void setOpen(null)} title={current?.name ?? ""} subtitle={current?.description} icon={FolderIcon} width="lg"
				footerInfo={current?.schedule ? `Scheduled ${current.schedule} · to ${current.recipients}` : "Not scheduled"}
				footer={current && (
					<>
						<Button variant="outline" className={btn.secondary} onClick={() => setSchedule(current)}><CalendarClockIcon className="size-4" /> Schedule</Button>
						<Button variant="outline" className={btn.secondary} disabled={pending} onClick={() => run("Report emailed to you", undefined, { tone: "info" })}><MailIcon className="size-4" /> Email me</Button>
						<Button className={btn.primary} disabled={pending} onClick={() => run(`${current.name} downloaded as ${format}`)}><DownloadIcon className="size-4" /> Download {format}</Button>
					</>
				)}>
				{current && (
					<div className="flex flex-col gap-5">
						<div className="grid grid-cols-2 gap-3">
							<SelectField label="Period" value={range} onChange={setRange} options={[{ value: "1", label: "Today" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "This month" }, { value: "90", label: "Last 3 months" }]} />
							<SelectField label="Format" value={format} onChange={setFormat} options={current.formats} />
						</div>
						<PanelSection title="Preview">
							<div className="overflow-hidden rounded-xl border border-line">
								<table className="w-full text-left text-[13px]">
									<thead>
										<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
											<th className="px-3 py-2">Day</th><th className="px-3 py-2">Rooms</th><th className="px-3 py-2">Occ.</th><th className="px-3 py-2">Revenue</th><th className="px-3 py-2">Spent</th>
										</tr>
									</thead>
									<tbody>
										{previewRows.map((r) => (
											<tr key={r[0]} className="border-b border-line last:border-b-0">
												{r.map((c, i) => <td key={i} className={`px-3 py-2 ${i === 0 ? "font-medium text-ink" : "text-ink-2"}`}>{c}</td>)}
											</tr>
										))}
										<tr className="bg-subtle/60 font-bold text-ink">
											<td className="px-3 py-2">Total</td><td className="px-3 py-2">569</td><td className="px-3 py-2">79%</td><td className="px-3 py-2">{naira(7291200)}</td><td className="px-3 py-2">{naira(1815300)}</td>
										</tr>
									</tbody>
								</table>
							</div>
							<Note tone="info">The preview shows the first rows. The download has every row for the period, with the {hotelName} header.</Note>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<Modal open={!!schedule} onOpenChange={(o) => !o && setSchedule(null)} title={`Schedule · ${schedule?.name ?? ""}`} subtitle="Sent by email on the schedule you pick" icon={CalendarClockIcon} size="form"
				footer={<><Button variant="outline" className={btn.secondary} onClick={() => setSchedule(null)}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Schedule saved", () => setSchedule(null), { description: `${frequency} at ${time} to ${recipients}` })}>Save schedule</Button></>}>
				<div className="flex flex-col gap-4">
					<ChoiceCards label="How often" value={frequency} onChange={setFrequency} columns={3} options={[{ value: "Daily", label: "Daily" }, { value: "Weekly", label: "Weekly", hint: "Mondays" }, { value: "Monthly", label: "Monthly", hint: "1st of the month" }]} />
					<div className="grid grid-cols-2 gap-3">
						<TextField label="Time" type="time" value={time} onChange={setTime} />
						<SelectField label="Format" value={format} onChange={setFormat} options={schedule?.formats ?? ["PDF"]} />
					</div>
					<TextField label="Send to" value={recipients} onChange={setRecipients} hint="Names or email addresses, separated by commas" />
				</div>
			</Modal>
		</>
	);
}
