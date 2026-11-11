"use client";

import {
	BuildingIcon,
	CalendarIcon,
	CoinsIcon,
	MegaphoneIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import type {
	CommissionLine,
	MarketerBusinessItem,
	MarketerMeData,
	ReferralItem,
} from "@hospio/api/data/admin-types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	fmtLongDate,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { monthsLeft, ReferralLinkBox, stageLabel, stageTone } from "./shared";

/** Marketer — F2 · My dashboard: GET /platform/marketer/me, /businesses, /commissions, /referrals. */
export function MarketerDashboard({
	firstName,
	me,
	businesses,
	ledger,
	referrals,
}: {
	firstName: string;
	me: MarketerMeData;
	businesses: MarketerBusinessItem[];
	ledger: CommissionLine[];
	referrals: ReferralItem[];
}) {
	const p = me.profile;
	const dueNow = ledger
		.filter((c) => c.status === "DUE")
		.reduce((a, c) => a + c.net, 0);
	const waiting = ledger
		.filter((c) => c.status === "WAITING")
		.reduce((a, c) => a + c.net, 0);
	const months = [...new Set(ledger.map((c) => c.month))].sort().slice(-6);
	const byMonth = months.map((m) => ({
		month: m,
		net: ledger.filter((c) => c.month === m).reduce((a, c) => a + c.net, 0),
	}));
	const max = Math.max(1, ...byMonth.map((b) => b.net));
	const inProgress = referrals.filter(
		(r) => r.stage !== "LIVE" && r.stage !== "LOST",
	).length;

	return (
		<>
			<PageHeader
				title={`Hello ${firstName}`}
				subtitle={`Marketer since ${fmtLongDate(p.joined)} · you earn ${p.sharePct}% of the Hospio360 share for ${p.months} months on every business you bring${p.status === "PENDING" ? " · your account is waiting for approval" : ""}`}
			>
				<Link
					href="/dashboard/refer"
					className={cn(btn.primary, "flex items-center gap-2")}
				>
					<MegaphoneIcon className="size-4" /> Refer a hotel
				</Link>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Businesses you brought"
					value={me.totals.businesses}
					icon={BuildingIcon}
					hint={`${businesses.reduce((a, b) => a + b.hotels, 0)} hotels`}
				/>
				<KpiCard
					label="Due to you now"
					value={nairaShort(me.totals.due || dueNow)}
					icon={CoinsIcon}
					pill={
						(me.totals.due || dueNow) > 0 ? (
							<StatusPill tone="warning">next payout 5th</StatusPill>
						) : undefined
					}
					hint="After 5% WHT"
				/>
				<KpiCard
					label="Waiting on hotels"
					value={nairaShort(waiting)}
					icon={CalendarIcon}
					hint={waiting > 0 ? "Paid once they pay Hospio360" : "Nothing waiting"}
				/>
				<KpiCard
					label="Paid to you so far"
					value={nairaShort(me.totals.paid)}
					icon={WalletIcon}
					hint={`Earned ${nairaShort(me.totals.earnedTotal)} since ${fmtLongDate(p.joined)}`}
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard
					title="Your businesses"
					subtitle={`Each one pays you for ${p.months} months from the month it went live`}
					action={{ label: "All", href: "/dashboard/businesses" }}
				>
					{businesses.length === 0 ? (
						<EmptyState
							title="No businesses yet"
							hint="Refer a hotel to start earning."
						/>
					) : (
						<ul>
							{businesses.map((b, i) => {
								const left = monthsLeft(b.since, p.months);
								return (
									<li
										key={b.id}
										className={cn(
											"flex items-center gap-3 py-[10px]",
											i < businesses.length - 1 && "border-b border-line",
										)}
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{b.name}
											</p>
											<p className="text-xs text-ink-3">
												{plural(b.hotels, "hotel")} · {b.city || "—"} ·{" "}
												{left > 0
													? `your share ends in ${plural(left, "month")}`
													: "share ended"}
											</p>
										</div>
										<span className="text-[13px] font-semibold text-ink">
											{naira(b.lastMonthShare)}
											<span className="text-xs font-normal text-ink-3">
												{" "}
												{b.lastMonth ? `· ${b.lastMonth}` : "/ month"}
											</span>
										</span>
										<StatusPill tone={stageTone[b.stage] ?? "grey"}>
											{stageLabel[b.stage] ?? b.stage.toLowerCase()}
										</StatusPill>
									</li>
								);
							})}
						</ul>
					)}
				</SectionCard>

				<SectionCard
					title="Refer a new business"
					subtitle="Share your link or add their details — we contact them and set them up"
					bodyClassName="gap-3 pt-2"
				>
					<ReferralLinkBox me={p} />
					<Link href="/dashboard/refer" className={cn(btn.primary, "w-fit")}>
						Refer a hotel
					</Link>
					<p className="text-xs text-ink-3">
						{plural(inProgress, "referral")} in progress · {referrals.length}{" "}
						sent in all
					</p>
				</SectionCard>
			</div>

			<SectionCard
				title="What you earned"
				subtitle="Net after 5% WHT, by month"
				action={{ label: "Commissions", href: "/dashboard/commissions" }}
				bodyClassName="pt-2"
			>
				{byMonth.length === 0 ? (
					<EmptyState
						title="Nothing earned yet"
						hint="Your first commission appears the month a referred hotel pays its fee."
					/>
				) : (
					<div className="flex h-36 items-end gap-3">
						{byMonth.map((b) => (
							<div
								key={b.month}
								className="flex flex-1 flex-col items-center gap-1"
							>
								<span className="text-[11px] font-semibold text-ink">
									{nairaShort(b.net)}
								</span>
								<div
									className="w-full rounded-t-md bg-brand/80"
									style={{ height: `${Math.max(4, (b.net / max) * 100)}px` }}
								/>
								<span className="text-[11px] text-ink-3">
									{b.month.slice(5)}/{b.month.slice(2, 4)}
								</span>
							</div>
						))}
					</div>
				)}
			</SectionCard>
		</>
	);
}
