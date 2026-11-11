import { cn } from "@hospio/ui/utils";
import { container, SectionHeader } from "@/components/site";
import { CheckItem } from "./shared";

const points = [
	"Live preview while you choose",
	"Text colour picked automatically for readability",
	"Status colours stay the same, so “overdue” always looks overdue",
];

type Theme = {
	nav: string;
	railText: string;
	page: string;
	button: string;
	caption: string;
};

const themes: Theme[] = [
	{
		nav: "bg-brand",
		railText: "text-nav-foreground",
		page: "bg-page",
		button: "bg-brand",
		caption: "Hospio360 default · Maroon",
	},
	{
		nav: "bg-teal-nav",
		railText: "text-white/70",
		page: "bg-teal-page",
		button: "bg-teal-brand",
		caption: "Hotel brand · Teal (example)",
	},
];

const rail = ["Today", "Rooms", "Guests", "Till"];
const arrivals = [
	{ name: "Adebayo Ogunleye", room: "A204 · Deluxe" },
	{ name: "Ifeoma Nwachukwu", room: "A302 · Suite" },
];

export function YourBrand() {
	return (
		<section id="brand" className="scroll-mt-[88px] bg-page">
			<div
				className={cn(
					container,
					"grid items-center gap-12 py-16 md:py-[112px] lg:grid-cols-[360px_minmax(0,1fr)]",
				)}
			>
				<div className="flex flex-col gap-7">
					<SectionHeader
						align="left"
						eyebrow="Your brand"
						title="Your hotel, your colours."
						intro="Upload your logo and pick your palette in Hotel setup. Every staff tablet and portal takes on your brand at sign-in."
					/>
					<ul className="flex flex-col gap-3">
						{points.map((p) => (
							<CheckItem key={p}>{p}</CheckItem>
						))}
					</ul>
				</div>
				<div className="grid gap-6 sm:grid-cols-2">
					{themes.map((t) => (
						<figure
							key={t.caption}
							className="flex flex-col items-center gap-3"
						>
							<TabletPreview theme={t} />
							<figcaption className="text-sm font-medium text-ink-2">
								{t.caption}
							</figcaption>
						</figure>
					))}
				</div>
			</div>
		</section>
	);
}

/** Static illustration of the staff tablet's home screen in one brand theme. */
function TabletPreview({ theme }: { theme: Theme }) {
	return (
		<div
			aria-hidden
			className={cn(
				"flex h-[330px] w-full overflow-hidden rounded-[16px] border border-line shadow-[0_20px_48px_rgba(77,8,31,0.1)]",
				theme.page,
			)}
		>
			<div
				className={cn(
					"flex w-[84px] shrink-0 flex-col items-center gap-1 px-[2px] py-[14px]",
					theme.nav,
				)}
			>
				<span className="flex size-10 items-center justify-center rounded-control bg-white/10 text-base font-bold text-white">
					S
				</span>
				{rail.map((item, i) => (
					<span
						key={item}
						className={cn(
							"flex h-14 w-20 items-center justify-center rounded-control text-[11px]",
							i === 0
								? "bg-white/10 font-semibold text-white"
								: cn("font-medium", theme.railText),
						)}
					>
						{item}
					</span>
				))}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-[14px] p-4 sm:p-5">
				<p className="text-[18px] font-bold text-ink">Good morning, Victor</p>
				<p className="-mt-2 text-xs text-ink-2">Front desk · Simpas Ikeja</p>
				<div className="flex flex-col gap-[10px] rounded-[14px] border border-line bg-card p-[14px]">
					<p className="text-[13px] font-bold text-ink">Arriving today</p>
					{arrivals.map((a) => (
						<div key={a.name} className="flex items-center gap-2">
							<div className="flex min-w-0 flex-1 flex-col">
								<p className="text-xs font-semibold leading-tight text-ink">
									{a.name}
								</p>
								<p className="text-[11px] text-ink-2">{a.room}</p>
							</div>
							<span
								className={cn(
									"shrink-0 rounded-control px-3 py-[10px] text-[13px] font-semibold text-white",
									theme.button,
								)}
							>
								Check in
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
