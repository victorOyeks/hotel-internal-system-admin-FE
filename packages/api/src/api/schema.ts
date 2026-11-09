import { createSchema } from "@better-fetch/fetch";
import { z } from "zod";
import { adminRoutes, Deliveries } from "./routes-admin";
import { opsRoutes } from "./routes-ops";
import { paymentRoutes } from "./routes-payments";

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
});

export const InviteStatus = z.enum(["PENDING", "ACCEPTED", "EXPIRED", "NONE"]);

export const Grant = z.object({
	id: z.string(),
	role: z.string(),
	level: z.string(),
	hotelId: z.string().nullable(),
	paused: z.boolean(),
	expiresAt: z.string().nullable().optional(),
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
});

export const AccessChangeRequest = z.object({
	change: z.enum(["CHANGE_LEVEL", "PAUSE", "RESUME", "REMOVE"]),
	level: z.string().nullable().optional(),
	reason: z.string().nullable().optional(),
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
});

export const ActivityEntry = z.object({
	id: z.string(),
	eventType: z.string(),
	actorName: z.string().nullable(),
	summary: z.string(),
	occurredAt: z.string(),
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
	...adminRoutes,
	...opsRoutes,
	...paymentRoutes,
	// identity
	"@post/identity/auth/sign-in": {
		input: z.object({ email: z.string(), password: z.string() }),
		output: envelope(AuthResponse),
	},
	"@post/identity/auth/pin-sign-in": {
		input: z.object({ identifier: z.string(), pin: z.string() }),
		output: envelope(AuthResponse),
	},
	"@post/identity/auth/refresh": {
		input: z.object({ refreshToken: z.string() }),
		output: envelope(AuthResponse),
	},
	"@post/identity/auth/logout": { output: envelope(z.null()) },
	"@post/identity/auth/change-password": {
		input: z.object({ currentPassword: z.string(), newPassword: z.string() }),
		output: envelope(z.null()),
	},
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
		input: z.object({}).optional(),
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
	"@get/identity/users": {
		query: z
			.object({
				businessId: z.string(),
				hotelId: z.string(),
				role: z.string(),
				q: z.string(),
			})
			.partial()
			.optional(),
		output: envelope(z.array(UserSummary)),
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
			})
			.partial()
			.optional(),
		output: envelope(paged(BusinessSummary)),
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
		query: z.object({ status: z.string() }).partial().optional(),
		output: envelope(z.array(Onboarding)),
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
	"@get/reservation/bookings": {
		query: z
			.object({ from: z.string(), to: z.string(), status: z.string() })
			.partial()
			.optional(),
		output: envelope(z.array(Booking)),
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
			priceKind: z.string().optional(),
			specialRate: z.number().nullable().optional(),
			paymentPlan: z.string().optional(),
			organizationId: z.string().nullable().optional(),
			source: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
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
	"@get/reservation/guests": {
		query: z.object({ q: z.string() }).partial().optional(),
		output: envelope(z.array(Guest)),
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
	"@post/property/rooms/:id/out-of-order": {
		input: z.object({
			reason: z.string(),
			until: z.string().nullable().optional(),
		}),
		output: envelope(Room),
	},
	"@post/property/rooms/:id/back-in-service": { output: envelope(Room) },
	"@get/property/areas": { output: envelope(z.array(Area)) },
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
			.object({ page: z.number(), size: z.number() })
			.partial()
			.optional(),
		output: envelope(paged(ActivityEntry)),
	},

	// maintenance, inventory, folio
	"@get/maintenance/repairs": {
		query: z.object({ all: z.boolean() }).partial().optional(),
		output: envelope(z.array(Repair)),
	},
	"@get/inventory/items": { output: envelope(z.array(StockItem)) },
	"@get/inventory/levels": {
		query: z.object({ storeId: z.string() }).partial().optional(),
		output: envelope(z.array(StockLevel)),
	},
	"@get/folio/folios": { output: envelope(z.array(Folio)) },
	"@get/folio/organizations": { output: envelope(z.array(Organization)) },
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
	"@post/folio/folios/:id/lines/:lineId/void": {
		input: z.object({ reason: z.string() }),
		output: envelope(Folio),
	},
	"@get/payment/payments": { output: envelope(z.array(PaymentResponse)) },
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
		}),
		output: envelope(PaymentResponse),
	},
	"@post/payment/payments/:id/verify": { output: envelope(PaymentResponse) },
	"@post/payment/payments/:id/cancel": { output: envelope(PaymentResponse) },
	"@get/payment/terminals": { output: envelope(z.array(Terminal)) },
	"@post/payment/terminals": {
		input: TerminalRequest,
		output: envelope(Terminal),
	},

	// messaging
	"@get/messaging/notifications": {
		query: z.object({ unreadOnly: z.boolean() }).partial().optional(),
		output: envelope(z.array(Notification)),
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
export type Notification = z.infer<typeof Notification>;
