"use client";

import { ArrowDownToLineIcon, BanknoteIcon, CoinsIcon, CreditCardIcon, LandmarkIcon, LinkIcon, MoonIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { ChoiceCards, TextareaField } from "@/components/shared/field";
import { fmtTime, fmtWhen, naira, nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { ExpenseRow, PaymentRow, TillRow, TransactionRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";
import { payTone } from "../front-office/payments";

export type MoneyToday = { revenue: number; byMethod: Record<string, number>; paymentsCount: number; expenses: number; openTills: number; cashInTills: number };

const bankLines = [
	{ id: "bl-1", from: "C. OBI", bank: "GTBank", amount: 13650, at: "10:42am", ref: "BAR" },
	{ id: "bl-2", from: "TOBI LAWAL", bank: "Access", amount: 35000, at: "yesterday 6:41pm", ref: "HB6995XK" },
	{ id: "bl-3", from: "MUSA I", bank: "Zenith", amount: 46000, at: "8:05am", ref: "ROOM 121" },
];

/** Finance 1.1 Today's money + 1.2 Match payment. */
export function FinanceToday({ hotelName, money, payments: initial, tills, expenses, transactions }: { hotelName: string; money: MoneyToday; payments: PaymentRow[]; tills: TillRow[]; expenses: ExpenseRow[]; transactions: TransactionRow[] }) {
	const [payments, setPayments] = useState(initial);
	const [matching, setMatching] = useState<PaymentRow | null>(null);
	const [line, setLine] = useState("");
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	const unmatched = payments.filter((p) => p.method === "TRANSFER" && (p.status === "PROCESSING" || p.status === "NO_RESPONSE"));
	const paidOut = expenses.filter((e) => e.date === format(new Date(), "yyyy-MM-dd") && (e.status === "APPROVED" || e.status === "PAID" || e.status === "RECORDED"));
	const todayPayments = payments.filter((p) => p.createdAt.slice(0, 10) === format(new Date(), "yyyy-MM-dd"));

	return (
		<>
			<PageHeader title="Today’s money" subtitle={`${hotelName} · ${format(new Date(), "EEE d MMM")} · everything taken and paid out today`}>
				<Link href="/dashboard/tills" className={btn.secondary}><WalletIcon className="mr-1 inline size-4" /> Open tills</Link>
				<Link href="/dashboard/night-audit" className={btn.primary}><MoonIcon className="mr-1 inline size-4" /> Start night audit</Link>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				<KpiCard label="Taken today" value={nairaShort(money.revenue)} icon={CoinsIcon} hint={`${plural(money.paymentsCount, "payment")} · 84% occupancy`} />
				<KpiCard label="Card · POS" value={nairaShort(money.byMethod.CARD ?? 0)} icon={CreditCardIcon} hint="Matched to the bank" />
				<KpiCard label="Transfers" value={nairaShort(money.byMethod.TRANSFER ?? 0)} icon={LandmarkIcon} hint={unmatched.length ? `${unmatched.length} not matched yet` : "All matched"} pill={unmatched.length ? <StatusPill tone="warning">{unmatched.length}</StatusPill> : undefined} />
				<KpiCard label="Cash" value={nairaShort(money.byMethod.CASH ?? 0)} icon={BanknoteIcon} hint="In tills and the safe" />
				<KpiCard label="Paid out" value={nairaShort(money.expenses)} icon={ArrowDownToLineIcon} hint="Expenses and petty cash" />
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
				<SectionCard title="Transfers not matched to a bill" subtitle="Match each one to the bank line so the guest's folio is settled" count={unmatched.length} className={unmatched.length ? "border-warning/40 bg-warning-soft/30" : undefined}>
					{unmatched.length === 0 ? <p className="py-4 text-center text-sm text-ink-3">Everything is matched.</p> : (
						<ul className="divide-y divide-line">
							{unmatched.map((p) => (
								<li key={p.id} className="flex items-center gap-3 py-3">
									<div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{naira(p.amount)} · {p.guestName}{p.roomNumber ? ` · Room ${p.roomNumber}` : ""}</p><p className="text-xs text-ink-3">{p.description} · recorded {fmtWhen(p.createdAt)} by {p.takenBy}</p></div>
									<StatusPill tone={payTone[p.status].tone}>{payTone[p.status].label}</StatusPill>
									<button type="button" className={btn.primary} onClick={() => { setMatching(p); setLine(""); }}><LinkIcon className="mr-1 inline size-4" /> Match</button>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
				<SectionCard title="Tills today" subtitle={`${money.openTills} open · ${naira(money.cashInTills)} cash expected`} action={{ label: "Tills", href: "/dashboard/tills" }}>
					<ul className="divide-y divide-line">
						{tills.map((t) => (
							<li key={t.id} className="flex items-center gap-3 py-[10px] text-[13px]">
								<span className="flex-1 font-medium text-ink">{t.role.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} · {t.openedBy}</span>
								{t.status === "OPEN" ? <span className="text-ink-2">Open · {naira(t.expected)} expected</span> : t.variance === 0 ? <span className="text-success">Counted · matches</span> : <span className={cn((t.variance ?? 0) < 0 ? "text-danger" : "text-warning")}>Counted · {(t.variance ?? 0) < 0 ? "short" : "over"} {naira(Math.abs(t.variance ?? 0))}</span>}
							</li>
						))}
					</ul>
				</SectionCard>
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
				<SectionCard title="Payments today" subtitle={`${todayPayments.length} across the desk, bar, kitchen and laundry`} flush>
					<table className="w-full text-left text-[13px]">
						<thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-2">When</th><th className="py-2">Who</th><th className="py-2">Method</th><th className="py-2 text-right">Amount</th><th className="px-5 py-2 text-right">Status</th></tr></thead>
						<tbody>
							{todayPayments.map((p) => (
								<tr key={p.id} className="border-b border-line last:border-b-0">
									<td className="px-5 py-2 text-ink-3">{fmtTime(p.createdAt)}</td>
									<td className="py-2"><p className="font-medium text-ink">{p.guestName}</p><p className="text-xs text-ink-3">{p.role.replace("_", " ").toLowerCase()} · {p.takenBy}</p></td>
									<td className="py-2 text-ink-2">{p.method === "CARD" ? "Card" : p.method === "TRANSFER" ? "Transfer" : "Cash"}</td>
									<td className="py-2 text-right font-semibold">{naira(p.amount)}</td>
									<td className="px-5 py-2 text-right"><StatusPill tone={payTone[p.status].tone}>{payTone[p.status].label}</StatusPill></td>
								</tr>
							))}
						</tbody>
					</table>
				</SectionCard>
				<div className="flex flex-col gap-4">
					<SectionCard title="Paid out today" subtitle="Approved and recorded expenses" action={{ label: "Expenses", href: "/dashboard/expenses" }}>
						<ul className="divide-y divide-line">
							{paidOut.map((e) => (
								<li key={e.id} className="flex items-center gap-3 py-[10px] text-[13px]"><span className="flex-1 text-ink">{e.description} <span className="text-ink-3">· {e.paidFrom.toLowerCase()} by {e.requestedBy.split(" ")[0]}</span></span><span className="font-semibold">{naira(e.amount)}</span></li>
							))}
						</ul>
					</SectionCard>
					<SectionCard title="Money movements" subtitle="Deposits, refunds and transfers between tills and the bank" action={{ label: "Month", href: "/dashboard/month" }}>
						<ul className="divide-y divide-line">
							{transactions.filter((t) => t.kind !== "PAYMENT").slice(0, 4).map((t) => (
								<li key={t.id} className="flex items-center gap-3 py-[10px] text-[13px]"><StatusPill dot={false} tone={t.kind === "DEPOSIT" ? "info" : t.kind === "REFUND" ? "warning" : "grey"}>{t.kind.toLowerCase()}</StatusPill><span className="flex-1 text-ink">{t.description}</span><span className={cn("font-semibold", t.amount < 0 ? "text-ink-2" : "text-success")}>{naira(t.amount)}</span></li>
							))}
						</ul>
					</SectionCard>
				</div>
			</div>

			<SidePanel open={!!matching} onOpenChange={(o) => !o && setMatching(null)} title="Match this transfer" subtitle={matching ? `${naira(matching.amount)} · ${matching.guestName} · recorded by ${matching.takenBy}` : undefined} icon={LinkIcon} footer={<><button type="button" className={btn.secondary} onClick={() => setMatching(null)}>Cancel</button><button type="button" className={btn.dangerSoft} disabled={pending} onClick={() => void run("Marked as not received · front desk told", () => { setPayments((xs) => xs.map((p) => (p.id === matching?.id ? { ...p, status: "FAILED" } : p))); setMatching(null); }, { tone: "warning" })}>Not received</button><button type="button" className={btn.primary} disabled={!line || pending} onClick={() => void run("Transfer matched · folio settled", () => { setPayments((xs) => xs.map((p) => (p.id === matching?.id ? { ...p, status: "APPROVED", resolvedAt: new Date().toISOString(), providerRef: line } : p))); setMatching(null); })}>Match</button></>}>
				{matching && (
					<div className="flex flex-col gap-5">
						<TotalsList rows={[{ label: "Expected", value: naira(matching.amount), strong: true }, { label: "For", value: matching.description }]} />
						<PanelSection title="Bank lines not yet matched">
							<ChoiceCards value={line} onChange={setLine} options={bankLines.map((b) => ({ value: b.id, label: `${naira(b.amount)} from “${b.from}” · ${b.bank}`, hint: `${b.at} · reference “${b.ref}”${b.amount !== matching.amount ? " · amount differs" : ""}` }))} />
						</PanelSection>
						{line && bankLines.find((b) => b.id === line)?.amount !== matching.amount && <Note tone="warning">The bank line doesn't equal the payment. Matching posts the difference to the folio.</Note>}
						<TextareaField label="Note" value={note} onChange={setNote} rows={2} placeholder="Optional" />
					</div>
				)}
			</SidePanel>
		</>
	);
}
