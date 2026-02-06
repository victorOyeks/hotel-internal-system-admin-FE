"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { $fetch } from "@/lib/fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DownloadIcon,
  Loader2Icon,
  TrendingUpIcon,
  DollarSignIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";

type RentalReportsPageProps = {
  breadcrumbs: {
    title: string;
    breadcrumbs: Array<{ label: string; href: string }>;
  };
};

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";

// ... existing imports

export function RentalReportsPage({ breadcrumbs }: RentalReportsPageProps) {
  const [period, setPeriod] = useState("this_month");

  const getDateRange = (period: string) => {
    const today = new Date();
    let start = today;
    let end = today;

    switch (period) {
      case "today":
        start = startOfToday();
        end = endOfToday();
        break;
      case "this_week":
        start = startOfWeek(today);
        end = endOfWeek(today);
        break;
      case "this_month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "last_month":
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "this_year":
        start = startOfYear(today);
        end = endOfYear(today);
        break;
    }

    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  };

  const { data: report, isLoading } = useQuery({
    queryKey: ["rentals", "reports", period],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange(period);
      const res = await $fetch("@get/api/hotels/rentals/reports", {
        query: { startDate, endDate },
      });
      return res.data?.data;
    },
  });

  // Mock data fallbacks for visualization if API returns empty/error (or while backend is being built)
  const mockData = {
    totalRevenue: 0,
    totalOrders: 0,
    topItems: [],
    categoryBreakdown: [],
  };

  const data = report || mockData;

  return (
    <BreadCrumbWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Rental Reports</h1>
            <p className="text-muted-foreground mt-1">
              Analyze rental performance and revenue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2Icon className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Generating report...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSignIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{(data.totalRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {period.replace("_", " ")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.totalOrders || 0}
                  </div>
                  <div className="flex text-xs text-muted-foreground gap-2 mt-1">
                    <span className="text-green-600">
                      {data.completedOrders || 0} completed
                    </span>
                    <span className="text-red-600">
                      {data.overdueOrders || 0} overdue
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Rentals
                  </CardTitle>
                  <TrendingUpIcon className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.activeOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Outstanding
                  </CardTitle>
                  <DollarSignIcon className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{(data.totalOutstanding || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uncollected revenue
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown Pie Chart */}
              <Card className="min-h-[400px]">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                  <CardDescription>
                    Distribution of revenue across rental categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {!data.categoryBreakdown ||
                  data.categoryBreakdown.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) =>
                            `${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                          nameKey="category"
                        >
                          {data.categoryBreakdown.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `₦${value.toLocaleString()}`
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Items Bar Chart */}
              <Card className="min-h-[400px]">
                <CardHeader>
                  <CardTitle>Top Performing Items</CardTitle>
                  <CardDescription>
                    Highest revenue generating items
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {!data.topItems || data.topItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.topItems}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="itemName"
                          type="category"
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === "revenue"
                              ? `₦${value.toLocaleString()}`
                              : value,
                            name === "revenue" ? "Revenue" : "Qty",
                          ]}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#0ea5e9"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </BreadCrumbWrapper>
  );
}
