"use client";

import { parseAsString, useQueryState } from "nuqs";
import type { PageResult } from "@hospio/api/data/paging";
import type { OwnerThreadRow } from "@hospio/api/data/types";
import { plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ThreadsView } from "./threads";

/** Everywhere · Inbox: the owner's and managers' messages to me (and mine to my team), with replies. */
export function InboxScreen({
	threads,
	unread,
}: {
	threads: PageResult<OwnerThreadRow>;
	/** Unread messages on this page (the service counts per thread). */
	unread?: number;
}) {
	const [open, setOpen] = useQueryState("open", parseAsString);
	const unreadHere =
		unread ?? threads.data.content.reduce((s, t) => s + t.unread, 0);
	return (
		<>
			<PageHeader
				title="Inbox"
				subtitle={
					unreadHere > 0
						? `${plural(unreadHere, "unread message")} from your team`
						: "Messages from the owner and your managers"
				}
			/>
			<ThreadsView
				result={threads}
				openId={open}
				onOpen={(id) => void setOpen(id)}
				emptyTitle="No messages yet"
				emptyHint="When the owner or a manager writes to you, it shows here"
			/>
		</>
	);
}
