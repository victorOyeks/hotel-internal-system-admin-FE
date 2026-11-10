import "server-only";

/**
 * The owner portal's data seam (docs/owner-portal.md in hospio-backend). Every list covers every hotel of the business:
 * either one business-wide call (no X-Hotel-Id) or one call per hotel run with that hotel's X-Hotel-Id (`atHotel`),
 * and each row says which hotel it belongs to. The screens narrow by hotel on the page, so "All hotels" is the sum of
 * the single hotels. The manager's data functions are reused per hotel through `atHotel`, never copied.
 */

import { api, errorMessage } from "@hospio/api/api/client";
import type { UserSummary } from "@hospio/api/api/schema";
import { atHotel, withSession } from "@hospio/api/api/server";
import { getHotels } from "@hospio/api/dal";
import { live } from "./live";
import {
	emptyPage,
	failedPage,
	type ListQuery,
	type PageResult,
	pageQuery,
	toPaged,
} from "./paging";
import { toStaffRow } from "./mappers/identity";
import { lagosDate } from "./mappers/finance";
import type {
	ActivityRow,
	ApprovalRow,
	AtHotel,
	BookingQuery,
	BookingRow,
	CreditRequestRow,
	DepartmentLive,
	OrganizationRow,
	OwnerChangeRow,
	OwnerHotelContext,
	OwnerHotelRow,
	OwnerStaffRow,
	OwnerThreadMessage,
	OwnerThreadRow,
	PaymentQuery,
	PaymentRow,
	ReportRunRow,
	ReportScheduleRow,
	SettlementView,
	TransferRequestRow,
} from "./types";

/** FRONT_OFFICE or REVENUE → "Front office", "Revenue". */
const humanize = (code: string) => {
	const s = code.toLowerCase().replace(/_/g, " ");
	return s ? s[0].toUpperCase() + s.slice(1) : s;
};

/** The data seam, loaded when called: it imports this module, so a static import would be circular. */
const seam = async () => (await import("./index")).data;

type Hotel = { id: string; name: string };

async function hotelsOf(): Promise<Hotel[]> {
	return (await getHotels()).map((h) => ({ id: h.id, name: h.name }));
}

/** Run `load` once per hotel with that hotel's X-Hotel-Id and tag every row with it. */
async function perHotel<T>(load: () => Promise<T[]>): Promise<(T & AtHotel)[]> {
	const hotels = await hotelsOf();
	const lists = await Promise.all(
		hotels.map((h) =>
			atHotel(h.id, load).then((rows) =>
				rows.map((r) => ({ ...r, hotelId: h.id, hotelName: h.name })),
			),
		),
	);
	return lists.flat();
}

/** One call across the whole business: no X-Hotel-Id. */
const businessWide = <T>(work: () => Promise<T>) => atHotel(null, work);

const DEPARTMENTS: { key: string; name: string; roles: string[] }[] = [
	{ key: "FRONT_OFFICE", name: "Front office", roles: ["FRONT_OFFICE"] },
	{ key: "HOUSEKEEPING", name: "Housekeeping", roles: ["HOUSEKEEPING"] },
	{ key: "LAUNDRY", name: "Laundry", roles: ["LAUNDRY"] },
	{ key: "MAINTENANCE", name: "Maintenance", roles: ["MAINTENANCE"] },
	{ key: "KITCHEN", name: "Kitchen", roles: ["KITCHEN"] },
	{ key: "BAR", name: "Bar", roles: ["BAR"] },
	{ key: "STORE", name: "Store", roles: ["INVENTORY"] },
	{ key: "FINANCE", name: "Finance", roles: ["FINANCE"] },
];

/** platform-service's topic → department, as its Departments board counts them. */
const TOPIC_DEPARTMENT: [string, string][] = [
	["booking", "Front office"],
	["guest", "Front office"],
	["folio", "Front office"],
	["charge", "Front office"],
	["room-cleaned", "Housekeeping"],
	["problem", "Housekeeping"],
	["linen", "Laundry"],
	["repair", "Maintenance"],
	["parts", "Maintenance"],
	["room-out", "Maintenance"],
	["room-back", "Maintenance"],
	["order", "Kitchen"],
	["item-sold", "Bar"],
	["stock", "Store"],
	["delivery", "Store"],
	["payment", "Finance"],
	["expense", "Finance"],
	["day-closed", "Finance"],
	["cash", "Finance"],
	["refund", "Finance"],
	["pos", "Finance"],
	["user", "Management"],
	["role", "Management"],
	["access", "Management"],
	["approval", "Management"],
	["change-by-platform", "H.M.S"],
];

function departmentOfTopic(
	topic?: string | null,
	actor?: string | null,
): string {
	if (actor?.startsWith("H.M.S")) return "H.M.S";
	const t = (topic ?? "").replace(/^hospio-/, "");
	return TOPIC_DEPARTMENT.find(([p]) => t.startsWith(p))?.[1] ?? "Other";
}

/** Words the summaries keep in capitals. */
const KEEP = new Set([
	"POS",
	"VAT",
	"ID",
	"SMS",
	"PDF",
	"CSV",
	"NGN",
	"OK",
	"ADR",
	"QA",
]);

/** Codes inside an event summary (REPAIRS, FRONT_OFFICE) read as words (Repairs, Front office). */
function readable(summary: string): string {
	return summary.replace(/\b[A-Z]{2,}(?:_[A-Z]+)*\b/g, (code) =>
		KEEP.has(code) ? code : humanize(code),
	);
}

/** "BookingCreatedEvent" or "booking-created" → "Booking created". */
function actionOf(eventType: string): string {
	const words = eventType
		.replace(/Event$/, "")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.toLowerCase()
		.trim();
	return words ? words[0].toUpperCase() + words.slice(1) : "Activity";
}

const toThreadRow = (
	t: {
		id: string;
		hotelId?: string | null;
		subject?: string | null;
		audience?: string | null;
		withName?: string | null;
		mine: boolean;
		lastMessageAt?: string | null;
		createdAt?: string | null;
		lastPreview?: string | null;
		unread: number;
		broadcastId?: string | null;
	},
	names: Map<string, string>,
): OwnerThreadRow => ({
	id: t.id,
	hotelId: t.hotelId ?? undefined,
	hotelName: t.hotelId ? names.get(t.hotelId) : undefined,
	subject: t.subject ?? "Message",
	audience: t.audience === "MANAGERS" ? "MANAGERS" : "PERSON",
	withName: t.withName ?? "—",
	mine: t.mine,
	lastAt: t.lastMessageAt ?? t.createdAt ?? "",
	preview: t.lastPreview ?? "",
	unread: t.unread,
	broadcastId: t.broadcastId ?? undefined,
});

export const ownerData = {
	/** The business's hotels (tenant-service), as `{ id, name }`. */
	hotelList: hotelsOf,

	/**
	 * Hotels with this month's money (finance) and what is happening now: staff clocked in and on today's rota
	 * (workforce), open repairs (maintenance) and the last thing logged (activity).
	 */
	hotels: async (): Promise<OwnerHotelRow[]> => {
		const data = await seam();
		// Business-wide: the finance owner summary covers every hotel only without a hotel header.
		const rows = await businessWide(() => data.hotels.withMoney());
		if (!live("tenant")) return rows;
		const today = lagosDate();
		return Promise.all(
			rows.map((h) =>
				atHotel(h.hotelId, async () => {
					const s = await withSession();
					const [clock, rota, repairs, activity] = await Promise.all([
						live("finance")
							? api("@get/finance/workforce/clock", {
									...s,
									query: { date: today },
								}).catch(() => null)
							: null,
						live("finance")
							? api("@get/finance/workforce/rota", {
									...s,
									query: { from: today, to: today },
								}).catch(() => null)
							: null,
						live("maintenance")
							? api("@get/maintenance/repairs/summary", {
									...s,
									query: { from: today, to: today },
								}).catch(() => null)
							: null,
						live("platform")
							? api("@get/platform/activity", {
									...s,
									query: { page: 0, size: 1 },
								}).catch(() => null)
							: null,
					]);
					const last = activity?.data?.data.content[0];
					return {
						...h,
						onShift: clock?.data
							? clock.data.data.filter((e) => e.clockIn && !e.clockOut).length
							: h.onShift,
						scheduled: rota?.data
							? rota.data.data.filter((x) => x.status !== "CANCELLED").length
							: h.scheduled,
						openIssues: repairs?.data ? repairs.data.data.open : h.openIssues,
						lastAction: last ? readable(last.summary) : h.lastAction,
						lastAt: last ? last.occurredAt : h.lastAt,
					};
				}),
			),
		);
	},

	/**
	 * One page of every hotel's bookings (one business-wide call; `hotelId` narrows to a hotel), newest stay first, with
	 * the view counts and the money over the whole range (so "All hotels" is the sum of the hotels), each row tagged
	 * with its hotel; and each hotel's rooms, open folios, terminals, accounts and card payments still with the POS for
	 * the panels (each bounded).
	 */
	bookings: async (
		q: BookingQuery = {},
	): Promise<{
		bookings: PageResult<BookingRow & AtHotel>;
		contexts: OwnerHotelContext[];
	}> => {
		const data = await seam();
		const hotels = await hotelsOf();
		const names = new Map(hotels.map((h) => [h.id, h.name]));
		const [page, contexts] = await Promise.all([
			businessWide(() => data.bookings.page(q)),
			Promise.all(
				hotels.map((h) =>
					atHotel(h.id, async () => {
						const [
							rooms,
							types,
							folios,
							organizations,
							terminals,
							pendingOnPos,
						] = await Promise.all([
							data.rooms.list(),
							data.rooms.types(),
							data.folios.list(),
							data.organizations.forBooking(),
							data.payments.terminals(h.id),
							data.payments.pendingOnPos(),
						]);
						return {
							hotelId: h.id,
							hotelName: h.name,
							rooms,
							types,
							folios,
							guests: [],
							organizations,
							terminals,
							pendingOnPos,
						} satisfies OwnerHotelContext;
					}),
				),
			),
		]);
		const orgs = contexts.flatMap((c) => c.organizations);
		return {
			bookings: {
				...page,
				data: {
					...page.data,
					content: page.data.content.map((b) => {
						const hotelId = b.hotelId ?? "";
						return {
							...b,
							organizationName:
								b.organizationName ??
								orgs.find((o) => o.id === b.organizationId)?.name,
							hotelId,
							hotelName: names.get(hotelId) ?? "Hotel",
						};
					}),
				},
			} as PageResult<BookingRow & AtHotel>,
			contexts,
		};
	},

	/**
	 * Everyone with a role at a hotel of the business, one row per person and hotel (the owner is not listed), from
	 * identity's business-wide list.
	 */
	staff: async (): Promise<OwnerStaffRow[]> => {
		if (!live("identity")) return [];
		const hotels = await hotelsOf();
		const names = new Map(hotels.map((h) => [h.id, h.name]));
		const { data: res, error } = await businessWide(async () =>
			api("@get/identity/users", { ...(await withSession()), query: {} }),
		);
		if (error || !res) {
			console.error("identity-service users (owner):", error);
			return [];
		}
		const rows: OwnerStaffRow[] = [];
		for (const u of res.data as UserSummary[]) {
			if (u.grants.some((g) => g.role === "OWNER")) continue;
			const hotelIds = [
				...new Set(
					u.grants
						.map((g) => g.hotelId)
						.filter((h): h is string => !!h && names.has(h)),
				),
			];
			for (const hotelId of hotelIds) {
				const row = toStaffRow(u, hotelId, names);
				const here = u.grants.filter((g) => g.hotelId === hotelId);
				const timedPause = u.status === "PAUSED" && !!u.pausedUntil;
				rows.push({
					...row,
					jobTitle: u.jobTitle || row.jobTitle,
					// A suspended or paused account is that, whatever its roles here say.
					status:
						u.status === "SUSPENDED"
							? "SUSPENDED"
							: u.status === "PAUSED"
								? "PAUSED"
								: row.status,
					key: `${u.id}:${hotelId}`,
					hotelId,
					hotelName: names.get(hotelId) ?? "Hotel",
					pausedUntil: timedPause ? (u.pausedUntil ?? undefined) : undefined,
					statusReason: u.statusReason ?? undefined,
					statusChangedBy: u.statusChangedBy ?? undefined,
					statusChangedAt: u.statusChangedAt ?? undefined,
					grantIdsHere: here.map((g) => g.id),
					isManager: here.some((g) => g.role === "MANAGER"),
				});
			}
		}
		return rows.sort(
			(a, b) =>
				a.fullName.localeCompare(b.fullName) ||
				a.hotelName.localeCompare(b.hotelName),
		);
	},

	/**
	 * My staff threads, newest message first, a page at a time (messaging-service pages and searches `q`). Across the
	 * business, or at one hotel when `hotelId` is given (that hotel's X-Hotel-Id).
	 */
	threads: async (
		query: ListQuery = {},
		hotelId?: string | null,
	): Promise<PageResult<OwnerThreadRow>> => {
		if (!live("messaging")) return { ok: true, data: emptyPage() };
		const names = new Map((await hotelsOf()).map((h) => [h.id, h.name]));
		const { data: res, error } = await atHotel(hotelId ?? null, async () =>
			api("@get/messaging/threads", {
				...(await withSession()),
				query: pageQuery(query),
			}),
		);
		if (error || !res) {
			console.error("messaging-service threads:", error);
			return failedPage(errorMessage(error, "Messages didn't load"));
		}
		return { ok: true, data: toPaged(res.data, (t) => toThreadRow(t, names)) };
	},

	/** One thread's messages (and it is marked read for me). */
	thread: async (
		id: string,
	): Promise<{
		thread: OwnerThreadRow;
		messages: OwnerThreadMessage[];
	} | null> => {
		if (!live("messaging")) return null;
		const names = new Map((await hotelsOf()).map((h) => [h.id, h.name]));
		const { data: res } = await businessWide(async () =>
			api("@get/messaging/threads/:id", {
				...(await withSession()),
				params: { id },
			}),
		);
		if (!res) return null;
		return {
			thread: toThreadRow(res.data.thread, names),
			messages: res.data.messages.map((m) => ({
				id: m.id,
				senderName: m.senderName ?? "—",
				body: m.body,
				at: m.createdAt,
				mine: m.mine,
			})),
		};
	},

	/**
	 * One page of every hotel's payments (one business-wide call; `hotelId` narrows), newest first, each tagged with its
	 * hotel. `totals` (this month's approved money, cash, ...) cover the whole range, so "All hotels" is the sum of the hotels.
	 */
	payments: async (
		q: PaymentQuery = {},
	): Promise<PageResult<PaymentRow & AtHotel>> => {
		const data = await seam();
		const hotels = await hotelsOf();
		const names = new Map(hotels.map((h) => [h.id, h.name]));
		const page = await businessWide(() => data.payments.page(q));
		return {
			...page,
			data: {
				...page.data,
				content: page.data.content.map((p) => ({
					...p,
					hotelId: p.hotelId ?? "",
					hotelName: names.get(p.hotelId ?? "") ?? "Hotel",
				})),
			},
		} as PageResult<PaymentRow & AtHotel>;
	},

	/** The business's settlements (card and transfer money the providers collected) between two days. */
	settlements: async (from: string, to: string): Promise<SettlementView[]> => {
		if (!live("payment")) return [];
		const names = new Map((await hotelsOf()).map((h) => [h.id, h.name]));
		const { data: res, error } = await businessWide(async () =>
			api("@get/payment/payments/settlements", {
				...(await withSession()),
				query: { from, to },
			}),
		);
		if (error || !res) {
			console.error("payment-service settlements:", error);
			return [];
		}
		return res.data.map((s) => ({
			id: s.id,
			day: s.periodDate,
			provider: s.provider ?? "—",
			hotelName: s.hotelId ? names.get(s.hotelId) : undefined,
			gross: s.gross,
			fees: s.providerFees,
			hmsShare: s.hmsShare ?? 0,
			net: s.net,
			payments: s.paymentCount ?? 0,
			status:
				s.status === "SETTLED" || s.status === "FAILED" ? s.status : "PENDING",
			settledAt: s.settledAt ?? undefined,
			failureReason: s.failureReason ?? undefined,
		}));
	},

	/** The activity log: the whole business, newest first (up to 200). */
	activity: async (): Promise<(ActivityRow & Partial<AtHotel>)[]> => {
		if (!live("platform")) return [];
		const names = new Map((await hotelsOf()).map((h) => [h.id, h.name]));
		const { data: res, error } = await businessWide(async () =>
			api("@get/platform/activity", {
				...(await withSession()),
				query: { page: 0, size: 200 },
			}),
		);
		if (error || !res) {
			console.error("platform-service activity:", error);
			return [];
		}
		return res.data.content
			.map((e) => ({
				id: e.id,
				at: e.occurredAt,
				actor: e.actorName?.replace(/^system:.*/, "Hospio") || "Hospio",
				actorRole: "",
				department: departmentOfTopic(e.topic, e.actorName),
				action: actionOf(e.eventType),
				summary: readable(e.summary),
				eventType: e.eventType,
				byPlatform: !!e.actorName?.startsWith("H.M.S"),
				hotelId: e.hotelId ?? undefined,
				hotelName: e.hotelId ? names.get(e.hotelId) : undefined,
			}))
			.sort((a, b) => b.at.localeCompare(a.at));
	},

	/** Each hotel's departments now: who is on shift and scheduled today, and the last hour's actions. */
	departments: async (): Promise<(DepartmentLive & AtHotel)[]> => {
		if (!live("platform")) return [];
		const today = lagosDate();
		return perHotel(async () => {
			const s = await withSession();
			const [board, clock, rota] = await Promise.all([
				api("@get/platform/departments/live", s).catch(() => null),
				live("finance")
					? api("@get/finance/workforce/clock", {
							...s,
							query: { date: today },
						}).catch(() => null)
					: null,
				live("finance")
					? api("@get/finance/workforce/rota", {
							...s,
							query: { from: today, to: today },
						}).catch(() => null)
					: null,
			]);
			const shifts = (rota?.data?.data ?? []).filter(
				(x) => x.status !== "CANCELLED",
			);
			const roleOf = new Map(shifts.map((x) => [x.userId, x.role]));
			const inNow = (clock?.data?.data ?? []).filter(
				(e) => e.clockIn && !e.clockOut,
			);
			return DEPARTMENTS.map((d) => {
				const b = board?.data?.data[d.key];
				const actions = b?.actionsLastHour ?? 0;
				return {
					key: d.key,
					name: d.name,
					onShift: inNow.filter(
						(e) => e.userId && d.roles.includes(roleOf.get(e.userId) ?? ""),
					).length,
					scheduled: shifts.filter((x) => d.roles.includes(x.role)).length,
					actionsLastHour: actions,
					lastAction: b?.lastAction ? readable(b.lastAction) : "",
					lastAt: b?.lastAt ?? "",
					open: actions,
					openLabel: actions === 1 ? "action last hour" : "actions last hour",
					tone: actions > 0 ? ("success" as const) : ("grey" as const),
				};
			});
		});
	},

	/** Changes H.M.S made in the business, newest first, with any undo request. */
	changes: async (): Promise<OwnerChangeRow[]> => {
		if (!live("platform")) return [];
		const names = new Map((await hotelsOf()).map((h) => [h.id, h.name]));
		const { data: res, error } = await businessWide(async () =>
			api("@get/platform/changes", await withSession()),
		);
		if (error || !res) {
			console.error("platform-service changes:", error);
			return [];
		}
		return res.data
			.map((r) => ({
				id: r.change.id,
				businessName: r.businessName ?? "",
				area: r.change.area,
				description: r.change.description,
				reason: r.change.reason ?? "",
				madeBy: r.madeByName ?? r.change.madeByName ?? "H.M.S",
				at: r.change.createdAt,
				undoUntil: r.change.undoUntil,
				undone: r.undone,
				hotelName: r.change.hotelId ? names.get(r.change.hotelId) : undefined,
				undoRequestedAt: r.change.undoRequestedAt ?? undefined,
				undoRequestedBy: r.change.undoRequestedByName ?? undefined,
				undoTicketId: r.change.undoTicketId ?? undefined,
			}))
			.sort((a, b) => b.at.localeCompare(a.at));
	},

	/** Report schedules and the runs they made, newest first. */
	reports: async (): Promise<{
		schedules: ReportScheduleRow[];
		runs: ReportRunRow[];
	}> => {
		if (!live("platform")) return { schedules: [], runs: [] };
		const names = new Map((await hotelsOf()).map((h) => [h.id, h.name]));
		const { data: res, error } = await businessWide(async () =>
			api("@get/platform/reports", await withSession()),
		);
		if (error || !res) {
			console.error("platform-service reports:", error);
			return { schedules: [], runs: [] };
		}
		const hotelName = (id?: string | null) =>
			id ? (names.get(id) ?? "Hotel") : "All hotels";
		const schedules = res.data
			.filter(
				(r) => r.sendAt && (r.status === "SCHEDULED" || r.status === "STOPPED"),
			)
			.map((r) => ({
				id: r.id,
				kind: r.kind,
				name: r.name ?? humanize(r.kind),
				every: (r.schedule === "WEEKLY" || r.schedule === "MONTHLY"
					? r.schedule
					: "DAILY") as ReportScheduleRow["every"],
				sendAt: r.sendAt ?? "07:00",
				hotelId: r.hotelId ?? undefined,
				hotelName: hotelName(r.hotelId),
				managers: (r.recipients ?? "").includes("MANAGERS"),
				status: (r.status === "STOPPED"
					? "STOPPED"
					: "SCHEDULED") as ReportScheduleRow["status"],
				nextRunAt: r.nextRunAt ?? undefined,
				lastRunAt: r.lastRunAt ?? undefined,
				requestedBy: r.requestedByName ?? "—",
			}));
		const runs = res.data
			.filter(
				(r) =>
					r.status === "READY" && r.scheduleId && r.periodFrom && r.periodTo,
			)
			.map((r) => ({
				id: r.id,
				kind: r.kind,
				name: r.name ?? humanize(r.kind),
				from: r.periodFrom ?? "",
				to: r.periodTo ?? "",
				hotelId: r.hotelId ?? undefined,
				hotelName: hotelName(r.hotelId),
				at: r.createdAt,
			}))
			.sort((a, b) => b.at.localeCompare(a.at));
		return { schedules, runs };
	},

	/** Approvals across the business (the owner decides any hotel's), newest waiting first. */
	approvals: async (): Promise<ApprovalRow[]> => {
		const data = await seam();
		return businessWide(() => data.approvals.list());
	},

	/** Every hotel's company accounts. */
	organizations: async (): Promise<(OrganizationRow & AtHotel)[]> => {
		const data = await seam();
		return perHotel(() => data.organizations.list());
	},

	/** Credit limits managers asked for above the owner's threshold, from the approvals and the accounts. */
	creditRequests: (
		approvals: ApprovalRow[],
		organizations: (OrganizationRow & AtHotel)[],
	): CreditRequestRow[] =>
		approvals
			.filter((a) => a.kind === "CREDIT_LIMIT")
			.map((a) => {
				const org = organizations.find((o) => o.id === a.sourceRef);
				return {
					approvalId: a.id,
					status: a.status,
					organizationId: a.sourceRef,
					organizationName: org?.name ?? a.description.split(" · ")[0],
					hotelId: org?.hotelId ?? a.hotelId,
					hotelName: org?.hotelName ?? a.hotelName ?? "—",
					currentLimit: org?.creditLimit,
					requestedLimit: a.amount ?? org?.requestedCreditLimit ?? 0,
					outstanding: org?.outstanding,
					requesterName: a.requesterName,
					createdAt: a.createdAt,
					decidedBy: a.decidedBy,
					note: a.note,
				};
			})
			.sort(
				(a, b) =>
					(a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) ||
					b.createdAt.localeCompare(a.createdAt),
			),

	/** The latest ownership transfer request, if there is one. */
	transfer: async (): Promise<TransferRequestRow | null> => {
		if (!live("platform")) return null;
		const { data: res } = await businessWide(async () =>
			api("@get/platform/support/ownership-transfer", await withSession()),
		);
		const t = res?.data;
		return t
			? {
					id: t.id,
					subject: t.subject,
					status: t.status,
					createdAt: t.createdAt,
					resolvedAt: t.resolvedAt ?? undefined,
					resolution: t.resolution ?? undefined,
				}
			: null;
	},
};
