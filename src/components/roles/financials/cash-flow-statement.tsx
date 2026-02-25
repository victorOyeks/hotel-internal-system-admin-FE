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
import type { CashFlowStatement as CashFlowStatementType } from "@/lib/api-routes/financials";
import { useMemo } from "react";
import { ArrowDownCircleIcon, ArrowUpCircleIcon, DollarSignIcon, WalletIcon } from "lucide-react";

type CashFlowLineItem = {
    label: string;
    amount: number;
};

const columnHelper = createColumnHelper<CashFlowLineItem>();

const cashFlowColumns = [
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

function CashFlowTable({
    data,
    title,
    totalLabel,
    totalAmount,
    totalClassName,
}: {
    data: CashFlowLineItem[];
    title: string;
    totalLabel?: string;
    totalAmount?: number;
    totalClassName?: string;
}) {
    const table = useReactTable({
        data,
        columns: cashFlowColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{title}</p>
                {totalLabel && totalAmount != null && (
                    <span
                        className={`text-sm font-semibold ${totalClassName ?? "text-primary"}`}
                    >
                        {formatCurrency(totalAmount)}
                    </span>
                )}
            </div>
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
                                    colSpan={cashFlowColumns.length}
                                    className="h-24 text-center"
                                >
                                    No items.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export function CashFlowStatement({
    data,
}: {
    data: CashFlowStatementType | null;
}) {
    const cashInflows = useMemo(
        () =>
            !data
                ? []
                : [
                    {
                        label: "Room Bookings",
                        amount: data.cashFromRoomBookings ?? 0,
                    },
                    {
                        label: "Restaurants",
                        amount: data.cashFromRestaurants ?? 0,
                    },
                    {
                        label: "Laundry",
                        amount: data.cashFromLaundry ?? 0,
                    },
                    {
                        label: "Rentals",
                        amount: data.cashFromRentals ?? 0,
                    },
                    {
                        label: "Other Income",
                        amount: data.cashFromOtherIncome ?? 0,
                    },
                ].filter((item) => item.amount !== 0),
        [data],
    );

    const cashOutflows = useMemo(
        () =>
            !data
                ? []
                : [
                    {
                        label: "Paid to Suppliers",
                        amount: data.cashPaidToSuppliers ?? 0,
                    },
                    {
                        label: "Paid to Employees",
                        amount: data.cashPaidToEmployees ?? 0,
                    },
                    {
                        label: "Staff Costs",
                        amount: data.cashForStaffCosts ?? 0,
                    },
                    {
                        label: "Utilities",
                        amount: data.cashForUtilities ?? 0,
                    },
                    {
                        label: "Supplies",
                        amount: data.cashForSupplies ?? 0,
                    },
                    {
                        label: "Maintenance",
                        amount: data.cashForMaintenance ?? 0,
                    },
                    {
                        label: "Marketing",
                        amount: data.cashForMarketing ?? 0,
                    },
                    {
                        label: "Other Expenses",
                        amount: data.cashForOtherExpenses ?? 0,
                    },
                    {
                        label: "Operating Expenses",
                        amount: data.cashPaidForOperatingExpenses ?? 0,
                    },
                ].filter((item) => item.amount !== 0),
        [data],
    );

    if (!data) {
        return (
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600">
                    Cash Flow Statement
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                    No data available for the selected period.
                </p>
            </div>
        );
    }

    const stats = [
        {
            title: "Total Inflow",
            icon: ArrowDownCircleIcon,
            value: formatCurrency(data.totalCashInflow ?? 0),
        },
        {
            title: "Total Outflow",
            icon: ArrowUpCircleIcon,
            value: formatCurrency(data.totalCashOutflow ?? 0),
        },
        {
            title: "Net Cash Flow",
            icon: DollarSignIcon,
            value: formatCurrency(data.netCashFlow ?? 0),
        },
        {
            title: "Closing Balance",
            icon: WalletIcon,
            value: formatCurrency(data.closingCashBalance ?? 0),
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
                        </div>
                    </div>
                ))}
            </div>

            {/* Cash Inflows */}
            {cashInflows.length > 0 && (
                <CashFlowTable
                    data={cashInflows}
                    title="Cash Inflows"
                    totalLabel="Total Inflow"
                    totalAmount={data.totalCashInflow ?? undefined}
                    totalClassName="text-green-600"
                />
            )}

            {/* Cash Outflows */}
            {cashOutflows.length > 0 && (
                <CashFlowTable
                    data={cashOutflows}
                    title="Cash Outflows"
                    totalLabel="Total Outflow"
                    totalAmount={data.totalCashOutflow ?? undefined}
                    totalClassName="text-red-500"
                />
            )}

            {/* Working Capital */}
            {(data.accountsReceivable != null ||
                data.accountsPayable != null) && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Working Capital</p>
                        <div className="border border-primary-5/20 rounded-xl p-4 space-y-2 text-sm bg-card">
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Accounts Receivable
                                </span>
                                <span className="font-medium text-primary">
                                    {formatCurrency(data.accountsReceivable ?? 0)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    Accounts Payable
                                </span>
                                <span className="font-medium text-primary">
                                    {formatCurrency(data.accountsPayable ?? 0)}
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-gray-700 font-medium">
                                    Net Receivables/Payables
                                </span>
                                <span className="font-semibold text-primary">
                                    {formatCurrency(
                                        data.netReceivablesPayables ?? 0,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

            {/* Cash Summary */}
            <div className="space-y-2">
                <p className="text-sm font-medium">Cash Summary</p>
                <div className="border border-primary-5/20 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">
                            Opening Cash Balance
                        </span>
                        <span className="font-medium text-primary">
                            {formatCurrency(data.openingCashBalance ?? 0)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">
                            Net Cash from Operations
                        </span>
                        <span className="font-medium text-primary">
                            {formatCurrency(
                                data.netCashFromOperatingActivities ?? 0,
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Net Cash Flow</span>
                        <span
                            className={`font-semibold ${(data.netCashFlow ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}
                        >
                            {formatCurrency(data.netCashFlow ?? 0)}
                        </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-1">
                        <span className="font-semibold text-gray-700">
                            Closing Cash Balance
                        </span>
                        <span className="text-lg font-bold text-primary">
                            {formatCurrency(data.closingCashBalance ?? 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Cash Breakdown */}
            {(data.cashInHand != null ||
                data.bankBalance != null ||
                data.cardPayments != null) && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Cash Balance Breakdown
                        </p>
                        <div className="border border-primary-5/20 rounded-xl p-4 space-y-2 text-sm">
                            {data.cashInHand != null && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Cash in Hand
                                    </span>
                                    <span className="font-medium text-primary">
                                        {formatCurrency(data.cashInHand)}
                                    </span>
                                </div>
                            )}
                            {data.bankBalance != null && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Bank Balance
                                    </span>
                                    <span className="font-medium text-primary">
                                        {formatCurrency(data.bankBalance)}
                                    </span>
                                </div>
                            )}
                            {data.cardPayments != null && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Card Payments
                                    </span>
                                    <span className="font-medium text-primary">
                                        {formatCurrency(data.cardPayments)}
                                    </span>
                                </div>
                            )}
                            {data.mobileMoneyBalance != null && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Mobile Money
                                    </span>
                                    <span className="font-medium text-primary">
                                        {formatCurrency(data.mobileMoneyBalance)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
}
