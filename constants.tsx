
import { Branch, Account, JournalEntry, InventoryMaterial, ServiceProduct, FixedAsset, Customer, Supplier } from './types';

export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'Cabang Pusat (Sudirman)', location: 'Jakarta Pusat', manager: 'Andi' },
  { id: 'b2', name: 'Cabang Dago', location: 'Bandung', manager: 'Siti' },
];

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Hotel Grand Menteng', type: 'CORPORATE', phone: '021-555666', receivableBalance: 1500000 },
  { id: 'c2', name: 'Apartemen Sudirman', type: 'CORPORATE', phone: '021-777888', receivableBalance: 0 },
  { id: 'c3', name: 'Budi Santoso', type: 'INDIVIDUAL', phone: '08123456789', receivableBalance: 50000 },
];

export const SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'CV Kimia Bersih', contact: '081999888', payableBalance: 2000000 },
  { id: 'sup2', name: 'Toko Plastik Jaya', contact: '081777666', payableBalance: 0 },
];

export const COA: Account[] = [
  // ASET
  { code: '1-100', name: 'Kas & Bank', category: 'ASSET_LANCAR' },
  { code: '1-200', name: 'Piutang Usaha', category: 'ASSET_LANCAR' },
  { code: '1-300', name: 'Persediaan Bahan', category: 'ASSET_LANCAR' },
  { code: '1-400', name: 'Sewa Dibayar Dimuka', category: 'ASSET_LANCAR' },
  { code: '1-500', name: 'Aset Tetap - Peralatan', category: 'ASSET_TETAP' },
  { code: '1-510', name: 'Akumulasi Penyusutan Peralatan', category: 'ASSET_TETAP' },
  
  // KEWAJIBAN & EKUITAS
  { code: '2-100', name: 'Utang Usaha', category: 'KEWAJIBAN' },
  { code: '3-100', name: 'Modal Pemilik', category: 'EKUITAS' },
  { code: '3-200', name: 'Laba Ditahan', category: 'EKUITAS' },
  
  // PENDAPATAN
  { code: '4-100', name: 'Pendapatan Jasa Laundry', category: 'PENDAPATAN' },
  
  // BEBAN
  { code: '5-100', name: 'Beban Pokok Pendapatan (HPP)', category: 'BEBAN_POKOK' },
  { code: '6-100', name: 'Beban Gaji', category: 'BEBAN_OPERASIONAL' },
  { code: '6-200', name: 'Beban Sewa', category: 'BEBAN_OPERASIONAL' },
  { code: '6-300', name: 'Beban Listrik & Air', category: 'BEBAN_OPERASIONAL' },
  { code: '6-400', name: 'Beban Penyusutan', category: 'BEBAN_OPERASIONAL' },
  { code: '6-900', name: 'Beban Lain-lain', category: 'BEBAN_OPERASIONAL' },
];

export const INITIAL_MATERIALS: InventoryMaterial[] = [
  { id: 'm1', branchId: 'b1', name: 'Deterjen Premium Liquid', unit: 'Liter', stock: 50, avgCost: 25000, minStock: 10 },
  { id: 'm2', branchId: 'b1', name: 'Parfum Lavender', unit: 'Liter', stock: 15, avgCost: 80000, minStock: 5 },
  { id: 'm3', branchId: 'b1', name: 'Plastik Packing', unit: 'Kg', stock: 100, avgCost: 15000, minStock: 20 },
  { id: 'm4', branchId: 'b2', name: 'Deterjen Standar', unit: 'Liter', stock: 5, avgCost: 20000, minStock: 10 },
];

export const INITIAL_SERVICES: ServiceProduct[] = [
  { 
    id: 's1', name: 'Cuci Komplit (Cuci+Setrika)', price: 8000, category: 'KILOAN',
    recipe: [
      { materialId: 'm1', quantity: 0.05 }, 
      { materialId: 'm2', quantity: 0.01 }, 
      { materialId: 'm3', quantity: 0.02 }
    ] 
  },
  { 
    id: 's2', name: 'Cuci Satuan Bedcover', price: 25000, category: 'SATUAN',
    recipe: [
      { materialId: 'm1', quantity: 0.2 }, 
      { materialId: 'm2', quantity: 0.05 }, 
      { materialId: 'm3', quantity: 0.1 }
    ] 
  }
];

export const INITIAL_ASSETS: FixedAsset[] = [
  {
    id: 'a1', branchId: 'b1', name: 'Mesin Cuci LG 20kg', purchaseDate: '2023-01-10',
    purchaseCost: 15000000, usefulLifeMonths: 60, accumulatedDepreciation: 3000000, bookValue: 12000000, method: 'STRAIGHT_LINE'
  },
  {
    id: 'a2', branchId: 'b2', name: 'Mesin Pengering SpeedQueen', purchaseDate: '2023-03-15',
    purchaseCost: 25000000, usefulLifeMonths: 60, accumulatedDepreciation: 3750000, bookValue: 21250000, method: 'STRAIGHT_LINE'
  }
];

// Mock Journals covering multiple years
export const INITIAL_JOURNALS: JournalEntry[] = [
  // 2022 Data (Historical)
  { id: 'j01', transactionId: 'OP/2022/001', date: '2022-01-01', branchId: 'b1', accountId: '1-100', debit: 50000000, credit: 0, description: 'Saldo Awal' },
  { id: 'j02', transactionId: 'OP/2022/001', date: '2022-01-01', branchId: 'b1', accountId: '3-100', debit: 0, credit: 50000000, description: 'Saldo Awal' },

  // 2023 Data
  { id: 'j1', transactionId: 'INV/2023/001', date: '2023-01-01', branchId: 'b1', accountId: '1-100', debit: 10000000, credit: 0, description: 'Setoran Tambahan' },
  { id: 'j2', transactionId: 'INV/2023/001', date: '2023-01-01', branchId: 'b1', accountId: '3-100', debit: 0, credit: 10000000, description: 'Setoran Tambahan' },
  
  { id: 'j3', transactionId: 'INV/2023/102', date: '2023-10-05', branchId: 'b1', accountId: '1-100', debit: 1500000, credit: 0, description: 'Pendapatan Laundry Harian' },
  { id: 'j4', transactionId: 'INV/2023/102', date: '2023-10-05', branchId: 'b1', accountId: '4-100', debit: 0, credit: 1500000, description: 'Pendapatan Laundry Harian' },
  
  { id: 'j5', transactionId: 'INV/2023/102', date: '2023-10-05', branchId: 'b1', accountId: '5-100', debit: 350000, credit: 0, description: 'HPP Bahan Baku' },
  { id: 'j6', transactionId: 'INV/2023/102', date: '2023-10-05', branchId: 'b1', accountId: '1-300', debit: 0, credit: 350000, description: 'HPP Bahan Baku' },

  { id: 'j7', transactionId: 'EXP/2023/088', date: '2023-10-28', branchId: 'b1', accountId: '6-300', debit: 500000, credit: 0, description: 'Bayar Listrik Oktober' },
  { id: 'j8', transactionId: 'EXP/2023/088', date: '2023-10-28', branchId: 'b1', accountId: '1-100', debit: 0, credit: 500000, description: 'Bayar Listrik Oktober' },
  
  // 2024 Data (Current Year)
  { id: 'j9', transactionId: 'INV/2024/001', date: '2024-01-15', branchId: 'b2', accountId: '1-200', debit: 2500000, credit: 0, description: 'Tagihan Hotel Grand Menteng' },
  { id: 'j10', transactionId: 'INV/2024/001', date: '2024-01-15', branchId: 'b2', accountId: '4-100', debit: 0, credit: 2500000, description: 'Tagihan Hotel Grand Menteng' },
];
