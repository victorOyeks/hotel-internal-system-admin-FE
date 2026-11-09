import { InventoryPage } from "@/components/roles/inventory/page";

export const dynamic = "force-dynamic";

/** Inventory · stock (docs/inventory-stores.md). */
export default function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	return (
		<InventoryPage screen="stock" mode="role" searchParams={searchParams} />
	);
}
