"use server";

import { verifySession } from "./dal";
import { $fetch } from "./fetch";
import { parseError } from "./action-utils";
import type { ServerActionResponse } from "./action-utils";
import { env } from "@/env";
import type { BulkUploadResult } from "./bulk-upload-types";

// ─── Dashboard ───────────────────────────────────────────────

export async function getLaundryDashboardStats() {
	try {
		const session = await verifySession();
		const response = await $fetch("@get/api/hotels/laundry/dashboard/stats", {
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

// ─── Laundry Items ───────────────────────────────────────────

export async function getLaundryItems(activeOnly?: boolean | string) {
	try {
		const session = await verifySession();
		const response = await $fetch("@get/api/hotels/laundry/items", {
			query: (activeOnly != null
				? { activeOnly: String(activeOnly) }
				: undefined) as { activeOnly?: string },
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getLaundryItemsByCategory(category: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/laundry/items/category/:category",
			{
				params: { category },
				auth: { type: "Bearer", token: session.token },
				throw: true,
			},
		);
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getLaundryItemDetails(itemId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch("@get/api/hotels/laundry/items/:itemId", {
			params: { itemId },
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function createLaundryItem(payload: any) {
	try {
		const session = await verifySession();
		const response = await $fetch("@post/api/hotels/laundry/items", {
			body: payload,
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function updateLaundryItem(itemId: string, payload: any) {
	try {
		const session = await verifySession();
		const response = await $fetch("@put/api/hotels/laundry/items/:itemId", {
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

export async function deactivateLaundryItem(itemId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch("@delete/api/hotels/laundry/items/:itemId", {
			params: { itemId },
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

// ─── Laundry Orders ──────────────────────────────────────────

export async function createLaundryOrder(payload: any) {
	try {
		const session = await verifySession();
		const response = await $fetch("@post/api/hotels/laundry/orders", {
			body: payload,
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getLaundryOrderDetails(orderId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch("@get/api/hotels/laundry/orders/:orderId", {
			params: { orderId },
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function updateLaundryOrderStatus(
	orderId: string,
	payload: { status: string; notes?: string; staffId?: string },
) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@patch/api/hotels/laundry/orders/:orderId/status",
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

// ─── Payments ────────────────────────────────────────────────

export async function recordLaundryPayment(payload: any) {
	try {
		const session = await verifySession();
		const response = await $fetch("@post/api/hotels/laundry/payments", {
			body: payload,
			auth: { type: "Bearer", token: session.token },
			throw: true,
		});
		return { success: true as const, data: response.data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getLaundryOrderPayments(orderId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/laundry/orders/:orderId/payments",
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

export async function getLaundryPaymentSummary(orderId: string) {
	try {
		const session = await verifySession();
		const response = await $fetch(
			"@get/api/hotels/laundry/orders/:orderId/payment-summary",
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

// ==================== BULK LAUNDRY ITEM UPLOAD ====================

export async function bulkUploadLaundryItems(
	formData: FormData,
): ServerActionResponse<BulkUploadResult> {
	const sessionData = await verifySession();

	try {
		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/hotels/laundry/items/bulk-upload`,
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
