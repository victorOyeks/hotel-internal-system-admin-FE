import {
	BedDoubleIcon,
	CoinsIcon,
	CrownIcon,
	DropletIcon,
	KeyRoundIcon,
	type LucideIcon,
	PackageIcon,
	PaintbrushIcon,
	SlidersHorizontalIcon,
	StoreIcon,
	WineIcon,
} from "lucide-react";
import { cn } from "@hospio/ui/utils";
import { container } from "@/components/site";

const roles: { icon: LucideIcon; label: string }[] = [
	{ icon: CrownIcon, label: "Owner" },
	{ icon: KeyRoundIcon, label: "Manager" },
	{ icon: BedDoubleIcon, label: "Front office" },
	{ icon: PaintbrushIcon, label: "Housekeeping" },
	{ icon: DropletIcon, label: "Laundry" },
	{ icon: SlidersHorizontalIcon, label: "Maintenance" },
	{ icon: StoreIcon, label: "Kitchen" },
	{ icon: WineIcon, label: "Bar" },
	{ icon: PackageIcon, label: "Inventory" },
	{ icon: CoinsIcon, label: "Finance" },
];

export function RolesStrip() {
	return (
		<section className="border-y border-line bg-card">
			<div
				className={cn(
					container,
					"flex flex-col items-center gap-5 py-10 md:py-14",
				)}
			>
				<p className="text-center text-[15px] font-medium text-ink-2">
					One system for everyone who keeps the hotel running
				</p>
				<ul className="flex flex-wrap justify-center gap-[10px]">
					{roles.map((r) => {
						const Icon = r.icon;
						return (
							<li
								key={r.label}
								className="flex items-center gap-2 rounded-pill border border-line bg-page px-4 py-[10px] text-[15px] font-medium text-ink"
							>
								<Icon className="size-[18px] text-brand" />
								{r.label}
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
