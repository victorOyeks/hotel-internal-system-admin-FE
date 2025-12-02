import { GRNPage } from "@/components/roles/inventory/grn-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";

function Page() {
	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Goods Receipt Notes",
				breadcrumbs: [
					{
						label: "Dashboard",
						href: "/dashboard",
					},
					{
						label: "GRN",
						href: "/grn",
					},
				],
			}}
		>
			<GRNPage />
		</BreadCrumbWrapper>
	);
}

export default Page;
