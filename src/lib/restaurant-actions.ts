"use server";

import type { ServerActionResponse } from "./action-utils";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";
import type { HotelRole } from "./types";

export async function updateOrderStatus(params: {
	orderId: string;
	status: "PENDING" | "COMPLETED" | "CANCELLED";
}): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch(
		"@patch/api/restaurants/restaurant-orders/:orderId/status",
		{
			params: {
				orderId: params.orderId,
			},
			body: {
				status: params.status,
			},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to update order status",
		};
	}

	return {
		success: true,
		data: `Order successfully marked as ${params.status.toLowerCase()}`,
	};
}

export async function restockRequest(params: {
	barItemId: string;
	quantity: number;
}): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@post/api/restaurants/bar-restock-request", {
		body: {
			barItemId: params.barItemId,
			quantity: params.quantity,
		},
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to create restock request",
		};
	}

	return {
		success: true,
		data: response.data as string,
	};
}

export interface OrderRequest {
	destinationId: string;
	orderItems: {
		itemType: "FOOD" | "DRINK";
		itemId: string;
		quantity: number;
		rate?: number;
		note?: string;
	}[];
	bookingId?: string;
	note?: string;
}

export async function placeOrder(
	payload: OrderRequest,
): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@post/api/restaurants/restaurant-orders", {
		body: payload,
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to place order",
		};
	}

	return {
		success: true,
		data: "Order placed successfully",
	};
}

export async function addFoodItem({
	name,
	price,
}: {
	name: string;
	price: number;
}) {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@post/api/restaurants/food-item", {
		body: {
			name,
			price,
		},
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to add food item",
		};
	}

	return {
		success: true,
		data: (response.data as { data: string }).data,
	};
}

export async function addBarItem({
	name,
	price,
	quantity,
}: {
	name: string;
	price: number;
	quantity: number;
}) {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@post/api/restaurants/bar-item", {
		body: {
			name,
			price,
			quantity,
		},
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to add bar item",
		};
	}

	return {
		success: true,
		data: "Bar item added successfully",
	};
}

export async function deleteStockItem({ itemId }: { itemId: string }) {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@delete/api/restaurants/:id/stock", {
		params: {
			id: itemId,
		},
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to delete stock item",
		};
	}

	return {
		success: true,
		data: "Stock item deleted successfully",
	};
}

export async function updateStockItem({
	/*
    {
  "name": "string",
  "quantity": 0,
  "unit": "string",
  "note": "string",
  "department": "BAR",
  "dateTimeReceived": "2025-11-03T19:37:47.730Z"
} */

	itemId,
	name,
	quantity,
	unit,
	note,
	department,
	dateTimeReceived,
}: {
	itemId: string;
	name?: string;
	quantity?: number;
	unit?: string;
	note?: string;
	department?: Omit<
		HotelRole,
		"FRONT_DESK" | "HOUSEKEEPING" | "MAINTENANCE" | "HOTEL_OWNER" | "MANAGER"
	>;
	dateTimeReceived?: string;
}) {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@put/api/restaurants/:id/stock", {
		params: {
			id: itemId,
		},
		body: {
			name,
			quantity,
			unit,
			note,
			department,
			dateTimeReceived,
		},
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to update stock item",
		};
	}

	return {
		success: true,
		data: "Stock item updated successfully",
	};
}

export async function createDestination({ name }: { name: string }) {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@post/api/restaurants/destinations", {
		body: { name },
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to create destination",
		};
	}

	return {
		success: true,
		data: response.data.data,
	};
}
