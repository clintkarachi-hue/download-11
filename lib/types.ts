

export type Item = {
  id: string;
  name: string;
  category: 'Aluminium' | 'Glass' | 'Accessories';
  unit: 'Kg' | 'Feet' | 'Piece';
  purchasePrice: number;
  salePrice: number; // Default/base rate
  salePrices?: { [key: string]: number }; // For named rate lists
  color: string;
  weight?: number;
  thickness: string;
  quantity: number;
  createdAt: Date;
};

export type Customer = {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  createdAt: Date;
  openingBalance?: number;
  balanceType?: 'debit' | 'credit';
};

export type Vendor = {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  openingBalance?: number;
  balanceType?: 'debit' | 'credit';
}

export type SaleItem = {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number; // This will now be Rate
  color: string;
  weight?: number;
  thickness: string;
  feet?: number;
  discount?: number; // Item-level discount percentage
}

export type Sale = {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  date: Date;
  discount: number; // Overall discount percentage
  status: 'draft' | 'posted';
  estimateId?: string; // Link to the original estimate
  description?: string;
  showT1T2?: boolean;
  rateListName?: string;
  t1Amount?: number;
  t2Amount?: number;
};

export type Estimate = {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  date: Date;
  discount: number; // Overall discount percentage
  rateListName?: string;
  showCompanyHeader?: boolean;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: 'Labour' | 'Transport' | 'Electricity' | 'Vendor Payment' | 'Salary' | 'Other';
  date: Date;
  vendorId?: string;
};

export type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  customerId?: string;
  customerName?: string;
  vendorId?: string;
  vendorName?: string;
}

export type Labour = {
    id: string;
    name: string;
    phone: string;
    address: string;
    monthlySalary: number;
    createdAt: Date;
};

export type SalaryLabourer = {
    labourerId: string;
    labourerName: string;
    daysWorked: number;
    monthlySalary: number;
    overtimeHours: number;
    overtimeRate: number;
    deductions: number;
    allowances?: number;
    totalPayable: number;
}

export type SalaryPayment = {
    id: string;
    month: string;
    year: number;
    date: Date;
    labourers: SalaryLabourer[];
    totalAmountPaid: number;
    expenseId?: string; // Link to the corresponding expense entry
};
