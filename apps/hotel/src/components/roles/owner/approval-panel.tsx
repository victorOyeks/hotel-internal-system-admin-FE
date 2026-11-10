"use client";

import {
	CheckIcon,
	MessageCircleQuestionIcon,
	ShieldCheckIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, humanize, naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { decideAsOwner } from "@hospio/api/actions/owner";
import { useAction } from "@hospio/api/actions/use-action";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type { ApprovalRow } from "@hospio/api/data/types";

/** Owner · 01 Approvals waiting → approve spend / decline / ask manager. */
export function ApprovalPanel({
	approval,
	limit,
	onClose,
}: {
	approval: ApprovalRow | null;
	limit?: number;
	onClose: () => void;
}) {
	const [decline, setDecline] = useState(false);
	const [ask, setAsk] = useState(false);
	const [reason, setReason] = useState("");
	const [question, setQuestion] = useState("");
	const { run, pending } = useAction();
	const a = approval;
	const decide = (
		decision: "APPROVED" | "DECLINED" | "QUESTION",
		message: string,
		note?: string,
	) =>
		a &&
		run(
			() =>
				withDeliveries(
					decideAsOwner(a.id, decision, note),
					`Approval for ${a.requesterName}`,
				),
			message,
			() => {
				setReason("");
				setQuestion("");
				close();
			},
		);
	const open = !!a;
	const close = () => {
		setDecline(false);
		setAsk(false);
		onClose();
	};
	return (
		<>
			<SidePanel
				open={open}
				onOpenChange={(o) => !o && close()}
				title={a?.description ?? ""}
				subtitle={
					a
						? `${humanize(a.kind)} · ${a.hotelName ?? "This hotel"} · asked ${fmtWhen(a.createdAt)}`
						: undefined
				}
				icon={ShieldCheckIcon}
				footerInfo={
					limit
						? `Spend over ${naira(limit)} comes to you by your approval limits`
						: "Needs the owner by your approval limits"
				}
				footer={
					a?.status === "PENDING" ? (
						<>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => setAsk(true)}
							>
								<MessageCircleQuestionIcon className="size-4" /> Ask manager
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
								onClick={() => decide("APPROVED", `${a.description} approved`)}
							>
								<CheckIcon className="size-4" /> Approve{" "}
								{a.amount ? naira(a.amount) : ""}
							</Button>
						</>
					) : (
						<Button variant="outline" className={btn.secondary} onClick={close}>
							Close
						</Button>
					)
				}
			>
				{a && (
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between rounded-xl bg-subtle/70 px-4 py-3">
							<div>
								<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
									Amount
								</p>
								<p className="text-2xl font-bold text-ink">
									{a.amount ? naira(a.amount) : "—"}
								</p>
							</div>
							<StatusPill
								tone={
									a.status === "PENDING"
										? "warning"
										: a.status === "APPROVED"
											? "success"
											: a.status === "DECLINED"
												? "danger"
												: "info"
								}
							>
								{humanize(a.status)}
							</StatusPill>
						</div>
						<PanelSection title="Request">
							<DetailList
								columns={2}
								items={[
									{
										label: "Asked by",
										value: `${a.requesterName} · ${humanize(a.requesterRole)}`,
									},
									{ label: "Hotel", value: a.hotelName ?? "This hotel" },
									{ label: "From", value: humanize(a.sourceModule) },
									{ label: "Type", value: humanize(a.kind) },
									{
										label: "Needs",
										value: a.approverLevel === "OWNER" ? "Owner" : "Manager",
									},
									{ label: "Asked", value: fmtWhen(a.createdAt) },
								]}
							/>
						</PanelSection>
						{a.note && <Note tone="info">Your question: {a.note}</Note>}
						{a.status === "PENDING" && (
							<WhatHappens
								items={[
									"The manager is told straight away",
									`${a.requesterName} can go ahead`,
									"This decision is logged under your name",
								]}
							/>
						)}
					</div>
				)}
			</SidePanel>

			<ConfirmModal
				open={decline}
				onOpenChange={setDecline}
				title="Decline this request?"
				subtitle={a?.description}
				tone="danger"
				confirmLabel="Decline request"
				pending={pending}
				onConfirm={() =>
					decide("DECLINED", "Request declined · manager told", reason)
				}
				alternative={{
					label: "Ask the manager a question instead",
					onClick: () => {
						setDecline(false);
						setAsk(true);
					},
				}}
			>
				<div className="flex flex-col gap-3">
					<TextareaField
						label="Reason the manager will see"
						value={reason}
						onChange={setReason}
						placeholder="e.g. Get two more quotes first"
					/>
					<WhatHappens
						tone="danger"
						items={[
							"The request is closed",
							`${a?.requesterName ?? "The requester"} and the manager are told with your reason`,
						]}
					/>
				</div>
			</ConfirmModal>

			<Modal
				open={ask}
				onOpenChange={setAsk}
				title="Ask the manager"
				subtitle="The request stays open until they answer"
				icon={MessageCircleQuestionIcon}
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
							disabled={pending || !question}
							onClick={() =>
								decide("QUESTION", "Question sent to the manager", question)
							}
						>
							Send question
						</Button>
					</>
				}
			>
				<TextareaField
					label="Your question"
					value={question}
					onChange={setQuestion}
					placeholder="e.g. Which supplier gave this price?"
				/>
			</Modal>
		</>
	);
}
