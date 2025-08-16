import type { HotelRole } from "./types";

export const paths = {
	"HOTEL_OWNER": "/owner",
	"MANAGER": "/manager",
	"FRONT_DESK": "/front-desk",
	"MAINTENANCE": "/maintenance",
	"INVENTORY": "/inventory",
	"BAR": "/bar",
	"KITCHEN": "/kitchen",
} as const satisfies Record<HotelRole, string>;