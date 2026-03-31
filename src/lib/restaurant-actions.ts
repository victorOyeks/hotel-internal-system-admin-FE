"use server";

import { parseError, type ServerActionResponse } from "./action-utils";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";
import type { HotelRole } from "./types";
import { env } from "@/env";
import type { BulkUploadResult } from "./bulk-upload-types";
import type { ExportData } from "@/components/shared/shared-dialogs";

export async function recordRestaurantPayment({
	orderId,
	amount,
	method,
	reference,
	notes,
}: {
	orderId: string;
	amount: number;
	method: string;
	reference?: string;
	notes?: string;
}): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch(
		"@post/api/restaurants/restaurant-orders/:orderId/payments",
		{
			params: { orderId },
			body: { amount, method, reference, notes },
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to record payment",
		};
	}

	return { success: true, data: "Payment recorded successfully" };
}

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
		query: {
			barItemId: params.barItemId,
			quantity: params.quantity.toString(),
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
		data: response.data as unknown as string,
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
	isPaid?: boolean;
	paymentMethod?:
		| "CASH"
		| "CARD"
		| "CREDIT_CARD"
		| "DEBIT_CARD"
		| "BANK_TRANSFER"
		| "MOBILE_MONEY"
		| "CHEQUE"
		| "ONLINE_PAYMENT"
		| "PAYPAL"
		| "CRYPTOCURRENCY"
		| "DIRECT_DEBIT"
		| "PETTY_CASH"
		| "OTHERS";
	paymentReference?: string;
}

export async function placeOrder(
	payload: OrderRequest,
): ServerActionResponse<{ message: string; orderId?: string }> {
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

	// Extract the order customId from the API response if available
	const orderId =
		// biome-ignore lint/suspicious/noExplicitAny: API response shape not fully typed
		(response.data as any)?.data?.customId as string | undefined;

	return {
		success: true,
		data: { message: "Order placed successfully", orderId },
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
		data: (response.data as unknown as { data: string }).data,
	};
}

export async function addBarItem({
	name,
	price,
}: {
	name: string;
	price: number;
}) {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@post/api/restaurants/bar-item", {
		body: {
			name,
			price,
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

export async function toggleBarItemStock({
	itemId,
	inStock,
}: {
	itemId: string;
	inStock: boolean;
}): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch(
		"@patch/api/restaurants/:id/bar-item/toggle-stock",
		{
			params: { id: itemId },
			query: { inStock: inStock.toString() },
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to update stock status",
		};
	}

	return {
		success: true,
		data: `Item marked as ${inStock ? "in stock" : "out of stock"}`,
	};
}

export async function toggleFoodItemStock({
	itemId,
	inStock,
}: {
	itemId: string;
	inStock: boolean;
}): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch(
		"@patch/api/restaurants/:id/food-item/toggle-stock",
		{
			params: { id: itemId },
			query: { inStock: inStock.toString() },
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to update stock status",
		};
	}

	return {
		success: true,
		data: `Item marked as ${inStock ? "in stock" : "out of stock"}`,
	};
}

export async function updateFoodItem({
	itemId,
	name,
	price,
}: {
	itemId: string;
	name: string;
	price: number;
}): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@put/api/restaurants/:id/food-item", {
		params: { id: itemId },
		body: { name, price },
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to update food item",
		};
	}

	return { success: true, data: "Food item updated successfully" };
}

export async function updateBarItem({
	itemId,
	name,
	price,
}: {
	itemId: string;
	name: string;
	price: number;
}): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@put/api/restaurants/:id/bar-item", {
		params: { id: itemId },
		body: { name, price },
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to update bar item",
		};
	}

	return { success: true, data: "Bar item updated successfully" };
}

export async function deleteFoodItem({
	itemId,
}: { itemId: string }): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@delete/api/restaurants/:id/food-item", {
		params: { id: itemId },
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to delete food item",
		};
	}

	return { success: true, data: "Food item deleted successfully" };
}

export async function deleteBarItem({
	itemId,
}: { itemId: string }): ServerActionResponse<string> {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch("@delete/api/restaurants/:id/bar-item", {
		params: { id: itemId },
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to delete bar item",
		};
	}

	return { success: true, data: "Bar item deleted successfully" };
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

// ==================== ORDER UPDATE ====================

export async function updateKitchenOrder(
	orderId: string,
	payload: { bookingId?: string | null },
) {
	const sessionData = await verifySession("RESTAURANT");
	const response = await $fetch(
		"@put/api/restaurants/restaurant-orders/:orderId",
		{
			params: { orderId },
			body: payload,
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to update order",
		};
	}

	return { success: true, data: response.data.data };
}

// ==================== BOOKINGS ====================

export async function getCheckedInBookingsForRestaurant() {
	try {
		const sessionData = await verifySession("RESTAURANT");
		const response = await $fetch(
			"@get/api/front-desks/bookings/checked-in",
			{
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data ?? [] };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

// ==================== BULK FOOD ITEM UPLOAD ====================

export async function bulkUploadFoodItems(
	formData: FormData,
): ServerActionResponse<BulkUploadResult> {
	const sessionData = await verifySession();

	try {
		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/restaurants/food-items/bulk-upload`,
			{
				method: "POST",
				headers: { Authorization: `Bearer ${sessionData.token}` },
				body: formData,
			},
		);

		const data = await response.json();

		if (!response.ok) {
			return {
				success: false,
				error: data.message || "Bulk upload failed",
			};
		}

		return { success: true, data: data.data };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Bulk upload failed",
		};
	}
}

// ==================== BULK BAR ITEM UPLOAD ====================

export async function bulkUploadBarItems(
	formData: FormData,
): ServerActionResponse<BulkUploadResult> {
	const sessionData = await verifySession();

	try {
		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/restaurants/bar-items/bulk-upload`,
			{
				method: "POST",
				headers: { Authorization: `Bearer ${sessionData.token}` },
				body: formData,
			},
		);

		const data = await response.json();

		if (!response.ok) {
			return {
				success: false,
				error: data.message || "Bulk upload failed",
			};
		}

		return { success: true, data: data.data };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Bulk upload failed",
		};
	}
}

export async function exportRestaurantPayments(filters: {
	format: "CSV" | "PDF" | "EXCEL";
	search?: string;
	startDate?: string;
	endDate?: string;
}): ServerActionResponse<{ base64: string; filename: string }> {
	const sessionData = await verifySession("RESTAURANT");

	try {
		const params = new URLSearchParams({ format: filters.format });
		if (filters.search) params.set("search", filters.search);
		if (filters.startDate) params.set("startDate", filters.startDate);
		if (filters.endDate) params.set("endDate", filters.endDate);

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/restaurants/payments/export?${params}`,
			{
				headers: { Authorization: `Bearer ${sessionData.token}` },
			},
		);

		if (!response.ok) {
			return { success: false, error: "Failed to export restaurant payments" };
		}

		const arrayBuffer = await response.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		const disposition = response.headers.get("content-disposition");
		const filename =
			disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "restaurant-payments-export";

		return { success: true, data: { base64, filename } };
	} catch (e) {
		return {
			success: false,
			error:
				e instanceof Error ? e.message : "Failed to export restaurant payments",
		};
	}
}
