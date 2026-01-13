
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  CreditCard,
  Package, 
  FileText, 
  Landmark,
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Bell,
  Users,
  Printer,
  Layers,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  AlertCircle,
  X,
  AlertTriangle,
  DollarSign,
  PieChart as PieChartIcon,
  ShoppingCart,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  UserPlus
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Page, JournalEntry, InventoryMaterial, FixedAsset, Customer, Supplier, ServiceProduct, Transaction } from './types';
import { BRANCHES, COA, INITIAL_MATERIALS, INITIAL_JOURNALS, INITIAL_ASSETS, CUSTOMERS, SUPPLIERS, INITIAL_SERVICES } from './constants';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<Page>(Page.DASHBOARD);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  
  // Filter States
  const [reportPeriod, setReportPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [reportMonth, setReportMonth] = useState<number>(10);
  const [reportYear, setReportYear] = useState<number>(2023);

  // Data State
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
  const [materials, setMaterials] = useState<InventoryMaterial[]>(INITIAL_MATERIALS);
  const [assets] = useState<FixedAsset[]>(INITIAL_ASSETS);
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [suppliers] = useState<Supplier[]>(SUPPLIERS);
  const [services, setServices] = useState<ServiceProduct[]>(INITIAL_SERVICES);
  const [transactions, setTransactions] = useState<Transaction[]>([]); // New Transaction State

  // Modal States
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'Pcs', stock: 0, minStock: 5, avgCost: 0 });
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    price: number;
    category: 'KILOAN' | 'SATUAN';
  }>({ name: '', price: 0, category: 'KILOAN' });

  // Sales Transaction Modal State
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesForm, setSalesForm] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    branchId: 'b1',
    paymentStatus: 'PAID' as 'PAID' | 'UNPAID', // Lunas vs Piutang
    items: [] as { serviceId: string; qty: number; price: number; total: number }[]
  });
  const [currentSalesItem, setCurrentSalesItem] = useState({ serviceId: '', qty: 1 });


  // Inventory Filter State
  const [inventoryBranchFilter, setInventoryBranchFilter] = useState<string>('all');

  // Mutation Modal State
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [selectedMaterialForMutation, setSelectedMaterialForMutation] = useState<InventoryMaterial | null>(null);
  const [mutationData, setMutationData] = useState({
    type: 'OUT' as 'IN' | 'OUT',
    qty: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // --- ACCOUNTING ENGINE ---

  const getCumulativeBalance = (accountCode: string) => {
    let balance = 0;
    const cutoffDate = reportPeriod === 'YEARLY' 
      ? new Date(reportYear, 11, 31) 
      : new Date(reportYear, reportMonth, 0);

    const filteredJournals = journals.filter(j => {
      if (selectedBranchId !== 'all' && j.branchId !== selectedBranchId) return false;
      return new Date(j.date) <= cutoffDate;
    });

    filteredJournals.forEach(j => {
      if (j.accountId === accountCode) {
        const category = COA.find(c => c.code === accountCode)?.category;
        if (category?.startsWith('ASSET') || category?.startsWith('BEBAN')) {
          balance += (j.debit - j.credit);
        } else {
          balance += (j.credit - j.debit);
        }
      }
    });
    return balance;
  };

  const getPeriodBalance = (accountCode: string) => {
    let balance = 0;
    const filteredJournals = journals.filter(j => {
      if (selectedBranchId !== 'all' && j.branchId !== selectedBranchId) return false;
      const d = new Date(j.date);
      if (reportPeriod === 'YEARLY') {
        return d.getFullYear() === reportYear;
      } else {
        return d.getFullYear() === reportYear && (d.getMonth() + 1) === reportMonth;
      }
    });
    
    filteredJournals.forEach(j => {
      if (j.accountId === accountCode) {
        const category = COA.find(c => c.code === accountCode)?.category;
        if (category === 'PENDAPATAN') {
           balance += (j.credit - j.debit);
        } else if (category?.startsWith('BEBAN')) {
           balance += (j.debit - j.credit);
        } else {
           balance += (j.debit - j.credit);
        }
      }
    });
    return balance;
  };

  const getCategoryTotal = (category: string, isCumulative: boolean = false) => {
    const accounts = COA.filter(a => a.category === category);
    let total = 0;
    accounts.forEach(acc => {
      total += isCumulative ? getCumulativeBalance(acc.code) : getPeriodBalance(acc.code);
    });
    return total;
  };

  // --- HANDLERS ---
  const handleAddMaterial = () => {
      const material: InventoryMaterial = {
          id: `m-${Date.now()}`,
          branchId: inventoryBranchFilter === 'all' ? 'b1' : inventoryBranchFilter,
          name: newMaterial.name,
          unit: newMaterial.unit,
          stock: Number(newMaterial.stock),
          minStock: Number(newMaterial.minStock),
          avgCost: Number(newMaterial.avgCost)
      };
      setMaterials([...materials, material]);
      setShowMaterialModal(false);
      setNewMaterial({ name: '', unit: 'Pcs', stock: 0, minStock: 5, avgCost: 0 });
  };

  const handleAddProduct = () => {
      const product: ServiceProduct = {
          id: `s-${Date.now()}`,
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          recipe: []
      };
      setServices([...services, product]);
      setShowProductModal(false);
      setNewProduct({ name: '', price: 0, category: 'KILOAN' });
  };

  const handleOpenMutationModal = (material: InventoryMaterial) => {
    setSelectedMaterialForMutation(material);
    setMutationData({
      type: 'OUT',
      qty: 1,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setShowMutationModal(true);
  };

  const handleSaveMutation = () => {
    if (!selectedMaterialForMutation) return;
    
    const qty = Number(mutationData.qty);
    const totalValue = qty * selectedMaterialForMutation.avgCost;
    const branchId = selectedMaterialForMutation.branchId;
    const txId = `MUT/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

    const updatedMaterials = materials.map(m => {
      if (m.id === selectedMaterialForMutation.id) {
        return {
          ...m,
          stock: mutationData.type === 'IN' ? m.stock + qty : m.stock - qty
        };
      }
      return m;
    });
    setMaterials(updatedMaterials);
    
    const newJournals: JournalEntry[] = [];
    if (mutationData.type === 'IN') {
       newJournals.push({
         id: `j-${Date.now()}-1`, transactionId: txId, date: mutationData.date, branchId,
         accountId: '1-300', debit: totalValue, credit: 0, description: `Restock: ${selectedMaterialForMutation.name}`
       });
       newJournals.push({
         id: `j-${Date.now()}-2`, transactionId: txId, date: mutationData.date, branchId,
         accountId: '1-100', debit: 0, credit: totalValue, description: `Pembelian: ${selectedMaterialForMutation.name}`
       });
    } else {
       newJournals.push({
         id: `j-${Date.now()}-1`, transactionId: txId, date: mutationData.date, branchId,
         accountId: '5-100', debit: totalValue, credit: 0, description: `Pemakaian: ${selectedMaterialForMutation.name} (${mutationData.description})`
       });
       newJournals.push({
         id: `j-${Date.now()}-2`, transactionId: txId, date: mutationData.date, branchId,
         accountId: '1-300', debit: 0, credit: totalValue, description: `Keluar Gudang: ${selectedMaterialForMutation.name}`
       });
    }

    setJournals([...journals, ...newJournals]);
    setShowMutationModal(false);
  };

  // --- SALES TRANSACTION HANDLERS ---
  const handleAddToSalesCart = () => {
    if (!currentSalesItem.serviceId || currentSalesItem.qty <= 0) return;
    
    const service = services.find(s => s.id === currentSalesItem.serviceId);
    if (!service) return;

    const newItem = {
      serviceId: service.id,
      qty: currentSalesItem.qty,
      price: service.price,
      total: service.price * currentSalesItem.qty
    };

    setSalesForm({
      ...salesForm,
      items: [...salesForm.items, newItem]
    });
    setCurrentSalesItem({ serviceId: '', qty: 1 });
  };

  const handleRemoveFromCart = (idx: number) => {
    const newItems = [...salesForm.items];
    newItems.splice(idx, 1);
    setSalesForm({...salesForm, items: newItems});
  };

  const handleSaveSales = () => {
    if (!salesForm.customerId || salesForm.items.length === 0) return;

    const grandTotal = salesForm.items.reduce((sum, item) => sum + item.total, 0);
    const txId = `INV/${new Date().getFullYear()}/${Date.now().toString().slice(-5)}`;
    const branchId = salesForm.branchId;

    // 1. Create Transaction Record
    const newTransaction: Transaction = {
      id: txId,
      branchId,
      date: salesForm.date,
      description: `Laundry Service - ${salesForm.items.length} items`,
      type: 'SALES',
      totalAmount: grandTotal,
      status: salesForm.paymentStatus === 'PAID' ? 'POSTED' : 'DRAFT', // Simplified status mapping
      partyId: salesForm.customerId
    };
    setTransactions([newTransaction, ...transactions]);

    // 2. Accounting Journals (Revenue & Payment)
    const newJournals: JournalEntry[] = [];
    
    // Credit Revenue
    newJournals.push({
      id: `j-${Date.now()}-rev`, transactionId: txId, date: salesForm.date, branchId,
      accountId: '4-100', debit: 0, credit: grandTotal, description: `Pendapatan Jasa: ${txId}`
    });

    // Debit Cash or Account Receivable
    if (salesForm.paymentStatus === 'PAID') {
       newJournals.push({
         id: `j-${Date.now()}-cash`, transactionId: txId, date: salesForm.date, branchId,
         accountId: '1-100', debit: grandTotal, credit: 0, description: `Penerimaan Kas: ${txId}`
       });
    } else {
       newJournals.push({
         id: `j-${Date.now()}-ar`, transactionId: txId, date: salesForm.date, branchId,
         accountId: '1-200', debit: grandTotal, credit: 0, description: `Piutang Pelanggan: ${txId}`
       });
       // Update Customer Balance
       const updatedCustomers = customers.map(c => {
         if (c.id === salesForm.customerId) {
           return { ...c, receivableBalance: c.receivableBalance + grandTotal };
         }
         return c;
       });
       setCustomers(updatedCustomers);
    }

    // 3. Inventory Deduction & COGS Journals (Auto-Recipe)
    let totalCOGS = 0;
    let updatedMaterials = [...materials];

    salesForm.items.forEach(item => {
      const service = services.find(s => s.id === item.serviceId);
      if (service && service.recipe) {
        service.recipe.forEach(ing => {
          const materialUsedQty = ing.quantity * item.qty;
          const material = updatedMaterials.find(m => m.id === ing.materialId);
          
          if (material) {
            // Calculate Cost for this portion
            const cost = materialUsedQty * material.avgCost;
            totalCOGS += cost;

            // Deduct Stock
            updatedMaterials = updatedMaterials.map(m => {
              if (m.id === material.id) {
                return { ...m, stock: m.stock - materialUsedQty };
              }
              return m;
            });
          }
        });
      }
    });

    setMaterials(updatedMaterials);

    // Record COGS Journal if there is any cost
    if (totalCOGS > 0) {
      newJournals.push({
        id: `j-${Date.now()}-cogs`, transactionId: txId, date: salesForm.date, branchId,
        accountId: '5-100', debit: totalCOGS, credit: 0, description: `HPP Jasa: ${txId}`
      });
      newJournals.push({
        id: `j-${Date.now()}-inv`, transactionId: txId, date: salesForm.date, branchId,
        accountId: '1-300', debit: 0, credit: totalCOGS, description: `Pemakaian Bahan: ${txId}`
      });
    }

    setJournals([...journals, ...newJournals]);

    // Reset Form
    setShowSalesModal(false);
    setSalesForm({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      branchId: 'b1',
      paymentStatus: 'PAID',
      items: []
    });
  };

  // --- UI RENDERERS ---

  const renderSidebar = () => {
    const menus = [
      { id: Page.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      { 
        id: 'MODUL_A', label: 'Setup Data', icon: Settings, 
        subs: [
          { id: Page.SETUP_IDENTITY, label: 'Data Usaha' },
          { id: Page.SETUP_CUSTOMERS, label: 'Pelanggan' },
          { id: Page.SETUP_SUPPLIERS, label: 'Supplier' },
          { id: Page.SETUP_COA, label: 'Akun (COA)' },
          { id: Page.SETUP_ASSETS, label: 'Aset Tetap' },
        ]
      },
      {
        id: 'MODUL_B', label: 'Transaksi', icon: CreditCard,
        subs: [
          { id: Page.TRANS_SALES, label: 'Penjualan Laundry' },
          { id: Page.TRANS_PURCHASE, label: 'Pembelian Stok' },
          { id: Page.TRANS_EXPENSE, label: 'Biaya Operasional' },
        ]
      },
      {
        id: 'MODUL_C', label: 'Persediaan', icon: Package,
        subs: [
          { id: Page.INV_MATERIALS, label: 'Stok Bahan' },
          { id: Page.INV_PRODUCTS, label: 'Produk & Resep' },
        ]
      },
      {
        id: 'MODUL_D', label: 'Dokumen', icon: FileText,
        subs: [
          { id: Page.DOC_INVOICES, label: 'Faktur' },
        ]
      },
      {
        id: 'MODUL_E', label: 'Laporan', icon: Printer,
        subs: [
          { id: Page.REPORT_PROFIT_LOSS, label: 'Laba Rugi' },
          { id: Page.REPORT_BALANCE_SHEET, label: 'Neraca' },
          { id: Page.REPORT_CASH_FLOW, label: 'Arus Kas' },
        ]
      }
    ];

    return (
      <aside className="w-64 bg-white flex flex-col h-full fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-6 border-b border-slate-50">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mr-3">
            <Landmark size={18} />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">Qilo<span className="text-indigo-600">ERP</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menus.map(menu => {
            if (menu.subs) {
              const isActive = menu.subs.some(s => s.id === activeModule);
              return (
                <div key={menu.id} className="mb-2">
                  <button 
                    onClick={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <menu.icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="text-sm">{menu.label}</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${expandedMenu === menu.id ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedMenu === menu.id ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-11 pr-2 space-y-1">
                      {menu.subs.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveModule(sub.id as Page)}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeModule === sub.id ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <button
                key={menu.id}
                onClick={() => setActiveModule(menu.id as Page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeModule === menu.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <menu.icon size={20} />
                <span className="text-sm font-medium">{menu.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50">
            <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">JD</div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">John Doe</p>
                    <p className="text-[10px] text-slate-500">Super Admin</p>
                </div>
                <Settings size={14} className="text-slate-400" />
            </div>
        </div>
      </aside>
    );
  };

  // --- CONTENT RENDERERS ---

  const renderTransactionSales = () => {
    // Grand Total for Modal
    const cartTotal = salesForm.items.reduce((sum, item) => sum + item.total, 0);

    return (
      <div className="space-y-6 animate-fadeIn">
        
        {/* NEW SALES MODAL */}
        {showSalesModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingBag className="text-indigo-600" /> Transaksi Penjualan Baru
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Isi detail transaksi layanan laundry pelanggan.</p>
                </div>
                <button onClick={() => setShowSalesModal(false)} className="bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                
                {/* LEFT PANEL: INFO */}
                <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-100 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Cabang</label>
                      <div className="relative">
                        <select 
                          value={salesForm.branchId} 
                          onChange={e => setSalesForm({...salesForm, branchId: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                        >
                          {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pelanggan</label>
                       <div className="relative">
                        <select 
                          value={salesForm.customerId} 
                          onChange={e => setSalesForm({...salesForm, customerId: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                        >
                          <option value="">-- Pilih Pelanggan --</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                        </select>
                        <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                       </div>
                       <p className="text-[10px] text-indigo-600 mt-2 font-bold cursor-pointer hover:underline">+ Tambah Pelanggan Baru</p>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Transaksi</label>
                       <div className="relative">
                          <input 
                            type="date" 
                            value={salesForm.date} 
                            onChange={e => setSalesForm({...salesForm, date: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                           <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                       </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <label className="block text-xs font-bold text-indigo-800 uppercase mb-3">Metode Pembayaran</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSalesForm({...salesForm, paymentStatus: 'PAID'})}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${salesForm.paymentStatus === 'PAID' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                        >
                          Tunai / Transfer (Lunas)
                        </button>
                         <button 
                          onClick={() => setSalesForm({...salesForm, paymentStatus: 'UNPAID'})}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${salesForm.paymentStatus === 'UNPAID' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                        >
                          Piutang (Tempo)
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        {salesForm.paymentStatus === 'PAID' 
                          ? 'Pembayaran diterima langsung. Kas akan bertambah.' 
                          : 'Tagihan akan dicatat sebagai Piutang Pelanggan.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANEL: CART */}
                <div className="w-full md:w-2/3 p-6 flex flex-col">
                   {/* Add Item Form */}
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                         <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Layanan</label>
                         <div className="relative">
                            <select 
                              value={currentSalesItem.serviceId}
                              onChange={e => setCurrentSalesItem({...currentSalesItem, serviceId: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                            >
                              <option value="">Pilih Layanan...</option>
                              {services.map(s => <option key={s.id} value={s.id}>{s.name} - Rp {s.price.toLocaleString('id-ID')}/{s.category === 'KILOAN' ? 'kg' : 'pcs'}</option>)}
                            </select>
                             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                         </div>
                      </div>
                      <div className="w-24">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Qty</label>
                          <input 
                            type="number" 
                            min="1"
                            value={currentSalesItem.qty}
                            onChange={e => setCurrentSalesItem({...currentSalesItem, qty: Number(e.target.value)})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                          />
                      </div>
                      <button 
                        onClick={handleAddToSalesCart}
                        disabled={!currentSalesItem.serviceId}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + Tambah
                      </button>
                   </div>

                   {/* Cart Table */}
                   <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl bg-white mb-4">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Layanan</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3 text-right">Harga</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                          {salesForm.items.map((item, idx) => {
                            const svc = services.find(s => s.id === item.serviceId);
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-bold text-slate-700">{svc?.name}</td>
                                <td className="px-4 py-3 text-center text-slate-500">{item.qty}</td>
                                <td className="px-4 py-3 text-right text-slate-500">Rp {item.price.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-700">Rp {item.total.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => handleRemoveFromCart(idx)} className="text-rose-400 hover:text-rose-600 p-1 bg-rose-50 rounded">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {salesForm.items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                                Keranjang masih kosong. Silakan tambah layanan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                   </div>

                   {/* Summary & Action */}
                   <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl shadow-xl">
                      <div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Tagihan</p>
                        <h2 className="text-3xl font-bold tracking-tight">Rp {cartTotal.toLocaleString('id-ID')}</h2>
                      </div>
                      <button 
                        onClick={handleSaveSales}
                        disabled={salesForm.items.length === 0 || !salesForm.customerId}
                        className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircle size={18} /> Simpan Transaksi
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex justify-between items-end mb-2">
            <div>
               <h1 className="text-2xl font-bold text-slate-800">Transaksi Penjualan</h1>
               <p className="text-slate-400 text-sm mt-1">Kelola penjualan layanan laundry dan pantau status pembayaran.</p>
            </div>
            <button 
              onClick={() => setShowSalesModal(true)}
              className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
            >
              <ShoppingCart size={18}/> Buat Transaksi Baru
            </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle size={20}/></div>
                 <span className="text-xs font-bold text-slate-500 uppercase">Transaksi Hari Ini</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 pl-11">
                {transactions.filter(t => t.date === new Date().toISOString().split('T')[0]).length} Invoice
              </h3>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Wallet size={20}/></div>
                 <span className="text-xs font-bold text-slate-500 uppercase">Total Penjualan (Bulan Ini)</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 pl-11">
                Rp {transactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString('id-ID')}
              </h3>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock size={20}/></div>
                 <span className="text-xs font-bold text-slate-500 uppercase">Menunggu Pembayaran</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 pl-11">
                 {transactions.filter(t => t.status === 'DRAFT').length} Invoice
              </h3>
           </div>
        </div>

        {/* TRANSACTION LIST */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-50 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800">Riwayat Transaksi Terakhir</h3>
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 uppercase mr-2">Status:</span>
               <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                 <button className="px-3 py-1 rounded-md bg-white shadow-sm text-xs font-bold text-slate-700">Semua</button>
                 <button className="px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-600">Lunas</button>
                 <button className="px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-600">Belum Lunas</button>
               </div>
             </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">No. Invoice</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Pelanggan</th>
                    <th className="px-6 py-4">Keterangan</th>
                    <th className="px-6 py-4 text-right">Total Tagihan</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                         Belum ada transaksi penjualan yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => {
                      const custName = customers.find(c => c.id === tx.partyId)?.name || 'Umum';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-indigo-600 font-mono text-xs">{tx.id}</td>
                          <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{custName}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{tx.description}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">Rp {tx.totalAmount.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 text-center">
                            {tx.status === 'POSTED' ? (
                              <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold">LUNAS</span>
                            ) : (
                              <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-xs font-bold">BELUM LUNAS</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs">Detail</button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
      // Mock chart data for "Revenue Trend"
      const chartData = [
          { name: 'Jan', income: 15000000, expense: 8000000 },
          { name: 'Feb', income: 18000000, expense: 9500000 },
          { name: 'Mar', income: 16000000, expense: 8200000 },
          { name: 'Apr', income: 21000000, expense: 12000000 },
          { name: 'May', income: 19500000, expense: 9000000 },
          { name: 'Jun', income: 24000000, expense: 11000000 },
      ];

      return (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
            <p className="text-slate-400 text-sm mt-1">Welcome back, here is your daily breakdown.</p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <Wallet size={24} />
                    </div>
                    <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                        <TrendingUp size={12} className="mr-1" /> +12.5%
                    </span>
                </div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Pendapatan</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {getCategoryTotal('PENDAPATAN').toLocaleString('id-ID')}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                        <ShoppingBag size={24} />
                    </div>
                    <span className="flex items-center text-rose-600 text-xs font-bold bg-rose-50 px-2 py-1 rounded-full">
                        <TrendingDown size={12} className="mr-1" /> -2.4%
                    </span>
                </div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Pengeluaran</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {getCategoryTotal('BEBAN_OPERASIONAL').toLocaleString('id-ID')}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <PieChartIcon size={24} />
                    </div>
                    <span className="flex items-center text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-full">
                        <ArrowUpRight size={12} className="mr-1" /> +8.2%
                    </span>
                </div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Laba Bersih</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {(getCategoryTotal('PENDAPATAN') - getCategoryTotal('BEBAN_POKOK') - getCategoryTotal('BEBAN_OPERASIONAL')).toLocaleString('id-ID')}</h3>
            </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Landmark size={24} />
                    </div>
                     <span className="flex items-center text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-full">
                        <MoreHorizontal size={12} />
                    </span>
                </div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Aset</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {(getCategoryTotal('ASSET_LANCAR', true) + getCategoryTotal('ASSET_TETAP', true)).toLocaleString('id-ID')}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">Analisis Keuangan</h3>
                        <p className="text-sm text-slate-400">Perbandingan Pendapatan vs Pengeluaran (2023)</p>
                      </div>
                      <button className="text-indigo-600 text-sm font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">Lihat Detail</button>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `${value/1000000}M`} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                cursor={{fill: '#f8fafc'}}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar dataKey="income" name="Pendapatan" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expense" name="Pengeluaran" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>

              {/* Recent Activity / Journals */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Transaksi Terakhir</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {journals.slice(-5).reverse().map((j, idx) => (
                          <div key={idx} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className={`p-2 rounded-lg shrink-0 ${j.debit > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  <FileText size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-700 truncate">{j.description}</p>
                                  <p className="text-xs text-slate-400">{j.date} • {j.transactionId}</p>
                              </div>
                              <span className={`text-sm font-bold whitespace-nowrap ${j.debit > 0 ? 'text-slate-600' : 'text-emerald-600'}`}>
                                  {j.debit > 0 ? `- Rp ${j.debit.toLocaleString('id-ID')}` : `+ Rp ${j.credit.toLocaleString('id-ID')}`}
                              </span>
                          </div>
                      ))}
                      {journals.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Belum ada transaksi.</p>}
                  </div>
                  <button className="w-full mt-4 py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors border-t border-slate-50 pt-4">
                      Lihat Semua Transaksi
                  </button>
              </div>
          </div>
        </div>
      );
  };

  const renderSetupCustomers = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Daftar Pelanggan</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola data pelanggan dan limit kredit mereka.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"><Plus size={18}/> Pelanggan Baru</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {customers.map(cust => (
          <div key={cust.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${cust.type === 'CORPORATE' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {cust.type}
              </span>
            </div>
            <h4 className="font-bold text-lg text-slate-800 mb-1">{cust.name}</h4>
            <p className="text-sm text-slate-400 mb-6 flex items-center gap-1"><CreditCard size={14}/> {cust.phone}</p>
            <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Sisa Piutang</span>
              <span className="font-bold text-slate-800">Rp {cust.receivableBalance.toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInventoryMaterials = () => {
    // Dynamic Stock Alert Logic
    const filteredMaterials = materials.filter(m => 
        inventoryBranchFilter === 'all' ? true : m.branchId === inventoryBranchFilter
    );
    const lowStockItems = filteredMaterials.filter(m => m.stock <= m.minStock);

    // Dashboard Calculations
    const totalAssetValue = filteredMaterials.reduce((sum, item) => sum + (item.stock * item.avgCost), 0);
    const topStockItems = [...filteredMaterials]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        stock: item.stock
      }));
    const stockHealthData = [
      { name: 'Stok Aman', value: filteredMaterials.length - lowStockItems.length },
      { name: 'Stok Menipis', value: lowStockItems.length }
    ];
    const COLORS = ['#10b981', '#f43f5e'];

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* ADD MATERIAL MODAL */}
        {showMaterialModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Tambah Bahan Baku</h3>
                      <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Nama Bahan</label>
                          <input type="text" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" placeholder="Contoh: Deterjen Liquid" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Unit Satuan</label>
                              <div className="relative">
                                <select value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all">
                                    <option>Liter</option>
                                    <option>Kg</option>
                                    <option>Pcs</option>
                                    <option>Meter</option>
                                    <option>Box</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Stok Awal</label>
                              <input type="number" value={newMaterial.stock} onChange={e => setNewMaterial({...newMaterial, stock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Minimum Stok</label>
                              <input type="number" value={newMaterial.minStock} onChange={e => setNewMaterial({...newMaterial, minStock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Harga Beli (Avg)</label>
                              <input type="number" value={newMaterial.avgCost} onChange={e => setNewMaterial({...newMaterial, avgCost: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                          </div>
                      </div>
                      <button onClick={handleAddMaterial} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4">Simpan Bahan</button>
                  </div>
              </div>
          </div>
        )}

        {/* MUTATION MODAL */}
        {showMutationModal && selectedMaterialForMutation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Catat Mutasi Stok</h3>
                        <p className="text-xs text-slate-400 mt-1">{selectedMaterialForMutation.name}</p>
                      </div>
                      <button onClick={() => setShowMutationModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-xl flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Stok Saat Ini</span>
                    <span className="font-mono text-xl font-bold text-indigo-700">{selectedMaterialForMutation.stock} {selectedMaterialForMutation.unit}</span>
                  </div>

                  <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                          <button 
                            onClick={() => setMutationData({...mutationData, type: 'IN'})}
                            className={`py-2.5 px-4 rounded-lg font-bold text-sm transition-all shadow-sm ${mutationData.type === 'IN' ? 'bg-white text-emerald-600' : 'bg-transparent text-slate-500 shadow-none'}`}
                          >
                            Masuk (IN)
                          </button>
                          <button 
                            onClick={() => setMutationData({...mutationData, type: 'OUT'})}
                            className={`py-2.5 px-4 rounded-lg font-bold text-sm transition-all shadow-sm ${mutationData.type === 'OUT' ? 'bg-white text-rose-600' : 'bg-transparent text-slate-500 shadow-none'}`}
                          >
                            Keluar (OUT)
                          </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5">Tanggal</label>
                              <input type="date" value={mutationData.date} onChange={e => setMutationData({...mutationData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5">Jumlah</label>
                              <input type="number" min="1" value={mutationData.qty} onChange={e => setMutationData({...mutationData, qty: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Keterangan</label>
                          <textarea rows={2} value={mutationData.description} onChange={e => setMutationData({...mutationData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: Restock bulanan..." />
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold text-slate-500">Estimasi Nilai:</span>
                        <span className="font-mono text-sm font-bold text-slate-800">
                          Rp {(mutationData.qty * selectedMaterialForMutation.avgCost).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button 
                        onClick={handleSaveMutation} 
                        disabled={mutationData.qty <= 0 || (mutationData.type === 'OUT' && mutationData.qty > selectedMaterialForMutation.stock)}
                        className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 transition-all ${
                          mutationData.qty <= 0 || (mutationData.type === 'OUT' && mutationData.qty > selectedMaterialForMutation.stock) 
                            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                            : mutationData.type === 'IN' 
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                              : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                        }`}
                      >
                        {mutationData.type === 'IN' ? 'Simpan Stok Masuk' : 'Simpan Stok Keluar'}
                      </button>
                  </div>
              </div>
          </div>
        )}

        {/* Inventory Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metric Cards - Styled to match main dashboard */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center gap-8">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign size={16}/></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Nilai Aset</p>
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800 pl-9">Rp {totalAssetValue.toLocaleString('id-ID')}</h3>
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Package size={16}/></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Item SKU</p>
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800 pl-9">{filteredMaterials.length} Item</h3>
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><AlertCircle size={16}/></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Perlu Restock</p>
                   </div>
                   <h3 className={`text-2xl font-bold pl-9 ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{lowStockItems.length} Item</h3>
                </div>
            </div>

            {/* Top 5 Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <TrendingUp size={18} className="text-indigo-600"/> Top 5 Stok Terbanyak
                </h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topStockItems} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="stock" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>

             {/* Health Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <PieChartIcon size={18} className="text-indigo-600"/> Kesehatan Stok
                </h4>
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockHealthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {stockHealthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', color: '#64748b'}} />
                    </PieChart>
                  </ResponsiveContainer>
                   {/* Center Text for Pie Chart */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                       <span className="text-3xl font-bold text-slate-800">{Math.round((stockHealthData[0].value / filteredMaterials.length) * 100)}%</span>
                       <span className="text-[10px] uppercase font-bold text-slate-400">Optimal</span>
                   </div>
                </div>
            </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-pulse-slow">
            <div className="bg-white p-2.5 rounded-xl text-rose-600 shadow-sm">
               <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-rose-800 text-sm mb-1">Peringatan Stok Menipis</h4>
              <p className="text-xs text-rose-600/80 mb-3">
                Terdapat {lowStockItems.length} item dengan stok di bawah batas minimum. Harap segera lakukan restock untuk menghindari kehabisan barang.
              </p>
            </div>
             <button className="text-xs font-bold bg-white text-rose-600 px-3 py-2 rounded-lg shadow-sm border border-rose-100 hover:bg-rose-50 transition-colors">Lihat Detail</button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Stok Bahan Baku</h3>
                <p className="text-slate-400 text-xs mt-1">Manajemen inventaris dan valuasi aset.</p>
            </div>
            <div className="flex flex-wrap gap-3">
               <div className="relative">
                 <select 
                    value={inventoryBranchFilter} 
                    onChange={(e) => setInventoryBranchFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 py-2.5 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <option value="all">🏢 Semua Cabang</option>
                    {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
               </div>
              <button 
                onClick={() => setShowMaterialModal(true)}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                <Plus size={18}/> Bahan Baru
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nama Bahan</th>
                  <th className="px-6 py-4">Cabang</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4 text-right">Harga Rata-rata</th>
                  <th className="px-6 py-4 text-center">Stok Min.</th>
                  <th className="px-6 py-4 text-right">Stok Tersedia</th>
                  <th className="px-6 py-4 text-right">Total Nilai</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredMaterials.map(mat => (
                  <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{mat.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                        <span className="bg-slate-100 px-2 py-1 rounded-md">{BRANCHES.find(b => b.id === mat.branchId)?.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{mat.unit}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600 text-xs">Rp {mat.avgCost.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-400">{mat.minStock}</td>
                    <td className="px-6 py-4 text-right">
                       <span className={`font-bold px-2 py-1 rounded-md text-xs ${mat.stock <= mat.minStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                         {mat.stock}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                        Rp {(mat.stock * mat.avgCost).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenMutationModal(mat)}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg transition-colors mx-auto"
                        title="Catat Mutasi"
                      >
                         <ArrowLeftRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMaterials.length === 0 && (
                    <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/30">
                            Tidak ada data bahan baku yang ditemukan.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryProducts = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* ADD PRODUCT MODAL */}
      {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Tambah Produk Jasa Baru</h3>
                      <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Nama Layanan</label>
                          <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Cuci Kiloan Express" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                              <select 
                                value={newProduct.category} 
                                onChange={e => setNewProduct({...newProduct, category: e.target.value as 'KILOAN' | 'SATUAN'})} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none cursor-pointer"
                              >
                                  <option value="KILOAN">Kiloan</option>
                                  <option value="SATUAN">Satuan</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Harga Jual</label>
                              <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-600">
                          Resep (BOM) dapat dikonfigurasi setelah produk dibuat.
                      </div>
                      <button onClick={handleAddProduct} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-2">Simpan Produk</button>
                  </div>
              </div>
          </div>
        )}

       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Katalog Produk</h1>
            <p className="text-slate-400 text-sm mt-1">Daftar layanan dan konfigurasi resep (BOM).</p>
        </div>
        <button 
          onClick={() => setShowProductModal(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus size={18}/> Produk Baru
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Nama Layanan</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4 text-right">Harga Jual</th>
              <th className="px-6 py-4">Bahan Baku (Resep)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {services.map(svc => (
              <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700">{svc.name}</td>
                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-500">{svc.category}</span></td>
                <td className="px-6 py-4 text-right font-mono text-slate-600">Rp {svc.price.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {svc.recipe.map((r, idx) => {
                      const matName = materials.find(m => m.id === r.materialId)?.name;
                      return (
                        <div key={idx} className="text-xs text-slate-500 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                           {matName}: <b>{r.quantity}</b>
                        </div>
                      )
                    })}
                    {svc.recipe.length === 0 && <span className="text-xs text-slate-400 italic">Belum ada resep</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* FILTER BAR GLOBAL */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
          <Filter size={18} className="text-indigo-500" />
          <span className="text-sm font-bold text-slate-700">Filter Laporan</span>
        </div>
        
        <div className="flex bg-slate-50 p-1 rounded-xl">
          <button 
            onClick={() => setReportPeriod('MONTHLY')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${reportPeriod === 'MONTHLY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Bulanan
          </button>
          <button 
            onClick={() => setReportPeriod('YEARLY')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${reportPeriod === 'YEARLY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Tahunan
          </button>
        </div>

        {reportPeriod === 'MONTHLY' && (
          <div className="relative">
            <select 
                value={reportMonth} 
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="bg-slate-50 border-none text-sm font-bold text-slate-700 py-2 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
            >
                {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        )}

        <div className="relative">
            <select 
            value={reportYear} 
            onChange={(e) => setReportYear(Number(e.target.value))}
            className="bg-slate-50 border-none text-sm font-bold text-slate-700 py-2 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
            >
            {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                <option key={y} value={y}>{y}</option>
            ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {activeModule === Page.REPORT_PROFIT_LOSS && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden max-w-4xl mx-auto animate-slideUp">
          <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
             {/* Decorative circles */}
             <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

            <h2 className="text-3xl font-bold relative z-10 tracking-tight">Laporan Laba Rugi</h2>
            <p className="opacity-70 mt-2 text-sm relative z-10 font-medium">
              Periode: {reportPeriod === 'MONTHLY' 
                ? `${new Date(0, reportMonth - 1).toLocaleString('id-ID', { month: 'long' })} ${reportYear}` 
                : `Tahun ${reportYear}`}
            </p>
          </div>
          <div className="p-10">
            <div className="space-y-3">
              <h3 className="font-bold text-indigo-600 uppercase text-xs tracking-wider border-b border-indigo-100 pb-2 mb-4">Pendapatan</h3>
              {COA.filter(a => a.category === 'PENDAPATAN').map(acc => (
                <div key={acc.code} className="flex justify-between text-sm py-1 group hover:bg-slate-50 px-2 rounded transition-colors">
                  <span className="text-slate-600 group-hover:text-slate-900">{acc.name}</span>
                  <span className="font-mono font-medium text-slate-700">{getPeriodBalance(acc.code).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-3 mt-2 border-t border-slate-100 px-2">
                <span className="text-slate-800">Total Pendapatan</span>
                <span className="text-indigo-600">{getCategoryTotal('PENDAPATAN').toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="space-y-3 mt-8">
              <h3 className="font-bold text-rose-600 uppercase text-xs tracking-wider border-b border-rose-100 pb-2 mb-4">Beban Pokok (HPP)</h3>
              {COA.filter(a => a.category === 'BEBAN_POKOK').map(acc => (
                <div key={acc.code} className="flex justify-between text-sm py-1 group hover:bg-slate-50 px-2 rounded transition-colors">
                  <span className="text-slate-600 group-hover:text-slate-900">{acc.name}</span>
                  <span className="font-mono font-medium text-slate-700">{getPeriodBalance(acc.code).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-3 mt-2 border-t border-slate-100 px-2">
                <span className="text-slate-800">Total Beban Pokok</span>
                <span className="text-rose-600">({getCategoryTotal('BEBAN_POKOK').toLocaleString('id-ID')})</span>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl my-8 flex justify-between font-bold text-lg border border-slate-100">
              <span className="text-slate-700">LABA KOTOR</span>
              <span className="text-slate-900">{(getCategoryTotal('PENDAPATAN') - getCategoryTotal('BEBAN_POKOK')).toLocaleString('id-ID')}</span>
            </div>

            <div className="space-y-3 mt-8">
              <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider border-b border-slate-100 pb-2 mb-4">Beban Operasional</h3>
              {COA.filter(a => a.category === 'BEBAN_OPERASIONAL').map(acc => (
                <div key={acc.code} className="flex justify-between text-sm py-1 group hover:bg-slate-50 px-2 rounded transition-colors">
                  <span className="text-slate-600 group-hover:text-slate-900">{acc.name}</span>
                  <span className="font-mono font-medium text-slate-700">{getPeriodBalance(acc.code).toLocaleString('id-ID')}</span>
                </div>
              ))}
               <div className="flex justify-between font-bold pt-3 mt-2 border-t border-slate-100 px-2">
                <span className="text-slate-800">Total Beban Operasional</span>
                <span className="text-slate-600">({getCategoryTotal('BEBAN_OPERASIONAL').toLocaleString('id-ID')})</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl mt-10 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-xl font-black text-emerald-800 tracking-tight">LABA BERSIH</h3>
                <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wide mt-1">Sebelum Pajak</p>
              </div>
              <span className="text-4xl font-black text-emerald-600 tracking-tight">
                Rp {(getCategoryTotal('PENDAPATAN') - getCategoryTotal('BEBAN_POKOK') - getCategoryTotal('BEBAN_OPERASIONAL')).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeModule === Page.REPORT_BALANCE_SHEET && (
         <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden max-w-4xl mx-auto animate-slideUp">
          <div className="bg-indigo-900 p-10 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <h2 className="text-3xl font-bold relative z-10 tracking-tight">Laporan Posisi Keuangan</h2>
            <p className="opacity-70 mt-2 text-sm relative z-10 font-medium">
              Per Tanggal: {reportPeriod === 'YEARLY' ? `31 Desember ${reportYear}` : `Akhir Bulan ${reportMonth}/${reportYear}`}
            </p>
          </div>
          <div className="p-10 grid grid-cols-2 gap-16">
            {/* ASSETS */}
            <div>
              <h3 className="font-black text-indigo-800 text-lg border-b-2 border-indigo-800 pb-3 mb-6">ASET</h3>
              
              <div className="mb-8">
                <h4 className="font-bold text-slate-400 text-xs uppercase mb-3 tracking-wider">Aset Lancar</h4>
                {COA.filter(a => a.category === 'ASSET_LANCAR').map(acc => (
                  <div key={acc.code} className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100 last:border-0">
                    <span className="text-slate-600">{acc.name}</span>
                    <span className="font-mono font-medium text-slate-800">{getCumulativeBalance(acc.code).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

               <div className="mb-8">
                <h4 className="font-bold text-slate-400 text-xs uppercase mb-3 tracking-wider">Aset Tetap</h4>
                {COA.filter(a => a.category === 'ASSET_TETAP').map(acc => (
                  <div key={acc.code} className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100 last:border-0">
                    <span className="text-slate-600">{acc.name}</span>
                    <span className="font-mono font-medium text-slate-800">{getCumulativeBalance(acc.code).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl font-bold flex justify-between text-indigo-900 mt-4 border border-indigo-100">
                <span>TOTAL ASET</span>
                <span>{(getCategoryTotal('ASSET_LANCAR', true) + getCategoryTotal('ASSET_TETAP', true)).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div>
               <h3 className="font-black text-slate-800 text-lg border-b-2 border-slate-800 pb-3 mb-6">KEWAJIBAN & EKUITAS</h3>
               
               <div className="mb-8">
                <h4 className="font-bold text-slate-400 text-xs uppercase mb-3 tracking-wider">Kewajiban</h4>
                {COA.filter(a => a.category === 'KEWAJIBAN').map(acc => (
                  <div key={acc.code} className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100 last:border-0">
                    <span className="text-slate-600">{acc.name}</span>
                    <span className="font-mono font-medium text-slate-800">{getCumulativeBalance(acc.code).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-slate-400 text-xs uppercase mb-3 tracking-wider">Ekuitas</h4>
                {COA.filter(a => a.category === 'EKUITAS').map(acc => (
                  <div key={acc.code} className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100 last:border-0">
                    <span className="text-slate-600">{acc.name}</span>
                    <span className="font-mono font-medium text-slate-800">{getCumulativeBalance(acc.code).toLocaleString('id-ID')}</span>
                  </div>
                ))}
                {/* Calculated Retained Earnings from P&L history to balance */}
                 <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100 text-indigo-600 font-bold bg-indigo-50/50 px-2 -mx-2 rounded">
                    <span>Laba Tahun Berjalan</span>
                    <span className="font-mono">
                      {(
                         (getCategoryTotal('ASSET_LANCAR', true) + getCategoryTotal('ASSET_TETAP', true)) - 
                         (getCategoryTotal('KEWAJIBAN', true) + getCategoryTotal('EKUITAS', true))
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl font-bold flex justify-between text-slate-900 mt-4 border border-slate-200">
                <span>TOTAL KEWAJIBAN & EKUITAS</span>
                <span>{(getCategoryTotal('ASSET_LANCAR', true) + getCategoryTotal('ASSET_TETAP', true)).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
         </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F6F8FA] text-slate-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-700">
      {renderSidebar()}
      
      <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 shrink-0 flex items-center justify-between px-8 z-10 sticky top-0 bg-[#F6F8FA]/90 backdrop-blur-md">
           {/* Breadcrumb / Title */}
           <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {activeModule === Page.DASHBOARD ? 'Dashboard' : 
                 activeModule === Page.INV_MATERIALS ? 'Inventory' :
                 activeModule === Page.TRANS_SALES ? 'Penjualan' :
                 activeModule.replace('__', ' ').replace('_', ' ')}
              </h2>
           </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Type to search..." 
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 w-64 transition-all shadow-sm"
                />
             </div>
             
             <button className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-full transition-all relative shadow-sm">
               <Bell size={20} />
               <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
             </button>
             
             <div className="h-8 w-[1px] bg-slate-300 mx-1"></div>
             
             <div className="flex items-center gap-3 pl-2">
                 <div className="text-right hidden md:block">
                     <p className="text-sm font-bold text-slate-700">John Doe</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manager</p>
                 </div>
                 <div className="w-10 h-10 bg-indigo-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                    <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" alt="Profile" />
                 </div>
             </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto pb-10">
            {activeModule === Page.DASHBOARD && renderDashboard()}
            {activeModule === Page.SETUP_CUSTOMERS && renderSetupCustomers()}
            {activeModule === Page.TRANS_SALES && renderTransactionSales()}
            {activeModule === Page.INV_PRODUCTS && renderInventoryProducts()}
            {activeModule === Page.INV_MATERIALS && renderInventoryMaterials()}
            {(activeModule.startsWith('REPORT')) && renderReports()}
            
            {/* Placeholder for other modules */}
            {!activeModule.startsWith('REPORT') && activeModule !== Page.DASHBOARD && activeModule !== Page.SETUP_CUSTOMERS && activeModule !== Page.INV_PRODUCTS && activeModule !== Page.INV_MATERIALS && activeModule !== Page.TRANS_SALES && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                   <Layers size={48} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Modul {activeModule}</h3>
                <p className="text-sm font-medium opacity-60 max-w-md text-center">
                  This module is currently under development. Please check back later for updates.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
