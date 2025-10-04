import { InventoryStat, QuickActions } from "@/components/roles/inventory/dasboard";

const inventoryStat = {
  totalItems: 100,
  available: 80,
  lowInStock: 15,
  outOfStock: 5,
};

function Page() {
  if (Math.random() < 0.5) {
    throw new Error("Failed to load inventory data");
  }
  return (
    <div className="space-y-4 px-4">
      <InventoryStat data={inventoryStat} />
      <QuickActions />
    </div>
  );
}

export default Page;
