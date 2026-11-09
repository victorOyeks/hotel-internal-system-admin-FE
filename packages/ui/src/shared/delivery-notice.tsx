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
 * Top-centre notice: one card per batch of messages the platform would have sent. Email and SMS are not
 * connected on staging, so the text that would have gone out is shown here instead, with a Copy button
 * per message. Stays until closed. Mount once per layout: `<DeliveryNotice />`.
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
						What we would have sent · email and SMS are not connected on staging
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

function DeliveryRow({ delivery: d }: { delivery: DeliveryLike }) {
	const [done, setDone] = useState(false);
	const meta = channelMeta[d.channel] ?? { label: d.channel, icon: MailIcon };
	const Icon = meta.icon;
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
			{d.subject && (
				<p className="text-[13px] font-semibold text-ink">{d.subject}</p>
			)}
			<pre className="whitespace-pre-wrap rounded-[10px] bg-subtle px-3 py-2 font-sans text-xs leading-relaxed text-ink">
				{d.text}
			</pre>
		</li>
	);
}
