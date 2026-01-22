import { DataTablePagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
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
import {
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type Table as TableType,
	flexRender,
} from "@tanstack/react-table";
import { DollarSignIcon, FilterIcon } from "lucide-react";

export type Transaction = {
	id: string;
	expenseOrDepartment: string;
	category: string;
	hotelBranch: string;
	Quantity: number;
	amount: number;
	date: string;
};

function Earnings() {
	const earnings = [
		{
			title: "Total Balance",
			icon: DollarSignIcon,
			value: 600_000,
		},
		{
			title: "Total Profit",
			icon: DollarSignIcon,
			value: 200_000,
		},
		{
			title: "Expenses",
			icon: DollarSignIcon,
			value: 100_000,
		},
	];
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
			{earnings.map((earning) => (
				<div
					key={earning.title}
					className="col-span-1 bg-white border border-primary-5/40 p-2 rounded-2xl md:rounded-3xl flex items-center space-x-2"
				>
					<div className="size-8 md:size-12 aspect-square bg-green-500/20 rounded-full flex items-center justify-center">
						<earning.icon className="text-secondary size-5" />
					</div>
					<div className="flex-1">
						<p className="text-xs md:text-sm text-gray-400">{earning.title}</p>
						<p className="text-lg text-primary font-semibold font-inter tracking-[0.01em] ">
							{formatCurrency(earning.value)}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

const column = createColumnHelper<Transaction>();

const columns = [
	column.accessor("expenseOrDepartment", {
		header: "Expense/Department",
		cell: (info) => info.getValue(),
	}),
	column.accessor("category", {
		header: "Category",
		cell: (info) => info.getValue(),
	}),
	column.accessor("hotelBranch", {
		header: "Hotel Branch",
		cell: (info) => info.getValue(),
	}),
	column.accessor("Quantity", {
		header: "Quantity",
		cell: (info) => info.getValue(),
	}),
	column.accessor("amount", {
		header: "Amount",
		cell: (info) => formatCurrency(info.getValue()),
	}),
	column.accessor("date", {
		header: "Date",
		// Date format should be e.g Sep 03, 2025 | 09:00 am
		cell: (info) => {
			const date = new Date(info.getValue());
			const formattedDate = date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "2-digit",
			});
			const formattedTime = date
				.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: true,
				})
				.toLowerCase();
			return <span>{`${formattedDate} | ${formattedTime}`}</span>;
		},
	}),
];

function ExpensesTable({ table }: { table: TableType<Transaction> }) {
	return (
		<div className="border border-primary-5/20 rounded-xl overflow-clip">
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

export function ExpensesSection({
	revalidate,
	expenses,
}: {
	revalidate: () => Promise<void>;
	expenses: Transaction[];
}) {
	const table = useReactTable({
		data: expenses,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		meta: {
			revalidate,
		},
	});
	return (
		<div className="space-y-4">
			<Earnings />

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Expenses</h2>
					<Button
						size={"sm"}
						variant={"ghost"}
						className="rounded-md md:rounded-xl bg-gray-100"
					>
						<FilterIcon />
						<span className="hidden md:inline">Filter</span>
					</Button>
				</div>
				<ExpensesTable table={table} />
			</div>
		</div>
	);
}
