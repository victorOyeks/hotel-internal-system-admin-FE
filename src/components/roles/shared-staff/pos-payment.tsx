"use client";

import { BanknoteIcon, CheckCircle2Icon, CreditCardIcon, LandmarkIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MoneyField, TextField } from "@/components/shared/field";
import { naira } from "@/components/shared/format";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";
import { BigButton } from "./tablet";

export type PosMethod = "CASH" | "CARD" | "TRANSFER";
type PosState = "idle" | "waiting" | "approved" | "declined" | "processing";

/**
 * Taking a payment on a staff tablet (Front office 8.x, Kitchen/Bar/Laundry "take payment"):
 * choose cash / card / transfer; card waits for the POS terminal (2s) and is approved, or declined
 * when the amount ends in 99 so the retry path can be seen; transfer goes to "processing" until
 * Finance matches it. `onDone` gets the method so the caller can close its order.
 */
export function PaymentFlow({ amount, description, onDone, terminal = "Bar POS", compact = false }: { amount: number; description: string; onDone: (method: PosMethod) => void; terminal?: string; compact?: boolean }) {
	const [method, setMethod] = useState<PosMethod>("CARD");
	const [state, setState] = useState<PosState>("idle");
	const [tendered, setTendered] = useState<number | "">(amount);
	const [reference, setReference] = useState("");
	const { run, pending } = useDemoAction();

	useEffect(() => {
		if (state !== "waiting") return;
		const t = setTimeout(() => setState(String(amount).endsWith("99") ? "declined" : "approved"), 2000);
		return () => clearTimeout(t);
	}, [state, amount]);

	const methods: { key: PosMethod; label: string; icon: typeof CreditCardIcon; hint: string }[] = [
		{ key: "CARD", label: "Card", icon: CreditCardIcon, hint: terminal },
		{ key: "TRANSFER", label: "Transfer", icon: LandmarkIcon, hint: "GTBank 0123456789" },
		{ key: "CASH", label: "Cash", icon: BanknoteIcon, hint: "Into your till" },
	];
	const change = typeof tendered === "number" ? Math.max(0, tendered - amount) : 0;

	return (
		<div className="flex flex-col gap-5">
			<TotalsList rows={[{ label: description, value: naira(amount) }, { label: "To pay", value: naira(amount), strong: true }]} />
			{state === "idle" && (
				<>
					<div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-3")}>
						{methods.map((m) => (
							<button key={m.key} type="button" onClick={() => setMethod(m.key)} className={cn("flex flex-col items-start gap-2 rounded-control border p-4 text-left", method === m.key ? "border-brand bg-brand-soft/40" : "border-line bg-card hover:bg-subtle")}>
								<m.icon className={cn("size-5", method === m.key ? "text-brand" : "text-ink-3")} />
								<span className="text-[15px] font-semibold text-ink">{m.label}</span>
								<span className="text-xs text-ink-3">{m.hint}</span>
							</button>
						))}
					</div>
					{method === "CASH" && (
						<div className="grid grid-cols-2 gap-3">
							<MoneyField label="Cash received" value={tendered} onChange={setTendered} />
							<div className="flex flex-col gap-[6px]">
								<span className="text-[13px] font-medium text-ink-2">Change to give</span>
								<p className="flex h-[42px] items-center rounded-control bg-subtle px-[14px] text-base font-bold text-ink">{naira(change)}</p>
							</div>
						</div>
					)}
					{method === "TRANSFER" && <TextField label="Sender name or reference (optional)" value={reference} onChange={setReference} placeholder="e.g. ADEBAYO O." hint="Finance matches the transfer against the bank statement; the sale shows as Processing until then." />}
					{method === "CARD" && <Note tone="info">Enter {naira(amount)} on {terminal} and hand it to the guest. The app updates when the terminal answers.</Note>}
					<BigButton
						pending={pending}
						onClick={() => {
							if (method === "CARD") setState("waiting");
							else if (method === "TRANSFER") run("Marked as transfer · waiting for Finance to match", () => onDone("TRANSFER"), { tone: "info" });
							else run(`${naira(amount)} cash taken · receipt sent`, () => onDone("CASH"));
						}}
					>
						{method === "CARD" ? `Send ${naira(amount)} to ${terminal}` : method === "TRANSFER" ? "Mark as paid by transfer" : `Take ${naira(amount)} cash`}
					</BigButton>
				</>
			)}
			{state === "waiting" && (
				<div className="flex flex-col items-center gap-3 rounded-card border border-line bg-subtle/60 px-6 py-10 text-center">
					<Loader2Icon className="size-8 animate-spin text-brand" />
					<p className="text-[15px] font-semibold text-ink">Waiting for the terminal…</p>
					<p className="text-sm text-ink-3">{naira(amount)} sent to {terminal}. Ask the guest to tap or insert their card.</p>
					<button type="button" onClick={() => setState("idle")} className="text-[13px] font-semibold text-ink-2 hover:underline">
						Cancel on the terminal
					</button>
				</div>
			)}
			{state === "approved" && (
				<div className="flex flex-col items-center gap-3 rounded-card border border-success/30 bg-success-soft px-6 py-10 text-center">
					<CheckCircle2Icon className="size-10 text-success" />
					<p className="text-lg font-bold text-ink">Approved · {naira(amount)}</p>
					<p className="text-sm text-ink-2">Receipt sent by WhatsApp. Ref MP-{Math.floor(Math.random() * 90000 + 10000)}</p>
					<BigButton className="mt-2 w-full" onClick={() => onDone("CARD")}>
						Done
					</BigButton>
				</div>
			)}
			{state === "declined" && (
				<div className="flex flex-col items-center gap-3 rounded-card border border-danger/30 bg-danger-soft px-6 py-10 text-center">
					<XCircleIcon className="size-10 text-danger" />
					<p className="text-lg font-bold text-ink">Declined by the bank</p>
					<p className="text-sm text-ink-2">Nothing was charged. Try the card again, or take cash or a transfer.</p>
					<div className="mt-2 grid w-full grid-cols-2 gap-2">
						<BigButton tone="secondary" onClick={() => setState("idle")}>
							Other method
						</BigButton>
						<BigButton onClick={() => setState("waiting")}>Try the card again</BigButton>
					</div>
				</div>
			)}
		</div>
	);
}

/** The side panel wrapper used by Laundry, Kitchen and Bar for "Take payment". */
export function TakePaymentPanel({ open, onOpenChange, amount, description, onDone, terminal }: { open: boolean; onOpenChange: (o: boolean) => void; amount: number; description: string; onDone: (method: PosMethod) => void; terminal?: string }) {
	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="Take payment" subtitle={description} icon={CreditCardIcon}>
			<PanelSection>
				<PaymentFlow amount={amount} description={description} onDone={onDone} terminal={terminal} />
			</PanelSection>
		</SidePanel>
	);
}
