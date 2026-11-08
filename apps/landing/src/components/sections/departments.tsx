import {
	BedDoubleIcon,
	CoinsIcon,
	DropletIcon,
	type LucideIcon,
	PackageIcon,
	PaintbrushIcon,
	SlidersHorizontalIcon,
	StoreIcon,
	WineIcon,
} from "lucide-react";
import { Section } from "@/components/site";
import { IconTile } from "./shared";

const departments: { icon: LucideIcon; name: string; text: string }[] = [
	{
		icon: BedDoubleIcon,
		name: "Front office",
		text: "Arrivals, check-in and check-out, the room board, guest folios and taking payment at the desk.",
	},
	{
		icon: PaintbrushIcon,
		name: "Housekeeping",
		text: "Cleaning tasks, checklists, inspections and minibar — rooms show “ready” the moment they’re done.",
	},
	{
		icon: DropletIcon,
		name: "Laundry",
		text: "Guest laundry and hotel linen, with charges posted to the guest’s folio.",
	},
	{
		icon: SlidersHorizontalIcon,
		name: "Maintenance",
		text: "Repairs, scheduled jobs and out-of-order rooms, assigned to the right technician.",
	},
	{
		icon: StoreIcon,
		name: "Kitchen",
		text: "Orders and kitchen tickets per outlet — charged to a room or paid on the spot.",
	},
	{
		icon: WineIcon,
		name: "Bar",
		text: "Tabs, menus and happy hours, with payments sent to the bar’s own POS.",
	},
	{
		icon: PackageIcon,
		name: "Inventory",
		text: "Stores, stock requests, purchase orders, suppliers, deliveries and counts.",
	},
	{
		icon: CoinsIcon,
		name: "Finance",
		text: "Tills, cash, expenses, budgets, night audit and profit & loss.",
	},
];

export function Departments() {
	return (
		<Section
			id="departments"
			tone="card"
			eyebrow="Departments"
			title="Every department, connected."
			intro="When the front desk checks a guest in, housekeeping and the folio already know. When the kitchen sends a dish to A214, the charge is on the bill."
		>
			<ul className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{departments.map((d) => (
					<li
						key={d.name}
						className="flex flex-col gap-[14px] rounded-[16px] border border-line bg-page p-6"
					>
						<IconTile icon={d.icon} tone="brand" />
						<h3 className="text-[18px] font-bold text-ink">{d.name}</h3>
						<p className="text-sm leading-[1.5] text-ink-2">{d.text}</p>
					</li>
				))}
			</ul>
		</Section>
	);
}
