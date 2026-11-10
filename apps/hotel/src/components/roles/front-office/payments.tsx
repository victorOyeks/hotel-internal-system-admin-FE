"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CreditCardIcon, RotateCcwIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { exportPayments } from "@hospio/api/actions/reservation-lists";
import type { PageResult } from "@hospio/api/data/paging";
import { csvName, downloadCsv } from "@hospio/ui/shared/csv";
import { useListParams } from "@hospio/ui/shared/list-params";
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

/** The tabs as the service's filters: today's, what I took, still to verify, everything (the last 90 days). */
export const PAYMENT_TABS = {
	today: { today: true },
	mine: { mine: true },
	verify: { status: "PENDING,PROCESSING,NO_RESPONSE" },
	all: {},
} as const;
export type PaymentTab = keyof typeof PAYMENT_TABS;

/**
 * Front office 8.x · My payments: everything taken by the signed-in person, with the take-payment panel on top. The list is
 * one page from payment-service (`?tab=`, `?q=`, `?page=` in the URL); the cards and tab counts are the service's.
 */
export function MyPaymentsScreen({ payments: result, opened, folios, terminals, me, roleFilter }: { payments: PageResult<PaymentRow>; opened?: PaymentRow | null; folios: FolioRow[]; terminals: TerminalRow[]; me: string; roleFilter?: string }) {
	const router = useRouter();
	const list = useListParams({ extra: ["tab"] });
	const [payments, setPayments] = useState(result.data.content);
	useEffect(() => setPayments(result.data.content), [result]);
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [refundFor, setRefundFor] = useState<PaymentRow | null>(null);
	const [exporting, setExporting] = useState(false);
	const active = (list.params.tab && list.params.tab in PAYMENT_TABS ? list.params.tab : "today") as PaymentTab;
	const counts = result.data.counts ?? {};
	const totals = result.data.totals ?? {};
	const pay = payments.find((p) => p.id === openId) ?? (opened && opened.id === openId ? opened : null);
	const todayTotal = totals.approvedToday ?? 0;
	const todayCount = counts.today ?? 0;
	const toVerify = counts.toVerify ?? 0;
	const byMethod = (m: PaymentRow["method"]) => totals[`today${m === "CARD" ? "Card" : m === "TRANSFER" ? "Transfer" : "Cash"}`] ?? 0;
	const doExport = async () => {
		setExporting(true);
		try {
			const r = await exportPayments({ ...PAYMENT_TABS[active], role: roleFilter, q: list.params.q ?? undefined });
			if (!r.ok) {
				toast.error(r.error);
				return;
			}
			downloadCsv(csvName("Payments"), [
				["When", "Reference", "Guest", "For", "Taken by", "Method", "Amount (NGN)", "Status", "Provider ref"],
				...r.data.rows.map((p) => [p.createdAt, p.reference, p.guestName, p.description, p.takenBy, p.method, p.amount, payTone[p.status].label, p.providerRef ?? ""]),
			]);
			toast.success(`${plural(r.data.rows.length, "payment")} exported`);
		} finally {
			setExporting(false);
		}
	};

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
			<PageHeader title="Payments" subtitle={`${plural(todayCount, "payment")} today · ${naira(todayTotal)} approved`}>
				<ExportButton onClick={exporting ? undefined : () => void doExport()} label={exporting ? "Exporting…" : "Export"} />
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}><CreditCardIcon className="mr-1 inline size-4" /> Take payment</button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Taken today" value={naira(todayTotal)} icon={CreditCardIcon} hint={plural(todayCount, "payment")} />
				<KpiCard label="Card · POS" value={naira(byMethod("CARD"))} icon={CreditCardIcon} hint="Matched by the provider" />
				<KpiCard label="Transfers" value={naira(byMethod("TRANSFER"))} icon={CreditCardIcon} hint={`${toVerify} waiting to be matched`} pill={toVerify > 0 ? <StatusPill tone="warning">{toVerify}</StatusPill> : undefined} />
				<KpiCard label="Cash" value={naira(byMethod("CASH"))} icon={CreditCardIcon} hint="In your till" />
			</div>
			<Toolbar left={<PillTabs value={active} onChange={(k) => list.set({ tab: k === "today" ? null : k })} tabs={[{ key: "today", label: "Today", count: todayCount }, { key: "mine", label: "Taken by me", count: counts.mine ?? 0 }, { key: "verify", label: "To verify", count: toVerify }, { key: "all", label: "All", count: counts.all ?? 0 }]} />} right={<SearchBox value={list.search} onChange={list.setSearch} placeholder="Guest, reference…" />} />
			<DataTable columns={columns} data={payments} server={{ page: result.data, onPage: list.goTo, sort: list.sort, onSort: list.setSort, sortKeys: { createdAt: "createdAt", guestName: "guestName", method: "method", amount: "amount" } }} filtered={!!list.params.q} onClearFilters={() => { list.setSearch(""); list.set({ q: null }); }} error={result.ok ? null : result.error} onRetry={() => router.refresh()} emptyTitle={active === "today" ? "Nothing taken today yet" : "No payments here"} onRowClick={(p) => void setOpenId(p.id)} />

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
