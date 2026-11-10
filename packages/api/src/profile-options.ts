/**
 * My profile options shared by the server page and the client screen (docs/profile.md in hospio-backend). A plain module:
 * never import these from a "use client" file into a server component.
 */

export const LANGUAGES = [
	{ value: "en", label: "English" },
	{ value: "yo", label: "Yoruba" },
	{ value: "ha", label: "Hausa" },
	{ value: "ig", label: "Igbo" },
	{ value: "pcm", label: "Pidgin" },
] as const;

/** Email categories identity keeps per person; in-app notices are always on. */
export const EMAIL_CATEGORIES = [
	{
		key: "bookings",
		label: "Bookings",
		hint: "New, changed and cancelled bookings, arrivals and departures",
	},
	{
		key: "approvals",
		label: "Approvals",
		hint: "Something waiting for my decision, and answers to my requests",
	},
	{
		key: "money",
		label: "Money",
		hint: "Payments, refunds, tills, day close and banking",
	},
	{
		key: "stock",
		label: "Stock",
		hint: "Low stock, requests, deliveries and counts",
	},
	{
		key: "maintenance",
		label: "Maintenance",
		hint: "Work orders, rooms out of order and preventive jobs",
	},
	{
		key: "staff",
		label: "Staff",
		hint: "Leave, shift swaps, the rota and people changes",
	},
	{
		key: "reports",
		label: "Reports",
		hint: "Daily and monthly reports and the night audit",
	},
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number]["key"];

export type ProfileSession = {
	id: string;
	kind: "PASSWORD" | "PIN";
	device: string;
	deviceName: string | null;
	location: string | null;
	signedInAt: string | null;
	lastUsedAt: string | null;
	current: boolean;
};

export type TwoStepState = {
	enabled: boolean;
	enabledAt: string | null;
	recoveryCodesLeft: number;
	required: boolean;
};

export type EmailPrefs = Record<EmailCategory, boolean>;

/** The photo URL for an <img> (the app's own route adds the session's bearer); null without a photo. */
export function photoUrl(
	userId: string,
	photoVersion: number | null | undefined,
): string | null {
	return photoVersion
		? `/api/people/${encodeURIComponent(userId)}/photo?v=${photoVersion}`
		: null;
}

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
