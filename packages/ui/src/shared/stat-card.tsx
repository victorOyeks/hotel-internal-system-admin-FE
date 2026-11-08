"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@hospio/ui/utils";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	isCurrency?: boolean;
	href?: string;
	subtitle?: string;
	iconBgClass?: string;
	iconColorClass?: string;
}

export function StatCard({
	title,
	value,
	icon: Icon,
	trend,
	isCurrency,
	href,
	subtitle,
	iconBgClass = "bg-primary-5/40",
	iconColorClass = "text-primary-1",
}: StatCardProps) {
	const displayValue = isCurrency
		? formatCurrency(typeof value === "string" ? Number(value) : value, "short")
		: value;

	const content = (
		<div className="bg-white p-3 md:p-4 rounded-2xl flex items-center space-x-3 hover:shadow-sm transition-shadow">
			<div
				className={`size-11 md:size-12 aspect-square ${iconBgClass} rounded-full flex items-center justify-center flex-shrink-0`}
			>
				<Icon className={`${iconColorClass} size-5`} />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-xs md:text-sm text-gray-400 truncate">{title}</p>
				<p className="text-lg md:text-xl text-primary font-semibold font-inter tracking-[0.01em]">
					{displayValue}
				</p>
				<div className="flex items-center gap-1">
					{trend && (
						<span
							className={`text-xs font-medium flex items-center gap-0.5 ${
								trend.isPositive ? "text-green-500" : "text-red-500"
							}`}
						>
							{trend.isPositive ? (
								<TrendingUpIcon className="size-3" />
							) : (
								<TrendingDownIcon className="size-3" />
							)}
							{trend.isPositive ? "+" : ""}
							{trend.value}%
						</span>
					)}
					{subtitle && (
						<span className="text-xs text-gray-400 truncate">{subtitle}</span>
					)}
				</div>
			</div>
		</div>
	);

	if (href) {
		return (
			<Link href={href} className="block">
				{content}
			</Link>
		);
	}

	return content;
}

interface QuickStatCardProps {
	title: string;
	primaryValue: string | number;
	primaryLabel: string;
	secondaryValue?: string | number;
	secondaryLabel?: string;
	icon: LucideIcon;
	href?: string;
	accentColor?: string;
}

export function QuickStatCard({
	title,
	primaryValue,
	primaryLabel,
	secondaryValue,
	secondaryLabel,
	icon: Icon,
	href,
	accentColor = "bg-blue-50 text-blue-600",
}: QuickStatCardProps) {
	const [bgClass, textClass] = accentColor.split(" ");

	const content = (
		<div className="bg-white p-4 rounded-2xl hover:shadow-sm transition-shadow cursor-pointer h-full">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-medium text-gray-600">{title}</h3>
				<div
					className={`size-8 rounded-lg ${bgClass} flex items-center justify-center`}
				>
					<Icon className={`size-4 ${textClass}`} />
				</div>
			</div>
			<div className="space-y-1">
				<div>
					<span className="text-xl font-bold text-primary">{primaryValue}</span>
					<span className="text-xs text-gray-400 ml-1">{primaryLabel}</span>
				</div>
				{secondaryValue !== undefined && secondaryLabel && (
					<div>
						<span className="text-sm font-medium text-gray-600">
							{secondaryValue}
						</span>
						<span className="text-xs text-gray-400 ml-1">
							{secondaryLabel}
						</span>
					</div>
				)}
			</div>
		</div>
	);

	if (href) {
		return (
			<Link href={href} className="block">
				{content}
			</Link>
		);
	}

	return content;
}
