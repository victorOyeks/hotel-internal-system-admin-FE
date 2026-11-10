"use client";

import {
	CheckCircle2Icon,
	CircleIcon,
	MoonIcon,
	PrinterIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	MoneyField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import {
	fmtDay,
	fmtLongDate,
	fmtWhen,
	humanize,
	naira,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { closeDay } from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type { Paged } from "@hospio/api/data/paging";
import type { MoneyTodayRow, NightAuditRow } from "@hospio/api/data/types";
import { ServerPager } from "@hospio/ui/shared/server-pager";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { cn } from "@hospio/ui/utils";

const LINKS: Record<string, { label: string; href: string }> = {
	arrivals: {
		label: "Open arrivals",
		href: "/dashboard/bookings?tab=arrivals",
	},
	departures: {
		label: "Open in-house",
		href: "/dashboard/bookings?tab=in-house",
	},
	tills: { label: "Open tills", href: "/dashboard/tills" },
	balances: { label: "Open folios", href: "/dashboard/folios" },
};

const num = (v: unknown): number | undefined =>
	typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** Finance 5.x · Night audit: the checklist is computed by the service, so a line turns green when the work is done, not when someone taps it. */
export function NightAuditScreen({
	audits,
	past: pastPage,
	pastError,
	today,
	ownerName,
	hotelName,
	screens,
}: {
	audits: NightAuditRow[];
	/** One page of closed audits (finance-service pages them). */
	past: Paged<NightAuditRow>;
	pastError?: string;
	today: MoneyTodayRow;
	ownerName: string;
	hotelName: string;
	/** The `/dashboard/<screen>` pages the signed-in role has: a checklist link to any other is not shown (it would 404). */
	screens?: string[];
}) {
	const router = useRouter();
	const [, setPage] = useQueryState(
		"page",
		parseAsInteger.withOptions({
			shallow: false,
			history: "push",
			scroll: false,
		}),
	);
	const canOpen = (href: string) =>
		!screens ||
		screens.includes(href.replace(/^\/dashboard\//, "").split(/[/?]/)[0]);
	const [reportId, setReportId] = useQueryState("report");
	const [closing, setClosing] = useState(false);
	const [cash, setCash] = useState<number | "">("");
	const [note, setNote] = useState("");
	const [markNoShows, setMarkNoShows] = useState(false);
	const { run, pending } = useAction();
	const tonight = audits[0] ?? null;
	const open = tonight && tonight.status === "OPEN" ? tonight : null;
	const past = pastPage.content;
	const report =
		audits.find((a) => a.id === reportId) ??
		past.find((a) => a.id === reportId) ??
		null;
	const checks = open?.checklist ?? [];
	const done = checks.filter((c) => c.done).length;
	const tillsDone = checks.find((c) => c.key === "tills")?.done ?? true;
	const arrivalsOpen = checks.some((c) => c.key === "arrivals" && !c.done);
	const ordersOpen = checks.some((c) => c.key === "orders" && !c.done);
	const rooms = (a: NightAuditRow) => (a.rooms ? ` of ${a.rooms}` : "");
	const byMethod = report?.report
		? (Object.entries(
				(report.report.payments ?? report.report.byMethod ?? {}) as Record<
					string,
					unknown
				>,
			).filter(([, v]) => typeof v === "number") as [string, number][])
		: [];
	const cashExpected = num(
		(report?.report?.cash as Record<string, unknown> | undefined)?.expected ??
			report?.report?.cashExpected,
	);

	return (
		<>
			<PageHeader
				title="Night audit"
				subtitle={
					tonight
						? `${hotelName} · ${fmtLongDate(tonight.date)} · ${open ? `${done} of ${checks.length} checks done` : "closed"}`
						: hotelName
				}
			>
				{open && (
					<button
						type="button"
						className={btn.primary}
						disabled={!tillsDone}
						onClick={() => setClosing(true)}
					>
						<MoonIcon className="mr-1 inline size-4" /> Close the day
					</button>
				)}
			</PageHeader>
			{tonight && !open && (
				<Note tone="success">
					{fmtLongDate(tonight.date)} is closed
					{tonight.closedBy ? ` by ${tonight.closedBy}` : ""}.{" "}
					<button
						type="button"
						className="font-semibold underline"
						onClick={() => void setReportId(tonight.id)}
					>
						Open the report
					</button>
				</Note>
			)}
			{open && (
				<>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
						<KpiCard
							label="Revenue so far"
							value={naira(today.revenue)}
							icon={MoonIcon}
						/>
						<KpiCard
							label="Rooms occupied"
							value={open.roomsOccupied}
							icon={MoonIcon}
							hint={open.rooms ? `of ${open.rooms}` : undefined}
						/>
						<KpiCard label="Arrivals" value={open.arrivals} icon={MoonIcon} />
						<KpiCard
							label="Departures"
							value={open.departures}
							icon={MoonIcon}
						/>
						<KpiCard
							label="No-shows"
							value={open.noShows}
							icon={MoonIcon}
							pill={
								open.noShows ? (
									<StatusPill tone="warning">release?</StatusPill>
								) : undefined
							}
						/>
					</div>
					<SectionCard
						title="Before the day closes"
						subtitle="The service checks each line against the bookings, folios and tills"
						count={checks.length - done}
					>
						{checks.length === 0 && (
							<p className="py-4 text-center text-sm text-ink-3">
								The checklist is not available right now.
							</p>
						)}
						<ul className="divide-y divide-line">
							{checks.map((c) => {
								const link = LINKS[c.key];
								return (
									<li key={c.key} className="flex items-center gap-3 py-3">
										{c.done ? (
											<CheckCircle2Icon className="size-5 text-success" />
										) : (
											<CircleIcon className="size-5 text-line-strong" />
										)}
										<span
											className={cn(
												"flex-1 text-[13px]",
												c.done ? "text-ink-3" : "font-medium text-ink",
											)}
										>
											{c.label}
											{c.detail && (
												<span className="block text-xs font-normal text-ink-3">
													{c.detail}
												</span>
											)}
										</span>
										{!c.done && link && canOpen(link.href) && (
											<Link
												href={link.href}
												className={`${btn.secondary} ${btn.small}`}
											>
												{link.label}
											</Link>
										)}
									</li>
								);
							})}
						</ul>
						{!tillsDone && (
							<Note tone="warning" className="mt-3">
								Count and close every till first: the day cannot be closed while
								one is open.
							</Note>
						)}
						{ordersOpen && (
							<Note tone="warning" className="mt-3">
								Open tabs or unsettled orders at the restaurant or bar stop the
								close. Ask the outlet to settle them, or a manager can close the
								day carrying them to tomorrow.
							</Note>
						)}
						{tillsDone && done < checks.length && (
							<Note tone="info" className="mt-3">
								Anything else still open is listed in the report. Arrivals still
								waiting can be marked as no-shows when you close.
							</Note>
						)}
					</SectionCard>
				</>
			)}
			<SectionCard
				title="Past audits"
				subtitle="Reports stay here for the owner and the accountant"
				flush
			>
				<table className="w-full text-left text-[13px]">
					<thead>
						<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="px-5 py-2">Day</th>
							<th className="py-2 text-right">Revenue</th>
							<th className="py-2 text-right">Rooms</th>
							<th className="py-2 text-right">Cash counted</th>
							<th className="py-2 text-right">Variance</th>
							<th className="py-2">Closed by</th>
							<th className="px-5 py-2" />
						</tr>
					</thead>
					<tbody>
						{past.length === 0 && (
							<tr>
								<td colSpan={7} className="px-5 py-6 text-center text-ink-3">
									{pastError ? (
										<>
											{pastError} ·{" "}
											<button
												type="button"
												className="font-semibold text-brand"
												onClick={() => router.refresh()}
											>
												Try again
											</button>
										</>
									) : (
										"No day has been closed yet."
									)}
								</td>
							</tr>
						)}
						{past.map((a) => (
							<tr key={a.id} className="border-b border-line last:border-b-0">
								<td className="px-5 py-3 font-semibold text-ink">
									{fmtDay(a.date)}
								</td>
								<td className="py-3 text-right">{naira(a.revenue)}</td>
								<td className="py-3 text-right">{a.roomsOccupied}</td>
								<td className="py-3 text-right">
									{a.cashCounted != null ? naira(a.cashCounted) : "—"}
								</td>
								<td
									className={cn(
										"py-3 text-right font-semibold",
										a.variance == null || a.variance === 0
											? "text-success"
											: a.variance < 0
												? "text-danger"
												: "text-warning",
									)}
								>
									{a.variance == null || a.variance === 0
										? "—"
										: naira(a.variance)}
								</td>
								<td className="py-3 text-ink-2">
									{a.closedBy ?? "—"} · {fmtWhen(a.closedAt)}
								</td>
								<td className="px-5 py-3 text-right">
									<button
										type="button"
										className={`${btn.secondary} ${btn.small}`}
										onClick={() => void setReportId(a.id)}
									>
										Report
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<ServerPager
					page={pastPage}
					onPage={(p) => void setPage(p <= 0 ? null : p + 1)}
				/>
			</SectionCard>

			<Modal
				open={closing}
				onOpenChange={setClosing}
				title="Close the day"
				subtitle={
					open
						? `${fmtLongDate(open.date)} · ${plural(checks.length - done, "check")} still open`
						: undefined
				}
				icon={MoonIcon}
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setClosing(false)}
						>
							Not yet
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || !open}
							onClick={() =>
								open &&
								void run(
									() =>
										withDeliveries(
											closeDay({
												date: open.date,
												cashCounted:
													typeof cash === "number" ? cash : undefined,
												roomsOccupied: open.roomsOccupied,
												note,
												markNoShows,
											}),
											`Day report for ${ownerName}`,
										),
									`Day closed · summary sent to ${ownerName}`,
									(row) => {
										setClosing(false);
										setCash("");
										setNote("");
										setMarkNoShows(false);
										void setReportId(row.id);
									},
								)
							}
						>
							Close the day
						</button>
					</>
				}
			>
				{open && (
					<div className="flex flex-col gap-4">
						<TotalsList
							rows={[
								{
									label: "Revenue",
									value: naira(open.revenue || today.revenue),
								},
								{
									label: "Cash expected from sales",
									value: naira(today.byMethod.CASH ?? 0),
								},
								{
									label: `${plural(open.roomsOccupied, "room")} occupied`,
									value: String(open.roomsOccupied),
									strong: true,
								},
							]}
						/>
						<MoneyField
							label="Cash counted in the safe (optional)"
							value={cash}
							onChange={setCash}
						/>
						{arrivalsOpen && (
							<ToggleField
								label="Mark the arrivals still waiting as no-shows"
								hint="Their rooms are released. Leave it off to keep them as arrivals."
								checked={markNoShows}
								onChange={setMarkNoShows}
							/>
						)}
						<TextareaField
							label="Notes for the report"
							value={note}
							onChange={setNote}
							rows={2}
							placeholder="Anything the owner should know"
						/>
					</div>
				)}
			</Modal>

			<SidePanel
				open={!!report}
				onOpenChange={(o) => !o && void setReportId(null)}
				title={report ? `Audit report · ${fmtLongDate(report.date)}` : ""}
				subtitle={
					report
						? `Closed${report.closedBy ? ` by ${report.closedBy}` : ""} · ${fmtWhen(report.closedAt)}`
						: undefined
				}
				icon={MoonIcon}
				footer={
					<button
						type="button"
						className={btn.secondary}
						onClick={() => window.print()}
					>
						<PrinterIcon className="mr-1 inline size-4" /> Print
					</button>
				}
			>
				{report && (
					<div className="flex flex-col gap-6">
						<PanelSection title="The day">
							<DetailList
								columns={2}
								items={[
									{ label: "Revenue", value: naira(report.revenue) },
									{
										label: "Rooms occupied",
										value: `${report.roomsOccupied}${rooms(report)}${report.rooms ? ` · ${Math.round((report.roomsOccupied / report.rooms) * 100)}%` : ""}`,
									},
									{ label: "Arrivals", value: report.arrivals },
									{ label: "Departures", value: report.departures },
									{ label: "No-shows", value: report.noShows },
									{
										label: "Cash counted",
										value:
											report.cashCounted != null
												? naira(report.cashCounted)
												: "—",
									},
								]}
							/>
						</PanelSection>
						{(byMethod.length > 0 ||
							cashExpected != null ||
							report.variance != null) && (
							<TotalsList
								rows={[
									...byMethod.map(([m, v]) => ({
										label: humanize(m),
										value: naira(v),
									})),
									...(cashExpected != null
										? [{ label: "Cash expected", value: naira(cashExpected) }]
										: []),
									...(report.variance != null
										? [
												{
													label: "Variance",
													value: naira(report.variance),
													strong: true,
													tone:
														report.variance === 0
															? ("success" as const)
															: ("danger" as const),
												},
											]
										: []),
								]}
							/>
						)}
						{report.note && <Note tone="info">{report.note}</Note>}
					</div>
				)}
			</SidePanel>
		</>
	);
}
