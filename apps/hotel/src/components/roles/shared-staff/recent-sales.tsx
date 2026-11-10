"use client";

import { ChevronRightIcon } from "lucide-react";
import { fmtWhen, naira } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { lagosDate } from "@hospio/api/data/mappers/finance";
import type { OrderRow, SaleStatus } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { liveLines } from "./outlet-shared";
import { SALE_STATUS, saleWhere } from "./sale-panel";

/** Where an order from the board stands, by the same rule as the sales history (fnb-service SaleBucket). */
export function orderSaleStatus(o: OrderRow, bar: boolean): SaleStatus {
	if (o.status === "CANCELLED") return "CANCELLED";
	if (o.chargedToRoom) return "ON_ROOM";
	if (o.paid || o.settledBy === "COMPLIMENTARY") return "PAID";
	if ((o.paidAmount ?? 0) > 0) return "PART_PAID";
	const working =
		o.status === "OPEN" || o.status === "SENT" || o.status === "READY";
	if (o.total <= 0 || o.kind === "TAB" || (!bar && working))
		return "IN_PROGRESS";
	return "TO_PAY";
}

/**
 * The newest sales of an outlet (Bar today, Kitchen orders): each row opens the sale panel, so a sale left
 * unpaid can be collected from here. Unpaid sales from an earlier day say so.
 */
export function RecentSales({
	orders,
	bar,
	onOpen,
	limit = 8,
}: {
	orders: OrderRow[];
	bar: boolean;
	onOpen: (id: string) => void;
	limit?: number;
}) {
	const today = lagosDate();
	const list = [...orders]
		.sort((a, b) => b.openedAt.localeCompare(a.openedAt))
		.slice(0, limit);
	return (
		<SectionCard
			title="Recent sales"
			subtitle="Tap a sale to see it, take payment or charge it to a room"
			action={{ label: "All sales", href: "/dashboard/sales" }}
			flush
		>
			{list.length === 0 ? (
				<p className="px-5 py-6 text-[13px] text-ink-3">No sales yet today.</p>
			) : (
				<ul className="divide-y divide-line">
					{list.map((o) => {
						const status = orderSaleStatus(o, bar);
						const earlier =
							(status === "TO_PAY" || status === "PART_PAID") &&
							lagosDate(new Date(o.openedAt)) < today;
						return (
							<li key={o.id}>
								<button
									type="button"
									onClick={() => onOpen(o.id)}
									aria-label={`Open ${o.number}`}
									className={cn(
										"flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle/60",
										status === "CANCELLED" && "opacity-60",
										earlier && "bg-warning-soft/40",
									)}
								>
									<span className="w-16 shrink-0 text-[15px] font-bold text-ink">
										{o.number}
									</span>
									<span className="min-w-0 flex-1 text-[15px] text-ink">
										<span className="block truncate">
											{liveLines(o)
												.map((l) => `${l.qty} ${l.name}`)
												.join(", ") || "Nothing on it"}
										</span>
										<span className="block truncate text-xs text-ink-3">
											{saleWhere(o)}
											{o.guestName ? ` · ${o.guestName}` : ""} ·{" "}
											{fmtWhen(o.openedAt)}
											{o.openedBy && o.openedBy !== "—"
												? ` · ${o.openedBy}`
												: ""}
										</span>
									</span>
									<span
										className={cn(
											"text-[15px] font-semibold text-ink",
											status === "CANCELLED" && "line-through",
										)}
									>
										{naira(o.total)}
									</span>
									<StatusPill tone={SALE_STATUS[status].tone}>
										{status === "ON_ROOM" && o.roomNumber
											? `Room ${o.roomNumber}`
											: earlier
												? `${SALE_STATUS[status].label} · earlier`
												: SALE_STATUS[status].label}
									</StatusPill>
									<ChevronRightIcon className="size-4 shrink-0 text-ink-3" />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</SectionCard>
	);
}
