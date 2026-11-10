"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PageResult } from "@hospio/api/data/paging";
import type { NotificationRow } from "@hospio/api/data/types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtWhen } from "@hospio/ui/shared/format";
import { useListParams } from "@hospio/ui/shared/list-params";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ServerPager } from "@hospio/ui/shared/server-pager";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { cn } from "@hospio/ui/utils";

/**
 * Notifications, paged by messaging-service: All / Unread tabs with the service's counts, a search, the rows and
 * the shared pager. Page, tab and search live in the URL (`?page=2&unread=true&q=`), so Back and reload keep them.
 */
export function NotificationsList({
	result,
}: {
	result: PageResult<NotificationRow>;
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["unread"] });
	const page = result.data;
	const tab = list.params.unread === "true" ? "unread" : "all";
	const tone = (n: NotificationRow) =>
		n.tone === "danger"
			? "danger"
			: n.tone === "warning"
				? "warning"
				: n.tone === "success"
					? "success"
					: "info";
	return (
		<div className="flex flex-col gap-4">
			<Toolbar
				left={
					<PillTabs
						value={tab}
						onChange={(k) =>
							list.set({ unread: k === "unread" ? "true" : null })
						}
						tabs={[
							{
								key: "all",
								label: "All",
								count: page.counts?.all ?? page.total,
							},
							{
								key: "unread",
								label: "Unread",
								count: page.counts?.unread ?? 0,
							},
						]}
					/>
				}
				right={
					<SearchBox
						value={list.search}
						onChange={list.setSearch}
						placeholder="Search notifications…"
					/>
				}
			/>
			<div
				className={cn(
					"flex flex-col overflow-hidden rounded-card border border-line bg-card",
					list.pending && "opacity-70",
				)}
			>
				{!result.ok ? (
					<EmptyState
						title="Notifications didn't load"
						hint={result.error}
						className="m-4"
					>
						<button
							type="button"
							onClick={() => router.refresh()}
							className="mt-2 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-subtle"
						>
							Try again
						</button>
					</EmptyState>
				) : page.content.length === 0 ? (
					list.filtered ? (
						<EmptyState
							title="No matches"
							hint="Nothing matches these filters."
							className="m-4"
						>
							<button
								type="button"
								onClick={list.clear}
								className="mt-2 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-subtle"
							>
								Clear filters
							</button>
						</EmptyState>
					) : (
						<EmptyState
							title="Nothing yet"
							hint="Approvals, stock alerts, offline POS and messages show up here."
							className="m-4"
						/>
					)
				) : (
					<ul className="divide-y divide-line">
						{page.content.map((n) => (
							<li
								key={n.id}
								className={cn(
									"flex items-start gap-3 px-5 py-3",
									!n.read && "bg-brand-soft/20",
								)}
							>
								<span
									className={cn(
										"mt-2 size-2 shrink-0 rounded-full",
										n.read ? "bg-line-strong" : "bg-brand",
									)}
								/>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-ink">{n.title}</p>
									{n.body && <p className="text-xs text-ink-2">{n.body}</p>}
									<p className="text-[11px] text-ink-3">{fmtWhen(n.at)}</p>
								</div>
								<StatusPill dot={false} tone={tone(n)}>
									{n.kind.toLowerCase().replace(/_/g, " ")}
								</StatusPill>
								{n.link && (
									<Link
										href={n.link}
										prefetch={false}
										className="text-[13px] font-semibold text-brand"
									>
										Open →
									</Link>
								)}
							</li>
						))}
					</ul>
				)}
				<ServerPager
					page={result.ok ? page : { ...page, total: 0 }}
					onPage={list.goTo}
				/>
			</div>
		</div>
	);
}
