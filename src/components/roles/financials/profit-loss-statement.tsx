"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import type { ProfitAndLossStatement as ProfitAndLossData } from "@/lib/api-routes/financials";
import { useMemo } from "react";
import { DollarSignIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from "lucide-react";

type LineItem = {
    label: string;
    amount: number;
};

const columnHelper = createColumnHelper<LineItem>();

const lineItemColumns = [
    columnHelper.accessor("label", {
        header: "Description",
        cell: (info) => (
            <span className="text-gray-600">{info.getValue()}</span>
        ),
    }),
    columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => (
            <div className="font-medium">
                {formatCurrency(info.getValue())}
            </div>
        ),
    }),
];

function PLTable({
    data,
    title,
    totalLabel,
    totalAmount,
    totalClassName,
}: {
    data: LineItem[];
    title: string;
    totalLabel?: string;
    totalAmount?: number;
    totalClassName?: string;
}) {
    const table = useReactTable({
        data,
        columns: lineItemColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">{title}</p>
            <div className="border border-primary-5/20 rounded-xl overflow-clip bg-card">
                <Table>
                    <TableHeader className="bg-gray-100">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-gray-500"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef
                                                    .header,
                                                header.getContext(),
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="text-gray-600"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={lineItemColumns.length}
                                    className="h-24 text-center"
                                >
                                    No items.
                                </TableCell>
                            </TableRow>
                        )}
                        {totalLabel != null && totalAmount != null && (
                            <TableRow className="border-t-2 bg-gray-50 font-semibold">
                                <TableCell className="text-gray-700 font-semibold">
                                    {totalLabel}
                                </TableCell>
                                <TableCell
                                    className={`font-bold ${totalClassName ?? "text-primary"}`}
                                >
                                    {formatCurrency(totalAmount)}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export function ProfitLossStatement({
    data,
}: {
    data: ProfitAndLossData | null;
}) {
    const revenueItems = useMemo(
        () =>
            !data
                ? []
                : [
                    {
                        label: "Room Revenue",
                        amount: data.roomRevenue ?? 0,
                    },
                    {
                        label: "Food & Beverage",
                        amount: data.foodAndBeverageRevenue ?? 0,
                    },
                    { label: "Laundry", amount: data.laundryRevenue ?? 0 },
                    { label: "Rentals", amount: data.rentalRevenue ?? 0 },
                    {
                        label: "Other Revenue",
                        amount: data.otherRevenue ?? 0,
                    },
                ].filter((r) => r.amount !== 0),
        [data],
    );

    const expenseItems = useMemo(
        () =>
            !data
                ? []
                : [
                    {
                        label: "Cost of Goods Sold",
                        amount: data.costOfGoodsSold ?? 0,
                    },
                    { label: "Staff", amount: data.staffExpenses ?? 0 },
                    {
                        label: "Utilities",
                        amount: data.utilitiesExpenses ?? 0,
                    },
                    {
                        label: "Maintenance",
                        amount: data.maintenanceExpenses ?? 0,
                    },
                    {
                        label: "Marketing",
                        amount: data.marketingExpenses ?? 0,
                    },
                    {
                        label: "Administrative",
                        amount: data.administrativeExpenses ?? 0,
                    },
                    {
                        label: "Depreciation",
                        amount: data.depreciationExpenses ?? 0,
                    },
                    {
                        label: "Insurance",
                        amount: data.insuranceExpenses ?? 0,
                    },
                    {
                        label: "Other Operating",
                        amount: data.otherOperatingExpenses ?? 0,
                    },
                ].filter((e) => e.amount !== 0),
        [data],
    );

    if (!data) {
        return (
            <div className="bg-white p-4 rounded-2xl border">
                <h3 className="text-sm font-medium text-gray-600">
                    Profit &amp; Loss Statement
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                    No data available for the selected period.
                </p>
            </div>
        );
    }

    const stats = [
        {
            title: "Gross Revenue",
            icon: DollarSignIcon,
            value: formatCurrency(data.grossRevenue ?? 0),
        },
        {
            title: "Net Revenue",
            icon: WalletIcon,
            value: formatCurrency(data.netRevenue ?? 0),
        },
        {
            title: "Total Expenses",
            icon: TrendingDownIcon,
            value: formatCurrency(data.totalOperatingExpenses ?? 0),
        },
        {
            title: "Net Profit",
            icon: TrendingUpIcon,
            value: formatCurrency(data.netProfit ?? 0),
            subtitle: data.netProfitMargin != null ? `${data.netProfitMargin.toFixed(1)}% margin` : undefined,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="col-span-1 bg-white border border-primary-5/40 p-2 rounded-2xl md:rounded-3xl flex items-center space-x-2"
                    >
                        <div className="size-8 md:size-12 aspect-square bg-green-500/20 rounded-full flex items-center justify-center">
                            <stat.icon className="text-secondary size-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs md:text-sm text-gray-400">{stat.title}</p>
                            <p className="text-lg text-primary font-semibold font-inter tracking-[0.01em]">
                                {stat.value}
                            </p>
                            {stat.subtitle && (
                                <p className="text-xs text-gray-400">{stat.subtitle}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Table */}
            <PLTable
                data={revenueItems}
                title="Revenue"
                totalLabel="Net Revenue"
                totalAmount={data.netRevenue ?? 0}
                totalClassName="text-primary"
            />

            {/* Expenses Table */}
            <PLTable
                data={expenseItems}
                title="Operating Expenses"
                totalLabel="Total Operating Expenses"
                totalAmount={data.totalOperatingExpenses ?? 0}
                totalClassName="text-red-500"
            />

            {/* Profitability Summary */}
            <div className="space-y-2">
                <p className="text-sm font-medium">Profitability</p>
                <div className="border border-primary-5/20 rounded-xl p-4 space-y-2 bg-card">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">
                            Gross Profit
                        </span>
                        <span className="font-medium text-primary">
                            {formatCurrency(data.grossProfit ?? 0)}
                            {data.grossProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-1">
                                    ({data.grossProfitMargin.toFixed(1)}%)
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">
                            Operating Profit
                        </span>
                        <span className="font-medium text-primary">
                            {formatCurrency(data.operatingProfit ?? 0)}
                            {data.operatingProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-1">
                                    ({data.operatingProfitMargin.toFixed(1)}%)
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">
                            Profit Before Tax
                        </span>
                        <span className="font-medium text-primary">
                            {formatCurrency(data.profitBeforeTax ?? 0)}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline border-t pt-2 mt-2">
                        <span className="font-semibold text-gray-700">
                            Net Profit
                        </span>
                        <span
                            className={`text-lg font-bold ${(data.netProfit ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}
                        >
                            {formatCurrency(data.netProfit ?? 0)}
                            {data.netProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-1">
                                    ({data.netProfitMargin.toFixed(1)}%)
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
