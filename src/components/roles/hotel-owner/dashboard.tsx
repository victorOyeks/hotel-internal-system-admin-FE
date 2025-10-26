"use client";
import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  BedDoubleIcon,
  BedIcon,
  BedSingleIcon,
  CalendarIcon,
  DollarSign,
  TrendingUpIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  type DotProps,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActiveShape } from "recharts/types/util/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { useLayoutEffect } from "react";
import { APIOutput } from "@/lib/action-utils";

function EarningsSideA() {
  const earnings = [
    {
      title: "Earnings",
      icon: DollarSign,
      value: "₦600K",
    },
    {
      title: "Occupancy Rate",
      icon: BedIcon,
      value: "50%",
    },
    {
      title: "Check In",
      icon: ArrowRightToLineIcon,
      value: 20,
    },
    {
      title: "Check Out",
      icon: ArrowLeftToLineIcon,
      value: 20,
    },
    {
      title: "Total Rooms",
      icon: BedSingleIcon,
      value: 100,
    },
    {
      title: "Available Rooms",
      icon: BedDoubleIcon,
      value: 80,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
      {earnings.map((earning) => (
        <div
          key={earning.title}
          className="bg-white p-2 md:pl-4 rounded-2xl flex items-center space-x-2"
        >
          <div className="size-10 md:size-12 aspect-square bg-primary-5/40 rounded-full flex items-center justify-center">
            <earning.icon className="text-primary-1 size-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs md:text-sm text-gray-400">{earning.title}</p>
            <p className="text-xl md:text-2xl text-primary font-semibold font-inter tracking-[0.01em] ">
              {earning.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const CustomDot = (
  props: DotProps & { payload: { month: string; totalEarnings: number } }
) => {
  const { cx, cy, payload } = props;
  // Guard against undefined coordinates
  if (cx === undefined || cy === undefined) {
    return null;
  }
  // Only show dot for NOV (the
  return (
    <g>
      {/* White circle background */}
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="white"
        stroke="#22c55e"
        strokeWidth={3}
      />
      {/* Green label above the dot */}
      <foreignObject
        x={cx - 25}
        y={cy - 40}
        width={payload.totalEarnings.toString().length * 24}
        height={28}
      >
        <div className="flex justify-center">
          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
            {payload.totalEarnings.toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
            })}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};

function CurvedLineChart({
  graphData,
}: {
  graphData: { month: string; totalEarnings: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={graphData}
        margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
      >
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          className="text-gray-400"
        />
        <YAxis hide />
        <Tooltip<number, string>
          cursor={false}
          formatter={(value) => {
            return [formatCurrency(value), "Total Earnings"];
          }}
        />
        <Line
          type="monotone"
          dataKey="totalEarnings"
          stroke="#22c55e"
          strokeWidth={3}
          dot={false}
          activeDot={CustomDot as ActiveShape<DotProps>}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EarningsSideB({
  graphData,
}: {
  graphData: { month: string; totalEarnings: number }[];
}) {
  return (
    <div className="bg-white py-4 px-2 md:py-6 md:px-5 rounded-3xl space-y-4">
      <Button
        variant={"outline"}
        size={"sm"}
        className="shadow-none text-gray-500"
      >
        <CalendarIcon />
        <span>This month</span>
      </Button>

      <div>
        <h1 className="text-3xl font-semibold text-primary">₦800,975.87</h1>
        <p className="text-gray-500 text-sm flex items-center space-x-1">
          <span>Total profit</span>
          <span className="text-green-500 font-semibold flex items-center space-x-1">
            <TrendingUpIcon className="inline size-4" />
            <span>+20%</span>
          </span>
        </p>
      </div>

      <div className="h-64 md:h-38 w-full">
        <CurvedLineChart graphData={graphData} />
      </div>
    </div>
  );
}

function DashboardHero({
  graphData,
}: {
  graphData: { month: string; totalEarnings: number }[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
      <EarningsSideA />
      <EarningsSideB graphData={graphData} />
    </div>
  );
}

function BranchPerformance() {
  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl space-y-4">
      <h2 className="text-xl font-semibold text-primary">Branch Performance</h2>
      {/* Placeholder for branch performance chart */}
      <div className="h-64 md:h-48 w-full">
        <BranchPerformanceChart />
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
        margin={{ top: 20, right: 10, left: -30, bottom: 5 }}
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
          fill="var(--primary-5)"
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

function HotelSuits() {
  const suits = [
    {
      name: "Executive Suite",
      pricePerNight: 150000,
    },
    {
      name: "Deluxe Suite",
      pricePerNight: 120000,
    },
    {
      name: "Standard Suite",
      pricePerNight: 80000,
    },
    {
      name: "Budget Suite",
      pricePerNight: 50000,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-3 md:gap-4"
      style={{
        scrollbarWidth: "none",
        scrollbarColor: "var(--primary-5) transparent",
      }}
    >
      {suits.map((suit) => (
        <div
          key={suit.name}
          className="bg-white p-2 rounded-3xl flex-shrink-0 border border-primary-5/50 flex flex-col md:flex-row md:items-center gap-y-2 md:space-x-2"
        >
          <div className="md:size-12 w-full aspect-square rounded-xl bg-primary-5/10" />

          <div className="pl-1 md:pl-0">
            <p className="text-xs md:text-sm text-gray-500">{suit.name}</p>
            <p>
              <span className="md:text-lg font-semibold text-primary">
                {formatCurrency(suit.pricePerNight)}
              </span>
              <span className="text-xs text-gray-500">/night</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

type OverviewData = APIOutput<"@get/api/hotel-owners/dashboard/overview">['data'];

export function HotelOwnerDashboard({
  breadcrumbs = [],
  graphData,
}: {
  breadcrumbs: Breadcrumb[];
  overviewData: OverviewData;
  graphData: {
    month: string;
    totalEarnings: number;
  }[];
}) {
  const setBreadCrumb = useSetAtom(breadcrumbAtom);

  useLayoutEffect(() => {
    setBreadCrumb({
      title: "Dashboard",
      breadcrumbs,
    });
  }, [breadcrumbs, setBreadCrumb]);

  return (
    <div className="p-4 md:p-6 space-y-2 md:space-y-4">
      <DashboardHero graphData={graphData} />
      <BranchPerformance />
      <HotelSuits />
    </div>
  );
}
