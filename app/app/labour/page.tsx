

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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import type { Labour } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useData } from "@/firebase/data/data-provider";
import { formatCurrency } from "@/lib/utils";

function AddLabourForm({ onLabourAdded, onLabourUpdated, existingLabourer }: { onLabourAdded: (newLabourer: Omit<Labour, 'id' | 'createdAt'>) => void, onLabourUpdated: (id: string, updatedLabourer: Partial<Omit<Labour, 'id' | 'createdAt'>>) => void, existingLabourer?: Labour | null }) {
  const [name, setName] = useState(existingLabourer?.name || '');
  const [phone, setPhone] = useState(existingLabourer?.phone || '');
  const [address, setAddress] = useState(existingLabourer?.address || '');
  const [monthlySalary, setMonthlySalary] = useState(existingLabourer?.monthlySalary || 0);
  const { toast } = useToast();
  
  const isEditMode = !!existingLabourer;

  const handleSubmit = () => {
    if (!name || monthlySalary <= 0) {
      toast({ variant: 'destructive', title: 'Please fill name and monthly salary.' });
      return;
    }
    
    const labourerData: Omit<Labour, 'id' | 'createdAt'> = {
      name,
      phone,
      address,
      monthlySalary,
    };

    if (isEditMode) {
        onLabourUpdated(existingLabourer.id, labourerData);
        toast({ title: 'Labourer Updated!', description: `${name} has been updated.` });
    } else {
        onLabourAdded(labourerData);
        toast({ title: 'Labourer Added!', description: `${name} has been added.` });
        setName('');
        setPhone('');
        setAddress('');
        setMonthlySalary(0);
    }
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Labourer' : 'Add New Labourer'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Labourer Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300-1234567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123, Main Street, City" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlySalary">Monthly Salary (PKR)</Label>
          <Input id="monthlySalary" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || 0)} placeholder="e.g. 30000" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Add Labourer'}</Button>
      </DialogFooter>
    </DialogContent>
  );
}


export default function LabourPage() {
  const { labourers, addLabour, updateLabour, deleteLabour } = useData();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLabourer, setEditingLabourer] = useState<Labour | null>(null);

  const handleOpenModal = (labourer: Labour | null = null) => {
    setEditingLabourer(labourer);
    setModalOpen(true);
  }

  const handleDelete = (id: string) => {
    deleteLabour(id);
  };

  const handleLabourAdded = async (newLabourer: Omit<Labour, 'id' | 'createdAt'>) => {
    await addLabour(newLabourer);
    setModalOpen(false);
  }
  
  const handleLabourUpdated = (id: string, updatedLabourer: Partial<Omit<Labour, 'id'|'createdAt'>>) => {
    updateLabour(id, updatedLabourer);
    setModalOpen(false);
    setEditingLabourer(null);
  }


  return (
    <>
      <PageHeader
        title="Labour Management"
        description="Manage your workforce information."
      >
        <div className="flex items-center gap-2 no-print">
            <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Labourer
                    </Button>
                </DialogTrigger>
                <AddLabourForm 
                    onLabourAdded={handleLabourAdded} 
                    onLabourUpdated={handleLabourUpdated}
                    existingLabourer={editingLabourer} 
                />
            </Dialog>
        </div>
      </PageHeader>
      <div className="rounded-lg border shadow-sm printable-area">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Labourer Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead className="no-print">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labourers.map((labourer) => (
              <TableRow key={labourer.id}>
                <TableCell className="font-medium">{labourer.name}</TableCell>
                <TableCell>{labourer.phone}</TableCell>
                <TableCell>{formatCurrency(labourer.monthlySalary)}</TableCell>
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
                      <DropdownMenuItem onSelect={() => handleOpenModal(labourer)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleDelete(labourer.id)}
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

    
