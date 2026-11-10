import {
	ArrowUpDownIcon,
	CreditCardIcon,
	type LucideIcon,
	ReceiptIcon,
	SendIcon,
} from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { btnLg, container, SectionHeader } from "@/components/site";
import { IconTile, type PillTone, shotShadow, StatusPill } from "./shared";

const features: { icon: LucideIcon; title: string; text: string }[] = [
	{
		icon: ReceiptIcon,
		title: "Every charge, from every outlet",
		text: "Bar, kitchen, laundry and minibar charges land on the right room the moment they happen.",
	},
	{
		icon: ArrowUpDownIcon,
		title: "Split, move or discount — with control",
		text: "Split a folio for the company, move charges between rooms. Discounts and voids are manager-only.",
	},
	{
		icon: SendIcon,
		title: "Receipts by email, from your hotel’s name",
		text: "Guests get confirmations and receipts by email, sent in your hotel’s name. WhatsApp and SMS are coming soon.",
	},
];

const lines: {
	time: string;
	what: string;
	from: string;
	fromTone: PillTone;
	charge: string;
	credit?: boolean;
}[] = [
	{
		time: "8:40pm",
		what: "Dinner · 2 mains, 1 drink",
		from: "Restaurant",
		fromTone: "grey",
		charge: "₦9,500",
	},
	{
		time: "3:15pm",
		what: "Laundry · 4 items",
		from: "Housekeeping",
		fromTone: "grey",
		charge: "₦4,000",
	},
	{
		time: "10:02pm",
		what: "Minibar · 2 juices, crisps",
		from: "Housekeeping",
		fromTone: "grey",
		charge: "₦6,200",
	},
	{
		time: "9:10am",
		what: "Breakfast · 2 people",
		from: "Restaurant",
		fromTone: "grey",
		charge: "₦9,000",
	},
	{
		time: "11:30am",
		what: "Payment · bank transfer",
		from: "Front desk",
		fromTone: "blue",
		charge: "−₦45,000",
		credit: true,
	},
];

const row =
	"grid grid-cols-[64px_minmax(0,1fr)_88px] items-center gap-3 px-4 sm:grid-cols-[70px_minmax(0,1fr)_120px_90px] sm:px-6";

export function GuestFolio() {
	return (
		<section id="folio" className="scroll-mt-[88px] bg-card">
			<div
				className={cn(
					container,
					"grid items-center gap-12 py-16 md:py-[112px] lg:grid-cols-[minmax(0,1fr)_620px] lg:gap-16",
				)}
			>
				<div className="flex flex-col gap-7">
					<SectionHeader
						align="left"
						eyebrow="Guest folio"
						title="The bill that keeps itself."
						intro="Dinner at the restaurant, drinks at the bar, laundry, the minibar — every department posts straight to the guest’s folio. No paper slips, no end-of-stay surprises."
						titleClassName="max-w-[500px]"
					/>
					<ul className="flex flex-col gap-[18px]">
						{features.map((f) => (
							<li key={f.title} className="flex items-start gap-4">
								<IconTile icon={f.icon} />
								<div className="flex flex-col gap-1">
									<p className="text-[17px] font-bold text-ink">{f.title}</p>
									<p className="text-[15px] leading-[1.5] text-ink-2">
										{f.text}
									</p>
								</div>
							</li>
						))}
					</ul>
				</div>
				<FolioMock />
			</div>
		</section>
	);
}

/** Static illustration of a guest folio (design "Folio mock"). */
function FolioMock() {
	return (
		<div
			aria-hidden
			className={cn(
				"flex w-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-line bg-card",
				shotShadow,
			)}
		>
			<div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
				<div className="flex flex-col gap-1">
					<p className="text-[18px] font-bold text-ink">
						Folio A · Chidinma Obi
					</p>
					<p className="text-[13px] text-ink-2">
						A214 Deluxe · 27 Sep → 1 Oct · 4 nights
					</p>
				</div>
				<StatusPill label="Checked in" tone="green" />
			</div>
			<div
				className={cn(
					row,
					"bg-subtle py-[10px] text-[11px] font-bold uppercase tracking-[0.06em] text-ink-2",
				)}
			>
				<p>Time</p>
				<p>What</p>
				<p className="hidden sm:block">From</p>
				<p className="text-right">Charge</p>
			</div>
			{lines.map((l) => (
				<div
					key={l.time + l.what}
					className={cn(row, "border-b border-line py-[14px]")}
				>
					<p className="text-[13px] text-ink-2">{l.time}</p>
					<p className="truncate text-sm font-medium text-ink">{l.what}</p>
					<div className="hidden sm:block">
						<StatusPill label={l.from} tone={l.fromTone} />
					</div>
					<p
						className={cn(
							"text-right text-sm font-bold",
							l.credit ? "text-status-ok" : "text-ink",
						)}
					>
						{l.charge}
					</p>
				</div>
			))}
			<div className="flex flex-wrap items-center justify-between gap-4 bg-brand-soft p-4 sm:p-6">
				<div className="flex flex-col gap-[2px]">
					<p className="text-[13px] text-ink-2">Balance due now</p>
					<p className="text-[26px] font-bold leading-none text-brand">
						₦52,200
					</p>
				</div>
				<span
					className={cn(
						btn.primary,
						btnLg,
						"inline-flex items-center gap-[6px]",
					)}
				>
					<CreditCardIcon className="size-[15px]" />
					Take payment
				</span>
			</div>
		</div>
	);
}
