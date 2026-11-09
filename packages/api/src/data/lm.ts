import "server-only";

/**
 * Laundry and maintenance reads (docs/laundry-maintenance.md in hospio-backend): work orders, assets, preventive
 * schedules and the maintenance money on maintenance-service; the laundry price list, guest orders, linen batches and
 * the laundry money on housekeeping-service. `data.maintenance` and `data.laundry` in ./index are these. A reader
 * answers empty (or the demo work orders) when its domain is not live, and logs and answers empty when the service fails.
 */

import { api } from "@hospio/api/api/client";
import type {
	LaundryOrder,
	LaundryPrice,
	LinenBatch,
	MaintAsset,
	MaintSchedule,
	WorkOrder,
} from "@hospio/api/api/routes-lm";
import { withSession } from "@hospio/api/api/server";
import * as ops from "@hospio/api/demo/fixtures/ops";
import type { z } from "zod";
import { live } from "./live";
import type {
	GuestLaundryRow,
	LaundryMoney,
	LaundryPriceRow,
	LinenBatchRow,
	MaintAssetRow,
	MaintenanceMoney,
	MaintScheduleRow,
	WorkOrderPriority,
	WorkOrderRow,
	WorkOrderStatus,
} from "./types";

const n = (v: number | null | undefined) => (typeof v === "number" ? v : 0);
const s = (v: string | null | undefined) => v ?? undefined;
const where = (roomNumber?: string | null, area?: string | null) =>
	roomNumber ? `Room ${roomNumber}` : (area ?? "Hotel");

function failed<T>(what: string, error: unknown, fallback: T): T {
	console.error(`${what}:`, error);
	return fallback;
}

export function toWorkOrderRow(w: z.infer<typeof WorkOrder>): WorkOrderRow {
	return {
		id: w.id,
		number: w.number ?? "WO",
		roomId: s(w.roomId),
		roomNumber: s(w.roomNumber),
		area: s(w.area),
		where: where(w.roomNumber, w.area),
		category: w.category ?? "OTHER",
		priority: w.priority as WorkOrderPriority,
		status: w.status as WorkOrderStatus,
		title: w.title,
		description: s(w.description),
		source: s(w.source),
		reportedBy: s(w.reportedBy),
		reportedByName: w.reportedByName ?? "Someone",
		reportedByRole: s(w.reportedByRole),
		assignedTo: s(w.assignedTo),
		assignedToName: s(w.assignedToName),
		dueAt: s(w.dueAt),
		overdue: !!w.overdue,
		startedAt: s(w.startedAt),
		holdReason: s(w.holdReason),
		doneAt: s(w.doneAt),
		completionNote: s(w.completionNote),
		labourMinutes: w.labourMinutes ?? undefined,
		parts: (w.parts ?? []).map((p) => ({
			itemId: p.itemId,
			name: p.name ?? "Part",
			unit: p.unit ?? "",
			quantity: p.quantity,
			unitCost: n(p.unitCost),
			value: n(p.value),
		})),
		partsCost: n(w.partsCost),
		vendorName: s(w.vendorName),
		vendorCost: n(w.vendorCost),
		totalCost: n(w.totalCost),
		roomOutOfOrder: !!w.roomOutOfOrder,
		oooUntil: s(w.oooUntil),
		reopenCount: n(w.reopenCount),
		reopenReason: s(w.reopenReason),
		cancelReason: s(w.cancelReason),
		hasPhoto: !!w.hasPhoto,
		assetName: s(w.assetName),
		scheduleId: s(w.scheduleId),
		createdAt: w.createdAt ?? new Date().toISOString(),
		updates: (w.updates ?? []).map((u) => ({
			at: u.at ?? "",
			by: u.byName ?? "",
			note: u.note,
		})),
	};
}

export function toAssetRow(a: z.infer<typeof MaintAsset>): MaintAssetRow {
	return {
		id: a.id,
		name: a.name,
		category: a.category ?? "OTHER",
		roomId: s(a.roomId),
		roomNumber: s(a.roomNumber),
		area: s(a.area),
		where: where(a.roomNumber, a.area),
		active: a.active !== false,
		openWorkOrders: n(a.openWorkOrders),
	};
}

export function toScheduleRow(
	j: z.infer<typeof MaintSchedule>,
): MaintScheduleRow {
	return {
		id: j.id,
		title: j.title,
		description: s(j.description),
		category: j.category ?? "OTHER",
		priority: (j.priority ?? "NORMAL") as WorkOrderPriority,
		everyDays: j.everyDays,
		nextDue: j.nextDue,
		lastDone: s(j.lastDone),
		lastOpened: s(j.lastOpened),
		assetId: s(j.assetId),
		assetName: s(j.assetName),
		roomId: s(j.roomId),
		roomNumber: s(j.roomNumber),
		area: s(j.area),
		where: j.assetName ?? where(j.roomNumber, j.area),
		assignedTo: s(j.assignedTo),
		assignedToName: s(j.assignedToName),
		paused: !!j.paused,
	};
}

export function toPriceRow(p: z.infer<typeof LaundryPrice>): LaundryPriceRow {
	return {
		id: p.id,
		name: p.name,
		category: p.category ?? "WASH_IRON",
		price: p.price,
		expressPrice: n(p.expressPrice) || p.price,
		active: p.active !== false,
		sortOrder: n(p.sortOrder),
	};
}

export function toGuestLaundryRow(
	o: z.infer<typeof LaundryOrder>,
): GuestLaundryRow {
	return {
		id: o.id,
		number: o.number ?? "LDR",
		bookingId: s(o.bookingId),
		guestName: o.guestName ?? "Guest",
		roomId: s(o.roomId),
		roomNumber: s(o.roomNumber),
		lines: (o.lines ?? []).map((l) => ({
			priceId: s(l.priceId),
			name: l.name,
			quantity: l.quantity,
			unitPrice: l.unitPrice,
			amount: l.amount,
		})),
		express: !!o.express,
		total: o.total,
		status: o.status as GuestLaundryRow["status"],
		settlement:
			o.settlement === "ROOM" || o.settlement === "PAID"
				? o.settlement
				: undefined,
		chargedAt: s(o.chargedAt),
		paidAt: s(o.paidAt),
		paymentMethod: s(o.paymentMethod),
		promisedAt: s(o.promisedAt),
		note: s(o.note),
		pocketNote: s(o.pocketNote),
		cancelReason: s(o.cancelReason),
		receivedByName: s(o.receivedByName),
		createdAt: o.createdAt ?? new Date().toISOString(),
		deliveredAt: s(o.deliveredAt),
	};
}

export function toBatchRow(b: z.infer<typeof LinenBatch>): LinenBatchRow {
	return {
		id: b.id,
		number: b.number,
		status: b.status as LinenBatchRow["status"],
		lines: b.lines.map((l) => ({
			itemId: l.itemId,
			name: l.name ?? "Linen",
			unit: l.unit ?? "pcs",
			sent: l.sent,
			received: l.received ?? undefined,
			returned: n(l.returned),
			condemned: n(l.condemned),
			lost: n(l.lost),
			missing: n(l.missing),
			outstanding: n(l.outstanding),
			unitCost: n(l.unitCost),
		})),
		note: s(b.note),
		sentByName: s(b.sentByName),
		createdAt: b.createdAt ?? new Date().toISOString(),
		receivedAt: s(b.receivedAt),
		receivedByName: s(b.receivedByName),
		returnedAt: s(b.returnedAt),
		closedReason: s(b.closedReason),
		condemnedValue: n(b.condemnedValue),
		lostValue: n(b.lostValue),
		sent: n(b.sent),
		missing: n(b.missing),
		outstanding: n(b.outstanding),
	};
}

/** The old demo repairs, shown as work orders when maintenance isn't live (the demo build). */
function demoWorkOrders(): WorkOrderRow[] {
	return ops.demoRepairs.map((r, i) => ({
		id: r.id,
		number: `WO-2026-${String(i + 1).padStart(5, "0")}`,
		roomNumber: r.roomNumber,
		area: r.area,
		where: where(r.roomNumber, r.area),
		category: "OTHER",
		priority: r.priority,
		status: r.status === "WAITING_PARTS" ? "ON_HOLD" : r.status,
		title: r.title,
		description: r.description,
		reportedByName: r.reportedBy,
		assignedToName: r.assignedTo,
		overdue: false,
		holdReason: r.status === "WAITING_PARTS" ? "Waiting for parts" : undefined,
		doneAt: r.doneAt,
		parts: [],
		partsCost: 0,
		vendorCost: 0,
		totalCost: 0,
		roomOutOfOrder: !!r.roomOutOfOrder,
		reopenCount: 0,
		hasPhoto: false,
		createdAt: r.createdAt,
		updates: r.updates,
	}));
}

export const lmData = {
	maintenance: {
		/** Work orders: `open` (default), `mine`, `done` or `all` (latest 300). */
		workOrders: async (
			scope: "open" | "mine" | "done" | "all" = "all",
		): Promise<WorkOrderRow[]> => {
			if (!live("maintenance")) return demoWorkOrders();
			const { data, error } = await api("@get/maintenance/repairs", {
				...(await withSession()),
				query: { scope },
			});
			if (error || !data)
				return failed("maintenance-service work orders", error, []);
			return data.data.map(toWorkOrderRow);
		},
		workOrder: async (id: string): Promise<WorkOrderRow | null> => {
			if (!live("maintenance"))
				return demoWorkOrders().find((w) => w.id === id) ?? null;
			const { data, error } = await api("@get/maintenance/repairs/:id", {
				...(await withSession()),
				params: { id },
			});
			if (error || !data)
				return failed("maintenance-service work order", error, null);
			return toWorkOrderRow(data.data);
		},
		assets: async (): Promise<MaintAssetRow[]> => {
			if (!live("maintenance")) return [];
			const { data, error } = await api("@get/maintenance/assets", {
				...(await withSession()),
			});
			if (error || !data)
				return failed("maintenance-service assets", error, []);
			return data.data.map(toAssetRow);
		},
		schedules: async (): Promise<MaintScheduleRow[]> => {
			if (!live("maintenance")) return [];
			const { data, error } = await api("@get/maintenance/scheduled-jobs", {
				...(await withSession()),
			});
			if (error || !data)
				return failed("maintenance-service schedules", error, []);
			return data.data.map(toScheduleRow);
		},
		/** Parts and vendor cost of work orders completed in the period (default the last 30 days); null when not allowed or not live. */
		money: async (
			from?: string,
			to?: string,
		): Promise<MaintenanceMoney | null> => {
			if (!live("maintenance")) return null;
			const query: Record<string, string> = {};
			if (from) query.from = from;
			if (to) query.to = to;
			const { data, error } = await api("@get/maintenance/repairs/summary", {
				...(await withSession()),
				query,
			});
			if (error || !data) {
				if (error?.status !== 403)
					console.error("maintenance-service summary:", error);
				return null;
			}
			return data.data;
		},
	},
	laundry: {
		prices: async (): Promise<LaundryPriceRow[]> => {
			if (!live("housekeeping")) return [];
			const { data, error } = await api("@get/housekeeping/laundry/prices", {
				...(await withSession()),
			});
			if (error || !data) return failed("laundry prices", error, []);
			return data.data.map(toPriceRow);
		},
		/** Guest orders: the open ones (default) or the latest 300. */
		orders: async (
			status: "open" | "all" = "all",
		): Promise<GuestLaundryRow[]> => {
			if (!live("housekeeping")) return [];
			const { data, error } = await api("@get/housekeeping/laundry/orders", {
				...(await withSession()),
				query: { status },
			});
			if (error || !data) return failed("laundry orders", error, []);
			return data.data.map(toGuestLaundryRow);
		},
		batches: async (
			status: "open" | "all" = "all",
		): Promise<LinenBatchRow[]> => {
			if (!live("housekeeping")) return [];
			const { data, error } = await api(
				"@get/housekeeping/laundry/linen-batches",
				{ ...(await withSession()), query: { status } },
			);
			if (error || !data) return failed("linen batches", error, []);
			return data.data.map(toBatchRow);
		},
		money: async (from?: string, to?: string): Promise<LaundryMoney | null> => {
			if (!live("housekeeping")) return null;
			const query: Record<string, string> = {};
			if (from) query.from = from;
			if (to) query.to = to;
			const { data, error } = await api("@get/housekeeping/laundry/summary", {
				...(await withSession()),
				query,
			});
			if (error || !data) {
				if (error?.status !== 403) console.error("laundry summary:", error);
				return null;
			}
			return data.data;
		},
	},
};
