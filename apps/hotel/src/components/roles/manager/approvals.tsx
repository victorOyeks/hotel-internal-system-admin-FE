"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	CheckIcon,
	ClipboardCheckIcon,
	MessageCircleQuestionIcon,
	SendIcon,
	XIcon,
} from "lucide-react";
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
import { useAction } from "@hospio/api/actions/use-action";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type { ApprovalRow } from "@hospio/api/data/types";

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
	rows,
	limit,
	ownerName,
}: {
	rows: ApprovalRow[];
	limit: number;
	ownerName: string;
}) {
	const [tab, setTab] = useState<"waiting" | "decided" | "owner">("waiting");
	const [search, setSearch] = useState("");
	const [open, setOpen] = useQueryState("open");
	const [decline, setDecline] = useState(false);
	const [ask, setAsk] = useState(false);
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();

	const waiting = rows.filter(
		(r) => r.status === "PENDING" && r.approverLevel === "MANAGER",
	);
	const ownerQueue = rows.filter(
		(r) =>
			r.approverLevel === "OWNER" &&
			(r.status === "PENDING" || r.status === "QUESTION"),
	);
	const decided = rows.filter(
		(r) =>
			r.status === "APPROVED" ||
			r.status === "DECLINED" ||
			(r.status === "QUESTION" && r.approverLevel === "MANAGER"),
	);
	const list =
		tab === "waiting" ? waiting : tab === "owner" ? ownerQueue : decided;
	const current = rows.find((r) => r.id === open) ?? null;
	const close = () => {
		void setOpen(null);
		setDecline(false);
		setAsk(false);
		setReason("");
	};
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
	const totalWaiting = waiting.reduce((s, r) => s + (r.amount ?? 0), 0);

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
					{row.original.status === "PENDING" &&
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
					value={waiting.length}
					icon={ClipboardCheckIcon}
					hint={`${naira(totalWaiting)} in total`}
				/>
				<KpiCard
					label="With the owner"
					value={ownerQueue.length}
					icon={SendIcon}
					hint={`Over ${naira(limit)} or owner-only`}
				/>
				<KpiCard
					label="Decided this week"
					value={decided.length}
					icon={CheckIcon}
				/>
				<KpiCard
					label="Questions open"
					value={rows.filter((r) => r.status === "QUESTION").length}
					icon={MessageCircleQuestionIcon}
				/>
			</div>

			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "waiting", label: "Waiting", count: waiting.length },
							{
								key: "owner",
								label: "With the owner",
								count: ownerQueue.length,
							},
							{ key: "decided", label: "Decided", count: decided.length },
						]}
						value={tab}
						onChange={setTab}
					/>
				}
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Search requests…"
					/>
				}
			/>

			<DataTable
				columns={columns}
				data={list}
				search={search}
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
		</>
	);
}
