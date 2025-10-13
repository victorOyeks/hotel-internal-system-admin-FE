import { Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

type DeliveryHistory = {
  supplierName: string;
  itemName: string;
  unit: string;
  quantity: number;
  deliveryDate: string;
};

const columnHelper = createColumnHelper<DeliveryHistory>();

const deliveryHistoryColumns = [
  columnHelper.accessor("supplierName", {
    header: "Supplier Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("itemName", {
    header: "Associated Item",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("unit", {
    header: "Item Unit",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("quantity", {
    header: "Quantity Delivered",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("deliveryDate", {
    header: "Delivery Date",
    cell: (info) => {
      const date = new Date(info.getValue());
      // date format: dd/mm/yyyy | hh:mm AM/PM
      const formattedDate =
        date.toLocaleDateString("en-GB") +
        " | " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      return formattedDate;
    },
  }),
];

export function InventoryDeliveryHistory({
  data,
  paginationMeta,
}: {
  data: DeliveryHistory[];
  paginationMeta: Pagination;
}) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data,
    columns: deliveryHistoryColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange,
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    state: {
      pagination,
    },
  });
  return <div>Inventory Delivery History</div>;
}
