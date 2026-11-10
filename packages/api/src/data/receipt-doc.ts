import "server-only";

import { readSale } from "@hospio/api/actions/fnb";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "./index";
import type { ReceiptDoc } from "./receipt-types";

/**
 * Builds a printable receipt (docs/manager-leftovers.md · Receipts) for one approved payment, a bar or kitchen sale, or a
 * stay's folio. Numbers come from payment-service's receipts (one per approved payment, unique per hotel); items, discounts
 * and totals from the sale (fnb-service) or the folio (folio-service); the hotel's name, address, phone and receipt footer
 * from tenant-service and Hotel setup.
 */
export async function buildReceipt(q: {
	payment?: string;
	sale?: string;
	folio?: string;
}): Promise<ReceiptDoc | { error: string }> {
	const [hotel, setup] = await Promise.all([
		getActiveHotel(),
		data.hotels.setup().catch(() => []),
	]);
	const footer = setup
		.find((s) => s.key === "basics")
		?.fields.find((f) => f.key === "receiptFooter")?.value;
	const head = {
		hotel: {
			name: hotel?.name ?? "Hotel",
			address:
				[hotel?.address, hotel?.city].filter(Boolean).join(", ") || undefined,
			phone: hotel?.phone ?? undefined,
			email: hotel?.email ?? undefined,
		},
		footer:
			typeof footer === "string" && footer.trim() ? footer.trim() : undefined,
	};

	if (q.payment) {
		const r = await data.receipts.forPayment(q.payment);
		if (!r.ok) return { error: r.error };
		const p = r.data;
		return {
			...head,
			kind: "payment",
			ref: { paymentId: p.paymentId },
			title: "Receipt",
			numbers: [p.number],
			issuedAt: p.paidAt ?? p.issuedAt ?? new Date().toISOString(),
			guest: p.guestName,
			guestEmail: p.guestEmail,
			servedBy: p.takenBy,
			lines: [{ label: p.description || "Payment", amount: p.amount }],
			subtotal: p.amount,
			discount: 0,
			tax: 0,
			total: p.amount,
			payments: [
				{
					number: p.number,
					method: p.method,
					reference: p.reference,
					amount: p.amount,
					at: p.paidAt,
					takenBy: p.takenBy,
				},
			],
			paid: p.amount,
			balance: 0,
		};
	}

	if (q.sale) {
		const [sale, receipts] = await Promise.all([
			readSale(q.sale),
			data.receipts.forRef({ orderId: q.sale }),
		]);
		if (!sale.ok) return { error: sale.error };
		if (!sale.data) return { error: "That sale was not found" };
		const d = sale.data;
		const byPayment = new Map(receipts.map((r) => [r.paymentId, r]));
		const lines = d.lines
			.filter((l) => l.status !== "CANCELLED")
			.map((l) => ({
				label: `${l.name}${l.choices.length ? ` (${l.choices.map((c) => c.name).join(", ")})` : ""}`,
				qty: l.quantity,
				unit: l.unitPrice,
				amount: l.amount + l.discount,
				note: l.discount
					? `less ${l.discount.toLocaleString("en-NG")} discount`
					: undefined,
			}));
		const guestEmail = receipts.find((r) => r.guestEmail)?.guestEmail;
		return {
			...head,
			kind: "sale",
			ref: { orderId: d.sale.id },
			title: `Receipt · ${d.sale.outletName}`,
			numbers: d.payments
				.map((p) => byPayment.get(p.paymentId)?.number)
				.filter((n): n is string => !!n),
			reference: d.sale.number,
			issuedAt: d.timeline.settledAt ?? d.timeline.closedAt ?? d.sale.createdAt,
			guest: d.sale.guestName,
			guestEmail,
			room: d.sale.roomNumber,
			servedBy: d.sale.openedByName,
			lines,
			subtotal: d.subtotal,
			discount: d.discount,
			tax: d.tax,
			total: d.total,
			payments: d.payments.map((p) => ({
				number: byPayment.get(p.paymentId)?.number,
				method: p.method,
				reference: p.reference,
				amount: p.amount,
				at: p.at,
				takenBy: p.takenByName,
			})),
			paid: d.paidAmount,
			balance: d.balance,
			empty:
				d.payments.length === 0
					? d.sale.status === "ON_ROOM"
						? "This sale went on the room bill: the folio at check-out is the guest's receipt"
						: "This sale has no payment yet"
					: undefined,
		};
	}

	if (q.folio) {
		const f = await data.folios.get(q.folio);
		if (!f) return { error: "That folio was not found" };
		const receipts = await data.receipts.forRef({ folioId: f.id });
		const live = f.lines.filter((l) => !l.voided);
		const charges = live.filter((l) => l.kind === "CHARGE");
		const pays = live.filter((l) => l.kind === "PAYMENT");
		const refunds = live.filter((l) => l.kind === "REFUND");
		const unused = [...receipts];
		const total = f.charges + f.tax - f.discounts;
		return {
			...head,
			kind: "folio",
			ref: { folioId: f.id },
			title: "Folio receipt",
			numbers: receipts.map((r) => r.number),
			reference: f.reference,
			issuedAt: f.closedAt ?? new Date().toISOString(),
			guest: f.guestName,
			guestEmail: f.guestEmail,
			room: f.roomNumber || undefined,
			servedBy: pays[pays.length - 1]?.postedBy,
			lines: charges.map((l) => ({
				label: l.description,
				amount: Math.abs(l.amount),
				note: new Date(l.postedAt).toLocaleDateString("en-GB", {
					timeZone: "Africa/Lagos",
					day: "numeric",
					month: "short",
				}),
			})),
			subtotal: f.charges,
			discount: f.discounts,
			tax: f.tax,
			total,
			payments: [
				...pays.map((l) => {
					// A payment line and its receipt share the amount; take the first unused receipt of that amount.
					const i = unused.findIndex(
						(r) => Math.abs(r.amount - Math.abs(l.amount)) < 0.005,
					);
					const r = i >= 0 ? unused.splice(i, 1)[0] : undefined;
					return {
						number: r?.number,
						method:
							r?.method ??
							l.description.match(/cash|card|transfer/i)?.[0]?.toUpperCase() ??
							"PAYMENT",
						reference: r?.reference,
						amount: Math.abs(l.amount),
						at: l.postedAt,
						takenBy: r?.takenBy ?? l.postedBy,
					};
				}),
				...refunds.map((l) => ({
					method: "REFUND",
					amount: -Math.abs(l.amount),
					at: l.postedAt,
					takenBy: l.postedBy,
				})),
			],
			paid: f.payments,
			balance: f.balance,
		};
	}
	return { error: "Say which receipt to print" };
}
