"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BanknoteIcon,
	CheckIcon,
	DownloadIcon,
	HandshakeIcon,
	ReceiptIcon,
	TrendingUpIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	fmtDay,
	fmtWhen,
	humanize,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs, useTabParam } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { OutletSalesCard } from "../manager/outlet-sales";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import type {
	ApprovalRow,
	ExpenseRow,
	OrganizationRow,
	OwnerHotelRow,
	SeriesPointRow,
	TransactionRow,
	WorthRow,
	OutletSalesDayRow,
} from "@hospio/api/data/types";
import type {
	PayrollRow,
	ownerBudgets,
	ownerPayMix,
	ownerRevenueSources,
	ownerTrend,
} from "@hospio/api/demo/fixtures/owner";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { cn } from "@hospio/ui/utils";
import { ApprovalPanel } from "./approval-panel";
import {
	DeltaPill,
	DownloadModal,
	HotelFilter,
	MiniBars,
	useParam,
} from "./common";

type OwnerHotelFinance = OwnerHotelRow;

type Tab =
	| "overview"
	| "pnl"
	| "transactions"
	| "expenses"
	| "payroll"
	| "organizations";

/** Sections with no backend yet (payroll, bills, branch P&L, organization credit, budgets, income sources) render this when `demo` is off. */
function NotConnected({ title, what }: { title: string; what: string }) {
	return (
		<SectionCard title={title} bodyClassName="pt-2">
			<EmptyState
				title="Not connected yet"
				hint={`${what} are not connected to the backend yet.`}
			/>
		</SectionCard>
	);
}

export type FinancialsProps = {
	/** Revenue this month by the desk that took it (live). */
	income?: { source: string; amount: number; pct: number }[];
	/** True while the finance domain is on fixtures: the sections below then show their sample data, otherwise "Not connected yet". */
	demo: boolean;
	businessName: string;
	/** The hotel the transactions and expenses come from (finance-service answers for the active hotel). */
	hotelName: string;
	hotels: OwnerHotelFinance[];
	series: SeriesPointRow[];
	worth: WorthRow[];
	limit: number;
	trend: typeof ownerTrend;
	budgets: typeof ownerBudgets;
	sources: typeof ownerRevenueSources;
	payMix: typeof ownerPayMix;
	transactions: TransactionRow[];
	expenses: ExpenseRow[];
	payroll: PayrollRow[];
	organizations: OrganizationRow[];
	approvals: ApprovalRow[];
	/** What the restaurant and bar sold today; sales, not money received. */
	outletSales?: OutletSalesDayRow | null;
};

export function OwnerFinancials(props: FinancialsProps) {
	const { hotels, trend, demo } = props;
	const [tab] = useTabParam<Tab>("overview");
	const [download, setDownload] = useState(false);
	const [period, setPeriod] = useState("month");
	const revenue = hotels.reduce((s, h) => s + h.revenueMonth, 0);
	const expenses = hotels.reduce((s, h) => s + h.expensesMonth, 0);
	const last = hotels.reduce((s, h) => s + h.revenueLastMonth, 0);
	const profit = revenue - expenses;

	return (
		<>
			<PageHeader
				title="Financials"
				subtitle={`${props.businessName} · ${plural(hotels.length, "branch", "branches")} · ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}, month to date`}
			>
				<Button className={btn.primary} onClick={() => setDownload(true)}>
					<DownloadIcon className="size-4" /> Download report
				</Button>
			</PageHeader>

			<Toolbar
				left={
					<PillTabs
						param="tab"
						tabs={[
							{ key: "overview", label: "Overview" },
							{ key: "pnl", label: "Branch P&L" },
							{ key: "transactions", label: "Transactions" },
							{ key: "expenses", label: "Expenses & budgets" },
							{ key: "payroll", label: "Payroll" },
							{ key: "organizations", label: "Organizations" },
						]}
					/>
				}
				right={
					<FilterSelect
						value={period}
						onChange={setPeriod}
						all="This month"
						options={[
							{ value: "last", label: "Last month" },
							{ value: "quarter", label: "Quarter" },
							{ value: "ytd", label: "Year to date" },
						]}
					/>
				}
			/>

			{tab === "overview" && (
				<>
					<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
						<KpiCard
							label="Net profit"
							value={nairaShort(profit)}
							icon={WalletIcon}
							pill={
								demo ? (
									<DeltaPill
										value={Math.round((profit / (last * 0.27) - 1) * 100)}
									/>
								) : undefined
							}
							hint="What you kept after all costs"
						/>
						<KpiCard
							label="Revenue"
							value={nairaShort(revenue)}
							icon={TrendingUpIcon}
							pill={
								last > 0 ? (
									<DeltaPill
										value={Math.round(((revenue - last) / last) * 1000) / 10}
									/>
								) : undefined
							}
							hint={`${nairaShort(last)} last month`}
						/>
						<KpiCard
							label="Expenses"
							value={nairaShort(expenses)}
							icon={ReceiptIcon}
							pill={demo ? <DeltaPill value={2.4} invert /> : undefined}
							hint={
								demo
									? `${nairaShort(expenses * 0.98)} last month`
									: "Month to date"
							}
						/>
						<KpiCard
							label="Profit margin"
							value={
								revenue > 0 ? `${Math.round((profit / revenue) * 100)}%` : "—"
							}
							icon={BanknoteIcon}
							hint={demo ? "Industry average ≈ 25%" : "Month to date"}
						/>
					</div>
					{demo ? (
						<div className="grid grid-cols-2 gap-3 rounded-card border border-line bg-card px-5 py-4 md:grid-cols-4">
							{[
								[
									"Cash in bank",
									nairaShort(84300000),
									"Across 4 accounts · updated 9:00am",
								],
								[
									"Guests owe you",
									nairaShort(7500000),
									"14 bookings · 3 overdue",
								],
								[
									"You owe suppliers",
									nairaShort(14400000),
									"₦3.15M due in the next 7 days",
								],
								[
									"Next payroll",
									nairaShort(hotels.reduce((s, h) => s + h.payrollMonth, 0)),
									"28th · 200 staff",
								],
							].map(([l, v, h]) => (
								<div key={l}>
									<p className="text-[11px] text-ink-3">{l}</p>
									<p className="text-lg font-bold text-ink">{v}</p>
									<p className="text-[11px] text-ink-3">{h}</p>
								</div>
							))}
						</div>
					) : (
						<NotConnected
							title="Bank, bills and payroll"
							what="Cash in the bank, bills to pay and payroll"
						/>
					)}
					<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
						<SectionCard
							title="Revenue, expenses & profit"
							subtitle={
								demo
									? "Last 12 months · all branches"
									: `Last 30 days · ${props.hotelName}`
							}
							bodyClassName="pt-3"
						>
							<div className="mb-3 flex gap-5 text-xs text-ink-2">
								<span className="flex items-center gap-1">
									<span className="size-2 rounded-sm bg-brand" /> Revenue
								</span>
								<span className="flex items-center gap-1">
									<span className="size-2 rounded-sm bg-[#f29ab0]" /> Expenses
								</span>
							</div>
							{demo ? (
								<MiniBars
									series={trend.map((t) => t.revenue)}
									secondary={trend.map((t) => t.expenses)}
									labels={trend.map((t) => t.month)}
									height={200}
								/>
							) : props.series.length === 0 ? (
								<EmptyState
									title="No money recorded yet"
									hint="Payments and expenses show here as the days go by."
								/>
							) : (
								<MiniBars
									series={props.series.map((d) => d.revenue)}
									secondary={props.series.map((d) => d.expenses)}
									labels={props.series.map((d) => d.date.slice(8))}
									height={200}
								/>
							)}
						</SectionCard>
						<SectionCard
							title="Worth a look"
							count={props.worth.length}
							bodyClassName="pt-2"
						>
							{props.worth.length === 0 && (
								<EmptyState title="Nothing needs your eye" />
							)}
							{props.worth.map((w) => (
								<Link
									key={w.id}
									href={w.href}
									className="border-b border-line py-2 last:border-b-0 hover:bg-subtle/60"
								>
									<p className="text-[13px] font-semibold text-ink">
										{w.title}
									</p>
									<p className="text-xs text-ink-3">{w.detail}</p>
								</Link>
							))}
						</SectionCard>
					</div>
					<PnlTable hotels={hotels} compact />
					<OutletSalesCard sales={props.outletSales} />
					{demo ? (
						<div className="grid gap-4 xl:grid-cols-2">
							<SectionCard
								title="Where the money went"
								subtitle={`${nairaShort(expenses)} spent · budget ${nairaShort(props.budgets.reduce((s, b) => s + b.budget, 0))}`}
								action={{
									label: "View expenses",
									href: "/dashboard/financials?tab=expenses",
								}}
								bodyClassName="gap-3 pt-2"
							>
								{props.budgets.map((b) => (
									<div key={b.category} className="flex flex-col gap-1">
										<div className="flex justify-between text-[13px]">
											<span className="text-ink">{b.category}</span>
											<span
												className={cn(
													"text-xs",
													b.spent > b.budget
														? "font-semibold text-danger"
														: "text-ink-3",
												)}
											>
												{Math.round((b.spent / b.budget) * 100)}% of budget
											</span>
											<span className="font-semibold text-ink">
												{nairaShort(b.spent)}
											</span>
										</div>
										<ProgressBar
											value={b.spent}
											max={b.budget}
											tone={
												b.spent > b.budget
													? "danger"
													: b.spent > b.budget * 0.9
														? "warning"
														: "brand"
											}
										/>
									</div>
								))}
							</SectionCard>
							<SectionCard
								title="Where the money came from"
								subtitle={`${nairaShort(revenue)} earned this month`}
								action={{
									label: "View transactions",
									href: "/dashboard/financials?tab=transactions",
								}}
								bodyClassName="gap-3 pt-2"
							>
								<div className="flex h-3 overflow-hidden rounded-full">
									{props.sources.map((s, i) => (
										<div
											key={s.source}
											className={
												[
													"bg-brand",
													"bg-[#d3537a]",
													"bg-[#f29ab0]",
													"bg-line-strong",
												][i]
											}
											style={{ width: `${s.share}%` }}
										/>
									))}
								</div>
								{props.sources.map((s) => (
									<div
										key={s.source}
										className="flex items-center gap-3 text-[13px]"
									>
										<span className="flex-1 text-ink">{s.source}</span>
										<span className="text-ink-3">{s.share}%</span>
										<DeltaPill value={s.change} />
										<span className="w-20 text-right font-semibold text-ink">
											{nairaShort(s.amount)}
										</span>
									</div>
								))}
								<p className="mt-2 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
									How guests paid
								</p>
								<div className="grid grid-cols-4 gap-2">
									{props.payMix.map((m) => (
										<div
											key={m.method}
											className="rounded-lg bg-subtle/70 px-2 py-2"
										>
											<p className="text-[10px] text-ink-3">{m.method}</p>
											<p className="text-sm font-bold text-ink">{m.pct}%</p>
										</div>
									))}
								</div>
							</SectionCard>
						</div>
					) : (
						<div className="grid gap-4 xl:grid-cols-2">
							<NotConnected
								title="Where the money went"
								what="Budgets by category"
							/>
							<SectionCard
								title="Where the money came from"
								subtitle={`This month · ${props.hotelName}`}
								action={{
									label: "View transactions",
									href: "/dashboard/financials?tab=transactions",
								}}
								bodyClassName="gap-3 pt-2"
							>
								{(props.income ?? []).length === 0 ? (
									<p className="text-[13px] text-ink-3">
										No money taken this month yet.
									</p>
								) : (
									(props.income ?? []).map((s) => (
										<div
											key={s.source}
											className="flex items-center gap-3 text-[13px]"
										>
											<span className="flex-1 text-ink">{s.source}</span>
											<span className="text-ink-3">{s.pct}%</span>
											<span className="w-20 text-right font-semibold text-ink">
												{nairaShort(s.amount)}
											</span>
										</div>
									))
								)}
							</SectionCard>
						</div>
					)}
				</>
			)}
			{tab === "pnl" &&
				(demo ? (
					<PnlTable hotels={hotels} />
				) : (
					<NotConnected
						title="Branch P&L"
						what="The full branch P&L with payroll"
					/>
				))}
			{tab === "transactions" && (
				<TransactionsTab
					transactions={props.transactions}
					hotels={hotels}
					demo={demo}
					hotelName={props.hotelName}
				/>
			)}
			{tab === "expenses" && (
				<ExpensesTab
					expenses={props.expenses}
					budgets={props.budgets}
					approvals={props.approvals}
					hotels={hotels}
					demo={demo}
					hotelName={props.hotelName}
					limit={props.limit}
				/>
			)}
			{tab === "payroll" &&
				(demo ? (
					<PayrollTab payroll={props.payroll} hotels={hotels} />
				) : (
					<NotConnected title="Payroll" what="Payroll runs and payslips" />
				))}
			{tab === "organizations" &&
				(demo ? (
					<OrganizationsTab organizations={props.organizations} />
				) : (
					<NotConnected
						title="Organizations"
						what="Organization credit and invoices"
					/>
				))}

			<DownloadModal
				open={download}
				onOpenChange={setDownload}
				what={`Financials · ${humanize(tab)}`}
			/>
		</>
	);
}

function PnlTable({
	hotels,
	compact = false,
}: {
	hotels: OwnerHotelFinance[];
	compact?: boolean;
}) {
	const sorted = [...hotels].sort(
		(a, b) =>
			b.revenueMonth - b.expensesMonth - (a.revenueMonth - a.expensesMonth),
	);
	const tot = (k: "revenueMonth" | "expensesMonth" | "payrollMonth") =>
		hotels.reduce((s, h) => s + h[k], 0);
	return (
		<SectionCard
			title={compact ? "Profit by branch" : "Branch P&L"}
			subtitle="This month · sorted by net profit · click a branch for its full P&L"
			flush
			action={
				compact
					? { label: "Compare branches", href: "/dashboard/financials?tab=pnl" }
					: undefined
			}
		>
			<table className="w-full text-left">
				<thead>
					<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<th className="px-5 py-[10px]">Branch</th>
						<th className="py-[10px]">Revenue</th>
						<th className="py-[10px]">Expenses</th>
						{!compact && <th className="py-[10px]">Payroll</th>}
						<th className="py-[10px]">Net profit</th>
						<th className="py-[10px]">Margin</th>
						<th className="py-[10px]">vs last month</th>
						<th className="py-[10px] pr-5">Occupancy</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((h) => {
						const net = h.revenueMonth - h.expensesMonth;
						const m =
							h.revenueMonth > 0 ? Math.round((net / h.revenueMonth) * 100) : 0;
						const delta =
							h.revenueLastMonth > 0
								? Math.round(
										((h.revenueMonth - h.revenueLastMonth) /
											h.revenueLastMonth) *
											100,
									)
								: 0;
						return (
							<tr
								key={h.hotelId}
								className="h-12 border-b border-line text-[13px] hover:bg-subtle/50"
							>
								<td className="px-5">
									<Link
										href={`/dashboard/hotels/${h.hotelId}?tab=money`}
										className="flex items-center gap-2 font-semibold text-ink hover:text-brand"
									>
										<span
											className={cn(
												"size-2 rounded-full",
												m >= 30
													? "bg-success"
													: m >= 15
														? "bg-[#dbab00]"
														: "bg-danger",
											)}
										/>
										{h.name}
									</Link>
								</td>
								<td className="text-ink">{nairaShort(h.revenueMonth)}</td>
								<td className="text-ink-2">{nairaShort(h.expensesMonth)}</td>
								{!compact && (
									<td className="text-ink-2">{nairaShort(h.payrollMonth)}</td>
								)}
								<td
									className={cn(
										"font-semibold",
										net < 0 ? "text-danger" : "text-ink",
									)}
								>
									{nairaShort(net)}
								</td>
								<td>
									<div className="flex items-center gap-2">
										<ProgressBar
											value={Math.max(0, m)}
											max={50}
											className="w-16"
											tone={
												m >= 30 ? "success" : m >= 15 ? "warning" : "danger"
											}
										/>
										<span className={m < 0 ? "text-danger" : ""}>{m}%</span>
									</div>
								</td>
								<td>
									<DeltaPill value={delta} />
								</td>
								<td className="pr-5">{h.occupancy}%</td>
							</tr>
						);
					})}
					<tr className="h-12 bg-subtle/60 text-[13px] font-bold text-ink">
						<td className="px-5">All branches</td>
						<td>{nairaShort(tot("revenueMonth"))}</td>
						<td>{nairaShort(tot("expensesMonth"))}</td>
						{!compact && <td>{nairaShort(tot("payrollMonth"))}</td>}
						<td>{nairaShort(tot("revenueMonth") - tot("expensesMonth"))}</td>
						<td>
							{tot("revenueMonth") > 0
								? Math.round(
										((tot("revenueMonth") - tot("expensesMonth")) /
											tot("revenueMonth")) *
											100,
									)
								: 0}
							%
						</td>
						<td />
						<td className="pr-5">
							{Math.round(
								hotels.reduce((s, h) => s + h.occupancy * h.rooms, 0) /
									Math.max(
										1,
										hotels.reduce((s, h) => s + h.rooms, 0),
									),
							)}
							%
						</td>
					</tr>
				</tbody>
			</table>
		</SectionCard>
	);
}

function TransactionsTab({
	transactions,
	hotels,
	demo,
	hotelName,
}: {
	transactions: TransactionRow[];
	hotels: OwnerHotelFinance[];
	demo: boolean;
	hotelName: string;
}) {
	const [search, setSearch] = useState("");
	const [hotel, setHotel] = useState("");
	const [kind, setKind] = useState("");
	const rows = transactions
		.map((t, i) => ({
			...t,
			hotelName: demo ? hotels[i % 3 === 2 ? 1 : 0].name : hotelName,
		}))
		.filter(
			(t) =>
				(!kind || t.kind === kind) &&
				(!hotel ||
					hotels.find((h) => h.hotelId === hotel)?.name === t.hotelName),
		);
	const cols: ColumnDef<(typeof rows)[number], unknown>[] = [
		{
			accessorKey: "at",
			header: "When",
			cell: ({ row }) => fmtWhen(row.original.at),
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.description}
					secondary={`${row.original.reference} · ${row.original.by}`}
				/>
			),
		},
		{ accessorKey: "hotelName", header: "Hotel" },
		{
			accessorKey: "kind",
			header: "Type",
			cell: ({ row }) => (
				<StatusPill
					dot={false}
					tone={
						row.original.kind === "PAYMENT"
							? "success"
							: row.original.kind === "REFUND"
								? "danger"
								: row.original.kind === "EXPENSE"
									? "warning"
									: "info"
					}
				>
					{humanize(row.original.kind)}
				</StatusPill>
			),
		},
		{ accessorKey: "method", header: "Method" },
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<span
					className={cn(
						"font-semibold",
						row.original.amount < 0 ? "text-danger" : "text-success",
					)}
				>
					{row.original.amount < 0 ? "−" : "+"}
					{naira(Math.abs(row.original.amount))}
				</span>
			),
		},
	];
	return (
		<>
			<Toolbar
				left={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Reference, guest, staff"
					/>
				}
				right={
					<>
						{demo && (
							<HotelFilter hotels={hotels} value={hotel} onChange={setHotel} />
						)}
						<FilterSelect
							value={kind}
							onChange={setKind}
							all="All types"
							options={["PAYMENT", "EXPENSE", "REFUND", "DEPOSIT"].map((k) => ({
								value: k,
								label: humanize(k),
							}))}
						/>
					</>
				}
			/>
			{!demo && (
				<p className="text-xs text-ink-3">
					Today's money at {hotelName}. Switch hotel from the top bar to see
					another.
				</p>
			)}
			<DataTable columns={cols} data={rows} search={search} />
		</>
	);
}

function ExpensesTab({
	expenses,
	budgets,
	approvals,
	hotels,
	demo,
	hotelName,
	limit,
}: {
	expenses: ExpenseRow[];
	budgets: typeof ownerBudgets;
	approvals: ApprovalRow[];
	hotels: OwnerHotelFinance[];
	demo: boolean;
	hotelName: string;
	limit: number;
}) {
	const [open, setOpen] = useParam("open");
	const [view, setView] = useState<"requests" | "all" | "budgets">("requests");
	const ownerApprovals = approvals.filter((a) => a.approverLevel === "OWNER");
	const selected = approvals.find((a) => a.id === open) ?? null;
	const rows = expenses.map((e, i) => ({
		...e,
		hotelName: demo ? hotels[i % 4 === 3 ? 1 : 0].name : hotelName,
	}));
	const statusTone: Record<
		ExpenseRow["status"],
		"success" | "warning" | "danger" | "info" | "grey"
	> = {
		RECORDED: "grey",
		PENDING_APPROVAL: "warning",
		APPROVED: "success",
		DECLINED: "danger",
		QUESTION: "info",
		PAID: "success",
	};
	const cols: ColumnDef<(typeof rows)[number], unknown>[] = [
		{
			accessorKey: "date",
			header: "Date",
			cell: ({ row }) => fmtDay(row.original.date),
		},
		{
			accessorKey: "description",
			header: "Expense",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.description}
					secondary={`${row.original.category} · ${row.original.requestedBy}`}
				/>
			),
		},
		{ accessorKey: "hotelName", header: "Hotel" },
		{
			accessorKey: "paidFrom",
			header: "Paid from",
			cell: ({ row }) => humanize(row.original.paidFrom),
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.amount)}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone[row.original.status]}>
					{humanize(row.original.status)}
				</StatusPill>
			),
		},
	];
	return (
		<>
			<PillTabs
				tabs={[
					{
						key: "requests",
						label: "Needs the owner",
						count: ownerApprovals.filter(
							(a) => a.status === "PENDING" || a.status === "QUESTION",
						).length,
					},
					{ key: "all", label: "All expenses", count: expenses.length },
					{ key: "budgets", label: "Budgets" },
				]}
				value={view}
				onChange={setView}
			/>
			{view === "requests" && (
				<SectionCard
					title="Spend over your approval limit"
					subtitle={`${limit > 0 ? `Over ${naira(limit)}` : "Everything that needs the owner"} · ${demo ? "from every hotel" : hotelName}`}
					flush
				>
					<ul className="divide-y divide-line">
						{ownerApprovals.length === 0 && (
							<li className="px-5 py-6 text-center text-[13px] text-ink-3">
								Nothing needs the owner right now.
							</li>
						)}
						{ownerApprovals.map((a) => (
							<li key={a.id}>
								<button
									type="button"
									onClick={() => setOpen(a.id)}
									className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-subtle/60"
								>
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">
											{a.description}
										</p>
										<p className="text-xs text-ink-3">
											{a.requesterName} · {a.hotelName} · {fmtWhen(a.createdAt)}
										</p>
									</div>
									<span className="text-[13px] font-bold text-ink">
										{a.amount ? naira(a.amount) : "—"}
									</span>
									<StatusPill
										tone={
											a.status === "PENDING"
												? "warning"
												: a.status === "APPROVED"
													? "success"
													: a.status === "DECLINED"
														? "danger"
														: "info"
										}
									>
										{humanize(a.status)}
									</StatusPill>
								</button>
							</li>
						))}
					</ul>
				</SectionCard>
			)}
			{view === "all" && <DataTable columns={cols} data={rows} />}
			{view === "budgets" && !demo && (
				<NotConnected title="Budgets" what="Budgets by category" />
			)}
			{view === "budgets" && demo && (
				<SectionCard
					title="Budgets this month"
					subtitle="Set per category in Settings → Approval limits"
					bodyClassName="gap-4 pt-3"
				>
					{budgets.map((b) => (
						<div
							key={b.category}
							className="grid grid-cols-[1fr_120px_120px_100px] items-center gap-4 text-[13px]"
						>
							<div className="flex flex-col gap-1">
								<span className="text-ink">{b.category}</span>
								<ProgressBar
									value={b.spent}
									max={b.budget}
									tone={
										b.spent > b.budget
											? "danger"
											: b.spent > b.budget * 0.9
												? "warning"
												: "brand"
									}
								/>
							</div>
							<span className="text-ink-2">{naira(b.budget)}</span>
							<span className="font-semibold text-ink">{naira(b.spent)}</span>
							<StatusPill
								dot={false}
								tone={
									b.spent > b.budget
										? "danger"
										: b.spent > b.budget * 0.9
											? "warning"
											: "success"
								}
							>
								{Math.round((b.spent / b.budget) * 100)}%
							</StatusPill>
						</div>
					))}
				</SectionCard>
			)}
			<ApprovalPanel
				approval={selected}
				limit={limit}
				onClose={() => setOpen(null)}
			/>
		</>
	);
}

function PayrollTab({
	payroll,
	hotels,
}: {
	payroll: PayrollRow[];
	hotels: OwnerHotelFinance[];
}) {
	const [hotel, setHotel] = useState("");
	const [run, setRun] = useState(false);
	const { run: go, pending } = useNotConnectedAction();
	const rows = payroll.filter(
		(p) => !hotel || hotels.find((h) => h.hotelId === hotel)?.name === p.hotel,
	);
	const total = payroll.reduce((s, p) => s + p.net, 0);
	const cols: ColumnDef<PayrollRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Staff",
			cell: ({ row }) => (
				<TwoLine primary={row.original.name} secondary={row.original.role} />
			),
		},
		{ accessorKey: "hotel", header: "Hotel" },
		{
			accessorKey: "salary",
			header: "Salary",
			cell: ({ row }) => naira(row.original.salary),
		},
		{
			accessorKey: "allowances",
			header: "Allowances",
			cell: ({ row }) => naira(row.original.allowances),
		},
		{
			accessorKey: "deductions",
			header: "Deductions",
			cell: ({ row }) => (
				<span className="text-danger">−{naira(row.original.deductions)}</span>
			),
		},
		{
			accessorKey: "net",
			header: "Net pay",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.net)}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill
					tone={
						row.original.status === "PAID"
							? "success"
							: row.original.status === "PENDING"
								? "warning"
								: "danger"
					}
				>
					{humanize(row.original.status)}
				</StatusPill>
			),
		},
	];
	return (
		<>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Payroll this month"
					value={nairaShort(hotels.reduce((s, h) => s + h.payrollMonth, 0))}
					icon={BanknoteIcon}
					hint="200 staff · 18% of revenue"
				/>
				<KpiCard
					label="Paid so far"
					value={nairaShort(
						total -
							payroll
								.filter((p) => p.status !== "PAID")
								.reduce((s, p) => s + p.net, 0),
					)}
					icon={CheckIcon}
					hint={`${payroll.filter((p) => p.status === "PAID").length} of ${payroll.length} shown`}
				/>
				<KpiCard
					label="Pending"
					value={payroll.filter((p) => p.status === "PENDING").length}
					icon={WalletIcon}
					hint="Pay day 28th"
				/>
				<KpiCard
					label="On hold"
					value={payroll.filter((p) => p.status === "ON_HOLD").length}
					icon={ReceiptIcon}
					hint="Paused staff"
				/>
			</div>
			<Toolbar
				left={<HotelFilter hotels={hotels} value={hotel} onChange={setHotel} />}
				right={
					<Button className={btn.primary} onClick={() => setRun(true)}>
						Run payroll
					</Button>
				}
			/>
			<DataTable columns={cols} data={rows} />
			<ConfirmModal
				open={run}
				onOpenChange={setRun}
				title="Run payroll for this month?"
				subtitle={`${naira(total)} · ${payroll.length} people shown`}
				confirmLabel="Run payroll"
				pending={pending}
				onConfirm={() =>
					go("Payroll sent to the bank · staff get a payslip", () =>
						setRun(false),
					)
				}
			>
				<WhatHappens
					items={[
						"Net pay goes out by bank transfer",
						"Every staff member gets a payslip on WhatsApp",
						"Staff on hold are skipped",
					]}
				/>
			</ConfirmModal>
		</>
	);
}

function OrganizationsTab({
	organizations,
}: {
	organizations: OrganizationRow[];
}) {
	const [approve, setApprove] = useState<OrganizationRow | null>(null);
	const { run, pending } = useNotConnectedAction();
	const cols: ColumnDef<OrganizationRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Organization",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.name}
					secondary={`${row.original.contactName} · ${row.original.staffCount} staff`}
				/>
			),
		},
		{
			accessorKey: "creditLimit",
			header: "Credit limit",
			cell: ({ row }) => naira(row.original.creditLimit),
		},
		{
			accessorKey: "outstanding",
			header: "Outstanding",
			cell: ({ row }) => (
				<span
					className={cn(
						"font-semibold",
						row.original.outstanding > row.original.creditLimit * 0.8
							? "text-danger"
							: "text-ink",
					)}
				>
					{naira(row.original.outstanding)}
				</span>
			),
		},
		{ accessorKey: "staysThisMonth", header: "Stays this month" },
		{
			accessorKey: "termsDays",
			header: "Terms",
			cell: ({ row }) =>
				`${row.original.billingCycle} · ${row.original.termsDays} days`,
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill
					tone={row.original.status === "ACTIVE" ? "success" : "warning"}
				>
					{humanize(row.original.status)}
				</StatusPill>
			),
		},
	];
	return (
		<>
			<SectionCard
				title="Needs your approval"
				subtitle="New credit agreements and limit changes"
				count={1}
				bodyClassName="pt-2"
			>
				<div className="flex items-center gap-4 rounded-xl border border-line px-4 py-3">
					<HandshakeIcon className="size-5 text-brand" />
					<div className="min-w-0 flex-1">
						<p className="text-[13px] font-semibold text-ink">
							Shell Nigeria · raise credit limit to ₦15,000,000
						</p>
						<p className="text-xs text-ink-3">
							Asked by Tunde Bakare · Simpas Ikeja · outstanding ₦3.2M
						</p>
					</div>
					<Button
						className={btn.primary}
						onClick={() => setApprove(organizations[1])}
					>
						Review
					</Button>
				</div>
			</SectionCard>
			<DataTable columns={cols} data={organizations} />
			<ConfirmModal
				open={!!approve}
				onOpenChange={(o) => !o && setApprove(null)}
				title="Approve new credit limit?"
				subtitle={`${approve?.name} · ₦12,000,000 → ₦15,000,000`}
				confirmLabel="Approve limit"
				pending={pending}
				onConfirm={() => run("Credit limit approved", () => setApprove(null))}
				alternative={{
					label: "Decline and keep ₦12,000,000",
					onClick: () => run("Request declined", () => setApprove(null)),
				}}
			>
				<div className="flex flex-col gap-3">
					<TotalsList
						rows={[
							{ label: "Paid on time · last 6 months", value: "5 of 6" },
							{ label: "Average monthly bill", value: naira(3100000) },
							{
								label: "Outstanding now",
								value: naira(approve?.outstanding ?? 0),
								strong: true,
							},
						]}
					/>
					<Note tone="info">
						Organization stays over the daily cap still need the manager's OK.
					</Note>
				</div>
			</ConfirmModal>
		</>
	);
}

export { PanelSection, SidePanel, DetailList };
