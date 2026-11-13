"use client";

import {
	ActivityIcon,
	CalendarCheckIcon,
	CreditCardIcon,
	HeartPulseIcon,
	MessageSquareIcon,
	RefreshCwIcon,
	UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { recomputeHealth } from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type { HealthRow, UsageData } from "@hospio/api/data/admin-types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtDate, fmtWhen } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { HealthBar } from "../shared";
import { BusinessTabHeader } from "./nav";

const featureLabels: Record<string, string> = {
	pos: "POS used",
	posUsed: "POS used",
	whatsapp: "WhatsApp set",
	whatsappSet: "WhatsApp set",
	nightAudit: "Night audit closed",
	nightAuditClosed: "Night audit closed",
	bookings: "Bookings taken",
	payments: "Payments taken",
};

/** Business · Usage tab: GET /platform/admin/businesses/{id}/usage and the health score (L7). */
export function UsageTab({
	businessId,
	businessName,
	usage,
	health: initialHealth,
}: {
	businessId: string;
	businessName: string;
	usage: UsageData | null;
	health: HealthRow | null;
}) {
	const [health, setHealth] = useState(initialHealth);
	useEffect(() => setHealth(initialHealth), [initialHealth]);
	const { run, pending } = useAction();
	const weeks = usage?.weeks ?? [];
	const max = Math.max(
		1,
		...weeks.map((w) => Math.max(w.bookings, w.payments, w.messages)),
	);
	return (
		<>
			<BusinessTabHeader
				businessId={businessId}
				businessName={businessName}
				active="usage"
				subtitle="How much the business uses Hospio360: people signing in, bookings, payments and messages"
			>
				<button
					type="button"
					className={cn(btn.secondary, "flex items-center gap-2")}
					disabled={pending}
					onClick={() =>
						run(
							() => recomputeHealth(businessId),
							"Health recomputed",
							setHealth,
						)
					}
				>
					<RefreshCwIcon className="size-4" /> Recompute health
				</button>
			</BusinessTabHeader>
			{!usage ? (
				<EmptyState
					title="Usage is not available"
					hint="platform-service did not answer; try again in a moment."
				/>
			) : (
				<>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
						<KpiCard
							label="Active users · 7 days"
							value={usage.activeUsers7d}
							icon={UsersIcon}
							hint={`${usage.activeUsers30d} in 30 days`}
						/>
						<KpiCard
							label="Bookings · 30 days"
							value={usage.bookings30d}
							icon={CalendarCheckIcon}
						/>
						<KpiCard
							label="Payments · 30 days"
							value={usage.payments30d}
							icon={CreditCardIcon}
						/>
						<KpiCard
							label="Messages · 30 days"
							value={usage.messages30d}
							icon={MessageSquareIcon}
						/>
						<KpiCard
							label="Health score"
							value={health ? health.score : "—"}
							icon={HeartPulseIcon}
							hint={
								health?.computedAt
									? `Computed ${fmtWhen(health.computedAt)}`
									: "Not scored yet"
							}
							pill={health ? <HealthBar value={health.score} /> : undefined}
						/>
						<KpiCard
							label="Features in use"
							value={Object.values(usage.features).filter(Boolean).length}
							icon={ActivityIcon}
							hint={`of ${Object.keys(usage.features).length}`}
						/>
					</div>
					<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
						<SectionCard
							title="Last 8 weeks"
							subtitle="Bookings, payments and messages per week"
							bodyClassName="pt-2"
						>
							{weeks.length === 0 ? (
								<EmptyState title="No activity recorded yet" />
							) : (
								<div className="flex h-44 items-end gap-3">
									{weeks.map((w) => (
										<div
											key={w.weekStart}
											className="flex flex-1 flex-col items-center gap-1"
										>
											<div className="flex h-36 w-full items-end justify-center gap-[2px]">
												<div
													className="w-1/3 rounded-t bg-brand/80"
													style={{
														height: `${Math.max(2, (w.bookings / max) * 100)}%`,
													}}
													title={`${w.bookings} bookings`}
												/>
												<div
													className="w-1/3 rounded-t bg-success/80"
													style={{
														height: `${Math.max(2, (w.payments / max) * 100)}%`,
													}}
													title={`${w.payments} payments`}
												/>
												<div
													className="w-1/3 rounded-t bg-info/80"
													style={{
														height: `${Math.max(2, (w.messages / max) * 100)}%`,
													}}
													title={`${w.messages} messages`}
												/>
											</div>
											<span className="text-[11px] text-ink-3">
												{fmtDate(w.weekStart, "d MMM")}
											</span>
										</div>
									))}
								</div>
							)}
							<p className="mt-2 flex gap-4 text-xs text-ink-3">
								<span className="flex items-center gap-1">
									<span className="size-2 rounded-full bg-brand" /> Bookings
								</span>
								<span className="flex items-center gap-1">
									<span className="size-2 rounded-full bg-success" /> Payments
								</span>
								<span className="flex items-center gap-1">
									<span className="size-2 rounded-full bg-info" /> Messages
								</span>
							</p>
						</SectionCard>
						<SectionCard
							title="Feature adoption"
							subtitle="What the hotels have switched on"
							bodyClassName="gap-2 pt-2"
						>
							{Object.keys(usage.features).length === 0 && (
								<p className="text-sm text-ink-3">Nothing reported.</p>
							)}
							{Object.entries(usage.features).map(([k, on]) => (
								<div
									key={k}
									className="flex items-center justify-between rounded-control border border-line px-4 py-[10px] text-[13px]"
								>
									<span className="font-medium text-ink">
										{featureLabels[k] ??
											k.replace(/([A-Z])/g, " $1").toLowerCase()}
									</span>
									<StatusPill tone={on ? "success" : "grey"}>
										{on ? "yes" : "not yet"}
									</StatusPill>
								</div>
							))}
							{health && Object.keys(health.factors).length > 0 && (
								<div className="mt-2">
									<p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
										Health factors
									</p>
									<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
										{Object.entries(health.factors).map(([k, v]) => (
											<li
												key={k}
												className="flex items-center justify-between px-4 py-2"
											>
												<span className="text-ink-2">
													{k.replace(/([A-Z])/g, " $1").toLowerCase()}
												</span>
												<span className="font-semibold text-ink">
													{typeof v === "object"
														? JSON.stringify(v)
														: String(v)}
												</span>
											</li>
										))}
									</ul>
								</div>
							)}
						</SectionCard>
					</div>
				</>
			)}
		</>
	);
}
