
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
import type { Vendor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useData } from "@/firebase/data/data-provider";

function AddVendorForm({ onVendorAdded }: { onVendorAdded: (newVendor: Omit<Vendor, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<'credit' | 'debit'>('credit');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'Please fill vendor name.' });
      return;
    }
    const newVendor: Omit<Vendor, 'id' | 'createdAt'> = {
      name,
      phone,
      address,
      openingBalance,
      balanceType,
    };
    onVendorAdded(newVendor);
    toast({ title: 'Vendor Added!', description: `${name} has been added.` });
    setName('');
    setPhone('');
    setAddress('');
    setOpeningBalance(0);
    setBalanceType('credit');
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Add New Vendor</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Vendor Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ali Supplies" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300-1234567" />
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
                        <SelectItem value="credit">Credit (You Owe Vendor)</SelectItem>
                        <SelectItem value="debit">Debit (Vendor Owes You)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <p className="text-xs text-muted-foreground">
            Opening balance creates an initial transaction. Credit means you owe the vendor money. Debit means the vendor owes you money (or you paid an advance).
        </p>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>Add Vendor</Button>
      </DialogFooter>
    </DialogContent>
  );
}


export default function VendorsPage() {
  const { vendors, addVendor, deleteVendor } = useData();
  const [isVendorModalOpen, setVendorModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    deleteVendor(id);
  };

  const handleVendorAdded = (newVendor: Omit<Vendor, 'id' | 'createdAt'>) => {
    addVendor(newVendor);
    setVendorModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Manage your supplier information."
      >
        <Dialog open={isVendorModalOpen} onOpenChange={setVendorModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Vendor
                </Button>
            </DialogTrigger>
            <AddVendorForm onVendorAdded={handleVendorAdded} />
        </Dialog>
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{vendor.address}</TableCell>
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
                        onSelect={() => handleDelete(vendor.id)}
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
