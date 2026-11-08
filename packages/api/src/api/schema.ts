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
	status: z.enum(["BOOKED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"]),
	priceKind: z.enum(["NORMAL", "SPECIAL", "COMPLIMENTARY"]),
	nightlyRate: z.number(),
	totalAmount: z.number(),
	amountPaid: z.number().nullable().optional(),
	paymentPlan: z.enum(["PAY_IN_FULL", "DEPOSIT_50", "PAY_AT_CHECKOUT", "ORGANIZATION"]),
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
	status: z.enum(["PENDING", "PROCESSING", "APPROVED", "DECLINED", "NO_RESPONSE", "FAILED", "REFUNDED"]),
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
	"@get/reservation/bookings/availability": {
		query: z.object({ roomTypeId: z.string(), from: z.string(), to: z.string() }),
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
		input: z.object({ checkInDate: z.string().nullable().optional(), checkOutDate: z.string().nullable().optional(), roomId: z.string().nullable().optional(), roomTypeId: z.string().nullable().optional(), reason: z.string().nullable().optional() }),
		output: envelope(Booking),
	},
	"@post/reservation/bookings/:id/check-in": {
		input: z.object({ roomId: z.string().nullable().optional(), guestEmail: z.string().nullable().optional(), guestPhone: z.string().nullable().optional(), withoutPayment: z.boolean().optional(), idType: z.string().nullable().optional(), idNumber: z.string().nullable().optional() }),
		output: envelope(Booking),
	},
	"@post/reservation/bookings/:id/check-out": {
		input: z.object({ folioBalance: z.number().nullable().optional(), allowPendingPayment: z.boolean().optional(), summaryChannels: z.array(z.string()).optional() }),
		output: envelope(Booking),
	},
	"@post/reservation/bookings/:id/late-check-out": { input: z.object({ until: z.string().nullable().optional(), fee: z.number().nullable().optional() }).optional(), output: envelope(Booking) },
	"@post/reservation/bookings/:id/cancel": { input: z.object({ reason: z.string(), refundable: z.boolean().optional() }), output: envelope(Booking) },
	"@get/reservation/guests": { query: z.object({ q: z.string() }).partial().optional(), output: envelope(z.array(Guest)) },
	"@get/reservation/guests/:id": { output: envelope(Guest) },
	"@get/reservation/guests/:id/stays": { output: envelope(z.array(Booking)) },
	"@post/reservation/guests": { input: GuestRequest, output: envelope(Guest) },
	"@put/reservation/guests/:id": { input: GuestRequest, output: envelope(Guest) },

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
	"@get/folio/folios/:id": { output: envelope(Folio) },
	"@get/folio/folios/by-booking/:bookingId": { output: envelope(Folio) },
	"@post/folio/folios/:id/charges": { input: z.object({ description: z.string(), amount: z.number(), taxAmount: z.number().nullable().optional(), category: z.string().nullable().optional() }), output: envelope(Folio) },
	"@post/folio/folios/:id/discount": { input: z.object({ amount: z.number(), reason: z.string() }), output: envelope(Folio) },
	"@post/folio/folios/:id/lines/:lineId/void": { input: z.object({ reason: z.string() }), output: envelope(Folio) },
	"@get/payment/payments": { output: envelope(z.array(PaymentResponse)) },
	"@get/payment/payments/:id": { output: envelope(PaymentResponse) },
	"@post/payment/payments": {
		input: z.object({ method: z.string(), amount: z.number(), folioId: z.string().nullable().optional(), bookingId: z.string().nullable().optional(), guestName: z.string().nullable().optional(), guestPhone: z.string().nullable().optional(), guestEmail: z.string().nullable().optional(), description: z.string().nullable().optional(), receiptPreference: z.string().nullable().optional() }),
		output: envelope(PaymentResponse),
	},
	"@post/payment/payments/:id/verify": { output: envelope(PaymentResponse) },
	"@post/payment/payments/:id/cancel": { output: envelope(PaymentResponse) },

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
