"use client";

import { formatCurrency } from "@/lib/utils";
import type { ItemConsumptionReport } from "@/lib/api-routes/financials";

interface ConsumptionReportProps {
    data: ItemConsumptionReport | null;
}

export function ConsumptionReport({ data }: ConsumptionReportProps) {
    const items = data?.items ?? [];
    const summary = data?.summary;

    if (!items.length) {
        return (
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600">Consumption Report</h3>
                <p className="text-sm text-gray-400 mt-1">No consumption data available for the selected period.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Line */}
            {summary && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
                    <span>{summary.totalUniqueItems ?? 0} items ({summary.totalFoodItems ?? 0} food · {summary.totalDrinkItems ?? 0} drinks)</span>
                    <span>Revenue: {formatCurrency(summary.totalRevenue ?? 0)}</span>
                    <span>{summary.totalOrders ?? 0} orders</span>
                    <span>{summary.totalQuantityConsumed ?? 0} qty consumed</span>
                </div>
            )}

            {/* Items Table */}
            <div className="bg-white p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Item Consumption Details</h3>
                    {data?.totalItems != null && (
                        <span className="text-xs text-gray-400">{data.totalItems} total items</span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-gray-500">
                                <th className="pb-2 font-medium">Item Name</th>
                                <th className="pb-2 font-medium">Type</th>
                                <th className="pb-2 font-medium text-right">Qty</th>
                                <th className="pb-2 font-medium text-right">Orders</th>
                                <th className="pb-2 font-medium text-right">Revenue</th>
                                <th className="pb-2 font-medium text-right">Avg Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b last:border-0">
                                    <td className="py-2 text-gray-700 font-medium">{item.itemName ?? "Unknown"}</td>
                                    <td className="py-2 text-gray-500">{item.itemType ?? "N/A"}</td>
                                    <td className="py-2 text-right text-gray-600">{item.totalQuantityConsumed ?? 0}</td>
                                    <td className="py-2 text-right text-gray-600">{item.numberOfOrders ?? 0}</td>
                                    <td className="py-2 text-right font-medium text-primary">{formatCurrency(item.totalRevenue ?? 0)}</td>
                                    <td className="py-2 text-right text-gray-500">{formatCurrency(item.averagePrice ?? 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
