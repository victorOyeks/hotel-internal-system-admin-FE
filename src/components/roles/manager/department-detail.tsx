"use client";

import { ActivityIcon, ArrowLeftIcon, ClockIcon, EyeIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AvatarName } from "@/components/shared/detail-list";
import { EmptyState } from "@/components/shared/empty-state";
import { fmtTime, fmtWhen, humanize } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusPill, type PillTone } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { ActivityRow, DepartmentLive, StaffRow } from "@/lib/data/types";
import { roleLabels, isHotelRole } from "@/lib/roles";

export type OpenItem = { id: string; title: string; detail: string; status: string; tone: PillTone; href?: string };

/** Manager · Departments · one department: KPIs, who is on shift, live activity and the team's open items. */
export function DepartmentDetail({ department, staff, activity, openItems, openTitle, teamHref, extra }: { department: DepartmentLive; staff: StaffRow[]; activity: ActivityRow[]; openItems: OpenItem[]; openTitle: string; teamHref: string; extra?: ReactNode }) {
	const onShift = staff.filter((s) => s.status === "ACTIVE");
	return (
		<>
			<PageHeader
				title={department.name}
				subtitle={
					<span className="flex items-center gap-2">
						<Link href="/dashboard/departments" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
							<ArrowLeftIcon className="size-[14px]" /> All departments
						</Link>
						· {department.onShift} on shift · last action {fmtTime(department.lastAt)}
					</span>
				}
			>
				<StatusPill tone={department.tone === "grey" ? "grey" : department.tone}>{department.tone === "success" ? "OK" : department.tone === "danger" ? "Urgent" : department.tone === "warning" ? `${department.open} to watch` : "Quiet"}</StatusPill>
				<Link href={teamHref} className={`${btn.secondary} flex items-center gap-2`}>
					<EyeIcon className="size-4" /> Open their screen
				</Link>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="On shift" value={`${department.onShift} of ${department.scheduled}`} icon={UsersIcon} />
				<KpiCard label={department.openLabel.charAt(0).toUpperCase() + department.openLabel.slice(1)} value={department.open} icon={ClockIcon} />
				<KpiCard label="Actions last hour" value={department.actionsLastHour} icon={ActivityIcon} />
				<KpiCard label="Last action" value={fmtTime(department.lastAt)} icon={ClockIcon} hint={department.lastAction} />
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<div className="flex flex-col gap-4">
					<SectionCard title={openTitle} count={openItems.length} flush>
						{openItems.length === 0 ? (
							<EmptyState title="Nothing open" className="mx-5 mb-5" />
						) : (
							<ul className="divide-y divide-line">
								{openItems.map((it) => (
									<li key={it.id} className="flex items-center gap-3 px-5 py-3">
										<div className="min-w-0 flex-1">
											<p className="truncate text-[13px] font-semibold text-ink">{it.title}</p>
											<p className="truncate text-xs text-ink-3">{it.detail}</p>
										</div>
										<StatusPill tone={it.tone}>{it.status}</StatusPill>
										{it.href && (
											<Link href={it.href} className="text-[13px] font-semibold text-brand">
												Open →
											</Link>
										)}
									</li>
								))}
							</ul>
						)}
					</SectionCard>
					{extra}
					<SectionCard title="Live activity" subtitle="What this team has done, newest first" action={{ label: "Activity log", href: `/dashboard/activity?department=${encodeURIComponent(department.name)}` }} flush>
						{activity.length === 0 ? (
							<EmptyState title="No activity yet today" className="mx-5 mb-5" />
						) : (
							<ul className="divide-y divide-line">
								{activity.map((a) => (
									<li key={a.id} className="flex items-start gap-3 px-5 py-3">
										<span className="mt-[6px] size-2 shrink-0 rounded-full bg-brand" />
										<div className="min-w-0 flex-1">
											<p className="text-[13px] text-ink">
												<span className="font-semibold">{a.actor}</span> · {a.action}
											</p>
											<p className="truncate text-xs text-ink-3">{a.summary}</p>
										</div>
										<span className="shrink-0 text-xs text-ink-3">{fmtWhen(a.at)}</span>
									</li>
								))}
							</ul>
						)}
					</SectionCard>
				</div>

				<SectionCard title="Who is on shift" subtitle={`${onShift.length} active · ${staff.length - onShift.length} away`} action={{ label: "Rota", href: "/dashboard/staff?tab=rota" }} bodyClassName="gap-3 pt-2">
					{staff.length === 0 ? (
						<EmptyState title="Nobody in this team yet" hint="Add people in Staff." />
					) : (
						staff.map((s) => (
							<div key={s.id} className="flex items-center gap-3">
								<AvatarName name={s.fullName} secondary={`${s.jobTitle} · ${s.shift} shift`} className="flex-1" />
								<StatusPill tone={s.status === "ACTIVE" ? "success" : s.status === "ON_LEAVE" ? "warning" : "grey"}>{s.status === "ACTIVE" ? "On shift" : humanize(s.status)}</StatusPill>
							</div>
						))
					)}
					<p className="text-xs text-ink-3">Level: {isHotelRole(department.key) ? roleLabels[department.key] : department.name} staff see only their own screens.</p>
				</SectionCard>
			</div>
		</>
	);
}
