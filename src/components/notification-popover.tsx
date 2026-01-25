"use client";

import {
  BellIcon,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "@/lib/actions";
import type { Notification } from "@/lib/fetch";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PAGE_SIZE = 5;

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getCategoryStyles(category: string | null): string {
  switch (category?.toUpperCase()) {
    case "BOOKING":
      return "bg-blue-50 border-blue-200";
    case "PAYMENT":
      return "bg-green-50 border-green-200";
    case "INVENTORY":
      return "bg-orange-50 border-orange-200";
    case "ALERT":
      return "bg-red-50 border-red-200";
    case "MAINTENANCE":
      return "bg-yellow-50 border-yellow-200";
    default:
      return "bg-popover";
  }
}

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch notifications with pagination
  const {
    data: notificationsData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["notifications", currentPage],
    queryFn: async () => {
      const res = await getNotifications({
        page: currentPage,
        size: PAGE_SIZE,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    staleTime: 10000,
  });

  // Fetch unread count for badge
  const { data: unreadCountData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const res = await getUnreadNotificationCount();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = unreadCountData ?? notificationsData?.unreadCount ?? 0;
  const totalPages = notificationsData?.totalPages ?? 1;
  const totalElements = notificationsData?.totalElements ?? 0;
  const hasNext = notificationsData?.hasNext ?? false;
  const hasPrevious = notificationsData?.hasPrevious ?? false;

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification.id);
      }
      if (notification.actionLink) {
        setIsOpen(false);
        router.push(notification.actionLink);
      }
    },
    [markAsReadMutation, router]
  );

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      if (currentPage > 2) {
        pages.push("...");
      }

      // Show pages around current
      for (
        let i = Math.max(1, currentPage - 1);
        i <= Math.min(totalPages - 2, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages - 1);
    }

    return pages;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full relative">
          <BellIcon size={20} className="text-primary-1" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 bg-white rounded-xl p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary/80"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all
              </Button>
            )}
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
        </div>

        {/* Content */}
        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BellIcon className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {isFetching && !isLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              )}
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm",
                    getCategoryStyles(notification.category),
                    !notification.isRead && "ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {notification.category && (
                          <span className="text-[10px] font-medium text-gray-500 uppercase">
                            {notification.category}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 hover:bg-white/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50/50">
            <span className="text-xs text-muted-foreground">
              {totalElements} total
            </span>
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(currentPage - 1)}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-xs text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-7 w-7 text-xs",
                      currentPage === page && "pointer-events-none"
                    )}
                    onClick={() => goToPage(page)}
                  >
                    {page + 1}
                  </Button>
                )
              )}

              {/* Next Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(currentPage + 1)}
                disabled={!hasNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
