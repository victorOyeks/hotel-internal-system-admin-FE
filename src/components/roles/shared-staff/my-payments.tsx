"use client";

import { CheckCircle2Icon, CreditCardIcon, SearchCheckIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList, Note } from "@/components/shared/detail-list";
import { TextField } from "@/components/shared/field";
import { fmtWhen, naira, nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { PaymentRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { BigButton, ShiftPill } from "./tablet";

const tone: Record<PaymentRow["status"], "success" | "warning" | "danger" | "info" | "grey"> = { APPROVED: "success", PROCESSING: "warning", PENDING: "warning", NO_RESPONSE: "warning", DECLINED: "danger", FAILED: "danger", REFUNDED: "grey" };
const label: Record<PaymentRow["status"], string> = { APPROVED: "Approved", PROCESSING: "Processing", PENDING: "Pending", NO_RESPONSE: "No response", DECLINED: "Declined", FAILED: "Failed", REFUNDED: "Refunded" };

/**
 * "My payments" for a staff tablet (Kitchen 3364:12826, Bar 3364:12093, Laundry 3356:14438):
 * everything this person took today, and a verify panel for transfers and card payments the
 * terminal never answered.
 */
export function MyPaymentsScreen({ payments, roleTitle }: { payments: PaymentRow[]; roleTitle: string }) {
	const [rows, setRows] = useState(payments);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [tab, setTab] = useState<"all" | "pending">("all");
	const [ref, setRef] = useState("");
	const { run, pending } = useDemoAction();

	const current = rows.find((p) => p.id === open) ?? null;
	const pendingRows = rows.filter((p) => p.status === "PROCESSING" || p.status === "NO_RESPONSE" || p.status === "PENDING");
	const list = tab === "pending" ? pendingRows : rows;
	const approved = rows.filter((p) => p.status === "APPROVED");
	const total = approved.reduce((s, p) => s + p.amount, 0);
	const byMethod = (m: PaymentRow["method"]) => approved.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0);

	const close = () => void setOpen(null);
	const resolve = (status: PaymentRow["status"]) => {
		if (!current) return;
		run(status === "APPROVED" ? "Payment verified · receipt sent" : "Marked as not received", () => {
			setRows((r) => r.map((p) => (p.id === current.id ? { ...p, status, resolvedAt: new Date().toISOString(), providerRef: ref || p.providerRef } : p)));
			close();
		});
	};

	return (
		<>
			<PageHeader title="My payments" subtitle={`${roleTitle} · today · ${plural(rows.length, "payment")}`}>
				<ShiftPill />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Taken today" value={nairaShort(total)} icon={CreditCardIcon} hint={`${approved.length} approved`} />
				<KpiCard label="Card" value={nairaShort(byMethod("CARD"))} icon={CreditCardIcon} />
				<KpiCard label="Transfer" value={nairaShort(byMethod("TRANSFER"))} icon={CreditCardIcon} />
				<KpiCard label="Cash" value={nairaShort(byMethod("CASH"))} icon={CreditCardIcon} hint="In your till" />
			</div>
			{pendingRows.length > 0 && (
				<Note tone="warning">
					{plural(pendingRows.length, "payment")} still to verify. A transfer shows here until Finance matches it; a card payment the terminal never answered must be checked on the terminal before you try again.
				</Note>
			)}
			<PillTabs tabs={[{ key: "all", label: "All", count: rows.length }, { key: "pending", label: "To verify", count: pendingRows.length }]} value={tab} onChange={setTab} />
			<DataTable
				data={list}
				onRowClick={(p) => void setOpen(p.id)}
				emptyTitle="No payments yet"
				columns={[
					{ accessorKey: "createdAt", header: "When", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.createdAt)}</span> },
					{ accessorKey: "description", header: "What", cell: ({ row }) => <TwoLine primary={row.original.description} secondary={`${row.original.guestName}${row.original.roomNumber ? ` · ${row.original.roomNumber}` : ""} · ${row.original.reference}`} /> },
					{ accessorKey: "method", header: "Method", cell: ({ row }) => <span className="capitalize">{row.original.method.toLowerCase()}{row.original.terminal ? ` · ${row.original.terminal}` : ""}</span> },
					{ accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-semibold">{naira(row.original.amount)}</span> },
					{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={tone[row.original.status]}>{label[row.original.status]}</StatusPill> },
				]}
			/>

			<SidePanel open={!!current} onOpenChange={(o) => !o && close()} title={current ? naira(current.amount) : ""} subtitle={current ? `${current.description} · ${current.reference}` : undefined} icon={SearchCheckIcon}>
				{current && (
					<div className="flex flex-col gap-5">
						<DetailList columns={2} items={[{ label: "Guest", value: current.guestName }, { label: "Room", value: current.roomNumber ?? "—" }, { label: "Method", value: current.method.toLowerCase() }, { label: "Terminal", value: current.terminal ?? "—" }, { label: "Taken", value: fmtWhen(current.createdAt) }, { label: "Status", value: <StatusPill tone={tone[current.status]}>{label[current.status]}</StatusPill> }, { label: "Provider ref", value: current.providerRef ?? "—" }, { label: "Receipt", value: current.receiptSent === "NONE" ? "Not sent" : (current.receiptSent ?? "—") }]} />
						{(current.status === "PROCESSING" || current.status === "NO_RESPONSE" || current.status === "PENDING") && (
							<PanelSection title="Verify">
								{current.status === "NO_RESPONSE" ? <Note tone="warning">The terminal never answered. Check the last transaction on {current.terminal ?? "the POS"}: if it shows Approved, enter the reference below.</Note> : <Note tone="info">Ask the guest for the transfer confirmation and enter the sender or reference. Finance will match it against the bank.</Note>}
								<TextField label="Reference on the terminal or bank alert" value={ref} onChange={setRef} placeholder="e.g. MP-88A2K1" />
								<div className="grid grid-cols-2 gap-2">
									<BigButton tone="secondary" pending={pending} onClick={() => resolve("FAILED")}>
										Not received
									</BigButton>
									<BigButton pending={pending} onClick={() => resolve("APPROVED")}>
										<CheckCircle2Icon className="size-5" /> Mark verified
									</BigButton>
								</div>
							</PanelSection>
						)}
						{current.status === "APPROVED" && (
							<BigButton tone="secondary" pending={pending} onClick={() => run("Receipt re-sent by WhatsApp", close)}>
								Re-send receipt
							</BigButton>
						)}
					</div>
				)}
			</SidePanel>
		</>
	);
}
