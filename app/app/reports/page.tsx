
"use client"

import React, { useState, useMemo } from "react"
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { useData } from "@/firebase/data/data-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, X, Printer, Trophy } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import type { SalaryPayment } from "@/lib/types"

const chartConfig = {
  sales: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

function ReportCard({ title, description, children, onPrint }: { title: string, description: string, children: React.ReactNode, onPrint?: () => void }) {
    
    return (
        <Card className="mt-4 break-inside-avoid">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    {onPrint && (
                        <Button variant="ghost" size="icon" onClick={onPrint} className="no-print">
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Print</span>
                        </Button>
                    )}
                </div>
            </CardHeader>
            {children}
        </Card>
    );
}


function SalaryPayslip({ payment }: { payment: SalaryPayment }) {
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
                                    <TableCell className="text-right font-bold">{formatCurrency(l.totalPayable)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={5} className="text-right">Grand Total Paid</TableCell>
                            <TableCell className="text-right">{formatCurrency(payment.totalAmountPaid)}</TableCell>
                        </TableRow>
                    </Table>
                </div>
            </div>
        </DialogContent>
    );
}

function LedgerReportContent() {
    const { transactions, customers, vendors } = useData();
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        filtered = filtered.filter(t => {
            const transactionDate = new Date(t.date);
            return (!date?.from || transactionDate >= date.from) && (!date?.to || transactionDate <= date.to);
        });
        if (selectedCustomerId) {
            filtered = filtered.filter(t => t.customerId === selectedCustomerId);
        } else if (selectedVendorId) {
            filtered = filtered.filter(t => t.vendorId === selectedVendorId);
        }
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions, date, selectedCustomerId, selectedVendorId]);

    let runningBalance = 0;
    const reportData = filteredTransactions.map(t => {
        if (selectedCustomerId) {
            runningBalance += (t.type === 'debit' ? t.amount : -t.amount);
        } else if (selectedVendorId) {
            runningBalance += (t.type === 'credit' ? t.amount : -t.amount);
        } else {
            runningBalance += (t.type === 'credit' ? t.amount : -t.amount);
        }
        return { ...t, balance: runningBalance };
    });
    
    const clearFilters = () => {
        setSelectedCustomerId(null);
        setSelectedVendorId(null);
    }

    const hasFilter = selectedCustomerId || selectedVendorId;

    return (
        <CardContent className="space-y-4 px-0 sm:px-6">
            <div className="flex flex-wrap items-center gap-4 no-print p-4 bg-muted/50 rounded-lg">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full sm:w-[300px] justify-start text-left font-normal bg-background", !date && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                    <Label htmlFor="customer-filter" className="text-sm shrink-0">Customer</Label>
                    <Select onValueChange={(value) => { setSelectedCustomerId(value || null); setSelectedVendorId(null); }} value={selectedCustomerId || ''}>
                        <SelectTrigger id="customer-filter" className="w-full sm:w-[200px] bg-background"><SelectValue placeholder="Select Customer" /></SelectTrigger>
                        <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="vendor-filter" className="text-sm shrink-0">Vendor</Label>
                    <Select onValueChange={(value) => { setSelectedVendorId(value || null); setSelectedCustomerId(null); }} value={selectedVendorId || ''}>
                        <SelectTrigger id="vendor-filter" className="w-full sm:w-[200px] bg-background"><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                        <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                {hasFilter && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Clear Filter</Button>}
            </div>
            <div className="hidden print:block text-center my-6">
                <h1 className="text-2xl font-bold font-headline">ARCO Aluminium Company</h1>
                <p className="text-lg font-semibold mt-1">Account Statement for {selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.customerName : selectedVendorId ? vendors.find(v => v.id === selectedVendorId)?.name : 'General Ledger'}</p>
                {date?.from && date?.to && <p className="text-sm text-muted-foreground">{format(date.from, "LLL dd, y")} to {format(date.to, "LLL dd, y")}</p>}
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">No transactions in selected range.</TableCell></TableRow>
                        ) : (
                            reportData.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{formatDate(transaction.date)}</TableCell>
                                    <TableCell className="font-medium">{transaction.description}</TableCell>
                                    <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
                                    <TableCell className={cn("text-right font-mono", transaction.type === 'debit' && "font-semibold")}>{transaction.type === 'debit' ? formatCurrency(transaction.amount) : '-'}</TableCell>
                                    <TableCell className={cn("text-right font-mono", transaction.type === 'credit' && "font-semibold")}>{transaction.type === 'credit' ? formatCurrency(transaction.amount) : '-'}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(transaction.balance)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    {hasFilter && reportData.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold">Final Balance</TableCell>
                                <TableCell className={cn("text-right font-bold font-mono", runningBalance >= 0 ? "text-red-600" : "text-green-600")}>{formatCurrency(runningBalance)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>
        </CardContent>
    );
}

function SalaryReportContent() {
    const { salaryPayments } = useData();
    const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null);

    return (
        <CardContent>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead className="text-right">Total Amount Paid</TableHead>
                            <TableHead className="no-print"><span className="sr-only">Actions</span></TableHead>
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
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)}><FileText className="mr-2 h-4 w-4" /> View Details</Button>
                                            </DialogTrigger>
                                            {selectedPayment && selectedPayment.id === payment.id && <SalaryPayslip payment={selectedPayment} />}
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    );
}

function ItemSalesReportContent() {
    const { sales, items } = useData();

    const reportData = useMemo(() => {
        const itemSales: { [key: string]: { itemName: string; thickness: string; totalSold: number; unit: string; } } = {};

        sales.filter(s => s.status === 'posted').forEach(sale => {
            sale.items.forEach(saleItem => {
                const itemDetails = items.find(i => i.id === saleItem.itemId);
                const key = `${saleItem.itemName}-${saleItem.thickness}`;

                if (!itemSales[key]) {
                    itemSales[key] = {
                        itemName: saleItem.itemName,
                        thickness: saleItem.thickness,
                        totalSold: 0,
                        unit: itemDetails?.category === 'Aluminium' ? 'ft' : 'pcs'
                    };
                }

                if (itemDetails?.category === 'Aluminium') {
                    itemSales[key].totalSold += (saleItem.feet || 1) * saleItem.quantity;
                } else {
                    itemSales[key].totalSold += saleItem.quantity;
                }
            });
        });

        return Object.values(itemSales).sort((a, b) => b.totalSold - a.totalSold);
    }, [sales, items]);

    return (
        <CardContent>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item / Section</TableHead>
                            <TableHead>Thickness</TableHead>
                            <TableHead className="text-right">Total Sold</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No sales data available.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reportData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium flex items-center">
                                         {index < 3 && <Trophy className={cn("mr-2 h-4 w-4", {
                                             "text-yellow-500": index === 0,
                                             "text-gray-400": index === 1,
                                             "text-yellow-700": index === 2,
                                         })} />}
                                        {item.itemName}
                                    </TableCell>
                                    <TableCell>{item.thickness}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {item.totalSold.toFixed(2)} {item.unit}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    );
}

export default function ReportsPage() {
    const { sales, expenses } = useData();

    const stats = useMemo(() => {
        const totalSales = sales.filter(s => s.status === 'posted').reduce((sum, sale) => sum + sale.total, 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const profitLoss = totalSales - totalExpenses;
        return { totalSales, totalExpenses, profitLoss };
    }, [sales, expenses]);

    const monthlyData = useMemo(() => {
        const revenueByMonth: { [key: string]: number } = {};
        const expensesByMonth: { [key: string]: number } = {};
        
        sales.filter(s => s.status === 'posted').forEach(sale => {
            const month = new Date(sale.date).toLocaleString('default', { month: 'short' });
            revenueByMonth[month] = (revenueByMonth[month] || 0) + sale.total;
        });

        expenses.forEach(expense => {
            const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
            expensesByMonth[month] = (expensesByMonth[month] || 0) + expense.amount;
        });

        const lastSixMonths = [...Array(6)].map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return d.toLocaleString('default', { month: 'short' });
        }).reverse();

        return lastSixMonths.map(month => ({
            name: month,
            sales: revenueByMonth[month] || 0,
            expenses: expensesByMonth[month] || 0,
        }));
    }, [sales, expenses]);
    
    const dailyReportData = useMemo(() => {
        const today = new Date();
        const todaySales = sales.filter(s => new Date(s.date).toDateString() === today.toDateString() && s.status === 'posted').reduce((acc, s) => acc + s.total, 0);
        const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === today.toDateString()).reduce((acc, e) => acc + e.amount, 0);

        return [
            { date: "Today", sales: todaySales, expenses: todayExpenses },
        ];
    }, [sales, expenses]);

    const handlePrint = (report: string) => {
        if (report === 'top-items') {
            window.open('/print/top-items', '_blank');
        } else {
            window.print();
        }
    };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Analyze your factory's financial performance."
      />

      <div className="columns-1 md:columns-2 gap-4" id="reports-container">
        <ReportCard title="Daily Report" description={formatDate(new Date())} onPrint={() => window.print()}>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={dailyReportData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                        <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} content={<ChartTooltipContent hideLabel />} />
                        <Legend />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </ReportCard>
        
        <ReportCard title="Monthly Performance" description="Revenue and expenses over recent months." onPrint={() => window.print()}>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={monthlyData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickFormatter={(value) => formatCurrency(value as number).slice(0,-3)+'k'} />
                        <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </ReportCard>

        <ReportCard title="Profit & Loss Statement" description="A summary of revenues, costs, and expenses." onPrint={() => window.print()}>
            <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 grid gap-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="font-medium text-green-600">{formatCurrency(stats.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Expenses</span>
                        <span className="font-medium text-red-600">- {formatCurrency(stats.totalExpenses)}</span>
                    </div>
                        <div className="border-t pt-4 flex justify-between font-bold text-lg">
                        <span>Net Profit / Loss</span>
                        <span className={stats.profitLoss >= 0 ? 'text-green-700' : 'text-red-700'}>{formatCurrency(stats.profitLoss)}</span>
                    </div>
                </div>
            </CardContent>
        </ReportCard>

        <ReportCard title="Top Selling Items" description="Items sold the most by quantity." onPrint={() => handlePrint('top-items')}>
            <ItemSalesReportContent />
        </ReportCard>

        <ReportCard title="Ledger Report" description="View transactions within a specific date range." onPrint={() => window.print()}>
            <LedgerReportContent />
        </ReportCard>
        
        <ReportCard title="Salary Payment History" description="Review all past salary payments." onPrint={() => window.print()}>
            <SalaryReportContent />
        </ReportCard>
        
      </div>
    </>
  );
}
