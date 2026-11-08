"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, BanknoteIcon, CreditCardIcon, RefreshCwIcon, WalletIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { TextField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtDay, fmtWhen, naira, nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, FilterSelect, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { AdminRole, FailedPayoutRow, PayoutBatchRow, SettlementRow } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { can, ReadOnlyNote } from "./shared";

export function PaymentsScreen({ role, settlements, batches, failed: initialFailed }: { role: AdminRole; settlements: SettlementRow[]; batches: PayoutBatchRow[]; failed: FailedPayoutRow[] }) {
	const [tab, setTab] = useQueryState("tab");
	const [open, setOpen] = useQueryState("open");
	const [provider, setProvider] = useState("");
	const [failed, setFailed] = useState(initialFailed);
	const [retry, setRetry] = useState<FailedPayoutRow | null>(null);
	const { run, pending } = useDemoAction();
	const money = can.money(role);
	const active = tab ?? "settlements";
	const today = settlements.filter((s) => s.period === "2026-11-07");
	const gross = today.reduce((a, s) => a + s.gross, 0);
	const hms = today.reduce((a, s) => a + s.hmsShare, 0);
	const selected = settlements.find((s) => s.id === open) ?? null;
	const rows = settlements.filter((s) => !provider || s.provider === provider);

	const settlementCols: ColumnDef<SettlementRow, unknown>[] = [
		{ accessorKey: "businessName", header: "Business", cell: ({ row }) => <TwoLine primary={row.original.businessName} secondary={`${row.original.provider} · ${fmtDay(row.original.period)}`} /> },
		{ accessorKey: "gross", header: "Gross taken", cell: ({ row }) => naira(row.original.gross) },
		{ accessorKey: "providerFees", header: "Provider fee", cell: ({ row }) => <span className="text-ink-3">{naira(row.original.providerFees)}</span> },
		{ accessorKey: "hmsShare", header: "H.M.S share", cell: ({ row }) => <span className="font-semibold text-brand">{naira(row.original.hmsShare)}</span> },
		{ accessorKey: "net", header: "To the hotel", cell: ({ row }) => <span className="font-semibold">{naira(row.original.net)}</span> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "SETTLED" ? "success" : row.original.status === "PENDING" ? "warning" : "danger"}>{row.original.status.toLowerCase()}</StatusPill> },
	];
	const batchCols: ColumnDef<PayoutBatchRow, unknown>[] = [
		{ accessorKey: "ref", header: "Batch", cell: ({ row }) => <TwoLine primary={row.original.ref} secondary={`${fmtWhen(row.original.createdAt)} · by ${row.original.by}`} /> },
		{ accessorKey: "businesses", header: "Businesses" },
		{ accessorKey: "total", header: "Total paid out", cell: ({ row }) => <span className="font-semibold">{naira(row.original.total)}</span> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "PAID" ? "success" : row.original.status === "PROCESSING" ? "info" : "warning"}>{row.original.status.toLowerCase().replace("_", " ")}</StatusPill> },
	];

	return (
		<>
			<PageHeader title="Payments" subtitle="Card and transfer money taken on POS terminals, settled to hotels daily with the H.M.S share taken out">
				<ExportButton label="Export settlements" />
				{money && <button type="button" className={btn.primary} onClick={() => run("Payout batch PB-2026-313 started · 2 businesses", undefined, { tone: "info" })}>Run payouts now</button>}
			</PageHeader>
			{!money && <ReadOnlyNote>Support can see settlements. Payouts and retries are for Finance admin.</ReadOnlyNote>}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Taken on POS today" value={nairaShort(gross)} icon={CreditCardIcon} hint={`${today.length} settlements`} />
				<KpiCard label="H.M.S share today" value={nairaShort(hms)} icon={WalletIcon} hint="1.5% of card and transfer" />
				<KpiCard label="Paid to hotels today" value={nairaShort(today.filter((s) => s.status === "SETTLED").reduce((a, s) => a + s.net, 0))} icon={BanknoteIcon} />
				<KpiCard label="Failed payouts" value={failed.length} icon={AlertTriangleIcon} pill={failed.length > 0 ? <StatusPill tone="danger">{naira(failed.reduce((a, f) => a + f.amount, 0))}</StatusPill> : undefined} />
			</div>
			<Toolbar
				left={<PillTabs tabs={[{ key: "settlements", label: "Settlements", count: settlements.length }, { key: "batches", label: "Payout batches", count: batches.length }, { key: "failed", label: "Failed payouts", count: failed.length }]} value={active} onChange={(k) => void setTab(k === "settlements" ? null : k)} />}
				right={active === "settlements" ? <FilterSelect value={provider} onChange={setProvider} all="All providers" options={[{ value: "Moniepoint", label: "Moniepoint" }, { value: "OPay", label: "OPay" }]} /> : undefined}
			/>
			{active === "settlements" && <DataTable columns={settlementCols} data={rows} onRowClick={(s) => setOpen(s.id)} />}
			{active === "batches" && <DataTable columns={batchCols} data={batches} onRowClick={(b) => run(`${b.ref} · ${b.businesses} payouts · ${naira(b.total)}`, undefined, { tone: "info" })} />}
			{active === "failed" && (
				<SectionCard title="Failed payouts" subtitle="Money we hold for the hotel until the bank details are fixed" count={failed.length}>
					{failed.length === 0 ? <p className="py-4 text-sm text-ink-3">Nothing failed.</p> : failed.map((f, i) => (
						<div key={f.id} className={cn("flex items-center gap-3 py-3", i < failed.length - 1 && "border-b border-line")}>
							<AlertTriangleIcon className="size-4 shrink-0 text-danger" />
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-semibold text-ink">{f.businessName} · {naira(f.amount)}</p>
								<p className="text-xs text-ink-3">{f.bank} · {f.reason} · {f.attempts} attempts · last {fmtAgo(f.lastTriedAt)}</p>
							</div>
							{money && <button type="button" className={cn(btn.secondary, "flex items-center gap-2")} onClick={() => setRetry(f)}><RefreshCwIcon className="size-4" /> Retry</button>}
							<button type="button" className={btn.ghost} onClick={() => run(`Owner of ${f.businessName} asked to confirm bank details`)}>Ask for details</button>
						</div>
					))}
				</SectionCard>
			)}

			<SidePanel open={!!selected} onOpenChange={(o) => !o && void setOpen(null)} title={selected ? `${selected.businessName} · ${selected.provider}` : ""} subtitle={selected ? `Settlement for ${fmtDay(selected.period)}` : undefined} icon={CreditCardIcon} width="md"
				footer={selected?.status === "FAILED" && money ? <button type="button" className={btn.primary} onClick={() => run("Settlement retried", () => void setOpen(null))}>Retry settlement</button> : undefined}
			>
				{selected && (
					<div className="flex flex-col gap-5">
						<DetailList columns={2} items={[{ label: "Status", value: <StatusPill tone={selected.status === "SETTLED" ? "success" : selected.status === "PENDING" ? "warning" : "danger"}>{selected.status.toLowerCase()}</StatusPill> }, { label: "Settled at", value: selected.settledAt ? fmtWhen(selected.settledAt) : "—" }, { label: "Payout batch", value: selected.payoutBatch ?? "—" }, { label: "Provider", value: selected.provider }]} />
						<PanelSection title="Breakdown">
							<TotalsList rows={[{ label: "Gross taken on terminals", value: naira(selected.gross) }, { label: `${selected.provider} fee (0.5%)`, value: `-${naira(selected.providerFees)}` }, { label: "H.M.S share (1.5%)", value: `-${naira(selected.hmsShare)}` }, { label: "Paid to the hotel", value: naira(selected.net), strong: true }]} />
						</PanelSection>
						{selected.status === "FAILED" && <Note tone="danger">The provider could not settle: account name mismatch at the hotel's bank. Ask the owner to confirm the account, then retry.</Note>}
					</div>
				)}
			</SidePanel>

			<ConfirmModal open={!!retry} onOpenChange={(o) => !o && setRetry(null)} title={`Retry payout of ${naira(retry?.amount ?? 0)}?`} subtitle={retry ? `${retry.businessName} · ${retry.bank}` : undefined} confirmLabel="Retry payout" pending={pending}
				onConfirm={() => run("Payout sent · bank confirmed", () => { setFailed((all) => all.filter((f) => f.id !== retry?.id)); setRetry(null); })}>
				<TextField label="Account number (edit if the owner gave a new one)" value={retry?.bank ?? ""} onChange={() => undefined} />
			</ConfirmModal>
		</>
	);
}
