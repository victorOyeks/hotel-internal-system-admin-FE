"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  notificationWebSocket,
  type NotificationPayload,
} from "@/lib/notification-websocket";
import { Bell } from "lucide-react";

interface NotificationListenerProps {
  token: string;
  userId: string;
  role: string;
  hotelId: string;
}

export function NotificationListener({
  token,
  userId,
  role,
  hotelId,
}: NotificationListenerProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!token || !userId || !role) {
      return;
    }

    // Connect to WebSocket
    notificationWebSocket.connect(token, userId, role, hotelId || "");

    // Subscribe to notifications
    const unsubscribe = notificationWebSocket.onNotification(
      (notification: NotificationPayload) => {
        // Invalidate notification queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notifications-unread-count"],
        });

        // Show toast notification at top center
        toast.custom(
          (t) => (
            <div
              className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-md cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => {
                toast.dismiss(t);
                if (notification.actionLink) {
                  router.push(notification.actionLink);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                    {notification.message}
                  </p>
                  {notification.category && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {notification.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ),
          {
            duration: 6000,
            position: "top-center",
          }
        );
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
      notificationWebSocket.disconnect();
    };
  }, [token, userId, role, hotelId, queryClient, router]);

  // This component doesn't render anything
  return null;
}
