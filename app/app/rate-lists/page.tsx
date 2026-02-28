
"use client";

import { useState, useMemo } from "react";
import { Save, PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/firebase/data/data-provider";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function RateListsPage() {
  const { items, rateListNames, batchUpdateRates } = useData();
  const { toast } = useToast();

  const [selectedRateList, setSelectedRateList] = useState<string>("");
  const [newRateListName, setNewRateListName] = useState<string>("");
  const [editedRates, setEditedRates] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isNewListDialogOpen, setIsNewListDialogOpen] = useState(false);

  const handleRateChange = (itemId: string, newRate: string) => {
    const rate = parseFloat(newRate);
    setEditedRates(prev => ({
      ...prev,
      [itemId]: isNaN(rate) ? 0 : rate,
    }));
  };

  const handleCreateNewList = () => {
      if (!newRateListName.trim()) {
          toast({ variant: "destructive", title: "Please enter a name for the new rate list." });
          return;
      }
      if (rateListNames.includes(newRateListName.trim())) {
          toast({ variant: "destructive", title: "A rate list with this name already exists." });
          return;
      }
      setSelectedRateList(newRateListName.trim());
      setNewRateListName("");
      setEditedRates({});
      setIsNewListDialogOpen(false);
      toast({ title: "New List Created", description: `You are now editing the "${newRateListName.trim()}" rate list.`});
  }

  const handleSaveChanges = async () => {
    if (!selectedRateList) {
      toast({ variant: "destructive", title: "No rate list selected." });
      return;
    }
    if (Object.keys(editedRates).length === 0) {
      toast({ description: "No changes to save." });
      return;
    }

    setIsSaving(true);
    const updates = Object.entries(editedRates).map(([id, salePrice]) => ({
      id,
      salePrice,
      rateListName: selectedRateList,
    }));

    try {
      await batchUpdateRates(updates);
      toast({ title: "Success!", description: `Rates for "${selectedRateList}" have been updated.` });
      setEditedRates({}); // Clear changes after saving
    } catch (error) {
      console.error("Failed to save rates:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save the new rates." });
    } finally {
      setIsSaving(false);
    }
  };

  const currentItems = useMemo(() => {
    return items.sort((a,b) => a.name.localeCompare(b.name));
  }, [items]);

  return (
    <>
      <PageHeader
        title="Manage Rate Lists"
        description="Create and edit custom price lists for your items."
      >
        {selectedRateList && (
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : `Save Changes to "${selectedRateList}"`}
            </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <CardTitle>Select a Rate List</CardTitle>
                    <CardDescription>Choose a list to view or edit its prices.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => { setSelectedRateList(value); setEditedRates({})}} value={selectedRateList}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select a list..." />
                        </SelectTrigger>
                        <SelectContent>
                            {rateListNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Dialog open={isNewListDialogOpen} onOpenChange={setIsNewListDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New List
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Rate List</DialogTitle>
                                <DialogDescription>
                                    Enter a name for your new rate list. This name will appear in the sales and estimates forms.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                                <Label htmlFor="new-list-name">Rate List Name</Label>
                                <Input 
                                    id="new-list-name" 
                                    value={newRateListName}
                                    onChange={(e) => setNewRateListName(e.target.value)}
                                    placeholder="e.g. Eid Offer 2024"
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateNewList}>Create and Edit</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Thickness</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead className="text-right">Default Rate</TableHead>
                            <TableHead className="w-[200px] text-right">
                                {selectedRateList ? `Rate for "${selectedRateList}"` : 'Custom Rate'}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!selectedRateList ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    Please select or create a rate list to begin editing prices.
                                </TableCell>
                            </TableRow>
                        ) : currentItems.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    No items found in your inventory.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentItems.map((item) => {
                                const currentRate = item.salePrices?.[selectedRateList] ?? item.salePrice;
                                const editedRate = editedRates[item.id];
                                const displayValue = editedRate !== undefined ? editedRate : currentRate;

                                return (
                                    <TableRow key={item.id} className={editedRate !== undefined ? "bg-yellow-500/10" : ""}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.thickness}</TableCell>
                                        <TableCell>{item.color}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.salePrice)}</TableCell>
                                        <TableCell className="text-right">
                                            <Input
                                                type="number"
                                                className="text-right font-semibold"
                                                placeholder="Enter new rate"
                                                value={displayValue}
                                                onChange={(e) => handleRateChange(item.id, e.target.value)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
