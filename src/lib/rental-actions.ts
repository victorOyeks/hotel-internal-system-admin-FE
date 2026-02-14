"use server";

import { verifySession } from "./dal";
import { $fetch } from "./fetch";
import { parseError } from "./action-utils";

export async function getOrderDetails(orderId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/orders/:orderId",
			{
				params: { orderId },
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getOrderPaymentSummary(orderId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/orders/:orderId/payment-summary",
			{
				params: { orderId },
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function createRentalOrder(payload: any) {
	try {
		const session = await verifySession();
		const response = await $fetch("@post/api/hotels/rentals/orders", {
			body: payload,
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function extendRentalOrder(
	orderId: string,
	payload: { newEndTime: string; notes?: string },
) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@post/api/hotels/rentals/orders/:orderId/extend",
			{
				params: { orderId },
				body: payload,
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function recordPayment(payload: any) {
	try {
		const session = await verifySession();
		const response = await $fetch("@post/api/hotels/rentals/payments", {
			body: payload,
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function processReturn(orderId: string, payload: any) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@post/api/hotels/rentals/orders/:orderId/return",
			{
				params: { orderId },
				body: payload,
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getReturnDetails(orderId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/orders/:orderId/return-details",
			{
				params: { orderId },
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getAvailableItems() {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/items/available",
			{
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function sendToMaintenance(
	itemId: string,
	payload: { action: string; quantity: number; reason?: string; notes?: string },
) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@post/api/hotels/rentals/items/:itemId/maintenance",
			{
				params: { itemId },
				body: payload,
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getCustomerHistory(phone: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/customers/history",
			{
				query: { phone },
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getCustomerOutstanding(phone: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/customers/outstanding",
			{
				query: { phone },
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getRentalReports(startDate: string, endDate: string) {
	try {
		const session = await verifySession();
		const response = await $fetch("@get/api/hotels/rentals/reports", {
			query: { startDate, endDate },
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getRentalItemDetails(itemId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/items/:itemId",
			{
				params: { itemId },
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function exportPaymentHistory() {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/payments/history/export",
			{
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}
