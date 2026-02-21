import { Guests } from "@/components/roles/manager/guests";
import { getManagerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";
import z from "zod";

const ParamsSchema = z
	.object({
		search: z.string(),
		status: z.string(),
		page: z.coerce.number().default(0),
		size: z.coerce.number().default(20),
	})
	.partial();

function GuestsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Guests", href: "/dashboard/guests" },
	];

	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const { id } = use(getManagerCurrentHotel())!;
	const searchParamsObj = use(searchParams);
	const validatedParams = ParamsSchema.parse(searchParamsObj);

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "guests", id, validatedParams],
			queryFn: async () => {
				const res = await $fetch("@get/api/managers/guest-logs", {
					query: {
						hotelId: id,
						search: validatedParams.search,
						status: validatedParams.status,
						page: validatedParams.page ? validatedParams.page - 1 : 0,
						size: validatedParams.size,
					},
					auth: { type: "Bearer", token: cookieData.token },
					throw: true,
				});
				return res.data;
			},
		}),
	);

	return (
		<Guests
			breadcrumbs={breadcrumbs}
			guests={content}
			paginationMeta={paginationMeta}
		/>
	);
}

export default GuestsPage;
