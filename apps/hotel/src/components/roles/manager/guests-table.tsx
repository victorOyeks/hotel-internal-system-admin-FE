"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { bookingBuckets } from "@hospio/api/data";
import type { BookingRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

type Tab = "arrivals" | "departures" | "inHouse";

function statusOf(b: BookingRow, tab: Tab): { label: string; tone: "success" | "warning" | "danger" | "info" } {
	if (b.status === "NO_SHOW") return { label: "No-show", tone: "danger" };
	if (tab === "inHouse") return b.paymentPlan === "PAY_AT_CHECKOUT" ? { label: "Pays at check-out", tone: "info" } : b.totalAmount - b.paid > 0 ? { label: "Balance due", tone: "warning" } : { label: "Checked in", tone: "success" };
	if (tab === "departures") return { label: "Due out today", tone: "warning" };
	if (b.status === "CHECKED_IN") return { label: "Arrived", tone: "success" };
	return b.roomNumber ? { label: "Room assigned", tone: "success" } : { label: "No room yet", tone: "warning" };
}

/** Today's guests: arrivals, departures and who is in house, with the next step for each. */
export function GuestsTable({ buckets }: { buckets: ReturnType<typeof bookingBuckets> }) {
	const [tab, setTab] = useState<Tab>("arrivals");
	const lists: Record<Tab, BookingRow[]> = { arrivals: buckets.arrivals, departures: buckets.departures, inHouse: buckets.inHouse };
	const rows = lists[tab].slice(0, 5);
	const tabs: { key: Tab; label: string }[] = [
		{ key: "arrivals", label: "Arrivals" },
		{ key: "departures", label: "Departures" },
		{ key: "inHouse", label: "In-house" },
	];

	return (
		<SectionCard
			title="Today’s guests"
			flush
			headerRight={
				<div className="flex gap-[2px] rounded-[10px] bg-subtle p-1">
					{tabs.map((t) => (
						<button
							key={t.key}
							type="button"
							onClick={() => setTab(t.key)}
							className={cn(
								"flex items-center gap-[6px] rounded-lg py-[6px] pl-[10px] pr-2 text-xs transition-colors",
								tab === t.key ? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "font-medium text-ink-2",
							)}
						>
							{t.label}
							<span className={cn("rounded-[6px] px-[5px] py-px text-[10px] font-semibold", tab === t.key ? "bg-brand-soft text-brand" : "bg-card text-ink-2")}>
								{lists[t.key].length}
							</span>
						</button>
					))}
				</div>
			}
		>
			{rows.length === 0 ? (
				<EmptyState title={tab === "inHouse" ? "Nobody in house" : `No ${tab} today`} className="mx-5 mb-5" />
			) : (
				<table className="w-full text-left">
					<thead>
						<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="px-5 py-3 font-semibold">Guest</th>
							<th className="py-3 font-semibold">Room</th>
							<th className="py-3 font-semibold">{tab === "departures" ? "Check-out" : tab === "arrivals" ? "ETA" : "Nights"}</th>
							<th className="py-3 font-semibold">Status</th>
							<th className="py-3 pr-5" />
						</tr>
					</thead>
					<tbody>
						{rows.map((b) => {
							const status = statusOf(b, tab);
							const dueNow = b.totalAmount - b.paid;
							const due = dueNow > 0 && tab === "arrivals" && b.paymentPlan !== "PAY_AT_CHECKOUT" && b.paymentPlan !== "ORGANIZATION";
							return (
								<tr key={b.id} className="h-14 border-b border-line">
									<td className="px-5">
										<p className="text-[13px] font-semibold text-ink">{b.guestName}</p>
										<p className={cn("text-xs", due ? "text-danger" : "text-ink-3")}>
											{b.reference} · {due ? `${naira(dueNow)} to collect` : plural(b.nights, "night")}
										</p>
									</td>
									<td className="text-[13px] font-medium text-[#424242]">{b.roomNumber ? `${b.roomNumber} · ${b.roomTypeName}` : b.roomTypeName}</td>
									<td className="text-[13px] text-ink-2">{tab === "departures" ? fmtDay(b.checkOutDate) : tab === "arrivals" ? (b.eta ?? "—") : b.nights}</td>
									<td><StatusPill tone={status.tone}>{status.label}</StatusPill></td>
									<td className="pr-5 text-right">
										<Button asChild size="sm" variant={tab === "arrivals" ? "default" : "outline"} className={tab === "arrivals" && b.status === "BOOKED" ? btn.primary : btn.secondary}>
											<Link href={`/dashboard/bookings?open=${b.id}${tab === "arrivals" && b.status === "BOOKED" ? "&action=check-in" : tab === "departures" ? "&action=check-out" : ""}`}>
												{tab === "arrivals" && b.status === "BOOKED" ? "Check in" : tab === "departures" ? "Check out" : "Open"}
											</Link>
										</Button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}
			<div className="flex items-center px-5 py-3 text-xs">
				<span className="flex-1 text-ink-3">Showing {rows.length} of {lists[tab].length} {tab === "inHouse" ? "in house" : tab}</span>
				<Link href={`/dashboard/bookings?tab=${tab === "inHouse" ? "in-house" : tab}`} className="font-semibold text-brand">Open bookings →</Link>
			</div>
		</SectionCard>
	);
}
