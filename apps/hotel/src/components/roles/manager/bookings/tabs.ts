/**
 * The bookings tabs (reservation-service views). A plain module, not "use client", so the server pages can
 * read the values: a constant imported from a client module reaches a server component as a reference, not
 * the array (it broke every tab but the first).
 */
export const BOOKING_TABS = [
	"arrivals",
	"departures",
	"in-house",
	"upcoming",
	"past",
	"all",
] as const;
