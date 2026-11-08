import "server-only";

/**
 * The data seam every screen reads through. In demo mode each function answers from the fixtures
 * under src/lib/demo/fixtures; when the backend is wired in, swap the body of a function for the
 * matching `api("@get/...")` call and the screen above it does not change.
 */

import { api } from "@/lib/api/client";
import { withSession } from "@/lib/api/server";
import { demoDelay } from "@/lib/demo/mode";
import { live } from "./live";
import { toAreaRow, toRoomRow, toRoomTypeRow } from "./mappers/property";
import * as hotel from "@/lib/demo/fixtures/hotel";
import * as ops from "@/lib/demo/fixtures/ops";
import * as platform from "@/lib/demo/fixtures/platform";
import * as stay from "@/lib/demo/fixtures/stay";
import type { AreaRow, BookingRow, BookingStatus, RoomRow, RoomTypeRow } from "./types";

const give = async <T>(value: T): Promise<T> => {
	await demoDelay(40);
	return value;
};

const isToday = (iso: string) => iso === hotel.today();

export function bookingBuckets(bookings: BookingRow[]) {
	return {
		arrivals: bookings.filter((b) => isToday(b.checkInDate) && (b.status === "BOOKED" || b.status === "NO_SHOW" || (b.status === "CHECKED_IN" && b.checkedInAt?.slice(0, 10) === hotel.today()))),
		departures: bookings.filter((b) => isToday(b.checkOutDate) && b.status === "CHECKED_IN"),
		inHouse: bookings.filter((b) => b.status === "CHECKED_IN"),
		upcoming: bookings.filter((b) => b.status === "BOOKED" && b.checkInDate > hotel.today()),
		past: bookings.filter((b) => b.status === "CHECKED_OUT" || b.status === "CANCELLED" || (b.status === "NO_SHOW" && !isToday(b.checkInDate))),
	};
}

export const data = {
	hotels: {
		list: () => give(hotel.demoHotels),
		summaries: () => give(hotel.demoHotelSummaries),
		setup: () => give(ops.demoHotelSetup),
	},
	rooms: {
		list: async (): Promise<RoomRow[]> => {
			if (!live("property")) return give(hotel.demoRooms);
			const s = await withSession();
			const [areas, rooms, cleanliness] = await Promise.all([
				data.rooms.areas(),
				api("@get/property/rooms", { ...s, query: {} }),
				api("@get/housekeeping/room-status", s).catch(() => ({ data: null })),
			]);
			if (rooms.error || !rooms.data) {
				console.error("property-service rooms:", rooms.error);
				return [];
			}
			const clean = new Map((cleanliness.data?.data ?? []).map((c) => [c.roomId, c]));
			return rooms.data.data.map((r) => toRoomRow(r, areas, clean.get(r.id)));
		},
		types: async (): Promise<RoomTypeRow[]> => {
			if (!live("property")) return give(hotel.demoRoomTypes);
			const { data: res, error } = await api("@get/property/room-types", await withSession());
			if (error || !res) {
				console.error("property-service room types:", error);
				return [];
			}
			return res.data.map(toRoomTypeRow);
		},
		areas: async (): Promise<AreaRow[]> => {
			if (!live("property")) {
				const names = Array.from(new Set(hotel.demoRooms.map((r) => r.floor)));
				return give(names.map((name, i) => ({ id: `area-${i + 1}`, name, kind: "FLOOR", sortOrder: i + 1 })));
			}
			const { data: res, error } = await api("@get/property/areas", await withSession());
			if (error || !res) {
				console.error("property-service areas:", error);
				return [];
			}
			return res.data.map(toAreaRow).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
		},
		get: async (id: string): Promise<RoomRow | null> => {
			const rooms = await data.rooms.list();
			return rooms.find((r) => r.id === id || r.number === id) ?? null;
		},
	},
	bookings: {
		list: (status?: BookingStatus) => give(status ? stay.demoBookings.filter((b) => b.status === status) : stay.demoBookings),
		buckets: () => give(bookingBuckets(stay.demoBookings)),
		get: (id: string) => give(stay.demoBookings.find((b) => b.id === id || b.reference === id) ?? null),
	},
	guests: {
		list: () => give(stay.demoGuests),
		get: (id: string) => give(stay.demoGuests.find((g) => g.id === id) ?? null),
	},
	folios: {
		list: () => give(stay.demoFolios),
		get: (id: string) => give(stay.demoFolios.find((f) => f.id === id || f.bookingId === id) ?? null),
	},
	payments: {
		list: () => give(stay.demoPayments),
		terminals: () => give(stay.demoTerminals),
		refunds: () => give(stay.demoRefunds),
		disputes: () => give(stay.demoDisputes),
	},
	organizations: {
		list: () => give(stay.demoOrganizations),
		get: (id: string) => give(stay.demoOrganizations.find((o) => o.id === id) ?? null),
		members: (id: string) => give(stay.demoOrgMembers[id] ?? []),
		invoices: (id?: string) => give(id ? stay.demoInvoices.filter((i) => i.organizationId === id) : stay.demoInvoices),
	},
	staff: {
		list: () => give(hotel.demoStaff),
		get: (id: string) => give(hotel.demoStaff.find((s) => s.id === id) ?? null),
		shifts: (from?: string, to?: string) => give(hotel.demoShifts.filter((s) => (!from || s.date >= from) && (!to || s.date <= to))),
		leave: () => give(hotel.demoLeave),
		shiftRequests: () => give(hotel.demoShiftRequests),
	},
	finance: {
		expenses: () => give(ops.demoExpenses),
		tills: () => give(ops.demoTills),
		transactions: () => give(ops.demoTransactions),
		nightAudits: () => give(ops.demoNightAudits),
		today: () =>
			give({
				revenue: 1232000,
				byMethod: { CARD: 785000, TRANSFER: 309650, CASH: 137350 } as Record<string, number>,
				paymentsCount: 29,
				expenses: 642500,
				openTills: ops.demoTills.filter((t) => t.status === "OPEN").length,
				cashInTills: ops.demoTills.filter((t) => t.status === "OPEN").reduce((s, t) => s + t.expected, 0),
			}),
	},
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
	approvals: {
		list: () => give(ops.demoApprovals),
		get: (id: string) => give(ops.demoApprovals.find((a) => a.id === id) ?? null),
	},
	notifications: {
		list: () => give(ops.demoNotifications),
		unreadCount: () => give(ops.demoNotifications.filter((n) => !n.read).length),
	},
	messaging: {
		conversations: () => give(ops.demoConversations),
		get: (id: string) => give(ops.demoConversations.find((c) => c.id === id) ?? null),
		templates: () => give(ops.demoTemplates),
	},
	reports: {
		list: () => give(ops.demoReports),
	},
	departments: {
		live: () => give(ops.demoDepartments),
	},
	outlets: {
		menu: (outletId?: string) => give(outletId ? ops.demoMenu.filter((m) => m.outletId === outletId) : ops.demoMenu),
		orders: (outlet?: string) => give(outlet ? ops.demoOrders.filter((o) => o.outlet === outlet) : ops.demoOrders),
	},
	housekeeping: {
		tasks: () => give(ops.demoCleaningTasks),
		lostFound: () => give(ops.demoLostFound),
	},
	laundry: {
		orders: () => give(ops.demoLaundry),
	},
	platform: {
		businesses: () => give(platform.demoBusinesses),
		business: (id: string) => give(platform.demoBusinesses.find((b) => b.id === id) ?? null),
		marketers: () => give(platform.demoMarketers),
		tickets: () => give(platform.demoTickets),
		feeStatements: () => give(platform.demoFeeStatements),
		changes: () => give(platform.demoPlatformChanges),
		onboarding: () => give(platform.demoOnboarding),
		adminUsers: () => give(platform.demoAdminUsers),
	},
};

export type Data = typeof data;
