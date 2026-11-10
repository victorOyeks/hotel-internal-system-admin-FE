"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MessageCircleQuestionIcon, PlusIcon, ReceiptIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, Timeline } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	MoneyField,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import {
	answerExpense,
	exportExpenses,
	markExpensePaid,
	recordExpense,
} from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type { PageResult } from "@hospio/api/data/paging";
import type { ExpenseRow } from "@hospio/api/data/types";
import { csvName, downloadCsv } from "@hospio/ui/shared/csv";
import { useListParams } from "@hospio/ui/shared/list-params";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import {
	defaultSpendRules,
	type SpendRules,
} from "../manager/financials/panels";

export const expenseTone: Record<
	ExpenseRow["status"],
	{ label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }
> = {
	RECORDED: { label: "Recorded", tone: "grey" },
	PENDING_APPROVAL: { label: "Needs approval", tone: "warning" },
	APPROVED: { label: "Approved", tone: "success" },
	PAID: { label: "Paid", tone: "success" },
	DECLINED: { label: "Declined", tone: "danger" },
	QUESTION: { label: "Question", tone: "info" },
};

/** Used only when the hotel's list could not be read (finance-service keeps it per hotel). */
const fallbackCategories = ["Other"];

/** Finance 3.x · Expenses: list, record, request status, answer a question. */
export function ExpensesScreen({
	result,
	me,
	rules = defaultSpendRules,
	title = "Expenses",
	categories = fallbackCategories,
}: {
	/** One page of the tab, with the tab counts and totals over the whole filtered range (finance-service). */
	result: PageResult<ExpenseRow>;
	/** The hotel's active expense categories, by label. */
	categories?: string[];
	me: string;
	rules?: SpendRules;
	title?: string;
}) {
	const router = useRouter();
	const page = result.data;
	// The page's rows, patched in place after a write until the server page comes back.
	const [expenses, setExpenses] = useState(page.content);
	useEffect(() => setExpenses(page.content), [page.content]);
	const limit = rules.limits.managerExpenseLimit;
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const list = useListParams({ extra: ["tab", "category"] });
	const [answering, setAnswering] = useState(false);
	const [answer, setAnswer] = useState("");
	const [exporting, setExporting] = useState(false);
	const { run, pending } = useAction();
	const active = list.params.tab ?? "all";
	const counts = page.counts ?? {};
	const exp = expenses.find((e) => e.id === openId) ?? null;
	const monthTotal = page.totals?.recorded ?? 0;
	const doExport = async () => {
		setExporting(true);
		try {
			const r = await exportExpenses({
				tab: list.params.tab ?? undefined,
				category: list.params.category ?? undefined,
				q: list.params.q ?? undefined,
				from: list.params.from ?? undefined,
				to: list.params.to ?? undefined,
			});
			if (!r.ok) {
				toast.error(r.error);
				return;
			}
			downloadCsv(csvName(title), [
				[
					"Date",
					"Description",
					"Category",
					"Requested by",
					"Paid from",
					"Amount",
					"Status",
				],
				...r.data.rows.map((e) => [
					e.date,
					e.description,
					e.category,
					e.requestedBy,
					e.paidFrom,
					e.amount,
					expenseTone[e.status].label,
				]),
			]);
			toast.success(
				r.data.truncated
					? `Exported the first ${r.data.rows.length} of ${r.data.total} expenses`
					: `Exported ${r.data.rows.length} ${r.data.rows.length === 1 ? "expense" : "expenses"}`,
			);
		} finally {
			setExporting(false);
		}
	};

	const columns = useMemo<ColumnDef<ExpenseRow, unknown>[]>(
		() => [
			{
				accessorKey: "date",
				header: "Date",
				cell: ({ row }) => (
					<span className="text-ink-2">{fmtDay(row.original.date)}</span>
				),
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
			{
				accessorKey: "paidFrom",
				header: "Paid from",
				cell: ({ row }) => (
					<span className="capitalize text-ink-2">
						{row.original.paidFrom.toLowerCase()}
					</span>
				),
			},
			{
				accessorKey: "amount",
				header: "Amount",
				cell: ({ row }) => (
					<span className="font-semibold">{naira(row.original.amount)}</span>
				),
			},
			{
				accessorKey: "receipt",
				header: "Receipt",
				cell: ({ row }) =>
					row.original.receipt ? (
						<StatusPill dot={false} tone="success">
							Attached
						</StatusPill>
					) : (
						<StatusPill dot={false} tone="grey">
							None
						</StatusPill>
					),
				enableSorting: false,
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => (
					<StatusPill tone={expenseTone[row.original.status].tone}>
						{expenseTone[row.original.status].label}
					</StatusPill>
				),
				enableSorting: false,
			},
		],
		[],
	);

	return (
		<>
			<PageHeader
				title={title}
				subtitle={`${naira(monthTotal)} recorded in the last 90 days · ${plural(counts.approval ?? 0, "request")} waiting on the manager`}
			>
				<ExportButton
					onClick={exporting ? undefined : () => void doExport()}
					label={exporting ? "Exporting…" : "Export"}
				/>
				<button
					type="button"
					className={btn.primary}
					onClick={() => void setIsNew("1")}
				>
					<PlusIcon className="mr-1 inline size-4" /> Record expense
				</button>
			</PageHeader>
			<Toolbar
				left={
					<PillTabs
						value={active}
						onChange={(k) => list.set({ tab: k === "all" ? null : k })}
						tabs={[
							{ key: "all", label: "All", count: counts.all ?? 0 },
							{
								key: "approval",
								label: "Needs approval",
								count: counts.approval ?? 0,
							},
							{
								key: "questions",
								label: "Questions",
								count: counts.questions ?? 0,
							},
							{
								key: "paid",
								label: "Approved & paid",
								count: counts.paid ?? 0,
							},
						]}
					/>
				}
				right={
					<SearchBox
						value={list.search}
						onChange={list.setSearch}
						placeholder="Description, category, who…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={expenses}
				server={{
					page,
					onPage: list.goTo,
					sort: list.sort,
					onSort: list.setSort,
					sortKeys: {
						date: "date",
						description: "description",
						amount: "amount",
					},
				}}
				filtered={!!list.params.q || !!list.params.category}
				onClearFilters={() => {
					list.setSearch("");
					list.set({ q: null, category: null, tab: list.params.tab });
				}}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				emptyTitle={active === "all" ? "No expenses yet" : "Nothing here"}
				onRowClick={(e) => void setOpenId(e.id)}
			/>

			<SidePanel
				open={!!exp}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={exp?.description ?? ""}
				subtitle={
					exp
						? `${exp.category} · ${fmtDay(exp.date)} · by ${exp.requestedBy}`
						: undefined
				}
				icon={ReceiptIcon}
				footer={
					exp && (
						<>
							{exp.status === "QUESTION" && (
								<button
									type="button"
									className={btn.primary}
									onClick={() => setAnswering(true)}
								>
									<MessageCircleQuestionIcon className="mr-1 inline size-4" />{" "}
									Answer
								</button>
							)}
							{exp.status === "APPROVED" && (
								<button
									type="button"
									className={btn.primary}
									disabled={pending}
									onClick={() =>
										void run(
											() => markExpensePaid(exp.id, exp.paidFromRaw),
											"Marked as paid",
											() =>
												setExpenses((xs) =>
													xs.map((e) =>
														e.id === exp.id ? { ...e, status: "PAID" } : e,
													),
												),
										)
									}
								>
									Mark paid
								</button>
							)}
							{exp.status === "DECLINED" && (
								<button
									type="button"
									className={btn.secondary}
									onClick={() => {
										void setOpenId(null);
										void setIsNew("1");
									}}
								>
									Record again
								</button>
							)}
						</>
					)
				}
				footerInfo={
					exp && (
						<StatusPill tone={expenseTone[exp.status].tone}>
							{expenseTone[exp.status].label}
						</StatusPill>
					)
				}
			>
				{exp && (
					<div className="flex flex-col gap-6">
						<div className="rounded-xl border border-line px-4 py-3">
							<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
								Amount
							</p>
							<p className="text-2xl font-bold text-ink">{naira(exp.amount)}</p>
							<p className="text-xs text-ink-3">
								Paid from {exp.paidFrom.toLowerCase()}
								{exp.receipt ? " · receipt attached" : " · no receipt"}
							</p>
						</div>
						{exp.status === "QUESTION" && (
							<Note tone="info">Question from the approver: “{exp.note}”</Note>
						)}
						{exp.status === "DECLINED" && (
							<Note tone="danger">Declined · {exp.note}</Note>
						)}
						{exp.status === "PENDING_APPROVAL" && (
							<Note tone="warning">
								{(exp.approverLevel ??
									(limit > 0 && exp.amount > limit ? "OWNER" : "MANAGER")) ===
								"OWNER"
									? `Over ${naira(limit)} · waiting on ${rules.ownerName}.`
									: "Waiting on the manager."}
								{exp.note ? ` “${exp.note}”` : ""}
							</Note>
						)}
						<PanelSection title="Details">
							<DetailList
								columns={2}
								items={[
									{ label: "Category", value: exp.category },
									{ label: "Requested by", value: exp.requestedBy },
									{
										label: "Needs",
										value:
											exp.status === "RECORDED"
												? "Nobody · recorded"
												: (exp.approverLevel ??
															(limit > 0 && exp.amount > limit
																? "OWNER"
																: "MANAGER")) === "OWNER"
													? "Owner"
													: "Manager",
									},
									{
										label: "Receipt",
										value: exp.receipt ? "Photo attached" : "None",
									},
								]}
							/>
						</PanelSection>
						<PanelSection title="History">
							<Timeline
								items={[
									{
										at: fmtDay(exp.date),
										by: exp.requestedBy,
										text: "Recorded",
									},
									...(exp.status === "PENDING_APPROVAL"
										? [{ at: "now", text: "Waiting for approval" }]
										: exp.status === "QUESTION"
											? [
													{
														at: fmtDay(exp.date),
														by: rules.ownerName,
														text: `Asked: ${exp.note}`,
													},
												]
											: exp.status === "DECLINED"
												? [
														{
															at: fmtDay(exp.date),
															by:
																exp.approverLevel === "OWNER"
																	? rules.ownerName
																	: "Manager",
															text: `Declined · ${exp.note}`,
														},
													]
												: exp.status === "PAID" || exp.status === "APPROVED"
													? [
															{
																at: fmtDay(exp.date),
																by:
																	exp.approverLevel === "OWNER"
																		? rules.ownerName
																		: "Manager",
																text: "Approved",
															},
														]
													: []),
								]}
							/>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			{exp && (
				<Modal
					open={answering}
					onOpenChange={setAnswering}
					title="Answer the question"
					subtitle={`“${exp.note}”`}
					icon={MessageCircleQuestionIcon}
					size="confirm"
					footer={
						<>
							<button
								type="button"
								className={btn.secondary}
								onClick={() => setAnswering(false)}
							>
								Cancel
							</button>
							<button
								type="button"
								className={btn.primary}
								disabled={!answer || pending}
								onClick={() =>
									void run(
										() => answerExpense(exp.id, answer),
										"Answer sent · back to the approver",
										() => {
											setExpenses((xs) =>
												xs.map((e) =>
													e.id === exp.id
														? { ...e, status: "PENDING_APPROVAL", note: answer }
														: e,
												),
											);
											setAnswering(false);
											setAnswer("");
										},
									)
								}
							>
								Send answer
							</button>
						</>
					}
				>
					<TextareaField
						label="Your answer"
						value={answer}
						onChange={setAnswer}
						rows={3}
					/>
				</Modal>
			)}

			<RecordExpensePanel
				open={isNew === "1"}
				onOpenChange={(o) => !o && void setIsNew(null)}
				me={me}
				rules={rules}
				categories={categories}
				onSaved={(e) => {
					setExpenses((xs) => [e, ...xs]);
					void setIsNew(null);
					void setOpenId(e.id);
				}}
			/>
		</>
	);
}

/** 3.2 Record expense + 3.3 over limit notice. */
export function RecordExpensePanel({
	open,
	onOpenChange,
	me,
	rules = defaultSpendRules,
	categories = fallbackCategories,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	me: string;
	rules?: SpendRules;
	categories?: string[];
	onSaved: (e: ExpenseRow) => void;
}) {
	const [category, setCategory] = useState("");
	const [desc, setDesc] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [paidFrom, setPaidFrom] = useState<ExpenseRow["paidFrom"]>("CASH");
	const [note, setNote] = useState("");
	const { run, pending } = useAction();
	const limit = rules.limits.managerExpenseLimit;
	const amt = typeof amount === "number" ? amount : 0;
	// Staff spend up to the limit needs a manager; above it, the owner decides.
	const level = limit > 0 && amt > limit ? "owner" : "manager";
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Record an expense"
			subtitle="Anything paid out of a till, the safe or the bank"
			icon={ReceiptIcon}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!category || !desc || amt <= 0 || pending}
						onClick={() => {
							const demoRow: ExpenseRow = {
								id: `ex-${Date.now()}`,
								date: format(new Date(), "yyyy-MM-dd"),
								category,
								description: desc,
								amount: amt,
								paidFrom,
								requestedBy: me,
								status: "PENDING_APPROVAL",
								receipt: false,
								note: note || undefined,
								approverLevel: level === "owner" ? "OWNER" : "MANAGER",
							};
							void run(
								() =>
									withDeliveries(
										recordExpense(
											{
												category,
												amount: amt,
												description: note.trim()
													? `${desc} · ${note.trim()}`
													: desc,
												paidFrom: paidFrom === "CASH" ? "TILL" : paidFrom,
											},
											demoRow,
										),
										"Expense",
									),
								`Sent to ${level === "owner" ? rules.ownerName : "the manager"} to approve`,
								(row) => {
									onSaved(row);
									setDesc("");
									setAmount("");
									setNote("");
								},
							);
						}}
					>
						Send for approval
					</button>
				</>
			}
			footerInfo={
				<span className="flex items-center gap-2">
					<ManagerMark />{" "}
					{level === "owner"
						? `Over ${naira(limit)} · goes to ${rules.ownerName}`
						: `Up to ${naira(limit)} · a manager approves`}
				</span>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Category"
					value={category}
					onChange={setCategory}
					options={categories}
					hint="The hotel's list · a manager keeps it in Financials"
					required
				/>
				<TextField
					label="What for"
					value={desc}
					onChange={setDesc}
					placeholder="e.g. Diesel · 400 litres"
					required
				/>
				<MoneyField
					label="Amount"
					value={amount}
					onChange={setAmount}
					required
				/>
				<Note tone="warning">
					{level === "owner"
						? `Spend over ${naira(limit)} goes to ${rules.ownerName}.`
						: "A manager approves this."}{" "}
					Nothing is paid until they do.
				</Note>
				<ChoiceCards
					label="Paid from"
					value={paidFrom}
					onChange={setPaidFrom}
					columns={3}
					options={[
						{ value: "CASH", label: "Cash / till" },
						{ value: "TRANSFER", label: "Bank transfer" },
						{ value: "CARD", label: "Company card" },
					]}
				/>
				<TextareaField
					label="Note"
					value={note}
					onChange={setNote}
					rows={2}
					placeholder="Why now, which supplier…"
				/>
			</div>
		</SidePanel>
	);
}
