"use client";

import {
	BedDoubleIcon,
	CreditCardIcon,
	LogInIcon,
	LogOutIcon,
	ReceiptIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import type { HotelOverviewData } from "@hospio/api/data/admin-types";
import type { HotelSummary } from "@hospio/api/data/types";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { cn } from "@hospio/ui/utils";
import { BusinessTabHeader } from "./nav";

/** Business · one hotel's day: GET /platform/admin/businesses/{id}/hotels/{hotelId}/overview. */
export function HotelOverviewTab({
	businessId,
	businessName,
	hotel,
	overview,
	siblings,
}: {
	businessId: string;
	businessName: string;
	hotel: HotelSummary | null;
	overview: HotelOverviewData | null;
	siblings: HotelSummary[];
}) {
	const name = overview?.name ?? hotel?.name ?? "Hotel";
	return (
		<>
			<BusinessTabHeader
				businessId={businessId}
				businessName={businessName}
				active="hotel"
				subtitle={`${name}${hotel?.city ? ` · ${hotel.city}` : ""} · today, gathered from property, reservation, folio and payment`}
			/>
			{siblings.length > 1 && (
				<div className="flex flex-wrap gap-2">
					{siblings.map((h) => (
						<Link
							key={h.id}
							href={`/dashboard/businesses/${businessId}/hotels/${h.id}`}
							className={cn(
								"rounded-pill border px-3 py-1 text-xs font-medium",
								h.id === (overview?.hotelId ?? hotel?.id)
									? "border-brand bg-brand-soft text-brand"
									: "border-line bg-card text-ink-2 hover:text-ink",
							)}
						>
							{h.name}
						</Link>
					))}
				</div>
			)}
			{!overview ? (
				<EmptyState
					title="The hotel overview is not available"
					hint="platform-service could not gather today's figures; try again in a moment."
				/>
			) : (
				<>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
						<KpiCard
							label="Occupancy"
							value={`${Math.round(overview.occupancyPct)}%`}
							icon={BedDoubleIcon}
							hint={`${overview.occupiedRooms} of ${overview.rooms || hotel?.rooms || 0} rooms`}
						/>
						<KpiCard
							label="Arrivals today"
							value={overview.arrivalsToday}
							icon={LogInIcon}
						/>
						<KpiCard
							label="Departures today"
							value={overview.departuresToday}
							icon={LogOutIcon}
						/>
						<KpiCard
							label="Open folios"
							value={overview.openFolios}
							icon={ReceiptIcon}
						/>
						<KpiCard
							label="Payments today"
							value={nairaShort(overview.paymentsTodayGross)}
							icon={CreditCardIcon}
							hint={plural(overview.paymentsTodayCount, "payment")}
						/>
						<KpiCard
							label="Manager"
							value={
								<span className="text-base">
									{overview.managerName ?? hotel?.manager ?? "—"}
								</span>
							}
							icon={UserIcon}
						/>
					</div>
					<SectionCard title="Hotel" subtitle="From tenant-service">
						<DetailList
							columns={2}
							items={[
								{ label: "Name", value: name },
								{ label: "City", value: hotel?.city ?? "—" },
								{ label: "Address", value: hotel?.address || "—" },
								{ label: "Rooms", value: overview.rooms || hotel?.rooms || 0 },
								{ label: "Time zone", value: hotel?.timezone ?? "—" },
								{
									label: "Payments today",
									value: naira(overview.paymentsTodayGross),
								},
							]}
						/>
					</SectionCard>
				</>
			)}
		</>
	);
}
