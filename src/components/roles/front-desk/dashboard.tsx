"use client";

import { cn } from "@/lib/utils";
import {
  DialogTitle,
  DialogDescription,
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { BedIcon, ChevronRightIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { parseAsString, useQueryStates } from "nuqs";
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns";
import type { RoomDetails } from "@/lib/fetch";
import { useMutation } from "@tanstack/react-query";
import { checkInGuest } from "@/lib/front-desk-actions";
import { toast } from "sonner";
import { revalidateRoute } from "@/lib/actions";
import type { APIOutput } from "@/lib/action-utils";

export function FrontDeskStats({ stats }: { stats: APIOutput<"@get/api/front-desks/dashboard-cards">["data"] }) {
  const data = [
    {
      label: "Total Check-Ins",
      value: stats.totalCheckIns,
      color: "text-green-500 bg-green-500/10",
    },
    {
      label: "Total Check-Outs",
      value: stats.totalCheckOuts,
      color: "text-red-500 bg-red-500/10",
    },
    {
      label: "Total Available Rooms",
      value: stats.totalAvailableRooms,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Total Reservations",
      value: stats.totalReservedRooms,
      color: "text-yellow-500 bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      {data.map((stat) => (
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

function CreateNewBookingForm({ data }: { setOpen: (open: boolean) => void; open: boolean; data: RoomDetails[] }) {
  const [view, setView] = useState<"check-in" | "reservation">("check-in");
  return (
    <div className="space-y-4">
      <div className="border-b border-primary-5/20 max-w-[content]">
        <Button
          variant={view === "check-in" ? "secondary" : "ghost"}
          className="rounded-none"
          onClick={() => setView("check-in")}
        >
          Check-In
        </Button>
        <Button
          variant={view === "reservation" ? "secondary" : "ghost"}
          className="rounded-none"
          onClick={() => setView("reservation")}
        >
          Reservation
        </Button>
      </div>

      {view === "check-in" ? (
        <CheckInForm data={data} />
      ) : (
        <div className="text-sm text-muted-foreground">
          Reservation Form (to be implemented)
        </div>
      )}
    </div>
  );
}

const checkInFormSchema = z.object({
  guestName: z.string().nonempty("Guest name is required"),
  phoneNumber: z.string().nonempty("Phone number is required"),
  amountPaid: z
    .number()
    .nonnegative("You cannot pay a negative amount")
    .min(0, "Please enter a valid amount"),
  roomStatus: z.enum(["CHECKED_IN"]),
  roomId: z.string().nonempty("Room is required"),
  checkInDate: z.string().nonempty("Check-in date is required"),
});

function SelectRoomBox({
  value,
  setValue,
  rooms,
  searchValue,
  setSearchValue,
}: {
  value: string;
  setValue: (value: string) => void;
  rooms: Array<{ id: string; roomIdentifier: string }>;
  searchValue: string;
  setSearchValue: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={(open) => {
      setOpen(open);
      setSearchValue("");
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? rooms.find((room) => room.id === value)?.roomIdentifier
            : "Select room..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search room..."
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No room found.</CommandEmpty>
            <CommandGroup>
              {rooms.map((room) => (
                <CommandItem
                  key={room.id}
                  value={room.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {room.roomIdentifier}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === room.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !Number.isNaN(date.getTime())
}

function CheckInDate({ 
  initialDate, 
  onChange 
}: { 
  initialDate: string; 
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    initialDate ? new Date(initialDate) : new Date()
  )
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [value, setValue] = React.useState(formatDate(date))

  // Update form when date changes
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate && isValidDate(newDate)) {
      const dateString = newDate.toISOString().split("T")[0]
      onChange(dateString)
    }
  }

  return (
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value}
          placeholder={format(new Date(), "MMMM dd, yyyy")}
          className="bg-background pr-10"
          onChange={(e) => {
            const newDate = new Date(e.target.value)
            setValue(e.target.value)
            if (isValidDate(newDate)) {
              setDate(newDate)
              setMonth(newDate)
              handleDateChange(newDate)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(selectedDate) => {
                setDate(selectedDate)
                setValue(formatDate(selectedDate))
                handleDateChange(selectedDate)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
  )
}


function CheckInForm({ data }: { data: RoomDetails[] }) {
  const [roomQuery, setRoomQuery] = useQueryStates({
    "room:search": parseAsString.withDefault(""),
    "room:type": parseAsString.withDefault(""),
  });

  const form = useForm({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: {
      guestName: "",
      phoneNumber: "",
      amountPaid: 0,
      roomId: "",
      roomStatus: "CHECKED_IN" as "CHECKED_IN",
      checkInDate: new Date().toISOString().split("T")[0],
    },
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: z.infer<typeof checkInFormSchema> & {
      roomStatus: "CHECKED_IN";
    }) => {
      const response = await checkInGuest(data);

      if (!response.success) {
        throw new Error(response.error || "An error occurred");
      }

      return response.data;
    },
    onError: (error) => {
      toast.error(error.message || "An error occurred during check-in.");
    },
    onSuccess: (data) => {
      toast.success(data.message || "Guest checked in successfully.");
      form.reset();
      revalidateRoute("/front-desk");
    },
  });

  // use effect to clean queries on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: false
    useEffect(() => {
    return () => {
      setRoomQuery({
        "room:search": "",
        "room:type": "",
      });
    };
  }, []);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit((data) => {
        mutate(data);
      })}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2">
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guest Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g John Doe" {...field} />
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
                  <Input placeholder="e.g +234 801 234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2">
            <Label>Room Type</Label>
            <Input
              placeholder="e.g Deluxe, Standard"
              value={roomQuery["room:type"]}
              onChange={(e) =>
                setRoomQuery((prev) => ({
                  ...prev,
                  "room:type": e.target.value,
                }))
              }
            />
          </div>

          <FormField
            control={form.control}
            name="roomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room</FormLabel>
                <FormControl>
                  <SelectRoomBox
                    value={field.value}
                    setValue={field.onChange}
                    rooms={data}
                    searchValue={roomQuery["room:search"]}
                    setSearchValue={(value) =>
                      setRoomQuery((prev) => ({
                        ...prev,
                        "room:search": value,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amountPaid"
            render={() => (
              <FormItem>
                <FormLabel>Amount Paid</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g 100"
                    {...form.register("amountPaid", { valueAsNumber: true })}
                  />
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
                <FormLabel>Check-in Date</FormLabel>
                <FormControl>
                  <CheckInDate 
                    initialDate={field.value} 
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="mt-4 w-full font-semibold" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              <span>Processing check-in...</span>
            </>
          ) : (
            "Check In Guest"
          )}
        </Button>
      </form>
    </Form>
  );
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

export function QuickActions({ rooms }: { rooms: RoomDetails[] }) {
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
              <Component setOpen={(open) => setOpen(open ? key : false)} open={open === key} data={rooms} />
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

      <DialogContent className="rounded-4xl max-w-2xl">
        {children}
      </DialogContent>
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
