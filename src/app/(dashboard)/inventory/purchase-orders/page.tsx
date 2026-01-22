import { PurchaseOrderPage } from "@/components/roles/inventory/purchase-order-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
  mockPurchaseOrders,
  mockPOStats,
} from "@/components/roles/inventory/purchase-order-mock";

function Page() {
  // In a real implementation, we would fetch data here using the queryClient
  // const { content: orders } = use(queryClient.fetchQuery(...));
  // const stats = use(queryClient.fetchQuery(...));

  return (
    <BreadCrumbWrapper
      breadcrumbs={{
        title: "Purchase Orders",
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
          },
          {
            label: "Inventory",
            href: "/inventory",
          },
          {
            label: "Purchase Orders",
            href: "/inventory/purchase-orders",
          },
        ],
      }}
    >
      <PurchaseOrderPage orders={mockPurchaseOrders} stats={mockPOStats} />
    </BreadCrumbWrapper>
  );
}

export default Page;
