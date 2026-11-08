import { createSchema } from "@better-fetch/fetch";
import { z } from "zod";

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
		z.object({ role: z.string(), level: z.string(), hotelId: z.string().nullable() }),
	),
	verified: z.boolean(),
	changedPassword: z.boolean(),
	twoStepEnabled: z.boolean(),
	hotelIds: z.array(z.string()),
	createdAt: z.string(),
});

export const UserSummary = z.object({
	id: z.string(),
	fullName: z.string(),
	email: z.string(),
	phone: z.string().nullable(),
	status: z.string(),
	grants: z.array(
		z.object({
			id: z.string(),
			role: z.string(),
			level: z.string(),
			hotelId: z.string().nullable(),
			paused: z.boolean(),
		}),
	),
});

// ---- tenant --------------------------------------------------------------------------------------

export const Hotel = z.object({
	id: z.string(),
	businessId: z.string(),
	name: z.string(),
	city: z.string().nullable(),
	address: z.string().nullable(),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	timezone: z.string().nullable(),
	status: z.string(),
	roomCount: z.number(),
});

export const Business = z.object({
	id: z.string(),
	name: z.string(),
	stage: z.string(),
	currency: z.string(),
	timezone: z.string(),
	ownerName: z.string().nullable(),
	hotels: z.array(Hotel),
});

// ---- reservation ---------------------------------------------------------------------------------

export const Booking = z.object({
	id: z.string(),
	reference: z.string(),
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
	status: z.string(),
	priceKind: z.string(),
	nightlyRate: z.number(),
	totalAmount: z.number(),
	paymentPlan: z.string(),
	amountDueNow: z.number(),
	organizationId: z.string().nullable(),
	checkedInAt: z.string().nullable(),
	checkedOutAt: z.string().nullable(),
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

export const RoomStatus = z.object({
	roomId: z.string(),
	roomNumber: z.string().nullable(),
	status: z.enum(["DIRTY", "CLEAN", "INSPECTED"]),
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

export const Folio = z.object({
	id: z.string(),
	bookingId: z.string().nullable(),
	guestName: z.string(),
	roomNumber: z.string().nullable(),
	status: z.string(),
	balance: z.number(),
	openedAt: z.string(),
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
	"@get/identity/users/me": { output: envelope(Me) },
	"@get/identity/users": { output: envelope(z.array(UserSummary)) },

	// tenant
	"@get/tenant/hotels": { output: envelope(z.array(Hotel)) },
	"@get/tenant/businesses/mine": { output: envelope(Business) },

	// reservation
	"@get/reservation/bookings/today": { output: envelope(Today) },
	"@get/reservation/bookings": {
		query: z.object({ from: z.string(), to: z.string(), status: z.string() }).partial().optional(),
		output: envelope(z.array(Booking)),
	},

	// property & housekeeping
	"@get/property/room-types": { output: envelope(z.array(RoomType)) },
	"@post/property/room-types": { input: RoomTypeRequest, output: envelope(RoomType) },
	"@put/property/room-types/:id": { input: RoomTypeRequest, output: envelope(RoomType) },
	"@post/property/room-types/:id/special-prices": {
		input: z.object({ name: z.string(), price: z.number(), fromDate: z.string(), toDate: z.string() }),
		output: envelope(RoomType),
	},
	"@get/property/rooms": { output: envelope(z.array(Room)), query: z.object({ roomTypeId: z.string() }).partial().optional() },
	"@get/property/rooms/:id": { output: envelope(Room) },
	"@post/property/rooms": { input: RoomRequest, output: envelope(Room) },
	"@put/property/rooms/:id": { input: RoomRequest, output: envelope(Room) },
	"@post/property/rooms/:id/out-of-order": { input: z.object({ reason: z.string(), until: z.string().nullable().optional() }), output: envelope(Room) },
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
		query: z.object({ page: z.number(), size: z.number() }).partial().optional(),
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
export type Hotel = z.infer<typeof Hotel>;
export type Business = z.infer<typeof Business>;
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
