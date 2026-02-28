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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { formatCurrency } from "@/lib/utils";
import type { Item } from "@/lib/types";
import { useData } from "@/firebase/data/data-provider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function AddItemForm({ onItemAdded, existingItems }: { onItemAdded: (newItem: Omit<Item, 'id' | 'createdAt'>) => void; existingItems: Item[] }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'Aluminium' | 'Glass' | 'Accessories'>('Aluminium');
    const [unit, setUnit] = useState<'Kg' | 'Feet' | 'Piece'>('Feet');
    const [quantity, setQuantity] = useState(0);
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [salePrice, setSalePrice] = useState(0);
    const [color, setColor] = useState('');
    const [weight, setWeight] = useState(0);
    const [thickness, setThickness] = useState('');
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!name || !category || !unit || !color || !thickness) {
            toast({ variant: "destructive", title: "Please fill all required fields." });
            return;
        }

        // Check for duplicates based on name AND thickness
        const isDuplicate = existingItems.some(item => 
            item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
            item.thickness.trim().toLowerCase() === thickness.trim().toLowerCase()
        );

        if (isDuplicate) {
            toast({ variant: "destructive", title: "Duplicate Item", description: `An item with the name "${name}" and thickness "${thickness}" already exists.` });
            return;
        }

        const newItem: Omit<Item, 'id' | 'createdAt'> = {
            name, category, unit, quantity, purchasePrice, salePrice, color, weight, thickness,
        };
        onItemAdded(newItem);
        toast({ title: "Item Added!", description: `${name} (${thickness}) has been added to inventory.` });
        // Reset form
        setName(''); setCategory('Aluminium'); setUnit('Feet'); setQuantity(0); setPurchasePrice(0); setSalePrice(0); setColor(''); setWeight(0); setThickness('');
    };

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Add New Item</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. D 40" />
                </div>
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(v: any) => setCategory(v)} value={category}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Aluminium">Aluminium</SelectItem>
                            <SelectItem value="Glass">Glass</SelectItem>
                            <SelectItem value="Accessories">Accessories</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Unit</Label>
                     <Select onValueChange={(v: any) => setUnit(v)} value={unit}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Feet">Feet</SelectItem>
                            <SelectItem value="Kg">Kg</SelectItem>
                             <SelectItem value="Piece">Piece</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Opening Stock</Label>
                    <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Purchase Rate</Label>
                    <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Default Sale Rate</Label>
                    <Input type="number" value={salePrice} onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)} />
                </div>
                 <div className="space-y-2">
                    <Label>Color</Label>
                    <Input 
                        placeholder="e.g. White, Black, Bronze" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Weight (kg/ft)</Label>
                    <Input type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Thickness</Label>
                    <Input value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="e.g. 1.2mm" />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit}>Add Item</Button>
            </DialogFooter>
        </DialogContent>
    );
}

function EditItemForm({ item, onItemUpdated, onOpenChange }: { item: Item; onItemUpdated: (id: string, updatedItem: Partial<Omit<Item, 'id' | 'createdAt'>>) => void; onOpenChange: (open: boolean) => void; }) {
    const [name, setName] = useState(item.name);
    const [category, setCategory] = useState(item.category);
    const [unit, setUnit] = useState(item.unit);
    const [quantity, setQuantity] = useState(item.quantity);
    const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice);
    const [salePrice, setSalePrice] = useState(item.salePrice);
    const [color, setColor] = useState(item.color);
    const [weight, setWeight] = useState(item.weight || 0);
    const [thickness, setThickness] = useState(item.thickness);
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!name || !category || !unit || !color || !thickness) {
            toast({ variant: "destructive", title: "Please fill all required fields." });
            return;
        }

        const updatedItem: Partial<Omit<Item, 'id' | 'createdAt'>> = {
            name, category, unit, quantity, purchasePrice, salePrice, color, weight, thickness,
        };

        onItemUpdated(item.id, updatedItem);
        toast({ title: "Item Updated!", description: `${name} (${thickness}) has been updated.` });
        onOpenChange(false);
    };

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Edit Item: {item.name}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. D 40" />
                </div>
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(v: any) => setCategory(v)} value={category}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Aluminium">Aluminium</SelectItem>
                            <SelectItem value="Glass">Glass</SelectItem>
                            <SelectItem value="Accessories">Accessories</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Unit</Label>
                     <Select onValueChange={(v: any) => setUnit(v)} value={unit}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Feet">Feet</SelectItem>
                            <SelectItem value="Kg">Kg</SelectItem>
                             <SelectItem value="Piece">Piece</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Purchase Rate</Label>
                    <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Default Sale Rate</Label>
                    <Input type="number" value={salePrice} onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)} />
                </div>
                 <div className="space-y-2">
                    <Label>Color</Label>
                    <Input 
                        placeholder="e.g. White, Black, Bronze" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Weight (kg/ft)</Label>
                    <Input type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                    <Label>Thickness</Label>
                    <Input value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="e.g. 1.2mm" />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function InventoryPage() {
  const { items, addItem, deleteItem, updateItem } = useData();
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [thicknessFilter, setThicknessFilter] = useState<string>("");

  const handleDelete = (id: string) => {
    deleteItem(id);
  };
  
  const handleItemAdded = (newItem: Omit<Item, 'id' | 'createdAt'>) => {
    addItem(newItem);
    setItemModalOpen(false);
  }

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleItemUpdated = (id: string, updatedItem: Partial<Omit<Item, 'id'|'createdAt'>>) => {
    updateItem(id, updatedItem);
    setEditModalOpen(false);
    setEditingItem(null);
  };

  const categoryVariant = {
    "Aluminium": "default",
    "Glass": "secondary",
    "Accessories": "outline",
  } as const;

  const uniqueThicknesses = [...new Set(items.map(item => item.thickness).filter(Boolean))].sort();

  const filteredItems = items.filter(item => 
    !thicknessFilter || item.thickness === thicknessFilter
  );

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Manage your stock of materials and accessories."
      >
        <Dialog open={isItemModalOpen} onOpenChange={setItemModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </DialogTrigger>
            <AddItemForm onItemAdded={handleItemAdded} existingItems={items} />
        </Dialog>
      </PageHeader>

       <div className="flex items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-medium">Filter by Thickness:</h3>
        <Select onValueChange={(value) => setThicknessFilter(value === "all" ? "" : value)} value={thicknessFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Thicknesses" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Thicknesses</SelectItem>
                {uniqueThicknesses.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>


      <div className="rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Thickness</TableHead>
              <TableHead className="text-right">Default Sale Rate</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={categoryVariant[item.category] || 'default'}>
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.color}
                </TableCell>
                <TableCell>
                  {item.thickness}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.salePrice)}
                </TableCell>
                <TableCell className="text-right">
                  {item.quantity} {item.unit}
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
                        <DropdownMenuItem onSelect={() => handleEditClick(item)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => handleDelete(item.id)}
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

      {editingItem && (
        <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
          <EditItemForm 
            item={editingItem} 
            onItemUpdated={handleItemUpdated}
            onOpenChange={setEditModalOpen}
          />
        </Dialog>
      )}
    </>
  );
}