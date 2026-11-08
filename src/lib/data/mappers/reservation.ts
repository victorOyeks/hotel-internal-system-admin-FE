import type { z } from "zod";
import type { Booking, Folio, Guest } from "@/lib/api/schema";
import type { BookingRow, FolioLine, FolioRow, GuestRow } from "@/lib/data/types";

/** reservation-service and folio-service responses → the rows the booking and folio screens render. */

export function toGuestRow(g: z.infer<typeof Guest>): GuestRow {
	return {
		id: g.id,
		fullName: g.fullName,
		phone: g.phone ?? "",
		email: g.email ?? undefined,
		idType: g.idType ?? undefined,
		idNumber: g.idNumber ?? undefined,
		nationality: g.nationality ?? undefined,
		preferences: g.preferences ?? undefined,
		notes: g.notes ?? undefined,
		stays: g.stays,
		blacklisted: g.blacklisted,
	};
}

/**
 * `paid` is what has landed on the stay's folio. Before check-in there is no folio yet, so a deposit
 * taken through payment-service shows once the folio opens; the plan still says what is due.
 */
export function toBookingRow(b: z.infer<typeof Booking>, guests: Map<string, GuestRow>, folios: Map<string, FolioRow>): BookingRow {
	const guest = guests.get(b.guestId);
	const folio = folios.get(b.id);
	return {
		id: b.id,
		reference: b.reference,
		guestId: b.guestId,
		guestName: b.guestName,
		guestPhone: guest?.phone ?? folio?.guestPhone ?? "",
		guestEmail: guest?.email ?? folio?.guestEmail ?? undefined,
		roomTypeId: b.roomTypeId,
		roomTypeName: b.roomTypeName ?? "",
		roomId: b.roomId ?? undefined,
		roomNumber: b.roomNumber ?? undefined,
		checkInDate: b.checkInDate,
		checkOutDate: b.checkOutDate,
		nights: b.nights,
		adults: b.adults,
		children: b.children,
		status: b.status,
		priceKind: b.priceKind,
		nightlyRate: Number(b.nightlyRate),
		totalAmount: Number(b.totalAmount),
		paid: folio ? Number(folio.payments) : 0,
		paymentPlan: b.paymentPlan,
		organizationId: b.organizationId ?? undefined,
		source: b.source ?? "Front desk",
		notes: b.notes ?? undefined,
		createdAt: b.createdAt ?? new Date().toISOString(),
		checkedInAt: b.checkedInAt ?? undefined,
		checkedOutAt: b.checkedOutAt ?? undefined,
		cancelReason: b.cancellationReason ?? undefined,
	};
}

export function toFolioRow(f: z.infer<typeof Folio>): FolioRow {
	const lines: FolioLine[] = (f.lines ?? []).map((l) => ({
		id: l.id,
		kind: l.kind,
		description: l.description ?? l.category ?? l.kind,
		category: l.category ?? (l.kind === "PAYMENT" ? "Payment" : "Other"),
		amount: Number(l.amount),
		tax: Number(l.taxAmount ?? 0),
		postedAt: l.postedAt ?? f.openedAt,
		postedBy: l.postedByName ?? l.postedBy ?? "System",
		voided: l.voided,
		voidReason: l.voidReason ?? undefined,
		source: l.sourceModule ?? "FOLIO",
	}));
	return {
		id: f.id,
		bookingId: f.bookingId ?? "",
		reference: `F-${f.id.slice(0, 8).toUpperCase()}`,
		guestId: f.guestId ?? "",
		guestName: f.guestName,
		guestPhone: f.guestPhone ?? undefined,
		guestEmail: f.guestEmail ?? undefined,
		roomNumber: f.roomNumber ?? "",
		status: f.status,
		charges: Number(f.totalCharges),
		tax: Number(f.totalTax),
		discounts: Number(f.totalDiscounts),
		payments: Number(f.totalPayments),
		balance: Number(f.balance),
		openedAt: f.openedAt,
		closedAt: f.closedAt ?? undefined,
		lines,
		notes: [],
	};
}
