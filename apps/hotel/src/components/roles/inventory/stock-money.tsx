import { PackageIcon } from "lucide-react";
import { naira } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import type { StockUsage, StockValue } from "@hospio/api/data/types";

/** Stock value and last-30-days stock used, read-only, for finance (GET /inventory/value and /usage). */
export function StockMoney({
	value,
	usage,
}: {
	value: StockValue | null;
	usage: StockUsage | null;
}) {
	if (!value) return null;
	return (
		<SectionCard title="Stock" flush>
			<div className="grid grid-cols-2 gap-4 px-5 py-4 md:grid-cols-4">
				<Figure
					label="Stock value"
					value={naira(value.total)}
					hint={value.stores
						.map((s) => `${s.name} ${naira(s.value)}`)
						.join(" · ")}
				/>
				<Figure
					label="Still on order"
					value={naira(value.onOrder)}
					hint="Sent to suppliers, not yet received"
				/>
				<Figure
					label="Used (30 days)"
					value={naira(usage?.totals.used ?? 0)}
					hint={`Wasted ${naira(usage?.totals.wasted ?? 0)}`}
				/>
				<Figure
					label="Received (30 days)"
					value={naira(usage?.totals.received ?? 0)}
					hint={`Count differences ${naira(usage?.totals.counted ?? 0)}`}
				/>
			</div>
		</SectionCard>
	);
}

function Figure({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
				<PackageIcon className="size-3.5" /> {label}
			</span>
			<span className="text-xl font-bold text-ink">{value}</span>
			{hint && <span className="text-xs text-ink-3">{hint}</span>}
		</div>
	);
}
