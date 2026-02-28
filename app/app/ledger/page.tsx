
"use client";

import { useState, useMemo, FormEvent, useEffect } from "react";
import { X, MoreHorizontal, Printer, Edit, Trash2, PlusCircle, Undo2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import type { Transaction, Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useData } from "@/firebase/data/data-provider";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function AddPaymentForm({ onTransactionAdded, onOpenChange }: { onTransactionAdded: (newTransaction: Omit<Transaction, 'id'>) => Promise<void>, onOpenChange: (open: boolean) => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const { customers, customersMap } = useData();
  const { toast } = useToast();
  
  useEffect(() => {
    if (selectedCustomerId) {
        const customer = customersMap.get(selectedCustomerId);
        if (customer) {
            if (type === 'credit') {
                setDescription(`Cash received from ${customer.customerName}`);
            } else {
                 // For debit, clear the description so user can type.
                setDescription('');
            }
        }
    } else {
        setDescription('');
    }
  }, [type, selectedCustomerId, customersMap]);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); 
    if (!description || amount <= 0 || !date) {
      toast({ variant: 'destructive', title: 'Please fill all fields correctly.' });
      return;
    }
    
    const customer = customersMap.get(selectedCustomerId || '');

    const newTransaction: Omit<Transaction, 'id'> = {
      description,
      amount,
      type,
      category: type === 'credit' ? (customer ? 'Customer Payment' : 'Cash Received') : (customer ? 'Customer Debit' : 'Payment'),
      date: new Date(date),
      customerId: selectedCustomerId,
      customerName: customer?.customerName,
    };

    try {
        await onTransactionAdded(newTransaction);
        toast({ title: 'Transaction Added!', description: `A transaction of ${formatCurrency(amount)} has been recorded.` });
        
        setDescription('');
        setAmount(0);
        setDate(new Date().toISOString().split('T')[0]);
        setType('credit');
        setSelectedCustomerId(undefined);
        onOpenChange(false);
    } catch(e) {
        console.error("Failed to add transaction: ", e);
        toast({ variant: 'destructive', title: 'Error', description: "Could not save the transaction." });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Transaction</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Transaction Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select onValueChange={(value: 'credit' | 'debit') => { setType(value); }} value={type}>
              <SelectTrigger id="type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Cash Received (Credit)</SelectItem>
                <SelectItem value="debit">Payment / Debit Note (Debit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
           <div className="space-y-2">
              <Label htmlFor="customer">For Customer (Optional)</Label>
              <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                  <SelectTrigger id="customer">
                      <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder={type === 'debit' ? "e.g. Fine for late payment" : "e.g. Cash from sale"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} placeholder="Amount in PKR"/>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Add Transaction</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}


export default function LedgerPage() {
  const { transactions, customers, vendors, customersMap, vendorsMap, addTransaction, deleteTransaction } = useData();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const { toast } = useToast();

  const handleTransactionAdded = async (newTransaction: Omit<Transaction, 'id'>) => {
    await addTransaction(newTransaction);
  }

  const handleDelete = async (transaction: Transaction) => {
    if (transaction.category === 'Sale' && transaction.description.includes('Invoice:')) {
        toast({
            variant: 'destructive',
            title: 'Action Not Allowed',
            description: 'To delete a sale entry, please "Unpost" the sale from the Sales page. This will automatically remove it from the ledger.',
        });
        return;
    }
    
    if (transaction.category === 'Salary' || transaction.category === 'Opening Balance') {
      toast({
        variant: 'destructive',
        title: 'Deletion Not Allowed',
        description: 'System-generated transactions (like Salaries or Opening Balances) cannot be deleted directly to maintain ledger integrity.',
      });
      return;
    }
    deleteTransaction(transaction.id);
    toast({ title: "Transaction Deleted", description: `The transaction for ${formatCurrency(transaction.amount)} has been removed.` });
  }

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (selectedCustomerId) {
        filtered = transactions.filter(t => t.customerId === selectedCustomerId);
    } else if (selectedVendorId) {
        filtered = transactions.filter(t => t.vendorId === selectedVendorId);
    }

    if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(t => new Date(t.date) >= fromDate);
    }
    if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(t => new Date(t.date) <= toDate);
    }

    return filtered.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, selectedCustomerId, selectedVendorId, dateRange]);
  
  const totalDebit = useMemo(() => filteredTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const totalCredit = useMemo(() => filteredTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);

  let runningBalance = 0;
  const transactionsWithBalance = filteredTransactions.map(t => {
      if (selectedCustomerId) {
        // Customer perspective: debit increases their due, credit decreases it.
        runningBalance += (t.type === 'debit' ? t.amount : -t.amount);
      } else if (selectedVendorId) {
        // Vendor perspective: credit increases what we owe them, debit decreases it.
         runningBalance += (t.type === 'credit' ? t.amount : -t.amount);
      } else {
        // General cash ledger: credit is cash in, debit is cash out.
        runningBalance += (t.type === 'credit' ? t.amount : -t.amount);
      }
      return { ...t, balance: runningBalance };
  });

  const clearFilters = () => {
    setSelectedCustomerId(null);
    setSelectedVendorId(null);
    setDateRange({ from: '', to: '' });
  }

  const hasFilter = selectedCustomerId || selectedVendorId || dateRange.from || dateRange.to;

  return (
    <>
      <PageHeader
        title="Ledger"
        description="A record of all financial transactions."
      >
        <div className="flex items-center gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Transaction
                    </Button>
                </DialogTrigger>
                <AddPaymentForm onTransactionAdded={handleTransactionAdded} onOpenChange={setAddModalOpen} />
            </Dialog>
        </div>
      </PageHeader>

    <div className="printable-area">
      <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg no-print">
        <h3 className="text-sm font-medium">Filters</h3>
        <div className="flex items-center gap-2">
            <Label htmlFor="customer-filter" className="text-sm">Customer</Label>
            <Select onValueChange={(value) => { setSelectedCustomerId(value || null); setSelectedVendorId(null); }} value={selectedCustomerId || ''}>
                <SelectTrigger id="customer-filter" className="w-[200px]"><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="vendor-filter" className="text-sm">Vendor</Label>
            <Select onValueChange={(value) => { setSelectedVendorId(value || null); setSelectedCustomerId(null); }} value={selectedVendorId || ''}>
                <SelectTrigger id="vendor-filter" className="w-[200px]"><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="from-date" className="text-sm">From</Label>
            <Input 
                id="from-date" 
                type="date" 
                className="w-[150px] bg-background" 
                value={dateRange.from} 
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="to-date" className="text-sm">To</Label>
            <Input 
                id="to-date" 
                type="date" 
                className="w-[150px] bg-background" 
                value={dateRange.to} 
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
        </div>
        {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
        )}
      </div>
      
      <div className="hidden print:block text-center my-6">
          <h1 className="text-2xl font-bold font-headline">ARCO Aluminium Company</h1>
          <p className="text-lg font-semibold mt-1">
            {hasFilter ? `Ledger Report for ${selectedCustomerId ? customersMap.get(selectedCustomerId)?.customerName : vendorsMap.get(selectedVendorId || '')?.name}` : 'General Ledger'}
          </p>
          <p className="text-sm text-muted-foreground">As of {formatDate(new Date())}</p>
      </div>

      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="print:w-[15%]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="no-print">Category</TableHead>
              <TableHead className="text-right print:w-[15%]">Debit</TableHead>
              <TableHead className="text-right print:w-[15%]">Credit</TableHead>
              {hasFilter && <TableHead className="text-right print:w-[15%]">Balance</TableHead>}
              <TableHead className="no-print"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={hasFilter ? 7 : 6} className="h-24 text-center">
                        {transactions.length === 0 ? "No transactions yet." : "No transactions for selected filter."}
                    </TableCell>
                </TableRow>
            ) : (
                transactionsWithBalance.map((transaction) => {
                    let description = transaction.description;
                    if (transaction.category === 'Sale' && description.startsWith('Sale to ')) {
                        const match = description.match(/INV-\d+/);
                        if (match && match[0]) {
                            description = `Sale Invoice: ${match[0]}`;
                        }
                    }
                    return (
                        <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell className="font-medium">{description}</TableCell>
                            <TableCell className="no-print">
                                <Badge variant="outline">{transaction.category}</Badge>
                            </TableCell>
                            <TableCell className={cn("text-right font-mono", transaction.type === 'debit' && "font-semibold")}>
                                {transaction.type === 'debit' ? formatNumber(transaction.amount) : '-'}
                            </TableCell>
                            <TableCell className={cn("text-right font-mono", transaction.type === 'credit' && "font-semibold")}>
                                {transaction.type === 'credit' ? formatNumber(transaction.amount) : '-'}
                            </TableCell>
                            {hasFilter && (
                              <TableCell className={cn("text-right font-mono", {
                                  "text-red-500": selectedCustomerId && transaction.balance > 0,
                                  "text-green-600": selectedCustomerId && transaction.balance <= 0,
                                  "text-green-600": selectedVendorId && transaction.balance < 0,
                                  "text-red-500": selectedVendorId && transaction.balance >= 0,
                              })}>
                                  {selectedCustomerId && transaction.balance > 0 ? `-${formatNumber(transaction.balance)}` : formatNumber(selectedCustomerId ? -transaction.balance : transaction.balance)}
                              </TableCell>
                            )}
                            <TableCell className="no-print">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                   <DropdownMenuItem disabled>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => handleDelete(transaction)}
                                    className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                  >
                                      <Trash2 className="mr-2 h-4 w-4"/>
                                      Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })
            )}
          </TableBody>
           <TableFooter>
                <TableRow>
                    <TableCell colSpan={hasFilter ? 2: 1} className="text-right font-bold print:hidden"></TableCell>
                    <TableCell className="text-right font-bold">Totals</TableCell>
                    <TableCell className="text-right font-bold font-mono">{formatNumber(totalDebit)}</TableCell>
                    <TableCell className="text-right font-bold font-mono">{formatNumber(totalCredit)}</TableCell>
                    {hasFilter && <TableCell colSpan={2} className="print:hidden"></TableCell>}
                    <TableCell className="print:hidden"></TableCell>
                </TableRow>
               {hasFilter && transactionsWithBalance.length > 0 && (
                    <TableRow>
                        <TableCell colSpan={hasFilter ? 3 : 2} className="text-right font-bold no-print"></TableCell>
                        <TableCell colSpan={2} className="text-right font-bold print:col-span-3">Final Balance</TableCell>
                        <TableCell className={cn("text-right font-bold font-mono", {
                           "text-red-500": selectedCustomerId && runningBalance > 0,
                           "text-green-600": selectedCustomerId && runningBalance <= 0,
                           "text-green-600": selectedVendorId && runningBalance < 0,
                           "text-red-500": selectedVendorId && runningBalance >= 0,
                        })}>
                             {selectedCustomerId && runningBalance > 0 ? `-${formatNumber(runningBalance)}` : formatNumber(selectedCustomerId ? -runningBalance : runningBalance)}
                        </TableCell>
                         <TableCell className="no-print"></TableCell>
                    </TableRow>
               )}
           </TableFooter>
        </Table>
      </div>
    </div>
    </>
  );
}
