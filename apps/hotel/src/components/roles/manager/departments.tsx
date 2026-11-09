"use client";

import { AlertTriangleIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { fmtTime } from "@hospio/ui/shared/format";
import type { DepartmentLive } from "@hospio/api/data/types";
import { ActivityIcon, ClipboardCheckIcon, LayoutGridIcon, UsersIcon } from "lucide-react";
import { roleIcons } from "@hospio/api/roles";
import { isHotelRole } from "@hospio/api/roles";

const toneLabel: Record<DepartmentLive["tone"], { label: string; tone: "success" | "warning" | "danger" | "grey" }> = {
	success: { label: "OK", tone: "success" },
	warning: { label: "to watch", tone: "warning" },
	danger: { label: "Urgent", tone: "danger" },
	grey: { label: "Quiet", tone: "grey" },
};

/** Manager · Departments: what every team is doing right now, one card per department. */
export function DepartmentsScreen({ departments, hotelName, approvalsWaiting, roomsReady, staffOnShift, staffScheduled }: { departments: DepartmentLive[]; hotelName: string; approvalsWaiting: number; roomsReady: number; staffOnShift: number; staffScheduled: number }) {
	const attention = departments.filter((d) => d.tone === "warning" || d.tone === "danger").reduce((s, d) => s + d.open, 0);
	return (
		<>
			<PageHeader title="Departments" subtitle={<span suppressHydrationWarning>{`${hotelName} · what every team is doing right now · ${fmtTime(new Date())}`}</span>}>
				<StatusPill tone="success">Live · updates every minute</StatusPill>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Staff on shift" value={`${staffOnShift} of ${staffScheduled}`} icon={UsersIcon} />
				<KpiCard label="Needs attention" value={`${attention} things`} icon={AlertTriangleIcon} />
				<KpiCard label="Waiting for you" value={`${approvalsWaiting} approvals`} icon={ClipboardCheckIcon} hint={<Link href="/dashboard/approvals" className="font-semibold text-brand">Open approvals →</Link>} />
				<KpiCard label="Rooms ready to sell" value={roomsReady} icon={LayoutGridIcon} />
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{departments.map((d) => {
					const Icon = isHotelRole(d.key) ? roleIcons[d.key] : ActivityIcon;
					const t = toneLabel[d.tone];
					return (
						<Link key={d.key} href={`/dashboard/departments/${d.key.toLowerCase()}`} className={`flex flex-col gap-3 rounded-card border bg-card p-[18px] transition-colors hover:bg-brand-soft/20 ${d.tone === "danger" ? "border-danger/40" : "border-line"}`}>
							<div className="flex items-center gap-[10px]">
								<span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
									<Icon className="size-4" />
								</span>
								<span className="flex-1 text-[15px] font-bold text-ink">{d.name}</span>
								<StatusPill tone={t.tone}>{d.tone === "warning" ? `${d.open} ${t.label}` : t.label}</StatusPill>
							</div>
							<p className="text-xs text-ink-3">
								{d.onShift} on shift · {d.scheduled} scheduled
							</p>
							<dl className="flex flex-col gap-[6px] text-[13px]">
								<div className="flex justify-between gap-3">
									<dt className="text-ink-2">{d.openLabel.charAt(0).toUpperCase() + d.openLabel.slice(1)}</dt>
									<dd className="font-semibold text-ink">{d.open}</dd>
								</div>
								<div className="flex justify-between gap-3">
									<dt className="text-ink-2">Actions last hour</dt>
									<dd className="font-semibold text-ink">{d.actionsLastHour}</dd>
								</div>
								<div className="flex justify-between gap-3">
									<dt className="text-ink-2">Last action</dt>
									<dd className="truncate text-right font-semibold text-ink">{fmtTime(d.lastAt)}</dd>
								</div>
							</dl>
							<p className={`flex items-center gap-[6px] text-xs font-medium ${d.tone === "danger" ? "text-danger" : d.tone === "warning" ? "text-warning" : "text-ink-2"}`}>
								<AlertTriangleIcon className="size-[14px] shrink-0" />
								<span className="truncate">{d.lastAction}</span>
							</p>
						</Link>
					);
				})}
			</div>

			<p className="flex items-center gap-2 rounded-[10px] bg-card px-4 py-3 text-xs text-ink-2">
				<EyeIcon className="size-4 text-ink-3" /> You can open any team’s own screen to see exactly what they see — view only. Every action they take is in the{" "}
				<Link href="/dashboard/activity" className="font-semibold text-brand">
					Activity log
				</Link>
				.
			</p>
		</>
	);
}
