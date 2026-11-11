import {
	ArrowRightIcon,
	BanknoteIcon,
	CreditCardIcon,
	FileTextIcon,
	type LucideIcon,
	MegaphoneIcon,
} from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { btnLg, CONTACT_EMAIL, Section } from "@/components/site";
import { IconTile } from "./shared";

const models = [
	{ name: "Share of guest payments", basis: "A percentage of what guests pay" },
	{ name: "Per room-night", basis: "A flat amount per room-night sold" },
	{ name: "Share of bookings", basis: "A percentage of booking value" },
];

const collection: { icon: LucideIcon; title: string; text: string }[] = [
	{
		icon: FileTextIcon,
		title: "One statement a month",
		text: "Your fee is worked out from your agreed model and sent as a monthly statement.",
	},
	{
		icon: CreditCardIcon,
		title: "Broken down by hotel",
		text: "Each statement shows what every hotel contributed.",
	},
	{
		icon: BanknoteIcon,
		title: "No licence up front",
		text: "You pay as your hotels earn, not before.",
	},
];

export function Pricing() {
	return (
		<Section
			id="pricing"
			eyebrow="Pricing"
			title="Pay as your hotels earn."
			intro="No big licence up front. Hospio360 takes an agreed share, set per business to fit how you operate."
		>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
				<div className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-6 md:p-8">
					<h3 className="text-[22px] font-bold text-ink">
						Choose the model that fits
					</h3>
					<p className="-mt-1 text-[15px] leading-[1.5] text-ink-2">
						The rate is agreed with each business. Ask us for a quote for your
						hotels.
					</p>
					{models.map((m) => (
						<div
							key={m.name}
							className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[14px] border border-line bg-page p-[18px]"
						>
							<p className="text-base font-semibold text-ink">{m.name}</p>
							<p className="text-sm text-ink-2">{m.basis}</p>
						</div>
					))}
				</div>
				<div className="flex flex-col gap-[18px] rounded-[16px] bg-brand p-6 md:p-8">
					<h3 className="text-[22px] font-bold text-white">
						How it’s collected
					</h3>
					{collection.map((c) => (
						<div key={c.title} className="flex items-start gap-[14px]">
							<IconTile icon={c.icon} tone="glass" size="sm" />
							<div className="flex flex-col gap-1">
								<p className="text-base font-bold text-white">{c.title}</p>
								<p className="text-sm leading-[1.5] text-nav-foreground">
									{c.text}
								</p>
							</div>
						</div>
					))}
					<a
						href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Hospio360 pricing")}`}
						className={cn(
							btn.secondary,
							btnLg,
							"inline-flex items-center gap-[6px] self-start",
						)}
					>
						<ArrowRightIcon className="size-[15px]" strokeWidth={2.5} />
						Talk to us about pricing
					</a>
				</div>
			</div>
			<div
				id="partners"
				className="flex scroll-mt-[88px] flex-col gap-6 rounded-[16px] bg-brand-soft p-6 md:flex-row md:items-center md:p-8"
			>
				<IconTile icon={MegaphoneIcon} tone="brand" size="lg" />
				<div className="flex flex-1 flex-col gap-[6px]">
					<h3 className="text-[22px] font-bold text-ink">
						Know hotel owners? Become a Hospio360 partner.
					</h3>
					<p className="text-[15px] leading-[1.5] text-ink-2">
						Earn 20% of Hospio360’s share from every hotel you bring on, for 24
						months — paid monthly on what Hospio360 actually receives (5% WHT
						applies).
					</p>
				</div>
				<a
					href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Hospio360 partner program")}`}
					className={cn(
						btn.primary,
						btnLg,
						"inline-flex items-center self-start md:self-center",
					)}
				>
					Become a partner
				</a>
			</div>
		</Section>
	);
}
