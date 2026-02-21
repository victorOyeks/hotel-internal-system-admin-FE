"use client";

import { useLayoutEffect } from "react";
import { useSetAtom } from "jotai";
import { SearchIcon } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { DataTablePagination } from "@/components/shared/pagination";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import type { APIOutput } from "@/lib/action-utils";
import type { Pagination } from "@/lib/fetch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type GuestPage = APIOutput<"@get/api/hotel-owners/guest-logs">["data"];
type GuestEntry = GuestPage["content"][number];

const BOOKING_STATUSES = [
	"RESERVED",
	"CHECKED_IN",
	"CHECKED_OUT",
	"CANCELLED",
] as const;

const statusVariants: Record<string, BadgeVariant> = {
	CHECKED_IN: "green",
	CHECKED_OUT: "blue",
	RESERVED: "yellow",
	CANCELLED: "destructive",
};

function GuestToolbar() {
	const [filters, setFilters] = useQueryStates({
		search: parseAsString.withDefault(""),
		status: parseAsStringLiteral(BOOKING_STATUSES),
	});

	return (
		<div className="flex items-center gap-3 flex-wrap">
			<div className="relative flex-1 min-w-[200px] max-w-sm">
				<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
				<input
					type="text"
					placeholder="Search guests..."
					value={filters.search}
					onChange={(e) => setFilters({ search: e.target.value })}
					className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-5"
				/>
			</div>
			<Select
				value={filters.status ?? "all"}
				onValueChange={(val) =>
					setFilters({
						status:
							val === "all"
								? null
								: (val as (typeof BOOKING_STATUSES)[number]),
					})
				}
			>
				<SelectTrigger className="w-[160px] bg-white">
					<SelectValue placeholder="All Statuses" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Statuses</SelectItem>
					{BOOKING_STATUSES.map((s) => (
						<SelectItem key={s} value={s}>
							{s.replace(/_/g, " ")}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function GuestTable({ guests }: { guests: GuestEntry[] }) {
	if (guests.length === 0) {
		return (
			<div className="bg-white p-8 rounded-2xl text-center">
				<p className="text-gray-400 text-sm">No guest records found</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left text-gray-500 bg-gray-50/50">
						<th className="p-3 font-medium">Guest Name</th>
						<th className="p-3 font-medium">Room</th>
						<th className="p-3 font-medium">Check-in</th>
						<th className="p-3 font-medium">Check-out</th>
						<th className="p-3 font-medium">Status</th>
						<th className="p-3 font-medium">Phone</th>
					</tr>
				</thead>
				<tbody>
					{guests.map((guest) => (
						<tr key={guest.customId ?? guest.guestName} className="border-b last:border-0">
							<td className="p-3 font-medium text-gray-700">
								{guest.guestName}
							</td>
							<td className="p-3 text-gray-600">
								{guest.roomIdentifier || "-"}
							</td>
							<td className="p-3 text-gray-500 text-xs">
								{guest.checkInDate
									? new Date(guest.checkInDate).toLocaleDateString()
									: "-"}
							</td>
							<td className="p-3 text-gray-500 text-xs">
								{guest.checkOutDate
									? new Date(guest.checkOutDate).toLocaleDateString()
									: "-"}
							</td>
							<td className="p-3">
								<Badge
									variant={statusVariants[guest.bookingStatus] ?? "outline"}
									className="capitalize text-xs"
								>
									{guest.bookingStatus.replace(/_/g, " ").toLowerCase()}
								</Badge>
							</td>
							<td className="p-3 text-gray-500 text-xs">
								{guest.phoneNumber || "-"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function OwnerGuests({
	guests,
	paginationMeta,
}: {
	guests: GuestEntry[];
	paginationMeta: Pagination;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const { page, setPage } = usePaginationSearchParams();

	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Guests", href: "/dashboard/guests" },
	];

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Guests",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb]);

	return (
		<div className="p-4 md:p-6 space-y-4">
			<GuestToolbar />
			<GuestTable guests={guests} />
			<DataTablePagination
				page={page}
				setPage={setPage}
				totalPages={paginationMeta.totalPages}
			/>
		</div>
	);
}
