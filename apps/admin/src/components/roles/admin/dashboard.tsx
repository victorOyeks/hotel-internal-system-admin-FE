"use client";

import {
	ActivityIcon,
	AlertTriangleIcon,
	BuildingIcon,
	ClipboardCheckIcon,
	CoinsIcon,
	HeadsetIcon,
	HeartPulseIcon,
	HotelIcon,
	TrendingUpIcon,
	UserPlusIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { dismissAlert } from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type { AlertRow, OverviewData } from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtAgo, fmtWhen, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { adminRoleLabel, can, stageMeta } from "./shared";

/** Admin — Dashboard (Figma 3304:3908): everything from GET /platform/admin/overview. */
export function AdminDashboard({
	role,
	firstName,
	overview,
}: {
	role: AdminRole;
	firstName: string;
	overview: OverviewData;
}) {
	const o = overview;
	const [alerts, setAlerts] = useState<AlertRow[]>(o.alerts);
	const { run, pending } = useAction();
	const byStage = o.businesses.byStage;
	const live = (byStage.LIVE ?? 0) + (byStage.HANDED_OVER ?? 0);
	const atRisk = (byStage.AT_RISK ?? 0) + (byStage.SUSPENDED ?? 0);
	const stages = [
		"LEAD",
		"ONBOARDING",
		"HANDED_OVER",
		"LIVE",
		"AT_RISK",
		"SUSPENDED",
		"CHURNED",
	] as const;
	const max = Math.max(1, ...stages.map((s) => byStage[s] ?? 0));
	const health = o.health;
	const healthTotal = Math.max(1, health.good + health.watch + health.atRisk);

	return (
		<>
			<PageHeader
				title={`Hello ${firstName}`}
				subtitle={`${adminRoleLabel[role]} · ${plural(o.businesses.total, "business", "businesses")} on the platform · ${plural(o.openTickets, "open ticket")}`}
			>
				{can.editBusiness(role) && (
					<Link
						href="/dashboard/businesses?new=1"
						className={cn(btn.primary, "flex items-center gap-2")}
					>
						<UserPlusIcon className="size-4" /> Set up a business for them
					</Link>
				)}
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
				<KpiCard
					label="Live businesses"
					value={live}
					icon={BuildingIcon}
					hint={`${byStage.ONBOARDING ?? 0} onboarding`}
				/>
				<KpiCard
					label="Onboarding"
					value={o.onboardingInProgress}
					icon={ClipboardCheckIcon}
					pill={
						o.readyForHandover > 0 ? (
							<StatusPill tone="warning">{o.readyForHandover} ready</StatusPill>
						) : undefined
					}
					hint={
						<Link
							href="/dashboard/onboarding"
							className="font-semibold text-brand hover:underline"
						>
							Open the board
						</Link>
					}
				/>
				<KpiCard
					label="Hotels"
					value={o.hotels}
					icon={HotelIcon}
					hint={`${o.rooms} rooms`}
				/>
				<KpiCard
					label="Monthly fees (MRR)"
					value={nairaShort(o.mrr)}
					icon={TrendingUpIcon}
					hint="This month's statements"
				/>
				<KpiCard
					label="Fees due"
					value={nairaShort(o.dueFees)}
					icon={CoinsIcon}
					pill={
						o.overdueFees > 0 ? (
							<StatusPill tone="danger">
								{nairaShort(o.overdueFees)} overdue
							</StatusPill>
						) : undefined
					}
					hint={
						<Link
							href="/dashboard/fees"
							className="font-semibold text-brand hover:underline"
						>
							Fees & billing
						</Link>
					}
				/>
				<KpiCard
					label="Open tickets"
					value={o.openTickets}
					icon={HeadsetIcon}
					hint={
						<Link
							href="/dashboard/support"
							className="font-semibold text-brand hover:underline"
						>
							Support
						</Link>
					}
				/>
				<KpiCard
					label="At risk"
					value={atRisk}
					icon={AlertTriangleIcon}
					hint="At risk or suspended"
				/>
				<KpiCard
					label="Health"
					value={health.good}
					icon={HeartPulseIcon}
					pill={
						health.atRisk > 0 ? (
							<StatusPill tone="danger">{health.atRisk} low</StatusPill>
						) : undefined
					}
					hint={`${health.watch} to watch`}
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<SectionCard
					title="System alerts"
					subtitle="What the platform found: overdue fees, failing payments, urgent tickets, stalled onboarding"
					count={alerts.length}
					action={{ label: "Support", href: "/dashboard/support" }}
					bodyClassName="pt-1"
				>
					{alerts.length === 0 ? (
						<EmptyState
							title="Nothing needs attention"
							hint="Alerts clear on their own when the cause ends."
						/>
					) : (
						<ul>
							{alerts.map((a, i) => (
								<li
									key={a.id}
									className={cn(
										"flex items-start gap-3 py-[10px]",
										i < alerts.length - 1 && "border-b border-line",
									)}
								>
									<AlertTriangleIcon
										className={cn(
											"mt-[2px] size-4 shrink-0",
											a.tone === "danger"
												? "text-danger"
												: a.tone === "warning"
													? "text-warning"
													: "text-ink-3",
										)}
									/>
									<div className="min-w-0 flex-1">
										<p className="truncate text-[13px] font-semibold text-ink">
											{a.businessName} · {a.title}
										</p>
										<p className="truncate text-xs text-ink-3">
											{a.detail}
											{a.detail ? " · " : ""}
											{fmtAgo(a.at)}
										</p>
									</div>
									{a.businessId && (
										<Link
											href={`/dashboard/businesses/${a.businessId}`}
											className={cn(btn.secondary, btn.small)}
										>
											Open
										</Link>
									)}
									<button
										type="button"
										disabled={pending}
										className={cn(
											btn.ghost,
											btn.small,
											"flex items-center gap-1",
										)}
										onClick={() =>
											run(
												() => dismissAlert(a.id, a),
												"Alert dismissed",
												() =>
													setAlerts((all) => all.filter((x) => x.id !== a.id)),
											)
										}
									>
										<XIcon className="size-3" /> Dismiss
									</button>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard
					title="Pipeline"
					subtitle="Where every business is"
					bodyClassName="gap-2 pt-2"
				>
					{stages.map((s) => {
						const count = byStage[s] ?? 0;
						return (
							<Link
								key={s}
								href={`/dashboard/businesses?tab=${s}`}
								className="flex items-center gap-3 rounded-lg py-1 hover:bg-subtle/60"
							>
								<span className="w-24 text-[13px] font-medium text-ink">
									{stageMeta[s].label}
								</span>
								<div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
									<div
										className={cn(
											"h-full rounded-full",
											s === "LIVE"
												? "bg-success"
												: s === "AT_RISK"
													? "bg-warning"
													: s === "SUSPENDED" || s === "CHURNED"
														? "bg-danger"
														: "bg-brand",
										)}
										style={{ width: `${(count / max) * 100}%` }}
									/>
								</div>
								<span className="w-5 text-right text-sm font-bold text-ink">
									{count}
								</span>
							</Link>
						);
					})}
				</SectionCard>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				<SectionCard
					title="Changes by H.M.S"
					subtitle="Logged; the owner can ask support to undo within 7 days"
					action={{ label: "All changes", href: "/dashboard/changes" }}
					bodyClassName="pt-1"
				>
					{o.recentChanges.length === 0 && (
						<EmptyState title="No changes yet" />
					)}
					{o.recentChanges.slice(0, 6).map((c, i, arr) => (
						<div
							key={c.id}
							className={cn(
								"py-2",
								i < arr.length - 1 && "border-b border-line",
							)}
						>
							<p className="truncate text-[13px] font-semibold text-ink">
								{c.description}
							</p>
							<p className="truncate text-xs text-ink-3">
								{c.businessName} · {c.madeBy} · {fmtWhen(c.at)}
								{c.undone ? " · undone" : ""}
							</p>
						</div>
					))}
				</SectionCard>

				<SectionCard
					title="Recent activity"
					subtitle="By the H.M.S team"
					action={{
						label: "Activity log",
						href: "/dashboard/changes?tab=activity",
					}}
					bodyClassName="pt-1"
				>
					{o.recentActivity.length === 0 && <EmptyState title="Nothing yet" />}
					{o.recentActivity.slice(0, 6).map((a, i, arr) => (
						<div
							key={a.id}
							className={cn(
								"flex items-start gap-2 py-2",
								i < arr.length - 1 && "border-b border-line",
							)}
						>
							<ActivityIcon className="mt-[2px] size-4 shrink-0 text-ink-3" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-semibold text-ink">
									{a.action}
								</p>
								<p className="truncate text-xs text-ink-3">
									{a.by} · {fmtWhen(a.at)}
								</p>
							</div>
						</div>
					))}
				</SectionCard>

				<SectionCard
					title="Health"
					subtitle="Scored nightly for every live business"
					bodyClassName="gap-3 pt-2"
				>
					{(
						[
							["Good (70+)", health.good, "bg-success"],
							["Watch (40–69)", health.watch, "bg-warning"],
							["At risk (under 40)", health.atRisk, "bg-danger"],
						] as const
					).map(([label, count, color]) => (
						<div key={label} className="flex items-center gap-3">
							<span className="w-32 text-[13px] font-medium text-ink">
								{label}
							</span>
							<div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
								<div
									className={cn("h-full rounded-full", color)}
									style={{ width: `${(count / healthTotal) * 100}%` }}
								/>
							</div>
							<span className="w-5 text-right text-sm font-bold text-ink">
								{count}
							</span>
						</div>
					))}
					<p className="text-xs text-ink-3">
						Adoption, bookings and payments in the last 7 days, open tickets,
						overdue fees and missed night audits.
					</p>
				</SectionCard>
			</div>
		</>
	);
}
