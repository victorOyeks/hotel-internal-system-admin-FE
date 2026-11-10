import { PageHeader } from "@hospio/ui/shared/page-header";
import { NotificationsList } from "@hospio/ui/screens/notifications-list";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Everywhere · Notifications: the bell's list for whoever is signed in, a page at a time from messaging-service. */
export default async function NotificationsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams, ["unread"]);
	const [result, unread] = await Promise.all([
		data.notifications.page(query),
		data.notifications.unreadCount(),
	]);
	return (
		<>
			<PageHeader
				title="Notifications"
				subtitle={`${unread} unread · approvals, payments, repairs, stock and messages`}
			/>
			<NotificationsList result={result} />
		</>
	);
}
