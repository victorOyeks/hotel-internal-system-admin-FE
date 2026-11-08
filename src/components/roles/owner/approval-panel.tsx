"use client";

import { CheckIcon, MessageCircleQuestionIcon, ShieldCheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DetailList, Note } from "@/components/shared/detail-list";
import { TextareaField } from "@/components/shared/field";
import { fmtWhen, humanize, naira } from "@/components/shared/format";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { ApprovalRow } from "@/lib/data/types";

/** Owner · 01 Approvals waiting → approve spend / decline / ask manager. */
export function ApprovalPanel({ approval, onClose }: { approval: ApprovalRow | null; onClose: () => void }) {
	const [decline, setDecline] = useState(false);
	const [ask, setAsk] = useState(false);
	const [reason, setReason] = useState("");
	const [question, setQuestion] = useState("");
	const { run, pending } = useDemoAction();
	const a = approval;
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
				subtitle={a ? `${humanize(a.kind)} · ${a.hotelName ?? "Simpas Ikeja"} · asked ${fmtWhen(a.createdAt)}` : undefined}
				icon={ShieldCheckIcon}
				footerInfo={a?.amount ? `Over ₦500,000 comes to you by your approval limits` : "Needs the owner by your approval limits"}
				footer={
					a?.status === "PENDING" ? (
						<>
							<Button variant="outline" className={btn.secondary} onClick={() => setAsk(true)}>
								<MessageCircleQuestionIcon className="size-4" /> Ask manager
							</Button>
							<Button variant="outline" className={btn.dangerSoft} onClick={() => setDecline(true)}>
								<XIcon className="size-4" /> Decline
							</Button>
							<Button className={btn.primary} disabled={pending} onClick={() => run(`${a.description} approved`, close)}>
								<CheckIcon className="size-4" /> Approve {a.amount ? naira(a.amount) : ""}
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
								<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">Amount</p>
								<p className="text-2xl font-bold text-ink">{a.amount ? naira(a.amount) : "—"}</p>
							</div>
							<StatusPill tone={a.status === "PENDING" ? "warning" : a.status === "APPROVED" ? "success" : a.status === "DECLINED" ? "danger" : "info"}>{humanize(a.status)}</StatusPill>
						</div>
						<PanelSection title="Request">
							<DetailList
								columns={2}
								items={[
									{ label: "Asked by", value: `${a.requesterName} · ${humanize(a.requesterRole)}` },
									{ label: "Hotel", value: a.hotelName ?? "Simpas Ikeja" },
									{ label: "From", value: humanize(a.sourceModule) },
									{ label: "Type", value: humanize(a.kind) },
									{ label: "Manager", value: a.hotelName === "Simpas Lekki" ? "Amaka Eze · approved" : "Tunde Bakare · approved" },
									{ label: "Asked", value: fmtWhen(a.createdAt) },
								]}
							/>
						</PanelSection>
						{a.note && <Note tone="info">Your question: {a.note}</Note>}
						<PanelSection title="Context">
							<DetailList
								items={[
									{ label: "Same category this month", value: a.kind === "EXPENSE" ? "₦21.3M of ₦18M budget · 118%" : a.kind === "PURCHASE_ORDER" ? "4 orders · ₦2.4M" : "—" },
									{ label: "Last similar request", value: a.kind === "EXPENSE" ? "₦480,000 · 12 Oct · approved" : "—" },
								]}
							/>
						</PanelSection>
						{a.status === "PENDING" && <WhatHappens items={["The manager is told straight away", `${a.requesterName} can go ahead`, "This decision is logged under your name"]} />}
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
				onConfirm={() => run("Request declined · manager told", close)}
				alternative={{ label: "Ask the manager a question instead", onClick: () => { setDecline(false); setAsk(true); } }}
			>
				<div className="flex flex-col gap-3">
					<TextareaField label="Reason the manager will see" value={reason} onChange={setReason} placeholder="e.g. Get two more quotes first" />
					<WhatHappens tone="danger" items={["The request is closed", `${a?.requesterName ?? "The requester"} and the manager are told with your reason`]} />
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
						<Button variant="outline" className={btn.secondary} onClick={() => setAsk(false)}>
							Cancel
						</Button>
						<Button className={btn.primary} disabled={pending || !question} onClick={() => run("Question sent to the manager", close)}>
							Send question
						</Button>
					</>
				}
			>
				<TextareaField label="Your question" value={question} onChange={setQuestion} placeholder="e.g. Which supplier gave this price?" />
			</Modal>
		</>
	);
}
