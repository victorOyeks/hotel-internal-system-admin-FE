"use client";

import { AlertTriangleIcon, CreditCardIcon, RotateCcwIcon, WifiIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { approveRefund, declineRefund, linkTerminal, openDispute, reassignTerminal, recordPayment, removeTerminal, renameTerminal, requestProviderAccount, requestRefund, resendReceipt, resolveDispute, retryPayment, setTerminalStatus, type TerminalRole, verifyPayment } from "@hospio/api/actions/payment";
import { useAction } from "@hospio/api/actions/use-action";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type { DisputeRow, FolioRow, PaymentMethod, PaymentRow, RefundRow, TerminalRow } from "@hospio/api/data/types";
import { methodLabel, paymentTone } from "./payments-screen";

export function PaymentPanel({ payment: p, onClose, onRefund, onDispute, onStatus }: { payment: PaymentRow | null; onClose: () => void; onRefund: (p: PaymentRow) => void; onDispute: (p: PaymentRow) => void; onStatus: (id: string, status: PaymentRow["status"]) => void }) {
	const { run, pending } = useAction();
	const live = useAction();
	const router = useRouter();
	if (!p) return null;
	const retry = () => run(() => retryPayment(p.id), `${naira(p.amount)} sent to the POS again`, (r) => { toast.info(r.status === "PROCESSING" ? "A new payment is waiting on the POS · the declined one stays in the list" : "The POS did not answer · try again or take cash"); onClose(); router.refresh(); });
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} title={naira(p.amount)} subtitle={<span className="flex items-center gap-2">{p.reference} · {p.guestName} <StatusPill tone={paymentTone[p.status]}>{humanize(p.status)}</StatusPill></span>} icon={CreditCardIcon}
			footerInfo={p.status === "APPROVED" ? `Receipt ${p.receiptSent === "NONE" ? "not sent" : `sent by ${p.receiptSent?.toLowerCase()}`}` : undefined}
			footer={<>
				{p.status === "APPROVED" && <a href={`/receipt?payment=${encodeURIComponent(p.id)}`} target="_blank" rel="noopener" className={btn.secondary}>Print receipt</a>}
				{p.status === "APPROVED" && <Button variant="outline" className={btn.secondary} disabled={pending} onClick={() => run(() => withDeliveries(resendReceipt(p.id), `Receipt for ${p.guestName}`), `Receipt resent to ${p.guestName}`)}>Resend receipt</Button>}
				{p.status === "APPROVED" && <Button className={btn.primary} onClick={() => { onClose(); onRefund(p); }}><RotateCcwIcon className="size-4" /> Refund</Button>}
				{(p.status === "DECLINED" || p.status === "FAILED") && p.method === "CARD" && <Button className={btn.primary} disabled={pending} onClick={retry}>Retry on POS</Button>}
				{p.status === "NO_RESPONSE" && p.method === "CARD" && <Button variant="outline" className={btn.secondary} disabled={pending || live.pending} onClick={retry}>Retry on POS</Button>}
				{(p.status === "NO_RESPONSE" || p.status === "PROCESSING") && <Button className={btn.primary} disabled={pending || live.pending} onClick={() => live.run(() => verifyPayment(p.id), "Checked with the provider", (r) => { onStatus(p.id, r.status); onClose(); })}>Check with provider</Button>}
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

const TERMINAL_ROLES: TerminalRole[] = ["FRONT_OFFICE", "BAR", "KITCHEN", "LAUNDRY"];
const PROVIDERS = [{ value: "logging", label: "Logging", hint: "Staging default · records the charge, moves no money" }, { value: "moniepoint", label: "Moniepoint" }, { value: "opay", label: "OPay" }];

export function TerminalPanel({ terminal: t, payments, onClose, onChanged, onRemoved }: { terminal: TerminalRow | null; payments: PaymentRow[]; onClose: () => void; onChanged: (t: TerminalRow) => void; onRemoved: (id: string) => void }) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	useEffect(() => { setName(t?.name ?? ""); setRole(""); }, [t]);
	if (!t) return null;
	const busy = pending;
	const recent = payments.filter((p) => p.terminal === t.name).slice(0, 6);
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} title={t.name} subtitle={`${t.provider} · ${t.ref} · last seen ${fmtWhen(t.lastSeen)}`} icon={WifiIcon}
			footer={<>
				<Button variant="outline" className={btn.dangerSoft} disabled={busy} onClick={() => run(() => removeTerminal(t.id), "Terminal removed", () => { onRemoved(t.id); onClose(); })}>Remove</Button>
				<Button variant="outline" className={btn.secondary} disabled title="Test charges are not connected yet · the POS provider has no test route">Send test · not connected yet</Button>
				<Button className={btn.primary} disabled={busy} onClick={() => { const next = t.status === "ONLINE" ? "OFFLINE" : "ONLINE"; run(() => setTerminalStatus(t.id, next), next === "OFFLINE" ? "Terminal paused · staff see it as unavailable" : "Terminal back online", () => onChanged({ ...t, status: next })); }}>{t.status === "ONLINE" ? "Pause terminal" : "Reconnect"}</Button>
			</>}
		>
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-3 gap-2">
					{[["Status", t.status === "ONLINE" ? "Online" : "Offline"], ["Today", naira(t.todayAmount)], ["Payments", String(t.todayCount)]].map(([l, v]) => (
						<div key={l} className="rounded-xl bg-subtle/70 px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">{l}</p><p className="text-base font-bold text-ink">{v}</p></div>
					))}
				</div>
				{t.status === "OFFLINE" && <Note tone="danger">Offline since {fmtWhen(t.lastSeen)} · staff on {t.roles.map(humanize).join(", ") || "no desk"} can only take cash or transfer.</Note>}
				<PanelSection title="Name">
					<div className="flex items-end gap-2">
						<div className="flex-1"><TextField label="Terminal name" value={name} onChange={setName} /></div>
						<Button variant="outline" className={btn.secondary} disabled={busy || !name.trim() || name === t.name} onClick={() => run(() => renameTerminal({ id: t.id, provider: t.provider, ref: t.ref }, name.trim()), "Terminal renamed", () => onChanged({ ...t, name: name.trim() }))}>Rename</Button>
					</div>
				</PanelSection>
				<PanelSection title="Used by">
					<div className="flex flex-wrap gap-2">{t.roles.length === 0 ? <p className="text-xs text-ink-3">No desk uses this terminal yet</p> : t.roles.map((r) => <StatusPill key={r} tone="grey" dot={false}>{humanize(r)}</StatusPill>)}</div>
					<div className="mt-3 flex items-end gap-2">
						<div className="flex-1"><SelectField label="Give a desk this terminal" value={role} onChange={setRole} options={TERMINAL_ROLES.map((r) => ({ value: r, label: humanize(r) }))} hint="A desk has one POS; this moves it here" /></div>
						<Button className={btn.primary} disabled={busy || !role} onClick={() => run(() => reassignTerminal(t.id, role as TerminalRole), `${humanize(role)} now uses this terminal`, () => { onChanged({ ...t, roles: t.roles.includes(role) ? t.roles : [...t.roles, role] }); setRole(""); })}>Assign</Button>
					</div>
				</PanelSection>
				<PanelSection title="Recent payments">
					{recent.length === 0 ? <p className="text-xs text-ink-3">Nothing yet today</p> : (
						<ul className="divide-y divide-line rounded-xl border border-line">{recent.map((p) => <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-[13px]"><span className="flex-1 font-medium text-ink">{p.guestName} · {p.description}</span><span className="text-xs text-ink-3">{fmtWhen(p.createdAt)}</span></li>)}</ul>
					)}
				</PanelSection>
			</div>
		</SidePanel>
	);
}

export function LinkTerminalPanel({ open, onClose, onLinked }: { open: boolean; onClose: () => void; onLinked: (t: TerminalRow) => void }) {
	const { run, pending } = useAction();
	const ticket = useAction();
	const [name, setName] = useState("");
	const [provider, setProvider] = useState("logging");
	const [ref, setRef] = useState("");
	const [role, setRole] = useState<TerminalRole>("FRONT_OFFICE");
	useEffect(() => { if (open) { setName(""); setProvider("logging"); setRef(""); setRole("FRONT_OFFICE"); } }, [open]);
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title="Link a terminal" subtitle="Add a POS and give it to a desk" icon={WifiIcon}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name.trim() || !ref.trim()} onClick={() => run(() => linkTerminal({ name: name.trim(), provider, terminalRef: ref.trim(), role }), `${name.trim()} linked to ${humanize(role)}`, (r) => { onLinked({ id: r.id, name: name.trim(), provider, ref: ref.trim(), status: "ONLINE", roles: [role], lastSeen: new Date().toISOString(), todayCount: 0, todayAmount: 0 }); onClose(); })}>Link terminal</Button></>}
		>
			<div className="flex flex-col gap-5">
				<TextField label="Terminal name" value={name} onChange={setName} placeholder="e.g. Front desk POS" required />
				<SelectField label="Provider" value={provider} onChange={setProvider} options={PROVIDERS} required />
				<TextField label="Terminal or serial ref" value={ref} onChange={setRef} placeholder="Printed on the back of the device" required />
				<SelectField label="Desk" value={role} onChange={(v) => setRole(v as TerminalRole)} options={TERMINAL_ROLES.map((r) => ({ value: r, label: humanize(r) }))} required />
				<button type="button" disabled={ticket.pending} onClick={() => ticket.run(() => requestProviderAccount(provider, `Hotel needs a ${provider} account to link ${name || "a POS terminal"}.`), "Ticket opened with H.M.S", (r) => toast.info(`Ticket ${r.reference} opened. H.M.S will be in touch`))} className="self-start text-[13px] font-semibold text-brand hover:underline">Need a provider account? Ask H.M.S</button>
			</div>
		</SidePanel>
	);
}

const asRefundStatus = (s: string): RefundRow["status"] => (s === "APPROVED" || s === "DECLINED" ? s : "PENDING_APPROVAL");

export function RefundModal({ refund, isNew, onClose, onSaved }: { refund: RefundRow | null; isNew: boolean; onClose: () => void; onSaved: (r: RefundRow) => void }) {
	const { run, pending } = useAction();
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
				<Button className={btn.primary} disabled={pending || amount === "" || !reason} onClick={() => amount !== "" && run(() => requestRefund(refund.paymentId, amount, reason), "Refund requested · waiting for approval", (r) => { onSaved({ ...refund, id: r.id, amount, reason, status: asRefundStatus(r.status) }); onClose(); })}>Request refund</Button>
			</> : <>
				<Button variant="outline" className={btn.dangerSoft} disabled={pending} onClick={() => run(() => declineRefund(refund.id), "Refund declined · requester told", (r) => { onSaved({ ...refund, status: asRefundStatus(r.status) }); onClose(); })}>Decline</Button>
				<Button className={btn.primary} disabled={pending} onClick={() => run(() => approveRefund(refund.id), `${naira(refund.amount)} refund approved`, (r) => { onSaved({ ...refund, status: asRefundStatus(r.status) }); onClose(); })}>Approve refund</Button>
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
	const { run, pending } = useAction();
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
				<Button className={btn.primary} disabled={pending || !reason} onClick={() => run(() => openDispute(dispute.paymentId, reason), "Dispute opened · finance is told", (r) => { onSaved({ ...dispute, id: r.id, reason }); onClose(); })}>Open dispute</Button>
			</> : <>
				<Button variant="outline" className={btn.secondary} onClick={onClose}>Later</Button>
				<Button className={btn.primary} disabled={pending || !resolution} onClick={() => run(() => resolveDispute(dispute.id, resolution), "Dispute resolved · guest told", () => { onSaved({ ...dispute, status: "RESOLVED", resolution }); onClose(); })}>Resolve</Button>
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
	const { run, pending } = useAction();
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
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name || amount === "" || amount <= 0} onClick={() => amount !== "" && run(() => recordPayment({ method, amount, folioId: folio?.id, guestName: name, description: desc, receipt }), method === "CARD" ? "Sent to the front desk POS · waiting for the tap" : `${naira(amount)} recorded`, (r) => { onSaved({ id: r.id, reference: `PAY-${r.id.slice(0, 6).toUpperCase()}`, folioId: folio?.id, guestName: name, roomNumber: folio?.roomNumber, role: "MANAGER", takenBy: "You", method, amount, status: r.status, terminal: method === "CARD" ? "Front desk POS" : undefined, createdAt: new Date().toISOString(), resolvedAt: method === "CARD" ? undefined : new Date().toISOString(), receiptSent: receipt, description: desc }); onClose(); })}>{method === "CARD" ? "Send to POS" : "Record payment"}</Button></>}
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


