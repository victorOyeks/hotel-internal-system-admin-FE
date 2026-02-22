import { OrganizationsPage } from "@/components/roles/manager/organizations";
import { getOwnerCurrentHotel, verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

export const dynamic = "force-dynamic";

const loadSearchParams = createLoader({
	...paginationSearchParams,
	search: parseAsString.withDefault(""),
});

type PageProps = {
	searchParams: Promise<SearchParams>;
};

function OwnerOrganizationsPage({ searchParams }: PageProps) {
	const session = use(verifySession("HOTEL_OWNER"));
	const currentHotel = use(getOwnerCurrentHotel());
	const query = use(loadSearchParams(searchParams));
	const queryClient = getQueryClient();

	const breadcrumb = {
		title: "Organizations",
		breadcrumbs: [
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Organizations", href: "/dashboard/organizations" },
		],
	};

	const hotelId = currentHotel?.id ?? "";

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["organizations", hotelId, query],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/corporate/organizations",
					{
						query: {
							hotelId,
							page: query.page ? query.page - 1 : 0,
							size: query.size,
							search: query.search || undefined,
						},
						auth: { type: "Bearer", token: session.token },
						throw: true,
					},
				);
				return response.data;
			},
		}),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<OrganizationsPage
				breadcrumb={breadcrumb}
				organizations={content}
				paginationMeta={paginationMeta}
				hotelId={hotelId}
			/>
		</HydrationBoundary>
	);
}

export default OwnerOrganizationsPage;
