

"use client";

import { useState, useMemo } from "react";
import { MoreHorizontal, Trash2, Edit, Printer, PlusCircle, FileText, Upload, Undo, FileSpreadsheet, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/lib/types";
import { useData } from "@/firebase/data/data-provider";
import { Badge } from "@/components/ui/badge";
import { NewSaleForm } from "./_components/new-sale-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


function SaleDetailsView({ sale }: { sale: Sale }) {
    const { customers } = useData();
    const customer = customers.find(c => c.id === sale.customerId);

    const handlePrint = (view: 'invoice' | 'challan' | 'simple') => {
        window.open(`/print/${view}/${sale.id}`, '_blank');
    };
    
    let t1Total = 0;
    let t2Total = 0;
    let grossAmount = 0;
    let totalItemDiscount = 0;

    sale.items.forEach(item => {
        const itemGross = (item.feet || 1) * item.price * item.quantity;
        const itemDiscountAmount = itemGross * ((item.discount || 0) / 100);
        const finalAmount = itemGross - itemDiscountAmount;
        
        grossAmount += itemGross;
        totalItemDiscount += itemDiscountAmount;

        if (item.itemName.trim().toLowerCase() === 'd 29') {
            t1Total += finalAmount;
        } else {
            t2Total += finalAmount;
        }
    });

    const subtotal = grossAmount - totalItemDiscount;
    const overallDiscountAmount = subtotal * (sale.discount / 100);
    const netAmount = subtotal - overallDiscountAmount;

    return (
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
             <DialogHeader className="flex-shrink-0 no-print">
                 <div className="flex items-center justify-between">
                    <DialogTitle>Sale Details: {sale.id}</DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handlePrint('invoice')}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                        </Button>
                        <Button variant="outline" onClick={() => handlePrint('simple')}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Simple
                        </Button>
                         <Button variant="outline" onClick={() => handlePrint('challan')}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Challan
                        </Button>
                    </div>
                </div>
            </DialogHeader>

            <div className="overflow-auto flex-grow">
                <div id="printable-invoice" className="bg-white text-black font-semibold">
                     <div className="p-8 bg-teal-600 text-white font-bold">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-extrabold">ARCO Aluminium Company</h1>
                                <p className="text-sm text-teal-100 font-extrabold">B-5, PLOT 59, Industrial Estate, Hayatabad, Peshawar</p>
                                <p className="text-sm text-teal-100 font-extrabold">+92 333 4646356</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-extrabold uppercase">Invoice</h2>
                                <div className="grid grid-cols-2 gap-x-4 mt-2 text-sm">
                                    <span className="font-extrabold">Date:</span>
                                    <span className="font-extrabold">{formatDate(sale.date)}</span>
                                    <span className="font-extrabold">Invoice #:</span>
                                    <span className="font-extrabold">{sale.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="space-y-4">
                                <div className="font-bold text-sm uppercase text-gray-500">From</div>
                                <div className="text-sm text-gray-700 font-semibold">
                                    <p className="font-bold">ARCO Aluminium Company</p>
                                    <p>B-5, PLOT 59, Industrial Estate,</p>
                                    <p>Hayatabad, Peshawar</p>
                                    <p>+92 333 4646356</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                 <div className="font-bold text-sm uppercase text-gray-500">To</div>
                                <div className="text-sm text-gray-700 font-semibold">
                                    <p className="font-extrabold">{sale.customerName}</p>
                                    {customer?.address && <p>{customer.address}</p>}
                                    {customer?.phoneNumber && <p>{customer.phoneNumber}</p>}
                                </div>
                            </div>
                        </div>


                        <Table className="text-sm font-bold">
                            <TableHeader>
                                <TableRow className="bg-gray-100 hover:bg-gray-100">
                                    <TableHead className="font-extrabold text-gray-800 uppercase w-[35%]">Description</TableHead>
                                    <TableHead className="text-right font-extrabold text-gray-800 uppercase">Feet</TableHead>
                                    <TableHead className="text-right font-extrabold text-gray-800 uppercase">Qty</TableHead>
                                    <TableHead className="text-right font-extrabold text-gray-800 uppercase">Rate</TableHead>
                                    <TableHead className="text-right font-extrabold text-gray-800 uppercase">Disc. %</TableHead>
                                    <TableHead className="text-right font-extrabold text-gray-800 uppercase">Discount</TableHead>
                                    <TableHead className="text-right font-extrabold text-gray-800 uppercase">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {sale.items.map((item, index) => {
                                const itemTotal = (item.feet || 1) * item.price * item.quantity;
                                const discountAmount = itemTotal * ((item.discount || 0) / 100);
                                const finalAmount = itemTotal - discountAmount;
                                return (
                                <TableRow key={index} className="border-gray-200">
                                    <TableCell className="font-bold text-gray-800">
                                        {item.itemName}
                                        <span className="text-gray-500 text-xs block font-semibold">
                                            {item.thickness} - {item.color}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-gray-600 font-bold">{item.feet ? item.feet.toFixed(2) : '-'}</TableCell>
                                    <TableCell className="text-right text-gray-600 font-bold">{item.quantity}</TableCell>
                                    <TableCell className="text-right text-gray-600 font-bold">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right text-gray-600 font-bold">{item.discount || 0}%</TableCell>
                                    <TableCell className="text-right text-gray-600 font-bold">{formatCurrency(discountAmount)}</TableCell>
                                    <TableCell className="text-right font-bold text-gray-800">{formatCurrency(finalAmount)}</TableCell>
                                </TableRow>
                                );
                            })}
                            </TableBody>
                        </Table>

                        <div className="flex justify-between items-start mt-8">
                             <div className="w-1/2">
                                <div className="font-bold text-sm uppercase text-gray-500">Notes</div>
                                <p className="text-xs text-gray-500 mt-2 font-semibold">
                                    {sale.description || 'Thank you for your business. Please contact us for any queries regarding this invoice.'}
                                </p>
                            </div>
                            <div className="w-full max-w-sm space-y-2 text-sm font-semibold">
                                <div className="flex justify-between text-gray-600"><span>Gross Amount</span><span>{formatCurrency(grossAmount)}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Item Discounts</span><span>- {formatCurrency(totalItemDiscount)}</span></div>
                                
                                <div className="border-t my-2"></div>
                                
                                {sale.showT1T2 ? (
                                    <>
                                        {t1Total > 0 && <div className="flex justify-between text-gray-800 font-bold"><span>D 29 Total (T1)</span><span>{formatCurrency(t1Total)}</span></div>}
                                        {t2Total > 0 && <div className="flex justify-between text-gray-800 font-bold"><span>Other Items Total (T2)</span><span>{formatCurrency(t2Total)}</span></div>}
                                        <div className="border-t my-2"></div>
                                    </>
                                ) : null}

                                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Overall Discount ({sale.discount}%)</span><span>- {formatCurrency(overallDiscountAmount)}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-800 pt-2 mt-2"><span>Net Amount</span><span>{formatCurrency(netAmount)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    )
}


export default function SalesPage() {
  const { customers, sales, deleteSale, postSale, unpostSale, loading: isDataLoading } = useData();
  
  const [activeTab, setActiveTab] = useState("history");
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "posted">("all");

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    let filtered = [...sales];

    if (customerFilter) {
        filtered = filtered.filter(s => s.customerId === customerFilter);
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
        const numA = parseInt(a.id.split('-')[1] || '0', 10);
        const numB = parseInt(b.id.split('-')[1] || '0', 10);
        return numB - numA; 
    });
  }, [sales, customerFilter, statusFilter]);
  
  const handleDelete = (sale: Sale) => {
    deleteSale(sale);
  };

  const handleEditClick = (sale: Sale) => {
    setEditingSale(sale);
    setActiveTab("new");
  };
  
  const handleViewDetails = (sale: Sale) => {
      setSelectedSale(sale);
      setDetailsOpen(true);
  }
  
  const handleFormSuccess = () => {
    setActiveTab("history");
    setEditingSale(null); // Clear editing state
  }

  const handleCancelEdit = () => {
    setActiveTab("history");
    setEditingSale(null);
  }

  const handlePrint = (view: 'invoice' | 'challan' | 'simple', saleId: string) => {
    window.open(`/print/${view}/${saleId}`, '_blank');
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredSales.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredSales.map(s => s.id));
    }
  };

  const handlePrintSelected = () => {
    selectedRows.forEach(id => {
      window.open(`/print/invoice/${id}`, '_blank');
    });
  };

  const handlePrintReport = () => {
    if (selectedRows.length === 0) return;
    const ids = selectedRows.join(',');
    window.open(`/print/sales-report?ids=${ids}`, '_blank');
  };


  return (
    <>
      <PageHeader
        title="Sales"
        description="Record new sales and view sales history."
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Sales History</TabsTrigger>
          <TabsTrigger value="new">{editingSale ? 'Edit Sale' : 'New Sale'}</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
            <div className="flex flex-wrap items-center gap-4 my-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium">Filter By:</h3>
                <div className="flex items-center gap-2">
                    <Label htmlFor="customer-filter" className="text-sm">Customer</Label>
                    <Select onValueChange={(value) => setCustomerFilter(value === "all" ? "" : value)} value={customerFilter}>
                        <SelectTrigger id="customer-filter" className="w-[200px]">
                            <SelectValue placeholder="All Customers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Customers</SelectItem>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="status-filter" className="text-sm">Status</Label>
                    <Select onValueChange={(value: "all" | "draft" | "posted") => setStatusFilter(value)} value={statusFilter}>
                        <SelectTrigger id="status-filter" className="w-[150px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="posted">Posted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {(customerFilter || statusFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={() => { setCustomerFilter(""); setStatusFilter("all"); }}>
                        <X className="mr-2 h-4 w-4" /> Clear Filters
                    </Button>
                )}
            </div>

          <div className="flex items-center gap-2">
              {selectedRows.length > 0 && (
                <>
                  <Button onClick={handlePrintSelected}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Invoices ({selectedRows.length})
                  </Button>
                   <Button variant="outline" onClick={handlePrintReport}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Print Report
                  </Button>
                </>
              )}
          </div>
          <div className="rounded-lg border shadow-sm mt-4 overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[50px]">
                    <Checkbox
                        checked={selectedRows.length === filteredSales.length && filteredSales.length > 0}
                        onCheckedChange={handleSelectAll}
                    />
                </TableHead>
                <TableHead>Sale ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isDataLoading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">Loading sales...</TableCell>
                    </TableRow>
                ) : filteredSales.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">No sales found for the selected filters.</TableCell>
                </TableRow>
                ) : (
                filteredSales.map((sale) => (
                    <TableRow key={sale.id} data-state={selectedRows.includes(sale.id) && "selected"}>
                    <TableCell>
                        <Checkbox
                            checked={selectedRows.includes(sale.id)}
                            onCheckedChange={() => handleSelectRow(sale.id)}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                        <TableCell>
                        <Badge variant={sale.status === 'posted' ? 'default' : 'secondary'}>
                            {sale.status}
                        </Badge>
                        </TableCell>
                    <TableCell className="text-right">
                        {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                               <DropdownMenuItem onSelect={() => handleViewDetails(sale)}>
                                  <FileText className="mr-2 h-4 w-4"/>
                                  View Details
                               </DropdownMenuItem>
                               <DropdownMenuItem onSelect={() => handlePrint('invoice', sale.id)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Invoice
                               </DropdownMenuItem>
                               <DropdownMenuItem onSelect={() => handlePrint('simple', sale.id)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Simple
                               </DropdownMenuItem>
                               <DropdownMenuItem onSelect={() => handlePrint('challan', sale.id)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Challan
                               </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {sale.status === 'draft' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Post to Ledger
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will post the sale to the ledger and create a debit entry for {sale.customerName}. This action can be reversed.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => postSale(sale)}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                               )}
                               {sale.status === 'posted' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Undo className="mr-2 h-4 w-4" />
                                            Unpost from Ledger
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will unpost the sale from the ledger and remove the associated transaction.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => unpostSale(sale)}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                               )}
                              <DropdownMenuItem onSelect={() => handleEditClick(sale)} disabled={sale.status === 'posted'}>
                                  <Edit className="mr-2 h-4 w-4"/>
                                  Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the sale record {sale.id}
                                                {sale.status === 'posted' && " and its corresponding entry from the ledger"}.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(sale)}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="new">
            <div className="mt-4">
                <NewSaleForm 
                    key={editingSale?.id || 'new'}
                    initialData={editingSale} 
                    onSaleAdded={handleFormSuccess}
                    onSaleUpdated={handleFormSuccess}
                    onCancel={handleCancelEdit}
                />
            </div>
        </TabsContent>
      </Tabs>

      {/* Details View Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setDetailsOpen}>
          {selectedSale && <SaleDetailsView sale={selectedSale} />}
      </Dialog>
    </>
  );
}

