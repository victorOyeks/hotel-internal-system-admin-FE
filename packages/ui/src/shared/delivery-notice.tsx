"use client";

import {
	CheckIcon,
	CopyIcon,
	MailIcon,
	MessageCircleIcon,
	SmartphoneIcon,
	XIcon,
} from "lucide-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { cn } from "@hospio/ui/utils";
import { copyText } from "./invite-card";
import {
	type DeliveryBatch,
	type DeliveryLike,
	deliveriesAtom,
	deliveriesStore,
	dismissDeliveries,
	SHOW_DELIVERIES,
} from "./deliveries-store";
import { StatusPill } from "./status-pill";
import { btn } from "./ui";

/**
 * Top-centre notice: one card per batch of messages the platform sent (email, SMS, WhatsApp) or only saved (a channel
 * that is switched off here), each with what it said and a Copy button, so the text can also be passed on by hand.
 * Stays until closed. Mount once per layout: `<DeliveryNotice />`.
 */
export function DeliveryNotice() {
	const batches = useAtomValue(deliveriesAtom, { store: deliveriesStore });
	if (!SHOW_DELIVERIES || batches.length === 0) return null;
	return (
		<div
			className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4"
			aria-live="polite"
		>
			{batches.map((b) => (
				<DeliveryCard key={b.id} batch={b} />
			))}
		</div>
	);
}

const channelMeta: Record<string, { label: string; icon: typeof MailIcon }> = {
	EMAIL: { label: "Email", icon: MailIcon },
	SMS: { label: "SMS", icon: SmartphoneIcon },
	WHATSAPP: { label: "WhatsApp", icon: MessageCircleIcon },
};

function DeliveryCard({ batch }: { batch: DeliveryBatch }) {
	return (
		<section className="pointer-events-auto w-full max-w-[640px] overflow-hidden rounded-card border border-warning/40 bg-card shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
			<header className="flex items-start gap-3 border-b border-line bg-warning-soft/60 px-5 py-3">
				<div className="min-w-0 flex-1">
					<p className="text-[13px] font-bold text-ink">{batch.title}</p>
					<p className="text-xs text-ink-2">
						{batch.deliveries.some((d) => d.status === "NOT_CONNECTED")
							? "Some of these aren't sent from here · copy them to the person"
							: "On their way · the text is here to copy too"}
					</p>
				</div>
				<button
					type="button"
					onClick={() => dismissDeliveries(batch.id)}
					className={cn(btn.secondary, btn.small, "flex items-center gap-1")}
				>
					<XIcon className="size-3" /> Close
				</button>
			</header>
			<ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
				{batch.deliveries.map((d, i) => (
					<DeliveryRow key={`${batch.id}-${i}`} delivery={d} />
				))}
			</ul>
		</section>
	);
}

/**
 * What happened to one message, in words. SMS_SENT / WHATSAPP_SENT mean handed to the sender: on staging only allow-listed
 * numbers really receive them, and a WhatsApp without an approved template goes as an SMS (docs/sms-whatsapp.md).
 */
export function deliveryOutcome(d: DeliveryLike): {
	label: string;
	tone: "success" | "grey" | "warning";
} {
	if (d.channel === "EMAIL") {
		return d.status === "NOT_CONNECTED"
			? { label: "Not sent · email is off here", tone: "grey" }
			: { label: `Email sent to ${d.to ?? "—"}`, tone: "success" };
	}
	if (d.status === "SMS_SENT")
		return { label: `SMS sending to ${d.to ?? "—"}`, tone: "success" };
	if (d.status === "WHATSAPP_SENT")
		return {
			label: `WhatsApp sending to ${d.to ?? "—"} (SMS if WhatsApp can't)`,
			tone: "success",
		};
	return {
		label: `Not sent · ${d.channel === "SMS" ? "SMS" : "WhatsApp"} is off here`,
		tone: "warning",
	};
}

function DeliveryRow({ delivery: d }: { delivery: DeliveryLike }) {
	const [done, setDone] = useState(false);
	const meta = channelMeta[d.channel] ?? { label: d.channel, icon: MailIcon };
	const Icon = meta.icon;
	const outcome = deliveryOutcome(d);
	return (
		<li className="flex flex-col gap-2 px-5 py-3">
			<div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
				<StatusPill tone="info" dot={false} className="gap-1">
					<Icon className="size-3" /> {meta.label}
				</StatusPill>
				<span className="font-medium text-ink">To: {d.to || "—"}</span>
				{d.kind && (
					<span className="text-ink-3">
						· {d.kind.toLowerCase().replace(/_/g, " ")}
					</span>
				)}
				<span className="flex-1" />
				<button
					type="button"
					className={cn(btn.secondary, btn.small, "flex items-center gap-1")}
					onClick={async () => {
						if (
							await copyText(
								[d.subject, d.text].filter(Boolean).join("\n\n"),
								"Message copied",
							)
						) {
							setDone(true);
							setTimeout(() => setDone(false), 1500);
						}
					}}
				>
					{done ? (
						<CheckIcon className="size-3" />
					) : (
						<CopyIcon className="size-3" />
					)}{" "}
					{done ? "Copied" : "Copy"}
				</button>
			</div>
			<StatusPill tone={outcome.tone} className="w-fit">
				{outcome.label}
			</StatusPill>
			{d.subject && (
				<p className="text-[13px] font-semibold text-ink">{d.subject}</p>
			)}
			<pre className="whitespace-pre-wrap rounded-[10px] bg-subtle px-3 py-2 font-sans text-xs leading-relaxed text-ink">
				{d.text}
			</pre>
		</li>
	);
}
