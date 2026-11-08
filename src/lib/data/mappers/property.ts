import type { z } from "zod";
import type { Area, Room, RoomStatus, RoomType } from "@/lib/api/schema";
import type { AreaRow, RoomRow, RoomState, RoomTypeRow } from "@/lib/data/types";

/** property-service and housekeeping-service responses → the rows the room screens render. */

export function toRoomTypeRow(t: z.infer<typeof RoomType>): RoomTypeRow {
	return {
		id: t.id,
		name: t.name,
		basePrice: Number(t.basePrice),
		capacityAdults: t.capacityAdults,
		capacityChildren: t.capacityChildren,
		rooms: Number(t.roomCount),
		facilities: (t.facilities ?? "")
			.split(",")
			.map((f) => f.trim())
			.filter(Boolean),
		specialPrices: (t.specialPrices ?? []).map((sp) => ({ id: sp.id, name: sp.name, price: Number(sp.price), fromDate: sp.fromDate, toDate: sp.toDate })),
	};
}

export function toAreaRow(a: z.infer<typeof Area>): AreaRow {
	return { id: a.id, name: a.name, kind: a.kind ?? "FLOOR", sortOrder: a.sortOrder ?? 0 };
}

/**
 * The board state comes from three services: property says whether the room is in service,
 * housekeeping whether it is clean, reservation whether someone is in it. Occupancy is added when
 * reservation-service is wired; until then an in-service room shows as ready or needing cleaning.
 */
export function toRoomRow(r: z.infer<typeof Room>, areas: AreaRow[], cleanliness?: z.infer<typeof RoomStatus>): RoomRow {
	const area = areas.find((a) => a.id === r.areaId);
	let state: RoomState = "ready";
	if (r.status === "OUT_OF_ORDER") state = "out_of_order";
	else if (cleanliness?.status === "DIRTY") state = "dirty";
	return {
		id: r.id,
		number: r.number,
		floor: area?.name ?? (r.floor ? `Floor ${r.floor}` : "Unassigned"),
		areaId: r.areaId ?? undefined,
		typeId: r.roomTypeId,
		typeName: r.roomTypeName ?? "",
		price: Number(r.basePrice ?? 0),
		state,
		outOfOrderReason: r.outOfOrderReason ?? undefined,
		outOfOrderUntil: r.outOfOrderUntil ?? undefined,
		note: r.notes ?? undefined,
	};
}
