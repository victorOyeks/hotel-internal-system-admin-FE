"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { RoomsBulkResult } from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import {
	toAreaRow,
	toRoomRow,
	toRoomTypeRow,
} from "@hospio/api/data/mappers/property";
import type { AreaRow, RoomRow, RoomTypeRow } from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * Rooms, room types, special prices and out-of-order: the Manager · Rooms screens and Hotel setup →
 * Rooms & areas write through here. When property-service is live the call goes to the gateway; in
 * demo mode the caller's own row is echoed back after a short pause so the screens behave the same.
 */

const ROOM_PATHS = [
	"/manager/rooms",
	"/front-desk/rooms",
	"/manager/hotel-setup",
	"/manager",
	"/hotel-owner/hotels",
	"/onboarding",
	"/admin/onboarding",
];
function revalidateRooms() {
	for (const p of ROOM_PATHS) revalidatePath(p);
}

export type RoomTypeInput = {
	name: string;
	basePrice: number;
	capacityAdults: number;
	capacityChildren: number;
	facilities: string[];
	description?: string;
};

/** `hotelId` overrides X-Hotel-Id: the wizards create room types for a hotel the caller is not "in". */
export async function saveRoomType(
	input: RoomTypeInput,
	id?: string,
	fallback?: RoomTypeRow,
	hotelId?: string,
): Promise<ActionResult<RoomTypeRow>> {
	if (!live("property")) {
		await demoDelay(400);
		return {
			ok: true,
			data: fallback ?? {
				id: id ?? `rt-${Date.now()}`,
				...input,
				rooms: 0,
				specialPrices: [],
			},
		};
	}
	const body = {
		name: input.name,
		description: input.description ?? null,
		basePrice: input.basePrice,
		capacityAdults: input.capacityAdults,
		capacityChildren: input.capacityChildren,
		facilities: input.facilities.join(","),
		active: true,
	};
	const s = await withSession(hotelId ? { hotelId } : undefined);
	const { data, error } = id
		? await api("@put/property/room-types/:id", { ...s, params: { id }, body })
		: await api("@post/property/room-types", { ...s, body });
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The room type could not be saved"),
		};
	revalidateRooms();
	return { ok: true, data: toRoomTypeRow(data.data) };
}

export async function addSpecialPrice(
	typeId: string,
	input: { name: string; price: number; fromDate: string; toDate: string },
): Promise<ActionResult<RoomTypeRow["specialPrices"][number]>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: { id: `sp-${Date.now()}`, ...input } };
	}
	const { data, error } = await api(
		"@post/property/room-types/:id/special-prices",
		{ ...(await withSession()), params: { id: typeId }, body: input },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The special price could not be saved"),
		};
	revalidateRooms();
	const saved = toRoomTypeRow(data.data).specialPrices;
	return {
		ok: true,
		data:
			saved.find(
				(sp) => sp.name === input.name && sp.fromDate === input.fromDate,
			) ?? saved[saved.length - 1],
	};
}

/** A floor or wing (property-service areas), added from Add room when the hotel has none that fits. */
export async function addArea(name: string): Promise<ActionResult<AreaRow>> {
	if (!live("property")) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				id: `area-${Date.now()}`,
				name: name.trim(),
				kind: "FLOOR",
				sortOrder: 99,
			},
		};
	}
	const { data, error } = await api("@post/property/areas", {
		...(await withSession()),
		body: { name: name.trim(), kind: "FLOOR" },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The floor or wing could not be added"),
		};
	revalidateRooms();
	return { ok: true, data: toAreaRow(data.data) };
}

export type RoomInput = {
	number: string;
	roomTypeId: string;
	areaId?: string;
	floor?: string;
	notes?: string;
};

export async function saveRoom(
	input: RoomInput,
	id: string | undefined,
	areas: AreaRow[],
	fallback: RoomRow,
): Promise<ActionResult<RoomRow>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const body = {
		number: input.number,
		roomTypeId: input.roomTypeId,
		areaId: input.areaId ?? null,
		floor: input.floor ?? null,
		notes: input.notes ?? null,
	};
	const s = await withSession();
	const { data, error } = id
		? await api("@put/property/rooms/:id", { ...s, params: { id }, body })
		: await api("@post/property/rooms", { ...s, body });
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The room could not be saved"),
		};
	revalidateRooms();
	return {
		ok: true,
		data: {
			...toRoomRow(data.data, areas),
			state:
				fallback.state === "out_of_order" || data.data.status === "OUT_OF_ORDER"
					? "out_of_order"
					: fallback.state,
		},
	};
}

export async function markOutOfOrder(
	id: string,
	reason: string,
	until: string | undefined,
	areas: AreaRow[],
): Promise<ActionResult<Partial<RoomRow>>> {
	if (!live("property")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				state: "out_of_order",
				outOfOrderReason: reason,
				outOfOrderUntil: until,
				guestName: undefined,
				checkOut: undefined,
			},
		};
	}
	const { data, error } = await api("@post/property/rooms/:id/out-of-order", {
		...(await withSession()),
		params: { id },
		body: { reason, until: until ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The room could not be marked out of order"),
		};
	revalidateRooms();
	return {
		ok: true,
		data: {
			...toRoomRow(data.data, areas),
			guestName: undefined,
			checkOut: undefined,
		},
	};
}

export async function backInService(
	id: string,
	areas: AreaRow[],
): Promise<ActionResult<Partial<RoomRow>>> {
	if (!live("property")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				state: "ready",
				outOfOrderReason: undefined,
				outOfOrderUntil: undefined,
			},
		};
	}
	const { data, error } = await api(
		"@post/property/rooms/:id/back-in-service",
		{ ...(await withSession()), params: { id } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The room could not be put back in service"),
		};
	revalidateRooms();
	return { ok: true, data: toRoomRow(data.data, areas) };
}

/** A new room type for the active hotel, or for `hotelId` (the onboarding wizards). */
export async function createRoomType(
	input: RoomTypeInput,
	hotelId?: string,
): Promise<ActionResult<RoomTypeRow>> {
	return saveRoomType(input, undefined, undefined, hotelId);
}

/** DELETE /property/room-types/{id}: deactivates the type; 409 while rooms still use it. */
export async function deleteRoomType(
	id: string,
	hotelId?: string,
): Promise<ActionResult<null>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@delete/property/room-types/:id", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 409
					? "Rooms still use this type. Move them first"
					: "The room type could not be removed",
			),
		};
	revalidateRooms();
	return { ok: true, data: null };
}

export type BulkRoomInput = {
	number: string;
	roomTypeId: string;
	floor?: string;
	areaId?: string;
};

/**
 * POST /property/rooms/bulk: up to 500 rooms at once. Numbers already present are skipped, not failed; with `strict`
 * (the admin onboarding) the server refuses the whole list instead, naming the numbers, and makes nothing.
 */
export async function createRoomsBulk(
	rooms: BulkRoomInput[],
	hotelId?: string,
	strict = false,
): Promise<ActionResult<RoomsBulkResult>> {
	if (rooms.length === 0) return { ok: false, error: "Add at least one room" };
	if (rooms.length > 500)
		return { ok: false, error: "Up to 500 rooms at a time" };
	if (!live("property")) {
		await demoDelay(600);
		return { ok: true, data: { created: rooms.length, skipped: [] } };
	}
	const body = {
		rooms: rooms.map((r) => ({
			number: r.number,
			roomTypeId: r.roomTypeId,
			floor: r.floor ?? null,
			areaId: r.areaId ?? null,
		})),
		...(strict ? { refuseExisting: true } : {}),
	};
	const { data, error } = await api("@post/property/rooms/bulk", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		body,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The rooms could not be created"),
		};
	revalidateRooms();
	return { ok: true, data: data.data };
}

/** One hotel's room types and rooms as the server has them now (the admin onboarding's Rooms step re-reads these on open). */
export type HotelRoomsSnapshot = {
	types: {
		id: string;
		name: string;
		basePrice: number;
		capacityAdults: number;
		active: boolean;
	}[];
	rooms: {
		id: string;
		number: string;
		floor: string | null;
		roomTypeId: string;
	}[];
};

export async function hotelRooms(
	hotelId: string,
): Promise<ActionResult<HotelRoomsSnapshot>> {
	if (!live("property")) return { ok: true, data: { types: [], rooms: [] } };
	const s = await withSession({ hotelId });
	const [types, rooms] = await Promise.all([
		api("@get/property/room-types", s),
		api("@get/property/rooms", { ...s, query: {} }),
	]);
	if (types.error || !types.data)
		return {
			ok: false,
			error: errorMessage(types.error, "The room types could not be read"),
		};
	if (rooms.error || !rooms.data)
		return {
			ok: false,
			error: errorMessage(rooms.error, "The rooms could not be read"),
		};
	return {
		ok: true,
		data: {
			types: types.data.data.map((t) => ({
				id: t.id,
				name: t.name,
				basePrice: t.basePrice,
				capacityAdults: t.capacityAdults,
				active: t.active,
			})),
			rooms: rooms.data.data.map((r) => ({
				id: r.id,
				number: r.number,
				floor: r.floor,
				roomTypeId: r.roomTypeId,
			})),
		},
	};
}

/** PUT /property/rooms/{id} for a named hotel (the admin onboarding edits rooms of a hotel it is not "in"). */
export async function updateHotelRoom(
	id: string,
	input: { number: string; roomTypeId: string; floor?: string | null },
	hotelId: string,
): Promise<ActionResult<null>> {
	if (!live("property")) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { error } = await api("@put/property/rooms/:id", {
		...(await withSession({ hotelId })),
		params: { id },
		body: {
			number: input.number,
			roomTypeId: input.roomTypeId,
			floor: input.floor ?? null,
			areaId: null,
			notes: null,
		},
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The room could not be saved"),
		};
	revalidateRooms();
	return { ok: true, data: null };
}

/** DELETE /property/rooms/{id}: a room made by mistake. 409 when it has ever had a booking. */
export async function deleteRoom(
	id: string,
	hotelId?: string,
): Promise<ActionResult<null>> {
	if (!live("property")) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { error } = await api("@delete/property/rooms/:id", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The room could not be deleted"),
		};
	revalidateRooms();
	return { ok: true, data: null };
}
