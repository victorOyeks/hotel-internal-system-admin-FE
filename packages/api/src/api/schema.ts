import { createSchema } from "@better-fetch/fetch";
import { z } from "zod";
import { adminRoutes, Deliveries } from "./routes-admin";
import { deviceRoutes } from "./routes-devices";
import { fnbRoutes } from "./routes-fnb";
import { inventoryRoutes } from "./routes-inventory";
import { lmRoutes } from "./routes-lm";
import { mlRoutes } from "./routes-ml";
import { opsRoutes } from "./routes-ops";
import { ownerRoutes } from "./routes-owner";
import { paymentRoutes } from "./routes-payments";
import { profileRoutes } from "./routes-profile";
import { pagedOf, pageParams } from "./paged";

/**
 * The new hospio-backend behind the gateway. Every service is reachable at
 * `${NEXT_PUBLIC_API_URL}/<service>/...` and answers with the same envelope.
 * Add an endpoint here when a screen needs it; the types flow from these schemas.
 */

const envelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		requestTime: z.string(),
		requestType: z.string(),
		referenceId: z.string(),
		status: z.boolean(),
		message: z.string().nullable(),
		data,
	});

export const ApiError = z.object({
	requestTime: z.string().optional(),
	referenceId: z.string().optional(),
	status: z.boolean().optional(),
	message: z.string().optional(),
	data: z.unknown().optional(),
});

const paged = <T extends z.ZodTypeAny>(item: T) =>
	z.object({
		content: z.array(item),
		number: z.number(),
		size: z.number(),
		totalElements: z.number(),
		totalPages: z.number(),
		first: z.boolean(),
		last: z.boolean(),
		empty: z.boolean(),
	});

// ---- identity ------------------------------------------------------------------------------------

export const Role = z.enum([
	"OWNER",
	"MANAGER",
	"FRONT_OFFICE",
	"HOUSEKEEPING",
	"LAUNDRY",
	"MAINTENANCE",
	"KITCHEN",
	"BAR",
	"INVENTORY",
	"FINANCE",
	"SUPER_ADMIN",
	"SUPPORT",
	"FINANCE_ADMIN",
	"MARKETER",
]);

export const AuthResponse = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
	roles: z.array(z.string()),
	mustChangePassword: z.boolean(),
	twoStepRequired: z.boolean(),
	/** Sign-up echoes the phone code while SMS is not connected (DELIVERIES_ECHO on staging). */
	deliveries: Deliveries,
});

export const Me = z.object({
	id: z.string(),
	fullName: z.string(),
	email: z.string(),
	phoneNumber: z.string().nullable(),
	businessId: z.string().nullable(),
	userStatus: z.string(),
	roles: z.array(z.string()),
	roleLevels: z.array(
		z.object({
			role: z.string(),
			level: z.string(),
			hotelId: z.string().nullable(),
		}),
	),
	verified: z.boolean(),
	changedPassword: z.boolean(),
	twoStepEnabled: z.boolean(),
	hotelIds: z.array(z.string()),
	createdAt: z.string(),
	/** A PIN is set for shared devices (docs/shared-devices.md). */
	hasPin: z.boolean().nullable().optional(),
	/** en, yo, ha, ig or pcm (docs/profile.md). */
	language: z.string().nullable().optional(),
	/** Changes whenever the photo does; null means no photo (initials instead). */
	photoVersion: z.number().nullable().optional(),
	passwordChangedAt: z.string().nullable().optional(),
	jobTitle: z.string().nullable().optional(),
});

export const InviteStatus = z.enum(["PENDING", "ACCEPTED", "EXPIRED", "NONE"]);

export const Grant = z.object({
	id: z.string(),
	role: z.string(),
	level: z.string(),
	hotelId: z.string().nullable(),
	paused: z.boolean(),
	expiresAt: z.string().nullable().optional(),
	/** Last day a temporary role works (Lagos, yyyy-mm-dd); it ends at midnight after it. */
	until: z.string().nullable().optional(),
	grantedBy: z.string().nullable().optional(),
});

export const UserSummary = z.object({
	id: z.string(),
	fullName: z.string(),
	email: z.string(),
	phone: z.string().nullable(),
	businessId: z.string().nullable().optional(),
	status: z.string(),
	grants: z.array(Grant),
	mustChangePassword: z.boolean().nullable().optional(),
	twoStepEnabled: z.boolean().nullable().optional(),
	lastSignInAt: z.string().nullable().optional(),
	createdAt: z.string().nullable().optional(),
	inviteStatus: InviteStatus.nullable().optional(),
	/** A timed pause ends by itself at this instant; null while it lasts until someone resumes it (docs/owner-portal.md). */
	pausedUntil: z.string().nullable().optional(),
	statusReason: z.string().nullable().optional(),
	statusChangedBy: z.string().nullable().optional(),
	statusChangedAt: z.string().nullable().optional(),
	jobTitle: z.string().nullable().optional(),
	/** A PIN is set for shared devices; a manager can reset it. */
	hasPin: z.boolean().nullable().optional(),
	/** Null when there is no photo: /api/people/<id>/photo?v=<photoVersion> otherwise. */
	photoVersion: z.number().nullable().optional(),
});

/** The temporary password and invite token are shown once; the invite link opens /accept-invite?token=. */
export const UserCreated = z.object({
	userId: z.string(),
	temporaryPassword: z.string().nullable(),
	temporaryPasswordExpiresAt: z.string().nullable(),
	inviteToken: z.string().nullable().optional(),
	inviteExpiresAt: z.string().nullable().optional(),
	/** The invite email and SMS the platform would have sent (echoed while no provider is connected). */
	deliveries: Deliveries,
});

export const Invite = z.object({
	fullName: z.string(),
	email: z.string(),
	role: z.string(),
	businessName: z.string().nullable(),
	hotelName: z.string().nullable().optional(),
	expiresAt: z.string(),
	accepted: z.boolean(),
});

export const CreateUserRequest = z.object({
	fullName: z.string(),
	email: z.string(),
	phone: z.string().nullable().optional(),
	role: z.string(),
	level: z.string().nullable().optional(),
	hotelId: z.string().nullable().optional(),
	businessId: z.string().nullable().optional(),
	language: z.string().nullable().optional(),
});

export const GrantRoleRequest = z.object({
	role: z.string(),
	level: z.string().nullable().optional(),
	hotelId: z.string().nullable().optional(),
	expiresAt: z.string().nullable().optional(),
	/** Last day the role works (yyyy-mm-dd, Lagos); leave out for a role with no end. */
	until: z.string().nullable().optional(),
});

export const AccessChangeRequest = z.object({
	change: z.enum(["CHANGE_LEVEL", "PAUSE", "RESUME", "SET_UNTIL", "REMOVE"]),
	level: z.string().nullable().optional(),
	reason: z.string().nullable().optional(),
	/** SET_UNTIL: the new last day, or null to make the role permanent. */
	until: z.string().nullable().optional(),
	/** REMOVE: take away the person's only active role (they are leaving); refused otherwise. */
	allowLastRole: z.boolean().nullable().optional(),
});

// ---- tenant --------------------------------------------------------------------------------------

export const HotelStatus = z.enum(["ACTIVE", "PAUSED", "CLOSED"]);
export const BusinessStage = z.enum([
	"LEAD",
	"ONBOARDING",
	"HANDED_OVER",
	"LIVE",
	"AT_RISK",
	"SUSPENDED",
	"CHURNED",
]);
export const BusinessSource = z.enum(["SELF_SERVE", "BACK_OFFICE"]);
export const FeeModel = z.enum([
	"PERCENT_OF_PAYMENTS",
	"PER_ROOM_NIGHT",
	"PERCENT_OF_BOOKINGS",
]);
export const OnboardingStatus = z.enum([
	"IN_PROGRESS",
	"READY_FOR_HANDOVER",
	"DONE",
]);

export const Hotel = z.object({
	id: z.string(),
	businessId: z.string(),
	name: z.string(),
	city: z.string().nullable(),
	address: z.string().nullable(),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	timezone: z.string().nullable(),
	status: HotelStatus,
	roomCount: z.number(),
	checkInTime: z.string().nullable().optional(),
	checkOutTime: z.string().nullable().optional(),
	starRating: z.number().nullable().optional(),
	managerUserId: z.string().nullable().optional(),
});

export const HotelRequest = z.object({
	name: z.string(),
	city: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
	checkInTime: z.string().nullable().optional(),
	checkOutTime: z.string().nullable().optional(),
	starRating: z.number().nullable().optional(),
	/** Platform callers name the business; owners are inside theirs. */
	businessId: z.string().nullable().optional(),
});

/** The wizard steps by name, in order: the owner's four and the back office's ten (see types.ts). */
const OWNER_STEP_NAMES = ["business", "hotel", "rooms", "manager"] as const;
const ADMIN_STEP_NAMES = [
	"business",
	"owner",
	"fee",
	"hotels",
	"rooms",
	"template",
	"people",
	"connections",
	"golive",
	"handover",
] as const;

/** tenant-service numbers the completed steps (1..n); the apps name them. */
export function stepNames(
	completed: (string | number)[] | null | undefined,
	source: string | null | undefined,
): string[] {
	const names = source === "SELF_SERVE" ? OWNER_STEP_NAMES : ADMIN_STEP_NAMES;
	return (completed ?? [])
		.map((c) => (typeof c === "number" ? names[c - 1] : c))
		.filter((c): c is string => !!c);
}

/**
 * Where the business is in its onboarding, as GET /businesses/mine and /businesses/{id} carry it.
 * `completedSteps` arrives as step numbers; `Business` turns them into step names.
 */
export const BusinessOnboarding = z.object({
	status: OnboardingStatus,
	step: z.number(),
	completedSteps: z.array(z.union([z.string(), z.number()])),
});

export const Business = z
	.object({
		id: z.string(),
		name: z.string(),
		legalName: z.string().nullable().optional(),
		registrationNumber: z.string().nullable().optional(),
		businessType: z.string().nullable().optional(),
		ownerUserId: z.string().nullable().optional(),
		ownerName: z.string().nullable(),
		ownerEmail: z.string().nullable().optional(),
		ownerPhone: z.string().nullable().optional(),
		stage: z.string(),
		source: BusinessSource.nullable().optional(),
		accountManagerId: z.string().nullable().optional(),
		marketerId: z.string().nullable().optional(),
		feeModel: z.string().nullable().optional(),
		feeValue: z.number().nullable().optional(),
		currency: z.string(),
		country: z.string().nullable().optional(),
		timezone: z.string(),
		city: z.string().nullable().optional(),
		address: z.string().nullable().optional(),
		email: z.string().nullable().optional(),
		phone: z.string().nullable().optional(),
		logoUrl: z.string().nullable().optional(),
		brandColour: z.string().nullable().optional(),
		contractStartsOn: z.string().nullable().optional(),
		contractNotes: z.string().nullable().optional(),
		hotelCount: z.number().nullable().optional(),
		suspendedAt: z.string().nullable().optional(),
		suspensionReason: z.string().nullable().optional(),
		createdAt: z.string().nullable().optional(),
		hotels: z.array(Hotel).nullable().optional(),
		onboarding: BusinessOnboarding.nullable().optional(),
	})
	.transform((b) => ({
		...b,
		onboarding: b.onboarding
			? {
					...b.onboarding,
					completedSteps: stepNames(b.onboarding.completedSteps, b.source),
				}
			: b.onboarding,
	}));

/** One row of GET /tenant/businesses (platform list). */
export const BusinessSummary = z.object({
	id: z.string(),
	name: z.string(),
	stage: z.string(),
	source: BusinessSource.nullable().optional(),
	city: z.string().nullable(),
	hotels: z.number(),
	rooms: z.number(),
	ownerName: z.string().nullable(),
	ownerEmail: z.string().nullable(),
	accountManagerId: z.string().nullable(),
	accountManagerName: z.string().nullable().optional(),
	marketerId: z.string().nullable(),
	feeModel: z.string().nullable(),
	feeValue: z.number().nullable(),
	createdAt: z.string(),
	lastActiveAt: z.string().nullable().optional(),
});

/** PUT /businesses/mine (owner profile edits). */
export const MyBusinessRequest = z.object({
	name: z.string(),
	legalName: z.string().nullable().optional(),
	registrationNumber: z.string().nullable().optional(),
	businessType: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	logoUrl: z.string().nullable().optional(),
	brandColour: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
});

/** POST /businesses and PUT /businesses/{id} (platform). */
export const BusinessRequest = z.object({
	name: z.string(),
	legalName: z.string().nullable().optional(),
	registrationNumber: z.string().nullable().optional(),
	businessType: z.string().nullable().optional(),
	ownerName: z.string(),
	ownerEmail: z.string(),
	ownerPhone: z.string().nullable().optional(),
	feeModel: z.string().nullable().optional(),
	feeValue: z.number().nullable().optional(),
	currency: z.string().nullable().optional(),
	country: z.string().nullable().optional(),
	timezone: z.string().nullable().optional(),
	marketerId: z.string().nullable().optional(),
	accountManagerId: z.string().nullable().optional(),
	city: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	logoUrl: z.string().nullable().optional(),
	brandColour: z.string().nullable().optional(),
	contractStartsOn: z.string().nullable().optional(),
	contractNotes: z.string().nullable().optional(),
	source: BusinessSource.nullable().optional(),
});

const JsonObject = z.record(z.string(), z.unknown());

/** The step data is JSON; a draft written before the contract may still carry it as a string. */
const DraftData = z.union([JsonObject, z.string()]).nullable().optional();

export const Onboarding = z.object({
	id: z.string().nullable().optional(),
	businessId: z.string(),
	businessName: z.string().nullable(),
	source: BusinessSource.nullable().optional(),
	step: z.number(),
	totalSteps: z.number().nullable().optional(),
	completedSteps: z
		.array(z.union([z.string(), z.number()]))
		.nullable()
		.optional(),
	assignedTo: z.string().nullable(),
	assignedToName: z.string().nullable().optional(),
	status: OnboardingStatus,
	nextAction: z.string().nullable().optional(),
	startedAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	data: DraftData,
});

/** A login created during onboarding; the handover pack lists them. */
export const CreatedLogin = z.object({
	userId: z.string(),
	fullName: z.string().nullable().optional(),
	email: z.string(),
	role: z.string().nullable().optional(),
	hotelId: z.string().nullable().optional(),
	hotelName: z.string().nullable().optional(),
	temporaryPassword: z.string().nullable().optional(),
	temporaryPasswordExpiresAt: z.string().nullable().optional(),
	expiresAt: z.string().nullable().optional(),
	inviteToken: z.string().nullable().optional(),
	inviteExpiresAt: z.string().nullable().optional(),
});

export const Handover = z.object({
	id: z.string().nullable().optional(),
	businessId: z.string(),
	packKey: z.string().nullable().optional(),
	sentAt: z.string().nullable().optional(),
	sentBy: z.string().nullable().optional(),
	acceptedAt: z.string().nullable().optional(),
	ownerLogin: CreatedLogin.nullable(),
	hotels: z.array(Hotel).nullable().optional(),
	logins: z.array(CreatedLogin).nullable().optional(),
});

export const SetupTemplate = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	/** JSON text: `{ "SECTION": { key: value }, "lists": { LIST_NAME: [labels] } }`. */
	settings: z.union([z.string(), JsonObject]),
	active: z.boolean(),
});

// ---- hotel-config --------------------------------------------------------------------------------

/** GET /hotel-config/setup: section → key → value. */
export const SetupSection = z.record(z.string(), JsonObject);

export const ListItem = z.object({
	id: z.string(),
	businessId: z.string().nullable().optional(),
	hotelId: z.string().nullable().optional(),
	listName: z.string(),
	code: z.string().nullable(),
	label: z.string(),
	sortOrder: z.number(),
	active: z.boolean(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
});

/** A hotel's price list for things charged outside F&B (Hotel setup): minibar, laundry, extras. */
export const PriceListEntry = z.object({
	id: z.string(),
	name: z.string(),
	price: z.number(),
	taxRate: z.number().nullable().optional(),
	chargeCategory: z.string().nullable().optional(),
	active: z.boolean(),
});
export const PriceList = z.object({
	id: z.string(),
	kind: z.string(),
	name: z.string(),
	active: z.boolean(),
	items: z.array(PriceListEntry),
});
export const PriceListItemInput = z.object({
	name: z.string(),
	price: z.number(),
	taxRate: z.number().nullable().optional(),
	chargeCategory: z.string().nullable().optional(),
	active: z.boolean().nullable().optional(),
});

export const ListItemRequest = z.object({
	label: z.string(),
	code: z.string().nullable().optional(),
	sortOrder: z.number().nullable().optional(),
	active: z.boolean().nullable().optional(),
});

// ---- payment terminals ---------------------------------------------------------------------------

export const Terminal = z.object({
	id: z.string(),
	businessId: z.string().nullable().optional(),
	hotelId: z.string().nullable().optional(),
	name: z.string(),
	provider: z.string(),
	terminalRef: z.string(),
	status: z.enum(["ONLINE", "OFFLINE", "RETIRED"]),
	lastSeenAt: z.string().nullable().optional(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
});

export const TerminalRequest = z.object({
	name: z.string(),
	provider: z.string(),
	terminalRef: z.string(),
});

// ---- reservation ---------------------------------------------------------------------------------

export const Booking = z.object({
	id: z.string(),
	reference: z.string(),
	hotelId: z.string().nullable(),
	guestId: z.string(),
	guestName: z.string(),
	roomTypeId: z.string(),
	roomTypeName: z.string().nullable(),
	roomId: z.string().nullable(),
	roomNumber: z.string().nullable(),
	checkInDate: z.string(),
	checkOutDate: z.string(),
	nights: z.number(),
	expectedArrival: z.string().nullable().optional(),
	adults: z.number(),
	children: z.number(),
	status: z.enum([
		"BOOKED",
		"CHECKED_IN",
		"CHECKED_OUT",
		"CANCELLED",
		"NO_SHOW",
	]),
	priceKind: z.enum(["NORMAL", "SPECIAL", "COMPLIMENTARY"]),
	nightlyRate: z.number(),
	totalAmount: z.number(),
	amountPaid: z.number().nullable().optional(),
	paymentPlan: z.enum([
		"PAY_IN_FULL",
		"DEPOSIT_50",
		"PAY_AT_CHECKOUT",
		"ORGANIZATION",
	]),
	amountDueNow: z.number(),
	organizationId: z.string().nullable(),
	source: z.string().nullable(),
	notes: z.string().nullable(),
	checkedInAt: z.string().nullable(),
	checkedOutAt: z.string().nullable(),
	lateCheckoutUntil: z.string().nullable(),
	cancelledAt: z.string().nullable(),
	cancellationReason: z.string().nullable(),
	createdAt: z.string().nullable(),
	/** What the guest was sent about a change of dates (echoed on staging). */
	deliveries: Deliveries,
	/** The guest's phone and email, on list rows (docs/pagination.md). */
	guestPhone: z.string().nullable().optional(),
	guestEmail: z.string().nullable().optional(),
});

export const Guest = z.object({
	id: z.string(),
	fullName: z.string(),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	idType: z.string().nullable(),
	idNumber: z.string().nullable(),
	nationality: z.string().nullable(),
	preferences: z.string().nullable(),
	notes: z.string().nullable(),
	blacklisted: z.boolean(),
	stays: z.number(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
});

export const GuestRequest = z.object({
	fullName: z.string(),
	phone: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	idType: z.string().nullable().optional(),
	idNumber: z.string().nullable().optional(),
	nationality: z.string().nullable().optional(),
	preferences: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

export const Availability = z.object({
	roomTypeId: z.string(),
	roomTypeName: z.string().nullable(),
	roomsOfType: z.number(),
	booked: z.number(),
	available: z.number(),
	nightlyRate: z.number().nullable(),
	freeRoomIds: z.array(z.string()),
	/** A guest due out today is still checked in: the room can go to an arrival, who checks in once that guest is checked out. */
	turnoverRoomIds: z.array(z.string()).optional(),
});

export const Today = z.object({
	arrivals: z.array(Booking),
	departures: z.array(Booking),
	inHouse: z.array(Booking),
});

// ---- property & housekeeping ---------------------------------------------------------------------

export const SpecialPrice = z.object({
	id: z.string(),
	roomTypeId: z.string().nullable().optional(),
	name: z.string(),
	price: z.number(),
	fromDate: z.string(),
	toDate: z.string(),
});

export const RoomType = z.object({
	id: z.string(),
	hotelId: z.string().nullable(),
	name: z.string(),
	description: z.string().nullable(),
	basePrice: z.number(),
	capacityAdults: z.number(),
	capacityChildren: z.number(),
	facilities: z.string().nullable(),
	active: z.boolean(),
	roomCount: z.number(),
	specialPrices: z.array(SpecialPrice).nullable(),
	requestedBasePrice: z.number().nullable().optional(),
	priceRequestedByName: z.string().nullable().optional(),
	priceRequestedAt: z.string().nullable().optional(),
	priceSentToOwner: z.boolean().nullable().optional(),
});

export const RoomTypeRequest = z.object({
	name: z.string(),
	description: z.string().nullable().optional(),
	basePrice: z.number(),
	capacityAdults: z.number().optional(),
	capacityChildren: z.number().optional(),
	facilities: z.string().nullable().optional(),
	active: z.boolean().optional(),
});

export const Area = z.object({
	id: z.string(),
	hotelId: z.string().nullable(),
	name: z.string(),
	kind: z.string().nullable(),
	sortOrder: z.number().nullable(),
});

export const Room = z.object({
	id: z.string(),
	hotelId: z.string().nullable(),
	number: z.string(),
	floor: z.string().nullable(),
	areaId: z.string().nullable(),
	roomTypeId: z.string(),
	roomTypeName: z.string().nullable(),
	basePrice: z.number().nullable(),
	capacityAdults: z.number().nullable(),
	capacityChildren: z.number().nullable(),
	status: z.string(),
	outOfOrderReason: z.string().nullable(),
	outOfOrderUntil: z.string().nullable(),
	notes: z.string().nullable(),
});

export const RoomRequest = z.object({
	number: z.string(),
	roomTypeId: z.string(),
	areaId: z.string().nullable().optional(),
	floor: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

export const RoomsBulkRequest = z.object({
	rooms: z.array(
		z.object({
			number: z.string(),
			roomTypeId: z.string(),
			floor: z.string().nullable().optional(),
			areaId: z.string().nullable().optional(),
		}),
	),
	/** Refuse the whole request (409 naming them) when a number exists or repeats, instead of skipping it. */
	refuseExisting: z.boolean().optional(),
});

export const RoomsBulkResult = z.object({
	created: z.number(),
	skipped: z.array(z.string()),
});

export const RoomStatus = z.object({
	roomId: z.string(),
	roomNumber: z.string().nullable(),
	status: z.enum(["DIRTY", "CLEAN", "INSPECTED"]),
	note: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
});

// ---- finance -------------------------------------------------------------------------------------

export const MoneyToday = z.object({
	revenue: z.number(),
	byMethod: z.record(z.string(), z.number()),
	byRole: z.record(z.string(), z.number()),
	expenses: z.number(),
	cashInTills: z.number(),
	openTills: z.number(),
	paymentsCount: z.number(),
	// operating-day contract: arrivals, occupancy, cash taken with no open till, approvals waiting
	occupancyPct: z.number().nullable().optional(),
	arrivals: z.number().nullable().optional(),
	departures: z.number().nullable().optional(),
	inHouse: z.number().nullable().optional(),
	unattachedCash: z.number().nullable().optional(),
	pendingApprovals: z.number().nullable().optional(),
	// restaurant-bar contract: what the outlets sold today (fnb internal sales), next to income by role
	/** Parsed leniently by the mapper: the day's sales object, a list of outlets, or a total. */
	outletSales: z.unknown().optional(),
});

export const Shift = z.object({
	id: z.string(),
	userId: z.string(),
	userName: z.string().nullable(),
	role: z.string(),
	shiftDate: z.string(),
	startsAt: z.string(),
	endsAt: z.string(),
	status: z.string(),
	clockedIn: z.boolean().nullable().optional(),
	attendance: z.string().nullable().optional(),
});

// ---- platform, maintenance, inventory, folio, messaging -----------------------------------------

export const Approval = z.object({
	id: z.string(),
	sourceModule: z.string(),
	kind: z.string(),
	amount: z.number().nullable(),
	requesterName: z.string().nullable(),
	requesterId: z.string().nullable().optional(),
	approverLevel: z.string(),
	description: z.string().nullable(),
	status: z.string(),
	createdAt: z.string(),
	sourceRef: z.string().nullable().optional(),
	requesterRole: z.string().nullable().optional(),
	hotelName: z.string().nullable().optional(),
	decidedByName: z.string().nullable().optional(),
	note: z.string().nullable().optional(),
	deliveries: Deliveries,
	hotelId: z.string().nullable().optional(),
	decidedAt: z.string().nullable().optional(),
});

export const ActivityEntry = z.object({
	id: z.string(),
	eventType: z.string(),
	actorName: z.string().nullable(),
	summary: z.string(),
	occurredAt: z.string(),
	hotelId: z.string().nullable().optional(),
	actorId: z.string().nullable().optional(),
	topic: z.string().nullable().optional(),
	payload: z.string().nullable().optional(),
});

export const Repair = z.object({
	id: z.string(),
	roomNumber: z.string().nullable(),
	area: z.string().nullable(),
	title: z.string(),
	priority: z.string(),
	status: z.string(),
	assignedToName: z.string().nullable(),
	createdAt: z.string(),
});

export const StockItem = z.object({
	id: z.string(),
	name: z.string(),
	unit: z.string(),
	minLevel: z.number(),
});

export const StockLevel = z.object({
	itemId: z.string(),
	storeId: z.string(),
	quantity: z.number(),
});

export const FolioLine = z.object({
	id: z.string(),
	folioId: z.string().nullable(),
	kind: z.enum(["CHARGE", "PAYMENT", "DISCOUNT", "REFUND"]),
	sourceModule: z.string().nullable(),
	sourceRef: z.string().nullable(),
	category: z.string().nullable(),
	description: z.string().nullable(),
	amount: z.number(),
	taxAmount: z.number().nullable(),
	postedBy: z.string().nullable(),
	postedByName: z.string().nullable(),
	postedAt: z.string().nullable(),
	voided: z.boolean(),
	voidReason: z.string().nullable(),
	voidedBy: z.string().nullable(),
	movedFrom: z.string().nullable(),
});

export const Organization = z.object({
	id: z.string(),
	name: z.string(),
	contactName: z.string().nullable().optional(),
	contactPhone: z.string().nullable().optional(),
	contactEmail: z.string().nullable().optional(),
	creditLimit: z.number().nullable().optional(),
	dailyCap: z.number().nullable().optional(),
	billingCycle: z.string().nullable().optional(),
	paymentTermsDays: z.number().nullable().optional(),
	agreementNotes: z.string().nullable().optional(),
	status: z.string().nullable().optional(),
	createdAt: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	hotelId: z.string().nullable().optional(),
	/** A limit above the owner's threshold a manager asked for, waiting for the owner (docs/owner-portal.md). */
	requestedCreditLimit: z.number().nullable().optional(),
	creditApprovalId: z.string().nullable().optional(),
	creditRequestedByName: z.string().nullable().optional(),
	creditRequestedAt: z.string().nullable().optional(),
	creditSentToOwner: z.boolean().nullable().optional(),
});

/** An account with its figures, as GET /folio/organizations?page= and /:id/summary answer (docs/pagination.md). */
export const OrganizationSummary = Organization.extend({
	outstanding: z.number(),
	staffCount: z.number(),
	staysThisMonth: z.number(),
	stays: z.number(),
	openStays: z.number(),
	runningBalance: z.number(),
	invoices: z.number(),
	openInvoices: z.number(),
	invoicesLeft: z.number(),
	overdueInvoices: z.number(),
	overdueAmount: z.number(),
	overdueNumber: z.string().nullable().optional(),
	overdueDueDate: z.string().nullable().optional(),
});

/** The hotel's accounts at a glance (GET /folio/organizations/overview). */
export const OrganizationsOverview = z.object({
	accounts: z.number(),
	staffCanBook: z.number(),
	staysThisMonth: z.number(),
	outstanding: z.number(),
	openInvoices: z.number(),
	overdueInvoices: z.number(),
	overdueAmount: z.number(),
	overdueOrganizations: z.array(z.string()),
	onHold: z.number(),
	onHoldOrganizations: z.array(z.string()),
});

/** POST /folio/organizations and PUT /folio/organizations/:id (manager). PUT replaces every field. */
export const OrganizationRequest = z.object({
	name: z.string(),
	contactName: z.string().nullable().optional(),
	contactPhone: z.string().nullable().optional(),
	contactEmail: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	creditLimit: z.number().nullable().optional(),
	dailyCap: z.number().nullable().optional(),
	billingCycle: z.string().nullable().optional(),
	paymentTermsDays: z.number().nullable().optional(),
	agreementNotes: z.string().nullable().optional(),
});

export const OrganizationMember = z.object({
	id: z.string(),
	organizationId: z.string(),
	fullName: z.string(),
	staffRef: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	active: z.boolean().nullable().optional(),
	createdAt: z.string().nullable().optional(),
});

export const MemberRequest = z.object({
	fullName: z.string(),
	staffRef: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
});

export const Invoice = z.object({
	id: z.string(),
	organizationId: z.string(),
	number: z.string(),
	periodFrom: z.string(),
	periodTo: z.string(),
	amount: z.number(),
	paidAmount: z.number().nullable().optional(),
	dueDate: z.string(),
	status: z.string(),
	sentAt: z.string().nullable().optional(),
	createdAt: z.string().nullable().optional(),
});

/** An invoice with its account's name; `overdue` when unpaid past due (worked out by folio-service). */
export const InvoiceView = Invoice.extend({
	organizationName: z.string().nullable().optional(),
	overdue: z.boolean().nullable().optional(),
});

export const OrganizationPayment = z.object({
	id: z.string(),
	organizationId: z.string(),
	invoiceId: z.string().nullable().optional(),
	amount: z.number(),
	method: z.string(),
	reference: z.string().nullable().optional(),
	receivedAt: z.string().nullable().optional(),
	recordedBy: z.string().nullable().optional(),
});

export const Folio = z.object({
	id: z.string(),
	bookingId: z.string().nullable(),
	guestId: z.string().nullable(),
	guestName: z.string(),
	guestPhone: z.string().nullable(),
	guestEmail: z.string().nullable(),
	roomId: z.string().nullable(),
	roomNumber: z.string().nullable(),
	organizationId: z.string().nullable(),
	status: z.enum(["OPEN", "CLOSED", "CLOSED_WITH_BALANCE"]),
	totalCharges: z.number(),
	totalTax: z.number(),
	totalDiscounts: z.number(),
	totalPayments: z.number(),
	balance: z.number(),
	openedAt: z.string(),
	closedAt: z.string().nullable(),
	lines: z.array(FolioLine).nullable(),
});

/** GET /folio/organizations/:id/stays answers with the folio rows themselves, without their lines. */
export const OrganizationStay = Folio.extend({
	lines: z.array(FolioLine).nullable().optional(),
});

export const PaymentResponse = z.object({
	id: z.string(),
	folioId: z.string().nullable(),
	bookingId: z.string().nullable(),
	guestName: z.string().nullable(),
	role: z.string().nullable(),
	method: z.enum(["CARD", "TRANSFER", "CASH", "ORGANIZATION"]),
	amount: z.number(),
	currency: z.string().nullable(),
	status: z.enum([
		"PENDING",
		"PROCESSING",
		"APPROVED",
		"DECLINED",
		"NO_RESPONSE",
		"FAILED",
		"REFUNDED",
	]),
	terminalId: z.string().nullable(),
	providerRef: z.string().nullable(),
	description: z.string().nullable(),
	failureReason: z.string().nullable(),
	requestedBy: z.string().nullable(),
	requestedByName: z.string().nullable(),
	createdAt: z.string(),
	resolvedAt: z.string().nullable(),
	verifiedAt: z.string().nullable(),
	hotelId: z.string().nullable().optional(),
});

export const Notification = z.object({
	id: z.string(),
	kind: z.string(),
	title: z.string(),
	body: z.string().nullable(),
	link: z.string().nullable(),
	readAt: z.string().nullable(),
	createdAt: z.string(),
});

export const schema = createSchema({
	...ownerRoutes,
	...mlRoutes,
	...adminRoutes,
	...opsRoutes,
	...paymentRoutes,
	...fnbRoutes,
	...inventoryRoutes,
	...lmRoutes,
	...deviceRoutes,
	...profileRoutes,
	// identity
	"@post/identity/auth/refresh": {
		input: z.object({ refreshToken: z.string() }),
		output: envelope(AuthResponse),
	},
	"@post/identity/auth/logout": { output: envelope(z.null()) },
	"@post/identity/auth/sign-up": {
		input: z.object({
			fullName: z.string(),
			email: z.string(),
			phone: z.string(),
			password: z.string(),
			businessName: z.string(),
			city: z.string().nullable().optional(),
		}),
		output: envelope(AuthResponse),
	},
	"@post/identity/auth/phone/send-code": {
		input: z
			.object({ channel: z.enum(["SMS", "WHATSAPP"]).optional() })
			.optional(),
		output: envelope(
			z.object({ expiresAt: z.string(), deliveries: Deliveries }),
		),
	},
	"@post/identity/auth/phone/verify": {
		input: z.object({ code: z.string() }),
		output: envelope(Me),
	},
	"@get/identity/auth/invites/:token": {
		params: z.object({ token: z.string() }),
		output: envelope(Invite),
	},
	"@post/identity/auth/accept-invite": {
		input: z.object({ token: z.string(), password: z.string() }),
		output: envelope(AuthResponse),
	},
	"@get/identity/users/me": { output: envelope(Me) },
	/** The caller's own details (docs/profile.md): only what is sent changes; email is not editable here. */
	"@put/identity/users/me": {
		input: z
			.object({ fullName: z.string(), phone: z.string(), language: z.string() })
			.partial(),
		output: envelope(Me),
	},
	"@delete/identity/users/me/photo": { output: envelope(Me) },
	/** The people at the active hotel (names and roles only) for any staff member: swap and cover pickers. */
	"@get/identity/users/colleagues": { output: envelope(z.array(UserSummary)) },
	/** The whole list without page or size (pickers, rotas, Roles & permissions); a page with counts when either is sent. */
	"@get/identity/users": {
		query: z
			.object({
				businessId: z.string(),
				hotelId: z.string(),
				role: z.string(),
				q: z.string(),
				status: z.string(),
				page: z.number(),
				size: z.number(),
				sort: z.string(),
			})
			.partial()
			.optional(),
		output: envelope(z.union([z.array(UserSummary), pagedOf(UserSummary)])),
	},
	"@post/identity/users": {
		input: CreateUserRequest,
		output: envelope(UserCreated),
	},
	"@get/identity/users/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(UserSummary),
	},
	"@post/identity/users/:id/resend-invite": {
		params: z.object({ id: z.string() }),
		output: envelope(UserCreated),
	},
	"@post/identity/users/:id/reset-password": {
		params: z.object({ id: z.string() }),
		output: envelope(UserCreated),
	},
	"@post/identity/users/:id/roles": {
		params: z.object({ id: z.string() }),
		input: GrantRoleRequest,
		output: envelope(UserSummary),
	},
	"@put/identity/users/:id/roles/:grantId": {
		params: z.object({ id: z.string(), grantId: z.string() }),
		input: AccessChangeRequest,
		output: envelope(UserSummary),
	},
	"@post/identity/users/:id/pause-all": {
		params: z.object({ id: z.string() }),
		query: z.object({ paused: z.boolean() }).partial().optional(),
		output: envelope(UserSummary),
	},

	// tenant
	"@get/tenant/hotels": { output: envelope(z.array(Hotel)) },
	"@post/tenant/hotels": { input: HotelRequest, output: envelope(Hotel) },
	"@get/tenant/hotels/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(Hotel),
	},
	"@put/tenant/hotels/:id": {
		params: z.object({ id: z.string() }),
		input: HotelRequest,
		output: envelope(Hotel),
	},
	"@put/tenant/hotels/:id/status": {
		params: z.object({ id: z.string() }),
		input: z.object({
			status: HotelStatus,
			reason: z.string().nullable().optional(),
		}),
		output: envelope(Hotel),
	},
	"@get/tenant/businesses/mine": { output: envelope(Business) },
	"@put/tenant/businesses/mine": {
		input: MyBusinessRequest,
		output: envelope(Business),
	},
	"@get/tenant/businesses": {
		query: z
			.object({
				stage: z.string(),
				q: z.string(),
				page: z.number(),
				size: z.number(),
				sort: z.string(),
			})
			.partial()
			.optional(),
		output: envelope(pagedOf(BusinessSummary)),
	},
	"@post/tenant/businesses": {
		input: BusinessRequest,
		output: envelope(Business),
	},
	"@get/tenant/businesses/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(Business),
	},
	"@put/tenant/businesses/:id": {
		params: z.object({ id: z.string() }),
		input: BusinessRequest.partial(),
		output: envelope(Business),
	},
	"@put/tenant/businesses/:id/stage": {
		params: z.object({ id: z.string() }),
		input: z.object({
			stage: BusinessStage,
			reason: z.string().nullable().optional(),
		}),
		output: envelope(Business),
	},
	"@put/tenant/businesses/:id/account-manager": {
		params: z.object({ id: z.string() }),
		query: z.object({ adminId: z.string() }),
		output: envelope(Business),
	},
	"@get/tenant/businesses/:id/hotels": {
		params: z.object({ id: z.string() }),
		output: envelope(z.array(Hotel)),
	},
	"@get/tenant/onboarding": {
		query: z
			.object({ status: z.string(), page: z.number(), size: z.number() })
			.partial()
			.optional(),
		output: envelope(pagedOf(Onboarding)),
	},
	"@get/tenant/onboarding/mine": { output: envelope(Onboarding) },
	"@put/tenant/onboarding/mine/step": {
		input: z.object({ step: z.number(), data: JsonObject }),
		output: envelope(Onboarding),
	},
	"@post/tenant/onboarding/mine/complete": { output: envelope(Business) },
	"@get/tenant/onboarding/:businessId": {
		params: z.object({ businessId: z.string() }),
		output: envelope(Onboarding),
	},
	"@put/tenant/onboarding/:businessId/step": {
		params: z.object({ businessId: z.string() }),
		input: z.object({
			step: z.number(),
			data: JsonObject,
			nextAction: z.string().nullable().optional(),
		}),
		output: envelope(Onboarding),
	},
	"@put/tenant/onboarding/:businessId/assign": {
		params: z.object({ businessId: z.string() }),
		query: z.object({ adminId: z.string() }),
		output: envelope(Onboarding),
	},
	"@post/tenant/onboarding/:businessId/handover": {
		params: z.object({ businessId: z.string() }),
		output: envelope(Handover),
	},
	"@post/tenant/handover/accept": { output: envelope(Business) },
	"@get/tenant/setup-templates": { output: envelope(z.array(SetupTemplate)) },

	// hotel-config
	"@get/hotel-config/setup": { output: envelope(SetupSection) },
	"@put/hotel-config/setup/:section": {
		params: z.object({ section: z.string() }),
		input: JsonObject,
		output: envelope(JsonObject),
	},
	"@post/hotel-config/setup/apply-template": {
		input: z.object({
			templateId: z.string().nullable().optional(),
			settings: JsonObject.nullable().optional(),
		}),
		output: envelope(z.unknown()),
	},
	/** A price list by kind (MINIBAR, LAUNDRY, EXTRAS, …); 404 until the first price is added. */
	"@get/hotel-config/setup/price-lists/:kind": {
		params: z.object({ kind: z.string() }),
		output: envelope(PriceList),
	},
	"@post/hotel-config/setup/price-lists/:kind/items": {
		params: z.object({ kind: z.string() }),
		input: PriceListItemInput,
		output: envelope(PriceList),
	},
	"@put/hotel-config/setup/price-lists/:kind/items/:itemId": {
		params: z.object({ kind: z.string(), itemId: z.string() }),
		input: PriceListItemInput,
		output: envelope(PriceList),
	},
	"@get/hotel-config/setup/lists/:listName": {
		params: z.object({ listName: z.string() }),
		query: z.object({ activeOnly: z.boolean() }).partial().optional(),
		output: envelope(z.array(ListItem)),
	},
	"@post/hotel-config/setup/lists/:listName": {
		params: z.object({ listName: z.string() }),
		input: ListItemRequest,
		output: envelope(ListItem),
	},
	"@put/hotel-config/setup/lists/:listName/:id": {
		params: z.object({ listName: z.string(), id: z.string() }),
		input: ListItemRequest,
		output: envelope(ListItem),
	},
	"@delete/hotel-config/setup/lists/:listName/:id": {
		params: z.object({ listName: z.string(), id: z.string() }),
		output: envelope(z.unknown()),
	},

	// reservation
	"@get/reservation/bookings/today": { output: envelope(Today) },
	/** Paged (docs/pagination.md): the seam always sends page and size. */
	"@get/reservation/bookings": {
		query: pageParams,
		output: envelope(pagedOf(Booking)),
	},
	"@get/reservation/bookings/availability": {
		query: z.object({
			roomTypeId: z.string(),
			from: z.string(),
			to: z.string(),
		}),
		output: envelope(Availability),
	},
	"@get/reservation/bookings/:id": { output: envelope(Booking) },
	"@post/reservation/bookings": {
		input: z.object({
			guestId: z.string().nullable().optional(),
			guest: GuestRequest.nullable().optional(),
			roomTypeId: z.string(),
			roomId: z.string().nullable().optional(),
			checkInDate: z.string(),
			checkOutDate: z.string(),
			adults: z.number().optional(),
			children: z.number().optional(),
			expectedArrival: z.string().nullable().optional(),
			priceKind: z.string().optional(),
			specialRate: z.number().nullable().optional(),
			paymentPlan: z.string().optional(),
			organizationId: z.string().nullable().optional(),
			source: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
			walkIn: z.boolean().nullable().optional(),
		}),
		output: envelope(Booking),
	},
	"@put/reservation/bookings/:id": {
		input: z.object({
			checkInDate: z.string().nullable().optional(),
			checkOutDate: z.string().nullable().optional(),
			roomId: z.string().nullable().optional(),
			roomTypeId: z.string().nullable().optional(),
			reason: z.string().nullable().optional(),
		}),
		output: envelope(Booking),
	},
	"@post/reservation/bookings/:id/check-in": {
		input: z.object({
			roomId: z.string().nullable().optional(),
			guestEmail: z.string().nullable().optional(),
			guestPhone: z.string().nullable().optional(),
			withoutPayment: z.boolean().optional(),
			idType: z.string().nullable().optional(),
			idNumber: z.string().nullable().optional(),
			overrideDirty: z.boolean().optional(),
		}),
		output: envelope(Booking),
	},
	"@post/reservation/bookings/:id/check-out": {
		input: z.object({
			folioBalance: z.number().nullable().optional(),
			allowPendingPayment: z.boolean().optional(),
			summaryChannels: z.array(z.string()).optional(),
		}),
		output: envelope(Booking),
	},
	"@post/reservation/bookings/:id/late-check-out": {
		input: z
			.object({
				until: z.string().nullable().optional(),
				fee: z.number().nullable().optional(),
			})
			.optional(),
		output: envelope(Booking),
	},
	"@post/reservation/bookings/:id/cancel": {
		input: z.object({ reason: z.string(), refundable: z.boolean().optional() }),
		output: envelope(Booking),
	},
	/** Paged (docs/pagination.md): the seam always sends page and size. Rows add inHouse and lastStay. */
	"@get/reservation/guests": {
		query: pageParams,
		output: envelope(
			pagedOf(
				Guest.extend({
					inHouse: z.boolean().optional(),
					lastStay: z.string().nullable().optional(),
				}),
			),
		),
	},
	"@get/reservation/guests/:id": { output: envelope(Guest) },
	"@get/reservation/guests/:id/stays": { output: envelope(z.array(Booking)) },
	"@post/reservation/guests": { input: GuestRequest, output: envelope(Guest) },
	"@put/reservation/guests/:id": {
		input: GuestRequest,
		output: envelope(Guest),
	},

	// property & housekeeping
	"@get/property/room-types": { output: envelope(z.array(RoomType)) },
	"@post/property/room-types": {
		input: RoomTypeRequest,
		output: envelope(RoomType),
	},
	"@put/property/room-types/:id": {
		input: RoomTypeRequest,
		output: envelope(RoomType),
	},
	"@delete/property/room-types/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(z.unknown()),
	},
	"@post/property/room-types/:id/special-prices": {
		input: z.object({
			name: z.string(),
			price: z.number(),
			fromDate: z.string(),
			toDate: z.string(),
		}),
		output: envelope(RoomType),
	},
	"@get/property/rooms": {
		output: envelope(z.array(Room)),
		query: z.object({ roomTypeId: z.string() }).partial().optional(),
	},
	"@get/property/rooms/:id": { output: envelope(Room) },
	"@post/property/rooms": { input: RoomRequest, output: envelope(Room) },
	"@post/property/rooms/bulk": {
		input: RoomsBulkRequest,
		output: envelope(RoomsBulkResult),
	},
	"@put/property/rooms/:id": { input: RoomRequest, output: envelope(Room) },
	"@delete/property/rooms/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(Room),
	},
	"@post/property/rooms/:id/out-of-order": {
		input: z.object({
			reason: z.string(),
			until: z.string().nullable().optional(),
		}),
		output: envelope(Room),
	},
	"@post/property/rooms/:id/back-in-service": { output: envelope(Room) },
	"@get/property/areas": { output: envelope(z.array(Area)) },
	"@post/property/areas": {
		input: z.object({
			name: z.string(),
			kind: z.string().nullable().optional(),
			sortOrder: z.number().nullable().optional(),
		}),
		output: envelope(Area),
	},
	"@get/housekeeping/room-status": { output: envelope(z.array(RoomStatus)) },

	// finance
	"@get/finance/today": {
		query: z.object({ date: z.string() }).partial().optional(),
		output: envelope(MoneyToday),
	},
	"@get/finance/workforce/rota": {
		query: z.object({ from: z.string(), to: z.string() }).partial().optional(),
		output: envelope(z.array(Shift)),
	},

	// platform
	"@get/platform/approvals": { output: envelope(z.array(Approval)) },
	"@get/platform/activity": {
		query: z
			.object({
				page: z.number(),
				size: z.number(),
				q: z.string(),
				department: z.string(),
				from: z.string(),
				to: z.string(),
			})
			.partial()
			.optional(),
		output: envelope(paged(ActivityEntry)),
	},

	// maintenance, inventory, folio
	"@get/folio/folios": { output: envelope(z.array(Folio)) },
	"@get/folio/organizations": {
		query: pageParams,
		output: envelope(pagedOf(OrganizationSummary)),
	},
	"@get/folio/organizations/overview": {
		output: envelope(OrganizationsOverview),
	},
	"@get/folio/organizations/invoices": {
		query: pageParams,
		output: envelope(pagedOf(InvoiceView)),
	},
	"@get/folio/organizations/:id/summary": {
		output: envelope(OrganizationSummary),
	},
	"@post/folio/organizations": {
		input: OrganizationRequest,
		output: envelope(Organization),
	},
	"@get/folio/organizations/:id": { output: envelope(Organization) },
	"@put/folio/organizations/:id": {
		input: OrganizationRequest,
		output: envelope(Organization),
	},
	"@get/folio/organizations/:id/members": {
		output: envelope(z.array(OrganizationMember)),
	},
	"@post/folio/organizations/:id/members": {
		input: MemberRequest,
		output: envelope(OrganizationMember),
	},
	"@post/folio/organizations/:id/members/import": {
		input: z.array(MemberRequest),
		output: envelope(z.array(OrganizationMember)),
	},
	"@put/folio/organizations/:id/status": {
		query: z.object({ status: z.string() }),
		output: envelope(Organization),
	},
	"@put/folio/organizations/:id/members/:memberId/active": {
		query: z.object({ active: z.boolean() }),
		output: envelope(OrganizationMember),
	},
	"@post/folio/organizations/:id/statement": {
		output: envelope(
			z.object({ to: z.string(), channel: z.string(), deliveries: Deliveries }),
		),
	},
	"@post/folio/organizations/:id/reminder": {
		output: envelope(
			z.object({ to: z.string(), channel: z.string(), deliveries: Deliveries }),
		),
	},
	"@get/folio/organizations/:id/stays": {
		query: pageParams,
		output: envelope(pagedOf(OrganizationStay)),
	},
	"@get/folio/organizations/:id/outstanding": { output: envelope(z.number()) },
	"@get/folio/organizations/:id/invoices": {
		query: pageParams,
		output: envelope(pagedOf(InvoiceView)),
	},
	"@post/folio/organizations/:id/invoices": {
		input: z.object({
			periodFrom: z.string(),
			periodTo: z.string(),
			dueDate: z.string().nullable().optional(),
		}),
		output: envelope(Invoice),
	},
	"@post/folio/organizations/:id/payments": {
		input: z.object({
			amount: z.number(),
			method: z.string(),
			reference: z.string().nullable().optional(),
			invoiceId: z.string().nullable().optional(),
		}),
		output: envelope(OrganizationPayment),
	},
	"@get/folio/folios/:id": { output: envelope(Folio) },
	"@get/folio/folios/by-booking/:bookingId": { output: envelope(Folio) },
	"@post/folio/folios/:id/charges": {
		input: z.object({
			description: z.string(),
			amount: z.number(),
			taxAmount: z.number().nullable().optional(),
			category: z.string().nullable().optional(),
		}),
		output: envelope(Folio),
	},
	"@post/folio/folios/:id/discount": {
		input: z.object({ amount: z.number(), reason: z.string() }),
		output: envelope(Folio),
	},
	"@post/folio/folios/:id/send": {
		input: z.object({
			channel: z.string(),
			to: z.string().nullable().optional(),
		}),
		output: envelope(
			z.object({ to: z.string(), channel: z.string(), deliveries: Deliveries }),
		),
	},
	"@post/folio/folios/:id/lines/:lineId/void": {
		input: z.object({ reason: z.string() }),
		output: envelope(Folio),
	},
	/** Paged (docs/pagination.md): the seam always sends page and size. */
	"@get/payment/payments": {
		query: pageParams,
		output: envelope(pagedOf(PaymentResponse)),
	},
	"@get/payment/payments/:id": { output: envelope(PaymentResponse) },
	"@post/payment/payments": {
		input: z.object({
			method: z.string(),
			amount: z.number(),
			folioId: z.string().nullable().optional(),
			bookingId: z.string().nullable().optional(),
			guestName: z.string().nullable().optional(),
			guestPhone: z.string().nullable().optional(),
			guestEmail: z.string().nullable().optional(),
			description: z.string().nullable().optional(),
			receiptPreference: z.string().nullable().optional(),
			/** The kitchen or bar order this payment settles; the order closes when it is approved. */
			orderId: z.string().nullable().optional(),
			/** The desk taking the payment (one of the caller's roles). */
			role: z.string().nullable().optional(),
		}),
		output: envelope(PaymentResponse),
	},
	"@post/payment/payments/:id/verify": { output: envelope(PaymentResponse) },
	"@post/payment/payments/:id/retry": { output: envelope(PaymentResponse) },
	"@post/payment/payments/:id/receipt/resend": {
		output: envelope(
			z.object({
				receiptNumber: z.string(),
				sentTo: z.string(),
				sentVia: z.string(),
				deliveries: Deliveries,
			}),
		),
	},
	"@post/payment/payments/:id/cancel": { output: envelope(PaymentResponse) },
	"@get/payment/terminals": { output: envelope(z.array(Terminal)) },
	"@post/payment/terminals": {
		input: TerminalRequest,
		output: envelope(Terminal),
	},

	// messaging
	/** With page or size: a page (90 days back by default) with counts all and unread (docs/pagination.md). */
	"@get/messaging/notifications": {
		query: pageParams.optional(),
		output: envelope(pagedOf(Notification)),
	},
	"@get/messaging/channels": {
		output: envelope(
			z.object({
				sms: z.boolean(),
				whatsapp: z.boolean(),
				whatsappCodes: z.boolean(),
			}),
		),
	},
	"@get/messaging/notifications/unread-count": {
		output: envelope(z.object({ count: z.number() })),
	},
	"@post/messaging/notifications/:id/read": {
		params: z.object({ id: z.string() }),
		output: envelope(Notification),
	},
	"@post/messaging/notifications/read-all": { output: envelope(z.number()) },
});

export type Me = z.infer<typeof Me>;
export type AuthResponse = z.infer<typeof AuthResponse>;
export type UserSummary = z.infer<typeof UserSummary>;
export type Grant = z.infer<typeof Grant>;
export type InviteStatus = z.infer<typeof InviteStatus>;
export type UserCreated = z.infer<typeof UserCreated>;
export type Invite = z.infer<typeof Invite>;
export type CreateUserRequest = z.infer<typeof CreateUserRequest>;
export type GrantRoleRequest = z.infer<typeof GrantRoleRequest>;
export type AccessChangeRequest = z.infer<typeof AccessChangeRequest>;
export type Hotel = z.infer<typeof Hotel>;
export type HotelStatus = z.infer<typeof HotelStatus>;
export type HotelRequest = z.infer<typeof HotelRequest>;
export type Business = z.infer<typeof Business>;
export type BusinessStage = z.infer<typeof BusinessStage>;
export type BusinessSource = z.infer<typeof BusinessSource>;
export type BusinessOnboarding = z.infer<typeof BusinessOnboarding>;
export type BusinessSummary = z.infer<typeof BusinessSummary>;
export type MyBusinessRequest = z.infer<typeof MyBusinessRequest>;
export type BusinessRequest = z.infer<typeof BusinessRequest>;
export type Onboarding = z.infer<typeof Onboarding>;
export type OnboardingStatus = z.infer<typeof OnboardingStatus>;
export type CreatedLogin = z.infer<typeof CreatedLogin>;
export type Handover = z.infer<typeof Handover>;
export type SetupTemplate = z.infer<typeof SetupTemplate>;
export type SetupSection = z.infer<typeof SetupSection>;
export type ListItem = z.infer<typeof ListItem>;
export type ListItemRequest = z.infer<typeof ListItemRequest>;
export type Terminal = z.infer<typeof Terminal>;
export type TerminalRequest = z.infer<typeof TerminalRequest>;
export type RoomsBulkResult = z.infer<typeof RoomsBulkResult>;
export type RoomType = z.infer<typeof RoomType>;
export type Booking = z.infer<typeof Booking>;
export type Today = z.infer<typeof Today>;
export type Room = z.infer<typeof Room>;
export type RoomStatus = z.infer<typeof RoomStatus>;
export type MoneyToday = z.infer<typeof MoneyToday>;
export type Shift = z.infer<typeof Shift>;
export type Approval = z.infer<typeof Approval>;
export type ActivityEntry = z.infer<typeof ActivityEntry>;
export type Repair = z.infer<typeof Repair>;
export type StockItem = z.infer<typeof StockItem>;
export type StockLevel = z.infer<typeof StockLevel>;
export type Folio = z.infer<typeof Folio>;
export type Organization = z.infer<typeof Organization>;
export type OrganizationMember = z.infer<typeof OrganizationMember>;
export type Invoice = z.infer<typeof Invoice>;
export type InvoiceView = z.infer<typeof InvoiceView>;
export type OrganizationSummary = z.infer<typeof OrganizationSummary>;
export type Notification = z.infer<typeof Notification>;
