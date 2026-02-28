
"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusCircle, X, MoreHorizontal, Printer } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import type { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useData } from "@/firebase/data/data-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";


function AddTransactionForm({ onTransactionAdded }: { onTransactionAdded: (newTransaction: Omit<Transaction, 'id' | 'date'>) => void }) {
  const { customers, vendors } = useData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [category, setCategory] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (type === 'credit' && customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setDescription(`Cash received from ${customer.customerName}`);
            setCategory('Customer Payment');
        }
    } else if (type === 'debit' && vendorId) {
        const vendor = vendors.find(v => v.id === vendorId);
        if(vendor) {
            setDescription(`Payment to ${vendor.name}`);
            setCategory('Vendor Payment');
        }
    } else {
        setDescription('');
        setCategory('');
        setCustomerId(undefined);
        setVendorId(undefined);
    }
  }, [type, customerId, vendorId, customers, vendors]);

  const handleSubmit = () => {
    if (!description || amount <= 0) {
      toast({ variant: 'destructive', title: 'Please fill all fields.' });
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    const vendor = vendors.find(v => v.id === vendorId);

    const newTransaction: Omit<Transaction, 'id' | 'date'> = {
      description,
      amount,
      type,
      category: category || (type === 'credit' ? 'Cash Received' : 'Payment'),
      customerId: customerId,
      customerName: customer?.customerName,
      vendorId: vendorId,
      vendorName: vendor?.name,
    };
    onTransactionAdded(newTransaction);
    toast({ title: 'Transaction Added!', description: `A transaction of ${formatCurrency(amount)} has been recorded.` });
    setDescription('');
    setAmount(0);
    setCategory('');
    setCustomerId(undefined);
    setVendorId(undefined);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Voucher</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select onValueChange={(v: any) => setType(v)} value={type}>
                <SelectTrigger id="type">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="credit">Cash Received (Credit)</SelectItem>
                    <SelectItem value="debit">Payment (Debit)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {type === 'credit' && (
            <div className="space-y-2">
                <Label htmlFor="customer">From Customer</Label>
                <Select onValueChange={setCustomerId} value={customerId}>
                    <SelectTrigger id="customer">
                        <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        )}
        
        {type === 'debit' && (
            <div className="space-y-2">
                <Label htmlFor="vendor">To Vendor</Label>
                <Select onValueChange={setVendorId} value={vendorId}>
                    <SelectTrigger id="vendor">
                        <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                        {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder={type === 'debit' ? "Payment for supplies" : "Cash from customer"}
            disabled={ (type === 'credit' && !!customerId) || (type === 'debit' && !!vendorId) }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} placeholder="Amount in PKR"/>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>Add Transaction</Button>
      </DialogFooter>
    </DialogContent>
  );
}


export default function LedgerPage() {
  const { transactions, addTransaction, deleteTransaction, customers, vendors } = useData();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTransactionAdded = (newTransaction: Omit<Transaction, 'id' | 'date'>) => {
    addTransaction(newTransaction);
    setModalOpen(false);
  }

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({ title: "Transaction Deleted" });
  }

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (selectedCustomerId) {
        filtered = transactions.filter(t => t.customerId === selectedCustomerId);
    } else if (selectedVendorId) { // Use else if to make filters mutually exclusive
        filtered = transactions.filter(t => t.vendorId === selectedVendorId);
    }
    // Correct sorting: oldest to newest for chronological order
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, selectedCustomerId, selectedVendorId]);

  let runningBalance = 0;
  const transactionsWithBalance = filteredTransactions.map(t => {
      // For debits in customer ledger, balance increases. For credits, it decreases.
      // For debits in vendor ledger, our liability decreases. For credits (purchases), it increases.
      // This seems complex. Let's simplify the view logic.
      // General Ledger: Credit increases balance, Debit decreases.
      // Customer Ledger: Debit is a Sale (increases what they owe you). Credit is a Payment (decreases what they owe you).
      // Vendor Ledger: Credit is a Purchase from them (increases what you owe them). Debit is a Payment to them (decreases what you owe them).
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
  }

  const hasFilter = selectedCustomerId || selectedVendorId;

  return (
    <>
      <PageHeader
        title="Ledger"
        description="A record of all financial transactions."
      >
        <div className="flex items-center gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print Page
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Voucher
                    </Button>
                </DialogTrigger>
                <AddTransactionForm onTransactionAdded={handleTransactionAdded} />
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
        {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" /> Clear Filter
            </Button>
        )}
      </div>

      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              {hasFilter && <TableHead className="text-right">Balance</TableHead>}
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
                transactionsWithBalance.map((transaction) => (
                <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-mono", transaction.type === 'debit' && "font-semibold")}>
                        {transaction.type === 'debit' ? formatCurrency(transaction.amount) : '-'}
                    </TableCell>
                    <TableCell className={cn("text-right font-mono", transaction.type === 'credit' && "font-semibold")}>
                        {transaction.type === 'credit' ? formatCurrency(transaction.amount) : '-'}
                    </TableCell>
                    {hasFilter && <TableCell className="text-right font-mono">{formatCurrency(transaction.balance)}</TableCell>}
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
                          <DropdownMenuItem
                            onSelect={() => handleDelete(transaction.id)}
                            className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                            disabled={transaction.category === 'Sale'} // Prevent deleting sale-linked transactions from here
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
           {hasFilter && transactionsWithBalance.length > 0 && (
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={5} className="text-right font-bold">Final Balance</TableCell>
                        <TableCell className={cn("text-right font-bold font-mono", runningBalance >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(runningBalance)}
                        </TableCell>
                         <TableCell className="no-print"></TableCell>
                    </TableRow>
                </TableFooter>
           )}
        </Table>
      </div>
    </div>
    </>
  );
}
