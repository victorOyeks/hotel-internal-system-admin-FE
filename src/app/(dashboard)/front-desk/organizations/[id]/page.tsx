import { OrganizationDetailPage } from "@/components/roles/manager/organization-detail";
import { getUser, verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { use } from "react";

export const dynamic = "force-dynamic";

type PageProps = {
	searchParams: Promise<SearchParams>;
	params: Promise<{ id: string }>;
};

function FrontDeskOrganizationDetailPage({ params }: PageProps) {
	const { id } = use(params);
	const session = use(verifySession("FRONT_DESK"));
	const user = use(getUser());
	const queryClient = getQueryClient();

	const hotelId = user?.hotels?.[0]?.id ?? "";

	const organization = use(
		queryClient.ensureQueryData({
			queryKey: ["organization", id, hotelId],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/corporate/organizations/:id",
					{
						params: { id },
						query: { hotelId },
						auth: { type: "Bearer", token: session.token },
						throw: true,
					},
				);
				return response.data;
			},
		}),
	);

	const breadcrumb = {
		title: organization.name,
		breadcrumbs: [
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Organizations", href: "/dashboard/organizations" },
			{ label: organization.name, href: `/dashboard/organizations/${id}` },
		],
	};

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<OrganizationDetailPage
				breadcrumb={breadcrumb}
				organization={organization}
				hotelId={hotelId}
				canBookGuests
			/>
		</HydrationBoundary>
	);
}

export default FrontDeskOrganizationDetailPage;
