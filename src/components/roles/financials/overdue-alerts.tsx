"use client";

import { AlertTriangleIcon, ArrowRightIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Expenditure } from "@/lib/api-routes/financials";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OverdueAlertsProps {
    overdueItems: Expenditure[];
}

export function OverdueAlerts({ overdueItems }: OverdueAlertsProps) {
    if (!overdueItems || overdueItems.length === 0) return null;

    const totalOverdue = overdueItems.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div
            className="flex items-center gap-3 py-1 px-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-sm mb-4 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
        >
            <AlertTriangleIcon className="size-4 text-red-500 shrink-0" />
            <p className="text-red-700 dark:text-red-400">
                <span className="font-medium">{overdueItems.length} overdue</span>{" "}
                bill{overdueItems.length !== 1 ? "s" : ""} totaling{" "}
                <span className="font-semibold">{formatCurrency(totalOverdue)}</span>
            </p>

            <Button asChild size={"icon"} variant={"ghost"} className="ml-auto text-red-400">
                <Link href="/dashboard/expenditures/overdue">
                    <ArrowRightIcon />
                </Link>
            </Button>
        </div>
    );
}
