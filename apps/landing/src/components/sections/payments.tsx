import {
	BanknoteIcon,
	CheckIcon,
	CreditCardIcon,
	LandmarkIcon,
	LoaderCircleIcon,
	SmartphoneIcon,
	XIcon,
} from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { Section } from "@/components/site";
import { StatusPill } from "./shared";

const steps = [
	{
		title: "Choose the charges",
		text: "Pay the whole folio or pick the lines the guest is settling.",
	},
	{
		title: "Card, transfer or cash",
		text: "Card and transfer go to the role’s own POS. Cash is counted into the till.",
	},
	{
		title: "Keep working",
		text: "Minimise the payment to a chip and carry on — it reopens when the POS answers.",
	},
	{
		title: "Approved, declined or no answer",
		text: "Every outcome has a next step. Pending ones are verified from My payments.",
	},
];

const extras = [
	"Split card + cash",
	"POS offline → cash only",
	"Hotels that don’t take cash",
	"Check-out with a payment pending",
	"Refunds and disputes go to the manager",
];

export function Payments() {
	return (
		<Section
			id="payments"
			tone="brand"
			eyebrow="Payments at the POS"
			title="Card, transfer or cash — straight from the screen to the till."
			intro="Each role sends the payment to its own POS terminal. Staff keep working while it processes, and the result lands on the folio by itself. Only the receipt reaches the guest."
			titleClassName="max-w-[860px]"
		>
			<div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_480px]">
				<ol className="grid gap-4 sm:grid-cols-2">
					{steps.map((s, i) => (
						<li
							key={s.title}
							className="flex flex-col gap-3 rounded-[14px] border border-white/10 bg-white/[0.06] p-6"
						>
							<span className="flex size-8 items-center justify-center rounded-pill border border-white/40 text-sm font-bold text-white">
								{i + 1}
							</span>
							<p className="text-[18px] font-bold text-white">{s.title}</p>
							<p className="text-sm leading-[1.5] text-nav-foreground">
								{s.text}
							</p>
						</li>
					))}
				</ol>
				<TakePaymentMock />
			</div>
			<ul className="flex flex-wrap justify-center gap-[10px]">
				{extras.map((e) => (
					<li
						key={e}
						className="flex items-center gap-2 rounded-pill border border-white/40 px-[14px] py-2 text-sm text-nav-foreground"
					>
						<CheckIcon
							className="size-4 shrink-0 text-white"
							strokeWidth={2.5}
						/>
						{e}
					</li>
				))}
			</ul>
		</Section>
	);
}

/** Static illustration of the "Take payment" dialog (design "Take payment mock"). */
function TakePaymentMock() {
	return (
		<div
			aria-hidden
			className="flex w-full flex-col rounded-[20px] bg-card shadow-[0_24px_60px_rgba(26,0,10,0.35)]"
		>
			<div className="flex items-start justify-between gap-4 p-6">
				<div className="flex flex-col gap-1">
					<p className="text-[20px] font-bold text-ink">Take payment</p>
					<p className="text-[13px] text-ink-2">
						Chidinma Obi · Folio A · A214
					</p>
				</div>
				<XIcon className="size-5 shrink-0 text-ink" />
			</div>
			<div className="flex flex-col gap-[18px] px-6 pb-6">
				<div className="flex flex-col gap-[2px]">
					<p className="text-xs text-ink-2">Amount</p>
					<p className="text-[34px] font-bold leading-none tracking-[-0.01em] text-ink">
						₦52,200
					</p>
				</div>
				<div className="grid grid-cols-3 gap-2">
					<span className="flex items-center justify-center gap-2 rounded-control border-[1.5px] border-brand bg-brand-soft py-3 text-sm font-semibold text-brand">
						<CreditCardIcon className="size-[18px]" />
						Card
					</span>
					<span className="flex items-center justify-center gap-2 rounded-control border border-line bg-card py-3 text-sm font-semibold text-ink">
						<LandmarkIcon className="size-[18px]" />
						Transfer
					</span>
					<span className="flex items-center justify-center gap-2 rounded-control border border-line bg-card py-3 text-sm font-semibold text-ink">
						<BanknoteIcon className="size-[18px]" />
						Cash
					</span>
				</div>
				<div className="flex items-center gap-[14px] rounded-[14px] bg-subtle p-4">
					<LoaderCircleIcon
						className="size-7 shrink-0 animate-spin text-brand"
						strokeWidth={2.5}
					/>
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<p className="text-[15px] font-bold text-ink">
							Sent to POS 1 · Front desk
						</p>
						<p className="text-[13px] text-ink-2">
							Waiting for the guest’s card…
						</p>
					</div>
					<StatusPill
						label="Processing"
						tone="amber"
						className="hidden sm:inline-flex"
					/>
				</div>
				<div className="flex flex-wrap justify-end gap-[10px]">
					<span
						className={cn(btn.secondary, "inline-flex items-center gap-[6px]")}
					>
						<SmartphoneIcon className="size-[15px]" />
						Minimise · keep working
					</span>
					<span className={btn.danger}>Cancel</span>
				</div>
			</div>
		</div>
	);
}
