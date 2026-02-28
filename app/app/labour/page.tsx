
"use client";

import { useState } from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function LabourForm({ onFormSubmit, existingLabourer }: { onFormSubmit: (data: Omit<Labour, 'id' | 'createdAt'>, id?: string) => void, existingLabourer?: Labour | null }) {
  const [name, setName] = useState(existingLabourer?.name || '');
  const [phone, setPhone] = useState(existingLabourer?.phone || '');
  const [address, setAddress] = useState(existingLabourer?.address || '');
  const [monthlySalary, setMonthlySalary] = useState(existingLabourer?.monthlySalary || 0);
  const { toast } = useToast();
  
  const isEditMode = !!existingLabourer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        onFormSubmit(labourerData, existingLabourer.id);
    } else {
        onFormSubmit(labourerData);
        setName('');
        setPhone('');
        setAddress('');
        setMonthlySalary(0);
    }
  };

  return (
    <DialogContent className="max-w-xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Labourer' : 'Add New Labourer'}</CardTitle>
          <CardDescription>Fill in the details below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter>
          <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Labourer'}</Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
}


export default function LabourPage() {
  const { labourers, addLabour, updateLabour, deleteLabour } = useData();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLabourer, setEditingLabourer] = useState<Labour | null>(null);
  const { toast } = useToast();

  const handleOpenModal = (labourer: Labour | null = null) => {
    setEditingLabourer(labourer);
    setModalOpen(true);
  }

  const handleDelete = (id: string) => {
    deleteLabour(id);
    toast({ title: 'Labourer Deleted!' });
  };

  const handleFormSubmit = async (data: Omit<Labour, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
        await updateLabour(id, data);
        toast({ title: 'Labourer Updated!', description: `${data.name} has been updated.` });
    } else {
        await addLabour(data);
        toast({ title: 'Labourer Added!', description: `${data.name} has been added.` });
    }
    setModalOpen(false);
    setEditingLabourer(null);
  }

  return (
    <>
      <PageHeader
        title="Labour Management"
        description="Manage your workforce information."
      >
          <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Labourer
          </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>All Labourers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Labourer Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Monthly Salary</TableHead>
                <TableHead>
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
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
          <LabourForm 
              key={editingLabourer?.id || 'new'} // Re-mount form on new/edit
              onFormSubmit={handleFormSubmit} 
              existingLabourer={editingLabourer} 
          />
      </Dialog>
    </>
  );
}
