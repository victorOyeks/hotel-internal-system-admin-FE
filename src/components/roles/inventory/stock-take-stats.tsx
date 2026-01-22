import { formatCurrency } from "@/lib/utils";
import {
    CheckCircleIcon,
    ClockIcon,
    FileTextIcon,
    CalendarIcon,
    ClipboardListIcon,
} from "lucide-react";
import type { InventoryStockTakeStatistics } from "@/lib/fetch";

interface StockTakeStatsProps {
    stats: InventoryStockTakeStatistics;
}

export function StockTakeStats({ stats }: StockTakeStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
                icon={<CalendarIcon className="size-6 text-blue-600" />}
                bgClass="bg-blue-600/10"
                title="Scheduled"
                value={stats.scheduledStockTakes.toString()}
                subtitle="Upcoming"
            />
            <StatCard
                icon={<ClipboardListIcon className="size-6 text-orange-600" />}
                bgClass="bg-orange-600/10"
                title="In Progress"
                value={stats.inProgressStockTakes.toString()}
                subtitle="Active counts"
            />
            <StatCard
                icon={<ClockIcon className="size-6 text-purple-600" />}
                bgClass="bg-purple-600/10"
                title="Pending Review"
                value={stats.pendingReviewStockTakes.toString()}
                subtitle="Awaiting approval"
            />
            <StatCard
                icon={<CheckCircleIcon className="size-6 text-green-600" />}
                bgClass="bg-green-600/10"
                title="Completed"
                value={stats.completedStockTakes.toString()}
                subtitle="Adjustments posted"
            />
            <StatCard
                icon={<FileTextIcon className="size-6 text-gray-600" />}
                bgClass="bg-gray-600/10"
                title="Total Variance"
                value={formatCurrency(stats.totalVarianceValue).toString()}
                subtitle={`${stats.accuracyRate}% Accuracy`}
            />
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    bgClass: string;
    title: string;
    value: string;
    subtitle?: string;
}

function StatCard({ icon, bgClass, title, value, subtitle }: StatCardProps) {
    return (
        <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
            <div
                className={`size-10 aspect-square ${bgClass} rounded-full flex items-center justify-center`}
            >
                {icon}
            </div>
            <div className="flex flex-col flex-1">
                <h3 className="text-xs text-muted-foreground">{title}</h3>
                <p className="text-xl font-semibold leading-tight">
                    {value}{" "}
                    {subtitle && (
                        <span className="text-xs text-muted-foreground font-light">
                            {subtitle}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
