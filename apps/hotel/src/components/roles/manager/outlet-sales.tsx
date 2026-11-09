import { naira, nairaShort } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import type { OutletSalesDayRow } from "@hospio/api/data/types";

/**
 * What the restaurant and bar sold today, by outlet (finance-service `/sales`, from fnb-service's settled
 * orders). This is sales, not money received: it includes what was charged to rooms, which becomes income
 * only when the folio is paid. Income by desk stays on the money cards.
 */
export function OutletSalesCard({
	sales,
	className,
}: {
	sales: OutletSalesDayRow | null | undefined;
	className?: string;
}) {
	return (
		<SectionCard
			title="Restaurant & bar sales today"
			subtitle="What was sold, including what went on rooms · not the same as money received"
			className={className}
			bodyClassName="gap-3 pt-2"
		>
			{!sales || sales.outlets.length === 0 ? (
				<p className="text-[13px] text-ink-3">
					{sales
						? "Nothing sold at the outlets yet today."
						: "Outlet sales could not be read right now."}
				</p>
			) : (
				<>
					<p className="text-[26px] font-bold leading-none text-ink">
						{naira(sales.totals.sales)}
					</p>
					<ul className="divide-y divide-line">
						{sales.outlets.map((o) => (
							<li
								key={o.outletId}
								className="flex items-center gap-3 py-2 text-[13px]"
							>
								<span className="min-w-0 flex-1">
									<span className="block font-semibold text-ink">{o.name}</span>
									<span className="block text-xs text-ink-3">
										{o.orders} orders · {nairaShort(o.paidAtOutlet)} paid at the
										outlet · {nairaShort(o.chargedToRooms)} on rooms
										{o.cancelled ? ` · ${o.cancelled} cancelled` : ""}
									</span>
								</span>
								<span className="font-bold text-ink">{naira(o.sales)}</span>
							</li>
						))}
					</ul>
					{sales.outlets.some((o) => o.topItems.length > 0) && (
						<p className="text-xs text-ink-3">
							Top sellers:{" "}
							{sales.outlets
								.flatMap((o) =>
									o.topItems.slice(0, 2).map((t) => `${t.name} ×${t.qty}`),
								)
								.join(" · ")}
						</p>
					)}
				</>
			)}
		</SectionCard>
	);
}
