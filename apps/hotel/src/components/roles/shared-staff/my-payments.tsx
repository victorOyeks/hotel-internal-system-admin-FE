"use client";

import {
	CheckCircle2Icon,
	CreditCardIcon,
	SearchCheckIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import type { PageResult } from "@hospio/api/data/paging";
import { useListParams } from "@hospio/ui/shared/list-params";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { PaymentRow } from "@hospio/api/data/types";
import {
	resendReceipt,
	retryPayment,
	verifyPayment,
} from "@hospio/api/actions/payment";
import { useAction } from "@hospio/api/actions/use-action";
import { BigButton, ShiftPill } from "./tablet";

const tone: Record<
	PaymentRow["status"],
	"success" | "warning" | "danger" | "info" | "grey"
> = {
	APPROVED: "success",
	PROCESSING: "warning",
	PENDING: "warning",
	NO_RESPONSE: "warning",
	DECLINED: "danger",
	FAILED: "danger",
	REFUNDED: "grey",
};
const label: Record<PaymentRow["status"], string> = {
	APPROVED: "Approved",
	PROCESSING: "Processing",
	PENDING: "Pending",
	NO_RESPONSE: "No response",
	DECLINED: "Declined",
	FAILED: "Failed",
	REFUNDED: "Refunded",
};

/**
 * "My payments" for a staff tablet (Kitchen 3364:12826, Bar 3364:12093, Laundry 3356:14438):
 * the desk's payments one page at a time (payment-service; the last 90 days), today's money in the
 * cards, and a verify panel for transfers and card payments the terminal never answered.
 */
export function MyPaymentsScreen({
	payments: result,
	roleTitle,
}: {
	payments: PageResult<PaymentRow>;
	roleTitle: string;
}) {
	const router = useRouter();
	const params = useListParams({ extra: ["tab"] });
	const [rows, setRows] = useState(result.data.content);
	useEffect(() => setRows(result.data.content), [result]);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const tab = params.params.tab === "pending" ? "pending" : "all";
	const { run, pending } = useAction();

	const current = rows.find((p) => p.id === open) ?? null;
	const counts = result.data.counts ?? {};
	const totals = result.data.totals ?? {};
	const toVerify = counts.toVerify ?? 0;
	const total = totals.approvedToday ?? 0;
	const approvedToday = totals.approvedTodayCount ?? 0;
	const byMethod = (m: PaymentRow["method"]) =>
		totals[
			`today${m === "CARD" ? "Card" : m === "TRANSFER" ? "Transfer" : "Cash"}`
		] ?? 0;

	const close = () => void setOpen(null);
	const setStatus = (id: string, status: PaymentRow["status"]) =>
		setRows((r) =>
			r.map((p) =>
				p.id === id
					? {
							...p,
							status,
							resolvedAt:
								status === "APPROVED" ? new Date().toISOString() : p.resolvedAt,
						}
					: p,
			),
		);

	return (
		<>
			<PageHeader
				title="My payments"
				subtitle={`${roleTitle} · today · ${plural(counts.today ?? 0, "payment")}`}
			>
				<ShiftPill />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Taken today"
					value={nairaShort(total)}
					icon={CreditCardIcon}
					hint={`${approvedToday} approved`}
				/>
				<KpiCard
					label="Card"
					value={nairaShort(byMethod("CARD"))}
					icon={CreditCardIcon}
				/>
				<KpiCard
					label="Transfer"
					value={nairaShort(byMethod("TRANSFER"))}
					icon={CreditCardIcon}
				/>
				<KpiCard
					label="Cash"
					value={nairaShort(byMethod("CASH"))}
					icon={CreditCardIcon}
					hint="In your till"
				/>
			</div>
			{toVerify > 0 && (
				<Note tone="warning">
					{plural(toVerify, "payment")} still to verify. A transfer shows here
					until Finance matches it; a card payment the terminal never answered
					must be checked on the terminal before you try again.
				</Note>
			)}
			<PillTabs
				tabs={[
					{ key: "all", label: "All", count: counts.all ?? 0 },
					{ key: "pending", label: "To verify", count: toVerify },
				]}
				value={tab}
				onChange={(k) => params.set({ tab: k === "all" ? null : k })}
			/>
			<DataTable
				data={rows}
				server={{ page: result.data, onPage: params.goTo }}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={(p) => void setOpen(p.id)}
				emptyTitle="No payments yet"
				columns={[
					{
						accessorKey: "createdAt",
						header: "When",
						cell: ({ row }) => (
							<span className="text-ink-2">
								{fmtWhen(row.original.createdAt)}
							</span>
						),
					},
					{
						accessorKey: "description",
						header: "What",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.description}
								secondary={`${row.original.guestName}${row.original.roomNumber ? ` · ${row.original.roomNumber}` : ""} · ${row.original.reference}`}
							/>
						),
					},
					{
						accessorKey: "method",
						header: "Method",
						cell: ({ row }) => (
							<span className="capitalize">
								{row.original.method.toLowerCase()}
								{row.original.terminal ? ` · ${row.original.terminal}` : ""}
							</span>
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
					{
						accessorKey: "status",
						header: "Status",
						cell: ({ row }) => (
							<StatusPill tone={tone[row.original.status]}>
								{label[row.original.status]}
							</StatusPill>
						),
					},
				]}
			/>

			<SidePanel
				open={!!current}
				onOpenChange={(o) => !o && close()}
				title={current ? naira(current.amount) : ""}
				subtitle={
					current ? `${current.description} · ${current.reference}` : undefined
				}
				icon={SearchCheckIcon}
			>
				{current && (
					<div className="flex flex-col gap-5">
						<DetailList
							columns={2}
							items={[
								{ label: "Guest", value: current.guestName },
								{ label: "Room", value: current.roomNumber ?? "—" },
								{ label: "Method", value: current.method.toLowerCase() },
								{ label: "Terminal", value: current.terminal ?? "—" },
								{ label: "Taken", value: fmtWhen(current.createdAt) },
								{
									label: "Status",
									value: (
										<StatusPill tone={tone[current.status]}>
											{label[current.status]}
										</StatusPill>
									),
								},
								{ label: "Provider ref", value: current.providerRef ?? "—" },
								{
									label: "Receipt",
									value:
										current.receiptSent === "NONE"
											? "Not sent"
											: (current.receiptSent ?? "—"),
								},
							]}
						/>
						{(current.status === "PROCESSING" ||
							current.status === "NO_RESPONSE" ||
							current.status === "PENDING") && (
							<PanelSection title="Verify">
								{current.status === "NO_RESPONSE" ? (
									<Note tone="warning">
										The terminal never answered. Check the last transaction on{" "}
										{current.terminal ?? "the POS"}: if it shows Approved, ask
										the provider below. Do not charge the guest again until you
										know.
									</Note>
								) : current.method === "TRANSFER" ? (
									<Note tone="info">
										A transfer shows here until Finance matches it against the
										bank statement. You can ask the provider if one is
										connected.
									</Note>
								) : (
									<Note tone="info">
										The POS has not confirmed this payment yet. Ask the provider
										where it stands.
									</Note>
								)}
								<BigButton
									pending={pending}
									onClick={() =>
										run(
											() => verifyPayment(current.id),
											(r) =>
												r.status === "APPROVED"
													? "Payment verified"
													: `The provider says ${label[r.status]?.toLowerCase() ?? r.status}`,
											(r) => {
												setStatus(current.id, r.status);
												close();
											},
										)
									}
								>
									<CheckCircle2Icon className="size-5" /> Check with provider
								</BigButton>
							</PanelSection>
						)}
						{(current.status === "DECLINED" ||
							current.status === "NO_RESPONSE") &&
							current.method === "CARD" && (
								<BigButton
									tone="secondary"
									pending={pending}
									onClick={() =>
										run(
											() => retryPayment(current.id),
											"Sent to the POS again · the first stays in the list",
											close,
										)
									}
								>
									Try again on the POS
								</BigButton>
							)}
						{current.status === "APPROVED" && (
							<BigButton
								tone="secondary"
								pending={pending}
								onClick={() =>
									run(
										() => resendReceipt(current.id),
										(r) => `Receipt sent to ${r.sentTo}`,
										close,
									)
								}
							>
								Re-send receipt
							</BigButton>
						)}
					</div>
				)}
			</SidePanel>
		</>
	);
}
