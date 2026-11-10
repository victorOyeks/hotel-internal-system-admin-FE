import type { Metadata } from "next";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { buildReceipt } from "@hospio/api/data/receipt-doc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Receipt · Hospio360" };

/**
 * A printable receipt, outside the dashboard shell so only the receipt prints: `?payment=<paymentId>`, `?sale=<orderId>` or
 * `?folio=<folioId or bookingId>`, with `&paper=80mm` for a thermal printer (A4 otherwise).
 */
export default async function ReceiptPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const sp = await searchParams;
	const one = (k: string) =>
		typeof sp[k] === "string" ? (sp[k] as string) : undefined;
	const doc = await buildReceipt({
		payment: one("payment"),
		sale: one("sale"),
		folio: one("folio"),
	});
	return (
		<ReceiptView
			doc={"error" in doc ? null : doc}
			error={"error" in doc ? doc.error : undefined}
			paper={one("paper") === "80mm" ? "80mm" : "a4"}
		/>
	);
}
