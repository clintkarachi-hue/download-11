"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Trash2, RotateCcw, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency, cn } from "@/lib/utils";
import type { Sale, SaleItem, Customer, Item } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/firebase/data/data-provider";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";

function AddCustomerForm({ onCustomerAdded, onOpenChange }: { onCustomerAdded: (newCustomer: Omit<Customer, 'id' | 'createdAt'>) => void, onOpenChange: (open: boolean) => void }) {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [balanceType, setBalanceType] = useState<'debit' | 'credit'>('debit');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phoneNumber || !address) {
      toast({ variant: 'destructive', title: 'Please fill all fields.' });
      return;
    }
    const newCustomer: Omit<Customer, 'id' | 'createdAt'> = {
      customerName,
      phoneNumber,
      address,
      openingBalance,
      balanceType
    };
    await onCustomerAdded(newCustomer);
    toast({ title: 'Customer Added!', description: `${customerName} has been added.` });
    onOpenChange(false);
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Add New Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter>
          <Button type="submit">Add Customer</Button>
        </CardFooter>
      </form>
    </DialogContent>
  );
}


export function NewSaleForm({ initialData, onSaleAdded, onSaleUpdated, onCancel }: { 
    initialData?: Sale | null; 
    onSaleAdded: () => void;
    onSaleUpdated: () => void;
    onCancel: () => void;
}) {
    const { toast } = useToast();
    const { customers, items: allItems, itemsMap, customersMap, addCustomer, addSale, updateSale, rateListNames } = useData();
    
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedRateList, setSelectedRateList] = useState("default");
    const [saleItems, setSaleItems] = useState<Partial<SaleItem>[]>([{itemId: "", quantity: 1, feet: 1, discount: 0, color: '', thickness: '', price: 0 }]);
    const [overallDiscount, setOverallDiscount] = useState(0);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
    const [description, setDescription] = useState("");
    const [showT1T2, setShowT1T2] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setSelectedCustomer(initialData.customerId);
            setSaleItems(initialData.items.map(item => ({ ...item })));
            setOverallDiscount(initialData.discount || 0);
            setSaleDate(new Date(initialData.date));
            setDescription(initialData.description || "");
            setShowT1T2(initialData.showT1T2 || false);
            setSelectedRateList(initialData.rateListName || "default");
        } else {
            clearForm();
        }
    }, [initialData]);

    useEffect(() => {
        // When rate list changes, update prices for all items in the form
        setSaleItems(currentItems => currentItems.map(si => {
            if (!si.itemId) return si;
            const itemDetails = itemsMap.get(si.itemId);
            if (!itemDetails) return si;

            const newPrice = selectedRateList === 'default'
                ? itemDetails.salePrice
                : itemDetails.salePrices?.[selectedRateList] || itemDetails.salePrice;
            
            return { ...si, price: newPrice };
        }));
    }, [selectedRateList, itemsMap]);

    const handleAddItem = () => {
        setSaleItems([...saleItems, {itemId: "", quantity: 1, feet: 1, discount: 0, color: '', thickness: '', price: 0 }]);
    }

    const handleRemoveItem = (index: number) => {
        setSaleItems(saleItems.filter((_, i) => i !== index));
    }

    const handleItemChange = (index: number, key: keyof SaleItem, value: any) => {
        const newItems = [...saleItems];
        const currentItem = { ...newItems[index] };
        (currentItem as any)[key] = value;
        
        if (key === 'itemId') {
            const itemDetails = itemsMap.get(value);
            if (itemDetails) {
                currentItem.color = itemDetails.color;
                currentItem.thickness = itemDetails.thickness;
                // Set the price based on the currently selected rate list
                currentItem.price = selectedRateList === 'default'
                    ? itemDetails.salePrice
                    : itemDetails.salePrices?.[selectedRateList] || itemDetails.salePrice;
            }
        }

        newItems[index] = currentItem;
        setSaleItems(newItems);
    }

    const calculateTotal = () => {
        const subtotal = saleItems.reduce((total, currentItem) => {
            if (!currentItem.itemId || currentItem.price === undefined) return total;
            
            const itemDetails = itemsMap.get(currentItem.itemId);
            if (!itemDetails) return total;

            let feet = currentItem.feet || 1;
            if (itemDetails.category !== 'Aluminium') {
                feet = 1;
            }
            
            const itemTotal = feet * currentItem.price * (currentItem.quantity || 1);
            const discountAmount = itemTotal * ((currentItem.discount || 0) / 100);
            
            return total + (itemTotal - discountAmount);
        }, 0);
        
        const overallDiscountAmount = (subtotal * overallDiscount) / 100;
        return subtotal - overallDiscountAmount;
    }

    const clearForm = () => {
        setSelectedCustomer("");
        setSaleItems([{itemId: "", quantity: 1, feet: 1, discount: 0, color: '', thickness: '', price: 0}]);
        setOverallDiscount(0);
        setSaleDate(new Date());
        setDescription("");
        setShowT1T2(false);
        setSelectedRateList("default");
    }
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        if (!selectedCustomer) {
            toast({ variant: "destructive", title: "Please select a customer." });
            return;
        }
        if (!saleDate) {
            toast({ variant: "destructive", title: "Please select a sale date." });
            return;
        }
        if (saleItems.some(item => !item.itemId || (item.quantity || 0) <= 0)) {
            toast({ variant: "destructive", title: "Please fill all item details correctly." });
            return;
        }

        setIsSaving(true);

        const customer = customersMap.get(selectedCustomer);
        if (!customer) {
            setIsSaving(false);
            return;
        }

        const finalSaleItems = saleItems.map(si => {
            const item = itemsMap.get(si.itemId!)!;
            
            let feet = si.feet || 1;
            if (item.category !== 'Aluminium') {
                feet = 1;
            }
            
            return {
                itemId: item.id,
                itemName: item.name,
                quantity: si.quantity || 1,
                price: si.price!, // Use the price from the state, which is based on the rate list
                color: si.color || item.color,
                weight: item.weight,
                thickness: si.thickness || '',
                feet: feet,
                discount: si.discount || 0,
            }
        }) as SaleItem[];

        const saleData: Omit<Sale, 'id' | 'total' | 'status'> = {
            customerId: selectedCustomer,
            customerName: customer.customerName,
            items: finalSaleItems,
            discount: overallDiscount,
            date: saleDate,
            description: description,
            showT1T2: showT1T2,
            rateListName: selectedRateList,
        };
        
        try {
            if (isEditMode && initialData) {
                await updateSale(initialData.id, saleData);
                toast({ title: "Sale Updated!", description: `Sale ${initialData.id} has been updated.` });
                onSaleUpdated();
            } else {
                await addSale(saleData);
                toast({ title: "Sale Draft Saved!", description: `Sale has been saved as a draft.` });
                onSaleAdded();
            }
            clearForm();
        } catch (error) {
            console.error("Failed to save sale:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save the sale." });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleCustomerAdded = async (newCustomer: Omit<Customer, 'id'| 'createdAt'>) => {
        const addedCustomer = await addCustomer(newCustomer);
        if (addedCustomer?.id) {
            setSelectedCustomer(addedCustomer.id);
        }
    }
    
    const itemOptions = allItems.map(item => ({
        value: item.id,
        label: `${item.name} ${item.thickness ? `(${item.thickness})` : ''} - ${item.color}`
    }));

    return (
        <form onSubmit={handleSave}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{isEditMode ? `Edit Sale ${initialData?.id}` : 'Create New Sale'}</CardTitle>
                        <CardDescription>Fill in the details below to create a new sale.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={clearForm}>
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Clear Form</span>
                        </Button>
                        {isEditMode && <Button type="button" variant="outline" onClick={onCancel}>Cancel Edit</Button>}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="customer">Customer</Label>
                                    <div className="flex gap-2">
                                    <Select onValueChange={setSelectedCustomer} value={selectedCustomer}>
                                        <SelectTrigger id="customer">
                                            <SelectValue placeholder="Select a customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={isCustomerModalOpen} onOpenChange={setCustomerModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <AddCustomerForm onCustomerAdded={handleCustomerAdded} onOpenChange={setCustomerModalOpen} />
                                    </Dialog>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Sale Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !saleDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={saleDate}
                                                onSelect={setSaleDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="description">Sale Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Add any notes or description for this sale. This will be visible on the invoice."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[60px]"
                                />
                            </div>
                        </div>
                        <Card className="bg-muted/50">
                            <CardContent className="p-4 grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rate-list">Select Rate List</Label>
                                        <Select onValueChange={setSelectedRateList} value={selectedRateList}>
                                            <SelectTrigger id="rate-list">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Default</SelectItem>
                                                {rateListNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="discount">Overall Discount (%)</Label>
                                        <Input 
                                            id="discount"
                                            type="number"
                                            placeholder="e.g. 5"
                                            value={overallDiscount}
                                            onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="t1t2-checkbox" checked={showT1T2} onCheckedChange={(checked) => setShowT1T2(Boolean(checked))} />
                                    <label
                                        htmlFor="t1t2-checkbox"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Show T1/T2 Totals on Invoice
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Items</h3>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>
                        {saleItems.map((saleItem, index) => {
                            const itemDetails = itemsMap.get(saleItem.itemId || "");
                            return (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/20">
                                <div className="md:col-span-4 space-y-2">
                                    <Label>Item</Label>
                                    <Combobox
                                        options={itemOptions}
                                        value={saleItem.itemId}
                                        onValueChange={(value) => handleItemChange(index, "itemId", value)}
                                        placeholder="Search for an item..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Colour</Label>
                                    <Input 
                                        placeholder="Color" 
                                        value={saleItem.color}
                                        onChange={(e) => handleItemChange(index, "color", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Thickness</Label>
                                    <Input 
                                        placeholder="Thick" 
                                        value={saleItem.thickness}
                                        onChange={(e) => handleItemChange(index, "thickness", e.target.value)}
                                    />
                                </div>
                                {itemDetails?.category === "Aluminium" ? (
                                    <div className="space-y-2">
                                        <Label>Feet</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g. 12.5" 
                                            value={saleItem.feet}
                                            onChange={(e) => handleItemChange(index, "feet", parseFloat(e.target.value))}
                                        />
                                    </div>
                                ) : <div/> }
                                <div className="space-y-2">
                                    <Label>Qty</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="Qty" 
                                        value={saleItem.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Tab' && !e.shiftKey && index === saleItems.length - 1) {
                                                handleAddItem();
                                            }
                                        }}
                                        min="1"
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Price</Label>
                                    <Input 
                                        type="number"
                                        readOnly
                                        className="font-semibold"
                                        value={saleItem.price?.toFixed(2) || '0.00'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Discount</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="%" 
                                        value={saleItem.discount}
                                        onChange={(e) => handleItemChange(index, "discount", parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2 text-right">
                                    <Label>Total</Label>
                                    <p className="font-semibold h-10 flex items-center justify-end pr-2">
                                        {formatCurrency(((saleItem.feet || 1) * (saleItem.price || 0) * (saleItem.quantity || 1)) * (1 - ((saleItem.discount || 0) / 100)))}
                                    </p>
                                </div>
                                <div className="flex items-end h-10">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={saleItems.length === 1}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                            )
                        })}
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/50 p-4 rounded-b-lg mt-6">
                    <div className="text-xl font-bold">
                        Total: {formatCurrency(calculateTotal())}
                    </div>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : (isEditMode ? 'Update Sale' : 'Save Draft')}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
