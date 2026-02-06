"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { $fetch } from "@/lib/fetch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  UserIcon,
  PhoneIcon,
  AlertCircleIcon,
  HistoryIcon,
  Loader2Icon,
  MailIcon,
} from "lucide-react";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";

type RentalCustomersPageProps = {
  breadcrumbs: {
    title: string;
    breadcrumbs: Array<{ label: string; href: string }>;
  };
};

export function RentalCustomersPage({ breadcrumbs }: RentalCustomersPageProps) {
  const [activeTab, setActiveTab] = useState("outstanding");
  const [outstandingPhone, setOutstandingPhone] = useState("");
  const [historyMethod, setHistoryMethod] = useState<"phone" | "email">(
    "phone",
  );
  const [historyPhone, setHistoryPhone] = useState("");
  const [historyEmail, setHistoryEmail] = useState("");

  const {
    data: outstandingData,
    isLoading: isLoadingOutstanding,
    isError: isOutstandingError,
    error: outstandingError,
  } = useQuery({
    queryKey: ["rentals", "customers", "outstanding", outstandingPhone],
    queryFn: async () => {
      if (!outstandingPhone) return [];
      const res = await $fetch(
        "@get/api/hotels/rentals/customers/outstanding",
        {
          query: { phone: outstandingPhone },
        },
      );
      return res.data?.data?.content || [];
    },
    enabled: activeTab === "outstanding" && !!outstandingPhone,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: [
      "rentals",
      "customers",
      "history",
      historyMethod,
      historyPhone,
      historyEmail,
    ],
    queryFn: async () => {
      if (historyMethod === "phone") {
        if (!historyPhone) return [];
        const res = await $fetch("@get/api/hotels/rentals/customers/history", {
          query: { phone: historyPhone },
        });
        return res.data?.data?.content || [];
      } else {
        if (!historyEmail) return [];
        const res = await $fetch(
          "@get/api/hotels/rentals/customers/history/email",
          {
            query: { email: historyEmail },
          },
        );
        return res.data?.data?.content || [];
      }
    },
    enabled:
      activeTab === "history" &&
      (historyMethod === "phone" ? !!historyPhone : !!historyEmail),
  });

  return (
    <BreadCrumbWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            View outstanding rentals and customer history
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger
              value="outstanding"
              className="flex items-center gap-2"
            >
              <AlertCircleIcon className="w-4 h-4" />
              Outstanding Rentals
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" />
              Customer History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outstanding">
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Rentals</CardTitle>
                <CardDescription>
                  Search for customers with active or overdue rentals by phone
                  number.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter customer phone number..."
                      className="pl-9"
                      value={outstandingPhone}
                      onChange={(e) => setOutstandingPhone(e.target.value)}
                    />
                  </div>
                </div>

                {isLoadingOutstanding ? (
                  <div className="flex justify-center py-8">
                    <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !outstandingPhone ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Please enter a phone number to view outstanding rentals.
                  </div>
                ) : !outstandingData?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No outstanding rentals found for this phone number.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Order Info</TableHead>
                        <TableHead className="text-right">Amount Due</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">
                          Days Overdue
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingData.map((item: any) => (
                        <TableRow key={item.orderId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <UserIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {item.customerName}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <PhoneIcon className="w-3 h-3" />
                                  {item.customerPhone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">
                              {item.orderNumber}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            ₦{item.amountDue?.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {new Date(item.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                item.daysOverdue > 0 ? "destructive" : "outline"
                              }
                            >
                              {item.daysOverdue} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Order
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer History</CardTitle>
                    <CardDescription>
                      Search and view rental history for any customer.
                    </CardDescription>
                  </div>
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setHistoryMethod("phone")}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                        historyMethod === "phone"
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Phone
                    </button>
                    <button
                      onClick={() => setHistoryMethod("email")}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                        historyMethod === "email"
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    {historyMethod === "phone" ? (
                      <>
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter customer phone number..."
                          className="pl-9"
                          value={historyPhone}
                          onChange={(e) => setHistoryPhone(e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter customer email address..."
                          className="pl-9"
                          value={historyEmail}
                          onChange={(e) => setHistoryEmail(e.target.value)}
                        />
                      </>
                    )}
                  </div>
                </div>

                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (historyMethod === "phone" && !historyPhone) ||
                  (historyMethod === "email" && !historyEmail) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Please enter a {historyMethod} to view customer history.
                  </div>
                ) : !historyData?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No customer records found.
                  </div>
                ) : !historyData?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No customer records found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">
                          Total Rentals
                        </TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">
                          Total Spent
                        </TableHead>
                        <TableHead>Last Rental</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.map((customer: any) => (
                        <TableRow key={customer.customerId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {customer.customerName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {customer.customerPhone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {customer.totalRentals}
                          </TableCell>
                          <TableCell className="text-center">
                            {customer.activeRentals > 0 ? (
                              <Badge
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {customer.activeRentals}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{customer.totalSpent?.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {customer.lastRentalDate
                              ? new Date(
                                  customer.lastRentalDate,
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {customer.status || "Regular"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BreadCrumbWrapper>
  );
}
