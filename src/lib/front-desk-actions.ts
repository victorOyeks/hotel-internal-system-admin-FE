"use server";

import type {
	APIInput,
	Prettify,
	ServerActionResponse,
	ServerActionResponseFromEndpoint,
} from "./action-utils";
import { verifySession } from "./dal";
import { $fetch, type CheckInRequest } from "./fetch";
import { env } from "@/env";

export async function makeReservation({
	roomId,
	...payload
}: {
	roomId: string;
} & APIInput<"@post/api/front-desks/:roomId/make-reservation">): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/make-reservation"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@post/api/front-desks/:roomId/make-reservation",
		{
			params: { roomId },
			auth: {
				type: "Bearer",
				token,
			},
			body: payload,
		},
	);

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message ||
				"An error occurred while making the reservation.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function cancelReservation({
	roomId,
}: {
	roomId: string;
}): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/cancel-reservation"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@post/api/front-desks/:roomId/cancel-reservation",
		{
			params: { roomId },
			auth: {
				type: "Bearer",
				token,
			},
		},
	);

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message ||
				"An error occurred while cancelling the reservation.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function checkInGuest({
	roomId,
	...payload
}: Prettify<
	{
		roomId: string;
	} & CheckInRequest
>): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/check-in"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@post/api/front-desks/:roomId/check-in",
		{
			params: { roomId },
			body: {
				...payload,
			},
			auth: {
				type: "Bearer",
				token,
			},
		},
	);

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "An error occurred during check-in.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function checkOutGuest({
	roomId,
	...payload
}: {
	roomId: string;
} & APIInput<"@post/api/front-desks/:roomId/check-out">): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/check-out"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch("@post/api/front-desks/:roomId/check-out", {
		params: { roomId },
		body: {
			...payload,
		},
		auth: {
			type: "Bearer",
			token,
		},
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "An error occurred during check-out.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function reportLostItem(
	payload: APIInput<"@post/api/front-desks/lost-and-found">,
): ServerActionResponseFromEndpoint<"@post/api/front-desks/lost-and-found"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch("@post/api/front-desks/lost-and-found", {
		body: {
			...payload,
		},
		auth: {
			type: "Bearer",
			token,
		},
	});

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message || "An error occurred while reporting the item.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function deleteLostItem({
	itemId,
}: {
	itemId: string;
}): ServerActionResponseFromEndpoint<"@delete/api/front-desks/lost-and-found/:itemId"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@delete/api/front-desks/lost-and-found/:itemId",
		{
			params: { itemId },
			auth: {
				type: "Bearer",
				token,
			},
		},
	);

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message || "An error occurred while deleting the item.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function claimLostItem({
	itemId,
	...payload
}: {
	itemId: string;
} & APIInput<"@post/api/front-desks/lost-and-found/:itemId/claim">): ServerActionResponseFromEndpoint<"@post/api/front-desks/lost-and-found/:itemId/claim"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@post/api/front-desks/lost-and-found/:itemId/claim",
		{
			params: { itemId },
			body: {
				...payload,
			},
			auth: {
				type: "Bearer",
				token,
			},
		},
	);

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message || "An error occurred while claiming the item.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function updateBooking({
	bookingId,
	...payload
}: {
	bookingId: string;
} & APIInput<"@put/api/front-desks/bookings/:bookingId">): ServerActionResponseFromEndpoint<"@put/api/front-desks/bookings/:bookingId"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@put/api/front-desks/bookings/:bookingId",
		{
			params: { bookingId },
			body: payload,
			auth: {
				type: "Bearer",
				token,
			},
		},
	);

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message ||
				"An error occurred while updating the booking.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function recordPayment({
	bookingId,
	...payload
}: {
	bookingId: string;
} & APIInput<"@post/api/front-desks/bookings/:bookingId/payments">): ServerActionResponseFromEndpoint<"@post/api/front-desks/bookings/:bookingId/payments"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@post/api/front-desks/bookings/:bookingId/payments",
		{
			params: { bookingId },
			body: {
				...payload,
			},
			auth: {
				type: "Bearer",
				token,
			},
		},
	);

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message || "An error occurred while recording payment.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function getBookingPayments({
	bookingId,
}: {
	bookingId: string;
}): ServerActionResponseFromEndpoint<"@get/api/front-desks/bookings/:bookingId/payments"> {
	const { token } = await verifySession("FRONT_DESK");

	const response = await $fetch(
		"@get/api/front-desks/bookings/:bookingId/payments",
		{
			params: { bookingId },
			auth: {
				type: "Bearer",
				token,
			},
		},
	);

	if (response.error) {
		return {
			success: false,
			error:
				response.error.message || "An error occurred while fetching payments.",
		};
	}

	return {
		success: true,
		data: response.data,
	};
}

export async function exportRooms(filters: {
	search?: string;
	roomType?: string;
	status?: string;
	format: "CSV" | "PDF" | "EXCEL";
}): Promise<{ success: boolean; data?: string; error?: string }> {
	try {
		const { token } = await verifySession("FRONT_DESK");

		const response = await $fetch("@get/api/front-desks/rooms/export", {
			query: {
				search: filters.search,
				roomType: filters.roomType,
				roomStatus: filters.status,
				format: filters.format,
			},
			auth: {
				type: "Bearer",
				token,
			},
		});

		if (response.error) {
			return {
				success: false,
				error: response.error.message || "Failed to export rooms",
			};
		}

		return {
			success: true,
			data: response.data as unknown as string,
		};
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

export async function getAvailableRooms(roomType?: string) {
	const { token } = await verifySession("FRONT_DESK");
	const response = await $fetch("@get/api/front-desks/all-rooms-by-type", {
		query: { roomType: roomType || null, roomStatus: "AVAILABLE" },
		auth: { type: "Bearer", token },
		throw: true,
	});
	return response.data;
}

export async function toggleRoomActive(
	roomId: string,
	reason?: string,
): ServerActionResponse<{ message: string }> {
	const { token } = await verifySession("FRONT_DESK");

	try {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${token}`,
		};
		let body: string | undefined;
		if (reason) {
			headers["Content-Type"] = "application/json";
			body = JSON.stringify({ reason });
		}

		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/front-desks/rooms/${roomId}/toggle-active`,
			{
				method: "PATCH",
				headers,
				body,
			},
		);

		const data = await response.json();
		if (!response.ok) {
			return {
				success: false,
				error: data.message || "Failed to toggle room status",
			};
		}

		return { success: true, data: { message: data.message } };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Failed to toggle room status",
		};
	}
}
