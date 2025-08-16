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
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EarningsSideB as CurvedLineChart } from "./dashboard";

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

function BranchPerformanceChart() {
  const data = [
    { name: "Lekki", value: 400000, yLabel: "49K" },
    { name: "Ikoyi", value: 300000, yLabel: "30K" },
    { name: "Victoria Island", value: 200000, yLabel: "20K" },
    { name: "Surulere", value: 278000, yLabel: "28K" },
    { name: "Ikeja", value: 189000, yLabel: "19K" },
    { name: "Yaba", value: 150000, yLabel: "15K" },
    { name: "Shomolu", value: 120000, yLabel: "12K" },
    { name: "Festac", value: 100000, yLabel: "10K" },
    { name: "Bariga", value: 80000, yLabel: "8K" },
    { name: "Agege", value: 60000, yLabel: "6K" },
    { name: "Mushin", value: 50000, yLabel: "5K" },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
        barCategoryGap="20%"
      >
        <YAxis
          dataKey="value"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--color-primary-1)" }}
          tickFormatter={(_, i) => data[i].yLabel}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--color-primary-1)" }}
        />
        <Bar
          dataKey="value"
          fill="theme(color.green.50)"
          radius={[6, 6, 6, 6]}
          maxBarSize={20}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "none",
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}
          itemStyle={{ color: "#000" }}
          cursor={false}
          formatter={(value: number) => [
            value.toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
            }),
            "Profit",
          ]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function IncomePerfByBranch() {
  return (
    <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full gap-x-0 px-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-primary text-xl">Income performance by branch</h2>
        </CardTitle>

        <CardContent className="w-full">
          <BranchPerformanceChart />
        </CardContent>
      </CardHeader>
    </Card>
  )
}

export function AnalyticsSection() {
  return (
    <div className="px-2 space-y-2 md:space-y-4">
      <Hero />
      <IncomePerfByBranch />
    </div>
  );
}
