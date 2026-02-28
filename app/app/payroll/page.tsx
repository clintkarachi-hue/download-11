

"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Trash2, DollarSign, FileText, Printer, MoreHorizontal, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SalaryLabourer, SalaryPayment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/firebase/data/data-provider";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

function SalaryPayslip({ payment }: { payment: SalaryPayment }) {
    
    const handlePrint = () => {
        document.body.classList.add('printing-now');
        window.print();
        document.body.classList.remove('printing-now');
    };

    return (
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 no-print">
                <DialogTitle>Payslip for {payment.month} {payment.year}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto printable-area">
                <div className="p-6">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold">Salary Payslip</h1>
                        <p className="text-lg font-semibold">{payment.month} {payment.year}</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Labourer</TableHead>
                                <TableHead className="text-right">Monthly Salary</TableHead>
                                <TableHead className="text-right">Days Worked</TableHead>
                                <TableHead className="text-right">Overtime (hrs)</TableHead>
                                <TableHead className="text-right">Deductions</TableHead>
                                <TableHead className="text-right">Allowances</TableHead>
                                <TableHead className="text-right font-bold">Total Payable</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payment.labourers.map(l => (
                                <TableRow key={l.labourerId}>
                                    <TableCell className="font-medium">{l.labourerName}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(l.monthlySalary)}</TableCell>
                                    <TableCell className="text-right">{l.daysWorked}</TableCell>
                                    <TableCell className="text-right">{l.overtimeHours}</TableCell>
                                    <TableCell className="text-right text-red-500">{formatCurrency(l.deductions)}</TableCell>
                                    <TableCell className="text-right text-green-500">{formatCurrency(l.allowances || 0)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(l.totalPayable)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={6} className="text-right">Grand Total Paid</TableCell>
                            <TableCell className="text-right">{formatCurrency(payment.totalAmountPaid)}</TableCell>
                        </TableRow>
                    </Table>
                     <div className="mt-24 grid grid-cols-2 gap-8 text-sm">
                        <div className="border-t-2 border-black pt-2 font-bold text-center"><p>Accountant's Signature</p></div>
                        <div className="border-t-2 border-black pt-2 font-bold text-center"><p>Receiver's Signature</p></div>
                    </div>
                </div>
            </div>
            <DialogFooter className="mt-4 flex-shrink-0 no-print">
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

function NewPayslipForm({ 
  onPayslipGenerated,
  existingPayslip,
  onCancelEdit,
}: { 
  onPayslipGenerated: () => void,
  existingPayslip?: SalaryPayment | null,
  onCancelEdit: () => void,
}) {
  const { toast } = useToast();
  const { labourers, labourersMap, addSalaryPayment, updateSalaryPayment } = useData();
  
  const isEditMode = !!existingPayslip;

  const [selectedMonth, setSelectedMonth] = useState<string>(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [salaryItems, setSalaryItems] = useState<Partial<SalaryLabourer>[]>([]);
  const [selectedLabourer, setSelectedLabourer] = useState("");

  useEffect(() => {
    if (isEditMode && existingPayslip) {
      setSelectedMonth(existingPayslip.month);
      setSelectedYear(existingPayslip.year);
      setSalaryItems(existingPayslip.labourers.map(l => ({ ...l }))); // Create a deep copy
    } else {
      setSalaryItems([]);
      setSelectedMonth(months[new Date().getMonth()]);
      setSelectedYear(currentYear);
    }
  }, [existingPayslip, isEditMode]);

  const labourerOptions = useMemo(() => 
    labourers.map(l => ({
        value: l.id,
        label: `${l.name} - Salary: ${formatCurrency(l.monthlySalary)}`
    })), [labourers]);

  const handleAddLabourer = () => {
    if (!selectedLabourer) {
        toast({ variant: 'destructive', title: 'Please select a labourer to add.'});
        return;
    }
    if (salaryItems.some(item => item.labourerId === selectedLabourer)) {
        toast({ variant: 'destructive', title: 'Labourer already added.'});
        return;
    }
    
    const labourerDetails = labourersMap.get(selectedLabourer);
    if (labourerDetails) {
        const hourlyRate = labourerDetails.monthlySalary / 30 / 12;

        setSalaryItems([...salaryItems, {
            labourerId: labourerDetails.id,
            labourerName: labourerDetails.name,
            monthlySalary: labourerDetails.monthlySalary,
            daysWorked: 30,
            overtimeHours: 0,
            overtimeRate: hourlyRate,
            deductions: 0,
            allowances: 0,
        }]);
        setSelectedLabourer("");
    }
  }

  const handleRemoveItem = (index: number) => {
    setSalaryItems(salaryItems.filter((_, i) => i !== index));
  }

  const handleItemChange = (index: number, key: keyof SalaryLabourer, value: any) => {
    const newItems = [...salaryItems];
    const currentItem = { ...newItems[index] };
    (currentItem as any)[key] = value;
    newItems[index] = currentItem;
    setSalaryItems(newItems);
  }

  const calculateTotalPayable = (item: Partial<SalaryLabourer>): number => {
      const perDaySalary = (item.monthlySalary || 0) / 30;
      const baseSalary = (item.daysWorked || 0) * perDaySalary;
      const overtimePay = (item.overtimeHours || 0) * (item.overtimeRate || 0);
      const totalDeductions = item.deductions || 0;
      const totalAllowances = item.allowances || 0;
      return baseSalary + overtimePay - totalDeductions + totalAllowances;
  }
  
  const calculateGrandTotal = () => {
      return salaryItems.reduce((total, item) => {
          const itemPayable = calculateTotalPayable(item);
          item.totalPayable = itemPayable;
          return total + itemPayable;
      }, 0);
  }

  const handleSave = async () => {
    if (salaryItems.length === 0) {
      toast({ variant: "destructive", title: "Please add at least one labourer." });
      return;
    }
    
    const finalSalaryItems = salaryItems.map(item => ({
        ...item,
        totalPayable: calculateTotalPayable(item),
    })) as SalaryLabourer[];

    const totalAmountPaid = finalSalaryItems.reduce((sum, item) => sum + item.totalPayable, 0);

    const paymentData = {
        month: selectedMonth,
        year: selectedYear,
        labourers: finalSalaryItems,
        totalAmountPaid: totalAmountPaid,
    };

    if (isEditMode && existingPayslip) {
        await updateSalaryPayment(existingPayslip.id, paymentData, existingPayslip);
        toast({ title: "Payslip Updated!", description: `Salary for ${selectedMonth} ${selectedYear} has been updated.` });
    } else {
        await addSalaryPayment(paymentData);
        toast({ title: "Payslip Generated!", description: `Salary for ${selectedMonth} ${selectedYear} has been processed.` });
    }
    
    onPayslipGenerated();
  };
  
  return (
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditMode ? 'Edit Payslip' : 'Generate Monthly Salaries'}</CardTitle>
          {isEditMode && <Button variant="outline" onClick={onCancelEdit}>Cancel Edit</Button>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isEditMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))} disabled={isEditMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-4">
              <Label>Add Labourer to Payslip</Label>
              <div className="flex gap-2 items-center">
                  <div className="flex-grow">
                      <Combobox
                          options={labourerOptions}
                          value={selectedLabourer}
                          onValueChange={setSelectedLabourer}
                          placeholder="Select a labourer..."
                      />
                  </div>
                  <Button onClick={handleAddLabourer} size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add
                  </Button>
              </div>
          </div>
          
          <div className="space-y-4">
            <Label>Salary Details</Label>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Labourer</TableHead>
                    <TableHead className="w-[120px]">Days Worked</TableHead>
                    <TableHead className="w-[120px]">Overtime (hrs)</TableHead>
                    <TableHead className="w-[120px]">Deductions</TableHead>
                    <TableHead className="w-[120px]">Allowances</TableHead>
                    <TableHead className="text-right w-[150px]">Total Payable</TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Remove</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">No labourers added to the payslip yet.</TableCell>
                    </TableRow>
                  ) : (
                    salaryItems.map((item, index) => (
                      <TableRow key={item.labourerId}>
                        <TableCell className="font-medium">
                          {item.labourerName}<br/>
                          <span className="text-xs text-muted-foreground">Salary: {formatCurrency(item.monthlySalary || 0)}/month</span>
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.daysWorked} onChange={(e) => handleItemChange(index, 'daysWorked', Number(e.target.value))} />
                        </TableCell>
                        <TableCell>
                           <Input type="number" value={item.overtimeHours} onChange={(e) => handleItemChange(index, 'overtimeHours', Number(e.target.value))} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.deductions} onChange={(e) => handleItemChange(index, 'deductions', Number(e.target.value))} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.allowances || 0} onChange={(e) => handleItemChange(index, 'allowances', Number(e.target.value))} />
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(calculateTotalPayable(item))}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/50 p-4 rounded-b-lg">
          <div className="text-xl font-bold">
            Grand Total: {formatCurrency(calculateGrandTotal())}
          </div>
          <Button onClick={handleSave} disabled={salaryItems.length === 0}>
            <DollarSign className="mr-2 h-4 w-4" />
            {isEditMode ? 'Update Payslip' : 'Generate & Save Payslip'}
          </Button>
        </CardFooter>
      </Card>
  )
}

export default function PayrollPage() {
  const { salaryPayments, deleteSalaryPayment } = useData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new");
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<SalaryPayment | null>(null);

  const handlePayslipGenerated = () => {
      setActiveTab("history");
      setEditingPayslip(null);
  }

  const handleCancelEdit = () => {
      setActiveTab("history");
      setEditingPayslip(null);
  }

  const handleDelete = (payment: SalaryPayment) => {
    deleteSalaryPayment(payment);
    toast({ title: "Payslip Deleted", description: "The salary payment has been removed." });
  }

  const handleEditClick = (payment: SalaryPayment) => {
    setEditingPayslip(payment);
    setActiveTab("new");
  };

  return (
    <>
      <PageHeader
        title="Monthly Salary"
        description="Create new payslips and view payment history."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 no-print">
            <TabsTrigger value="new">{editingPayslip ? "Edit Payslip" : "New Payslip"}</TabsTrigger>
            <TabsTrigger value="history">Payslip History</TabsTrigger>
        </TabsList>
        <TabsContent value="new">
            <div className="mt-4">
              <NewPayslipForm 
                onPayslipGenerated={handlePayslipGenerated} 
                existingPayslip={editingPayslip}
                onCancelEdit={handleCancelEdit}
              />
            </div>
        </TabsContent>
        <TabsContent value="history">
             <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Salary Payment History</CardTitle>
                    <CardDescription>Review all past salary payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Payment Date</TableHead>
                                    <TableHead className="text-right">Total Amount Paid</TableHead>
                                    <TableHead className="text-right no-print">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salaryPayments.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No salary payments found.</TableCell></TableRow>
                                ) : (
                                    salaryPayments.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{payment.month}</TableCell>
                                            <TableCell>{payment.year}</TableCell>
                                            <TableCell>{formatDate(payment.date)}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(payment.totalAmountPaid)}</TableCell>
                                            <TableCell className="text-right no-print">
                                                <Dialog onOpenChange={(open) => !open && setSelectedPayment(null)}>
                                                  <AlertDialog>
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                          <MoreHorizontal className="h-4 w-4" />
                                                          <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                          <DialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={() => setSelectedPayment(payment)}>
                                                                <FileText className="mr-2 h-4 w-4"/>
                                                                View Details
                                                            </DropdownMenuItem>
                                                          </DialogTrigger>
                                                          <DropdownMenuItem onSelect={() => handleEditClick(payment)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                          </DropdownMenuItem>
                                                          <AlertDialogTrigger asChild>
                                                              <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                                                                  <Trash2 className="mr-2 h-4 w-4"/>
                                                                  Delete
                                                              </DropdownMenuItem>
                                                          </AlertDialogTrigger>
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                     {selectedPayment && selectedPayment.id === payment.id && (
                                                          <SalaryPayslip payment={selectedPayment} />
                                                     )}
                                                    <AlertDialogContent>
                                                      <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                          This action cannot be undone. This will permanently delete the payslip for {payment.month} {payment.year} and its associated ledger entry.
                                                        </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(payment)}>Delete</AlertDialogAction>
                                                      </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                  </AlertDialog>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
