import { RentalMaintenancePage } from "@/components/roles/rentals/rental-maintenance";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Maintenance",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Maintenance", href: "/dashboard/maintenance" },
	],
};

export default function RentalMaintenancePageRoute() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const pendingMaintenance = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "maintenance", "pending"],
			queryFn: async ({ signal }) => {
				try {
					const response = await $fetch(
						"@get/api/hotels/rentals/maintenance/pending",
						{
							auth: { type: "Bearer", token },
							signal,
							throw: true,
						},
					);
					const data = response.data;
					return Array.isArray(data) ? data : (data?.content ?? []);
				} catch {
					return [];
				}
			},
		}),
	);

	const rentalItems = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "items", "catalog"],
			queryFn: async ({ signal }) => {
				try {
					const response = await $fetch("@get/api/hotels/rentals/items", {
						auth: { type: "Bearer", token },
						signal,
						throw: true,
					});
					return Array.isArray(response.data)
						? response.data
						: (response.data?.content ?? []);
				} catch {
					return [];
				}
			},
		}),
	);

	const maintenanceHistoryLogs = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "maintenance", "history"],
			queryFn: async ({ signal }) => {
				try {
					const settled = await Promise.allSettled(
						rentalItems.map(async (item: any) => {
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
							return logs.map((log: any) => ({
								...log,
								rentalItemId: log?.rentalItemId || log?.itemId || item.id,
								rentalItem: {
									...(log?.rentalItem || {}),
									id:
										log?.rentalItem?.id ||
										log?.rentalItemId ||
										log?.itemId ||
										item.id,
									name: log?.rentalItem?.name || item.name || "Unknown item",
									category: log?.rentalItem?.category || item.category || "OTHERS",
								},
							}));
						}),
					);
					return settled
						.filter(
							(
								result,
							): result is PromiseFulfilledResult<Array<Record<string, unknown>>> =>
								result.status === "fulfilled",
						)
						.flatMap((result) => result.value);
				} catch {
					return [];
				}
			},
		}),
	);

	return (
		<RentalMaintenancePage
			pendingMaintenance={pendingMaintenance}
			rentalItems={rentalItems}
			maintenanceHistoryLogs={maintenanceHistoryLogs}
			breadcrumbs={breadcrumbs}
		/>
	);
}
