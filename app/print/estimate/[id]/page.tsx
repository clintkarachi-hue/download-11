
"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Estimate, Customer } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PrintEstimatePage() {
  const { id } = useParams() as { id: string };
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  // Fetch estimate data
  const estimateRef = useMemoFirebase(() => (id && user) ? doc(firestore, 'estimates', id) : null, [firestore, id, user]);
  const { data: estimate, isLoading: isEstimateLoading } = useDoc<Estimate>(estimateRef);

  // Fetch customer data
  const customerRef = useMemoFirebase(() => (estimate?.customerId && user) ? doc(firestore, 'customers', estimate.customerId) : null, [firestore, estimate?.customerId, user]);
  const { data: customer, isLoading: isCustomerLoading } = useDoc<Customer>(customerRef);
  
  const isLoading = isAuthLoading || isEstimateLoading || (estimate?.customerId && isCustomerLoading);

  useEffect(() => {
    if (!isLoading && estimate) {
      setTimeout(() => {
        window.print();
        window.close();
      }, 500); // Small delay to ensure rendering is complete
    }
  }, [isLoading, estimate]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading estimate...</div>;
  }

  if (!estimate) {
    return <div className="p-8 text-center">Estimate not found.</div>;
  }

    let grossAmount = 0;
    let totalItemDiscount = 0;

    estimate.items.forEach(item => {
        const itemGross = (item.feet || 1) * item.price * item.quantity;
        const itemDiscountAmount = itemGross * ((item.discount || 0) / 100);
        grossAmount += itemGross;
        totalItemDiscount += itemDiscountAmount;
    });

    const subtotal = grossAmount - totalItemDiscount;
    const overallDiscountAmount = subtotal * (estimate.discount / 100);
    const netAmount = subtotal - overallDiscountAmount;

  return (
    <div className="bg-white text-black printable-area">
       <div className="p-8">
            {estimate.showCompanyHeader !== false ? (
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-extrabold">ARCO Aluminium Company</h1>
                        <p className="text-sm text-gray-700 font-extrabold">B-5, PLOT 59, Industrial Estate, Hayatabad, Peshawar</p>
                        <p className="text-sm text-gray-700 font-extrabold">+92 333 4646356</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl uppercase font-extrabold">Estimate</h2>
                        <div className="grid grid-cols-2 gap-x-4 mt-2 text-sm">
                            <span className="font-extrabold">Date:</span>
                            <span className="font-extrabold">{formatDate(estimate.date)}</span>
                            <span className="font-extrabold">Estimate #:</span>
                            <span className="font-extrabold">{estimate.id}</span>
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="flex justify-between items-start">
                     <div className="text-left">
                        <h2 className="text-2xl font-extrabold uppercase">Estimate</h2>
                    </div>
                    <div className="text-right">
                        <div className="grid grid-cols-2 gap-x-4 mt-2 text-sm">
                            <span className="font-extrabold">Date:</span>
                            <span className="font-extrabold">{formatDate(estimate.date)}</span>
                            <span className="font-extrabold">Estimate #:</span>
                            <span className="font-extrabold">{estimate.id}</span>
                        </div>
                    </div>
                </div>
            )}
      </div>
      
      <div className="p-8 pt-0">
          <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                  <div className="font-bold text-sm uppercase text-gray-500">From</div>
                  <div className="text-sm text-gray-700 font-semibold">
                      <p className="font-extrabold">ARCO Aluminium Company</p>
                      <p>B-5, PLOT 59, Industrial Estate,</p>
                      <p>Hayatabad, Peshawar</p>
                      <p>+92 333 4646356</p>
                  </div>
              </div>
              <div className="space-y-4">
                   <div className="font-bold text-sm uppercase text-gray-500">To</div>
                  <div className="text-sm text-gray-700 font-semibold">
                      <p className="font-extrabold">{estimate.customerName}</p>
                      {customer?.address && <p>{customer.address}</p>}
                      {customer?.phoneNumber && <p>{customer.phoneNumber}</p>}
                  </div>
              </div>
          </div>


          <Table className="text-sm">
              <TableHeader>
                  <TableRow className="border-b-2 border-black">
                      <TableHead className="font-extrabold text-black uppercase w-[35%]">Description</TableHead>
                      <TableHead className="text-right font-extrabold text-black uppercase">Feet</TableHead>
                      <TableHead className="text-right font-extrabold text-black uppercase">Qty</TableHead>
                      <TableHead className="text-right font-extrabold text-black uppercase">Rate</TableHead>
                      <TableHead className="text-right font-extrabold text-black uppercase">Disc. %</TableHead>
                      <TableHead className="text-right font-extrabold text-black uppercase">Discount</TableHead>
                      <TableHead className="text-right font-extrabold text-black uppercase">Amount</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
              {estimate.items.map((item, index) => {
                  const itemTotal = (item.feet || 1) * item.price * item.quantity;
                  const discountAmount = itemTotal * ((item.discount || 0) / 100);
                  const finalAmount = itemTotal - discountAmount;
                  return (
                  <TableRow key={index} className="border-gray-200">
                      <TableCell className="font-bold text-gray-800">
                          {item.itemName}
                          <span className="text-gray-500 text-xs block font-semibold">
                              {item.thickness} - {item.color}
                          </span>
                      </TableCell>
                      <TableCell className="text-right text-gray-600 font-bold">{item.feet ? item.feet.toFixed(2) : '-'}</TableCell>
                      <TableCell className="text-right text-gray-600 font-bold">{item.quantity}</TableCell>
                      <TableCell className="text-right text-gray-600 font-bold">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right text-gray-600 font-bold">{item.discount || 0}%</TableCell>
                      <TableCell className="text-right text-gray-600 font-bold">{formatCurrency(discountAmount)}</TableCell>
                      <TableCell className="text-right font-bold text-gray-800">{formatCurrency(finalAmount)}</TableCell>
                  </TableRow>
                  );
              })}
              </TableBody>
          </Table>

          <div className="flex justify-between items-start mt-8">
               <div className="w-1/2">
                  <div className="font-bold text-sm uppercase text-gray-500">Notes</div>
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                      Thank you for your business. This is a cost estimate and is valid for 15 days.
                  </p>
              </div>
              <div className="w-full max-w-sm space-y-2 text-sm font-semibold">
                    <div className="flex justify-between text-gray-600"><span>Gross Amount</span><span>{formatCurrency(grossAmount)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Item Discounts</span><span>- {formatCurrency(totalItemDiscount)}</span></div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Overall Discount ({estimate.discount}%)</span><span>- {formatCurrency(overallDiscountAmount)}</span></div>
                    <div className="flex justify-between font-bold text-lg border-t-2 border-gray-800 pt-2 mt-2"><span>Net Amount</span><span>{formatCurrency(netAmount)}</span></div>
              </div>
          </div>
      </div>
    </div>
  );
}
