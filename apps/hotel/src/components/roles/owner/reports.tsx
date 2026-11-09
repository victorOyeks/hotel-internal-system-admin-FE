"use client";

import { CalendarClockIcon, DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField, ToggleField } from "@hospio/ui/shared/field";
import { fmtWhen } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import type { ReportRow } from "@hospio/api/data/types";
import { DownloadModal, useParam } from "./common";

export function OwnerReports({ reports }: { reports: ReportRow[] }) {
	const [open, setOpen] = useParam("open");
	const [kind, setKind] = useState("all");
	const [search, setSearch] = useState("");
	const [download, setDownload] = useState<ReportRow | null>(null);
	const [schedule, setSchedule] = useState<ReportRow | null>(null);
	const kinds = ["all", ...new Set(reports.map((r) => r.kind))];
	const rows = reports.filter((r) => (kind === "all" || r.kind === kind) && (!search || `${r.name} ${r.description}`.toLowerCase().includes(search.toLowerCase())));
	const selected = reports.find((r) => r.id === open) ?? null;

	return (
		<>
			<PageHeader title="Reports" subtitle="Ready to read or download · every hotel or one branch" />
			<Toolbar left={<PillTabs tabs={kinds.map((k) => ({ key: k, label: k === "all" ? "All" : k, count: k === "all" ? reports.length : reports.filter((r) => r.kind === k).length }))} value={kind} onChange={setKind} />} right={<SearchBox value={search} onChange={setSearch} placeholder="Search reports" />} />
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{rows.map((r) => (
					<div key={r.id} className="flex flex-col gap-3 rounded-card border border-line bg-card p-4">
						<div className="flex items-start gap-3">
							<span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><FileTextIcon className="size-4" /></span>
							<div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink">{r.name}</p><p className="text-xs text-ink-3">{r.kind}{r.schedule ? ` · ${r.schedule}` : ""}</p></div>
							{r.schedule && <StatusPill dot={false} tone="info">Scheduled</StatusPill>}
						</div>
						<p className="text-[13px] text-ink-2">{r.description}</p>
						<p className="text-[11px] text-ink-3">{r.lastRun ? `Last run ${fmtWhen(r.lastRun)}` : "Never run"} · {r.formats.join(", ")}</p>
						<div className="mt-auto flex gap-2">
							<Button variant="outline" className={`${btn.secondary} ${btn.small} flex-1`} onClick={() => setOpen(r.id)}>Preview</Button>
							<Button className={`${btn.primary} ${btn.small} flex-1`} onClick={() => setDownload(r)}><DownloadIcon className="size-3" /> Download</Button>
						</div>
					</div>
				))}
			</div>

			<SidePanel open={!!selected} onOpenChange={(o) => !o && setOpen(null)} title={selected?.name ?? ""} subtitle={selected ? `${selected.kind} · preview for this month` : undefined} icon={FolderIcon} width="lg" footerInfo={selected?.recipients ? `Goes to ${selected.recipients}` : undefined} footer={selected && <><Button variant="outline" className={btn.secondary} onClick={() => setSchedule(selected)}><CalendarClockIcon className="size-4" /> Schedule</Button><Button className={btn.primary} onClick={() => setDownload(selected)}><DownloadIcon className="size-4" /> Download</Button></>}>
				{selected && (
					<div className="flex flex-col gap-6">
						<PanelSection title="About"><DetailList columns={2} items={[{ label: "What it covers", value: selected.description }, { label: "Formats", value: selected.formats.join(", ") }, { label: "Schedule", value: selected.schedule ?? "Not scheduled" }, { label: "Last run", value: fmtWhen(selected.lastRun) }]} /></PanelSection>
						<PanelSection title="Preview">
							<div className="rounded-xl border border-line bg-subtle/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">Royal Suites Ltd · {selected.name}</p>
								<p className="mt-1 text-lg font-bold text-ink">{new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
								<table className="mt-3 w-full text-left text-[13px]">
									<thead><tr className="text-[11px] uppercase text-ink-3"><th className="py-1">Branch</th><th>Value</th><th>vs last</th></tr></thead>
									<tbody>{["Simpas Ikeja", "Simpas Lekki", "Simpas Abuja", "Simpas Port Harcourt"].map((h, i) => <tr key={h} className="border-t border-line"><td className="py-[6px] text-ink">{h}</td><td className="font-semibold text-ink">{["₦67.5M", "₦41.2M", "₦24.8M", "₦14.3M"][i]}</td><td className={i === 3 ? "text-danger" : "text-success"}>{["+9%", "+4%", "−5%", "−15%"][i]}</td></tr>)}</tbody>
								</table>
								<p className="mt-3 text-[11px] text-ink-3">8 pages · generated when you download</p>
							</div>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<DownloadModal open={!!download} onOpenChange={(o) => !o && setDownload(null)} what={download?.name ?? ""} />
			<ScheduleModal report={schedule} onClose={() => setSchedule(null)} />
		</>
	);
}

function ScheduleModal({ report, onClose }: { report: ReportRow | null; onClose: () => void }) {
	const [every, setEvery] = useState("Weekly · Monday");
	const [time, setTime] = useState("07:00");
	const [me, setMe] = useState(true);
	const [managers, setManagers] = useState(false);
	const { run, pending } = useNotConnectedAction();
	return (
		<Modal open={!!report} onOpenChange={(o) => !o && onClose()} title="Schedule this report" subtitle={report?.name} icon={CalendarClockIcon} size="form" footerInfo="Sent by email as PDF" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run(`${report?.name} scheduled · ${every}`, onClose)}>Save schedule</Button></>}>
			<div className="flex flex-col gap-4">
				<SelectField label="How often" value={every} onChange={setEvery} options={["Daily", "Weekly · Monday", "Monthly · 1st", "Monthly · last day"]} />
				<TextField label="Time" value={time} onChange={setTime} type="time" />
				<ToggleField label="Send to me" hint="godwin@royalsuites.ng" checked={me} onChange={setMe} />
				<ToggleField label="Send to every manager" hint="Each manager gets their own hotel only" checked={managers} onChange={setManagers} />
			</div>
		</Modal>
	);
}
