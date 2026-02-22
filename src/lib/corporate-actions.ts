"use server";

import { verifySession, getUser } from "./dal";
import { $fetch } from "./fetch";
import type {
	ServerActionResponse,
	ServerActionResponseFromEndpoint,
} from "./action-utils";
import { parseError } from "./action-utils";
import { cache } from "react";

async function getCorporateContext(hotelId: string) {
	const sessionData = await verifySession();
	const isAuthorized =
		sessionData.roles.includes("MANAGER") ||
		sessionData.roles.includes("HOTEL_OWNER");
	if (!isAuthorized) {
		throw new Error("Unauthorized: requires Manager or Hotel Owner role");
	}
	return { sessionData, hotelId };
}

export async function createOrganization(payload: {
	hotelId: string;
	name: string;
	email: string;
	phoneNumber: string;
	address: string;
}): ServerActionResponseFromEndpoint<"@post/api/corporate/organizations"> {
	try {
		const { sessionData } = await getCorporateContext(payload.hotelId);

		const { data, error } = await $fetch(
			"@post/api/corporate/organizations",
			{
				auth: { type: "Bearer", token: sessionData.token },
				body: payload,
			},
		);

		if (error) {
			return { success: false, error: error.message || "Failed to create organization" };
		}

		return { success: true, data };
	} catch (e) {
		return { success: false, error: parseError(e) };
	}
}

export async function updateOrganization(
	id: string,
	hotelId: string,
	payload: {
		name: string;
		email: string;
		phoneNumber: string;
		address: string;
	},
): ServerActionResponseFromEndpoint<"@put/api/corporate/organizations/:id"> {
	try {
		const { sessionData } = await getCorporateContext(hotelId);

		const { data, error } = await $fetch(
			"@put/api/corporate/organizations/:id",
			{
				params: { id },
				query: { hotelId },
				auth: { type: "Bearer", token: sessionData.token },
				body: { ...payload, hotelId },
			},
		);

		if (error) {
			return { success: false, error: error.message || "Failed to update organization" };
		}

		return { success: true, data };
	} catch (e) {
		return { success: false, error: parseError(e) };
	}
}

export async function deleteOrganization(
	id: string,
	hotelId: string,
): ServerActionResponse<{ message: string }> {
	try {
		const { sessionData } = await getCorporateContext(hotelId);

		const { error } = await $fetch(
			"@delete/api/corporate/organizations/:id",
			{
				params: { id },
				query: { hotelId },
				auth: { type: "Bearer", token: sessionData.token },
			},
		);

		if (error) {
			return { success: false, error: error.message || "Failed to delete organization" };
		}

		return { success: true, data: { message: "Organization deleted successfully" } };
	} catch (e) {
		return { success: false, error: parseError(e) };
	}
}

export async function assignBookingToOrganization(payload: {
	hotelId: string;
	bookingId: string;
	organizationId: string;
	dailySpendingCap: number;
}): ServerActionResponseFromEndpoint<"@post/api/corporate/assign-booking"> {
	try {
		const sessionData = await verifySession();

		const { data, error } = await $fetch(
			"@post/api/corporate/assign-booking",
			{
				auth: { type: "Bearer", token: sessionData.token },
				body: payload,
			},
		);

		if (error) {
			return { success: false, error: error.message || "Failed to assign booking" };
		}

		return { success: true, data };
	} catch (e) {
		return { success: false, error: parseError(e) };
	}
}

export async function addManualCharge(payload: {
	bookingId: string;
	description: string;
	amount: number;
}): ServerActionResponse<{ message: string }> {
	try {
		const sessionData = await verifySession();

		const { error } = await $fetch("@post/api/corporate/manual-charges", {
			auth: { type: "Bearer", token: sessionData.token },
			body: payload,
		});

		if (error) {
			return { success: false, error: error.message || "Failed to add manual charge" };
		}

		return { success: true, data: { message: "Manual charge added successfully" } };
	} catch (e) {
		return { success: false, error: parseError(e) };
	}
}

export async function exportOrganizationReport(payload: {
	organizationId: string;
	hotelId: string;
	start?: string;
	end?: string;
	includeTransactions?: boolean;
}) {
	try {
		const sessionData = await verifySession();

		const response = await $fetch(
			"@get/api/corporate/reports/:organizationId/export",
			{
				params: { organizationId: payload.organizationId },
				query: {
					hotelId: payload.hotelId,
					start: payload.start || undefined,
					end: payload.end || undefined,
					includeTransactions: payload.includeTransactions || false,
				},
				auth: { type: "Bearer", token: sessionData.token },
			},
		);

		if (!response.data) {
			return { success: false as const, error: "No data returned" };
		}

		return { success: true as const, data: response.data };
	} catch (error) {
		console.error("Export failed:", error);
		return {
			success: false as const,
			error:
				error instanceof Error ? error.message : "Failed to export report",
		};
	}
}

// --- Query functions (for client-side useQuery) ---

export const getOrganizationGuests = cache(
	async (
		organizationId: string,
		hotelId: string,
		params?: {
			search?: string;
			page?: number;
			size?: number;
		},
	) => {
		const sessionData = await verifySession();
		const res = await $fetch(
			"@get/api/corporate/guests/:organizationId",
			{
				params: { organizationId },
				query: {
					hotelId,
					search: params?.search || undefined,
					page: params?.page ?? 0,
					size: params?.size ?? 10,
				},
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);
		return res.data;
	},
);

export const getOrganizationTransactions = cache(
	async (
		organizationId: string,
		hotelId: string,
		params?: {
			staffName?: string;
			type?: string;
			search?: string;
			start?: string;
			end?: string;
			page?: number;
			size?: number;
		},
	) => {
		const sessionData = await verifySession();
		const res = await $fetch(
			"@get/api/corporate/transactions/:organizationId",
			{
				params: { organizationId },
				query: {
					hotelId,
					staffName: params?.staffName || undefined,
					type: params?.type || undefined,
					search: params?.search || undefined,
					start: params?.start || undefined,
					end: params?.end || undefined,
					page: params?.page ?? 0,
					size: params?.size ?? 10,
				},
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);
		return res.data;
	},
);

export const getOrganizationReport = cache(
	async (
		organizationId: string,
		hotelId: string,
		params?: {
			start?: string;
			end?: string;
		},
	) => {
		const sessionData = await verifySession();
		const res = await $fetch(
			"@get/api/corporate/reports/:organizationId",
			{
				params: { organizationId },
				query: {
					hotelId,
					start: params?.start || undefined,
					end: params?.end || undefined,
				},
				auth: { type: "Bearer", token: sessionData.token },
				throw: true,
			},
		);
		return res.data;
	},
);

export const getOrganizationsForCurrentUser = cache(async () => {
	const sessionData = await verifySession();
	const user = await getUser();
	if (!user?.hotels?.length)
		return { organizations: [] as { id: string; name: string; customId: string; email: string; phoneNumber: string; address: string; createdAt: string; updatedAt: string }[], hotelId: "" };

	const hotelId = user.hotels[0].id;
	const res = await $fetch("@get/api/corporate/organizations", {
		query: { hotelId, size: 100 },
		auth: { type: "Bearer", token: sessionData.token },
		throw: true,
	});
	return { organizations: res.data.content, hotelId };
});
