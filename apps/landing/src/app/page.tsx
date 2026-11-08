import {
	ArrowRightIcon,
	BarChart3Icon,
	BedDoubleIcon,
	BuildingIcon,
	CalendarCheckIcon,
	ChefHatIcon,
	CoinsIcon,
	ConciergeBellIcon,
	CreditCardIcon,
	MailIcon,
	MessageCircleIcon,
	MoonIcon,
	PackageIcon,
	ShieldCheckIcon,
	SprayCanIcon,
	WashingMachineIcon,
	WineIcon,
	WrenchIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { CONTACT_EMAIL, HOTEL_APP_URL, Section, SiteFooter, SiteHeader, WHATSAPP_URL } from "@/components/site";

const desks: { icon: LucideIcon; name: string; line: string }[] = [
	{ icon: ConciergeBellIcon, name: "Front office", line: "Arrivals, departures, folios and payments, all from one desk screen." },
	{ icon: SprayCanIcon, name: "Housekeeping", line: "Rooms to clean in the right order, inspections, minibar and lost & found." },
	{ icon: WashingMachineIcon, name: "Laundry", line: "Guest laundry charged to the room, hotel linen in and out." },
	{ icon: WrenchIcon, name: "Maintenance", line: "Repairs, out-of-order rooms, scheduled jobs and spare parts." },
	{ icon: ChefHatIcon, name: "Kitchen", line: "Orders to the pass, room service charged straight to the folio." },
	{ icon: WineIcon, name: "Bar", line: "Sales, tabs and nightly stock count, with the POS at the counter." },
	{ icon: PackageIcon, name: "Inventory", line: "Stores, stock levels, requests, purchase orders and deliveries." },
	{ icon: CoinsIcon, name: "Finance", line: "Today's money, expenses, tills and the night audit." },
	{ icon: BuildingIcon, name: "Manager", line: "Every department live, approvals, staff, rota and hotel setup." },
];

const day = [
	{ icon: CalendarCheckIcon, step: "1", title: "Book", text: "A guest is booked by phone, at the desk or by a company account; the confirmation goes out on WhatsApp." },
	{ icon: BedDoubleIcon, step: "2", title: "Check in", text: "Pick a ready room, collect what's due at the desk or on the POS, the folio opens itself." },
	{ icon: CreditCardIcon, step: "3", title: "Charge & pay", text: "Bar, kitchen, laundry and minibar land on the folio; card, transfer and cash are recorded as they happen." },
	{ icon: MoonIcon, step: "4", title: "Check out & night audit", text: "Settle the balance, the room goes to housekeeping, and the day closes with every till counted." },
];

const ownerPoints = [
	{ icon: BuildingIcon, title: "Every branch in one view", text: "Occupancy, revenue, arrivals and open issues for each hotel, side by side." },
	{ icon: ShieldCheckIcon, title: "Approvals that reach you", text: "Spend above your limit, large discounts and price changes wait for your yes." },
	{ icon: BarChart3Icon, title: "Reports without asking", text: "Daily summary, occupancy, revenue by source and expenses, scheduled to your inbox." },
];

export default function HomePage() {
	return (
		<>
			<SiteHeader />
			<main>
				<Hero />

				<Section id="desks" tone="page" eyebrow="Built for every desk" title="One system, a screen for each job" intro="Each role gets only what it needs, and everything they do lands in the same folio, the same till and the same report.">
					<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{desks.map((d) => (
							<li key={d.name} className="flex gap-4 rounded-card border border-line bg-card p-5">
								<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
									<d.icon className="size-5" />
								</span>
								<div className="min-w-0">
									<h3 className="text-[15px] font-bold text-ink">{d.name}</h3>
									<p className="mt-1 text-[13px] leading-relaxed text-ink-2">{d.line}</p>
								</div>
							</li>
						))}
					</ul>
				</Section>

				<Section id="day" eyebrow="How a day runs" title="From booking to night audit, nothing is retyped" intro="The front desk does its job and the money, the room board and the department queues update on their own.">
					<ol className="grid gap-4 md:grid-cols-4">
						{day.map((s, i) => (
							<li key={s.step} className="relative flex flex-col gap-3 rounded-card border border-line bg-card p-5">
								<div className="flex items-center justify-between">
									<span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
										<s.icon className="size-5" />
									</span>
									<span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Step {s.step}</span>
								</div>
								<h3 className="text-[15px] font-bold text-ink">{s.title}</h3>
								<p className="text-[13px] leading-relaxed text-ink-2">{s.text}</p>
								{i < day.length - 1 && <ArrowRightIcon className="absolute -right-4 top-1/2 hidden size-4 -translate-y-1/2 text-ink-3 md:block" aria-hidden />}
							</li>
						))}
					</ol>
				</Section>

				<Section id="owners" tone="brand" eyebrow="For owners" title="See the business, not the spreadsheet" intro="The owner's portal is view and download by design: what happened, what it made, and what is waiting on you.">
					<div className="grid gap-4 md:grid-cols-3">
						{ownerPoints.map((p) => (
							<div key={p.title} className="flex flex-col gap-3 rounded-card border border-white/15 bg-white/10 p-5">
								<span className="flex size-10 items-center justify-center rounded-xl bg-white text-brand">
									<p.icon className="size-5" />
								</span>
								<h3 className="text-[15px] font-bold text-white">{p.title}</h3>
								<p className="text-[13px] leading-relaxed text-white/75">{p.text}</p>
							</div>
						))}
					</div>
				</Section>

				<Section id="pricing" tone="page" eyebrow="Pricing" title="Pay for the hotel you run" intro="Two ways to pay, both without a setup fee. We'll help you pick the one that fits your occupancy.">
					<div className="grid gap-4 md:grid-cols-2">
						<PriceCard title="Per room, per month" lead="A flat amount for each room in the hotel" points={["Predictable: the same every month", "Every role and every branch included", "Best for hotels running above 60% occupancy"]} />
						<PriceCard title="A share of payments" lead="A small percentage of the payments taken through the system" points={["Nothing in a quiet month", "Every role and every branch included", "Best for new or seasonal hotels"]} />
					</div>
					<div className="flex flex-col items-start gap-3 rounded-card border border-line bg-card p-6 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-[15px] font-bold text-ink">Not sure which? Tell us about the hotel.</p>
							<p className="text-[13px] text-ink-2">Rooms, branches and how you take payments today. We reply the same day.</p>
						</div>
						<a href="#contact" className={cn(btn.primary, btn.large)}>
							Talk to us
						</a>
					</div>
				</Section>

				<Section id="contact" eyebrow="Contact" title="Talk to us" intro="A short call is enough to see the system with your own room types and prices.">
					<div className="grid gap-4 sm:grid-cols-2">
						<a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-4 rounded-card border border-line bg-card p-5 transition-colors hover:bg-brand-soft/40">
							<span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
								<MailIcon className="size-5" />
							</span>
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Email</p>
								<p className="text-[15px] font-bold text-ink">{CONTACT_EMAIL}</p>
							</div>
						</a>
						<a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-card border border-line bg-card p-5 transition-colors hover:bg-brand-soft/40">
							<span className="flex size-11 items-center justify-center rounded-xl bg-success-soft text-success">
								<MessageCircleIcon className="size-5" />
							</span>
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">WhatsApp</p>
								<p className="text-[15px] font-bold text-ink">Message us for a demo</p>
							</div>
						</a>
					</div>
				</Section>
			</main>
			<SiteFooter />
		</>
	);
}

function Hero() {
	return (
		<section className="border-b border-line bg-card">
			<div className="mx-auto grid w-full max-w-[1120px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
				<div className="flex flex-col gap-6">
					<p className="inline-flex w-fit items-center gap-2 rounded-pill bg-brand-soft px-3 py-1 text-[12px] font-semibold text-brand">Hotel operating system · Nigeria</p>
					<h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-ink md:text-[56px]">Run your hotels from one place</h1>
					<p className="max-w-xl text-lg leading-relaxed text-ink-2">
						Rooms, bookings, folios and POS payments at the front desk. Housekeeping, maintenance, kitchen and bar on their own screens. Inventory, finance and the night audit in the back office. And the owner sees every branch.
					</p>
					<div className="flex flex-wrap items-center gap-3">
						<a href={HOTEL_APP_URL} className={cn(btn.primary, btn.large)}>
							Sign in
						</a>
						<a href="#contact" className={cn(btn.secondary, btn.large)}>
							Talk to us
						</a>
					</div>
					<ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-3">
						<li>Naira everywhere</li>
						<li>Moniepoint and OPay terminals</li>
						<li>WhatsApp confirmations and receipts</li>
					</ul>
				</div>
				<Illustration />
			</div>
		</section>
	);
}

/** A stylised room board and money card, drawn with blocks so the page needs no images. */
function Illustration() {
	const states = ["bg-brand", "bg-brand", "bg-success", "bg-brand", "bg-[#dbab00]", "bg-brand", "bg-success", "bg-brand", "bg-brand", "bg-info", "bg-brand", "bg-success", "bg-brand", "bg-brand", "bg-line-strong", "bg-brand", "bg-success", "bg-brand", "bg-brand", "bg-brand", "bg-[#dbab00]", "bg-brand", "bg-success", "bg-brand"];
	return (
		<div aria-hidden className="relative mx-auto w-full max-w-[460px]">
			<div className="rounded-card border border-line bg-page p-5 shadow-[0_24px_60px_-30px_rgba(76,9,30,0.35)]">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Room status</p>
						<p className="text-sm font-bold text-ink">Simpas Ikeja · tonight</p>
					</div>
					<span className="rounded-pill bg-success-soft px-2 py-[3px] text-[11px] font-semibold text-success">84% occupied</span>
				</div>
				<div className="mt-4 grid grid-cols-8 gap-[6px]">
					{states.map((s, i) => (
						<span key={i} className={cn("h-7 rounded-[6px]", s)} />
					))}
				</div>
				<div className="mt-4 flex gap-3 text-[11px] text-ink-2">
					<span className="flex items-center gap-1"><span className="size-2 rounded-full bg-brand" /> Occupied</span>
					<span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" /> Ready</span>
					<span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#dbab00]" /> Cleaning</span>
					<span className="flex items-center gap-1"><span className="size-2 rounded-full bg-info" /> Arriving</span>
				</div>
			</div>
			<div className="absolute -bottom-8 -left-4 w-[220px] rounded-card border border-line bg-card p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.3)] sm:-left-10">
				<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Money today</p>
				<p className="mt-1 text-2xl font-bold text-ink">₦1.23M</p>
				<div className="mt-3 flex h-[6px] overflow-hidden rounded-full bg-subtle">
					<span className="w-[64%] bg-brand" />
					<span className="w-[25%] bg-info" />
					<span className="w-[11%] bg-success" />
				</div>
				<p className="mt-2 text-[11px] text-ink-2">Card · Transfer · Cash</p>
			</div>
		</div>
	);
}

function PriceCard({ title, lead, points }: { title: string; lead: string; points: string[] }) {
	return (
		<div className="flex flex-col gap-4 rounded-card border border-line bg-card p-6">
			<div>
				<h3 className="text-lg font-bold text-ink">{title}</h3>
				<p className="mt-1 text-[13px] text-ink-2">{lead}</p>
			</div>
			<ul className="flex flex-col gap-2">
				{points.map((p) => (
					<li key={p} className="flex items-start gap-2 text-[13px] text-ink-2">
						<span className="mt-[6px] size-[6px] shrink-0 rounded-full bg-brand" />
						{p}
					</li>
				))}
			</ul>
			<p className="mt-auto text-[12px] text-ink-3">Amounts are agreed per hotel; ask us for a quote.</p>
		</div>
	);
}
