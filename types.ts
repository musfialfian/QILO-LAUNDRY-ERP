
export enum Page {
  DASHBOARD = 'DASHBOARD',
  
  // MODUL A: SETUP
  SETUP_IDENTITY = 'SETUP_IDENTITY',
  SETUP_CUSTOMERS = 'SETUP_CUSTOMERS',
  SETUP_SUPPLIERS = 'SETUP_SUPPLIERS',
  SETUP_COA = 'SETUP_COA',
  SETUP_ASSETS = 'SETUP_ASSETS',
  
  // MODUL B: TRANSAKSI
  TRANS_SALES = 'TRANS_SALES',
  TRANS_PURCHASE = 'TRANS_PURCHASE',
  TRANS_EXPENSE = 'TRANS_EXPENSE',
  TRANS_ASSET_OP = 'TRANS_ASSET_OP',
  
  // MODUL C: PERSEDIAAN
  INV_MATERIALS = 'INV_MATERIALS',
  INV_PRODUCTS = 'INV_PRODUCTS',
  
  // MODUL D: BUKTI
  DOC_INVOICES = 'DOC_INVOICES',
  
  // MODUL E: LAPORAN
  REPORT_PROFIT_LOSS = 'REPORT_PROFIT_LOSS',
  REPORT_BALANCE_SHEET = 'REPORT_BALANCE_SHEET',
  REPORT_CASH_FLOW = 'REPORT_CASH_FLOW'
}

export type AccountCategory = 
  | 'ASSET_LANCAR' 
  | 'ASSET_TETAP' 
  | 'KEWAJIBAN' 
  | 'EKUITAS' 
  | 'PENDAPATAN' 
  | 'BEBAN_POKOK' 
  | 'BEBAN_OPERASIONAL';

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
}

export interface Customer {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'CORPORATE';
  phone: string;
  receivableBalance: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  payableBalance: number;
}

// Chart of Accounts (COA)
export interface Account {
  code: string;
  name: string;
  category: AccountCategory;
  isHeader?: boolean; // For grouping in reports
}

// Double Entry Logic
export interface JournalEntry {
  id: string;
  transactionId: string; // Ref to original document
  date: string;
  branchId: string;
  accountId: string; // Ref to Account
  debit: number;
  credit: number;
  description: string;
}

export interface Transaction {
  id: string; // Document Number (e.g., INV/2023/001)
  branchId: string;
  date: string;
  description: string;
  type: 'SALES' | 'PURCHASE' | 'EXPENSE' | 'ASSET' | 'ADJUSTMENT';
  totalAmount: number;
  status: 'DRAFT' | 'POSTED';
  partyId?: string; // CustomerID or SupplierID
}

export interface InventoryMaterial {
  id: string;
  branchId: string;
  name: string;
  unit: string;
  stock: number;
  avgCost: number; // Moving Average Cost
  minStock: number;
}

export interface ServiceProduct {
  id: string;
  name: string;
  price: number;
  category: 'KILOAN' | 'SATUAN';
  recipe: {
    materialId: string;
    quantity: number; // Usage per service unit
  }[];
}

export interface FixedAsset {
  id: string;
  branchId: string;
  name: string;
  purchaseDate: string;
  purchaseCost: number;
  usefulLifeMonths: number;
  accumulatedDepreciation: number;
  bookValue: number;
  method: 'STRAIGHT_LINE' | 'DECLINING';
}

export interface FinancialReport {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  branchesPerformance: {
    branchName: string;
    revenue: number;
    expenses: number;
  }[];
}
