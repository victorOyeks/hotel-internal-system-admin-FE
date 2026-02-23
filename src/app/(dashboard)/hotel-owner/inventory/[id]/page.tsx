import { SingleInventoryPage } from "@/components/roles/hotel-owner/inventory.single";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { Suspense, use } from "react";
import z from "zod";

const SearchParamsSchema = z
	.object({
		category: z.string(),
		status: z.string(),
		search: z.string(),
		page: z.coerce.number().default(0),
		size: z.coerce.number().default(10),
		section: z.enum(["all", "history"]).default("all"),
	})
	.partial();

const ParamsSchema = z.object({
	id: z.string(),
});

function InventoryPage({
	params,
	searchParams,
}: {
	params: Promise<Record<string, string>>;
	searchParams: Promise<Record<string, string>>;
}) {
	const queryClient = getQueryClient();
	const cookieData = use(getCookieData())!;
	const [paramsData, searchParamsData] = use(
		Promise.all([params, searchParams]),
	);
	const { section, ...validatedSearchParams } =
		SearchParamsSchema.parse(searchParamsData);
	const validatedParams = ParamsSchema.parse(paramsData);

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: [
				"inventory",
				validatedParams.id,
				section,
				validatedSearchParams,
			],
			queryFn: async () => {
				const data = await $fetch(
					"@get/api/hotel-owners/:hotelId/inventories",
					{
						query: {
							search: validatedSearchParams.search || undefined,
							category: validatedSearchParams.category || undefined,
							status: validatedSearchParams.status || undefined,
							page: validatedSearchParams.page
								? validatedSearchParams.page - 1
								: 0,
							size: validatedSearchParams.size || 10,
						},
						params: { hotelId: validatedParams.id },
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);

				return data.data;
			},
		}),
	);

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<SingleInventoryPage data={content} paginationMeta={paginationMeta} />
		</Suspense>
	);
}

export default InventoryPage;
