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

export async function updateOrderStatus(
	orderId: string,
	payload: { status: string; notes?: string },
) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@patch/api/hotels/rentals/orders/:orderId/status",
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

export async function getRentalOrders(
	startDate: string,
	endDate: string,
	page = 0,
	size = 200,
) {
	try {
		const session = await verifySession();
		const response = await $fetch("@get/api/hotels/rentals/orders", {
			query: {
				startDate,
				endDate,
				page,
				size,
			},
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getCheckedInBookingsForRentals() {
	try {
		const session = await verifySession();
		const response = await $fetch("@get/api/front-desks/bookings", {
			query: {
				bookingStatus: "CHECKED_IN",
				page: 0,
				size: 200,
			},
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data?.content ?? [] };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function sendToMaintenance(
	itemId: string,
	payload: {
		action: string;
		quantity: number;
		reason?: string;
		notes?: string;
		status?: string;
		resultStatus?: string;
		maintenanceResultStatus?: string;
	},
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

export async function getCustomerRentalDetails(phone: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/customers/details",
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

export async function getRentalItemMaintenanceHistory(itemId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/rentals/items/:itemId/maintenance/history",
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

export async function updateRentalItem(itemId: string, payload: Record<string, unknown>) {
	try {
		const session = await verifySession();
		const response = await $fetch("@put/api/hotels/rentals/items/:itemId", {
			params: { itemId },
			body: payload,
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
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
