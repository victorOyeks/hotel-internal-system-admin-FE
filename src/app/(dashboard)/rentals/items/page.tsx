import { RentalItemsPage } from "@/components/roles/rentals/rental-items";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Rental Items",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Rental Items", href: "/dashboard/items" },
	],
};

export default function RentalItemsPageRoute() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const items = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "items"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/hotels/rentals/items", {
					query: { activeOnly: true },
					auth: { type: "Bearer", token },
					signal,
					throw: true,
				});
				const rows = Array.isArray(response.data)
					? response.data
					: (response.data?.content ?? []);

				const isFaultyLog = (log: Record<string, unknown>) => {
					const values = [
						log?.type,
						log?.action,
						log?.status,
						log?.maintenanceResultStatus,
						log?.resultStatus,
						log?.condition,
					]
						.filter(Boolean)
						.map((value) => String(value).toUpperCase());
					return values.some(
						(value) =>
							value.includes("FAULTY") ||
							value.includes("WRITE_OFF") ||
							value.includes("BAD") ||
							value.includes("DAMAGED") ||
							value.includes("OUT_OF_SERVICE"),
					);
				};

				const settled = await Promise.allSettled(
					rows.map(async (item: any) => {
						const response = await $fetch(
							"@get/api/hotels/rentals/items/:itemId/maintenance/history",
							{
								params: { itemId: item.id },
								auth: { type: "Bearer", token },
								signal,
								throw: true,
							},
						);
						const logs = Array.isArray(response.data)
							? response.data
							: (response.data?.content ?? []);
						const faultyFromHistory = logs
							.filter((log: Record<string, unknown>) => isFaultyLog(log))
							.reduce(
								(sum: number, log: Record<string, unknown>) =>
									sum + Math.max(0, Number(log?.quantity ?? 0)),
								0,
							);
						const faultyFromApi = Math.max(
							0,
							Number(
								item?.faultyQuantity ??
									item?.writeOffQuantity ??
									item?.damagedQuantity ??
									item?.outOfServiceQuantity ??
									0,
							),
						);
						return {
							...item,
							faultyQuantity: Math.max(faultyFromApi, faultyFromHistory),
						};
					}),
				);

				return settled.map((result, index) =>
					result.status === "fulfilled" ? result.value : rows[index],
				);
			},
		}),
	);

	return <RentalItemsPage items={items} breadcrumbs={breadcrumbs} />;
}
