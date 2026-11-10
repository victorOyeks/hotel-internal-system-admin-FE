"use client";

import {
	ArrowDownToLineIcon,
	CoinsIcon,
	DownloadIcon,
	TrendingUpIcon,
	WalletIcon,
} from "lucide-react";
import { format, parseISO, startOfMonth, subDays } from "date-fns";
import { useQueryState } from "nuqs";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { naira, nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { FilterSelect } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { ExpenseRow, SeriesPointRow } from "@hospio/api/data/types";

/**
 * Finance 2.1 · Month at a glance. Live: the daily series from finance-service and the month's expenses by
 * category, and revenue by department (the desk that took it). In demo mode the daily numbers are generated.
 */
export function MonthScreen({
	demo,
	expenses,
	series,
	from,
	to,
	hotelName,
	income = [],
}: {
	/** Revenue in the range by the desk that took it (live). */
	income?: { source: string; amount: number; pct: number }[];
	demo: boolean;
	expenses: ExpenseRow[];
	series: SeriesPointRow[];
	from: string;
	to: string;
	hotelName: string;
}) {
	const [month, setMonth] = useQueryState("month");
	const last = month === "last";
	const today = demo ? new Date() : parseISO(to);
	const dayOfMonth = today.getDate();
	const generated = Array.from({ length: dayOfMonth }, (_, i) => {
		const d = subDays(today, dayOfMonth - 1 - i);
		const seed = (d.getDate() * 37) % 23;
		const weekend = d.getDay() === 5 || d.getDay() === 6;
		return {
			date: d,
			revenue: 950000 + seed * 28000 + (weekend ? 420000 : 0),
			expenses: 180000 + ((seed * 13) % 9) * 32000,
		};
	});
	const days = demo
		? generated
		: series.map((p) => ({
				date: parseISO(p.date),
				revenue: p.revenue,
				expenses: p.expenses,
			}));
	const count = Math.max(1, days.length);
	const revenue = days.reduce((s, d) => s + d.revenue, 0);
	const spent = days.reduce((s, d) => s + d.expenses, 0);
	const max = Math.max(1, ...days.map((d) => Math.max(d.revenue, d.expenses)));
	const byDept = [
		["Rooms", 0.71],
		["Restaurant", 0.13],
		["Bar", 0.1],
		["Laundry", 0.03],
		["Other", 0.03],
	] as const;
	const inMonth = expenses.filter(
		(e) =>
			e.status !== "DECLINED" && (demo || (e.date >= from && e.date <= to)),
	);
	const byCategory = Object.entries(
		inMonth.reduce<Record<string, number>>((acc, e) => {
			acc[e.category] = (acc[e.category] ?? 0) + e.amount;
			return acc;
		}, {}),
	).sort((a, b) => b[1] - a[1]);

	return (
		<>
			<PageHeader
				title="Month at a glance"
				subtitle={`${hotelName} · ${format(demo ? startOfMonth(today) : parseISO(from), "d MMM")} → ${format(today, "d MMM yyyy")}${last ? "" : " · so far"}`}
			>
				<FilterSelect
					value={month ?? ""}
					onChange={(v) => void setMonth(v || null)}
					options={[
						{
							value: "last",
							label: format(subDays(startOfMonth(new Date()), 1), "MMMM yyyy"),
						},
					]}
					all={format(new Date(), "MMMM yyyy")}
				/>
				<button
					type="button"
					className={btn.primary}
					onClick={() => window.print()}
				>
					<DownloadIcon className="mr-1 inline size-4" /> Print
				</button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Revenue"
					value={nairaShort(revenue)}
					icon={TrendingUpIcon}
					hint={`${nairaShort(revenue / count)} a day on average`}
				/>
				<KpiCard
					label="Expenses"
					value={nairaShort(spent)}
					icon={ArrowDownToLineIcon}
					hint={
						revenue > 0
							? `${Math.round((spent / revenue) * 100)}% of revenue`
							: "No revenue yet"
					}
				/>
				<KpiCard
					label="Net"
					value={nairaShort(revenue - spent)}
					icon={CoinsIcon}
					hint="Before payroll and platform fees"
				/>
				{demo ? (
					<KpiCard
						label="Banked"
						value={nairaShort(revenue * 0.62)}
						icon={WalletIcon}
						hint="Card + transfers + cash deposits"
					/>
				) : (
					<KpiCard
						label="Best day"
						value={nairaShort(Math.max(0, ...days.map((d) => d.revenue)))}
						icon={WalletIcon}
						hint="Highest revenue this month"
					/>
				)}
			</div>
			<SectionCard
				title="Revenue vs expenses by day"
				subtitle="Hover a bar for the day"
			>
				{days.length === 0 && <EmptyState title="No money recorded yet" />}
				<div className="flex h-[220px] items-end gap-[6px] overflow-hidden pt-4">
					{days.map((d) => (
						<div
							key={d.date.toISOString()}
							className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
							title={`${format(d.date, "EEE d MMM")} · ${naira(d.revenue)} in · ${naira(d.expenses)} out`}
						>
							{/* Revenue and expenses side by side, both on the same scale (the day's taller one fills 180px at most). */}
							<div className="flex h-[180px] w-full items-end justify-center gap-[2px] transition-opacity group-hover:opacity-80">
								<div
									className="w-1/2 max-w-[24px] rounded-t-[3px] bg-brand"
									style={{ height: `${(d.revenue / max) * 100}%` }}
								/>
								<div
									className="w-1/2 max-w-[24px] rounded-t-[3px] bg-[#dbab00]"
									style={{ height: `${(d.expenses / max) * 100}%` }}
								/>
							</div>
							<span className="text-[10px] text-ink-3">
								{format(d.date, "d")}
							</span>
						</div>
					))}
				</div>
				<div className="mt-2 flex gap-4 text-xs text-ink-2">
					<span className="flex items-center gap-1">
						<span className="size-[10px] rounded-[3px] bg-brand" /> Revenue
					</span>
					<span className="flex items-center gap-1">
						<span className="size-[10px] rounded-[3px] bg-[#dbab00]" /> Expenses
					</span>
				</div>
			</SectionCard>
			<div className="grid gap-4 md:grid-cols-2">
				<SectionCard title="Revenue by department" bodyClassName="gap-3 pt-2">
					{!demo && income.length === 0 && (
						<EmptyState title="No money taken in this period" />
					)}
					{!demo &&
						income.map((s) => (
							<div key={s.source} className="flex flex-col gap-1">
								<div className="flex items-center text-[13px]">
									<span className="flex-1 font-medium text-ink">
										{s.source}
									</span>
									<span className="text-ink-2">
										{s.pct}% · {nairaShort(s.amount)}
									</span>
								</div>
								<ProgressBar value={s.pct} max={100} />
							</div>
						))}
					{demo &&
						byDept.map(([name, share]) => (
							<div key={name} className="flex flex-col gap-1">
								<div className="flex items-center text-[13px]">
									<span className="flex-1 font-medium text-ink">{name}</span>
									<span className="text-ink-2">
										{Math.round(share * 100)}% · {nairaShort(revenue * share)}
									</span>
								</div>
								<ProgressBar value={share} max={1} />
							</div>
						))}
				</SectionCard>
				<SectionCard
					title="Top expenses by category"
					subtitle={last ? "Recorded last month" : "Recorded this month"}
					action={{ label: "Expenses", href: "/dashboard/expenses" }}
					bodyClassName="gap-3 pt-2"
				>
					{byCategory.length === 0 && (
						<EmptyState title="No expenses recorded" />
					)}
					{byCategory.slice(0, 6).map(([cat, amt]) => (
						<div key={cat} className="flex flex-col gap-1">
							<div className="flex items-center text-[13px]">
								<span className="flex-1 font-medium text-ink">{cat}</span>
								<span className="text-ink-2">{naira(amt)}</span>
							</div>
							<ProgressBar value={amt} max={byCategory[0][1]} tone="warning" />
						</div>
					))}
				</SectionCard>
			</div>
		</>
	);
}
