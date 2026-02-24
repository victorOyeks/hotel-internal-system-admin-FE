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
	const byStatus = values.some(
		(value) =>
			value.includes("FAULTY") ||
			value.includes("WRITE_OFF") ||
			value.includes("BAD") ||
			value.includes("DAMAGED") ||
			value.includes("OUT_OF_SERVICE"),
	);
	if (byStatus) return true;
	const text = `${String(log?.reason || "")} ${String(log?.notes || "")}`.toLowerCase();
	return (
		text.includes("cannot be fixed") ||
		text.includes("can't be fixed") ||
		text.includes("not fixable") ||
		text.includes("irreparable") ||
		text.includes("faulty") ||
		text.includes("damaged") ||
		text.includes("bad")
	);
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

				// Single batch call instead of N+1 per-item calls
				let allLogs: Record<string, unknown>[] = [];
				try {
					const historyResponse = await $fetch(
						"@get/api/hotels/rentals/maintenance/history",
						{
							auth: { type: "Bearer", token },
							signal,
							throw: true,
						},
					);
					allLogs = Array.isArray(historyResponse.data)
						? historyResponse.data
						: (historyResponse.data?.content ?? []);
				} catch {
					// If batch endpoint fails, continue without faulty counts
				}

				// Group logs by rental item ID
				const logsByItemId = new Map<string, Record<string, unknown>[]>();
				for (const log of allLogs) {
					const itemId = String(log?.rentalItemId ?? "");
					if (!itemId) continue;
					if (!logsByItemId.has(itemId)) logsByItemId.set(itemId, []);
					logsByItemId.get(itemId)!.push(log);
				}

				return rows.map((item: any) => {
					const logs = logsByItemId.get(item.id) ?? [];
					const faultyFromHistory = logs
						.filter((log) => isFaultyLog(log))
						.reduce(
							(sum: number, log) =>
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
				});
			},
		}),
	);

	return <RentalItemsPage items={items} breadcrumbs={breadcrumbs} />;
}
