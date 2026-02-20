"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

// Assuming a type structure since it wasn't explicitly exported in standard file yet, 
// using generic structure or one compatible with likely API response.
// Ref: financials-actions.ts `getCashFlow` returns generic `any` or implied structure. 
// I'll define a likely interface here or update actions if needed.
// For now, let's assume a simple structure similar to P&L but for cash flow categories.

export interface CashFlowStatement {
    operatingActivities: { category: string; amount: number }[];
    investingActivities: { category: string; amount: number }[];
    financingActivities: { category: string; amount: number }[];
    netCashFlow: number;
    beginningCashBalance: number;
    endingCashBalance: number;
}

export function CashFlowStatement({ data }: { data: CashFlowStatement | null }) {
    if (!data) {
        return (
            <Card className="shadow-none border-border">
                <CardHeader>
                    <CardTitle>Cash Flow Statement</CardTitle>
                    <CardDescription>No data available for the selected period.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const renderSection = (title: string, items: { category: string; amount: number }[]) => {
        const total = items.reduce((acc, item) => acc + item.amount, 0);
        return (
            <div className="mb-6">
                <h3 className="font-semibold text-md mb-2 bg-muted/50 p-2 rounded-md">{title}</h3>
                <Table>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index} className="border-b-0">
                                <TableCell className="py-1 pl-4">{item.category}</TableCell>
                                <TableCell className="text-right py-1">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="border-t font-medium">
                            <TableCell className="pl-4">Net Cash from {title.replace('Cash Flow from ', '')}</TableCell>
                            <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <Card className="shadow-none border-border">
            <CardHeader className="pb-4">
                <CardTitle>Cash Flow Statement</CardTitle>
                <CardDescription>
                    Inflows and outflows of cash and cash equivalents.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div>
                    {renderSection("Cash Flow from Operating Activities", data.operatingActivities)}
                    {renderSection("Cash Flow from Investing Activities", data.investingActivities)}
                    {renderSection("Cash Flow from Financing Activities", data.financingActivities)}

                    <div className="mt-8 space-y-2 border-t pt-4">
                        <div className="flex justify-between text-sm">
                            <span>Net Increase/Decrease in Cash</span>
                            <span className="font-semibold">{formatCurrency(data.netCashFlow)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Cash at Beginning of Period</span>
                            <span>{formatCurrency(data.beginningCashBalance)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-primary pt-2 border-t mt-2">
                            <span>Cash at End of Period</span>
                            <span>{formatCurrency(data.endingCashBalance)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
