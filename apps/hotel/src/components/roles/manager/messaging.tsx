"use client";

import type { PageResult } from "@hospio/api/data/paging";
import type {
	GuestConversationRow,
	MessageTemplateRow,
	OnShiftRow,
} from "@hospio/api/data/guest-message-types";
import { type Assignable, GuestInbox } from "../shared-staff/guest-inbox";

/**
 * Manager · Messaging: the hotel's guest conversations (email sent for real; WhatsApp and SMS coming soon), reassign,
 * mark done, templates and a message to everyone on today's rota. Staff conversations are in Inbox.
 */
export function MessagingScreen({
	result,
	templates,
	people,
	onShift,
	hotelName,
}: {
	result: PageResult<GuestConversationRow>;
	templates: MessageTemplateRow[];
	people: Assignable[];
	onShift: OnShiftRow[];
	hotelName: string;
}) {
	return (
		<GuestInbox
			result={result}
			templates={templates}
			hotelName={hotelName}
			canManage
			people={people}
			onShift={onShift}
		/>
	);
}
