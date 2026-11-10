"use client";

import {
	BanknoteIcon,
	BedDoubleIcon,
	ClockIcon,
	ReceiptIcon,
	RotateCwIcon,
	WalletIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
	parseAsBoolean,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from "nuqs";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { DataTablePagination } from "@hospio/ui/shared/pagination";
import {
	fmtDate,
	fmtDay,
	fmtTime,
	naira,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { exportSales } from "@hospio/api/actions/fnb";
import { lagosDate } from "@hospio/api/data/mappers/finance";
import type {
	BookingRow,
	SaleFilters,
	SalesHistoryView,
	TerminalRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	METHOD_LABEL,
	type PayDesk,
	SALE_STATUS,
	SalePanel,
	fromEarlierDay,
	methodLabel,
	saleWhere,
} from "./sale-panel";

const STATUS_OPTIONS = [
	{ value: "UNPAID", label: "Unpaid (to pay or part paid)" },
	...(
		[
			"PAID",
			"TO_PAY",
			"PART_PAID",
			"ON_ROOM",
			"CANCELLED",
			"IN_PROGRESS",
		] as const
	).map((k) => ({ value: k, label: SALE_STATUS[k].label })),
];
const METHOD_OPTIONS = Object.entries(METHOD_LABEL).map(([value, label]) => ({
	value,
	label,
}));

/** yyyy-MM-dd of the Lagos day `offset` days from `base` (today). */
const shift = (day: string, offset: number) => {
	const d = new Date(`${day}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + offset);
	return d.toISOString().slice(0, 10);
};
/** Monday of the Lagos week that holds `day`. */
const monday = (day: string) => {
	const wd = new Date(`${day}T12:00:00Z`).getUTCDay();
	return shift(day, -((wd + 6) % 7));
};
const MAX_DAYS = 93;

export type SalesResult =
	| { ok: true; data: SalesHistoryView }
	| { ok: false; error: string };

/**
 * Bar and kitchen Sales, and the all-outlets view for the manager, owner and finance: a range of Lagos days
 * (Today, Yesterday, This week or any range), search, filters by status, payment method, attendant and
 * outlet, the money for everything that matches, per outlet and per attendant (management), and the list
 * newest first. Filters live in the URL and the server reads the page again; a sale opens in the sale panel.
 * Edit-level staff start on their own sales ("Mine") and can switch to the whole outlet.
 */
export function SalesScreen({
	result,
	filters,
	management,
	title,
	subtitle,
	payDesk,
	terminals,
	inHouse,
}: {
	result: SalesResult;
	filters: SaleFilters;
	/** The all-outlets view: outlet filter, per-outlet and per-attendant tables. */
	management: boolean;
	title: string;
	subtitle: string;
	payDesk: PayDesk | null;
	terminals: TerminalRow[];
	inHouse: BookingRow[];
}) {
	const router = useRouter();
	const [loading, startTransition] = useTransition();
	const [params, setParams] = useQueryStates(
		{
			from: parseAsString,
			to: parseAsString,
			status: parseAsString,
			method: parseAsString,
			attendant: parseAsString,
			outlet: parseAsString,
			q: parseAsString,
			mine: parseAsBoolean,
			page: parseAsInteger,
			open: parseAsString,
		},
		{ shallow: false, startTransition, history: "replace" },
	);
	const today = lagosDate();
	const data = result.ok ? result.data : null;
	const from = data?.from ?? filters.from ?? today;
	const to = data?.to ?? filters.to ?? from;
	const [search, setSearch] = useState(filters.q ?? "");
	const [exporting, setExporting] = useState(false);

	// Search reaches the server once typing stops.
	useEffect(() => {
		const q = search.trim();
		if (q === (params.q ?? "")) return;
		const t = setTimeout(
			() => void setParams({ q: q || null, page: null }),
			400,
		);
		return () => clearTimeout(t);
	}, [search, params.q, setParams]);

	/** Any change of filter starts again on the first page, unless it is the page that changes. */
	const set = (patch: Parameters<typeof setParams>[0]) =>
		void setParams({ page: null, ...patch });

	/** The page in the URL counts from 1 (none on the first page); the service counts from 0. */
	const goTo = (index: number) =>
		void setParams({ page: index <= 0 ? null : index + 1 });

	const range = (f: string, t: string) => {
		// fnb-service reads up to 93 days at a time: a longer range keeps its end and starts 93 days before.
		const start = f < shift(t, -(MAX_DAYS - 1)) ? shift(t, -(MAX_DAYS - 1)) : f;
		if (start !== f)
			toast.info(
				`Sales are read ${MAX_DAYS} days at a time · from ${fmtDate(start, "d MMM yyyy")}`,
			);
		set({
			from: start === today && t === today ? null : start,
			to: t === start ? null : t,
		});
	};
	const quick =
		from === today && to === today
			? "today"
			: from === shift(today, -1) && to === shift(today, -1)
				? "yesterday"
				: from === monday(today) && to === today
					? "week"
					: "custom";
	const single = from === to;

	const active = [
		params.status,
		params.method,
		params.attendant,
		params.outlet,
		params.q,
	].filter(Boolean).length;
	const clearFilters = () => {
		setSearch("");
		set({ status: null, method: null, attendant: null, outlet: null, q: null });
	};

	const doExport = async () => {
		setExporting(true);
		try {
			const r = await exportSales({ ...filters, page: undefined });
			if (!r.ok) {
				toast.error(r.error);
				return;
			}
			const blob = new Blob([`﻿${r.data.csv}`], {
				type: "text/csv;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = r.data.filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			toast.success(
				r.data.truncated
					? `First ${r.data.rows.toLocaleString()} sales exported · narrow the range for the rest`
					: `${plural(r.data.rows, "sale")} exported`,
			);
		} catch {
			toast.error("The sales could not be exported");
		} finally {
			setExporting(false);
		}
	};

	const earlier = data?.earlierUnpaid;
	const showEarlier = () => {
		const oldest = earlier?.oldest
			? lagosDate(new Date(earlier.oldest))
			: shift(today, -6);
		const start =
			oldest < shift(today, -(MAX_DAYS - 1))
				? shift(today, -(MAX_DAYS - 1))
				: oldest;
		set({ from: start, to: null, status: "UNPAID" });
	};
	const viewer = data?.viewer;
	const outletName = (id: string) =>
		data?.outletChoices.find((o) => o.id === id)?.name ?? "Outlet";

	return (
		<>
			<PageHeader title={title} subtitle={subtitle}>
				{viewer?.canExport && (
					<ExportButton
						onClick={() => {
							if (!exporting) void doExport();
						}}
						label={exporting ? "Exporting…" : "Export CSV"}
					/>
				)}
			</PageHeader>

			{/* The range: quick picks and the two days. */}
			<div className="flex flex-wrap items-center gap-2">
				<PillTabs
					value={quick}
					onChange={(k) => {
						if (k === "today") range(today, today);
						if (k === "yesterday") range(shift(today, -1), shift(today, -1));
						if (k === "week") range(monday(today), today);
					}}
					tabs={[
						{ key: "today", label: "Today" },
						{ key: "yesterday", label: "Yesterday" },
						{ key: "week", label: "This week" },
						...(quick === "custom"
							? [{ key: "custom" as const, label: "Range" }]
							: []),
					]}
				/>
				<label className="flex h-[38px] items-center gap-2 rounded-control border border-line bg-card px-3 text-[13px] text-ink-2">
					From
					<input
						type="date"
						aria-label="From"
						value={from}
						max={today}
						onChange={(e) => {
							const f = e.target.value;
							if (!f) return;
							range(f, to < f ? f : to);
						}}
						className="bg-transparent text-[13px] font-medium text-ink outline-none"
					/>
				</label>
				<label className="flex h-[38px] items-center gap-2 rounded-control border border-line bg-card px-3 text-[13px] text-ink-2">
					To
					<input
						type="date"
						aria-label="To"
						value={to}
						min={from}
						max={today}
						onChange={(e) => {
							const t = e.target.value;
							if (!t) return;
							range(from > t ? t : from, t);
						}}
						className="bg-transparent text-[13px] font-medium text-ink outline-none"
					/>
				</label>
				{loading && <span className="text-xs text-ink-3">Loading…</span>}
			</div>

			<Toolbar
				left={
					<>
						{viewer && !viewer.management && (
							<PillTabs
								value={viewer.mine ? "mine" : "all"}
								onChange={(k) =>
									set({
										mine:
											k === "mine"
												? viewer.mineByDefault
													? null
													: true
												: viewer.mineByDefault
													? false
													: null,
									})
								}
								tabs={[
									{ key: "mine", label: "My sales" },
									{ key: "all", label: "Whole outlet" },
								]}
							/>
						)}
						<SearchBox
							value={search}
							onChange={setSearch}
							placeholder="Sale number, item or guest"
							className="w-[260px]"
						/>
					</>
				}
				right={
					<>
						<FilterSelect
							value={params.status ?? ""}
							onChange={(v) => set({ status: v || null })}
							options={STATUS_OPTIONS}
							all="Any status"
						/>
						<FilterSelect
							value={params.method ?? ""}
							onChange={(v) => set({ method: v || null })}
							options={METHOD_OPTIONS}
							all="Any payment"
						/>
						{data && (!viewer?.mine || params.attendant) && (
							<FilterSelect
								value={params.attendant ?? ""}
								onChange={(v) => set({ attendant: v || null })}
								options={data.attendants.map((a) => ({
									value: a.userId || "none",
									label: a.name,
								}))}
								all="Anyone"
							/>
						)}
						{data && (management || data.outletChoices.length > 1) && (
							<FilterSelect
								value={params.outlet ?? ""}
								onChange={(v) => set({ outlet: v || null })}
								options={data.outletChoices.map((o) => ({
									value: o.id,
									label: o.name,
								}))}
								all="Every outlet"
							/>
						)}
						{active > 0 && (
							<button
								type="button"
								className={btn.ghost}
								onClick={clearFilters}
							>
								Clear filters
							</button>
						)}
					</>
				}
			/>

			{!result.ok ? (
				<EmptyState
					title="Sales could not be loaded"
					hint={
						result.error === "Sales could not be loaded"
							? "The restaurant and bar service didn't answer. Nothing is lost: try again in a moment."
							: result.error
					}
					className="py-12"
				>
					<button
						type="button"
						className={cn(btn.secondary, "mt-3 flex items-center gap-2")}
						onClick={() => startTransition(() => router.refresh())}
					>
						<RotateCwIcon className="size-4" /> Try again
					</button>
				</EmptyState>
			) : (
				data && (
					<>
						{earlier && earlier.count > 0 && params.status !== "UNPAID" && (
							<div className="flex flex-wrap items-center gap-3 rounded-card border border-[#dbab00]/40 bg-warning-soft px-5 py-3">
								<ClockIcon className="size-5 text-warning" />
								<p className="min-w-0 flex-1 text-[13px] font-medium text-ink">
									{plural(earlier.count, "unpaid sale")} from before{" "}
									{fmtDay(from)} · {naira(earlier.amount)} still to collect
									{earlier.oldest ? ` · oldest ${fmtDate(earlier.oldest)}` : ""}
								</p>
								<button
									type="button"
									className={btn.secondary}
									onClick={showEarlier}
								>
									Show them
								</button>
							</div>
						)}

						<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
							<KpiCard
								label="Sales"
								value={data.totals.sales}
								icon={ReceiptIcon}
								hint={
									data.totals.cancelled
										? `${plural(data.totals.cancelled, "cancelled sale")} not counted`
										: "Cancelled sales not counted"
								}
							/>
							<KpiCard
								label="Sold"
								value={naira(data.totals.sold)}
								icon={BanknoteIcon}
								hint={
									single ? fmtDay(from) : `${fmtDate(from)} – ${fmtDate(to)}`
								}
							/>
							<KpiCard
								label="Paid"
								value={naira(data.totals.paid)}
								icon={WalletIcon}
								hint="Taken at the outlet"
							/>
							<KpiCard
								label="Unpaid"
								value={
									<span className={cn(data.totals.unpaid > 0 && "text-danger")}>
										{naira(data.totals.unpaid)}
									</span>
								}
								icon={ClockIcon}
								hint="To pay, part paid and still open"
							/>
							<KpiCard
								label="On rooms"
								value={naira(data.totals.onRooms)}
								icon={BedDoubleIcon}
								hint="Collected at check-out"
							/>
						</div>

						{management && (
							<div className="grid gap-4 xl:grid-cols-2">
								<SectionCard
									title="By outlet"
									subtitle="Tap an outlet to see only its sales"
									flush
								>
									<Breakdown
										rows={data.outlets.map((o) => ({ ...o, key: o.outletId }))}
										selected={params.outlet ?? ""}
										onPick={(k) =>
											set({ outlet: params.outlet === k ? null : k })
										}
									/>
								</SectionCard>
								<SectionCard
									title="By attendant"
									subtitle="Who opened the sale · tap to see only theirs"
									flush
								>
									<Breakdown
										rows={data.attendants.map((a) => ({
											key: a.userId || "none",
											...a,
										}))}
										selected={params.attendant ?? ""}
										onPick={(k) =>
											set({ attendant: params.attendant === k ? null : k })
										}
									/>
								</SectionCard>
							</div>
						)}

						<SectionCard
							title={
								viewer?.mine
									? "My sales"
									: params.outlet
										? outletName(params.outlet)
										: "Sales"
							}
							subtitle={`${plural(data.matching, "sale")} · newest first${viewer?.mine ? " · only the ones you opened" : ""}`}
							flush
						>
							{data.rows.length === 0 ? (
								<div className="px-5 pb-5">
									{active > 0 ? (
										<EmptyState
											title="No sales match these filters"
											hint="Try another status, payment or name, or clear the filters."
										>
											<button
												type="button"
												className={cn(btn.secondary, "mt-3")}
												onClick={clearFilters}
											>
												Clear filters
											</button>
										</EmptyState>
									) : (
										<EmptyState
											title={
												single
													? "No sales on this day"
													: "No sales in these days"
											}
											hint={
												viewer?.mine
													? "Only the sales you opened are shown. Switch to Whole outlet to see everyone's."
													: undefined
											}
										/>
									)}
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full min-w-[860px] text-left text-[13px]">
										<thead>
											<tr className="border-y border-line bg-subtle/60 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
												<th className="px-5 py-2">Sale</th>
												<th className="px-3 py-2">Time</th>
												<th className="px-3 py-2">Where</th>
												<th className="px-3 py-2">Items</th>
												<th className="px-3 py-2">Opened by</th>
												<th className="px-3 py-2 text-right">Amount</th>
												<th className="px-5 py-2">Status</th>
											</tr>
										</thead>
										<tbody>
											{data.rows.map((r) => {
												const old = fromEarlierDay(r);
												const gone = r.status === "CANCELLED";
												return (
													<tr
														key={r.id}
														onClick={() =>
															void setParams({ open: r.id }, { shallow: true })
														}
														className={cn(
															"cursor-pointer border-b border-line last:border-b-0 hover:bg-subtle/60",
															gone && "text-ink-3 opacity-60",
															old && "bg-warning-soft/40",
														)}
													>
														<td className="px-5 py-3">
															<button
																type="button"
																className="font-bold text-ink hover:underline"
																aria-label={`Open ${r.number}`}
															>
																{r.number}
															</button>
															{management && (
																<span className="block text-xs text-ink-3">
																	{r.outletName}
																</span>
															)}
														</td>
														<td className="whitespace-nowrap px-3 py-3 text-ink-2">
															{single && !old
																? fmtTime(r.createdAt)
																: `${fmtDate(r.createdAt, "d MMM")}, ${fmtTime(r.createdAt)}`}
														</td>
														<td className="px-3 py-3 text-ink-2">
															{saleWhere(r)}
															{r.guestName && (
																<span className="block text-xs text-ink-3">
																	{r.guestName}
																</span>
															)}
														</td>
														<td className="max-w-[280px] px-3 py-3 text-ink">
															<span className="line-clamp-2">
																{r.items || "Nothing on it"}
															</span>
														</td>
														<td className="px-3 py-3 text-ink-2">
															{r.openedByName}
														</td>
														<td className="whitespace-nowrap px-3 py-3 text-right">
															<span
																className={cn(
																	"font-semibold text-ink",
																	gone && "line-through",
																)}
															>
																{naira(r.total)}
															</span>
															{r.status === "PART_PAID" && (
																<span className="block text-xs text-warning">
																	{naira(r.balance)} left
																</span>
															)}
															{r.methods.length > 0 && !gone && (
																<span className="block text-xs text-ink-3">
																	{r.methods.map(methodLabel).join(" + ")}
																</span>
															)}
														</td>
														<td className="px-5 py-3">
															<StatusPill tone={SALE_STATUS[r.status].tone}>
																{r.status === "ON_ROOM" && r.roomNumber
																	? `Room ${r.roomNumber}`
																	: SALE_STATUS[r.status].label}
															</StatusPill>
															{old && (
																<span className="mt-1 block text-[11px] font-semibold text-warning">
																	Earlier shift
																</span>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
							{data.rows.length > 0 && (
								<div className="flex items-center gap-3 border-t border-line px-5 py-[10px] text-xs text-ink-3">
									<span className="flex-1">
										Showing {data.page * data.size + 1}–
										{Math.min(data.matching, (data.page + 1) * data.size)} of{" "}
										{data.matching}
									</span>
									<DataTablePagination
										pageIndex={data.page}
										pageCount={Math.ceil(data.matching / data.size)}
										canPreviousPage={data.page > 0}
										canNextPage={(data.page + 1) * data.size < data.matching}
										previousPage={() => goTo(data.page - 1)}
										nextPage={() => goTo(data.page + 1)}
										setPageIndex={goTo}
									/>
								</div>
							)}
						</SectionCard>
					</>
				)
			)}

			<SalePanel
				saleId={params.open}
				onClose={() => void setParams({ open: null }, { shallow: true })}
				desk={payDesk}
				terminals={terminals}
				inHouse={inHouse}
			/>
		</>
	);
}

/** Per outlet or per attendant: sales, sold, unpaid and cancelled; a row filters the list. */
function Breakdown({
	rows,
	selected,
	onPick,
}: {
	rows: {
		key: string;
		name: string;
		sales: number;
		sold: number;
		unpaid: number;
		cancelled: number;
	}[];
	selected: string;
	onPick: (key: string) => void;
}) {
	if (rows.length === 0)
		return (
			<p className="px-5 pb-5 text-[13px] text-ink-3">
				No sales in these days.
			</p>
		);
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-left text-[13px]">
				<thead>
					<tr className="border-y border-line bg-subtle/60 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<th className="px-5 py-2">Name</th>
						<th className="px-3 py-2 text-right">Sales</th>
						<th className="px-3 py-2 text-right">Sold</th>
						<th className="px-3 py-2 text-right">Unpaid</th>
						<th className="px-5 py-2 text-right">Cancelled</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr
							key={r.key}
							onClick={() => onPick(r.key)}
							className={cn(
								"cursor-pointer border-b border-line last:border-b-0 hover:bg-subtle/60",
								selected === r.key && "bg-brand-soft/50",
							)}
						>
							<td className="px-5 py-2 font-semibold text-ink">
								<button
									type="button"
									className="text-left hover:underline"
									aria-pressed={selected === r.key}
								>
									{r.name}
								</button>
							</td>
							<td className="px-3 py-2 text-right text-ink-2">{r.sales}</td>
							<td className="px-3 py-2 text-right font-semibold text-ink">
								{naira(r.sold)}
							</td>
							<td
								className={cn(
									"px-3 py-2 text-right",
									r.unpaid > 0 ? "font-semibold text-danger" : "text-ink-2",
								)}
							>
								{naira(r.unpaid)}
							</td>
							<td className="px-5 py-2 text-right text-ink-2">{r.cancelled}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
