import Link from "next/link";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtWhen } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Everywhere · Notifications: the bell's full list for whoever is signed in. */
export default async function NotificationsPage() {
	const items = await data.notifications.list();
	const unread = items.filter((n) => !n.read).length;
	return (
		<>
			<PageHeader title="Notifications" subtitle={`${unread} unread · approvals, payments, repairs, stock and messages`} />
			<SectionCard title="All notifications" flush count={items.length}>
				{items.length === 0 ? (
					<EmptyState title="Nothing yet" hint="Approvals, stock alerts, offline POS and messages show up here." className="mx-5 mb-5" />
				) : (
					<ul className="divide-y divide-line">
						{items.map((n) => (
							<li key={n.id} className={`flex items-start gap-3 px-5 py-3 ${n.read ? "" : "bg-brand-soft/20"}`}>
								<span className={`mt-2 size-2 shrink-0 rounded-full ${n.read ? "bg-line-strong" : "bg-brand"}`} />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-ink">{n.title}</p>
									{n.body && <p className="text-xs text-ink-2">{n.body}</p>}
									<p className="text-[11px] text-ink-3">{fmtWhen(n.at)}</p>
								</div>
								<StatusPill dot={false} tone={n.tone === "danger" ? "danger" : n.tone === "warning" ? "warning" : n.tone === "success" ? "success" : "info"}>
									{n.kind.toLowerCase().replace(/_/g, " ")}
								</StatusPill>
								{n.link && (
									<Link href={n.link} className="text-[13px] font-semibold text-brand">
										Open →
									</Link>
								)}
							</li>
						))}
					</ul>
				)}
			</SectionCard>
		</>
	);
}
