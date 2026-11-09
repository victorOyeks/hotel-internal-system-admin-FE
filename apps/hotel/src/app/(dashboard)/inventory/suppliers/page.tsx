import { InventoryPage } from "@/components/roles/inventory/page";

export const dynamic = "force-dynamic";

/** Inventory · suppliers (docs/inventory-stores.md). */
export default function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	return (
		<InventoryPage screen="suppliers" mode="role" searchParams={searchParams} />
	);
}
