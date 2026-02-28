"use client";

import {
	type InventoryResponse,
	type InventoryRestockRequest,
	RestaurantInventoryTable,
} from "./inventory-table";
import type { Pagination } from "@/lib/fetch";

export function RestaurantInventoryPage({
	section,
	inventoryData,
	paginationMeta,
}: {
	section: "restock" | null;
	inventoryData: InventoryResponse[] | InventoryRestockRequest[];
	paginationMeta: Pagination;
}) {
	return (
		<div className="p-4 md:p-6 space-y-2 md:space-y-4">
			<RestaurantInventoryTable
				data={inventoryData}
				section={section}
				paginationMeta={paginationMeta}
			/>
		</div>
	);
}
