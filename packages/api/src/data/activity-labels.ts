/**
 * The activity log's words (plain module: server pages and client screens both read it). platform-service filters the
 * log by the same departments (ActivityLogService.DEPARTMENT_TOPICS); keep the two lists in step.
 */

/** platform-service's topic (without "hospio-") → department, as its Departments board counts them. */
export const TOPIC_DEPARTMENT: [string, string][] = [
	["booking", "Front office"],
	["guest", "Front office"],
	["folio", "Front office"],
	["charge", "Front office"],
	["room-cleaned", "Housekeeping"],
	["problem", "Housekeeping"],
	["linen", "Laundry"],
	["repair", "Maintenance"],
	["parts", "Maintenance"],
	["room-out", "Maintenance"],
	["room-back", "Maintenance"],
	["order", "Kitchen"],
	["item-sold", "Bar"],
	["stock", "Store"],
	["delivery-received", "Store"],
	["payment", "Finance"],
	["expense", "Finance"],
	["day-closed", "Finance"],
	["cash", "Finance"],
	["refund", "Finance"],
	["pos", "Finance"],
	["till", "Finance"],
	["user", "Management"],
	["role", "Management"],
	["access", "Management"],
	["approval", "Management"],
	["shared-device", "Management"],
	["setting", "Management"],
	["notice", "Management"],
	["change-by-platform", "Hospio360"],
];

/** The departments the log can be filtered by, in menu order (the service knows the same names). */
export const ACTIVITY_DEPARTMENTS = [
	"Front office",
	"Housekeeping",
	"Laundry",
	"Maintenance",
	"Kitchen",
	"Bar",
	"Store",
	"Finance",
	"Management",
	"Hospio360",
] as const;

export function departmentOfTopic(
	topic?: string | null,
	actor?: string | null,
): string {
	if (actor && /^(H\.M\.S|Hospio360)( ·|$)/.test(actor)) return "Hospio360";
	const t = (topic ?? "").replace(/^hospio-/, "");
	return TOPIC_DEPARTMENT.find(([p]) => t.startsWith(p))?.[1] ?? "Other";
}

/** Words the summaries keep in capitals. */
const KEEP = new Set([
	"POS",
	"VAT",
	"ID",
	"SMS",
	"PDF",
	"CSV",
	"NGN",
	"OK",
	"ADR",
	"QA",
	"ML",
	"LM",
	"SH",
	"HMS",
]);

const words = (code: string) => {
	const w = code.toLowerCase().replace(/_/g, " ");
	return w.charAt(0).toUpperCase() + w.slice(1);
};

/** Codes inside an event summary (REPAIRS, FRONT_OFFICE) read as words (Repairs, Front office). */
export function readableSummary(summary: string): string {
	return summary.replace(/\b[A-Z]{2,}(?:_[A-Z]+)*\b/g, (code) =>
		KEEP.has(code) ? code : words(code),
	);
}

/** "BookingCreatedEvent" or "booking-created" → "Booking created". */
export function actionOf(eventType: string): string {
	const w = eventType
		.replace(/Event$/, "")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.toLowerCase()
		.trim();
	return w ? w[0].toUpperCase() + w.slice(1) : "Activity";
}
