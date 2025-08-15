import { Financials } from "@/components/roles/hotel-owner/financials"
import { revalidatePath } from "next/cache"


async function revalidate() {
    "use server";
    revalidatePath("/owner/financials")
}

function FinancesPage() {
  return (
    <Financials revalidate={revalidate} transactions={[]} />
  )
}

export default FinancesPage