"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	CheckIcon,
	ClipboardCheckIcon,
	MessageCircleQuestionIcon,
	SendIcon,
	XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName, DetailList, Note } from "@hospio/ui/shared/detail-list";
import { TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, humanize, naira } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import {
	decideApproval,
	escalateApproval,
} from "@hospio/api/actions/approvals";
import { answerExpense } from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type { PageResult } from "@hospio/api/data/paging";
import type { ApprovalRow } from "@hospio/api/data/types";
import { useListParams } from "@hospio/ui/shared/list-params";

const statusTone = (
	s: ApprovalRow["status"],
): "success" | "danger" | "info" | "warning" =>
	s === "APPROVED"
		? "success"
		: s === "DECLINED"
			? "danger"
			: s === "QUESTION"
				? "info"
				: "warning";
const statusLabel = (s: ApprovalRow["status"]) =>
	s === "PENDING"
		? "Waiting"
		: s === "QUESTION"
			? "Question asked"
			: humanize(s);

const whatHappens = (a: ApprovalRow): string[] => {
	switch (a.kind) {
		case "EXPENSE":
			return [
				`${naira(a.amount ?? 0)} is paid out and recorded under this month's expenses`,
				"The requester is told and can collect the money from the till or by transfer",
			];
		case "REFUND":
			return [
				`${naira(a.amount ?? 0)} goes back to the guest by the way they paid`,
				"The folio balance is adjusted and the payment is marked refunded",
			];
		case "PURCHASE_ORDER":
			return [
				"The order is sent to the supplier",
				"Stock levels update when the delivery is received",
			];
		case "LEAVE":
			return [
				"The rota shows the days as leave",
				"Shift cover is suggested from the team",
			];
		case "ROOM_PRICE":
			return [
				`The room type's base price becomes ${naira(a.amount ?? 0)} for new bookings`,
				"Existing bookings keep their agreed price; declined keeps the old price",
			];
		case "RATE_CHANGE":
			return [
				"New bookings use the new price from the start date",
				"Existing bookings keep their agreed price",
			];
		default:
			return ["The request is marked approved and the requester is told"];
	}
};

/** Manager · Approvals: everything waiting on the manager, with review, decline, ask and send-to-owner. */
export function ApprovalsScreen({
	result,
	opened,
	limit,
	ownerName,
	meId,
}: {
	/** One page of the tab, with every tab's count and the money waiting (platform-service). */
	result: PageResult<ApprovalRow>;
	/** The approval named by `?open=` when it is not on this page (a link from the dashboard or a notice). */
	opened?: ApprovalRow | null;
	limit: number;
	ownerName: string;
	/** The signed-in user: a question on their own expense gets an answer box. */
	meId?: string;
}) {
	const router = useRouter();
	const [answering, setAnswering] = useState(false);
	const [answer, setAnswer] = useState("");
	const list = useListParams({ extra: ["tab", "kind"] });
	const tab = (
		["waiting", "owner", "decided"].includes(list.params.tab ?? "")
			? list.params.tab
			: "waiting"
	) as "waiting" | "decided" | "owner";
	const setTab = (t: "waiting" | "decided" | "owner") =>
		list.set({ tab: t === "waiting" ? null : t });
	const [open, setOpen] = useQueryState("open");
	const rows = result.data.content;
	const counts = result.data.counts ?? {};
	const [decline, setDecline] = useState(false);
	const [ask, setAsk] = useState(false);
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();

	// Tabs, counts and money come from the service over every approval, not this page.
	const current =
		rows.find((r) => r.id === open) ?? (opened?.id === open ? opened : null);
	const close = () => {
		void setOpen(null);
		setDecline(false);
		setAsk(false);
		setReason("");
		setAnswering(false);
		setAnswer("");
	};
	/** The owner (or a manager) asked the signed-in user something about their own expense. */
	const canAnswer =
		!!current &&
		current.status === "QUESTION" &&
		current.kind === "EXPENSE" &&
		!!current.sourceRef &&
		!!meId &&
		current.requesterId === meId;
	const withOwner = current?.approverLevel === "OWNER";
	const overLimit = current
		? withOwner ||
			(current.kind === "EXPENSE" && limit > 0 && (current.amount ?? 0) > limit)
		: false;
	const decide = (
		decision: "APPROVED" | "DECLINED" | "QUESTION",
		message: string,
		note?: string,
	) =>
		current &&
		run(
			() =>
				withDeliveries(
					decideApproval(current.id, decision, note),
					`Approval for ${current.requesterName}`,
				),
			message,
			close,
		);
	const totalWaiting = result.data.totals?.waiting ?? 0;

	const columns: ColumnDef<ApprovalRow, unknown>[] = [
		{
			accessorKey: "kind",
			header: "Request",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.description}
					secondary={`${humanize(row.original.kind)} · ${humanize(row.original.sourceModule)}`}
				/>
			),
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<span className="font-semibold">
					{row.original.amount ? naira(row.original.amount) : "—"}
				</span>
			),
		},
		{
			accessorKey: "requesterName",
			header: "Asked by",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.requesterName}
					secondary={humanize(row.original.requesterRole)}
				/>
			),
		},
		{
			accessorKey: "approverLevel",
			header: "Needs",
			cell: ({ row }) => (
				<StatusPill
					dot={false}
					tone={row.original.approverLevel === "OWNER" ? "brand" : "grey"}
				>
					{row.original.approverLevel === "OWNER" ? "Owner" : "Manager"}
				</StatusPill>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Asked",
			cell: ({ row }) => (
				<span className="whitespace-nowrap text-ink-2">
					{fmtWhen(row.original.createdAt)}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone(row.original.status)}>
					{statusLabel(row.original.status)}
				</StatusPill>
			),
		},
		{
			id: "go",
			header: "",
			cell: ({ row }) => (
				<span className="text-[13px] font-semibold text-brand">
					{row.original.status === "QUESTION" &&
					!!meId &&
					row.original.requesterId === meId
						? "Answer"
						: row.original.status === "PENDING" &&
								row.original.approverLevel === "MANAGER"
							? "Review"
							: "Open"}{" "}
					→
				</span>
			),
			size: 80,
		},
	];

	return (
		<>
			<PageHeader
				title="Approvals"
				subtitle="Spend, refunds, orders, leave and price changes that need a decision"
			>
				<ManagerMark />
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Waiting on you"
					value={counts.waiting ?? 0}
					icon={ClipboardCheckIcon}
					hint={`${naira(totalWaiting)} in total`}
				/>
				<KpiCard
					label="With the owner"
					value={counts.owner ?? 0}
					icon={SendIcon}
					hint={`Over ${naira(limit)} or owner-only`}
				/>
				<KpiCard
					label="Decided · 90 days"
					value={counts.decided ?? 0}
					icon={CheckIcon}
				/>
				<KpiCard
					label="Questions open"
					value={counts.questions ?? 0}
					icon={MessageCircleQuestionIcon}
				/>
			</div>

			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "waiting", label: "Waiting", count: counts.waiting ?? 0 },
							{
								key: "owner",
								label: "With the owner",
								count: counts.owner ?? 0,
							},
							{ key: "decided", label: "Decided", count: counts.decided ?? 0 },
						]}
						value={tab}
						onChange={setTab}
					/>
				}
				right={
					<SearchBox
						value={list.search}
						onChange={list.setSearch}
						placeholder="Search requests…"
					/>
				}
			/>

			<DataTable
				columns={columns}
				data={rows}
				server={{
					page: result.data,
					onPage: list.goTo,
					sort: list.sort,
					onSort: list.setSort,
					sortKeys: {
						kind: "kind",
						amount: "amount",
						requesterName: "requesterName",
						createdAt: "createdAt",
					},
				}}
				filtered={!!list.params.q || !!list.params.kind}
				onClearFilters={() => {
					list.setSearch("");
					list.set({ q: null, kind: null, tab: list.params.tab });
				}}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={(r) => void setOpen(r.id)}
				emptyTitle={
					tab === "waiting" ? "Nothing waiting on you" : "Nothing here"
				}
				emptyHint="Requests from every department land here the moment they are raised."
			/>

			<SidePanel
				open={!!current}
				onOpenChange={(o) => !o && close()}
				title={current?.description ?? ""}
				subtitle={
					current
						? `${humanize(current.kind)} · asked by ${current.requesterName} · ${fmtWhen(current.createdAt)}`
						: undefined
				}
				icon={ClipboardCheckIcon}
				footerInfo={
					current?.status === "PENDING"
						? withOwner
							? `With ${ownerName} · they decide`
							: overLimit
								? "Over your limit · the owner decides"
								: "Your decision is logged with your name"
						: current
							? `${statusLabel(current.status)}${current.decidedBy ? ` by ${current.decidedBy}` : ""}`
							: undefined
				}
				footer={
					canAnswer ? (
						<Button className={btn.primary} onClick={() => setAnswering(true)}>
							<MessageCircleQuestionIcon className="size-4" /> Answer
						</Button>
					) : (
						current?.status === "PENDING" &&
						!withOwner &&
						(overLimit ? (
							<Button
								className={btn.primary}
								disabled={pending}
								onClick={() =>
									current &&
									run(
										() =>
											withDeliveries(
												escalateApproval(current.id, reason),
												`Approval for ${current.requesterName}`,
											),
										`Sent to ${ownerName}`,
										close,
									)
								}
							>
								<SendIcon className="size-4" /> Send to owner
							</Button>
						) : (
							<>
								<Button
									variant="outline"
									className={btn.secondary}
									disabled={pending}
									onClick={() =>
										current &&
										run(
											() =>
												withDeliveries(
													escalateApproval(current.id, reason),
													`Approval for ${current.requesterName}`,
												),
											`Sent to ${ownerName}`,
											close,
										)
									}
								>
									<SendIcon className="size-4" /> Send to owner
								</Button>
								<Button
									variant="outline"
									className={btn.secondary}
									onClick={() => setAsk(true)}
								>
									<MessageCircleQuestionIcon className="size-4" /> Ask
								</Button>
								<Button
									variant="outline"
									className={btn.dangerSoft}
									onClick={() => setDecline(true)}
								>
									<XIcon className="size-4" /> Decline
								</Button>
								<Button
									className={btn.primary}
									disabled={pending}
									onClick={() =>
										decide(
											"APPROVED",
											`Approved · ${current.requesterName} has been told`,
										)
									}
								>
									<CheckIcon className="size-4" /> Approve
									{current.amount ? ` ${naira(current.amount)}` : ""}
								</Button>
							</>
						))
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						<PanelSection title="Request">
							<DetailList
								columns={2}
								items={[
									{
										label: "Amount",
										value: current.amount ? (
											<span className="text-base font-bold">
												{naira(current.amount)}
											</span>
										) : (
											"—"
										),
									},
									{ label: "Type", value: humanize(current.kind) },
									{ label: "From", value: humanize(current.sourceModule) },
									{ label: "Hotel", value: current.hotelName ?? "This hotel" },
									{
										label: "Needs",
										value:
											current.approverLevel === "OWNER" ? "Owner" : "Manager",
									},
									{
										label: "Status",
										value: (
											<StatusPill tone={statusTone(current.status)}>
												{statusLabel(current.status)}
											</StatusPill>
										),
									},
								]}
							/>
						</PanelSection>
						<PanelSection title="Asked by">
							<AvatarName
								name={current.requesterName}
								secondary={humanize(current.requesterRole)}
							/>
						</PanelSection>
						{current.note && (
							<Note tone="info">
								{current.status === "QUESTION" ? "Question: " : "Note: "}
								{current.note}
							</Note>
						)}
						{canAnswer && (
							<Note tone="warning">
								{current.approverLevel === "OWNER" ? ownerName : "The approver"}{" "}
								asked about your expense. It waits until you answer; your answer
								sends it back to them.
							</Note>
						)}
						{overLimit && current.status === "PENDING" && (
							<Note tone="warning">
								{withOwner
									? `${ownerName} is deciding this one.`
									: `This is over your approval limit of ${naira(limit)}. Only ${ownerName} can approve it; you can send it on with a note.`}
							</Note>
						)}
						<WhatHappens
							items={whatHappens(current)}
							tone={current.kind === "REFUND" ? "warning" : "info"}
						/>
					</div>
				)}
			</SidePanel>

			<Modal
				open={decline}
				onOpenChange={setDecline}
				title="Decline this request"
				subtitle="The requester sees your reason"
				tone="danger"
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setDecline(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.danger}
							disabled={pending || reason.trim().length < 3}
							onClick={() => decide("DECLINED", "Request declined", reason)}
						>
							Decline request
						</Button>
					</>
				}
			>
				<TextareaField
					label="Reason"
					value={reason}
					onChange={setReason}
					placeholder="e.g. Use the in-house technician instead"
				/>
			</Modal>

			<Modal
				open={ask}
				onOpenChange={setAsk}
				title="Ask a question"
				subtitle="The request waits until they answer"
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setAsk(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || reason.trim().length < 3}
							onClick={() =>
								decide(
									"QUESTION",
									"Question sent · you'll be notified when they reply",
									reason,
								)
							}
						>
							Send question
						</Button>
					</>
				}
			>
				<TextareaField
					label="Your question"
					value={reason}
					onChange={setReason}
					placeholder="e.g. Which supplier quoted this price?"
				/>
			</Modal>
			<Modal
				open={answering}
				onOpenChange={setAnswering}
				title="Answer the question"
				subtitle={current?.note ? `Question: ${current.note}` : undefined}
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setAnswering(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending || answer.trim().length < 2}
							onClick={() =>
								current?.sourceRef &&
								run(
									() =>
										answerExpense(current.sourceRef as string, answer.trim()),
									`Answer sent · back to ${current.approverLevel === "OWNER" ? ownerName : "the approver"}`,
									() => {
										close();
										router.refresh();
									},
								)
							}
						>
							<SendIcon className="size-4" /> Send answer
						</Button>
					</>
				}
			>
				<TextareaField
					label="Your answer"
					value={answer}
					onChange={setAnswer}
					placeholder="e.g. The generator part was quoted by two suppliers; this was the cheaper one"
				/>
			</Modal>
		</>
	);
}
