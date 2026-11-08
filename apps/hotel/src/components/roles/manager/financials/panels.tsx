"use client";

import { BanknoteIcon, CheckCircle2Icon, ReceiptIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, FieldRow, MoneyField, SelectField, TextField, TextareaField, ToggleField } from "@hospio/ui/shared/field";
import { fmtLongDate, naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { ExpenseRow, TillRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";

export const MANAGER_LIMIT = 20_000;
export const OWNER_LIMIT = 500_000;

export const expenseTone = { RECORDED: "grey", PENDING_APPROVAL: "warning", APPROVED: "success", DECLINED: "danger", QUESTION: "info", PAID: "success" } as const;
export const expenseLabel = { RECORDED: "Recorded", PENDING_APPROVAL: "Waiting for OK", APPROVED: "Approved", DECLINED: "Declined", QUESTION: "Question asked", PAID: "Paid" } as const;

export function RecordExpensePanel({ open, categories, onClose }: { open: boolean; categories: string[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [form, setForm] = useState({ category: "", description: "", amount: "" as number | "", paidFrom: "CASH" as ExpenseRow["paidFrom"], date: new Date().toISOString().slice(0, 10), receipt: false, note: "", supplier: "" });
	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
	const amount = form.amount === "" ? 0 : form.amount;
	const level = amount > OWNER_LIMIT ? "owner" : amount > MANAGER_LIMIT ? "manager" : "none";
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={ReceiptIcon}
			title="Record expense"
			subtitle="Money that left the hotel today"
			footerInfo={level === "owner" ? `Over ${naira(OWNER_LIMIT)} · goes to the owner` : level === "manager" ? `Over ${naira(MANAGER_LIMIT)} · recorded with your approval` : "Under the limit · recorded straight away"}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose} disabled={pending}>Cancel</Button>
					<Button className={btn.primary} disabled={pending || !form.category || !amount} onClick={() => run(level === "owner" ? "Sent to Godwin Kwin for approval" : "Expense recorded", onClose)}>
						{level === "owner" ? "Send to owner" : "Record expense"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Category" value={form.category} onChange={(v) => set("category", v)} options={categories} setupLink="charge categories" required />
				<TextField label="What for" value={form.description} onChange={(v) => set("description", v)} placeholder="Diesel · 400 litres" required />
				<FieldRow>
					<MoneyField label="Amount" value={form.amount} onChange={(v) => set("amount", v)} required />
					<TextField label="Date" type="date" value={form.date} onChange={(v) => set("date", v)} />
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
				<TextField label="Paid to (optional)" value={form.supplier} onChange={(v) => set("supplier", v)} placeholder="NNPC Ikeja" />
				<ToggleField label="I have the receipt" hint="Attach a photo from the tablet or desk scanner later" checked={form.receipt} onChange={(v) => set("receipt", v)} />
				<TextareaField label="Note" value={form.note} onChange={(v) => set("note", v)} placeholder="Anything the owner should know" />
				{level === "manager" && <Note>Over {naira(MANAGER_LIMIT)}: this is logged as approved by you and shows on the owner's weekly summary.</Note>}
				{level === "owner" && <Note tone="danger">Over {naira(OWNER_LIMIT)}: Godwin Kwin must approve before it is paid. You will be told when he decides.</Note>}
			</div>
		</SidePanel>
	);
}

export function ReviewRequestPanel({ expense, onClose }: { expense: ExpenseRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [mode, setMode] = useState<"review" | "decline" | "ask">("review");
	const [text, setText] = useState("");
	const close = () => { setMode("review"); setText(""); onClose(); };
	const overOwner = (expense?.amount ?? 0) > OWNER_LIMIT;
	return (
		<SidePanel
			open={!!expense}
			onOpenChange={(o) => !o && close()}
			icon={BanknoteIcon}
			title="Review spend request"
			subtitle={expense ? `${expense.requestedBy} · ${fmtLongDate(expense.date)}` : ""}
			footerInfo={overOwner ? `Over ${naira(OWNER_LIMIT)} · only the owner can approve` : `You approve up to ${naira(OWNER_LIMIT)}`}
			footer={
				mode === "review" ? (
					<>
						<Button variant="outline" className={btn.secondary} onClick={() => setMode("ask")}>Ask a question</Button>
						<Button variant="outline" className={btn.dangerSoft} onClick={() => setMode("decline")}>Decline</Button>
						{overOwner ? (
							<Button className={btn.primary} disabled={pending} onClick={() => run("Sent to Godwin Kwin", close)}>
								<SendIcon className="size-4" /> Send to owner
							</Button>
						) : (
							<Button className={btn.primary} disabled={pending} onClick={() => run(`${naira(expense?.amount ?? 0)} approved`, close)}>
								<CheckCircle2Icon className="size-4" /> Approve
							</Button>
						)}
					</>
				) : (
					<>
						<Button variant="outline" className={btn.secondary} onClick={() => setMode("review")}>Back</Button>
						<Button className={mode === "decline" ? btn.danger : btn.primary} disabled={pending || !text} onClick={() => run(mode === "decline" ? "Request declined · they are told why" : "Question sent", close, { tone: mode === "decline" ? "warning" : "info" })}>
							{mode === "decline" ? "Decline request" : "Send question"}
						</Button>
					</>
				)
			}
		>
			{expense && (
				<div className="flex flex-col gap-5">
					<div className="rounded-xl bg-subtle/70 p-4">
						<p className="text-[26px] font-bold leading-none text-ink">{naira(expense.amount)}</p>
						<p className="mt-1 text-[13px] text-ink-2">{expense.description}</p>
					</div>
					<DetailList columns={2} items={[{ label: "Category", value: expense.category }, { label: "Paid from", value: expense.paidFrom === "CASH" ? "Cash" : expense.paidFrom === "CARD" ? "Card" : "Transfer" }, { label: "Requested by", value: expense.requestedBy }, { label: "Receipt", value: expense.receipt ? "Attached" : "Not yet" }, { label: "Status", value: <StatusPill tone={expenseTone[expense.status]}>{expenseLabel[expense.status]}</StatusPill> }]} />
					{expense.note && <Note tone="info">{expense.note}</Note>}
					{mode === "review" && <WhatHappens items={["Approving releases the money from the till or account named", "The requester is told on WhatsApp", "It is logged with your name in the activity log"]} />}
					{mode === "decline" && <TextareaField label="Reason they will see" value={text} onChange={setText} placeholder="Use the in-house technician instead" />}
					{mode === "ask" && <TextareaField label="Your question" value={text} onChange={setText} placeholder="Which supplier quoted this price?" />}
				</div>
			)}
		</SidePanel>
	);
}

export function EndOfDayCashModal({ open, tills, onClose }: { open: boolean; tills: TillRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const openTills = tills.filter((t) => t.status === "OPEN");
	const expected = openTills.reduce((s, t) => s + t.expected, 0);
	const [counted, setCounted] = useState<number | "">("");
	const variance = counted === "" ? 0 : counted - expected;
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={BanknoteIcon}
			title="End-of-day cash"
			subtitle={`${openTills.length} open tills · count everything against the expected`}
			footerInfo={counted !== "" && variance !== 0 ? (variance < 0 ? `${naira(-variance)} short` : `${naira(variance)} over`) : "Counts match when the number is the same"}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
					<Button className={btn.primary} disabled={pending || counted === ""} onClick={() => run(variance === 0 ? "Cash closed · counts match" : `Cash closed · ${naira(Math.abs(variance))} ${variance < 0 ? "short" : "over"} noted`, onClose, { tone: variance === 0 ? "success" : "warning" })}>
						Close cash
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ul className="divide-y divide-line rounded-xl border border-line">
					{openTills.map((t) => (
						<li key={t.id} className="flex items-center gap-3 px-3 py-[10px] text-[13px]">
							<span className="flex-1 font-medium text-ink">{t.role.replace("_", " ").toLowerCase()} till · {t.openedBy}</span>
							<span className="text-ink-2">float {naira(t.openingFloat)}</span>
							<span className="font-semibold text-ink">{naira(t.expected)}</span>
						</li>
					))}
				</ul>
				<MoneyField label="Cash counted" value={counted} onChange={setCounted} hint={`Expected ${naira(expected)}`} />
				<TotalsList rows={[{ label: "Expected", value: naira(expected) }, { label: "Counted", value: counted === "" ? "—" : naira(counted) }, { label: "Variance", value: counted === "" ? "—" : naira(variance), strong: true, tone: variance < 0 ? "danger" : variance > 0 ? "success" : undefined }]} />
			</div>
		</Modal>
	);
}

export function SendToOwnerModal({ expense, onClose }: { expense: ExpenseRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [note, setNote] = useState("");
	return (
		<ConfirmModal open={!!expense} onOpenChange={(o) => !o && onClose()} title="Send to the owner?" subtitle={expense ? `${expense.description} · ${naira(expense.amount)}` : ""} confirmLabel="Send to owner" pending={pending} onConfirm={() => run("Sent to Godwin Kwin · you are told when he decides", onClose)}>
			<div className="flex flex-col gap-4">
				<WhatHappens items={["Godwin Kwin gets it in Approvals and on WhatsApp", "Nothing is paid until he approves", "You can still decline it yourself"]} />
				<TextareaField label="Your note to the owner" value={note} onChange={setNote} placeholder="Diesel price went up again · generator runs 14h a day" />
			</div>
		</ConfirmModal>
	);
}
