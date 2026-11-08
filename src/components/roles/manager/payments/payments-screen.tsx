"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, CreditCardIcon, PlusIcon, RotateCcwIcon, WifiIcon, WifiOffIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { AvatarName } from "@/components/shared/detail-list";
import { fmtWhen, humanize, naira, nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { RowActions } from "@/components/shared/row-actions";
import { type PillTone, StatusPill } from "@/components/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { DisputeRow, FolioRow, PaymentRow, PaymentStatus, RefundRow, TerminalRow } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { DisputePanel, NewPaymentPanel, PaymentPanel, RefundModal, TerminalPanel } from "./payment-panels";

const TABS = ["all", "terminals", "refunds", "disputes"] as const;
type Tab = (typeof TABS)[number];

export const paymentTone: Record<PaymentStatus, PillTone> = { APPROVED: "success", PROCESSING: "info", PENDING: "info", DECLINED: "danger", NO_RESPONSE: "warning", FAILED: "danger", REFUNDED: "grey" };
export const methodLabel = { CARD: "Card", TRANSFER: "Transfer", CASH: "Cash" } as const;

export function PaymentsScreen({ hotelName, payments: initial, terminals, refunds: initialRefunds, disputes: initialDisputes, folios }: { hotelName: string; payments: PaymentRow[]; terminals: TerminalRow[]; refunds: RefundRow[]; disputes: DisputeRow[]; folios: FolioRow[] }) {
	const [tab] = useQueryState("tab", parseAsString.withDefault("all"));
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [folioId, setFolioId] = useQueryState("folio");
	const [payments, setPayments] = useState(initial);
	const [refunds, setRefunds] = useState(initialRefunds);
	const [disputes, setDisputes] = useState(initialDisputes);
	const [search, setSearch] = useState("");
	const [method, setMethod] = useState("");
	const [status, setStatus] = useState("");
	const [terminal, setTerminal] = useState<TerminalRow | null>(null);
	const [refund, setRefund] = useState<RefundRow | null>(null);
	const [dispute, setDispute] = useState<DisputeRow | null>(null);
	const { run } = useDemoAction();
	const active = (TABS.includes(tab as Tab) ? tab : "all") as Tab;
	const selected = payments.find((p) => p.id === openId) ?? null;

	const approved = payments.filter((p) => p.status === "APPROVED");
	const todayTotal = approved.filter((p) => p.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((s, p) => s + p.amount, 0);
	const attention = payments.filter((p) => p.status === "DECLINED" || p.status === "NO_RESPONSE" || p.status === "PROCESSING").length;
	const pendingRefunds = refunds.filter((r) => r.status === "PENDING_APPROVAL");
	const openDisputes = disputes.filter((d) => d.status === "OPEN");

	const filtered = payments.filter((p) => (!method || p.method === method) && (!status || p.status === status));

	const columns: ColumnDef<PaymentRow, unknown>[] = [
		{ accessorKey: "guestName", header: "Guest / payer", cell: ({ row }) => <AvatarName name={row.original.guestName} secondary={<>{row.original.reference}{row.original.roomNumber ? ` · Room ${row.original.roomNumber}` : ""}</>} /> },
		{ accessorKey: "description", header: "For", cell: ({ row }) => <TwoLine primary={row.original.description} secondary={`${humanize(row.original.role)} · ${row.original.takenBy}`} /> },
		{ accessorKey: "method", header: "Method", cell: ({ row }) => <TwoLine primary={methodLabel[row.original.method]} secondary={row.original.terminal ?? row.original.providerRef} /> },
		{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className={cn("font-semibold", row.original.status === "REFUNDED" ? "text-ink-3 line-through" : "text-ink")}>{naira(row.original.amount)}</span> },
		{ accessorKey: "createdAt", header: "When", cell: ({ row }) => fmtWhen(row.original.createdAt) },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={paymentTone[row.original.status]}>{humanize(row.original.status)}</StatusPill> },
		{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => { const p = row.original; return <RowActions actions={[
			{ label: "Open payment", onClick: () => setOpenId(p.id) },
			{ label: "Resend receipt", onClick: () => run(`Receipt resent to ${p.guestName}`), disabled: p.status !== "APPROVED" },
			...(p.status === "NO_RESPONSE" || p.status === "PROCESSING" ? [{ label: "Check with provider", onClick: () => run("Provider says: approved · payment updated", () => setPayments((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: "APPROVED" as const, resolvedAt: new Date().toISOString() } : x)))) }] : []),
			{ label: "Request refund", managerOnly: true, separatorBefore: true, onClick: () => setRefund({ id: `rf-${Date.now()}`, paymentId: p.id, guestName: p.guestName, amount: p.amount, reason: "", status: "PENDING_APPROVAL", requestedBy: "Tunde Bakare", createdAt: new Date().toISOString() }), disabled: p.status !== "APPROVED" },
		]} />; } },
	];

	return (
		<>
			<PageHeader title="Payments" subtitle={`${hotelName} · every payment taken at the desk, bar, kitchen and laundry`}>
				<ExportButton onClick={() => run("Export ready · payments.xlsx sent to your email", undefined, { tone: "info" })} />
				<Button className={btn.primary} onClick={() => setIsNew("1")}><PlusIcon className="size-[15px]" /> Record payment</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Taken today" value={nairaShort(todayTotal)} icon={CreditCardIcon} hint={`${plural(approved.length, "approved payment")} in the list`} />
				<KpiCard label="Needs a look" value={attention} icon={AlertTriangleIcon} hint="Declined, no response or still processing" pill={attention > 0 ? <StatusPill tone="warning">check</StatusPill> : undefined} />
				<KpiCard label="Refunds waiting" value={pendingRefunds.length} icon={RotateCcwIcon} hint={naira(pendingRefunds.reduce((s, r) => s + r.amount, 0))} pill={pendingRefunds.length > 0 ? <StatusPill tone="info">approve</StatusPill> : undefined} />
				<KpiCard label="POS terminals" value={`${terminals.filter((t) => t.status === "ONLINE").length}/${terminals.length}`} icon={WifiIcon} hint={terminals.some((t) => t.status === "OFFLINE") ? `${terminals.filter((t) => t.status === "OFFLINE").map((t) => t.name).join(", ")} offline` : "All online"} />
			</div>
			<Toolbar
				left={<PillTabs param="tab" defaultValue="all" tabs={[{ key: "all", label: "All payments", count: payments.length }, { key: "terminals", label: "POS terminals", count: terminals.length }, { key: "refunds", label: "Refunds", count: refunds.length }, { key: "disputes", label: "Disputes", count: openDisputes.length }]} />}
				right={active === "all" ? <>
					<FilterSelect value={method} onChange={setMethod} all="All methods" options={[{ value: "CARD", label: "Card" }, { value: "TRANSFER", label: "Transfer" }, { value: "CASH", label: "Cash" }]} />
					<FilterSelect value={status} onChange={setStatus} all="Any status" options={(["APPROVED", "PROCESSING", "DECLINED", "NO_RESPONSE", "REFUNDED"] as PaymentStatus[]).map((s) => ({ value: s, label: humanize(s) }))} />
					<SearchBox value={search} onChange={setSearch} placeholder="Guest, ref, room…" />
				</> : undefined}
			/>

			{active === "all" && <DataTable columns={columns} data={filtered} search={search} onRowClick={(p) => setOpenId(p.id)} emptyTitle="No payments match" />}

			{active === "terminals" && (
				<div className="grid gap-4 md:grid-cols-3">
					{terminals.map((t) => (
						<button key={t.id} type="button" onClick={() => setTerminal(t)} className="flex flex-col gap-3 rounded-card border border-line bg-card p-5 text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
							<div className="flex items-start gap-3">
								<span className={cn("flex size-10 items-center justify-center rounded-xl", t.status === "ONLINE" ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{t.status === "ONLINE" ? <WifiIcon className="size-5" /> : <WifiOffIcon className="size-5" />}</span>
								<div className="min-w-0 flex-1"><p className="text-base font-bold text-ink">{t.name}</p><p className="text-xs text-ink-3">{t.provider} · {t.ref}</p></div>
								<StatusPill tone={t.status === "ONLINE" ? "success" : "danger"}>{t.status === "ONLINE" ? "Online" : "Offline"}</StatusPill>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-xl bg-subtle/70 px-3 py-2"><p className="text-[11px] text-ink-3">Today</p><p className="text-sm font-bold text-ink">{naira(t.todayAmount)}</p></div>
								<div className="rounded-xl bg-subtle/70 px-3 py-2"><p className="text-[11px] text-ink-3">Payments</p><p className="text-sm font-bold text-ink">{t.todayCount}</p></div>
							</div>
							<p className="text-xs text-ink-3">Used by {t.roles.map(humanize).join(", ")} · last seen {fmtWhen(t.lastSeen)}</p>
						</button>
					))}
					<button type="button" onClick={() => run("Ask Hospio support to link a new terminal · ticket opened", undefined, { tone: "info" })} className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong text-sm font-semibold text-ink-2 hover:bg-subtle"><PlusIcon className="size-5" /> Link a terminal</button>
				</div>
			)}

			{active === "refunds" && (
				<DataTable<RefundRow> data={refunds} onRowClick={(r) => setRefund(r)} emptyTitle="No refunds" columns={[
					{ accessorKey: "guestName", header: "Guest", cell: ({ row }) => <AvatarName name={row.original.guestName} secondary={`Requested by ${row.original.requestedBy}`} /> },
					{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-semibold">{naira(row.original.amount)}</span> },
					{ accessorKey: "reason", header: "Reason" },
					{ accessorKey: "createdAt", header: "When", cell: ({ row }) => fmtWhen(row.original.createdAt) },
					{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "APPROVED" ? "success" : row.original.status === "DECLINED" ? "danger" : "info"}>{humanize(row.original.status)}</StatusPill> },
					{ id: "a", header: "", enableSorting: false, cell: ({ row }) => row.original.status === "PENDING_APPROVAL" ? <button type="button" onClick={(e) => { e.stopPropagation(); setRefund(row.original); }} className={`${btn.primary} ${btn.small}`}>Review</button> : null },
				]} />
			)}

			{active === "disputes" && (
				<DataTable<DisputeRow> data={disputes} onRowClick={(d) => setDispute(d)} emptyTitle="No disputes" columns={[
					{ accessorKey: "guestName", header: "Guest", cell: ({ row }) => <AvatarName name={row.original.guestName} secondary={`Payment ${payments.find((p) => p.id === row.original.paymentId)?.reference ?? ""}`} /> },
					{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-semibold">{naira(row.original.amount)}</span> },
					{ accessorKey: "reason", header: "What the guest says" },
					{ accessorKey: "openedAt", header: "Opened", cell: ({ row }) => fmtWhen(row.original.openedAt) },
					{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "OPEN" ? "warning" : "success"}>{row.original.status === "OPEN" ? "Open" : "Resolved"}</StatusPill> },
				]} />
			)}

			<PaymentPanel payment={selected} onClose={() => setOpenId(null)} onRefund={(p) => setRefund({ id: `rf-${Date.now()}`, paymentId: p.id, guestName: p.guestName, amount: p.amount, reason: "", status: "PENDING_APPROVAL", requestedBy: "Tunde Bakare", createdAt: new Date().toISOString() })} onDispute={(p) => setDispute({ id: `dp-${Date.now()}`, paymentId: p.id, guestName: p.guestName, amount: p.amount, reason: "", status: "OPEN", openedAt: new Date().toISOString() })} />
			<TerminalPanel terminal={terminal} payments={payments} onClose={() => setTerminal(null)} />
			<RefundModal refund={refund} isNew={!!refund && !refunds.some((r) => r.id === refund.id)} onClose={() => setRefund(null)} onSaved={(r) => { setRefunds((rs) => (rs.some((x) => x.id === r.id) ? rs.map((x) => (x.id === r.id ? r : x)) : [r, ...rs])); if (r.status === "APPROVED") setPayments((ps) => ps.map((p) => (p.id === r.paymentId ? { ...p, status: "REFUNDED" } : p))); }} />
			<DisputePanel dispute={dispute} payment={dispute ? payments.find((p) => p.id === dispute.paymentId) ?? null : null} isNew={!!dispute && !disputes.some((d) => d.id === dispute.id)} onClose={() => setDispute(null)} onSaved={(d) => setDisputes((ds) => (ds.some((x) => x.id === d.id) ? ds.map((x) => (x.id === d.id ? d : x)) : [d, ...ds]))} />
			<NewPaymentPanel open={!!isNew || !!folioId} folios={folios} preselect={folioId} onClose={() => { setIsNew(null); setFolioId(null); }} onSaved={(p) => setPayments((ps) => [p, ...ps])} />
		</>
	);
}
