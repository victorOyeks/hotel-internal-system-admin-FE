import "server-only";

/**
 * The data seam every screen reads through. In demo mode each function answers from the fixtures
 * under src/lib/demo/fixtures; when the backend is wired in, swap the body of a function for the
 * matching `api("@get/...")` call and the screen above it does not change.
 */

import { cache } from "react";
import { api } from "@hospio/api/api/client";
import type {
	Business,
	Hotel,
	Invoice,
	ListItem,
	Organization,
	SetupSection,
	UserSummary,
} from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import {
	getActiveHotel,
	getActiveRole,
	getBusiness,
	getHotels,
} from "@hospio/api/dal";
import { demoDelay } from "@hospio/api/demo/mode";
import { isHotelRole } from "@hospio/api/roles";
import { live } from "./live";
import {
	SETUP_LISTS,
	type SetupListName,
	toSetupSections,
} from "./mappers/hotel-config";
import { toPortalUserRow, toStaffRow } from "./mappers/identity";
import { lagosDate } from "./mappers/finance";
import { opsData } from "./ops";
import { toAreaRow, toRoomRow, toRoomTypeRow } from "./mappers/property";
import {
	type OrganizationParts,
	toInvoiceRow,
	toOrganizationRow,
	toOrgMemberRow,
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
	FolioRow,
	GuestRow,
	HotelSetupSection,
	InvoiceRow,
	OrgMemberRow,
	HotelSummary,
	OnboardingRow,
	OwnerHotelRow,
	OrganizationRow,
	PaymentRow,
	RefundRow,
	DisputeRow,
	PortalUserRow,
	RoomRow,
	RoomTypeRow,
	SetupTemplateRow,
	StaffRow,
	TerminalRow,
	WorthRow,
} from "./types";

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
	return res.data;
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

/** folio-service's organizations for the active hotel, once per request. */
const liveOrganizations = cache(async (): Promise<Organization[]> => {
	const { data: res, error } = await api(
		"@get/folio/organizations",
		await withSession(),
	);
	if (error || !res) {
		console.error("folio-service organizations:", error);
		return [];
	}
	return res.data;
});

const organizationInvoices = cache(async (id: string): Promise<Invoice[]> => {
	const { data: res, error } = await api(
		"@get/folio/organizations/:id/invoices",
		{ ...(await withSession()), params: { id } },
	);
	if (error || !res) {
		console.error("folio-service organization invoices:", error);
		return [];
	}
	return res.data;
});

/** An account's members, folios and outstanding balance, once per request (the list and the account page share them). */
const organizationParts = cache(
	async (id: string): Promise<OrganizationParts> => {
		const s = await withSession();
		const [members, stays, outstanding] = await Promise.all([
			api("@get/folio/organizations/:id/members", { ...s, params: { id } }),
			api("@get/folio/organizations/:id/stays", { ...s, params: { id } }),
			api("@get/folio/organizations/:id/outstanding", {
				...s,
				params: { id },
			}),
		]);
		if (members.error)
			console.error("folio-service org members:", members.error);
		if (stays.error) console.error("folio-service org stays:", stays.error);
		if (outstanding.error)
			console.error("folio-service org outstanding:", outstanding.error);
		return {
			members: (members.data?.data ?? []).map(toOrgMemberRow),
			stays: (stays.data?.data ?? []).map((f) =>
				toFolioRow({ ...f, lines: f.lines ?? null }),
			),
			outstanding: outstanding.data ? Number(outstanding.data.data) : null,
		};
	},
);

export const data = {
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
		list: async (status?: BookingStatus): Promise<BookingRow[]> => {
			if (!live("reservation"))
				return give(
					status
						? stay.demoBookings.filter((b) => b.status === status)
						: stay.demoBookings,
				);
			const s = await withSession();
			const [res, guests, folios] = await Promise.all([
				api("@get/reservation/bookings", {
					...s,
					query: status ? { status } : {},
				}),
				data.guests.list(),
				data.folios.list(),
			]);
			if (res.error || !res.data) {
				console.error("reservation-service bookings:", res.error);
				return [];
			}
			const guestsById = new Map(guests.map((g) => [g.id, g]));
			const foliosByBooking = new Map(
				folios.filter((f) => f.bookingId).map((f) => [f.bookingId, f]),
			);
			return res.data.data
				.map((b) => toBookingRow(b, guestsById, foliosByBooking))
				.sort(
					(a, b) =>
						a.checkInDate.localeCompare(b.checkInDate) ||
						a.guestName.localeCompare(b.guestName),
				);
		},
		buckets: async () => bookingBuckets(await data.bookings.list()),
		get: async (id: string): Promise<BookingRow | null> => {
			const all = await data.bookings.list();
			return all.find((b) => b.id === id || b.reference === id) ?? null;
		},
	},
	guests: {
		list: async (): Promise<GuestRow[]> => {
			if (!live("reservation")) return give(stay.demoGuests);
			const { data: res, error } = await api("@get/reservation/guests", {
				...(await withSession()),
				query: {},
			});
			if (error || !res) {
				console.error("reservation-service guests:", error);
				return [];
			}
			return res.data.map(toGuestRow);
		},
		get: async (id: string): Promise<GuestRow | null> =>
			(await data.guests.list()).find((g) => g.id === id) ?? null,
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
		list: async (): Promise<PaymentRow[]> => {
			if (!live("payment")) return give(stay.demoPayments);
			const { data: res, error } = await api(
				"@get/payment/payments",
				await withSession(),
			);
			if (error || !res) {
				console.error("payment-service payments:", error);
				return [];
			}
			return res.data.map((p) => ({
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
			}));
		},
		terminals: (hotelId?: string) => data.terminals.list(hotelId),
		refunds: async (): Promise<RefundRow[]> => {
			if (!live("payment")) return give(stay.demoRefunds);
			const s = await withSession();
			const [res, payments] = await Promise.all([
				api("@get/payment/payments/refunds", s),
				data.payments.list(),
			]);
			if (res.error || !res.data) {
				console.error("payment-service refunds:", res.error);
				return [];
			}
			const byId = new Map(payments.map((p) => [p.id, p]));
			return res.data.data
				.map((r) => ({
					id: r.id,
					paymentId: r.paymentId,
					guestName: byId.get(r.paymentId)?.guestName ?? "—",
					amount: Number(r.amount),
					reason: r.reason ?? "",
					status: (["APPROVED", "DECLINED"].includes(r.status)
						? r.status
						: "PENDING_APPROVAL") as RefundRow["status"],
					requestedBy: "—",
					createdAt: r.createdAt,
				}))
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		},
		disputes: async (): Promise<DisputeRow[]> => {
			if (!live("payment")) return give(stay.demoDisputes);
			const s = await withSession();
			const [res, payments] = await Promise.all([
				api("@get/payment/payments/disputes", s),
				data.payments.list(),
			]);
			if (res.error || !res.data) {
				console.error("payment-service disputes:", res.error);
				return [];
			}
			const byId = new Map(payments.map((p) => [p.id, p]));
			return res.data.data
				.map((d) => ({
					id: d.id,
					paymentId: d.paymentId,
					guestName: byId.get(d.paymentId)?.guestName ?? "—",
					amount: byId.get(d.paymentId)?.amount ?? 0,
					reason: d.reason ?? "",
					status: (d.status === "RESOLVED"
						? "RESOLVED"
						: "OPEN") as DisputeRow["status"],
					openedAt: d.createdAt,
					resolution: d.resolution ?? undefined,
				}))
				.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
		},
	},
	organizations: {
		/** Every company account with what it owes, who can book and its stays this month (folio-service). */
		list: async (): Promise<OrganizationRow[]> => {
			if (!live("folio")) return give(stay.demoOrganizations);
			const orgs = await liveOrganizations();
			return Promise.all(
				orgs.map(async (o) =>
					toOrganizationRow(o, await organizationParts(o.id)),
				),
			);
		},
		/** The company accounts a booking can be billed to: folio-service's organizations when it is live. */
		forBooking: async (): Promise<OrganizationRow[]> => {
			if (!live("folio")) return give(stay.demoOrganizations);
			return (await liveOrganizations()).map((o) => toOrganizationRow(o));
		},
		get: async (id: string): Promise<OrganizationRow | null> => {
			if (!live("folio"))
				return give(stay.demoOrganizations.find((o) => o.id === id) ?? null);
			const { data: res, error } = await api("@get/folio/organizations/:id", {
				...(await withSession()),
				params: { id },
			});
			if (error || !res) {
				if (error?.status !== 404)
					console.error("folio-service organization:", error);
				return null;
			}
			return toOrganizationRow(res.data, await organizationParts(id));
		},
		members: async (id: string): Promise<OrgMemberRow[]> => {
			if (!live("folio")) return give(stay.demoOrgMembers[id] ?? []);
			return (await organizationParts(id)).members;
		},
		/** The account's folios, newest first: what each stay charged, what was paid and what is left. */
		stays: async (id: string): Promise<FolioRow[]> => {
			if (!live("folio")) {
				const org = stay.demoOrganizations.find((o) => o.id === id);
				return give(
					org
						? stay.demoFolios.filter((f) => f.organizationName === org.name)
						: [],
				);
			}
			return (await organizationParts(id)).stays;
		},
		/** One account's invoices, or every account's when no id is given. */
		invoices: async (id?: string): Promise<InvoiceRow[]> => {
			if (!live("folio"))
				return give(
					id
						? stay.demoInvoices.filter((i) => i.organizationId === id)
						: stay.demoInvoices,
				);
			const orgs = (await liveOrganizations()).filter(
				(o) => !id || o.id === id,
			);
			const lists = await Promise.all(
				orgs.map(async (o) =>
					(await organizationInvoices(o.id)).map((i) =>
						toInvoiceRow(i, o.name),
					),
				),
			);
			return lists.flat().sort((a, b) => b.dueDate.localeCompare(a.dueDate));
		},
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
	finance: opsData.finance,
	inventory: {
		stores: () => give(ops.demoStores),
		items: () => give(ops.demoStockItems),
		requests: () => give(ops.demoStockRequests),
		purchaseOrders: () => give(ops.demoPurchaseOrders),
		deliveries: () => give(ops.demoDeliveries),
		counts: () => give(ops.demoStockCounts),
		suppliers: () => give(ops.demoSuppliers),
	},
	maintenance: {
		repairs: () => give(ops.demoRepairs),
		get: (id: string) => give(ops.demoRepairs.find((r) => r.id === id) ?? null),
		jobs: () => give(ops.demoScheduledJobs),
		parts: () => give(ops.demoSpareParts),
	},
	activity: {
		list: () => give(ops.demoActivity),
	},
	approvals: opsData.approvals,
	notifications: {
		/** messaging-service's notifications for the signed-in person: their own plus their roles' at this hotel. */
		list: async (): Promise<NotificationRow[]> => {
			if (!live("messaging")) return give(ops.demoNotifications);
			const { data: res, error } = await api("@get/messaging/notifications", {
				...(await withSession()),
				query: { unreadOnly: false },
			});
			if (error || !res) {
				console.error("messaging-service notifications:", error);
				return [];
			}
			const role = await getActiveRole();
			return res.data.map((n) => toNotificationRow(role, n));
		},
		unreadCount: async (): Promise<number> => {
			if (!live("messaging"))
				return give(ops.demoNotifications.filter((n) => !n.read).length);
			const { data: res, error } = await api("@get/messaging/notifications", {
				...(await withSession()),
				query: { unreadOnly: true },
			});
			return error || !res ? 0 : res.data.length;
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
		menu: (outletId?: string) =>
			give(
				outletId
					? ops.demoMenu.filter((m) => m.outletId === outletId)
					: ops.demoMenu,
			),
		orders: (outlet?: string) =>
			give(
				outlet
					? ops.demoOrders.filter((o) => o.outlet === outlet)
					: ops.demoOrders,
			),
	},
	housekeeping: opsData.housekeeping,
	laundry: {
		orders: () => give(ops.demoLaundry),
	},
	platform: {
		/** Every business on the platform (GET /tenant/businesses, first 200). Health, MRR and tickets are 0 until platform-service is wired. */
		businesses: async (
			query: { stage?: string; q?: string } = {},
		): Promise<BusinessRow[]> => {
			if (!live("tenant"))
				return give(
					platform.demoBusinesses.filter(
						(b) =>
							(!query.stage || b.stage === query.stage) &&
							(!query.q ||
								b.name.toLowerCase().includes(query.q.toLowerCase())),
					),
				);
			const q: Record<string, string | number> = { page: 0, size: 200 };
			if (query.stage) q.stage = query.stage;
			if (query.q) q.q = query.q;
			const { data: res, error } = await api("@get/tenant/businesses", {
				...(await withSession()),
				query: q,
			});
			if (error || !res) {
				console.error("tenant-service businesses:", error);
				return [];
			}
			return res.data.content.map(toBusinessRow);
		},
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
		/** The onboarding board (GET /tenant/onboarding). Admin names come from the demo team until identity lists platform staff. */
		onboarding: async (status?: string): Promise<OnboardingRow[]> => {
			if (!live("tenant"))
				return give(
					status
						? platform.demoOnboarding.filter((o) => o.status === status)
						: platform.demoOnboarding,
				);
			const { data: res, error } = await api("@get/tenant/onboarding", {
				...(await withSession()),
				query: status ? { status } : {},
			});
			if (error || !res) {
				console.error("tenant-service onboarding:", error);
				return [];
			}
			const admins = new Map(
				platform.demoAdminUsers.map((a) => [a.id, a.fullName]),
			);
			return res.data
				.map((o) => toOnboardingRow(o, admins))
				.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
		},
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
		"messages",
		"payments",
		"rooms",
		"till",
	],
	HOUSEKEEPING: ["inspect", "linen", "lost-found"],
	FINANCE: ["expenses", "month", "night-audit", "organizations", "tills"],
	INVENTORY: ["counts", "deliveries", "orders", "requests", "suppliers"],
	MAINTENANCE: ["jobs", "parts", "rooms"],
	KITCHEN: ["menu", "payments", "store"],
	BAR: ["menu", "payments", "stock", "tabs"],
	LAUNDRY: ["linen", "payments"],
};
const SHARED_SCREENS = ["notifications", "profile", "help", "shifts"];
/** Where a service link lands per role when the role has no screen of that name. */
const SCREEN_ALIASES: Record<string, Record<string, string>> = {
	OWNER: { approvals: "", "night-audit": "financials" },
	FINANCE: { financials: "", "night-audit": "night-audit" },
	MANAGER: { repairs: "tasks", inventory: "inventory" },
	FRONT_OFFICE: { orders: "", menu: "" },
	HOUSEKEEPING: { rooms: "", repairs: "" },
	MAINTENANCE: { repairs: "jobs" },
	INVENTORY: { inventory: "requests" },
};

/** messaging-service links are service paths (/bookings/{id}, /approvals/{id}, /staff/leave …); open them through /dashboard, or not at all when the role has no such screen. */
export function notificationLink(
	link: string | null | undefined,
	role: string | null,
): string | undefined {
	if (!link) return undefined;
	if (link.startsWith("/dashboard")) return link;
	const [rawFirst, second] = link.replace(/^\/+/, "").split("/");
	if (!rawFirst) return "/dashboard";
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
	return `/dashboard/${first}`;
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
