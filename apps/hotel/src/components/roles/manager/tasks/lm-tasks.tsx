"use client";

import { useQueryState } from "nuqs";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import type {
	LaundryPriceRow,
	MaintAssetRow,
	MaintScheduleRow,
	StockItemRow,
	WorkOrderRow,
} from "@hospio/api/data/types";
import { LaundryPricesScreen } from "../../laundry/prices";
import { PreventiveScreen } from "../../maintenance/preventive";
import { type Person, WorkOrdersScreen } from "../../maintenance/work-orders";

/** Manager · Tasks & maintenance: work orders, preventive schedules and assets, and the laundry price list. */
export function ManagerTasks({
	rows,
	me,
	technicians,
	rooms,
	parts,
	schedules,
	assets,
	prices,
	hotelName,
	canEdit,
}: {
	rows: WorkOrderRow[];
	me: Person;
	technicians: Person[];
	rooms: { id: string; number: string }[];
	parts: StockItemRow[];
	schedules: MaintScheduleRow[];
	assets: MaintAssetRow[];
	prices: LaundryPriceRow[];
	hotelName: string;
	/** Not a read-only (support) view. */
	canEdit: boolean;
}) {
	const [view, setView] = useQueryState("view");
	const v = view === "preventive" || view === "laundry" ? view : "work";
	return (
		<>
			<PillTabs
				param="view"
				tabs={[
					{
						key: "work",
						label: "Work orders",
						count: rows.filter(
							(r) => r.status !== "DONE" && r.status !== "CANCELLED",
						).length,
					},
					{ key: "preventive", label: "Preventive", count: schedules.length },
					{ key: "laundry", label: "Laundry prices", count: prices.length },
				]}
				value={v}
				onChange={(k) => void setView(k === "work" ? null : k)}
			/>
			{v === "work" && (
				<WorkOrdersScreen
					rows={rows}
					mode="manager"
					me={me}
					supervisor={canEdit}
					technicians={technicians}
					rooms={rooms}
					parts={parts}
					title="Tasks & maintenance"
					subtitle={`${hotelName} · ${rows.filter((r) => r.status !== "DONE" && r.status !== "CANCELLED").length} open · ${rows.filter((r) => r.overdue).length} overdue`}
				/>
			)}
			{v === "preventive" && (
				<PreventiveScreen
					schedules={schedules}
					assets={assets}
					rooms={rooms}
					technicians={technicians}
					canEdit={canEdit}
					canRunNow={canEdit}
				/>
			)}
			{v === "laundry" && (
				<LaundryPricesScreen prices={prices} canEdit={canEdit} />
			)}
		</>
	);
}
