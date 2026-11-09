"use client";

import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	BedDoubleIcon,
	BuildingIcon,
	CalendarIcon,
	CreditCardIcon,
	MailIcon,
	MessageSquareIcon,
	PhoneIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note, Timeline, TotalsList } from "@hospio/ui/shared/detail-list";
import { fmtDay, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { BookingRow, FolioRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	balance,
	bookingStatus,
	paymentStatus,
	planLabels,
	priceKindLabels,
} from "./booking-helpers";
import type { BookingAction } from "./booking-modals";

export function BookingDetailsPanel({
	booking: b,
	folio,
	onClose,
	onAction,
	onPos = 0,
}: {
	booking: BookingRow | null;
	folio: FolioRow | null;
	onClose: () => void;
	onAction: (a: BookingAction) => void;
	onPos?: number;
}) {
	const [tab, setTab] = useState<"stay" | "payments" | "notes">("stay");
	if (!b) return null;
	const status = bookingStatus(b);
	const pay = paymentStatus(b);
	const due = balance(b);
	// Paid more than the stay: the rest is the guest's credit.
	const credit = Math.max(0, b.paid - b.totalAmount);
	const paidPct =
		b.totalAmount > 0
			? Math.min(100, Math.round((b.paid / b.totalAmount) * 100))
			: 100;

	return (
		<SidePanel
			open
			width="lg"
			onOpenChange={(o) => !o && onClose()}
			title={b.guestName}
			subtitle={
				<span className="flex items-center gap-2">
					{b.reference}{" "}
					<StatusPill tone={status.tone}>{status.label}</StatusPill>{" "}
					<StatusPill tone={pay.tone} dot={false}>
						{pay.label}
						{due > 0 && pay.label !== "On account" ? ` · ${naira(due)}` : ""}
					</StatusPill>
				</span>
			}
			footerInfo={
				b.status === "CANCELLED"
					? `Cancelled · ${b.cancelReason}`
					: b.source
						? `Booked via ${b.source} · ${fmtWhen(b.createdAt)}`
						: undefined
			}
			footer={
				<>
					{b.status !== "CANCELLED" &&
						b.status !== "CHECKED_OUT" &&
						b.status !== "NO_SHOW" &&
						b.priceKind !== "COMPLIMENTARY" && (
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => onAction("payment")}
							>
								<CreditCardIcon className="size-4" /> Record payment
							</Button>
						)}
					{b.status === "BOOKED" && (
						<Button
							className={btn.primary}
							onClick={() => onAction("check-in")}
						>
							<ArrowRightToLineIcon className="size-4" /> Check in
						</Button>
					)}
					{b.status === "CHECKED_IN" && (
						<Button
							className={btn.primary}
							onClick={() => onAction("check-out")}
						>
							<ArrowLeftToLineIcon className="size-4" /> Check out
						</Button>
					)}
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="rounded-xl bg-subtle/70 p-4">
					<div className="flex items-center gap-4">
						<div className="flex-1">
							<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
								Check-in
							</p>
							<p className="text-base font-bold text-ink">
								{fmtDay(b.checkInDate)}
							</p>
							<p className="text-xs text-ink-3">
								{b.checkedInAt
									? `checked in ${fmtWhen(b.checkedInAt)}`
									: `from 2:00pm${b.eta ? ` · ETA ${b.eta}` : ""}`}
							</p>
						</div>
						<span className="rounded-pill border border-line bg-card px-3 py-1 text-xs font-semibold text-ink">
							{plural(b.nights, "night")}
						</span>
						<div className="flex-1 text-right">
							<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
								Check-out
							</p>
							<p className="text-base font-bold text-ink">
								{fmtDay(b.checkOutDate)}
							</p>
							<p className="text-xs text-ink-3">
								{b.checkedOutAt
									? `checked out ${fmtWhen(b.checkedOutAt)}`
									: "by 11:00am"}
							</p>
						</div>
					</div>
					<div className="mt-3 flex flex-wrap gap-4 border-t border-line pt-3 text-xs text-ink-2">
						<span className="flex items-center gap-1">
							<BedDoubleIcon className="size-[14px]" />{" "}
							{b.roomNumber
								? `${b.roomNumber} · ${b.roomTypeName}`
								: `${b.roomTypeName} · room not assigned`}
						</span>
						<span className="flex items-center gap-1">
							<UsersIcon className="size-[14px]" /> {plural(b.adults, "adult")}
							{b.children ? `, ${plural(b.children, "child", "children")}` : ""}
						</span>
						{b.organizationName && (
							<span className="flex items-center gap-1">
								<BuildingIcon className="size-[14px]" /> {b.organizationName}
							</span>
						)}
					</div>
				</div>

				<div className="flex gap-[2px] rounded-[10px] bg-subtle p-1">
					{(["stay", "payments", "notes"] as const).map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => setTab(t)}
							className={cn(
								"flex-1 rounded-lg py-[6px] text-xs capitalize transition-colors",
								tab === t
									? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
									: "font-medium text-ink-2",
							)}
						>
							{t}
						</button>
					))}
				</div>

				{tab === "stay" && (
					<>
						<PanelSection title="Guest">
							<div className="flex flex-col gap-2 text-[13px] text-ink">
								<span className="flex items-center gap-2">
									<PhoneIcon className="size-4 text-ink-3" /> {b.guestPhone}
								</span>
								{b.guestEmail && (
									<span className="flex items-center gap-2">
										<MailIcon className="size-4 text-ink-3" /> {b.guestEmail}
									</span>
								)}
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => onAction("message")}
									className={`${btn.secondary} ${btn.small} flex items-center gap-1`}
								>
									<MessageSquareIcon className="size-[14px]" /> Message guest
								</button>
								<button
									type="button"
									onClick={() => onAction("dates")}
									disabled={
										b.status === "CHECKED_OUT" || b.status === "CANCELLED"
									}
									className={`${btn.secondary} ${btn.small} flex items-center gap-1 disabled:opacity-50`}
								>
									<CalendarIcon className="size-[14px]" /> Change dates
								</button>
								{b.status === "BOOKED" && (
									<button
										type="button"
										onClick={() => onAction("cancel")}
										className={`${btn.dangerSoft} ${btn.small}`}
									>
										Cancel booking
									</button>
								)}
							</div>
						</PanelSection>
						<PanelSection title="Payment">
							<TotalsList
								rows={[
									{
										label: `${plural(b.nights, "night")} × ${naira(b.nightlyRate)} · ${priceKindLabels[b.priceKind]}`,
										value: naira(b.totalAmount),
									},
									{
										label: `Paid so far · ${planLabels[b.paymentPlan]}`,
										value: `– ${naira(b.paid)}`,
										tone: "success",
									},
									{
										label:
											b.paymentPlan === "ORGANIZATION"
												? `Billed to ${b.organizationName}`
												: credit > 0
													? "Credit"
													: "Balance",
										value: naira(credit > 0 ? credit : due),
										strong: true,
										tone:
											due > 0 && b.paymentPlan !== "ORGANIZATION"
												? "danger"
												: undefined,
									},
								]}
							/>
							{b.priceKind !== "COMPLIMENTARY" &&
								b.paymentPlan !== "ORGANIZATION" && (
									<div className="flex flex-col gap-1">
										<div className="h-[6px] overflow-hidden rounded-full bg-subtle">
											<div
												className="h-full rounded-full bg-success"
												style={{ width: `${paidPct}%` }}
											/>
										</div>
										<p className="text-[11px] text-ink-3">
											{paidPct}% paid
											{b.paymentPlan === "PAY_AT_CHECKOUT" && due > 0
												? " · collected at check-out"
												: ""}
										</p>
									</div>
								)}
							{onPos > 0 && (
								<Note tone="info">
									{naira(onPos)} was sent to the POS and is waiting for the
									guest. It shows as paid here once the POS confirms it.
								</Note>
							)}
							{b.notes && <Note tone="info">{b.notes}</Note>}
						</PanelSection>
					</>
				)}

				{tab === "payments" && (
					<PanelSection title={folio ? `Folio ${folio.reference}` : "Payments"}>
						{folio ? (
							<>
								<ul className="divide-y divide-line rounded-xl border border-line">
									{folio.lines.map((l) => (
										<li
											key={l.id}
											className="flex items-center gap-3 px-3 py-2 text-[13px]"
										>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-ink">
													{l.description}
												</p>
												<p className="text-xs text-ink-3">
													{fmtWhen(l.postedAt)} · {l.postedBy}
												</p>
											</div>
											<span
												className={cn(
													"font-semibold",
													l.kind === "PAYMENT" ? "text-success" : "text-ink",
												)}
											>
												{l.kind === "PAYMENT" ? "– " : ""}
												{naira(l.amount + l.tax)}
											</span>
										</li>
									))}
								</ul>
								<TotalsList
									rows={[
										{
											label: "Charges",
											value: naira(folio.charges + folio.tax),
										},
										{
											label: "Payments",
											value: `– ${naira(folio.payments)}`,
											tone: "success",
										},
										{
											label: "Balance",
											value: naira(folio.balance),
											strong: true,
											tone: folio.balance > 0 ? "danger" : "success",
										},
									]}
								/>
								<Link
									href={`/dashboard/folios?open=${folio.id}`}
									className="text-[13px] font-semibold text-brand hover:underline"
								>
									Open full folio →
								</Link>
							</>
						) : (
							<Note tone="info">
								{b.paid > 0
									? `${naira(b.paid)} received before arrival · the folio opens at check-in.`
									: "No payments yet · the folio opens at check-in."}
							</Note>
						)}
					</PanelSection>
				)}

				{tab === "notes" && (
					<PanelSection title="Activity">
						<Timeline
							items={[
								...(b.checkedOutAt
									? [
											{
												at: fmtWhen(b.checkedOutAt),
												by: "Front office",
												text: "Checked out",
											},
										]
									: []),
								...(b.checkedInAt
									? [
											{
												at: fmtWhen(b.checkedInAt),
												by: "Front office",
												text: `Checked in to ${b.roomNumber}`,
											},
										]
									: []),
								...(b.paid > 0
									? [
											{
												at: fmtWhen(b.createdAt),
												by: "Front office",
												text: `${naira(b.paid)} paid · ${planLabels[b.paymentPlan]}`,
											},
										]
									: []),
								{
									at: fmtWhen(b.createdAt),
									by: b.source,
									text: `Booked · ${plural(b.adults, "adult")}, ${plural(b.nights, "night")}, ${b.roomTypeName}`,
								},
							]}
						/>
						{b.notes && <Note tone="info">{b.notes}</Note>}
					</PanelSection>
				)}
			</div>
		</SidePanel>
	);
}
