

"use client";

import { useState } from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";
import { useData } from "@/firebase/data/data-provider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AddExpenseForm({ onExpenseAdded }: { onExpenseAdded: (newExpense: Omit<Expense, 'id' | 'date'>) => void }) {
    const { vendors } = useData();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState(0);
    const [category, setCategory] = useState<'Labour' | 'Transport' | 'Electricity' | 'Vendor Payment' | 'Salary' | 'Other'>('Other');
    const [vendorId, setVendorId] = useState<string | undefined>(undefined);
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!title || amount <= 0) {
            toast({ variant: "destructive", title: "Please enter a valid title and amount." });
            return;
        }
         if (category === 'Vendor Payment' && !vendorId) {
            toast({ variant: "destructive", title: "Please select a vendor for this payment." });
            return;
        }
        const newExpense: Omit<Expense, 'id' | 'date'> = {
            title,
            amount,
            category,
            vendorId: category === 'Vendor Payment' ? vendorId : undefined,
        };
        onExpenseAdded(newExpense);
        toast({ title: "Expense Added!", description: `${title} has been recorded.` });
        setTitle(''); setAmount(0); setCategory('Other'); setVendorId(undefined);
    };
    
    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Factory Rent" />
                </div>
                <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(v: any) => setCategory(v)} value={category}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Labour">Labour</SelectItem>
                            <SelectItem value="Transport">Transport</SelectItem>
                            <SelectItem value="Electricity">Electricity</SelectItem>
                            <SelectItem value="Vendor Payment">Vendor Payment</SelectItem>
                            <SelectItem value="Salary">Salary</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {category === 'Vendor Payment' && (
                     <div className="space-y-2">
                        <Label>Vendor</Label>
                        <Select onValueChange={setVendorId} value={vendorId}>
                            <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit}>Add Expense</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useData();
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);

  const handleDelete = (expense: Expense) => {
    deleteExpense(expense);
  };
  
  const handleExpenseAdded = (newExpense: Omit<Expense, 'id' | 'date'>) => {
    addExpense(newExpense);
    setExpenseModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track all your factory and operational expenses."
      >
        <Dialog open={isExpenseModalOpen} onOpenChange={setExpenseModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
        </Dialog>
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{expense.category}</Badge>
                </TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(expense.amount)}
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
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleDelete(expense)}
                        className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
