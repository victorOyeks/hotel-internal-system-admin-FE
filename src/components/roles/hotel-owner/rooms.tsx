"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { useSetAtom } from "jotai";
import { PlusIcon, SearchIcon } from "lucide-react";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { DataTablePagination } from "@/components/shared/pagination";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { addNewRoomToHotelOwner } from "@/lib/hotel-owner-actions";
import { toast } from "sonner";
import type { APIOutput } from "@/lib/action-utils";
import type { Pagination } from "@/lib/fetch";

type RoomEntry = APIOutput<"@get/api/hotel-owners/hotels/:hotelId/rooms">["data"]["content"][number];

const ROOM_STATUSES = [
	"AVAILABLE",
	"RESERVED",
	"BOOKED",
	"CHECKED_IN",
	"CHECKED_OUT",
	"BLOCKED",
	"DIRTY",
] as const;

const statusVariants: Record<string, BadgeVariant> = {
	AVAILABLE: "green",
	RESERVED: "yellow",
	BOOKED: "blue",
	CHECKED_IN: "green",
	CHECKED_OUT: "blue",
	BLOCKED: "destructive",
	DIRTY: "outline",
};

function AddRoomDialog({ hotelId, roomTypes }: { hotelId: string; roomTypes: any[] }) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const payload = {
			roomName: formData.get("roomName") as string,
			roomNumber: formData.get("roomNumber") as string,
			roomType: formData.get("roomType") as string,
			price: Number(formData.get("price")),
			facilities: (formData.get("facilities") as string)
				.split(",")
				.map((f) => f.trim())
				.filter(Boolean),
		};

		startTransition(async () => {
			const result = await addNewRoomToHotelOwner(payload);
			if (result.success) {
				toast.success("Room added successfully");
				setOpen(false);
			} else {
				toast.error(result.error || "Failed to add room");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<PlusIcon className="size-4 mr-1" />
					Add Room
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Room</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="roomName">Room Name</Label>
							<Input id="roomName" name="roomName" required />
						</div>
						<div>
							<Label htmlFor="roomNumber">Room Number</Label>
							<Input id="roomNumber" name="roomNumber" required />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="roomType">Room Type</Label>
							<Input
								id="roomType"
								name="roomType"
								placeholder="e.g. Standard, Deluxe"
								list="room-types-list"
								required
							/>
							<datalist id="room-types-list">
								{roomTypes.map((rt: any) => (
									<option key={rt.id} value={rt.name} />
								))}
							</datalist>
						</div>
						<div>
							<Label htmlFor="price">Price per Night</Label>
							<Input
								id="price"
								name="price"
								type="number"
								min="0"
								step="0.01"
								required
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="facilities">
							Facilities (comma-separated)
						</Label>
						<Input
							id="facilities"
							name="facilities"
							placeholder="WiFi, AC, TV, Mini Bar"
						/>
					</div>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Adding..." : "Add Room"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function RoomToolbar({ hotelId, roomTypes }: { hotelId: string; roomTypes: any[] }) {
	const [filters, setFilters] = useQueryStates({
		search: parseAsString.withDefault(""),
		status: parseAsStringLiteral(ROOM_STATUSES),
	});

	return (
		<div className="flex items-center justify-between gap-3 flex-wrap">
			<div className="flex items-center gap-3 flex-wrap flex-1">
				<div className="relative min-w-[200px] max-w-sm">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search rooms..."
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
									: (val as (typeof ROOM_STATUSES)[number]),
						})
					}
				>
					<SelectTrigger className="w-[160px] bg-white">
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{ROOM_STATUSES.map((s) => (
							<SelectItem key={s} value={s}>
								{s.replace(/_/g, " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<AddRoomDialog hotelId={hotelId} roomTypes={roomTypes} />
		</div>
	);
}

function RoomTable({ rooms }: { rooms: RoomEntry[] }) {
	if (rooms.length === 0) {
		return (
			<div className="bg-white p-8 rounded-2xl text-center">
				<p className="text-gray-400 text-sm">No rooms found</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left text-gray-500 bg-gray-50/50">
						<th className="p-3 font-medium">Room</th>
						<th className="p-3 font-medium">Type</th>
						<th className="p-3 font-medium">Price</th>
						<th className="p-3 font-medium">Status</th>
						<th className="p-3 font-medium">Facilities</th>
					</tr>
				</thead>
				<tbody>
					{rooms.map((room) => (
						<tr key={room.id} className="border-b last:border-0">
							<td className="p-3">
								<div>
									<p className="font-medium text-gray-700">
										{room.roomIdentifier}
									</p>
									<p className="text-xs text-gray-400">
										{room.customId}
									</p>
								</div>
							</td>
							<td className="p-3 text-gray-600">
								{room.roomType || "-"}
							</td>
							<td className="p-3 text-gray-700 font-medium">
								{room.roomPrice
									? Number(room.roomPrice).toLocaleString("en-NG", {
											style: "currency",
											currency: "NGN",
											minimumFractionDigits: 0,
										})
									: "-"}
							</td>
							<td className="p-3">
								<Badge
									variant={statusVariants[room.checkInStatus] ?? "outline"}
									className="capitalize text-xs"
								>
									{room.checkInStatus.replace(/_/g, " ").toLowerCase()}
								</Badge>
							</td>
							<td className="p-3 text-gray-500 text-xs">
								{room.roomFacility?.join(", ") || "-"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function OwnerRooms({
	rooms,
	paginationMeta,
	roomTypes,
	hotelId,
}: {
	rooms: RoomEntry[];
	paginationMeta: Pagination;
	roomTypes: any[];
	hotelId: string;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const { page, setPage } = usePaginationSearchParams();

	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Rooms", href: "/dashboard/rooms" },
	];

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Room Management",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb]);

	return (
		<div className="p-4 md:p-6 space-y-4">
			<RoomToolbar hotelId={hotelId} roomTypes={roomTypes} />
			<RoomTable rooms={rooms} />
			<DataTablePagination
				page={page}
				setPage={setPage}
				totalPages={paginationMeta.totalPages}
			/>
		</div>
	);
}
