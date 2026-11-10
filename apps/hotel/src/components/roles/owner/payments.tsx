"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BanknoteIcon,
	CreditCardIcon,
	LandmarkIcon,
	PercentIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import type {
	AtHotel,
	PaymentRow,
	SettlementView,
} from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList } from "@hospio/ui/shared/detail-list";
import {
	fmtDay,
	fmtWhen,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs, useTabParam } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	SearchBox,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { DownloadModal, HotelFilter } from "./common";

type Payment = PaymentRow & AtHotel;
type Tab = "payments" | "settlements";

const statusTone: Record<
	PaymentRow["status"],
	"success" | "warning" | "danger" | "info" | "grey"
> = {
	PENDING: "warning",
	PROCESSING: "info",
	APPROVED: "success",
	DECLINED: "danger",
	NO_RESPONSE: "warning",
	FAILED: "danger",
	REFUNDED: "grey",
};
const statusLabel: Record<PaymentRow["status"], string> = {
	PENDING: "Pending",
	PROCESSING: "With the POS",
	APPROVED: "Approved",
	DECLINED: "Declined",
	NO_RESPONSE: "No response",
	FAILED: "Failed",
	REFUNDED: "Refunded",
};
const methodLabel: Record<string, string> = {
	CARD: "Card",
	TRANSFER: "Transfer",
	CASH: "Cash",
	ORGANIZATION: "On account",
};
const roleLabel: Record<string, string> = {
	FRONT_OFFICE: "Front office",
	BAR: "Bar",
	KITCHEN: "Kitchen",
	LAUNDRY: "Laundry",
	MANAGER: "Manager",
	OWNER: "Owner",
	FINANCE: "Finance",
};
const settleTone = {
	PENDING: "warning",
	SETTLED: "success",
	FAILED: "danger",
} as const;
const settleLabel = {
	PENDING: "To be paid out",
	SETTLED: "Paid out",
	FAILED: "Payout failed",
} as const;

const lagosDay = (iso: string) =>
	new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

/**
 * Hotel Owner · 17 Payments & payouts: every hotel's payments (payment-service, per hotel) and the business's settlements
 * (card and transfer money the providers collected, less their fee and H.M.S's share, and whether it was paid out).
 */
export function OwnerPayments({
	payments,
	settlements,
	hotels,
	month,
}: {
	payments: Payment[];
	settlements: SettlementView[];
	hotels: { hotelId: string; name: string }[];
	/** yyyy-mm of "this month" (Lagos). */
	month: string;
}) {
	const [tab] = useTabParam<Tab>("payments");
	const [hotel, setHotel] = useQueryState("hotel", parseAsString);
	const [method, setMethod] = useState("");
	const [status, setStatus] = useState("");
	const [search, setSearch] = useState("");
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [exportOpen, setExportOpen] = useState(false);
	const hotelName = hotel
		? (hotels.find((h) => h.hotelId === hotel)?.name ?? "this hotel")
		: null;

	const scoped = payments.filter((p) => !hotel || p.hotelId === hotel);
	const rows = scoped.filter(
		(p) => (!method || p.method === method) && (!status || p.status === status),
	);
	const selected = payments.find((p) => p.id === open) ?? null;
	const monthly = scoped.filter(
		(p) => p.status === "APPROVED" && lagosDay(p.createdAt).startsWith(month),
	);
	const taken = monthly.reduce((s, p) => s + p.amount, 0);
	const cash = monthly
		.filter((p) => p.method === "CASH")
		.reduce((s, p) => s + p.amount, 0);
	const settled = settlements.filter(
		(s) => !hotelName || !s.hotelName || s.hotelName === hotelName,
	);
	const gross = settled.reduce((s, x) => s + x.gross, 0);
	const fees = settled.reduce((s, x) => s + x.fees, 0);
	const toPay = settled
		.filter((s) => s.status === "PENDING")
		.reduce((s, x) => s + x.net, 0);

	const cols: ColumnDef<Payment, unknown>[] = [
		{
			accessorKey: "createdAt",
			header: "When",
			cell: ({ row }) => fmtWhen(row.original.createdAt),
		},
		{
			accessorKey: "guestName",
			header: "Guest",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.guestName}
					secondary={row.original.description}
				/>
			),
		},
		{ accessorKey: "hotelName", header: "Hotel" },
		{
			accessorKey: "method",
			header: "Method",
			cell: ({ row }) => (
				<TwoLine
					primary={methodLabel[row.original.method] ?? row.original.method}
					secondary={`${row.original.takenBy} · ${roleLabel[row.original.role] ?? row.original.role}`}
				/>
			),
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.amount)}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone[row.original.status]}>
					{statusLabel[row.original.status]}
				</StatusPill>
			),
		},
	];
	const settleCols: ColumnDef<SettlementView, unknown>[] = [
		{
			accessorKey: "day",
			header: "Day",
			cell: ({ row }) => fmtDay(row.original.day),
		},
		{
			accessorKey: "provider",
			header: "Provider",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.provider}
					secondary={plural(row.original.payments, "payment")}
				/>
			),
		},
		{
			accessorKey: "gross",
			header: "Collected",
			cell: ({ row }) => naira(row.original.gross),
		},
		{
			accessorKey: "fees",
			header: "Provider fee",
			cell: ({ row }) => (
				<span className="text-danger">−{naira(row.original.fees)}</span>
			),
		},
		{
			accessorKey: "hmsShare",
			header: "H.M.S share",
			cell: ({ row }) => (
				<span className="text-danger">−{naira(row.original.hmsShare)}</span>
			),
		},
		{
			accessorKey: "net",
			header: "To you",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.net)}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<TwoLine
					primary={
						<StatusPill tone={settleTone[row.original.status]}>
							{settleLabel[row.original.status]}
						</StatusPill>
					}
					secondary={
						row.original.settledAt
							? fmtWhen(row.original.settledAt)
							: (row.original.failureReason ?? "")
					}
				/>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Payments & payouts"
				subtitle={`What ${hotelName ?? "your hotels"} took, and what the POS providers pay out`}
			>
				<ExportButton onClick={() => setExportOpen(true)} />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Taken this month"
					value={nairaShort(taken)}
					icon={CreditCardIcon}
					hint={`${plural(monthly.length, "approved payment")}`}
				/>
				<KpiCard
					label="Cash this month"
					value={nairaShort(cash)}
					icon={BanknoteIcon}
					hint="Banked by finance; never settles"
				/>
				<KpiCard
					label="Card & transfer collected"
					value={nairaShort(gross)}
					icon={PercentIcon}
					hint={
						gross > 0
							? `${naira(fees)} provider fees · ${((fees / gross) * 100).toFixed(2)}%`
							: "No settlements this month yet"
					}
				/>
				<KpiCard
					label="Waiting to be paid out"
					value={nairaShort(toPay)}
					icon={LandmarkIcon}
					hint="Settled to your account by H.M.S"
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						param="tab"
						defaultValue="payments"
						tabs={[
							{ key: "payments", label: "Payments", count: rows.length },
							{
								key: "settlements",
								label: "Settlements this month",
								count: settled.length,
							},
						]}
					/>
				}
				right={
					<>
						<HotelFilter
							hotels={hotels}
							value={hotel ?? ""}
							onChange={(v) => void setHotel(v || null)}
						/>
						{tab === "payments" && (
							<>
								<FilterSelect
									value={method}
									onChange={setMethod}
									all="All methods"
									options={[
										{ value: "CARD", label: "Card" },
										{ value: "TRANSFER", label: "Transfer" },
										{ value: "CASH", label: "Cash" },
									]}
								/>
								<FilterSelect
									value={status}
									onChange={setStatus}
									all="All statuses"
									options={(
										Object.keys(statusLabel) as PaymentRow["status"][]
									).map((s) => ({ value: s, label: statusLabel[s] }))}
								/>
								<SearchBox
									value={search}
									onChange={setSearch}
									placeholder="Guest, staff, what for"
								/>
							</>
						)}
					</>
				}
			/>

			{tab === "settlements" ? (
				<>
					<DataTable
						columns={settleCols}
						data={settled}
						emptyTitle="No settlements this month"
						emptyHint="Card and transfer payments settle the next working day; cash never does."
					/>
					{hotel && (
						<p className="text-xs text-ink-3">
							Settlements are by business and provider, so they are the same for
							every hotel.
						</p>
					)}
				</>
			) : (
				<DataTable
					columns={cols}
					data={rows}
					search={search}
					onRowClick={(p) => void setOpen(p.id)}
					emptyTitle="No payments here"
					emptyHint="Try another hotel, method or status."
				/>
			)}

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={selected ? naira(selected.amount) : ""}
				subtitle={
					selected ? `${selected.reference} · ${selected.guestName}` : undefined
				}
				icon={CreditCardIcon}
				footer={
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => void setOpen(null)}
					>
						Close
					</Button>
				}
			>
				{selected && (
					<div className="flex flex-col gap-6">
						<StatusPill tone={statusTone[selected.status]}>
							{statusLabel[selected.status]}
						</StatusPill>
						<PanelSection title="Payment">
							<DetailList
								columns={2}
								items={[
									{ label: "Hotel", value: selected.hotelName },
									{
										label: "Method",
										value: methodLabel[selected.method] ?? selected.method,
									},
									{
										label: "Taken by",
										value: `${selected.takenBy} · ${roleLabel[selected.role] ?? selected.role}`,
									},
									{ label: "For", value: selected.description },
									{ label: "Provider ref", value: selected.providerRef ?? "—" },
									{ label: "Created", value: fmtWhen(selected.createdAt) },
									{
										label: "Resolved",
										value: selected.resolvedAt
											? fmtWhen(selected.resolvedAt)
											: "—",
									},
								]}
							/>
						</PanelSection>
					</div>
				)}
			</SidePanel>
			<DownloadModal
				open={exportOpen}
				onOpenChange={setExportOpen}
				title={tab === "settlements" ? "Export settlements" : "Export payments"}
				what={`${tab === "settlements" ? "Settlements" : "Payments"} · ${hotelName ?? "All hotels"}`}
				rows={() =>
					tab === "settlements"
						? [
								[
									"Day",
									"Provider",
									"Payments",
									"Collected (NGN)",
									"Provider fee (NGN)",
									"H.M.S share (NGN)",
									"To you (NGN)",
									"Status",
									"Paid out",
								],
								...settled.map((s) => [
									s.day,
									s.provider,
									s.payments,
									s.gross,
									s.fees,
									s.hmsShare,
									s.net,
									settleLabel[s.status],
									s.settledAt ?? "",
								]),
							]
						: [
								[
									"When",
									"Hotel",
									"Guest",
									"For",
									"Method",
									"Taken by",
									"Amount (NGN)",
									"Status",
									"Reference",
								],
								...rows
									.filter(
										(p) =>
											!search ||
											`${p.guestName} ${p.takenBy} ${p.description}`
												.toLowerCase()
												.includes(search.toLowerCase()),
									)
									.map((p) => [
										p.createdAt,
										p.hotelName,
										p.guestName,
										p.description,
										methodLabel[p.method] ?? p.method,
										p.takenBy,
										p.amount,
										statusLabel[p.status],
										p.reference,
									]),
							]
				}
			/>
		</>
	);
}
