import { Financials } from "@/components/roles/manager/financials"
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
    <Financials revalidateAction={revalidate} expenses={[]} breadcrumbs={breadcrumb} />
  )
}

export default FinancesPage