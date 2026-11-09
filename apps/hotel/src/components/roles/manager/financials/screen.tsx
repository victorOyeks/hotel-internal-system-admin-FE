"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowDownLeftIcon,
	ArrowUpRightIcon,
	BanknoteIcon,
	PlusIcon,
	ReceiptIcon,
	TrendingUpIcon,
	WalletIcon,
	PiggyBankIcon,
} from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	fmtDay,
	fmtTime,
	fmtWhen,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { markExpensePaid } from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	ExpenseRow,
	MoneyTodayRow,
	OutletSalesDayRow,
	MonthSummaryRow,
	SeriesPointRow,
	TillRow,
	TransactionRow,
} from "@hospio/api/data/types";
import type {
	demoBills,
	demoBudget,
	demoIncomeSources,
} from "@hospio/api/demo/fixtures/manager-ops";
import { cn } from "@hospio/ui/utils";
import {
	EndOfDayCashModal,
	RecordExpensePanel,
	ReviewRequestPanel,
	SendToOwnerModal,
	type SpendRules,
	expenseLabel,
	expenseTone,
} from "./panels";
import { OutletSalesCard } from "../outlet-sales";

type Tab = "overview" | "expenses" | "transactions" | "requests" | "tills";

export type FinancialsProps = {
	hotelName: string;
	expenses: ExpenseRow[];
	tills: TillRow[];
	transactions: TransactionRow[];
	today: MoneyTodayRow;
	/** What the restaurant and bar sold today; sales, not money received. */
	outletSales?: OutletSalesDayRow | null;
	month: MonthSummaryRow;
	/** Budget, income sources and bills have no API yet: null shows "Not connected yet". */
	budget: typeof demoBudget | null;
	income: typeof demoIncomeSources | null;
	bills: typeof demoBills | null;
	week: SeriesPointRow[];
	categories: string[];
	rules: SpendRules;
};

function NotConnected({ what }: { what: string }) {
	return (
		<EmptyState
			title="Not connected yet"
			hint={`${what} are not connected to the backend yet.`}
		/>
	);
}

export function FinancialsScreen(p: FinancialsProps) {
	const [tab] = useQueryState("tab");
	const [isNew, setIsNew] = useQueryState("new");
	const [openId, setOpenId] = useQueryState("open");
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [cash, setCash] = useState(false);
	const [toOwner, setToOwner] = useState<ExpenseRow | null>(null);
	const { run } = useAction();
	const limit = p.rules.limits.managerExpenseLimit;
	const active = (tab as Tab) || "overview";
	const requests = p.expenses.filter(
		(e) => e.status === "PENDING_APPROVAL" || e.status === "QUESTION",
	);
	const reviewing = p.expenses.find((e) => e.id === openId) ?? null;
	const maxWeek = Math.max(
		1,
		...p.week.map((w) => Math.max(w.revenue, w.expenses)),
	);

	const expenseColumns: ColumnDef<ExpenseRow, unknown>[] = [
		{
			header: "Date",
			accessorKey: "date",
			cell: ({ row }) => (
				<span className="text-ink-2">{fmtDay(row.original.date)}</span>
			),
		},
		{
			header: "Expense",
			accessorKey: "description",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.description}
					secondary={`${row.original.category} · ${row.original.requestedBy}`}
				/>
			),
		},
		{
			header: "Paid from",
			accessorKey: "paidFrom",
			cell: ({ row }) => (
				<span className="capitalize text-ink-2">
					{row.original.paidFrom.toLowerCase()}
				</span>
			),
		},
		{
			header: "Amount",
			accessorKey: "amount",
			cell: ({ row }) => (
				<span className="font-semibold text-ink">
					{naira(row.original.amount)}
				</span>
			),
		},
		{
			header: "Receipt",
			accessorKey: "receipt",
			cell: ({ row }) =>
				row.original.receipt ? (
					<StatusPill tone="success" dot={false}>
						Attached
					</StatusPill>
				) : (
					<span className="text-xs text-ink-3">None</span>
				),
		},
		{
			header: "Status",
			accessorKey: "status",
			cell: ({ row }) => (
				<StatusPill tone={expenseTone[row.original.status]}>
					{expenseLabel[row.original.status]}
				</StatusPill>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<RowActions
					actions={[
						{ label: "Review", onClick: () => setOpenId(row.original.id) },
						{
							label: "Mark as paid",
							onClick: () =>
								run(
									() =>
										markExpensePaid(row.original.id, row.original.paidFromRaw),
									"Marked as paid",
								),
							disabled:
								row.original.status !== "APPROVED" &&
								row.original.status !== "RECORDED",
						},
						{
							label: "Send to owner",
							onClick: () => setToOwner(row.original),
							managerOnly: true,
							disabled:
								row.original.status !== "PENDING_APPROVAL" ||
								row.original.approverLevel === "OWNER" ||
								!row.original.approvalId,
						},
					]}
				/>
			),
		},
	];

	const txColumns: ColumnDef<TransactionRow, unknown>[] = [
		{
			header: "When",
			accessorKey: "at",
			cell: ({ row }) => (
				<span className="text-ink-2">{fmtWhen(row.original.at)}</span>
			),
		},
		{
			header: "Transaction",
			accessorKey: "description",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.description}
					secondary={`${row.original.reference} · by ${row.original.by}`}
				/>
			),
		},
		{
			header: "Type",
			accessorKey: "kind",
			cell: ({ row }) => (
				<StatusPill
					dot={false}
					tone={
						row.original.kind === "PAYMENT"
							? "success"
							: row.original.kind === "REFUND"
								? "danger"
								: row.original.kind === "DEPOSIT"
									? "info"
									: "warning"
					}
				>
					{row.original.kind.toLowerCase()}
				</StatusPill>
			),
		},
		{ header: "Method", accessorKey: "method" },
		{
			header: "Amount",
			accessorKey: "amount",
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

	const tillColumns: ColumnDef<TillRow, unknown>[] = [
		{
			header: "Till",
			accessorKey: "role",
			cell: ({ row }) => (
				<TwoLine
					primary={`${row.original.role.replace("_", " ").toLowerCase()} till`}
					secondary={`${row.original.openedBy} · opened ${fmtWhen(row.original.openedAt)}`}
					className="capitalize"
				/>
			),
		},
		{
			header: "Float",
			accessorKey: "openingFloat",
			cell: ({ row }) => naira(row.original.openingFloat),
		},
		{
			header: "Cash in",
			accessorKey: "cashIn",
			cell: ({ row }) => naira(row.original.cashIn),
		},
		{
			header: "Expected",
			accessorKey: "expected",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.expected)}</span>
			),
		},
		{
			header: "Counted",
			accessorKey: "counted",
			cell: ({ row }) =>
				row.original.counted != null ? (
					naira(row.original.counted)
				) : (
					<span className="text-ink-3">—</span>
				),
		},
		{
			header: "Variance",
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
			header: "Status",
			accessorKey: "status",
			cell: ({ row }) => (
				<StatusPill tone={row.original.status === "OPEN" ? "info" : "grey"}>
					{row.original.status === "OPEN"
						? "Open"
						: `Closed ${fmtTime(row.original.closedAt)}`}
				</StatusPill>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Financials"
				subtitle={`${p.hotelName} · ${new Date().toLocaleString("en-NG", { month: "long", year: "numeric" })}, month to date`}
			>
				<Button
					variant="outline"
					className={btn.secondary}
					onClick={() => setCash(true)}
				>
					<BanknoteIcon className="size-4" /> End-of-day cash
				</Button>
				<Button className={btn.primary} onClick={() => setIsNew("expense")}>
					<PlusIcon className="size-4" /> Record expense
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Net profit"
					value={nairaShort(p.month.netProfit)}
					icon={PiggyBankIcon}
					hint={`${p.month.margin}% margin · month to date`}
				/>
				<KpiCard
					label="Revenue"
					value={nairaShort(p.month.revenue)}
					icon={TrendingUpIcon}
					pill={
						p.month.lastMonth > 0 ? (
							<StatusPill
								tone={
									p.month.revenue >= p.month.lastMonth ? "success" : "warning"
								}
								dot={false}
							>
								{p.month.revenue >= p.month.lastMonth ? "↑" : "↓"}{" "}
								{Math.abs(
									Math.round(
										((p.month.revenue - p.month.lastMonth) /
											p.month.lastMonth) *
											100,
									),
								)}
								%
							</StatusPill>
						) : undefined
					}
					hint={`${nairaShort(p.month.lastMonth)} last month`}
				/>
				<KpiCard
					label="Expenses"
					value={nairaShort(p.month.expenses)}
					icon={ReceiptIcon}
					pill={
						p.month.budget ? (
							<StatusPill tone="warning" dot={false}>
								{Math.round((p.month.expenses / p.month.budget) * 100)}% of
								budget
							</StatusPill>
						) : undefined
					}
					hint={
						p.month.budget ? (
							<>
								<ProgressBar
									value={p.month.expenses}
									max={p.month.budget}
									tone="warning"
									className="mb-1"
								/>
								Budget {nairaShort(p.month.budget)} ·{" "}
								{nairaShort(p.month.budget - p.month.expenses)} left
							</>
						) : (
							"Month to date"
						)
					}
				/>
				<KpiCard
					label="Taken today"
					value={nairaShort(p.today.revenue)}
					icon={WalletIcon}
					pill={<StatusPill tone="success">live</StatusPill>}
					hint={
						p.month.unpaidGuests != null
							? `${naira(p.month.unpaidTotal ?? 0)} still unpaid by ${p.month.unpaidGuests} guests`
							: `${plural(p.today.paymentsCount, "payment")} today`
					}
				/>
			</div>

			<Toolbar
				left={
					<PillTabs<Tab>
						param="tab"
						tabs={[
							{ key: "overview", label: "Overview" },
							{ key: "expenses", label: "Expenses", count: p.expenses.length },
							{ key: "transactions", label: "Transactions" },
							{
								key: "requests",
								label: "Spend requests",
								count: requests.length,
							},
							{
								key: "tills",
								label: "Tills",
								count: p.tills.filter((t) => t.status === "OPEN").length,
							},
						]}
					/>
				}
				right={
					active !== "overview" && (
						<>
							{active === "expenses" && (
								<FilterSelect
									value={category}
									onChange={setCategory}
									all="All categories"
									options={p.categories.map((c) => ({ value: c, label: c }))}
								/>
							)}
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Search…"
							/>
							<ExportButton />
						</>
					)
				}
			/>

			{active === "overview" && (
				<>
					<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
						<SectionCard
							title="Spend waiting for your OK"
							subtitle={`Requests from your team · you approve up to ${naira(limit)}`}
							action={{
								label: "All requests",
								href: "/dashboard/financials?tab=requests",
							}}
						>
							{requests.length === 0 ? (
								<EmptyState title="Nothing waiting" />
							) : (
								<ul>
									{requests.map((e, i) => (
										<li
											key={e.id}
											className={cn(
												"flex items-center gap-3 py-[10px]",
												i < requests.length - 1 && "border-b border-line",
											)}
										>
											<span className="flex size-8 items-center justify-center rounded-[10px] bg-subtle text-ink-2">
												<ReceiptIcon className="size-4" />
											</span>
											<div className="min-w-0 flex-1">
												<p className="truncate text-[13px] font-semibold text-ink">
													{e.description}
												</p>
												<p
													className={cn(
														"truncate text-xs",
														e.approverLevel === "OWNER"
															? "text-warning"
															: "text-ink-3",
													)}
												>
													{e.approverLevel === "OWNER"
														? `Over your limit · with ${p.rules.ownerName}`
														: `${e.requestedBy} · ${e.category}`}
												</p>
											</div>
											<span className="text-[13px] font-semibold text-ink">
												{naira(e.amount)}
											</span>
											{e.status === "QUESTION" ? (
												<StatusPill tone="warning">Question asked</StatusPill>
											) : (
												<Button
													size="sm"
													className={cn(
														btn.small,
														i === 0 ? btn.primary : btn.secondary,
													)}
													onClick={() => setOpenId(e.id)}
												>
													Review
												</Button>
											)}
										</li>
									))}
								</ul>
							)}
						</SectionCard>
						<SectionCard
							title="Money taken today"
							subtitle={new Date().toLocaleDateString("en-NG", {
								weekday: "short",
								day: "numeric",
								month: "short",
							})}
							bodyClassName="gap-3 pt-2"
						>
							<p className="text-[30px] font-bold leading-none text-ink">
								{naira(p.today.revenue)}
							</p>
							{(["CARD", "TRANSFER", "CASH"] as const).map((m) => (
								<div key={m} className="flex flex-col gap-1">
									<div className="flex justify-between text-[13px]">
										<span className="text-ink-2">
											{m === "CARD"
												? "Card / POS"
												: m === "TRANSFER"
													? "Transfer"
													: "Cash"}
										</span>
										<span className="font-semibold text-ink">
											{naira(p.today.byMethod[m] ?? 0)}
										</span>
									</div>
									<ProgressBar
										value={p.today.byMethod[m] ?? 0}
										max={p.today.revenue}
									/>
								</div>
							))}
							{(p.today.unattachedCash ?? 0) > 0 && (
								<p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning">
									{naira(p.today.unattachedCash ?? 0)} cash was taken with no
									till open
								</p>
							)}
							<div className="mt-1 flex items-center gap-3 rounded-xl border border-line p-3">
								<BanknoteIcon className="size-5 text-ink-2" />
								<div className="min-w-0 flex-1">
									<p className="text-[13px] font-semibold text-ink">
										Count the tills
									</p>
									<p className="text-xs text-ink-3">
										{p.today.openTills} open · {naira(p.today.cashInTills)} cash
										expected
									</p>
								</div>
								<Button
									size="sm"
									className={`${btn.primary} ${btn.small}`}
									onClick={() => setCash(true)}
								>
									Start
								</Button>
							</div>
						</SectionCard>
						<OutletSalesCard sales={p.outletSales} />
					</div>

					<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
						<SectionCard
							title="Spend vs budget"
							subtitle={
								p.budget
									? `This month · ${nairaShort(p.month.expenses)} of ${nairaShort(p.month.budget ?? 0)}`
									: "Budgets"
							}
							action={{
								label: "Expenses",
								href: "/dashboard/financials?tab=expenses",
							}}
							bodyClassName="gap-3 pt-2"
						>
							{!p.budget ? (
								<NotConnected what="Budgets" />
							) : (
								p.budget.map((b) => {
									const pct = Math.round((b.spent / b.budget) * 100);
									return (
										<div key={b.category} className="flex flex-col gap-1">
											<div className="flex items-center justify-between text-[13px]">
												<span className="font-medium text-ink">
													{b.category}
												</span>
												<span
													className={cn(
														"text-xs",
														pct > 100
															? "font-semibold text-danger"
															: "text-ink-3",
													)}
												>
													{pct}%{" "}
													<span className="font-semibold text-ink">
														{nairaShort(b.spent)} of {nairaShort(b.budget)}
													</span>
												</span>
											</div>
											<ProgressBar
												value={b.spent}
												max={b.budget}
												tone={
													pct > 100 ? "danger" : pct >= 95 ? "warning" : "brand"
												}
											/>
										</div>
									);
								})
							)}
						</SectionCard>
						<div className="flex flex-col gap-4">
							<SectionCard
								title="Where income came from"
								subtitle={`${nairaShort(p.month.revenue)} this month`}
								bodyClassName="pt-1"
							>
								{!p.income ? (
									<NotConnected what="Income sources" />
								) : (
									p.income.map((s) => (
										<div
											key={s.source}
											className="flex items-center justify-between border-b border-line py-2 text-[13px] last:border-b-0"
										>
											<span className="text-ink">{s.source}</span>
											<span>
												<span className="mr-2 text-xs text-ink-3">
													{s.pct}%
												</span>
												<span className="font-semibold text-ink">
													{nairaShort(s.amount)}
												</span>
											</span>
										</div>
									))
								)}
							</SectionCard>
							<SectionCard
								title="Bills to pay"
								subtitle="This hotel's share · due soon"
								bodyClassName="pt-1"
							>
								{!p.bills ? (
									<NotConnected what="Bills" />
								) : (
									p.bills.map((b) => (
										<div
											key={b.name}
											className="flex items-center justify-between border-b border-line py-2 text-[13px] last:border-b-0"
										>
											<div>
												<p className="font-medium text-ink">{b.name}</p>
												<p
													className={cn(
														"text-xs",
														b.note ? "text-warning" : "text-ink-3",
													)}
												>
													{b.note ?? `Due ${fmtDay(b.due)}`}
												</p>
											</div>
											<span className="font-semibold text-ink">
												{naira(b.amount)}
											</span>
										</div>
									))
								)}
							</SectionCard>
						</div>
					</div>

					<div className="grid gap-4 xl:grid-cols-[380px_1fr]">
						<SectionCard
							title="Last 7 days"
							subtitle="Revenue vs expenses"
							bodyClassName="pt-2"
						>
							<div className="flex h-36 items-end gap-2">
								{p.week.map((w) => (
									<div
										key={w.date}
										className="flex flex-1 flex-col items-center gap-1"
									>
										<div className="flex h-28 w-full items-end gap-[2px]">
											<div
												className="flex-1 rounded-t-[3px] bg-brand"
												style={{ height: `${(w.revenue / maxWeek) * 100}%` }}
												title={naira(w.revenue)}
											/>
											<div
												className="flex-1 rounded-t-[3px] bg-[#dbab00]"
												style={{ height: `${(w.expenses / maxWeek) * 100}%` }}
												title={naira(w.expenses)}
											/>
										</div>
										<span className="text-[10px] text-ink-3">
											{new Date(`${w.date}T12:00:00Z`).toLocaleDateString(
												"en-GB",
												{ weekday: "short", timeZone: "UTC" },
											)}
										</span>
									</div>
								))}
							</div>
							<div className="mt-2 flex gap-4 text-[11px] text-ink-3">
								<span className="flex items-center gap-1">
									<span className="size-2 rounded-sm bg-brand" />
									Revenue
								</span>
								<span className="flex items-center gap-1">
									<span className="size-2 rounded-sm bg-[#dbab00]" />
									Expenses
								</span>
							</div>
						</SectionCard>
						<SectionCard
							title="Latest money in and out"
							subtitle={`${p.hotelName} only`}
							action={{
								label: "All transactions",
								href: "/dashboard/financials?tab=transactions",
							}}
							flush
						>
							<ul>
								{p.transactions.slice(0, 5).map((t) => (
									<li
										key={t.id}
										className="flex items-center gap-3 border-t border-line px-5 py-3"
									>
										<span
											className={cn(
												"flex size-8 items-center justify-center rounded-[10px]",
												t.amount < 0
													? "bg-danger-soft text-danger"
													: "bg-success-soft text-success",
											)}
										>
											{t.amount < 0 ? (
												<ArrowUpRightIcon className="size-4" />
											) : (
												<ArrowDownLeftIcon className="size-4" />
											)}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-[13px] font-semibold text-ink">
												{t.description}
											</p>
											<p className="text-xs text-ink-3">
												{t.method} · {fmtTime(t.at)} · {t.by}
											</p>
										</div>
										<span
											className={cn(
												"text-[13px] font-semibold",
												t.amount < 0 ? "text-danger" : "text-success",
											)}
										>
											{t.amount < 0 ? "−" : "+"}
											{naira(Math.abs(t.amount))}
										</span>
									</li>
								))}
							</ul>
						</SectionCard>
					</div>
				</>
			)}

			{active === "expenses" && (
				<DataTable
					columns={expenseColumns}
					data={p.expenses.filter((e) => !category || e.category === category)}
					search={search}
					onRowClick={(e) => setOpenId(e.id)}
					emptyTitle="No expenses yet"
					footer={
						<span>
							{plural(p.expenses.length, "expense")} ·{" "}
							{naira(p.expenses.reduce((s, e) => s + e.amount, 0))}
						</span>
					}
				/>
			)}
			{active === "transactions" && (
				<DataTable
					columns={txColumns}
					data={p.transactions}
					search={search}
					emptyTitle="No transactions"
				/>
			)}
			{active === "requests" && (
				<DataTable
					columns={expenseColumns
						.filter((c) => c.id !== "actions")
						.concat([
							{
								id: "review",
								header: "",
								enableSorting: false,
								cell: ({ row }) => (
									<div className="text-right">
										<Button
											size="sm"
											className={`${btn.primary} ${btn.small}`}
											onClick={() => setOpenId(row.original.id)}
										>
											Review
										</Button>
									</div>
								),
							},
						])}
					data={requests}
					search={search}
					emptyTitle="No spend requests waiting"
					emptyHint="Requests from your team land here the moment they are raised."
				/>
			)}
			{active === "tills" && (
				<>
					<DataTable
						columns={tillColumns}
						data={p.tills}
						search={search}
						emptyTitle="No tills today"
					/>
					<p className="text-xs text-ink-3">
						Tills are opened by staff on the tablet with the float from{" "}
						<Link
							href="/dashboard/hotel-setup"
							className="font-semibold text-brand"
						>
							Hotel setup → Money
						</Link>
						.
					</p>
				</>
			)}

			<RecordExpensePanel
				open={isNew === "expense"}
				categories={p.categories}
				rules={p.rules}
				onClose={() => setIsNew(null)}
			/>
			<ReviewRequestPanel
				expense={reviewing}
				rules={p.rules}
				onClose={() => setOpenId(null)}
			/>
			<EndOfDayCashModal
				open={cash}
				tills={p.tills}
				onClose={() => setCash(false)}
			/>
			<SendToOwnerModal
				expense={toOwner}
				rules={p.rules}
				onClose={() => setToOwner(null)}
			/>
		</>
	);
}
