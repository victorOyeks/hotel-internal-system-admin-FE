import { FrontDeskStats, PendingMaintenanceNotifications, QuickActions } from "@/components/roles/front-desk/dashboard"

function Page() {
  return (
    <div className="space-y-4 px-4 py-4">
      <section className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="md:col-span-5 space-y-4">
        <FrontDeskStats />
        <QuickActions />
      </div>
      <div className="md:col-span-2">
        <PendingMaintenanceNotifications />
      </div>
      </section>

    </div>
  )
}


export default Page