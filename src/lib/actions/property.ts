"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions";
import { api, errorMessage } from "@/lib/api/client";
import { withSession } from "@/lib/api/server";
import { live } from "@/lib/data/live";
import { toRoomRow, toRoomTypeRow } from "@/lib/data/mappers/property";
import type { AreaRow, RoomRow, RoomTypeRow } from "@/lib/data/types";
import { demoDelay } from "@/lib/demo/mode";

/**
 * Rooms, room types, special prices and out-of-order: the Manager · Rooms screens and Hotel setup →
 * Rooms & areas write through here. When property-service is live the call goes to the gateway; in
 * demo mode the caller's own row is echoed back after a short pause so the screens behave the same.
 */

const ROOM_PATHS = ["/manager/rooms", "/front-desk/rooms", "/manager/hotel-setup", "/manager"];
function revalidateRooms() {
	for (const p of ROOM_PATHS) revalidatePath(p);
}

export type RoomTypeInput = { name: string; basePrice: number; capacityAdults: number; capacityChildren: number; facilities: string[]; description?: string };

export async function saveRoomType(input: RoomTypeInput, id?: string, fallback?: RoomTypeRow): Promise<ActionResult<RoomTypeRow>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: fallback ?? { id: id ?? `rt-${Date.now()}`, ...input, rooms: 0, specialPrices: [] } };
	}
	const body = { name: input.name, description: input.description ?? null, basePrice: input.basePrice, capacityAdults: input.capacityAdults, capacityChildren: input.capacityChildren, facilities: input.facilities.join(","), active: true };
	const s = await withSession();
	const { data, error } = id
		? await api("@put/property/room-types/:id", { ...s, params: { id }, body })
		: await api("@post/property/room-types", { ...s, body });
	if (error || !data) return { ok: false, error: errorMessage(error, "The room type could not be saved") };
	revalidateRooms();
	return { ok: true, data: toRoomTypeRow(data.data) };
}

export async function addSpecialPrice(typeId: string, input: { name: string; price: number; fromDate: string; toDate: string }): Promise<ActionResult<RoomTypeRow["specialPrices"][number]>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: { id: `sp-${Date.now()}`, ...input } };
	}
	const { data, error } = await api("@post/property/room-types/:id/special-prices", { ...(await withSession()), params: { id: typeId }, body: input });
	if (error || !data) return { ok: false, error: errorMessage(error, "The special price could not be saved") };
	revalidateRooms();
	const saved = toRoomTypeRow(data.data).specialPrices;
	return { ok: true, data: saved.find((sp) => sp.name === input.name && sp.fromDate === input.fromDate) ?? saved[saved.length - 1] };
}

export type RoomInput = { number: string; roomTypeId: string; areaId?: string; floor?: string; notes?: string };

export async function saveRoom(input: RoomInput, id: string | undefined, areas: AreaRow[], fallback: RoomRow): Promise<ActionResult<RoomRow>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const body = { number: input.number, roomTypeId: input.roomTypeId, areaId: input.areaId ?? null, floor: input.floor ?? null, notes: input.notes ?? null };
	const s = await withSession();
	const { data, error } = id
		? await api("@put/property/rooms/:id", { ...s, params: { id }, body })
		: await api("@post/property/rooms", { ...s, body });
	if (error || !data) return { ok: false, error: errorMessage(error, "The room could not be saved") };
	revalidateRooms();
	return { ok: true, data: { ...toRoomRow(data.data, areas), state: fallback.state === "out_of_order" || data.data.status === "OUT_OF_ORDER" ? "out_of_order" : fallback.state } };
}

export async function markOutOfOrder(id: string, reason: string, until: string | undefined, areas: AreaRow[]): Promise<ActionResult<Partial<RoomRow>>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: { state: "out_of_order", outOfOrderReason: reason, outOfOrderUntil: until, guestName: undefined, checkOut: undefined } };
	}
	const { data, error } = await api("@post/property/rooms/:id/out-of-order", { ...(await withSession()), params: { id }, body: { reason, until: until ?? null } });
	if (error || !data) return { ok: false, error: errorMessage(error, "The room could not be marked out of order") };
	revalidateRooms();
	return { ok: true, data: { ...toRoomRow(data.data, areas), guestName: undefined, checkOut: undefined } };
}

export async function backInService(id: string, areas: AreaRow[]): Promise<ActionResult<Partial<RoomRow>>> {
	if (!live("property")) {
		await demoDelay(400);
		return { ok: true, data: { state: "ready", outOfOrderReason: undefined, outOfOrderUntil: undefined } };
	}
	const { data, error } = await api("@post/property/rooms/:id/back-in-service", { ...(await withSession()), params: { id } });
	if (error || !data) return { ok: false, error: errorMessage(error, "The room could not be put back in service") };
	revalidateRooms();
	return { ok: true, data: toRoomRow(data.data, areas) };
}
