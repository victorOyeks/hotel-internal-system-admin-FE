import { RentalMaintenancePage } from "@/components/roles/rentals/rental-maintenance";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { unstable_noStore as noStore } from "next/cache";
import { use } from "react";

const breadcrumbs = {
	title: "Maintenance",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Maintenance", href: "/dashboard/maintenance" },
	],
};

export default function RentalMaintenancePageRoute() {
	noStore();
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

	// Single batch call instead of N+1 per-item calls
	const maintenanceHistoryLogs = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "maintenance", "history"],
			queryFn: async ({ signal }) => {
				try {
					const response = await $fetch(
						"@get/api/hotels/rentals/maintenance/history",
						{
							auth: { type: "Bearer", token },
							signal,
							throw: true,
						},
					);
					const logs = Array.isArray(response.data)
						? response.data
						: (response.data?.content ?? []);

					// Build a lookup of rental items by ID for enrichment
					const itemMap = new Map<string, any>();
					for (const item of rentalItems) {
						itemMap.set(item.id, item);
					}

					return logs.map((log: any) => {
						const item = itemMap.get(log?.rentalItemId) ?? {};
						return {
							...log,
							rentalItemId: log?.rentalItemId || log?.itemId || "",
							rentalItem: {
								...(log?.rentalItem || {}),
								id:
									log?.rentalItem?.id ||
									log?.rentalItemId ||
									log?.itemId ||
									"",
								name:
									log?.rentalItem?.name ||
									log?.rentalItemName ||
									item?.name ||
									"Unknown item",
								category:
									log?.rentalItem?.category ||
									item?.category ||
									"OTHERS",
							},
						};
					});
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
