import { InventoryPage } from "@/components/roles/inventory/page";

export const dynamic = "force-dynamic";

/** Inventory for managers and owners: every store screen as a tab (?screen=requests|orders|deliveries|counts|suppliers). */
export default function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	return <InventoryPage mode="tabs" searchParams={searchParams} />;
}
