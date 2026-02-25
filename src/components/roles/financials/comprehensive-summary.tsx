"use client";

import { formatCurrency } from "@/lib/utils";
import type { ComprehensiveSummaryData } from "@/lib/api-routes/financials";

interface ComprehensiveSummaryProps {
    data: ComprehensiveSummaryData | null;
}

export function ComprehensiveSummary({ data }: ComprehensiveSummaryProps) {
    if (!data) return null;

    const revenueStreams = [
        { label: "Booking Revenue", amount: data.totalBookingRevenue, percentage: data.bookingRevenuePercentage },
        { label: "Restaurant Revenue", amount: data.totalRestaurantRevenue, percentage: data.restaurantRevenuePercentage },
        { label: "Laundry Revenue", amount: data.totalLaundryRevenue, percentage: data.laundryRevenuePercentage },
        { label: "Rental Revenue", amount: data.totalRentalRevenue, percentage: data.rentalRevenuePercentage },
        { label: "Other Income", amount: data.totalOtherIncome, percentage: data.otherIncomePercentage },
    ].filter(stream => (stream.amount ?? 0) > 0);

    return (
        <div className="space-y-4">
            {/* Period Info */}
            {data.startDate && data.endDate && (
                <div className="text-xs text-gray-400">
                    {data.startDate} – {data.endDate}
                    {data.hotelName && ` · ${data.hotelName}`}
                </div>
            )}

            {/* Overview Metrics */}
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Overview</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-500">Grand Total Revenue</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(data.grandTotalRevenue ?? 0)}</span>
                    </div>
                    {data.revenueGrowthPercentage != null && (
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500">Revenue Growth</span>
                            <span className={`font-medium ${data.revenueGrowthPercentage >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {data.revenueGrowthPercentage >= 0 ? "+" : ""}{data.revenueGrowthPercentage.toFixed(1)}%
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-500">Total Bookings</span>
                        <span className="font-medium text-primary">
                            {data.totalBookings ?? 0}
                            <span className="text-xs text-gray-400 ml-1">({data.checkIns ?? 0} in · {data.checkOuts ?? 0} out)</span>
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-500">Avg Booking Value</span>
                        <span className="font-medium text-primary">{formatCurrency(data.averageBookingValue ?? 0)}</span>
                    </div>
                    {data.totalKitchenRevenue != null && data.totalBarRevenue != null && (
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500">Kitchen / Bar</span>
                            <span className="font-medium text-primary">
                                {formatCurrency(data.totalKitchenRevenue)} / {formatCurrency(data.totalBarRevenue)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Revenue by Source */}
            {revenueStreams.length > 0 && (
                <div className="bg-white p-4 rounded-2xl">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Revenue by Source</h3>
                    <table className="w-full text-sm">
                        <tbody>
                            {revenueStreams.map((stream) => (
                                <tr key={stream.label} className="border-b last:border-0">
                                    <td className="py-2 text-gray-600">{stream.label}</td>
                                    <td className="py-2 text-right font-medium text-primary">
                                        {formatCurrency(stream.amount ?? 0)}
                                    </td>
                                    <td className="py-2 text-right text-gray-400 w-16">
                                        {stream.percentage != null ? `${stream.percentage.toFixed(1)}%` : ""}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Narrative Summary */}
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Executive Summary</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    {data.hotelName && <>{data.hotelName} generated </>}
                    <strong className="text-primary">{formatCurrency(data.grandTotalRevenue ?? 0)}</strong> in total revenue.
                    Room bookings contributed <strong className="text-primary">{formatCurrency(data.totalBookingRevenue ?? 0)}</strong> across{" "}
                    <strong className="text-primary">{data.totalBookings ?? 0}</strong> bookings.
                    {data.revenueGrowthPercentage != null && (
                        <> Revenue {data.revenueGrowthPercentage >= 0 ? "grew" : "declined"} by{" "}
                            <strong className="text-primary">{Math.abs(data.revenueGrowthPercentage).toFixed(1)}%</strong> compared to the previous period.</>
                    )}
                </p>
            </div>
        </div>
    );
}
