"use server";

import type { CreatePurchaseOrderRequest } from "@/lib/fetch";

import type z from "zod";
import type {
	ServerActionResponse,
	ServerActionResponseFromEndpoint,
} from "./action-utils";
import { verifySession } from "./dal";
import { $fetch, type ApiInputInventoryProduct } from "./fetch";

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

export async function issueStockItem({
	itemId,
	...payload
}: {
	itemId: string;
	quantity: number;
	department: string;
	receivingStaff: string;
	remarks?: string | undefined;
}): ServerActionResponse<string> {
	console.log(payload);

	const sessionData = await verifySession();

	const response = await $fetch("@post/api/inventories/items/issue", {
		body: {
			...payload,
		},
		query: {
			itemId,
		},
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Unable to issue stock item",
		};
	}

	return {
		success: true,
		data: (response.data as { message: string }).message,
	};
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

		console.log("response", response);

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
