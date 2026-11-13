"use client";

import { MailIcon, MessageCircleIcon, SmartphoneIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	allMessageInvoices,
	type CommInvoiceRow,
	type CommPlanView,
	type CommPriceSet,
	getDefaultMessagePrices,
	hotelMessagePlans,
	issueMessageInvoices,
	markMessageInvoicePaid,
	type Paged,
	setDefaultMessagePrices,
	setHotelMessagePlan,
	setHotelMessageSuspension,
} from "@hospio/api/actions/message-billing";
import { Button } from "@hospio/ui/primitives/button";
import { Switch } from "@hospio/ui/primitives/switch";
import { Note } from "@hospio/ui/shared/detail-list";
import { MoneyField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate, naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Guest messages as a paid service, Hospio360's side (hospio-backend docs/guest-message-billing.md): each hotel's plan
 * (on/off, its own prices, suspension) for onboarding and the hotel page, and the default prices and all invoices for
 * Fees & billing.
 */

const monthName = (yyyyMm: string) => {
	const [y, m] = yyyyMm.split("-").map(Number);
	return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

function InvoiceStatus({ status }: { status: string }) {
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

/** Each hotel's guest-message plan: on/off, prices (the defaults or its own), suspension. Onboarding and the hotel page. */
export function GuestMessagePlans({
	businessId,
	hotels,
	title = "Guest messages",
	subtitle = "Paid service: booking emails, SMS and WhatsApp to the hotel's guests, invoiced monthly per hotel",
}: {
	businessId: string;
	hotels: { id: string; name: string }[];
	title?: string;
	subtitle?: string;
}) {
	const [plans, setPlans] = useState<CommPlanView[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState<CommPlanView | null>(null);
	const ids = hotels.map((h) => h.id).join(",");

	const load = useCallback(async () => {
		const r = await hotelMessagePlans(ids ? ids.split(",") : []);
		if (r.ok) {
			setPlans(r.data);
			setError(null);
		} else setError(r.error);
	}, [ids]);

	useEffect(() => {
		void load();
	}, [load]);

	async function toggle(p: CommPlanView, on: boolean) {
		const r = await setHotelMessagePlan(p.hotelId, { businessId, enabled: on });
		if (!r.ok) return toast.error(r.error);
		toast.success(`${nameOf(p)}: guest messages ${on ? "on" : "off"}`);
		void load();
	}

	async function suspension(p: CommPlanView, suspended: boolean) {
		const r = await setHotelMessageSuspension(p.hotelId, suspended, suspended ? "suspended by Hospio360" : undefined);
		if (!r.ok) return toast.error(r.error);
		toast.success(`${nameOf(p)}: guest messages ${suspended ? "suspended" : "resumed"}`);
		void load();
	}

	const nameOf = (p: CommPlanView) => hotels.find((h) => h.id === p.hotelId)?.name ?? p.hotelName ?? "Hotel";

	return (
		<SectionCard title={title} subtitle={subtitle} flush>
			{error && <Note tone="danger" className="mx-5 mb-4">{error}</Note>}
			{!plans ? (
				<div className="mx-5 mb-5 h-24 animate-pulse rounded-xl bg-subtle" />
			) : plans.length === 0 ? (
				<p className="px-5 pb-5 text-[13px] text-ink-3">Add the business's hotels first.</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-[720px]">
						<thead className={tableHead}>
							<tr>
								<th className="px-4 py-2 text-left">Hotel</th>
								<th className="px-4 py-2 text-left">Service</th>
								<th className="px-4 py-2 text-left">Prices (email · SMS · WhatsApp)</th>
								<th className="px-4 py-2 text-right">This month</th>
								<th className="px-4 py-2 text-right">Unpaid</th>
								<th className="px-4 py-2" />
							</tr>
						</thead>
						<tbody>
							{plans.map((p) => (
								<tr key={p.hotelId} className={tableRow}>
									<td className={cn(cell, "font-semibold")}>{nameOf(p)}</td>
									<td className={cell}>
										<div className="flex items-center gap-2">
											<Switch checked={p.enabled} onCheckedChange={(on) => void toggle(p, on)} aria-label={`Guest messages for ${nameOf(p)}`} />
											{p.suspended ? (
												<StatusPill tone="danger">Suspended</StatusPill>
											) : p.enabled ? (
												<StatusPill tone="success">On</StatusPill>
											) : (
												<StatusPill tone="grey">Off</StatusPill>
											)}
										</div>
									</td>
									<td className={cell}>
										{naira(p.prices.email)} · {naira(p.prices.sms)} · {naira(p.prices.whatsapp)}
										<span className="block text-xs text-ink-3">{p.customPrices ? "The hotel's own prices" : "Default prices"}</span>
									</td>
									<td className={cn(cell, "text-right")}>{naira(p.thisMonth.total)}</td>
									<td className={cn(cell, "text-right", p.outstanding > 0 && "font-semibold text-danger")}>{naira(p.outstanding)}</td>
									<td className={cn(cell, "whitespace-nowrap text-right")}>
										<button type="button" className="text-[13px] font-semibold text-brand hover:underline" onClick={() => setEditing(p)}>
											Prices
										</button>
										<span className="text-ink-3"> · </span>
										<button
											type="button"
											className="text-[13px] font-semibold text-brand hover:underline"
											onClick={() => void suspension(p, !p.suspended)}
										>
											{p.suspended ? "Resume" : "Suspend"}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<PricesModal
				plan={editing}
				hotelName={editing ? nameOf(editing) : ""}
				businessId={businessId}
				onClose={() => setEditing(null)}
				onSaved={() => {
					setEditing(null);
					void load();
				}}
			/>
		</SectionCard>
	);
}

function PricesModal({
	plan,
	hotelName,
	businessId,
	onClose,
	onSaved,
}: {
	plan: CommPlanView | null;
	hotelName: string;
	businessId: string;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [email, setEmail] = useState<number | "">("");
	const [sms, setSms] = useState<number | "">("");
	const [whatsapp, setWhatsapp] = useState<number | "">("");
	const [busy, setBusy] = useState(false);
	useEffect(() => {
		if (!plan) return;
		setEmail(plan.customPrices ? plan.prices.email : "");
		setSms(plan.customPrices ? plan.prices.sms : "");
		setWhatsapp(plan.customPrices ? plan.prices.whatsapp : "");
	}, [plan]);
	if (!plan) return null;
	const save = async (useDefaults: boolean) => {
		setBusy(true);
		const r = await setHotelMessagePlan(plan.hotelId, {
			businessId,
			useDefaults,
			email: useDefaults || email === "" ? null : email,
			sms: useDefaults || sms === "" ? null : sms,
			whatsapp: useDefaults || whatsapp === "" ? null : whatsapp,
		});
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(useDefaults ? `${hotelName} uses the default prices` : `${hotelName}'s prices saved`);
		onSaved();
	};
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`${hotelName} · prices per message`}
			subtitle={`Empty uses the default (${naira(plan.defaults.email)} · ${naira(plan.defaults.sms)} · ${naira(plan.defaults.whatsapp)}). Applies to messages sent from now on.`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} disabled={busy} onClick={() => void save(true)}>
						Use default prices
					</Button>
					<Button className={btn.primary} disabled={busy} onClick={() => void save(false)}>
						Save prices
					</Button>
				</>
			}
		>
			<div className="grid gap-4 sm:grid-cols-3">
				<MoneyField label="Email" value={email} onChange={setEmail} placeholder={String(plan.defaults.email)} />
				<MoneyField label="SMS" value={sms} onChange={setSms} placeholder={String(plan.defaults.sms)} />
				<MoneyField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder={String(plan.defaults.whatsapp)} />
			</div>
		</Modal>
	);
}

/** Fees & billing → Guest messages: the default prices and every hotel's invoices. */
export function GuestMessageBilling() {
	const [prices, setPrices] = useState<CommPriceSet | null>(null);
	const [edit, setEdit] = useState<{ email: number | ""; sms: number | ""; whatsapp: number | "" } | null>(null);
	const [status, setStatus] = useState<string>("");
	const [page, setPage] = useState(0);
	const [invoices, setInvoices] = useState<Paged<CommInvoiceRow> | null>(null);
	const [paying, setPaying] = useState<CommInvoiceRow | null>(null);
	const [reference, setReference] = useState("");
	const [issue, setIssue] = useState(false);

	const load = useCallback(async () => {
		const [p, i] = await Promise.all([getDefaultMessagePrices(), allMessageInvoices({ status: status || undefined, page, size: 20 })]);
		if (p.ok) setPrices(p.data);
		if (i.ok) setInvoices(i.data);
		else toast.error(i.error);
	}, [status, page]);

	useEffect(() => {
		void load();
	}, [load]);

	async function savePrices() {
		if (!edit || edit.email === "" || edit.sms === "" || edit.whatsapp === "") return toast.error("Enter all three prices");
		const r = await setDefaultMessagePrices({ email: edit.email, sms: edit.sms, whatsapp: edit.whatsapp });
		if (!r.ok) return toast.error(r.error);
		toast.success("Default prices saved");
		setEdit(null);
		setPrices(r.data);
	}

	async function markPaid() {
		if (!paying) return;
		const r = await markMessageInvoicePaid(paying.id, reference || undefined, "Paid by transfer");
		if (!r.ok) return toast.error(r.error);
		toast.success(`${paying.number} marked paid`);
		setPaying(null);
		setReference("");
		void load();
	}

	async function issueNow() {
		const r = await issueMessageInvoices();
		setIssue(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(`${r.data.length} invoice${r.data.length === 1 ? "" : "s"} issued for last month`);
		void load();
	}

	return (
		<div className="flex flex-col gap-4">
			<SectionCard
				title="Guest messages · default prices"
				subtitle="What a hotel pays per message unless it has its own prices · applies to messages sent from now on"
				headerRight={
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => prices && setEdit({ email: prices.email, sms: prices.sms, whatsapp: prices.whatsapp })}
					>
						Change prices
					</Button>
				}
			>
				<div className="grid gap-3 pt-2 sm:grid-cols-3">
					{[
						{ icon: MailIcon, label: "Email", v: prices?.email },
						{ icon: SmartphoneIcon, label: "SMS", v: prices?.sms },
						{ icon: MessageCircleIcon, label: "WhatsApp", v: prices?.whatsapp },
					].map(({ icon: Icon, label, v }) => (
						<div key={label} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
							<span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
								<Icon className="size-4" />
							</span>
							<div>
								<p className="text-xs text-ink-3">{label}</p>
								<p className="text-[15px] font-semibold text-ink">{v == null ? "…" : naira(v)}</p>
							</div>
						</div>
					))}
				</div>
			</SectionCard>

			<SectionCard
				title="Guest-message invoices"
				subtitle="One per hotel per month, issued on the 1st and due 10 days later · unpaid suspends the hotel's guest messages"
				headerRight={
					<div className="flex items-center gap-2">
						<select
							value={status}
							onChange={(e) => {
								setStatus(e.target.value);
								setPage(0);
							}}
							className="h-9 rounded-control border border-line bg-card px-3 text-[13px]"
							aria-label="Status"
						>
							<option value="">All</option>
							<option value="DUE">Due</option>
							<option value="OVERDUE">Overdue</option>
							<option value="PAID">Paid</option>
						</select>
						<Button variant="outline" className={btn.secondary} onClick={() => setIssue(true)}>
							Issue last month
						</Button>
					</div>
				}
				flush
			>
				{!invoices ? (
					<div className="mx-5 mb-5 h-24 animate-pulse rounded-xl bg-subtle" />
				) : invoices.content.length === 0 ? (
					<p className="px-5 pb-5 text-[13px] text-ink-3">No invoices{status ? " with that status" : " yet"}.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[760px]">
							<thead className={tableHead}>
								<tr>
									<th className="px-4 py-2 text-left">Invoice</th>
									<th className="px-4 py-2 text-left">Hotel</th>
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
									<tr key={i.id} className={tableRow}>
										<td className={cn(cell, "font-semibold")}>{i.number}</td>
										<td className={cell}>{i.hotelName ?? "—"}</td>
										<td className={cell}>{monthName(i.month)}</td>
										<td className={cn(cell, "text-right")}>{i.emailCount + i.smsCount + i.whatsappCount}</td>
										<td className={cn(cell, "text-right font-semibold")}>{naira(i.totalAmount)}</td>
										<td className={cell}>{fmtLongDate(i.dueOn)}</td>
										<td className={cell}>
											<InvoiceStatus status={i.status} />
											{i.paidVia && <span className="block text-xs text-ink-3">{i.paidVia.startsWith("PAYSTACK") ? "Paystack" : "By hand"}</span>}
										</td>
										<td className={cn(cell, "text-right")}>
											{(i.status === "DUE" || i.status === "OVERDUE") && (
												<button type="button" className="text-[13px] font-semibold text-brand hover:underline" onClick={() => setPaying(i)}>
													Mark paid
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{invoices && invoices.totalPages > 1 && (
					<div className="flex justify-end gap-2 px-5 py-3">
						<Button variant="outline" className={btn.secondary} disabled={page === 0} onClick={() => setPage(page - 1)}>
							Previous
						</Button>
						<Button variant="outline" className={btn.secondary} disabled={page + 1 >= invoices.totalPages} onClick={() => setPage(page + 1)}>
							Next
						</Button>
					</div>
				)}
			</SectionCard>

			{edit && (
				<Modal
					open
					onOpenChange={(o) => !o && setEdit(null)}
					title="Default prices per message"
					subtitle="Hotels without their own prices pay these for every message sent from now on"
					footer={
						<>
							<Button variant="outline" className={btn.secondary} onClick={() => setEdit(null)}>
								Cancel
							</Button>
							<Button className={btn.primary} onClick={() => void savePrices()}>
								Save prices
							</Button>
						</>
					}
				>
					<div className="grid gap-4 sm:grid-cols-3">
						<MoneyField label="Email" value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} />
						<MoneyField label="SMS" value={edit.sms} onChange={(v) => setEdit({ ...edit, sms: v })} />
						<MoneyField label="WhatsApp" value={edit.whatsapp} onChange={(v) => setEdit({ ...edit, whatsapp: v })} />
					</div>
				</Modal>
			)}
			{paying && (
				<Modal
					open
					onOpenChange={(o) => !o && setPaying(null)}
					title={`Mark ${paying.number} paid`}
					subtitle={`${paying.hotelName ?? ""} · ${naira(paying.totalAmount)} · for a bank transfer or other payment outside Paystack`}
					footer={
						<>
							<Button variant="outline" className={btn.secondary} onClick={() => setPaying(null)}>
								Cancel
							</Button>
							<Button className={btn.primary} onClick={() => void markPaid()}>
								Mark paid
							</Button>
						</>
					}
				>
					<TextField label="Payment reference (optional)" value={reference} onChange={setReference} placeholder="e.g. bank transfer ref" />
				</Modal>
			)}
			<ConfirmModal
				open={issue}
				onOpenChange={setIssue}
				title="Issue last month's invoices now?"
				subtitle="This normally happens on its own at 00:30 on the 1st. Hotels with billable messages last month get their invoice, an email and a notification."
				confirmLabel="Issue invoices"
				onConfirm={() => void issueNow()}
			/>
		</div>
	);
}
