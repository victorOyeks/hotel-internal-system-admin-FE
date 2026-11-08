"use client";

import { AlertTriangleIcon, ArrowRightLeftIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { FieldRow, MoneyField, SelectField, TextField, ToggleField } from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs, useTabParam } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { ownerBusiness } from "@hospio/api/demo/fixtures/owner";

type Tab = "company" | "taxes" | "limits" | "transfer";

export function OwnerSettings({ business }: { business: typeof ownerBusiness }) {
	const [tab] = useTabParam<Tab>("company");
	const [name, setName] = useState(business.name);
	const [address, setAddress] = useState(business.address);
	const [vat, setVat] = useState(String(business.vat));
	const [service, setService] = useState(String(business.serviceCharge));
	const [currency, setCurrency] = useState(business.currency);
	const [spend, setSpend] = useState<number | "">(business.spendLimit);
	const [discount, setDiscount] = useState<number | "">(business.discountLimit);
	const [mgr, setMgr] = useState<number | "">(business.managerExpenseLimit);
	const [twoStep, setTwoStep] = useState(true);
	const [transfer, setTransfer] = useState(false);
	const [confirm, setConfirm] = useState(false);
	const [newOwner, setNewOwner] = useState("");
	const { run, pending } = useDemoAction();
	const save = (what: string) => <Button className={btn.primary} disabled={pending} onClick={() => run(`${what} saved`)}>Save changes</Button>;

	return (
		<>
			<PageHeader title="Settings" subtitle="Company, taxes, approval limits and ownership · applies to every hotel" />
			<PillTabs param="tab" tabs={[{ key: "company", label: "Company" }, { key: "taxes", label: "Taxes & currency" }, { key: "limits", label: "Approval limits" }, { key: "transfer", label: "Transfer ownership" }]} />

			{tab === "company" && (
				<SectionCard title="Company" subtitle="Shown on invoices, receipts and statements" bodyClassName="max-w-2xl gap-4 pt-3">
					<FieldRow><TextField label="Company name" value={name} onChange={setName} /><TextField label="RC number" value={business.rcNumber} onChange={() => undefined} /></FieldRow>
					<TextField label="Registered address" value={address} onChange={setAddress} />
					<FieldRow><TextField label="Owner" value={business.ownerName} onChange={() => undefined} disabled /><TextField label="Email" value={business.email} onChange={() => undefined} /></FieldRow>
					<ToggleField label="Require 2-step login for every portal user" hint="Managers and finance must set it up at next sign-in" checked={twoStep} onChange={setTwoStep} />
					<div className="flex justify-end">{save("Company")}</div>
				</SectionCard>
			)}
			{tab === "taxes" && (
				<SectionCard title="Taxes & currency" subtitle="Hotels cannot change these" bodyClassName="max-w-2xl gap-4 pt-3">
					<SelectField label="Currency" value={currency} onChange={setCurrency} options={[{ value: "NGN", label: "Naira (₦)" }, { value: "GHS", label: "Ghana cedi (₵)" }, { value: "USD", label: "US dollar ($)" }]} />
					<FieldRow><TextField label="VAT on food & drink (%)" value={vat} onChange={setVat} type="number" /><TextField label="Service charge (%)" value={service} onChange={setService} type="number" /></FieldRow>
					<ToggleField label="Room rates include VAT" hint="Off: VAT is added on the folio" checked onChange={() => undefined} />
					<Note tone="info">Changing VAT applies to new charges only. Open folios keep their posted amounts.</Note>
					<div className="flex justify-end">{save("Taxes")}</div>
				</SectionCard>
			)}
			{tab === "limits" && (
				<SectionCard title="Approval limits" subtitle="What needs the manager, and what comes to you" bodyClassName="max-w-2xl gap-4 pt-3">
					<MoneyField label="Expenses above this need the manager" value={mgr} onChange={setMgr} hint="Below this, staff record and go" />
					<MoneyField label="Spend above this needs the owner" value={spend} onChange={setSpend} hint={`Right now anything over ${naira(business.spendLimit)} comes to you`} />
					<MoneyField label="Discounts above this need the owner" value={discount} onChange={setDiscount} />
					<ToggleField label="Room price changes need the owner" checked onChange={() => undefined} />
					<ToggleField label="New organization credit agreements need the owner" checked onChange={() => undefined} />
					<div className="flex justify-end">{save("Approval limits")}</div>
				</SectionCard>
			)}
			{tab === "transfer" && (
				<SectionCard title="Transfer ownership" subtitle="Hand Royal Suites Ltd on this platform to someone else" className="border-danger/40" bodyClassName="max-w-2xl gap-4 pt-3">
					<Note tone="danger">You will lose owner access the moment they accept. Managers and staff are not affected.</Note>
					<Button variant="outline" className={`${btn.dangerSoft} w-fit`} onClick={() => setTransfer(true)}><ArrowRightLeftIcon className="size-4" /> Start a transfer</Button>
				</SectionCard>
			)}

			<SidePanel open={transfer} onOpenChange={setTransfer} title="Transfer ownership" subtitle="Royal Suites Ltd · 4 hotels" icon={AlertTriangleIcon} tone="danger" footer={<><Button variant="outline" className={btn.secondary} onClick={() => setTransfer(false)}>Cancel</Button><Button className={btn.danger} disabled={!newOwner} onClick={() => setConfirm(true)}>Continue</Button></>}>
				<div className="flex flex-col gap-4">
					<TextField label="New owner's email" value={newOwner} onChange={setNewOwner} type="email" placeholder="name@company.com" />
					<WhatHappens tone="danger" items={["They get an email and must accept within 7 days", "When they accept you become a view-only user", "Hospio support is told and can reverse it within 24 hours"]} />
				</div>
			</SidePanel>
			<ConfirmModal open={confirm} onOpenChange={setConfirm} title="Send the transfer?" subtitle={newOwner} tone="danger" confirmLabel="Send transfer request" pending={pending} onConfirm={() => run("Transfer request sent", () => { setConfirm(false); setTransfer(false); })} />
		</>
	);
}
