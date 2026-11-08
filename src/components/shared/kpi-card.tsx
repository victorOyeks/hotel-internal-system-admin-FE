import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** KPI card (260×80 in the library, fluid here): label, big value, a pill and a hint. */
export function KpiCard({
	label,
	value,
	icon: Icon,
	pill,
	hint,
}: {
	label: string;
	value: ReactNode;
	icon: LucideIcon;
	pill?: ReactNode;
	hint?: ReactNode;
}) {
	return (
		<div className="flex min-w-0 flex-1 flex-col gap-2 rounded-card border border-line bg-card p-[18px]">
			<div className="flex items-center gap-2">
				<p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2">{label}</p>
				<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
					<Icon className="size-[14px]" />
				</span>
			</div>
			<div className="flex items-center gap-2">
				<p className="text-2xl font-bold leading-none text-ink">{value}</p>
				{pill}
			</div>
			{hint && <p className="text-xs text-ink-3">{hint}</p>}
		</div>
	);
}
