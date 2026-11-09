import { ShirtIcon, WrenchIcon } from "lucide-react";
import { naira } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import type {
	LaundryMoney,
	MaintenanceMoney,
	StockUsage,
} from "@hospio/api/data/types";

/**
 * Laundry & maintenance money for the last 30 days (finance's Today's money, the manager's and owner's Financials):
 * laundry income, laundry stock used (the Laundry store's used and wasted), maintenance parts and vendor cost.
 */
export function LaundryMaintenanceMoney({
	laundry,
	maintenance,
	usage,
}: {
	laundry: LaundryMoney | null;
	maintenance: MaintenanceMoney | null;
	usage: StockUsage | null;
}) {
	if (!laundry && !maintenance) return null;
	const laundryStore = usage?.stores.filter((s) => s.kind === "LAUNDRY") ?? [];
	const laundryStock = laundryStore.reduce((s, x) => s + x.used + x.wasted, 0);
	return (
		<SectionCard title="Laundry & maintenance · last 30 days" flush>
			<div className="grid grid-cols-2 gap-4 px-5 py-4 md:grid-cols-4">
				{laundry && (
					<>
						<Figure
							icon={ShirtIcon}
							label="Laundry income"
							value={naira(laundry.income)}
							hint={`On guests' bills ${naira(laundry.charged)} · paid ${naira(laundry.paid)} · ${laundry.orders} orders`}
						/>
						<Figure
							icon={ShirtIcon}
							label="Laundry stock used"
							value={naira(laundryStock)}
							hint={`Linen written off ${naira(laundry.condemnedValue + laundry.lostValue)}`}
						/>
					</>
				)}
				{maintenance && (
					<>
						<Figure
							icon={WrenchIcon}
							label="Maintenance cost"
							value={naira(maintenance.totalCost)}
							hint={`Parts ${naira(maintenance.partsCost)} · vendors ${naira(maintenance.vendorCost)}`}
						/>
						<Figure
							icon={WrenchIcon}
							label="Work orders done"
							value={String(maintenance.done)}
							hint={`${maintenance.open} open · ${maintenance.overdue} overdue`}
						/>
					</>
				)}
			</div>
		</SectionCard>
	);
}

function Figure({
	icon: Icon,
	label,
	value,
	hint,
}: {
	icon: typeof ShirtIcon;
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
				<Icon className="size-3.5" /> {label}
			</span>
			<span className="text-xl font-bold text-ink">{value}</span>
			{hint && <span className="text-xs text-ink-3">{hint}</span>}
		</div>
	);
}
