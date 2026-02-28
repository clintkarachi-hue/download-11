
"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Sale, Customer } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function PrintChallanPage() {
  const { id } = useParams() as { id: string };
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const saleRef = useMemoFirebase(() => (id && user) ? doc(firestore, 'sales', id) : null, [firestore, id, user]);
  const { data: sale, isLoading: isSaleLoading } = useDoc<Sale>(saleRef);

  const customerRef = useMemoFirebase(() => (sale?.customerId && user) ? doc(firestore, 'customers', sale.customerId) : null, [firestore, sale?.customerId, user]);
  const { data: customer, isLoading: isCustomerLoading } = useDoc<Customer>(customerRef);

  const isLoading = isAuthLoading || isSaleLoading || (sale?.customerId && isCustomerLoading);

  useEffect(() => {
    if (!isLoading && sale) {
      setTimeout(() => {
        window.print();
        window.close();
      }, 500);
    }
  }, [isLoading, sale]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading challan...</div>;
  }

  if (!sale) {
    return <div className="p-8 text-center">Challan not found.</div>;
  }

  return (
    <div className="p-8 font-sans bg-white text-black text-sm font-semibold printable-area">
        <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold font-headline">ARCO Aluminium Company</h1>
            <p className="mt-1 text-lg font-bold">Delivery Challan</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
                <p className="font-bold">Customer:</p>
                <p>{sale.customerName}</p>
                {customer?.address && <p>{customer.address}</p>}
                {customer?.phoneNumber && <p>{customer.phoneNumber}</p>}
            </div>
            <div className="text-right">
                <p className="font-bold">Challan No: <span className="font-semibold">{sale.id}</span></p>
                <p className="font-bold">Date: <span className="font-semibold">{formatDate(sale.date)}</span></p>
            </div>
        </div>
        <Table className="text-sm font-semibold">
            <TableHeader>
                <TableRow className="border-b-2 border-black">
                    <TableHead className="w-[40%] font-extrabold text-black">Item</TableHead>
                    <TableHead className="font-extrabold text-black">Colour</TableHead>
                    <TableHead className="font-extrabold text-black">Thickness</TableHead>
                    <TableHead className="text-right font-extrabold text-black">Feet</TableHead>
                    <TableHead className="text-right font-extrabold text-black">Quantity</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sale.items.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell>{item.thickness || '-'}</TableCell>
                        <TableCell className="text-right">{item.feet ? item.feet.toFixed(2) : '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

        {sale.description && (
            <div className="mt-8 text-sm border-t pt-4">
                <p className="font-extrabold text-gray-800">Notes / Description:</p>
                <p className="mt-1 font-semibold text-gray-700 whitespace-pre-wrap">{sale.description}</p>
            </div>
        )}

        <div className="mt-24 grid grid-cols-2 gap-8 text-sm">
            <div className="border-t-2 border-black pt-2 font-bold text-center"><p>Receiver's Signature</p></div>
            <div className="border-t-2 border-black pt-2 font-bold text-center"><p>Driver's Signature</p></div>
        </div>
    </div>
  );
}
