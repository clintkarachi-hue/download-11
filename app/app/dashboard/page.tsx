

"use client"

import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Library } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { useData } from "@/firebase/data/data-provider"
import type { Sale, Expense } from "@/lib/types"


const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig


function ChartOfAccounts() {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Chart of Accounts</DialogTitle>
        <CardDescription>
          This chart shows how different transaction categories map to the main financial accounts.
        </CardDescription>
      </DialogHeader>
      <div className="space-y-4 py-4 text-sm">
        <div className="flex flex-col space-y-2">
          <div className="font-bold text-base">Core Accounts</div>
          <div className="pl-4 border-l-2">
            
            <div className="font-semibold mt-2">Revenue (Aamdani)</div>
            <div className="pl-4 border-l-2 text-muted-foreground">
              <p>&#x2514;&#x2500; Sales (From Invoices)</p>
            </div>

            <div className="font-semibold mt-2">Expenses (Akhrajaat)</div>
            <div className="pl-4 border-l-2 text-muted-foreground">
              <p>&#x2514;&#x2500; Labour</p>
              <p>&#x2514;&#x2500; Transport</p>
              <p>&#x2514;&#x2500; Electricity</p>
              <p>&#x2514;&#x2500; Vendor Payment</p>
              <p>&#x2514;&#x2500; Salary</p>
              <p>&#x2514;&#x2500; Other</p>
            </div>

            <div className="font-semibold mt-2">Assets (Wasooliyan)</div>
             <div className="pl-4 border-l-2 text-muted-foreground">
               <p>&#x2514;&#x2500; Cash / Bank (Transactions you record)</p>
               <p>&#x2514;&#x2500; Accounts Receivable (Customer Balances)</p>
            </div>

            <div className="font-semibold mt-2">Liabilities (Adaiygiyan)</div>
             <div className="pl-4 border-l-2 text-muted-foreground">
              <p>&#x2514;&#x2500; Accounts Payable (Vendor Balances)</p>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}


export default function DashboardPage() {
  const { sales, expenses } = useData();

  const getDashboardStats = () => {
    const totalSales = sales.filter(s => s.status === 'posted').reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const profitLoss = totalSales - totalExpenses;

    const today = new Date();
    const todaySummary = {
        sales: sales.filter(s => new Date(s.date).toDateString() === today.toDateString() && s.status === 'posted'),
        expenses: expenses.filter(e => new Date(e.date).toDateString() === today.toDateString()),
    };
    return { totalSales, totalExpenses, profitLoss, todaySummary };
  };

  const getMonthlySalesData = () => {
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
  };

  const stats = getDashboardStats();
  const monthlyData = getMonthlySalesData();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A real-time overview of your factory's performance."
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Library className="mr-2 h-4 w-4" />
              Chart of Accounts
            </Button>
          </DialogTrigger>
          <ChartOfAccounts />
        </Dialog>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">Includes all sales and cash receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Includes all expenses and payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit / Loss</CardTitle>
             {stats.profitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.profitLoss)}
            </div>
            <p className="text-xs text-muted-foreground">Calculated for the period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue & Expense Overview</CardTitle>
            <CardDescription>Monthly performance.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
              <BarChart accessibilityLayer data={monthlyData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${formatCurrency(value as number)}`}
                />
                 <ChartTooltip
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  content={<ChartTooltipContent formatter={(value, name) => `${formatCurrency(value as number)}`} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
            <CardDescription>Sales and expenses for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                        <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Today's Sales</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(stats.todaySummary.sales.reduce((sum, s) => sum + s.total, 0))}</p>
                    </div>
                    <div className="ml-auto font-medium">+{stats.todaySummary.sales.length} orders</div>
                </div>
                 <div className="flex items-center">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-md">
                        <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Today's Expenses</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(stats.todaySummary.expenses.reduce((sum, e) => sum + e.amount, 0))}</p>
                    </div>
                     <div className="ml-auto font-medium">+{stats.todaySummary.expenses.length} records</div>
                </div>
            </div>
            
            <h3 className="font-semibold mt-6 mb-2">Recent Sales</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 3).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="font-medium">{sale.customerName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {sale.id}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          </CardContent>
        </Card>
      </div>
    </>
  );
}
