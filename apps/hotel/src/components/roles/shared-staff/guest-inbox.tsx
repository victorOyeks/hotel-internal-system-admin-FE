"use client";

import {
	CheckIcon,
	CopyIcon,
	FileTextIcon,
	InboxIcon,
	MegaphoneIcon,
	PlusIcon,
	RotateCcwIcon,
	SendIcon,
	Trash2Icon,
	UserRoundIcon,
	UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	assignConversation,
	type Conversation,
	deleteMessageTemplate,
	fillTemplate,
	logGuestReply,
	markConversationDone,
	messageEveryoneOnShift,
	openConversation,
	replyToGuest,
	saveMessageTemplate,
	startGuestMessage,
} from "@hospio/api/actions/guest-messages";
import { useAction } from "@hospio/api/actions/use-action";
import {
	CHANNEL_LABEL,
	type GuestChannel,
	type GuestConversationRow,
	type MessageTemplateRow,
	messageStatusLabel,
	type OnShiftRow,
	TEMPLATE_PLACEHOLDERS,
} from "@hospio/api/data/guest-message-types";
import type { PageResult } from "@hospio/api/data/paging";
import { Button } from "@hospio/ui/primitives/button";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { AvatarName, Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	ChoiceCards,
	SelectField,
	TextField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { fmtAgo, fmtDay, fmtWhen, humanize } from "@hospio/ui/shared/format";
import { useListParams } from "@hospio/ui/shared/list-params";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ServerPager } from "@hospio/ui/shared/server-pager";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox } from "@hospio/ui/shared/toolbar";
import {
	btn,
	input as inputCls,
	textarea as textareaCls,
} from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { channelOptions } from "./guest-message";

type Tab = "waiting" | "open" | "mine" | "done" | "all";
const TABS: Tab[] = ["waiting", "open", "mine", "done", "all"];
const TAB_LABEL: Record<Tab, string> = {
	waiting: "Unanswered",
	open: "Open",
	mine: "Mine",
	done: "Done",
	all: "All",
};

export type Assignable = { userId: string; name: string; hint?: string };

/**
 * Guest messages at the sidebar's hotel (messaging-service): conversations per booking with what went out and what the
 * guest said, the channel of each, who has it and whether it is done. Email is sent for real; WhatsApp and SMS are saved
 * and shown on screen to copy (coming soon). Managers also reassign, edit templates and message everyone on shift.
 * Manager · Messaging and Front office · Messages both use it; the list is paged on the server (`?tab=&q=&page=`).
 */
export function GuestInbox({
	result,
	templates,
	hotelName,
	canManage,
	canWrite = true,
	people = [],
	onShift = [],
}: {
	result: PageResult<GuestConversationRow>;
	templates: MessageTemplateRow[];
	hotelName: string;
	/** Manager or owner: reassign, templates, everyone on shift. */
	canManage: boolean;
	/** Front office with View only reads. */
	canWrite?: boolean;
	people?: Assignable[];
	onShift?: OnShiftRow[];
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["tab", "channel"] });
	const tab = (
		TABS.includes(list.params.tab as Tab) ? list.params.tab : "open"
	) as Tab | "templates";
	const [view, setView] = useQueryState("view", parseAsString);
	const showingTemplates = view === "templates" && canManage;
	const [openId, setOpenId] = useQueryState("open", parseAsString);
	const [conv, setConv] = useState<Conversation | null>(null);
	const [loading, setLoading] = useState(false);
	const [newOpen, setNewOpen] = useState(false);
	const [shiftOpen, setShiftOpen] = useState(false);
	const [editTemplate, setEditTemplate] = useState<
		MessageTemplateRow | "new" | null
	>(null);
	const rows = result.data.content;
	const counts = result.data.counts ?? {};
	const filtered = !!list.params.q || !!list.params.channel;

	useEffect(() => {
		if (!openId) {
			setConv(null);
			return;
		}
		let live = true;
		setLoading(true);
		openConversation(openId)
			.then((r) => {
				if (!live) return;
				if (r.ok) setConv(r.data);
				else {
					toast.error(r.error);
					setConv(null);
				}
			})
			.catch(() => live && toast.error("That conversation could not be opened"))
			.finally(() => live && setLoading(false));
		return () => {
			live = false;
		};
	}, [openId]);

	return (
		<>
			<PageHeader
				title="Messages"
				subtitle={`${hotelName} · guests by email (WhatsApp and SMS coming soon)`}
			>
				{canManage && (
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => setShiftOpen(true)}
					>
						<MegaphoneIcon className="size-4" /> Message everyone on shift
					</Button>
				)}
				{canWrite && (
					<Button className={btn.primary} onClick={() => setNewOpen(true)}>
						<PlusIcon className="size-4" /> New message
					</Button>
				)}
			</PageHeader>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<PillTabs
					value={showingTemplates ? "templates" : tab}
					onChange={(k) => {
						if (k === "templates") {
							void setView("templates");
							return;
						}
						void setView(null);
						list.set({ tab: k === "open" ? null : k });
					}}
					tabs={[
						...TABS.map((t) => ({
							key: t as Tab | "templates",
							label: TAB_LABEL[t],
							count: counts[t],
						})),
						...(canManage
							? [
									{
										key: "templates" as const,
										label: "Templates",
										count: templates.length,
									},
								]
							: []),
					]}
				/>
				{!showingTemplates && (
					<div className="flex items-center gap-2">
						<select
							aria-label="Channel"
							value={list.params.channel ?? ""}
							onChange={(e) => list.set({ channel: e.target.value || null })}
							className={cn(inputCls, "w-[150px]")}
						>
							<option value="">Every channel</option>
							<option value="EMAIL">Email</option>
							<option value="WHATSAPP">WhatsApp</option>
							<option value="SMS">SMS</option>
						</select>
						<SearchBox
							value={list.search}
							onChange={list.setSearch}
							placeholder="Guest, room, booking…"
						/>
					</div>
				)}
			</div>

			{showingTemplates ? (
				<TemplatesTable templates={templates} onOpen={setEditTemplate} />
			) : (
				<div className="grid min-h-[560px] gap-4 xl:grid-cols-[340px_1fr]">
					<div className="flex min-h-[320px] flex-col overflow-hidden rounded-card border border-line bg-card">
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
						) : rows.length === 0 && filtered ? (
							<EmptyState
								title="No matches"
								hint="Nothing matches this search."
								className="m-4"
							>
								<button
									type="button"
									onClick={() => list.set({ q: null, channel: null })}
									className={cn(btn.secondary, "mt-2")}
								>
									Clear search
								</button>
							</EmptyState>
						) : rows.length === 0 ? (
							<EmptyState
								title={
									tab === "waiting"
										? "No guest is waiting"
										: tab === "done"
											? "Nothing marked done yet"
											: "No conversations here"
								}
								hint={
									canWrite
										? "Message a guest with New message or from their booking"
										: undefined
								}
								className="m-4"
							/>
						) : (
							<ul className="max-h-[680px] flex-1 divide-y divide-line overflow-y-auto">
								{rows.map((c) => (
									<li key={c.id}>
										<button
											type="button"
											onClick={() => void setOpenId(c.id)}
											className={cn(
												"flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-subtle/60",
												openId === c.id && "bg-brand-soft/40",
											)}
										>
											<div className="flex items-center gap-2">
												<span className="flex-1 truncate text-[13px] font-semibold text-ink">
													{c.guestName}
												</span>
												<span
													className="shrink-0 text-[11px] text-ink-3"
													suppressHydrationWarning
												>
													{c.lastAt ? fmtAgo(c.lastAt) : ""}
												</span>
											</div>
											<p className="truncate text-[11px] text-ink-3">
												{[
													c.bookingRef,
													c.roomNumber ? `Room ${c.roomNumber}` : null,
													CHANNEL_LABEL[c.channel ?? ""],
												]
													.filter(Boolean)
													.join(" · ")}
											</p>
											<p
												className={cn(
													"truncate text-xs",
													c.waiting ? "font-semibold text-ink" : "text-ink-2",
												)}
											>
												{c.preview}
											</p>
											<div className="flex flex-wrap gap-1">
												{c.status === "DONE" ? (
													<StatusPill tone="success" className="w-fit">
														Done
													</StatusPill>
												) : c.waiting ? (
													<StatusPill tone="warning" className="w-fit">
														Not answered
													</StatusPill>
												) : (
													<StatusPill tone="grey" className="w-fit">
														Open
													</StatusPill>
												)}
												<span className="text-[11px] text-ink-3">
													{c.assignedToName
														? `· ${c.assignedToName}`
														: "· unassigned"}
												</span>
											</div>
										</button>
									</li>
								))}
							</ul>
						)}
						<ServerPager
							page={result.data}
							onPage={list.goTo}
							className="mt-auto"
						/>
					</div>
					<ConversationPane
						conv={conv}
						loading={loading}
						templates={templates}
						canManage={canManage}
						canWrite={canWrite}
						people={people}
						onChanged={(c) => {
							setConv(c);
							router.refresh();
						}}
					/>
				</div>
			)}

			<NewMessagePanel
				open={newOpen}
				hotelName={hotelName}
				onClose={() => setNewOpen(false)}
				onSent={(id) => {
					setNewOpen(false);
					void setOpenId(id);
					router.refresh();
				}}
			/>
			{canManage && (
				<ShiftPanel
					open={shiftOpen}
					onShift={onShift}
					onClose={() => setShiftOpen(false)}
				/>
			)}
			{canManage && (
				<TemplatePanel
					template={editTemplate}
					onClose={() => setEditTemplate(null)}
					onSaved={() => {
						setEditTemplate(null);
						router.refresh();
					}}
				/>
			)}
		</>
	);
}

function ConversationPane({
	conv,
	loading,
	templates,
	canManage,
	canWrite,
	people,
	onChanged,
}: {
	conv: Conversation | null;
	loading: boolean;
	templates: MessageTemplateRow[];
	canManage: boolean;
	canWrite: boolean;
	people: Assignable[];
	onChanged: (c: Conversation) => void;
}) {
	const { run, pending } = useAction();
	const [draft, setDraft] = useState("");
	const [subject, setSubject] = useState("");
	const [channel, setChannel] = useState<GuestChannel>("EMAIL");
	const [pickTemplate, setPickTemplate] = useState(false);
	const [assignOpen, setAssignOpen] = useState(false);
	const [assignee, setAssignee] = useState("");
	const [guestSaid, setGuestSaid] = useState<string | null>(null);
	const c = conv?.conversation;
	const cid = c?.id;

	useEffect(() => {
		if (!c) return;
		setDraft("");
		setSubject(c.subject ?? "");
		setChannel(
			(c.channel as GuestChannel) ?? (c.guestEmail ? "EMAIL" : "WHATSAPP"),
		);
	}, [cid]);

	if (!c) {
		return (
			<div className="flex min-h-[420px] items-center justify-center rounded-card border border-line bg-card">
				<EmptyState
					title={loading ? "Opening…" : "Pick a conversation"}
					hint="Guest messages and replies show here"
					className="m-4"
				/>
			</div>
		);
	}
	const connected = channel === "EMAIL";
	const to = connected ? c.guestEmail : c.guestPhone;

	const send = () =>
		run(
			() =>
				withDeliveries(
					replyToGuest(c.id, draft, channel, connected ? subject : undefined),
					`Message to ${c.guestName}`,
				),
			(d) => d.note,
			(d) => {
				setDraft("");
				onChanged({
					conversation: d.conversation,
					messages: [...(conv?.messages ?? []), d.message],
				});
			},
		);

	return (
		<div className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-card border border-line bg-card">
			<header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-base font-bold text-ink">
						{c.guestName}
					</h2>
					<p className="truncate text-xs text-ink-3">
						{[
							c.bookingRef ? `Booking ${c.bookingRef}` : null,
							c.roomNumber ? `Room ${c.roomNumber}` : c.roomType,
							c.checkIn && c.checkOut
								? `${fmtDay(c.checkIn)} → ${fmtDay(c.checkOut)}`
								: null,
							c.assignedToName ? `with ${c.assignedToName}` : "unassigned",
						]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
				{c.status === "DONE" ? (
					<StatusPill tone="success">Done</StatusPill>
				) : c.waiting ? (
					<StatusPill tone="warning">Not answered</StatusPill>
				) : null}
				{canManage && (
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => setAssignOpen(true)}
					>
						<UserRoundIcon className="size-4" /> Reassign
					</Button>
				)}
				{canWrite &&
					(c.status === "DONE" ? (
						<Button
							variant="outline"
							className={btn.secondary}
							disabled={pending}
							onClick={() =>
								run(
									() => markConversationDone(c.id, false),
									"Reopened",
									(v) =>
										onChanged({
											conversation: v,
											messages: conv?.messages ?? [],
										}),
								)
							}
						>
							<RotateCcwIcon className="size-4" /> Reopen
						</Button>
					) : (
						<Button
							variant="outline"
							className={btn.secondary}
							disabled={pending}
							onClick={() =>
								run(
									() => markConversationDone(c.id, true),
									"Marked done",
									(v) =>
										onChanged({
											conversation: v,
											messages: conv?.messages ?? [],
										}),
								)
							}
						>
							<CheckIcon className="size-4" /> Mark done
						</Button>
					))}
			</header>
			<div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-subtle/30 px-5 py-4">
				{(conv?.messages ?? []).map((m) => (
					<div
						key={m.id}
						className={cn(
							"flex max-w-[78%] flex-col gap-1",
							m.direction === "OUT" ? "items-end self-end" : "self-start",
						)}
					>
						<p
							className={cn(
								"whitespace-pre-wrap rounded-2xl px-4 py-[10px] text-[13px]",
								m.direction === "OUT"
									? "rounded-br-md bg-brand text-white"
									: "rounded-bl-md border border-line bg-card text-ink",
							)}
						>
							{m.body}
						</p>
						<span className="flex flex-wrap items-center gap-1 text-[11px] text-ink-3">
							{m.by} · {CHANNEL_LABEL[m.channel ?? ""] ?? ""} ·{" "}
							<span suppressHydrationWarning>{m.at ? fmtWhen(m.at) : ""}</span>{" "}
							·{" "}
							<span
								className={cn(
									m.status === "FAILED" && "font-semibold text-danger",
									m.status === "NOT_CONNECTED" && "text-warning",
								)}
							>
								{messageStatusLabel(m)}
							</span>
							{m.status === "NOT_CONNECTED" && <CopyButton text={m.body} />}
						</span>
						{m.status === "FAILED" && m.error && (
							<span className="text-[11px] text-danger">{m.error}</span>
						)}
					</div>
				))}
				{c.waiting && (
					<Note tone="warning">The guest is waiting for an answer.</Note>
				)}
			</div>
			{canWrite && (
				<footer className="flex flex-col gap-2 border-t border-line px-5 py-4">
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<span className="text-ink-3">Send by</span>
						{channelOptions(c.guestEmail, c.guestPhone).map((o) => (
							<button
								key={o.value}
								type="button"
								disabled={o.disabled}
								onClick={() => setChannel(o.value)}
								title={o.hint}
								className={cn(
									"rounded-pill border px-2 py-[3px] font-medium",
									channel === o.value
										? "border-brand bg-brand-soft text-brand"
										: "border-line text-ink-2 hover:bg-subtle",
									o.disabled && "cursor-not-allowed opacity-50",
								)}
							>
								{o.label}
							</button>
						))}
						<span className="text-ink-3">{to ? `to ${to}` : ""}</span>
					</div>
					{connected && (
						<input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Subject"
							aria-label="Subject"
							maxLength={200}
							className={inputCls}
						/>
					)}
					<textarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						rows={3}
						maxLength={4000}
						placeholder={`Reply to ${c.guestName.split(" ")[0]}…`}
						className={cn(textareaCls, "min-h-[72px]")}
						onKeyDown={(e) => {
							if (
								e.key === "Enter" &&
								(e.metaKey || e.ctrlKey) &&
								draft.trim() &&
								to
							)
								send();
						}}
					/>
					{!connected && (
						<p className="text-[11px] text-warning">
							{CHANNEL_LABEL[channel]} is coming soon: the message is saved here
							and shown on screen so you can copy it to the guest.
						</p>
					)}
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={() => setPickTemplate(true)}
							className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
						>
							<FileTextIcon className="size-[14px]" /> Use a template
						</button>
						<button
							type="button"
							onClick={() => setGuestSaid("")}
							className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
						>
							<InboxIcon className="size-[14px]" /> Add what the guest said
						</button>
						<span className="flex-1" />
						<Button
							className={btn.primary}
							disabled={pending || !draft.trim() || !to}
							onClick={send}
						>
							<SendIcon className="size-4" />{" "}
							{connected ? "Send email" : "Save and show to copy"}
						</Button>
					</div>
				</footer>
			)}

			<TemplatePicker
				open={pickTemplate}
				templates={templates}
				onClose={() => setPickTemplate(false)}
				onPick={async (t) => {
					const r = await fillTemplate(t.id, { conversationId: c.id });
					if (!r.ok) {
						toast.error(r.error);
						return;
					}
					setDraft(r.data.body);
					if (r.data.subject) setSubject(r.data.subject);
					setPickTemplate(false);
					if (r.data.missing.length)
						toast.info(
							`Fill in ${r.data.missing.map((m) => `{{${m}}}`).join(", ")}: this conversation has no ${r.data.missing.map((m) => m.replace(/_/g, " ")).join(", ")}`,
						);
				}}
			/>

			<Modal
				open={assignOpen}
				onOpenChange={setAssignOpen}
				title="Reassign conversation"
				subtitle="They get a notification and it shows under Mine for them"
				size="confirm"
				icon={UserRoundIcon}
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setAssignOpen(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || !assignee}
							onClick={() =>
								run(
									() => assignConversation(c.id, assignee),
									(v) => `Given to ${v.assignedToName ?? "them"}`,
									(v) => {
										setAssignOpen(false);
										setAssignee("");
										onChanged({
											conversation: v,
											messages: conv?.messages ?? [],
										});
									},
								)
							}
						>
							Reassign
						</Button>
					</>
				}
			>
				<SelectField
					label="Give it to"
					value={assignee}
					onChange={setAssignee}
					options={people
						.filter((p) => p.userId !== c.assignedToId)
						.map((p) => ({ value: p.userId, label: p.name, hint: p.hint }))}
					placeholder="Front office or a manager"
				/>
			</Modal>

			<Modal
				open={guestSaid !== null}
				onOpenChange={(o) => !o && setGuestSaid(null)}
				title="What the guest said"
				subtitle="A reply by phone, WhatsApp or at the desk, so the conversation is complete"
				size="form"
				icon={InboxIcon}
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setGuestSaid(null)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || !guestSaid?.trim()}
							onClick={() =>
								run(
									() => logGuestReply(c.id, guestSaid ?? ""),
									"Guest's reply added",
									(d) => {
										setGuestSaid(null);
										onChanged(d);
									},
								)
							}
						>
							Add
						</Button>
					</>
				}
			>
				<TextareaField
					label="The guest said"
					value={guestSaid ?? ""}
					onChange={setGuestSaid}
					rows={4}
				/>
			</Modal>
		</div>
	);
}

function CopyButton({ text }: { text: string }) {
	const [done, setDone] = useState(false);
	return (
		<button
			type="button"
			className="inline-flex items-center gap-[2px] font-semibold text-brand hover:underline"
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(text);
					setDone(true);
					setTimeout(() => setDone(false), 1500);
				} catch {
					toast.error("Copy didn't work here; select the text instead");
				}
			}}
		>
			{done ? (
				<CheckIcon className="size-3" />
			) : (
				<CopyIcon className="size-3" />
			)}{" "}
			{done ? "Copied" : "Copy"}
		</button>
	);
}

function TemplatePicker({
	open,
	templates,
	onClose,
	onPick,
}: {
	open: boolean;
	templates: MessageTemplateRow[];
	onClose: () => void;
	onPick: (t: MessageTemplateRow) => void;
}) {
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Use a template"
			subtitle="Placeholders are filled from the booking"
			size="form"
			icon={FileTextIcon}
		>
			{templates.length === 0 ? (
				<EmptyState
					title="No templates yet"
					hint="A manager adds them under Messages → Templates"
				/>
			) : (
				<ul className="flex flex-col divide-y divide-line">
					{templates.map((t) => (
						<li key={t.id}>
							<button
								type="button"
								className="flex w-full flex-col gap-1 px-1 py-3 text-left hover:bg-subtle/60"
								onClick={() => onPick(t)}
							>
								<span className="text-[13px] font-semibold text-ink">
									{t.name}
								</span>
								<span className="line-clamp-2 text-xs text-ink-2">
									{t.body}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</Modal>
	);
}

function TemplatesTable({
	templates,
	onOpen,
}: {
	templates: MessageTemplateRow[];
	onOpen: (t: MessageTemplateRow | "new") => void;
}) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex justify-end">
				<Button className={btn.primary} onClick={() => onOpen("new")}>
					<PlusIcon className="size-4" /> New template
				</Button>
			</div>
			{templates.length === 0 ? (
				<EmptyState
					title="No templates yet"
					hint="Save the messages you send often, with placeholders for the guest, room and dates"
					className="rounded-card border border-line bg-card p-6"
				/>
			) : (
				<ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
					{templates.map((t) => (
						<li key={t.id}>
							<button
								type="button"
								onClick={() => onOpen(t)}
								className="flex w-full items-start gap-4 px-5 py-3 text-left hover:bg-subtle/60"
							>
								<div className="min-w-0 flex-1">
									<p className="text-[13px] font-semibold text-ink">{t.name}</p>
									{t.subject && (
										<p className="truncate text-xs text-ink-3">
											Subject: {t.subject}
										</p>
									)}
									<p className="line-clamp-2 text-xs text-ink-2">{t.body}</p>
								</div>
								<span className="shrink-0 text-[13px] font-semibold text-brand">
									Edit →
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

const SAMPLE: Record<string, string> = {
	guest: "Ifeoma Okafor",
	first_name: "Ifeoma",
	room: "A325",
	room_type: "Deluxe",
	check_in: "Sat 14 Nov 2026",
	check_out: "Mon 16 Nov 2026",
	nights: "2",
	reference: "HB6980XK",
};

function TemplatePanel({
	template,
	onClose,
	onSaved,
}: {
	template: MessageTemplateRow | "new" | null;
	onClose: () => void;
	onSaved: () => void;
}) {
	const { run, pending } = useAction();
	const existing = template && template !== "new" ? template : null;
	const [name, setName] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);
	const key = template === "new" ? "new" : (existing?.id ?? "");

	useEffect(() => {
		setName(existing?.name ?? "");
		setSubject(existing?.subject ?? "");
		setBody(existing?.body ?? "");
		setConfirmDelete(false);
	}, [key]);

	const preview = body.replace(
		/\{\{\s*([a-z_]+)\s*\}\}/gi,
		(m, k: string) =>
			SAMPLE[k.toLowerCase()] ??
			(k.toLowerCase() === "hotel" ? "your hotel" : m),
	);
	return (
		<SidePanel
			open={!!template}
			onOpenChange={(o) => !o && onClose()}
			title={existing ? existing.name : "New template"}
			subtitle="Used when writing to a guest; placeholders are filled from the booking"
			icon={FileTextIcon}
			footerInfo={`Placeholders: ${TEMPLATE_PLACEHOLDERS.map((p) => `{{${p}}}`).join(" ")}`}
			footer={
				<>
					{existing &&
						(confirmDelete ? (
							<Button
								variant="outline"
								className={cn(btn.secondary, "text-danger")}
								disabled={pending}
								onClick={() =>
									run(
										() => deleteMessageTemplate(existing.id),
										"Template deleted",
										onSaved,
									)
								}
							>
								<Trash2Icon className="size-4" /> Yes, delete
							</Button>
						) : (
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => setConfirmDelete(true)}
							>
								<Trash2Icon className="size-4" /> Delete
							</Button>
						))}
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !name.trim() || !body.trim()}
						onClick={() =>
							run(
								() =>
									saveMessageTemplate({
										id: existing?.id,
										name,
										subject,
										body,
									}),
								"Template saved",
								onSaved,
							)
						}
					>
						Save template
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Name"
					value={name}
					onChange={setName}
					placeholder="e.g. Arrival day"
				/>
				<TextField
					label="Subject"
					value={subject}
					onChange={setSubject}
					hint="Used on email"
					placeholder="e.g. See you today at {{hotel}}"
				/>
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={7}
					placeholder="Hello {{first_name}}, we're expecting you on {{check_in}}…"
				/>
				<PanelSection title="Preview">
					<p className="whitespace-pre-wrap rounded-2xl border border-line bg-subtle/60 px-4 py-3 text-[13px] text-ink">
						{preview || "—"}
					</p>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

function NewMessagePanel({
	open,
	hotelName,
	onClose,
	onSent,
}: {
	open: boolean;
	hotelName: string;
	onClose: () => void;
	onSent: (id: string) => void;
}) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [channel, setChannel] = useState<GuestChannel>("EMAIL");
	const [subject, setSubject] = useState(`Your stay at ${hotelName}`);
	const [body, setBody] = useState("");
	const connected = channel === "EMAIL";
	const contact = connected ? email.trim() : phone.trim();
	const reset = () => {
		setName("");
		setEmail("");
		setPhone("");
		setBody("");
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="New message"
			subtitle="To a guest without a booking here · for a booked guest use Message guest on the booking"
			icon={SendIcon}
			footerInfo={
				connected
					? "The email goes out from the hotel's name; replies come to the front desk email"
					: "WhatsApp and SMS are coming soon: the text is shown on screen to copy"
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !name.trim() || !contact || !body.trim()}
						onClick={() =>
							run(
								() =>
									withDeliveries(
										startGuestMessage({
											guestName: name,
											guestEmail: email,
											guestPhone: phone,
											channel,
											subject: connected ? subject : undefined,
											body,
										}),
										`Message to ${name}`,
									),
								(d) => d.note,
								(d) => {
									reset();
									onSent(d.conversation.id);
								},
							)
						}
					>
						<SendIcon className="size-4" />{" "}
						{connected ? "Send email" : "Save and show to copy"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField label="Guest's name" value={name} onChange={setName} />
				<TextField
					label="Email"
					value={email}
					onChange={setEmail}
					placeholder="name@example.com"
				/>
				<TextField
					label="Phone"
					value={phone}
					onChange={setPhone}
					placeholder="0803 000 0000"
					hint="For WhatsApp or SMS (coming soon)"
				/>
				<ChoiceCards
					label="Send by"
					value={channel}
					onChange={setChannel}
					columns={3}
					options={channelOptions(email.trim() || null, phone.trim() || null)}
				/>
				{connected && (
					<TextField label="Subject" value={subject} onChange={setSubject} />
				)}
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={6}
				/>
			</div>
		</SidePanel>
	);
}

function ShiftPanel({
	open,
	onShift,
	onClose,
}: {
	open: boolean;
	onShift: OnShiftRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [body, setBody] = useState("");
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Message everyone on shift"
			subtitle={`${onShift.length} ${onShift.length === 1 ? "person is" : "people are"} on today's rota`}
			icon={UsersIcon}
			footerInfo="They get it as a notification in the app"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !body.trim() || onShift.length === 0}
						onClick={() =>
							run(
								() => messageEveryoneOnShift(body),
								(d) =>
									`Sent to ${d.count} ${d.count === 1 ? "person" : "people"} on shift`,
								() => {
									setBody("");
									onClose();
								},
							)
						}
					>
						<SendIcon className="size-4" /> Send to everyone
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={4}
					placeholder="e.g. Fire drill at 3pm · meet at the car park"
				/>
				<PanelSection title="Goes to">
					{onShift.length === 0 ? (
						<p className="text-xs text-ink-3">
							Nobody is on today's rota yet. Add shifts under Staff → Rota.
						</p>
					) : (
						<ul className="flex flex-col gap-2">
							{onShift.map((s) => (
								<li key={s.userId}>
									<AvatarName
										name={s.name}
										secondary={`${s.role ? humanize(s.role) : "Staff"}${s.startsAt ? ` · ${s.startsAt}–${s.endsAt ?? ""}` : ""}${s.clockedIn ? " · clocked in" : ""}`}
										size="sm"
									/>
								</li>
							))}
						</ul>
					)}
				</PanelSection>
			</div>
		</SidePanel>
	);
}
