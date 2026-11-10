/**
 * Guest conversations, message templates and today's rota as the screens read them (messaging-service; hospio-backend
 * docs/email.md). A plain module: safe to import from server components and "use client" files alike.
 */

export type GuestChannel = "EMAIL" | "WHATSAPP" | "SMS";

export type GuestConversationRow = {
	id: string;
	guestName: string;
	guestEmail?: string;
	guestPhone?: string;
	contact?: string;
	channel?: string;
	subject?: string;
	bookingId?: string;
	bookingRef?: string;
	roomNumber?: string;
	roomType?: string;
	checkIn?: string;
	checkOut?: string;
	assignedToId?: string;
	assignedToName?: string;
	status: "OPEN" | "DONE";
	waiting: boolean;
	lastAt?: string;
	preview?: string;
	doneAt?: string;
	doneByName?: string;
};

export type GuestMessageRow = {
	id: string;
	direction: "IN" | "OUT";
	body: string;
	by: string;
	at?: string;
	channel?: string;
	/** QUEUED, SENT, FAILED, NOT_CONNECTED, DISABLED, LOGGED (a reply staff typed in). */
	status?: string;
	error?: string;
};

export type MessageTemplateRow = {
	id: string;
	name: string;
	subject?: string;
	body: string;
	channel?: string;
	updatedAt?: string;
};

export type OnShiftRow = {
	userId: string;
	name: string;
	role?: string;
	startsAt?: string;
	endsAt?: string;
	clockedIn: boolean;
};

/** The placeholders a template may use; the server fills them from the booking. */
export const TEMPLATE_PLACEHOLDERS = [
	"guest",
	"first_name",
	"hotel",
	"room",
	"room_type",
	"check_in",
	"check_out",
	"nights",
	"reference",
] as const;

export const CHANNEL_LABEL: Record<string, string> = {
	EMAIL: "Email",
	WHATSAPP: "WhatsApp",
	SMS: "SMS",
	IN_APP: "In app",
};

/** WhatsApp and SMS are not connected yet: messages on them are saved and shown, not sent. */
export const CONNECTED_CHANNELS: readonly string[] = ["EMAIL"];

/** What a message's status means, in words. */
export function messageStatusLabel(
	m: Pick<GuestMessageRow, "status" | "channel" | "direction">,
): string {
	if (m.direction === "IN")
		return m.status === "LOGGED" ? "Added by staff" : "From the guest";
	switch (m.status) {
		case "SENT":
			return "Email sent";
		case "QUEUED":
			return "Sending…";
		case "FAILED":
			return "Not delivered";
		case "DISABLED":
			return "Not sent · email is off";
		case "NOT_CONNECTED":
			return `Not sent · ${CHANNEL_LABEL[m.channel ?? ""] ?? "this channel"} coming soon`;
		default:
			return m.status ? m.status.toLowerCase() : "";
	}
}
