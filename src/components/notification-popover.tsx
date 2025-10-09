"use client";

import { BellIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { ScrollArea } from "./ui/scroll-area";

interface NotificationItem {
  id: string;
  type: "Maintenance staff" | "Kitchen staff";
  name: string;
  action: string;
  timestamp: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "Maintenance staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
  {
    id: "2",
    type: "Kitchen staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
  {
    id: "3",
    type: "Maintenance staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
  {
    id: "4",
    type: "Maintenance staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
  {
    id: "5",
    type: "Maintenance staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
  {
    id: "6",
    type: "Maintenance staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
  {
    id: "7",
    type: "Maintenance staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
  {
    id: "8",
    type: "Kitchen staff",
    name: "Daniel Josiah",
    action: "requested a restock for Item for faucet head.",
    timestamp: "10/02/2024 | 09:00am",
  },
];

export function NotificationsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size={"icon"} variant={"ghost"} className="rounded-full">
          <BellIcon size={20} className="text-primary-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-white rounded-xl p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <PopoverClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </PopoverClose>
        </div>
        <ScrollArea className="h-96">
          <div className="space-y-3 px-4 pb-4">
            {mockNotifications.map((notification) => (
              <div key={notification.id} className="p-3 bg-popover rounded-xl">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">Approve action</p>
                  <div className="text-sm shrink-0 mt-1">
                    {notification.timestamp}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-900">
                    <span className="font-semibold">{notification.type}</span>{" "}
                    <span className="font-medium">{notification.name}</span>,{" "}
                    {notification.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
