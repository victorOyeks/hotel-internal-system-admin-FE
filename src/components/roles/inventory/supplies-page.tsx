"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { atom, useSetAtom } from "jotai";
import { PlusIcon, SearchIcon } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect } from "react";

const successDialogAtom = atom({
  show: false,
  message: "",
});

function BookingsListToolbar() {
  const [view, setView] = useQueryState(
    "section",
    parseAsStringLiteral(["DELIVERY-HISTORY"])
  );
  const setSuccessDialogOpen = useSetAtom(successDialogAtom);

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div className="flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          data-active={view === null}
          onClick={() => setView(null)}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          All Suppliers
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={view === "DELIVERY-HISTORY"}
          onClick={() => setView("DELIVERY-HISTORY")}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          Delivery History
        </Button>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        <TableFilter></TableFilter>

        <Button
          size="sm"
          key={view ? view : "all-suppliers"}
          variant={!view ? "secondary" : "default"}
          className="rounded-md md:rounded-xl transition-[width,contents] will-change-contents duration-300"
        >
          <PlusIcon />
          <span className="hidden md:inline">
            {view === "DELIVERY-HISTORY" ? "Add Delivery history" : "Add Supplier"}
          </span>
        </Button>
      </div>
    </div>
  );
}

export function SuppliesPage({
  breadcrumb,
}: {
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
}) {
  const setBreadcrumb = useSetAtom(breadcrumbAtom);

  useEffect(() => {
    setBreadcrumb(breadcrumb);
    return () => setBreadcrumb(null);
  }, [breadcrumb, setBreadcrumb]);
  return (
    <div className="space-y-4 px-4 py-4">
      <BookingsListToolbar />
    </div>
  );
}
