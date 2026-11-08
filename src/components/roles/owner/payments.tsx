"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BanknoteIcon, CreditCardIcon, LandmarkIcon, PercentIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList } from "@/components/shared/detail-list";
import { fmtDay, fmtWhen, humanize, naira, nairaShort } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { ExportButton, FilterSelect, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { PaymentRow } from "@/lib/data/types";
import type { OwnerHotelFinance } from "@/lib/demo/fixtures/owner";
import { DownloadModal, HotelFilter } from "./common";

const statusTone: Record<PaymentRow["status"], "success" | "warning" | "danger" | "info" | "grey"> = { PENDING: "warning", PROCESSING: "info", APPROVED: "success", DECLINED: "danger", NO_RESPONSE: "warning", FAILED: "danger", REFUNDED: "grey" };

export function OwnerPayments({ payments, hotels }: { payments: PaymentRow[]; hotels: OwnerHotelFinance[] }) {
	const [tab, setTab] = useState<"payouts" | "payments">("payouts");
	const [hotel, setHotel] = useState("");
	const [method, setMethod] = useState("");
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<PaymentRow | null>(null);
	const [exportOpen, setExportOpen] = useState(false);
	const gross = hotels.reduce((s, h) => s + h.grossSettled, 0);
	const fees = hotels.reduce((s, h) => s + h.posFees, 0);
	const next = hotels.reduce((s, h) => s + h.nextPayoutAmount, 0);
	const rows = payments.map((p, i) => ({ ...p, hotelName: hotels[i % 4 === 3 ? 1 : 0].name })).filter((p) => (!hotel || hotels.find((h) => h.hotelId === hotel)?.name === p.hotelName) && (!method || p.method === method));

	const cols: ColumnDef<(typeof rows)[number], unknown>[] = [
		{ accessorKey: "createdAt", header: "When", cell: ({ row }) => fmtWhen(row.original.createdAt) },
		{ accessorKey: "guestName", header: "Guest", cell: ({ row }) => <TwoLine primary={row.original.guestName} secondary={row.original.description} /> },
		{ accessorKey: "hotelName", header: "Hotel" },
		{ accessorKey: "method", header: "Method", cell: ({ row }) => <TwoLine primary={humanize(row.original.method)} secondary={row.original.terminal ?? row.original.takenBy} /> },
		{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-semibold">{naira(row.original.amount)}</span> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={statusTone[row.original.status]}>{humanize(row.original.status)}</StatusPill> },
	];

	return (
		<>
			<PageHeader title="Payments & payouts" subtitle="What the POS providers collected and when it lands in the bank">
				<ExportButton onClick={() => setExportOpen(true)} />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Settled this month" value={nairaShort(gross)} icon={CreditCardIcon} hint="Card and transfer through POS" />
				<KpiCard label="Provider fees" value={naira(fees)} icon={PercentIcon} hint={`${((fees / gross) * 100).toFixed(2)}% average`} />
				<KpiCard label="Next payout" value={nairaShort(next)} icon={LandmarkIcon} hint={`Tomorrow · ${hotels.filter((h) => h.nextPayout === hotels[0].nextPayout).length} hotels`} />
				<KpiCard label="Cash in tills" value={nairaShort(248500)} icon={BanknoteIcon} hint="Banked by finance each morning" />
			</div>
			<Toolbar left={<PillTabs tabs={[{ key: "payouts", label: "Payouts by hotel" }, { key: "payments", label: "All payments", count: payments.length }]} value={tab} onChange={setTab} />} right={tab === "payments" && <><HotelFilter hotels={hotels} value={hotel} onChange={setHotel} /><FilterSelect value={method} onChange={setMethod} all="All methods" options={[{ value: "CARD", label: "Card" }, { value: "TRANSFER", label: "Transfer" }, { value: "CASH", label: "Cash" }]} /><SearchBox value={search} onChange={setSearch} /></>} />

			{tab === "payouts" ? (
				<SectionCard title="Settlement by hotel" subtitle="Each hotel settles to its own account the next working day" flush>
					<table className="w-full text-left">
						<thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-[10px]">Hotel</th><th className="py-[10px]">Provider</th><th className="py-[10px]">Gross settled</th><th className="py-[10px]">Fees</th><th className="py-[10px]">Net</th><th className="py-[10px]">Next payout</th><th className="py-[10px] pr-5">Status</th></tr></thead>
						<tbody>
							{hotels.map((h) => (
								<tr key={h.hotelId} className="h-12 border-b border-line text-[13px]"><td className="px-5 font-semibold text-ink">{h.name}</td><td className="text-ink-2">{h.posProvider}</td><td>{naira(h.grossSettled)}</td><td className="text-danger">−{naira(h.posFees)}</td><td className="font-semibold">{naira(h.grossSettled - h.posFees)}</td><td><TwoLine primary={naira(h.nextPayoutAmount)} secondary={fmtDay(h.nextPayout)} /></td><td className="pr-5"><StatusPill tone="success">On schedule</StatusPill></td></tr>
							))}
						</tbody>
					</table>
				</SectionCard>
			) : (
				<DataTable columns={cols} data={rows} search={search} onRowClick={setSelected} />
			)}

			<SidePanel open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected ? naira(selected.amount) : ""} subtitle={selected ? `${selected.reference} · ${selected.guestName}` : undefined} icon={CreditCardIcon} footer={<Button variant="outline" className={btn.secondary} onClick={() => setSelected(null)}>Close</Button>}>
				{selected && (
					<div className="flex flex-col gap-6">
						<StatusPill tone={statusTone[selected.status]}>{humanize(selected.status)}</StatusPill>
						<PanelSection title="Payment"><DetailList columns={2} items={[{ label: "Method", value: humanize(selected.method) }, { label: "Terminal", value: selected.terminal }, { label: "Provider ref", value: selected.providerRef }, { label: "Taken by", value: `${selected.takenBy} · ${humanize(selected.role)}` }, { label: "For", value: selected.description }, { label: "Room", value: selected.roomNumber }, { label: "Created", value: fmtWhen(selected.createdAt) }, { label: "Resolved", value: fmtWhen(selected.resolvedAt) }, { label: "Receipt", value: selected.receiptSent ? humanize(selected.receiptSent) : "Not sent" }]} /></PanelSection>
					</div>
				)}
			</SidePanel>
			<DownloadModal open={exportOpen} onOpenChange={setExportOpen} title="Export payments" what="Payments & payouts" />
		</>
	);
}
