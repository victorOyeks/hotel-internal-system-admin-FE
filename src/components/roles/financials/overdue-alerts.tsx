"use client";

import { AlertTriangleIcon, ArrowRightIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Expenditure } from "@/lib/api-routes/financials";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OverdueAlertsProps {
    overdueItems: Expenditure[];
}

export function OverdueAlerts({ overdueItems }: OverdueAlertsProps) {
    if (!overdueItems || overdueItems.length === 0) return null;

    const totalOverdue = overdueItems.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangleIcon className="h-5 w-5" />
                    <CardTitle className="text-lg">Action Required: Overdue Expenditures</CardTitle>
                </div>
                <CardDescription className="text-red-600/80 dark:text-red-400/80">
                    You have {overdueItems.length} unpaid bill{overdueItems.length !== 1 ? 's' : ''} totaling{" "}
                    <span className="font-bold">{formatCurrency(totalOverdue)}</span> that are past due.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {overdueItems.slice(0, 3).map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg border border-red-100 dark:border-red-900/50 shadow-sm"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{item.vendor}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Due: {new Date(item.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{item.invoiceNumber}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                    {formatCurrency(item.amount)}
                                </Badge>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {overdueItems.length > 3 && (
                        <p className="text-sm text-center text-red-600/80 pt-2">
                            +{overdueItems.length - 3} more overdue items
                        </p>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <Button variant="destructive" size="sm">
                        View All Overdue
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
