"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calculator, LayoutDashboard, Warehouse, ShoppingCart, Users, CreditCard, BarChart3, LogOut, BookUser, Settings, Truck, Menu, FileQuestion, HardHat, DollarSign, ClipboardList } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"

const navItems = [
  { href: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/inventory", icon: Warehouse, label: "Inventory" },
  { href: "/app/rate-lists", icon: ClipboardList, label: "Rate Lists" },
  { href: "/app/estimates", icon: FileQuestion, label: "Estimates" },
  { href: "/app/sales", icon: ShoppingCart, label: "Sales" },
  { href: "/app/customers", icon: Users, label: "Customers" },
  { href: "/app/vendors", icon: Truck, label: "Vendors" },
  { href: "/app/labour", icon: HardHat, label: "Labour" },
  { href: "/app/payroll", icon: DollarSign, label: "Payroll" },
  { href: "/app/expenses", icon: CreditCard, label: "Expenses" },
  { href: "/app/ledger", icon: BookUser, label: "Ledger" },
  { href: "/app/reports", icon: BarChart3, label: "Reports" },
  { href: "/app/weight-calculator", icon: Calculator, label: "Weight & Cost Calc" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];


export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">ARCO</span>
          </Link>
        </div>

        <nav className="hidden items-center space-x-6 text-sm font-semibold md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname.startsWith(item.href) ? "text-foreground" : "text-foreground/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
           <nav className="flex items-center space-x-2">
              <Button variant="ghost" className="text-sm font-semibold text-foreground/60 transition-colors hover:text-foreground/80" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
              </Button>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="pr-0">
                    <SheetHeader>
                      <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                      <SheetDescription className="sr-only">A list of navigation links for the ARCO application.</SheetDescription>
                    </SheetHeader>
                    <Link
                        href="/"
                        className="flex items-center gap-2 mb-4"
                         onClick={() => setMobileMenuOpen(false)}
                    >
                        <Calculator className="h-6 w-6 text-primary" />
                        <span className="font-bold font-headline">ARCO</span>
                    </Link>
                    <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                        <div className="flex flex-col space-y-3">
                            {navItems.map((item) => (
                                <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "text-muted-foreground transition-colors hover:text-foreground font-semibold",
                                    pathname?.startsWith(item.href) && "text-foreground"
                                )}
                                >
                                {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
          </nav>
        </div>
      </div>
    </header>
  )
}
