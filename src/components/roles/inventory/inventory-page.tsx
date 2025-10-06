"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type {
  InventoryItemResponse,
  InventoryRestockRequest,
  Pagination,
} from "@/lib/fetch";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSetAtom } from "jotai";
import { SearchIcon } from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type ParserBuilder,
  type SetValues,
  useQueryStates,
  type Values,
} from "nuqs";
import { useEffect, useMemo } from "react";
import { AllItemsTable } from "./all-items-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { IssuedItemsTable } from "./issued-items";

type SectionType = "issued" | "stock-request" | null;

function InventoryTableToolbar({
  currentSection,
  query,
  setQuery,
}: {
  currentSection: SectionType;
  query: Values<{
    section: ParserBuilder<"issued" | "stock-request">;
    page: ParserBuilder<number>;
    searchName: ParserBuilder<string>;
  }>
  setQuery: SetValues<{
    section: ParserBuilder<"issued" | "stock-request">;
    page: ParserBuilder<number>;
    searchName: ParserBuilder<string>;
}>;
}) {

  const resetToSection = (section: SectionType) => {
    setQuery({ section, page: null, searchName: null });
  };
  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2">
        <Button
          variant={"outline"}
          className={cn(
            "rounded-full shadow-none border-none",
            currentSection === null
              ? "bg-primary-5/20 text-primary"
              : "bg-gray-100"
          )}
          size={"sm"}
          onClick={() => {
            currentSection !== null && resetToSection(null);
          }}
        >
          All Items
        </Button>
        <Button
          variant={"outline"}
          className={cn("rounded-full shadow-none border-none", {
            "bg-primary-5/20 text-primary": currentSection === "issued",
            "bg-gray-100": currentSection !== "issued",
          })}
          size={"sm"}
          onClick={() => {
            currentSection !== "issued" && resetToSection("issued");
          }}
        >
          Issued Items
        </Button>

        <Button
          variant={"outline"}
          className={cn("rounded-full shadow-none border-none", {
            "bg-primary-5/20 text-primary": currentSection === "stock-request",
            "bg-gray-100": currentSection !== "stock-request",
          })}
          size={"sm"}
          onClick={() => {
            currentSection !== "stock-request" && resetToSection("stock-request");
          }}
        >
          Stock Requests
        </Button>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={query.searchName ?? ""}
            onChange={(e) =>
              setQuery((prev) => ({
                ...prev,
                searchName: e.target.value || null,
              }))
            }
            className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        <TableFilter></TableFilter>
      </div>
    </div>
  );
}

function InventoryOfficerInventoryTable({
  data,
  serverSection,
  paginationMeta,
}: {
  data: InventoryItemResponse[] | InventoryRestockRequest[];
  paginationMeta: Pagination;
  serverSection: SectionType;
}) {
  const [query, setQuery] = useQueryStates({
    section: parseAsStringLiteral(["issued", "stock-request"]),
    page: parseAsInteger,
    searchName: parseAsString,
  });

  // pending state for reconciling client and server section
  const isPending = useMemo(() => {
    return query.section !== serverSection;
  }, [query.section, serverSection]);

  const renderedSection = useMemo(() => {
    if (isPending) {
      return (
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              {Array.from({ length: 6 }).map((_, index) => (
                <TableHead key={index} className="text-gray-500">
                  <Skeleton className="h-4 w-20 animate-pulse" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({
              length:
                // use existing data length or 5 rows as placeholder
                data.length > 0 ? data.length : 5,
            }).map((_, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="cursor-pointer hover:bg-gray-50"
              >
                {Array.from({
                  length: 6,
                }).map((_, cellIndex) => (
                  <TableCell key={cellIndex} className="text-gray-600">
                    <Skeleton className="h-4 w-full animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    switch (query.section) {
      case "issued": {
        return (
          <IssuedItemsTable
            data={data as InventoryItemResponse[]}
            paginationMeta={paginationMeta}
          />
        );
      }
      case "stock-request": {
        return (
          <div className="text-center text-gray-500">
            Stock Requests section is under construction.
          </div>
        );
      }
      default: {
        return (
          <AllItemsTable
            data={data as InventoryItemResponse[]}
            paginationMeta={paginationMeta}
          />
        );
      }
    }
  }, [query, data, isPending, paginationMeta]);

  return (
    <div className="space-y-4">
      <InventoryTableToolbar
        currentSection={serverSection}
        query={query}
        setQuery={setQuery}
      />
      {renderedSection}
    </div>
  );
}

export function InventoryOfficerInventoryPage({
  section,
  breadcrumb,
  data,
  paginationMeta,
}: {
  section: SectionType;
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  data: InventoryItemResponse[] | InventoryRestockRequest[];
  paginationMeta: Pagination;
}) {
  const setBreadcrumb = useSetAtom(breadcrumbAtom);
  // const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

  useEffect(() => {
    setBreadcrumb(breadcrumb);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumb]);

  return (
    <InventoryOfficerInventoryTable
      serverSection={section}
      data={data}
      paginationMeta={paginationMeta}
    />
  );
}
