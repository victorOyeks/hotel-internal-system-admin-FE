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
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { useSetAtom } from "jotai";
import { useLayoutEffect } from "react";
import { DataTablePagination } from "@/components/shared/pagination";

function HotelListToolbar() {
	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div className="relative">
				<input
					type="text"
					placeholder="Search Hotels"
					className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
				/>
				<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
			</div>

			<div className="flex items-center gap-x-2 ">
				<Button
					size={"sm"}
					variant={"ghost"}
					className="rounded-md md:rounded-xl bg-gray-100"
				>
					<FilterIcon />
					<span className="hidden md:inline">Filter</span>
				</Button>

				<Button
					size={"sm"}
					variant={"secondary"}
					className="rounded-md md:rounded-xl"
				>
					<PlusCircleIcon />
					<span className="hidden md:inline">Add New Hotel</span>
				</Button>

				<Button size={"sm"} className="rounded-md md:rounded-xl">
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

function HotelList({
	hotels
}: {
	hotels: HotelItem[];
}) {
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

								<DataTablePagination table={table} />
							</div>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
}

export function HotelOwnerHotels({
	breadcrumb,
	hotels
}: {
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	hotels: HotelItem[];
}) {
  const setBreadcrumb = useSetAtom(breadcrumbAtom);

  useLayoutEffect(
    () => {
      setBreadcrumb(breadcrumb)
      return () => setBreadcrumb(null)
    },
    [setBreadcrumb, breadcrumb]
  )

	return (
		<div className="p-4 space-y-2 md:space-y-4">
			<HotelListToolbar />
			<HotelList hotels={hotels} />
		</div>
	);
}
