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
	{ name: "Share of guest payments", rate: "[YOUR RATE] %" },
	{ name: "Per room-night", rate: "₦[YOUR RATE]" },
	{ name: "Share of bookings", rate: "[YOUR RATE] %" },
];

const collection: { icon: LucideIcon; title: string; text: string }[] = [
	{
		icon: CreditCardIcon,
		title: "Card and transfer",
		text: "Split automatically by the POS provider when the guest pays.",
	},
	{ icon: BanknoteIcon, title: "Cash", text: "Invoiced once a month." },
	{
		icon: FileTextIcon,
		title: "Everything in view",
		text: "Your fees appear in Payments & payouts next to every branch.",
	},
];

export function Pricing() {
	return (
		<Section
			id="pricing"
			eyebrow="Pricing"
			title="Pay as your hotels earn."
			intro="No big licence up front. H.M.S takes an agreed share, set per business to fit how you operate."
		>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
				<div className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-6 md:p-8">
					<h3 className="text-[22px] font-bold text-ink">
						Choose the model that fits
					</h3>
					{models.map((m) => (
						<div
							key={m.name}
							className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[14px] border border-line bg-page p-[18px]"
						>
							<p className="text-base font-semibold text-ink">{m.name}</p>
							<p className="text-[18px] font-bold text-brand">{m.rate}</p>
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
						href="/#contact"
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
						Know hotel owners? Become an H.M.S partner.
					</h3>
					<p className="text-[15px] leading-[1.5] text-ink-2">
						Earn 20% of H.M.S’s share from every hotel you bring on, for 24
						months — paid monthly on what H.M.S actually receives (5% WHT
						applies).
					</p>
				</div>
				<a
					href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("H.M.S partner program")}`}
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
