import type { HotelRole } from "@hospio/api/roles";

/*
 * Kept out of shared-device.tsx ("use client") so the dashboard shell, a server component, reads the arrays themselves: imported
 * from a client module they arrive as client references and `new Set(...)` over them threw, failing every dashboard page.
 */

/** The roles a device can be for: every hotel role but the owner. */
export const DEVICE_ROLES: HotelRole[] = [
	"FRONT_OFFICE",
	"BAR",
	"KITCHEN",
	"HOUSEKEEPING",
	"LAUNDRY",
	"MAINTENANCE",
	"INVENTORY",
	"FINANCE",
	"MANAGER",
];
/** The desks that are usually a shared tablet: new staff in these are asked for a PIN at their first sign-in. */
export const SHARED_DESK_ROLES = [
	"FRONT_OFFICE",
	"BAR",
	"KITCHEN",
	"HOUSEKEEPING",
	"LAUNDRY",
	"MAINTENANCE",
	"INVENTORY",
];
