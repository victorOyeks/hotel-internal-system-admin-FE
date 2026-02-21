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

type GuestPage = APIOutput<"@get/api/managers/guest-logs">["data"];
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

// ==================== Toolbar ====================
function GuestToolbar({
	totalElements,
}: {
	totalElements: number;
}) {
	const [queryState, setQueryState] = useQueryStates({
		search: parseAsString,
		status: parseAsStringLiteral(BOOKING_STATUSES),
	});

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div>
				<p className="text-primary md:pl-2">
					All guests ({totalElements})
				</p>
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative">
					<input
						type="text"
						placeholder="Search guests..."
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
						value={queryState.search ?? ""}
						onChange={(e) =>
							setQueryState({ search: e.target.value || null })
						}
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<Select
					value={queryState.status ?? "all"}
					onValueChange={(value) =>
						setQueryState({ status: value === "all" ? null : value as typeof queryState.status })
					}
				>
					<SelectTrigger className="w-[150px] rounded-md md:rounded-xl">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{BOOKING_STATUSES.map((status) => (
							<SelectItem key={status} value={status} className="capitalize">
								{status.replace(/_/g, " ").toLowerCase()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

// ==================== Guest Table ====================
function GuestTable({ guests }: { guests: GuestEntry[] }) {
	if (guests.length === 0) {
		return (
			<div className="overflow-hidden rounded-md border bg-card p-8 text-center">
				<p className="text-gray-500">No guest records found</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-md border bg-card">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-gray-100 text-left text-gray-500">
							<th className="px-4 py-3 font-medium">Guest Name</th>
							<th className="px-4 py-3 font-medium">Room</th>
							<th className="px-4 py-3 font-medium">Check-in</th>
							<th className="px-4 py-3 font-medium">Check-out</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Phone</th>
						</tr>
					</thead>
					<tbody>
						{guests.map((guest) => (
							<tr key={guest.customId} className="border-b last:border-0 hover:bg-gray-50">
								<td className="px-4 py-3 font-medium text-gray-700">
									{guest.guestName}
								</td>
								<td className="px-4 py-3 text-gray-600">
									{guest.roomIdentifier || "-"}
								</td>
								<td className="px-4 py-3 text-gray-500">
									{guest.checkInDate
										? new Date(guest.checkInDate).toLocaleDateString("en-US", {
												month: "short",
												day: "2-digit",
												year: "numeric",
											})
										: "-"}
								</td>
								<td className="px-4 py-3 text-gray-500">
									{guest.checkOutDate
										? new Date(guest.checkOutDate).toLocaleDateString(
												"en-US",
												{
													month: "short",
													day: "2-digit",
													year: "numeric",
												},
											)
										: "-"}
								</td>
								<td className="px-4 py-3">
									<Badge
										variant={statusVariants[guest.bookingStatus] ?? "outline"}
										className="capitalize"
									>
										{guest.bookingStatus.replace(/_/g, " ").toLowerCase()}
									</Badge>
								</td>
								<td className="px-4 py-3 text-gray-500">
									{guest.phoneNumber || "-"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ==================== Pagination Footer ====================
function GuestPagination({ paginationMeta }: { paginationMeta: Pagination }) {
	const [pagination, setPagination] = usePaginationSearchParams();

	const pageIndex = pagination.pageIndex;
	const pageCount = paginationMeta.totalPages;

	return (
		<div className="flex items-center justify-between">
			<p className="text-sm text-gray-500">
				Page {pageIndex + 1} of {pageCount}
			</p>
			<DataTablePagination
				pageIndex={pageIndex}
				pageCount={pageCount}
				canPreviousPage={pageIndex > 0}
				canNextPage={pageIndex < pageCount - 1}
				previousPage={() =>
					setPagination((prev) => ({
						...prev,
						pageIndex: Math.max(0, prev.pageIndex - 1),
					}))
				}
				nextPage={() =>
					setPagination((prev) => ({
						...prev,
						pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
					}))
				}
				setPageIndex={(idx) =>
					setPagination((prev) => ({ ...prev, pageIndex: idx }))
				}
			/>
		</div>
	);
}

// ==================== Main Guests ====================
export function Guests({
	breadcrumbs,
	guests,
	paginationMeta,
}: {
	breadcrumbs: Breadcrumb[];
	guests: GuestEntry[];
	paginationMeta: Pagination;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Guests",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	return (
		<div className="h-full w-full p-4 space-y-2 md:space-y-4">
			<GuestToolbar totalElements={paginationMeta.totalElements} />
			<GuestTable guests={guests} />
			{paginationMeta.totalPages > 1 && (
				<GuestPagination paginationMeta={paginationMeta} />
			)}
		</div>
	);
}
