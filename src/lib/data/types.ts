/**
 * The shapes the screens render. They follow the backend DTOs (hospio-backend/*-service/dto) so the
 * API switch is a mapping, not a redesign. Money is in naira, dates are ISO strings.
 */

export type Id = string;

export type HotelSummary = { id: Id; name: string; city: string; address: string; rooms: number; timezone: string; occupancy: number; manager: string };

export type RoomTypeRow = { id: Id; name: string; basePrice: number; capacityAdults: number; capacityChildren: number; rooms: number; facilities: string[]; specialPrices: { id: Id; name: string; price: number; fromDate: string; toDate: string }[] };

export type RoomState = "occupied" | "ready" | "dirty" | "held" | "out_of_order" | "inspecting";
export type RoomRow = { id: Id; number: string; floor: string; typeId: Id; typeName: string; price: number; state: RoomState; guestName?: string; checkOut?: string; note?: string; outOfOrderReason?: string; outOfOrderUntil?: string; lastCleaned?: string; attendant?: string };

export type BookingStatus = "BOOKED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
export type PaymentPlan = "PAY_IN_FULL" | "DEPOSIT_50" | "PAY_AT_CHECKOUT" | "ORGANIZATION";
export type PriceKind = "NORMAL" | "SPECIAL" | "COMPLIMENTARY";
export type BookingRow = {
	id: Id; reference: string; guestId: Id; guestName: string; guestPhone: string; guestEmail?: string;
	roomTypeId: Id; roomTypeName: string; roomId?: Id; roomNumber?: string;
	checkInDate: string; checkOutDate: string; nights: number; adults: number; children: number; eta?: string;
	status: BookingStatus; priceKind: PriceKind; nightlyRate: number; totalAmount: number; paid: number; paymentPlan: PaymentPlan;
	organizationId?: Id; organizationName?: string; source: string; notes?: string; createdAt: string; checkedInAt?: string; checkedOutAt?: string; cancelReason?: string;
};

export type GuestRow = { id: Id; fullName: string; phone: string; email?: string; idType?: string; idNumber?: string; nationality?: string; preferences?: string; notes?: string; stays: number; lastStay?: string; blacklisted: boolean; organizationName?: string };

export type FolioLineKind = "CHARGE" | "PAYMENT" | "DISCOUNT" | "REFUND";
export type FolioLine = { id: Id; kind: FolioLineKind; description: string; category: string; amount: number; tax: number; postedAt: string; postedBy: string; voided?: boolean; voidReason?: string; source: string };
export type FolioRow = { id: Id; bookingId: Id; reference: string; guestId: Id; guestName: string; guestPhone?: string; guestEmail?: string; roomNumber: string; organizationName?: string; status: "OPEN" | "CLOSED" | "CLOSED_WITH_BALANCE"; charges: number; tax: number; discounts: number; payments: number; balance: number; openedAt: string; closedAt?: string; lines: FolioLine[]; notes: { by: string; at: string; text: string }[] };

export type PaymentMethod = "CARD" | "TRANSFER" | "CASH";
export type PaymentStatus = "PENDING" | "PROCESSING" | "APPROVED" | "DECLINED" | "NO_RESPONSE" | "FAILED" | "REFUNDED";
export type PaymentRow = { id: Id; reference: string; folioId?: Id; guestName: string; roomNumber?: string; role: string; takenBy: string; method: PaymentMethod; amount: number; status: PaymentStatus; terminal?: string; providerRef?: string; createdAt: string; resolvedAt?: string; receiptSent?: "EMAIL" | "WHATSAPP" | "NONE"; description: string };
export type TerminalRow = { id: Id; name: string; provider: string; ref: string; status: "ONLINE" | "OFFLINE"; roles: string[]; lastSeen: string; todayCount: number; todayAmount: number };
export type RefundRow = { id: Id; paymentId: Id; guestName: string; amount: number; reason: string; status: "PENDING_APPROVAL" | "APPROVED" | "DECLINED"; requestedBy: string; createdAt: string };
export type DisputeRow = { id: Id; paymentId: Id; guestName: string; amount: number; reason: string; status: "OPEN" | "RESOLVED"; openedAt: string; resolution?: string };

export type StaffRow = { id: Id; fullName: string; email: string; phone: string; role: string; level: "FULL" | "EDIT" | "VIEW"; department: string; jobTitle: string; status: "ACTIVE" | "PAUSED" | "SUSPENDED" | "ON_LEAVE"; shift: string; startedOn: string; lastSignIn?: string; hotelId: Id; photo?: string };
export type ShiftRow = { id: Id; staffId: Id; staffName: string; role: string; date: string; starts: string; ends: string; status: "SCHEDULED" | "SWAPPED" | "COVERED" | "CANCELLED" | "ABSENT" | "PRESENT" };
export type LeaveRow = { id: Id; staffId: Id; staffName: string; role: string; from: string; to: string; days: number; reason: string; status: "PENDING" | "APPROVED" | "DECLINED" | "CHANGE_REQUESTED"; note?: string };
export type ShiftRequestRow = { id: Id; staffName: string; role: string; kind: "SWAP" | "COVER"; date: string; shift: string; withName?: string; reason?: string; status: "PENDING" | "APPROVED" | "DECLINED" };

export type ExpenseRow = { id: Id; date: string; category: string; description: string; amount: number; paidFrom: "CASH" | "TRANSFER" | "CARD"; requestedBy: string; status: "RECORDED" | "PENDING_APPROVAL" | "APPROVED" | "DECLINED" | "QUESTION" | "PAID"; receipt?: boolean; note?: string };
export type TillRow = { id: Id; role: string; openedBy: string; openedAt: string; openingFloat: number; cashIn: number; expected: number; counted?: number; variance?: number; status: "OPEN" | "CLOSED"; closedAt?: string };
export type TransactionRow = { id: Id; at: string; kind: "PAYMENT" | "EXPENSE" | "REFUND" | "DEPOSIT"; description: string; method: string; amount: number; by: string; reference: string };
export type NightAuditRow = { id: Id; date: string; status: "OPEN" | "CLOSED"; revenue: number; cashCounted?: number; variance?: number; roomsOccupied: number; arrivals: number; departures: number; noShows: number; closedBy?: string; closedAt?: string; checklist: { key: string; label: string; done: boolean; detail?: string }[] };

export type OrganizationRow = { id: Id; name: string; contactName: string; contactPhone: string; contactEmail: string; creditLimit: number; dailyCap?: number; billingCycle: string; termsDays: number; status: "ACTIVE" | "ON_HOLD"; outstanding: number; staffCount: number; staysThisMonth: number; agreementNotes?: string; since: string };
export type OrgMemberRow = { id: Id; fullName: string; staffRef: string; phone: string; email?: string; active: boolean };
export type InvoiceRow = { id: Id; number: string; organizationId: Id; organizationName: string; periodFrom: string; periodTo: string; amount: number; paid: number; dueDate: string; status: "DRAFT" | "SENT" | "PART_PAID" | "PAID" | "OVERDUE" };

export type StoreRow = { id: Id; name: string; kind: string; items: number; lowItems: number; keeper: string };
export type StockItemRow = { id: Id; name: string; category: string; unit: string; minLevel: number; quantity: number; unitCost: number; supplierName?: string; storeId: Id; storeName: string; lastMovement?: string };
export type StockRequestRow = { id: Id; fromTeam: string; requestedBy: string; lines: { name: string; quantity: number; unit: string }[]; note?: string; status: "REQUESTED" | "ISSUED" | "PART_ISSUED" | "DECLINED"; createdAt: string };
export type PurchaseOrderRow = { id: Id; number: string; supplierName: string; lines: { name: string; quantity: number; unit: string; unitCost: number }[]; total: number; status: "DRAFT" | "PENDING_APPROVAL" | "SENT" | "RECEIVED" | "CANCELLED"; expectedOn?: string; createdBy: string; createdAt: string };
export type DeliveryRow = { id: Id; supplierName: string; poNumber?: string; lines: number; total: number; receivedBy: string; receivedAt: string; note?: string };
export type StockCountRow = { id: Id; storeName: string; status: "OPEN" | "COUNTED" | "APPROVED"; startedBy: string; startedAt: string; variance?: number; lines?: { name: string; expected: number; counted: number }[] };
export type SupplierRow = { id: Id; name: string; contactName: string; phone: string; email?: string; terms: string; items: number; lastOrder?: string };

export type RepairRow = { id: Id; title: string; description?: string; roomNumber?: string; area?: string; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"; status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "WAITING_PARTS" | "DONE" | "CANCELLED"; source: string; reportedBy: string; assignedTo?: string; createdAt: string; doneAt?: string; roomOutOfOrder?: boolean; updates: { at: string; by: string; note: string }[]; quotes?: { vendor: string; amount: number; chosen?: boolean }[] };
export type ScheduledJobRow = { id: Id; title: string; area: string; everyDays: number; nextDue: string; lastDone?: string; assignedTo?: string; paused: boolean; runs: { on: string; by: string; note?: string }[] };
export type SparePartRow = { id: Id; name: string; quantity: number; minQuantity: number; unitCost: number };

export type ActivityRow = { id: Id; at: string; actor: string; actorRole: string; department: string; action: string; summary: string; eventType: string; byPlatform?: boolean; payload?: Record<string, unknown> };
export type ApprovalRow = { id: Id; kind: string; sourceModule: string; description: string; amount?: number; requesterName: string; requesterRole: string; approverLevel: "MANAGER" | "OWNER"; status: "PENDING" | "APPROVED" | "DECLINED" | "QUESTION"; createdAt: string; decidedBy?: string; note?: string; hotelName?: string };
export type NotificationRow = { id: Id; kind: string; title: string; body?: string; link?: string; at: string; read: boolean; tone: "info" | "warning" | "danger" | "success" };

export type ConversationRow = { id: Id; kind: "GUEST" | "STAFF"; name: string; contact: string; channel: "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP"; subject: string; assignedTo?: string; lastAt: string; unread: number; preview: string; messages: { id: Id; direction: "IN" | "OUT"; by: string; at: string; body: string }[] };
export type TemplateRow = { id: Id; key: string; channel: string; subject?: string; body: string; active: boolean };
export type ReportRow = { id: Id; name: string; kind: string; description: string; lastRun?: string; schedule?: string; recipients?: string; formats: string[] };

export type DepartmentLive = { key: string; name: string; onShift: number; scheduled: number; actionsLastHour: number; lastAction: string; lastAt: string; open: number; openLabel: string; tone: "success" | "warning" | "danger" | "grey" };

export type MenuItemRow = { id: Id; outletId: Id; outlet: string; category: string; name: string; price: number; available: boolean; options?: string[]; description?: string };
export type OrderRow = { id: Id; number: string; outlet: string; kind: "DINE_IN" | "ROOM_SERVICE" | "TAB" | "TAKEAWAY"; tableNo?: string; roomNumber?: string; guestName?: string; status: "OPEN" | "SENT" | "READY" | "SERVED" | "CLOSED" | "CANCELLED"; lines: { name: string; qty: number; price: number; options?: string; status: string }[]; subtotal: number; tax: number; total: number; paid: boolean; chargedToRoom: boolean; openedBy: string; openedAt: string };

export type CleaningTaskRow = { id: Id; roomNumber: string; roomId: Id; kind: "STAYOVER" | "DEPARTURE" | "DEEP"; status: "TODO" | "IN_PROGRESS" | "DONE" | "INSPECTED" | "SENT_BACK" | "SKIPPED"; attendant: string; due: string; guestArrives?: string; checklist: { label: string; done: boolean }[]; note?: string; priority?: boolean };
export type LaundryOrderRow = { id: Id; guestName: string; roomNumber: string; items: { name: string; qty: number; price: number }[]; total: number; status: "RECEIVED" | "WASHING" | "READY" | "DELIVERED"; receivedAt: string; promisedAt: string; paid: boolean; chargedToRoom: boolean; pocketNote?: string };
export type LostFoundRow = { id: Id; description: string; foundWhere: string; foundBy: string; foundAt: string; status: "FOUND" | "RETURNED" | "DISPOSED"; returnedTo?: string };

export type HotelSetupSection = { key: string; title: string; description: string; icon: string; ownerOnly?: boolean; fields: { key: string; label: string; type: "text" | "number" | "toggle" | "select" | "time" | "list" | "money" | "percent"; value: unknown; options?: string[]; help?: string }[] };

export type BusinessRow = { id: Id; name: string; ownerName: string; ownerEmail: string; stage: "LEAD" | "ONBOARDING" | "HANDED_OVER" | "LIVE" | "AT_RISK" | "SUSPENDED"; hotels: number; rooms: number; city: string; accountManager: string; health: number; feeModel: string; feeValue: number; mrr: number; since: string; lastActive?: string; marketer?: string; adoption: number; openTickets: number; dueFees: number };
export type MarketerRow = { id: Id; fullName: string; email: string; phone: string; status: "PENDING" | "ACTIVE" | "ENDED"; sharePct: number; months: number; businesses: number; earnedTotal: number; due: number; joined: string };
export type TicketRow = { id: Id; businessName: string; subject: string; body: string; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"; status: "OPEN" | "IN_PROGRESS" | "RESOLVED"; openedBy: string; openedAt: string; assignedTo?: string; resolution?: string };
export type FeeStatementRow = { id: Id; businessName: string; month: string; base: number; fee: number; paid: number; status: "DUE" | "PART_PAID" | "PAID" | "OVERDUE" };
export type PlatformChangeRow = { id: Id; businessName: string; area: string; description: string; reason: string; madeBy: string; at: string; undoUntil: string; undone?: boolean };
export type OnboardingRow = { id: Id; businessName: string; step: number; totalSteps: number; assignedTo: string; startedAt: string; status: "IN_PROGRESS" | "READY_FOR_HANDOVER" | "DONE"; nextAction: string };
export type AdminUserRow = { id: Id; fullName: string; email: string; role: "SUPER_ADMIN" | "SUPPORT" | "FINANCE_ADMIN"; status: "ACTIVE" | "PAUSED"; lastSignIn?: string; twoStep: boolean };
