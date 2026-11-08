"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, CheckIcon, ClockIcon, DownloadIcon, HistoryIcon, LogOutIcon, MoonIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, TextareaField } from "@/components/shared/field";
import { fmtDay, fmtLongDate, fmtWhen, naira, plural } from "@/components/shared/format";
import { ConfirmModal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { BookingRow, NightAuditRow, TillRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

export function NightAuditScreen({ hotelName, audits, departures, arrivals, tills, today }: { hotelName: string; audits: NightAuditRow[]; departures: BookingRow[]; arrivals: BookingRow[]; tills: TillRow[]; today: { revenue: number; byMethod: Record<string, number>; cashInTills: number } }) {
	const [reportId, setReportId] = useQueryState("report");
	const [extend, setExtend] = useState<BookingRow | null>(null);
	const [closing, setClosing] = useState(false);
	const [showPast, setShowPast] = useState(false);
	const { run, pending } = useDemoAction();
	const open = audits.find((a) => a.status === "OPEN") ?? audits[0];
	const past = audits.filter((a) => a.status === "CLOSED");
	const report = audits.find((a) => a.id === reportId) ?? null;
	const openTills = tills.filter((t) => t.status === "OPEN");
	const unresolvedArrivals = arrivals.filter((b) => b.status === "BOOKED");

	const checks = [
		{ key: "arrivals", label: "Arrivals", done: unresolvedArrivals.length === 0, detail: `${arrivals.length} expected · ${arrivals.filter((b) => b.status === "CHECKED_IN").length} arrived · ${arrivals.filter((b) => b.status === "NO_SHOW").length} no-show${unresolvedArrivals.length ? ` · ${unresolvedArrivals.length} still open` : ""}`, action: unresolvedArrivals.length ? { label: "Open arrivals", href: "/dashboard/bookings?tab=arrivals" } : undefined },
		{ key: "departures", label: "Departures", done: departures.length === 0, detail: departures.length === 0 ? "Everyone due out has checked out" : `${plural(departures.length, "guest")} due out still in the room · ${departures.map((d) => `${d.guestName} (${d.roomNumber})`).join(", ")}`, action: departures.length ? { label: "Extend or check out", onClick: () => setExtend(departures[0]) } : undefined },
		{ key: "rooms", label: "Rooms match the bills", done: true, detail: `${open.roomsOccupied} occupied rooms = ${open.roomsOccupied - 1} open folios + 1 complimentary` },
		{ key: "money", label: "Money taken today", done: openTills.length === 0, detail: openTills.length === 0 ? "Every till counted · card and transfers matched" : `${plural(openTills.length, "till")} still open · ${naira(openTills.reduce((s, t) => s + t.expected, 0))} expected`, action: openTills.length ? { label: "End-of-day cash", href: "/dashboard/financials?tab=tills" } : undefined },
		{ key: "balances", label: "Unpaid balances", done: true, detail: "2 overdue folios flagged for the morning: Musa Ibrahim, Aisha Bello" },
		{ key: "post", label: "Post tonight's room nights", done: false, detail: `${open.roomsOccupied - 1} room nights go to folios · 1 complimentary skipped`, auto: true },
	];
	const blocking = checks.filter((c) => !c.done && !c.auto).length;

	const pastColumns: ColumnDef<NightAuditRow, unknown>[] = [
		{ header: "Day", accessorKey: "date", cell: ({ row }) => <TwoLine primary={fmtLongDate(row.original.date)} secondary={`Closed ${fmtWhen(row.original.closedAt)} by ${row.original.closedBy}`} /> },
		{ header: "Revenue", accessorKey: "revenue", cell: ({ row }) => <span className="font-semibold">{naira(row.original.revenue)}</span> },
		{ header: "Rooms", accessorKey: "roomsOccupied", cell: ({ row }) => `${row.original.roomsOccupied} · ${Math.round((row.original.roomsOccupied / 120) * 100)}%` },
		{ header: "In · out", id: "inout", accessorFn: (r) => r.arrivals, cell: ({ row }) => `${row.original.arrivals} · ${row.original.departures}` },
		{ header: "No-shows", accessorKey: "noShows" },
		{ header: "Cash variance", accessorKey: "variance", cell: ({ row }) => (row.original.variance === 0 ? <StatusPill tone="success" dot={false}>Matched</StatusPill> : <StatusPill tone={(row.original.variance ?? 0) < 0 ? "danger" : "warning"} dot={false}>{(row.original.variance ?? 0) < 0 ? `${naira(-(row.original.variance ?? 0))} short` : `${naira(row.original.variance ?? 0)} over`}</StatusPill>) },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="text-right"><Button size="sm" variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={() => setReportId(row.original.id)}>Report</Button></div> },
	];

	return (
		<>
			<PageHeader title="Night audit" subtitle={`${hotelName} · close ${fmtLongDate(open.date)} and start ${fmtDay(new Date(Date.now() + 86400000).toISOString().slice(0, 10))}`}>
				<Button variant="outline" className={btn.secondary} onClick={() => setShowPast((v) => !v)}>
					<HistoryIcon className="size-4" /> {showPast ? "Tonight's checklist" : "Past audits"}
				</Button>
				<Button className={btn.primary} onClick={() => setClosing(true)}>
					<MoonIcon className="size-4" /> Close the day
				</Button>
			</PageHeader>

			<nav className="flex gap-6 border-b border-line text-sm">
				{[["Bookings", "/dashboard/bookings"], ["Folios", "/dashboard/folios"], ["Organizations", "/dashboard/organizations"]].map(([l, h]) => (
					<Link key={l} href={h} className="pb-3 text-ink-2 hover:text-ink">{l}</Link>
				))}
				<span className="-mb-px border-b-2 border-brand pb-3 font-semibold text-ink">Night audit</span>
			</nav>

			{showPast ? (
				<DataTable columns={pastColumns} data={past} emptyTitle="No past audits" />
			) : (
				<>
					<div className={cn("flex items-center gap-3 rounded-card border px-5 py-4", blocking === 0 ? "border-success/30 bg-success-soft" : "border-warning/30 bg-warning-soft")}>
						<MoonIcon className={cn("size-5", blocking === 0 ? "text-success" : "text-warning")} />
						<div className="flex-1">
							<p className="text-[15px] font-semibold text-ink">{checks.filter((c) => c.done).length} of {checks.length} checks done{blocking > 0 ? ` · ${plural(blocking, "thing")} to sort before you can close the day` : " · ready to close"}</p>
							<p className="text-xs text-ink-2">Usually run at 11:00pm · last audit: {fmtWhen(past[0]?.closedAt)} by {past[0]?.closedBy}</p>
						</div>
					</div>

					<div className="grid gap-4 xl:grid-cols-[1fr_400px]">
						<ol className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
							{checks.map((c, i) => (
								<li key={c.key} className={cn("flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0", !c.done && !c.auto && "bg-warning-soft/40")}>
									<span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", c.done ? "bg-success-soft text-success" : c.auto ? "bg-brand-soft text-brand" : "bg-warning-soft text-warning")}>{c.done ? <CheckIcon className="size-4" /> : c.auto ? i + 1 : <AlertTriangleIcon className="size-4" />}</span>
									<div className="min-w-0 flex-1">
										<p className="text-[15px] font-semibold text-ink">{i + 1}. {c.label}</p>
										<p className={cn("text-xs", c.done ? "text-ink-3" : c.auto ? "text-ink-3" : "text-warning")}>{c.detail}</p>
									</div>
									{c.done ? <span className="text-[13px] font-semibold text-success">Done</span> : c.auto ? <span className="text-xs text-ink-3">Happens when you close</span> : c.action && ("href" in c.action && c.action.href ? <Button asChild size="sm" className={`${btn.primary} ${btn.small}`}><Link href={c.action.href}>{c.action.label}</Link></Button> : <Button size="sm" className={`${btn.primary} ${btn.small}`} onClick={"onClick" in c.action ? c.action.onClick : undefined}>{c.action.label}</Button>)}
								</li>
							))}
						</ol>

						<SectionCard title={`Today in numbers · ${fmtDay(open.date)}`} bodyClassName="pt-1">
							{[
								["Money taken today", naira(today.revenue), true],
								["Card / POS", naira(today.byMethod.CARD ?? 0)],
								["Transfer", naira(today.byMethod.TRANSFER ?? 0)],
								["Cash", naira(today.byMethod.CASH ?? 0)],
								["Occupancy tonight", `${Math.round((open.roomsOccupied / 120) * 100)}% · ${open.roomsOccupied} of 120`, true],
								["Average room rate", naira(63_400), true],
								["Complimentary nights", "1 · A325", true],
								["Check-ins · check-outs", `${open.arrivals} · ${open.departures}`, true],
							].map(([k, v, strong]) => (
								<div key={k as string} className={cn("flex items-center justify-between py-[6px] text-[13px]", strong ? "text-ink" : "pl-3 text-ink-3")}><span>{k}</span><span className={cn("font-semibold", !strong && "font-medium text-ink-2")}>{v}</span></div>
							))}
							<Note tone="info" className="mt-2">These figures go to Godwin Kwin (owner) in tomorrow's 7:00am summary.</Note>
						</SectionCard>
					</div>
				</>
			)}

			{/* Extend or check out */}
			<ExtendPanel booking={extend} onClose={() => setExtend(null)} />

			{/* Close day */}
			<ConfirmModal open={closing} onOpenChange={setClosing} title={`Close ${fmtLongDate(open.date)}?`} subtitle={blocking > 0 ? `${plural(blocking, "check")} still open` : "All checks done"} confirmLabel="Close the day" pending={pending} onConfirm={() => run(`${fmtLongDate(open.date)} closed · report sent to the owner`, () => { setClosing(false); setReportId(past[0]?.id ?? null); })}>
				<div className="flex flex-col gap-4">
					{blocking > 0 && <Note tone="danger">{plural(blocking, "check")} not done. Sort them first, or close anyway and they carry into tomorrow's audit as exceptions.</Note>}
					<TotalsList rows={[{ label: "Revenue", value: naira(today.revenue) }, { label: "Cash in tills", value: naira(today.cashInTills) }, { label: "Rooms occupied", value: String(open.roomsOccupied) }, { label: "Room nights to post", value: String(open.roomsOccupied - 1), strong: true }]} />
					<WhatHappens items={["Tonight's room nights post to every open folio", "Tills and the day's numbers lock · corrections need the owner", "A report goes to the owner at 7:00am", "Tomorrow's arrivals and departures lists open"]} />
				</div>
			</ConfirmModal>

			{/* Report */}
			<SidePanel open={!!report} onOpenChange={(o) => !o && setReportId(null)} width="lg" icon={MoonIcon} title={report ? `Audit report · ${fmtLongDate(report.date)}` : ""} subtitle={report ? `Closed ${fmtWhen(report.closedAt)} by ${report.closedBy}` : ""} footer={<><Button variant="outline" className={btn.secondary} onClick={() => run("Printing…", undefined, { tone: "info" })}><PrinterIcon className="size-4" /> Print</Button><Button className={btn.primary} onClick={() => run("PDF downloaded", undefined, { tone: "info" })}><DownloadIcon className="size-4" /> Download PDF</Button></>}>
				{report && (
					<div className="flex flex-col gap-5">
						<div className="grid grid-cols-3 gap-2">
							{[["Revenue", naira(report.revenue)], ["Rooms occupied", `${report.roomsOccupied} · ${Math.round((report.roomsOccupied / 120) * 100)}%`], ["No-shows", String(report.noShows)], ["Arrivals", String(report.arrivals)], ["Departures", String(report.departures)], ["Cash variance", report.variance === 0 ? "Matched" : naira(report.variance ?? 0)]].map(([k, v]) => (
								<div key={k} className="rounded-xl bg-subtle/70 px-3 py-2"><p className="text-[11px] text-ink-3">{k}</p><p className="text-base font-bold text-ink">{v}</p></div>
							))}
						</div>
						<PanelSection title="Money by method">
							<TotalsList rows={[{ label: "Card / POS", value: naira(Math.round(report.revenue * 0.55)) }, { label: "Transfer", value: naira(Math.round(report.revenue * 0.3)) }, { label: "Cash", value: naira(report.cashCounted ?? Math.round(report.revenue * 0.15)) }, { label: "Total", value: naira(report.revenue), strong: true }]} />
						</PanelSection>
						<PanelSection title="Exceptions">
							<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
								<li className="px-3 py-2 text-ink">Till {report.variance === 0 ? "matched" : `${naira(Math.abs(report.variance ?? 0))} ${(report.variance ?? 0) < 0 ? "short" : "over"} · note added by ${report.closedBy}`}</li>
								<li className="px-3 py-2 text-ink">{report.noShows} no-show{report.noShows === 1 ? "" : "s"} · rooms released</li>
								<li className="px-3 py-2 text-ink">2 folios with a balance carried forward</li>
							</ul>
						</PanelSection>
					</div>
				)}
			</SidePanel>
		</>
	);
}

function ExtendPanel({ booking, onClose }: { booking: BookingRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [choice, setChoice] = useState<"extend" | "checkout" | "late">("extend");
	const [note, setNote] = useState("");
	return (
		<SidePanel
			open={!!booking}
			onOpenChange={(o) => !o && onClose()}
			icon={ClockIcon}
			title="Extend or check out"
			subtitle={booking ? `${booking.guestName} · Room ${booking.roomNumber} · due out today` : ""}
			footerInfo="The folio updates straight away"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
					<Button className={btn.primary} disabled={pending} onClick={() => run(choice === "extend" ? `${booking?.guestName} extended one night · ${naira(booking?.nightlyRate ?? 0)} posted` : choice === "late" ? "Late check-out charged" : `${booking?.guestName} checked out`, onClose)}>
						{choice === "extend" ? "Extend one night" : choice === "late" ? "Charge late check-out" : <><LogOutIcon className="size-4" /> Check out now</>}
					</Button>
				</>
			}
		>
			{booking && (
				<div className="flex flex-col gap-4">
					<ChoiceCards
						value={choice}
						onChange={setChoice}
						options={[
							{ value: "extend", label: "Extend one night", hint: `Stays in ${booking.roomNumber} · ${naira(booking.nightlyRate)} posts to the folio` },
							{ value: "late", label: "Late check-out · leaves tonight", hint: "Half a night charged · room still free for tomorrow" },
							{ value: "checkout", label: "Check out now", hint: `Balance ${naira(booking.totalAmount - booking.paid)} to settle at the desk` },
						]}
					/>
					<TextareaField label="Note" value={note} onChange={setNote} placeholder="Guest's flight moved to tomorrow" />
					<WhatHappens items={choice === "extend" ? ["Tomorrow's arrival for this room (if any) is reassigned", "The guest is told on WhatsApp"] : choice === "late" ? ["The late fee from Hotel setup → Stay rules is used", "Housekeeping gets the room tomorrow morning"] : ["The folio closes with any balance flagged", "Housekeeping is told the room is dirty"]} />
				</div>
			)}
		</SidePanel>
	);
}
