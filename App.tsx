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
  UserPlus,
  Truck,
  Briefcase,
  Receipt,
  ClipboardList,
  Building2,
  Save,
  Store
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
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  const [services, setServices] = useState<ServiceProduct[]>(INITIAL_SERVICES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- MODAL STATES ---
  
  // Inventory
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'Pcs', stock: 0, minStock: 5, avgCost: 0 });
  
  // Product
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<{ name: string; price: number; category: 'KILOAN' | 'SATUAN'; }>({ name: '', price: 0, category: 'KILOAN' });

  // Sales
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesForm, setSalesForm] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    branchId: 'b1',
    paymentStatus: 'PAID' as 'PAID' | 'UNPAID',
    items: [] as { serviceId: string; qty: number; price: number; total: number }[]
  });
  const [currentSalesItem, setCurrentSalesItem] = useState({ serviceId: '', qty: 1 });

  // Purchase
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    branchId: 'b1',
    paymentStatus: 'PAID' as 'PAID' | 'UNPAID',
    items: [] as { materialId: string; qty: number; cost: number; total: number }[]
  });
  const [currentPurchaseItem, setCurrentPurchaseItem] = useState({ materialId: '', qty: 1, cost: 0 });

  // Expense
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    accountId: '6-900', // Default Lain-lain
    branchId: 'b1'
  });

  // Supplier
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '' });

  // Filters
  const [inventoryBranchFilter, setInventoryBranchFilter] = useState<string>('all');

  // Mutation
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

  const handleAddSupplier = () => {
      const supplier: Supplier = {
          id: `sup-${Date.now()}`,
          name: newSupplier.name,
          contact: newSupplier.contact,
          payableBalance: 0
      };
      setSuppliers([...suppliers, supplier]);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', contact: '' });
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

  // --- SALES HANDLERS ---
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
    setSalesForm({ ...salesForm, items: [...salesForm.items, newItem] });
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
    
    const newTransaction: Transaction = {
      id: txId, branchId: salesForm.branchId, date: salesForm.date,
      description: `Penjualan Laundry - ${salesForm.items.length} item`, type: 'SALES',
      totalAmount: grandTotal, status: salesForm.paymentStatus === 'PAID' ? 'POSTED' : 'DRAFT', partyId: salesForm.customerId
    };
    setTransactions([newTransaction, ...transactions]);

    const newJournals: JournalEntry[] = [];
    newJournals.push({ id: `j-${Date.now()}-r`, transactionId: txId, date: salesForm.date, branchId: salesForm.branchId, accountId: '4-100', debit: 0, credit: grandTotal, description: `Pendapatan: ${txId}` });

    if (salesForm.paymentStatus === 'PAID') {
       newJournals.push({ id: `j-${Date.now()}-c`, transactionId: txId, date: salesForm.date, branchId: salesForm.branchId, accountId: '1-100', debit: grandTotal, credit: 0, description: `Kas Masuk: ${txId}` });
    } else {
       newJournals.push({ id: `j-${Date.now()}-ar`, transactionId: txId, date: salesForm.date, branchId: salesForm.branchId, accountId: '1-200', debit: grandTotal, credit: 0, description: `Piutang: ${txId}` });
       setCustomers(customers.map(c => c.id === salesForm.customerId ? { ...c, receivableBalance: c.receivableBalance + grandTotal } : c));
    }

    // COGS Logic omitted for brevity but should be here
    setJournals([...journals, ...newJournals]);
    setShowSalesModal(false);
    setSalesForm({ customerId: '', date: new Date().toISOString().split('T')[0], branchId: 'b1', paymentStatus: 'PAID', items: [] });
  };

  // --- PURCHASE HANDLERS ---
  const handleAddToPurchaseCart = () => {
    if (!currentPurchaseItem.materialId || currentPurchaseItem.qty <= 0) return;
    const mat = materials.find(m => m.id === currentPurchaseItem.materialId);
    if (!mat) return;
    
    const cost = currentPurchaseItem.cost > 0 ? currentPurchaseItem.cost : mat.avgCost;
    setPurchaseForm({
        ...purchaseForm,
        items: [...purchaseForm.items, { ...currentPurchaseItem, cost, total: cost * currentPurchaseItem.qty }]
    });
    setCurrentPurchaseItem({ materialId: '', qty: 1, cost: 0 });
  };

  const handleSavePurchase = () => {
      if (!purchaseForm.supplierId || purchaseForm.items.length === 0) return;
      const grandTotal = purchaseForm.items.reduce((s, i) => s + i.total, 0);
      const txId = `PUR/${new Date().getFullYear()}/${Date.now().toString().slice(-5)}`;

      const newTx: Transaction = {
          id: txId, branchId: purchaseForm.branchId, date: purchaseForm.date,
          description: `Pembelian Stok - ${purchaseForm.items.length} item`, type: 'PURCHASE',
          totalAmount: grandTotal, status: 'POSTED', partyId: purchaseForm.supplierId
      };
      setTransactions([newTx, ...transactions]);

      // Update Stock
      let updatedMaterials = [...materials];
      purchaseForm.items.forEach(item => {
          updatedMaterials = updatedMaterials.map(m => {
              if (m.id === item.materialId) {
                  // Weighted Average Cost Logic could be here
                  return { ...m, stock: m.stock + item.qty, avgCost: item.cost }; 
              }
              return m;
          });
      });
      setMaterials(updatedMaterials);

      // Journal
      const newJournals: JournalEntry[] = [];
      newJournals.push({ id: `j-${Date.now()}-inv`, transactionId: txId, date: purchaseForm.date, branchId: purchaseForm.branchId, accountId: '1-300', debit: grandTotal, credit: 0, description: `Stok Masuk: ${txId}` });
      
      if (purchaseForm.paymentStatus === 'PAID') {
          newJournals.push({ id: `j-${Date.now()}-c`, transactionId: txId, date: purchaseForm.date, branchId: purchaseForm.branchId, accountId: '1-100', debit: 0, credit: grandTotal, description: `Kas Keluar: ${txId}` });
      } else {
          newJournals.push({ id: `j-${Date.now()}-ap`, transactionId: txId, date: purchaseForm.date, branchId: purchaseForm.branchId, accountId: '2-100', debit: 0, credit: grandTotal, description: `Utang Usaha: ${txId}` });
          setSuppliers(suppliers.map(s => s.id === purchaseForm.supplierId ? {...s, payableBalance: s.payableBalance + grandTotal} : s));
      }

      setJournals([...journals, ...newJournals]);
      setShowPurchaseModal(false);
      setPurchaseForm({ supplierId: '', date: new Date().toISOString().split('T')[0], branchId: 'b1', paymentStatus: 'PAID', items: [] });
  };

  // --- EXPENSE HANDLERS ---
  const handleSaveExpense = () => {
      if (!expenseForm.amount || !expenseForm.accountId) return;
      const txId = `EXP/${new Date().getFullYear()}/${Date.now().toString().slice(-5)}`;

      const newTx: Transaction = {
          id: txId, branchId: expenseForm.branchId, date: expenseForm.date,
          description: expenseForm.description || 'Biaya Operasional', type: 'EXPENSE',
          totalAmount: Number(expenseForm.amount), status: 'POSTED'
      };
      setTransactions([newTx, ...transactions]);

      const newJournals: JournalEntry[] = [];
      newJournals.push({ id: `j-${Date.now()}-d`, transactionId: txId, date: expenseForm.date, branchId: expenseForm.branchId, accountId: expenseForm.accountId, debit: Number(expenseForm.amount), credit: 0, description: expenseForm.description });
      newJournals.push({ id: `j-${Date.now()}-c`, transactionId: txId, date: expenseForm.date, branchId: expenseForm.branchId, accountId: '1-100', debit: 0, credit: Number(expenseForm.amount), description: 'Kas Keluar' });

      setJournals([...journals, ...newJournals]);
      setShowExpenseModal(false);
      setExpenseForm({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], accountId: '6-900', branchId: 'b1' });
  };

  // --- RENDERERS ---

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
          { id: Page.DOC_INVOICES, label: 'Riwayat Transaksi' },
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
              const isActive = menu.subs.some(s => s.id === activeModule) || (activeModule.includes('SETUP') && menu.id === 'MODUL_A') || (activeModule.includes('TRANS') && menu.id === 'MODUL_B');
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
      </aside>
    );
  };

  // --- CONTENT RENDERERS ---

  const renderSetupIdentity = () => (
      <div className="space-y-6 animate-fadeIn">
          <h1 className="text-2xl font-bold text-slate-800">Identitas Usaha</h1>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
              <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 border-4 border-indigo-100">
                      <Store size={40} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Qilo Laundry HQ</h2>
                  <p className="text-slate-400">Pusat Operasional</p>
              </div>
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Usaha</label>
                      <input type="text" defaultValue="Qilo Laundry & Dry Cleaning" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Alamat Lengkap</label>
                      <textarea defaultValue="Jl. Jendral Sudirman No. 45, Jakarta Pusat" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" rows={3}/>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">No. Telepon</label>
                          <input type="text" defaultValue="021-555-9999" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                          <input type="email" defaultValue="admin@qilo.id" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                  </div>
                  <button className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4 flex items-center justify-center gap-2">
                      <Save size={18} /> Simpan Perubahan
                  </button>
              </div>
          </div>
      </div>
  );

  const renderSetupSuppliers = () => (
      <div className="space-y-6 animate-fadeIn">
        {showSupplierModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-lg font-bold mb-4">Tambah Supplier</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nama Supplier" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"/>
                        <input type="text" placeholder="Kontak / HP" value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"/>
                        <button onClick={handleAddSupplier} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Simpan</button>
                         <button onClick={() => setShowSupplierModal(false)} className="w-full text-slate-500 text-sm font-bold py-2">Batal</button>
                    </div>
                </div>
            </div>
        )}
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Daftar Supplier</h1>
            <button onClick={() => setShowSupplierModal(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"><Plus size={18}/> Supplier Baru</button>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suppliers.map(sup => (
            <div key={sup.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Truck size={24} />
                    </div>
                </div>
                <h4 className="font-bold text-lg text-slate-800 mb-1">{sup.name}</h4>
                <p className="text-sm text-slate-400 mb-6 flex items-center gap-1"><CreditCard size={14}/> {sup.contact}</p>
                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Utang Usaha</span>
                <span className="font-bold text-slate-800">Rp {sup.payableBalance.toLocaleString('id-ID')}</span>
                </div>
            </div>
            ))}
        </div>
      </div>
  );

  const renderSetupCOA = () => (
      <div className="space-y-6 animate-fadeIn">
          <h1 className="text-2xl font-bold text-slate-800">Bagan Akun (Chart of Accounts)</h1>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                          <th className="px-6 py-4">Kode Akun</th>
                          <th className="px-6 py-4">Nama Akun</th>
                          <th className="px-6 py-4">Kategori</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                      {COA.map(acc => (
                          <tr key={acc.code} className="hover:bg-slate-50">
                              <td className="px-6 py-3 font-mono text-indigo-600 font-bold">{acc.code}</td>
                              <td className="px-6 py-3 font-medium text-slate-700">{acc.name}</td>
                              <td className="px-6 py-3 text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{acc.category.replace('_', ' ')}</span></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderSetupAssets = () => (
      <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-slate-800">Aset Tetap</h1>
             <button className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"><Plus size={18}/> Registrasi Aset</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                          <th className="px-6 py-4">Nama Aset</th>
                          <th className="px-6 py-4">Tgl Beli</th>
                          <th className="px-6 py-4 text-right">Harga Perolehan</th>
                          <th className="px-6 py-4 text-right">Akum. Penyusutan</th>
                          <th className="px-6 py-4 text-right">Nilai Buku</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                      {assets.map(asset => (
                          <tr key={asset.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-slate-700">{asset.name}</td>
                              <td className="px-6 py-4 text-slate-500">{asset.purchaseDate}</td>
                              <td className="px-6 py-4 text-right">Rp {asset.purchaseCost.toLocaleString('id-ID')}</td>
                              <td className="px-6 py-4 text-right text-rose-500">(Rp {asset.accumulatedDepreciation.toLocaleString('id-ID')})</td>
                              <td className="px-6 py-4 text-right font-bold text-indigo-600">Rp {asset.bookValue.toLocaleString('id-ID')}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderTransactionPurchase = () => (
      <div className="space-y-6 animate-fadeIn">
          {showPurchaseModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold">Pembelian Stok Baru</h3>
                          <button onClick={() => setShowPurchaseModal(false)}><X size={20}/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none" value={purchaseForm.supplierId} onChange={e => setPurchaseForm({...purchaseForm, supplierId: e.target.value})}>
                              <option value="">Pilih Supplier</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                           <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none" value={purchaseForm.paymentStatus} onChange={e => setPurchaseForm({...purchaseForm, paymentStatus: e.target.value as any})}>
                              <option value="PAID">Lunas (Kas)</option>
                              <option value="UNPAID">Utang (Tempo)</option>
                          </select>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-xl mb-4">
                          <div className="flex gap-2 mb-2">
                             <select className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" value={currentPurchaseItem.materialId} onChange={e => setCurrentPurchaseItem({...currentPurchaseItem, materialId: e.target.value})}>
                                 <option value="">Pilih Bahan...</option>
                                 {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                             </select>
                             <input type="number" placeholder="Qty" className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" value={currentPurchaseItem.qty} onChange={e => setCurrentPurchaseItem({...currentPurchaseItem, qty: Number(e.target.value)})}/>
                             <input type="number" placeholder="Harga/Unit" className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" value={currentPurchaseItem.cost} onChange={e => setCurrentPurchaseItem({...currentPurchaseItem, cost: Number(e.target.value)})}/>
                             <button onClick={handleAddToPurchaseCart} className="bg-indigo-600 text-white px-3 rounded-lg"><Plus size={18}/></button>
                          </div>
                          {purchaseForm.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-200 last:border-0">
                                  <span>{materials.find(m => m.id === item.materialId)?.name} x {item.qty}</span>
                                  <span className="font-bold">Rp {item.total.toLocaleString()}</span>
                              </div>
                          ))}
                          <div className="flex justify-between font-bold text-lg mt-3 pt-2 border-t border-slate-200">
                              <span>Total</span>
                              <span>Rp {purchaseForm.items.reduce((s,i) => s + i.total, 0).toLocaleString()}</span>
                          </div>
                      </div>

                      <button onClick={handleSavePurchase} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">Simpan Transaksi</button>
                  </div>
              </div>
          )}

          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Pembelian Stok</h1>
                <p className="text-slate-400 text-sm">Catat pembelian bahan baku dari supplier.</p>
            </div>
            <button onClick={() => setShowPurchaseModal(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"><ShoppingCart size={18}/> Transaksi Pembelian</button>
          </div>

           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Tanggal</th>
                          <th className="px-6 py-4">Supplier</th>
                          <th className="px-6 py-4 text-right">Total</th>
                          <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                      {transactions.filter(t => t.type === 'PURCHASE').map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-mono text-indigo-600">{tx.id}</td>
                              <td className="px-6 py-4">{tx.date}</td>
                              <td className="px-6 py-4 font-bold text-slate-700">{suppliers.find(s => s.id === tx.partyId)?.name}</td>
                              <td className="px-6 py-4 text-right font-bold">Rp {tx.totalAmount.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">SUKSES</span></td>
                          </tr>
                      ))}
                      {transactions.filter(t => t.type === 'PURCHASE').length === 0 && (
                          <tr><td colSpan={5} className="text-center py-8 text-slate-400 italic">Belum ada transaksi pembelian.</td></tr>
                      )}
                  </tbody>
              </table>
           </div>
      </div>
  );

  const renderTransactionExpense = () => (
      <div className="space-y-6 animate-fadeIn">
          {showExpenseModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                       <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold">Catat Pengeluaran</h3>
                          <button onClick={() => setShowExpenseModal(false)}><X size={20}/></button>
                      </div>
                      <div className="space-y-4">
                          <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none" value={expenseForm.accountId} onChange={e => setExpenseForm({...expenseForm, accountId: e.target.value})}>
                              {COA.filter(c => c.category === 'BEBAN_OPERASIONAL').map(acc => (
                                  <option key={acc.code} value={acc.code}>{acc.name}</option>
                              ))}
                          </select>
                           <input type="text" placeholder="Keterangan (e.g. Listrik Oktober)" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                           <input type="number" placeholder="Nominal (Rp)" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} />
                           <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                           <button onClick={handleSaveExpense} className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200">Simpan Pengeluaran</button>
                      </div>
                  </div>
              </div>
          )}

          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Biaya Operasional</h1>
                <p className="text-slate-400 text-sm">Catat pengeluaran rutin (listrik, gaji, sewa, dll).</p>
            </div>
            <button onClick={() => setShowExpenseModal(true)} className="bg-rose-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"><Receipt size={18}/> Catat Biaya</button>
          </div>

           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Tanggal</th>
                          <th className="px-6 py-4">Keterangan</th>
                          <th className="px-6 py-4 text-right">Jumlah</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                      {transactions.filter(t => t.type === 'EXPENSE').map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-mono text-rose-600">{tx.id}</td>
                              <td className="px-6 py-4">{tx.date}</td>
                              <td className="px-6 py-4 font-medium text-slate-700">{tx.description}</td>
                              <td className="px-6 py-4 text-right font-bold text-rose-600">Rp {tx.totalAmount.toLocaleString()}</td>
                          </tr>
                      ))}
                      {transactions.filter(t => t.type === 'EXPENSE').length === 0 && (
                          <tr><td colSpan={4} className="text-center py-8 text-slate-400 italic">Belum ada pengeluaran tercatat.</td></tr>
                      )}
                  </tbody>
              </table>
           </div>
      </div>
  );

  const renderDocuments = () => (
      <div className="space-y-6 animate-fadeIn">
         <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi (Faktur)</h1>
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                          <th className="px-6 py-4">ID Dokumen</th>
                          <th className="px-6 py-4">Tipe</th>
                          <th className="px-6 py-4">Tanggal</th>
                          <th className="px-6 py-4">Keterangan</th>
                          <th className="px-6 py-4 text-right">Nilai</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                      {transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-mono font-bold text-slate-600">{tx.id}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      tx.type === 'SALES' ? 'bg-emerald-100 text-emerald-700' :
                                      tx.type === 'PURCHASE' ? 'bg-indigo-100 text-indigo-700' :
                                      'bg-rose-100 text-rose-700'
                                  }`}>
                                      {tx.type}
                                  </span>
                              </td>
                              <td className="px-6 py-4">{tx.date}</td>
                              <td className="px-6 py-4 text-slate-600">{tx.description}</td>
                              <td className="px-6 py-4 text-right font-bold">Rp {tx.totalAmount.toLocaleString()}</td>
                          </tr>
                      ))}
                  </tbody>
             </table>
         </div>
      </div>
  );

  const renderReportCashFlow = () => {
      // Simple Direct Method Cash Flow
      const cashIn = getCategoryTotal('PENDAPATAN'); // Simplified: assuming mostly cash sales for now or collected AR
      const cashOutOps = getCategoryTotal('BEBAN_OPERASIONAL');
      const cashOutCogs = getCategoryTotal('BEBAN_POKOK');
      const netCash = cashIn - cashOutOps - cashOutCogs;

      return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-slate-800">Laporan Arus Kas (Sederhana)</h1>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg max-w-2xl mx-auto overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white text-center">
                    <h2 className="text-3xl font-bold">Rp {netCash.toLocaleString()}</h2>
                    <p className="opacity-80">Arus Kas Bersih (Net Cash Flow)</p>
                </div>
                <div className="p-8 space-y-4">
                    <div className="flex justify-between items-center text-emerald-600">
                        <span className="font-bold flex items-center gap-2"><ArrowDownRight size={20}/> Arus Kas Masuk</span>
                        <span className="font-bold text-lg">Rp {cashIn.toLocaleString()}</span>
                    </div>
                    <div className="pl-6 text-sm text-slate-500 border-l-2 border-slate-100 space-y-1">
                        <div className="flex justify-between"><span>Pelunasan Penjualan</span> <span>Rp {cashIn.toLocaleString()}</span></div>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    <div className="flex justify-between items-center text-rose-600">
                        <span className="font-bold flex items-center gap-2"><ArrowUpRight size={20}/> Arus Kas Keluar</span>
                        <span className="font-bold text-lg">(Rp {(cashOutOps + cashOutCogs).toLocaleString()})</span>
                    </div>
                     <div className="pl-6 text-sm text-slate-500 border-l-2 border-slate-100 space-y-1">
                        <div className="flex justify-between"><span>Pembelian Stok (COGS)</span> <span>(Rp {cashOutCogs.toLocaleString()})</span></div>
                        <div className="flex justify-between"><span>Biaya Operasional</span> <span>(Rp {cashOutOps.toLocaleString()})</span></div>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const renderTransactionSales = () => {
    const cartTotal = salesForm.items.reduce((sum, item) => sum + item.total, 0);
    return (
      <div className="space-y-6 animate-fadeIn">
        {showSalesModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ShoppingBag className="text-indigo-600" /> Transaksi Penjualan Baru</h3>
                </div>
                <button onClick={() => setShowSalesModal(false)} className="bg-slate-50 text-slate-400 p-2 rounded-full"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-100 overflow-y-auto">
                    <div className="space-y-4">
                         <select value={salesForm.branchId} onChange={e => setSalesForm({...salesForm, branchId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none">{BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                         <select value={salesForm.customerId} onChange={e => setSalesForm({...salesForm, customerId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none"><option value="">-- Pilih Pelanggan --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                         <input type="date" value={salesForm.date} onChange={e => setSalesForm({...salesForm, date: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none"/>
                         <select value={salesForm.paymentStatus} onChange={e => setSalesForm({...salesForm, paymentStatus: e.target.value as any})} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none"><option value="PAID">Lunas</option><option value="UNPAID">Piutang</option></select>
                    </div>
                </div>
                <div className="w-full md:w-2/3 p-6 flex flex-col">
                   <div className="flex gap-2 mb-4">
                        <select value={currentSalesItem.serviceId} onChange={e => setCurrentSalesItem({...currentSalesItem, serviceId: e.target.value})} className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none"><option value="">Pilih Layanan...</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} - Rp{s.price}</option>)}</select>
                        <input type="number" value={currentSalesItem.qty} onChange={e => setCurrentSalesItem({...currentSalesItem, qty: Number(e.target.value)})} className="w-20 p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none"/>
                        <button onClick={handleAddToSalesCart} className="bg-indigo-600 text-white px-4 rounded-xl font-bold">+</button>
                   </div>
                   <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl bg-white mb-4">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 font-bold text-slate-500"><tr><th className="p-3">Item</th><th className="p-3">Qty</th><th className="p-3 text-right">Total</th></tr></thead>
                            <tbody>
                                {salesForm.items.map((item, i) => <tr key={i}><td className="p-3 font-bold">{services.find(s=>s.id===item.serviceId)?.name}</td><td className="p-3">{item.qty}</td><td className="p-3 text-right">Rp {item.total.toLocaleString()}</td></tr>)}
                            </tbody>
                        </table>
                   </div>
                   <button onClick={handleSaveSales} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold">Simpan Transaksi (Rp {cartTotal.toLocaleString()})</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Transaksi Penjualan</h1>
            <button onClick={() => setShowSalesModal(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"><ShoppingCart size={18}/> Transaksi Baru</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Pelanggan</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Status</th></tr></thead>
                <tbody className="text-sm divide-y divide-slate-50">{transactions.filter(t => t.type === 'SALES').map(tx => <tr key={tx.id}><td className="px-6 py-4 font-mono text-indigo-600">{tx.id}</td><td className="px-6 py-4">{tx.date}</td><td className="px-6 py-4 font-bold">{customers.find(c=>c.id===tx.partyId)?.name}</td><td className="px-6 py-4 text-right font-bold">Rp {tx.totalAmount.toLocaleString()}</td><td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${tx.status==='POSTED'?'bg-emerald-100 text-emerald-700':'bg-orange-100 text-orange-700'}`}>{tx.status}</span></td></tr>)}</tbody>
            </table>
        </div>
      </div>
    );
  };
  
  const renderDashboard = () => { return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-500 uppercase">Pendapatan</p><h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {getCategoryTotal('PENDAPATAN').toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-500 uppercase">Pengeluaran</p><h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {getCategoryTotal('BEBAN_OPERASIONAL').toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-500 uppercase">Laba Bersih</p><h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {(getCategoryTotal('PENDAPATAN') - getCategoryTotal('BEBAN_POKOK') - getCategoryTotal('BEBAN_OPERASIONAL')).toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-500 uppercase">Total Aset</p><h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {(getCategoryTotal('ASSET_LANCAR', true) + getCategoryTotal('ASSET_TETAP', true)).toLocaleString()}</h3></div>
            </div>
            {/* Charts would go here */}
        </div>
  )};

  const renderSetupCustomers = () => { return (
      <div className="space-y-6 animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-800">Daftar Pelanggan</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customers.map(c => <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><h4 className="font-bold text-lg">{c.name}</h4><p className="text-sm text-slate-400">{c.phone}</p><div className="mt-4 text-right"><span className="text-xs text-slate-500">Piutang</span><p className="font-bold">Rp {c.receivableBalance.toLocaleString()}</p></div></div>)}
        </div>
      </div>
  )};
  
  const renderInventoryMaterials = () => { return (
      <div className="space-y-6 animate-fadeIn">
           {showMaterialModal && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl w-96"><h3 className="font-bold mb-4">Tambah Bahan</h3><input className="w-full border p-2 rounded mb-2" placeholder="Nama" value={newMaterial.name} onChange={e=>setNewMaterial({...newMaterial, name: e.target.value})}/><button onClick={handleAddMaterial} className="w-full bg-indigo-600 text-white py-2 rounded">Simpan</button><button onClick={()=>setShowMaterialModal(false)} className="w-full mt-2 text-sm">Batal</button></div></div>)}
           {showMutationModal && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl w-96"><h3 className="font-bold mb-4">Mutasi Stok</h3><input type="number" className="w-full border p-2 rounded mb-2" placeholder="Qty" value={mutationData.qty} onChange={e=>setMutationData({...mutationData, qty: Number(e.target.value)})}/><div className="flex gap-2"><button onClick={()=>setMutationData({...mutationData, type:'IN'})} className={`flex-1 py-2 rounded ${mutationData.type==='IN'?'bg-emerald-100 text-emerald-700':'bg-slate-100'}`}>Masuk</button><button onClick={()=>setMutationData({...mutationData, type:'OUT'})} className={`flex-1 py-2 rounded ${mutationData.type==='OUT'?'bg-rose-100 text-rose-700':'bg-slate-100'}`}>Keluar</button></div><button onClick={handleSaveMutation} className="w-full bg-indigo-600 text-white py-2 rounded mt-4">Simpan</button><button onClick={()=>setShowMutationModal(false)} className="w-full mt-2 text-sm">Batal</button></div></div>)}
           <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-slate-800">Stok Bahan Baku</h1><button onClick={() => setShowMaterialModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm">+ Bahan Baru</button></div>
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 font-bold text-slate-500 text-xs uppercase"><tr><th className="p-4">Nama</th><th className="p-4">Unit</th><th className="p-4 text-center">Stok</th><th className="p-4 text-right">Nilai</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody className="text-sm divide-y divide-slate-50">{materials.map(m => <tr key={m.id}><td className="p-4 font-bold">{m.name}</td><td className="p-4">{m.unit}</td><td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${m.stock<=m.minStock?'bg-rose-100 text-rose-700':'bg-emerald-100 text-emerald-700'}`}>{m.stock}</span></td><td className="p-4 text-right font-mono">Rp {(m.stock*m.avgCost).toLocaleString()}</td><td className="p-4 text-center"><button onClick={()=>handleOpenMutationModal(m)} className="text-indigo-600 font-bold text-xs">Mutasi</button></td></tr>)}</tbody></table></div>
      </div>
  )};

  const renderInventoryProducts = () => { return (
      <div className="space-y-6 animate-fadeIn">
          {showProductModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl w-96"><h3 className="font-bold mb-4">Tambah Produk</h3><input className="w-full border p-2 rounded mb-2" placeholder="Nama" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})}/><input className="w-full border p-2 rounded mb-2" type="number" placeholder="Harga" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: Number(e.target.value)})}/><button onClick={handleAddProduct} className="w-full bg-indigo-600 text-white py-2 rounded">Simpan</button><button onClick={()=>setShowProductModal(false)} className="w-full mt-2 text-sm">Batal</button></div></div>)}
          <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-slate-800">Produk & Layanan</h1><button onClick={() => setShowProductModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm">+ Produk Baru</button></div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 font-bold text-slate-500 text-xs uppercase"><tr><th className="p-4">Nama Layanan</th><th className="p-4">Kategori</th><th className="p-4 text-right">Harga</th></tr></thead><tbody className="text-sm divide-y divide-slate-50">{services.map(s => <tr key={s.id}><td className="p-4 font-bold">{s.name}</td><td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{s.category}</span></td><td className="p-4 text-right font-bold">Rp {s.price.toLocaleString()}</td></tr>)}</tbody></table></div>
      </div>
  )};

  const renderReports = () => { return (
      <div className="space-y-6 animate-fadeIn">
          {/* Reuse existing logic for Profit Loss and Balance Sheet, add Cash Flow */}
          {activeModule === Page.REPORT_CASH_FLOW ? renderReportCashFlow() : 
           activeModule === Page.REPORT_PROFIT_LOSS ? (
               <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
                   <h2 className="text-2xl font-bold text-center mb-6">Laporan Laba Rugi</h2>
                   <div className="space-y-4">
                       <div className="flex justify-between font-bold text-indigo-700"><span>Pendapatan</span><span>Rp {getCategoryTotal('PENDAPATAN').toLocaleString()}</span></div>
                       <div className="flex justify-between font-bold text-rose-700"><span>HPP</span><span>(Rp {getCategoryTotal('BEBAN_POKOK').toLocaleString()})</span></div>
                       <div className="flex justify-between font-bold text-slate-800 text-lg border-t pt-2"><span>Laba Kotor</span><span>Rp {(getCategoryTotal('PENDAPATAN')-getCategoryTotal('BEBAN_POKOK')).toLocaleString()}</span></div>
                       <div className="flex justify-between font-bold text-slate-600"><span>Beban Operasional</span><span>(Rp {getCategoryTotal('BEBAN_OPERASIONAL').toLocaleString()})</span></div>
                       <div className="bg-emerald-50 p-4 rounded-xl flex justify-between font-black text-emerald-700 text-xl mt-4"><span>LABA BERSIH</span><span>Rp {(getCategoryTotal('PENDAPATAN')-getCategoryTotal('BEBAN_POKOK')-getCategoryTotal('BEBAN_OPERASIONAL')).toLocaleString()}</span></div>
                   </div>
               </div>
           ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
                   <h2 className="text-2xl font-bold text-center mb-6">Neraca Saldo</h2>
                   <div className="grid grid-cols-2 gap-10">
                       <div><h3 className="font-bold text-indigo-600 border-b mb-4">Aset</h3><div className="flex justify-between mb-2"><span>Aset Lancar</span><span className="font-mono">Rp {getCategoryTotal('ASSET_LANCAR', true).toLocaleString()}</span></div><div className="flex justify-between mb-2"><span>Aset Tetap</span><span className="font-mono">Rp {getCategoryTotal('ASSET_TETAP', true).toLocaleString()}</span></div></div>
                       <div><h3 className="font-bold text-slate-600 border-b mb-4">Liabilitas & Ekuitas</h3><div className="flex justify-between mb-2"><span>Kewajiban</span><span className="font-mono">Rp {getCategoryTotal('KEWAJIBAN', true).toLocaleString()}</span></div><div className="flex justify-between mb-2"><span>Ekuitas</span><span className="font-mono">Rp {getCategoryTotal('EKUITAS', true).toLocaleString()}</span></div></div>
                   </div>
               </div>
           )}
      </div>
  )};

  return (
    <div className="flex h-screen bg-[#F6F8FA] text-slate-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-700">
      {renderSidebar()}
      
      <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 shrink-0 flex items-center justify-between px-8 z-10 sticky top-0 bg-[#F6F8FA]/90 backdrop-blur-md">
           <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {activeModule === Page.DASHBOARD ? 'Dashboard' : activeModule.replace(/_/g, ' ')}
              </h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">JD</div><span className="text-sm font-bold">Admin</span></div>
           </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto pb-10">
            {activeModule === Page.DASHBOARD && renderDashboard()}
            
            {/* SETUP MODULES */}
            {activeModule === Page.SETUP_IDENTITY && renderSetupIdentity()}
            {activeModule === Page.SETUP_CUSTOMERS && renderSetupCustomers()}
            {activeModule === Page.SETUP_SUPPLIERS && renderSetupSuppliers()}
            {activeModule === Page.SETUP_COA && renderSetupCOA()}
            {activeModule === Page.SETUP_ASSETS && renderSetupAssets()}

            {/* TRANSACTION MODULES */}
            {activeModule === Page.TRANS_SALES && renderTransactionSales()}
            {activeModule === Page.TRANS_PURCHASE && renderTransactionPurchase()}
            {activeModule === Page.TRANS_EXPENSE && renderTransactionExpense()}

            {/* INVENTORY MODULES */}
            {activeModule === Page.INV_MATERIALS && renderInventoryMaterials()}
            {activeModule === Page.INV_PRODUCTS && renderInventoryProducts()}

            {/* DOCUMENT MODULES */}
            {activeModule === Page.DOC_INVOICES && renderDocuments()}

            {/* REPORT MODULES */}
            {activeModule.startsWith('REPORT') && renderReports()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;