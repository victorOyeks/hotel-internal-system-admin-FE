"use client";

import {
	CreditCardIcon,
	FileTextIcon,
	HandshakeIcon,
	PencilIcon,
	UploadIcon,
	UserPlusIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@hospio/ui/primitives/button";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import {
	addOrgMember,
	createOrganization,
	createOrgInvoice,
	importOrgMembers,
	type OrganizationInput,
	recordOrgPayment,
	updateOrganization,
} from "@hospio/api/actions/organizations";
import { useAction } from "@hospio/api/actions/use-action";
import {
	BILLING_CYCLES,
	billingCycleCode,
} from "@hospio/api/data/mappers/organizations";
import type {
	FolioRow,
	InvoiceRow,
	OrgMemberRow,
	OrganizationRow,
} from "@hospio/api/data/types";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const TERMS = [
	{ value: "14", label: "14 days" },
	{ value: "30", label: "30 days" },
	{ value: "45", label: "45 days" },
	{ value: "60", label: "60 days" },
];
const CYCLES = BILLING_CYCLES.map((c) => ({ value: c.value, label: c.label }));
const termsOptions = (days: number) =>
	TERMS.some((t) => t.value === String(days))
		? TERMS
		: [...TERMS, { value: String(days), label: `${days} days` }];

const OWNER_LIMIT_NOTE =
	"A credit limit above what managers may set goes to the owner to approve · the rest saves now";
/** What the save says: the limit applied, or waiting for the owner. */
const savedMessage = (o: OrganizationRow, done: string) =>
	o.requestedCreditLimit != null
		? `${done} · the credit limit of ${naira(o.requestedCreditLimit)} is waiting for the owner`
		: done;

export function NewOrganizationPanel({
	open,
	onClose,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	onSaved: (o: OrganizationRow) => void;
}) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [contact, setContact] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [limit, setLimit] = useState<number | "">(1000000);
	const [cap, setCap] = useState<number | "">("");
	const [terms, setTerms] = useState("30");
	const [cycle, setCycle] = useState("MONTHLY");
	const [notes, setNotes] = useState("");
	useEffect(() => {
		if (open) {
			setName("");
			setContact("");
			setPhone("");
			setEmail("");
			setLimit(1000000);
			setCap("");
			setTerms("30");
			setCycle("MONTHLY");
			setNotes("");
		}
	}, [open]);
	const save = () => {
		if (limit === "") return;
		const input: OrganizationInput = {
			name,
			contactName: contact,
			contactPhone: phone,
			contactEmail: email,
			creditLimit: limit,
			dailyCap: cap === "" ? undefined : cap,
			billingCycle: cycle,
			termsDays: Number(terms) || 30,
			agreementNotes: notes,
		};
		const fallback: OrganizationRow = {
			id: `org-${Date.now()}`,
			name,
			contactName: contact,
			contactPhone: phone,
			contactEmail: email,
			creditLimit: limit,
			dailyCap: input.dailyCap,
			billingCycle: cycle,
			termsDays: input.termsDays,
			status: "ACTIVE",
			outstanding: 0,
			staffCount: 0,
			staysThisMonth: 0,
			agreementNotes: notes || undefined,
			since: iso(new Date()),
		};
		run(
			() => createOrganization(input, fallback),
			(o) => savedMessage(o, `${name} added`),
			(o) => {
				onSaved(o);
				onClose();
			},
		);
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			width="lg"
			title="New organization"
			subtitle="A company whose staff book on account and pay by invoice"
			icon={HandshakeIcon}
			footerInfo={
				<span className="flex items-center gap-2">
					<ManagerMark /> {OWNER_LIMIT_NOTE}
				</span>
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={
							pending ||
							!name.trim() ||
							!contact.trim() ||
							!phone.trim() ||
							limit === ""
						}
						onClick={save}
					>
						Save organization
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-6">
				<PanelSection title="Company">
					<TextField
						label="Company name"
						value={name}
						onChange={setName}
						placeholder="Zenith Bank Plc"
						required
					/>
					<FieldRow>
						<TextField
							label="Contact person"
							value={contact}
							onChange={setContact}
							placeholder="Travel desk"
							required
						/>
						<TextField
							label="Phone"
							value={phone}
							onChange={setPhone}
							placeholder="+234 80…"
							required
						/>
					</FieldRow>
					<TextField
						label="Billing email"
						value={email}
						onChange={setEmail}
						placeholder="accounts@company.com"
					/>
				</PanelSection>
				<PanelSection title="Credit & billing">
					<FieldRow>
						<MoneyField
							label="Credit limit"
							value={limit}
							onChange={setLimit}
							required
							hint="Bookings stop when this is reached"
						/>
						<MoneyField
							label="Daily cap per room-night"
							value={cap}
							onChange={setCap}
							hint="Optional · guest pays anything above"
						/>
					</FieldRow>
					<FieldRow>
						<SelectField
							label="Pays within"
							value={terms}
							onChange={setTerms}
							options={TERMS}
						/>
						<SelectField
							label="Invoice cycle"
							value={cycle}
							onChange={setCycle}
							options={CYCLES}
						/>
					</FieldRow>
				</PanelSection>
				<TextareaField
					label="What the agreement covers"
					value={notes}
					onChange={setNotes}
					placeholder="e.g. Deluxe at ₦42,000 · breakfast included · bar not covered"
					rows={3}
				/>
				<WhatHappens
					items={[
						"The company appears in New booking → Organization",
						"Add the staff who can book on its account",
						"You create its invoices from the account when you bill",
					]}
				/>
			</div>
		</SidePanel>
	);
}

export function OrgPaymentModal({
	open,
	org,
	invoices,
	onClose,
	onSaved,
}: {
	open: boolean;
	org: OrganizationRow;
	invoices: InvoiceRow[];
	onClose: () => void;
	onSaved: (invoiceId: string, amount: number) => void;
}) {
	const { run, pending } = useAction();
	const [invoiceId, setInvoiceId] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [method, setMethod] = useState<"TRANSFER" | "CARD" | "CASH">(
		"TRANSFER",
	);
	const [ref, setRef] = useState("");
	useEffect(() => {
		if (open) {
			const first = invoices[0];
			setInvoiceId(first?.id ?? "");
			setAmount(first ? first.amount - first.paid : "");
			setRef("");
		}
	}, [open, invoices]);
	const inv = invoices.find((i) => i.id === invoiceId);
	const save = () => {
		if (!inv || amount === "") return;
		run(
			() =>
				recordOrgPayment(org.id, {
					amount,
					method,
					reference: ref,
					invoiceId: inv.id,
				}),
			`${naira(amount)} recorded against ${inv.number}`,
			() => {
				onSaved(inv.id, amount);
				onClose();
			},
		);
	};
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Record payment"
			subtitle={`${org.name} · ${naira(org.outstanding)} outstanding`}
			icon={CreditCardIcon}
			size="form"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !inv || amount === "" || amount <= 0}
						onClick={save}
					>
						Record payment
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Invoice"
					value={invoiceId}
					onChange={(v) => {
						setInvoiceId(v);
						const i = invoices.find((x) => x.id === v);
						if (i) setAmount(i.amount - i.paid);
					}}
					options={invoices.map((i) => ({
						value: i.id,
						label: i.number,
						hint: `${naira(i.amount - i.paid)} left · due ${fmtDay(i.dueDate)}`,
					}))}
					placeholder={
						invoices.length ? "Choose an invoice" : "No open invoices"
					}
				/>
				<ChoiceCards
					label="Paid by"
					value={method}
					onChange={setMethod}
					columns={3}
					options={[
						{ value: "TRANSFER", label: "Transfer" },
						{ value: "CARD", label: "Card" },
						{ value: "CASH", label: "Cash" },
					]}
				/>
				<FieldRow>
					<MoneyField
						label="Amount"
						value={amount}
						onChange={setAmount}
						required
					/>
					<TextField
						label="Reference"
						value={ref}
						onChange={setRef}
						placeholder="Bank alert / cheque no."
					/>
				</FieldRow>
				{inv && amount !== "" && (
					<TotalsList
						rows={[
							{
								label: `${inv.number} left`,
								value: naira(inv.amount - inv.paid),
							},
							{
								label: "After this payment",
								value: naira(Math.max(0, inv.amount - inv.paid - amount)),
								strong: true,
								tone:
									inv.amount - inv.paid - amount <= 0 ? "success" : undefined,
							},
						]}
					/>
				)}
				{invoices.length === 0 && (
					<Note tone="info">
						Create an invoice first · payments are recorded against an invoice.
					</Note>
				)}
			</div>
		</Modal>
	);
}

/**
 * Create invoice: folio-service bills what is still owed on the account's folios opened in the period
 * (dates in UTC, as the service counts them), numbers it and marks it sent. Nothing is emailed.
 */
export function InvoiceModal({
	open,
	org,
	stays,
	onClose,
	onInvoice,
}: {
	open: boolean;
	org: OrganizationRow;
	stays: FolioRow[];
	onClose: () => void;
	onInvoice: (inv: InvoiceRow) => void;
}) {
	const { run, pending } = useAction();
	const [from, setFrom] = useState(
		iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
	);
	const [to, setTo] = useState(iso(new Date()));
	const inRange = stays.filter(
		(f) => f.openedAt.slice(0, 10) >= from && f.openedAt.slice(0, 10) <= to,
	);
	const total = inRange.reduce((s, f) => s + f.balance, 0);
	const due = iso(new Date(Date.now() + org.termsDays * 86400000));
	const save = () => {
		const fallback: InvoiceRow = {
			id: `inv-${Date.now()}`,
			number: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
			organizationId: org.id,
			organizationName: org.name,
			periodFrom: from,
			periodTo: to,
			amount: total,
			paid: 0,
			dueDate: due,
			status: "SENT",
		};
		run(
			() =>
				createOrgInvoice(
					org.id,
					org.name,
					{ periodFrom: from, periodTo: to },
					fallback,
				),
			"Invoice created",
			(inv) => {
				toast.info(
					`${inv.number} · ${naira(inv.amount)} due ${fmtDay(inv.dueDate)} · marked sent, nothing was emailed`,
				);
				onInvoice(inv);
				onClose();
			},
		);
	};
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Create invoice"
			subtitle={`${org.name} · bills what is still owed on the stays opened in the period`}
			icon={FileTextIcon}
			size="form"
			footerInfo={`${plural(inRange.length, "stay")} · ${naira(total)} owed`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={
							pending || !from || !to || from > to || inRange.length === 0
						}
						onClick={save}
					>
						Create invoice
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<TextField label="From" type="date" value={from} onChange={setFrom} />
					<TextField label="To" type="date" value={to} onChange={setTo} />
				</FieldRow>
				<ul className="max-h-[200px] divide-y divide-line overflow-y-auto rounded-xl border border-line">
					{inRange.length === 0 ? (
						<li className="px-3 py-3 text-xs text-ink-3">
							No stays opened in this period
						</li>
					) : (
						inRange.map((f) => (
							<li
								key={f.id}
								className="flex items-center gap-3 px-3 py-2 text-[13px]"
							>
								<span className="flex-1 font-medium text-ink">
									{f.guestName} · {f.roomNumber || "—"}
								</span>
								<span className="text-xs text-ink-3">
									{fmtDay(f.openedAt.slice(0, 10))}
									{f.status === "OPEN" ? " · in house" : ""}
								</span>
								<span className="font-semibold">{naira(f.balance)}</span>
							</li>
						))
					)}
				</ul>
				<TotalsList
					rows={[
						{ label: "Still owed on these stays", value: naira(total) },
						{ label: `Due ${fmtDay(due)}`, value: naira(total), strong: true },
					]}
				/>
				<Note tone="info">
					The invoice is numbered and marked sent straight away. It is not
					emailed to {org.contactEmail || "the company"} · send it yourself.
				</Note>
			</div>
		</Modal>
	);
}

export function AddStaffPanel({
	open,
	org,
	onClose,
	onSaved,
}: {
	open: boolean;
	org: OrganizationRow;
	onClose: () => void;
	onSaved: (m: OrgMemberRow) => void;
}) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [ref, setRef] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	useEffect(() => {
		if (open) {
			setName("");
			setRef("");
			setPhone("");
			setEmail("");
		}
	}, [open]);
	const save = () => {
		const fallback: OrgMemberRow = {
			id: `om-${Date.now()}`,
			fullName: name,
			staffRef: ref || "—",
			phone,
			email: email || undefined,
			active: true,
		};
		run(
			() =>
				addOrgMember(
					org.id,
					{ fullName: name, staffRef: ref, phone, email },
					fallback,
				),
			`${name} can now book on ${org.name}'s account`,
			(m) => {
				onSaved(m);
				onClose();
			},
		);
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Add staff · ${org.name}`}
			subtitle="Only people on the list can book on account"
			icon={UserPlusIcon}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !name.trim() || !phone.trim()}
						onClick={save}
					>
						Add
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<TextField label="Full name" value={name} onChange={setName} required />
				<FieldRow>
					<TextField
						label="Staff ID / ref"
						value={ref}
						onChange={setRef}
						placeholder="JB-10021"
					/>
					<TextField label="Phone" value={phone} onChange={setPhone} required />
				</FieldRow>
				<TextField
					label="Email"
					value={email}
					onChange={setEmail}
					placeholder="Optional"
				/>
				<Note tone="info">
					The front desk checks the name against this list at booking time.
				</Note>
			</div>
		</SidePanel>
	);
}

export function ImportStaffModal({
	open,
	org,
	onClose,
	onSaved,
}: {
	open: boolean;
	org: OrganizationRow;
	onClose: () => void;
	onSaved: (ms: OrgMemberRow[]) => void;
}) {
	const { run, pending } = useAction();
	const [text, setText] = useState("");
	const rows = text
		.split("\n")
		.map((l) => l.split(",").map((c) => c.trim()))
		.filter((c) => c[0]);
	const save = () => {
		const input = rows.map((c) => ({
			fullName: c[0],
			staffRef: c[1],
			phone: c[2],
			email: c[3],
		}));
		const fallback: OrgMemberRow[] = rows.map((c, i) => ({
			id: `om-${Date.now()}-${i}`,
			fullName: c[0],
			staffRef: c[1] || "—",
			phone: c[2] || "—",
			email: c[3] || undefined,
			active: true,
		}));
		run(
			() => importOrgMembers(org.id, input, fallback),
			`${plural(rows.length, "person", "people")} added to ${org.name}`,
			(ms) => {
				onSaved(ms);
				setText("");
				onClose();
			},
		);
	};
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Import staff list"
			subtitle={`${org.name} · paste "Name, Staff ID, Phone, Email" one per line`}
			icon={UploadIcon}
			size="large"
			footerInfo={`${plural(rows.length, "person", "people")} ready`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || rows.length === 0}
						onClick={save}
					>
						Import
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextareaField
					label="Paste the list"
					value={text}
					onChange={setText}
					rows={6}
					placeholder="Chidinma Obi, JB-10021, +234 809 666 7777, chidinma@company.com"
					hint="Copy the columns from the company's sheet · staff ID, phone and email are optional"
				/>
				{rows.length > 0 && (
					<ul className="divide-y divide-line rounded-xl border border-line">
						{rows.slice(0, 5).map((c, i) => (
							<li
								key={`${c[0]}-${i}`}
								className="flex gap-3 px-3 py-2 text-[13px]"
							>
								<span className="flex-1 font-medium text-ink">{c[0]}</span>
								<span className="text-ink-3">{c[1] || "—"}</span>
								<span className="text-ink-3">{c[2] || "—"}</span>
							</li>
						))}
						{rows.length > 5 && (
							<li className="px-3 py-2 text-xs text-ink-3">
								+ {rows.length - 5} more
							</li>
						)}
					</ul>
				)}
			</div>
		</Modal>
	);
}

export function AgreementPanel({
	open,
	org,
	onClose,
	onSaved,
}: {
	open: boolean;
	org: OrganizationRow;
	onClose: () => void;
	onSaved: (o: OrganizationRow) => void;
}) {
	const { run, pending } = useAction();
	const [limit, setLimit] = useState<number | "">(org.creditLimit);
	const [cap, setCap] = useState<number | "">(org.dailyCap ?? "");
	const [terms, setTerms] = useState(String(org.termsDays));
	const [cycle, setCycle] = useState(billingCycleCode(org.billingCycle));
	const [notes, setNotes] = useState(org.agreementNotes ?? "");
	const [contact, setContact] = useState(org.contactName);
	const [phone, setPhone] = useState(org.contactPhone);
	const [email, setEmail] = useState(org.contactEmail);
	useEffect(() => {
		if (open) {
			setLimit(org.creditLimit);
			setCap(org.dailyCap ?? "");
			setTerms(String(org.termsDays));
			setCycle(billingCycleCode(org.billingCycle));
			setNotes(org.agreementNotes ?? "");
			setContact(org.contactName);
			setPhone(org.contactPhone);
			setEmail(org.contactEmail);
		}
	}, [open, org]);
	const raised = limit !== "" && limit > org.creditLimit;
	const save = () => {
		if (limit === "") return;
		const input: OrganizationInput = {
			name: org.name,
			contactName: contact,
			contactPhone: phone,
			contactEmail: email,
			address: org.address,
			creditLimit: limit,
			dailyCap: cap === "" ? undefined : cap,
			billingCycle: cycle,
			termsDays: Number(terms) || org.termsDays,
			agreementNotes: notes,
		};
		run(
			() => updateOrganization(org.id, input, org),
			(o) => savedMessage(o, "Agreement updated"),
			(o) => {
				onSaved(o);
				onClose();
			},
		);
	};
	const cycles = CYCLES.some((c) => c.value === cycle)
		? CYCLES
		: [...CYCLES, { value: cycle, label: cycle }];
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Edit agreement"
			subtitle={org.name}
			icon={PencilIcon}
			footerInfo={
				<span className="flex items-center gap-2">
					<ManagerMark />{" "}
					{raised ? OWNER_LIMIT_NOTE : "Saved on the account straight away"}
				</span>
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || limit === ""}
						onClick={save}
					>
						Save changes
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-6">
				<PanelSection title="Contact">
					<FieldRow>
						<TextField
							label="Contact person"
							value={contact}
							onChange={setContact}
						/>
						<TextField label="Phone" value={phone} onChange={setPhone} />
					</FieldRow>
					<TextField label="Billing email" value={email} onChange={setEmail} />
				</PanelSection>
				<PanelSection title="Credit & billing">
					<FieldRow>
						<MoneyField
							label="Credit limit"
							value={limit}
							onChange={setLimit}
							hint={
								raised
									? "Higher than now · above what managers may set, it goes to the owner"
									: undefined
							}
						/>
						<MoneyField
							label="Daily cap per room-night"
							value={cap}
							onChange={setCap}
							hint="Leave empty for none"
						/>
					</FieldRow>
					<FieldRow>
						<SelectField
							label="Pays within"
							value={terms}
							onChange={setTerms}
							options={termsOptions(org.termsDays)}
						/>
						<SelectField
							label="Invoice cycle"
							value={cycle}
							onChange={setCycle}
							options={cycles}
						/>
					</FieldRow>
				</PanelSection>
				<TextareaField
					label="What the agreement covers"
					value={notes}
					onChange={setNotes}
					rows={3}
				/>
				<WhatHappens
					items={[
						"New terms apply to bookings from now",
						"Invoices already created keep their due dates",
						"The company is not emailed · tell them yourself",
					]}
				/>
			</div>
		</SidePanel>
	);
}
