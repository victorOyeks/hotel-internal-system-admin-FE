"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { ProfitAndLossStatement } from "@/lib/api-routes/financials";

export function ProfitLossStatement({ data }: { data: ProfitAndLossStatement | null }) {
    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Profit & Loss Statement</CardTitle>
                    <CardDescription>No data available for the selected period.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full gap-x-0">
            <CardHeader className="pb-4">
                <CardTitle>
                    <h2 className="text-primary text-xl">Profit & Loss Statement</h2>
                </CardTitle>
                <CardDescription>
                    Summary of revenues, costs, and expenses during the specified period.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Revenue Section */}
                    <div>
                        <h3 className="font-semibold text-base mb-2 text-green-700">Revenue</h3>
                        <Table>
                            <TableBody>
                                {data.revenue.map((item, index) => (
                                    <TableRow key={index} className="border-b-0">
                                        <TableCell className="py-1">{item.category}</TableCell>
                                        <TableCell className="text-right py-1 font-medium">{formatCurrency(item.amount)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="border-t-2 font-bold bg-muted/30">
                                    <TableCell>Total Revenue</TableCell>
                                    <TableCell className="text-right">{formatCurrency(data.totalRevenue)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Expenses Section */}
                    <div>
                        <h3 className="font-semibold text-base mb-2 text-red-700">Expenses</h3>
                        <Table>
                            <TableBody>
                                {data.expenses.map((item, index) => (
                                    <TableRow key={index} className="border-b-0">
                                        <TableCell className="py-1">{item.category}</TableCell>
                                        <TableCell className="text-right py-1 font-medium">{formatCurrency(item.amount)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="border-t-2 font-bold bg-muted/30">
                                    <TableCell>Total Expenses</TableCell>
                                    <TableCell className="text-right">{formatCurrency(data.totalExpenses)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Net Profit Section */}
                    <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <h3 className="font-bold text-lg">Net Profit</h3>
                        <span className={`text-lg font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(data.netProfit)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
