"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	BanknoteIcon,
	CheckIcon,
	CreditCardIcon,
	PlayIcon,
	RefreshCwIcon,
	WalletIcon,
	XOctagonIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	createPayoutBatch,
	failSettlement,
	loadBatch,
	markBatchPaid,
	retryFailedPayout,
	runSettlements,
} from "@hospio/api/actions/payments-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	AdminPaymentRow,
	FailedPayoutItem,
	Paged,
	PaymentSummaryData,
	PayoutBatchItem,
	SettlementItem,
} from "@hospio/api/data/admin-types";
import type { BusinessRow } from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import {
	fmtAgo,
	fmtDay,
	fmtLongDate,
	fmtWhen,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	Loading,
	ServerPager,
	useFilterParam,
	useLoaded,
	usePageParam,
	useRefresh,
} from "./live";
import { can, ReadOnlyNote } from "./shared";

const settlementTone = {
	SETTLED: "success",
	PENDING: "warning",
	FAILED: "danger",
} as const;
const batchTone = {
	PAID: "success",
	PROCESSING: "info",
	PART_FAILED: "warning",
} as const;
const yesterday = () =>
	new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

/**
 * Admin — P1 · Payments (Figma 3345:7509): settlements, payout batches, failed payouts and the
 * cross-business payment list from payment-service `/payment/admin/**`. Money roles run settlements,
 * create batches, mark them paid, fail a settlement and retry payouts; Support reads.
 */
export function PaymentsScreen({
	role,
	settlements,
	batches,
	failed,
	payments,
	summary,
	businesses,
}: {
	role: AdminRole;
	settlements: Paged<SettlementItem>;
	batches: Paged<PayoutBatchItem>;
	failed: Paged<FailedPayoutItem>;
	payments: Paged<AdminPaymentRow>;
	summary: PaymentSummaryData | null;
	businesses: BusinessRow[];
}) {
	const [tab, setTab] = useFilterParam("tab");
	const [status, setStatus] = useFilterParam("status");
	const [biz, setBiz] = useFilterParam("businessId");
	const [from, setFrom] = useFilterParam("from");
	const [to, setTo] = useFilterParam("to");
	const [, setPage] = usePageParam();
	const [open, setOpen] = useQueryState("open");
	const [batchId, setBatchId] = useQueryState("batch");
	const [newBatch, setNewBatch] = useState(false);
	const [retry, setRetry] = useState<{
		f: FailedPayoutItem;
		resolve: boolean;
	} | null>(null);
	const { run, pending } = useAction();
	const { refresh } = useRefresh();
	const money = can.money(role);
	const active = tab || "settlements";
	const rows = settlements.content;
	const selected = rows.find((s) => s.id === open) ?? null;
	const pendingRows = rows.filter((s) => s.status === "PENDING");
	const gross = rows.reduce((a, s) => a + s.gross, 0);
	const hms = rows.reduce((a, s) => a + s.hmsShare, 0);
	const pendingNet = pendingRows.reduce((a, s) => a + s.net, 0);
	const bizOptions = useMemo(
		() => businesses.map((b) => ({ value: b.id, label: b.name })),
		[businesses],
	);

	const settlementCols: ColumnDef<SettlementItem, unknown>[] = [
		{
			accessorKey: "businessName",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.businessName}
					secondary={`${row.original.provider} · ${fmtDay(row.original.periodDate)}${row.original.paymentCount ? ` · ${plural(row.original.paymentCount, "payment")}` : ""}`}
				/>
			),
		},
		{
			accessorKey: "gross",
			header: "Gross taken",
			cell: ({ row }) => naira(row.original.gross),
		},
		{
			accessorKey: "providerFees",
			header: "Provider fee",
			cell: ({ row }) => (
				<span className="text-ink-3">{naira(row.original.providerFees)}</span>
			),
		},
		{
			accessorKey: "hmsShare",
			header: "H.M.S share",
			cell: ({ row }) => (
				<span className="font-semibold text-brand">
					{naira(row.original.hmsShare)}
				</span>
			),
		},
		{
			accessorKey: "net",
			header: "To the hotel",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.net)}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={settlementTone[row.original.status]}>
					{row.original.status.toLowerCase()}
				</StatusPill>
			),
		},
	];
	const batchCols: ColumnDef<PayoutBatchItem, unknown>[] = [
		{
			accessorKey: "ref",
			header: "Batch",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.ref}
					secondary={`${fmtWhen(row.original.createdAt)} · by ${row.original.createdBy}`}
				/>
			),
		},
		{
			accessorKey: "businessCount",
			header: "Businesses",
			cell: ({ row }) =>
				`${row.original.businessCount} · ${plural(row.original.settlementCount, "settlement")}`,
		},
		{
			accessorKey: "total",
			header: "Total",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.total)}</span>
			),
		},
		{
			accessorKey: "paidOn",
			header: "Paid",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{row.original.paidOn
						? `${fmtLongDate(row.original.paidOn)}${row.original.paidReference ? ` · ${row.original.paidReference}` : ""}`
						: "—"}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={batchTone[row.original.status]}>
					{row.original.status.toLowerCase().replace("_", " ")}
				</StatusPill>
			),
		},
	];
	const paymentCols: ColumnDef<AdminPaymentRow, unknown>[] = [
		{
			accessorKey: "reference",
			header: "Payment",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.reference}
					secondary={row.original.description}
				/>
			),
		},
		{ accessorKey: "guestName", header: "Guest" },
		{
			accessorKey: "method",
			header: "Method",
			cell: ({ row }) => row.original.method.toLowerCase(),
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.amount)}</span>
			),
		},
		{ accessorKey: "takenBy", header: "Taken by" },
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill
					tone={
						row.original.status === "APPROVED"
							? "success"
							: row.original.status === "PENDING" ||
									row.original.status === "PROCESSING"
								? "warning"
								: row.original.status === "REFUNDED"
									? "grey"
									: "danger"
					}
				>
					{row.original.status.toLowerCase().replace("_", " ")}
				</StatusPill>
			),
		},
		{
			accessorKey: "createdAt",
			header: "When",
			cell: ({ row }) => (
				<span className="text-ink-3">{fmtWhen(row.original.createdAt)}</span>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Payments"
				subtitle="Card and transfer money taken on POS terminals, settled per business and provider each day with the H.M.S share taken out"
			>
				{money && (
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						disabled={pending}
						onClick={() =>
							run(
								() => runSettlements(yesterday()),
								"Settlement run finished",
								(r) => {
									toast.info(
										`${r.created} created · ${r.skipped} skipped${r.date ? ` · ${fmtDay(r.date)}` : ""}`,
									);
									refresh();
								},
							)
						}
					>
						<PlayIcon className="size-4" /> Run settlements for yesterday
					</button>
				)}
				{money && (
					<button
						type="button"
						className={btn.primary}
						onClick={() => setNewBatch(true)}
					>
						Create payout batch
					</button>
				)}
			</PageHeader>
			{!money && (
				<ReadOnlyNote>
					Support can see settlements and payments. Payouts and retries are for
					Finance admin.
				</ReadOnlyNote>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{summary ? (
					<>
						<KpiCard
							label="Gross taken"
							value={nairaShort(summary.gross)}
							icon={CreditCardIcon}
							hint={`${plural(summary.count, "payment")} · ${biz ? (businesses.find((b) => b.id === biz)?.name ?? "this business") : "all"}`}
						/>
						<KpiCard
							label="By provider"
							value={summary.byProvider.length}
							icon={WalletIcon}
							hint={
								summary.byProvider
									.map((p) => `${p.provider} ${nairaShort(p.gross)}`)
									.join(" · ") || "—"
							}
						/>
					</>
				) : (
					<>
						<KpiCard
							label="Gross on this page"
							value={nairaShort(gross)}
							icon={CreditCardIcon}
							hint={plural(rows.length, "settlement")}
						/>
						<KpiCard
							label="H.M.S share"
							value={nairaShort(hms)}
							icon={WalletIcon}
							hint="Of the settlements shown"
						/>
					</>
				)}
				<KpiCard
					label="Waiting for payout"
					value={nairaShort(pendingNet)}
					icon={BanknoteIcon}
					hint={plural(pendingRows.length, "pending settlement")}
				/>
				<KpiCard
					label="Failed payouts"
					value={failed.total}
					icon={AlertTriangleIcon}
					pill={
						failed.total > 0 ? (
							<StatusPill tone="danger">
								{naira(failed.content.reduce((a, f) => a + f.amount, 0))}
							</StatusPill>
						) : undefined
					}
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{
								key: "settlements",
								label: "Settlements",
								count: settlements.total,
							},
							{ key: "batches", label: "Payout batches", count: batches.total },
							{ key: "failed", label: "Failed payouts", count: failed.total },
							{ key: "payments", label: "Payments", count: payments.total },
						]}
						value={active}
						onChange={(k) => {
							setTab(k === "settlements" ? null : k);
							setPage(0);
						}}
					/>
				}
				right={
					active === "settlements" || active === "payments" ? (
						<>
							<FilterSelect
								value={status}
								onChange={(v) => {
									setStatus(v);
									setPage(0);
								}}
								all="All statuses"
								options={
									active === "settlements"
										? [
												{ value: "PENDING", label: "Pending" },
												{ value: "SETTLED", label: "Settled" },
												{ value: "FAILED", label: "Failed" },
											]
										: [
												"PENDING",
												"PROCESSING",
												"APPROVED",
												"DECLINED",
												"FAILED",
												"REFUNDED",
											].map((v) => ({ value: v, label: v.toLowerCase() }))
								}
							/>
							<FilterSelect
								value={biz}
								onChange={(v) => {
									setBiz(v);
									setPage(0);
								}}
								all="All businesses"
								options={bizOptions}
							/>
							<input
								type="date"
								value={from}
								onChange={(e) => {
									setFrom(e.target.value);
									setPage(0);
								}}
								className="h-[38px] rounded-control border border-line bg-card px-3 text-[13px] text-ink"
								aria-label="From"
							/>
							<input
								type="date"
								value={to}
								onChange={(e) => {
									setTo(e.target.value);
									setPage(0);
								}}
								className="h-[38px] rounded-control border border-line bg-card px-3 text-[13px] text-ink"
								aria-label="To"
							/>
						</>
					) : undefined
				}
			/>
			{active === "settlements" && (
				<DataTable
					columns={settlementCols}
					data={rows}
					pageSize={settlements.size}
					onRowClick={(s) => setOpen(s.id)}
					emptyTitle="No settlements"
					emptyHint="Run settlements for yesterday to build them from approved card and transfer payments."
					footer={<ServerPager page={settlements} onPage={setPage} />}
				/>
			)}
			{active === "batches" && (
				<DataTable
					columns={batchCols}
					data={batches.content}
					pageSize={batches.size}
					onRowClick={(b) => setBatchId(b.id)}
					emptyTitle="No payout batches yet"
					footer={<ServerPager page={batches} onPage={setPage} />}
				/>
			)}
			{active === "payments" && (
				<DataTable
					columns={paymentCols}
					data={payments.content}
					pageSize={payments.size}
					emptyTitle="No payments"
					footer={<ServerPager page={payments} onPage={setPage} />}
				/>
			)}
			{active === "failed" && (
				<SectionCard
					title="Failed payouts"
					subtitle="Money we hold for the hotel until the bank details are fixed"
					count={failed.total}
				>
					{failed.content.length === 0 ? (
						<p className="py-4 text-sm text-ink-3">Nothing failed.</p>
					) : (
						failed.content.map((f, i) => (
							<div
								key={f.id}
								className={cn(
									"flex items-center gap-3 py-3",
									i < failed.content.length - 1 && "border-b border-line",
								)}
							>
								<AlertTriangleIcon className="size-4 shrink-0 text-danger" />
								<div className="min-w-0 flex-1">
									<p className="text-[13px] font-semibold text-ink">
										{f.businessName} · {naira(f.amount)}
									</p>
									<p className="text-xs text-ink-3">
										{f.bankLabel} · {f.reason} · {plural(f.attempts, "attempt")}
										{f.lastTriedAt ? ` · last ${fmtAgo(f.lastTriedAt)}` : ""}
									</p>
								</div>
								{money && (
									<button
										type="button"
										className={cn(btn.secondary, "flex items-center gap-2")}
										onClick={() => setRetry({ f, resolve: false })}
									>
										<RefreshCwIcon className="size-4" /> Retry
									</button>
								)}
								{money && (
									<button
										type="button"
										className={cn(btn.ghost, "flex items-center gap-2")}
										onClick={() => setRetry({ f, resolve: true })}
									>
										<CheckIcon className="size-4" /> Resolve
									</button>
								)}
							</div>
						))
					)}
					<div className="pt-3">
						<ServerPager page={failed} onPage={setPage} />
					</div>
				</SectionCard>
			)}

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={
					selected ? `${selected.businessName} · ${selected.provider}` : ""
				}
				subtitle={
					selected ? `Settlement for ${fmtDay(selected.periodDate)}` : undefined
				}
				icon={CreditCardIcon}
				width="md"
			>
				{selected && (
					<div className="flex flex-col gap-5">
						<DetailList
							columns={2}
							items={[
								{
									label: "Status",
									value: (
										<StatusPill tone={settlementTone[selected.status]}>
											{selected.status.toLowerCase()}
										</StatusPill>
									),
								},
								{
									label: "Settled at",
									value: selected.settledAt ? fmtWhen(selected.settledAt) : "—",
								},
								{
									label: "Payout batch",
									value: selected.payoutBatchId ? (
										<button
											type="button"
											className="font-semibold text-brand hover:underline"
											onClick={() => {
												void setOpen(null);
												void setBatchId(selected.payoutBatchId ?? null);
											}}
										>
											Open batch
										</button>
									) : (
										"—"
									),
								},
								{ label: "Payments", value: selected.paymentCount || "—" },
							]}
						/>
						<PanelSection title="Breakdown">
							<TotalsList
								rows={[
									{
										label: "Gross taken on terminals",
										value: naira(selected.gross),
									},
									{
										label: `${selected.provider} fee`,
										value: `-${naira(selected.providerFees)}`,
									},
									{
										label: "H.M.S share",
										value: `-${naira(selected.hmsShare)}`,
									},
									{
										label: "Paid to the hotel",
										value: naira(selected.net),
										strong: true,
									},
								]}
							/>
						</PanelSection>
						{selected.status === "FAILED" && (
							<Note tone="danger">
								{selected.failureReason || "The bank bounced this payout."} It
								is listed under Failed payouts until it is retried or resolved.
							</Note>
						)}
					</div>
				)}
			</SidePanel>

			<BatchPanel
				id={batchId}
				canPay={money}
				onClose={() => void setBatchId(null)}
				onChanged={refresh}
			/>

			<CreateBatchModal
				open={newBatch}
				onOpenChange={setNewBatch}
				pendingRows={pendingRows}
				onCreated={(id) => {
					setNewBatch(false);
					refresh();
					void setBatchId(id);
				}}
			/>

			<ConfirmModal
				open={!!retry}
				onOpenChange={(o) => !o && setRetry(null)}
				title={
					retry?.resolve
						? `Mark ${naira(retry.f.amount)} as resolved?`
						: `Retry payout of ${naira(retry?.f.amount ?? 0)}?`
				}
				subtitle={
					retry ? `${retry.f.businessName} · ${retry.f.bankLabel}` : undefined
				}
				confirmLabel={retry?.resolve ? "Resolve" : "Retry payout"}
				pending={pending}
				onConfirm={() =>
					retry &&
					run(
						() => retryFailedPayout(retry.f.id, retry.resolve, retry.f),
						retry.resolve ? "Payout resolved" : "Retry recorded",
						() => {
							setRetry(null);
							refresh();
						},
					)
				}
			>
				<WhatHappens
					items={
						retry?.resolve
							? [
									"The failed payout is closed; the bank confirmed the money landed",
									"The settlement stays as settled",
								]
							: [
									"Another attempt is counted and timed",
									"Resolve it once the bank confirms the transfer",
								]
					}
				/>
			</ConfirmModal>
		</>
	);
}

function BatchPanel({
	id,
	canPay,
	onClose,
	onChanged,
}: {
	id: string | null;
	canPay: boolean;
	onClose: () => void;
	onChanged: () => void;
}) {
	const { data, setData, loading, error } = useLoaded(id, loadBatch);
	const { run, pending } = useAction();
	const [markPaid, setMarkPaid] = useState(false);
	const [ref, setRef] = useState("");
	const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
	const [failing, setFailing] = useState<SettlementItem | null>(null);
	const [reason, setReason] = useState("");
	const [bank, setBank] = useState("");
	const b = data?.batch;
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={b ? b.ref : "Payout batch"}
			subtitle={
				b ? (
					<span className="flex items-center gap-2">
						{fmtWhen(b.createdAt)} · by {b.createdBy}{" "}
						<StatusPill tone={batchTone[b.status]}>
							{b.status.toLowerCase().replace("_", " ")}
						</StatusPill>
					</span>
				) : undefined
			}
			icon={BanknoteIcon}
			width="lg"
			footerInfo={
				b
					? `${naira(b.total)} · ${plural(b.businessCount, "business", "businesses")}`
					: undefined
			}
			footer={
				b && canPay && b.status === "PROCESSING" ? (
					<button
						type="button"
						className={btn.primary}
						onClick={() => setMarkPaid(true)}
					>
						Mark paid
					</button>
				) : undefined
			}
		>
			{loading && <Loading />}
			{error && <Note tone="danger">{error}</Note>}
			{data && (
				<div className="flex flex-col gap-5">
					<DetailList
						columns={2}
						items={[
							{
								label: "Paid on",
								value: b?.paidOn ? fmtLongDate(b.paidOn) : "—",
							},
							{ label: "Reference", value: b?.paidReference ?? "—" },
							{ label: "Settlements", value: b?.settlementCount },
							{ label: "Total", value: naira(b?.total ?? 0) },
						]}
					/>
					<PanelSection title="Settlements in this batch">
						<ul className="divide-y divide-line rounded-xl border border-line">
							{data.settlements.map((s) => (
								<li
									key={s.id}
									className="flex items-center gap-3 px-4 py-[10px]"
								>
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">
											{s.businessName} · {naira(s.net)}
										</p>
										<p className="text-xs text-ink-3">
											{s.provider} · {fmtDay(s.periodDate)}
											{s.failureReason ? ` · ${s.failureReason}` : ""}
										</p>
									</div>
									<StatusPill tone={settlementTone[s.status]}>
										{s.status.toLowerCase()}
									</StatusPill>
									{canPay && s.status !== "FAILED" && (
										<button
											type="button"
											className={cn(
												btn.ghost,
												btn.small,
												"flex items-center gap-1 text-danger",
											)}
											onClick={() => {
												setFailing(s);
												setReason("");
												setBank("");
											}}
										>
											<XOctagonIcon className="size-3" /> Bank bounced it
										</button>
									)}
								</li>
							))}
						</ul>
					</PanelSection>
				</div>
			)}

			<Modal
				open={markPaid}
				onOpenChange={setMarkPaid}
				title="Mark batch paid"
				subtitle="The transfer went out; every settlement in it gets its settled time"
				icon={CheckIcon}
				size="form"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setMarkPaid(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || !b}
							onClick={() =>
								b &&
								run(
									() =>
										markBatchPaid(
											b.id,
											{
												reference: ref || undefined,
												paidOn: paidOn || undefined,
											},
											data ?? undefined,
										),
									`${b.ref} marked paid`,
									(d) => {
										setData(d);
										setMarkPaid(false);
										onChanged();
									},
								)
							}
						>
							Mark paid
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextField
						label="Bank reference"
						value={ref}
						onChange={setRef}
						placeholder="GTB-…"
					/>
					<TextField
						label="Paid on"
						type="date"
						value={paidOn}
						onChange={setPaidOn}
					/>
				</div>
			</Modal>

			<Modal
				open={!!failing}
				onOpenChange={(o) => !o && setFailing(null)}
				title="The bank bounced a settlement"
				subtitle={
					failing
						? `${failing.businessName} · ${naira(failing.net)}`
						: undefined
				}
				icon={XOctagonIcon}
				tone="danger"
				size="form"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setFailing(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.danger}
							disabled={pending || !b || !failing}
							onClick={() =>
								b &&
								failing &&
								run(
									() =>
										failSettlement(
											b.id,
											{
												settlementId: failing.id,
												reason: reason || undefined,
												bankLabel: bank || undefined,
											},
											data ?? undefined,
										),
									"Settlement marked failed",
									(d) => {
										setData(d);
										setFailing(null);
										onChanged();
									},
								)
							}
						>
							Mark failed
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TextField
						label="Why"
						value={reason}
						onChange={setReason}
						placeholder="Account name mismatch"
					/>
					<TextField
						label="Bank account (as the bank showed it)"
						value={bank}
						onChange={setBank}
						placeholder="Zenith · 2011****45"
					/>
					<WhatHappens
						tone="danger"
						items={[
							"The settlement becomes FAILED and the batch PART_FAILED",
							"A failed payout is opened to retry once the owner fixes the account",
						]}
					/>
				</div>
			</Modal>
		</SidePanel>
	);
}

function CreateBatchModal({
	open,
	onOpenChange,
	pendingRows,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	pendingRows: SettlementItem[];
	onCreated: (batchId: string) => void;
}) {
	const { run, pending } = useAction();
	const [mode, setMode] = useState<"all" | "pick">("all");
	const [picked, setPicked] = useState<string[]>([]);
	const toggle = (id: string) =>
		setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
	const total = (
		mode === "all"
			? pendingRows
			: pendingRows.filter((s) => picked.includes(s.id))
	).reduce((a, s) => a + s.net, 0);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Create payout batch"
			subtitle="Bundle pending settlements into one bank run"
			icon={BanknoteIcon}
			size="form"
			footerInfo={
				mode === "pick"
					? `${picked.length} chosen · ${naira(total)}`
					: "Every pending settlement on the platform"
			}
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
						disabled={pending || (mode === "pick" && picked.length === 0)}
						onClick={() =>
							run(
								() =>
									createPayoutBatch(
										mode === "all" ? undefined : picked,
										pendingRows,
									),
								"Payout batch created",
								(d) => {
									setPicked([]);
									onCreated(d.batch.id);
								},
							)
						}
					>
						Create batch
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Which settlements"
					value={mode}
					onChange={(v) => setMode(v === "pick" ? "pick" : "all")}
					options={[
						{ value: "all", label: "All pending settlements" },
						{ value: "pick", label: "Choose from the ones shown" },
					]}
				/>
				{mode === "pick" && (
					<ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">
						{pendingRows.length === 0 && (
							<li className="px-4 py-3 text-sm text-ink-3">
								No pending settlements on this page. Change the filters or pick
								"All pending".
							</li>
						)}
						{pendingRows.map((s) => (
							<li key={s.id}>
								<label className="flex cursor-pointer items-center gap-3 px-4 py-[10px]">
									<input
										type="checkbox"
										checked={picked.includes(s.id)}
										onChange={() => toggle(s.id)}
										className="size-4 accent-brand"
									/>
									<span className="min-w-0 flex-1">
										<span className="block text-[13px] font-semibold text-ink">
											{s.businessName} · {naira(s.net)}
										</span>
										<span className="block text-xs text-ink-3">
											{s.provider} · {fmtDay(s.periodDate)}
										</span>
									</span>
								</label>
							</li>
						))}
					</ul>
				)}
				<WhatHappens
					items={[
						"The settlements move to SETTLED and wait for the bank transfer",
						"Mark the batch paid with the bank reference once it clears",
						"A bounced transfer is marked on its settlement and lands under Failed payouts",
					]}
				/>
			</div>
		</Modal>
	);
}
