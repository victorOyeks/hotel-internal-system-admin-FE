"use client";

import { AlertTriangleIcon, BuildingIcon, CoinsIcon, HeadsetIcon, HotelIcon, MegaphoneIcon, TrendingUpIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { fmtAgo, fmtWhen, naira, nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { BusinessRow, FeeStatementRow, MarketerRow, PlatformChangeRow, TicketRow } from "@/lib/data/types";
import type { AdminRole, SystemAlertRow } from "@/lib/demo/fixtures/platform-extra";
import { cn } from "@/lib/utils";
import { adminRoleLabel, can, StagePill, stageMeta, ticketPriority } from "./shared";

export function AdminDashboard({
	role,
	firstName,
	businesses,
	tickets,
	changes,
	marketers,
	fees,
	alerts,
}: {
	role: AdminRole;
	firstName: string;
	businesses: BusinessRow[];
	tickets: TicketRow[];
	changes: PlatformChangeRow[];
	marketers: MarketerRow[];
	fees: FeeStatementRow[];
	alerts: SystemAlertRow[];
}) {
	const live = businesses.filter((b) => b.stage === "LIVE" || b.stage === "HANDED_OVER");
	const hotels = businesses.reduce((s, b) => s + b.hotels, 0);
	const rooms = businesses.reduce((s, b) => s + b.rooms, 0);
	const mrr = businesses.reduce((s, b) => s + b.mrr, 0);
	const feesDue = fees.filter((f) => f.status !== "PAID").reduce((s, f) => s + (f.fee - f.paid), 0);
	const openTickets = tickets.filter((t) => t.status !== "RESOLVED");
	const atRisk = businesses.filter((b) => b.stage === "AT_RISK" || b.stage === "SUSPENDED");
	const payoutsDue = marketers.reduce((s, m) => s + m.due, 0);
	const attention = businesses
		.filter((b) => b.stage === "AT_RISK" || b.dueFees > 0 || b.openTickets >= 2 || (b.stage === "LIVE" && b.adoption < 50))
		.sort((a, b) => a.health - b.health);
	const stages = ["LEAD", "ONBOARDING", "HANDED_OVER", "LIVE", "AT_RISK", "SUSPENDED"] as const;
	const max = Math.max(1, ...stages.map((s) => businesses.filter((b) => b.stage === s).length));

	return (
		<>
			<PageHeader title={`Hello ${firstName}`} subtitle={`${adminRoleLabel[role]} · ${plural(businesses.length, "business", "businesses")} on the platform · ${plural(openTickets.length, "open ticket")}`}>
				{can.editBusiness(role) && (
					<Link href="/dashboard/businesses?new=1" className={cn(btn.primary, "flex items-center gap-2")}>
						<UserPlusIcon className="size-4" /> Onboard a business
					</Link>
				)}
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
				<KpiCard label="Live businesses" value={live.length} icon={BuildingIcon} hint={`${businesses.filter((b) => b.stage === "ONBOARDING").length} onboarding`} />
				<KpiCard label="Hotels" value={hotels} icon={HotelIcon} hint={`${rooms} rooms`} />
				<KpiCard label="Monthly fees (MRR)" value={nairaShort(mrr)} icon={TrendingUpIcon} hint="Live and handed over" />
				<KpiCard label="Fees due" value={nairaShort(feesDue)} icon={CoinsIcon} pill={feesDue > 0 ? <StatusPill tone="warning">{fees.filter((f) => f.status === "OVERDUE").length} overdue</StatusPill> : undefined} />
				<KpiCard label="Open tickets" value={openTickets.length} icon={HeadsetIcon} pill={openTickets.some((t) => t.priority === "URGENT") ? <StatusPill tone="danger">urgent</StatusPill> : undefined} />
				<KpiCard label="At risk" value={atRisk.length} icon={AlertTriangleIcon} hint="Low health or suspended" />
				<KpiCard label="Marketer payouts due" value={nairaShort(payoutsDue)} icon={MegaphoneIcon} hint="After 5% WHT" />
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<SectionCard title="Needs attention" subtitle="Low health, fees owed, several tickets, or low adoption" count={attention.length} action={{ label: "All businesses", href: "/dashboard/businesses" }}>
					{attention.length === 0 ? (
						<EmptyState title="Every business is healthy" />
					) : (
						<ul>
							{attention.map((b, i) => (
								<li key={b.id} className={cn("flex items-center gap-3 py-[10px]", i < attention.length - 1 && "border-b border-line")}>
									<div className="min-w-0 flex-1">
										<p className="truncate text-[13px] font-semibold text-ink">{b.name}</p>
										<p className="truncate text-xs text-ink-3">
											{[b.dueFees > 0 ? `${naira(b.dueFees)} fees due` : null, b.openTickets > 0 ? plural(b.openTickets, "open ticket") : null, `adoption ${b.adoption}%`, b.lastActive ? `active ${fmtAgo(b.lastActive)}` : "never active"].filter(Boolean).join(" · ")}
										</p>
									</div>
									<StagePill stage={b.stage} />
									<Link href={`/dashboard/businesses/${b.id}`} className={btn.secondary}>
										Open
									</Link>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard title="Pipeline" subtitle="Where every business is" bodyClassName="gap-2 pt-2">
					{stages.map((s) => {
						const n = businesses.filter((b) => b.stage === s).length;
						return (
							<Link key={s} href={`/dashboard/businesses?tab=${s}`} className="flex items-center gap-3 rounded-lg py-1 hover:bg-subtle/60">
								<span className="w-24 text-[13px] font-medium text-ink">{stageMeta[s].label}</span>
								<div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
									<div className={cn("h-full rounded-full", s === "LIVE" ? "bg-success" : s === "AT_RISK" ? "bg-warning" : s === "SUSPENDED" ? "bg-danger" : "bg-brand")} style={{ width: `${(n / max) * 100}%` }} />
								</div>
								<span className="w-5 text-right text-sm font-bold text-ink">{n}</span>
							</Link>
						);
					})}
				</SectionCard>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<SectionCard title="System alerts" count={alerts.length} action={{ label: "Support", href: "/dashboard/support" }} bodyClassName="pt-1">
					{alerts.map((a, i) => (
						<div key={a.id} className={cn("flex items-start gap-2 py-2", i < alerts.length - 1 && "border-b border-line")}>
							<AlertTriangleIcon className={cn("mt-[2px] size-4 shrink-0", a.tone === "danger" ? "text-danger" : a.tone === "warning" ? "text-warning" : "text-ink-3")} />
							<div className="min-w-0">
								<p className="truncate text-[13px] font-semibold text-ink">{a.businessName} · {a.title}</p>
								<p className="truncate text-xs text-ink-3">{a.detail}</p>
							</div>
						</div>
					))}
				</SectionCard>

				<SectionCard title="Open tickets" count={openTickets.length} action={{ label: "All tickets", href: "/dashboard/support" }} bodyClassName="pt-1">
					{openTickets.slice(0, 4).map((t, i, arr) => (
						<Link key={t.id} href={`/dashboard/support?open=${t.id}`} className={cn("flex items-start gap-2 py-2 hover:bg-subtle/60", i < arr.length - 1 && "border-b border-line")}>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-semibold text-ink">{t.id.replace("tk-", "T-")} · {t.subject}</p>
								<p className="truncate text-xs text-ink-3">{t.businessName} · {fmtAgo(t.openedAt)}</p>
							</div>
							<StatusPill tone={ticketPriority[t.priority]}>{t.priority.toLowerCase()}</StatusPill>
						</Link>
					))}
				</SectionCard>

				<SectionCard title="Changes by H.M.S" subtitle="Logged, undoable for 7 days" action={{ label: "All changes", href: "/dashboard/changes" }} bodyClassName="pt-1">
					{changes.slice(0, 4).map((c, i, arr) => (
						<div key={c.id} className={cn("py-2", i < arr.length - 1 && "border-b border-line")}>
							<p className="truncate text-[13px] font-semibold text-ink">{c.description}</p>
							<p className="truncate text-xs text-ink-3">{c.businessName} · {c.madeBy} · {fmtWhen(c.at)}{c.undone ? " · undone" : ""}</p>
						</div>
					))}
				</SectionCard>

				<SectionCard title="Marketer payouts" subtitle="Due after 5% WHT" action={{ label: "Marketers", href: "/dashboard/marketers" }} bodyClassName="pt-1">
					{marketers.filter((m) => m.due > 0).map((m, i, arr) => (
						<div key={m.id} className={cn("flex items-center gap-2 py-2", i < arr.length - 1 && "border-b border-line")}>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-semibold text-ink">{m.fullName}</p>
								<p className="truncate text-xs text-ink-3">{plural(m.businesses, "business", "businesses")} · {m.sharePct}% for {m.months} months</p>
							</div>
							<span className="text-[13px] font-bold text-ink">{naira(m.due)}</span>
						</div>
					))}
					{marketers.every((m) => m.due === 0) && <EmptyState title="Nothing due" />}
				</SectionCard>
			</div>
		</>
	);
}
