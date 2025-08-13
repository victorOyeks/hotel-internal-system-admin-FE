import type { HotelRole } from "./types";

export const paths: Record<HotelRole, string> = {
	"HOTEL_OWNER": "/owner",
	"MANAGER": "/manager",
	"FRONT_DESK": "/front-desk",
	"MAINTENANCE": "/maintenance",
	"INVENTORY": "/inventory",
	"BAR": "/bar",
	"KITCHEN": "/kitchen",
}