"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryStates, parseAsString } from "nuqs";
import { TableFilter } from "@/components/shared/table-filter";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
	CalendarDaysIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	XIcon,
} from "lucide-react";

function pad(n: number) {
	return String(n).padStart(2, "0");
}

function getMonthRange(year: number, month: number) {
	const lastDay = new Date(year, month + 1, 0).getDate();
	return {
		startDate: `${year}-${pad(month + 1)}-01`,
		endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
	};
}

function parseMonth(startDate: string | null): { year: number; month: number } {
	if (startDate) {
		const d = new Date(startDate + "T00:00:00");
		return { year: d.getFullYear(), month: d.getMonth() };
	}
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() };
}

function formatMonthLabel(year: number, month: number) {
	const d = new Date(year, month, 1);
	return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatPeriodLabel(startDate: string | null, endDate: string | null) {
	if (!startDate && !endDate) {
		const now = new Date();
		return now.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	}
	const fmt = (d: string) =>
		new Date(d + "T00:00:00").toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
	if (startDate) return `From ${fmt(startDate)}`;
	return `Up to ${fmt(endDate!)}`;
}

export function FinancialFilters() {
	const [queryState, setQueryState] = useQueryStates({
		startDate: parseAsString,
		endDate: parseAsString,
		period: parseAsString,
	});

	const [open, setOpen] = useState(false);

	// isFullMonth is computed later, but we need it for filter count.
	// We compute a preliminary check here inline.
	const hasDateParams = !!(queryState.startDate && queryState.endDate);
	const dateFilterCount = hasDateParams ? 2 : 0;
	const periodFilterCount = queryState.period ? 1 : 0;

	const { year, month } = useMemo(
		() => parseMonth(queryState.startDate),
		[queryState.startDate],
	);

	const isCurrentMonth = useMemo(() => {
		const now = new Date();
		return year === now.getFullYear() && month === now.getMonth();
	}, [year, month]);

	// Check if we're in "custom range" mode (dates set but not aligned to a full month)
	const isCustomRange = useMemo(() => {
		if (!queryState.startDate || !queryState.endDate) return false;
		const range = getMonthRange(year, month);
		return (
			queryState.startDate !== range.startDate ||
			queryState.endDate !== range.endDate
		);
	}, [queryState.startDate, queryState.endDate, year, month]);

	// Only count date filters when it's a custom range (not month navigation)
	const activeFilterCount = (isCustomRange ? dateFilterCount : 0) + periodFilterCount;

	const periodLabel = useMemo(
		() =>
			isCustomRange
				? formatPeriodLabel(queryState.startDate, queryState.endDate)
				: formatMonthLabel(year, month),
		[isCustomRange, queryState.startDate, queryState.endDate, year, month],
	);

	const goToMonth = useCallback(
		(y: number, m: number) => {
			const range = getMonthRange(y, m);
			setQueryState({
				startDate: range.startDate,
				endDate: range.endDate,
			});
		},
		[setQueryState],
	);

	const goPrev = useCallback(() => {
		const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
		goToMonth(prev.y, prev.m);
	}, [year, month, goToMonth]);

	const goNext = useCallback(() => {
		if (isCurrentMonth) return;
		const next = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
		goToMonth(next.y, next.m);
	}, [year, month, isCurrentMonth, goToMonth]);

	const goCurrentMonth = useCallback(() => {
		setQueryState({ startDate: null, endDate: null });
	}, [setQueryState]);

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{/* Month navigator */}
			<div className="inline-flex items-center bg-primary/10 rounded-lg overflow-hidden">
				<button
					type="button"
					onClick={goPrev}
					className="px-2 py-1.5 hover:bg-primary/20 transition-colors text-primary"
				>
					<ChevronLeftIcon className="size-4" />
				</button>
				<button
					type="button"
					onClick={goCurrentMonth}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
				>
					<CalendarDaysIcon className="size-4" />
					{periodLabel}
				</button>
				<button
					type="button"
					onClick={goNext}
					disabled={isCurrentMonth}
					className="px-2 py-1.5 hover:bg-primary/20 transition-colors text-primary disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<ChevronRightIcon className="size-4" />
				</button>
			</div>

			<TableFilter open={open} setOpen={setOpen} count={activeFilterCount}>
				<div className="flex flex-col gap-y-4 w-[280px]">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Start Date</h4>
						<input
							type="date"
							value={queryState.startDate ?? ""}
							onChange={(e) =>
								setQueryState({
									startDate: e.target.value || null,
								})
							}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
						/>
					</div>
					<div className="space-y-2">
						<h4 className="font-medium leading-none">End Date</h4>
						<input
							type="date"
							value={queryState.endDate ?? ""}
							onChange={(e) =>
								setQueryState({
									endDate: e.target.value || null,
								})
							}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
						/>
					</div>
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Period</h4>
						<Select
							value={queryState.period ?? "all"}
							onValueChange={(value) =>
								setQueryState({
									period: value === "all" ? null : value,
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="All periods" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Periods</SelectItem>
								<SelectItem value="day">Daily</SelectItem>
								<SelectItem value="week">Weekly</SelectItem>
								<SelectItem value="month">Monthly</SelectItem>
								<SelectItem value="year">Yearly</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center justify-between border-t pt-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setQueryState({
									startDate: null,
									endDate: null,
									period: null,
								});
							}}
							className="text-muted-foreground hover:text-foreground"
						>
							Reset
						</Button>
						<Button
							size="sm"
							onClick={() => {
								setOpen(false);
							}}
						>
							Done
						</Button>
					</div>
				</div>
			</TableFilter>

			{/* Applied Filters Display — only show for custom ranges, not month nav */}
			{(isCustomRange || queryState.period) && (
				<div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
					{isCustomRange && queryState.startDate && (
						<span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
							From: {queryState.startDate}
							<Button
								variant="ghost"
								size="sm"
								className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
								onClick={() =>
									setQueryState({ startDate: null })
								}
							>
								<XIcon className="h-3 w-3" />
							</Button>
						</span>
					)}
					{isCustomRange && queryState.endDate && (
						<span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
							To: {queryState.endDate}
							<Button
								variant="ghost"
								size="sm"
								className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
								onClick={() =>
									setQueryState({ endDate: null })
								}
							>
								<XIcon className="h-3 w-3" />
							</Button>
						</span>
					)}
					{queryState.period && (
						<span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
							Period: {queryState.period}
							<Button
								variant="ghost"
								size="sm"
								className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
								onClick={() =>
									setQueryState({ period: null })
								}
							>
								<XIcon className="h-3 w-3" />
							</Button>
						</span>
					)}
				</div>
			)}
		</div>
	);
}
