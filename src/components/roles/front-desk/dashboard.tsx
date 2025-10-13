"use client";

import { cn } from "@/lib/utils";
import {
  DialogTitle,
  DialogDescription,
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { BedIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";

export function FrontDeskStats() {
  const stats = [
    {
      label: "Total Check-Ins",
      value: 120,
      color: "text-green-500 bg-green-500/10",
    },
    {
      label: "Total Check-Outs",
      value: 100,
      color: "text-red-500 bg-red-500/10",
    },
    {
      label: "Total Available Rooms",
      value: 50,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Total Reservations",
      value: 30,
      color: "text-yellow-500 bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-primary-5/10 rounded-xl md:rounded-2xl p-3 flex flex-col gap-y-4"
        >
          <div
            className={cn(
              "size-10 rounded-full flex items-center justify-center mb-2",
              stat.color
            )}
          >
            <BedIcon />
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-2xl font-medium">{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateNewBookingForm(_: { setOpen: (open: boolean) => void }) {
    const [view, setView] = useState<"check-in" | "reservation">("check-in");
  return <div className="space-y-4">
    <div className="border-b border-primary-5/20 max-w-[content]">
        <Button variant={view === "check-in" ? "secondary" : "ghost"} className="rounded-none" onClick={() => setView("check-in")}>
          Check-In
        </Button>
        <Button variant={view === "reservation" ? "secondary" : "ghost"} className="rounded-none" onClick={() => setView("reservation")}>
          Reservation
        </Button>
    </div>

    {view === "check-in" ? (
        <CheckInForm />
    ) : (
        <div className="text-sm text-muted-foreground">Reservation Form (to be implemented)</div>
    )}
  </div>;
}

/***]]
 * 
 *   "guestName": "string",
  "phoneNumber": "string",
  "amountPaid": 0,
  "roomStatus": "CHECKED_IN",
  "checkInDate": "2025-10-13"
 */

const checkInFormSchema = z.object({
    guestName: z.string().nonempty("Guest name is required"),
    phoneNumber: z.string().nonempty("Phone number is required"),
    amountPaid: z.number().min(0, "Amount paid must be at least 0"),
    roomStatus: z.enum(["CHECKED_IN", "CHECKED_OUT"]),
    checkInDate: z.string().nonempty("Check-in date is required"),
});

function CheckInForm() {
    const form = useForm({
        resolver: zodResolver(checkInFormSchema),
        defaultValues: {
            guestName: "",
            phoneNumber: "",
            amountPaid: 0,
            roomStatus: "CHECKED_IN" as "CHECKED_IN" | "CHECKED_OUT",
            checkInDate: new Date().toISOString().split("T")[0],
        },
    })

    
    return (
        <Form {...form}>
            <form>
                <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Guest Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter guest name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amountPaid"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount Paid</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Enter amount paid" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="roomStatus"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Room Status</FormLabel>
                            <FormControl>
                                <Select {...field}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select room status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                                        <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Check-In Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

const actions = [
  {
    title: "Create New Booking",
    heading: "New Booking",
    Component: CreateNewBookingForm,
    icon: PlusIcon,
    key: "create-new-booking",
  },
  {
    title: "Report Maintenance",
    icon: PlusIcon,
    key: "report-maintenance",
  },
  {
    title: "Report Lost Items",
    icon: PlusIcon,
    key: "report-lost-items",
  },
];

export function QuickActions() {
  const [open, setOpen] = useState<false | string>(false);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {actions.map(({ icon: Icon, title, key, heading, Component }) => {
        return (
          <BaseModal
            key={key}
            open={open === key}
            setOpen={(open) => setOpen(open ? key : false)}
            trigger={
              <div className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50">
                <div className="flex items-center gap-x-2 flex-1">
                  <div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
                    <Icon className="size-5 text-green-600" />
                  </div>

                  <p className="text-sm font-medium">{title}</p>
                </div>

                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </div>
            }
          >
            <DialogTitle>{heading || title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
            {Component && (
              <Component setOpen={(open) => setOpen(open ? key : false)} />
            )}
          </BaseModal>
        );
      })}
    </div>
  );
}

function BaseModal({
  children,
  open,
  setOpen,
  trigger,
}: PropsWithChildren<{
  trigger: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}>) {
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>

      <DialogContent className="rounded-4xl max-w-sm">{children}</DialogContent>
    </Dialog>
  );
}

export function PendingMaintenanceNotifications() {
  const notifications = [
    {
      title: "Leaking Faucet in Room 101",
      description:
        "A guest reported a leaking faucet in room 101. Please send maintenance to fix it.",
      time: "2 hours ago",
    },
    {
      title: "Broken Window in Lobby",
      description:
        "The window near the reception desk is broken. It needs immediate attention.",
      time: "1 day ago",
    },
    {
      title: "Air Conditioning Issue in Room 202",
      description:
        "Guest in room 202 reported that the air conditioning is not working properly.",
      time: "3 days ago",
    },
  ];

  return (
    <div className="bg-yellow-50/50 border border-yellow-500/30 rounded-2xl h-full overflow-clip">
      <div className="flex items-center justify-between p-3">
        <h2 className="text-lg font-medium">Pending Maintenance</h2>
        <span className="text-sm size-5 bg-red-500 text-white rounded-full text-center flex items-center justify-center px-2 leading-0">
          {notifications.length}
        </span>
      </div>

      <ScrollArea className="h-full max-h-[180px] px-1.5">
        <div className="space-y-1">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-white p-3 rounded-xl border border-yellow-500/20"
            >
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm text-muted-foreground">
                {notification.description}
              </p>
              <span className="text-xs text-muted-foreground">
                {notification.time}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
