"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { useSetAtom } from "jotai";
import {
	BellIcon,
	CheckCheckIcon,
	CircleDotIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import {
	markNotificationRead,
	markAllNotificationsRead,
} from "@/lib/manager-actions";
import { toast } from "sonner";
import type { APIOutput } from "@/lib/action-utils";

type NotificationPage =
	APIOutput<"@get/api/managers/:hotelId/notifications">["data"];
type NotificationItem = NotificationPage["notifications"][number];

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "short",
		day: "2-digit",
	});
}

function NotificationCard({
	notification,
	onMarkRead,
}: {
	notification: NotificationItem;
	onMarkRead: (id: string) => void;
}) {
	return (
		<div
			className={`p-4 rounded-xl border transition-colors cursor-pointer ${
				notification.isRead
					? "bg-white border-gray-100"
					: "bg-blue-50/50 border-blue-100 hover:bg-blue-50"
			}`}
			onClick={() => !notification.isRead && onMarkRead(notification.id)}
		>
			<div className="flex items-start gap-3">
				<div
					className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
						notification.isRead ? "bg-gray-100" : "bg-primary-5/40"
					}`}
				>
					<BellIcon
						className={`size-4 ${
							notification.isRead ? "text-gray-400" : "text-primary-1"
						}`}
					/>
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-2">
						<h4
							className={`text-sm font-medium truncate ${
								notification.isRead ? "text-gray-600" : "text-primary"
							}`}
						>
							{notification.title}
						</h4>
						<div className="flex items-center gap-2 flex-shrink-0">
							{!notification.isRead && (
								<CircleDotIcon className="size-3 text-blue-500" />
							)}
							<span className="text-xs text-gray-400">
								{timeAgo(notification.createdAt)}
							</span>
						</div>
					</div>
					<p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
						{notification.message}
					</p>
					{notification.category && (
						<span className="text-xs text-gray-400 mt-1 inline-block">
							{notification.category}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

export function Notifications({
	breadcrumbs,
	notificationData,
}: {
	breadcrumbs: Breadcrumb[];
	notificationData: NotificationPage;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const [filter, setFilter] = useState<"all" | "unread">("all");
	const [isPending, startTransition] = useTransition();

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Notifications",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	const handleMarkRead = (id: string) => {
		startTransition(async () => {
			const result = await markNotificationRead(id);
			if (!result.success) {
				toast.error(result.error);
			}
		});
	};

	const handleMarkAllRead = () => {
		startTransition(async () => {
			const result = await markAllNotificationsRead();
			if (result.success) {
				toast.success("All notifications marked as read");
			} else {
				toast.error(result.error);
			}
		});
	};

	const filteredNotifications =
		filter === "unread"
			? notificationData.notifications.filter((n) => !n.isRead)
			: notificationData.notifications;

	return (
		<div className="p-4 md:p-6 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex bg-white border rounded-lg p-0.5">
						<button
							type="button"
							onClick={() => setFilter("all")}
							className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
								filter === "all"
									? "bg-primary text-white"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							All ({notificationData.totalElements})
						</button>
						<button
							type="button"
							onClick={() => setFilter("unread")}
							className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
								filter === "unread"
									? "bg-primary text-white"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							Unread ({notificationData.unreadCount})
						</button>
					</div>
				</div>
				{notificationData.unreadCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllRead}
						disabled={isPending}
					>
						<CheckCheckIcon className="size-4 mr-1.5" />
						Mark all read
					</Button>
				)}
			</div>

			{/* Notification List */}
			<div className="space-y-2">
				{filteredNotifications.length > 0 ? (
					filteredNotifications.map((notification) => (
						<NotificationCard
							key={notification.id}
							notification={notification}
							onMarkRead={handleMarkRead}
						/>
					))
				) : (
					<div className="bg-white p-12 rounded-2xl text-center">
						<BellIcon className="size-12 text-gray-200 mx-auto mb-3" />
						<p className="text-gray-500">
							{filter === "unread"
								? "No unread notifications"
								: "No notifications yet"}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
