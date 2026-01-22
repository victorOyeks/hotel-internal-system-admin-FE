import { formatCurrency } from "@/lib/utils";
import {
	CheckCircleIcon,
	ClockIcon,
	FileTextIcon,
	DollarSignIcon,
	CalendarIcon,
} from "lucide-react";
import type { InventoryPurchaseOrderStatistics } from "@/lib/fetch";

interface PurchaseOrderStatsProps {
	stats: InventoryPurchaseOrderStatistics;
}

export function PurchaseOrderStats({ stats }: PurchaseOrderStatsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
			<StatCard
				icon={<DollarSignIcon className="size-6 text-blue-600" />}
				bgClass="bg-blue-600/10"
				title="Total Value"
				value={`${formatCurrency(stats.totalValue)}`!}
			/>
			<StatCard
				icon={<ClockIcon className="size-6 text-yellow-600" />}
				bgClass="bg-yellow-600/10"
				title="Pending Approval"
				value={stats.pendingApprovalPOs.toString()}
			/>
			<StatCard
				icon={<CheckCircleIcon className="size-6 text-green-600" />}
				bgClass="bg-green-600/10"
				title="Approved"
				value={stats.approvedPOs.toString()}
			/>
			<StatCard
				icon={<FileTextIcon className="size-6 text-gray-600" />}
				bgClass="bg-gray-600/10"
				title="Drafts"
				value={stats.draftPOs.toString()}
			/>
			<StatCard
				icon={<CalendarIcon className="size-6 text-purple-600" />}
				bgClass="bg-purple-600/10"
				title="Today's Orders"
				value={`${stats.posToday.toString()}`!}
				subtitle={`${formatCurrency(stats.valueToday)}`}
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
