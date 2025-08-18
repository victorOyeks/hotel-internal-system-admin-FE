import { Financials } from "@/components/roles/hotel-owner/financials"
import { revalidatePath } from "next/cache"


async function revalidate() {
    "use server";
    revalidatePath("/owner/financials")
}

function FinancesPage() {
  const breadcrumb = {
    title: "Financials",
    breadcrumbs: [
      { label: "Dashboard", href: "/owner/dashboard" },
      { label: "Financials", href: "/owner/financials" },
    ],
  }
  return (
    <Financials revalidate={revalidate} transactions={[]} breadcrumbs={breadcrumb} />
  )
}

export default FinancesPage