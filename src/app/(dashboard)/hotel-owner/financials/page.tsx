import { Financials } from "@/components/roles/hotel-owner/financials"
import { revalidatePath } from "next/cache"


async function revalidate() {
    "use server";
    revalidatePath("/dashboard/financials")
}

function FinancesPage() {
  const breadcrumb = {
    title: "Financials",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard/dashboard" },
      { label: "Financials", href: "/dashboard/financials" },
    ],
  }
  return (
    <Financials revalidate={revalidate} transactions={[]} breadcrumbs={breadcrumb} />
  )
}

export default FinancesPage