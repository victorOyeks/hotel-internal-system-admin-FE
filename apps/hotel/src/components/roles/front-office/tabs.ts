/**
 * The front desk's tab constants, in a plain module (not "use client") so the server pages read the values
 * rather than client references.
 */

export type FoTab = "arrivals" | "departures" | "in-house" | "upcoming" | "all";
/** The front desk's bookings tabs: reservation-service's views of the same names. */
export const FO_TABS: FoTab[] = [
	"arrivals",
	"departures",
	"in-house",
	"upcoming",
	"all",
];

/** The payments tabs as the service's filters: today's, what I took, still to verify, everything (the last 90 days). */
export const PAYMENT_TABS = {
	today: { today: true },
	mine: { mine: true },
	verify: { status: "PENDING,PROCESSING,NO_RESPONSE" },
	all: {},
} as const;
export type PaymentTab = keyof typeof PAYMENT_TABS;
