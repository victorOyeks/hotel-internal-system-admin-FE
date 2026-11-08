"use client";

import { CheckCircle2Icon, CircleIcon, DownloadIcon, MoonIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { MoneyField, TextareaField } from "@hospio/ui/shared/field";
import { fmtDay, fmtLongDate, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { NightAuditRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";

/** Finance 5.x · Night audit: checklist, close day, report, past audits. */
export function NightAuditScreen({ audits: initial, hotelName }: { audits: NightAuditRow[]; hotelName: string }) {
	const [audits, setAudits] = useState(initial);
	const [reportId, setReportId] = useQueryState("report");
	const [closing, setClosing] = useState(false);
	const [cash, setCash] = useState<number | "">("");
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	const today = audits.find((a) => a.status === "OPEN") ?? null;
	const past = audits.filter((a) => a.status === "CLOSED");
	const report = audits.find((a) => a.id === reportId) ?? null;
	const done = today?.checklist.filter((c) => c.done).length ?? 0;
	const total = today?.checklist.length ?? 0;
	const allDone = today ? done === total : false;
	const toggle = (key: string) => setAudits((xs) => xs.map((a) => (a.id === today?.id ? { ...a, checklist: a.checklist.map((c) => (c.key === key ? { ...c, done: !c.done } : c)) } : a)));

	return (
		<>
			<PageHeader title="Night audit" subtitle={today ? `${hotelName} · ${fmtLongDate(today.date)} · ${done} of ${total} checks done` : "Today is closed"}>
				{today && <button type="button" className={btn.primary} disabled={!allDone} onClick={() => setClosing(true)}><MoonIcon className="mr-1 inline size-4" /> Close the day</button>}
			</PageHeader>
			{today && (
				<>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
						<KpiCard label="Revenue so far" value={naira(today.revenue)} icon={MoonIcon} />
						<KpiCard label="Rooms occupied" value={today.roomsOccupied} icon={MoonIcon} hint="of 120" />
						<KpiCard label="Arrivals" value={today.arrivals} icon={MoonIcon} />
						<KpiCard label="Departures" value={today.departures} icon={MoonIcon} />
						<KpiCard label="No-shows" value={today.noShows} icon={MoonIcon} pill={today.noShows ? <StatusPill tone="warning">release?</StatusPill> : undefined} />
					</div>
					<SectionCard title="Before the day closes" subtitle="Every line must be green · tap one to mark it done once you've checked" count={total - done}>
						<ul className="divide-y divide-line">
							{today.checklist.map((c) => (
								<li key={c.key}>
									<button type="button" onClick={() => toggle(c.key)} className="flex w-full items-center gap-3 py-3 text-left">
										{c.done ? <CheckCircle2Icon className="size-5 text-success" /> : <CircleIcon className="size-5 text-line-strong" />}
										<span className={cn("flex-1 text-[13px]", c.done ? "text-ink-3 line-through" : "font-medium text-ink")}>{c.label}</span>
										{c.detail && !c.done && <StatusPill tone="warning">{c.detail}</StatusPill>}
									</button>
								</li>
							))}
						</ul>
						{!allDone && <Note tone="warning" className="mt-3">Arrivals still open? Mark each as checked in or no-show in Bookings. Guests staying longer than booked get their stay extended, not checked out.</Note>}
					</SectionCard>
				</>
			)}
			<SectionCard title="Past audits" subtitle="Reports stay here for the owner and the accountant" flush>
				<table className="w-full text-left text-[13px]">
					<thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-2">Day</th><th className="py-2 text-right">Revenue</th><th className="py-2 text-right">Rooms</th><th className="py-2 text-right">Cash counted</th><th className="py-2 text-right">Variance</th><th className="py-2">Closed by</th><th className="px-5 py-2" /></tr></thead>
					<tbody>
						{past.map((a) => (
							<tr key={a.id} className="border-b border-line last:border-b-0">
								<td className="px-5 py-3 font-semibold text-ink">{fmtDay(a.date)}</td>
								<td className="py-3 text-right">{naira(a.revenue)}</td>
								<td className="py-3 text-right">{a.roomsOccupied}</td>
								<td className="py-3 text-right">{naira(a.cashCounted ?? 0)}</td>
								<td className={cn("py-3 text-right font-semibold", a.variance === 0 ? "text-success" : (a.variance ?? 0) < 0 ? "text-danger" : "text-warning")}>{a.variance === 0 ? "—" : naira(a.variance ?? 0)}</td>
								<td className="py-3 text-ink-2">{a.closedBy} · {fmtWhen(a.closedAt)}</td>
								<td className="px-5 py-3 text-right"><button type="button" className={`${btn.secondary} ${btn.small}`} onClick={() => void setReportId(a.id)}>Report</button></td>
							</tr>
						))}
					</tbody>
				</table>
			</SectionCard>

			<Modal open={closing} onOpenChange={setClosing} title="Close the day" subtitle={today ? `${fmtLongDate(today.date)} · room charges post to every in-house folio at midnight` : undefined} icon={MoonIcon} footer={<><button type="button" className={btn.secondary} onClick={() => setClosing(false)}>Not yet</button><button type="button" className={btn.primary} disabled={typeof cash !== "number" || pending} onClick={() => void run("Day closed · report ready and sent to the owner", () => { setAudits((xs) => xs.map((a) => (a.id === today?.id ? { ...a, status: "CLOSED", cashCounted: typeof cash === "number" ? cash : 0, variance: (typeof cash === "number" ? cash : 0) - 248500, closedBy: "You", closedAt: new Date().toISOString() } : a))); setClosing(false); })}>Close the day</button></>}>
				{today && (
					<div className="flex flex-col gap-4">
						<TotalsList rows={[{ label: "Revenue", value: naira(today.revenue) }, { label: "Cash expected in the safe", value: naira(248500) }, { label: `${plural(today.roomsOccupied, "room")} charged tonight`, value: naira(today.roomsOccupied * 45000), strong: true }]} />
						<MoneyField label="Cash counted in the safe" value={cash} onChange={setCash} required />
						<TextareaField label="Notes for the report" value={note} onChange={setNote} rows={2} placeholder="Anything the owner should know" />
					</div>
				)}
			</Modal>

			<SidePanel open={!!report} onOpenChange={(o) => !o && void setReportId(null)} title={report ? `Audit report · ${fmtLongDate(report.date)}` : ""} subtitle={report ? `Closed by ${report.closedBy} · ${fmtWhen(report.closedAt)}` : undefined} icon={MoonIcon} footer={<button type="button" className={btn.primary} disabled={pending} onClick={() => void run("Report downloading (PDF)", undefined, { tone: "info" })}><DownloadIcon className="mr-1 inline size-4" /> Download PDF</button>}>
				{report && (
					<div className="flex flex-col gap-6">
						<PanelSection title="The day">
							<DetailList columns={2} items={[{ label: "Revenue", value: naira(report.revenue) }, { label: "Rooms occupied", value: `${report.roomsOccupied} of 120 · ${Math.round((report.roomsOccupied / 120) * 100)}%` }, { label: "Arrivals", value: report.arrivals }, { label: "Departures", value: report.departures }, { label: "No-shows", value: report.noShows }, { label: "Cash counted", value: naira(report.cashCounted ?? 0) }]} />
						</PanelSection>
						<TotalsList rows={[{ label: "Card", value: naira(Math.round(report.revenue * 0.58)) }, { label: "Transfers", value: naira(Math.round(report.revenue * 0.27)) }, { label: "Cash", value: naira(Math.round(report.revenue * 0.15)) }, { label: "Variance", value: naira(report.variance ?? 0), strong: true, tone: report.variance === 0 ? "success" : "danger" }]} />
					</div>
				)}
			</SidePanel>
		</>
	);
}
