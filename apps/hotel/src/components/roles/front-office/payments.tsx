"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CreditCardIcon, RotateCcwIcon, SendIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { MoneyField, SelectField, TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { FolioRow, PaymentRow, PaymentStatus, TerminalRow } from "@hospio/api/data/types";
import { requestRefund } from "@hospio/api/actions/payment";
import { useAction } from "@hospio/api/actions/use-action";
import { TakePaymentPanel } from "./take-payment";

export const payTone: Record<PaymentStatus, { label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }> = {
	APPROVED: { label: "Approved", tone: "success" },
	PROCESSING: { label: "Processing", tone: "info" },
	PENDING: { label: "Pending", tone: "warning" },
	DECLINED: { label: "Declined", tone: "danger" },
	NO_RESPONSE: { label: "No response", tone: "danger" },
	FAILED: { label: "Failed", tone: "danger" },
	REFUNDED: { label: "Refunded", tone: "grey" },
};

/** Front office 8.x · My payments: everything taken by the signed-in person, with the take-payment panel on top. */
export function MyPaymentsScreen({ payments: initial, folios, terminals, me, roleFilter }: { payments: PaymentRow[]; folios: FolioRow[]; terminals: TerminalRow[]; me: string; roleFilter?: string }) {
	const [payments, setPayments] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [refundFor, setRefundFor] = useState<PaymentRow | null>(null);
	const active = tab ?? "today";
	const todayStr = new Date().toISOString().slice(0, 10);
	const mine = payments.filter((p) => !roleFilter || p.role === roleFilter);
	const lists: Record<string, PaymentRow[]> = {
		today: mine.filter((p) => p.createdAt.slice(0, 10) === todayStr),
		mine: mine.filter((p) => p.takenBy === me),
		verify: mine.filter((p) => p.status === "PROCESSING" || p.status === "PENDING" || p.status === "NO_RESPONSE"),
		all: mine,
	};
	const pay = payments.find((p) => p.id === openId) ?? null;
	const todayTotal = lists.today.filter((p) => p.status === "APPROVED").reduce((s, p) => s + p.amount, 0);
	const byMethod = (m: PaymentRow["method"]) => lists.today.filter((p) => p.status === "APPROVED" && p.method === m).reduce((s, p) => s + p.amount, 0);

	const columns = useMemo<ColumnDef<PaymentRow, unknown>[]>(
		() => [
			{ accessorKey: "createdAt", header: "When", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.createdAt)}</span> },
			{ accessorKey: "guestName", header: "Guest", cell: ({ row }) => <TwoLine primary={row.original.guestName} secondary={`${row.original.roomNumber ? `Room ${row.original.roomNumber} · ` : ""}${row.original.description}`} /> },
			{ accessorKey: "method", header: "Method", cell: ({ row }) => <TwoLine primary={row.original.method === "CARD" ? "Card" : row.original.method === "TRANSFER" ? "Transfer" : "Cash"} secondary={row.original.terminal ?? row.original.providerRef ?? ""} /> },
			{ accessorKey: "takenBy", header: "By" },
			{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-semibold">{naira(row.original.amount)}</span> },
			{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={payTone[row.original.status].tone}>{payTone[row.original.status].label}</StatusPill>, enableSorting: false },
		],
		[],
	);

	return (
		<>
			<PageHeader title="Payments" subtitle={`${plural(lists.today.length, "payment")} today · ${naira(todayTotal)} approved`}>
				<ExportButton />
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}><CreditCardIcon className="mr-1 inline size-4" /> Take payment</button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Taken today" value={naira(todayTotal)} icon={CreditCardIcon} hint={plural(lists.today.length, "payment")} />
				<KpiCard label="Card · POS" value={naira(byMethod("CARD"))} icon={CreditCardIcon} hint="Matched by the provider" />
				<KpiCard label="Transfers" value={naira(byMethod("TRANSFER"))} icon={CreditCardIcon} hint={`${lists.verify.length} waiting to be matched`} pill={lists.verify.length > 0 ? <StatusPill tone="warning">{lists.verify.length}</StatusPill> : undefined} />
				<KpiCard label="Cash" value={naira(byMethod("CASH"))} icon={CreditCardIcon} hint="In your till" />
			</div>
			<Toolbar left={<PillTabs value={active} onChange={(k) => void setTab(k === "today" ? null : k)} tabs={[{ key: "today", label: "Today", count: lists.today.length }, { key: "mine", label: "Taken by me", count: lists.mine.length }, { key: "verify", label: "To verify", count: lists.verify.length }, { key: "all", label: "All", count: lists.all.length }]} />} right={<SearchBox value={search} onChange={setSearch} placeholder="Guest, reference…" />} />
			<DataTable columns={columns} data={lists[active] ?? lists.today} search={search} onRowClick={(p) => void setOpenId(p.id)} />

			<SidePanel open={!!pay} onOpenChange={(o) => !o && void setOpenId(null)} title={pay ? `${naira(pay.amount)} · ${pay.guestName}` : ""} subtitle={pay ? `${pay.reference} · ${fmtWhen(pay.createdAt)} · taken by ${pay.takenBy}` : undefined} icon={CreditCardIcon} footer={pay && (
				<>
					{(pay.status === "DECLINED" || pay.status === "NO_RESPONSE") && <button type="button" className={btn.primary} onClick={() => { void setOpenId(null); void setIsNew("1"); }}><RotateCcwIcon className="mr-1 inline size-4" /> Try again</button>}
					{pay.status === "PROCESSING" && <button type="button" className={btn.secondary} onClick={() => setPayments((xs) => xs.map((p) => (p.id === pay.id ? { ...p, status: "APPROVED", resolvedAt: new Date().toISOString() } : p)))}>I've confirmed it landed</button>}
					{pay.status === "APPROVED" && <button type="button" className={btn.secondary} onClick={() => setRefundFor(pay)}>Request refund <ManagerMark className="ml-1" /></button>}
					{pay.status === "APPROVED" && <button type="button" className={btn.primary} onClick={() => void setOpenId(null)}><SendIcon className="mr-1 inline size-4" /> Resend receipt</button>}
				</>
			)} footerInfo={pay && <StatusPill tone={payTone[pay.status].tone}>{payTone[pay.status].label}</StatusPill>}>
				{pay && (
					<div className="flex flex-col gap-6">
						{pay.status === "PROCESSING" && <Note tone="info">Transfer not matched to a bank line yet. Finance matches it; you can confirm if you saw the alert.</Note>}
						{pay.status === "NO_RESPONSE" && <Note tone="danger">The terminal didn't answer. Nothing was charged — check with the guest's bank before trying again.</Note>}
						<PanelSection title="Payment">
							<DetailList columns={2} items={[{ label: "Method", value: pay.method === "CARD" ? `Card · ${pay.terminal}` : pay.method === "TRANSFER" ? "Bank transfer" : "Cash" }, { label: "Provider ref", value: pay.providerRef ?? "—" }, { label: "For", value: pay.description }, { label: "Folio", value: pay.folioId ? <a href={`/dashboard/folios?open=${pay.folioId}`} className="text-brand">Open folio →</a> : "—" }, { label: "Receipt", value: pay.receiptSent === "NONE" ? "Not sent" : `Sent by ${pay.receiptSent === "WHATSAPP" ? "WhatsApp" : "email"}` }, { label: "Resolved", value: fmtWhen(pay.resolvedAt) }]} />
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<RefundRequestModal payment={refundFor} onOpenChange={(o) => !o && setRefundFor(null)} />
			<TakePaymentPanel open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} folios={folios} terminals={terminals} onDone={(p) => setPayments((xs) => [{ id: p.id, reference: `PAY-${p.id.slice(0, 6).toUpperCase()}`, folioId: p.folioId, guestName: p.guestName, role: roleFilter ?? "FRONT_OFFICE", takenBy: me, method: p.method, amount: p.amount, status: p.status, terminal: p.method === "CARD" ? "Front desk POS" : undefined, createdAt: new Date().toISOString(), resolvedAt: p.status === "APPROVED" ? new Date().toISOString() : undefined, receiptSent: "WHATSAPP", description: "Room charges" }, ...xs])} />
		</>
	);
}

/** 8.12 Request a refund — goes to the manager. */
export function RefundRequestModal({ payment, onOpenChange }: { payment: PaymentRow | null; onOpenChange: (o: boolean) => void }) {
	const [amount, setAmount] = useState<number | "">("");
	const [reason, setReason] = useState("");
	const [note, setNote] = useState("");
	const { run, pending } = useAction();
	if (!payment) return null;
	return (
		<Modal open={!!payment} onOpenChange={onOpenChange} title="Request a refund" subtitle={`${payment.guestName} · ${naira(payment.amount)} by ${payment.method.toLowerCase()}`} icon={RotateCcwIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!reason || pending} onClick={() => void run(() => requestRefund(payment.id, amount === "" ? payment.amount : amount, note ? `${reason} · ${note}` : reason), "Refund request sent to the manager", () => onOpenChange(false))}>Send to manager</button></>} footerInfo={<span className="flex items-center gap-2"><ManagerMark /> Refunds need a manager</span>}>
			<div className="flex flex-col gap-4">
				<MoneyField label="Amount to refund" value={amount === "" ? payment.amount : amount} onChange={setAmount} hint={`Up to ${naira(payment.amount)}`} />
				<SelectField label="Reason" value={reason} onChange={setReason} options={["Charged twice", "Guest left early", "Service issue", "Booking cancelled", "Other"]} setupLink="reasons" />
				<TextareaField label="Note for the manager" value={note} onChange={setNote} rows={2} />
			</div>
		</Modal>
	);
}
