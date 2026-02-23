import { OrganizationsPage } from "@/components/roles/manager/organizations";
import { getUser, verifySession } from "@/lib/dal";
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

function FrontDeskOrganizationsPage({ searchParams }: PageProps) {
	const session = use(verifySession("FRONT_DESK"));
	const user = use(getUser());
	const query = use(loadSearchParams(searchParams));
	const queryClient = getQueryClient();

	const hotelId = user?.hotels?.[0]?.id ?? "";

	const breadcrumb = {
		title: "Organizations",
		breadcrumbs: [
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Organizations", href: "/dashboard/organizations" },
		],
	};

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
				readOnly
			/>
		</HydrationBoundary>
	);
}

export default FrontDeskOrganizationsPage;
