
"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import type { Item, Customer, Sale, Expense, Transaction, Vendor, Estimate, Labour, SalaryPayment, SaleItem } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, Timestamp, query, where, getDocs, runTransaction, addDoc, getDoc, deleteDoc, updateDoc, onSnapshot, orderBy, setDoc } from 'firebase/firestore';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '../non-blocking-updates';


interface DataContextProps {
  items: Item[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  transactions: Transaction[];
  vendors: Vendor[];
  estimates: Estimate[];
  labourers: Labour[];
  salaryPayments: SalaryPayment[];
  rateListNames: string[];
  itemsMap: Map<string, Item>;
  customersMap: Map<string, Customer>;
  vendorsMap: Map<string, Vendor>;
  labourersMap: Map<string, Labour>;
  loading: boolean;
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => Promise<any>;
  deleteItem: (id: string) => Promise<void>;
  updateItem: (id: string, item: Partial<Omit<Item, 'id' | 'createdAt'>>) => Promise<void>;
  batchUpdateRates: (updates: { id: string; salePrice: number; rateListName: string }[]) => Promise<void>;
  updateItemStock: (id: string, newQuantity: number) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<any>;
  updateCustomer: (id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => Promise<any>;
  deleteVendor: (id: string) => Promise<void>;
  addLabour: (labour: Omit<Labour, 'id' | 'createdAt'>) => Promise<any>;
  updateLabour: (id: string, labour: Partial<Omit<Labour, 'id' | 'createdAt'>>) => Promise<void>;
  deleteLabour: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'total' | 'status'>) => Promise<void>;
  addManualSale: (sale: Omit<Sale, 'id' | 'total' | 'status' | 'items' | 'discount'> & { amount: number, description: string }) => Promise<void>;
  updateSale: (saleId: string, sale: Omit<Sale, 'id' | 'total' | 'status'>) => Promise<void>;
  postSale: (sale: Sale) => Promise<void>;
  unpostSale: (sale: Sale) => Promise<void>;
  deleteSale: (sale: Sale) => void;
  addEstimate: (estimate: Omit<Estimate, 'id' | 'date' | 'total'>) => Promise<void>;
  updateEstimate: (id: string, estimate: Omit<Estimate, 'id' | 'date' | 'total'>) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  createSaleFromEstimate: (estimate: Estimate) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  deleteExpense: (expense: Expense) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<any>;
  updateTransaction: (id: string, transaction: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addSalaryPayment: (payment: Omit<SalaryPayment, 'id' | 'date'>) => Promise<void>;
  updateSalaryPayment: (paymentId: string, paymentData: Omit<SalaryPayment, 'id' | 'date'>, existingPayment: SalaryPayment) => Promise<void>;
  deleteSalaryPayment: (payment: SalaryPayment) => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

const toDate = (timestamp: any): Date | null => {
    if (!timestamp) {
        return null;
    }
    if (timestamp instanceof Date) {
        return timestamp;
    }
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) {
            return d;
        }
    }
    return null;
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const shouldFetch = !!user;

    const itemsCol = useMemoFirebase(() => shouldFetch ? collection(firestore, 'items') : null, [firestore, shouldFetch]);
    const customersCol = useMemoFirebase(() => shouldFetch ? collection(firestore, 'customers') : null, [firestore, shouldFetch]);
    const vendorsCol = useMemoFirebase(() => shouldFetch ? collection(firestore, 'vendors') : null, [firestore, shouldFetch]);
    const labourCol = useMemoFirebase(() => shouldFetch ? collection(firestore, 'labour') : null, [firestore, shouldFetch]);
    const salesCol = useMemoFirebase(() => shouldFetch ? query(collection(firestore, 'sales'), orderBy('date', 'desc')) : null, [firestore, shouldFetch]);
    const expensesCol = useMemoFirebase(() => shouldFetch ? query(collection(firestore, 'expenses'), orderBy('date', 'desc')) : null, [firestore, shouldFetch]);
    const transactionsCol = useMemoFirebase(() => shouldFetch ? collection(firestore, 'transactions') : null, [firestore, shouldFetch]);
    const estimatesCol = useMemoFirebase(() => shouldFetch ? query(collection(firestore, 'estimates'), orderBy('date', 'desc')) : null, [firestore, shouldFetch]);
    const salaryPaymentsCol = useMemoFirebase(() => shouldFetch ? query(collection(firestore, 'salaryPayments'), orderBy('date', 'desc')) : null, [firestore, shouldFetch]);

    const { data: itemsData, isLoading: itemsLoading } = useCollection<Item>(itemsCol);
    const { data: customersData, isLoading: customersLoading } = useCollection<Customer>(customersCol);
    const { data: vendorsData, isLoading: vendorsLoading } = useCollection<Vendor>(vendorsCol);
    const { data: labourData, isLoading: labourLoading } = useCollection<Labour>(labourCol);
    const { data: salesData, isLoading: salesLoading } = useCollection<Sale>(salesCol);
    const { data: expensesData, isLoading: expensesLoading } = useCollection<Expense>(expensesCol);
    const { data: transactionsData, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsCol);
    const { data: estimatesData, isLoading: estimatesLoading } = useCollection<Estimate>(estimatesCol);
    const { data: salaryPaymentsData, isLoading: salaryPaymentsLoading } = useCollection<SalaryPayment>(salaryPaymentsCol);

    const items = useMemo(() => itemsData?.map(item => ({ ...item, quantity: item.quantity ?? 0, createdAt: toDate(item.createdAt) as Date })) || [], [itemsData]);
    const customers = useMemo(() => customersData?.map(customer => ({ ...customer, createdAt: toDate(customer.createdAt) as Date })) || [], [customersData]);
    const vendors = useMemo(() => vendorsData?.map(vendor => ({ ...vendor, createdAt: toDate(vendor.createdAt) as Date })) || [], [vendorsData]);
    const labourers = useMemo(() => labourData?.map(labourer => ({ ...labourer, createdAt: toDate(labourer.createdAt) as Date })) || [], [labourData]);
    const sales = useMemo(() => salesData?.map(sale => ({ ...sale, date: toDate(sale.date) as Date })) || [], [salesData]);
    const expenses = useMemo(() => expensesData?.map(expense => ({ ...expense, date: toDate(expense.date) as Date })) || [], [expensesData]);
    const transactions = useMemo(() => transactionsData?.map(transaction => ({ ...transaction, date: toDate(transaction.date) as Date })) || [], [transactionsData]);
    const estimates = useMemo(() => estimatesData?.map(estimate => ({ ...estimate, date: toDate(estimate.date) as Date })) || [], [estimatesData]);
    const salaryPayments = useMemo(() => salaryPaymentsData?.map(payment => ({ ...payment, date: toDate(payment.date) as Date })) || [], [salaryPaymentsData]);

    const itemsMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
    const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const vendorsMap = useMemo(() => new Map(vendors.map(v => [v.id, v])), [vendors]);
    const labourersMap = useMemo(() => new Map(labourers.map(l => [l.id, l])), [labourers]);

    const rateListNames = useMemo(() => {
        if (!items) return [];
        const names = new Set<string>();
        items.forEach(item => {
            if (item.salePrices) {
                Object.keys(item.salePrices).forEach(name => names.add(name));
            }
        });
        return Array.from(names).sort();
    }, [items]);


    const loading = isUserLoading || itemsLoading || customersLoading || salesLoading || expensesLoading || transactionsLoading || vendorsLoading || estimatesLoading || labourLoading || salaryPaymentsLoading;

    const addItem = async (item: Omit<Item, 'id' | 'createdAt'>) => {
        if (!itemsCol) throw new Error("Items collection not available");
        const newItem = { ...item, createdAt: serverTimestamp() };
        return addDoc(itemsCol, newItem);
    };

    const deleteItem = async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        deleteDocumentNonBlocking(doc(firestore, 'items', id));
    };

    const updateItem = async (id: string, item: Partial<Omit<Item, 'id' | 'createdAt'>>) => {
        if (!user) throw new Error("User not authenticated");
        const itemRef = doc(firestore, 'items', id);
        return updateDocumentNonBlocking(itemRef, item);
    };

    const batchUpdateRates = async (updates: { id: string, salePrice: number, rateListName: string }[]) => {
        if (!user || updates.length === 0) return;
    
        const batch = writeBatch(firestore);
        updates.forEach(update => {
            if (!update.rateListName) return;
            const itemRef = doc(firestore, 'items', update.id);
            // Use dot notation to update a field in a map
            batch.update(itemRef, { [`salePrices.${update.rateListName}`]: update.salePrice });
        });
    
        await batch.commit();
    };

    const updateItemStock = async (id: string, newQuantity: number) => {
        if (!user) throw new Error("User not authenticated");
        const itemRef = doc(firestore, 'items', id);
        updateDocumentNonBlocking(itemRef, { quantity: newQuantity });
    };

    const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
        if (!customersCol) throw new Error("A required collection is not available");

        const batch = writeBatch(firestore);
        const newCustomerRef = doc(customersCol);
        const newCustomerData = { ...customer, createdAt: serverTimestamp() };
        batch.set(newCustomerRef, newCustomerData);

        if (customer.openingBalance && customer.openingBalance > 0) {
            const transactionRef = doc(collection(firestore, 'transactions'));
            const transactionData: Omit<Transaction, 'id'> = {
                description: "Opening Balance",
                amount: customer.openingBalance,
                type: customer.balanceType === 'credit' ? 'credit' : 'debit',
                category: 'Opening Balance',
                customerId: newCustomerRef.id,
                customerName: customer.customerName,
                date: serverTimestamp() as Timestamp,
            };
            batch.set(transactionRef, transactionData);
        }

        await batch.commit();
        return { ...customer, id: newCustomerRef.id, createdAt: new Date() };
    };

    const updateCustomer = async (id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
        if (!user) throw new Error("User not authenticated");
        const customerRef = doc(firestore, 'customers', id);
        updateDocumentNonBlocking(customerRef, customer);
    };
    
    const deleteCustomer = async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        deleteDocumentNonBlocking(doc(firestore, 'customers', id));
    };
    
    const addVendor = async (vendor: Omit<Vendor, 'id' | 'createdAt'>) => {
       if (!vendorsCol) throw new Error("A required collection is not available");
       
       const batch = writeBatch(firestore);
       const newVendorRef = doc(vendorsCol);
       const newVendorData = { ...vendor, createdAt: serverTimestamp() };
       batch.set(newVendorRef, newVendorData);

       if (vendor.openingBalance && vendor.openingBalance > 0) {
            const transactionRef = doc(collection(firestore, 'transactions'));
            const transactionData: Omit<Transaction, 'id'> = {
                description: "Opening Balance",
                amount: vendor.openingBalance,
                type: vendor.balanceType === 'credit' ? 'credit' : 'debit', 
                category: 'Opening Balance',
                vendorId: newVendorRef.id,
                vendorName: vendor.name,
                date: serverTimestamp() as Timestamp,
            };
            batch.set(transactionRef, transactionData);
       }
       
       await batch.commit();
       return { ...vendor, id: newVendorRef.id, createdAt: new Date() };
    };

    const deleteVendor = async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        deleteDocumentNonBlocking(doc(firestore, 'vendors', id));
    };
    
    const addLabour = async (labour: Omit<Labour, 'id' | 'createdAt'>) => {
        if (!labourCol) throw new Error("Labour collection not available");
        const newLabourer = { ...labour, createdAt: serverTimestamp() };
        const docRef = await addDoc(labourCol, newLabourer);
        return { ...newLabourer, id: docRef.id };
    };

    const updateLabour = async (id: string, labour: Partial<Omit<Labour, 'id' | 'createdAt'>>) => {
        if (!user) throw new Error("User not authenticated");
        const labourRef = doc(firestore, 'labour', id);
        updateDocumentNonBlocking(labourRef, labour);
    };

    const deleteLabour = async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        deleteDocumentNonBlocking(doc(firestore, 'labour', id));
    };


    const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<any> => {
        if (!user) throw new Error("User not authenticated");
        const colRef = collection(firestore, 'transactions');
        const transactionWithServerDate = {
            ...transaction,
            date: transaction.date || serverTimestamp()
        };
        const docRef = await addDoc(colRef, transactionWithServerDate);
        return docRef;
    };
    
    const updateTransaction = async (id: string, transaction: Partial<Omit<Transaction, 'id'>>) => {
        if (!user) throw new Error("User not authenticated");
        const transactionRef = doc(firestore, 'transactions', id);
        const dataToUpdate: Partial<Omit<Transaction, 'id'>> = { ...transaction };
        if (transaction.date) {
            dataToUpdate.date = transaction.date;
        }
        return updateDocumentNonBlocking(transactionRef, dataToUpdate);
    };

    const deleteTransaction = async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        deleteDocumentNonBlocking(doc(firestore, 'transactions', id));
    };

    const addSale = async (sale: Omit<Sale, 'id' | 'total' | 'status'>) => {
        if (!user) {
            throw new Error("User not authenticated.");
        }

        const counterRef = doc(firestore, 'counters', 'salesCounter');
        const saleCollectionRef = collection(firestore, 'sales');

        try {
            await runTransaction(firestore, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                
                let newSaleNumber;
                if (counterDoc.exists()) {
                    newSaleNumber = (counterDoc.data().currentNumber || 0) + 1;
                } else {
                    newSaleNumber = 1;
                }
    
                const newSaleId = `INV-${String(newSaleNumber).padStart(3, '0')}`;
    
                let t1Value = 0;
                let t2Value = 0;
                sale.items.forEach(item => {
                    const itemGross = (item.feet || 1) * item.price * item.quantity;
                    const itemDiscountAmount = itemGross * ((item.discount || 0) / 100);
                    const finalAmount = itemGross - itemDiscountAmount;
                    if (item.itemName.trim().toLowerCase() === 'd 29') {
                        t1Value += finalAmount;
                    } else {
                        t2Value += finalAmount;
                    }
                });
                const subtotal = t1Value + t2Value;
                const total = subtotal * (1 - (sale.discount / 100));
                const t1Amount = t1Value * (1 - (sale.discount / 100));
                const t2Amount = t2Value * (1 - (sale.discount / 100));
    
                const newSaleData: Sale = {
                    id: newSaleId,
                    ...sale,
                    total,
                    t1Amount,
                    t2Amount,
                    status: 'draft' as const,
                    date: sale.date
                };
    
                const newSaleRef = doc(saleCollectionRef, newSaleId);
                
                transaction.set(newSaleRef, { ...newSaleData, date: sale.date });
                transaction.set(counterRef, { currentNumber: newSaleNumber }, { merge: true });
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
            throw e;
        }
    };
    
    const addManualSale = async (manualSale: Omit<Sale, 'id' | 'total' | 'status' | 'items' | 'discount'> & { amount: number, description: string }) => {
        if (!user) throw new Error("User not authenticated");

        const counterRef = doc(firestore, 'counters', 'salesCounter');
        const saleCollectionRef = collection(firestore, 'sales');

        try {
            await runTransaction(firestore, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                
                let newSaleNumber;
                if (counterDoc.exists()) {
                    newSaleNumber = (counterDoc.data().currentNumber || 0) + 1;
                } else {
                    newSaleNumber = 1;
                }
    
                const newSaleId = `INV-${String(newSaleNumber).padStart(3, '0')}`;
                
                const newSaleData: Sale = {
                    id: newSaleId,
                    customerId: manualSale.customerId,
                    customerName: manualSale.customerName,
                    date: manualSale.date,
                    total: manualSale.amount,
                    status: 'posted' as const,
                    items: [{
                        itemId: 'manual',
                        itemName: manualSale.description,
                        quantity: 1,
                        price: manualSale.amount,
                        color: '',
                        thickness: ''
                    }] as SaleItem[],
                    discount: 0,
                    t1Amount: 0,
                    t2Amount: manualSale.amount,
                };
    
                const newSaleRef = doc(saleCollectionRef, newSaleId);
                transaction.set(newSaleRef, newSaleData);
                transaction.set(counterRef, { currentNumber: newSaleNumber }, { merge: true });

                const newTransactionRef = doc(collection(firestore, 'transactions'));
                const transactionData: Omit<Transaction, 'id'> = {
                    description: manualSale.description, // Correctly includes the description
                    amount: newSaleData.total,
                    type: 'debit',
                    category: 'Sale',
                    customerId: newSaleData.customerId,
                    customerName: newSaleData.customerName,
                    date: newSaleData.date,
                };
                transaction.set(newTransactionRef, transactionData);
            });
        } catch (e) {
            console.error("Manual sale transaction failed: ", e);
            throw e;
        }
    };


    const updateSale = async (saleId: string, sale: Omit<Sale, 'id' | 'total' | 'status'>) => {
        if (!user) throw new Error("User not authenticated");
        const saleRef = doc(firestore, 'sales', saleId);

        let t1Value = 0;
        let t2Value = 0;
        sale.items.forEach(item => {
            const itemGross = (item.feet || 1) * item.price * item.quantity;
            const itemDiscountAmount = itemGross * ((item.discount || 0) / 100);
            const finalAmount = itemGross - itemDiscountAmount;
            if (item.itemName.trim().toLowerCase() === 'd 29') {
                t1Value += finalAmount;
            } else {
                t2Value += finalAmount;
            }
        });
        const subtotal = t1Value + t2Value;
        const total = subtotal * (1 - (sale.discount / 100));
        const t1Amount = t1Value * (1 - (sale.discount / 100));
        const t2Amount = t2Value * (1 - (sale.discount / 100));
        
        const updatedSaleData = {
            ...sale,
            total,
            t1Amount,
            t2Amount,
            date: sale.date,
        };

        return updateDocumentNonBlocking(saleRef, updatedSaleData);
    };
    
    const addEstimate = async (estimate: Omit<Estimate, 'id' | 'date' | 'total'>) => {
        if (!user) throw new Error("User not authenticated");
    
        const subtotal = estimate.items.reduce((total, currentItem) => {
            const itemTotal = (currentItem.feet || 1) * currentItem.price * currentItem.quantity;
            const discountAmount = itemTotal * ((currentItem.discount || 0) / 100);
            return total + (itemTotal - discountAmount);
        }, 0);
        const overallDiscountAmount = (subtotal * (estimate.discount || 0)) / 100;
        const total = subtotal - overallDiscountAmount;
    
        const newEstimateData = {
            ...estimate,
            total,
            date: serverTimestamp(),
        };
    
        await addDoc(collection(firestore, 'estimates'), newEstimateData);
    };

    const updateEstimate = async (id: string, estimate: Omit<Estimate, 'id' | 'date' | 'total'>) => {
        if (!user) throw new Error("User not authenticated");
        const estimateRef = doc(firestore, 'estimates', id);

        const subtotal = estimate.items.reduce((total, currentItem) => {
            const itemTotal = (currentItem.feet || 1) * currentItem.price * currentItem.quantity;
            const discountAmount = itemTotal * ((currentItem.discount || 0) / 100);
            return total + (itemTotal - discountAmount);
        }, 0);
        const overallDiscountAmount = (subtotal * (estimate.discount || 0)) / 100;
        const total = subtotal - overallDiscountAmount;

        const updatedEstimateData = {
            ...estimate,
            total,
        };

        return updateDocumentNonBlocking(estimateRef, updatedEstimateData);
    };
    
    const deleteEstimate = async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        deleteDocumentNonBlocking(doc(firestore, 'estimates', id));
    };

     const createSaleFromEstimate = async (estimate: Estimate) => {
        if (!user) throw new Error("User not authenticated");

        const saleData: Omit<Sale, 'id' | 'total' | 'status'> = {
            customerId: estimate.customerId,
            customerName: estimate.customerName,
            items: estimate.items,
            discount: estimate.discount,
            date: new Date(),
            estimateId: estimate.id,
            rateListName: estimate.rateListName,
        };
        
        await addSale(saleData);
    };

    const postSale = async (sale: Sale) => {
        if (!user) throw new Error("User not authenticated");
        if (!sale || sale.status === 'posted') return;

        const batch = writeBatch(firestore);
        const saleRef = doc(firestore, 'sales', sale.id);
        
        batch.update(saleRef, { status: 'posted' });

        const transactionData: Omit<Transaction, 'id'> = {
            description: `Sale Invoice: ${sale.id}`,
            amount: sale.total,
            type: 'debit' as const,
            category: 'Sale',
            customerId: sale.customerId,
            customerName: sale.customerName,
            date: toDate(sale.date) as Date,
        };
        const transactionRef = doc(collection(firestore, 'transactions'));
        batch.set(transactionRef, transactionData);

        await batch.commit();
    };

    const unpostSale = async (sale: Sale) => {
        if (!user) throw new Error("User not authenticated");
        if (!sale) return;
    
        const batch = writeBatch(firestore);
        
        const saleRef = doc(firestore, 'sales', sale.id);
        batch.update(saleRef, { status: 'draft' });
    
        const saleDate = toDate(sale.date);
        if (!saleDate) {
            await batch.commit();
            console.warn(`Could not find transaction to delete for sale ${sale.id} due to missing date.`);
            return;
        }

        const q = query(
            collection(firestore, 'transactions'),
            where("category", "==", "Sale"),
            where("description", "==", `Sale Invoice: ${sale.id}`),
            where("customerId", "==", sale.customerId)
        );
        
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const transactionDate = toDate(doc.data().date);
                if (transactionDate && transactionDate.toDateString() === saleDate.toDateString()) {
                    batch.delete(doc.ref);
                }
            });
            await batch.commit();
        } catch (error) {
            console.error("Error during unpost operation: ", error);
        }
    };

    const deleteSale = (sale: Sale) => {
        if (!user) throw new Error("User not authenticated");
        if (!sale) return;

        (async () => {
            const batch = writeBatch(firestore);
            const saleRef = doc(firestore, "sales", sale.id);

            // If the sale is posted, find and delete the associated transaction first
            if (sale.status === "posted") {
                const q = query(
                    collection(firestore, "transactions"),
                    where("category", "==", "Sale"),
                    where("description", "==", `Sale Invoice: ${sale.id}`),
                    where("customerId", "==", sale.customerId)
                );

                try {
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((doc) => {
                        // To be safe, let's also match the date
                        const transactionDate = toDate(doc.data().date);
                        const saleDate = toDate(sale.date);
                        if (transactionDate && saleDate && transactionDate.toDateString() === saleDate.toDateString()) {
                            batch.delete(doc.ref);
                        }
                    });
                } catch (error) {
                    console.error("Error querying transactions for deletion:", error);
                }
            }
            
            // Finally, delete the sale itself
            batch.delete(saleRef);

            try {
                await batch.commit();
            } catch (error) {
                console.error("Error committing delete sale batch:", error);
            }
        })();
    };
    
    const addExpense = async (expense: Omit<Expense, 'id' | 'date'>) => {
        if (!user) throw new Error("User not authenticated");
        const vendor = vendors.find(v => v.id === expense.vendorId);
        
        const batch = writeBatch(firestore);

        const newExpense = { ...expense, date: serverTimestamp() };
        const expenseRef = doc(collection(firestore, 'expenses'));
        batch.set(expenseRef, newExpense);

        const transactionData: Omit<Transaction, 'id'> = {
            description: expense.title,
            amount: expense.amount,
            type: 'debit' as const,
            category: expense.category,
            vendorId: expense.vendorId,
            vendorName: vendor?.name,
            date: serverTimestamp() as Timestamp
        };
        const transactionRef = doc(collection(firestore, 'transactions'));
        batch.set(transactionRef, transactionData);

        await batch.commit();
    };

    const deleteExpense = async (expense: Expense) => {
        if (!user) throw new Error("User not authenticated");
        if (!expense) return;

        const batch = writeBatch(firestore);
        const expenseRef = doc(firestore, 'expenses', expense.id);
        batch.delete(expenseRef);
    
        const q = query(
            collection(firestore, "transactions"),
            where("category", "==", expense.category),
            where("description", "==", expense.title),
            where("amount", "==", expense.amount),
            where("type", "==", "debit")
        );
        
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch(error) {
            console.error("Error deleting related transaction for expense:", error);
        }
    };
    
    const addSalaryPayment = async (payment: Omit<SalaryPayment, 'id' | 'date'>) => {
        if (!user) throw new Error("User not authenticated");

        const batch = writeBatch(firestore);
        
        const newPaymentRef = doc(collection(firestore, 'salaryPayments'));
        
        const expenseRef = doc(collection(firestore, 'expenses'));
        const expenseData: Omit<Expense, 'id'> = {
            title: `Salary for ${payment.month} ${payment.year}`,
            amount: payment.totalAmountPaid,
            category: 'Salary',
            date: serverTimestamp() as Timestamp,
        };
        batch.set(expenseRef, expenseData);
        
        const newPaymentData = { ...payment, date: serverTimestamp(), expenseId: expenseRef.id };
        batch.set(newPaymentRef, newPaymentData);
        
        const transactionRef = doc(collection(firestore, 'transactions'));
        const transactionData: Omit<Transaction, 'id'> = {
            description: `Salary payment for ${payment.month} ${payment.year}`,
            amount: payment.totalAmountPaid,
            type: 'debit',
            category: 'Salary',
            date: serverTimestamp() as Timestamp,
        };
        batch.set(transactionRef, transactionData);
        
        await batch.commit();
    };

    const updateSalaryPayment = async (paymentId: string, paymentData: Omit<SalaryPayment, 'id' | 'date'>, existingPayment: SalaryPayment) => {
        if (!user) throw new Error("User not authenticated");
        
        const batch = writeBatch(firestore);
        
        const paymentRef = doc(firestore, 'salaryPayments', paymentId);
        batch.update(paymentRef, {
            ...paymentData,
            date: serverTimestamp() 
        });

        if (existingPayment.expenseId) {
            const expenseRef = doc(firestore, 'expenses', existingPayment.expenseId);
            batch.update(expenseRef, { amount: paymentData.totalAmountPaid });

            const q = query(
                collection(firestore, 'transactions'),
                where("category", "==", "Salary"),
                where("description", "==", `Salary payment for ${existingPayment.month} ${existingPayment.year}`)
            );
            
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { amount: paymentData.totalAmountPaid });
            });
        }
        
        await batch.commit();
    };


    const deleteSalaryPayment = async (payment: SalaryPayment) => {
        if (!user) throw new Error("User not authenticated");
        if (!payment) return;
    
        const batch = writeBatch(firestore);
        
        const paymentRef = doc(firestore, 'salaryPayments', payment.id);
        batch.delete(paymentRef);
    
        if (payment.expenseId) {
            const expenseRef = doc(firestore, 'expenses', payment.expenseId);
            batch.delete(expenseRef);
        }

        const q = query(
            collection(firestore, "transactions"),
            where("category", "==", "Salary"),
            where("description", "==", `Salary payment for ${payment.month} ${payment.year}`)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
    
        await batch.commit();
    };
    
    const value = {
        items, customers, sales, expenses, transactions, vendors, estimates, labourers, salaryPayments, rateListNames, loading,
        itemsMap, customersMap, vendorsMap, labourersMap,
        addItem, deleteItem, updateItem, batchUpdateRates, updateItemStock,
        addCustomer, updateCustomer, deleteCustomer,
        addVendor, deleteVendor,
        addLabour, updateLabour, deleteLabour,
        addSale, addManualSale, updateSale, postSale, unpostSale, deleteSale,
        addEstimate, updateEstimate, deleteEstimate, createSaleFromEstimate,
        addExpense, deleteExpense,
        addTransaction, updateTransaction, deleteTransaction,
        addSalaryPayment, updateSalaryPayment, deleteSalaryPayment,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

