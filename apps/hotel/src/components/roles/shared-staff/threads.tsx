"use client";

import { SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { openThread, replyThread } from "@hospio/api/actions/owner";
import { useAction } from "@hospio/api/actions/use-action";
import type { PageResult } from "@hospio/api/data/paging";
import type {
	OwnerThreadMessage,
	OwnerThreadRow,
} from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtAgo, fmtWhen } from "@hospio/ui/shared/format";
import { useListParams } from "@hospio/ui/shared/list-params";
import { ServerPager } from "@hospio/ui/shared/server-pager";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import { btn, input } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Staff threads (messaging-service /threads): the list on the left, the open thread on the right with a reply box.
 * The owner's Messaging and everyone's Inbox use it. Opening a thread marks it read; a reply tells the other side.
 */
export function ThreadsView({
	result,
	openId,
	onOpen,
	emptyTitle = "No messages yet",
	emptyHint,
	toolbar,
	filtered: outsideFilter = false,
	onClearFilters,
}: {
	/** One page of threads from messaging-service; the search and the page live in the URL (`?q=&page=`). */
	result: PageResult<OwnerThreadRow>;
	openId: string | null;
	onOpen: (id: string | null) => void;
	emptyTitle?: string;
	emptyHint?: string;
	toolbar?: ReactNode;
	/** A filter outside this view (the owner's hotel) narrows the list. */
	filtered?: boolean;
	onClearFilters?: () => void;
}) {
	const router = useRouter();
	const params = useListParams();
	const threads = result.data.content;
	const [opened, setOpened] = useState<OwnerThreadRow | null>(null);
	const [messages, setMessages] = useState<OwnerThreadMessage[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [reply, setReply] = useState("");
	const [readIds, setReadIds] = useState<Set<string>>(new Set());
	const { run, pending } = useAction();
	const list = threads;
	// The open thread may be on another page (a notification links to it): the one openThread returned stands in.
	const active =
		threads.find((t) => t.id === openId) ??
		(opened?.id === openId ? opened : null);
	const filtered = params.filtered || outsideFilter;

	useEffect(() => {
		if (!openId) {
			setMessages(null);
			return;
		}
		let live = true;
		setLoading(true);
		openThread(openId)
			.then((r) => {
				if (!live) return;
				if (!r.ok) {
					toast.error(r.error);
					setMessages([]);
					return;
				}
				setMessages(r.data.messages);
				setOpened(r.data.thread);
				setReadIds((s) => new Set(s).add(openId));
			})
			.catch(() => live && toast.error("That conversation could not be opened"))
			.finally(() => live && setLoading(false));
		return () => {
			live = false;
		};
	}, [openId]);

	const send = () => {
		if (!active || !reply.trim()) return;
		const body = reply.trim();
		run(
			() => replyThread(active.id, body),
			"Sent",
			() => {
				setReply("");
				setMessages((m) => [
					...(m ?? []),
					{
						id: `local-${Date.now()}`,
						senderName: "You",
						body,
						at: new Date().toISOString(),
						mine: true,
					},
				]);
				router.refresh();
			},
		);
	};

	return (
		<div className="grid min-h-[560px] gap-4 xl:grid-cols-[360px_1fr]">
			<div className="flex min-h-[320px] flex-col overflow-hidden rounded-card border border-line bg-card">
				<div className="flex flex-col gap-2 border-b border-line p-3">
					<SearchBox
						value={params.search}
						onChange={params.setSearch}
						placeholder="Search people and messages"
						className="w-full"
					/>
					{toolbar}
				</div>
				{!result.ok ? (
					<EmptyState
						title="Messages didn't load"
						hint={result.error}
						className="m-4"
					>
						<button
							type="button"
							onClick={() => router.refresh()}
							className={cn(btn.secondary, "mt-2")}
						>
							Try again
						</button>
					</EmptyState>
				) : list.length === 0 && filtered ? (
					<EmptyState
						title="No matches"
						hint="Nothing matches these filters."
						className="m-4"
					>
						<button
							type="button"
							onClick={() => {
								params.clear();
								onClearFilters?.();
							}}
							className={cn(btn.secondary, "mt-2")}
						>
							Clear filters
						</button>
					</EmptyState>
				) : list.length === 0 ? (
					<EmptyState title={emptyTitle} hint={emptyHint} className="m-4" />
				) : (
					<ul className="max-h-[640px] flex-1 overflow-y-auto">
						{list.map((t) => {
							const unread = readIds.has(t.id) ? 0 : t.unread;
							return (
								<li key={t.id}>
									<button
										type="button"
										onClick={() => onOpen(t.id)}
										className={cn(
											"flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left hover:bg-subtle/60",
											active?.id === t.id && "bg-brand-soft/30",
										)}
									>
										<AvatarName
											name={t.withName}
											size="sm"
											className="shrink-0"
										/>
										<div className="-ml-[10px] min-w-0 flex-1">
											<div className="flex items-center justify-between gap-2">
												<span className="truncate text-[13px] font-semibold text-ink">
													{t.withName}
												</span>
												<span
													className="shrink-0 text-[10px] text-ink-3"
													suppressHydrationWarning
												>
													{fmtAgo(t.lastAt)}
												</span>
											</div>
											<p className="truncate text-[11px] text-ink-3">
												{t.audience === "MANAGERS"
													? "Managers"
													: t.mine
														? "You wrote"
														: "Wrote to you"}
												{t.hotelName ? ` · ${t.hotelName}` : ""} · {t.subject}
											</p>
											<p
												className={cn(
													"truncate text-xs",
													unread ? "font-semibold text-ink" : "text-ink-2",
												)}
											>
												{t.preview}
											</p>
										</div>
										{unread > 0 && (
											<span className="rounded-pill bg-brand px-[6px] py-[1px] text-[10px] font-bold text-white">
												{unread}
											</span>
										)}
									</button>
								</li>
							);
						})}
					</ul>
				)}
				<ServerPager
					page={result.ok ? result.data : { ...result.data, total: 0 }}
					onPage={params.goTo}
					className="mt-auto"
				/>
			</div>
			<div className="flex min-h-[420px] flex-col overflow-hidden rounded-card border border-line bg-card">
				{!active ? (
					<EmptyState
						title="Pick a conversation"
						hint="Messages between you and your team show here"
						className="m-4 flex-1"
					/>
				) : (
					<>
						<div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
							<AvatarName
								name={active.withName}
								secondary={`${active.subject}${active.hotelName ? ` · ${active.hotelName}` : ""}`}
							/>
							{active.audience === "MANAGERS" && (
								<StatusPill tone="info" dot={false}>
									Every manager of the hotel
								</StatusPill>
							)}
						</div>
						<div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-subtle/30 p-5">
							{loading && !messages ? (
								<p className="text-[13px] text-ink-3">Loading…</p>
							) : (
								(messages ?? []).map((m) => (
									<div
										key={m.id}
										className={cn(
											"max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-[10px] text-[13px]",
											m.mine
												? "self-end rounded-br-md bg-brand text-white"
												: "self-start rounded-bl-md bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
										)}
									>
										<p>{m.body}</p>
										<p
											className={cn(
												"mt-1 text-[10px]",
												m.mine ? "text-white/70" : "text-ink-3",
											)}
										>
											{m.mine ? "You" : m.senderName} · {fmtWhen(m.at)}
										</p>
									</div>
								))
							)}
						</div>
						<form
							className="flex gap-2 border-t border-line p-3"
							onSubmit={(e) => {
								e.preventDefault();
								send();
							}}
						>
							<input
								value={reply}
								onChange={(e) => setReply(e.target.value)}
								placeholder={`Reply to ${active.withName}…`}
								className={cn(input, "flex-1")}
								maxLength={4000}
							/>
							<Button
								type="submit"
								className={btn.primary}
								disabled={pending || !reply.trim()}
								aria-label="Send"
							>
								<SendIcon className="size-4" />
							</Button>
						</form>
					</>
				)}
			</div>
		</div>
	);
}
