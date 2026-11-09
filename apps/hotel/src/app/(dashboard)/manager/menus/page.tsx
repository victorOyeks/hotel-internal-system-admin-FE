import Link from "next/link";
import { MenuScreen } from "@/components/roles/shared-staff/menu-screen";
import { Note } from "@hospio/ui/shared/detail-list";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { data } from "@hospio/api/data";
import { cn } from "@hospio/ui/utils";

export const dynamic = "force-dynamic";

/**
 * Manager · Menus: the menu, categories, recipes and happy hours of every restaurant and bar. Price changes
 * from the kitchen and bar arrive in Approvals; a manager's own change applies at once.
 */
export default async function ManagerMenusPage({
	searchParams,
}: {
	searchParams: Promise<{ outlet?: string }>;
}) {
	const { outlet: wanted } = await searchParams;
	const outlets = await data.outlets.list();
	const outlet = outlets.find((o) => o.id === wanted) ?? outlets[0];
	if (!outlet)
		return (
			<>
				<PageHeader title="Menus" subtitle="Every restaurant and bar" />
				<Note tone="info">
					No restaurant or bar is set up yet. Add one in Hotel setup →
					Restaurants & tables.
				</Note>
			</>
		);
	const [menu, categories, happyHours, items] = await Promise.all([
		data.outlets.menu(outlet.id, true),
		data.outlets.categories(outlet.id),
		outlet.kind === "BAR"
			? data.outlets.happyHours(outlet.id)
			: Promise.resolve(undefined),
		data.inventory.items(),
	]);
	return (
		<>
			{outlets.length > 1 && (
				<nav className="flex flex-wrap gap-2" aria-label="Outlets">
					{outlets.map((o) => (
						<Link
							key={o.id}
							href={`/dashboard/menus?outlet=${o.id}`}
							className={cn(
								"rounded-pill px-4 py-2 text-[13px] font-semibold",
								o.id === outlet.id
									? "bg-brand text-white"
									: "bg-subtle text-ink-2 hover:text-ink",
							)}
						>
							{o.name}
						</Link>
					))}
				</nav>
			)}
			<MenuScreen
				key={outlet.id}
				title="Menus"
				menu={menu}
				outlet={outlet}
				categories={categories}
				happyHours={happyHours}
				stock={items.filter((i) => i.storeId === outlet.storeId)}
			/>
		</>
	);
}
