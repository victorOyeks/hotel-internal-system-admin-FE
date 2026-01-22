import { MainInventoryPage } from "@/components/roles/hotel-owner/inventory";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";
import z from "zod";

const ParamsSchema = z
	.object({
		searchName: z.string(),
		page: z.coerce.number().default(0),
		size: z.coerce.number().default(10),
	})
	.partial();

function InventoryPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const queryClient = getQueryClient();
	const cookieData = use(getCookieData())!;
	const params = use(searchParams);
	const parsedQueryParams = ParamsSchema.parse(params);

	const { content: inventoryQuery, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["hotels", parsedQueryParams],
			queryFn: async () => {
				const data = await $fetch("@get/api/hotel-owners/hotels", {
					auth: { type: "Bearer", token: cookieData.token },
					query: {
						...parsedQueryParams,
						page: parsedQueryParams.page ? parsedQueryParams.page - 1 : 0,
					},
					throw: true,
				});

				return data.data;
			},
		}),
	);

	return (
		<MainInventoryPage data={inventoryQuery} paginationMeta={paginationMeta} />
	);
}

export default InventoryPage;
