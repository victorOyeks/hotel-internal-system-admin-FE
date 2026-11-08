"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MessageCircleQuestionIcon, PlusIcon, ReceiptIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList, Note, Timeline } from "@/components/shared/detail-list";
import { ChoiceCards, MoneyField, SelectField, TextareaField, TextField, ToggleField } from "@/components/shared/field";
import { fmtDay, naira, plural } from "@/components/shared/format";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { ManagerMark } from "@/components/shared/row-actions";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { ExpenseRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";

export const expenseTone: Record<ExpenseRow["status"], { label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }> = {
	RECORDED: { label: "Recorded", tone: "grey" },
	PENDING_APPROVAL: { label: "Needs approval", tone: "warning" },
	APPROVED: { label: "Approved", tone: "success" },
	PAID: { label: "Paid", tone: "success" },
	DECLINED: { label: "Declined", tone: "danger" },
	QUESTION: { label: "Question", tone: "info" },
};

const MANAGER_LIMIT = 20000;
const OWNER_LIMIT = 500000;
const categories = ["Fuel & power", "Kitchen supplies", "Bar supplies", "Housekeeping", "Laundry", "Repairs", "Utilities", "Staff welfare", "Marketing", "Office", "Other"];

/** Finance 3.x · Expenses: list, record, request status, answer a question. */
export function ExpensesScreen({ expenses: initial, me, title = "Expenses" }: { expenses: ExpenseRow[]; me: string; title?: string }) {
	const [expenses, setExpenses] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [answering, setAnswering] = useState(false);
	const [answer, setAnswer] = useState("");
	const { run, pending } = useDemoAction();
	const active = tab ?? "all";
	const lists: Record<string, ExpenseRow[]> = {
		all: expenses,
		approval: expenses.filter((e) => e.status === "PENDING_APPROVAL"),
		questions: expenses.filter((e) => e.status === "QUESTION"),
		paid: expenses.filter((e) => e.status === "PAID" || e.status === "APPROVED"),
	};
	const exp = expenses.find((e) => e.id === openId) ?? null;
	const monthTotal = expenses.filter((e) => e.status !== "DECLINED").reduce((s, e) => s + e.amount, 0);

	const columns = useMemo<ColumnDef<ExpenseRow, unknown>[]>(
		() => [
			{ accessorKey: "date", header: "Date", cell: ({ row }) => <span className="text-ink-2">{fmtDay(row.original.date)}</span> },
			{ accessorKey: "description", header: "Expense", cell: ({ row }) => <TwoLine primary={row.original.description} secondary={`${row.original.category} · ${row.original.requestedBy}`} /> },
			{ accessorKey: "paidFrom", header: "Paid from", cell: ({ row }) => <span className="capitalize text-ink-2">{row.original.paidFrom.toLowerCase()}</span> },
			{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-semibold">{naira(row.original.amount)}</span> },
			{ accessorKey: "receipt", header: "Receipt", cell: ({ row }) => (row.original.receipt ? <StatusPill dot={false} tone="success">Attached</StatusPill> : <StatusPill dot={false} tone="grey">None</StatusPill>), enableSorting: false },
			{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={expenseTone[row.original.status].tone}>{expenseTone[row.original.status].label}</StatusPill>, enableSorting: false },
		],
		[],
	);

	return (
		<>
			<PageHeader title={title} subtitle={`${naira(monthTotal)} recorded this month · ${plural(lists.approval.length, "request")} waiting on the manager`}>
				<ExportButton />
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}><PlusIcon className="mr-1 inline size-4" /> Record expense</button>
			</PageHeader>
			<Toolbar left={<PillTabs value={active} onChange={(k) => void setTab(k === "all" ? null : k)} tabs={[{ key: "all", label: "All", count: lists.all.length }, { key: "approval", label: "Needs approval", count: lists.approval.length }, { key: "questions", label: "Questions", count: lists.questions.length }, { key: "paid", label: "Approved & paid", count: lists.paid.length }]} />} right={<SearchBox value={search} onChange={setSearch} placeholder="Description, category, who…" />} />
			<DataTable columns={columns} data={lists[active] ?? expenses} search={search} onRowClick={(e) => void setOpenId(e.id)} />

			<SidePanel open={!!exp} onOpenChange={(o) => !o && void setOpenId(null)} title={exp?.description ?? ""} subtitle={exp ? `${exp.category} · ${fmtDay(exp.date)} · by ${exp.requestedBy}` : undefined} icon={ReceiptIcon} footer={exp && (
				<>
					{exp.status === "QUESTION" && <button type="button" className={btn.primary} onClick={() => setAnswering(true)}><MessageCircleQuestionIcon className="mr-1 inline size-4" /> Answer</button>}
					{exp.status === "APPROVED" && <button type="button" className={btn.primary} disabled={pending} onClick={() => void run("Marked as paid", () => setExpenses((xs) => xs.map((e) => (e.id === exp.id ? { ...e, status: "PAID" } : e))))}>Mark paid</button>}
					{exp.status === "DECLINED" && <button type="button" className={btn.secondary} onClick={() => { void setOpenId(null); void setIsNew("1"); }}>Record again</button>}
				</>
			)} footerInfo={exp && <StatusPill tone={expenseTone[exp.status].tone}>{expenseTone[exp.status].label}</StatusPill>}>
				{exp && (
					<div className="flex flex-col gap-6">
						<div className="rounded-xl border border-line px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">Amount</p><p className="text-2xl font-bold text-ink">{naira(exp.amount)}</p><p className="text-xs text-ink-3">Paid from {exp.paidFrom.toLowerCase()}{exp.receipt ? " · receipt attached" : " · no receipt"}</p></div>
						{exp.status === "QUESTION" && <Note tone="info">Question from the approver: “{exp.note}”</Note>}
						{exp.status === "DECLINED" && <Note tone="danger">Declined · {exp.note}</Note>}
						{exp.status === "PENDING_APPROVAL" && <Note tone="warning">{exp.amount > OWNER_LIMIT ? "Over ₦500,000 · waiting on the owner." : "Waiting on the manager."}{exp.note ? ` “${exp.note}”` : ""}</Note>}
						<PanelSection title="Details">
							<DetailList columns={2} items={[{ label: "Category", value: exp.category }, { label: "Requested by", value: exp.requestedBy }, { label: "Needs", value: exp.amount > OWNER_LIMIT ? "Owner" : exp.amount > MANAGER_LIMIT ? "Manager" : "Nobody · under limit" }, { label: "Receipt", value: exp.receipt ? "Photo attached" : "None" }]} />
						</PanelSection>
						<PanelSection title="History">
							<Timeline items={[{ at: fmtDay(exp.date), by: exp.requestedBy, text: "Recorded" }, ...(exp.status === "PENDING_APPROVAL" ? [{ at: "now", text: "Waiting for approval" }] : exp.status === "QUESTION" ? [{ at: fmtDay(exp.date), by: "Godwin Kwin", text: `Asked: ${exp.note}` }] : exp.status === "DECLINED" ? [{ at: fmtDay(exp.date), by: "Tunde Bakare", text: `Declined · ${exp.note}` }] : exp.status === "PAID" || exp.status === "APPROVED" ? [{ at: fmtDay(exp.date), by: "Tunde Bakare", text: "Approved" }] : [])]} />
						</PanelSection>
					</div>
				)}
			</SidePanel>

			{exp && (
				<Modal open={answering} onOpenChange={setAnswering} title="Answer the question" subtitle={`“${exp.note}”`} icon={MessageCircleQuestionIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => setAnswering(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!answer || pending} onClick={() => void run("Answer sent · back to the approver", () => { setExpenses((xs) => xs.map((e) => (e.id === exp.id ? { ...e, status: "PENDING_APPROVAL", note: answer } : e))); setAnswering(false); setAnswer(""); })}>Send answer</button></>}>
					<TextareaField label="Your answer" value={answer} onChange={setAnswer} rows={3} />
				</Modal>
			)}

			<RecordExpensePanel open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} me={me} onSaved={(e) => { setExpenses((xs) => [e, ...xs]); void setIsNew(null); void setOpenId(e.id); }} />
		</>
	);
}

/** 3.2 Record expense + 3.3 over limit notice. */
export function RecordExpensePanel({ open, onOpenChange, me, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; me: string; onSaved: (e: ExpenseRow) => void }) {
	const [category, setCategory] = useState("");
	const [desc, setDesc] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [paidFrom, setPaidFrom] = useState<ExpenseRow["paidFrom"]>("CASH");
	const [receipt, setReceipt] = useState(true);
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	const amt = typeof amount === "number" ? amount : 0;
	const level = amt > OWNER_LIMIT ? "owner" : amt > MANAGER_LIMIT ? "manager" : null;
	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="Record an expense" subtitle="Anything paid out of a till, the safe or the bank" icon={ReceiptIcon} footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!category || !desc || amt <= 0 || pending} onClick={() => void run(level ? `Sent to the ${level} to approve` : "Expense recorded", () => { onSaved({ id: `ex-${Date.now()}`, date: format(new Date(), "yyyy-MM-dd"), category, description: desc, amount: amt, paidFrom, requestedBy: me, status: level ? "PENDING_APPROVAL" : "RECORDED", receipt, note: note || undefined }); setDesc(""); setAmount(""); setNote(""); }, level ? { tone: "info" } : undefined)}>{level ? `Send to ${level}` : "Record"}</button></>} footerInfo={level && <span className="flex items-center gap-2"><ManagerMark /> Over {naira(level === "owner" ? OWNER_LIMIT : MANAGER_LIMIT)}</span>}>
			<div className="flex flex-col gap-4">
				<SelectField label="Category" value={category} onChange={setCategory} options={categories} setupLink="categories" required />
				<TextField label="What for" value={desc} onChange={setDesc} placeholder="e.g. Diesel · 400 litres" required />
				<MoneyField label="Amount" value={amount} onChange={setAmount} required />
				{level && <Note tone="warning">{level === "owner" ? "Spend over ₦500,000 goes to the owner." : "Over ₦20,000 needs the manager."} Nothing is paid until they approve.</Note>}
				<ChoiceCards label="Paid from" value={paidFrom} onChange={setPaidFrom} columns={3} options={[{ value: "CASH", label: "Cash / till" }, { value: "TRANSFER", label: "Bank transfer" }, { value: "CARD", label: "Company card" }]} />
				<ToggleField label="Receipt attached" hint="Take a photo of the receipt · the owner can see it" checked={receipt} onChange={setReceipt} />
				<TextareaField label="Note" value={note} onChange={setNote} rows={2} placeholder="Why now, which supplier…" />
			</div>
		</SidePanel>
	);
}
