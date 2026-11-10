"use client";

import { format } from "date-fns";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	BedDoubleIcon,
	BuildingIcon,
	CalendarIcon,
	ClipboardCheckIcon,
	DownloadIcon,
	FlagIcon,
	InfoIcon,
	TrendingUpIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { OutletSalesCard } from "../manager/outlet-sales";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { Me } from "@hospio/api/api/schema";
import type {
	ActivityRow,
	ApprovalRow,
	OwnerHotelRow,
	SeriesPointRow,
	WorthRow,
	OutletSalesDayRow,
} from "@hospio/api/data/types";
import { ApprovalPanel } from "./approval-panel";
import {
	DownloadModal,
	MiniBars,
	hotelStatusLabel,
	hotelStatusTone,
	useParam,
} from "./common";

function greeting() {
	const h = new Date().getHours();
	return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function OwnerDashboard({
	user,
	businessName,
	hotels,
	approvals,
	activity,
	daily,
	dailyScope,
	worth,
	limit,
	outletSales,
}: {
	user: Me;
	businessName: string;
	hotels: OwnerHotelRow[];
	approvals: ApprovalRow[];
	activity: ActivityRow[];
	daily: SeriesPointRow[];
	dailyScope: string;
	worth: WorthRow[];
	limit: number;
	/** What the restaurant and bar sold today at the active hotel (null when it cannot be read). */
	outletSales?: OutletSalesDayRow | null;
}) {
	const [open, setOpen] = useParam("open");
	const [download, setDownload] = useState(false);
	const now = new Date();
	const rooms = hotels.reduce((s, h) => s + h.rooms, 0);
	const revenueMonth = hotels.reduce((s, h) => s + h.revenueMonth, 0);
	const expensesMonth = hotels.reduce((s, h) => s + h.expensesMonth, 0);
	const lastMonth = hotels.reduce((s, h) => s + h.revenueLastMonth, 0);
	const occupied = hotels.reduce(
		(s, h) => s + Math.round((h.rooms * h.occupancy) / 100),
		0,
	);
	const occupancy = rooms > 0 ? Math.round((occupied / rooms) * 100) : 0;
	const waiting = approvals.filter(
		(a) =>
			a.approverLevel === "OWNER" &&
			(a.status === "PENDING" || a.status === "QUESTION"),
	);
	const issues = hotels.reduce((s, h) => s + h.openIssues, 0);
	const growth =
		lastMonth > 0
			? Math.round(((revenueMonth - lastMonth) / lastMonth) * 1000) / 10
			: 0;
	const selected = approvals.find((a) => a.id === open) ?? null;
	const toneIcon = {
		danger: AlertTriangleIcon,
		warning: FlagIcon,
		info: InfoIcon,
	};
	const toneCls = {
		danger: "bg-danger-soft text-danger",
		warning: "bg-warning-soft text-warning",
		info: "bg-info-soft text-info",
	};
	const last7 = daily.slice(-7);

	return (
		<>
			<PageHeader
				title={`${greeting()}, ${user.fullName.split(" ")[0]}`}
				subtitle={`${businessName} · ${plural(hotels.length, "hotel")} · ${rooms.toLocaleString()} rooms · ${format(now, "EEEE, d MMM yyyy")}`}
			>
				<span className="flex items-center gap-2 rounded-control border border-line bg-card px-3 py-[10px] text-[13px] font-medium text-ink">
					<BuildingIcon className="size-4 text-ink-2" /> All branches (
					{hotels.length})
				</span>
				<span className="flex items-center gap-2 rounded-control border border-line bg-card px-3 py-[10px] text-[13px] font-medium text-ink">
					<CalendarIcon className="size-4 text-ink-2" /> This month ·{" "}
					{format(now, "MMMM")}
				</span>
				<Button className={btn.primary} onClick={() => setDownload(true)}>
					<DownloadIcon className="size-4" /> Download report
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
				<KpiCard
					label="Revenue · month to date"
					value={nairaShort(revenueMonth)}
					icon={TrendingUpIcon}
					pill={
						lastMonth > 0 ? (
							<StatusPill tone={growth >= 0 ? "success" : "danger"} dot={false}>
								{growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
							</StatusPill>
						) : undefined
					}
					hint={`${nairaShort(lastMonth)} last month`}
				/>
				<KpiCard
					label="Net profit"
					value={nairaShort(revenueMonth - expensesMonth)}
					icon={WalletIcon}
					hint={
						revenueMonth > 0
							? `${Math.round(((revenueMonth - expensesMonth) / revenueMonth) * 100)}% margin`
							: "Month to date"
					}
				/>
				<KpiCard
					label="Occupancy tonight"
					value={`${occupancy}%`}
					icon={BedDoubleIcon}
					hint={`${occupied} of ${rooms} rooms`}
				/>
				<KpiCard
					label="Approvals waiting"
					value={waiting.length}
					icon={ClipboardCheckIcon}
					pill={
						waiting.length > 0 ? (
							<StatusPill tone="warning">
								{naira(waiting.reduce((s, a) => s + (a.amount ?? 0), 0))}
							</StatusPill>
						) : undefined
					}
					hint={
						limit > 0
							? `Spend over ${naira(limit)} comes to you`
							: "Needs the owner"
					}
				/>
				<KpiCard
					label="Open issues"
					value={issues}
					icon={FlagIcon}
					hint={`${hotels.filter((h) => h.openIssues >= 5).length} hotels need attention`}
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard
					title="Worth a look"
					subtitle="Things across your hotels that need your eye today"
					count={worth.length}
				>
					{worth.length === 0 && (
						<EmptyState
							title="Nothing needs your eye"
							hint="Approvals, losses and empty hotels show here when they happen."
						/>
					)}
					<ul>
						{worth.map((w, i) => {
							const Icon = toneIcon[w.tone];
							return (
								<li
									key={w.id}
									className={`flex items-center gap-3 py-[10px] ${i < worth.length - 1 ? "border-b border-line" : ""}`}
								>
									<span
										className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] ${toneCls[w.tone]}`}
									>
										<Icon className="size-4" />
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-[13px] font-semibold text-ink">
											{w.title}
										</p>
										<p className="truncate text-xs text-ink-3">{w.detail}</p>
									</div>
									<Link
										href={w.href}
										className="flex items-center gap-1 rounded-pill bg-subtle px-2 py-1 text-[11px] font-semibold text-ink-2 hover:bg-brand-soft hover:text-brand"
									>
										{w.area} <ArrowRightIcon className="size-3" />
									</Link>
								</li>
							);
						})}
					</ul>
				</SectionCard>

				<SectionCard
					title="Approvals waiting"
					subtitle="Needs the owner"
					count={waiting.length}
					action={{ label: "All", href: "/dashboard/financials?tab=expenses" }}
					bodyClassName="gap-2 pt-2"
				>
					{waiting.length === 0 ? (
						<EmptyState title="Nothing waiting on you" />
					) : (
						waiting.map((a) => (
							<button
								key={a.id}
								type="button"
								onClick={() => setOpen(a.id)}
								className="flex items-center gap-3 rounded-xl border border-line px-3 py-[10px] text-left hover:bg-subtle/60"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-[13px] font-semibold text-ink">
										{a.description}
									</p>
									<p className="truncate text-xs text-ink-3">
										{a.requesterName} · {a.hotelName}
									</p>
								</div>
								<span className="text-[13px] font-bold text-ink">
									{a.amount ? nairaShort(a.amount) : "—"}
								</span>
								<StatusPill
									tone={a.status === "QUESTION" ? "info" : "warning"}
									dot={false}
								>
									{a.status === "QUESTION" ? "Asked" : "Review"}
								</StatusPill>
							</button>
						))
					)}
				</SectionCard>
			</div>

			<SectionCard
				title="Your branches"
				subtitle="Live · ranked by revenue this month"
				action={{ label: "All hotels", href: "/dashboard/hotels" }}
				bodyClassName="pt-3"
			>
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{[...hotels]
						.sort((a, b) => b.revenueMonth - a.revenueMonth)
						.map((h) => (
							<Link
								key={h.hotelId}
								href={`/dashboard/hotels/${h.hotelId}`}
								className="flex flex-col gap-3 rounded-xl border border-line p-4 hover:border-brand hover:bg-brand-soft/20"
							>
								<div className="flex items-start gap-2">
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-bold text-ink">
											{h.name}
										</p>
										<p className="text-xs text-ink-3">
											{h.city} · {h.rooms} rooms · {h.manager}
										</p>
									</div>
									<StatusPill tone={hotelStatusTone[h.status]}>
										{hotelStatusLabel[h.status]}
									</StatusPill>
								</div>
								<div className="flex items-end justify-between">
									<div>
										<p className="text-[11px] text-ink-3">Revenue today</p>
										<p className="text-lg font-bold text-ink">
											{nairaShort(h.revenueToday)}
										</p>
									</div>
									<div className="text-right">
										<p className="text-[11px] text-ink-3">Occupancy</p>
										<p className="text-lg font-bold text-ink">{h.occupancy}%</p>
									</div>
								</div>
								<ProgressBar
									value={h.occupancy}
									max={100}
									tone={
										h.occupancy >= 70
											? "brand"
											: h.occupancy >= 60
												? "warning"
												: "danger"
									}
								/>
								<div className="flex items-center justify-between text-xs">
									<span className="text-ink-3">Profit this month</span>
									<StatusPill
										dot={false}
										tone={
											h.revenueMonth - h.expensesMonth >= 0
												? "success"
												: "danger"
										}
									>
										{nairaShort(h.revenueMonth - h.expensesMonth)}
									</StatusPill>
								</div>
							</Link>
						))}
				</div>
			</SectionCard>

			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard
					title="Revenue · last 30 days"
					subtitle={`${dailyScope} · ${nairaShort(daily.reduce((s, d) => s + d.revenue, 0))} in total`}
					action={{ label: "Open Financials", href: "/dashboard/financials" }}
					bodyClassName="pt-3"
				>
					<MiniBars
						series={daily.map((d) => d.revenue)}
						labels={daily.map((d) => format(new Date(d.date), "d"))}
						height={180}
					/>
					<div className="mt-3 grid grid-cols-7 gap-2">
						{last7.map((d) => (
							<div
								key={d.date}
								className="rounded-lg bg-subtle/70 px-2 py-[6px] text-center"
							>
								<p className="text-[10px] text-ink-3">
									{format(new Date(d.date), "EEE")}
								</p>
								<p className="text-xs font-semibold text-ink">
									{nairaShort(d.revenue)}
								</p>
							</div>
						))}
					</div>
				</SectionCard>

				<SectionCard
					title="Recent activity"
					subtitle="Across your hotels"
					action={{
						label: "Activity log",
						href: "/dashboard/operations?tab=activity",
					}}
					bodyClassName="pt-2"
				>
					<ul>
						{activity.slice(0, 7).map((a, i) => (
							<li
								key={a.id}
								className={`flex items-start gap-3 py-2 ${i < 6 ? "border-b border-line" : ""}`}
							>
								<span className="mt-[6px] size-2 shrink-0 rounded-full bg-brand" />
								<div className="min-w-0 flex-1">
									<p className="truncate text-[13px] font-medium text-ink">
										{a.action} ·{" "}
										<span className="font-normal text-ink-2">{a.summary}</span>
									</p>
									<p className="text-[11px] text-ink-3">
										{a.actor} · {a.department} · {fmtWhen(a.at)}
									</p>
								</div>
							</li>
						))}
					</ul>
				</SectionCard>
			</div>

			<OutletSalesCard sales={outletSales} />

			<ApprovalPanel
				approval={selected}
				limit={limit}
				onClose={() => setOpen(null)}
			/>
			<DownloadModal
				open={download}
				onOpenChange={setDownload}
				what="Monthly summary · every hotel"
				rows={() => [
					[
						"Hotel",
						"Revenue today (NGN)",
						"Revenue this month (NGN)",
						"Expenses this month (NGN)",
						"Net (NGN)",
						"Revenue last month (NGN)",
						"Occupancy %",
						"Open repairs",
					],
					...hotels.map((h) => [
						h.name,
						h.revenueToday,
						h.revenueMonth,
						h.expensesMonth,
						h.revenueMonth - h.expensesMonth,
						h.revenueLastMonth,
						h.occupancy,
						h.openIssues,
					]),
				]}
			/>
		</>
	);
}
