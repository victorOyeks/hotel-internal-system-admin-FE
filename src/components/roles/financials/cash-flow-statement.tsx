"use client";

import { formatCurrency } from "@/lib/utils";
import type { CashFlowStatement as CashFlowStatementType } from "@/lib/api-routes/financials";

export function CashFlowStatement({ data }: { data: CashFlowStatementType | null }) {
    if (!data) {
        return (
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600">Cash Flow Statement</h3>
                <p className="text-sm text-gray-400 mt-1">No data available for the selected period.</p>
            </div>
        );
    }

    const cashInflows = [
        { label: "Room Bookings", amount: data.cashFromRoomBookings },
        { label: "Restaurants", amount: data.cashFromRestaurants },
        { label: "Laundry", amount: data.cashFromLaundry },
        { label: "Rentals", amount: data.cashFromRentals },
        { label: "Other Income", amount: data.cashFromOtherIncome },
    ].filter(item => (item.amount ?? 0) !== 0);

    const cashOutflows = [
        { label: "Paid to Suppliers", amount: data.cashPaidToSuppliers },
        { label: "Paid to Employees", amount: data.cashPaidToEmployees },
        { label: "Staff Costs", amount: data.cashForStaffCosts },
        { label: "Utilities", amount: data.cashForUtilities },
        { label: "Supplies", amount: data.cashForSupplies },
        { label: "Maintenance", amount: data.cashForMaintenance },
        { label: "Marketing", amount: data.cashForMarketing },
        { label: "Other Expenses", amount: data.cashForOtherExpenses },
        { label: "Operating Expenses", amount: data.cashPaidForOperatingExpenses },
    ].filter(item => (item.amount ?? 0) !== 0);

    const renderTable = (items: { label: string; amount: number | null | undefined }[]) => (
        <table className="w-full text-sm">
            <tbody>
                {items.map((item) => (
                    <tr key={item.label} className="border-b last:border-0">
                        <td className="py-2 text-gray-600">{item.label}</td>
                        <td className="py-2 text-right font-medium text-primary">
                            {formatCurrency(item.amount ?? 0)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="space-y-4">
            {/* Period Info */}
            {data.period && (
                <div className="text-xs text-gray-400">
                    Period: {data.period}
                    {data.startDate && data.endDate && ` · ${data.startDate} – ${data.endDate}`}
                </div>
            )}

            {/* Cash Inflows */}
            {cashInflows.length > 0 && (
                <div className="bg-white p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-600">Cash Inflows</h3>
                        {data.totalCashInflow != null && (
                            <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(data.totalCashInflow)}
                            </span>
                        )}
                    </div>
                    {renderTable(cashInflows)}
                </div>
            )}

            {/* Cash Outflows */}
            {cashOutflows.length > 0 && (
                <div className="bg-white p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-600">Cash Outflows</h3>
                        {data.totalCashOutflow != null && (
                            <span className="text-sm font-semibold text-red-500">
                                {formatCurrency(data.totalCashOutflow)}
                            </span>
                        )}
                    </div>
                    {renderTable(cashOutflows)}
                </div>
            )}

            {/* Working Capital */}
            {(data.accountsReceivable != null || data.accountsPayable != null) && (
                <div className="bg-white p-4 rounded-2xl">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Working Capital</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Accounts Receivable</span>
                            <span className="font-medium text-primary">{formatCurrency(data.accountsReceivable ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Accounts Payable</span>
                            <span className="font-medium text-primary">{formatCurrency(data.accountsPayable ?? 0)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-700 font-medium">Net Receivables/Payables</span>
                            <span className="font-semibold text-primary">{formatCurrency(data.netReceivablesPayables ?? 0)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Cash Summary */}
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Cash Summary</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Opening Cash Balance</span>
                        <span className="font-medium text-primary">{formatCurrency(data.openingCashBalance ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Net Cash from Operations</span>
                        <span className="font-medium text-primary">{formatCurrency(data.netCashFromOperatingActivities ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Net Cash Flow</span>
                        <span className={`font-semibold ${(data.netCashFlow ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {formatCurrency(data.netCashFlow ?? 0)}
                        </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-1">
                        <span className="font-semibold text-gray-700">Closing Cash Balance</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(data.closingCashBalance ?? 0)}</span>
                    </div>
                </div>
            </div>

            {/* Cash Breakdown */}
            {(data.cashInHand != null || data.bankBalance != null || data.cardPayments != null) && (
                <div className="bg-white p-4 rounded-2xl">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Cash Balance Breakdown</h3>
                    <div className="space-y-2 text-sm">
                        {data.cashInHand != null && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Cash in Hand</span>
                                <span className="font-medium text-primary">{formatCurrency(data.cashInHand)}</span>
                            </div>
                        )}
                        {data.bankBalance != null && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Bank Balance</span>
                                <span className="font-medium text-primary">{formatCurrency(data.bankBalance)}</span>
                            </div>
                        )}
                        {data.cardPayments != null && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Card Payments</span>
                                <span className="font-medium text-primary">{formatCurrency(data.cardPayments)}</span>
                            </div>
                        )}
                        {data.mobileMoneyBalance != null && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mobile Money</span>
                                <span className="font-medium text-primary">{formatCurrency(data.mobileMoneyBalance)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
