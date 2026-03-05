"use server";
import { cookies } from "next/headers";
import { getOwnerCurrentHotel, verifySession } from "./dal";
import { $fetch, type CreateRoomRequest } from "./fetch";
import type { z } from "zod";
import type {
	ServerActionResponse,
	ServerActionResponseFromEndpoint,
} from "./action-utils";
import { parseError } from "./action-utils";
import { revalidatePath } from "next/cache";
import { env } from "@/env";

const isOwner = (roles: string[]) => roles.includes("HOTEL_OWNER");

async function getOwnerContext() {
	const sessionData = await verifySession();
	const currentHotel = await getOwnerCurrentHotel();
	if (!currentHotel) {
		throw new Error("No hotel selected. Please select a hotel first.");
	}
	return { sessionData, hotelId: currentHotel.id };
}

export async function switchOwnerCurrentHotel(
	hotelId: string,
): ServerActionResponse<{ message: string }> {
	const sessionData = await verifySession();

	if (!isOwner(sessionData.roles)) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}

	const jar = await cookies();

	jar.set(`${sessionData.userId}:currentOwnerHotel`, hotelId, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
	});

	return {
		success: true,
		data: { message: "Switched hotel successfully" },
	};
}

// ==================== ROOM MANAGEMENT ====================

export async function addNewRoomToHotelOwner(
	payload: Omit<CreateRoomRequest, "hotelId">,
): ServerActionResponseFromEndpoint<"@post/api/hotel-owners/hotels/:hotelId/rooms"> {
	const { sessionData, hotelId } = await getOwnerContext();

	const data = await $fetch("@post/api/hotel-owners/hotels/:hotelId/rooms", {
		params: { hotelId },
		auth: { type: "Bearer", token: sessionData.token },
		body: {
			...payload,
			hotelId,
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

// ==================== STAFF ACTIONS ====================

export async function resetPasswordForStaffOwner(
	staffId: string,
	payload: {
		newPassword: string;
		confirmPassword: string;
	},
): ServerActionResponseFromEndpoint<"@patch/api/hotel-owners/:hotelId/:staffId/reset-password"> {
	const { sessionData, hotelId } = await getOwnerContext();

	const { data, error } = await $fetch(
		"@patch/api/hotel-owners/:hotelId/:staffId/reset-password",
		{
			params: { hotelId, staffId },
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

export async function suspendStaffAccountOwner(
	staffId: string,
	payload: {
		reason: string;
		sendEmail: boolean;
	},
): ServerActionResponseFromEndpoint<"@patch/api/hotel-owners/:hotelId/:staffId/suspend"> {
	const { sessionData, hotelId } = await getOwnerContext();

	const { data, error } = await $fetch(
		"@patch/api/hotel-owners/:hotelId/:staffId/suspend",
		{
			params: { hotelId, staffId },
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

export async function reactivateStaffAccountOwner(
	staffId: string,
	sendEmail: boolean = true,
): ServerActionResponseFromEndpoint<"@patch/api/hotel-owners/:hotelId/:staffId/reactivate"> {
	const { sessionData, hotelId } = await getOwnerContext();

	const { data, error } = await $fetch(
		"@patch/api/hotel-owners/:hotelId/:staffId/reactivate",
		{
			params: { hotelId, staffId },
			query: { sendEmail },
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to reactivate staff account",
		};
	}

	return {
		success: true,
		data,
	};
}

// ==================== APPROVAL ACTIONS ====================

export async function ownerApproveRequest(
	id: string,
	comments?: string,
): ServerActionResponse<{ message: string }> {
	const { sessionData, hotelId } = await getOwnerContext();

	const { error } = await $fetch(
		"@post/api/hotel-owner/approvals/:id/approve",
		{
			params: { id },
			query: { hotelId },
			auth: { type: "Bearer", token: sessionData.token },
			body: comments ? { comments } : {},
		},
	);

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to approve request",
		};
	}

	return { success: true, data: { message: "Request approved successfully" } };
}

export async function ownerRejectRequest(
	id: string,
	comments: string,
): ServerActionResponse<{ message: string }> {
	const { sessionData, hotelId } = await getOwnerContext();

	const { error } = await $fetch(
		"@post/api/hotel-owner/approvals/:id/reject",
		{
			params: { id },
			query: { hotelId },
			auth: { type: "Bearer", token: sessionData.token },
			body: { comments },
		},
	);

	if (error) {
		return {
			success: false,
			error: error.message || "Failed to reject request",
		};
	}

	return { success: true, data: { message: "Request rejected successfully" } };
}

// ==================== OPERATIONS DATA FETCHING ====================

export async function getOwnerOperationsRestaurantSummary() {
	const { sessionData, hotelId } = await getOwnerContext();
	const { data, error } = await $fetch(
		"@get/api/hotel-owners/:hotelId/restaurant/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error)
		return {
			success: false as const,
			error: error.message || "Failed to fetch restaurant summary",
		};
	return { success: true as const, data: data.data };
}

export async function getOwnerOperationsLaundrySummary() {
	const { sessionData, hotelId } = await getOwnerContext();
	const { data, error } = await $fetch(
		"@get/api/hotel-owners/:hotelId/laundry/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error)
		return {
			success: false as const,
			error: error.message || "Failed to fetch laundry summary",
		};
	return { success: true as const, data: data.data };
}

export async function getOwnerOperationsRentalsSummary() {
	const { sessionData, hotelId } = await getOwnerContext();
	const { data, error } = await $fetch(
		"@get/api/hotel-owners/:hotelId/rentals/summary",
		{
			params: { hotelId },
			query: {},
			auth: { type: "Bearer", token: sessionData.token },
		},
	);
	if (error)
		return {
			success: false as const,
			error: error.message || "Failed to fetch rentals summary",
		};
	return { success: true as const, data: data.data };
}

export async function getOwnerBookingFolio({
	bookingId,
}: {
	bookingId: string;
}) {
	const { sessionData } = await getOwnerContext();

	const response = await $fetch(
		"@get/api/hotel-owners/bookings/:bookingId/folio",
		{
			params: { bookingId },
			auth: { type: "Bearer", token: sessionData.token },
		},
	);

	if (response.error) {
		return {
			success: false as const,
			error: response.error.message || "Failed to fetch folio",
		};
	}

	return { success: true as const, data: response.data };
}

export async function exportOwnerFolioPdf({
	bookingId,
}: {
	bookingId: string;
}): ServerActionResponse<{ base64: string; filename: string }> {
	const { sessionData } = await getOwnerContext();

	try {
		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/hotel-owners/bookings/${bookingId}/folio/export`,
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
	const { sessionData } = await getOwnerContext();

	try {
		const params = new URLSearchParams({ format: filters.format });
		if (filters.search) params.set("search", filters.search);
		if (filters.roomType) params.set("roomType", filters.roomType);
		if (filters.bookingStatus) params.set("bookingStatus", filters.bookingStatus);

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/hotel-owners/hotels/bookings/export?${params}`,
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
	const { sessionData, hotelId } = await getOwnerContext();

	try {
		const response = await $fetch(
			"@get/api/hotel-owners/hotels/:hotelId/rooms/export",
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

export async function exportHotels(filters: {
	searchText?: string;
	format: "CSV" | "PDF" | "EXCEL";
}): ServerActionResponse<{ base64: string; filename: string }> {
	const { sessionData } = await getOwnerContext();

	try {
		const params = new URLSearchParams({ format: filters.format });
		if (filters.searchText) params.set("searchText", filters.searchText);

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/hotel-owners/hotels/export?${params}`,
			{
				headers: { Authorization: `Bearer ${sessionData.token}` },
			},
		);

		if (!response.ok) {
			return { success: false, error: "Failed to export hotels" };
		}

		const arrayBuffer = await response.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		const disposition = response.headers.get("content-disposition");
		const filename =
			disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "hotels-export";

		return { success: true, data: { base64, filename } };
	} catch (e) {
		return {
			success: false,
			error:
				e instanceof Error ? e.message : "Failed to export hotels",
		};
	}
}

export async function exportAuditLogs(filters: {
	search?: string;
	startDate?: string;
	endDate?: string;
	format: "CSV" | "PDF" | "EXCEL";
}): ServerActionResponse<{ base64: string; filename: string }> {
	const { sessionData } = await getOwnerContext();

	try {
		const params = new URLSearchParams({ format: filters.format });
		if (filters.search) params.set("search", filters.search);
		if (filters.startDate) params.set("startDate", filters.startDate);
		if (filters.endDate) params.set("endDate", filters.endDate);

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/hotel-owners/logs/export?${params}`,
			{
				headers: { Authorization: `Bearer ${sessionData.token}` },
			},
		);

		if (!response.ok) {
			return { success: false, error: "Failed to export audit logs" };
		}

		const arrayBuffer = await response.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		const disposition = response.headers.get("content-disposition");
		const filename =
			disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "audit-logs-export";

		return { success: true, data: { base64, filename } };
	} catch (e) {
		return {
			success: false,
			error:
				e instanceof Error ? e.message : "Failed to export audit logs",
		};
	}
}

export async function exportStaff(filters: {
	format: "CSV" | "PDF" | "EXCEL";
}): Promise<{ success: boolean; data?: string; error?: string }> {
	const { sessionData, hotelId } = await getOwnerContext();

	try {
		const params = new URLSearchParams();
		params.set("format", filters.format);

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/hotel-owners/${hotelId}/staff/export?${params}`,
			{
				headers: { Authorization: `Bearer ${sessionData.token}` },
			},
		);

		if (!response.ok) {
			return { success: false, error: "Failed to export staff" };
		}

		const arrayBuffer = await response.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");

		return { success: true, data: base64 };
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
