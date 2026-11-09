"use client";

import {
	BanknoteIcon,
	CoinsIcon,
	CreditCardIcon,
	ReceiptIcon,
} from "lucide-react";
import Link from "next/link";
import type {
	FeeStatementItem,
	PaymentSummaryData,
	SettlementItem,
} from "@hospio/api/data/admin-types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	fmtDay,
	fmtLongDate,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { cn } from "@hospio/ui/utils";
import { BusinessTabHeader } from "./nav";

const feeTone = {
	DUE: "warning",
	PART_PAID: "info",
	PAID: "success",
	OVERDUE: "danger",
} as const;
const settlementTone = {
	SETTLED: "success",
	PENDING: "warning",
	FAILED: "danger",
} as const;

/** Business · Money tab: its fee statements, settlements and the payment summary for the business. */
export function MoneyTab({
	businessId,
	businessName,
	statements,
	settlements,
	summary,
}: {
	businessId: string;
	businessName: string;
	statements: FeeStatementItem[];
	settlements: SettlementItem[];
	summary: PaymentSummaryData;
}) {
	const outstanding = statements.reduce((a, s) => a + s.outstanding, 0);
	return (
		<>
			<BusinessTabHeader
				businessId={businessId}
				businessName={businessName}
				active="money"
				subtitle="What the business pays H.M.S, what its guests paid on POS, and what was settled back to it"
			/>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Fees outstanding"
					value={nairaShort(outstanding)}
					icon={CoinsIcon}
					pill={
						statements.some((s) => s.status === "OVERDUE") ? (
							<StatusPill tone="danger">overdue</StatusPill>
						) : undefined
					}
					hint={plural(statements.length, "statement")}
				/>
				<KpiCard
					label="Guest payments"
					value={nairaShort(summary.gross)}
					icon={CreditCardIcon}
					hint={`${plural(summary.count, "payment")} · card and transfer`}
				/>
				<KpiCard
					label="Settled to the hotel"
					value={nairaShort(
						settlements
							.filter((s) => s.status === "SETTLED")
							.reduce((a, s) => a + s.net, 0),
					)}
					icon={BanknoteIcon}
					hint={`${settlements.filter((s) => s.status === "PENDING").length} pending`}
				/>
				<KpiCard
					label="H.M.S share"
					value={nairaShort(settlements.reduce((a, s) => a + s.hmsShare, 0))}
					icon={ReceiptIcon}
					hint="From the settlements shown"
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-2">
				<SectionCard
					title="Fee statements"
					subtitle="Monthly, from the fee model"
					action={{
						label: "Fees & billing",
						href: `/dashboard/fees?businessId=${businessId}`,
					}}
					flush
				>
					{statements.length === 0 ? (
						<EmptyState title="No statements yet" className="mx-5 mb-5" />
					) : (
						<ul className="divide-y divide-line">
							{statements.map((s) => (
								<li key={s.id}>
									<Link
										href={`/dashboard/fees?businessId=${businessId}&open=${s.id}`}
										className="flex items-center gap-3 px-5 py-3 hover:bg-subtle/60"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{s.month}
											</p>
											<p className="text-xs text-ink-3">
												fee {naira(s.feeAmount)} · paid {naira(s.paidAmount)}
												{s.dueOn ? ` · due ${fmtLongDate(s.dueOn)}` : ""}
											</p>
										</div>
										<span
											className={cn(
												"text-[13px] font-semibold",
												s.outstanding > 0 ? "text-danger" : "text-ink",
											)}
										>
											{naira(s.outstanding)}
										</span>
										<StatusPill tone={feeTone[s.status]}>
											{s.status.toLowerCase().replace("_", " ")}
										</StatusPill>
									</Link>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
				<SectionCard
					title="Settlements"
					subtitle="Per provider and day"
					action={{
						label: "Payments",
						href: `/dashboard/payments?businessId=${businessId}`,
					}}
					flush
				>
					{settlements.length === 0 ? (
						<EmptyState
							title="No settlements yet"
							hint="They are built nightly from approved card and transfer payments."
							className="mx-5 mb-5"
						/>
					) : (
						<ul className="divide-y divide-line">
							{settlements.map((s) => (
								<li key={s.id}>
									<Link
										href={`/dashboard/payments?businessId=${businessId}&open=${s.id}`}
										className="flex items-center gap-3 px-5 py-3 hover:bg-subtle/60"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{s.provider} · {fmtDay(s.periodDate)}
											</p>
											<p className="text-xs text-ink-3">
												gross {naira(s.gross)} · H.M.S {naira(s.hmsShare)}
											</p>
										</div>
										<span className="text-[13px] font-semibold text-ink">
											{naira(s.net)}
										</span>
										<StatusPill tone={settlementTone[s.status]}>
											{s.status.toLowerCase()}
										</StatusPill>
									</Link>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			</div>
			{summary.byProvider.length > 0 && (
				<SectionCard
					title="Guest payments by provider"
					subtitle="Approved card and transfer payments"
					bodyClassName="pt-2"
				>
					<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
						{summary.byProvider.map((p) => (
							<li
								key={p.provider}
								className="flex items-center justify-between px-4 py-2"
							>
								<span className="font-medium text-ink">{p.provider}</span>
								<span className="text-ink-2">
									{plural(p.count, "payment")} ·{" "}
									<span className="font-semibold text-ink">
										{naira(p.gross)}
									</span>
								</span>
							</li>
						))}
					</ul>
				</SectionCard>
			)}
		</>
	);
}
