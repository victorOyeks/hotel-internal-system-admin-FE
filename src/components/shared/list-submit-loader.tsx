"use client";

type Props = {
	current: number;
	total: number;
	label?: string;
};

export function ListSubmitLoader({ current, total, label = "item" }: Props) {
	const percent = total > 0 ? Math.round((current / total) * 100) : 0;
	const circumference = 2 * Math.PI * 40;
	const strokeDashoffset = circumference - (percent / 100) * circumference;

	return (
		<div className="flex flex-col items-center justify-center gap-8 py-10">
			{/* Progress ring with percentage */}
			<div className="relative size-24">
				<svg
					className="absolute inset-0 size-24 -rotate-90"
					viewBox="0 0 96 96"
					fill="none"
				>
					<circle
						cx="48"
						cy="48"
						r="40"
						stroke="currentColor"
						strokeWidth="5"
						className="text-muted-foreground/10"
					/>
					<circle
						cx="48"
						cy="48"
						r="40"
						stroke="currentColor"
						strokeWidth="5"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						className="text-primary transition-all duration-300"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<p className="text-sm font-bold text-foreground">{percent}%</p>
				</div>
			</div>

			{/* Label + counter */}
			<div className="text-center space-y-1">
				<p className="font-semibold text-foreground">
					Creating {label}s...
				</p>
				<p className="text-xs text-muted-foreground">
					{current} of {total} done
				</p>
			</div>

			{/* Thin progress bar */}
			<div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-primary rounded-full transition-all duration-300"
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}
