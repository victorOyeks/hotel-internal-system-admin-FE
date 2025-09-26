import { ManagerActivityLogPage } from "@/components/roles/manager/activity-log"

function Page() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard/manager" },
    { label: "Activity Log", href: "/dashboard/manager/activity" },
  ]
  return (
    <ManagerActivityLogPage breadcrumbs={{
      breadcrumbs,
      title: "Activity Log",
    }} 
    data={[]}
    paginationMeta={{
      first: true,
      last: true,
      pageNumber: 1,
      pageSize: 10,
      totalElements: 0,
      totalPages: 1
    }}
    />
  )
}

export default Page