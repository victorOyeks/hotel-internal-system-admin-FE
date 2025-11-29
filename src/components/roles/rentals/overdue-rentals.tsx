'use client'

import { BreadCrumbWrapper } from '@/components/shared/BreadCrumbWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

        <Card className='border-t-4 border-t-red-500'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <AlertCircleIcon className='w-5 h-5 text-red-600' />
              <CardTitle className='text-lg text-red-600'>Urgent: Overdue Items ({orders.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className='text-center'>Days Overdue</TableHead>
                  <TableHead className='text-right'>Total Amount</TableHead>
                  <TableHead className='text-right'>Late Fees</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className='hover:bg-red-50/50'>
                    <TableCell className='font-medium'>{order.orderNumber}</TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='font-medium text-sm'>{order.customerName}</span>
                        <span className='text-xs text-muted-foreground'>{order.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm text-red-600 font-medium'>
                          {new Date(order.rentalEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Badge className='bg-red-100 text-red-800 border-red-200'>
                        {order.daysOverdue} {order.daysOverdue === 1 ? 'day' : 'days'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right font-semibold'>
                      ${order.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <span className='text-red-600 font-semibold'>
                        +${order.lateFees.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-red-300 text-red-700 hover:bg-red-50'
                      >
                        <PhoneIcon className='w-4 h-4 mr-1' />
                        Contact
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </BreadCrumbWrapper>
  )
}
