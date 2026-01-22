import { HotelOwnerHotels } from "@/components/roles/hotel-owner/hotels";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { use } from "react";
import { fromPromise } from "neverthrow";
import { revalidatePath } from "next/cache";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";

async function invalidatePage(
	query: Record<string, string | number | boolean>,
) {
	const queryClient = getQueryClient();
	await queryClient.invalidateQueries({
		queryKey: ["hotels", query],
		exact: true,
	});
	revalidatePath("/dashboard/hotels");
}

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	searchText: parseAsString.withDefault(""),
});

function HotelsPage({ searchParams }: PageProps) {
	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const query = use(loadSearchParams(searchParams));

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["hotels", query],
			queryFn: async () => {
				const response = await fromPromise(
					$fetch("@get/api/hotel-owners/hotels", {
						auth: {
							type: "Bearer",
							token: cookieData.token,
						},
						query: {
							...query,
							page: query.page ? query.page - 1 : 0,
						},
						throw: true,
					}),
					(error) => new Error("Failed to fetch hotels", { cause: error }),
				);
				if (response.isErr()) {
					throw response.error;
				}
				return response.value.data;
			},
		}),
	);

	const managers = use(
		queryClient.ensureQueryData({
			queryKey: ["hotel-staffs"],
			queryFn: async () => {
				const response = await fromPromise(
					$fetch("@get/api/hotel-owners/staff", {
						auth: {
							type: "Bearer",
							token: cookieData.token,
						},
						query: {
							role: "MANAGER",
						},
						throw: true,
					}),
					(error) =>
						new Error("Failed to fetch hotel managers", { cause: error }),
				);
				if (response.isErr()) {
					return {
						content: [],
					};
				}
				return response.value.data;
			},
		}),
	);

	const breadcrumb = {
		title: "Hotels",
		breadcrumbs: [
			{
				label: "Dashboard",
				href: "/dashboard",
			},
			{
				label: "Hotels",
				href: "/dashboard/hotels",
			},
		],
	};

	async function revalidate() {
		"use server";
		return invalidatePage(query);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HotelOwnerHotels
				breadcrumb={breadcrumb}
				data={content}
				paginationMeta={paginationMeta}
				managers={managers.content}
				revalidateAction={revalidate}
			/>
		</HydrationBoundary>
	);
}

export default HotelsPage;
