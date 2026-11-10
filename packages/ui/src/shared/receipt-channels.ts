/**
 * The receipt and folio channels a screen offers: email is sent for real (docs/email.md in hospio-backend); WhatsApp and SMS
 * are coming soon, so they are shown greyed out and never chosen. Plain module so any screen can import it.
 */
export type ReceiptChoice = "EMAIL" | "NONE" | "WHATSAPP" | "SMS";

export function receiptOptions(email?: string | null, none = "Print") {
	return [
		{
			value: "EMAIL" as ReceiptChoice,
			label: "Email",
			hint: email || "No email for this guest",
			disabled: !email,
		},
		{
			value: "NONE" as ReceiptChoice,
			label: none,
			hint: "From the receipt page",
		},
		{
			value: "WHATSAPP" as ReceiptChoice,
			label: "WhatsApp",
			hint: "Coming soon",
			disabled: true,
		},
	];
}
