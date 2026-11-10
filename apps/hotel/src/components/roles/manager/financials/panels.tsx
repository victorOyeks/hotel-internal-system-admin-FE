"use client";

import {
	BanknoteIcon,
	CheckCircle2Icon,
	ReceiptIcon,
	SendIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { fmtLongDate, naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useAction } from "@hospio/api/actions/use-action";
import {
	decideApproval,
	escalateApproval,
} from "@hospio/api/actions/approvals";
import { closeTill, recordExpense } from "@hospio/api/actions/finance";
import type {
	ApprovalLimits,
	ExpenseRow,
	TillRow,
} from "@hospio/api/data/types";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";

/** Who decides what, from the hotel's own settings (Hotel setup → Approval limits). */
export type SpendRules = { limits: ApprovalLimits; ownerName: string };
export const defaultSpendRules: SpendRules = {
	limits: {
		managerExpenseLimit: 500_000,
		ownerExpenseLimit: 0,
		discountPct: 10,
		refundsNeedOwner: false,
	},
	ownerName: "the owner",
};

export const expenseTone = {
	RECORDED: "grey",
	PENDING_APPROVAL: "warning",
	APPROVED: "success",
	DECLINED: "danger",
	QUESTION: "info",
	PAID: "success",
} as const;
export const expenseLabel = {
	RECORDED: "Recorded",
	PENDING_APPROVAL: "Waiting for OK",
	APPROVED: "Approved",
	DECLINED: "Declined",
	QUESTION: "Question asked",
	PAID: "Paid",
} as const;

export function RecordExpensePanel({
	open,
	categories,
	rules,
	onClose,
}: {
	open: boolean;
	categories: string[];
	rules: SpendRules;
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const limit = rules.limits.managerExpenseLimit;
	const [form, setForm] = useState({
		category: "",
		description: "",
		amount: "" as number | "",
		paidFrom: "CASH" as ExpenseRow["paidFrom"],
		date: new Date().toISOString().slice(0, 10),
		receipt: false,
		note: "",
		supplier: "",
	});
	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [k]: v }));
	const amount = form.amount === "" ? 0 : form.amount;
	const level = limit > 0 && amount > limit ? "owner" : "none";
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={ReceiptIcon}
			title="Record expense"
			subtitle="Money that left the hotel today"
			footerInfo={
				level === "owner"
					? `Over ${naira(limit)} · goes to ${rules.ownerName}`
					: `Up to ${naira(limit)} · recorded straight away`
			}
			footer={
				<>
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={onClose}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !form.category || !amount}
						onClick={() =>
							run(
								() =>
									withDeliveries(
										recordExpense({
											category: form.category,
											amount,
											description: [
												form.description || form.category,
												form.supplier.trim() && `to ${form.supplier.trim()}`,
												form.note.trim(),
											]
												.filter(Boolean)
												.join(" · "),
											paidFrom:
												form.paidFrom === "CASH" ? "TILL" : form.paidFrom,
											expenseDate: form.date,
										}),
										"Expense",
									),
								level === "owner"
									? `Sent to ${rules.ownerName} for approval`
									: "Expense recorded",
								() => {
									setForm((f) => ({
										...f,
										category: "",
										description: "",
										amount: "",
										note: "",
										supplier: "",
									}));
									onClose();
								},
							)
						}
					>
						{level === "owner" ? "Send to owner" : "Record expense"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Category"
					value={form.category}
					onChange={(v) => set("category", v)}
					options={categories}
					hint="The hotel's list · a manager keeps it in Financials → Categories & budgets"
					required
				/>
				<TextField
					label="What for"
					value={form.description}
					onChange={(v) => set("description", v)}
					placeholder="Diesel · 400 litres"
					required
				/>
				<FieldRow>
					<MoneyField
						label="Amount"
						value={form.amount}
						onChange={(v) => set("amount", v)}
						required
					/>
					<TextField
						label="Date"
						type="date"
						value={form.date}
						onChange={(v) => set("date", v)}
					/>
				</FieldRow>
				<ChoiceCards
					label="Paid from"
					value={form.paidFrom}
					onChange={(v) => set("paidFrom", v)}
					columns={3}
					options={[
						{ value: "CASH", label: "Cash", hint: "From a till" },
						{ value: "TRANSFER", label: "Transfer", hint: "Hotel account" },
						{ value: "CARD", label: "Card", hint: "Company card" },
					]}
				/>
				<TextField
					label="Paid to (optional)"
					value={form.supplier}
					onChange={(v) => set("supplier", v)}
					placeholder="NNPC Ikeja"
				/>
				<TextareaField
					label="Note"
					value={form.note}
					onChange={(v) => set("note", v)}
					placeholder="Anything the owner should know"
				/>
				{level === "owner" && (
					<Note tone="danger">
						Over {naira(limit)}: {rules.ownerName} must approve before it is
						paid. You will be told when they decide.
					</Note>
				)}
			</div>
		</SidePanel>
	);
}

export function ReviewRequestPanel({
	expense,
	rules,
	onClose,
}: {
	expense: ExpenseRow | null;
	rules: SpendRules;
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [mode, setMode] = useState<"review" | "decline" | "ask">("review");
	const [text, setText] = useState("");
	const close = () => {
		setMode("review");
		setText("");
		onClose();
	};
	const limit = rules.limits.managerExpenseLimit;
	const overOwner =
		expense?.approverLevel === "OWNER" ||
		(limit > 0 && (expense?.amount ?? 0) > limit);
	const withOwner = expense?.approverLevel === "OWNER";
	const decide = (
		decision: "APPROVED" | "DECLINED" | "QUESTION",
		message: string,
		note?: string,
	) =>
		expense?.approvalId
			? run(
					() =>
						withDeliveries(
							decideApproval(expense.approvalId as string, decision, note),
							"Approval",
						),
					message,
					close,
				)
			: run(
					async () => ({
						ok: false as const,
						error: "This request has no approval to decide yet",
					}),
					message,
				);
	return (
		<SidePanel
			open={!!expense}
			onOpenChange={(o) => !o && close()}
			icon={BanknoteIcon}
			title="Review spend request"
			subtitle={
				expense ? `${expense.requestedBy} · ${fmtLongDate(expense.date)}` : ""
			}
			footerInfo={
				withOwner
					? `With ${rules.ownerName} · only they can approve`
					: overOwner
						? `Over ${naira(limit)} · only ${rules.ownerName} can approve`
						: `You approve up to ${naira(limit)}`
			}
			footer={
				!expense ||
				(expense.status !== "PENDING_APPROVAL" &&
					expense.status !== "QUESTION") ? undefined : mode === "review" ? (
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setMode("ask")}
						>
							Ask a question
						</Button>
						<Button
							variant="outline"
							className={btn.dangerSoft}
							onClick={() => setMode("decline")}
						>
							Decline
						</Button>
						{withOwner ? null : overOwner ? (
							<Button
								className={btn.primary}
								disabled={pending || !expense?.approvalId}
								onClick={() =>
									expense?.approvalId &&
									run(
										() =>
											withDeliveries(
												escalateApproval(expense.approvalId as string),
												"Approval",
											),
										`Sent to ${rules.ownerName}`,
										close,
									)
								}
							>
								<SendIcon className="size-4" /> Send to owner
							</Button>
						) : (
							<Button
								className={btn.primary}
								disabled={pending}
								onClick={() =>
									decide("APPROVED", `${naira(expense?.amount ?? 0)} approved`)
								}
							>
								<CheckCircle2Icon className="size-4" /> Approve
							</Button>
						)}
					</>
				) : (
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setMode("review")}
						>
							Back
						</Button>
						<Button
							className={mode === "decline" ? btn.danger : btn.primary}
							disabled={pending || !text}
							onClick={() =>
								decide(
									mode === "decline" ? "DECLINED" : "QUESTION",
									mode === "decline"
										? "Request declined · they are told why"
										: "Question sent",
									text,
								)
							}
						>
							{mode === "decline" ? "Decline request" : "Send question"}
						</Button>
					</>
				)
			}
		>
			{expense && (
				<div className="flex flex-col gap-5">
					<div className="rounded-xl bg-subtle/70 p-4">
						<p className="text-[26px] font-bold leading-none text-ink">
							{naira(expense.amount)}
						</p>
						<p className="mt-1 text-[13px] text-ink-2">{expense.description}</p>
					</div>
					<DetailList
						columns={2}
						items={[
							{ label: "Category", value: expense.category },
							{
								label: "Paid from",
								value:
									expense.paidFrom === "CASH"
										? "Cash"
										: expense.paidFrom === "CARD"
											? "Card"
											: "Transfer",
							},
							{ label: "Requested by", value: expense.requestedBy },
							{
								label: "Receipt",
								value: expense.receipt ? "Attached" : "Not yet",
							},
							{
								label: "Status",
								value: (
									<StatusPill tone={expenseTone[expense.status]}>
										{expenseLabel[expense.status]}
									</StatusPill>
								),
							},
						]}
					/>
					{expense.note && <Note tone="info">{expense.note}</Note>}
					{mode === "review" && (
						<WhatHappens
							items={[
								"Approving lets the money be paid from the till or account named",
								"The requester is told",
								"It is logged with your name in the activity log",
							]}
						/>
					)}
					{mode === "decline" && (
						<TextareaField
							label="Reason they will see"
							value={text}
							onChange={setText}
							placeholder="Use the in-house technician instead"
						/>
					)}
					{mode === "ask" && (
						<TextareaField
							label="Your question"
							value={text}
							onChange={setText}
							placeholder="Which supplier quoted this price?"
						/>
					)}
				</div>
			)}
		</SidePanel>
	);
}

/** Count every open till and close it; each variance needs a note and the managers are told. */
export function EndOfDayCashModal({
	open,
	tills,
	onClose,
}: {
	open: boolean;
	tills: TillRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const openTills = tills.filter((t) => t.status === "OPEN");
	const [counted, setCounted] = useState<Record<string, number | "">>({});
	const [note, setNote] = useState("");
	const expected = openTills.reduce((s, t) => s + t.expected, 0);
	const allCounted =
		openTills.length > 0 &&
		openTills.every((t) => typeof counted[t.id] === "number");
	const total = openTills.reduce((s, t) => s + (Number(counted[t.id]) || 0), 0);
	const variance = allCounted ? total - expected : 0;
	const anyVariance = openTills.some(
		(t) => typeof counted[t.id] === "number" && counted[t.id] !== t.expected,
	);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={BanknoteIcon}
			title="End-of-day cash"
			subtitle={
				openTills.length === 0
					? "Every till is closed"
					: `${openTills.length} open tills · count each against what is expected`
			}
			footerInfo={
				allCounted && variance !== 0
					? variance < 0
						? `${naira(-variance)} short overall`
						: `${naira(variance)} over overall`
					: "Counts match when the number is the same"
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={
							pending || !allCounted || (anyVariance && note.trim().length < 3)
						}
						onClick={() =>
							run(
								async () => {
									for (const t of openTills) {
										const r = await withDeliveries(
											closeTill(
												t.id,
												{
													countedCash: Number(counted[t.id]),
													note: counted[t.id] === t.expected ? undefined : note,
												},
												t,
											),
											"Till variance",
										);
										if (!r.ok) return r;
									}
									return { ok: true as const, data: null };
								},
								variance === 0
									? "Cash closed · counts match"
									: `Cash closed · ${naira(Math.abs(variance))} ${variance < 0 ? "short" : "over"} noted`,
								() => {
									setCounted({});
									setNote("");
									onClose();
								},
							)
						}
					>
						Close cash
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{openTills.length === 0 && (
					<Note tone="success">
						Nothing to count: every till opened today is closed.
					</Note>
				)}
				<ul className="flex flex-col gap-3">
					{openTills.map((t) => (
						<li
							key={t.id}
							className="flex flex-col gap-2 rounded-xl border border-line p-3"
						>
							<div className="flex items-center gap-3 text-[13px]">
								<span className="flex-1 font-medium capitalize text-ink">
									{t.role.replace("_", " ").toLowerCase()} till · {t.openedBy}
								</span>
								<span className="text-ink-2">
									float {naira(t.openingFloat)}
								</span>
								<span className="font-semibold text-ink">
									expect {naira(t.expected)}
								</span>
							</div>
							<MoneyField
								label="Cash counted"
								value={counted[t.id] ?? ""}
								onChange={(v) => setCounted((c) => ({ ...c, [t.id]: v }))}
							/>
						</li>
					))}
				</ul>
				{anyVariance && (
					<TextareaField
						label="Note for the variance"
						value={note}
						onChange={setNote}
						placeholder="What you think happened"
					/>
				)}
				{openTills.length > 0 && (
					<TotalsList
						rows={[
							{ label: "Expected", value: naira(expected) },
							{ label: "Counted", value: allCounted ? naira(total) : "—" },
							{
								label: "Variance",
								value: allCounted ? naira(variance) : "—",
								strong: true,
								tone:
									variance < 0
										? "danger"
										: variance > 0
											? "success"
											: undefined,
							},
						]}
					/>
				)}
			</div>
		</Modal>
	);
}

export function SendToOwnerModal({
	expense,
	rules,
	onClose,
}: {
	expense: ExpenseRow | null;
	rules: SpendRules;
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [note, setNote] = useState("");
	return (
		<ConfirmModal
			open={!!expense}
			onOpenChange={(o) => !o && onClose()}
			title="Send to the owner?"
			subtitle={
				expense ? `${expense.description} · ${naira(expense.amount)}` : ""
			}
			confirmLabel="Send to owner"
			pending={pending}
			onConfirm={() =>
				expense?.approvalId &&
				run(
					() =>
						withDeliveries(
							escalateApproval(expense.approvalId as string, note),
							"Approval",
						),
					`Sent to ${rules.ownerName} · you are told when they decide`,
					() => {
						setNote("");
						onClose();
					},
				)
			}
		>
			<div className="flex flex-col gap-4">
				<WhatHappens
					items={[
						`${rules.ownerName} gets it in Approvals`,
						"Nothing is paid until they approve",
						"You can still decline it yourself",
					]}
				/>
				<TextareaField
					label="Your note to the owner"
					value={note}
					onChange={setNote}
					placeholder="Diesel price went up again · generator runs 14h a day"
				/>
			</div>
		</ConfirmModal>
	);
}
