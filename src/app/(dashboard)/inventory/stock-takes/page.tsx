import { StockTakePage } from "@/components/roles/inventory/stock-take-page";
import {
  mockStockTakes,
  mockStockTakeStats,
} from "@/components/roles/inventory/stock-take-mock";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";

export default async function Page() {
  // Simulate API call
  const stockTakes = await Promise.resolve(mockStockTakes);
  const stats = await Promise.resolve(mockStockTakeStats);

  return (
    <BreadCrumbWrapper breadcrumbs={{
      breadcrumbs: [],
      title: ""
    }}>
      <StockTakePage stockTakes={stockTakes} stats={stats} />
    </BreadCrumbWrapper>
  );
}
