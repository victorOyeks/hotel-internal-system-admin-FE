"use client";

import type { PageResult } from "@hospio/api/data/paging";
import type {
	GuestConversationRow,
	MessageTemplateRow,
} from "@hospio/api/data/guest-message-types";
import { GuestInbox } from "../shared-staff/guest-inbox";

/** Front office · Messages: the hotel's guest conversations; send by email (WhatsApp and SMS coming soon), mark done. */
export function MessagesScreen({
	result,
	templates,
	hotelName,
}: {
	result: PageResult<GuestConversationRow>;
	templates: MessageTemplateRow[];
	hotelName: string;
}) {
	return (
		<GuestInbox
			result={result}
			templates={templates}
			hotelName={hotelName}
			canManage={false}
		/>
	);
}
