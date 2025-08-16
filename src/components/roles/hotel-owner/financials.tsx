"use client";

import { Button } from "@/components/ui/button";
import { atom, useAtom, useAtomValue } from "jotai";
import { type Transaction, TransactionSection } from "./financials.transaction";
import { AnalyticsSection } from "./financials.analytics";

const sectionAtom = atom<"analytics" | "transactions">("analytics");

function Toolbar() {
  const [section, setSection] = useAtom(sectionAtom);

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-2xl">
      <div className="flex items-center">
        <Button
          variant={section === "analytics" ? "secondary" : "ghost"}
          onClick={() => setSection("analytics")}
          className="rounded-none shadow-none"
        >
          Analytics
        </Button>
        <Button
          variant={section === "transactions" ? "secondary" : "ghost"}
          onClick={() => setSection("transactions")}
          className="rounded-none shadow-none"
        >
          Transactions
        </Button>
      </div>

      <Button>Export</Button>
    </div>
  );
}

export function Financials({
    revalidate,
    transactions,
    }: {
    revalidate: () => Promise<void>;
    transactions: Transaction[];
}) {
  const section = useAtomValue(sectionAtom);

  return (
    <div className="flex flex-col space-y-4 px-2">
      <Toolbar />
      <div className="flex-1">
        {section === "analytics" ? (
          <AnalyticsSection />
        ) : (
          <TransactionSection transactions={transactions} revalidate={revalidate} />
        )}
      </div>
    </div>
  );
}
