"use client";

import {
	BanknoteIcon,
	CheckCircle2Icon,
	PrinterIcon,
	CreditCardIcon,
	Loader2Icon,
	MailIcon,
	MessageCircleIcon,
	XCircleIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	ChoiceCards,
	Field,
	MoneyField,
	SelectField,
	TextField,
} from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useHotelActions } from "@hospio/api/actions/hotel-scope";
import { emailReceipt } from "@hospio/api/actions/ml";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type {
	FolioRow,
	PaymentMethod,
	PaymentStatus,
	TerminalRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

export type PaymentTarget = {
	guestName: string;
	roomNumber?: string;
	folioId?: string;
	bookingId?: string;
	amountDue: number;
	description?: string;
	guestPhone?: string;
	guestEmail?: string;
	/** A kitchen or bar order this payment settles; the order closes itself when it is approved. */
	orderId?: string;
	/** The desk taking the payment (KITCHEN, BAR): sent to payment-service so the right POS and till are used. */
	role?: string;
};
export type TakenPayment = {
	id: string;
	amount: number;
	method: PaymentMethod;
	guestName: string;
	status: PaymentStatus;
	folioId?: string;
	bookingId?: string;
};

type Step =
	| "idle"
	| "who"
	| "method"
	| "card"
	| "transfer"
	| "cash"
	| "receipt"
	| "done";
type CardState =
	| "waiting"
	| "paying"
	| "sent"
	| "approved"
	| "declined"
	| "no_response";

export type PaymentStepsView = {
	title: string;
	subtitle: string;
	body: ReactNode;
	footer: ReactNode;
	footerInfo?: ReactNode;
	step: Step;
};

export type PaymentStepsOptions = {
	/** Who is paying and how much. Without it the steps start on "who" (Take a payment from anywhere). */
	target?: PaymentTarget | null;
	folios?: FolioRow[];
	terminals?: TerminalRow[];
	/** A payment was recorded (any status). Fires once, before the "done" step. */
	onDone?: (payment: TakenPayment) => void;
	/** The user is finished (Done, Cancel, or Minimize while the POS waits): close or move on. */
	onFinish: () => void;
	/** Back from the method step when the target came from the caller: return to the caller's view. */
	onBack?: () => void;
	/** Label of the last button; "Done" by default. */
	doneLabel?: string;
	/** Extra content under the "done" message, and a way to hold the last button while the caller works. */
	doneExtra?: ReactNode;
	doneBusy?: boolean;
	/** Let the user change the amount on the method step (a part payment); fixed otherwise. */
	editAmount?: boolean;
};

/**
 * Front office 8.1–8.12 · Taking payment as steps: who is paying and how much, the method, the
 * terminal / transfer / cash step, the receipt, done. The steps are a hook so any panel can host them:
 * the caller renders `title`, `subtitle`, `body`, `footer` in its own SidePanel and the panel never
 * stacks on another one. Card goes to payment-service as soon as the step opens and shows what the
 * service answered: approved, declined, no response, or still processing (the POS confirms later; the
 * payment sits in My payments until then). Transfer and cash are recorded when the desk confirms them.
 * `begin(target)` restarts the steps for a new target; `autoStart: false` leaves them idle until then.
 */
export function usePaymentSteps(
	{
		target,
		folios = [],
		terminals = [],
		onDone,
		onFinish,
		onBack,
		doneLabel = "Done",
		doneExtra,
		doneBusy,
		editAmount,
	}: PaymentStepsOptions,
	autoStart = true,
) {
	const { recordPayment } = useHotelActions();
	const [tgt, setTgt] = useState<PaymentTarget | null>(target ?? null);
	const [step, setStep] = useState<Step>(
		autoStart ? (target ? "method" : "who") : "idle",
	);
	const [folioId, setFolioId] = useState(target?.folioId ?? "");
	const [guestName, setGuestName] = useState(target?.guestName ?? "");
	const [amount, setAmount] = useState<number | "">(target?.amountDue ?? "");
	const [description, setDescription] = useState(
		target?.description ?? "Room charges",
	);
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	const [terminal, setTerminal] = useState(
		terminals.find((t) => t.status === "ONLINE")?.id ?? "",
	);
	const [card, setCard] = useState<CardState>("waiting");
	const [attempt, setAttempt] = useState(0);
	const [tendered, setTendered] = useState<number | "">("");
	// Email is the receipt that is sent for real; without the guest's email the desk prints it (WhatsApp and SMS are coming soon).
	const [receipt, setReceipt] = useState<"EMAIL" | "NONE">(
		target?.guestEmail ? "EMAIL" : "NONE",
	);
	const [contact, setContact] = useState(target?.guestEmail ?? "");
	const [sending, setSending] = useState(false);
	const [recorded, setRecorded] = useState<TakenPayment | null>(null);
	const [cardError, setCardError] = useState<string | null>(null);

	/** Restart the steps for a new target (or the "who" step when there is none). */
	function begin(t?: PaymentTarget | null) {
		setTgt(t ?? null);
		setStep(t ? "method" : "who");
		setFolioId(t?.folioId ?? "");
		setGuestName(t?.guestName ?? "");
		setAmount(t?.amountDue ?? "");
		setDescription(t?.description ?? "Room charges");
		setMethod("CARD");
		setTerminal(terminals.find((x) => x.status === "ONLINE")?.id ?? "");
		setCard("waiting");
		setAttempt(0);
		setTendered("");
		setReceipt(t?.guestEmail ? "EMAIL" : "NONE");
		setContact(t?.guestEmail ?? "");
		setRecorded(null);
		setCardError(null);
	}

	// Card: send the request to payment-service and show what the terminal answered.
	// biome-ignore lint/correctness/useExhaustiveDependencies: a new attempt re-sends; the other values are read once per attempt
	useEffect(() => {
		if (step !== "card") return;
		let cancelled = false;
		setCard("waiting");
		setCardError(null);
		const n = typeof amount === "number" ? amount : 0;
		const t = setTimeout(() => !cancelled && setCard("paying"), 700);
		recordPayment({
			method: "CARD",
			amount: n,
			folioId: folioId || tgt?.folioId,
			bookingId: tgt?.bookingId,
			guestName,
			guestPhone: tgt?.guestPhone,
			guestEmail: tgt?.guestEmail,
			description,
			// The receipt is chosen after the terminal answers, so nothing is sent automatically here.
			receipt: "NONE",
			orderId: tgt?.orderId,
			role: tgt?.role,
		})
			.then((r) => {
				if (cancelled) return;
				if (!r.ok) {
					setCardError(r.error);
					setCard("no_response");
					return;
				}
				setRecorded({
					...r.data,
					guestName,
					folioId: folioId || tgt?.folioId,
					bookingId: tgt?.bookingId,
				});
				if (r.data.status === "APPROVED") setCard("approved");
				else if (r.data.status === "DECLINED" || r.data.status === "FAILED")
					setCard("declined");
				else if (r.data.status === "NO_RESPONSE") setCard("no_response");
				else setCard("sent");
			})
			.catch((e: unknown) => {
				// The call itself failed (network, a new deployment): say so instead of spinning forever.
				if (cancelled) return;
				setCardError(
					e instanceof Error
						? `The payment could not be sent: ${e.message}. Nothing was charged.`
						: "The payment could not be sent. Nothing was charged.",
				);
				setCard("no_response");
			});
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [step, attempt]);

	const amt = typeof amount === "number" ? amount : 0;
	const folio = folios.find((f) => f.id === folioId);
	const title = {
		idle: "",
		who: "Take a payment",
		method: "How is the guest paying?",
		card:
			card === "approved"
				? "Approved on the terminal"
				: card === "declined"
					? "Declined on the terminal"
					: card === "no_response"
						? cardError
							? "The card wasn't sent"
							: "No response from the terminal"
						: card === "sent"
							? "Sent to the POS"
							: "Waiting for the guest on the POS",
		transfer: "Bank transfer",
		cash: "Cash",
		receipt: "Send a receipt",
		done:
			recorded && recorded.status !== "APPROVED"
				? "Payment sent"
				: "Payment recorded",
	}[step];
	const subtitle = guestName
		? `${guestName}${folio?.roomNumber ? ` · Room ${folio.roomNumber}` : tgt?.roomNumber ? ` · Room ${tgt.roomNumber}` : ""} · ${naira(amt)}`
		: "Choose who is paying";

	async function finish(choice: "EMAIL" | "NONE" = receipt) {
		setSending(true);
		let payment = recorded;
		if (!payment) {
			// Transfer and cash are recorded when the desk confirms them.
			const r = await recordPayment({
				method,
				amount: amt,
				folioId: folioId || tgt?.folioId,
				bookingId: tgt?.bookingId,
				guestName,
				guestPhone: tgt?.guestPhone,
				guestEmail:
					choice === "EMAIL" && contact.trim() ? contact.trim() : tgt?.guestEmail,
				description,
				// Emailed below, once, with the on-screen echo.
				receipt: "NONE",
				orderId: tgt?.orderId,
				role: tgt?.role,
			}).catch(
				(e: unknown) =>
					({
						ok: false,
						error:
							e instanceof Error
								? `The payment could not be recorded: ${e.message}`
								: "The payment could not be recorded",
					}) as const,
			);
			if (!r.ok) {
				setSending(false);
				toast.error(r.error);
				return;
			}
			payment = {
				...r.data,
				guestName,
				folioId: folioId || tgt?.folioId,
				bookingId: tgt?.bookingId,
			};
			setRecorded(payment);
		}
		let receiptNote =
			choice === "NONE" ? "Print it from the next screen" : "";
		if (choice === "EMAIL" && payment.status === "APPROVED") {
			const sent = await withDeliveries(
				emailReceipt({ paymentId: payment.id, to: contact, text: "" }),
				`Receipt for ${guestName}`,
			).catch(() => null);
			receiptNote = sent?.ok
				? `Receipt emailed to ${sent.data.to}`
				: `The receipt wasn't emailed${sent && !sent.ok ? `: ${sent.error}` : ""} · print it or email it from the receipt page`;
		} else if (choice === "EMAIL") {
			receiptNote = "Email the receipt from My payments once it is approved";
		}
		setSending(false);
		const label =
			method === "CARD"
				? "by card"
				: method === "TRANSFER"
					? "by transfer"
					: "in cash";
		if (payment.status === "APPROVED")
			toast.success(`${naira(amt)} ${label} recorded`, {
				description: receiptNote,
			});
		else
			toast.info(`${naira(amt)} ${label} is processing`, {
				description:
					method === "TRANSFER"
						? "Finance matches it to the bank line"
						: "The POS confirms it; see My payments",
			});
		onDone?.(payment);
		setStep("done");
	}

	const footer = (() => {
		switch (step) {
			case "who":
				return (
					<>
						<button type="button" className={btn.secondary} onClick={onFinish}>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!guestName || amt <= 0}
							onClick={() => setStep("method")}
						>
							Continue · {naira(amt)}
						</button>
					</>
				);
			case "method":
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => (tgt ? (onBack ?? onFinish)() : setStep("who"))}
						>
							Back
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={amt <= 0 || (method === "CARD" && !terminal)}
							onClick={() =>
								setStep(
									method === "CARD"
										? "card"
										: method === "TRANSFER"
											? "transfer"
											: "cash",
								)
							}
						>
							{method === "CARD"
								? "Send to POS"
								: method === "TRANSFER"
									? "Show transfer details"
									: "Count cash"}
						</button>
					</>
				);
			case "card":
				if (card === "approved" || card === "sent")
					return (
						<button
							type="button"
							className={btn.primary}
							onClick={() => setStep("receipt")}
						>
							Continue to receipt
						</button>
					);
				if (card === "declined" || card === "no_response")
					return (
						<>
							<button
								type="button"
								className={btn.secondary}
								onClick={() => {
									setRecorded(null);
									setStep("method");
								}}
							>
								Try another way
							</button>
							<button
								type="button"
								className={btn.primary}
								onClick={() => {
									setRecorded(null);
									setAttempt((a) => a + 1);
								}}
							>
								Try again on POS
							</button>
						</>
					);
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => {
								setRecorded(null);
								setStep("method");
							}}
						>
							Cancel payment
						</button>
						<button type="button" className={btn.primary} onClick={onFinish}>
							Minimize
						</button>
					</>
				);
			case "transfer":
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setStep("method")}
						>
							Back
						</button>
						<button
							type="button"
							className={btn.primary}
							onClick={() => setStep("receipt")}
						>
							I've confirmed the transfer
						</button>
					</>
				);
			case "cash":
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setStep("method")}
						>
							Back
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={typeof tendered !== "number" || tendered < amt}
							onClick={() => setStep("receipt")}
						>
							Cash received
						</button>
					</>
				);
			case "receipt":
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => {
								setReceipt("NONE");
								void finish("NONE");
							}}
							disabled={sending}
						>
							Skip receipt
						</button>
						<button
							type="button"
							className={btn.primary}
							onClick={() => void finish()}
							disabled={
								sending ||
								(receipt === "EMAIL" && !/^\S+@\S+\.\S+$/.test(contact.trim()))
							}
						>
							{sending ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : receipt === "NONE" ? (
								"Record payment"
							) : (
								"Email receipt & record"
							)}
						</button>
					</>
				);
			case "done":
				return (
					<button
						type="button"
						className={btn.primary}
						disabled={doneBusy}
						onClick={onFinish}
					>
						{doneBusy ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							doneLabel
						)}
					</button>
				);
			case "idle":
				return null;
		}
	})();

	const body = (
		<>
			{step === "who" && (
				<div className="flex flex-col gap-4">
					<SelectField
						label="Guest folio"
						value={folioId}
						onChange={(v) => {
							setFolioId(v);
							const f = folios.find((x) => x.id === v);
							if (f) {
								setGuestName(f.guestName);
								setAmount(Math.max(0, f.balance));
							}
						}}
						placeholder="Pick an open folio…"
						options={folios
							.filter(
								(f) =>
									f.status === "OPEN" || f.status === "CLOSED_WITH_BALANCE",
							)
							.map((f) => ({
								value: f.id,
								label: `${f.guestName} · Room ${f.roomNumber}`,
								hint: `${f.balance > 0 ? `${naira(f.balance)} due` : "Paid up"} · ${f.reference}`,
							}))}
					/>
					<p className="text-center text-xs text-ink-3">
						or a walk-in / someone without a folio
					</p>
					<TextField
						label="Who is paying"
						value={guestName}
						onChange={setGuestName}
						placeholder="Name on the receipt"
					/>
					<MoneyField
						label="Amount"
						value={amount}
						onChange={setAmount}
						required
					/>
					<TextField
						label="What for"
						value={description}
						onChange={setDescription}
					/>
				</div>
			)}

			{step === "method" && (
				<div className="flex flex-col gap-4">
					{editAmount ? (
						<MoneyField
							label="Amount"
							value={amount}
							onChange={setAmount}
							required
							hint={
								tgt && tgt.amountDue > 0
									? `${naira(tgt.amountDue)} outstanding`
									: undefined
							}
						/>
					) : (
						<TotalsList
							rows={[{ label: "Taking", value: naira(amt), strong: true }]}
						/>
					)}
					<ChoiceCards
						label="Method"
						value={method}
						onChange={setMethod}
						options={[
							{
								value: "CARD",
								label: "Card on the POS",
								hint: "Guest taps or inserts · result comes back on its own",
							},
							{
								value: "TRANSFER",
								label: "Bank transfer",
								hint: "Show the account · confirm when it lands",
							},
							{ value: "CASH", label: "Cash", hint: "Goes into your till" },
						]}
					/>
					{method === "CARD" && (
						<SelectField
							label="Terminal"
							value={terminal}
							onChange={setTerminal}
							options={terminals.map((t) => ({
								value: t.id,
								label: `${t.name} · ${t.provider}`,
								hint:
									t.status === "ONLINE"
										? "Online"
										: "Offline · last seen yesterday",
							}))}
							setupLink="terminals"
						/>
					)}
					{method === "CARD" &&
						terminals.find((t) => t.id === terminal)?.status === "OFFLINE" && (
							<Note tone="danger">
								That terminal is offline. Pick another or take cash/transfer.
							</Note>
						)}
				</div>
			)}

			{step === "card" && (
				<div className="flex flex-col items-center gap-4 py-6 text-center">
					{card === "approved" ? (
						<CheckCircle2Icon className="size-16 text-success" />
					) : card === "declined" || card === "no_response" ? (
						<XCircleIcon className="size-16 text-danger" />
					) : (
						<span className="relative flex size-16 items-center justify-center">
							<span className="absolute inset-0 animate-ping rounded-full bg-brand-soft" />
							<Loader2Icon className="relative size-10 animate-spin text-brand" />
						</span>
					)}
					<div>
						<p className="text-lg font-bold text-ink">
							{card === "waiting"
								? "Sending to the terminal…"
								: card === "paying"
									? "Processing on the terminal…"
									: card === "approved"
										? `${naira(amt)} approved`
										: card === "sent"
											? `${naira(amt)} sent to the POS`
											: card === "declined"
												? "The bank declined this card"
												: cardError
													? "The card wasn't sent"
													: "The terminal didn't answer"}
						</p>
						<p className="mt-1 max-w-sm text-[13px] text-ink-3">
							{card === "approved"
								? `${recorded?.id ? `Payment ${recorded.id.slice(0, 8).toUpperCase()} · ` : ""}posted to the folio.`
								: card === "sent"
									? "The guest taps or inserts the card. The payment stays as processing in My payments until the POS confirms it; the folio updates on its own."
									: card === "declined"
										? "Nothing was charged. Ask the guest for another card, or take a transfer or cash."
										: card === "no_response"
											? (cardError ??
												"Check the terminal is on and connected, then try again. Nothing was charged.")
											: `Hand ${terminals.find((t) => t.id === terminal)?.name ?? "the POS"} to the guest. This updates when the POS answers.`}
						</p>
					</div>
					<div className="flex gap-2">
						<StatusPill tone={card === "waiting" ? "grey" : "success"}>
							Sent to POS
						</StatusPill>
						<StatusPill
							tone={
								card === "waiting"
									? "grey"
									: card === "sent"
										? "info"
										: "warning"
							}
						>
							Guest paying
						</StatusPill>
						<StatusPill
							tone={
								card === "approved"
									? "success"
									: card === "paying" || card === "waiting" || card === "sent"
										? "grey"
										: "danger"
							}
						>
							Result
						</StatusPill>
					</div>
				</div>
			)}

			{step === "transfer" && (
				<div className="flex flex-col gap-4">
					<PanelSection title="Guest transfers to">
						<div className="rounded-xl border border-line bg-subtle/60 p-4">
							<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
								GTBank
							</p>
							<p className="text-2xl font-bold tracking-wide text-ink">
								0123456789
							</p>
							<p className="text-[13px] text-ink-2">Simpas Hotels Ltd</p>
							<p className="mt-2 text-[13px] font-semibold text-ink">
								{naira(amt)} · reference{" "}
								{folio?.reference ?? guestName.split(" ")[0].toUpperCase()}
							</p>
						</div>
					</PanelSection>
					<Note tone="info">
						Finance matches the bank line to this payment. It shows as
						“processing” in My payments until then.
					</Note>
					<TextField
						label="Sender's name or bank reference"
						value={contact}
						onChange={setContact}
						placeholder="As it shows on the alert"
					/>
				</div>
			)}

			{step === "cash" && (
				<div className="flex flex-col gap-4">
					<TotalsList
						rows={[{ label: "Amount due", value: naira(amt), strong: true }]}
					/>
					<MoneyField
						label="Cash received"
						value={tendered}
						onChange={setTendered}
						required
					/>
					{typeof tendered === "number" && tendered >= amt && (
						<Note tone="success">Change to give: {naira(tendered - amt)}</Note>
					)}
					{typeof tendered === "number" && tendered > 0 && tendered < amt && (
						<Note tone="danger">
							{naira(amt - tendered)} short — take the rest another way or
							record a part payment.
						</Note>
					)}
				</div>
			)}

			{step === "receipt" && (
				<div className="flex flex-col gap-4">
					<TotalsList
						rows={[
							{ label: "Paid", value: naira(amt) },
							{
								label: "Method",
								value:
									method === "CARD"
										? "Card"
										: method === "TRANSFER"
											? "Transfer"
											: "Cash",
							},
							{ label: "Guest", value: guestName, strong: true },
						]}
					/>
					<Field label="Receipt">
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
							{(
								[
									["EMAIL", "Email", MailIcon, false],
									["NONE", "Print", PrinterIcon, false],
									["WHATSAPP", "WhatsApp · coming soon", MessageCircleIcon, true],
									["SMS", "SMS · coming soon", BanknoteIcon, true],
								] as const
							).map(([key, label, Icon, soon]) => (
								<button
									key={key}
									type="button"
									disabled={soon}
									title={soon ? `${label.split(" ·")[0]} receipts are coming soon` : undefined}
									onClick={() => !soon && setReceipt(key as "EMAIL" | "NONE")}
									className={cn(
										"flex flex-col items-center gap-2 rounded-control border px-3 py-3 text-center text-[13px] font-semibold",
										soon
											? "cursor-not-allowed border-line text-ink-3 opacity-60"
											: receipt === key
												? "border-brand bg-brand-soft/50 text-brand"
												: "border-line text-ink-2 hover:bg-subtle",
									)}
								>
									<Icon className="size-5" /> {label}
								</button>
							))}
						</div>
					</Field>
					{receipt === "EMAIL" && (
						<TextField
							label="Guest's email"
							type="email"
							value={contact}
							onChange={setContact}
							placeholder="guest@email.com"
						/>
					)}
				</div>
			)}

			{step === "done" && (
				<div className="flex flex-col items-center gap-3 py-8 text-center">
					<CheckCircle2Icon className="size-16 text-success" />
					<p className="text-lg font-bold text-ink">
						{naira(amt)}{" "}
						{recorded && recorded.status !== "APPROVED"
							? "processing"
							: "recorded"}
					</p>
					<p className="max-w-sm text-[13px] text-ink-3">
						{recorded && recorded.status !== "APPROVED"
							? `It shows in My payments as processing until it is confirmed; ${guestName}'s folio updates then.`
							: `${guestName}'s folio is updated and the payment is in My payments.`}{" "}
						{method === "CASH"
							? "The cash is counted in your till."
							: method === "TRANSFER"
								? "Finance will match the transfer."
								: ""}
					</p>
					{recorded?.id && (recorded.status === "APPROVED" || card === "approved") && (
						<a
							href={`/receipt?payment=${encodeURIComponent(recorded.id)}`}
							target="_blank"
							rel="noopener"
							className={`${btn.secondary} flex items-center gap-2`}
						>
							<PrinterIcon className="size-4" /> Print receipt
						</a>
					)}
					{doneExtra}
				</div>
			)}
		</>
	);

	const footerInfo =
		step === "card" && card !== "approved"
			? "You can keep working · find it in My payments"
			: undefined;
	const view: PaymentStepsView = {
		title,
		subtitle,
		body,
		footer,
		footerInfo,
		step,
	};
	return { view, begin, step, recorded };
}

/** The steps as a render-prop component for hosts that mount them only while a payment is under way. */
export function PaymentSteps({
	children,
	...options
}: PaymentStepsOptions & { children: (view: PaymentStepsView) => ReactNode }) {
	const { view } = usePaymentSteps(options);
	return <>{children(view)}</>;
}

/** Standalone Record payment / Take a payment: one SidePanel around the steps. A fresh run on every open. */
export function TakePaymentPanel({
	open,
	onOpenChange,
	target,
	folios = [],
	terminals = [],
	onDone,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	target?: PaymentTarget | null;
	folios?: FolioRow[];
	terminals?: TerminalRow[];
	onDone?: (payment: TakenPayment) => void;
}) {
	const [run, setRun] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the target is read when the panel opens
	useEffect(() => {
		if (open) setRun((n) => n + 1);
	}, [open]);
	return (
		<PaymentSteps
			key={run}
			target={target}
			folios={folios}
			terminals={terminals}
			onDone={onDone}
			onFinish={() => onOpenChange(false)}
			onBack={() => onOpenChange(false)}
			editAmount
		>
			{(v) => (
				<SidePanel
					open={open}
					onOpenChange={onOpenChange}
					title={v.title}
					subtitle={v.subtitle}
					icon={CreditCardIcon}
					footer={v.footer}
					footerInfo={v.footerInfo}
				>
					{v.body}
				</SidePanel>
			)}
		</PaymentSteps>
	);
}
