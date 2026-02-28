
"use client";

import { useState } from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import type { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useData } from "@/firebase/data/data-provider";

function AddCustomerForm({ onCustomerAdded }: { onCustomerAdded: (newCustomer: Omit<Customer, 'id' | 'createdAt'>) => void }) {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<'debit' | 'credit'>('debit');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!customerName || !phoneNumber || !address) {
      toast({ variant: 'destructive', title: 'Please fill all fields.' });
      return;
    }
    const newCustomer: Omit<Customer, 'id' | 'createdAt'> = {
      customerName,
      phoneNumber,
      address,
      openingBalance,
      balanceType,
    };
    onCustomerAdded(newCustomer);
    toast({ title: 'Customer Added!', description: `${customerName} has been added.` });
    setCustomerName('');
    setPhoneNumber('');
    setAddress('');
    setOpeningBalance(0);
    setBalanceType('debit');
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Add New Customer</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name</Label>
          <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0300-1234567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123, Main Street, City" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input id="openingBalance" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)} placeholder="0" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="balanceType">Balance Type</Label>
                <Select onValueChange={(v: 'debit' | 'credit') => setBalanceType(v)} value={balanceType}>
                    <SelectTrigger id="balanceType">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="debit">Debit (Owed by Customer)</SelectItem>
                        <SelectItem value="credit">Credit (Paid by Customer)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <p className="text-xs text-muted-foreground">
            Opening balance creates an initial transaction. Debit means the customer owes you money. Credit means you owe the customer money (or they paid in advance).
        </p>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>Add Customer</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditCustomerForm({ customer, onCustomerUpdated }: { customer: Customer; onCustomerUpdated: (id: string, updatedCustomer: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void }) {
  const [customerName, setCustomerName] = useState(customer.customerName);
  const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber);
  const [address, setAddress] = useState(customer.address);
  // Opening balance is not directly editable to maintain ledger integrity.
  // It should be adjusted via a ledger transaction.
  const [openingBalance] = useState(customer.openingBalance || 0);
  const [balanceType] = useState(customer.balanceType || 'debit');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!customerName || !phoneNumber || !address) {
      toast({ variant: 'destructive', title: 'Please fill all fields.' });
      return;
    }
    const updatedCustomer: Partial<Omit<Customer, 'id' | 'createdAt'>> = {
      customerName,
      phoneNumber,
      address,
      // Pass the original opening balance values, even though they aren't edited here
      openingBalance,
      balanceType
    };
    onCustomerUpdated(customer.id, updatedCustomer);
    toast({ title: 'Customer Updated!', description: `${customerName} has been updated.` });
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Edit Customer</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name</Label>
          <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0300-1234567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123, Main Street, City" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input id="openingBalance" type="number" value={openingBalance} disabled placeholder="0" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="balanceType">Balance Type</Label>
                <Select value={balanceType} disabled>
                    <SelectTrigger id="balanceType">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="debit">Debit (Owed by Customer)</SelectItem>
                        <SelectItem value="credit">Credit (Paid by Customer)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <p className="text-xs text-muted-foreground">
            Opening balance cannot be edited directly. To correct an opening balance, please reverse the original transaction in the Ledger and create a new one.
        </p>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}


export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleDelete = (id: string) => {
    deleteCustomer(id);
  };

  const handleCustomerAdded = (newCustomer: Omit<Customer, 'id' | 'createdAt'>) => {
    addCustomer(newCustomer);
    setAddModalOpen(false);
  }

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditModalOpen(true);
  };

  const handleCustomerUpdated = (id: string, updatedCustomer: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    updateCustomer(id, updatedCustomer);
    setEditModalOpen(false);
    setEditingCustomer(null);
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage your client information."
      >
        <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </DialogTrigger>
            <AddCustomerForm onCustomerAdded={handleCustomerAdded} />
        </Dialog>
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.customerName}</TableCell>
                <TableCell>{customer.phoneNumber}</TableCell>
                <TableCell>{customer.address}</TableCell>
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
                      <DropdownMenuItem onSelect={() => handleEditClick(customer)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleDelete(customer.id)}
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

       {editingCustomer && (
        <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
          <EditCustomerForm customer={editingCustomer} onCustomerUpdated={handleCustomerUpdated} />
        </Dialog>
      )}
    </>
  );
}
