import { AppSidebar } from "@/components/shared/app-sidebar"
import { Header } from "@/components/shared/header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { LayoutProps } from "@/lib/types"

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar collapsible="icon" />
      <SidebarInset className="bg-background-blue">
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
