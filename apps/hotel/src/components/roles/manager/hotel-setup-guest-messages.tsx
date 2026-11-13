"use client";

import {
	CreditCardIcon,
	MailIcon,
	MessageCircleIcon,
	ReceiptIcon,
	SmartphoneIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type CommInvoiceRow,
	type CommLineRow,
	type CommMessageRow,
	type CommPlanView,
	confirmGuestMessagePayment,
	getGuestMessagePlan,
	guestMessageInvoice,
	guestMessageInvoiceMessages,
	guestMessageInvoices,
	type Paged,
	payGuestMessageInvoice,
	setGuestMessages,
	thisMonthMessages,
} from "@hospio/api/actions/message-billing";
import { Button } from "@hospio/ui/primitives/button";
import { Switch } from "@hospio/ui/primitives/switch";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { fmtLongDate, fmtWhen, naira } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Hotel setup → Guest messages (hospio-backend docs/guest-message-billing.md): booking emails, SMS and WhatsApp to guests
 * as a paid service. The owner or manager switches it on, sees the prices and this month's usage, and pays the monthly
 * invoices through Paystack. An invoice unpaid ten days after issue pauses guest messages until it is paid.
 */
export function GuestMessagesSection({ isOwner }: { isOwner: boolean }) {
	const router = useRouter();
	const params = useSearchParams();
	const [plan, setPlan] = useState<CommPlanView | null>(null);
	const [invoices, setInvoices] = useState<Paged<CommInvoiceRow> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [confirmOff, setConfirmOff] = useState(false);
	const [open, setOpen] = useState<string | null>(params.get("invoice"));
	const [usageOpen, setUsageOpen] = useState(false);
	const confirmed = useRef(false);

	const load = useCallback(async () => {
		const [p, i] = await Promise.all([
			getGuestMessagePlan(),
			guestMessageInvoices(0, 24),
		]);
		if (!p.ok) return setError(p.error);
		setError(null);
		setPlan(p.data);
		if (i.ok) setInvoices(i.data);
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	// Back from Paystack (?reference=… or ?trxref=…): confirm the payment, then show the invoice paid.
	useEffect(() => {
		const reference = params.get("reference") ?? params.get("trxref");
		if (!reference || confirmed.current) return;
		confirmed.current = true;
		void confirmGuestMessagePayment(reference).then((r) => {
			if (r.ok) toast.success(`Invoice ${r.data.number} paid · thank you`);
			else toast.error(r.error);
			const invoice = params.get("invoice");
			router.replace(
				`/dashboard/hotel-setup/guest-messages${invoice ? `?invoice=${invoice}` : ""}`,
			);
			void load();
		});
	}, [params, router, load]);

	async function toggle(on: boolean) {
		setBusy(true);
		const r = await setGuestMessages(on);
		setBusy(false);
		setConfirmOff(false);
		if (!r.ok) return toast.error(r.error);
		setPlan(r.data);
		toast.success(on ? "Guest messages are on" : "Guest messages are off");
	}

	if (error) return <Note tone="danger">{error}</Note>;
	if (!plan)
		return (
			<div className="h-64 animate-pulse rounded-card border border-line bg-card" />
		);

	const unpaid =
		invoices?.content.filter(
			(i) => i.status === "DUE" || i.status === "OVERDUE",
		) ?? [];
	const u = plan.thisMonth;
	return (
		<div className="flex min-w-0 flex-col gap-4">
			{plan.suspended && (
				<Note tone="danger">
					<span className="font-semibold">Guest messages are paused.</span>{" "}
					{plan.suspendedReason}. Booking confirmations, receipts and other
					guest messages are not being sent. Pay the invoice below to turn them
					back on.
				</Note>
			)}

			<SectionCard
				title="Guest messages"
				subtitle="Booking confirmations, receipts and other messages to your guests, companies and suppliers, by email, SMS and WhatsApp"
			>
				<div className="flex flex-col gap-4 pt-2">
					<div className="flex items-start gap-4 rounded-xl border border-line p-4">
						<div className="min-w-0 flex-1">
							<p className="text-[14px] font-semibold text-ink">
								{plan.enabled
									? "On · your guests hear from you"
									: "Off · nothing is sent to guests"}
							</p>
							<p className="mt-1 text-[13px] text-ink-2">
								Each message is sent from your hotel's name and charged per
								message at the prices below. You get one invoice a month. Codes,
								sign-in and staff messages are always free.
							</p>
							{plan.changedBy && (
								<p className="mt-2 text-xs text-ink-3">
									Last changed by {plan.changedBy}
									{plan.changedAt ? ` · ${fmtWhen(plan.changedAt)}` : ""}
								</p>
							)}
						</div>
						<Switch
							checked={plan.enabled}
							disabled={busy}
							onCheckedChange={(on) =>
								on ? void toggle(true) : setConfirmOff(true)
							}
							aria-label="Guest messages"
						/>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<Price icon={MailIcon} label="Email" value={plan.prices.email} />
						<Price icon={SmartphoneIcon} label="SMS" value={plan.prices.sms} />
						<Price
							icon={MessageCircleIcon}
							label="WhatsApp"
							value={plan.prices.whatsapp}
						/>
					</div>
					<p className="text-xs text-ink-3">
						{plan.customPrices
							? "Your hotel's own prices, agreed with Hospio360."
							: "Hospio360's standard prices."}{" "}
						A WhatsApp that can't be delivered as WhatsApp goes as an SMS and is
						charged as an SMS. A message the network rejects costs nothing.
					</p>
				</div>
			</SectionCard>

			<div className="grid gap-4 sm:grid-cols-4">
				<KpiCard
					label="Emails this month"
					value={u.emailCount}
					icon={MailIcon}
					hint={naira(u.emailAmount)}
				/>
				<KpiCard
					label="SMS this month"
					value={u.smsCount}
					icon={SmartphoneIcon}
					hint={naira(u.smsAmount)}
				/>
				<KpiCard
					label="WhatsApp this month"
					value={u.whatsappCount}
					icon={MessageCircleIcon}
					hint={naira(u.whatsappAmount)}
				/>
				<KpiCard
					label="So far this month"
					value={naira(u.total)}
					icon={ReceiptIcon}
					hint={
						<button
							type="button"
							className="font-semibold text-brand hover:underline"
							onClick={() => setUsageOpen(true)}
						>
							See each message
						</button>
					}
				/>
			</div>

			<SectionCard
				title="Invoices"
				subtitle={
					unpaid.length
						? `${naira(plan.outstanding)} to pay · ${unpaid.length} open invoice${unpaid.length === 1 ? "" : "s"}`
						: "Issued on the 1st for the month before · due 10 days later"
				}
				flush
			>
				{!invoices || invoices.content.length === 0 ? (
					<p className="px-5 pb-5 text-[13px] text-ink-3">
						No invoices yet. The first comes on the 1st after messages are sent.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px]">
							<thead className={tableHead}>
								<tr>
									<th className="px-4 py-2 text-left">Invoice</th>
									<th className="px-4 py-2 text-left">Month</th>
									<th className="px-4 py-2 text-right">Messages</th>
									<th className="px-4 py-2 text-right">Total</th>
									<th className="px-4 py-2 text-left">Due</th>
									<th className="px-4 py-2 text-left">Status</th>
									<th className="px-4 py-2" />
								</tr>
							</thead>
							<tbody>
								{invoices.content.map((i) => (
									<tr
										key={i.id}
										className={cn(tableRow, "cursor-pointer")}
										onClick={() => setOpen(i.id)}
									>
										<td className={cn(cell, "font-semibold")}>{i.number}</td>
										<td className={cell}>{monthName(i.month)}</td>
										<td className={cn(cell, "text-right")}>
											{i.emailCount + i.smsCount + i.whatsappCount}
										</td>
										<td className={cn(cell, "text-right font-semibold")}>
											{naira(i.totalAmount)}
										</td>
										<td className={cell}>{fmtLongDate(i.dueOn)}</td>
										<td className={cell}>
											<InvoiceStatus status={i.status} />
										</td>
										<td className={cn(cell, "text-right")}>
											<span className="text-[13px] font-semibold text-brand">
												{i.status === "PAID" ? "View" : "View & pay"}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</SectionCard>

			<InvoicePanel
				id={open}
				onClose={() => setOpen(null)}
				onlinePayment={plan.onlinePayment}
			/>
			<MessagesPanel open={usageOpen} onClose={() => setUsageOpen(false)} />
			<ConfirmModal
				open={confirmOff}
				onOpenChange={setConfirmOff}
				title="Turn guest messages off?"
				subtitle="Guests stop getting booking confirmations, receipts and other messages from your hotel by email, SMS and WhatsApp. Codes and sign-in still work. You can turn it back on any time."
				confirmLabel="Turn off"
				tone="danger"
				onConfirm={() => void toggle(false)}
			/>
			{!isOwner && (
				<p className="text-xs text-ink-3">
					The owner sees and can pay these invoices too.
				</p>
			)}
		</div>
	);
}

function Price({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof MailIcon;
	label: string;
	value: number;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
			<span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
				<Icon className="size-4" />
			</span>
			<div>
				<p className="text-xs text-ink-3">{label}</p>
				<p className="text-[15px] font-semibold text-ink">
					{naira(value)}{" "}
					<span className="text-xs font-normal text-ink-3">a message</span>
				</p>
			</div>
		</div>
	);
}

export function InvoiceStatus({ status }: { status: string }) {
	return status === "PAID" ? (
		<StatusPill tone="success">Paid</StatusPill>
	) : status === "OVERDUE" ? (
		<StatusPill tone="danger">Overdue</StatusPill>
	) : status === "VOID" ? (
		<StatusPill tone="grey">Cancelled</StatusPill>
	) : (
		<StatusPill tone="warning">Due</StatusPill>
	);
}

const channelName = (c: string | null) =>
	c === "SMS" ? "SMS" : c === "WHATSAPP" ? "WhatsApp" : "Email";

function InvoicePanel({
	id,
	onClose,
	onlinePayment,
}: {
	id: string | null;
	onClose: () => void;
	onlinePayment: boolean;
}) {
	const [inv, setInv] = useState<{
		invoice: CommInvoiceRow;
		lines: CommLineRow[];
	} | null>(null);
	const [messages, setMessages] = useState<Paged<CommMessageRow> | null>(null);
	const [page, setPage] = useState(0);
	const [paying, setPaying] = useState(false);

	useEffect(() => {
		setInv(null);
		setMessages(null);
		setPage(0);
		if (!id) return;
		void guestMessageInvoice(id).then((r) =>
			r.ok ? setInv(r.data) : toast.error(r.error),
		);
	}, [id]);

	useEffect(() => {
		if (!id) return;
		void guestMessageInvoiceMessages(id, page, 20).then(
			(r) => r.ok && setMessages(r.data),
		);
	}, [id, page]);

	async function pay() {
		if (!id) return;
		setPaying(true);
		const back = `${window.location.origin}/dashboard/hotel-setup/guest-messages?invoice=${id}`;
		const r = await payGuestMessageInvoice(id, back);
		if (!r.ok) {
			setPaying(false);
			return toast.error(r.error);
		}
		window.location.assign(r.data.authorizationUrl);
	}

	const i = inv?.invoice;
	const payable = i && (i.status === "DUE" || i.status === "OVERDUE");
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			width="lg"
			title={i ? `Invoice ${i.number}` : "Invoice"}
			subtitle={
				i
					? `${i.hotelName ?? ""} · guest messages in ${monthName(i.month)}`
					: undefined
			}
			icon={ReceiptIcon}
			footerInfo={
				i?.status === "PAID"
					? `Paid ${i.paidAt ? fmtWhen(i.paidAt) : ""}${i.paidByName ? ` by ${i.paidByName}` : ""}`
					: i?.status === "OVERDUE"
						? `Overdue since ${fmtLongDate(i.dueOn)} · guest messages are paused until it is paid`
						: i
							? `Due ${fmtLongDate(i.dueOn)} · guest messages pause if it is not paid by then`
							: undefined
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Close
					</Button>
					{payable && (
						<Button
							className={btn.primary}
							disabled={paying || !onlinePayment}
							onClick={() => void pay()}
						>
							<CreditCardIcon className="mr-1 size-4" />{" "}
							{paying ? "Opening Paystack…" : `Pay ${naira(i.totalAmount)}`}
						</Button>
					)}
				</>
			}
		>
			{!i ? (
				<div className="h-40 animate-pulse rounded-xl bg-subtle" />
			) : (
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-3">
						<InvoiceStatus status={i.status} />
						<span className="text-xs text-ink-3">
							Issued {fmtLongDate(i.issuedAt)}
						</span>
					</div>
					{payable && !onlinePayment && (
						<Note tone="info">
							Online payment isn't set up yet. Pay by transfer and Hospio360
							will mark this invoice paid.
						</Note>
					)}
					<PanelSection title="Summary">
						<TotalsList
							rows={[
								{
									label: `${i.emailCount} email${i.emailCount === 1 ? "" : "s"}`,
									value: naira(i.emailAmount),
								},
								{ label: `${i.smsCount} SMS`, value: naira(i.smsAmount) },
								{
									label: `${i.whatsappCount} WhatsApp`,
									value: naira(i.whatsappAmount),
								},
								{
									label: "Total",
									value: naira(i.totalAmount),
									strong: true,
									tone: payable ? "danger" : "success",
								},
							]}
						/>
					</PanelSection>
					<PanelSection title="By kind of message">
						<table className="w-full">
							<thead className={tableHead}>
								<tr>
									<th className="px-3 py-2 text-left">Message</th>
									<th className="px-3 py-2 text-left">Sent by</th>
									<th className="px-3 py-2 text-right">Count</th>
									<th className="px-3 py-2 text-right">Each</th>
									<th className="px-3 py-2 text-right">Amount</th>
								</tr>
							</thead>
							<tbody>
								{inv.lines.map((l) => (
									<tr key={`${l.kind}-${l.channel}`} className={tableRow}>
										<td className="px-3 py-2 text-[13px] text-ink">
											{l.label}
										</td>
										<td className="px-3 py-2 text-[13px] text-ink-2">
											{channelName(l.channel)}
										</td>
										<td className="px-3 py-2 text-right text-[13px]">
											{l.count}
										</td>
										<td className="px-3 py-2 text-right text-[13px] text-ink-2">
											{naira(l.unitPrice)}
										</td>
										<td className="px-3 py-2 text-right text-[13px] font-semibold">
											{naira(l.amount)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</PanelSection>
					<PanelSection title="Every message">
						<MessageTable data={messages} page={page} onPage={setPage} />
					</PanelSection>
				</div>
			)}
		</SidePanel>
	);
}

function MessagesPanel({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [data, setData] = useState<Paged<CommMessageRow> | null>(null);
	const [page, setPage] = useState(0);
	useEffect(() => {
		if (!open) return;
		void thisMonthMessages(page, 20).then((r) =>
			r.ok ? setData(r.data) : toast.error(r.error),
		);
	}, [open, page]);
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			width="lg"
			title="This month's messages"
			subtitle="Each message your hotel has been charged for so far this month · invoiced on the 1st"
			icon={MailIcon}
			footer={
				<Button variant="outline" className={btn.secondary} onClick={onClose}>
					Close
				</Button>
			}
		>
			<MessageTable data={data} page={page} onPage={setPage} />
		</SidePanel>
	);
}

function MessageTable({
	data,
	page,
	onPage,
}: {
	data: Paged<CommMessageRow> | null;
	page: number;
	onPage: (p: number) => void;
}) {
	if (!data) return <div className="h-32 animate-pulse rounded-xl bg-subtle" />;
	if (data.content.length === 0)
		return <p className="text-[13px] text-ink-3">No messages yet.</p>;
	return (
		<div className="flex flex-col gap-3">
			<table className="w-full">
				<thead className={tableHead}>
					<tr>
						<th className="px-3 py-2 text-left">When</th>
						<th className="px-3 py-2 text-left">Message</th>
						<th className="px-3 py-2 text-left">To</th>
						<th className="px-3 py-2 text-right">Price</th>
					</tr>
				</thead>
				<tbody>
					{data.content.map((m) => (
						<tr key={m.id} className={tableRow}>
							<td className="px-3 py-2 text-xs text-ink-2">{fmtWhen(m.at)}</td>
							<td className="px-3 py-2 text-[13px] text-ink">
								{m.label}
								<span className="block text-xs text-ink-3">
									{channelName(m.sentVia ?? m.channel)}
									{m.sentVia && m.sentVia !== m.channel
										? ` (asked: ${channelName(m.channel)})`
										: ""}
									{m.subject ? ` · ${m.subject}` : ""}
								</span>
							</td>
							<td className="px-3 py-2 text-xs text-ink-2">{m.to}</td>
							<td className="px-3 py-2 text-right text-[13px] font-semibold">
								{m.price == null ? "—" : naira(m.price)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{data.totalPages > 1 && (
				<div className="flex items-center justify-between text-xs text-ink-3">
					<span>
						{data.number * data.size + 1}–
						{Math.min((data.number + 1) * data.size, data.totalElements)} of{" "}
						{data.totalElements}
					</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							className={btn.secondary}
							disabled={page === 0}
							onClick={() => onPage(page - 1)}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							className={btn.secondary}
							disabled={page + 1 >= data.totalPages}
							onClick={() => onPage(page + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

function monthName(yyyyMm: string) {
	const [y, m] = yyyyMm.split("-").map(Number);
	return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
	});
}
