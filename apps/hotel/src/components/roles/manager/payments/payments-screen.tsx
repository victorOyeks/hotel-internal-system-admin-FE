"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	CreditCardIcon,
	PlusIcon,
	RotateCcwIcon,
	WifiIcon,
	WifiOffIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import {
	fmtWhen,
	humanize,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { type PillTone, StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { resendReceipt, verifyPayment } from "@hospio/api/actions/payment";
import { useAction } from "@hospio/api/actions/use-action";
import { exportPayments } from "@hospio/api/actions/reservation-lists";
import type { PageResult } from "@hospio/api/data/paging";
import { csvName, downloadCsv } from "@hospio/ui/shared/csv";
import { useListParams } from "@hospio/ui/shared/list-params";
import { toast } from "sonner";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type {
	DisputeRow,
	FolioRow,
	PaymentRow,
	PaymentStatus,
	RefundRow,
	TerminalRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	DisputePanel,
	LinkTerminalPanel,
	NewPaymentPanel,
	PaymentPanel,
	RefundModal,
	TerminalPanel,
} from "./payment-panels";

const TABS = ["all", "terminals", "refunds", "disputes"] as const;
type Tab = (typeof TABS)[number];

export const paymentTone: Record<PaymentStatus, PillTone> = {
	APPROVED: "success",
	PROCESSING: "info",
	PENDING: "info",
	DECLINED: "danger",
	NO_RESPONSE: "warning",
	FAILED: "danger",
	REFUNDED: "grey",
};
export const methodLabel = {
	CARD: "Card",
	TRANSFER: "Transfer",
	CASH: "Cash",
} as const;

/** The payments the service sorts by, per column. */
const SORT_KEYS = {
	guestName: "guestName",
	method: "method",
	amount: "amount",
	createdAt: "createdAt",
	status: "status",
};

/** The page facts of a paged result (refunds, disputes). */
function pageOf<T>(r: PageResult<T>) {
	return r.data;
}

export function PaymentsScreen({
	hotelName,
	payments: result,
	terminals: initialTerminals,
	refunds: refundsResult,
	disputes: disputesResult,
	folios,
	opened,
}: {
	hotelName: string;
	/** One page of payments with the counts and money over the whole filtered range (payment-service). */
	payments: PageResult<PaymentRow>;
	terminals: TerminalRow[];
	refunds: PageResult<RefundRow>;
	disputes: PageResult<DisputeRow>;
	folios: FolioRow[];
	/** The payment in `?open=` when it is not on this page. */
	opened?: PaymentRow | null;
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["method"] });
	const refundsList = useListParams({ prefix: "refunds" });
	const disputesList = useListParams({ prefix: "disputes" });
	const [exporting, setExporting] = useState(false);
	const [tab] = useQueryState("tab", parseAsString.withDefault("all"));
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [folioId, setFolioId] = useQueryState("folio");
	const [payments, setPayments] = useState(result.data.content);
	useEffect(() => setPayments(result.data.content), [result]);
	const [terminals, setTerminals] = useState(initialTerminals);
	const [linking, setLinking] = useState(false);
	const [refunds, setRefunds] = useState(refundsResult.data.content);
	useEffect(() => setRefunds(refundsResult.data.content), [refundsResult]);
	const [disputes, setDisputes] = useState(disputesResult.data.content);
	useEffect(() => setDisputes(disputesResult.data.content), [disputesResult]);
	const method = list.params.method ?? "";
	const status = list.params.status ?? "";
	const [terminal, setTerminal] = useState<TerminalRow | null>(null);
	const [refund, setRefund] = useState<RefundRow | null>(null);
	const [dispute, setDispute] = useState<DisputeRow | null>(null);
	const live = useAction();
	const active = (TABS.includes(tab as Tab) ? tab : "all") as Tab;
	const selected =
		payments.find((p) => p.id === openId) ??
		(opened && opened.id === openId ? opened : null);

	// The cards and tab counts are the service's, over the whole range (docs/pagination.md), not this page.
	const totals = result.data.totals ?? {};
	const counts = result.data.counts ?? {};
	const todayTotal = totals.approvedToday ?? 0;
	const todayCount = totals.approvedTodayCount ?? 0;
	const attention = counts.attention ?? 0;
	const pendingRefundCount = refundsResult.data.counts?.PENDING_APPROVAL ?? 0;
	const pendingRefundAmount = refundsResult.data.totals?.pending ?? 0;
	const openDisputeCount = disputesResult.data.counts?.OPEN ?? 0;

	const doExport = async () => {
		setExporting(true);
		try {
			const r = await exportPayments({
				q: list.params.q ?? undefined,
				status: status || undefined,
				method: method || undefined,
				from: list.params.from ?? undefined,
				to: list.params.to ?? undefined,
			});
			if (!r.ok) {
				toast.error(r.error);
				return;
			}
			downloadCsv(csvName(`Payments · ${hotelName}`), [
				[
					"When",
					"Reference",
					"Guest",
					"For",
					"Desk",
					"Taken by",
					"Method",
					"Amount (NGN)",
					"Status",
					"Provider ref",
				],
				...r.data.rows.map((p) => [
					p.createdAt,
					p.reference,
					p.guestName,
					p.description,
					humanize(p.role),
					p.takenBy,
					methodLabel[p.method as keyof typeof methodLabel] ?? p.method,
					p.amount,
					humanize(p.status),
					p.providerRef ?? "",
				]),
			]);
			toast.success(`${plural(r.data.rows.length, "payment")} exported`);
		} finally {
			setExporting(false);
		}
	};

	const columns: ColumnDef<PaymentRow, unknown>[] = [
		{
			accessorKey: "guestName",
			header: "Guest / payer",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.guestName}
					secondary={
						<>
							{row.original.reference}
							{row.original.roomNumber
								? ` · Room ${row.original.roomNumber}`
								: ""}
						</>
					}
				/>
			),
		},
		{
			accessorKey: "description",
			header: "For",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.description}
					secondary={`${humanize(row.original.role)} · ${row.original.takenBy}`}
				/>
			),
		},
		{
			accessorKey: "method",
			header: "Method",
			cell: ({ row }) => (
				<TwoLine
					primary={methodLabel[row.original.method]}
					secondary={row.original.terminal ?? row.original.providerRef}
				/>
			),
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<span
					className={cn(
						"font-semibold",
						row.original.status === "REFUNDED"
							? "text-ink-3 line-through"
							: "text-ink",
					)}
				>
					{naira(row.original.amount)}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: "When",
			cell: ({ row }) => fmtWhen(row.original.createdAt),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={paymentTone[row.original.status]}>
					{humanize(row.original.status)}
				</StatusPill>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => {
				const p = row.original;
				return (
					<RowActions
						actions={[
							{ label: "Open payment", onClick: () => setOpenId(p.id) },
							{
								label: "Email receipt again",
								onClick: () =>
									live.run(
										() =>
											withDeliveries(
												resendReceipt(p.id),
												`Receipt for ${p.guestName}`,
											),
										(r) => `Receipt emailed to ${r.sentTo}`,
									),
								disabled: p.status !== "APPROVED",
							},
							...(p.status === "NO_RESPONSE" || p.status === "PROCESSING"
								? [
										{
											label: "Check with provider",
											onClick: () =>
												live.run(
													() => verifyPayment(p.id),
													"Checked with the provider",
													(r) =>
														setPayments((ps) =>
															ps.map((x) =>
																x.id === p.id
																	? {
																			...x,
																			status: r.status,
																			resolvedAt: new Date().toISOString(),
																		}
																	: x,
															),
														),
												),
										},
									]
								: []),
							{
								label: "Request refund",
								managerOnly: true,
								separatorBefore: true,
								onClick: () =>
									setRefund({
										id: `rf-${Date.now()}`,
										paymentId: p.id,
										guestName: p.guestName,
										amount: p.amount,
										reason: "",
										status: "PENDING_APPROVAL",
										requestedBy: "You",
										createdAt: new Date().toISOString(),
									}),
								disabled: p.status !== "APPROVED",
							},
						]}
					/>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				title="Payments"
				subtitle={`${hotelName} · every payment taken at the desk, bar, kitchen and laundry`}
			>
				<ExportButton
					onClick={exporting ? undefined : () => void doExport()}
					label={exporting ? "Exporting…" : "Export"}
				/>
				<Button className={btn.primary} onClick={() => setIsNew("1")}>
					<PlusIcon className="size-[15px]" /> Record payment
				</Button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Taken today"
					value={nairaShort(todayTotal)}
					icon={CreditCardIcon}
					hint={`${plural(todayCount, "approved payment")} today`}
				/>
				<KpiCard
					label="Needs a look"
					value={attention}
					icon={AlertTriangleIcon}
					hint="Declined, no response or still processing"
					pill={
						attention > 0 ? (
							<StatusPill tone="warning">check</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label="Refunds waiting"
					value={pendingRefundCount}
					icon={RotateCcwIcon}
					hint={naira(pendingRefundAmount)}
					pill={
						pendingRefundCount > 0 ? (
							<StatusPill tone="info">approve</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label="POS terminals"
					value={`${terminals.filter((t) => t.status === "ONLINE").length}/${terminals.length}`}
					icon={WifiIcon}
					hint={
						terminals.some((t) => t.status === "OFFLINE")
							? `${terminals
									.filter((t) => t.status === "OFFLINE")
									.map((t) => t.name)
									.join(", ")} offline`
							: "All online"
					}
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						param="tab"
						defaultValue="all"
						tabs={[
							{
								key: "all",
								label: "All payments",
								count: result.data.total,
							},
							{
								key: "terminals",
								label: "POS terminals",
								count: terminals.length,
							},
							{
								key: "refunds",
								label: "Refunds",
								count: refundsResult.data.counts?.all ?? refunds.length,
							},
							{
								key: "disputes",
								label: "Disputes",
								count: openDisputeCount,
							},
						]}
					/>
				}
				right={
					active === "all" ? (
						<>
							<FilterSelect
								value={method}
								onChange={(v) => list.set({ method: v })}
								all="All methods"
								options={[
									{ value: "CARD", label: "Card" },
									{ value: "TRANSFER", label: "Transfer" },
									{ value: "CASH", label: "Cash" },
								]}
							/>
							<FilterSelect
								value={status}
								onChange={(v) => list.set({ status: v })}
								all="Any status"
								options={(
									[
										"APPROVED",
										"PROCESSING",
										"DECLINED",
										"NO_RESPONSE",
										"REFUNDED",
									] as PaymentStatus[]
								).map((s) => ({ value: s, label: humanize(s) }))}
							/>
							<SearchBox
								value={list.search}
								onChange={list.setSearch}
								placeholder="Guest, ref, staff…"
							/>
						</>
					) : undefined
				}
			/>

			{active === "all" && (
				<DataTable
					columns={columns}
					data={payments}
					server={{
						page: result.data,
						onPage: list.goTo,
						sort: list.sort,
						onSort: list.setSort,
						sortKeys: SORT_KEYS,
					}}
					filtered={list.filtered}
					onClearFilters={list.clear}
					error={result.ok ? null : result.error}
					onRetry={() => router.refresh()}
					onRowClick={(p) => setOpenId(p.id)}
					emptyTitle="No payments in the last 90 days"
				/>
			)}

			{active === "terminals" && (
				<div className="grid gap-4 md:grid-cols-3">
					{terminals.map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={() => setTerminal(t)}
							className="flex flex-col gap-3 rounded-card border border-line bg-card p-5 text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
						>
							<div className="flex items-start gap-3">
								<span
									className={cn(
										"flex size-10 items-center justify-center rounded-xl",
										t.status === "ONLINE"
											? "bg-success-soft text-success"
											: "bg-danger-soft text-danger",
									)}
								>
									{t.status === "ONLINE" ? (
										<WifiIcon className="size-5" />
									) : (
										<WifiOffIcon className="size-5" />
									)}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-base font-bold text-ink">{t.name}</p>
									<p className="text-xs text-ink-3">
										{t.provider} · {t.ref}
									</p>
								</div>
								<StatusPill tone={t.status === "ONLINE" ? "success" : "danger"}>
									{t.status === "ONLINE" ? "Online" : "Offline"}
								</StatusPill>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-xl bg-subtle/70 px-3 py-2">
									<p className="text-[11px] text-ink-3">Today</p>
									<p className="text-sm font-bold text-ink">
										{naira(t.todayAmount)}
									</p>
								</div>
								<div className="rounded-xl bg-subtle/70 px-3 py-2">
									<p className="text-[11px] text-ink-3">Payments</p>
									<p className="text-sm font-bold text-ink">{t.todayCount}</p>
								</div>
							</div>
							<p className="text-xs text-ink-3">
								Used by {t.roles.map(humanize).join(", ")} · last seen{" "}
								{fmtWhen(t.lastSeen)}
							</p>
						</button>
					))}
					<button
						type="button"
						onClick={() => setLinking(true)}
						className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong text-sm font-semibold text-ink-2 hover:bg-subtle"
					>
						<PlusIcon className="size-5" /> Link a terminal
					</button>
				</div>
			)}

			{active === "refunds" && (
				<DataTable<RefundRow>
					data={refunds}
					server={{ page: pageOf(refundsResult), onPage: refundsList.goTo }}
					error={refundsResult.ok ? null : refundsResult.error}
					onRetry={() => router.refresh()}
					onRowClick={(r) => setRefund(r)}
					emptyTitle="No refunds"
					columns={[
						{
							accessorKey: "guestName",
							header: "Guest",
							cell: ({ row }) => (
								<AvatarName
									name={row.original.guestName}
									secondary={`Requested by ${row.original.requestedBy}`}
								/>
							),
						},
						{
							accessorKey: "amount",
							header: "Amount",
							cell: ({ row }) => (
								<span className="font-semibold">
									{naira(row.original.amount)}
								</span>
							),
						},
						{ accessorKey: "reason", header: "Reason" },
						{
							accessorKey: "createdAt",
							header: "When",
							cell: ({ row }) => fmtWhen(row.original.createdAt),
						},
						{
							accessorKey: "status",
							header: "Status",
							cell: ({ row }) => (
								<StatusPill
									tone={
										row.original.status === "APPROVED"
											? "success"
											: row.original.status === "DECLINED"
												? "danger"
												: "info"
									}
								>
									{humanize(row.original.status)}
								</StatusPill>
							),
						},
						{
							id: "a",
							header: "",
							enableSorting: false,
							cell: ({ row }) =>
								row.original.status === "PENDING_APPROVAL" ? (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setRefund(row.original);
										}}
										className={`${btn.primary} ${btn.small}`}
									>
										Review
									</button>
								) : null,
						},
					]}
				/>
			)}

			{active === "disputes" && (
				<DataTable<DisputeRow>
					data={disputes}
					server={{ page: pageOf(disputesResult), onPage: disputesList.goTo }}
					error={disputesResult.ok ? null : disputesResult.error}
					onRetry={() => router.refresh()}
					onRowClick={(d) => setDispute(d)}
					emptyTitle="No disputes"
					columns={[
						{
							accessorKey: "guestName",
							header: "Guest",
							cell: ({ row }) => (
								<AvatarName
									name={row.original.guestName}
									secondary={`Payment ${row.original.paymentReference ?? payments.find((p) => p.id === row.original.paymentId)?.reference ?? ""}`}
								/>
							),
						},
						{
							accessorKey: "amount",
							header: "Amount",
							cell: ({ row }) => (
								<span className="font-semibold">
									{naira(row.original.amount)}
								</span>
							),
						},
						{ accessorKey: "reason", header: "What the guest says" },
						{
							accessorKey: "openedAt",
							header: "Opened",
							cell: ({ row }) => fmtWhen(row.original.openedAt),
						},
						{
							accessorKey: "status",
							header: "Status",
							cell: ({ row }) => (
								<StatusPill
									tone={row.original.status === "OPEN" ? "warning" : "success"}
								>
									{row.original.status === "OPEN" ? "Open" : "Resolved"}
								</StatusPill>
							),
						},
					]}
				/>
			)}

			<PaymentPanel
				payment={selected}
				onClose={() => setOpenId(null)}
				onRefund={(p) =>
					setRefund({
						id: `rf-${Date.now()}`,
						paymentId: p.id,
						guestName: p.guestName,
						amount: p.amount,
						reason: "",
						status: "PENDING_APPROVAL",
						requestedBy: "You",
						createdAt: new Date().toISOString(),
					})
				}
				onStatus={(id, st) =>
					setPayments((ps) =>
						ps.map((x) =>
							x.id === id
								? { ...x, status: st, resolvedAt: new Date().toISOString() }
								: x,
						),
					)
				}
				onDispute={(p) =>
					setDispute({
						id: `dp-${Date.now()}`,
						paymentId: p.id,
						guestName: p.guestName,
						amount: p.amount,
						reason: "",
						status: "OPEN",
						openedAt: new Date().toISOString(),
					})
				}
			/>
			<TerminalPanel
				terminal={terminal}
				payments={payments}
				onClose={() => setTerminal(null)}
				onChanged={(t) => {
					setTerminals((ts) =>
						ts.map((x) =>
							x.id === t.id
								? t
								: { ...x, roles: x.roles.filter((r) => !t.roles.includes(r)) },
						),
					);
					setTerminal(t);
				}}
				onRemoved={(id) => setTerminals((ts) => ts.filter((x) => x.id !== id))}
			/>
			<LinkTerminalPanel
				open={linking}
				onClose={() => setLinking(false)}
				onLinked={(t) =>
					setTerminals((ts) => [
						...ts.map((x) => ({
							...x,
							roles: x.roles.filter((r) => !t.roles.includes(r)),
						})),
						t,
					])
				}
			/>
			<RefundModal
				refund={refund}
				isNew={!!refund && !refunds.some((r) => r.id === refund.id)}
				onClose={() => setRefund(null)}
				onSaved={(r) => {
					setRefunds((rs) =>
						rs.some((x) => x.id === r.id)
							? rs.map((x) => (x.id === r.id ? r : x))
							: [r, ...rs],
					);
					if (r.status === "APPROVED")
						setPayments((ps) =>
							ps.map((p) =>
								p.id === r.paymentId ? { ...p, status: "REFUNDED" } : p,
							),
						);
				}}
			/>
			<DisputePanel
				dispute={dispute}
				payment={
					dispute
						? (payments.find((p) => p.id === dispute.paymentId) ?? null)
						: null
				}
				isNew={!!dispute && !disputes.some((d) => d.id === dispute.id)}
				onClose={() => setDispute(null)}
				onSaved={(d) =>
					setDisputes((ds) =>
						ds.some((x) => x.id === d.id)
							? ds.map((x) => (x.id === d.id ? d : x))
							: [d, ...ds],
					)
				}
			/>
			<NewPaymentPanel
				open={!!isNew || !!folioId}
				folios={folios}
				preselect={folioId}
				onClose={() => {
					setIsNew(null);
					setFolioId(null);
				}}
				onSaved={(p) => setPayments((ps) => [p, ...ps])}
			/>
		</>
	);
}
