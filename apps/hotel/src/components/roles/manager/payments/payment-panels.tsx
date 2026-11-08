"use client";

import { AlertTriangleIcon, CreditCardIcon, RotateCcwIcon, WifiIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DetailList, Note, Timeline, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, MoneyField, SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, humanize, naira, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { DisputeRow, FolioRow, PaymentMethod, PaymentRow, RefundRow, TerminalRow } from "@hospio/api/data/types";
import { methodLabel, paymentTone } from "./payments-screen";

export function PaymentPanel({ payment: p, onClose, onRefund, onDispute }: { payment: PaymentRow | null; onClose: () => void; onRefund: (p: PaymentRow) => void; onDispute: (p: PaymentRow) => void }) {
	const { run, pending } = useDemoAction();
	if (!p) return null;
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} title={naira(p.amount)} subtitle={<span className="flex items-center gap-2">{p.reference} · {p.guestName} <StatusPill tone={paymentTone[p.status]}>{humanize(p.status)}</StatusPill></span>} icon={CreditCardIcon}
			footerInfo={p.status === "APPROVED" ? `Receipt ${p.receiptSent === "NONE" ? "not sent" : `sent by ${p.receiptSent?.toLowerCase()}`}` : undefined}
			footer={<>
				{p.status === "APPROVED" && <Button variant="outline" className={btn.secondary} disabled={pending} onClick={() => run(`Receipt resent to ${p.guestName}`)}>Resend receipt</Button>}
				{p.status === "APPROVED" && <Button className={btn.primary} onClick={() => { onClose(); onRefund(p); }}><RotateCcwIcon className="size-4" /> Refund</Button>}
				{(p.status === "DECLINED" || p.status === "FAILED") && <Button className={btn.primary} disabled={pending} onClick={() => run("Retry sent to the POS", onClose, { tone: "info" })}>Retry on POS</Button>}
				{(p.status === "NO_RESPONSE" || p.status === "PROCESSING") && <Button className={btn.primary} disabled={pending} onClick={() => run("Checked with the provider · still waiting", onClose, { tone: "info" })}>Check with provider</Button>}
			</>}
		>
			<div className="flex flex-col gap-6">
				{p.status === "NO_RESPONSE" && <Note tone="warning">The bank never answered. Ask the guest for the debit alert before taking it again.</Note>}
				{p.status === "DECLINED" && <Note tone="danger">Declined by the bank · nothing was taken from the guest.</Note>}
				<PanelSection title="Payment">
					<DetailList columns={2} items={[
						{ label: "For", value: p.description }, { label: "Method", value: methodLabel[p.method] },
						{ label: "Taken by", value: `${p.takenBy} · ${humanize(p.role)}` }, { label: "Terminal", value: p.terminal ?? "—" },
						{ label: "Provider ref", value: p.providerRef ?? "—" }, { label: "Room", value: p.roomNumber ?? "—" },
					]} />
				</PanelSection>
				<PanelSection title="Timeline">
					<Timeline items={[...(p.resolvedAt ? [{ at: fmtWhen(p.resolvedAt), by: p.terminal ?? "Provider", text: humanize(p.status) }] : []), { at: fmtWhen(p.createdAt), by: p.takenBy, text: `${naira(p.amount)} by ${methodLabel[p.method].toLowerCase()} started` }]} />
				</PanelSection>
				<PanelSection title="Links">
					<div className="flex flex-col gap-2 text-[13px]">
						{p.folioId && <Link href={`/dashboard/folios?open=${p.folioId}`} className="font-semibold text-brand hover:underline">Open folio →</Link>}
						<Link href={`/dashboard/financials?tab=transactions`} className="font-semibold text-brand hover:underline">See in transactions →</Link>
						{p.status === "APPROVED" && <button type="button" onClick={() => { onClose(); onDispute(p); }} className="self-start font-semibold text-danger hover:underline">Guest disputes this payment</button>}
					</div>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

export function TerminalPanel({ terminal: t, payments, onClose }: { terminal: TerminalRow | null; payments: PaymentRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	if (!t) return null;
	const recent = payments.filter((p) => p.terminal === t.name).slice(0, 6);
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} title={t.name} subtitle={`${t.provider} · ${t.ref} · last seen ${fmtWhen(t.lastSeen)}`} icon={WifiIcon}
			footer={<>
				<Button variant="outline" className={btn.secondary} disabled={pending} onClick={() => run("Test charge of ₦100 sent to the terminal", undefined, { tone: "info" })}>Send test</Button>
				<Button className={btn.primary} disabled={pending} onClick={() => run(t.status === "ONLINE" ? "Terminal paused · staff see it as unavailable" : "Reconnect requested · ask staff to restart the POS", onClose, { tone: "info" })}>{t.status === "ONLINE" ? "Pause terminal" : "Reconnect"}</Button>
			</>}
		>
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-3 gap-2">
					{[["Status", t.status === "ONLINE" ? "Online" : "Offline"], ["Today", naira(t.todayAmount)], ["Payments", String(t.todayCount)]].map(([l, v]) => (
						<div key={l} className="rounded-xl bg-subtle/70 px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">{l}</p><p className="text-base font-bold text-ink">{v}</p></div>
					))}
				</div>
				{t.status === "OFFLINE" && <Note tone="danger">Offline since {fmtWhen(t.lastSeen)} · staff on {t.roles.map(humanize).join(", ")} can only take cash or transfer.</Note>}
				<PanelSection title="Used by"><div className="flex flex-wrap gap-2">{t.roles.map((r) => <StatusPill key={r} tone="grey" dot={false}>{humanize(r)}</StatusPill>)}</div></PanelSection>
				<PanelSection title="Recent payments">
					{recent.length === 0 ? <p className="text-xs text-ink-3">Nothing yet today</p> : (
						<ul className="divide-y divide-line rounded-xl border border-line">{recent.map((p) => <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-[13px]"><span className="flex-1 font-medium text-ink">{p.guestName} · {p.description}</span><span className="text-xs text-ink-3">{fmtWhen(p.createdAt)}</span><StatusPill tone={paymentTone[p.status]} dot={false}>{naira(p.amount)}</StatusPill></li>)}</ul>
					)}
				</PanelSection>
			</div>
		</SidePanel>
	);
}

export function RefundModal({ refund, isNew, onClose, onSaved }: { refund: RefundRow | null; isNew: boolean; onClose: () => void; onSaved: (r: RefundRow) => void }) {
	const { run, pending } = useDemoAction();
	const [amount, setAmount] = useState<number | "">("");
	const [reason, setReason] = useState("");
	const [note, setNote] = useState("");
	useEffect(() => { setAmount(refund?.amount ?? ""); setReason(refund?.reason ?? ""); setNote(""); }, [refund]);
	if (!refund) return null;
	const decided = refund.status !== "PENDING_APPROVAL";
	return (
		<Modal open onOpenChange={(o) => !o && onClose()} title={isNew ? "Request a refund" : decided ? `Refund ${humanize(refund.status).toLowerCase()}` : "Approve refund?"} subtitle={`${refund.guestName} · ${naira(refund.amount)}${isNew ? "" : ` · asked by ${refund.requestedBy} ${fmtWhen(refund.createdAt)}`}`} icon={RotateCcwIcon} size="form"
			footerInfo={<span className="flex items-center gap-2"><ManagerMark /> refunds over ₦50,000 also go to the owner</span>}
			footer={decided ? <Button className={btn.primary} onClick={onClose}>Close</Button> : isNew ? <>
				<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
				<Button className={btn.primary} disabled={pending || amount === "" || !reason} onClick={() => amount !== "" && run("Refund requested · waiting for approval", () => { onSaved({ ...refund, amount, reason }); onClose(); }, { tone: "info" })}>Request refund</Button>
			</> : <>
				<Button variant="outline" className={btn.dangerSoft} disabled={pending} onClick={() => run("Refund declined · requester told", () => { onSaved({ ...refund, status: "DECLINED" }); onClose(); })}>Decline</Button>
				<Button className={btn.primary} disabled={pending} onClick={() => run(`${naira(refund.amount)} refund approved`, () => { onSaved({ ...refund, status: "APPROVED" }); onClose(); })}>Approve refund</Button>
			</>}
		>
			<div className="flex flex-col gap-4">
				{isNew ? <>
					<MoneyField label="Amount to refund" value={amount} onChange={setAmount} hint={`Payment was ${naira(refund.amount)}`} />
					<SelectField label="Reason" value={reason} onChange={setReason} setupLink="reasons" options={["Charged twice", "Guest left early", "Service failure", "Booking cancelled", "Other"]} />
				</> : <>
					<TotalsList rows={[{ label: "Reason", value: refund.reason }, { label: "Amount", value: naira(refund.amount), strong: true }]} />
					{!decided && <TextareaField label="Note to the requester (optional)" value={note} onChange={setNote} rows={2} />}
				</>}
				{!decided && <WhatHappens items={["Card refunds go back through the POS in 3–5 days", "Cash refunds come out of the front desk till", "The guest gets a message with the refund reference", "Logged against your name"]} />}
			</div>
		</Modal>
	);
}

export function DisputePanel({ dispute, payment, isNew, onClose, onSaved }: { dispute: DisputeRow | null; payment: PaymentRow | null; isNew: boolean; onClose: () => void; onSaved: (d: DisputeRow) => void }) {
	const { run, pending } = useDemoAction();
	const [reason, setReason] = useState("");
	const [resolution, setResolution] = useState("");
	const [outcome, setOutcome] = useState<"ok" | "refund" | "reissue">("ok");
	useEffect(() => { setReason(dispute?.reason ?? ""); setResolution(""); }, [dispute]);
	if (!dispute) return null;
	const resolved = dispute.status === "RESOLVED";
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} title={isNew ? "Open a dispute" : `Dispute · ${dispute.guestName}`} subtitle={`${naira(dispute.amount)}${payment ? ` · ${payment.reference} · ${methodLabel[payment.method]}` : ""}`} icon={AlertTriangleIcon} tone={resolved ? "default" : "danger"}
			footer={resolved ? <Button className={btn.primary} onClick={onClose}>Close</Button> : isNew ? <>
				<Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button>
				<Button className={btn.primary} disabled={pending || !reason} onClick={() => run("Dispute opened · finance is told", () => { onSaved({ ...dispute, reason }); onClose(); }, { tone: "info" })}>Open dispute</Button>
			</> : <>
				<Button variant="outline" className={btn.secondary} onClick={onClose}>Later</Button>
				<Button className={btn.primary} disabled={pending || !resolution} onClick={() => run("Dispute resolved · guest told", () => { onSaved({ ...dispute, status: "RESOLVED", resolution }); onClose(); })}>Resolve</Button>
			</>}
		>
			<div className="flex flex-col gap-6">
				{isNew ? <TextareaField label="What the guest says" value={reason} onChange={setReason} rows={3} placeholder="e.g. bank shows two debits" /> : <Note tone={resolved ? "success" : "warning"}>{resolved ? dispute.resolution : dispute.reason}</Note>}
				{payment && <PanelSection title="The payment"><DetailList columns={2} items={[{ label: "Taken by", value: payment.takenBy }, { label: "When", value: fmtWhen(payment.createdAt) }, { label: "Terminal", value: payment.terminal ?? "—" }, { label: "Provider ref", value: payment.providerRef ?? "—" }]} /></PanelSection>}
				{!isNew && !resolved && (
					<PanelSection title="Resolution">
						<ChoiceCards value={outcome} onChange={setOutcome} options={[{ value: "ok", label: "Payment was correct", hint: "Show the guest the single provider record" }, { value: "reissue", label: "Reissue the receipt", hint: "Amounts didn't match the receipt" }, { value: "refund", label: "Refund the difference", hint: "Opens a refund request" }]} />
						<TextareaField label="What you told the guest" value={resolution} onChange={setResolution} rows={2} />
					</PanelSection>
				)}
			</div>
		</SidePanel>
	);
}

export function NewPaymentPanel({ open, folios, preselect, onClose, onSaved }: { open: boolean; folios: FolioRow[]; preselect: string | null; onClose: () => void; onSaved: (p: PaymentRow) => void }) {
	const { run, pending } = useDemoAction();
	const [folioId, setFolioId] = useState("");
	const [payer, setPayer] = useState("");
	const [desc, setDesc] = useState("Room charges");
	const [amount, setAmount] = useState<number | "">("");
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	const [receipt, setReceipt] = useState<"WHATSAPP" | "EMAIL" | "NONE">("WHATSAPP");
	useEffect(() => { if (open) { const f = folios.find((x) => x.id === preselect); setFolioId(f?.id ?? ""); setAmount(f ? f.balance : ""); setPayer(""); } }, [open, preselect, folios]);
	const folio = folios.find((f) => f.id === folioId);
	const name = folio?.guestName ?? payer;
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title="Record a payment" subtitle="For a folio, or a walk-in sale without a room" icon={CreditCardIcon}
			footerInfo={folio ? `${naira(folio.balance)} due on ${folio.roomNumber}` : undefined}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name || amount === "" || amount <= 0} onClick={() => amount !== "" && run(method === "CARD" ? "Sent to the front desk POS · waiting for the tap" : `${naira(amount)} recorded`, () => { onSaved({ id: `p-${Date.now()}`, reference: `PAY-${String(Date.now()).slice(-5)}`, folioId: folio?.id, guestName: name, roomNumber: folio?.roomNumber, role: "MANAGER", takenBy: "Tunde Bakare", method, amount, status: method === "CARD" ? "PROCESSING" : "APPROVED", terminal: method === "CARD" ? "Front desk POS" : undefined, createdAt: new Date().toISOString(), resolvedAt: method === "CARD" ? undefined : new Date().toISOString(), receiptSent: receipt, description: desc }); onClose(); }, method === "CARD" ? { tone: "info" } : undefined)}>{method === "CARD" ? "Send to POS" : "Record payment"}</Button></>}
		>
			<div className="flex flex-col gap-5">
				<SelectField label="Folio" value={folioId} onChange={(v) => { setFolioId(v); const f = folios.find((x) => x.id === v); if (f) setAmount(f.balance); }} placeholder="No folio · walk-in" options={folios.map((f) => ({ value: f.id, label: `${f.guestName} · ${f.roomNumber}`, hint: `${naira(f.balance)} due` }))} />
				{!folio && <TextField label="Who is paying" value={payer} onChange={setPayer} placeholder="Walk-in guest name" required />}
				<TextField label="For" value={desc} onChange={setDesc} />
				<ChoiceCards label="Paid by" value={method} onChange={setMethod} columns={3} options={[{ value: "CARD", label: "Card · POS", hint: "Front desk POS" }, { value: "TRANSFER", label: "Transfer", hint: "GTBank 0123456789" }, { value: "CASH", label: "Cash", hint: "Into the till" }]} />
				<MoneyField label="Amount" value={amount} onChange={setAmount} required />
				<ChoiceCards label="Receipt" value={receipt} onChange={setReceipt} columns={3} options={[{ value: "WHATSAPP", label: "WhatsApp" }, { value: "EMAIL", label: "Email" }, { value: "NONE", label: "None" }]} />
				<p className="text-xs text-ink-3">{plural(folios.length, "open folio")} with a balance</p>
			</div>
		</SidePanel>
	);
}


