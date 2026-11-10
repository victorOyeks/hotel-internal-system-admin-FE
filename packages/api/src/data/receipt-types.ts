/** A printable receipt as the receipt page renders it (plain module: the server builds it, the client prints and emails it). */
export type ReceiptDoc = {
	kind: "payment" | "sale" | "folio";
	/** What Email receipt names: the payment, the sale (order) or the folio. */
	ref: { paymentId?: string; orderId?: string; folioId?: string };
	hotel: { name: string; address?: string; phone?: string; email?: string };
	footer?: string;
	title: string;
	/** The receipt numbers payment-service issued (one per approved payment), stable and unique per hotel. */
	numbers: string[];
	/** The sale number or the folio reference, when the receipt is for one. */
	reference?: string;
	issuedAt: string;
	guest?: string;
	guestEmail?: string;
	room?: string;
	servedBy?: string;
	lines: {
		label: string;
		qty?: number;
		unit?: number;
		amount: number;
		note?: string;
	}[];
	subtotal: number;
	discount: number;
	tax: number;
	total: number;
	payments: {
		number?: string;
		method: string;
		reference?: string;
		amount: number;
		at?: string;
		takenBy?: string;
	}[];
	paid: number;
	balance: number;
	/** Why there is nothing to print, when there isn't. */
	empty?: string;
};

export const METHOD_LABEL: Record<string, string> = {
	CASH: "Cash",
	CARD: "Card",
	TRANSFER: "Transfer",
	ROOM: "Charged to room",
	COMPLIMENTARY: "Complimentary",
};

export const methodLabel = (m: string) =>
	METHOD_LABEL[m] ?? m.charAt(0) + m.slice(1).toLowerCase().replace(/_/g, " ");

const ngn = (n: number) =>
	`NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso?: string) =>
	iso
		? new Date(iso).toLocaleString("en-GB", {
				timeZone: "Africa/Lagos",
				dateStyle: "medium",
				timeStyle: "short",
			})
		: "";

/** The receipt as plain text, the same content as the printed page, for Email receipt. */
export function receiptText(d: ReceiptDoc): string {
	const out: string[] = [d.hotel.name];
	if (d.hotel.address) out.push(d.hotel.address);
	if (d.hotel.phone) out.push(`Tel ${d.hotel.phone}`);
	out.push("");
	out.push(`${d.title}${d.numbers.length ? ` ${d.numbers.join(", ")}` : ""}`);
	if (d.reference) out.push(`Ref ${d.reference}`);
	out.push(when(d.issuedAt));
	if (d.guest)
		out.push(`Guest: ${d.guest}${d.room ? ` · Room ${d.room}` : ""}`);
	else if (d.room) out.push(`Room ${d.room}`);
	if (d.servedBy) out.push(`Served by ${d.servedBy}`);
	out.push("");
	for (const l of d.lines)
		out.push(`${l.qty ? `${l.qty} x ` : ""}${l.label}: ${ngn(l.amount)}`);
	out.push("");
	if (d.discount) out.push(`Discount: -${ngn(d.discount)}`);
	if (d.tax) out.push(`Tax: ${ngn(d.tax)}`);
	out.push(`Total: ${ngn(d.total)}`);
	for (const p of d.payments)
		out.push(
			`Paid ${methodLabel(p.method)}${p.reference ? ` (ref ${p.reference})` : ""}: ${ngn(p.amount)}${p.number ? ` · ${p.number}` : ""}${p.takenBy ? ` · taken by ${p.takenBy}` : ""}`,
		);
	if (d.balance > 0.004) out.push(`Balance due: ${ngn(d.balance)}`);
	if (d.footer) out.push("", d.footer);
	return out.join("\n");
}
