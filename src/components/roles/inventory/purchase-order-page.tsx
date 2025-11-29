'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  PlusIcon,
  SearchIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  XCircleIcon,
  EyeIcon,
  Trash2Icon,
} from 'lucide-react'

// PO types based on FRD 3.7
type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'

type PurchaseOrderItem = {
  id: string
  productId: string
  productName: string
  productSku: string
  quantityOrdered: number
  unitPrice: number
  taxRate: number
  lineTotal: number
  notes?: string
}

type PurchaseOrder = {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  orderDate: string
  expectedDeliveryDate: string
  status: PurchaseOrderStatus
  items: PurchaseOrderItem[]
  subtotal: number
  shippingCost: number
  taxAmount: number
  totalAmount: number
  paymentTerms: string
  specialInstructions?: string
  createdBy: string
  approvedBy?: string
  approvedDate?: string
}

// Mock data
const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    poNumber: 'PO-20251123-0001',
    supplierId: 'SUP-001',
    supplierName: 'Premium Food Suppliers Inc.',
    orderDate: '2024-11-23',
    expectedDeliveryDate: '2024-11-28',
    status: 'PENDING_APPROVAL',
    items: [
      {
        id: '1',
        productId: 'PROD-001',
        productName: 'Premium Coffee Beans',
        productSku: 'FD-001',
        quantityOrdered: 50,
        unitPrice: 25.5,
        taxRate: 10,
        lineTotal: 1275.0,
      },
      {
        id: '2',
        productId: 'PROD-002',
        productName: 'Butter - Unsalted',
        productSku: 'FD-002',
        quantityOrdered: 30,
        unitPrice: 12.0,
        taxRate: 10,
        lineTotal: 360.0,
      },
    ],
    subtotal: 1635.0,
    shippingCost: 50.0,
    taxAmount: 168.5,
    totalAmount: 1853.5,
    paymentTerms: 'Net 30',
    specialInstructions: 'Deliver to main warehouse',
    createdBy: 'John Doe',
  },
  {
    id: '2',
    poNumber: 'PO-20251122-0005',
    supplierId: 'SUP-002',
    supplierName: 'Hotel Supplies Co.',
    orderDate: '2024-11-22',
    expectedDeliveryDate: '2024-11-27',
    status: 'APPROVED',
    items: [
      {
        id: '1',
        productId: 'PROD-003',
        productName: 'Laundry Detergent - Industrial',
        productSku: 'SUP-001',
        quantityOrdered: 100,
        unitPrice: 15.0,
        taxRate: 10,
        lineTotal: 1500.0,
      },
    ],
    subtotal: 1500.0,
    shippingCost: 75.0,
    taxAmount: 157.5,
    totalAmount: 1732.5,
    paymentTerms: 'Net 15',
    createdBy: 'Jane Smith',
    approvedBy: 'Manager Bob',
    approvedDate: '2024-11-22',
  },
  {
    id: '3',
    poNumber: 'PO-20251121-0003',
    supplierId: 'SUP-003',
    supplierName: 'Linen World',
    orderDate: '2024-11-21',
    expectedDeliveryDate: '2024-11-25',
    status: 'RECEIVED',
    items: [
      {
        id: '1',
        productId: 'PROD-004',
        productName: 'Bath Towels - White',
        productSku: 'LIN-001',
        quantityOrdered: 200,
        unitPrice: 12.5,
        taxRate: 10,
        lineTotal: 2500.0,
      },
    ],
    subtotal: 2500.0,
    shippingCost: 100.0,
    taxAmount: 260.0,
    totalAmount: 2860.0,
    paymentTerms: 'Net 30',
    createdBy: 'John Doe',
    approvedBy: 'Manager Alice',
    approvedDate: '2024-11-21',
  },
  {
    id: '4',
    poNumber: 'PO-20251120-0002',
    supplierId: 'SUP-001',
    supplierName: 'Premium Food Suppliers Inc.',
    orderDate: '2024-11-20',
    expectedDeliveryDate: '2024-11-24',
    status: 'DRAFT',
    items: [
      {
        id: '1',
        productId: 'PROD-005',
        productName: 'Orange Juice - Fresh',
        productSku: 'BV-001',
        quantityOrdered: 50,
        unitPrice: 8.75,
        taxRate: 10,
        lineTotal: 437.5,
      },
    ],
    subtotal: 437.5,
    shippingCost: 25.0,
    taxAmount: 46.25,
    totalAmount: 508.75,
    paymentTerms: 'Net 30',
    createdBy: 'John Doe',
  },
]

const statusColors: Record<
  PurchaseOrderStatus,
  { bg: string; text: string; icon: any }
> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FileTextIcon },
  PENDING_APPROVAL: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: ClockIcon,
  },
  APPROVED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: CheckCircleIcon,
  },
  RECEIVED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircleIcon },
  COMPLETED: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    icon: CheckCircleIcon,
  },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon },
}

export function PurchaseOrderPage() {
  const [orders] = useState<PurchaseOrder[]>(mockPurchaseOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' || order.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  // Get status counts
  const statusCounts = {
    pending: orders.filter((o) => o.status === 'PENDING_APPROVAL').length,
    approved: orders.filter((o) => o.status === 'APPROVED').length,
    draft: orders.filter((o) => o.status === 'DRAFT').length,
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Purchase Orders</h1>
          <p className='text-muted-foreground mt-1'>
            Create and manage purchase orders for suppliers
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className='w-4 h-4 mr-2' />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order for supplier
              </DialogDescription>
            </DialogHeader>
            <CreatePOForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-yellow-50 rounded-lg'>
                <ClockIcon className='w-5 h-5 text-yellow-600' />
              </div>
              <div className='flex-1'>
                <p className='text-sm text-muted-foreground'>
                  Pending Approval
                </p>
                <p className='text-2xl font-bold'>{statusCounts.pending}</p>
              </div>
              <Button variant='outline' size='sm'>
                Review
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-green-50 rounded-lg'>
                <CheckCircleIcon className='w-5 h-5 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Approved POs</p>
                <p className='text-2xl font-bold'>{statusCounts.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-gray-50 rounded-lg'>
                <FileTextIcon className='w-5 h-5 text-gray-600' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Draft POs</p>
                <p className='text-2xl font-bold'>{statusCounts.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  placeholder='Search by PO number or supplier...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='DRAFT'>Draft</SelectItem>
                <SelectItem value='PENDING_APPROVAL'>
                  Pending Approval
                </SelectItem>
                <SelectItem value='APPROVED'>Approved</SelectItem>
                <SelectItem value='RECEIVED'>Received</SelectItem>
                <SelectItem value='COMPLETED'>Completed</SelectItem>
                <SelectItem value='CANCELLED'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Total Amount</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const statusConfig = statusColors[order.status]
                const StatusIcon = statusConfig.icon
                return (
                  <TableRow key={order.id}>
                    <TableCell className='font-mono font-medium'>
                      {order.poNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-medium'>{order.supplierName}</p>
                        <p className='text-xs text-muted-foreground'>
                          {order.items.length} items
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        order.expectedDeliveryDate
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusConfig.bg} ${statusConfig.text} border-0`}
                      >
                        <StatusIcon className='w-3 h-3 mr-1' />
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right font-semibold'>
                      ${order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex gap-2 justify-end'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setSelectedOrder(order)}
                        >
                          <EyeIcon className='w-4 h-4' />
                        </Button>
                        {order.status === 'PENDING_APPROVAL' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-green-600'
                          >
                            <CheckCircleIcon className='w-4 h-4' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PO Details Dialog */}
      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={() => setSelectedOrder(null)}
        >
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>{selectedOrder.poNumber}</DialogTitle>
              <DialogDescription>Purchase Order Details</DialogDescription>
            </DialogHeader>
            <PODetailsView order={selectedOrder} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Create PO Form (simplified for demo)
function CreatePOForm({ onClose }: { onClose: () => void }) {
  return (
    <form className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label>Supplier *</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder='Select supplier' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='sup1'>Premium Food Suppliers Inc.</SelectItem>
              <SelectItem value='sup2'>Hotel Supplies Co.</SelectItem>
              <SelectItem value='sup3'>Linen World</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label>Expected Delivery Date *</Label>
          <Input type='date' />
        </div>
      </div>

      <div className='space-y-2'>
        <Label>Payment Terms</Label>
        <Input placeholder='e.g., Net 30' />
      </div>

      <Separator />

      <div>
        <h3 className='font-semibold mb-4'>Add Items</h3>
        <Button type='button' variant='outline' size='sm'>
          <PlusIcon className='w-4 h-4 mr-2' />
          Add Product
        </Button>
      </div>

      <div className='flex gap-2 justify-end pt-4'>
        <Button type='button' variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit'>Create Purchase Order</Button>
      </div>
    </form>
  )
}

// PO Details View
function PODetailsView({ order }: { order: PurchaseOrder }) {
  const statusConfig = statusColors[order.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0`}>
          <StatusIcon className='w-3 h-3 mr-1' />
          {order.status.replace(/_/g, ' ')}
        </Badge>
        {order.status === 'PENDING_APPROVAL' && (
          <div className='flex gap-2'>
            <Button variant='outline' size='sm'>
              <XCircleIcon className='w-4 h-4 mr-2' />
              Reject
            </Button>
            <Button size='sm'>
              <CheckCircleIcon className='w-4 h-4 mr-2' />
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Order Info */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <p className='text-sm text-muted-foreground'>Supplier</p>
          <p className='font-semibold'>{order.supplierName}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Order Date</p>
          <p className='font-semibold'>
            {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Expected Delivery</p>
          <p className='font-semibold'>
            {new Date(order.expectedDeliveryDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Payment Terms</p>
          <p className='font-semibold'>{order.paymentTerms}</p>
        </div>
      </div>

      <Separator />

      {/* Items */}
      <div>
        <h3 className='font-semibold mb-3'>Order Items</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className='text-right'>Quantity</TableHead>
              <TableHead className='text-right'>Unit Price</TableHead>
              <TableHead className='text-right'>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-mono text-sm'>
                  {item.productSku}
                </TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell className='text-right'>
                  {item.quantityOrdered}
                </TableCell>
                <TableCell className='text-right'>
                  ${item.unitPrice.toFixed(2)}
                </TableCell>
                <TableCell className='text-right font-semibold'>
                  ${item.lineTotal.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Separator />

      {/* Totals */}
      <div className='space-y-2'>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Subtotal:</span>
          <span className='font-semibold'>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Shipping:</span>
          <span className='font-semibold'>
            ${order.shippingCost.toFixed(2)}
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Tax:</span>
          <span className='font-semibold'>${order.taxAmount.toFixed(2)}</span>
        </div>
        <Separator />
        <div className='flex justify-between text-lg'>
          <span className='font-bold'>Total:</span>
          <span className='font-bold'>${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Additional Info */}
      {order.approvedBy && (
        <div className='bg-muted/50 p-4 rounded-lg'>
          <p className='text-sm text-muted-foreground'>Approved By</p>
          <p className='font-semibold'>{order.approvedBy}</p>
          <p className='text-xs text-muted-foreground'>
            {order.approvedDate &&
              new Date(order.approvedDate).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
