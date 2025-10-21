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
import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { RoomDetails } from "@/lib/fetch";
import { useMutation } from "@tanstack/react-query";
import { checkInGuest, makeReservation } from "@/lib/front-desk-actions";
import { toast } from "sonner";
import { revalidateRoute } from "@/lib/actions";
import type { APIOutput } from "@/lib/action-utils";

export function FrontDeskStats({
  stats,
}: {
  stats: APIOutput<"@get/api/front-desks/dashboard-cards">["data"];
}) {
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

function ReportLostItem({ setOpen }: { setOpen?: (open: boolean) => void }) {
  const [showSummary, setShowSummary] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(lostItemFormSchema),
    defaultValues: {
      itemName: "",
      description: "",
      imageUrl: "",
      roomIdentifier: "",
      dateFound: new Date().toISOString().split("T")[0],
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToUrl = async (file: File): Promise<string> => {
    // Simulate image upload and return URL
    // In real implementation, this would upload to cloud storage
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `https://example.com/images/${file.name}-${Date.now()}`;
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: z.infer<typeof lostItemFormSchema>) => {
      const finalData = { ...data };

      // Upload image if selected
      if (selectedImage) {
        const imageUrl = await uploadImageToUrl(selectedImage);
        finalData.imageUrl = imageUrl;
      }

      // Simulate API call for reporting lost item
      console.log("Reporting lost item:", finalData);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return { message: "Lost item reported successfully" };
    },
    onError: () => {
      toast.error("An error occurred while reporting the lost item.");
    },
    onSuccess: (data) => {
      toast.success(data.message || "Lost item reported successfully.");
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      setShowSummary(false);
      setOpen?.(false);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Wallet, Keys, Phone..."
                      {...field}
                    />
                  </FormControl>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {[
                      "Phone",
                      "Wallet",
                      "Keys",
                      "Jewelry",
                      "Glasses",
                      "Charger",
                    ].map((item) => (
                      <Button
                        key={item}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 truncate"
                        onClick={() => field.onChange(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Found</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 101, Lobby..." {...field} />
                  </FormControl>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {[
                      "Lobby",
                      "Restaurant",
                      "Pool Area",
                      "Gym",
                      "Parking",
                      "Elevator",
                    ].map((location) => (
                      <Button
                        key={location}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-1 truncate"
                        onClick={() => field.onChange(location)}
                      >
                        {location}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dateFound"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Found</FormLabel>
                <FormControl>
                  <DatePicker
                    initialDate={field.value}
                    onChange={field.onChange}
                    placeholder="Select date found"
                    minDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image (Optional)</Label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="text-gray-500">
                    <svg
                      className="w-8 h-8 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Upload image"
                    >
                      <title>Upload image</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <span className="text-primary font-medium">
                      Click to upload
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative w-full h-40 rounded-lg border overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${imagePreview})` }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Delete image"
                  >
                    <title>Delete image</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </Button>
              </div>
            )}
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="leading-none">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide detailed description of the item, including color, size, brand, condition, and where exactly it was found..."
                    className="resize-none h-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="pt-2">
          <Button
            type="button"
            className="w-full font-semibold"
            onClick={() => {
              form.trigger().then((isValid) => {
                if (isValid) {
                  setShowSummary(true);
                }
              });
            }}
            disabled={isPending}
          >
            Review & Submit
          </Button>
        </div>

        {/* Summary Confirmation Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-lg">
            <DialogTitle>Confirm Lost Item Report</DialogTitle>
            <DialogDescription>
              Please review the details before submitting the report.
            </DialogDescription>

            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-900 mb-3">
                  Lost Item Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-orange-700 font-medium block">
                        Item:
                      </span>
                      <span className="text-orange-800">
                        {form.watch("itemName")}
                      </span>
                    </div>
                    <div>
                      <span className="text-orange-700 font-medium block">
                        Location:
                      </span>
                      <span className="text-orange-800">
                        {form.watch("roomIdentifier")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-orange-700 font-medium block">
                      Date Found:
                    </span>
                    <span className="text-orange-800">
                      {formatDate(new Date(form.watch("dateFound")))}
                    </span>
                  </div>

                  {form.watch("description") && (
                    <div className="pt-2 border-t border-orange-200">
                      <span className="text-orange-700 font-medium block mb-2">
                        Description:
                      </span>
                      <p className="text-orange-800 text-sm leading-relaxed bg-white rounded p-2 border border-orange-100">
                        {form.watch("description")}
                      </p>
                    </div>
                  )}

                  {selectedImage && (
                    <div className="pt-2 border-t border-orange-200">
                      <span className="text-orange-700 font-medium block mb-2">
                        Image:
                      </span>
                      <div className="w-20 h-20 rounded-lg border overflow-hidden">
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${imagePreview})` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                  className="flex-1"
                >
                  Edit Details
                </Button>
                <Button
                  onClick={() => {
                    const formData = form.getValues();
                    mutate(formData);
                  }}
                  disabled={isPending}
                  className="flex-1"
                >
                  {isPending ? (
                    <>
                      <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm & Submit"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}

function CreateNewBookingForm({
  data,
  setOpen,
}: {
  setOpen: (open: boolean) => void;
  open: boolean;
  data: RoomDetails[];
}) {
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
        <ReservationForm data={data} setOpen={setOpen} />
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

const reservationFormSchema = z
  .object({
    guestName: z.string().nonempty("Guest name is required"),
    phoneNumber: z.string().nonempty("Phone number is required"),
    checkInDate: z.string().nonempty("Check-in date is required"),
    checkOutDate: z.string().nonempty("Check-out date is required"),
    roomId: z.string().nonempty("Room is required"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      return checkOut > checkIn;
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOutDate"],
    }
  );

const lostItemFormSchema = z.object({
  itemName: z.string().nonempty("Item name is required"),
  description: z.string().nonempty("Description is required"),
  imageUrl: z
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  roomIdentifier: z.string().nonempty("Room identifier is required"),
  dateFound: z.string().nonempty("Date found is required"),
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
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? rooms.find((room) => room.roomIdentifier === value)
                ?.roomIdentifier
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
                  value={room.roomIdentifier}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {room.roomIdentifier}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === room.roomIdentifier
                        ? "opacity-100"
                        : "opacity-0"
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
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !Number.isNaN(date.getTime());
}

function CheckInDate({
  initialDate,
  onChange,
}: {
  initialDate: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  // Update form when date changes
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate && isValidDate(newDate)) {
      const dateString = newDate.toISOString().split("T")[0];
      onChange(dateString);
    }
  };

  return (
    <div className="relative flex gap-2">
      <Input
        id="date"
        value={value}
        placeholder={format(new Date(), "MMMM dd, yyyy")}
        className="bg-background pr-10"
        onChange={(e) => {
          const newDate = new Date(e.target.value);
          setValue(e.target.value);
          if (isValidDate(newDate)) {
            setDate(newDate);
            setMonth(newDate);
            handleDateChange(newDate);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
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
              setDate(selectedDate);
              setValue(formatDate(selectedDate));
              handleDateChange(selectedDate);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DatePicker({
  initialDate,
  onChange,
  placeholder = "Select date",
  minDate,
}: {
  initialDate: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: Date;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined
  );
  const [month, setMonth] = React.useState<Date | undefined>(
    date || new Date()
  );
  const [value, setValue] = React.useState(
    initialDate ? formatDate(new Date(initialDate)) : ""
  );

  // Update form when date changes
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate && isValidDate(newDate)) {
      const dateString = newDate.toISOString().split("T")[0];
      onChange(dateString);
    }
  };

  return (
    <div>
      {" "}
      <div className="relative h-auto">
        <Input
          value={value}
          placeholder={placeholder}
          className="bg-background pr-10"
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            setValue(e.target.value);
            if (isValidDate(newDate)) {
              setDate(newDate);
              setMonth(newDate);
              handleDateChange(newDate);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
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
              disabled={(date) => (minDate ? date < minDate : false)}
              onSelect={(selectedDate) => {
                setDate(selectedDate);
                setValue(formatDate(selectedDate));
                handleDateChange(selectedDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function CheckInForm({ data }: { data: RoomDetails[] }) {
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
    mutationFn: async (
      data: z.infer<typeof checkInFormSchema> & {
        roomStatus: "CHECKED_IN";
      }
    ) => {
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
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => {
          mutate(data);
        })}
      >
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
        <Button
          type="submit"
          className="mt-4 w-full font-semibold"
          disabled={isPending}
        >
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

export function ReservationForm({
  data,
  setOpen,
}: {
  data: RoomDetails[];
  setOpen: (open: boolean) => void;
}) {
  const [roomQuery, setRoomQuery] = useQueryStates({
    "room:search": parseAsString.withDefault(""),
    "room:type": parseAsString.withDefault(""),
  });

  const form = useForm({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      guestName: "",
      phoneNumber: "",
      checkInDate: "",
      checkOutDate: "",
      roomId: "",
      notes: "",
    },
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: z.infer<typeof reservationFormSchema>) => {
      const response = await makeReservation(data);
      if (!response.success) {
        throw new Error(response.error || "An error occurred");
      }
      return response.data;
    },
    onError: (e) => {
      toast.error("An error occurred while creating the reservation.", {
        description: e.message,
      });
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Reservation created successfully.");
      form.reset();
      setOpen(false);
      await revalidateRoute("/front-desk");
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
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => {
          mutate(data);
        })}
      >
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

          <FormField
            control={form.control}
            name="checkInDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-in Date</FormLabel>
                <FormControl>
                  <DatePicker
                    initialDate={field.value}
                    onChange={field.onChange}
                    placeholder="Select check-in date"
                    minDate={new Date()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="checkOutDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-out Date</FormLabel>
                <FormControl>
                  <DatePicker
                    initialDate={field.value}
                    onChange={field.onChange}
                    placeholder="Select check-out date"
                    minDate={
                      form.watch("checkInDate")
                        ? new Date(
                            new Date(form.watch("checkInDate")).getTime() +
                              24 * 60 * 60 * 1000
                          )
                        : new Date()
                    }
                  />
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
        </div>

        {/* Reservation Summary */}
        {form.watch("checkInDate") && form.watch("checkOutDate") && (
          <div className="font-medium">
            Duration:{" "}
            {Math.ceil(
              (new Date(form.watch("checkOutDate")).getTime() -
                new Date(form.watch("checkInDate")).getTime()) /
                (1000 * 60 * 60 * 24)
            )}{" "}
            night(s)
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any special requests or notes about the reservation..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-4 w-full font-semibold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              <span>Creating reservation...</span>
            </>
          ) : (
            "Create Reservation"
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
    maxWidth: "max-w-2xl",
  },
  {
    title: "Report Maintenance",
    icon: PlusIcon,
    key: "report-maintenance",
  },
  {
    title: "Report Lost Items",
    icon: PlusIcon,
    Component: ReportLostItem,
    key: "report-lost-items",
    maxWidth: "max-w-lg",
  },
];

export function QuickActions({ rooms }: { rooms: RoomDetails[] }) {
  const [open, setOpen] = useState<false | string>(false);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {actions.map(
        ({ icon: Icon, title, key, heading, Component, maxWidth }) => {
          return (
            <BaseModal
              key={key}
              open={open === key}
              setOpen={(open) => setOpen(open ? key : false)}
              maxWidth={maxWidth}
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
                <Component
                  setOpen={(open) => setOpen(open ? key : false)}
                  open={open === key}
                  data={rooms}
                />
              )}
            </BaseModal>
          );
        }
      )}
    </div>
  );
}

function BaseModal({
  children,
  open,
  setOpen,
  trigger,
  maxWidth = "max-w-2xl",
}: PropsWithChildren<{
  trigger: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  maxWidth?: string;
}>) {
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>

      <DialogContent className={`rounded-4xl ${maxWidth}`}>
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
