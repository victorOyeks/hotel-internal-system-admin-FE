"use client";

import { ArrowDownToLineIcon, CoinsIcon, DownloadIcon, TrendingUpIcon, WalletIcon } from "lucide-react";
import { format, startOfMonth, subDays } from "date-fns";
import { useState } from "react";
import { naira, nairaShort } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionCard } from "@/components/shared/section-card";
import { FilterSelect } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { ExpenseRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";

/** Finance 2.1 · Month at a glance. Daily numbers are generated so the chart has shape. */
export function MonthScreen({ expenses, hotelName }: { expenses: ExpenseRow[]; hotelName: string }) {
	const [month, setMonth] = useState("");
	const { run, pending } = useDemoAction();
	const today = new Date();
	const dayOfMonth = today.getDate();
	const days = Array.from({ length: dayOfMonth }, (_, i) => {
		const d = subDays(today, dayOfMonth - 1 - i);
		const seed = (d.getDate() * 37) % 23;
		const weekend = d.getDay() === 5 || d.getDay() === 6;
		return { date: d, revenue: 950000 + seed * 28000 + (weekend ? 420000 : 0), expenses: 180000 + ((seed * 13) % 9) * 32000 };
	});
	const revenue = days.reduce((s, d) => s + d.revenue, 0);
	const spent = days.reduce((s, d) => s + d.expenses, 0);
	const max = Math.max(...days.map((d) => d.revenue));
	const byDept = [
		["Rooms", 0.71], ["Restaurant", 0.13], ["Bar", 0.1], ["Laundry", 0.03], ["Other", 0.03],
	] as const;
	const byCategory = Object.entries(expenses.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc; }, {})).sort((a, b) => b[1] - a[1]);

	return (
		<>
			<PageHeader title="Month at a glance" subtitle={`${hotelName} · ${format(startOfMonth(today), "d MMM")} → ${format(today, "d MMM yyyy")} · so far`}>
				<FilterSelect value={month} onChange={setMonth} options={[{ value: "last", label: format(subDays(startOfMonth(today), 1), "MMMM yyyy") }]} all={format(today, "MMMM yyyy")} />
				<button type="button" className={btn.primary} disabled={pending} onClick={() => void run("Month report is downloading (PDF)", undefined, { tone: "info" })}><DownloadIcon className="mr-1 inline size-4" /> Download</button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Revenue" value={nairaShort(revenue)} icon={TrendingUpIcon} hint={`${nairaShort(revenue / dayOfMonth)} a day on average`} />
				<KpiCard label="Expenses" value={nairaShort(spent)} icon={ArrowDownToLineIcon} hint={`${Math.round((spent / revenue) * 100)}% of revenue`} />
				<KpiCard label="Net" value={nairaShort(revenue - spent)} icon={CoinsIcon} hint="Before H.M.S fees and payroll" />
				<KpiCard label="Banked" value={nairaShort(revenue * 0.62)} icon={WalletIcon} hint="Card + transfers + cash deposits" />
			</div>
			<SectionCard title="Revenue vs expenses by day" subtitle="Weekends run higher · hover a bar for the day">
				<div className="flex h-[220px] items-end gap-[6px] pt-4">
					{days.map((d) => (
						<div key={d.date.toISOString()} className="group relative flex flex-1 flex-col items-center justify-end gap-[2px]" title={`${format(d.date, "EEE d MMM")} · ${naira(d.revenue)} in · ${naira(d.expenses)} out`}>
							<div className="w-full rounded-t-[3px] bg-brand transition-opacity group-hover:opacity-80" style={{ height: `${(d.revenue / max) * 180}px` }} />
							<div className="w-full rounded-b-[3px] bg-[#dbab00]" style={{ height: `${(d.expenses / max) * 180}px` }} />
							<span className="text-[10px] text-ink-3">{format(d.date, "d")}</span>
						</div>
					))}
				</div>
				<div className="mt-2 flex gap-4 text-xs text-ink-2"><span className="flex items-center gap-1"><span className="size-[10px] rounded-[3px] bg-brand" /> Revenue</span><span className="flex items-center gap-1"><span className="size-[10px] rounded-[3px] bg-[#dbab00]" /> Expenses</span></div>
			</SectionCard>
			<div className="grid gap-4 md:grid-cols-2">
				<SectionCard title="Revenue by department" bodyClassName="gap-3 pt-2">
					{byDept.map(([name, share]) => (
						<div key={name} className="flex flex-col gap-1"><div className="flex items-center text-[13px]"><span className="flex-1 font-medium text-ink">{name}</span><span className="text-ink-2">{Math.round(share * 100)}% · {nairaShort(revenue * share)}</span></div><ProgressBar value={share} max={1} /></div>
					))}
				</SectionCard>
				<SectionCard title="Top expenses by category" subtitle="Recorded this month" action={{ label: "Expenses", href: "/dashboard/expenses" }} bodyClassName="gap-3 pt-2">
					{byCategory.slice(0, 6).map(([cat, amt]) => (
						<div key={cat} className="flex flex-col gap-1"><div className="flex items-center text-[13px]"><span className="flex-1 font-medium text-ink">{cat}</span><span className="text-ink-2">{naira(amt)}</span></div><ProgressBar value={amt} max={byCategory[0][1]} tone="warning" /></div>
					))}
				</SectionCard>
			</div>
		</>
	);
}
