"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { cn } from "@hospio/ui/utils";

export type BusinessTabKey = "usage" | "money" | "support" | "activity";

const TABS: { key: BusinessTabKey; label: string }[] = [
	{ key: "usage", label: "Usage" },
	{ key: "money", label: "Money" },
	{ key: "support", label: "Support" },
	{ key: "activity", label: "Contract & activity" },
];

/**
 * The header every business sub-page shares: a back link to the business page, the title and a strip
 * that moves between the sub-routes (`/dashboard/businesses/[id]/usage`, `/money`, `/support`, `/activity`).
 */
export function BusinessTabHeader({
	businessId,
	businessName,
	active,
	subtitle,
	children,
}: {
	businessId: string;
	businessName: string;
	active: BusinessTabKey | "hotel";
	subtitle?: string;
	children?: React.ReactNode;
}) {
	const base = `/dashboard/businesses/${businessId}`;
	return (
		<>
			<Link
				href={base}
				className="flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink"
			>
				<ArrowLeftIcon className="size-4" /> {businessName}
			</Link>
			<PageHeader title={businessName} subtitle={subtitle}>
				{children}
			</PageHeader>
			<div className="inline-flex w-fit gap-[2px] rounded-[10px] bg-subtle p-1">
				<Link
					href={base}
					className="rounded-lg px-[10px] py-[6px] text-xs font-medium text-ink-2 hover:text-ink"
				>
					Overview
				</Link>
				{TABS.map((t) => (
					<Link
						key={t.key}
						href={`${base}/${t.key}`}
						className={cn(
							"rounded-lg px-[10px] py-[6px] text-xs transition-colors",
							active === t.key
								? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
								: "font-medium text-ink-2 hover:text-ink",
						)}
					>
						{t.label}
					</Link>
				))}
			</div>
		</>
	);
}
