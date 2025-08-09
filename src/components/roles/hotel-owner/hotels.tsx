/** biome-ignore-all lint/suspicious/noArrayIndexKey: No array index key */
"use client";

import { faker } from "@faker-js/faker";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	DoorOpenIcon,
	FilterIcon,
	HotelIcon,
	MessageCircleMoreIcon,
	MoreVerticalIcon,
	PlusCircleIcon,
	SearchIcon,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

function HotelListToolbar() {
	return (
		<div className="flex items-center justify-between border border-primary-5/20 p-2 rounded-3xl">
			<div className="relative">
				<input
					type="text"
					placeholder="Search Hotels"
					className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-xl"
				/>
				<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
			</div>

			<div className="flex items-center gap-x-2 ">
				<Button
					size={"sm"}
					variant={"ghost"}
					className="rounded-xl bg-gray-100"
				>
					<FilterIcon />
					Filter
				</Button>

				<Button size={"sm"} variant={"secondary"} className="rounded-xl">
					<PlusCircleIcon />
					Add New Hotel
				</Button>

				<Button size={"sm"} className="rounded-xl">
					Export
				</Button>
			</div>
		</div>
	);
}

type HotelItem = {
	id: number;
	branchName: string;
	location: string;
	totalRooms: number;
	occupancyRate: number;
	grossRevenue: number;
	expenses: number;
};

const hotels: HotelItem[] = Array.from({ length: 15 }, () => ({
	id: faker.helpers.rangeToNumber({ min: 1000, max: 10000 }),
	branchName: faker.company.name(),
	location: faker.location.streetAddress(),
	totalRooms: faker.helpers.rangeToNumber({ min: 10, max: 100 }),
	occupancyRate: faker.helpers.rangeToNumber({ min: 0, max: 100 }),
	grossRevenue: faker.helpers.rangeToNumber({ min: 100000, max: 1000000 }),
	expenses: faker.helpers.rangeToNumber({ min: 5000, max: 500000 }),
}));

const columnHelper = createColumnHelper<HotelItem>();

const columns = [
	columnHelper.accessor("id", {
		header: "Hotel ID",
		cell: (info) => <span className="text-foreground">#{info.getValue()}</span>,
	}),
	columnHelper.accessor("branchName", {
		header: "Branch Name",
		cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
	}),
	columnHelper.accessor("location", {
		header: "Location",
		cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
	}),
	columnHelper.accessor("totalRooms", {
		header: "Total Rooms",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("occupancyRate", {
		header: "Occupancy Rate",
		cell: (info) => `${info.getValue()}%`,
	}),
	columnHelper.accessor("grossRevenue", {
		header: "Gross Revenue",
		cell: (info) => formatCurrency(info.getValue()),
	}),
	columnHelper.accessor("expenses", {
		header: "Expenses",
		cell: (info) => formatCurrency(info.getValue()),
	}),
	columnHelper.display({
		id: "actions",
		cell: (info) => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreVerticalIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="bg-white" align="end">
						<DropdownMenuItem asChild>
							<Link href={`/hotels/${info.row.original.id}`}>
								<HotelIcon />
								View Branch Hotel
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<DoorOpenIcon />
							Configure Hotel
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<MessageCircleMoreIcon />
							Contact Branch Manager
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="hover:bg-red-500/10 text-red-500 focus:text-red-500">
							<TrashIcon className="text-red-500" />
							Delete Hotel
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	}),
];

function HotelList() {
	const table = useReactTable({
		data: hotels,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});
	return (
		<div className="overflow-hidden rounded-md border">
			<Table>
				<TableHeader className="bg-gray-100">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>

				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="text-gray-600">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<div className="w-full flex items-center justify-between">
								<p>
									{table.getFilteredSelectedRowModel().rows.length} of{" "}
									{table.getFilteredRowModel().rows.length} row(s) selected.
								</p>

								<div className="flex items-center space-x-2">
									<Button
										variant="outline"
										size="icon"
										className="size-6"
										disabled={!table.getCanPreviousPage()}
										onClick={() => table.previousPage()}
									>
										<ChevronLeftIcon className="w-4 h-4" />
									</Button>

									{Array.from({ length: table.getPageCount() }, (_, index) => (
										<Button
											key={index + 1}
											size="icon"
											className="size-6"
											disabled={index === table.getState().pagination.pageIndex}
											onClick={() => table.setPageIndex(index)}
										>
											{index + 1}
										</Button>
									))}

									<Button
										variant="outline"
										size="icon"
										className="size-6"
										disabled={!table.getCanNextPage()}
										onClick={() => table.nextPage()}
									>
										<ChevronRightIcon className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
}

export function HotelOwnerHotels() {
	return (
		<div className="p-4 space-y-2 md:space-y-4">
			<HotelListToolbar />
			<HotelList />
		</div>
	);
}
