'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArchiveIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  ClockIcon,
  FileTextIcon,
  PackageCheckIcon,
  ClipboardListIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShoppingCartIcon,
  PackageIcon,
  CalendarIcon,
} from 'lucide-react'
import Link from 'next/link'

// Mock dashboard data based on FRD requirements
const mockDashboardData = {
  // Product Metrics (FRD 3.11.1)
  productMetrics: {
    totalActiveProducts: 245,
    productsCount: 245,
  },

  // Stock Metrics
  stockMetrics: {
    lowStockItems: 23,
    outOfStockItems: 8,
    expiringSoon: 12, // Next 30 days
  },

  // Purchase Order Metrics
  purchaseOrderMetrics: {
    pendingApproval: 5,
    approved: 8,
    totalPendingValue: 15420.5,
    totalApprovedValue: 28750.0,
  },

  // Stock Take Metrics
  stockTakeMetrics: {
    scheduled: 2,
    inProgress: 1,
    pendingReview: 1,
  },

  // GRN Metrics
  grnMetrics: {
    unpostedCount: 4,
    unpostedValue: 8950.75,
  },

  // Adjustment Metrics
  adjustmentMetrics: {
    pendingApproval: 3,
    unapprovedValue: 1250.0,
  },

  // Recent Activity
  recentActivity: [
    {
      id: '1',
      type: 'GRN_CREATED',
      description: 'GRN-20251123-001 created for Supplier ABC',
      timestamp: '2 hours ago',
      icon: FileTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: '2',
      type: 'PO_APPROVED',
      description: 'PO-20251123-005 approved - $5,250',
      timestamp: '3 hours ago',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: '3',
      type: 'STOCK_ISSUED',
      description: '50 units issued to Kitchen department',
      timestamp: '5 hours ago',
      icon: PackageCheckIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: '4',
      type: 'LOW_STOCK_ALERT',
      description: 'Low stock alert: Kitchen Towels (5 remaining)',
      timestamp: '6 hours ago',
      icon: AlertTriangleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ],

  // Top Low Stock Items
  topLowStockItems: [
    {
      id: '1',
      name: 'Kitchen Towels',
      current: 5,
      reorderLevel: 20,
      unit: 'pcs',
    },
    {
      id: '2',
      name: 'Laundry Detergent',
      current: 8,
      reorderLevel: 25,
      unit: 'liters',
    },
    {
      id: '3',
      name: 'Toilet Paper',
      current: 12,
      reorderLevel: 50,
      unit: 'rolls',
    },
    {
      id: '4',
      name: 'Hand Soap',
      current: 15,
      reorderLevel: 40,
      unit: 'bottles',
    },
    {
      id: '5',
      name: 'Cleaning Solution',
      current: 6,
      reorderLevel: 20,
      unit: 'liters',
    },
  ],
}

export function EnhancedInventoryDashboard() {
  const {
    productMetrics,
    stockMetrics,
    purchaseOrderMetrics,
    stockTakeMetrics,
    grnMetrics,
    adjustmentMetrics,
    recentActivity,
    topLowStockItems,
  } = mockDashboardData

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Inventory Dashboard
          </h1>
          <p className='text-muted-foreground mt-1'>
            Monitor and manage your inventory operations
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            <ClockIcon className='w-4 h-4 mr-2' />
            View History
          </Button>
          <Button size='sm'>
            <FileTextIcon className='w-4 h-4 mr-2' />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts Section */}
      {(stockMetrics.outOfStockItems > 0 || stockMetrics.expiringSoon > 0) && (
        <div className='grid gap-4 md:grid-cols-2'>
          {stockMetrics.outOfStockItems > 0 && (
            <Card className='border-l-4 border-l-red-500'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-4'>
                  <div className='p-3 bg-red-50 rounded-lg'>
                    <AlertCircleIcon className='w-6 h-6 text-red-600' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Out of Stock
                    </p>
                    <h3 className='text-2xl font-bold text-red-600'>
                      {stockMetrics.outOfStockItems} items
                    </h3>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Requires immediate attention
                    </p>
                  </div>
                  <Button variant='destructive' size='sm' asChild>
                    <Link href='/inventory/inventory?availability=OUT_OF_STOCK'>
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {stockMetrics.expiringSoon > 0 && (
            <Card className='border-l-4 border-l-orange-500'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-4'>
                  <div className='p-3 bg-orange-50 rounded-lg'>
                    <CalendarIcon className='w-6 h-6 text-orange-600' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Expiring Soon
                    </p>
                    <h3 className='text-2xl font-bold text-orange-600'>
                      {stockMetrics.expiringSoon} items
                    </h3>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Within next 30 days
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-orange-300'
                  >
                    View Items
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Total Products */}
        <MetricCard
          title='Total Products'
          value={productMetrics.totalActiveProducts}
          icon={PackageIcon}
          iconColor='text-blue-600'
          iconBg='bg-blue-50'
          trend={{ value: 12, direction: 'up' }}
        />

        {/* Low Stock */}
        <MetricCard
          title='Low Stock Items'
          value={stockMetrics.lowStockItems}
          icon={AlertTriangleIcon}
          iconColor='text-yellow-600'
          iconBg='bg-yellow-50'
          href='/inventory/inventory?availability=LOW_IN_STOCK'
          actionLabel='View'
        />

        {/* Pending POs */}
        <MetricCard
          title='Pending PO Approvals'
          value={purchaseOrderMetrics.pendingApproval}
          icon={ClipboardListIcon}
          iconColor='text-purple-600'
          iconBg='bg-purple-50'
          subtitle={`$${purchaseOrderMetrics.totalPendingValue.toLocaleString()}`}
          href='/inventory/purchase-orders?status=PENDING_APPROVAL'
          actionLabel='Review'
        />

        {/* Unposted GRNs */}
        <MetricCard
          title='Unposted GRNs'
          value={grnMetrics.unpostedCount}
          icon={FileTextIcon}
          iconColor='text-green-600'
          iconBg='bg-green-50'
          subtitle={`$${grnMetrics.unpostedValue.toLocaleString()}`}
          href='/inventory/grn?posted=false'
          actionLabel='Post'
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className='grid gap-4 md:grid-cols-3'>
        {/* Approved POs */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Approved Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-2xl font-bold'>
                  {purchaseOrderMetrics.approved}
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  ${purchaseOrderMetrics.totalApprovedValue.toLocaleString()}{' '}
                  total
                </p>
              </div>
              <ShoppingCartIcon className='w-8 h-8 text-muted-foreground/40' />
            </div>
          </CardContent>
        </Card>

        {/* Stock Takes */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Stock Takes Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Scheduled:</span>
                <Badge variant='outline'>{stockTakeMetrics.scheduled}</Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span>In Progress:</span>
                <Badge variant='secondary'>{stockTakeMetrics.inProgress}</Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span>Pending Review:</span>
                <Badge>{stockTakeMetrics.pendingReview}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Adjustments */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Pending Adjustments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-2xl font-bold'>
                  {adjustmentMetrics.pendingApproval}
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  ${adjustmentMetrics.unapprovedValue.toLocaleString()} value
                </p>
              </div>
              <Button variant='outline' size='sm'>
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lower Section: Activity Feed and Low Stock Items */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className='flex items-start gap-3'>
                    <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium'>
                        {activity.description}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Low Stock Items */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Critical Low Stock Items</CardTitle>
              <Button variant='link' size='sm' asChild>
                <Link href='/inventory/inventory?availability=LOW_IN_STOCK'>
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {topLowStockItems.map((item) => {
                const percentage = (item.current / item.reorderLevel) * 100
                return (
                  <div key={item.id} className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='font-medium'>{item.name}</span>
                      <span className='text-muted-foreground'>
                        {item.current}/{item.reorderLevel} {item.unit}
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage < 30
                            ? 'bg-red-500'
                            : percentage < 50
                            ? 'bg-orange-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Reusable Metric Card Component
function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  subtitle,
  trend,
  href,
  actionLabel,
}: {
  title: string
  value: number
  icon: any
  iconColor: string
  iconBg: string
  subtitle?: string
  trend?: { value: number; direction: 'up' | 'down' }
  href?: string
  actionLabel?: string
}) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className={`p-3 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {trend && (
            <Badge variant='secondary' className='flex items-center gap-1'>
              {trend.direction === 'up' ? (
                <TrendingUpIcon className='w-3 h-3 text-green-600' />
              ) : (
                <TrendingDownIcon className='w-3 h-3 text-red-600' />
              )}
              {trend.value}%
            </Badge>
          )}
        </div>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <h3 className='text-2xl font-bold'>{value}</h3>
          {subtitle && (
            <p className='text-xs text-muted-foreground'>{subtitle}</p>
          )}
        </div>
        {href && actionLabel && (
          <Button variant='outline' size='sm' className='w-full mt-3' asChild>
            <Link href={href}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
