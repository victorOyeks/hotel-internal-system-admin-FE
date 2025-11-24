'use client'

import { BreadCrumbWrapper } from '@/components/shared/BreadCrumbWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon, PhoneIcon } from 'lucide-react'
import type { Pagination } from '@/lib/fetch'

type OverdueOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  daysOverdue: number
  lateFees: number
  totalAmount: number
  rentalEndDate: string
}

type OverdueRentalsPageProps = {
  orders: OverdueOrder[]
  paginationMeta: Pagination
  breadcrumbs: {
    title: string
    breadcrumbs: Array<{ label: string; href: string }>
  }
}

export function OverdueRentalsPage({
  orders,
  paginationMeta,
  breadcrumbs,
}: OverdueRentalsPageProps) {
  return (
    <BreadCrumbWrapper breadcrumbs={breadcrumbs}>
      <div className='flex flex-col gap-6 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-red-600'>Overdue Rentals</h1>
            <p className='text-muted-foreground mt-1'>
              {orders.length} rental{orders.length !== 1 ? 's' : ''} past due
              date
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          {orders.map((order) => (
            <OverdueCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </BreadCrumbWrapper>
  )
}

function OverdueCard({ order }: { order: OverdueOrder }) {
  return (
    <Card className='border-l-4 border-l-red-500 hover:shadow-md transition-shadow'>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-red-50 rounded-lg'>
              <AlertCircleIcon className='w-6 h-6 text-red-600' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold text-lg'>{order.orderNumber}</h3>
                <Badge className='bg-red-100 text-red-800'>
                  {order.daysOverdue} day{order.daysOverdue !== 1 ? 's' : ''}{' '}
                  overdue
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground mt-1'>
                {order.customerName} • {order.customerPhone}
              </p>
              <p className='text-xs text-red-600 font-medium mt-1'>
                Due: {new Date(order.rentalEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <div className='text-right'>
              <p className='text-sm text-muted-foreground'>Total Amount</p>
              <p className='font-semibold text-lg'>
                ${order.totalAmount.toLocaleString()}
              </p>
              <p className='text-sm text-red-600'>
                +${order.lateFees.toLocaleString()} late fee
              </p>
            </div>
            <Button
              variant='outline'
              className='border-red-300 text-red-700 hover:bg-red-50'
            >
              <PhoneIcon className='w-4 h-4 mr-2' />
              Contact
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
