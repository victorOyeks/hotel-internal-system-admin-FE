"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	CheckIcon,
	HistoryIcon,
	MoonIcon,
	PrinterIcon,
} from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
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
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { closeDay } from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type { MoneyTodayRow, NightAuditRow } from "@hospio/api/data/types";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { cn } from "@hospio/ui/utils";

const ACTIONS: Record<string, { label: string; href: string }> = {
	arrivals: {
		label: "Open arrivals",
		href: "/dashboard/bookings?tab=arrivals",
	},
	departures: {
		label: "Open in-house",
		href: "/dashboard/bookings?tab=in-house",
	},
	tills: { label: "Count the tills", href: "/dashboard/financials?tab=tills" },
	balances: { label: "Open folios", href: "/dashboard/folios" },
};

const num = (v: unknown): number | undefined =>
	typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** The numbers the service stored in the report: payments by method, expenses, cash expected. Anything missing stays out of the report. */
function reportNumbers(report: Record<string, unknown> | undefined) {
	const raw = (report?.byMethod ??
		report?.paymentsByMethod ??
		report?.payments) as Record<string, unknown> | undefined;
	const byMethod =
		raw && typeof raw === "object"
			? (Object.entries(raw).filter(([, v]) => typeof v === "number") as [
					string,
					number,
				][])
			: [];
	const cash = (report?.cash ?? {}) as Record<string, unknown>;
	const occupancy = (report?.occupancy ?? {}) as Record<string, unknown>;
	return {
		byMethod,
		expenses: num(report?.expenses),
		cashExpected: num(
			report?.cashExpected ?? report?.expectedCash ?? cash.expected,
		),
		occupancyPct: num(report?.occupancyPct ?? occupancy.pct),
		outletSales: outletSalesOf(report?.outletSales),
		carried: report?.carriedOpenTabs === true ? carriedOf(report) : null,
	};
}

type OutletSalesLine = {
	name: string;
	orders: number;
	sales: number;
	paidAtOutlet: number;
	chargedToRooms: number;
};

/** The outlet sales the service stored in the report: one line per outlet, plus the total. */
function outletSalesOf(raw: unknown): OutletSalesLine[] {
	if (!raw || typeof raw !== "object") return [];
	const outlets = (raw as { outlets?: unknown }).outlets;
	if (!Array.isArray(outlets)) return [];
	return outlets.map((o: Record<string, unknown>) => ({
		name: typeof o.name === "string" ? o.name : "Outlet",
		orders: num(o.orders) ?? 0,
		sales: num(o.sales) ?? 0,
		paidAtOutlet: num(o.paidAtOutlet) ?? 0,
		chargedToRooms: num(o.chargedToRooms) ?? 0,
	}));
}

type CarriedOrder = {
	number: string;
	kind: string;
	where: string;
	total?: number;
};

/** The open tabs and unsettled orders a manager carried into tomorrow when the day closed. */
function carriedOf(report: Record<string, unknown>) {
	const rows = Array.isArray(report.openOrdersCarried)
		? (report.openOrdersCarried as Record<string, unknown>[])
		: [];
	return rows.map((r) => ({
		outlet: typeof r.outlet === "string" ? r.outlet : "Outlet",
		openTabs: num(r.openTabs) ?? 0,
		unsettled: num(r.unsettled) ?? 0,
		orders: (Array.isArray(r.orders)
			? (r.orders as Record<string, unknown>[])
			: []
		).map(
			(o): CarriedOrder => ({
				number: typeof o.number === "string" ? o.number : "",
				kind: typeof o.kind === "string" ? o.kind : "",
				where:
					typeof o.tableNo === "string" && o.tableNo
						? `Table ${o.tableNo}`
						: typeof o.roomNumber === "string" && o.roomNumber
							? `Room ${o.roomNumber}`
							: "",
				total: num(o.total),
			}),
		),
	}));
}

const methodLabel = (m: string) =>
	m === "CARD"
		? "Card / POS"
		: m === "TRANSFER"
			? "Transfer"
			: m === "CASH"
				? "Cash"
				: humanize(m);

export function NightAuditScreen({
	hotelName,
	audits,
	today,
	ownerName,
}: {
	hotelName: string;
	audits: NightAuditRow[];
	today: MoneyTodayRow;
	ownerName: string;
}) {
	const [reportId, setReportId] = useQueryState("report");
	const [closing, setClosing] = useState(false);
	const [showPast, setShowPast] = useState(false);
	const [cash, setCash] = useState<number | "">("");
	const [note, setNote] = useState("");
	const [markNoShows, setMarkNoShows] = useState(false);
	const [carryOpenTabs, setCarryOpenTabs] = useState(false);
	const { run, pending } = useAction();
	const tonight = audits[0] ?? null;
	const open = tonight && tonight.status === "OPEN" ? tonight : null;
	const past = audits.filter((a) => a.status === "CLOSED");
	const report = audits.find((a) => a.id === reportId) ?? null;
	const checks = open?.checklist ?? [];
	const tillsDone = checks.find((c) => c.key === "tills")?.done ?? true;
	const arrivalsOpen = checks.some((c) => c.key === "arrivals" && !c.done);
	const ordersCheck = checks.find((c) => c.key === "orders" && !c.done);
	const blocking = checks.filter((c) => !c.done).length;
	const rooms = (a: NightAuditRow) => (a.rooms ? ` of ${a.rooms}` : "");
	const pct = (a: NightAuditRow) =>
		a.rooms
			? ` · ${Math.round((a.roomsOccupied / a.rooms) * 100)}%`
			: a.report
				? ""
				: "";

	const pastColumns: ColumnDef<NightAuditRow, unknown>[] = [
		{
			header: "Day",
			accessorKey: "date",
			cell: ({ row }) => (
				<TwoLine
					primary={fmtLongDate(row.original.date)}
					secondary={`Closed ${fmtWhen(row.original.closedAt)}${row.original.closedBy ? ` by ${row.original.closedBy}` : ""}`}
				/>
			),
		},
		{
			header: "Revenue",
			accessorKey: "revenue",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.revenue)}</span>
			),
		},
		{
			header: "Rooms",
			accessorKey: "roomsOccupied",
			cell: ({ row }) => `${row.original.roomsOccupied}${pct(row.original)}`,
		},
		{
			header: "In · out",
			id: "inout",
			accessorFn: (r) => r.arrivals,
			cell: ({ row }) =>
				`${row.original.arrivals} · ${row.original.departures}`,
		},
		{ header: "No-shows", accessorKey: "noShows" },
		{
			header: "Cash variance",
			accessorKey: "variance",
			cell: ({ row }) =>
				row.original.variance == null ? (
					<span className="text-ink-3">—</span>
				) : row.original.variance === 0 ? (
					<StatusPill tone="success" dot={false}>
						Matched
					</StatusPill>
				) : (
					<StatusPill
						tone={row.original.variance < 0 ? "danger" : "warning"}
						dot={false}
					>
						{row.original.variance < 0
							? `${naira(-row.original.variance)} short`
							: `${naira(row.original.variance)} over`}
					</StatusPill>
				),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="text-right">
					<Button
						size="sm"
						variant="outline"
						className={`${btn.secondary} ${btn.small}`}
						onClick={() => setReportId(row.original.id)}
					>
						Report
					</Button>
				</div>
			),
		},
	];

	const nums = reportNumbers(report?.report);

	return (
		<>
			<PageHeader
				title="Night audit"
				subtitle={
					tonight
						? `${hotelName} · ${open ? "close" : "closed"} ${fmtLongDate(tonight.date)}`
						: hotelName
				}
			>
				<Button
					variant="outline"
					className={btn.secondary}
					onClick={() => setShowPast((v) => !v)}
				>
					<HistoryIcon className="size-4" />{" "}
					{showPast ? "Tonight's checklist" : "Past audits"}
				</Button>
				{open && (
					<Button
						className={btn.primary}
						disabled={!tillsDone}
						onClick={() => setClosing(true)}
					>
						<MoonIcon className="size-4" /> Close the day
					</Button>
				)}
			</PageHeader>

			<nav className="flex gap-6 border-b border-line text-sm">
				{[
					["Bookings", "/dashboard/bookings"],
					["Folios", "/dashboard/folios"],
					["Organizations", "/dashboard/organizations"],
				].map(([l, h]) => (
					<Link key={l} href={h} className="pb-3 text-ink-2 hover:text-ink">
						{l}
					</Link>
				))}
				<span className="-mb-px border-b-2 border-brand pb-3 font-semibold text-ink">
					Night audit
				</span>
			</nav>

			{showPast ? (
				<DataTable
					columns={pastColumns}
					data={past}
					emptyTitle="No past audits"
				/>
			) : (
				<>
					{tonight && !open && (
						<Note tone="success">
							{fmtLongDate(tonight.date)} is closed
							{tonight.closedBy ? ` by ${tonight.closedBy}` : ""}.{" "}
							<button
								type="button"
								className="font-semibold underline"
								onClick={() => setReportId(tonight.id)}
							>
								Open the report
							</button>
						</Note>
					)}
					{open && (
						<div
							className={cn(
								"flex items-center gap-3 rounded-card border px-5 py-4",
								blocking === 0
									? "border-success/30 bg-success-soft"
									: "border-warning/30 bg-warning-soft",
							)}
						>
							<MoonIcon
								className={cn(
									"size-5",
									blocking === 0 ? "text-success" : "text-warning",
								)}
							/>
							<div className="flex-1">
								<p className="text-[15px] font-semibold text-ink">
									{checks.filter((c) => c.done).length} of {checks.length}{" "}
									checks done
									{!tillsDone
										? " · count and close every till before you can close the day"
										: blocking > 0
											? ` · ${plural(blocking, "thing")} to look at`
											: " · ready to close"}
								</p>
								<p className="text-xs text-ink-2">
									{past[0]
										? `Last audit: ${fmtWhen(past[0].closedAt)}${past[0].closedBy ? ` by ${past[0].closedBy}` : ""}`
										: "No day has been closed yet"}
								</p>
							</div>
						</div>
					)}

					<div className="grid gap-4 xl:grid-cols-[1fr_400px]">
						<ol className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
							{checks.length === 0 && (
								<li className="px-5 py-4 text-[13px] text-ink-3">
									{open
										? "The checklist is not available right now."
										: "The day is closed."}
								</li>
							)}
							{checks.map((c, i) => {
								const action = ACTIONS[c.key];
								return (
									<li
										key={c.key}
										className={cn(
											"flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0",
											!c.done && "bg-warning-soft/40",
										)}
									>
										<span
											className={cn(
												"flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
												c.done
													? "bg-success-soft text-success"
													: "bg-warning-soft text-warning",
											)}
										>
											{c.done ? (
												<CheckIcon className="size-4" />
											) : (
												<AlertTriangleIcon className="size-4" />
											)}
										</span>
										<div className="min-w-0 flex-1">
											<p className="text-[15px] font-semibold text-ink">
												{i + 1}. {c.label}
											</p>
											{c.detail && (
												<p
													className={cn(
														"text-xs",
														c.done ? "text-ink-3" : "text-warning",
													)}
												>
													{c.detail}
												</p>
											)}
										</div>
										{c.done ? (
											<span className="text-[13px] font-semibold text-success">
												Done
											</span>
										) : (
											action && (
												<Button
													asChild
													size="sm"
													className={`${btn.primary} ${btn.small}`}
												>
													<Link href={action.href}>{action.label}</Link>
												</Button>
											)
										)}
									</li>
								);
							})}
						</ol>

						<SectionCard
							title={`Today in numbers${tonight ? ` · ${fmtDay(tonight.date)}` : ""}`}
							bodyClassName="pt-1"
						>
							{(
								[
									["Money taken today", naira(today.revenue), true],
									["Card / POS", naira(today.byMethod.CARD ?? 0)],
									["Transfer", naira(today.byMethod.TRANSFER ?? 0)],
									["Cash", naira(today.byMethod.CASH ?? 0)],
									["Spent today", naira(today.expenses), true],
									[
										"Occupancy tonight",
										today.occupancyPct != null
											? `${Math.round(today.occupancyPct)}%${tonight?.rooms ? ` · ${tonight.roomsOccupied} of ${tonight.rooms}` : ""}`
											: "—",
										true,
									],
									[
										"Check-ins · check-outs",
										`${tonight?.arrivals ?? today.arrivals ?? 0} · ${tonight?.departures ?? today.departures ?? 0}`,
										true,
									],
									["No-shows", String(tonight?.noShows ?? 0), true],
								] as [string, string, boolean?][]
							).map(([k, v, strong]) => (
								<div
									key={k}
									className={cn(
										"flex items-center justify-between py-[6px] text-[13px]",
										strong ? "text-ink" : "pl-3 text-ink-3",
									)}
								>
									<span>{k}</span>
									<span
										className={cn(
											"font-semibold",
											!strong && "font-medium text-ink-2",
										)}
									>
										{v}
									</span>
								</div>
							))}
							{(today.unattachedCash ?? 0) > 0 && (
								<Note tone="warning" className="mt-2">
									{naira(today.unattachedCash ?? 0)} cash was taken with no till
									open today.
								</Note>
							)}
							<Note tone="info" className="mt-2">
								When the day closes, the summary goes to {ownerName}.
							</Note>
						</SectionCard>
					</div>
				</>
			)}

			{/* Close day */}
			{open && (
				<ConfirmModal
					open={closing}
					onOpenChange={setClosing}
					title={`Close ${fmtLongDate(open.date)}?`}
					subtitle={
						blocking > 0
							? `${plural(blocking, "check")} still open`
							: "All checks done"
					}
					confirmLabel={
						ordersCheck && carryOpenTabs
							? "Close and carry the tabs"
							: "Close the day"
					}
					pending={pending}
					confirmDisabled={!!ordersCheck && !carryOpenTabs}
					onConfirm={() =>
						run(
							() =>
								withDeliveries(
									closeDay({
										date: open.date,
										cashCounted: typeof cash === "number" ? cash : undefined,
										roomsOccupied: open.roomsOccupied,
										note,
										markNoShows,
										carryOpenTabs: !!ordersCheck && carryOpenTabs,
									}),
									`Day report for ${ownerName}`,
								),
							`${fmtLongDate(open.date)} closed · summary sent to ${ownerName}`,
							(row) => {
								setClosing(false);
								setCash("");
								setNote("");
								setMarkNoShows(false);
								setCarryOpenTabs(false);
								void setReportId(row.id);
							},
						)
					}
				>
					<div className="flex flex-col gap-4">
						{blocking > 0 && (
							<Note tone="warning">
								{plural(blocking, "check")} not done. Closing is allowed once
								the tills are closed; anything else left open is listed in the
								report.
							</Note>
						)}
						{ordersCheck && (
							<>
								<Note tone="danger">
									{ordersCheck.detail ??
										"There are open tabs or unsettled orders at the outlets"}
									. Settle them first, or carry them to tomorrow.
								</Note>
								<ToggleField
									label="Carry open tabs to tomorrow"
									hint="The tabs and orders stay open at the outlets and are listed in tonight's report."
									checked={carryOpenTabs}
									onChange={setCarryOpenTabs}
								/>
							</>
						)}
						<TotalsList
							rows={[
								{ label: "Revenue", value: naira(today.revenue) },
								{ label: "Spent", value: naira(today.expenses) },
								{ label: "Cash in tills", value: naira(today.cashInTills) },
								{
									label: "Rooms occupied",
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
						<WhatHappens
							items={[
								"The day's revenue, payments, expenses and cash are stored as the report",
								`${ownerName} gets the summary`,
								"Tomorrow's audit opens",
							]}
						/>
					</div>
				</ConfirmModal>
			)}

			{/* Report */}
			<SidePanel
				open={!!report}
				onOpenChange={(o) => !o && setReportId(null)}
				width="lg"
				icon={MoonIcon}
				title={report ? `Audit report · ${fmtLongDate(report.date)}` : ""}
				subtitle={
					report
						? `Closed ${fmtWhen(report.closedAt)}${report.closedBy ? ` by ${report.closedBy}` : ""}`
						: ""
				}
				footer={
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => window.print()}
					>
						<PrinterIcon className="size-4" /> Print
					</Button>
				}
			>
				{report && (
					<div className="flex flex-col gap-5">
						<div className="grid grid-cols-3 gap-2">
							{[
								["Revenue", naira(report.revenue)],
								[
									"Rooms occupied",
									`${report.roomsOccupied}${rooms(report)}${nums.occupancyPct != null ? ` · ${Math.round(nums.occupancyPct)}%` : pct(report)}`,
								],
								["No-shows", String(report.noShows)],
								["Arrivals", String(report.arrivals)],
								["Departures", String(report.departures)],
								[
									"Cash variance",
									report.variance == null
										? "—"
										: report.variance === 0
											? "Matched"
											: naira(report.variance),
								],
							].map(([k, v]) => (
								<div key={k} className="rounded-xl bg-subtle/70 px-3 py-2">
									<p className="text-[11px] text-ink-3">{k}</p>
									<p className="text-base font-bold text-ink">{v}</p>
								</div>
							))}
						</div>
						{(nums.byMethod.length > 0 || nums.expenses != null) && (
							<PanelSection title="Money">
								<TotalsList
									rows={[
										...nums.byMethod.map(([m, v]) => ({
											label: methodLabel(m),
											value: naira(v),
										})),
										...(nums.expenses != null
											? [{ label: "Expenses", value: naira(nums.expenses) }]
											: []),
										{
											label: "Revenue",
											value: naira(report.revenue),
											strong: true,
										},
									]}
								/>
							</PanelSection>
						)}
						<PanelSection title="Cash">
							<TotalsList
								rows={[
									...(nums.cashExpected != null
										? [{ label: "Expected", value: naira(nums.cashExpected) }]
										: []),
									{
										label: "Counted",
										value:
											report.cashCounted != null
												? naira(report.cashCounted)
												: "—",
									},
									{
										label: "Variance",
										value:
											report.variance != null ? naira(report.variance) : "—",
										strong: true,
										tone:
											report.variance == null || report.variance === 0
												? undefined
												: "danger",
									},
								]}
							/>
						</PanelSection>
						{nums.outletSales.length > 0 && (
							<PanelSection title="Restaurant & bar sales">
								<TotalsList
									rows={[
										...nums.outletSales.map((o) => ({
											label: `${o.name} · ${plural(o.orders, "order")} · ${naira(o.paidAtOutlet)} paid, ${naira(o.chargedToRooms)} on rooms`,
											value: naira(o.sales),
										})),
										{
											label: "Sales",
											value: naira(
												nums.outletSales.reduce((t, o) => t + o.sales, 0),
											),
											strong: true,
										},
									]}
								/>
							</PanelSection>
						)}
						{nums.carried && (
							<PanelSection title="Carried to tomorrow">
								<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
									{nums.carried.length === 0 && (
										<li className="px-3 py-2 text-ink-3">
											The outlets couldn't be checked when the day closed
										</li>
									)}
									{nums.carried.flatMap((o) =>
										o.orders.length > 0
											? o.orders.map((x) => (
													<li
														key={`${o.outlet}-${x.number}`}
														className="flex items-center justify-between gap-3 px-3 py-2 text-ink"
													>
														<span>
															{o.outlet} · {x.number}
															{x.kind === "TAB" ? " · open tab" : ""}
															{x.where ? ` · ${x.where}` : ""}
														</span>
														{x.total != null && (
															<span className="font-semibold">
																{naira(x.total)}
															</span>
														)}
													</li>
												))
											: [
													<li key={o.outlet} className="px-3 py-2 text-ink">
														{o.outlet} · {plural(o.openTabs, "open tab")}
														{o.unsettled > 0
															? ` · ${plural(o.unsettled, "unsettled order")}`
															: ""}
													</li>,
												],
									)}
								</ul>
							</PanelSection>
						)}
						{(report.note || report.noShows > 0) && (
							<PanelSection title="Exceptions">
								<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
									{report.noShows > 0 && (
										<li className="px-3 py-2 text-ink">
											{plural(report.noShows, "no-show")} · rooms released
										</li>
									)}
									{report.note && (
										<li className="px-3 py-2 text-ink">{report.note}</li>
									)}
								</ul>
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>
		</>
	);
}
