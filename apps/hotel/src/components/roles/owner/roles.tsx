"use client";

import { ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import { HOTEL_ROLES, roleDescriptions, roleIcons, roleLabels } from "@hospio/api/roles";
import { cn } from "@hospio/ui/utils";

const levels = ["FULL", "EDIT", "VIEW"] as const;
const permissionsByRole: Record<string, string[]> = {
	OWNER: ["See every hotel", "Approve spend over the limit", "Download any report", "Invite portal users", "Transfer ownership"],
	MANAGER: ["Rooms, bookings and folios", "Staff and rota", "Expenses up to the limit", "Refunds and discounts", "Hotel setup", "Roles for staff"],
	FRONT_OFFICE: ["Check in and out", "Take payments", "Post charges to folios", "Message guests", "Open and close the till"],
	HOUSEKEEPING: ["Clean and inspect rooms", "Report problems", "Minibar", "Lost & found"],
	LAUNDRY: ["Guest laundry orders", "Linen in and out", "Take payments"],
	MAINTENANCE: ["Repairs and updates", "Scheduled jobs", "Spare parts", "Rooms out of order"],
	KITCHEN: ["Orders and tickets", "Menu availability", "Kitchen store requests", "Take payments"],
	BAR: ["Sales and tabs", "Menu availability", "Bar stock and breakage", "Take payments"],
	INVENTORY: ["Stores and stock", "Issue to teams", "Purchase orders", "Deliveries and counts"],
	FINANCE: ["Today's money", "Expenses", "Tills and banking", "Night audit", "Organizations"],
};
const counts: Record<string, number> = { OWNER: 1, MANAGER: 4, FRONT_OFFICE: 14, HOUSEKEEPING: 38, LAUNDRY: 9, MAINTENANCE: 11, KITCHEN: 22, BAR: 13, INVENTORY: 6, FINANCE: 5 };

/** Owner · 09 Roles & permissions. */
export function OwnerRoles() {
	const [open, setOpen] = useState<string | null>(null);
	const { run, pending } = useNotConnectedAction();
	const roles = HOTEL_ROLES.filter((r) => permissionsByRole[r]);
	const role = open;
	return (
		<>
			<PageHeader title="Roles & permissions" subtitle="What each role can do · three levels: Full, Can edit, View only" />
			<Note tone="info">Managers give roles to their staff. You decide what each role is allowed to do across every hotel.</Note>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{roles.map((r) => {
					const Icon = roleIcons[r];
					return (
						<button key={r} type="button" onClick={() => setOpen(r)} className="flex items-start gap-3 rounded-card border border-line bg-card p-4 text-left hover:border-brand hover:bg-brand-soft/20">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand"><Icon className="size-5" /></span>
							<span className="min-w-0 flex-1">
								<span className="flex items-center gap-2"><span className="text-sm font-bold text-ink">{roleLabels[r]}</span><StatusPill dot={false}>{counts[r]} people</StatusPill></span>
								<span className="mt-[2px] block text-xs text-ink-3">{roleDescriptions[r]}</span>
								<span className="mt-2 block text-[11px] text-ink-3">{permissionsByRole[r].length} permissions</span>
							</span>
						</button>
					);
				})}
			</div>
			<SidePanel open={!!role} onOpenChange={(o) => !o && setOpen(null)} title={role ? roleLabels[role as keyof typeof roleLabels] : ""} subtitle={role ? roleDescriptions[role as keyof typeof roleDescriptions] : undefined} icon={ShieldCheckIcon} width="lg" footerInfo="Changes apply at every hotel" footer={<><Button variant="outline" className={btn.secondary} onClick={() => setOpen(null)}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Permissions saved", () => setOpen(null))}>Save permissions</Button></>}>
				{role && (
					<PanelSection title="Permissions by level">
						<table className="w-full text-left text-[13px]">
							<thead><tr className="text-[11px] uppercase tracking-[0.04em] text-ink-3"><th className="py-2">Can…</th>{levels.map((l) => <th key={l} className="py-2 text-center">{l === "FULL" ? "Full" : l === "EDIT" ? "Can edit" : "View only"}</th>)}</tr></thead>
							<tbody>
								{permissionsByRole[role].map((p, i) => (
									<tr key={p} className="border-t border-line"><td className="py-3 text-ink">{p}</td>{levels.map((l, j) => { const on = j === 0 || (j === 1 && i < permissionsByRole[role].length - 1) || (j === 2 && i === 0); return <td key={l} className="py-3 text-center"><span className={cn("inline-block size-4 rounded-full border", on ? "border-brand bg-brand" : "border-line-strong")} /></td>; })}</tr>
								))}
							</tbody>
						</table>
					</PanelSection>
				)}
			</SidePanel>
		</>
	);
}
