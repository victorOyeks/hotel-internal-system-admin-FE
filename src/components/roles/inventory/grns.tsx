import { FileTextIcon, PackageCheckIcon, TruckIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface GRNStatsProps {
	totalValue: number;
	postedCount: number;
	recentCount: number;
}

export function GRNStats({
	totalValue,
	postedCount,
	recentCount,
}: GRNStatsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
			<StatCard
				icon={<FileTextIcon className="size-6 text-orange-600" />}
				bgClass="bg-orange-600/10"
				title="Total GRNs"
				value={formatCurrency(totalValue)}
			/>
			<StatCard
				icon={<PackageCheckIcon className="size-5 text-green-600" />}
				bgClass="bg-green-600/10"
				title="Posted GRNs"
				value={postedCount.toString()}
				subtitle="Stock updated"
			/>
			<StatCard
				icon={<TruckIcon className="size-6 text-blue-600" />}
				bgClass="bg-blue-600/10"
				title="Recent GRNs"
				value={recentCount.toString()}
				subtitle="Last 7 days"
			/>
		</div>
	);
}

function StatCard({ icon, bgClass, title, value, subtitle }: any) {
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
