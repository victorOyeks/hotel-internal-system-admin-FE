"use server";
import { cookies } from "next/headers";
import { getManagerCurrentHotel, verifySession } from "./dal";
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

	const { error } = await $fetch("@put/api/notifications/mark-all-read", {
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
