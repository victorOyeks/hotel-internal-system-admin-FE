"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { atHotel } from "@hospio/api/api/server";
import { getHotels } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

/**
 * Owner portal · Reports (docs/owner-portal.md): a report built from live data for a period and one hotel or every hotel.
 * The screen previews it and downloads it as CSV; schedules link back here with the period. Money is in naira, plain
 * numbers, so a spreadsheet adds it up.
 */

export type ReportKind =
	| "DAILY_SUMMARY"
	| "OCCUPANCY"
	| "REVENUE"
	| "PAYMENTS"
	| "EXPENSES"
	| "GUESTS";
export type BuiltReport = {
	columns: string[];
	rows: (string | number)[][];
	note?: string;
};

const word = (code: string) => {
	const s = code.toLowerCase().replace(/_/g, " ");
	return s ? s[0].toUpperCase() + s.slice(1) : s;
};

const day = (iso: string) =>
	new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const time = (iso: string) =>
	new Date(iso).toLocaleString("en-GB", {
		timeZone: "Africa/Lagos",
		dateStyle: "medium",
		timeStyle: "short",
	});

function daysBetween(from: string, to: string): string[] {
	const out: string[] = [];
	for (
		let t = Date.parse(`${from}T12:00:00Z`);
		t <= Date.parse(`${to}T12:00:00Z`);
		t += 86_400_000
	) {
		out.push(new Date(t).toISOString().slice(0, 10));
	}
	return out;
}

export async function buildReport(input: {
	kind: ReportKind;
	from: string;
	to: string;
	hotelId?: string;
}): Promise<ActionResult<BuiltReport>> {
	const { kind, from, to } = input;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
		return { ok: false, error: "Pick the dates of the period" };
	if (to < from)
		return { ok: false, error: "The end date is before the start date" };
	const span = daysBetween(from, to).length;
	if (span > 92) return { ok: false, error: "Pick at most three months" };
	if (kind === "OCCUPANCY" && span > 31)
		return {
			ok: false,
			error: "Occupancy is built a day at a time: pick at most 31 days",
		};
	const all = await getHotels();
	const hotels = input.hotelId
		? all.filter((h) => h.id === input.hotelId)
		: all;
	if (input.hotelId && hotels.length === 0)
		return { ok: false, error: "That hotel is not one of yours" };
	const each = <T>(load: () => Promise<T>) =>
		Promise.all(
			hotels.map((h) => atHotel(h.id, load).then((v) => ({ hotel: h, v }))),
		);

	switch (kind) {
		case "DAILY_SUMMARY": {
			const series = await each(() => data.finance.series(from, to));
			const rows = series
				.flatMap(({ hotel, v }) =>
					v.map((p) => [
						p.date,
						hotel.name,
						p.revenue,
						p.expenses,
						p.revenue - p.expenses,
					]),
				)
				.sort(
					(a, b) =>
						String(b[0]).localeCompare(String(a[0])) ||
						String(a[1]).localeCompare(String(b[1])),
				);
			return {
				ok: true,
				data: {
					columns: [
						"Day",
						"Hotel",
						"Revenue (NGN)",
						"Expenses (NGN)",
						"Net (NGN)",
					],
					rows,
				},
			};
		}
		case "OCCUPANCY": {
			const days = daysBetween(from, to);
			const summaries = await atHotel(null, () =>
				Promise.all(
					days.map((d) =>
						data.finance.ownerSummary(d, d).then((s) => ({ d, s })),
					),
				),
			);
			const wanted = new Set(hotels.map((h) => h.id));
			const rooms = new Map(all.map((h) => [h.id, h.roomCount]));
			const rows = summaries
				.flatMap(({ d, s }) =>
					s.hotels
						.filter((h) => wanted.has(h.hotelId))
						.map((h) => [
							d,
							h.name,
							rooms.get(h.hotelId) ?? 0,
							Math.round(h.occupancyPct ?? 0),
						]),
				)
				.sort(
					(a, b) =>
						String(b[0]).localeCompare(String(a[0])) ||
						String(a[1]).localeCompare(String(b[1])),
				);
			return {
				ok: true,
				data: {
					columns: ["Day", "Hotel", "Rooms", "Occupied %"],
					rows,
					note: "From each day's night audit; a day not closed yet counts the rooms occupied now.",
				},
			};
		}
		case "REVENUE": {
			const income = await each(() => data.finance.income(from, to));
			const rows = income.flatMap(({ hotel, v }) =>
				v.map((x) => [hotel.name, x.source, x.amount, Math.round(x.pct)]),
			);
			return {
				ok: true,
				data: {
					columns: [
						"Hotel",
						"Source",
						"Amount (NGN)",
						"Share of the hotel's revenue %",
					],
					rows,
				},
			};
		}
		case "PAYMENTS": {
			const payments = await each(() => data.payments.list());
			const rows = payments
				.flatMap(({ hotel, v }) =>
					v
						.filter((p) => {
							const d = day(p.createdAt);
							return d >= from && d <= to;
						})
						.map((p) => ({ p, hotel })),
				)
				.sort((a, b) => b.p.createdAt.localeCompare(a.p.createdAt))
				.map(({ p, hotel }) => [
					time(p.createdAt),
					hotel.name,
					p.guestName,
					p.description,
					word(p.method),
					p.takenBy,
					p.amount,
					word(p.status),
				]);
			return {
				ok: true,
				data: {
					columns: [
						"When",
						"Hotel",
						"Guest",
						"For",
						"Method",
						"Taken by",
						"Amount (NGN)",
						"Status",
					],
					rows,
				},
			};
		}
		case "EXPENSES": {
			const expenses = await each(() => data.finance.expenses({ from, to }));
			const rows = expenses
				.flatMap(({ hotel, v }) => v.map((e) => ({ e, hotel })))
				.sort(
					(a, b) =>
						b.e.date.localeCompare(a.e.date) ||
						(b.e.createdAt ?? "").localeCompare(a.e.createdAt ?? ""),
				)
				.map(({ e, hotel }) => [
					e.date,
					hotel.name,
					e.category,
					e.description,
					e.amount,
					word(e.paidFrom),
					e.requestedBy,
					word(e.status),
				]);
			return {
				ok: true,
				data: {
					columns: [
						"Date",
						"Hotel",
						"Category",
						"Description",
						"Amount (NGN)",
						"Paid from",
						"Asked by",
						"Status",
					],
					rows,
				},
			};
		}
		case "GUESTS": {
			const bookings = await each(() => data.bookings.list());
			const rows = bookings
				.flatMap(({ hotel, v }) =>
					v
						.filter(
							(b) =>
								b.status !== "CANCELLED" &&
								b.checkInDate <= to &&
								b.checkOutDate >= from,
						)
						.map((b) => ({ b, hotel })),
				)
				.sort(
					(a, b) =>
						b.b.checkInDate.localeCompare(a.b.checkInDate) ||
						(b.b.createdAt ?? "").localeCompare(a.b.createdAt ?? ""),
				)
				.map(({ b, hotel }) => [
					b.guestName,
					b.guestPhone,
					b.guestEmail ?? "",
					hotel.name,
					b.checkInDate,
					b.checkOutDate,
					b.nights,
					b.roomNumber ?? "",
					b.status === "CHECKED_IN"
						? "In house"
						: b.status === "CHECKED_OUT"
							? "Checked out"
							: b.status === "NO_SHOW"
								? "No-show"
								: "Booked",
				]);
			return {
				ok: true,
				data: {
					columns: [
						"Guest",
						"Phone",
						"Email",
						"Hotel",
						"Check-in",
						"Check-out",
						"Nights",
						"Room",
						"Status",
					],
					rows,
				},
			};
		}
		default:
			return { ok: false, error: "Unknown report" };
	}
}
