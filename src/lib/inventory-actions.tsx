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
