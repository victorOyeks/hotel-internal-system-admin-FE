"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Define a local type for now as we don't have a shared one yet
interface ConsumptionItem {
    itemId: string;
    itemName: string;
    quantityConsumed: number;
    unit: string;
    totalCost: number;
    category: string;
}

interface ConsumptionReportProps {
    data: any; // Using any for pagination wrapper for now
}

export function ConsumptionReport({ data }: ConsumptionReportProps) {
    const items: ConsumptionItem[] = data?.content || [];

    if (!items.length) {
        return (
            <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full gap-x-0">
                <CardHeader>
                    <CardTitle>
                        <h2 className="text-primary text-xl">Consumption Report</h2>
                    </CardTitle>
                    <CardDescription>No consumption data available for the selected period.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full gap-x-0">
            <CardHeader className="pb-4">
                <CardTitle>
                    <h2 className="text-primary text-xl">Inventory Consumption</h2>
                </CardTitle>
                <CardDescription>
                    Breakdown of inventory items consumed and their associated costs.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell><Badge variant="secondary" className="font-normal">{item.category}</Badge></TableCell>
                                <TableCell className="text-right">{item.quantityConsumed} {item.unit}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(item.totalCost)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
