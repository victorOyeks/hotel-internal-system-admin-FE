import type { Hotel, ListItem, SetupSection } from "@hospio/api/api/schema";
import type { HotelSetupSection } from "@hospio/api/data/types";

/**
 * hotel-config's `section → key → value` catalogue (docs/onboarding.md) ↔ the sections and fields the
 * Hotel setup screen renders. Field keys are the API keys wherever the screen does not care, so the
 * save goes back without a second map; the exceptions (brand preview keys, list fields) are below.
 */

type FieldType = HotelSetupSection["fields"][number]["type"];
type FieldDef = {
	key: string;
	label: string;
	type: FieldType;
	options?: string[];
	help?: string;
	default: unknown /** API key when it differs from `key`. */;
	api?: string /** For `list` fields: the hotel-config list this field edits. */;
	list?: SetupListName;
};
type SectionDef = {
	key: string;
	api?: string;
	title: string;
	description: string;
	icon: string;
	ownerOnly?: boolean;
	fields: FieldDef[];
};

/** Screen section key → API section. Sections made only of lists (reasons) have no API section. */
export const sectionKeyToApi: Record<string, string | undefined> = {
	basics: "BASICS",
	brand: "BRAND",
	rooms: "STAY_RULES",
	money: "PAYMENTS",
	approvals: "APPROVAL_LIMITS",
	housekeeping: "HOUSEKEEPING",
	outlets: "OUTLETS",
	restaurants: undefined,
	messaging: "MESSAGING",
	staff: "STAFF",
	night: "NIGHT_AUDIT",
	pos: "POS",
	taxes: "TAXES_CURRENCY",
	reasons: undefined,
	danger: undefined,
};

export const SETUP_LISTS = [
	"CANCEL_REASONS",
	"DISCOUNT_REASONS",
	"VOID_REASONS",
	"WRITE_OFF_REASONS",
	"SHIFTS",
	"DEPARTMENTS",
	"PUBLIC_AREAS",
	"HOUSEKEEPING_CHECKLIST",
	"PAYMENT_METHODS",
] as const;
export type SetupListName = (typeof SETUP_LISTS)[number];

const TIMEZONES = [
	"Africa/Lagos",
	"Africa/Accra",
	"Africa/Nairobi",
	"Africa/Johannesburg",
	"Europe/London",
];

export const SETUP_CATALOGUE: SectionDef[] = [
	{
		key: "brand",
		api: "BRAND",
		title: "Brand & colours",
		description:
			"Your logo and colours on every screen your staff and guests see",
		icon: "palette",
		fields: [
			{
				key: "primary",
				api: "primaryColour",
				label: "Brand colour",
				type: "text",
				default: "#4c091e",
				help: "Buttons, the sidebar and highlights",
			},
			{
				key: "logoText",
				api: "shortName",
				label: "Short name on the sidebar",
				type: "text",
				default: "",
			},
			{ key: "logoUrl", label: "Logo URL", type: "text", default: "" },
			{
				key: "darkNav",
				api: "darkSidebar",
				label: "Dark sidebar",
				type: "toggle",
				default: true,
			},
		],
	},
	{
		key: "basics",
		api: "BASICS",
		title: "Hotel basics",
		description:
			"The times your day runs on and what prints at the foot of receipts",
		icon: "building",
		fields: [
			{
				key: "checkInTime",
				label: "Check-in from",
				type: "time",
				default: "14:00",
			},
			{
				key: "checkOutTime",
				label: "Check-out by",
				type: "time",
				default: "12:00",
			},
			{
				key: "timezone",
				label: "Time zone",
				type: "select",
				options: TIMEZONES,
				default: "Africa/Lagos",
			},
			{
				key: "receiptFooter",
				label: "Receipt footer",
				type: "text",
				default: "",
				help: "A line of thanks or your tax number",
			},
		],
	},
	{
		key: "rooms",
		api: "STAY_RULES",
		title: "Rooms & stay rules",
		description: "Overbooking, late check-out and the public areas staff clean",
		icon: "bed",
		fields: [
			{
				key: "allowOverbooking",
				label: "Allow bookings past capacity",
				type: "toggle",
				default: false,
				help: "Front office can still book when every room of a type is taken",
			},
			{
				key: "lateCheckoutFee",
				label: "Late check-out fee",
				type: "money",
				default: 0,
			},
			{
				key: "maxStayNights",
				label: "Longest stay (nights)",
				type: "number",
				default: 30,
			},
			{
				key: "areas",
				list: "PUBLIC_AREAS",
				label: "Public areas",
				type: "list",
				default: [],
			},
		],
	},
	{
		key: "money",
		api: "PAYMENTS",
		title: "Money & payments",
		description: "Payment methods, deposits and the account you bank into",
		icon: "wallet",
		fields: [
			{ key: "allowCash", label: "Accept cash", type: "toggle", default: true },
			{
				key: "allowCard",
				label: "Accept card (POS)",
				type: "toggle",
				default: true,
			},
			{
				key: "allowTransfer",
				label: "Accept bank transfer",
				type: "toggle",
				default: true,
			},
			{
				key: "receipts",
				label: "Default receipt channel",
				type: "select",
				options: ["WHATSAPP", "EMAIL", "SMS", "PRINT", "NONE"],
				default: "WHATSAPP",
			},
			{
				key: "depositPct",
				label: "Deposit to hold a booking",
				type: "percent",
				default: 0,
			},
			{
				key: "tillFloat",
				label: "Default till float",
				type: "money",
				default: 0,
			},
			{ key: "bankName", label: "Bank", type: "text", default: "" },
			{
				key: "bankAccount",
				label: "Account number",
				type: "text",
				default: "",
			},
			{
				key: "methods",
				list: "PAYMENT_METHODS",
				label: "Payment methods",
				type: "list",
				default: [],
			},
		],
	},
	{
		key: "housekeeping",
		api: "HOUSEKEEPING",
		title: "Housekeeping",
		description: "Checklist, inspection and minibar rules",
		icon: "spray",
		fields: [
			{
				key: "inspectDepartures",
				label: "Supervisor inspects every departure room",
				type: "toggle",
				default: true,
			},
			{
				key: "minibarToFolio",
				label: "Minibar charges post to the folio",
				type: "toggle",
				default: true,
			},
			{
				key: "checklist",
				list: "HOUSEKEEPING_CHECKLIST",
				label: "Cleaning checklist",
				type: "list",
				default: [],
			},
		],
	},
	{
		key: "outlets",
		api: "OUTLETS",
		title: "Restaurant & bar",
		description: "Tabs and room charging",
		icon: "chef",
		fields: [
			{
				key: "roomCharge",
				label: "Guests can charge to their room",
				type: "toggle",
				default: true,
			},
			{ key: "tabs", label: "Bar tabs allowed", type: "toggle", default: true },
			{
				key: "tabLimit",
				label: "Tab limit before payment",
				type: "money",
				default: 50000,
			},
		],
	},
	{
		// Not a hotel-config section: the outlets and their tables live in fnb-service, edited by a panel of their own.
		key: "restaurants",
		title: "Restaurants & tables",
		description:
			"Your kitchens and bars, the store each draws from, and their tables",
		icon: "chef",
		fields: [],
	},
	{
		key: "messaging",
		api: "MESSAGING",
		title: "Guest messaging",
		description: "Which messages go out and on which channel",
		icon: "message",
		fields: [
			{
				key: "whatsappNumber",
				label: "WhatsApp number",
				type: "text",
				default: "",
			},
			{
				key: "sendConfirmation",
				label: "Send booking confirmation",
				type: "toggle",
				default: true,
			},
			{
				key: "arrivalMessage",
				label: "Send arrival-day message",
				type: "toggle",
				default: true,
			},
			{
				key: "sendReceipts",
				label: "Send receipts automatically",
				type: "toggle",
				default: true,
			},
		],
	},
	{
		key: "staff",
		api: "STAFF",
		title: "Staff & shifts",
		description: "Shift times, departments and lateness",
		icon: "users",
		fields: [
			{
				key: "shifts",
				list: "SHIFTS",
				label: "Shifts",
				type: "list",
				default: [],
			},
			{
				key: "departments",
				list: "DEPARTMENTS",
				label: "Departments",
				type: "list",
				default: [],
			},
			{
				key: "lateMinutes",
				label: "Mark late after (minutes)",
				type: "number",
				default: 15,
			},
		],
	},
	{
		key: "night",
		api: "NIGHT_AUDIT",
		title: "Night audit",
		description: "When the day closes and what must be done first",
		icon: "moon",
		fields: [
			{
				key: "closeTime",
				label: "Day closes at",
				type: "time",
				default: "23:00",
			},
			{
				key: "tillsClosedFirst",
				label: "All tills must be closed first",
				type: "toggle",
				default: true,
			},
			{
				key: "arrivalsResolvedFirst",
				label: "Every arrival resolved first",
				type: "toggle",
				default: true,
			},
		],
	},
	{
		key: "pos",
		api: "POS",
		title: "Payments & POS",
		description:
			"Card terminals, providers and what happens when a terminal is offline",
		icon: "credit-card",
		fields: [
			{
				key: "provider",
				label: "POS provider",
				type: "select",
				options: ["logging", "moniepoint", "opay", "paystack"],
				default: "logging",
			},
			{
				key: "offlineCash",
				label: "Allow cash when a terminal is offline",
				type: "toggle",
				default: true,
			},
			{
				key: "receiptChannel",
				label: "Default receipt channel",
				type: "select",
				options: ["PRINT", "WHATSAPP", "EMAIL", "SMS", "NONE"],
				default: "PRINT",
			},
		],
	},
	{
		key: "reasons",
		title: "Reasons & lists",
		description:
			"The reason lists staff pick from when they cancel, discount, void or write off",
		icon: "list",
		fields: [
			{
				key: "cancel",
				list: "CANCEL_REASONS",
				label: "Cancellation reasons",
				type: "list",
				default: [],
			},
			{
				key: "discount",
				list: "DISCOUNT_REASONS",
				label: "Discount reasons",
				type: "list",
				default: [],
			},
			{
				key: "void",
				list: "VOID_REASONS",
				label: "Void reasons",
				type: "list",
				default: [],
			},
			{
				key: "writeoff",
				list: "WRITE_OFF_REASONS",
				label: "Write-off reasons",
				type: "list",
				default: [],
			},
		],
	},
	{
		key: "taxes",
		api: "TAXES_CURRENCY",
		title: "Taxes & currency",
		description: "Set by the owner for the whole business",
		icon: "coins",
		ownerOnly: true,
		fields: [
			{
				key: "currency",
				label: "Currency",
				type: "select",
				options: ["NGN", "GHS", "KES", "USD", "GBP"],
				default: "NGN",
			},
			{ key: "vatPct", label: "VAT", type: "percent", default: 7.5 },
			{
				key: "serviceChargePct",
				label: "Service charge",
				type: "percent",
				default: 0,
			},
			{
				key: "consumptionTaxPct",
				label: "Consumption tax",
				type: "percent",
				default: 0,
			},
			{
				key: "pricesIncludeTax",
				label: "Room prices include tax",
				type: "toggle",
				default: true,
			},
		],
	},
	{
		key: "approvals",
		api: "APPROVAL_LIMITS",
		title: "Approval limits",
		description: "What needs a manager or the owner before it happens",
		icon: "shield",
		ownerOnly: true,
		fields: [
			{
				key: "managerExpenseLimit",
				label: "Expenses above this need the owner",
				type: "money",
				default: 200000,
				help: "Below it the manager approves",
			},
			{
				key: "ownerExpenseLimit",
				label: "Owner's own limit",
				type: "money",
				default: 0,
				help: "0 means no limit",
			},
			{
				key: "discountPct",
				label: "Discounts above this need the manager",
				type: "percent",
				default: 10,
			},
			{
				key: "refundsNeedOwner",
				label: "Refunds need the owner",
				type: "toggle",
				default: false,
			},
			{
				key: "rateChangesNeedOwner",
				label: "Room price changes need the owner",
				type: "toggle",
				default: true,
			},
		],
	},
	{
		key: "danger",
		title: "Ownership & danger zone",
		description: "Pause or close this hotel",
		icon: "alert",
		ownerOnly: true,
		fields: [
			{
				key: "status",
				label: "Hotel status",
				type: "select",
				options: ["ACTIVE", "PAUSED", "CLOSED"],
				default: "ACTIVE",
			},
		],
	},
];

/** The lists each screen section edits: section → field key → list name. */
export const listFields: Record<
	string,
	Record<string, SetupListName>
> = Object.fromEntries(
	SETUP_CATALOGUE.map((s) => [
		s.key,
		Object.fromEntries(
			s.fields.flatMap((f) => (f.list ? [[f.key, f.list] as const] : [])),
		),
	]),
);

/** Screen field key → API key, per section, where they differ (the brand preview reads `primary`/`logoText`). */
export const fieldKeyToApi: Record<
	string,
	Record<string, string>
> = Object.fromEntries(
	SETUP_CATALOGUE.map((s) => [
		s.key,
		Object.fromEntries(
			s.fields.filter((f) => f.api).map((f) => [f.key, f.api as string]),
		),
	]),
);

const typeOf = (v: unknown): FieldType =>
	typeof v === "boolean" ? "toggle" : typeof v === "number" ? "number" : "text";
const labelOf = (key: string) =>
	key
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (c) => c.toUpperCase())
		.trim();

/**
 * GET /setup (+ the lists) → the sections the screen renders. Known keys get their label and control;
 * unknown keys in a known section are shown as text/number/toggle by value so nothing is lost.
 */
export function toSetupSections(
	setup: SetupSection,
	lists: Partial<Record<SetupListName, ListItem[]>>,
	hotel?: Pick<Hotel, "status"> | null,
): HotelSetupSection[] {
	return SETUP_CATALOGUE.map((def) => {
		const values = def.api ? (setup[def.api] ?? {}) : {};
		const fields: HotelSetupSection["fields"] = def.fields.map((f) => {
			if (f.list) {
				const items = (lists[f.list] ?? [])
					.filter((i) => i.active)
					.sort((a, b) => a.sortOrder - b.sortOrder);
				return {
					key: f.key,
					label: f.label,
					type: "list",
					value: items.map((i) => i.label),
					help: f.help,
				};
			}
			if (def.key === "danger" && f.key === "status")
				return {
					key: f.key,
					label: f.label,
					type: f.type,
					value: hotel?.status ?? f.default,
					options: f.options,
				};
			const raw = values[f.api ?? f.key];
			const value = raw === undefined || raw === null ? f.default : raw;
			const options =
				f.type === "select" && f.options
					? Array.from(new Set([...f.options, String(value)]))
					: f.options;
			return {
				key: f.key,
				label: f.label,
				type: f.type,
				value,
				options,
				help: f.help,
			};
		});
		const known = new Set(def.fields.map((f) => f.api ?? f.key));
		for (const [key, value] of Object.entries(values)) {
			if (!known.has(key))
				fields.push({ key, label: labelOf(key), type: typeOf(value), value });
		}
		return {
			key: def.key,
			title: def.title,
			description: def.description,
			icon: def.icon,
			ownerOnly: def.ownerOnly,
			fields,
		};
	});
}

/**
 * The screen's values for one section, split into what goes to `PUT /setup/{section}` (API keys) and
 * what goes to the lists routes (labels per list). `danger` saves nothing here: it is the hotel's status.
 */
export function toApiSetup(
	sectionKey: string,
	values: Record<string, unknown>,
): {
	section?: string;
	settings: Record<string, unknown>;
	lists: { listName: SetupListName; labels: string[] }[];
} {
	const section = sectionKeyToApi[sectionKey];
	const aliases = fieldKeyToApi[sectionKey] ?? {};
	const lists = listFields[sectionKey] ?? {};
	const settings: Record<string, unknown> = {};
	const listSaves: { listName: SetupListName; labels: string[] }[] = [];
	for (const [key, value] of Object.entries(values)) {
		if (lists[key]) {
			listSaves.push({
				listName: lists[key],
				labels: Array.isArray(value)
					? value
							.map(String)
							.map((s) => s.trim())
							.filter(Boolean)
					: [],
			});
		} else if (section && sectionKey !== "danger") {
			settings[aliases[key] ?? key] = value;
		}
	}
	return { section, settings, lists: listSaves };
}
