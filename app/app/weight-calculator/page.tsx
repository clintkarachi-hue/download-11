
"use client";

import { useState, useMemo } from "react";
import { Calculator, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/firebase/data/data-provider";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface CalculationResult {
  length: number;
  weight: number;
}

export default function WeightCalculatorPage() {
  const { toast } = useToast();
  const { items } = useData();
  
  const [calculationMode, setCalculationMode] = useState<'inventory' | 'manual'>('inventory');
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [manualSectionName, setManualSectionName] = useState<string>("");
  const [manualWeight, setManualWeight] = useState<number>(0);
  const [lengthsInput, setLengthsInput] = useState<string>("");
  const [ratePerKg, setRatePerKg] = useState<number>(0);

  const [results, setResults] = useState<CalculationResult[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [totalLength, setTotalLength] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [netRatePerFoot, setNetRatePerFoot] = useState<number>(0);

  const [reportDetails, setReportDetails] = useState<{name: string, weight: number, rate: number} | null>(null);

  const aluminiumItems = useMemo(() => 
    items.filter(item => item.category === 'Aluminium' && item.weight && item.weight > 0)
    .sort((a, b) => a.name.localeCompare(b.name)), 
  [items]);

  const handleCalculate = () => {
    let weightPerFoot: number | undefined;
    let reportName: string;

    if (calculationMode === 'inventory') {
        const selectedItem = aluminiumItems.find(item => item.id === selectedItemId);
        if (!selectedItem || !selectedItem.weight) {
            toast({ variant: "destructive", title: "Please select a section with a valid weight." });
            return;
        }
        weightPerFoot = selectedItem.weight;
        reportName = `${selectedItem.name} (${selectedItem.thickness}) - ${selectedItem.color}`;
    } else { // manual mode
        if (!manualWeight || manualWeight <= 0) {
            toast({ variant: "destructive", title: "Please enter a valid weight per foot." });
            return;
        }
        weightPerFoot = manualWeight;
        reportName = manualSectionName.trim() || "Manual Section";
    }

    if (ratePerKg <= 0) {
        toast({ variant: "destructive", title: "Please enter a valid rate per Kg." });
        return;
    }

    const lengths = lengthsInput
      .split(/[\s,;\n]+/) // Split by spaces, commas, semicolons, or newlines
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0);

    if (lengths.length === 0) {
      toast({ variant: "destructive", title: "Please enter valid lengths." });
      return;
    }

    const newResults: CalculationResult[] = lengths.map(length => ({
      length,
      weight: length * weightPerFoot!,
    }));

    const newTotalWeight = newResults.reduce((sum, result) => sum + result.weight, 0);
    const newTotalLength = lengths.reduce((sum, len) => sum + len, 0);
    const newTotalAmount = newTotalWeight * ratePerKg;
    const newNetRatePerFoot = newTotalLength > 0 ? newTotalAmount / newTotalLength : 0;

    setResults(newResults);
    setTotalWeight(newTotalWeight);
    setTotalLength(newTotalLength);
    setTotalAmount(newTotalAmount);
    setNetRatePerFoot(newNetRatePerFoot);
    setReportDetails({ name: reportName, weight: weightPerFoot!, rate: ratePerKg });
  };

  const clearReport = () => {
    setResults([]);
    setTotalWeight(0);
    setLengthsInput("");
    setReportDetails(null);
    setManualSectionName("");
    setManualWeight(0);
    setRatePerKg(0);
    setTotalAmount(0);
    setNetRatePerFoot(0);
    setTotalLength(0);
  }

  return (
    <>
      <PageHeader
        title="Section Cost & Weight Calculator"
        description="Calculate weight and cost of aluminium sections based on their lengths."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Calculator</CardTitle>
                <CardDescription>Enter details to calculate weight and cost.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <RadioGroup value={calculationMode} onValueChange={(value: 'inventory' | 'manual') => setCalculationMode(value)} className="grid grid-cols-2 gap-4">
                    <div>
                        <RadioGroupItem value="inventory" id="r1" className="peer sr-only" />
                        <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            From Inventory
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="manual" id="r2" className="peer sr-only" />
                        <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Manual Input
                        </Label>
                    </div>
                </RadioGroup>

                {calculationMode === 'inventory' ? (
                    <div className="space-y-2">
                        <Label htmlFor="section">Aluminium Section</Label>
                        <Select onValueChange={setSelectedItemId} value={selectedItemId}>
                            <SelectTrigger id="section">
                                <SelectValue placeholder="Select a section..." />
                            </SelectTrigger>
                            <SelectContent>
                                {aluminiumItems.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} ({item.thickness}) - {item.color}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="manual-name">Section Name (Optional)</Label>
                            <Input
                                id="manual-name"
                                placeholder="e.g. Special Angle 2-inch"
                                value={manualSectionName}
                                onChange={(e) => setManualSectionName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-weight">Weight per Foot (kg/ft)</Label>
                            <Input
                                id="manual-weight"
                                type="number"
                                placeholder="e.g. 0.49"
                                value={manualWeight || ''}
                                onChange={(e) => setManualWeight(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="rate">Rate per Kg (PKR)</Label>
                    <Input
                        id="rate"
                        type="number"
                        placeholder="e.g. 1050"
                        value={ratePerKg || ''}
                        onChange={(e) => setRatePerKg(parseFloat(e.target.value) || 0)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lengths">Lengths (in feet)</Label>
                    <Textarea 
                        id="lengths"
                        placeholder="Enter lengths separated by space, comma, or new line. e.g. 18 16 14.5"
                        value={lengthsInput}
                        onChange={(e) => setLengthsInput(e.target.value)}
                        rows={5}
                    />
                </div>

                <Button onClick={handleCalculate} className="w-full">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate
                </Button>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Calculation Report</CardTitle>
                        <CardDescription>Summary of the calculated weights and costs.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()} className="no-print" disabled={results.length === 0}>
                            Print Report
                        </Button>
                        <Button variant="ghost" size="icon" onClick={clearReport} className="no-print" disabled={results.length === 0}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="hidden print:block text-center mb-6">
                    <h1 className="text-2xl font-bold font-headline">ARCO Aluminium Company</h1>
                    <p className="text-lg font-semibold mt-1">Section Weight & Cost Report</p>
                    {reportDetails && <p className="text-sm text-muted-foreground">{reportDetails.name} | Weight: {reportDetails.weight?.toFixed(3)} kg/ft | Rate: {formatCurrency(reportDetails.rate)}/kg</p>}
                </div>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">#</TableHead>
                                <TableHead>Length (ft)</TableHead>
                                <TableHead className="text-right">Weight (kg)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No calculation performed yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                results.map((result, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>{result.length.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono">{result.weight.toFixed(3)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        {results.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={2} className="text-right font-bold">Total Length</TableCell>
                                    <TableCell className="text-right font-mono">{totalLength.toFixed(2)} ft</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} className="text-right font-bold">Total Weight</TableCell>
                                    <TableCell className="text-right font-mono">{totalWeight.toFixed(3)} kg</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell colSpan={2} className="text-right font-bold">Total Amount</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalAmount)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/50">
                                    <TableCell colSpan={2} className="text-right font-bold text-lg">Final Rate per Foot</TableCell>
                                    <TableCell className="text-right font-bold text-lg font-mono">{formatCurrency(netRatePerFoot)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}

    