/**
 * The shapes the screens render. They follow the backend DTOs (hospio-backend/*-service/dto) so the
 * API switch is a mapping, not a redesign. Money is in naira, dates are ISO strings.
 */

import type { HotelRole } from "@hospio/api/roles";

export type Id = string;

export type AccessLevel = "FULL" | "EDIT" | "VIEW";
export type InviteState = "PENDING" | "ACCEPTED" | "EXPIRED" | "NONE";
export type GrantRow = {
	id: Id;
	role: string;
	level: AccessLevel;
	hotelId?: Id;
	hotelName?: string;
	paused: boolean;
	expiresAt?: string;
	/** Last day of a temporary role (yyyy-mm-dd, Lagos). */
	until?: string;
};

/**
 * One hotel on the owner's Hotels screen. The API fills identity, status and counts; the finance
 * figures come from finance-service when it is wired and are 0 until then.
 */
export type OwnerHotelRow = {
	hotelId: Id;
	name: string;
	city: string;
	code: string;
	rooms: number;
	occupancy: number;
	manager: string;
	managerUserId?: Id;
	status: "ACTIVE" | "PAUSED" | "CLOSED" | "RENOVATION" | "INACTIVE";
	address?: string;
	timezone?: string;
	checkInTime?: string;
	checkOutTime?: string;
	starRating?: number;
	revenueToday: number;
	revenueMonth: number;
	expensesMonth: number;
	payrollMonth: number;
	revenueLastMonth: number;
	onShift: number;
	scheduled: number;
	openIssues: number;
	lastAction: string;
	lastAt: string;
	health: number;
	posProvider: string;
	grossSettled: number;
	posFees: number;
	nextPayout: string;
	nextPayoutAmount: number;
	phone: string;
	email: string;
};

/** A portal user (owner's Users screen, platform People tab): one person, their grants and invite state. */
export type PortalUserRow = {
	id: Id;
	/** /api/people/<id>/photo?v=…; initials without one. */
	photo?: string;
	userId: Id;
	businessId: string;
	fullName: string;
	email: string;
	phone: string;
	role: HotelRole;
	level: AccessLevel;
	hotels: string[];
	hotelIds: Id[];
	/** The first hotel's name, for screens that show one. */
	hotel?: string;
	grants: GrantRow[];
	status: "ACTIVE" | "INVITED" | "PAUSED" | "SUSPENDED";
	inviteStatus: InviteState;
	mustChangePassword: boolean;
	twoStep: boolean;
	lastSignIn?: string;
	createdAt?: string;
};

/** A setup template (tenant `/setup-templates`): sections and lists applied to a new hotel. */
export type SetupTemplateRow = {
	id: Id;
	name: string;
	description: string;
	settings: Record<string, unknown>;
	active: boolean;
};

export type HotelSummary = {
	id: Id;
	name: string;
	city: string;
	address: string;
	rooms: number;
	timezone: string;
	occupancy: number;
	manager: string;
};

export type RoomTypeRow = {
	id: Id;
	name: string;
	basePrice: number;
	capacityAdults: number;
	capacityChildren: number;
	rooms: number;
	facilities: string[];
	specialPrices: {
		id: Id;
		name: string;
		price: number;
		fromDate: string;
		toDate: string;
	}[];
	/** A base price waiting for the owner's approval. */
	requestedBasePrice?: number;
	priceRequestedBy?: string;
	priceRequestedAt?: string;
	/** True on the save that sent the price to the owner. */
	priceSentToOwner?: boolean;
};

export type RoomState =
	| "occupied"
	| "ready"
	| "dirty"
	| "held"
	| "out_of_order"
	| "inspecting";
export type AreaRow = { id: Id; name: string; kind: string; sortOrder: number };
export type RoomRow = {
	id: Id;
	number: string;
	floor: string;
	areaId?: Id;
	typeId: Id;
	typeName: string;
	price: number;
	state: RoomState;
	guestName?: string;
	checkOut?: string;
	note?: string;
	/** The room's own note (Edit room, or the front desk's "Note for housekeeping"); `note` may show "Arriving today" instead. */
	boardNote?: string;
	/** A held room: the booking arriving today it is kept for. */
	heldFor?: Id;
	outOfOrderReason?: string;
	outOfOrderUntil?: string;
	lastCleaned?: string;
	attendant?: string;
};

export type BookingStatus =
	| "BOOKED"
	| "CHECKED_IN"
	| "CHECKED_OUT"
	| "CANCELLED"
	| "NO_SHOW";
export type PaymentPlan =
	| "PAY_IN_FULL"
	| "DEPOSIT_50"
	| "PAY_AT_CHECKOUT"
	| "ORGANIZATION";
export type PriceKind = "NORMAL" | "SPECIAL" | "COMPLIMENTARY";
export type BookingRow = {
	id: Id;
	/** The hotel of the stay (lists across hotels read it). */
	hotelId?: Id;
	reference: string;
	guestId: Id;
	guestName: string;
	guestPhone: string;
	guestEmail?: string;
	roomTypeId: Id;
	roomTypeName: string;
	roomId?: Id;
	roomNumber?: string;
	checkInDate: string;
	checkOutDate: string;
	nights: number;
	adults: number;
	children: number;
	eta?: string;
	status: BookingStatus;
	priceKind: PriceKind;
	nightlyRate: number;
	totalAmount: number;
	paid: number;
	paymentPlan: PaymentPlan;
	organizationId?: Id;
	organizationName?: string;
	source: string;
	notes?: string;
	createdAt: string;
	checkedInAt?: string;
	checkedOutAt?: string;
	cancelReason?: string;
};

export type GuestRow = {
	id: Id;
	fullName: string;
	phone: string;
	email?: string;
	idType?: string;
	idNumber?: string;
	nationality?: string;
	preferences?: string;
	notes?: string;
	stays: number;
	lastStay?: string;
	blacklisted: boolean;
	organizationName?: string;
	/** Has a stay checked in at this hotel now (paged guests list). */
	inHouse?: boolean;
};

export type FolioLineKind = "CHARGE" | "PAYMENT" | "DISCOUNT" | "REFUND";
export type FolioLine = {
	id: Id;
	kind: FolioLineKind;
	description: string;
	category: string;
	amount: number;
	tax: number;
	postedAt: string;
	postedBy: string;
	voided?: boolean;
	voidReason?: string;
	source: string;
};
export type FolioRow = {
	id: Id;
	bookingId: Id;
	reference: string;
	guestId: Id;
	guestName: string;
	guestPhone?: string;
	guestEmail?: string;
	roomNumber: string;
	organizationName?: string;
	status: "OPEN" | "CLOSED" | "CLOSED_WITH_BALANCE";
	charges: number;
	tax: number;
	discounts: number;
	payments: number;
	balance: number;
	openedAt: string;
	closedAt?: string;
	lines: FolioLine[];
	notes: { by: string; at: string; text: string }[];
};

/**
 * An open folio without its lines and notes: what lists, pickers and balances need (`data.folios.summaries`). The lines
 * of the one folio being opened are read on their own (`folioById`, `folioForBooking`).
 */
export type FolioSummary = Omit<FolioRow, "lines" | "notes">;

/** A folio as a summary (drops lines and notes, which can be hundreds per stay). */
export function toFolioSummary(f: FolioRow): FolioSummary {
	const { lines: _lines, notes: _notes, ...rest } = f;
	return rest;
}

export type PaymentMethod = "CARD" | "TRANSFER" | "CASH";
export type PaymentStatus =
	| "PENDING"
	| "PROCESSING"
	| "APPROVED"
	| "DECLINED"
	| "NO_RESPONSE"
	| "FAILED"
	| "REFUNDED";
export type PaymentRow = {
	id: Id;
	reference: string;
	folioId?: Id;
	bookingId?: Id;
	guestName: string;
	roomNumber?: string;
	role: string;
	takenBy: string;
	method: PaymentMethod;
	amount: number;
	status: PaymentStatus;
	terminal?: string;
	providerRef?: string;
	createdAt: string;
	resolvedAt?: string;
	receiptSent?: "EMAIL" | "WHATSAPP" | "NONE";
	description: string;
	/** The hotel it was taken at (owner lists across hotels). */
	hotelId?: string;
};
export type TerminalRow = {
	id: Id;
	name: string;
	provider: string;
	ref: string;
	status: "ONLINE" | "OFFLINE";
	roles: string[];
	lastSeen: string;
	todayCount: number;
	todayAmount: number;
};
export type RefundRow = {
	id: Id;
	paymentId: Id;
	guestName: string;
	amount: number;
	reason: string;
	status: "PENDING_APPROVAL" | "APPROVED" | "DECLINED";
	requestedBy: string;
	createdAt: string;
	/** "PAY-1A2B3C" of the payment refunded. */
	paymentReference?: string;
};
export type DisputeRow = {
	id: Id;
	paymentId: Id;
	guestName: string;
	amount: number;
	reason: string;
	status: "OPEN" | "RESOLVED";
	openedAt: string;
	resolution?: string;
	paymentReference?: string;
};

// ---- paged lists (hospio-backend/docs/pagination.md) --------------------------------------------------

/** Payments: `status` may list several (comma separated); `mine` narrows a manager to what they took; `hotelId` the owner's hotel. */
export type PaymentQuery = import("./paging").ListQuery & {
	method?: string;
	role?: string;
	mine?: boolean;
	/** Only today's (a tab: the counts stay over the whole range). */
	today?: boolean;
	hotelId?: string;
};
/** The tabs every bookings screen shows, read by reservation-service over the hotel's day. */
export type BookingView =
	| "arrivals"
	| "departures"
	| "in-house"
	| "upcoming"
	| "past"
	| "all";
/** Bookings: `from`/`to` are stays touching those days, `arrivingFrom`/`arrivingTo` check-in days. */
export type BookingQuery = import("./paging").ListQuery & {
	view?: BookingView;
	arrivingFrom?: string;
	arrivingTo?: string;
	hotelId?: string;
	guestId?: string;
};
export type GuestView = "all" | "in-house" | "repeat" | "blacklisted";
export type GuestQuery = import("./paging").ListQuery & { view?: GuestView };

export type StaffRow = {
	id: Id;
	fullName: string;
	email: string;
	phone: string;
	role: string;
	level: AccessLevel;
	department: string;
	jobTitle: string;
	status: "ACTIVE" | "PAUSED" | "SUSPENDED" | "ON_LEAVE";
	shift: string;
	startedOn: string;
	lastSignIn?: string;
	hotelId: Id;
	hotelName?: string;
	photo?: string;
	userId?: Id;
	grants?: GrantRow[];
	inviteStatus?: InviteState;
	mustChangePassword?: boolean;
	/** A PIN is set for shared devices (false shows "No PIN yet"; undefined when the service does not say). */
	hasPin?: boolean;
};
export type ShiftRow = {
	id: Id;
	staffId: Id;
	staffName: string;
	role: string;
	date: string;
	starts: string;
	ends: string;
	status:
		| "SCHEDULED"
		| "SWAPPED"
		| "COVERED"
		| "CANCELLED"
		| "ABSENT"
		| "PRESENT"
		| "LATE";
	clockedIn?: boolean;
};
export type LeaveRow = {
	id: Id;
	staffId: Id;
	staffName: string;
	role: string;
	from: string;
	to: string;
	days: number;
	reason: string;
	status: "PENDING" | "APPROVED" | "DECLINED" | "CHANGE_REQUESTED" | "WITHDRAWN";
	note?: string;
};
export type ShiftRequestRow = {
	id: Id;
	staffId?: Id;
	shiftId?: Id;
	staffName: string;
	role: string;
	kind: "SWAP" | "COVER";
	date: string;
	shift: string;
	withName?: string;
	reason?: string;
	status: "PENDING" | "APPROVED" | "DECLINED";
};

export type ExpenseRow = {
	id: Id;
	date: string;
	/** When it was recorded, so same-day expenses list newest first. */
	createdAt?: string;
	category: string;
	/** The stored category (a code like FUEL_AND_POWER, or an older label), to put the hotel's own label on it. */
	categoryCode?: string;
	description: string;
	amount: number;
	paidFrom: "CASH" | "TRANSFER" | "CARD";
	requestedBy: string;
	status:
		| "RECORDED"
		| "PENDING_APPROVAL"
		| "APPROVED"
		| "DECLINED"
		| "QUESTION"
		| "PAID";
	receipt?: boolean;
	note?: string;
	approverLevel?: "MANAGER" | "OWNER";
	approvalId?: Id;
	requestedById?: Id;
	paidFromRaw?: string;
};
export type TillRow = {
	id: Id;
	role: string;
	openedBy: string;
	openedAt: string;
	openingFloat: number;
	cashIn: number;
	/** Pay-outs, cash refunds and expenses paid from the drawer. */
	cashOut?: number;
	expected: number;
	counted?: number;
	variance?: number;
	status: "OPEN" | "CLOSED";
	closedAt?: string;
	entries?: number;
	note?: string;
	openedById?: Id;
};
export type TillEntryRow = {
	id: Id;
	at: string;
	amount: number;
	method: string;
	description: string;
	kind: "PAYMENT" | "PAY_IN" | "PAY_OUT" | "REFUND" | "OTHER";
};
export type TransactionRow = {
	id: Id;
	at: string;
	kind: "PAYMENT" | "EXPENSE" | "REFUND" | "DEPOSIT" | "TILL";
	description: string;
	method: string;
	amount: number;
	by: string;
	reference: string;
};
export type NightAuditRow = {
	id: Id;
	date: string;
	status: "OPEN" | "CLOSED";
	revenue: number;
	cashCounted?: number;
	variance?: number;
	roomsOccupied: number;
	arrivals: number;
	departures: number;
	noShows: number;
	closedBy?: string;
	closedAt?: string;
	checklist: { key: string; label: string; done: boolean; detail?: string }[];
	inHouse?: number;
	rooms?: number;
	note?: string;
	report?: Record<string, unknown>;
};
/** Today's money for the manager, finance and owner screens (finance-service `/today`). */
export type MoneyTodayRow = {
	revenue: number;
	byMethod: Record<string, number>;
	byRole?: Record<string, number>;
	paymentsCount: number;
	expenses: number;
	openTills: number;
	cashInTills: number;
	occupancyPct?: number;
	arrivals?: number;
	departures?: number;
	inHouse?: number;
	unattachedCash?: number;
	pendingApprovals?: number;
	/** What the outlets sold today (restaurant-bar contract); absent until the service sends it. */
	outletSales?: OutletSalesDayRow;
};
/** Month to date: revenue and expenses from the daily series; budget and unpaid guests only where a source exists. */
export type MonthSummaryRow = {
	revenue: number;
	lastMonth: number;
	expenses: number;
	netProfit: number;
	margin: number;
	budget?: number;
	unpaidGuests?: number;
	unpaidTotal?: number;
};
export type WorthRow = {
	id: Id;
	tone: "danger" | "warning" | "info";
	title: string;
	detail: string;
	area: string;
	href: string;
};
export type SeriesPointRow = {
	date: string;
	revenue: number;
	expenses: number;
};
export type OwnerSummaryRow = {
	hotels: {
		hotelId: Id;
		name: string;
		revenue: number;
		expenses: number;
		profit: number;
		occupancyPct: number;
	}[];
	totals: {
		revenue: number;
		expenses: number;
		profit: number;
		occupancyPct: number;
	};
};
export type ApprovalLimits = {
	managerExpenseLimit: number;
	ownerExpenseLimit: number;
	discountPct: number;
	refundsNeedOwner: boolean;
	/** A manager's room base price change waits for the owner (Approval limits). */
	rateChangesNeedOwner?: boolean;
	/** Changes above this many percent go to the owner; 0 means every change. */
	rateChangeOwnerPct?: number;
};
export type ClockStatus = {
	clockedIn: boolean;
	since?: string;
	todayMinutes: number;
};

export type OrganizationRow = {
	id: Id;
	name: string;
	contactName: string;
	contactPhone: string;
	contactEmail: string;
	address?: string;
	creditLimit: number;
	dailyCap?: number;
	/** folio-service's code (MONTHLY, TWICE_MONTHLY, PER_STAY); billingCycleLabel says it. */
	billingCycle: string;
	termsDays: number;
	status: "ACTIVE" | "ON_HOLD";
	outstanding: number;
	staffCount: number;
	staysThisMonth: number;
	agreementNotes?: string;
	since: string;
	/** A credit limit above the owner's threshold that a manager asked for, waiting for the owner. */
	requestedCreditLimit?: number;
	creditRequestedBy?: string;
	creditApprovalId?: string;
	/** From folio-service's figures (GET /folio/organizations?page=, /:id/summary): one call for the list, not three per account. */
	stays?: number;
	openStays?: number;
	/** Still owed on the stays that are open. */
	runningBalance?: number;
	invoices?: number;
	openInvoices?: number;
	invoicesLeft?: number;
	overdueInvoices?: number;
	overdueAmount?: number;
	/** The latest overdue invoice's number and due date. */
	overdueNumber?: string;
	overdueDueDate?: string;
};

/** The hotel's organizations at a glance (the KPI cards), whatever page the list is on. */
export type OrganizationsOverviewRow = {
	accounts: number;
	staffCanBook: number;
	staysThisMonth: number;
	outstanding: number;
	openInvoices: number;
	overdueInvoices: number;
	overdueAmount: number;
	overdueOrganizations: string[];
	onHold: number;
	onHoldOrganizations: string[];
};
export type OrgMemberRow = {
	id: Id;
	fullName: string;
	staffRef: string;
	phone: string;
	email?: string;
	active: boolean;
};
export type InvoiceRow = {
	id: Id;
	number: string;
	organizationId: Id;
	organizationName: string;
	periodFrom: string;
	periodTo: string;
	amount: number;
	paid: number;
	dueDate: string;
	status: "DRAFT" | "SENT" | "PART_PAID" | "PAID" | "OVERDUE";
};

export type StoreRow = {
	id: Id;
	name: string;
	kind: string;
	items: number;
	lowItems: number;
	keeper: string;
	/** Stock value of the store (live; absent when the caller doesn't see money). */
	value?: number;
};
export type StockItemRow = {
	id: Id;
	name: string;
	category: string;
	unit: string;
	minLevel: number;
	quantity: number;
	unitCost: number;
	supplierName?: string;
	storeId: Id;
	storeName: string;
	lastMovement?: string;
	supplierId?: string;
	/** Reorder up to (0 = twice the minimum). */
	parLevel?: number;
	/** Held across every store. */
	onHand?: number;
};
export type StockRequestRow = {
	id: Id;
	fromTeam: string;
	requestedBy: string;
	lines: {
		name: string;
		quantity: number;
		unit: string;
		itemId?: string;
		issued?: number;
	}[];
	note?: string;
	status: "REQUESTED" | "ISSUED" | "PART_ISSUED" | "DECLINED" | "CLOSED";
	createdAt: string;
	storeId?: string;
	storeName?: string;
	issuedBy?: string;
	issuedAt?: string;
	/** Why it was declined or closed short. */
	reason?: string;
};
/** A team's store screen: its latest requests (with the counts of all of them) and today's. */
export type TeamRequests = {
	latest: import("./paging").Paged<StockRequestRow>;
	today: StockRequestRow[];
	error?: string;
};

export type PurchaseOrderRow = {
	id: Id;
	number: string;
	supplierName: string;
	lines: {
		name: string;
		quantity: number;
		unit: string;
		unitCost: number;
		itemId?: string;
		received?: number;
		damaged?: number;
	}[];
	total: number;
	status:
		| "DRAFT"
		| "PENDING_APPROVAL"
		| "SENT"
		| "PARTIAL"
		| "RECEIVED"
		| "CLOSED"
		| "CANCELLED";
	expectedOn?: string;
	createdBy: string;
	createdAt: string;
	supplierId?: string;
	storeId?: string;
	storeName?: string;
	receivedValue?: number;
	note?: string;
	sentAt?: string;
	sentTo?: string;
	approverLevel?: string;
	decisionNote?: string;
	cancelReason?: string;
};
export type DeliveryRow = {
	id: Id;
	supplierName: string;
	poNumber?: string;
	lines: number;
	total: number;
	receivedBy: string;
	receivedAt: string;
	note?: string;
	purchaseOrderId?: string;
	storeName?: string;
	invoiceNumber?: string;
	/** "2 short · 1 damaged" */
	summary?: string;
	items?: {
		itemId: string;
		name: string;
		unit: string;
		quantity: number;
		unitCost: number;
		damaged: number;
		ordered?: number;
		short: number;
		over: number;
		note?: string;
	}[];
};
export type StockCountRow = {
	id: Id;
	storeName: string;
	status: "OPEN" | "COUNTED" | "APPROVED" | "CANCELLED";
	startedBy: string;
	startedAt: string;
	variance?: number;
	lines?: {
		name: string;
		expected: number;
		counted: number;
		itemId?: string;
		unit?: string;
		unitCost?: number;
		value?: number;
	}[];
	storeId?: string;
	/** Money value of the variance (counted − system, at cost). */
	varianceValue?: number;
	note?: string;
	countedBy?: string;
	approvedBy?: string;
	cancelReason?: string;
	closedAt?: string;
};
export type SupplierRow = {
	id: Id;
	name: string;
	contactName: string;
	phone: string;
	email?: string;
	terms: string;
	items: number;
	lastOrder?: string;
	address?: string;
	notes?: string;
	active?: boolean;
	itemIds?: string[];
	openOrders?: number;
	/** Received from them in the last 30 days. */
	spent?: number;
};

/** GET /inventory/value: what the stock is worth, low items with a reorder suggestion, what is still to arrive. */
export type StockValue = {
	total: number;
	stores: {
		id: string;
		name: string;
		kind: string;
		items: number;
		lowItems: number;
		value: number;
	}[];
	low: {
		itemId: string;
		name: string;
		unit: string;
		storeId: string;
		storeName: string;
		quantity: number;
		minLevel: number;
		suggest: number;
		unitCost: number;
		supplierId?: string;
		supplierName?: string;
	}[];
	onOrder: number;
};

/** GET /inventory/usage: what moved, at cost, per store and per team for a date range. */
export type StockUsage = {
	from: string;
	to: string;
	stores: {
		storeId: string;
		name: string;
		kind: string;
		received: number;
		transferredIn: number;
		issuedOut: number;
		used: number;
		wasted: number;
		counted: number;
	}[];
	teams: { team: string; issued: number }[];
	totals: {
		received: number;
		issued: number;
		used: number;
		wasted: number;
		counted: number;
	};
};

export type StockMovementRow = {
	id: string;
	at: string;
	itemName: string;
	unit: string;
	storeName: string;
	kind: string;
	quantity: number;
	value?: number;
	reference?: string;
	note?: string;
	team?: string;
	by?: string;
};

export type StockItemDetail = {
	id: string;
	name: string;
	category: string;
	unit: string;
	minLevel: number;
	parLevel: number;
	unitCost: number;
	supplierId?: string;
	supplierName?: string;
	onHand: number;
	levels: {
		storeId: string;
		storeName: string;
		quantity: number;
		value?: number;
	}[];
	movements: StockMovementRow[];
};

export type StockTransferRow = {
	reference: string;
	at: string;
	fromStore: string;
	toStore?: string;
	team?: string;
	lines: { name: string; quantity: number; unit: string }[];
	value: number;
	by?: string;
	note?: string;
};

export type RepairRow = {
	id: Id;
	title: string;
	description?: string;
	roomNumber?: string;
	area?: string;
	priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
	status:
		| "OPEN"
		| "ASSIGNED"
		| "IN_PROGRESS"
		| "WAITING_PARTS"
		| "DONE"
		| "CANCELLED";
	source: string;
	reportedBy: string;
	assignedTo?: string;
	createdAt: string;
	doneAt?: string;
	roomOutOfOrder?: boolean;
	updates: { at: string; by: string; note: string }[];
	quotes?: { vendor: string; amount: number; chosen?: boolean }[];
};
export type ScheduledJobRow = {
	id: Id;
	title: string;
	area: string;
	everyDays: number;
	nextDue: string;
	lastDone?: string;
	assignedTo?: string;
	paused: boolean;
	runs: { on: string; by: string; note?: string }[];
};
export type SparePartRow = {
	id: Id;
	name: string;
	quantity: number;
	minQuantity: number;
	unitCost: number;
};

export type ActivityRow = {
	id: Id;
	at: string;
	actor: string;
	actorRole: string;
	department: string;
	action: string;
	summary: string;
	eventType: string;
	byPlatform?: boolean;
	payload?: Record<string, unknown>;
};
export type ApprovalRow = {
	id: Id;
	kind: string;
	sourceModule: string;
	description: string;
	amount?: number;
	requesterName: string;
	/** The user who raised it: lets the requester answer a question on their own request. */
	requesterId?: string;
	requesterRole: string;
	approverLevel: "MANAGER" | "OWNER";
	status: "PENDING" | "APPROVED" | "DECLINED" | "QUESTION";
	createdAt: string;
	decidedBy?: string;
	note?: string;
	hotelName?: string;
	hotelId?: Id;
	sourceRef?: string;
};
export type NotificationRow = {
	id: Id;
	kind: string;
	title: string;
	body?: string;
	link?: string;
	at: string;
	read: boolean;
	tone: "info" | "warning" | "danger" | "success";
};

export type ConversationRow = {
	id: Id;
	kind: "GUEST" | "STAFF";
	name: string;
	contact: string;
	channel: "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP";
	subject: string;
	assignedTo?: string;
	lastAt: string;
	unread: number;
	preview: string;
	messages: {
		id: Id;
		direction: "IN" | "OUT";
		by: string;
		at: string;
		body: string;
	}[];
};
export type TemplateRow = {
	id: Id;
	key: string;
	channel: string;
	subject?: string;
	body: string;
	active: boolean;
};
export type ReportRow = {
	id: Id;
	name: string;
	kind: string;
	description: string;
	lastRun?: string;
	schedule?: string;
	recipients?: string;
	formats: string[];
};

export type DepartmentLive = {
	key: string;
	name: string;
	onShift: number;
	scheduled: number;
	actionsLastHour: number;
	lastAction: string;
	lastAt: string;
	open: number;
	openLabel: string;
	tone: "success" | "warning" | "danger" | "grey";
};

/** One group of choices on a dish or drink (size, extras, how it is cooked). */
export type OptionGroup = {
	group: string;
	choices: { name: string; priceDelta: number }[];
	required: boolean;
	multiple: boolean;
};
export type MenuItemRow = {
	id: Id;
	outletId: Id;
	outlet: string;
	category: string;
	name: string;
	price: number;
	available: boolean;
	/** The choice names, flat, for places that only list them. */
	options?: string[];
	description?: string;
	/** The groups behind `options`, with price differences and required / multiple. */
	optionGroups?: OptionGroup[];
	/** False once the item is taken off the menu (manage menu shows it, the pickers do not). */
	active?: boolean;
	taxRate?: number;
	sortOrder?: number;
	/** Stock drawn per portion when the order is settled. */
	recipe?: { stockItemId: Id; quantity: number }[];
	/** A price change waiting for the manager (set by the screen after the 202 answer). */
	pendingPrice?: number;
};
export type OrderLineRow = {
	id?: Id;
	menuItemId?: Id;
	name: string;
	qty: number;
	price: number;
	/** Happy hour discount taken off the line. */
	discount?: number;
	options?: string;
	notes?: string;
	/** NEW, SENT (cooking), READY, SERVED or CANCELLED. */
	status: string;
};
export type OrderRow = {
	id: Id;
	number: string;
	outlet: string;
	outletId?: Id;
	kind: "DINE_IN" | "ROOM_SERVICE" | "TAB" | "TAKEAWAY";
	tableId?: Id;
	tableNo?: string;
	roomId?: Id;
	roomNumber?: string;
	bookingId?: Id;
	guestName?: string;
	status: "OPEN" | "SENT" | "READY" | "SERVED" | "CLOSED" | "CANCELLED";
	lines: OrderLineRow[];
	subtotal: number;
	tax: number;
	discount?: number;
	total: number;
	paid: boolean;
	chargedToRoom: boolean;
	paymentId?: Id;
	openedBy: string;
	openedAt: string;
	sentAt?: string;
	closedAt?: string;
	closedByName?: string;
	/** PAYMENT, ROOM, COMPLIMENTARY or CANCELLED once the order is settled or closed. */
	settledBy?: string;
	notes?: string;
	/** Approved payments so far: part paid while under the total. */
	paidAmount?: number;
};

/** Where a sale stands in the sales history (fnb-service SaleBucket). */
export type SaleStatus =
	| "PAID"
	| "TO_PAY"
	| "PART_PAID"
	| "ON_ROOM"
	| "CANCELLED"
	| "IN_PROGRESS";

/** One bar or kitchen sale in the sales history. */
export type SaleRow = {
	id: Id;
	number: string;
	outletId: Id;
	outletName: string;
	outletKind?: string;
	kind: OrderRow["kind"];
	tableNo?: string;
	roomNumber?: string;
	guestName?: string;
	createdAt: string;
	openedBy?: Id;
	openedByName: string;
	/** "3 Coca-Cola, 2 Orange juice" */
	items: string;
	itemCount: number;
	total: number;
	paidAmount: number;
	/** Still due (0 once paid, on a room or cancelled). */
	balance: number;
	status: SaleStatus;
	orderStatus?: string;
	/** CASH, CARD, TRANSFER and ROOM as they were used. */
	methods: string[];
	settledAt?: string;
	settledBy?: string;
	settledByName?: string;
	cancelReason?: string;
};

export type SaleMoney = {
	sales: number;
	sold: number;
	paid: number;
	unpaid: number;
	onRooms: number;
	cancelled: number;
};

export type SalesHistoryView = {
	from: string;
	to: string;
	page: number;
	size: number;
	/** Rows matching the filters (all pages). */
	matching: number;
	rows: SaleRow[];
	totals: SaleMoney & { cancelledAmount: number };
	outlets: (SaleMoney & { outletId: Id; name: string; kind?: string })[];
	attendants: (SaleMoney & { userId: string; name: string })[];
	earlierUnpaid: { count: number; amount: number; oldest?: string };
	viewer: {
		userId: Id;
		management: boolean;
		mine: boolean;
		mineByDefault: boolean;
		canExport: boolean;
		actsOnOthers: boolean;
	};
	outletChoices: { id: Id; name: string; kind: string }[];
};

/** The sales list's filters, as the URL carries them. */
export type SaleFilters = {
	from?: string;
	to?: string;
	outletId?: string;
	desk?: "BAR" | "KITCHEN";
	status?: string;
	method?: string;
	attendant?: string;
	mine?: boolean;
	q?: string;
	page?: number;
};

export type SaleDetailView = {
	sale: SaleRow;
	roomId?: Id;
	bookingId?: Id;
	tableId?: Id;
	notes?: string;
	subtotal: number;
	discount: number;
	tax: number;
	total: number;
	paidAmount: number;
	balance: number;
	lines: {
		id: Id;
		name: string;
		quantity: number;
		unitPrice: number;
		options?: string;
		choices: { name: string; extra: number }[];
		notes?: string;
		discount: number;
		amount: number;
		status: string;
		cancelReason?: string;
		cancelledByName?: string;
	}[];
	payments: {
		paymentId: Id;
		method: string;
		amount: number;
		at?: string;
		reference?: string;
		takenByName?: string;
	}[];
	timeline: {
		openedAt?: string;
		openedByName?: string;
		sentAt?: string;
		settledAt?: string;
		settledBy?: string;
		settledByName?: string;
		closedAt?: string;
		closedByName?: string;
	};
	can: { pay: boolean; chargeToRoom: boolean; cancel: boolean; note?: string };
};

export type CleaningTaskRow = {
	id: Id;
	roomNumber: string;
	roomId: Id;
	kind: "STAYOVER" | "DEPARTURE" | "DEEP";
	status:
		| "TODO"
		| "IN_PROGRESS"
		| "DONE"
		| "INSPECTED"
		| "SENT_BACK"
		| "SKIPPED";
	attendant: string;
	due: string;
	guestArrives?: string;
	checklist: { label: string; done: boolean }[];
	note?: string;
	priority?: boolean;
	attendantId?: Id;
	startedAt?: string;
	doneAt?: string;
	/** The attendant's note for the supervisor (My rooms), shown on Inspect. */
	attendantNote?: string;
	/** When a skipped room is tried again, "HH:mm". */
	retryAt?: string;
};
/** A housekeeping request for linen, for laundry to send. */
export type LinenRequestRow = {
	id: Id;
	items: string;
	roomNumber?: string;
	requestedBy: string;
	requestedAt: string;
	status: "REQUESTED" | "SENT";
	sentAt?: string;
	sentBy?: string;
};
/** One minibar price from Hotel setup (price list MINIBAR). */
export type MinibarPrice = {
	id: Id;
	name: string;
	price: number;
	active: boolean;
};
export type LaundryOrderRow = {
	id: Id;
	guestName: string;
	roomNumber: string;
	items: { name: string; qty: number; price: number }[];
	total: number;
	status: "RECEIVED" | "WASHING" | "READY" | "DELIVERED";
	receivedAt: string;
	promisedAt: string;
	paid: boolean;
	chargedToRoom: boolean;
	pocketNote?: string;
};
export type LostFoundRow = {
	id: Id;
	description: string;
	foundWhere: string;
	foundBy: string;
	foundAt: string;
	status: "FOUND" | "RETURNED" | "DISPOSED";
	returnedTo?: string;
	details?: string;
	roomNumber?: string;
	hasPhoto?: boolean;
	returnedAt?: string;
	returnedBy?: string;
	returnIdNote?: string;
	returnHow?: string;
	disposedAt?: string;
	disposedBy?: string;
	disposeReason?: string;
	frontOfficeToldAt?: string;
	/** The Lagos day from which the item may be disposed of (found day + the hotel's hold days). */
	disposableFrom?: string;
	holdDays?: number;
};

export type HotelSetupSection = {
	key: string;
	title: string;
	description: string;
	icon: string;
	ownerOnly?: boolean;
	fields: {
		key: string;
		label: string;
		type:
			| "text"
			| "number"
			| "toggle"
			| "select"
			| "time"
			| "list"
			| "money"
			| "percent";
		value: unknown;
		options?: string[];
		help?: string;
	}[];
};

export type BusinessStageKey =
	| "LEAD"
	| "ONBOARDING"
	| "HANDED_OVER"
	| "LIVE"
	| "AT_RISK"
	| "SUSPENDED"
	| "CHURNED";
export type BusinessRow = {
	id: Id;
	name: string;
	ownerName: string;
	ownerEmail: string;
	ownerPhone?: string;
	stage: BusinessStageKey;
	source?: "SELF_SERVE" | "BACK_OFFICE";
	hotels: number;
	rooms: number;
	city: string;
	accountManager: string;
	accountManagerId?: Id;
	health: number;
	feeModel: string;
	feeModelKey?: string;
	feeValue: number;
	mrr: number;
	since: string;
	lastActive?: string;
	marketer?: string;
	marketerId?: Id;
	adoption: number;
	openTickets: number;
	dueFees: number;
	legalName?: string;
	registrationNumber?: string;
	businessType?: string;
	address?: string;
	email?: string;
	phone?: string;
	currency?: string;
	timezone?: string;
	country?: string;
	logoUrl?: string;
	brandColour?: string;
	contractStartsOn?: string;
	contractNotes?: string;
	onboarding?: {
		status: "IN_PROGRESS" | "READY_FOR_HANDOVER" | "DONE";
		step: number;
		completedSteps: string[];
	};
};
export type MarketerRow = {
	id: Id;
	fullName: string;
	email: string;
	phone: string;
	status: "PENDING" | "ACTIVE" | "ENDED";
	sharePct: number;
	months: number;
	businesses: number;
	earnedTotal: number;
	due: number;
	joined: string;
};
export type TicketRow = {
	id: Id;
	businessName: string;
	subject: string;
	body: string;
	priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
	openedBy: string;
	openedAt: string;
	assignedTo?: string;
	resolution?: string;
};
export type FeeStatementRow = {
	id: Id;
	businessName: string;
	month: string;
	base: number;
	fee: number;
	paid: number;
	status: "DUE" | "PART_PAID" | "PAID" | "OVERDUE";
};
export type PlatformChangeRow = {
	id: Id;
	businessName: string;
	area: string;
	description: string;
	reason: string;
	madeBy: string;
	at: string;
	undoUntil: string;
	undone?: boolean;
};
export type OnboardingRow = {
	id: Id;
	businessId: Id;
	businessName: string;
	source: "SELF_SERVE" | "BACK_OFFICE";
	step: number;
	totalSteps: number;
	completedSteps: string[];
	assignedTo: string;
	assignedToId?: Id;
	startedAt: string;
	updatedAt?: string;
	status: "IN_PROGRESS" | "READY_FOR_HANDOVER" | "DONE";
	nextAction: string;
	data: Record<string, unknown>;
};
export type AdminUserRow = {
	id: Id;
	fullName: string;
	email: string;
	role: "SUPER_ADMIN" | "SUPPORT" | "FINANCE_ADMIN";
	status: "ACTIVE" | "PAUSED";
	lastSignIn?: string;
	twoStep: boolean;
};

/** What the booking's payment plan asks for now: a 50% deposit or the full stay, less what is already paid. */
export function dueOnBooking(
	b: Pick<BookingRow, "paymentPlan" | "totalAmount" | "paid">,
): number {
	const target =
		b.paymentPlan === "PAY_IN_FULL"
			? b.totalAmount
			: b.paymentPlan === "DEPOSIT_50"
				? Math.round(b.totalAmount / 2)
				: 0;
	return Math.max(0, target - b.paid);
}

/** Card payments sent to the POS and not confirmed yet, per booking: the summaries show them as pending. */
export function pendingByBooking(
	payments: Pick<PaymentRow, "bookingId" | "status" | "amount">[],
): Record<string, number> {
	const out: Record<string, number> = {};
	for (const p of payments) {
		if (!p.bookingId || (p.status !== "PROCESSING" && p.status !== "PENDING"))
			continue;
		out[p.bookingId] = (out[p.bookingId] ?? 0) + p.amount;
	}
	return out;
}

// ---- restaurant and bar ------------------------------------------------------------------------------

export type OutletKind = "KITCHEN" | "BAR" | "RESTAURANT";
export type TableRow = {
	id: Id;
	outletId: Id;
	number: string;
	seats: number;
	active: boolean;
};
export type OutletRow = {
	id: Id;
	name: string;
	kind: OutletKind;
	status: "OPEN" | "CLOSED";
	/** The inventory store the outlet draws from. */
	storeId?: Id;
	tables: TableRow[];
};
export type CategoryRow = {
	id: Id;
	name: string;
	sortOrder: number;
	active: boolean;
};
export type HappyHourRow = {
	id: Id;
	name: string;
	from: string;
	to: string;
	/** MON,TUE,… as the service stores them. */
	days: string;
	discountPct: number;
	active: boolean;
};
export type OutletSalesRow = {
	outletId: Id;
	name: string;
	kind?: string;
	orders: number;
	sales: number;
	paidAtOutlet: number;
	chargedToRooms: number;
	cancelled: number;
	byMethod: Record<string, number>;
	topItems: { name: string; qty: number; sales: number }[];
};
export type OutletSalesDayRow = {
	date?: string;
	outlets: OutletSalesRow[];
	totals: Omit<OutletSalesRow, "outletId" | "name" | "kind" | "topItems">;
};
/** What the hotel's settings say about the outlets and tax. */
export type OutletSettingsRow = {
	roomCharge: boolean;
	tabs: boolean;
	tabLimit: number;
	vatPct: number;
	serviceChargePct: number;
	pricesIncludeTax: boolean;
};

// ---- laundry and maintenance (docs/laundry-maintenance.md in hospio-backend) ----

export type WorkOrderStatus =
	| "OPEN"
	| "ASSIGNED"
	| "IN_PROGRESS"
	| "ON_HOLD"
	| "DONE"
	| "CANCELLED";
export type WorkOrderPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type WorkOrderPart = {
	itemId: string;
	name: string;
	unit: string;
	quantity: number;
	unitCost: number;
	value: number;
};
export type WorkOrderRow = {
	id: Id;
	number: string;
	roomId?: string;
	roomNumber?: string;
	area?: string;
	/** "Room A105" or the area. */
	where: string;
	category: string;
	priority: WorkOrderPriority;
	status: WorkOrderStatus;
	title: string;
	description?: string;
	source?: string;
	reportedBy?: string;
	reportedByName: string;
	reportedByRole?: string;
	assignedTo?: string;
	assignedToName?: string;
	dueAt?: string;
	overdue: boolean;
	startedAt?: string;
	holdReason?: string;
	doneAt?: string;
	completionNote?: string;
	labourMinutes?: number;
	parts: WorkOrderPart[];
	partsCost: number;
	vendorName?: string;
	vendorCost: number;
	totalCost: number;
	roomOutOfOrder: boolean;
	oooUntil?: string;
	reopenCount: number;
	reopenReason?: string;
	cancelReason?: string;
	hasPhoto: boolean;
	assetName?: string;
	scheduleId?: string;
	createdAt: string;
	updates: { at: string; by: string; note: string }[];
};
export type MaintAssetRow = {
	id: Id;
	name: string;
	category: string;
	roomId?: string;
	roomNumber?: string;
	area?: string;
	where: string;
	active: boolean;
	openWorkOrders: number;
};
export type MaintScheduleRow = {
	id: Id;
	title: string;
	description?: string;
	category: string;
	priority: WorkOrderPriority;
	everyDays: number;
	nextDue: string;
	lastDone?: string;
	lastOpened?: string;
	assetId?: string;
	assetName?: string;
	roomId?: string;
	roomNumber?: string;
	area?: string;
	where: string;
	assignedTo?: string;
	assignedToName?: string;
	paused: boolean;
};
export type MaintenanceMoney = {
	from: string;
	to: string;
	done: number;
	open: number;
	overdue: number;
	partsCost: number;
	vendorCost: number;
	labourMinutes: number;
	totalCost: number;
	byCategory: { category: string; count: number; cost: number }[];
};
export type LaundryPriceRow = {
	id: Id;
	name: string;
	category: string;
	price: number;
	expressPrice: number;
	active: boolean;
	sortOrder: number;
};
export type GuestLaundryStatus =
	| "RECEIVED"
	| "IN_PROGRESS"
	| "READY"
	| "DELIVERED"
	| "CANCELLED";
export type GuestLaundryRow = {
	id: Id;
	number: string;
	bookingId?: string;
	guestName: string;
	roomId?: string;
	roomNumber?: string;
	lines: {
		priceId?: string;
		name: string;
		quantity: number;
		unitPrice: number;
		amount: number;
	}[];
	express: boolean;
	total: number;
	status: GuestLaundryStatus;
	settlement?: "ROOM" | "PAID";
	chargedAt?: string;
	paidAt?: string;
	paymentMethod?: string;
	promisedAt?: string;
	note?: string;
	pocketNote?: string;
	cancelReason?: string;
	receivedByName?: string;
	createdAt: string;
	deliveredAt?: string;
};
export type LinenBatchRow = {
	id: Id;
	number: string;
	status: "SENT" | "RECEIVED" | "PART_RETURNED" | "RETURNED" | "CLOSED";
	lines: {
		itemId: string;
		name: string;
		unit: string;
		sent: number;
		received?: number;
		returned: number;
		condemned: number;
		lost: number;
		missing: number;
		outstanding: number;
		unitCost: number;
	}[];
	note?: string;
	sentByName?: string;
	createdAt: string;
	receivedAt?: string;
	receivedByName?: string;
	returnedAt?: string;
	closedReason?: string;
	condemnedValue: number;
	lostValue: number;
	sent: number;
	missing: number;
	outstanding: number;
};
export type LaundryMoney = {
	from: string;
	to: string;
	orders: number;
	income: number;
	charged: number;
	paid: number;
	open: number;
	cancelled: number;
	condemnedValue: number;
	lostValue: number;
};

/** Roles & permissions · Staff access: one person with their roles at the active hotel (plus business-wide ones). */
export type RolesAccessRow = {
	id: Id;
	photo?: string;
	fullName: string;
	email: string;
	department: string;
	/** ACTIVE, PAUSED (every role paused or the account paused), INVITED (invite not accepted yet), SUSPENDED. */
	status: "ACTIVE" | "PAUSED" | "INVITED" | "SUSPENDED";
	grants: GrantRow[];
	/** Roles the person holds at the business's other hotels (not changeable from this hotel). */
	otherHotelRoles: number;
	/** The signed-in person: their own roles are not theirs to change. */
	self: boolean;
};

// ---- owner portal (docs/owner-portal.md) -----------------------------------------------------------

/** A row of an owner list: which hotel of the business it belongs to. */
export type AtHotel = { hotelId: Id; hotelName: string };

/** One person at one hotel (a person working at two hotels is two rows). */
export type OwnerStaffRow = StaffRow &
	AtHotel & {
		/** Key for the list: person and hotel. */
		key: string;
		pausedUntil?: string;
		statusReason?: string;
		statusChangedBy?: string;
		statusChangedAt?: string;
		/** Their grants at this hotel, for "remove from hotel". */
		grantIdsHere: string[];
		isManager: boolean;
	};

export type OwnerThreadRow = {
	id: Id;
	hotelId?: Id;
	hotelName?: string;
	subject: string;
	audience: "PERSON" | "MANAGERS";
	withName: string;
	mine: boolean;
	lastAt: string;
	preview: string;
	unread: number;
	broadcastId?: string;
};

export type OwnerThreadMessage = {
	id: Id;
	senderName: string;
	body: string;
	at: string;
	mine: boolean;
};

export type SettlementView = {
	id: Id;
	day: string;
	provider: string;
	hotelName?: string;
	gross: number;
	fees: number;
	hmsShare: number;
	net: number;
	payments: number;
	status: "PENDING" | "SETTLED" | "FAILED";
	settledAt?: string;
	failureReason?: string;
};

export type OwnerChangeRow = PlatformChangeRow & {
	hotelName?: string;
	undoRequestedAt?: string;
	undoRequestedBy?: string;
	undoTicketId?: string;
};

export type ReportScheduleRow = {
	id: Id;
	kind: string;
	name: string;
	every: "DAILY" | "WEEKLY" | "MONTHLY";
	sendAt: string;
	hotelId?: Id;
	hotelName: string;
	managers: boolean;
	status: "SCHEDULED" | "STOPPED";
	nextRunAt?: string;
	lastRunAt?: string;
	requestedBy: string;
};

export type ReportRunRow = {
	id: Id;
	kind: string;
	name: string;
	from: string;
	to: string;
	hotelId?: Id;
	hotelName: string;
	at: string;
};

export type CreditRequestRow = {
	approvalId: Id;
	status: "PENDING" | "APPROVED" | "DECLINED" | "QUESTION";
	organizationId?: Id;
	organizationName: string;
	hotelId?: Id;
	hotelName: string;
	currentLimit?: number;
	requestedLimit: number;
	outstanding?: number;
	requesterName: string;
	createdAt: string;
	decidedBy?: string;
	note?: string;
};

export type TransferRequestRow = {
	id: Id;
	subject: string;
	status: string;
	createdAt: string;
	resolvedAt?: string;
	resolution?: string;
};

// ---- who is in a room (hospio-backend docs/occupancy.md) ------------------------------------------

// The hotel's business day is Lagos's (reservation-service Occupancy.today()), wherever the page renders.
const isoToday = () => {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Africa/Lagos",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());
	const part = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
	return `${part("year")}-${part("month")}-${part("day")}`;
};

/** A guest still checked in after their departure date: they keep the room until they are checked out. */
export function pastDeparture(
	b: Pick<BookingRow, "status" | "checkOutDate">,
	today = isoToday(),
): boolean {
	return b.status === "CHECKED_IN" && b.checkOutDate < today;
}

/** An occupied room: "due out" when its guest leaves today (a same-day turnover), "past departure" when they stayed on. */
export function occupancyLabel(
	r: Pick<RoomRow, "state" | "checkOut">,
	today = isoToday(),
): "Due out" | "Past departure" | null {
	if (r.state !== "occupied" || !r.checkOut) return null;
	if (r.checkOut < today) return "Past departure";
	return r.checkOut === today ? "Due out" : null;
}

/** The hint for an occupied room in a room picker. */
export function occupantHint(
	r: Pick<RoomRow, "state" | "checkOut" | "guestName">,
	today = isoToday(),
): string {
	const who = r.guestName ?? "a guest";
	const label = occupancyLabel(r, today);
	return label === "Due out"
		? `Due out today · ${who} still checked in`
		: label === "Past departure"
			? `Past departure · ${who} still checked in`
			: `Occupied · ${who}`;
}

/** The refusal while somebody is still checked in to the room; the API answers the same. */
export function stillInHouseMessage(
	r: Pick<RoomRow, "number" | "guestName">,
): string {
	return `Room ${r.number} still has a guest checked in (${r.guestName ?? "another guest"}). Check them out first, or choose another room.`;
}
