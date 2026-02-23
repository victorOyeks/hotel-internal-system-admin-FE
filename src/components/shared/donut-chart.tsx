"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DonutChartProps {
	data: { name: string; value: number; color: string }[];
	title?: string;
	centerLabel?: string;
	centerValue?: string;
	height?: number;
	isCurrency?: boolean;
}

const RADIAN = Math.PI / 180;

export function DonutChart({
	data,
	title,
	centerLabel,
	centerValue,
	height = 280,
	isCurrency = true,
}: DonutChartProps) {
	const total = data.reduce((sum, entry) => sum + entry.value, 0);

	const renderCustomLabel = ({
		cx,
		cy,
	}: {
		cx: number;
		cy: number;
	}) => {
		if (!centerLabel && !centerValue) return null;
		return (
			<g>
				{centerValue && (
					<text
						x={cx}
						y={cy - 8}
						textAnchor="middle"
						dominantBaseline="central"
						className="fill-primary text-lg font-bold"
					>
						{centerValue}
					</text>
				)}
				{centerLabel && (
					<text
						x={cx}
						y={cy + 12}
						textAnchor="middle"
						dominantBaseline="central"
						className="fill-gray-400 text-xs"
					>
						{centerLabel}
					</text>
				)}
			</g>
		);
	};

	return (
		<div className="bg-white p-4 rounded-2xl">
			{title && (
				<h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
			)}
			<ResponsiveContainer width="100%" height={height}>
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={60}
						outerRadius={90}
						paddingAngle={3}
						dataKey="value"
						stroke="none"
					>
						{data.map((entry) => (
							<Cell key={entry.name} fill={entry.color} />
						))}
					</Pie>
					<Tooltip
						formatter={(value: number, name: string) => [
							isCurrency ? formatCurrency(value, "short") : value.toLocaleString(),
							name,
						]}
						contentStyle={{
							backgroundColor: "#fff",
							borderRadius: "8px",
							border: "none",
							boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
							fontSize: "12px",
						}}
					/>
					<Legend
						verticalAlign="bottom"
						height={36}
						content={({ payload }) => (
							<div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
								{payload?.map((entry) => {
									const item = data.find((d) => d.name === entry.value);
									const percentage =
										total > 0 && item
											? ((item.value / total) * 100).toFixed(1)
											: "0";
									return (
										<div
											key={entry.value}
											className="flex items-center gap-1.5 text-xs"
										>
											<div
												className="size-2.5 rounded-full flex-shrink-0"
												style={{ backgroundColor: entry.color }}
											/>
											<span className="text-gray-500">
												{entry.value}{" "}
												<span className="font-medium text-gray-700">
													{percentage}%
												</span>
											</span>
										</div>
									);
								})}
							</div>
						)}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
