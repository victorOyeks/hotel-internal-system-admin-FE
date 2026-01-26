/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import {
	WarehouseIcon,
	ThermometerIcon,
	PackageIcon,
	MapPinIcon,
} from "lucide-react";

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

export function StatSection({
	activeCount,
	avgOccupancy,
	temperatureControlledCount,
	totalItemsStored,
}: {
	activeCount: number;
	temperatureControlledCount: number;
	totalItemsStored: number;
	avgOccupancy: number;
}) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
			<StatCard
				icon={<WarehouseIcon className="w-6 h-6 text-blue-600" />}
				bgClass="bg-blue-600/10"
				title="Active Locations"
				value={activeCount}
			/>

			<StatCard
				icon={<ThermometerIcon className="w-6 h-6 text-purple-600" />}
				bgClass="bg-purple-600/10"
				title="Climate Controlled"
				value={temperatureControlledCount}
			/>

			<StatCard
				icon={<PackageIcon className="w-6 h-6 text-green-600" />}
				bgClass="bg-green-600/10"
				title="Items Stored"
				value={totalItemsStored}
			/>

			<StatCard
				icon={<ThermometerIcon className="w-6 h-6 text-purple-600" />}
				bgClass="bg-purple-600/10"
				title="Climate Controlled"
				value={temperatureControlledCount}
			/>

			<StatCard
				icon={<MapPinIcon className="w-6 h-6 text-orange-600" />}
				bgClass="bg-orange-600/10"
				title="Average Occupancy"
				value={`${avgOccupancy.toFixed(2)}`}
			/>
		</div>
	);
}
