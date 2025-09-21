import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { DollarSignIcon } from "lucide-react";
import {
  ResponsiveContainer,
  Pie,
  Cell,
  PieChart as RechartPieChart,
} from "recharts";
import { EarningsSideB as CurvedLineChart } from "./dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "./financials.expenses";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as TableType,
  flexRender,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/shared/pagination";

function Earnings() {
  const earnings = [
    {
      title: "Total Balance",
      icon: DollarSignIcon,
      value: 600_000,
    },
    {
      title: "Total Profit",
      icon: DollarSignIcon,
      value: 200_000,
    },
    {
      title: "Expenses",
      icon: DollarSignIcon,
      value: 100_000,
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {earnings.map((earning) => (
        <div
          key={earning.title}
          className="col-span-1 bg-white border border-primary-5/40 p-2 rounded-2xl md:rounded-3xl flex items-center space-x-2"
        >
          <div className="size-8 md:size-10 aspect-square bg-green-500/20 rounded-full flex items-center justify-center">
            <earning.icon className="text-secondary size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs md:text-sm text-gray-400">{earning.title}</p>
            <p className="text-lg text-primary font-semibold font-inter tracking-[0.01em] ">
              {formatCurrency(earning.value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const budgetItems = [
  {
    name: "Salaries & Wages",
    percentage: 50,
    amount: 5000,
    color: "bg-teal-400",
  },
  {
    name: "Inventory",
    percentage: 50,
    amount: 1000,
    color: "bg-pink-400",
  },
  {
    name: "Maintenance",
    percentage: 50,
    amount: 1000,
    color: "bg-yellow-400",
  },
];

interface BudgetItemProps {
  name: string;
  percentage: number;
  amount: string;
  color: string;
}

function BudgetItem({ name, percentage, amount, color }: BudgetItemProps) {
  return (
    <li className="flex justify-between items-center w-full">
      <div className="flex items-center gap-x-1 text-sm">
        <span className={cn`size-2 rounded-full ${color}`}></span>
        <span className="text-dark-2 text-nowrap">{name}</span>
        <span className="text-slate-400">({percentage}%)</span>
      </div>
      <div className="font-semibold text-primary">{amount}</div>
    </li>
  );
}

function PieChart({ items = budgetItems }) {
  return (
    <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full">
      <CardHeader>
        <CardTitle>
          <h2 className="text-primary text-lg">Expense Breakdown</h2>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow w-full h-40">
        {/* Recharts Pie Chart integration */}
        <ResponsiveContainer width="100%" height="100%">
          <RechartPieChart>
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={(data) => data.amount}
            >
              {items.map((entry, i) => (
                <Cell key={entry.name} fill={`var(--chart-${i + 1})`} />
              ))}
            </Pie>
          </RechartPieChart>
        </ResponsiveContainer>
      </CardContent>

      <CardFooter className="rounded-xl shadow-2xl p-2 mx-2">
        <ul className="space-y-1 w-full">
          {items.map((item) => (
            <BudgetItem
              key={item.name}
              name={item.name}
              percentage={item.percentage}
              amount={formatCurrency(item.amount)}
              color={item.color}
            />
          ))}
        </ul>
      </CardFooter>
    </Card>
  );
}

function Hero() {
  return (
    <div className="space-y-2 md:grid md:grid-cols-12 md:gap-2">
      <div className="md:col-span-8 space-y-2">
        <Earnings />
        <CurvedLineChart />
      </div>
      <div className="md:col-span-4">
        <PieChart />
      </div>
    </div>
  );
}

const column = createColumnHelper<Transaction>();

const columns = [
  column.accessor("expenseOrDepartment", {
    header: "Expense/Department",
    cell: (info) => info.getValue(),
  }),
  column.accessor("category", {
    header: "Category",
    cell: (info) => info.getValue(),
  }),
  column.accessor("hotelBranch", {
    header: "Hotel Branch",
    cell: (info) => info.getValue(),
  }),
  column.accessor("Quantity", {
    header: "Quantity",
    cell: (info) => info.getValue(),
  }),
  column.accessor("amount", {
    header: "Amount",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  column.accessor("date", {
    header: "Date",
    // Date format should be e.g Sep 03, 2025 | 09:00 am
    cell: (info) => {
      const date = new Date(info.getValue());
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const formattedTime = date
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase();
      return <span>{`${formattedDate} | ${formattedTime}`}</span>;
    },
  }),
];

function ExpensesTable({ table }: { table: TableType<Transaction> }) {
  return (
    <div className="border border-primary-5/20 rounded-xl overflow-clip">
      <Table>
        <TableHeader className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-gray-500">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="w-full flex items-center justify-between">
                <p>
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
                </p>

                <DataTablePagination table={table} />
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}


export function ProfitsSection({
  revalidate,
  expenses,
}: {
  revalidate: () => Promise<void>;
  expenses: Transaction[];
}) {
  const table = useReactTable({
    data: expenses,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      revalidate,
    },
  });
  
  return (
    <div className="px-2 space-y-2 md:space-y-4 pb-4 md:pb-6">
      <Hero />
      <ExpensesTable table={table} />
    </div>
  );
}
