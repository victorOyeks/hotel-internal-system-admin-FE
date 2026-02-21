"use client";

import { useLayoutEffect, useState } from "react";
import { useSetAtom } from "jotai";
import {
	BellIcon,
	CircleDotIcon,
} from "lucide-react";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import type { APIOutput } from "@/lib/action-utils";

type NotificationPage =
	APIOutput<"@get/api/hotel-owners/:hotelId/notifications">["data"];
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
	return new Date(dateStr).toLocaleDateString();
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
	return (
		<div
			className={`bg-white p-4 rounded-2xl flex items-start gap-3 ${
				!notification.isRead ? "border-l-4 border-primary-5" : ""
			}`}
		>
			<div className="size-10 bg-primary-5/20 rounded-full flex items-center justify-center flex-shrink-0">
				{!notification.isRead ? (
					<CircleDotIcon className="size-5 text-primary-1" />
				) : (
					<BellIcon className="size-5 text-gray-400" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-2">
					<h4
						className={`text-sm ${
							!notification.isRead
								? "font-semibold text-primary"
								: "font-medium text-gray-700"
						}`}
					>
						{notification.title}
					</h4>
					<span className="text-xs text-gray-400 flex-shrink-0">
						{timeAgo(notification.createdAt)}
					</span>
				</div>
				<p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
					{notification.message}
				</p>
			</div>
		</div>
	);
}

export function OwnerNotifications({
	breadcrumbs,
	notificationData,
}: {
	breadcrumbs: Breadcrumb[];
	notificationData: NotificationPage;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const [filter, setFilter] = useState<"all" | "unread">("all");

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Notifications",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	const notifications = notificationData.notifications ?? [];
	const filtered =
		filter === "unread"
			? notifications.filter((n) => !n.isRead)
			: notifications;

	return (
		<div className="p-4 md:p-6 space-y-4">
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => setFilter("all")}
					className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
						filter === "all"
							? "bg-primary text-white"
							: "bg-white text-gray-600 hover:bg-gray-50"
					}`}
				>
					All ({notifications.length})
				</button>
				<button
					type="button"
					onClick={() => setFilter("unread")}
					className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
						filter === "unread"
							? "bg-primary text-white"
							: "bg-white text-gray-600 hover:bg-gray-50"
					}`}
				>
					Unread ({notifications.filter((n) => !n.isRead).length})
				</button>
			</div>

			<div className="space-y-2">
				{filtered.length > 0 ? (
					filtered.map((notification) => (
						<NotificationCard
							key={notification.id}
							notification={notification}
						/>
					))
				) : (
					<div className="bg-white p-8 rounded-2xl text-center">
						<BellIcon className="size-8 text-gray-300 mx-auto mb-2" />
						<p className="text-gray-400 text-sm">
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
