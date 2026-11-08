"use client";

import { ArrowRightLeftIcon, CreditCardIcon, PlusIcon, PrinterIcon, ReceiptIcon, ScissorsIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, MoneyField, SelectField, TextField, ToggleField } from "@/components/shared/field";
import { naira } from "@/components/shared/format";
import { Modal } from "@/components/shared/modal";
import { ManagerMark } from "@/components/shared/row-actions";
import { WhatHappens } from "@/components/shared/side-panel";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { FolioLine, FolioRow, PaymentMethod } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export type FolioAction = "charge" | "discount" | "split" | "transfer" | "payment" | "print";

type Patch = (id: string, fn: (f: FolioRow) => FolioRow) => void;
const now = () => new Date().toISOString();
const addLine = (f: FolioRow, line: FolioLine): FolioRow => {
	const sign = line.kind === "CHARGE" ? 1 : -1;
	return { ...f, lines: [...f.lines, line], charges: line.kind === "CHARGE" ? f.charges + line.amount : f.charges, tax: f.tax + line.tax, discounts: line.kind === "DISCOUNT" ? f.discounts + line.amount : f.discounts, payments: line.kind === "PAYMENT" ? f.payments + line.amount : f.payments, balance: f.balance + sign * (line.amount + line.tax) };
};

export function FolioModals({ folio, action, others, onClose, onPatch }: { folio: FolioRow | null; action: FolioAction | null; others: FolioRow[]; onClose: () => void; onPatch: Patch }) {
	if (!folio || !action) return null;
	switch (action) {
		case "charge": return <PostChargeModal f={folio} onClose={onClose} onPatch={onPatch} />;
		case "discount": return <DiscountModal f={folio} onClose={onClose} onPatch={onPatch} />;
		case "payment": return <FolioPaymentModal f={folio} onClose={onClose} onPatch={onPatch} />;
		case "split": return <SplitModal f={folio} onClose={onClose} />;
		case "transfer": return <TransferModal f={folio} others={others} onClose={onClose} onPatch={onPatch} />;
		case "print": return <PrintModal f={folio} onClose={onClose} />;
	}
}

const categories = ["Accommodation", "Food", "Bar", "Laundry", "Minibar", "Late check-out", "Damage", "Other"];

function PostChargeModal({ f, onClose, onPatch }: { f: FolioRow; onClose: () => void; onPatch: Patch }) {
	const { run, pending } = useDemoAction();
	const [category, setCategory] = useState("Other");
	const [desc, setDesc] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [vat, setVat] = useState(false);
	const tax = vat && amount !== "" ? Math.round(amount * 0.075) : 0;
	return (
		<Modal open onOpenChange={(o) => !o && onClose()} title="Post a charge" subtitle={`${f.guestName} · ${f.roomNumber} · folio ${f.reference}`} icon={PlusIcon} size="form"
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !desc || amount === ""} onClick={() => amount !== "" && run(`${naira(amount + tax)} posted to ${f.roomNumber}`, () => { onPatch(f.id, (x) => addLine(x, { id: `l-${Date.now()}`, kind: "CHARGE", description: desc, category, amount, tax, postedAt: now(), postedBy: "Tunde Bakare", source: "MANAGER" })); onClose(); })}>Post charge</Button></>}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Category" value={category} onChange={setCategory} setupLink="charge categories" options={categories} />
				<TextField label="Description" value={desc} onChange={setDesc} placeholder="e.g. Broken lamp · A325" required />
				<FieldRow><MoneyField label="Amount" value={amount} onChange={setAmount} required /><div className="pt-6"><ToggleField label="Add 7.5% VAT" checked={vat} onChange={setVat} /></div></FieldRow>
				<TotalsList rows={[{ label: "Balance now", value: naira(f.balance) }, { label: "After this charge", value: naira(f.balance + (amount === "" ? 0 : amount) + tax), strong: true }]} />
			</div>
		</Modal>
	);
}

function DiscountModal({ f, onClose, onPatch }: { f: FolioRow; onClose: () => void; onPatch: Patch }) {
	const { run, pending } = useDemoAction();
	const [mode, setMode] = useState<"amount" | "percent">("amount");
	const [amount, setAmount] = useState<number | "">("");
	const [pct, setPct] = useState("10");
	const [reason, setReason] = useState("");
	const value = mode === "amount" ? (amount === "" ? 0 : amount) : Math.round((f.charges * (Number(pct) || 0)) / 100);
	const needsOwner = value > 50000;
	return (
		<Modal open onOpenChange={(o) => !o && onClose()} title="Add a discount" subtitle={`${f.guestName} · charges ${naira(f.charges + f.tax)}`} icon={ReceiptIcon} size="form"
			footerInfo={<span className="flex items-center gap-2"><ManagerMark /> {needsOwner ? "over ₦50,000 · owner approves" : "logged"}</span>}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || value <= 0 || !reason} onClick={() => run(needsOwner ? "Discount sent to the owner for approval" : `${naira(value)} discount applied`, () => { if (!needsOwner) onPatch(f.id, (x) => addLine(x, { id: `l-${Date.now()}`, kind: "DISCOUNT", description: `Discount · ${reason}`, category: "Discount", amount: value, tax: 0, postedAt: now(), postedBy: "Tunde Bakare", source: "MANAGER" })); onClose(); }, needsOwner ? { tone: "info" } : undefined)}>{needsOwner ? "Send to owner" : "Apply discount"}</Button></>}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards value={mode} onChange={setMode} columns={2} options={[{ value: "amount", label: "Fixed amount" }, { value: "percent", label: "Percent of charges" }]} />
				{mode === "amount" ? <MoneyField label="Discount" value={amount} onChange={setAmount} /> : <TextField label="Percent" type="number" value={pct} onChange={setPct} hint={`= ${naira(value)}`} />}
				<SelectField label="Reason" value={reason} onChange={setReason} setupLink="reasons" options={["Service recovery · complaint", "Repeat guest", "Corporate rate", "Owner's guest", "Other"]} />
				<TotalsList rows={[{ label: "Balance now", value: naira(f.balance) }, { label: "After discount", value: naira(f.balance - value), strong: true, tone: "success" }]} />
				{needsOwner && <Note tone="warning">Discounts over ₦50,000 go to the owner before they apply.</Note>}
			</div>
		</Modal>
	);
}

function FolioPaymentModal({ f, onClose, onPatch }: { f: FolioRow; onClose: () => void; onPatch: Patch }) {
	const { run, pending } = useDemoAction();
	const [amount, setAmount] = useState<number | "">(f.balance > 0 ? f.balance : "");
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	const [receipt, setReceipt] = useState<"WHATSAPP" | "EMAIL" | "NONE">("WHATSAPP");
	return (
		<Modal open onOpenChange={(o) => !o && onClose()} title="Record payment" subtitle={`${f.guestName} · ${f.roomNumber} · ${naira(f.balance)} due`} icon={CreditCardIcon} size="form"
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || amount === "" || amount <= 0} onClick={() => amount !== "" && run(`${naira(amount)} recorded by ${method.toLowerCase()}`, () => { onPatch(f.id, (x) => addLine(x, { id: `l-${Date.now()}`, kind: "PAYMENT", description: `Payment by ${method.toLowerCase()}`, category: "Payment", amount, tax: 0, postedAt: now(), postedBy: "Tunde Bakare", source: "PAYMENT" })); onClose(); })}>{method === "CARD" ? "Send to POS" : "Record payment"}</Button></>}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards label="Paid by" value={method} onChange={setMethod} columns={3} options={[{ value: "CARD", label: "Card · POS" }, { value: "TRANSFER", label: "Transfer" }, { value: "CASH", label: "Cash" }]} />
				<MoneyField label="Amount" value={amount} onChange={setAmount} required />
				<ChoiceCards label="Receipt" value={receipt} onChange={setReceipt} columns={3} options={[{ value: "WHATSAPP", label: "WhatsApp" }, { value: "EMAIL", label: "Email", disabled: !f.guestEmail }, { value: "NONE", label: "None" }]} />
			</div>
		</Modal>
	);
}

function SplitModal({ f, onClose }: { f: FolioRow; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const charges = f.lines.filter((l) => l.kind === "CHARGE" && !l.voided);
	const [picked, setPicked] = useState<string[]>([]);
	const [payer, setPayer] = useState("");
	const total = charges.filter((l) => picked.includes(l.id)).reduce((s, l) => s + l.amount + l.tax, 0);
	return (
		<Modal open onOpenChange={(o) => !o && onClose()} title="Split folio" subtitle="Move some lines to a second folio with its own payer" icon={ScissorsIcon} size="large"
			footerInfo={`${picked.length} lines · ${naira(total)}`}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || picked.length === 0 || !payer} onClick={() => run(`New folio opened for ${payer} · ${naira(total)}`, onClose)}>Split</Button></>}
		>
			<div className="flex flex-col gap-4">
				<TextField label="Second folio is paid by" value={payer} onChange={setPayer} placeholder="e.g. Shell Nigeria or a second guest" required />
				<ul className="divide-y divide-line rounded-xl border border-line">
					{charges.map((l) => { const on = picked.includes(l.id); return (
						<li key={l.id}><button type="button" onClick={() => setPicked((p) => (on ? p.filter((x) => x !== l.id) : [...p, l.id]))} className={cn("flex w-full items-center gap-3 px-3 py-2 text-left text-[13px]", on && "bg-brand-soft/40")}>
							<span className={cn("flex size-4 items-center justify-center rounded border", on ? "border-brand bg-brand text-white" : "border-line-strong")}>{on && "✓"}</span>
							<span className="flex-1 font-medium text-ink">{l.description}</span><span className="text-ink-2">{naira(l.amount + l.tax)}</span>
						</button></li>); })}
				</ul>
				<WhatHappens items={["The picked lines move to a new folio", `${f.guestName}'s folio keeps the rest`, "Each folio is paid and closed on its own"]} />
			</div>
		</Modal>
	);
}

function TransferModal({ f, others, onClose, onPatch }: { f: FolioRow; others: FolioRow[]; onClose: () => void; onPatch: Patch }) {
	const { run, pending } = useDemoAction();
	const [target, setTarget] = useState("");
	const [whole, setWhole] = useState(true);
	const to = others.find((o) => o.id === target);
	return (
		<Modal open onOpenChange={(o) => !o && onClose()} title="Transfer charges" subtitle={`From ${f.guestName} · ${f.roomNumber}`} icon={ArrowRightLeftIcon} size="form"
			footerInfo={<span className="flex items-center gap-2"><ManagerMark /> logged</span>}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !to} onClick={() => to && run(`${naira(f.balance)} moved to ${to.guestName} · ${to.roomNumber}`, () => { onPatch(f.id, (x) => ({ ...x, balance: 0, payments: x.payments + f.balance, lines: [...x.lines, { id: `l-${Date.now()}`, kind: "PAYMENT" as const, description: `Transferred to ${to.guestName} · ${to.roomNumber}`, category: "Transfer", amount: f.balance, tax: 0, postedAt: now(), postedBy: "Tunde Bakare", source: "MANAGER" }] })); onPatch(to.id, (x) => addLine(x, { id: `l-${Date.now() + 1}`, kind: "CHARGE", description: `Transferred from ${f.guestName} · ${f.roomNumber}`, category: "Transfer", amount: f.balance, tax: 0, postedAt: now(), postedBy: "Tunde Bakare", source: "MANAGER" })); onClose(); })}>Transfer {naira(f.balance)}</Button></>}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="To folio" value={target} onChange={setTarget} options={others.map((o) => ({ value: o.id, label: `${o.guestName} · ${o.roomNumber}`, hint: `${naira(o.balance)} balance${o.organizationName ? ` · ${o.organizationName}` : ""}` }))} placeholder="Choose a guest in house" />
				<ChoiceCards value={whole ? "all" : "some"} onChange={(v) => setWhole(v === "all")} columns={2} options={[{ value: "all", label: "Whole balance", hint: naira(f.balance) }, { value: "some", label: "Pick lines", hint: "Use Split for that" , disabled: true }]} />
				<WhatHappens items={[`${f.guestName}'s folio balance goes to ₦0`, `${to?.guestName ?? "The other guest"} pays it at check-out`, "Both guests see it on their bill"]} />
			</div>
		</Modal>
	);
}

function PrintModal({ f, onClose }: { f: FolioRow; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [how, setHow] = useState<"print" | "email" | "whatsapp">("print");
	const [detail, setDetail] = useState(true);
	return (
		<Modal open onOpenChange={(o) => !o && onClose()} title="Print or send the folio" subtitle={`${f.guestName} · ${f.reference}`} icon={PrinterIcon} size="confirm"
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run(how === "print" ? "Sent to the front desk printer" : `Folio sent by ${how === "email" ? "email" : "WhatsApp"}`, onClose)}>{how === "print" ? "Print" : "Send"}</Button></>}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards value={how} onChange={setHow} columns={3} options={[{ value: "print", label: "Print", hint: "Front desk" }, { value: "email", label: "Email", hint: f.guestEmail ?? "No email", disabled: !f.guestEmail }, { value: "whatsapp", label: "WhatsApp", hint: f.guestPhone ?? "No phone", disabled: !f.guestPhone }]} />
				<ToggleField label="Show every line" hint="Off = totals by category only" checked={detail} onChange={setDetail} />
			</div>
		</Modal>
	);
}
