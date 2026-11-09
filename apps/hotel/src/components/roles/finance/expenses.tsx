"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MessageCircleQuestionIcon, PlusIcon, ReceiptIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, Timeline } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	MoneyField,
	SelectField,
	TextareaField,
	TextField,
	ToggleField,
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
	markExpensePaid,
	recordExpense,
} from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type { ExpenseRow } from "@hospio/api/data/types";
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

const categories = [
	"Fuel & power",
	"Kitchen supplies",
	"Bar supplies",
	"Housekeeping",
	"Laundry",
	"Repairs",
	"Utilities",
	"Staff welfare",
	"Marketing",
	"Office",
	"Other",
];

/** Finance 3.x · Expenses: list, record, request status, answer a question. */
export function ExpensesScreen({
	expenses: initial,
	me,
	rules = defaultSpendRules,
	title = "Expenses",
}: {
	expenses: ExpenseRow[];
	me: string;
	rules?: SpendRules;
	title?: string;
}) {
	const [expenses, setExpenses] = useState(initial);
	useEffect(() => setExpenses(initial), [initial]);
	const limit = rules.limits.managerExpenseLimit;
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [answering, setAnswering] = useState(false);
	const [answer, setAnswer] = useState("");
	const { run, pending } = useAction();
	const active = tab ?? "all";
	const lists: Record<string, ExpenseRow[]> = {
		all: expenses,
		approval: expenses.filter((e) => e.status === "PENDING_APPROVAL"),
		questions: expenses.filter((e) => e.status === "QUESTION"),
		paid: expenses.filter(
			(e) => e.status === "PAID" || e.status === "APPROVED",
		),
	};
	const exp = expenses.find((e) => e.id === openId) ?? null;
	const monthTotal = expenses
		.filter((e) => e.status !== "DECLINED")
		.reduce((s, e) => s + e.amount, 0);

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
				subtitle={`${naira(monthTotal)} recorded this month · ${plural(lists.approval.length, "request")} waiting on the manager`}
			>
				<ExportButton />
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
						onChange={(k) => void setTab(k === "all" ? null : k)}
						tabs={[
							{ key: "all", label: "All", count: lists.all.length },
							{
								key: "approval",
								label: "Needs approval",
								count: lists.approval.length,
							},
							{
								key: "questions",
								label: "Questions",
								count: lists.questions.length,
							},
							{
								key: "paid",
								label: "Approved & paid",
								count: lists.paid.length,
							},
						]}
					/>
				}
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Description, category, who…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={lists[active] ?? expenses}
				search={search}
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
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	me: string;
	rules?: SpendRules;
	onSaved: (e: ExpenseRow) => void;
}) {
	const [category, setCategory] = useState("");
	const [desc, setDesc] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [paidFrom, setPaidFrom] = useState<ExpenseRow["paidFrom"]>("CASH");
	const [receipt, setReceipt] = useState(true);
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
								receipt,
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
												description: desc,
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
					setupLink="categories"
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
				<ToggleField
					label="Receipt attached"
					hint="Take a photo of the receipt · the owner can see it"
					checked={receipt}
					onChange={setReceipt}
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
