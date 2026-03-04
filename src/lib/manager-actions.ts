"use server";
import { cookies } from "next/headers";
import { getManagerCurrentHotel, verifySession } from "./dal";
import { env } from "@/env";
import {
	$fetch,
	Role,
	type OnboardStaffRequest,
	type CreateRoomRequest,
} from "./fetch";
import type { z } from "zod";
import type {
	ServerActionResponse,
	ServerActionResponseFromEndpoint,
} from "./action-utils";

const isManager = (roles: string[]) => roles.includes("MANAGER");

async function getManagerContext() {
	const sessionData = await verifySession();
	const currentHotel = await getManagerCurrentHotel();
	if (!currentHotel) {
		throw new Error("No hotel found for the manager");
	}
	return { sessionData, hotelId: currentHotel.id };
}

export async function switchManagerCurrentHotel(
	hotelId: string,
): ServerActionResponse<{ message: string }> {
	const sessionData = await verifySession();

	if (!isManager(sessionData.roles)) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}

	const jar = await cookies();

	jar.set(`${sessionData.userId}:currentHotel`, hotelId, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
	});

	return {
		success: true,
		data: { message: "Switched hotel successfully" },
	};
}

export async function addNewRoomToHotel(
	payload: Omit<CreateRoomRequest, "hotelId">,
): ServerActionResponseFromEndpoint<"@post/api/managers/hotels/:hotelId/rooms"> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}
	const currentHotel = await getManagerCurrentHotel();

	if (!currentHotel) {
		return {
			success: false,
			error: "No hotel found for the manager",
		};
	}

	const data = await $fetch("@post/api/managers/hotels/:hotelId/rooms", {
		params: { hotelId: currentHotel.id },
		auth: { type: "Bearer", token: sessionData.token },
		body: {
			...payload,
			hotelId: currentHotel.id,
		},
	});

	if (data.error) {
		return {
			success: false,
			error: data.error.message || "Failed to add room",
		};
	}

	return {
		success: true,
		data: data.data,
	};
}

export async function updateRoom(
	roomId: string,
	payload: {
		roomIdentifier: string;
		roomType: string;
		roomPrice: number;
		roomStatus: string;
		roomFacility: string[];
	},
): ServerActionResponseFromEndpoint<"@put/api/managers/hotels/rooms/:roomCustomId"> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return { success: false, error: "Unauthorized" };
	}

	const data = await $fetch("@put/api/managers/hotels/rooms/:roomCustomId", {
		params: { roomCustomId: roomId },
		auth: { type: "Bearer", token: sessionData.token },
		body: payload,
	});

	if (data.error) {
		return { success: false, error: data.error.message || "Failed to update room" };
	}

	return { success: true, data: data.data };
}

export async function toggleRoomActive(
	roomId: string,
	reason?: string,
): ServerActionResponse<{ message: string }> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return { success: false, error: "Unauthorized" };
	}

	try {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${sessionData.token}`,
		};
		let body: string | undefined;
		if (reason) {
			headers["Content-Type"] = "application/json";
			body = JSON.stringify({ reason });
		}

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/managers/hotels/rooms/${roomId}/toggle-active`,
			{
				method: "PATCH",
				headers,
				body,
			},
		);

		const data = await response.json();
		if (!response.ok) {
			return { success: false, error: data.message || "Failed to toggle room status" };
		}

		return { success: true, data: { message: data.message } };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Failed to toggle room status",
		};
	}
}

export async function onboardStaffToHotel(
	payload: OnboardStaffRequest,
): ServerActionResponseFromEndpoint<"@post/api/managers/hotels/:hotelId/onboard-staff"> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}
	const currentHotel = await getManagerCurrentHotel();

	if (!currentHotel) {
		throw new Error("No hotel found for the manager");
	}

	const { data, error } = await $fetch(
		"@post/api/managers/hotels/:hotelId/onboard-staff",
		{
			params: { hotelId: currentHotel.id },
			auth: { type: "Bearer", token: sessionData.token },
			body: payload,
		},
	);

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to onboard staff",
		};
	}

	return {
		success: true,
		data: data,
	};
}

export async function editStaffDetails(
	staffId: string,
	payload: {
		fullName?: string;
		email?: string;
		phoneNumber?: string;
		staffId?: string;
		roles?: z.infer<typeof Role>[];
	},
): ServerActionResponseFromEndpoint<"@put/api/managers/:hotelId/:staffId"> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}
	const currentHotel = await getManagerCurrentHotel();

	if (!currentHotel) {
		return {
			success: false,
			error: "No hotel found for the manager",
		};
	}

	const data = await $fetch("@put/api/managers/:hotelId/:staffId", {
		params: { hotelId: currentHotel.id, staffId },
		auth: { type: "Bearer", token: sessionData.token },
		body: payload,
	});

	if (data.error) {
		return {
			success: false,
			error: data.error.message || "Failed to edit staff details",
		};
	}

	return {
		success: true,
		data: data.data,
	};
}

export async function resetPasswordForStaff(
	staffId: string,
	payload: {
		newPassword: string;
		confirmPassword: string;
	},
): ServerActionResponseFromEndpoint<"@patch/api/managers/:hotelId/:staffId/reset-password"> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}
	const currentHotel = await getManagerCurrentHotel();

	if (!currentHotel) {
		return {
			success: false,
			error: "No hotel found for the manager",
		};
	}

	const { data, error } = await $fetch(
		"@patch/api/managers/:hotelId/:staffId/reset-password",
		{
			params: { hotelId: currentHotel.id, staffId },
			auth: { type: "Bearer", token: sessionData.token },
			body: payload,
		},
	);

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to reset password",
		};
	}

	return {
		success: true,
		data,
	};
}

export async function suspendStaffAccount(
	staffId: string,
	payload: {
		reason: string;
		fromDate: string; // yyyy-mm-dd
		toDate: string; // yyyy-mm-dd
	},
): ServerActionResponseFromEndpoint<"@patch/api/managers/:hotelId/:staffId/suspend"> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}
	const currentHotel = await getManagerCurrentHotel();

	if (!currentHotel) {
		return {
			success: false,
			error: "No hotel found for the manager",
		};
	}

	const { data, error } = await $fetch(
		"@patch/api/managers/:hotelId/:staffId/suspend",
		{
			params: { hotelId: currentHotel.id, staffId },
			auth: { type: "Bearer", token: sessionData.token },
			body: payload,
		},
	);

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to suspend staff account",
		};
	}

	return {
		success: true,
		data,
	};
}

// ==================== BULK ROOM UPLOAD ====================

export async function bulkUploadRooms(
	formData: FormData,
): ServerActionResponse<{
	summary: {
		totalRows: number;
		successCount: number;
		failedCount: number;
		processingTimeMs: number;
		fileName: string;
		uploadedBy: string;
		uploadedAt: string;
	};
	results: Array<{
		rowNumber: number;
		success: boolean;
		roomIdentifier: string | null;
		errorMessage: string | null;
	}>;
}> {
	const sessionData = await verifySession();
	if (!isManager(sessionData.roles)) {
		return { success: false, error: "Unauthorized" };
	}
	const currentHotel = await getManagerCurrentHotel();
	if (!currentHotel) {
		return { success: false, error: "No hotel found for the manager" };
	}

	try {
		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/managers/hotels/${currentHotel.id}/rooms/bulk-upload`,
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

// ==================== APPROVAL ACTIONS ====================

export async function approveRequest(
	id: string,
	comments?: string,
): ServerActionResponse<{ message: string }> {
	const { sessionData, hotelId } = await getManagerContext();

	const { error } = await $fetch("@post/api/manager/approvals/:id/approve", {
		params: { id },
		query: { hotelId },
		auth: { type: "Bearer", token: sessionData.token },
		body: comments ? { comments } : {},
	});

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to approve request",
		};
	}

	return { success: true, data: { message: "Request approved successfully" } };
}

export async function rejectRequest(
	id: string,
	comments: string,
): ServerActionResponse<{ message: string }> {
	const { sessionData, hotelId } = await getManagerContext();

	const { error } = await $fetch("@post/api/manager/approvals/:id/reject", {
		params: { id },
		query: { hotelId },
		auth: { type: "Bearer", token: sessionData.token },
		body: { comments },
	});

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to reject request",
		};
	}

	return { success: true, data: { message: "Request rejected successfully" } };
}

// ==================== OPERATIONS DATA FETCHING ====================

export async function getOperationsRestaurantSummary() {
	const { sessionData, hotelId } = await getManagerContext();
	const { data, error } = await $fetch(
		"@get/api/managers/:hotelId/restaurant/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error) return { success: false as const, error: error.message || "Failed to fetch restaurant summary" };
	return { success: true as const, data: data.data };
}

export async function getOperationsBarSummary() {
	const { sessionData, hotelId } = await getManagerContext();
	const { data, error } = await $fetch(
		"@get/api/managers/:hotelId/bar/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error) return { success: false as const, error: error.message || "Failed to fetch bar summary" };
	return { success: true as const, data: data.data };
}

export async function getOperationsLaundrySummary() {
	const { sessionData, hotelId } = await getManagerContext();
	const { data, error } = await $fetch(
		"@get/api/managers/:hotelId/laundry/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error) return { success: false as const, error: error.message || "Failed to fetch laundry summary" };
	return { success: true as const, data: data.data };
}

export async function getOperationsRentalsSummary() {
	const { sessionData, hotelId } = await getManagerContext();
	const { data, error } = await $fetch(
		"@get/api/managers/:hotelId/rentals/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error) return { success: false as const, error: error.message || "Failed to fetch rentals summary" };
	return { success: true as const, data: data.data };
}

export async function getOperationsAccommodationSummary() {
	const { sessionData, hotelId } = await getManagerContext();
	const { data, error } = await $fetch(
		"@get/api/managers/:hotelId/accommodation/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error) return { success: false as const, error: error.message || "Failed to fetch accommodation summary" };
	return { success: true as const, data: data.data };
}

export async function getOperationsInventorySummary() {
	const { sessionData, hotelId } = await getManagerContext();
	const { data, error } = await $fetch(
		"@get/api/managers/:hotelId/inventory/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error) return { success: false as const, error: error.message || "Failed to fetch inventory summary" };
	return { success: true as const, data: data.data };
}

// ==================== NOTIFICATION ACTIONS ====================

export async function markNotificationRead(
	notificationId: string,
): ServerActionResponse<{ message: string }> {
	const sessionData = await verifySession();

	const { error } = await $fetch(
		"@put/api/notifications/:notificationId/read",
		{
			params: { notificationId },
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to mark notification as read",
		};
	}

	return {
		success: true,
		data: { message: "Notification marked as read" },
	};
}

export async function markAllNotificationsRead(): ServerActionResponse<{
	message: string;
}> {
	const sessionData = await verifySession();
	const { hotelId } = await getManagerContext();

	const { error } = await $fetch("@put/api/notifications/mark-all-read", {
		query: { hotelId },
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to mark all notifications as read",
		};
	}

	return {
		success: true,
		data: { message: "All notifications marked as read" },
	};
}

export async function getManagerBookingFolio({
	bookingId,
}: {
	bookingId: string;
}): ServerActionResponseFromEndpoint<"@get/api/managers/bookings/:bookingId/folio"> {
	const { sessionData } = await getManagerContext();

	const response = await $fetch(
		"@get/api/managers/bookings/:bookingId/folio",
		{
			params: { bookingId },
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Failed to fetch folio",
		};
	}

	return { success: true, data: response.data };
}

export async function exportManagerFolioPdf({
	bookingId,
}: {
	bookingId: string;
}): ServerActionResponse<{ base64: string; filename: string }> {
	const { sessionData } = await getManagerContext();

	try {
		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/managers/bookings/${bookingId}/folio/export`,
			{
				headers: { Authorization: `Bearer ${sessionData.token}` },
			},
		);

		if (!response.ok) {
			return { success: false, error: "Failed to export folio PDF" };
		}

		const arrayBuffer = await response.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		const disposition = response.headers.get("content-disposition");
		const filename =
			disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "folio.pdf";

		return { success: true, data: { base64, filename } };
	} catch (e) {
		return {
			success: false,
			error:
				e instanceof Error ? e.message : "Failed to export folio PDF",
		};
	}
}

export async function exportBookings(filters: {
	search?: string;
	roomType?: string;
	bookingStatus?: string;
	format: "CSV" | "PDF" | "EXCEL";
}): ServerActionResponse<{ base64: string; filename: string }> {
	const { sessionData, hotelId } = await getManagerContext();

	try {
		const params = new URLSearchParams({ format: filters.format });
		if (filters.search) params.set("search", filters.search);
		if (filters.roomType) params.set("roomType", filters.roomType);
		if (filters.bookingStatus) params.set("bookingStatus", filters.bookingStatus);

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/managers/hotels/${hotelId}/bookings/export?${params}`,
			{
				headers: { Authorization: `Bearer ${sessionData.token}` },
			},
		);

		if (!response.ok) {
			return { success: false, error: "Failed to export bookings" };
		}

		const arrayBuffer = await response.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		const disposition = response.headers.get("content-disposition");
		const filename =
			disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "bookings-export";

		return { success: true, data: { base64, filename } };
	} catch (e) {
		return {
			success: false,
			error:
				e instanceof Error ? e.message : "Failed to export bookings",
		};
	}
}

export async function exportRooms(filters: {
	search?: string;
	roomType?: string;
	status?: string;
	format: "CSV" | "PDF" | "EXCEL";
}): Promise<{ success: boolean; data?: string; error?: string }> {
	const { sessionData, hotelId } = await getManagerContext();

	try {
		const response = await $fetch(
			"@get/api/managers/hotels/:hotelId/rooms/export",
			{
				params: { hotelId },
				query: {
					search: filters.search,
					roomType: filters.roomType,
					status: filters.status,
					format: filters.format,
				},
				auth: { type: "Bearer", token: sessionData.token },
			},
		);

		if (response.error) {
			return {
				success: false,
				error: response.error.message || "Failed to export rooms",
			};
		}

		return { success: true, data: response.data as unknown as string };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "An error occurred during export",
		};
	}
}
