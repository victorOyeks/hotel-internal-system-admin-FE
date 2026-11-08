"use client";

import { BanknoteIcon, CheckCircle2Icon, CreditCardIcon, LandmarkIcon, Loader2Icon, MailIcon, MessageCircleIcon, XCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChoiceCards, Field, MoneyField, SelectField, TextField } from "@/components/shared/field";
import { naira } from "@/components/shared/format";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import type { FolioRow, PaymentMethod, TerminalRow } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export type PaymentTarget = { guestName: string; roomNumber?: string; folioId?: string; amountDue: number; description?: string };

type Step = "who" | "method" | "card" | "transfer" | "cash" | "receipt" | "done";
type CardState = "waiting" | "paying" | "approved" | "declined" | "no_response";

/**
 * Front office 8.1–8.12 · Taking payment. One panel, one step at a time: who is paying and how much,
 * the method, the terminal / transfer / cash step, the receipt, done. The POS result is simulated:
 * the first attempt is approved unless the amount ends in 999 (declined) or 777 (no response).
 */
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
	onDone?: (payment: { amount: number; method: PaymentMethod; guestName: string }) => void;
}) {
	const [step, setStep] = useState<Step>("who");
	const [folioId, setFolioId] = useState("");
	const [guestName, setGuestName] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [description, setDescription] = useState("Room charges");
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	const [terminal, setTerminal] = useState(terminals.find((t) => t.status === "ONLINE")?.id ?? "");
	const [card, setCard] = useState<CardState>("waiting");
	const [attempt, setAttempt] = useState(0);
	const [tendered, setTendered] = useState<number | "">("");
	const [receipt, setReceipt] = useState<"WHATSAPP" | "EMAIL" | "NONE">("WHATSAPP");
	const [contact, setContact] = useState("");
	const [sending, setSending] = useState(false);

	// Reset whenever the panel opens for a new target.
	useEffect(() => {
		if (!open) return;
		setStep(target ? "method" : "who");
		setFolioId(target?.folioId ?? "");
		setGuestName(target?.guestName ?? "");
		setAmount(target?.amountDue ?? "");
		setDescription(target?.description ?? "Room charges");
		setMethod("CARD");
		setCard("waiting");
		setAttempt(0);
		setTendered("");
		setReceipt("WHATSAPP");
		setContact("");
	}, [open, target]);

	// Simulated terminal: sent → guest paying → result.
	useEffect(() => {
		if (step !== "card") return;
		setCard("waiting");
		const t1 = setTimeout(() => setCard("paying"), 900);
		const t2 = setTimeout(() => {
			const n = typeof amount === "number" ? amount : 0;
			if (attempt === 0 && n % 1000 === 999) setCard("declined");
			else if (attempt === 0 && n % 1000 === 777) setCard("no_response");
			else setCard("approved");
		}, 2600);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, [step, attempt, amount]);

	const amt = typeof amount === "number" ? amount : 0;
	const folio = folios.find((f) => f.id === folioId);
	const title = { who: "Take a payment", method: "How is the guest paying?", card: card === "approved" ? "Approved on the terminal" : card === "declined" ? "Declined on the terminal" : card === "no_response" ? "No response from the terminal" : "Waiting for the guest on the POS", transfer: "Bank transfer", cash: "Cash", receipt: "Send a receipt", done: "Payment recorded" }[step];
	const subtitle = guestName ? `${guestName}${folio?.roomNumber ? ` · Room ${folio.roomNumber}` : target?.roomNumber ? ` · Room ${target.roomNumber}` : ""} · ${naira(amt)}` : "Choose who is paying";

	async function finish() {
		setSending(true);
		await new Promise((r) => setTimeout(r, 500));
		setSending(false);
		toast.success(`${naira(amt)} ${method === "CARD" ? "by card" : method === "TRANSFER" ? "by transfer" : "in cash"} recorded`, { description: receipt === "NONE" ? "No receipt sent" : `Receipt sent by ${receipt === "WHATSAPP" ? "WhatsApp" : "email"}` });
		onDone?.({ amount: amt, method, guestName });
		setStep("done");
	}

	const footer = (() => {
		switch (step) {
			case "who":
				return (
					<>
						<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button>
						<button type="button" className={btn.primary} disabled={!guestName || amt <= 0} onClick={() => setStep("method")}>Continue · {naira(amt)}</button>
					</>
				);
			case "method":
				return (
					<>
						<button type="button" className={btn.secondary} onClick={() => (target ? onOpenChange(false) : setStep("who"))}>Back</button>
						<button type="button" className={btn.primary} disabled={method === "CARD" && !terminal} onClick={() => setStep(method === "CARD" ? "card" : method === "TRANSFER" ? "transfer" : "cash")}>
							{method === "CARD" ? "Send to POS" : method === "TRANSFER" ? "Show transfer details" : "Count cash"}
						</button>
					</>
				);
			case "card":
				if (card === "approved") return <button type="button" className={btn.primary} onClick={() => setStep("receipt")}>Continue to receipt</button>;
				if (card === "declined" || card === "no_response")
					return (
						<>
							<button type="button" className={btn.secondary} onClick={() => setStep("method")}>Try another way</button>
							<button type="button" className={btn.primary} onClick={() => setAttempt((a) => a + 1)}>Try again on POS</button>
						</>
					);
				return (
					<>
						<button type="button" className={btn.secondary} onClick={() => setStep("method")}>Cancel payment</button>
						<button type="button" className={btn.primary} onClick={() => onOpenChange(false)}>Minimize</button>
					</>
				);
			case "transfer":
				return (
					<>
						<button type="button" className={btn.secondary} onClick={() => setStep("method")}>Back</button>
						<button type="button" className={btn.primary} onClick={() => setStep("receipt")}>I've confirmed the transfer</button>
					</>
				);
			case "cash":
				return (
					<>
						<button type="button" className={btn.secondary} onClick={() => setStep("method")}>Back</button>
						<button type="button" className={btn.primary} disabled={typeof tendered !== "number" || tendered < amt} onClick={() => setStep("receipt")}>Cash received</button>
					</>
				);
			case "receipt":
				return (
					<>
						<button type="button" className={btn.secondary} onClick={() => { setReceipt("NONE"); void finish(); }} disabled={sending}>Skip receipt</button>
						<button type="button" className={btn.primary} onClick={() => void finish()} disabled={sending}>
							{sending ? <Loader2Icon className="size-4 animate-spin" /> : receipt === "NONE" ? "Record payment" : "Send receipt & record"}
						</button>
					</>
				);
			case "done":
				return <button type="button" className={btn.primary} onClick={() => onOpenChange(false)}>Done</button>;
		}
	})();

	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title={title} subtitle={subtitle} icon={CreditCardIcon} footer={footer} footerInfo={step === "card" && card !== "approved" ? "You can keep working · find it in My payments" : undefined}>
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
						options={folios.filter((f) => f.status === "OPEN" || f.status === "CLOSED_WITH_BALANCE").map((f) => ({ value: f.id, label: `${f.guestName} · Room ${f.roomNumber}`, hint: `${f.balance > 0 ? `${naira(f.balance)} due` : "Paid up"} · ${f.reference}` }))}
					/>
					<p className="text-center text-xs text-ink-3">or a walk-in / someone without a folio</p>
					<TextField label="Who is paying" value={guestName} onChange={setGuestName} placeholder="Name on the receipt" />
					<MoneyField label="Amount" value={amount} onChange={setAmount} required />
					<TextField label="What for" value={description} onChange={setDescription} />
				</div>
			)}

			{step === "method" && (
				<div className="flex flex-col gap-4">
					<TotalsList rows={[{ label: "Taking", value: naira(amt), strong: true }]} />
					<ChoiceCards
						label="Method"
						value={method}
						onChange={setMethod}
						options={[
							{ value: "CARD", label: "Card on the POS", hint: "Guest taps or inserts · result comes back on its own" },
							{ value: "TRANSFER", label: "Bank transfer", hint: "Show the account · confirm when it lands" },
							{ value: "CASH", label: "Cash", hint: "Goes into your till" },
						]}
					/>
					{method === "CARD" && (
						<SelectField label="Terminal" value={terminal} onChange={setTerminal} options={terminals.map((t) => ({ value: t.id, label: `${t.name} · ${t.provider}`, hint: t.status === "ONLINE" ? "Online" : "Offline · last seen yesterday" }))} setupLink="terminals" />
					)}
					{method === "CARD" && terminals.find((t) => t.id === terminal)?.status === "OFFLINE" && <Note tone="danger">That terminal is offline. Pick another or take cash/transfer.</Note>}
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
							{card === "waiting" ? "Sending to the terminal…" : card === "paying" ? "Processing on the terminal…" : card === "approved" ? `${naira(amt)} approved` : card === "declined" ? "The bank declined this card" : "The terminal didn't answer"}
						</p>
						<p className="mt-1 max-w-sm text-[13px] text-ink-3">
							{card === "approved"
								? `Provider ref MP-${Math.floor(10000 + Math.random() * 89999)} · posted to the folio.`
								: card === "declined"
									? "Nothing was charged. Ask the guest for another card, or take a transfer or cash."
									: card === "no_response"
										? "Check the terminal is on and connected, then try again. Nothing was charged."
										: `Hand ${terminals.find((t) => t.id === terminal)?.name ?? "the POS"} to the guest. This updates on its own when the POS says approved or declined.`}
						</p>
					</div>
					<div className="flex gap-2">
						<StatusPill tone="success">Sent to POS</StatusPill>
						<StatusPill tone={card === "waiting" ? "grey" : "warning"}>Guest paying</StatusPill>
						<StatusPill tone={card === "approved" ? "success" : card === "paying" || card === "waiting" ? "grey" : "danger"}>Result</StatusPill>
					</div>
				</div>
			)}

			{step === "transfer" && (
				<div className="flex flex-col gap-4">
					<PanelSection title="Guest transfers to">
						<div className="rounded-xl border border-line bg-subtle/60 p-4">
							<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">GTBank</p>
							<p className="text-2xl font-bold tracking-wide text-ink">0123456789</p>
							<p className="text-[13px] text-ink-2">Simpas Hotels Ltd</p>
							<p className="mt-2 text-[13px] font-semibold text-ink">{naira(amt)} · reference {folio?.reference ?? guestName.split(" ")[0].toUpperCase()}</p>
						</div>
					</PanelSection>
					<Note tone="info">Finance matches the bank line to this payment. It shows as “processing” in My payments until then.</Note>
					<TextField label="Sender's name or bank reference" value={contact} onChange={setContact} placeholder="As it shows on the alert" />
				</div>
			)}

			{step === "cash" && (
				<div className="flex flex-col gap-4">
					<TotalsList rows={[{ label: "Amount due", value: naira(amt), strong: true }]} />
					<MoneyField label="Cash received" value={tendered} onChange={setTendered} required />
					{typeof tendered === "number" && tendered >= amt && <Note tone="success">Change to give: {naira(tendered - amt)}</Note>}
					{typeof tendered === "number" && tendered > 0 && tendered < amt && <Note tone="danger">{naira(amt - tendered)} short — take the rest another way or record a part payment.</Note>}
				</div>
			)}

			{step === "receipt" && (
				<div className="flex flex-col gap-4">
					<TotalsList rows={[{ label: "Paid", value: naira(amt) }, { label: "Method", value: method === "CARD" ? "Card" : method === "TRANSFER" ? "Transfer" : "Cash" }, { label: "Guest", value: guestName, strong: true }]} />
					<Field label="Send the receipt by">
						<div className="grid grid-cols-3 gap-2">
							{(
								[
									["WHATSAPP", "WhatsApp", MessageCircleIcon],
									["EMAIL", "Email", MailIcon],
									["NONE", "Don't send", BanknoteIcon],
								] as const
							).map(([key, label, Icon]) => (
								<button key={key} type="button" onClick={() => setReceipt(key)} className={cn("flex flex-col items-center gap-2 rounded-control border px-3 py-3 text-[13px] font-semibold", receipt === key ? "border-brand bg-brand-soft/50 text-brand" : "border-line text-ink-2 hover:bg-subtle")}>
									<Icon className="size-5" /> {label}
								</button>
							))}
						</div>
					</Field>
					{receipt !== "NONE" && <TextField label={receipt === "WHATSAPP" ? "WhatsApp number" : "Email"} value={contact} onChange={setContact} placeholder={receipt === "WHATSAPP" ? "+234 …" : "guest@email.com"} />}
				</div>
			)}

			{step === "done" && (
				<div className="flex flex-col items-center gap-3 py-8 text-center">
					<CheckCircle2Icon className="size-16 text-success" />
					<p className="text-lg font-bold text-ink">{naira(amt)} recorded</p>
					<p className="max-w-sm text-[13px] text-ink-3">{guestName}'s folio is updated and the payment is in My payments. {method === "CASH" ? "The cash is counted in your till." : method === "TRANSFER" ? "Finance will match the transfer." : ""}</p>
					<LandmarkIcon className="hidden" />
				</div>
			)}
		</SidePanel>
	);
}
