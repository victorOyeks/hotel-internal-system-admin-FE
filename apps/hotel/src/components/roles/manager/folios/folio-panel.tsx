"use client";

import { CreditCardIcon, MailIcon, PhoneIcon, PlusIcon, PrinterIcon, ReceiptIcon, ScissorsIcon, ArrowRightLeftIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note, Timeline, TotalsList } from "@hospio/ui/shared/detail-list";
import { SelectField } from "@hospio/ui/shared/field";
import { fmtWhen, naira } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { voidLine } from "@hospio/api/actions/folio";
import { useAction } from "@hospio/api/actions/use-action";
import type { FolioLine, FolioRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import type { FolioAction } from "./folio-modals";
import { folioStatus } from "./folios-screen";

export function FolioPanel({ folio: f, onClose, onAction, onReplace }: { folio: FolioRow | null; onClose: () => void; onAction: (a: FolioAction) => void; onReplace: (updated: FolioRow) => void }) {
	const [voiding, setVoiding] = useState<FolioLine | null>(null);
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	if (!f) return null;
	const status = folioStatus(f);
	const isOpen = f.status === "OPEN";
	const byCategory = f.lines.filter((l) => l.kind === "CHARGE" && !l.voided).reduce<Record<string, number>>((acc, l) => { acc[l.category] = (acc[l.category] ?? 0) + l.amount + l.tax; return acc; }, {});

	return (
		<>
			<SidePanel open width="lg" onOpenChange={(o) => !o && onClose()} title={`${f.guestName} · ${f.roomNumber}`} subtitle={<span className="flex items-center gap-2">Folio {f.reference}{f.organizationName ? ` · ${f.organizationName}` : ""} <StatusPill tone={status.tone}>{status.label}</StatusPill></span>} icon={ReceiptIcon}
				footerInfo={`Opened ${fmtWhen(f.openedAt)}${f.closedAt ? ` · closed ${fmtWhen(f.closedAt)}` : ""}`}
				footer={<>
					<Button variant="outline" className={btn.secondary} onClick={() => onAction("print")}><PrinterIcon className="size-4" /> Print / email</Button>
					{f.balance > 0 && <Button className={btn.primary} onClick={() => onAction("payment")}><CreditCardIcon className="size-4" /> Record payment</Button>}
					{isOpen && f.balance <= 0 && <Button asChild className={btn.primary}><Link href={`/dashboard/bookings?open=${f.bookingId}&action=check-out`}>Check out</Link></Button>}
				</>}
			>
				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-3 gap-2">
						{[["Charges", naira(f.charges + f.tax), "text-ink"], ["Paid", naira(f.payments), "text-success"], ["Balance", naira(f.balance), f.balance > 0 ? "text-danger" : "text-success"]].map(([l, v, c]) => (
							<div key={l} className="rounded-xl bg-subtle/70 px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">{l}</p><p className={cn("text-lg font-bold", c)}>{v}</p></div>
						))}
					</div>
					{f.status === "CLOSED_WITH_BALANCE" && <Note tone="danger">Guest checked out owing {naira(f.balance)} · send a reminder or record the transfer when it lands.</Note>}
					{isOpen && (
						<div className="grid grid-cols-2 gap-2">
							<button type="button" onClick={() => onAction("charge")} className={`${btn.secondary} flex items-center justify-start gap-2`}><PlusIcon className="size-4" /> Post a charge</button>
							<button type="button" onClick={() => onAction("discount")} className={`${btn.secondary} flex items-center justify-start gap-2`}><ReceiptIcon className="size-4" /> Add discount <ManagerMark className="ml-auto" /></button>
							<button type="button" onClick={() => onAction("split")} className={`${btn.secondary} flex items-center justify-start gap-2`}><ScissorsIcon className="size-4" /> Split folio</button>
							<button type="button" onClick={() => onAction("transfer")} className={`${btn.secondary} flex items-center justify-start gap-2`}><ArrowRightLeftIcon className="size-4" /> Transfer charges <ManagerMark className="ml-auto" /></button>
						</div>
					)}
					<PanelSection title="Lines">
						<ul className="divide-y divide-line rounded-xl border border-line">
							{f.lines.map((l) => (
								<li key={l.id} className={cn("flex items-center gap-3 px-3 py-[10px] text-[13px]", l.voided && "opacity-50")}>
									<span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", l.kind === "PAYMENT" ? "bg-success-soft text-success" : l.kind === "DISCOUNT" || l.kind === "REFUND" ? "bg-info-soft text-info" : "bg-subtle text-ink-2")}>{l.kind === "PAYMENT" ? "PAY" : l.kind === "DISCOUNT" ? "DISC" : l.kind === "REFUND" ? "REF" : l.category.slice(0, 4).toUpperCase()}</span>
									<div className="min-w-0 flex-1">
										<p className={cn("truncate font-medium text-ink", l.voided && "line-through")}>{l.description}</p>
										<p className="text-xs text-ink-3">{fmtWhen(l.postedAt)} · {l.postedBy} · {l.source.toLowerCase()}{l.tax ? ` · incl. ${naira(l.tax)} VAT` : ""}{l.voided ? ` · voided: ${l.voidReason}` : ""}</p>
									</div>
									<span className={cn("font-semibold", l.kind === "PAYMENT" || l.kind === "DISCOUNT" ? "text-success" : "text-ink")}>{l.kind === "PAYMENT" || l.kind === "DISCOUNT" ? "– " : ""}{naira(l.amount + l.tax)}</span>
									{isOpen && l.kind === "CHARGE" && !l.voided && <button type="button" onClick={() => { setVoiding(l); setReason(""); }} className="text-[11px] font-semibold text-danger hover:underline">Void</button>}
								</li>
							))}
						</ul>
					</PanelSection>
					<PanelSection title="By category">
						<TotalsList rows={[...Object.entries(byCategory).map(([k, v]) => ({ label: k, value: naira(v) })), { label: "Total charges", value: naira(f.charges + f.tax), strong: true }]} />
					</PanelSection>
					<PanelSection title="Guest">
						<div className="flex flex-col gap-2 text-[13px] text-ink">
							{f.guestPhone && <span className="flex items-center gap-2"><PhoneIcon className="size-4 text-ink-3" /> {f.guestPhone}</span>}
							{f.guestEmail && <span className="flex items-center gap-2"><MailIcon className="size-4 text-ink-3" /> {f.guestEmail}</span>}
							<Link href={`/dashboard/bookings?open=${f.bookingId}`} className="font-semibold text-brand hover:underline">Open booking {f.reference} →</Link>
						</div>
					</PanelSection>
					{f.notes.length > 0 && <PanelSection title="Notes"><Timeline items={f.notes.map((n) => ({ at: fmtWhen(n.at), by: n.by, text: n.text }))} /></PanelSection>}
				</div>
			</SidePanel>

			<ConfirmModal open={!!voiding} onOpenChange={(o) => !o && setVoiding(null)} title={`Void "${voiding?.description}"?`} subtitle={`${naira((voiding?.amount ?? 0) + (voiding?.tax ?? 0))} comes off the folio · manager only`} tone="danger" confirmLabel="Void line" pending={pending || !reason}
				onConfirm={() => voiding && run(() => voidLine(f.id, voiding.id, reason, { ...f, charges: f.charges - voiding.amount, tax: f.tax - voiding.tax, balance: f.balance - (voiding.amount + voiding.tax), lines: f.lines.map((l) => (l.id === voiding.id ? { ...l, voided: true, voidReason: reason } : l)) }), "Line voided", (updated) => { onReplace(updated); setVoiding(null); })}
			>
				<div className="flex flex-col gap-4">
					<SelectField label="Reason" value={reason} onChange={setReason} setupLink="reasons" options={["Posted twice", "Wrong room", "Guest disputes it", "Comp by manager", "Other"]} />
					<WhatHappens tone="danger" items={["The line stays visible but crossed out", "The balance drops by the line amount", "The department that posted it is told", "Logged against your name"]} />
				</div>
			</ConfirmModal>
		</>
	);
}
