"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="w-full space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
			{/* Earnings Cards Skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className="bg-white p-2 md:pl-4 rounded-2xl flex items-center space-x-2"
					>
						<Skeleton className="size-10 md:size-12 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-6 w-16" />
						</div>
					</div>
				))}
			</div>

			{/* Chart Skeleton */}
			<div className="bg-white p-4 rounded-2xl">
				<Skeleton className="h-6 w-32 mb-4" />
				<Skeleton className="h-64 w-full" />
			</div>

			{/* Additional Content Skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-white p-4 rounded-2xl">
					<Skeleton className="h-6 w-24 mb-4" />
					<div className="space-y-2">
						{Array.from({ length: 4 }).map((_, index) => (
							<Skeleton key={index} className="h-4 w-full" />
						))}
					</div>
				</div>
				<div className="bg-white p-4 rounded-2xl">
					<Skeleton className="h-6 w-24 mb-4" />
					<div className="space-y-2">
						{Array.from({ length: 4 }).map((_, index) => (
							<Skeleton key={index} className="h-4 w-full" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
