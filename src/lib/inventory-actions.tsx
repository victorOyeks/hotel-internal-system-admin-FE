/** biome-ignore-all lint/suspicious/noExplicitAny: explanation> */
"use server";

import type { CreatePurchaseOrderRequest, CreateStockAdjustmentRequest } from "@/lib/fetch";
import { revalidatePath } from "next/cache";

import type z from "zod";
import type {
	ServerActionResponseFromEndpoint,
} from "./action-utils";
import { verifySession } from "./dal";
import { $fetch, type ApiInputInventoryProduct } from "./fetch";
import type { ExportData } from "@/components/shared/shared-dialogs";
import { getCookieData } from "./server-fns";

export async function addToInventory(payload: {
	name: string;
	category: string;
	quantity: number;
	unit?: string | undefined;
}) {
	const sessionData = await verifySession();

	const response = await $fetch("@post/api/inventories/items", {
		body: {
			...payload,
			itemId: crypto.randomUUID(),
		},
		auth: { type: "Bearer", token: sessionData.token },
		throw: true,
	});

	return response.data;
}

export async function issueStockItem(
	payload: z.infer<any>,
): ServerActionResponseFromEndpoint<"@post/api/inventories/stock/issue"> {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@post/api/inventories/stock/issue", {
			body: payload,
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to issue stock",
		};
	}
}

export async function addProduct(
	payload: z.infer<typeof ApiInputInventoryProduct>,
): ServerActionResponseFromEndpoint<"@post/api/inventories/products"> {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@post/api/inventories/products", {
			body: {
				...payload,
				itemId: crypto.randomUUID(),
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to add product",
		};
	}
}

export async function editProduct(
	productId: string,
	payload: z.infer<typeof ApiInputInventoryProduct>,
): ServerActionResponseFromEndpoint<"@put/api/inventories/products/:productId"> {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@put/api/inventories/products/:productId",
			{
				params: { productId },
				body: payload,
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to edit product",
		};
	}
}

export async function deleteProduct(params: {
	productId: string;
}): ServerActionResponseFromEndpoint<"@delete/api/inventories/products/:productId"> {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@delete/api/inventories/products/:productId",
			{
				params,
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to delete product",
		};
	}
}

export async function addGRNItem(payload: unknown) {
	try {
		const sessionData = await verifySession();

		const response = await $fetch("@post/api/inventories/grn", {
			auth: { type: "Bearer", token: sessionData.token },
			body: payload,
			throw: true,
		});

		return {
			success: true,
			data: (response as { message: string }).message,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to add GRN",
		};
	}
}

export async function addSupplier(payload: {
	name: string;
	email: string;
	phone: string;
	productIds: string[];
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@post/api/inventories/suppliers", {
			body: payload,
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to add supplier",
		};
	}
}

export async function editSupplier(
	supplierId: string,
	payload: {
		name: string;
		email: string;
		phone: string;
		productIds: string[];
	},
) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@put/api/inventories/suppliers/:supplierId", {
			body: payload,
			params: { supplierId },
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to edit supplier",
		};
	}
}

export async function deleteSupplier(supplierId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@delete/api/inventories/suppliers/:supplierId",
			{
				params: { supplierId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to delete supplier",
		};
	}
}

export async function postGRNToStock(grnId: string) {
	try {
		const sessionData = await verifySession();

		const response = await $fetch(
			"@post/api/inventories/grn/:grnId/post-to-stock",
			{
				params: { grnId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to post GRN to stock",
		};
	}
}

export async function addStockTake(payload: {
	locationId: string;
	stockTakeType: string;
	scheduledDate: string;
	supervisorId?: string;
	supervisorName: string;
	countedBy: string;
	acceptableVariancePercent: number;
	stockFrozen: boolean;
	productIds: string[];
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@post/api/inventories/stock-takes", {
			body: payload,
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to add stock take",
		};
	}
}

export async function addPurchaseOrder(payload: CreatePurchaseOrderRequest) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@post/api/inventories/purchase-orders", {
			body: payload,
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to create purchase order",
		};
	}
}

export async function editGRN(
	grnId: string,
	payload: z.infer<typeof import("./fetch").UpdateGRNRequest>,
) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@put/api/inventories/grn/:grnId", {
			body: payload,
			params: { grnId },
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to edit GRN",
		};
	}
}

export async function deleteGRN(grnId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@delete/api/inventories/grn/:grnId",
			{
				params: { grnId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to delete GRN",
		};
	}
}

export async function getProductMovementHistory(productId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-movements/product/:productId/history",
			{
				params: { productId },
				query: {
					sort: "movementDate,desc",
					size: 20,
				},
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to fetch product movement history",
		};
	}
}

export async function getLocationMovementHistory(locationId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-movements/location/:locationId/history",
			{
				params: { locationId },
				query: {
					sort: "movementDate,desc",
					size: 20,
				},
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to fetch location movement history",
		};
	}
}

export async function exportStockMovements(filters: {
	format?: "EXCEL" | "CSV" | "PDF";
	productId?: string;
	locationId?: string;
	movementType?: string;
	startDate?: string;
	endDate?: string;
	search?: string;
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-movements/export",
			{
				query: {
					...filters,
					format: filters.format || "CSV",
				},
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to export stock movements",
		};
	}
}

export async function exportStockLevels(filters: {
	format?: "EXCEL" | "CSV" | "PDF";
	locationId?: string;
	productId?: string;
	category?: string;
	search?: string;
	lowStock?: boolean;
	outOfStock?: boolean;
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/stock-levels/export", {
			query: {
				...filters,
				format: filters.format || "CSV",
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to export stock levels",
		};
	}
}

export async function exportStockTakes(filters: {
	format?: "EXCEL" | "CSV" | "PDF";
	status?: string;
	locationId?: string;
	startDate?: string;
	endDate?: string;
	hasVariances?: boolean;
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/stock-takes/export", {
			query: {
				...filters,
				format: filters.format || "CSV",
				hasVariances: filters.hasVariances ? "true" : undefined,
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to export stock takes",
		};
	}
}

export async function exportStockAdjustments(filters: {
	format?: "EXCEL" | "CSV" | "PDF";
	productId?: string;
	locationId?: string;
	reason?: string;
	adjustmentType?: string;
	startDate?: string;
	endDate?: string;
	posted?: boolean;
	approved?: boolean;
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/adjustments/export", {
			query: {
				...filters,
				format: filters.format || "CSV",
				posted: filters.posted ? "true" : undefined,
				approved: filters.approved ? "true" : undefined,
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to export stock adjustments",
		};
	}
}

export async function editStorageLocation(
	locationId: string,
	payload: Partial<import("./fetch").CreateStorageLocationRequest>,
) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@put/api/inventories/locations/:id", {
			body: payload,
			params: { id: locationId },
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to edit location",
		};
	}
}

export async function exportGRNs(
	filters: {
		search?: string;
		status?: "DRAFT" | "ACCEPTED";
		posted?: "posted" | "unposted";
		supplierId?: string;
		startDate?: string;
		endDate?: string;
	},
	exportData: ExportData,
) {
	const sessionData = (await getCookieData())!;
	const {
		search,
		status,
		posted: postedFilter,
		supplierId,
		startDate,
		endDate,
	} = filters;

	const posted =
		postedFilter === "posted"
			? "true"
			: postedFilter === "unposted"
				? "false"
				: undefined;

	try {
		const response = await $fetch("@get/api/inventories/grn/export", {
			query: {
				format: exportData.export_type,
				search: search || undefined,
				status: status || undefined,
				supplierId: supplierId || undefined,
				startDate: startDate || undefined,
				endDate: endDate || undefined,
				stockPosted: posted,
				// Not supporting hasRejectedItems derived filter yet
			},
			auth: {
				type: "Bearer",
				token: sessionData.token,
			},
		});

		if (!response.data) {
			return { success: false, error: "No data returned" };
		}

		return {
			success: true,
			data: response.data, // Should be Blob/File but type is ApiResponseObject in fetch.ts (mocked/generic)
		};
	} catch (error) {
		console.error("Export failed:", error);
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: "Failed to export data" };
	}
}
export async function getStockAdjustments(
	params: {
		page?: number;
		size?: number;
		search?: string;
		status?: string;
		type?: string;
		productId?: string;
		locationId?: string;
		startDate?: string;
		endDate?: string;
	} = {},
) {
	const sessionData = await verifySession();

	const query: Record<string, any> = {
		page: (params.page || 0).toString(),
		size: (params.size || 20).toString(),
	};

	if (params.status && params.status !== "all") {
		if (params.status === "APPROVED") {
			query.approved = "true";
			query.posted = "false";
		} else if (params.status === "POSTED") {
			query.posted = "true";
		} else if (params.status === "PENDING_APPROVAL") {
			query.approved = "false";
			query.posted = "false";
		}
	}

	if (params.type && params.type !== "all") query.adjustmentType = params.type;
	if (params.productId) query.productId = params.productId;
	if (params.locationId) query.locationId = params.locationId;
	if (params.startDate) query.startDate = params.startDate;
	if (params.endDate) query.endDate = params.endDate;

	try {
		const response = await $fetch("@get/api/inventories/adjustments", {
			query: { ...query, pageable: "true" },
			auth: { type: "Bearer", token: sessionData.token },
		});

		if (!response.data) {
			return { success: false, error: "No data returned" };
		}

		return {
			success: true,
			data: response.data.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to fetch adjustments",
		};
	}
}

export async function getStorageLocations(search?: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/locations/list", {
			query: { search },
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to fetch locations",
		};
	}
}


export async function exportProducts(filters: {
	format?: "EXCEL" | "CSV" | "PDF";
	status?: string;
	category?: string;
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/products/export", {
			query: {
				...filters,
				format: filters.format || "CSV",
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to export products",
		};
	}

}

export async function exportSuppliers(filters: {
	format?: "EXCEL" | "CSV" | "PDF";
	search?: string;
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/suppliers/export", {
			query: {
				...filters,
				format: filters.format || "CSV",
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to export suppliers",
		};
	}
}

export async function createStockAdjustment(payload: CreateStockAdjustmentRequest) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@post/api/inventories/adjustments", {
			body: payload,
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to create stock adjustment",
		};
	}
}

export async function getProducts(search?: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/products/list", {
			query: { search },
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to fetch products",
		};
	}
}

export async function approveStockAdjustment(adjustmentId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@post/api/inventories/adjustments/:adjustmentId/approve",
			{
				params: { adjustmentId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		revalidatePath("/inventory/adjustments");
		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to approve stock adjustment",
		};
	}
}

export async function postStockAdjustment(adjustmentId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@post/api/inventories/adjustments/:adjustmentId/post",
			{
				params: { adjustmentId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		revalidatePath("/inventory/adjustments");
		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to post stock adjustment",
		};
	}
}

export async function getStockLevels(filters: {
	locationId?: string;
	productId?: string;
	category?: string;
	search?: string;
	lowStock?: boolean;
	outOfStock?: boolean;
	page?: number;
	size?: number;
}) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@get/api/inventories/stock-levels", {
			query: {
				...filters,
				page: filters.page || 0,
				size: filters.size || 20,
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to fetch stock levels",
		};
	}
}

export async function getStockLevelsByLocation(locationId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-levels/by-location/:locationId",
			{
				params: { locationId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to fetch stock levels by location",
		};
	}
}

export async function getStockLevelsByProduct(productId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-levels/by-product/:productId",
			{
				params: { productId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to fetch stock levels by product",
		};
	}
}

export async function getLowStockItems() {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-levels/low-stock",
			{
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to fetch low stock items",
		};
	}
}

export async function getOutOfStockItems() {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-levels/out-of-stock",
			{
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to fetch out of stock items",
		};
	}
}

export async function getStockLevelStatistics() {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-levels/statistics",
			{
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to fetch stock level statistics",
		};
	}
}

export async function getStockLevel(stockLevelId: string) {
	const sessionData = await verifySession();

	try {
		const response = await $fetch(
			"@get/api/inventories/stock-levels/:stockLevelId",
			{
				params: { stockLevelId },
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);

		return {
			success: true,
			data: response.data,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unable to fetch stock level",
		};
	}
}
