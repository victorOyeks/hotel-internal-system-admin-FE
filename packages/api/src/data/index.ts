import "server-only";

/**
 * The data seam every screen reads through. In demo mode each function answers from the fixtures
 * under src/lib/demo/fixtures; when the backend is wired in, swap the body of a function for the
 * matching `api("@get/...")` call and the screen above it does not change.
 */

import { cache } from "react";
import type { z } from "zod";
import { api } from "@hospio/api/api/client";
import type {
	Business,
	Hotel,
	ListItem,
	PaymentResponse,
	SetupSection,
	UserSummary,
} from "@hospio/api/api/schema";
import { allPages } from "./paging";
import { withSession } from "@hospio/api/api/server";
import {
	getActiveHotel,
	getActiveRole,
	getBusiness,
	getHotels,
	getSession,
} from "@hospio/api/dal";
import { demoDelay } from "@hospio/api/demo/mode";
import { isHotelRole } from "@hospio/api/roles";
import { live } from "./live";
import {
	failedPage,
	type ListQuery,
	PAGE_SIZE,
	type PageResult,
	pageQuery,
	slicePage,
	toPaged,
} from "./paging";
import { errorMessage } from "@hospio/api/api/client";
import {
	SETUP_LISTS,
	type SetupListName,
	toSetupSections,
} from "./mappers/hotel-config";
import { toPortalUserRow, toRolesAccessRow, toStaffRow } from "./mappers/identity";
import { lagosDate, lagosDay } from "./mappers/finance";
import { fnbData } from "./fnb";
import { inventoryData } from "./inventory";
import { lmData } from "./lm";
import { mlData } from "./ml";
import { opsData } from "./ops";
import { ownerData } from "./owner";
import { toAreaRow, toRoomRow, toRoomTypeRow } from "./mappers/property";
import {
	toInvoiceRow,
	toOrganizationSummaryRow,
	toOrgMemberRow,
	withDemoFigures,
} from "./mappers/organizations";
import { toBookingRow, toFolioRow, toGuestRow } from "./mappers/reservation";
import {
	toBusinessRow,
	toBusinessRowFromBusiness,
	toHotelSummary,
	toOnboardingRow,
	toOwnerHotelRow,
	toSetupTemplateRow,
} from "./mappers/tenant";
import * as hotel from "@hospio/api/demo/fixtures/hotel";
import * as ops from "@hospio/api/demo/fixtures/ops";
import * as owner from "@hospio/api/demo/fixtures/owner";
import * as platform from "@hospio/api/demo/fixtures/platform";
import * as platformExtra from "@hospio/api/demo/fixtures/platform-extra";
import * as stay from "@hospio/api/demo/fixtures/stay";
import type {
	AdminUserRow,
	ApprovalLimits,
	ApprovalRow,
	AreaRow,
	BookingRow,
	BookingStatus,
	BusinessRow,
	MarketerRow,
	NotificationRow,
	OutletSettingsRow,
	PaymentQuery,
	BookingQuery,
	BookingView,
	GuestQuery,
	GuestView,
	FolioRow,
	GuestRow,
	HotelSetupSection,
	InvoiceRow,
	OrgMemberRow,
	HotelSummary,
	OnboardingRow,
	OwnerHotelRow,
	OrganizationRow,
	OrganizationsOverviewRow,
	PaymentRow,
	RefundRow,
	DisputeRow,
	PortalUserRow,
	RoomRow,
	RoomTypeRow,
	SetupTemplateRow,
	RolesAccessRow,
	StaffRow,
	TerminalRow,
	WorthRow,
} from "./types";
import { pendingByBooking } from "./types";

const give = async <T>(value: T): Promise<T> => {
	await demoDelay(40);
	return value;
};

const isToday = (iso: string) => iso === hotel.today();

export function bookingBuckets(bookings: BookingRow[]) {
	return {
		arrivals: bookings.filter(
			(b) =>
				isToday(b.checkInDate) &&
				(b.status === "BOOKED" ||
					b.status === "NO_SHOW" ||
					(b.status === "CHECKED_IN" &&
						b.checkedInAt?.slice(0, 10) === hotel.today())),
		),
		departures: bookings.filter(
			(b) => isToday(b.checkOutDate) && b.status === "CHECKED_IN",
		),
		inHouse: bookings.filter((b) => b.status === "CHECKED_IN"),
		upcoming: bookings.filter(
			(b) => b.status === "BOOKED" && b.checkInDate > hotel.today(),
		),
		past: bookings.filter(
			(b) =>
				b.status === "CHECKED_OUT" ||
				b.status === "CANCELLED" ||
				(b.status === "NO_SHOW" && !isToday(b.checkInDate)),
		),
	};
}

/** payment-service's payment as the row every payments screen renders. */
export function toPaymentRow(p: z.infer<typeof PaymentResponse>): PaymentRow {
	return {
		id: p.id,
		reference: `PAY-${p.id.slice(0, 6).toUpperCase()}`,
		folioId: p.folioId ?? undefined,
		bookingId: p.bookingId ?? undefined,
		guestName: p.guestName ?? "Walk-in",
		role: p.role ?? "FRONT_OFFICE",
		takenBy: p.requestedByName ?? p.requestedBy ?? "—",
		method: p.method === "ORGANIZATION" ? "TRANSFER" : p.method,
		amount: Number(p.amount),
		status: p.status,
		terminal: p.terminalId ?? undefined,
		providerRef: p.providerRef ?? undefined,
		createdAt: p.createdAt,
		resolvedAt: p.resolvedAt ?? undefined,
		receiptSent: "NONE" as const,
		description: p.description ?? "Payment",
		hotelId: p.hotelId ?? undefined,
	};
}

const lagosDayOf = (iso: string) =>
	new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const has = (text: string | undefined, q?: string) =>
	!q || (text ?? "").toLowerCase().includes(q.toLowerCase());

/** Demo mode: the same page, filters and counts the services answer, over the fixtures. */
function demoPaymentPage(q: PaymentQuery): PageResult<PaymentRow> {
	const today = hotel.today();
	const statuses = q.status?.split(",");
	const base = stay.demoPayments.filter(
		(p) =>
			(!q.role || p.role === q.role) &&
			(!q.method || p.method === q.method) &&
			(!q.from || lagosDayOf(p.createdAt) >= q.from) &&
			(!q.to || lagosDayOf(p.createdAt) <= q.to) &&
			(has(p.guestName, q.q) || has(p.reference, q.q) || has(p.description, q.q)),
	);
	const rows = base
		.filter((p) => !statuses || statuses.includes(p.status))
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	const counts: Record<string, number> = { all: base.length };
	for (const p of base) counts[p.status] = (counts[p.status] ?? 0) + 1;
	counts.toVerify = base.filter((p) => ["PENDING", "PROCESSING", "NO_RESPONSE"].includes(p.status)).length;
	counts.attention = base.filter((p) => ["DECLINED", "NO_RESPONSE", "PROCESSING"].includes(p.status)).length;
	counts.today = base.filter((p) => lagosDayOf(p.createdAt) === today).length;
	counts.mine = base.length;
	const ok = (p: PaymentRow, day: (d: string) => boolean, m?: string) =>
		p.status === "APPROVED" && day(lagosDayOf(p.createdAt)) && (!m || p.method === m);
	const sum = (day: (d: string) => boolean, m?: string) =>
		stay.demoPayments.filter((p) => ok(p, day, m)).reduce((s, p) => s + p.amount, 0);
	const isToday = (d: string) => d === today;
	const isMonth = (d: string) => d.slice(0, 7) === today.slice(0, 7);
	const totals: Record<string, number> = {
		approved: base.filter((p) => p.status === "APPROVED").reduce((s, p) => s + p.amount, 0),
		approvedToday: sum(isToday),
		approvedTodayCount: stay.demoPayments.filter((p) => ok(p, isToday)).length,
		todayCard: sum(isToday, "CARD"),
		todayTransfer: sum(isToday, "TRANSFER"),
		todayCash: sum(isToday, "CASH"),
		approvedMonth: sum(isMonth),
		approvedMonthCount: stay.demoPayments.filter((p) => ok(p, isMonth)).length,
		monthCard: sum(isMonth, "CARD"),
		monthTransfer: sum(isMonth, "TRANSFER"),
		monthCash: sum(isMonth, "CASH"),
	};
	return { ok: true, data: slicePage(rows, q.page, q.size, { counts, totals }) };
}

function inView(b: BookingRow, v: BookingView, today: string) {
	switch (v) {
		case "arrivals":
			return b.checkInDate === today && b.status !== "CANCELLED" && b.status !== "CHECKED_OUT";
		case "departures":
			return b.checkOutDate === today && b.status === "CHECKED_IN";
		case "in-house":
			return b.status === "CHECKED_IN";
		case "upcoming":
			return b.status === "BOOKED" && b.checkInDate > today;
		case "past":
			return b.status === "CHECKED_OUT" || b.status === "CANCELLED" || (b.status === "NO_SHOW" && b.checkInDate < today);
		default:
			return true;
	}
}

function demoBookingPage(q: BookingQuery): PageResult<BookingRow> {
	const today = hotel.today();
	const statuses = q.status?.split(",");
	const base = stay.demoBookings.filter(
		(b) =>
			(has(b.guestName, q.q) || has(b.reference, q.q) || has(b.roomNumber, q.q) || has(b.guestPhone, q.q)) &&
			(!q.from || b.checkOutDate >= q.from) &&
			(!q.to || b.checkInDate <= q.to) &&
			(!q.arrivingFrom || b.checkInDate >= q.arrivingFrom) &&
			(!q.arrivingTo || b.checkInDate <= q.arrivingTo) &&
			(!q.guestId || b.guestId === q.guestId),
	);
	const views: BookingView[] = ["arrivals", "departures", "in-house", "upcoming", "past", "all"];
	const counts: Record<string, number> = {};
	for (const v of views) counts[v] = base.filter((b) => inView(b, v, today)).length;
	const rows = base
		.filter((b) => (!q.view || inView(b, q.view, today)) && (!statuses || statuses.includes(b.status)))
		.sort((a, b) => b.checkInDate.localeCompare(a.checkInDate) || b.createdAt.localeCompare(a.createdAt));
	const live = stay.demoBookings.filter((b) => b.status !== "CANCELLED" && b.status !== "NO_SHOW");
	const owing = live.filter((b) => b.paymentPlan !== "ORGANIZATION" && b.totalAmount - b.paid > 0);
	const arrivals = stay.demoBookings.filter((b) => inView(b, "arrivals", today));
	return {
		ok: true,
		data: slicePage(rows, q.page, q.size, {
			counts,
			totals: {
				booked: live.reduce((s, b) => s + (b.priceKind === "COMPLIMENTARY" ? 0 : b.totalAmount), 0),
				bookedCount: live.length,
				unpaid: owing.reduce((s, b) => s + (b.totalAmount - b.paid), 0),
				unpaidCount: owing.length,
				arrivalsCheckedIn: arrivals.filter((b) => b.status === "CHECKED_IN").length,
				arrivalsToCome: arrivals.filter((b) => b.status === "BOOKED").length,
				paidThisMonth: live
					.filter((b) => b.checkInDate.slice(0, 7) <= today.slice(0, 7) && b.checkOutDate.slice(0, 7) >= today.slice(0, 7))
					.reduce((s, b) => s + b.paid, 0),
				inHouseUnpaid: owing
					.filter((b) => b.status === "CHECKED_IN")
					.reduce((s, b) => s + (b.totalAmount - b.paid), 0),
				inHouseUnpaidCount: owing.filter((b) => b.status === "CHECKED_IN").length,
			},
		}),
	};
}

function demoGuestPage(q: GuestQuery): PageResult<GuestRow> {
	const inHouse = new Set(stay.demoBookings.filter((b) => b.status === "CHECKED_IN").map((b) => b.guestId));
	const base = stay.demoGuests
		.filter((g) => has(g.fullName, q.q) || has(g.phone, q.q) || has(g.email, q.q))
		.map((g) => ({ ...g, inHouse: inHouse.has(g.id) }));
	const views: Record<GuestView, (g: GuestRow) => boolean> = {
		all: () => true,
		"in-house": (g) => !!g.inHouse,
		repeat: (g) => g.stays > 1,
		blacklisted: (g) => g.blacklisted,
	};
	const counts: Record<string, number> = {};
	for (const [k, f] of Object.entries(views)) counts[k] = base.filter(f).length;
	return { ok: true, data: slicePage(base.filter(views[q.view ?? "all"]), q.page, q.size, { counts }) };
}

/** identity users for the caller's business, or a named business for platform callers. */
async function listUsers(
	query: {
		businessId?: string;
		hotelId?: string;
		role?: string;
		q?: string;
	} = {},
): Promise<UserSummary[]> {
	const q = Object.fromEntries(
		Object.entries(query).filter(([, v]) => v !== undefined && v !== ""),
	) as Record<string, string>;
	const { data: res, error } = await api("@get/identity/users", {
		...(await withSession()),
		query: q,
	});
	if (error || !res) {
		console.error("identity-service users:", error);
		return [];
	}
	// Without page or size identity answers the whole list.
	return Array.isArray(res.data) ? res.data : res.data.content;
}

/** The active hotel's people for a staff member (names and this hotel's roles only). */
async function listColleagues(): Promise<UserSummary[]> {
	const { data: res, error } = await api(
		"@get/identity/users/colleagues",
		await withSession(),
	);
	if (error || !res) {
		console.error("identity-service colleagues:", error);
		return [];
	}
	return res.data;
}

/** The hotels a business or the caller can see, as `id → name`. */
const hotelNameMap = (hotels: { id: string; name: string }[]) =>
	new Map(hotels.map((h) => [h.id, h.name]));

/** Managers by hotel id and by user id, so hotel rows can show who runs them. Empty when identity is off. */
async function managerNames(businessId?: string): Promise<Map<string, string>> {
	const names = new Map<string, string>();
	if (!live("identity")) return names;
	for (const u of await listUsers({ businessId, role: "MANAGER" })) {
		names.set(u.id, u.fullName);
		for (const g of u.grants)
			if (
				g.role === "MANAGER" &&
				g.hotelId &&
				!g.paused &&
				!names.has(g.hotelId)
			)
				names.set(g.hotelId, u.fullName);
	}
	return names;
}

/** The platform's hotels for one business (GET /tenant/businesses/{id}/hotels). */
async function businessHotels(businessId: string): Promise<Hotel[]> {
	const { data: res, error } = await api("@get/tenant/businesses/:id/hotels", {
		...(await withSession()),
		params: { id: businessId },
	});
	if (error || !res) {
		console.error("tenant-service business hotels:", error);
		return [];
	}
	return res.data;
}

const demoOwnerUsers = (
	query: { hotelId?: string; role?: string; q?: string } = {},
) =>
	owner.ownerPortalUsers.filter(
		(u) =>
			(!query.role || u.role === query.role) &&
			(!query.hotelId ||
				u.hotelIds.length === 0 ||
				u.hotelIds.includes(query.hotelId)) &&
			(!query.q ||
				`${u.fullName} ${u.email}`
					.toLowerCase()
					.includes(query.q.toLowerCase())),
	);

const demoBusinessUsers = (businessId: string): PortalUserRow[] =>
	businessId === "biz-1" || businessId === hotel.BUSINESS_ID
		? owner.ownerPortalUsers
		: platformExtra.demoBusinessUsers
				.filter((u) => u.businessId === businessId)
				.map((u) => ({
					id: u.id,
					userId: u.id,
					businessId: u.businessId,
					fullName: u.fullName,
					email: u.email,
					phone: "",
					role: isHotelRole(u.role) ? u.role : ("FRONT_OFFICE" as const),
					level: "FULL" as const,
					hotels: u.hotel ? [u.hotel] : ["All hotels"],
					hotelIds: [],
					hotel: u.hotel ?? "All hotels",
					grants: [
						{
							id: `${u.id}-g0`,
							role: u.role,
							level: "FULL" as const,
							paused: u.status === "PAUSED",
						},
					],
					status: u.status,
					inviteStatus:
						u.status === "INVITED"
							? ("PENDING" as const)
							: ("ACCEPTED" as const),
					mustChangePassword: u.status === "INVITED",
					twoStep: false,
					lastSignIn: u.lastSignIn,
				}));

/** One page of folio-service's accounts, each with its figures (GET /folio/organizations?page=, docs/pagination.md). */
async function organizationsPage(
	q: ListQuery,
): Promise<PageResult<OrganizationRow>> {
	const { data: res, error } = await api("@get/folio/organizations", {
		...(await withSession()),
		query: pageQuery(q),
	});
	if (error || !res) {
		console.error("folio-service organizations:", error);
		return failedPage(errorMessage(error, "Organizations didn't load"));
	}
	return { ok: true, data: toPaged(res.data, toOrganizationSummaryRow) };
}

/** Every account of the hotel the call goes to, 100 at a time (pickers, the owner's credit requests). Keyed by that hotel. */
const everyOrganization = cache(
	async (_hotel: string): Promise<OrganizationRow[]> =>
		(
			await allPages(async (page, size) => {
				const r = await organizationsPage({ page, size });
				return r.ok ? r.data : null;
			})
		).rows,
);
const allOrganizations = async (): Promise<OrganizationRow[]> =>
	everyOrganization((await withSession()).headers?.["X-Hotel-Id"] ?? "");

/** One page of invoices: the hotel's, or one account's (`organizationId`), latest due first, with counts and money. */
async function invoicesPage(
	q: ListQuery & { organizationId?: string },
): Promise<PageResult<InvoiceRow>> {
	const { organizationId, ...rest } = q;
	const s = await withSession();
	const { data: res, error } = organizationId
		? await api("@get/folio/organizations/:id/invoices", {
				...s,
				params: { id: organizationId },
				query: pageQuery(rest),
			})
		: await api("@get/folio/organizations/invoices", {
				...s,
				query: pageQuery(rest),
			});
	if (error || !res) {
		console.error("folio-service invoices:", error);
		return failedPage(errorMessage(error, "Invoices didn't load"));
	}
	return {
		ok: true,
		data: toPaged(res.data, (i) => toInvoiceRow(i, i.organizationName ?? "")),
	};
}

/** Demo accounts with the figures folio-service would give them. */
const demoOrganizationRows = () =>
	stay.demoOrganizations.map((o) =>
		withDemoFigures(
			o,
			stay.demoFolios.filter((f) => f.organizationName === o.name),
			stay.demoInvoices.filter((i) => i.organizationId === o.id),
		),
	);

const matches = (q: string | undefined, ...fields: (string | undefined)[]) =>
	!q ||
	fields.some((f) => (f ?? "").toLowerCase().includes(q.trim().toLowerCase()));

export const data = {
	/** The owner portal: every hotel of the business, each row tagged with its hotel (./owner, docs/owner-portal.md). */
	owner: ownerData,
	business: {
		/** The caller's business with hotels and onboarding state (GET /tenant/businesses/mine). */
		mine: async (): Promise<Business | null> => {
			if (!live("tenant")) return give(hotel.demoBusiness);
			return getBusiness();
		},
	},
	hotels: {
		/** The owner's hotels as the Hotels screen lists them. Finance figures are 0 until finance-service is wired. */
		list: async (): Promise<OwnerHotelRow[]> => {
			if (!live("tenant")) return give(owner.ownerHotels);
			const hotels = await getHotels();
			const managers = await managerNames();
			return hotels.map((h, i) => toOwnerHotelRow(h, i, managers));
		},
		get: async (id: string): Promise<OwnerHotelRow | null> =>
			(await data.hotels.list()).find((h) => h.hotelId === id) ?? null,
		/**
		 * The owner's hotels with this month's money from finance-service (revenue today and to date,
		 * expenses, last month's revenue, tonight's occupancy). Identity and counts come from `list`;
		 * the demo's hotels already carry their own figures.
		 */
		withMoney: async (): Promise<OwnerHotelRow[]> => {
			const hotels = await data.hotels.list();
			if (!live("finance") || hotels.length === 0) return hotels;
			const today = lagosDate();
			const first = `${today.slice(0, 8)}01`;
			const prevEnd = lagosDate(
				new Date(Date.parse(`${first}T12:00:00Z`) - 86_400_000),
			);
			const prevStart = `${prevEnd.slice(0, 8)}01`;
			const [day, month, prev] = await Promise.all([
				data.finance.ownerSummary(today, today),
				data.finance.ownerSummary(first, today),
				data.finance.ownerSummary(prevStart, prevEnd),
			]);
			const by = (s: typeof day) =>
				new Map(s.hotels.map((h) => [h.hotelId, h]));
			const [d, m, p] = [by(day), by(month), by(prev)];
			return hotels.map((h) => ({
				...h,
				revenueToday: d.get(h.hotelId)?.revenue ?? 0,
				revenueMonth: m.get(h.hotelId)?.revenue ?? 0,
				expensesMonth: m.get(h.hotelId)?.expenses ?? 0,
				revenueLastMonth: p.get(h.hotelId)?.revenue ?? 0,
				occupancy: Math.round(d.get(h.hotelId)?.occupancyPct ?? h.occupancy),
			}));
		},
		/**
		 * What the owner should look at today. The demo shows its sample list; live it is computed from what
		 * the services say: approvals waiting, hotels losing money this month, hotels nearly empty tonight.
		 */
		worth: async (
			hotels: OwnerHotelRow[],
			approvals: ApprovalRow[],
		): Promise<WorthRow[]> => {
			if (!live("finance")) return give(owner.ownerWorthALook);
			const items: WorthRow[] = [];
			const waiting = approvals.filter(
				(a) =>
					a.approverLevel === "OWNER" &&
					(a.status === "PENDING" || a.status === "QUESTION"),
			);
			if (waiting.length > 0)
				items.push({
					id: "w-approvals",
					tone: "warning",
					title: `${waiting.length === 1 ? "1 approval needs" : `${waiting.length} approvals need`} your decision`,
					detail: waiting
						.slice(0, 2)
						.map((a) => `${a.description} · ${a.requesterName}`)
						.join(" · "),
					area: "Approvals",
					href: `/dashboard?open=${waiting[0].id}`,
				});
			for (const h of hotels) {
				if (h.revenueMonth > 0 && h.expensesMonth > h.revenueMonth)
					items.push({
						id: `w-loss-${h.hotelId}`,
						tone: "danger",
						title: `${h.name} is spending more than it takes`,
						detail: `Revenue ${h.revenueMonth.toLocaleString("en-NG")} against expenses ${h.expensesMonth.toLocaleString("en-NG")} this month`,
						area: "Financials",
						href: "/dashboard/financials",
					});
				else if (h.status === "ACTIVE" && h.rooms > 0 && h.occupancy < 40)
					items.push({
						id: `w-occ-${h.hotelId}`,
						tone: "info",
						title: `${h.name} is ${h.occupancy}% full tonight`,
						detail: `${h.rooms} rooms · ${h.manager}`,
						area: "Hotels",
						href: `/dashboard/hotels/${h.hotelId}`,
					});
			}
			return items;
		},
		/**
		 * What the hotel's settings say about spending: APPROVAL_LIMITS and the default till float. Above
		 * `managerExpenseLimit` an expense needs the owner; `ownerExpenseLimit` 0 means no ceiling.
		 */
		limits: async (): Promise<{
			limits: ApprovalLimits;
			tillFloat: number;
		}> => {
			const fallback = {
				limits: {
					managerExpenseLimit: 500_000,
					ownerExpenseLimit: 0,
					discountPct: 10,
					refundsNeedOwner: false,
				},
				tillFloat: 50_000,
			};
			if (!live("hotel-config")) return give(fallback);
			const sections = await data.hotels.setup();
			const value = (section: string, key: string) =>
				sections
					.find((x) => x.key === section)
					?.fields.find((f) => f.key === key)?.value;
			const n = (v: unknown, d: number) =>
				typeof v === "number" && Number.isFinite(v) ? v : d;
			return {
				limits: {
					managerExpenseLimit: n(
						value("approvals", "managerExpenseLimit"),
						fallback.limits.managerExpenseLimit,
					),
					ownerExpenseLimit: n(value("approvals", "ownerExpenseLimit"), 0),
					discountPct: n(
						value("approvals", "discountPct"),
						fallback.limits.discountPct,
					),
					refundsNeedOwner: value("approvals", "refundsNeedOwner") === true,
					rateChangesNeedOwner: value("approvals", "rateChangesNeedOwner") !== false,
					rateChangeOwnerPct: n(value("approvals", "rateChangeOwnerPct"), 0),
				},
				tillFloat: n(value("money", "tillFloat"), 0),
			};
		},
		summaries: async (): Promise<HotelSummary[]> => {
			if (!live("tenant")) return give(hotel.demoHotelSummaries);
			const [hotels, managers] = await Promise.all([
				getHotels(),
				managerNames(),
			]);
			return hotels.map((h) => toHotelSummary(h, managers));
		},
		/**
		 * Hotel setup for the active hotel (or `hotelId`): GET /hotel-config/setup plus the lists, turned
		 * into the sections the screen renders. The catalogue lives in mappers/hotel-config.
		 */
		setup: async (hotelId?: string): Promise<HotelSetupSection[]> => {
			if (!live("hotel-config")) return give(ops.demoHotelSetup);
			const s = await withSession(hotelId ? { hotelId } : undefined);
			const [setup, active, ...lists] = await Promise.all([
				api("@get/hotel-config/setup", s),
				hotelId
					? api("@get/tenant/hotels/:id", { ...s, params: { id: hotelId } })
							.then((r) => r.data?.data ?? null)
							.catch(() => null)
					: getActiveHotel(),
				...SETUP_LISTS.map((listName) =>
					api("@get/hotel-config/setup/lists/:listName", {
						...s,
						params: { listName },
						query: {},
					}).catch(() => ({ data: null, error: null })),
				),
			]);
			if (setup.error || !setup.data) {
				console.error("hotel-config setup:", setup.error);
				return [];
			}
			const byName: Partial<Record<SetupListName, ListItem[]>> = {};
			SETUP_LISTS.forEach((listName, i) => {
				byName[listName] = lists[i]?.data?.data ?? [];
			});
			return toSetupSections(setup.data.data as SetupSection, byName, active);
		},
	},
	users: {
		/**
		 * Portal users: the owner's business (or `businessId` for platform callers), narrowed by hotel,
		 * role or a search. Hotel names come from the caller's hotels, or the business's for platform callers.
		 */
		list: async (
			query: {
				businessId?: string;
				hotelId?: string;
				role?: string;
				q?: string;
			} = {},
		): Promise<PortalUserRow[]> => {
			if (!live("identity"))
				return give(
					query.businessId && query.businessId !== hotel.BUSINESS_ID
						? demoBusinessUsers(query.businessId)
						: demoOwnerUsers(query),
				);
			const [users, hotels] = await Promise.all([
				listUsers(query),
				query.businessId ? businessHotels(query.businessId) : getHotels(),
			]);
			const names = hotelNameMap(hotels);
			return users
				.map((u) => toPortalUserRow(u, names))
				.sort((a, b) => a.fullName.localeCompare(b.fullName));
		},
		get: async (
			id: string,
			businessId?: string,
		): Promise<PortalUserRow | null> =>
			(await data.users.list({ businessId })).find((u) => u.id === id) ?? null,
		/**
		 * One page of portal users (GET /identity/users?page=, docs/pagination.md): `q` name, email or phone, `status` ACTIVE,
		 * PAUSED or SUSPENDED, `role`, `hotelId`; counts per status, managers and pending or expired invites over the rest.
		 */
		page: async (
			query: ListQuery & {
				businessId?: string;
				hotelId?: string;
				role?: string;
			} = {},
		): Promise<PageResult<PortalUserRow>> => {
			if (!live("identity")) {
				const all = demoOwnerUsers({
					q: query.q,
					role: query.role,
					hotelId: query.hotelId,
				});
				const rows = all.filter(
					(u) => !query.status || u.status === query.status,
				);
				const count = (f: (u: PortalUserRow) => boolean) =>
					all.filter(f).length;
				return give({
					ok: true,
					data: slicePage(rows, query.page ?? 0, query.size ?? PAGE_SIZE, {
						counts: {
							all: all.length,
							ACTIVE: count((u) => u.status === "ACTIVE"),
							PAUSED: count((u) => u.status === "PAUSED"),
							SUSPENDED: count((u) => u.status === "SUSPENDED"),
							MANAGER: count((u) => u.role === "MANAGER"),
							INVITE_PENDING: count((u) => u.inviteStatus === "PENDING"),
							INVITE_EXPIRED: count((u) => u.inviteStatus === "EXPIRED"),
						},
					}),
				});
			}
			const [res, hotels] = await Promise.all([
				api("@get/identity/users", {
					...(await withSession()),
					query: pageQuery(query) as { page: number; size: number },
				}),
				query.businessId ? businessHotels(query.businessId) : getHotels(),
			]);
			if (res.error || !res.data) {
				console.error("identity-service users page:", res.error);
				return failedPage(errorMessage(res.error, "People didn't load"));
			}
			const page = res.data.data;
			if (Array.isArray(page))
				return failedPage("identity-service answered a list, not a page");
			const names = hotelNameMap(hotels);
			return {
				ok: true,
				data: toPaged(page, (u) => toPortalUserRow(u, names)),
			};
		},
	},
	rooms: {
		list: async (): Promise<RoomRow[]> => {
			if (!live("property")) return give(hotel.demoRooms);
			const s = await withSession();
			const [areas, rooms, cleanliness, today] = await Promise.all([
				data.rooms.areas(),
				api("@get/property/rooms", { ...s, query: {} }),
				api("@get/housekeeping/room-status", s).catch(() => ({ data: null })),
				live("reservation")
					? api("@get/reservation/bookings/today", s).catch(() => ({
							data: null,
						}))
					: Promise.resolve({ data: null }),
			]);
			if (rooms.error || !rooms.data) {
				console.error("property-service rooms:", rooms.error);
				return [];
			}
			const clean = new Map(
				(cleanliness.data?.data ?? []).map((c) => [c.roomId, c]),
			);
			// Reservation says who is in a room (occupied) and which rooms wait for today's arrivals (held).
			const inHouse = new Map(
				(today.data?.data.inHouse ?? [])
					.filter((b) => b.roomId)
					.map((b) => [b.roomId as string, b]),
			);
			const arriving = new Map(
				(today.data?.data.arrivals ?? [])
					.filter((b) => b.roomId)
					.map((b) => [b.roomId as string, b]),
			);
			return rooms.data.data.map((r) => {
				const row = toRoomRow(r, areas, clean.get(r.id));
				if (row.state === "out_of_order") return row;
				const stay = inHouse.get(r.id);
				if (stay)
					return {
						...row,
						state: "occupied" as const,
						guestName: stay.guestName,
						checkOut: stay.checkOutDate,
					};
				const arrival = arriving.get(r.id);
				if (arrival && row.state === "ready")
					return {
						...row,
						state: "held" as const,
						guestName: arrival.guestName,
						note: `Arriving today · ${arrival.guestName}`,
						heldFor: arrival.id,
					};
				return row;
			});
		},
		types: async (): Promise<RoomTypeRow[]> => {
			if (!live("property")) return give(hotel.demoRoomTypes);
			const { data: res, error } = await api(
				"@get/property/room-types",
				await withSession(),
			);
			if (error || !res) {
				console.error("property-service room types:", error);
				return [];
			}
			return res.data.map(toRoomTypeRow);
		},
		areas: async (): Promise<AreaRow[]> => {
			if (!live("property")) {
				const names = Array.from(new Set(hotel.demoRooms.map((r) => r.floor)));
				return give(
					names.map((name, i) => ({
						id: `area-${i + 1}`,
						name,
						kind: "FLOOR",
						sortOrder: i + 1,
					})),
				);
			}
			const { data: res, error } = await api(
				"@get/property/areas",
				await withSession(),
			);
			if (error || !res) {
				console.error("property-service areas:", error);
				return [];
			}
			return res.data
				.map(toAreaRow)
				.sort(
					(a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
				);
		},
		get: async (id: string): Promise<RoomRow | null> => {
			const rooms = await data.rooms.list();
			return rooms.find((r) => r.id === id || r.number === id) ?? null;
		},
	},
	bookings: {
		/**
		 * One page of bookings (reservation-service, docs/pagination.md): the view (arrivals, departures, in-house, upcoming, past,
		 * all), search, status and dates, with the view counts and the money over the scope. Rows carry the guest's phone and email.
		 */
		page: async (q: BookingQuery = {}): Promise<PageResult<BookingRow>> => {
			if (!live("reservation")) return give(demoBookingPage(q));
			const { data: res, error } = await api("@get/reservation/bookings", {
				...(await withSession()),
				query: pageQuery(q),
			});
			if (error || !res) {
				console.error("reservation-service bookings:", error);
				return failedPage(
					errorMessage(error, "Bookings didn't load"),
					q.size,
				);
			}
			return {
				ok: true,
				data: toPaged(res.data, (b) => toBookingRow(b, new Map(), new Map())),
			};
		},
		/** Every booking matching the query, read 100 at a time (exports, reports, the bounded buckets). */
		list: async (
			q: BookingQuery | BookingStatus = {},
		): Promise<BookingRow[]> => {
			const query: BookingQuery = typeof q === "string" ? { status: q } : q;
			const all = await allPages(async (page, size) => {
				const r = await data.bookings.page({ ...query, page, size });
				return r.ok ? r.data : null;
			}, 100_000);
			return all.rows;
		},
		/**
		 * Today's stays for the boards (arrivals, departures, in house): bounded by the day, so read whole. Everything in house
		 * plus every stay that touches today; `upcoming` and `past` stay empty (the bookings screens page those on the server).
		 */
		buckets: async () => {
			if (!live("reservation")) return bookingBuckets(stay.demoBookings);
			const today = lagosDate();
			const [inHouse, touching] = await Promise.all([
				data.bookings.list({ status: "CHECKED_IN" }),
				data.bookings.list({ from: today, to: today }),
			]);
			const seen = new Set(inHouse.map((b) => b.id));
			const b = bookingBuckets([
				...inHouse,
				...touching.filter((x) => !seen.has(x.id)),
			]);
			return { ...b, upcoming: [], past: [] };
		},
		get: async (id: string): Promise<BookingRow | null> => {
			if (!live("reservation"))
				return give(
					stay.demoBookings.find((b) => b.id === id || b.reference === id) ??
						null,
				);
			const { data: res, error } = await api("@get/reservation/bookings/:id", {
				...(await withSession()),
				params: { id },
			});
			if (error || !res) {
				if (error?.status !== 404)
					console.error("reservation-service booking:", error);
				return null;
			}
			const b = res.data;
			const guest = await data.guests.get(b.guestId);
			return toBookingRow(
				b,
				guest ? new Map([[guest.id, guest]]) : new Map(),
				new Map(),
			);
		},
	},
	guests: {
		/** One page of the guests directory (business-wide), newest first, with the view counts (all, in-house, repeat, blacklisted). */
		page: async (q: GuestQuery = {}): Promise<PageResult<GuestRow>> => {
			if (!live("reservation")) return give(demoGuestPage(q));
			const { data: res, error } = await api("@get/reservation/guests", {
				...(await withSession()),
				query: pageQuery(q),
			});
			if (error || !res) {
				console.error("reservation-service guests:", error);
				return failedPage(errorMessage(error, "Guests didn't load"), q.size);
			}
			return {
				ok: true,
				data: toPaged(res.data, (g) => ({
					...toGuestRow(g),
					lastStay: g.lastStay ?? undefined,
					inHouse: g.inHouse ?? false,
				})),
			};
		},
		/** Up to `size` guests matching a name, phone or email (the new-booking guest pickers). */
		search: async (q: string, size = 8): Promise<GuestRow[]> => {
			const r = await data.guests.page({ q, size });
			return r.data.content;
		},
		get: async (id: string): Promise<GuestRow | null> => {
			if (!live("reservation"))
				return give(stay.demoGuests.find((g) => g.id === id) ?? null);
			const { data: res, error } = await api("@get/reservation/guests/:id", {
				...(await withSession()),
				params: { id },
			});
			if (error || !res) return null;
			return toGuestRow(res.data);
		},
		/** A guest's stays at every hotel of the business, newest first. */
		stays: async (id: string): Promise<BookingRow[]> => {
			if (!live("reservation"))
				return give(stay.demoBookings.filter((b) => b.guestId === id));
			const { data: res, error } = await api(
				"@get/reservation/guests/:id/stays",
				{ ...(await withSession()), params: { id } },
			);
			if (error || !res) return [];
			return res.data.map((b) => toBookingRow(b, new Map(), new Map()));
		},
	},
	folios: {
		/** Open folios (folio-service lists the open ones; closed folios come with the booking they belong to). */
		list: async (): Promise<FolioRow[]> => {
			if (!live("folio")) return give(stay.demoFolios);
			const { data: res, error } = await api(
				"@get/folio/folios",
				await withSession(),
			);
			if (error || !res) {
				console.error("folio-service folios:", error);
				return [];
			}
			return res.data.map(toFolioRow);
		},
		get: async (id: string): Promise<FolioRow | null> => {
			if (!live("folio"))
				return give(
					stay.demoFolios.find((f) => f.id === id || f.bookingId === id) ??
						null,
				);
			const s = await withSession();
			const direct = await api("@get/folio/folios/:id", {
				...s,
				params: { id },
			});
			if (direct.data) return toFolioRow(direct.data.data);
			const byBooking = await api("@get/folio/folios/by-booking/:bookingId", {
				...s,
				params: { bookingId: id },
			});
			return byBooking.data ? toFolioRow(byBooking.data.data) : null;
		},
	},
	payments: {
		/**
		 * One page of payments (payment-service, docs/pagination.md): staff see what they took, managers the hotel's, the owner the
		 * business's (`hotelId` narrows). From defaults to 90 days ago on the server. `counts` per status (+ all, today, mine,
		 * toVerify, attention) and `totals` (approved over the range; today's and this month's approved money, also per method).
		 */
		page: async (q: PaymentQuery = {}): Promise<PageResult<PaymentRow>> => {
			if (!live("payment")) return give(demoPaymentPage(q));
			const { data: res, error } = await api("@get/payment/payments", {
				...(await withSession()),
				query: pageQuery(q),
			});
			if (error || !res) {
				console.error("payment-service payments:", error);
				return failedPage(
					errorMessage(error, "Payments didn't load"),
					q.size,
				);
			}
			return { ok: true, data: toPaged(res.data, toPaymentRow) };
		},
		/** Every payment matching the query, read 100 at a time (exports, the till, reports). From defaults to 90 days ago. */
		list: async (q: PaymentQuery = {}): Promise<PaymentRow[]> => {
			const all = await allPages(async (page, size) => {
				const r = await data.payments.page({ ...q, page, size });
				return r.ok ? r.data : null;
			}, 100_000);
			return all.rows;
		},
		/** Card payments still with the POS, per booking (the booking panels show them instead of a paid amount). */
		pendingOnPos: async (): Promise<Record<string, number>> =>
			pendingByBooking(
				await data.payments.list({
					status: "PENDING,PROCESSING",
					from: lagosDay(-30),
				}),
			),
		/** One payment (a deep link to a payment not on the page). */
		get: async (id: string): Promise<PaymentRow | null> => {
			if (!live("payment"))
				return give(stay.demoPayments.find((p) => p.id === id) ?? null);
			const { data: res, error } = await api("@get/payment/payments/:id", {
				...(await withSession()),
				params: { id },
			});
			return error || !res ? null : toPaymentRow(res.data);
		},
		terminals: (hotelId?: string) => data.terminals.list(hotelId),
		/** One page of the hotel's refunds, newest first, each with the payment's guest; `counts` per status, `totals.pending`. */
		refunds: async (q: ListQuery = {}): Promise<PageResult<RefundRow>> => {
			if (!live("payment"))
				return give(
					slicePage(
						stay.demoRefunds.filter((r) => !q.status || r.status === q.status),
						q.page,
						q.size,
						{
							counts: {
								all: stay.demoRefunds.length,
								PENDING_APPROVAL: stay.demoRefunds.filter(
									(r) => r.status === "PENDING_APPROVAL",
								).length,
							},
							totals: {
								pending: stay.demoRefunds
									.filter((r) => r.status === "PENDING_APPROVAL")
									.reduce((s, r) => s + r.amount, 0),
							},
						},
					),
				).then((data) => ({ ok: true as const, data }));
			const { data: res, error } = await api("@get/payment/payments/refunds", {
				...(await withSession()),
				query: pageQuery(q),
			});
			if (error || !res) {
				console.error("payment-service refunds:", error);
				return failedPage(errorMessage(error, "Refunds didn't load"), q.size);
			}
			return {
				ok: true,
				data: toPaged(res.data, (r) => ({
					id: r.id,
					paymentId: r.paymentId,
					guestName: r.guestName ?? "Walk-in",
					amount: Number(r.amount),
					reason: r.reason ?? "",
					status: (["APPROVED", "DECLINED"].includes(r.status)
						? r.status
						: "PENDING_APPROVAL") as RefundRow["status"],
					requestedBy: "—",
					createdAt: r.createdAt,
					paymentReference: r.paymentReference ?? undefined,
				})),
			};
		},
		/** One page of the hotel's disputes, newest first, each with the payment's guest and amount; `counts` per status. */
		disputes: async (q: ListQuery = {}): Promise<PageResult<DisputeRow>> => {
			if (!live("payment"))
				return give(
					slicePage(
						stay.demoDisputes.filter((d) => !q.status || d.status === q.status),
						q.page,
						q.size,
						{
							counts: {
								all: stay.demoDisputes.length,
								OPEN: stay.demoDisputes.filter((d) => d.status === "OPEN")
									.length,
							},
						},
					),
				).then((data) => ({ ok: true as const, data }));
			const { data: res, error } = await api("@get/payment/payments/disputes", {
				...(await withSession()),
				query: pageQuery(q),
			});
			if (error || !res) {
				console.error("payment-service disputes:", error);
				return failedPage(
					errorMessage(error, "Disputes didn't load"),
					q.size,
				);
			}
			return {
				ok: true,
				data: toPaged(res.data, (d) => ({
					id: d.id,
					paymentId: d.paymentId,
					guestName: d.guestName ?? "Walk-in",
					amount: Number(d.amount ?? 0),
					reason: d.reason ?? "",
					status: (d.status === "RESOLVED"
						? "RESOLVED"
						: "OPEN") as DisputeRow["status"],
					openedAt: d.createdAt,
					resolution: d.resolution ?? undefined,
					paymentReference: d.paymentReference ?? undefined,
				})),
			};
		},
	},
	organizations: {
		/** One page of the hotel's accounts with their figures; `q` name or contact, `status` ACTIVE or ON_HOLD; counts per status, total owed. */
		page: async (q: ListQuery = {}): Promise<PageResult<OrganizationRow>> => {
			if (!live("folio")) {
				const rows = demoOrganizationRows();
				const searched = rows.filter((o) =>
					matches(q.q, o.name, o.contactName, o.contactPhone, o.contactEmail),
				);
				const hit = searched.filter((o) => !q.status || o.status === q.status);
				return give({
					ok: true,
					data: slicePage(hit, q.page ?? 0, q.size ?? PAGE_SIZE, {
						counts: {
							all: searched.length,
							ACTIVE: searched.filter((o) => o.status === "ACTIVE").length,
							ON_HOLD: searched.filter((o) => o.status === "ON_HOLD").length,
						},
						totals: { outstanding: hit.reduce((s, o) => s + o.outstanding, 0) },
					}),
				});
			}
			return organizationsPage(q);
		},
		/** The hotel's accounts at a glance for the KPI cards, whatever page the list is on. */
		overview: async (): Promise<OrganizationsOverviewRow | null> => {
			if (!live("folio")) {
				const rows = demoOrganizationRows();
				const overdue = stay.demoInvoices.filter((i) => i.status === "OVERDUE");
				return give({
					accounts: rows.length,
					staffCanBook: rows.reduce((s, o) => s + o.staffCount, 0),
					staysThisMonth: rows.reduce((s, o) => s + o.staysThisMonth, 0),
					outstanding: rows.reduce((s, o) => s + o.outstanding, 0),
					openInvoices: stay.demoInvoices.filter(
						(i) => i.status !== "PAID" && i.status !== "DRAFT",
					).length,
					overdueInvoices: overdue.length,
					overdueAmount: overdue.reduce((s, i) => s + i.amount - i.paid, 0),
					overdueOrganizations: [
						...new Set(overdue.map((i) => i.organizationName)),
					],
					onHold: rows.filter((o) => o.status === "ON_HOLD").length,
					onHoldOrganizations: rows
						.filter((o) => o.status === "ON_HOLD")
						.map((o) => o.name),
				});
			}
			const { data: res, error } = await api(
				"@get/folio/organizations/overview",
				await withSession(),
			);
			if (error || !res) {
				console.error("folio-service organizations overview:", error);
				return null;
			}
			return {
				...res.data,
				outstanding: Number(res.data.outstanding),
				overdueAmount: Number(res.data.overdueAmount),
			};
		},
		/** Every account with its figures, read 100 at a time (the owner's credit requests and other whole-list readers). */
		list: async (): Promise<OrganizationRow[]> => {
			if (!live("folio")) return give(demoOrganizationRows());
			return allOrganizations();
		},
		/** The company accounts a booking can be billed to (the booking form's picker): every account, 100 at a time. */
		forBooking: async (): Promise<OrganizationRow[]> => {
			if (!live("folio")) return give(stay.demoOrganizations);
			return allOrganizations();
		},
		/** One account with its figures (GET /folio/organizations/:id/summary). */
		get: async (id: string): Promise<OrganizationRow | null> => {
			if (!live("folio"))
				return give(demoOrganizationRows().find((o) => o.id === id) ?? null);
			const { data: res, error } = await api(
				"@get/folio/organizations/:id/summary",
				{ ...(await withSession()), params: { id } },
			);
			if (error || !res) {
				if (error?.status !== 404)
					console.error("folio-service organization:", error);
				return null;
			}
			return toOrganizationSummaryRow(res.data);
		},
		/** The people who can book on the account (a company's staff list: short, not paged). */
		members: async (id: string): Promise<OrgMemberRow[]> => {
			if (!live("folio")) return give(stay.demoOrgMembers[id] ?? []);
			const { data: res, error } = await api(
				"@get/folio/organizations/:id/members",
				{ ...(await withSession()), params: { id } },
			);
			if (error || !res) {
				console.error("folio-service org members:", error);
				return [];
			}
			return res.data.map(toOrgMemberRow);
		},
		/** One page of the account's stays (its folios), latest opened first; `status` OPEN or CLOSED, `from`/`to` days opened, `q` guest or room. */
		staysPage: async (
			id: string,
			q: ListQuery = {},
		): Promise<PageResult<FolioRow>> => {
			if (!live("folio")) {
				const org = stay.demoOrganizations.find((o) => o.id === id);
				const all = org
					? stay.demoFolios.filter((f) => f.organizationName === org.name)
					: [];
				const rows = all.filter(
					(f) =>
						(!q.status ||
							(q.status === "OPEN"
								? f.status === "OPEN"
								: f.status !== "OPEN")) &&
						(!q.from || f.openedAt.slice(0, 10) >= q.from) &&
						(!q.to || f.openedAt.slice(0, 10) <= q.to) &&
						matches(q.q, f.guestName, f.roomNumber),
				);
				return give({
					ok: true,
					data: slicePage(rows, q.page ?? 0, q.size ?? PAGE_SIZE, {
						counts: {
							all: all.length,
							OPEN: all.filter((f) => f.status === "OPEN").length,
							CLOSED: all.filter((f) => f.status !== "OPEN").length,
						},
						totals: { balance: rows.reduce((s, f) => s + f.balance, 0) },
					}),
				});
			}
			const { data: res, error } = await api(
				"@get/folio/organizations/:id/stays",
				{ ...(await withSession()), params: { id }, query: pageQuery(q) },
			);
			if (error || !res) {
				console.error("folio-service org stays:", error);
				return failedPage(errorMessage(error, "Stays didn't load"));
			}
			return {
				ok: true,
				data: toPaged(res.data, (f) =>
					toFolioRow({ ...f, lines: f.lines ?? null }),
				),
			};
		},
		/** Every stay of the account (in the `from`/`to` days when given), 100 at a time: the invoice preview reads its period's stays. */
		stays: async (
			id: string,
			range: { from?: string; to?: string } = {},
		): Promise<FolioRow[]> =>
			(
				await allPages(async (page, size) => {
					const r = await data.organizations.staysPage(id, {
						...range,
						page,
						size,
					});
					return r.ok ? r.data : null;
				})
			).rows,
		/** One page of invoices, the hotel's or one account's (`organizationId`); `status` OPEN, OVERDUE, SENT, PART_PAID, PAID or DRAFT. */
		invoicesPage: async (
			q: ListQuery & { organizationId?: string } = {},
		): Promise<PageResult<InvoiceRow>> => {
			if (!live("folio")) {
				const scope = stay.demoInvoices.filter(
					(i) =>
						(!q.organizationId || i.organizationId === q.organizationId) &&
						matches(q.q, i.number, i.organizationName),
				);
				const is = (i: InvoiceRow, st: string) =>
					st === "OPEN"
						? i.status !== "PAID" && i.status !== "DRAFT"
						: i.status === st;
				const rows = scope
					.filter((i) => !q.status || is(i, q.status))
					.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
				const counts: Record<string, number> = { all: scope.length };
				for (const st of [
					"OPEN",
					"OVERDUE",
					"SENT",
					"PART_PAID",
					"PAID",
					"DRAFT",
				])
					counts[st] = scope.filter((i) => is(i, st)).length;
				const amount = rows.reduce((s, i) => s + i.amount, 0);
				const paid = rows.reduce((s, i) => s + i.paid, 0);
				return give({
					ok: true,
					data: slicePage(rows, q.page ?? 0, q.size ?? PAGE_SIZE, {
						counts,
						totals: { amount, paid, left: amount - paid },
					}),
				});
			}
			return invoicesPage(q);
		},
		/** Every invoice (one account's, or the hotel's), 100 at a time, with the same filters. */
		invoices: async (id?: string, q: ListQuery = {}): Promise<InvoiceRow[]> =>
			(
				await allPages(async (page, size) => {
					const r = await data.organizations.invoicesPage({
						...q,
						organizationId: id,
						page,
						size,
					});
					return r.ok ? r.data : null;
				})
			).rows,
	},
	staff: {
		/** The active hotel's people from identity (every grant on this hotel plus the business-wide owner). */
		list: async (): Promise<StaffRow[]> => {
			if (!live("identity")) return give(hotel.demoStaff);
			const [active, hotels] = await Promise.all([
				getActiveHotel(),
				getHotels(),
			]);
			if (!active) return [];
			// Only managers and owners may list the hotel's people; everyone else gets their colleagues' names and roles.
			const role = await getActiveRole();
			const users =
				role === "MANAGER" || role === "OWNER"
					? await listUsers({ hotelId: active.id })
					: await listColleagues();
			const names = hotelNameMap(hotels);
			return users
				.map((u) => toStaffRow(u, active.id, names))
				.sort((a, b) => a.fullName.localeCompare(b.fullName));
		},
		get: async (id: string): Promise<StaffRow | null> =>
			(await data.staff.list()).find((s) => s.id === id) ?? null,
		...opsData.staff,
	},
	roles: {
		/**
		 * Roles & permissions · Staff access: everyone with a role at the active hotel (GET /identity/users?hotelId=),
		 * with their roles here and the business-wide ones. Managers and the owner only; empty for anyone else.
		 */
		access: async (): Promise<RolesAccessRow[]> => {
			const [active, session] = await Promise.all([getActiveHotel(), getSession()]);
			if (!live("identity")) {
				const { demoStaffAccess } = await import("@hospio/api/demo/fixtures/manager-admin");
				return give(
					demoStaffAccess.map((a) => ({
						id: a.id,
						fullName: a.fullName,
						email: "",
						department: a.department,
						status: a.grants.every((g) => g.paused) ? ("PAUSED" as const) : ("ACTIVE" as const),
						grants: a.grants.map((g, i) => ({ id: `${a.id}-${i}`, role: g.role, level: g.level, paused: !!g.paused, until: g.until?.slice(0, 10) })),
						otherHotelRoles: 0,
						self: false,
					})),
				);
			}
			if (!active) return [];
			const users = await listUsers({ hotelId: active.id });
			return users
				.map((u) => toRolesAccessRow(u, active.id, session.sub))
				.filter((r) => r.grants.length > 0 || r.otherHotelRoles === 0)
				.sort((a, b) => a.fullName.localeCompare(b.fullName));
		},
	},
	finance: { ...opsData.finance, ...mlData.finance },
	inventory: {
		// Stores, stock and team requests (./fnb, also what the kitchen and bar read) plus the store's own
		// screens (./inventory): orders, deliveries, counts, suppliers, transfers, value and usage.
		...fnbData.inventory,
		...inventoryData,
	},
	/** Work orders, assets, preventive schedules and maintenance money (./lm, maintenance-service). */
	maintenance: lmData.maintenance,
	/** The activity log, a page at a time (platform-service; ./ml). */
	activity: mlData.activity,
	/** Receipts to print and email (payment-service; ./ml). */
	receipts: mlData.receipts,
	approvals: opsData.approvals,
	notifications: {
		/**
		 * messaging-service's notifications for the signed-in person (their own plus their roles' at this hotel), a page at a
		 * time, newest first: `unread` ("true"), `q`, `from`/`to` (90 days back by default on the server). Counts all/unread.
		 */
		page: async (query: ListQuery = {}): Promise<PageResult<NotificationRow>> => {
			if (!live("messaging")) {
				const rows = ops.demoNotifications.filter(
					(n) =>
						(query.unread !== "true" || !n.read) &&
						(!query.q ||
							`${n.title} ${n.body ?? ""}`
								.toLowerCase()
								.includes(String(query.q).toLowerCase())),
				);
				return give({
					ok: true,
					data: slicePage(rows, query.page ?? 0, query.size ?? PAGE_SIZE, {
						counts: {
							all: ops.demoNotifications.length,
							unread: ops.demoNotifications.filter((n) => !n.read).length,
						},
					}),
				});
			}
			const { data: res, error } = await api("@get/messaging/notifications", {
				...(await withSession()),
				query: pageQuery(query),
			});
			if (error || !res) {
				console.error("messaging-service notifications:", error);
				return failedPage(errorMessage(error, "Notifications didn't load"));
			}
			const role = await getActiveRole();
			return { ok: true, data: toPaged(res.data, (n) => toNotificationRow(role, n)) };
		},
		/** The bell's badge: how many are unread (a count from the service, not the list). */
		unreadCount: async (): Promise<number> => {
			if (!live("messaging"))
				return give(ops.demoNotifications.filter((n) => !n.read).length);
			const { data: res, error } = await api(
				"@get/messaging/notifications/unread-count",
				await withSession(),
			);
			return error || !res ? 0 : res.data.count;
		},
	},
	messaging: {
		conversations: () => give(ops.demoConversations),
		get: (id: string) =>
			give(ops.demoConversations.find((c) => c.id === id) ?? null),
		templates: () => give(ops.demoTemplates),
	},
	reports: {
		list: () => give(ops.demoReports),
	},
	departments: {
		live: () => give(ops.demoDepartments),
	},
	outlets: {
		...fnbData.outlets,
		/** OUTLETS (room charge, tabs, tab limit) and TAXES_CURRENCY from Hotel setup; the contract's defaults when it cannot be read. */
		settings: async (): Promise<OutletSettingsRow> => {
			const fallback: OutletSettingsRow = {
				roomCharge: true,
				tabs: true,
				tabLimit: 50_000,
				vatPct: 7.5,
				serviceChargePct: 0,
				pricesIncludeTax: true,
			};
			if (!live("hotel-config")) return give(fallback);
			const sections = await data.hotels.setup().catch(() => []);
			const value = (section: string, key: string) =>
				sections
					.find((x) => x.key === section)
					?.fields.find((f) => f.key === key)?.value;
			const n = (v: unknown, d: number) =>
				typeof v === "number" && Number.isFinite(v) ? v : d;
			const b = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
			return {
				roomCharge: b(value("outlets", "roomCharge"), fallback.roomCharge),
				tabs: b(value("outlets", "tabs"), fallback.tabs),
				tabLimit: n(value("outlets", "tabLimit"), fallback.tabLimit),
				vatPct: n(value("taxes", "vatPct"), fallback.vatPct),
				serviceChargePct: n(value("taxes", "serviceChargePct"), 0),
				pricesIncludeTax: b(value("taxes", "pricesIncludeTax"), true),
			};
		},
	},
	housekeeping: { ...opsData.housekeeping, ...mlData.housekeeping },
	/** Guest laundry, the price list, linen batches and laundry money (./lm, housekeeping-service). */
	laundry: lmData.laundry,
	platform: {
		/**
		 * One page of the platform's businesses (GET /tenant/businesses): `stage`, `q` (name, owner, email, city), `sort`; counts per
		 * stage (and `all`, `hotels`, `rooms`) over the search. Health, MRR and tickets are 0 until platform-service is wired.
		 */
		businessesPage: async (
			query: ListQuery & { stage?: string } = {},
		): Promise<PageResult<BusinessRow>> => {
			if (!live("tenant")) {
				const searched = platform.demoBusinesses.filter(
					(b) =>
						!query.q ||
						`${b.name} ${b.ownerName} ${b.ownerEmail} ${b.city}`
							.toLowerCase()
							.includes(query.q.toLowerCase()),
				);
				const rows = searched.filter(
					(b) => !query.stage || b.stage === query.stage,
				);
				const counts: Record<string, number> = {
					all: searched.length,
					hotels: searched.reduce((s, b) => s + b.hotels, 0),
					rooms: searched.reduce((s, b) => s + b.rooms, 0),
				};
				for (const b of searched) counts[b.stage] = (counts[b.stage] ?? 0) + 1;
				return give({
					ok: true,
					data: slicePage(rows, query.page ?? 0, query.size ?? PAGE_SIZE, {
						counts,
					}),
				});
			}
			const { stage, ...rest } = query;
			const { data: res, error } = await api("@get/tenant/businesses", {
				...(await withSession()),
				query: { ...pageQuery(rest), ...(stage ? { stage } : {}) } as {
					page: number;
					size: number;
				},
			});
			if (error || !res) {
				console.error("tenant-service businesses:", error);
				return failedPage(errorMessage(error, "Businesses didn't load"));
			}
			return { ok: true, data: toPaged(res.data, toBusinessRow) };
		},
		/** Every business (the pickers on payments, fees, changes and support), 100 at a time. */
		businesses: async (
			query: { stage?: string; q?: string } = {},
		): Promise<BusinessRow[]> =>
			(
				await allPages(async (page, size) => {
					const r = await data.platform.businessesPage({
						...query,
						page,
						size,
					});
					return r.ok ? r.data : null;
				})
			).rows,
		/** One business. Null only when tenant-service says it does not exist (404); any other failure throws so the page's error boundary offers a retry instead of a wrong "not found". */
		business: async (id: string): Promise<BusinessRow | null> => {
			if (!live("tenant"))
				return give(platform.demoBusinesses.find((b) => b.id === id) ?? null);
			const { data: res, error } = await api("@get/tenant/businesses/:id", {
				...(await withSession()),
				params: { id },
			});
			if (error || !res) {
				if (error?.status === 404) return null;
				console.error("tenant-service business:", error);
				throw new Error(
					error?.message?.trim() ||
						`The business could not be loaded (${error?.status ?? "no response"})`,
				);
			}
			return toBusinessRowFromBusiness(res.data);
		},
		/** A business's hotels for the detail page and the wizard. */
		businessHotels: async (id: string): Promise<HotelSummary[]> => {
			if (!live("tenant")) {
				if (id === "biz-1" || id === hotel.BUSINESS_ID)
					return give(hotel.demoHotelSummaries);
				return give(
					(platformExtra.demoOtherHotels[id] ?? []).map((h, i) => ({
						id: `${id}-h${i + 1}`,
						name: h.name,
						city: h.city,
						address: "",
						rooms: h.rooms,
						timezone: "Africa/Lagos",
						occupancy: h.occupancy,
						manager: h.manager,
					})),
				);
			}
			const [hotels, managers] = await Promise.all([
				businessHotels(id),
				managerNames(id),
			]);
			return hotels.map((h) => toHotelSummary(h, managers));
		},
		/** A business's people (identity users?businessId=). */
		businessUsers: (id: string): Promise<PortalUserRow[]> =>
			data.users.list({ businessId: id }),
		// Live from platform-service (marketer profiles); the row keeps the shape the pickers already use.
		marketers: async (): Promise<MarketerRow[]> => {
			if (!live("platform")) return give(platform.demoMarketers);
			const { adminData } = await import("./admin");
			const rows = await adminData.marketers.list();
			return rows.map((m) => ({
				id: m.id,
				fullName: m.fullName,
				email: m.email,
				phone: m.phone,
				status: m.status,
				sharePct: m.sharePct,
				months: m.months,
				businesses: m.businesses,
				earnedTotal: m.earnedTotal,
				due: m.due,
				joined: m.joined,
			}));
		},
		tickets: () => give(platform.demoTickets),
		feeStatements: () => give(platform.demoFeeStatements),
		changes: () => give(platform.demoPlatformChanges),
		/**
		 * One column of the onboarding board (GET /tenant/onboarding?status=&page=), latest saved first, with counts per status.
		 * Admin names come from the demo team until identity lists platform staff.
		 */
		onboardingPage: async (
			status?: string,
			page = 0,
			size = PAGE_SIZE,
		): Promise<PageResult<OnboardingRow>> => {
			if (!live("tenant")) {
				const all = platform.demoOnboarding;
				const rows = status ? all.filter((o) => o.status === status) : all;
				const counts: Record<string, number> = { all: all.length };
				for (const o of all) counts[o.status] = (counts[o.status] ?? 0) + 1;
				return give({
					ok: true,
					data: slicePage(rows, page, size, { counts }),
				});
			}
			const { data: res, error } = await api("@get/tenant/onboarding", {
				...(await withSession()),
				query: { page, size, ...(status ? { status } : {}) },
			});
			if (error || !res) {
				console.error("tenant-service onboarding:", error);
				return failedPage(errorMessage(error, "Onboarding didn't load"));
			}
			const admins = new Map(
				platform.demoAdminUsers.map((a) => [a.id, a.fullName]),
			);
			return {
				ok: true,
				data: toPaged(res.data, (o) => toOnboardingRow(o, admins)),
			};
		},
		/** The whole board (or one status), 100 at a time. */
		onboarding: async (status?: string): Promise<OnboardingRow[]> =>
			(
				await allPages(async (page, size) => {
					const r = await data.platform.onboardingPage(status, page, size);
					return r.ok ? r.data : null;
				})
			).rows,
		onboardingFor: async (
			businessId: string,
		): Promise<OnboardingRow | null> => {
			if (!live("tenant"))
				return give(
					platform.demoOnboarding.find(
						(o) => o.businessId === businessId || o.id === businessId,
					) ?? null,
				);
			const { data: res, error } = await api(
				"@get/tenant/onboarding/:businessId",
				{ ...(await withSession()), params: { businessId } },
			);
			if (error || !res) return null;
			return toOnboardingRow(
				res.data,
				new Map(platform.demoAdminUsers.map((a) => [a.id, a.fullName])),
			);
		},
		// Live platform staff from identity (any platform admin may read it); account manager and assignee pickers.
		adminUsers: async (): Promise<AdminUserRow[]> => {
			if (!live("identity")) return give(platform.demoAdminUsers);
			const { adminData } = await import("./admin");
			return adminData.team.list();
		},
	},
	onboarding: {
		/** The owner's own self-serve draft (GET /tenant/onboarding/mine). */
		mine: async (): Promise<OnboardingRow | null> => {
			if (!live("tenant")) return give(null);
			const { data: res, error } = await api(
				"@get/tenant/onboarding/mine",
				await withSession(),
			);
			if (error || !res) return null;
			return toOnboardingRow(res.data);
		},
	},
	setupTemplates: {
		list: async (): Promise<SetupTemplateRow[]> => {
			if (!live("tenant")) return give(platformExtra.demoSetupTemplates);
			const { data: res, error } = await api(
				"@get/tenant/setup-templates",
				await withSession(),
			);
			if (error || !res) {
				console.error("tenant-service setup templates:", error);
				return [];
			}
			return res.data.filter((t) => t.active).map(toSetupTemplateRow);
		},
	},
	terminals: {
		/** POS terminals of the active hotel (or `hotelId`), retired ones left out. */
		list: async (hotelId?: string): Promise<TerminalRow[]> => {
			if (!live("payment")) return give(stay.demoTerminals);
			const session = await withSession(hotelId ? { hotelId } : undefined);
			const [{ data: res, error }, assigned] = await Promise.all([
				api("@get/payment/terminals", session),
				api("@get/payment/terminals/assignments", session).catch(() => null),
			]);
			const rolesOf = new Map<string, string[]>();
			for (const a of assigned?.data?.data ?? [])
				rolesOf.set(a.terminalId, [
					...(rolesOf.get(a.terminalId) ?? []),
					a.role,
				]);
			if (error || !res) {
				console.error("payment-service terminals:", error);
				return [];
			}
			return res.data
				.filter((t) => t.status !== "RETIRED")
				.map((t) => ({
					id: t.id,
					name: t.name,
					provider: t.provider,
					ref: t.terminalRef,
					status:
						t.status === "ONLINE" ? ("ONLINE" as const) : ("OFFLINE" as const),
					roles: rolesOf.get(t.id) ?? [],
					lastSeen: t.lastSeenAt ?? t.updatedAt ?? t.createdAt ?? "",
					todayCount: 0,
					todayAmount: 0,
				}));
		},
	},
};

export type Data = typeof data;

const DANGER_KINDS = new Set([
	"POS_OFFLINE",
	"ROOM_OUT_OF_ORDER",
	"PROBLEM",
	"SOLD_OUT",
]);
const WARNING_KINDS = new Set([
	"STOCK_LOW",
	"APPROVAL",
	"LEAVE",
	"SHIFT",
	"TILL_SHORT",
	"REPAIR",
]);

/** The screens each role has under /dashboard (besides the shared ones), so a notification only links where the role can go. */
const ROLE_SCREENS: Record<string, string[]> = {
	OWNER: [
		"bookings",
		"financials",
		"hotel-setup",
		"hotels",
		"inventory",
		"messaging",
		"operations",
		"payments",
		"reports",
		"roles",
		"settings",
		"staff",
		"users",
	],
	MANAGER: [
		"activity",
		"approvals",
		"bookings",
		"departments",
		"financials",
		"folios",
		"hotel-setup",
		"inventory",
		"menus",
		"messaging",
		"night-audit",
		"organizations",
		"payments",
		"reports",
		"roles",
		"rooms",
		"staff",
		"tasks",
	],
	FRONT_OFFICE: [
		"bookings",
		"folios",
		"guests",
		"laundry",
		"lost-found",
		"messages",
		"payments",
		"repairs",
		"rooms",
		"till",
	],
	HOUSEKEEPING: ["inspect", "linen", "lost-found", "repairs", "store"],
	FINANCE: [
		"expenses",
		"month",
		"night-audit",
		"organizations",
		"sales",
		"tills",
	],
	INVENTORY: ["counts", "deliveries", "orders", "requests", "suppliers"],
	MAINTENANCE: ["preventive", "store", "rooms"],
	KITCHEN: ["menu", "payments", "sales", "store", "till"],
	BAR: ["menu", "payments", "sales", "stock", "tabs", "till"],
	LAUNDRY: ["linen", "payments", "store"],
};
const SHARED_SCREENS = ["notifications", "profile", "help", "shifts", "inbox"];

/** The `/dashboard/<screen>` pages the role has (its own and the shared ones): links to anything else would 404. */
export function roleScreens(role: string | null | undefined): string[] {
	return [...(role ? (ROLE_SCREENS[role] ?? []) : []), ...SHARED_SCREENS];
}
/** Where a service link lands per role when the role has no screen of that name. */
const SCREEN_ALIASES: Record<string, Record<string, string>> = {
	OWNER: { approvals: "", "night-audit": "financials", inbox: "messaging" },
	FINANCE: { financials: "", "night-audit": "night-audit" },
	MANAGER: { repairs: "tasks", inventory: "inventory", messages: "messaging" },
	FRONT_OFFICE: { orders: "", menu: "" },
	HOUSEKEEPING: { rooms: "", "my-rooms": "", inventory: "store", laundry: "linen" },
	MAINTENANCE: { repairs: "", inventory: "store" },
	LAUNDRY: { inventory: "store", laundry: "linen" },
	INVENTORY: { inventory: "requests" },
};

/** messaging-service links are service paths (/bookings/{id}, /approvals/{id}, /staff/leave …); open them through /dashboard, or not at all when the role has no such screen. */
export function notificationLink(
	link: string | null | undefined,
	role: string | null,
): string | undefined {
	if (!link) return undefined;
	if (link.startsWith("/dashboard")) return link;
	// A link may carry a query (/inbox?open=…, /reports?report=…); it is kept on the screen it lands on.
	const [path, query] = link.split("?");
	const [rawFirst, second] = path.replace(/^\/+/, "").split("/");
	if (!rawFirst) return "/dashboard";
	// A work order opens on the screen that role follows work orders on.
	if (rawFirst === "repairs" && second && role) {
		const at: Record<string, string> = {
			MAINTENANCE: "/dashboard",
			MANAGER: "/dashboard/tasks",
			FRONT_OFFICE: "/dashboard/repairs",
			HOUSEKEEPING: "/dashboard/repairs",
		};
		if (at[role]) return `${at[role]}?open=${second}`;
	}
	const alias = role ? SCREEN_ALIASES[role]?.[rawFirst] : undefined;
	const first = alias ?? rawFirst;
	if (first === "") return "/dashboard";
	const screens = [
		...(role ? (ROLE_SCREENS[role] ?? []) : []),
		...SHARED_SCREENS,
	];
	if (!screens.includes(first)) return undefined;
	if (first === "bookings" && second)
		return `/dashboard/bookings?tab=all&open=${second}`;
	if (first === "staff" && second) return `/dashboard/staff?tab=${second}`;
	return `/dashboard/${first}${query ? `?${query}` : ""}`;
}

function toNotificationRow(
	role: string | null,
	n: {
		id: string;
		kind: string;
		title: string;
		body: string | null;
		link: string | null;
		readAt: string | null;
		createdAt: string;
	},
): NotificationRow {
	const decided = /\b(declined|rejected|short|over)\b/i.test(n.title);
	return {
		id: n.id,
		kind: n.kind,
		title: n.title,
		body: n.body ?? undefined,
		link: notificationLink(n.link, role),
		at: n.createdAt,
		read: n.readAt !== null,
		tone: DANGER_KINDS.has(n.kind)
			? "danger"
			: decided || WARNING_KINDS.has(n.kind)
				? "warning"
				: n.kind.endsWith("_DECIDED") || n.kind === "DAY_CLOSED"
					? "success"
					: "info",
	};
}
