import { SuppliesPage } from "@/components/roles/inventory/supplies-page"
import type { Breadcrumb } from "@/lib/store"


const breadcrumb = {
    title: "Supplies & Deliveries",
    breadcrumbs: [
        { label: "Inventory", href: "/dashboard" },
        { label: "Supplies & Deliveries", href: "/dashboard/supplies" },
    ] satisfies Breadcrumb[]
}

function Page() {
  return (
        <SuppliesPage
            breadcrumb={breadcrumb}
        />
  )
}

export default Page