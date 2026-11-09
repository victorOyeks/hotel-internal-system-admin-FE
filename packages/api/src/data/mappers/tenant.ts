import type {
	Business,
	BusinessSummary,
	Hotel,
	Onboarding,
	SetupTemplate,
} from "@hospio/api/api/schema";
import type {
	BusinessRow,
	BusinessStageKey,
	HotelSummary,
	OnboardingRow,
	OwnerHotelRow,
	SetupTemplateRow,
} from "@hospio/api/data/types";
import {
	ADMIN_ONBOARDING_STEPS,
	OWNER_ONBOARDING_STEPS,
} from "@hospio/api/types";

/** tenant-service responses → the rows the owner Hotels screen and the platform Businesses/Onboarding screens render. */

export const feeModelLabels: Record<string, string> = {
	PERCENT_OF_PAYMENTS: "% of payments",
	PER_ROOM_NIGHT: "Per room night",
	PERCENT_OF_BOOKINGS: "% of bookings",
};

const STAGES: BusinessStageKey[] = [
	"LEAD",
	"ONBOARDING",
	"HANDED_OVER",
	"LIVE",
	"AT_RISK",
	"SUSPENDED",
	"CHURNED",
];
const toStage = (s: string): BusinessStageKey =>
	STAGES.includes(s as BusinessStageKey) ? (s as BusinessStageKey) : "LEAD";
const dateOf = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

/**
 * A hotel as the owner's Hotels screen lists it. `managers` resolves `managerUserId` (or the manager
 * grant) to a name when identity is live; finance figures are 0 until finance-service is wired.
 */
export function toOwnerHotelRow(
	h: Hotel,
	index: number,
	managers: Map<string, string> = new Map(),
): OwnerHotelRow {
	return {
		hotelId: h.id,
		name: h.name,
		city: h.city ?? "",
		code: `#${String(index + 1).padStart(3, "0")}`,
		rooms: h.roomCount,
		occupancy: 0,
		manager:
			(h.managerUserId && managers.get(h.managerUserId)) ||
			managers.get(h.id) ||
			"—",
		managerUserId: h.managerUserId ?? undefined,
		status: h.status,
		address: h.address ?? undefined,
		timezone: h.timezone ?? undefined,
		checkInTime: h.checkInTime ?? undefined,
		checkOutTime: h.checkOutTime ?? undefined,
		starRating: h.starRating ?? undefined,
		revenueToday: 0,
		revenueMonth: 0,
		expensesMonth: 0,
		payrollMonth: 0,
		revenueLastMonth: 0,
		onShift: 0,
		scheduled: 0,
		openIssues: 0,
		lastAction: "—",
		lastAt: "",
		health: 0,
		posProvider: "—",
		grossSettled: 0,
		posFees: 0,
		nextPayout: "",
		nextPayoutAmount: 0,
		phone: h.phone ?? "",
		email: h.email ?? "",
	};
}

export function toHotelSummary(
	h: Hotel,
	managers: Map<string, string> = new Map(),
): HotelSummary {
	return {
		id: h.id,
		name: h.name,
		city: h.city ?? "",
		address: h.address ?? "",
		rooms: h.roomCount,
		timezone: h.timezone ?? "Africa/Lagos",
		occupancy: 0,
		manager:
			(h.managerUserId && managers.get(h.managerUserId)) ||
			managers.get(h.id) ||
			"—",
	};
}

/** One row of the platform Businesses list. Health, adoption, MRR and tickets come from platform-service later. */
export function toBusinessRow(b: BusinessSummary): BusinessRow {
	return {
		id: b.id,
		name: b.name,
		ownerName: b.ownerName ?? "—",
		ownerEmail: b.ownerEmail ?? "",
		stage: toStage(b.stage),
		source: b.source ?? undefined,
		hotels: b.hotels,
		rooms: b.rooms,
		city: b.city ?? "",
		accountManager:
			b.accountManagerName ?? (b.accountManagerId ? "Assigned" : "—"),
		accountManagerId: b.accountManagerId ?? undefined,
		health: 0,
		feeModel: b.feeModel ? (feeModelLabels[b.feeModel] ?? b.feeModel) : "—",
		feeModelKey: b.feeModel ?? undefined,
		feeValue: Number(b.feeValue ?? 0),
		mrr: 0,
		since: dateOf(b.createdAt),
		lastActive: b.lastActiveAt ?? undefined,
		marketer: undefined,
		marketerId: b.marketerId ?? undefined,
		adoption: 0,
		openTickets: 0,
		dueFees: 0,
	};
}

/** The full business (GET /businesses/{id} or /mine) as a BusinessRow, for the business detail page. */
export function toBusinessRowFromBusiness(b: Business): BusinessRow {
	const hotels = b.hotels ?? [];
	return {
		id: b.id,
		name: b.name,
		ownerName: b.ownerName ?? "—",
		ownerEmail: b.ownerEmail ?? "",
		ownerPhone: b.ownerPhone ?? undefined,
		stage: toStage(b.stage),
		source: b.source ?? undefined,
		hotels: b.hotelCount ?? hotels.length,
		rooms: hotels.reduce((sum, h) => sum + h.roomCount, 0),
		city: b.city ?? hotels[0]?.city ?? "",
		accountManager: b.accountManagerId ? "Assigned" : "—",
		accountManagerId: b.accountManagerId ?? undefined,
		health: 0,
		feeModel: b.feeModel ? (feeModelLabels[b.feeModel] ?? b.feeModel) : "—",
		feeModelKey: b.feeModel ?? undefined,
		feeValue: Number(b.feeValue ?? 0),
		mrr: 0,
		since: dateOf(b.createdAt),
		marketerId: b.marketerId ?? undefined,
		adoption: 0,
		openTickets: 0,
		dueFees: 0,
		legalName: b.legalName ?? undefined,
		registrationNumber: b.registrationNumber ?? undefined,
		businessType: b.businessType ?? undefined,
		address: b.address ?? undefined,
		email: b.email ?? undefined,
		phone: b.phone ?? undefined,
		currency: b.currency,
		timezone: b.timezone,
		country: b.country ?? undefined,
		logoUrl: b.logoUrl ?? undefined,
		brandColour: b.brandColour ?? undefined,
		contractStartsOn: b.contractStartsOn ?? undefined,
		contractNotes: b.contractNotes ?? undefined,
		onboarding: b.onboarding ?? undefined,
	};
}

/** The draft's `data`: JSON object, or a JSON string from a draft saved before the contract. */
export function draftData(data: Onboarding["data"]): Record<string, unknown> {
	if (!data) return {};
	if (typeof data === "object") return data;
	try {
		const parsed: unknown = JSON.parse(data);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}

/**
 * tenant-service keeps each step's form under `steps["<number>"]` next to `completedSteps`, `nextAction`
 * and `logins`; the wizards read `data[stepKey]`. Numbered entries are renamed to their step key; anything
 * already named (demo drafts, older saves) is kept.
 */
function normaliseDraft(
	raw: Record<string, unknown>,
	steps: readonly string[],
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(raw)) {
		if (k === "steps" || k === "completedSteps" || k === "legacy") continue;
		out[k] = v;
	}
	const nested = raw.steps;
	if (nested && typeof nested === "object" && !Array.isArray(nested)) {
		for (const [k, v] of Object.entries(nested as Record<string, unknown>)) {
			const n = Number(k);
			const key =
				Number.isInteger(n) && n >= 1 && n <= steps.length ? steps[n - 1] : k;
			if (
				v &&
				typeof v === "object" &&
				!Array.isArray(v) &&
				Object.keys(v as object).length === 0 &&
				out[key]
			)
				continue;
			out[key] = v;
		}
	}
	return out;
}

export function toOnboardingRow(
	o: Onboarding,
	admins: Map<string, string> = new Map(),
): OnboardingRow {
	const source = o.source ?? "BACK_OFFICE";
	const steps =
		source === "SELF_SERVE" ? OWNER_ONBOARDING_STEPS : ADMIN_ONBOARDING_STEPS;
	const data = normaliseDraft(draftData(o.data), steps);
	// tenant-service numbers the steps (1..n); the apps name them. A draft that predates `completedSteps`
	// has completed every step below the current one.
	const completed = o.completedSteps
		? o.completedSteps
				.map((c) => (typeof c === "number" ? steps[c - 1] : c))
				.filter((c): c is string => !!c)
		: steps.slice(0, Math.max(0, o.step - 1));
	return {
		id: o.id ?? o.businessId,
		businessId: o.businessId,
		businessName: o.businessName ?? "—",
		source,
		step: o.step,
		totalSteps: o.totalSteps ?? steps.length,
		completedSteps: [...completed],
		assignedTo:
			o.assignedToName ??
			(o.assignedTo ? (admins.get(o.assignedTo) ?? "Assigned") : "Unassigned"),
		assignedToId: o.assignedTo ?? undefined,
		startedAt: o.startedAt ?? o.updatedAt ?? "",
		updatedAt: o.updatedAt ?? undefined,
		status: o.status,
		nextAction:
			o.nextAction ??
			(o.status === "DONE"
				? "—"
				: `Step ${o.step} of ${o.totalSteps ?? steps.length}`),
		data,
	};
}

export function toSetupTemplateRow(t: SetupTemplate): SetupTemplateRow {
	let settings: Record<string, unknown> = {};
	if (typeof t.settings === "string") {
		try {
			const parsed: unknown = JSON.parse(t.settings);
			if (parsed && typeof parsed === "object")
				settings = parsed as Record<string, unknown>;
		} catch {
			settings = {};
		}
	} else settings = t.settings;
	return {
		id: t.id,
		name: t.name,
		description: t.description ?? "",
		settings,
		active: t.active,
	};
}
