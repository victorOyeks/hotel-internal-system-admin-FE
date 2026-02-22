import { OrganizationsPage } from "@/components/roles/manager/organizations";
import { getManagerCurrentHotel, verifySession } from "@/lib/dal";
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

function ManagerOrganizationsPage({ searchParams }: PageProps) {
	const session = use(verifySession("MANAGER"));
	const currentHotel = use(getManagerCurrentHotel())!;
	const query = use(loadSearchParams(searchParams));
	const queryClient = getQueryClient();

	const breadcrumb = {
		title: "Organizations",
		breadcrumbs: [
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Organizations", href: "/dashboard/organizations" },
		],
	};

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["organizations", currentHotel.id, query],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/corporate/organizations",
					{
						query: {
							hotelId: currentHotel.id,
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
				hotelId={currentHotel.id}
			/>
		</HydrationBoundary>
	);
}

export default ManagerOrganizationsPage;
