"use server";
import { cookies } from "next/headers";
import { getManagerCurrentHotel, verifySession } from "./dal";
import {
	$fetch,
	type OnboardStaffRequest,
	type CreateRoomRequest,
} from "./fetch";
import type {
	ServerActionResponse,
	ServerActionResponseFromEndpoint,
} from "./action-utils";

const isManager = (roles: string[]) => roles.includes("MANAGER");

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
	if (isManager(sessionData.roles)) {
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
	if (isManager(sessionData.roles)) {
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
	payload: Partial<Omit<OnboardStaffRequest, "role">>,
): ServerActionResponseFromEndpoint<"@put/api/managers/:hotelId/:staffId"> {
	const sessionData = await verifySession();
	if (isManager(sessionData.roles)) {
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
	if (isManager(sessionData.roles)) {
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
	if (isManager(sessionData.roles)) {
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
