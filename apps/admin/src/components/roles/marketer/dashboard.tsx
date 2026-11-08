"use client";

import { BuildingIcon, CalendarIcon, CoinsIcon, CopyIcon, MegaphoneIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtLongDate, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { BusinessRow, MarketerRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { CommissionRow, ReferralRow } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { monthsLeft, referralLink, stageTone } from "./shared";

export function MarketerDashboard({ firstName, me, businesses, ledger, referrals }: { firstName: string; me: MarketerRow; businesses: BusinessRow[]; ledger: CommissionRow[]; referrals: ReferralRow[] }) {
	const { run } = useDemoAction();
	const mine = businesses.filter((b) => b.marketer === me.fullName);
	const dueNow = ledger.filter((c) => c.status === "DUE").reduce((a, c) => a + c.net, 0);
	const waiting = ledger.filter((c) => c.status === "WAITING").reduce((a, c) => a + c.net, 0);
	const months = [...new Set(ledger.map((c) => c.month))].sort().slice(-6);
	const byMonth = months.map((m) => ({ month: m, net: ledger.filter((c) => c.month === m).reduce((a, c) => a + c.net, 0) }));
	const max = Math.max(1, ...byMonth.map((b) => b.net));
	const link = referralLink(me);

	return (
		<>
			<PageHeader title={`Hello ${firstName}`} subtitle={`Marketer since ${fmtLongDate(me.joined)} · you earn ${me.sharePct}% of the H.M.S share for ${me.months} months on every business you bring`}>
				<Link href="/dashboard/refer" className={cn(btn.primary, "flex items-center gap-2")}><MegaphoneIcon className="size-4" /> Refer a business</Link>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Businesses you brought" value={mine.length} icon={BuildingIcon} hint={`${mine.reduce((a, b) => a + b.hotels, 0)} hotels`} />
				<KpiCard label="Due to you now" value={nairaShort(dueNow)} icon={CoinsIcon} pill={dueNow > 0 ? <StatusPill tone="warning">next payout 5th</StatusPill> : undefined} hint="After 5% WHT" />
				<KpiCard label="Waiting" value={nairaShort(waiting)} icon={CalendarIcon} hint={waiting > 0 ? `${ledger.filter((c) => c.status === "WAITING").map((c) => c.businessName).join(", ")} hasn't paid yet` : "Nothing waiting"} />
				<KpiCard label="Paid to you so far" value={nairaShort(me.earnedTotal)} icon={WalletIcon} hint={`Since ${fmtLongDate(me.joined)}`} />
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard title="Your businesses" subtitle="Each one pays you for 24 months from the month it went live" action={{ label: "All", href: "/dashboard/businesses" }}>
					{mine.length === 0 ? <EmptyState title="No businesses yet" hint="Refer a hotel to start earning." /> : (
						<ul>
							{mine.map((b, i) => {
								const left = monthsLeft(b.since, me.months);
								return (
									<li key={b.id} className={cn("flex items-center gap-3 py-[10px]", i < mine.length - 1 && "border-b border-line")}>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">{b.name}</p>
											<p className="text-xs text-ink-3">{plural(b.hotels, "hotel")} · {left > 0 ? `your share ends in ${plural(left, "month")}` : "share ended"}</p>
										</div>
										<span className="text-[13px] font-semibold text-ink">{naira(Math.round(b.mrr * (me.sharePct / 100) * 0.95))}<span className="text-xs font-normal text-ink-3"> / month</span></span>
										<StatusPill tone={stageTone[b.stage] ?? "grey"}>{b.stage.toLowerCase().replace("_", " ")}</StatusPill>
									</li>
								);
							})}
						</ul>
					)}
				</SectionCard>

				<SectionCard title="Refer a new business" subtitle="Share your link or add their details — we'll contact them and set them up" bodyClassName="gap-3 pt-2">
					<div className="flex items-center gap-2 rounded-control bg-subtle px-3 py-[10px] text-[13px] font-medium text-ink">
						<span className="min-w-0 flex-1 truncate">{link}</span>
						<button type="button" onClick={() => run("Link copied", undefined, { tone: "info", ms: 100 })} className="text-ink-3 hover:text-ink" aria-label="Copy link"><CopyIcon className="size-4" /></button>
					</div>
					<Link href="/dashboard/refer" className={cn(btn.primary, "w-fit")}>Refer a business</Link>
					<p className="text-xs text-ink-3">{plural(referrals.filter((r) => r.stage !== "LIVE" && r.stage !== "LOST").length, "referral")} in progress</p>
				</SectionCard>
			</div>

			<SectionCard title="What you earned" subtitle="Net after 5% WHT, by month" action={{ label: "Commissions", href: "/dashboard/commissions" }} bodyClassName="pt-2">
				<div className="flex h-36 items-end gap-3">
					{byMonth.map((b) => (
						<div key={b.month} className="flex flex-1 flex-col items-center gap-1">
							<span className="text-[11px] font-semibold text-ink">{nairaShort(b.net)}</span>
							<div className="w-full rounded-t-md bg-brand/80" style={{ height: `${Math.max(4, (b.net / max) * 100)}px` }} />
							<span className="text-[11px] text-ink-3">{b.month.slice(5)}/{b.month.slice(2, 4)}</span>
						</div>
					))}
				</div>
			</SectionCard>
		</>
	);
}
