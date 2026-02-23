import { OrganizationDetailPage } from "@/components/roles/manager/organization-detail";
import { getManagerCurrentHotel, verifySession } from "@/lib/dal";
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

function ManagerOrganizationDetailPage({ params }: PageProps) {
	const { id } = use(params);
	const session = use(verifySession("MANAGER"));
	const currentHotel = use(getManagerCurrentHotel())!;
	const queryClient = getQueryClient();

	const organization = use(
		queryClient.ensureQueryData({
			queryKey: ["organization", id, currentHotel.id],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/corporate/organizations/:id",
					{
						params: { id },
						query: { hotelId: currentHotel.id },
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
				hotelId={currentHotel.id}
			/>
		</HydrationBoundary>
	);
}

export default ManagerOrganizationDetailPage;
