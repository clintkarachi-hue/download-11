
"use client";

import React, { useEffect, useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Sale, Item } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export default function PrintTopItemsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  
  const salesCol = useMemoFirebase(() => user ? query(collection(firestore, 'sales'), where('status', '==', 'posted')) : null, [firestore, user]);
  const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesCol);
  
  const itemsCol = useMemoFirebase(() => user ? collection(firestore, 'items') : null, [firestore, user]);
  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsCol);

  const isDataLoading = isAuthLoading || salesLoading || itemsLoading;
  
  const reportData = useMemo(() => {
    if (isDataLoading || !sales || !items) return [];
    
    const itemSales: { [key: string]: { itemName: string; thickness: string; totalSold: number; unit: string; } } = {};

    sales.forEach(sale => {
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
  }, [sales, items, isDataLoading]);

  useEffect(() => {
    if (!isDataLoading && reportData.length > 0) {
      setTimeout(() => {
        window.print();
        window.close();
      }, 500);
    }
  }, [isDataLoading, reportData]);

  if (isDataLoading) {
    return <div className="p-8 text-center">Loading report...</div>;
  }

  return (
    <div className="p-8 font-sans bg-white text-black text-sm printable-area">
        <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold font-headline">ARCO Aluminium Company</h1>
            <p className="mt-1 text-lg font-bold">Top Selling Items Report</p>
            <p className="text-sm text-gray-500">As of {formatDate(new Date())}</p>
        </div>
        
        <Table className="text-sm">
            <TableHeader>
                <TableRow className="bg-gray-100">
                    <TableHead className="w-[50%] font-extrabold text-black">Item / Section</TableHead>
                    <TableHead className="font-extrabold text-black">Thickness</TableHead>
                    <TableHead className="text-right font-extrabold text-black">Total Sold</TableHead>
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
  );
}
