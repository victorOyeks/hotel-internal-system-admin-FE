"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type {
  InventoryResponse,
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
  useQueryStates,
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

type SectionType = "all" | "issued" | "stock-request";

function InventoryTableToolbar({
  currentSection,
  setCurrentSection,
}: {
  currentSection: SectionType;
  setCurrentSection: (value: SectionType) => void;
}) {
  const [currentFilter, setCurrentFilter] = useQueryStates({
    searchName: parseAsString,
    page: parseAsInteger,
  });
  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2">
        <Button
          variant={"outline"}
          className={cn(
            "rounded-full shadow-none border-none",
            currentSection === "all"
              ? "bg-primary-5/20 text-primary"
              : "bg-gray-100"
          )}
          size={"sm"}
          onClick={() => {
            setCurrentFilter((prev) => ({ ...prev, page: null }));
            currentSection !== "all" && setCurrentSection("all");
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
            setCurrentFilter((prev) => ({ ...prev, page: null }));
            currentSection !== "issued" && setCurrentSection("issued");
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
            setCurrentFilter((prev) => ({ ...prev, page: null }));
            currentSection !== "stock-request" &&
              setCurrentSection("stock-request");
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
            value={currentFilter.searchName ?? ""}
            onChange={(e) =>
              setCurrentFilter((prev) => ({
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
  data: InventoryResponse[] | InventoryRestockRequest[];
  paginationMeta: Pagination;
  serverSection: SectionType;
}) {
  const [currentSection, setCurrentSection] = useQueryStates({
    section: parseAsStringLiteral<SectionType>([
      "all",
      "issued",
      "stock-request",
    ]).withDefault(serverSection),
    page: parseAsInteger,
  });

  // pending state for reconciling client and server section
  const isPending = useMemo(() => {
    return currentSection.section !== serverSection;
  }, [currentSection.section, serverSection]);

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

    switch (currentSection.section) {
      case "all": {
        return (
          <AllItemsTable
            data={data as InventoryResponse[]}
            paginationMeta={paginationMeta}
          />
        );
      }
    }
  }, [currentSection.section, data, isPending, paginationMeta]);

  return (
    <div className="space-y-4">
      <InventoryTableToolbar
        currentSection={serverSection}
        setCurrentSection={(value) => {
          setCurrentSection({ section: value, page: null });
        }}
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
  data: InventoryResponse[] | InventoryRestockRequest[];
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
