"use client";

import { BellIcon, CreditCardIcon, FileTextIcon, HandshakeIcon, PencilIcon, UploadIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, MoneyField, SelectField, TextField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtDay, naira, plural } from "@/components/shared/format";
import { Modal } from "@/components/shared/modal";
import { ManagerMark } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { BookingRow, InvoiceRow, OrgMemberRow, OrganizationRow, PaymentMethod } from "@/lib/data/types";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function NewOrganizationPanel({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (o: OrganizationRow) => void }) {
	const { run, pending } = useDemoAction();
	const [name, setName] = useState("");
	const [contact, setContact] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [limit, setLimit] = useState<number | "">(2000000);
	const [cap, setCap] = useState<number | "">("");
	const [terms, setTerms] = useState("30");
	const [cycle, setCycle] = useState("Monthly");
	const [notes, setNotes] = useState("");
	const needsOwner = limit !== "" && limit > 5000000;
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} width="lg" title="New organization" subtitle="A company whose staff book on account and pay by invoice" icon={HandshakeIcon}
			footerInfo={needsOwner ? <span className="flex items-center gap-2"><ManagerMark /> credit over ₦5M needs the owner</span> : undefined}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name || !contact || !phone || limit === ""} onClick={() => limit !== "" && run(needsOwner ? `${name} saved · credit limit sent to the owner` : `${name} added`, () => { onSaved({ id: `org-${Date.now()}`, name, contactName: contact, contactPhone: phone, contactEmail: email, creditLimit: limit, dailyCap: cap === "" ? undefined : cap, billingCycle: cycle, termsDays: Number(terms) || 30, status: "ACTIVE", outstanding: 0, staffCount: 0, staysThisMonth: 0, agreementNotes: notes || undefined, since: iso(new Date()) }); onClose(); }, needsOwner ? { tone: "info" } : undefined)}>Save organization</Button></>}
		>
			<div className="flex flex-col gap-6">
				<PanelSection title="Company">
					<TextField label="Company name" value={name} onChange={setName} placeholder="Zenith Bank Plc" required />
					<FieldRow><TextField label="Contact person" value={contact} onChange={setContact} placeholder="Travel desk" required /><TextField label="Phone" value={phone} onChange={setPhone} placeholder="+234 80…" required /></FieldRow>
					<TextField label="Billing email" value={email} onChange={setEmail} placeholder="accounts@company.com" />
				</PanelSection>
				<PanelSection title="Credit & billing">
					<FieldRow><MoneyField label="Credit limit" value={limit} onChange={setLimit} required hint="Bookings stop when this is reached" /><MoneyField label="Daily cap per room-night" value={cap} onChange={setCap} hint="Optional · guest pays anything above" /></FieldRow>
					<FieldRow><SelectField label="Pays within" value={terms} onChange={setTerms} options={[{ value: "14", label: "14 days" }, { value: "30", label: "30 days" }, { value: "45", label: "45 days" }, { value: "60", label: "60 days" }]} /><SelectField label="Invoice cycle" value={cycle} onChange={setCycle} options={["Monthly", "Twice a month", "Per stay"]} /></FieldRow>
				</PanelSection>
				<TextareaField label="What the agreement covers" value={notes} onChange={setNotes} placeholder="e.g. Deluxe at ₦42,000 · breakfast included · bar not covered" rows={3} />
				<WhatHappens items={["The company appears in New booking → Organization", "Only staff you add can book on account", "Invoices are drafted on the cycle you chose"]} />
			</div>
		</SidePanel>
	);
}

export function OrgPaymentModal({ open, org, invoices, onClose, onSaved }: { open: boolean; org: OrganizationRow; invoices: InvoiceRow[]; onClose: () => void; onSaved: (invoiceId: string, amount: number) => void }) {
	const { run, pending } = useDemoAction();
	const [invoiceId, setInvoiceId] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [method, setMethod] = useState<PaymentMethod>("TRANSFER");
	const [ref, setRef] = useState("");
	useEffect(() => { if (open) { const first = invoices[0]; setInvoiceId(first?.id ?? ""); setAmount(first ? first.amount - first.paid : ""); setRef(""); } }, [open, invoices]);
	const inv = invoices.find((i) => i.id === invoiceId);
	return (
		<Modal open={open} onOpenChange={(o) => !o && onClose()} title="Record payment" subtitle={`${org.name} · ${naira(org.outstanding)} outstanding`} icon={CreditCardIcon} size="form"
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !inv || amount === "" || amount <= 0} onClick={() => inv && amount !== "" && run(`${naira(amount)} recorded against ${inv.number}`, () => { onSaved(inv.id, amount); onClose(); })}>Record payment</Button></>}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Invoice" value={invoiceId} onChange={(v) => { setInvoiceId(v); const i = invoices.find((x) => x.id === v); if (i) setAmount(i.amount - i.paid); }} options={invoices.map((i) => ({ value: i.id, label: i.number, hint: `${naira(i.amount - i.paid)} left · due ${fmtDay(i.dueDate)}` }))} placeholder={invoices.length ? "Choose an invoice" : "No open invoices"} />
				<ChoiceCards label="Paid by" value={method} onChange={setMethod} columns={3} options={[{ value: "TRANSFER", label: "Transfer", hint: "GTBank 0123456789" }, { value: "CARD", label: "Card" }, { value: "CASH", label: "Cash" }]} />
				<FieldRow><MoneyField label="Amount" value={amount} onChange={setAmount} required /><TextField label="Reference" value={ref} onChange={setRef} placeholder="Bank alert / cheque no." /></FieldRow>
				{inv && amount !== "" && <TotalsList rows={[{ label: `${inv.number} left`, value: naira(inv.amount - inv.paid) }, { label: "After this payment", value: naira(Math.max(0, inv.amount - inv.paid - amount)), strong: true, tone: inv.amount - inv.paid - amount <= 0 ? "success" : undefined }]} />}
			</div>
		</Modal>
	);
}

export function ReminderModal({ open, org, invoices, onClose }: { open: boolean; org: OrganizationRow; invoices: InvoiceRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [channel, setChannel] = useState<"EMAIL" | "WHATSAPP" | "BOTH">("BOTH");
	const total = invoices.reduce((s, i) => s + i.amount - i.paid, 0);
	const [body, setBody] = useState("");
	useEffect(() => { if (open) setBody(`Dear ${org.contactName},\n\nA reminder that ${naira(total)} is outstanding on ${org.name}'s account at Simpas Ikeja (${invoices.map((i) => i.number).join(", ")}). Kindly settle by transfer to GTBank 0123456789 · Simpas Hotels Ltd.\n\nThank you,\nTunde Bakare`); }, [open, org, invoices, total]);
	return (
		<Modal open={open} onOpenChange={(o) => !o && onClose()} title="Send payment reminder" subtitle={`${org.contactName} · ${org.contactEmail} · ${org.contactPhone}`} icon={BellIcon} size="form"
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || invoices.length === 0} onClick={() => run(`Reminder sent to ${org.contactName}`, onClose)}>Send reminder</Button></>}
		>
			<div className="flex flex-col gap-4">
				{invoices.length === 0 ? <Note tone="success">Nothing to remind about · every invoice is paid.</Note> : <TotalsList rows={[...invoices.map((i) => ({ label: `${i.number} · due ${fmtDay(i.dueDate)}`, value: naira(i.amount - i.paid) })), { label: "Total outstanding", value: naira(total), strong: true, tone: "danger" }]} />}
				<ChoiceCards value={channel} onChange={setChannel} columns={3} options={[{ value: "EMAIL", label: "Email" }, { value: "WHATSAPP", label: "WhatsApp" }, { value: "BOTH", label: "Both" }]} />
				<TextareaField label="Message" value={body} onChange={setBody} rows={6} />
			</div>
		</Modal>
	);
}

export function StatementModal({ open, kind, org, stays, onClose, onInvoice }: { open: boolean; kind: "statement" | "invoice"; org: OrganizationRow; stays: BookingRow[]; onClose: () => void; onInvoice: (inv: InvoiceRow) => void }) {
	const { run, pending } = useDemoAction();
	const [from, setFrom] = useState(iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
	const [to, setTo] = useState(iso(new Date()));
	const [send, setSend] = useState(true);
	const inRange = stays.filter((b) => b.checkInDate >= from && b.checkInDate <= to && b.status !== "CANCELLED");
	const total = inRange.reduce((s, b) => s + b.totalAmount, 0);
	return (
		<Modal open={open} onOpenChange={(o) => !o && onClose()} title={kind === "invoice" ? "Create invoice" : "Create statement"} subtitle={`${org.name} · ${kind === "invoice" ? "bills the stays in the period" : "every stay, charge and payment in the period"}`} icon={FileTextIcon} size="form"
			footerInfo={`${plural(inRange.length, "stay")} · ${naira(total)}`}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || (kind === "invoice" && inRange.length === 0)} onClick={() => run(kind === "invoice" ? `Invoice drafted for ${naira(total)}${send ? " · sent for review" : ""}` : `Statement ${send ? `sent to ${org.contactEmail}` : "downloaded"}`, () => { if (kind === "invoice") onInvoice({ id: `inv-${Date.now()}`, number: `INV-2026-${String(Date.now()).slice(-5)}`, organizationId: org.id, organizationName: org.name, periodFrom: from, periodTo: to, amount: total, paid: 0, dueDate: iso(new Date(Date.now() + org.termsDays * 86400000)), status: "DRAFT" }); onClose(); })}>{kind === "invoice" ? "Create draft invoice" : send ? "Send statement" : "Download PDF"}</Button></>}
		>
			<div className="flex flex-col gap-4">
				<FieldRow><TextField label="From" type="date" value={from} onChange={setFrom} /><TextField label="To" type="date" value={to} onChange={setTo} /></FieldRow>
				<ul className="max-h-[200px] divide-y divide-line overflow-y-auto rounded-xl border border-line">
					{inRange.length === 0 ? <li className="px-3 py-3 text-xs text-ink-3">No stays in this period</li> : inRange.map((b) => <li key={b.id} className="flex items-center gap-3 px-3 py-2 text-[13px]"><span className="flex-1 font-medium text-ink">{b.guestName} · {b.roomNumber ?? b.roomTypeName}</span><span className="text-xs text-ink-3">{fmtDay(b.checkInDate)} · {plural(b.nights, "night")}</span><span className="font-semibold">{naira(b.totalAmount)}</span></li>)}
				</ul>
				<TotalsList rows={[{ label: "Room charges", value: naira(total) }, { label: kind === "invoice" ? `Due ${fmtDay(iso(new Date(Date.now() + org.termsDays * 86400000)))}` : "Total", value: naira(total), strong: true }]} />
				<ToggleField label={kind === "invoice" ? "Send to the owner for review before it goes out" : `Email to ${org.contactEmail}`} checked={send} onChange={setSend} />
			</div>
		</Modal>
	);
}

export function AddStaffPanel({ open, org, onClose, onSaved }: { open: boolean; org: OrganizationRow; onClose: () => void; onSaved: (m: OrgMemberRow) => void }) {
	const { run, pending } = useDemoAction();
	const [name, setName] = useState("");
	const [ref, setRef] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	useEffect(() => { if (open) { setName(""); setRef(""); setPhone(""); setEmail(""); } }, [open]);
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title={`Add staff · ${org.name}`} subtitle="Only people on the list can book on account" icon={UserPlusIcon}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name || !phone} onClick={() => run(`${name} can now book on ${org.name}'s account`, () => { onSaved({ id: `om-${Date.now()}`, fullName: name, staffRef: ref || "—", phone, email: email || undefined, active: true }); onClose(); })}>Add</Button></>}
		>
			<div className="flex flex-col gap-5">
				<TextField label="Full name" value={name} onChange={setName} required />
				<FieldRow><TextField label="Staff ID / ref" value={ref} onChange={setRef} placeholder="JB-10021" /><TextField label="Phone" value={phone} onChange={setPhone} required /></FieldRow>
				<TextField label="Email" value={email} onChange={setEmail} placeholder="Optional" />
				<Note tone="info">The front desk checks the name against this list at booking time.</Note>
			</div>
		</SidePanel>
	);
}

export function ImportStaffModal({ open, org, onClose, onSaved }: { open: boolean; org: OrganizationRow; onClose: () => void; onSaved: (ms: OrgMemberRow[]) => void }) {
	const { run, pending } = useDemoAction();
	const [text, setText] = useState("");
	const rows = text.split("\n").map((l) => l.split(",").map((c) => c.trim())).filter((c) => c[0]);
	return (
		<Modal open={open} onOpenChange={(o) => !o && onClose()} title="Import staff list" subtitle={`${org.name} · paste "Name, Staff ID, Phone" one per line, or upload the company's sheet`} icon={UploadIcon} size="large"
			footerInfo={`${plural(rows.length, "person", "people")} ready`}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || rows.length === 0} onClick={() => run(`${plural(rows.length, "person", "people")} added to ${org.name}`, () => { onSaved(rows.map((c, i) => ({ id: `om-${Date.now()}-${i}`, fullName: c[0], staffRef: c[1] ?? "—", phone: c[2] ?? "—", active: true }))); setText(""); onClose(); })}>Import</Button></>}
		>
			<div className="flex flex-col gap-4">
				<button type="button" onClick={() => setText("Adaeze Okoro, JB-20431, +234 802 000 1111\nSamuel Eze, JB-20432, +234 803 000 2222\nHauwa Bello, JB-20433, +234 805 000 3333")} className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-[13px] font-semibold text-ink-2 hover:bg-subtle"><UploadIcon className="size-5" /> Upload .xlsx or .csv <span className="text-xs font-normal text-ink-3">click to use a sample file</span></button>
				<TextareaField label="Or paste" value={text} onChange={setText} rows={5} placeholder="Chidinma Obi, JB-10021, +234 809 666 7777" />
				{rows.length > 0 && <ul className="divide-y divide-line rounded-xl border border-line">{rows.slice(0, 5).map((c, i) => <li key={i} className="flex gap-3 px-3 py-2 text-[13px]"><span className="flex-1 font-medium text-ink">{c[0]}</span><span className="text-ink-3">{c[1] ?? "—"}</span><span className="text-ink-3">{c[2] ?? "—"}</span></li>)}{rows.length > 5 && <li className="px-3 py-2 text-xs text-ink-3">+ {rows.length - 5} more</li>}</ul>}
			</div>
		</Modal>
	);
}

export function AgreementPanel({ open, org, onClose, onSaved }: { open: boolean; org: OrganizationRow; onClose: () => void; onSaved: (o: OrganizationRow) => void }) {
	const { run, pending } = useDemoAction();
	const [limit, setLimit] = useState<number | "">(org.creditLimit);
	const [cap, setCap] = useState<number | "">(org.dailyCap ?? "");
	const [terms, setTerms] = useState(String(org.termsDays));
	const [cycle, setCycle] = useState(org.billingCycle);
	const [notes, setNotes] = useState(org.agreementNotes ?? "");
	const [contact, setContact] = useState(org.contactName);
	const [email, setEmail] = useState(org.contactEmail);
	useEffect(() => { if (open) { setLimit(org.creditLimit); setCap(org.dailyCap ?? ""); setTerms(String(org.termsDays)); setCycle(org.billingCycle); setNotes(org.agreementNotes ?? ""); setContact(org.contactName); setEmail(org.contactEmail); } }, [open, org]);
	const raised = limit !== "" && limit > org.creditLimit;
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title="Edit agreement" subtitle={org.name} icon={PencilIcon}
			footerInfo={<span className="flex items-center gap-2"><ManagerMark /> {raised ? "raising the limit goes to the owner" : "logged"}</span>}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || limit === ""} onClick={() => limit !== "" && run(raised ? "Saved · new credit limit sent to the owner" : "Agreement updated", () => { onSaved({ ...org, creditLimit: raised ? org.creditLimit : limit, dailyCap: cap === "" ? undefined : cap, termsDays: Number(terms) || org.termsDays, billingCycle: cycle, agreementNotes: notes || undefined, contactName: contact, contactEmail: email }); onClose(); }, raised ? { tone: "info" } : undefined)}>Save changes</Button></>}
		>
			<div className="flex flex-col gap-6">
				<PanelSection title="Contact"><FieldRow><TextField label="Contact person" value={contact} onChange={setContact} /><TextField label="Billing email" value={email} onChange={setEmail} /></FieldRow></PanelSection>
				<PanelSection title="Credit & billing">
					<FieldRow><MoneyField label="Credit limit" value={limit} onChange={setLimit} hint={raised ? "Higher than now · owner approves" : undefined} /><MoneyField label="Daily cap per room-night" value={cap} onChange={setCap} hint="Leave empty for none" /></FieldRow>
					<FieldRow><SelectField label="Pays within" value={terms} onChange={setTerms} options={[{ value: "14", label: "14 days" }, { value: "30", label: "30 days" }, { value: "45", label: "45 days" }, { value: "60", label: "60 days" }]} /><SelectField label="Invoice cycle" value={cycle} onChange={setCycle} options={["Monthly", "Twice a month", "Per stay"]} /></FieldRow>
				</PanelSection>
				<TextareaField label="What the agreement covers" value={notes} onChange={setNotes} rows={3} />
				<WhatHappens items={["New terms apply to bookings from today", "Open invoices keep their due dates", "The company's contact gets the updated agreement by email"]} />
			</div>
		</SidePanel>
	);
}
