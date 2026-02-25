"use client";

import { formatCurrency } from "@/lib/utils";
import type { ProfitAndLossStatement as ProfitAndLossData } from "@/lib/api-routes/financials";

export function ProfitLossStatement({ data }: { data: ProfitAndLossData | null }) {
    if (!data) {
        return (
            <div className="bg-white p-4 rounded-2xl border">
                <h3 className="text-sm font-medium text-gray-600">Profit &amp; Loss Statement</h3>
                <p className="text-sm text-gray-400 mt-1">No data available for the selected period.</p>
            </div>
        );
    }

    const revenueItems = [
        { label: "Room Revenue", amount: data.roomRevenue },
        { label: "Food & Beverage", amount: data.foodAndBeverageRevenue },
        { label: "Laundry", amount: data.laundryRevenue },
        { label: "Rentals", amount: data.rentalRevenue },
        { label: "Other Revenue", amount: data.otherRevenue },
    ].filter(r => (r.amount ?? 0) !== 0);

    const expenseItems = [
        { label: "Cost of Goods Sold", amount: data.costOfGoodsSold },
        { label: "Staff", amount: data.staffExpenses },
        { label: "Utilities", amount: data.utilitiesExpenses },
        { label: "Maintenance", amount: data.maintenanceExpenses },
        { label: "Marketing", amount: data.marketingExpenses },
        { label: "Administrative", amount: data.administrativeExpenses },
        { label: "Depreciation", amount: data.depreciationExpenses },
        { label: "Insurance", amount: data.insuranceExpenses },
        { label: "Other Operating", amount: data.otherOperatingExpenses },
    ].filter(e => (e.amount ?? 0) !== 0);

    return (
        <div className="space-y-4">
            {/* Period Info */}
            {data.period && (
                <div className="flex flex-wrap gap-x-4 text-xs text-gray-400">
                    <span>Period: {data.period}</span>
                    {data.startDate && data.endDate && (
                        <span>{data.startDate} – {data.endDate}</span>
                    )}
                </div>
            )}

            {/* Revenue Section */}
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Revenue</h3>
                <table className="w-full text-sm">
                    <tbody>
                        {revenueItems.map((item) => (
                            <tr key={item.label} className="border-b last:border-0">
                                <td className="py-2 text-gray-600">{item.label}</td>
                                <td className="py-2 text-right font-medium text-primary">
                                    {formatCurrency(item.amount ?? 0)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2">
                            <td className="py-2 font-semibold text-gray-700">Gross Revenue</td>
                            <td className="py-2 text-right font-bold text-green-600">
                                {formatCurrency(data.grossRevenue ?? 0)}
                            </td>
                        </tr>
                        {(data.refunds ?? 0) !== 0 && (
                            <tr>
                                <td className="py-1 text-gray-500">Less: Refunds</td>
                                <td className="py-1 text-right text-red-500">
                                    {formatCurrency(data.refunds ?? 0)}
                                </td>
                            </tr>
                        )}
                        <tr className="border-t">
                            <td className="py-2 font-semibold text-gray-700">Net Revenue</td>
                            <td className="py-2 text-right font-bold text-primary">
                                {formatCurrency(data.netRevenue ?? 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Expenses Section */}
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Operating Expenses</h3>
                <table className="w-full text-sm">
                    <tbody>
                        {expenseItems.map((item) => (
                            <tr key={item.label} className="border-b last:border-0">
                                <td className="py-2 text-gray-600">{item.label}</td>
                                <td className="py-2 text-right font-medium text-primary">
                                    {formatCurrency(item.amount ?? 0)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2">
                            <td className="py-2 font-semibold text-gray-700">Total Operating Expenses</td>
                            <td className="py-2 text-right font-bold text-red-500">
                                {formatCurrency(data.totalOperatingExpenses ?? 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Profitability Summary */}
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Profitability</h3>
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">Gross Profit</span>
                        <span className="font-medium text-primary">
                            {formatCurrency(data.grossProfit ?? 0)}
                            {data.grossProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-1">({data.grossProfitMargin.toFixed(1)}%)</span>
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">Operating Profit</span>
                        <span className="font-medium text-primary">
                            {formatCurrency(data.operatingProfit ?? 0)}
                            {data.operatingProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-1">({data.operatingProfitMargin.toFixed(1)}%)</span>
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">Profit Before Tax</span>
                        <span className="font-medium text-primary">{formatCurrency(data.profitBeforeTax ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t pt-2 mt-2">
                        <span className="font-semibold text-gray-700">Net Profit</span>
                        <span className={`text-lg font-bold ${(data.netProfit ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {formatCurrency(data.netProfit ?? 0)}
                            {data.netProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-1">({data.netProfitMargin.toFixed(1)}%)</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
