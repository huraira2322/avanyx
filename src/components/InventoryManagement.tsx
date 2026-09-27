import React, { useState, useEffect } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import {
  Package,
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Minus,
  Printer,
  Barcode as BarcodeIcon,
  QrCode,
  Search,
  CheckCircle2,
  X,
  Layers,
  ShieldCheck,
  Calendar,
  Clock,
  Smartphone,
  Tag,
  Check,
  Cpu
} from 'lucide-react';
import { Product } from '../types';
import { generateBarcodeSvg, generateQrMatrixSvg } from '../utils/barcodeGenerator';
import { AvanyxPricingEngine } from '../utils/pricingEngine';

interface BatchRecord {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  lotNumber?: string;
  expiryDate: string;
  manufacturingDate?: string;
  quantity: number;
  status: 'valid' | 'expiring_soon' | 'expired';
}

interface SerialRecord {
  id: string;
  productId: string;
  productName: string;
  serialNumber: string;
  imeiNumber?: string;
  warrantyMonths: number;
  status: 'in_stock' | 'sold' | 'rma_return';
  customerName?: string;
  saleDate?: string;
}

interface InventoryManagementProps {
  initialTab?: 'all' | 'low_stock' | 'labels' | 'batch_tracking' | 'serial_tracking';
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ initialTab = 'all' }) => {
  const { products, adjustStock, currency, activeBusiness } = useAvanyx();

  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'low_stock' | 'labels' | 'batch_tracking' | 'serial_tracking'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  // Stock Adjustment Modal State
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('5');
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] = useState('Stock Count Audit');

  // Printable Barcode Labels State
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<Product | null>(products[0] || null);
  const [labelCopies, setLabelCopies] = useState(12);

  // Batch Tracking State backed by persistent storage
  const [batches, setBatches] = useState<BatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`avanyx_batches_${activeBusiness.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`avanyx_batches_${activeBusiness.id}`, JSON.stringify(batches));
    } catch {}
  }, [batches, activeBusiness.id]);

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatchProductId, setNewBatchProductId] = useState(products[0]?.id || '');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newBatchExpiry, setNewBatchExpiry] = useState('');
  const [newBatchQty, setNewBatchQty] = useState('20');

  // Serial & IMEI Tracking State backed by persistent storage
  const [serials, setSerials] = useState<SerialRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`avanyx_serials_${activeBusiness.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`avanyx_serials_${activeBusiness.id}`, JSON.stringify(serials));
    } catch {}
  }, [serials, activeBusiness.id]);

  const [showAddSerialModal, setShowAddSerialModal] = useState(false);
  const [newSerialProductId, setNewSerialProductId] = useState(products[0]?.id || '');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newSerialImei, setNewSerialImei] = useState('');
  const [newSerialWarranty, setNewSerialWarranty] = useState('12');

  const lowStockProducts = products.filter((p) => !p.isService && p.stock <= (p.minStock ?? 5));

  const filteredProducts = products.filter((p) => {
    if (selectedTab === 'low_stock') return !p.isService && p.stock <= (p.minStock ?? 5);
    const q = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode ? p.barcode.includes(q) : false)
    );
  });

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    const delta = (parseInt(adjustAmount) || 0) * (adjustType === 'add' ? 1 : -1);
    adjustStock(adjustProduct.id, delta, adjustReason);
    setAdjustProduct(null);
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === newBatchProductId);
    if (!prod || !newBatchNumber.trim()) return;

    const newRecord: BatchRecord = {
      id: `batch-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      batchNumber: newBatchNumber.trim().toUpperCase(),
      expiryDate: newBatchExpiry || '2027-01-01',
      quantity: parseInt(newBatchQty) || 1,
      status: 'valid',
    };

    setBatches((prev) => [newRecord, ...prev]);
    setShowAddBatchModal(false);
    setNewBatchNumber('');
    setNewBatchExpiry('');
  };

  const handleAddSerial = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === newSerialProductId);
    if (!prod || !newSerialNumber.trim()) return;

    const newRecord: SerialRecord = {
      id: `ser-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      serialNumber: newSerialNumber.trim().toUpperCase(),
      imeiNumber: newSerialImei.trim() || undefined,
      warrantyMonths: parseInt(newSerialWarranty) || 12,
      status: 'in_stock',
    };

    setSerials((prev) => [newRecord, ...prev]);
    setShowAddSerialModal(false);
    setNewSerialNumber('');
    setNewSerialImei('');
  };

  return (
    <div id="avanyx-inventory-mgmt" className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111C30] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-[#1F2E4D] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2563EB] p-0.5 shadow-2xs">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#111C30] flex items-center justify-center text-[#2563EB] dark:text-[#06B6D4]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC]">
              Inventory & Stock Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
              Real-time valuation, low-stock alerts, batches & barcode generation for {activeBusiness.name}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] p-1.5 rounded-2xl">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedTab === 'all'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setSelectedTab('low_stock')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'low_stock'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>Low Stock ({lowStockProducts.length})</span>
          </button>
          <button
            onClick={() => setSelectedTab('batch_tracking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'batch_tracking'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>Batch & Expiry ({batches.length})</span>
          </button>
          <button
            onClick={() => setSelectedTab('serial_tracking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'serial_tracking'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Serial & IMEI ({serials.length})</span>
          </button>
          <button
            onClick={() => setSelectedTab('labels')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'labels'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <BarcodeIcon className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#06B6D4]" />
            <span>Barcode & QR Sheets</span>
          </button>
        </div>
      </div>

      {/* 1. BATCH & EXPIRY TRACKING TAB */}
      {selectedTab === 'batch_tracking' && (
        <div className="bg-white dark:bg-[#111C30] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-[#1F2E4D] shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1F2E4D]">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC]">
                Batch Numbers & Expiry Date Tracking (FEFO / FIFO)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
                Track perishable inventory batches, manufacture dates, and automatic expiration alerts
              </p>
            </div>
            <button
              onClick={() => setShowAddBatchModal(true)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Batch</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-[#0B1220] border-b border-slate-200 dark:border-[#1F2E4D] text-slate-700 dark:text-[#94A3B8] uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Batch / Lot #</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status & Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1F2E4D]">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-[#94A3B8]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No batch records registered</p>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          Click &quot;Register New Batch&quot; above to track lots, manufacture dates, and expiration cycles.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-[#152644]/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {b.batchNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {b.productName}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                        {b.quantity} units
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {b.expiryDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === 'valid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : b.status === 'expiring_soon'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {b.status === 'valid' ? 'Active & Fresh' : b.status === 'expiring_soon' ? 'Expiring Soon (FEFO)' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SERIAL & IMEI TRACKING TAB */}
      {selectedTab === 'serial_tracking' && (
        <div className="bg-white dark:bg-[#111C30] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-[#1F2E4D] shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1F2E4D]">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC]">
                Serial & IMEI Device Tracker
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
                Track individual electronics, warranty lifecycle, and post-sale service history
              </p>
            </div>
            <button
              onClick={() => setShowAddSerialModal(true)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Serial Number</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-[#0B1220] border-b border-slate-200 dark:border-[#1F2E4D] text-slate-700 dark:text-[#94A3B8] uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Serial #</th>
                  <th className="py-3 px-4">IMEI #</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Warranty</th>
                  <th className="py-3 px-4">Status & Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1F2E4D]">
                {serials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-[#94A3B8]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Cpu className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No serial or IMEI devices registered</p>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          Click &quot;Add Serial Number&quot; above to record device serial numbers, IMEI identifiers, and warranty terms.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  serials.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#152644]/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {s.serialNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {s.imeiNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {s.productName}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {s.warrantyMonths} Months
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'in_stock'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {s.status === 'in_stock' ? 'In Store Stock' : `Sold to ${s.customerName || 'Customer'}`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BARCODE & QR PRINTABLE SHEET DESIGNER */}
      {selectedTab === 'labels' && (
        <div className="bg-white dark:bg-[#111C30] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-[#1F2E4D] shadow-2xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1F2E4D]">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC]">
                Printable Barcode & QR Label Designer
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
                Generate high-density sticker sheets for thermal or A4 label paper
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedLabelProduct?.id || ''}
                onChange={(e) => {
                  const target = products.find((p) => p.id === e.target.value);
                  if (target) setSelectedLabelProduct(target);
                }}
                className="px-3.5 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] rounded-xl text-xs font-bold text-slate-800 dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-hidden"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                max="48"
                value={labelCopies}
                onChange={(e) => setLabelCopies(parseInt(e.target.value) || 1)}
                className="w-20 px-3.5 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] rounded-xl text-xs font-bold text-center text-slate-800 dark:text-[#F8FAFC] focus:border-[#2563EB] focus:outline-hidden"
              />

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sticker Sheet</span>
              </button>
            </div>
          </div>

          {selectedLabelProduct && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#0B1220] p-6 rounded-3xl border border-slate-200 dark:border-[#1F2E4D]">
              {Array.from({ length: labelCopies }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center space-y-1.5 text-black"
                >
                  <div className="text-[10px] font-bold text-neutral-900 line-clamp-1">{selectedLabelProduct.name}</div>
                  <div className="text-[11px] font-bold text-[#2563EB]">
                    {AvanyxPricingEngine.formatCurrency(selectedLabelProduct.sellingPrice, currency)}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generateBarcodeSvg(selectedLabelProduct.barcode || selectedLabelProduct.sku, 150, 28),
                    }}
                  />
                  <div className="text-[10px] text-neutral-500 font-medium">{activeBusiness.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ALL ITEMS / LOW STOCK INVENTORY TABLE */}
      {(selectedTab === 'all' || selectedTab === 'low_stock') && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter stock by name or SKU..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] text-xs text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/50 focus:border-[#2563EB] focus:outline-hidden shadow-2xs"
            />
          </div>

          <div className="bg-white dark:bg-[#111C30] rounded-3xl border border-slate-200 dark:border-[#1F2E4D] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-[#0B1220] border-b border-slate-200 dark:border-[#1F2E4D] text-slate-700 dark:text-[#94A3B8] uppercase tracking-wider font-extrabold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Item & SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Reorder Point</th>
                    <th className="py-3.5 px-4">Unit Cost</th>
                    <th className="py-3.5 px-4">Stock Valuation</th>
                    <th className="py-3.5 px-4 text-right">Quick Stock In/Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1F2E4D] font-medium text-slate-700 dark:text-[#94A3B8]">
                  {filteredProducts.map((prod) => {
                    const isLow = !prod.isService && prod.stock <= (prod.minStock || 0);
                    const val = prod.isService ? 0 : prod.stock * prod.costPrice;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-[#152644]/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm">
                            {prod.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 dark:text-[#94A3B8]/80">{prod.sku}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#152644] text-slate-800 dark:text-[#F8FAFC] font-semibold text-[11px] border border-slate-200 dark:border-[#1F2E4D]">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {prod.isService ? (
                            <span className="font-bold px-2.5 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30">
                              Bookable Service
                            </span>
                          ) : (
                            <span
                              className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                                isLow
                                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              }`}
                            >
                              {prod.stock} {prod.unit}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-[#94A3B8] font-medium">
                          {prod.isService ? '—' : `${prod.minStock} ${prod.unit}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-[#94A3B8]">
                          {prod.isService ? '—' : AvanyxPricingEngine.formatCurrency(prod.costPrice, currency)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                          {prod.isService ? '—' : AvanyxPricingEngine.formatCurrency(val, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!prod.isService && (
                            <button
                              onClick={() => {
                                setAdjustProduct(prod);
                                setAdjustType('add');
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#152644] hover:bg-[#2563EB] hover:text-white text-[#2563EB] dark:text-[#06B6D4] font-bold text-xs border border-slate-200 dark:border-[#1F2E4D] transition shadow-2xs cursor-pointer"
                            >
                              Adjust Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteAdjustment}
            className="bg-white dark:bg-[#111C30] rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-[#1F2E4D] shadow-2xl animate-in fade-in zoom-in-95 space-y-4 text-slate-800 dark:text-[#F8FAFC]"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-[#1F2E4D]">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-[#F8FAFC]">Adjust Physical Stock</h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">{adjustProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2E4A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-600 dark:text-[#94A3B8]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Stock-In (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    adjustType === 'remove'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-600 dark:text-[#94A3B8]'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> Stock-Out (Deduct)
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#94A3B8] mb-1">
                  Quantity ({adjustProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-900 dark:text-[#F8FAFC] font-mono text-sm font-bold focus:border-[#2563EB] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#94A3B8] mb-1">Reason / Note</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-[#F8FAFC] font-medium focus:border-[#2563EB] focus:outline-hidden"
                >
                  <option value="Stock Count Audit">Stock Count Audit Reconciliation</option>
                  <option value="New Supplier Shipment">New Supplier Shipment</option>
                  <option value="Damaged / Broken Goods">Damaged / Expired / Broken Goods</option>
                  <option value="Internal Store Demo">Internal Store Demo / Use</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#1F2E4D]">
              <button
                type="button"
                onClick={() => setAdjustProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E2E4A] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-2xs transition active:scale-98 cursor-pointer"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD BATCH MODAL */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddBatch}
            className="bg-white dark:bg-[#111C30] rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-[#1F2E4D] shadow-2xl space-y-4 text-slate-800 dark:text-[#F8FAFC]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1F2E4D]">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Register Product Batch</h3>
              <button
                type="button"
                onClick={() => setShowAddBatchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product *</label>
                <select
                  value={newBatchProductId}
                  onChange={(e) => setNewBatchProductId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Batch / Lot Number *</label>
                <input
                  type="text"
                  required
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  placeholder="e.g. LOT-2026-X1"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newBatchExpiry}
                    onChange={(e) => setNewBatchExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatchQty}
                    onChange={(e) => setNewBatchQty(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1F2E4D]">
              <button
                type="button"
                onClick={() => setShowAddBatchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Save Batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD SERIAL MODAL */}
      {showAddSerialModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSerial}
            className="bg-white dark:bg-[#111C30] rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-[#1F2E4D] shadow-2xl space-y-4 text-slate-800 dark:text-[#F8FAFC]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1F2E4D]">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Register Serial / IMEI Number</h3>
              <button
                type="button"
                onClick={() => setShowAddSerialModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product *</label>
                <select
                  value={newSerialProductId}
                  onChange={(e) => setNewSerialProductId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Serial Number *</label>
                <input
                  type="text"
                  required
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  placeholder="e.g. SN-89217498"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IMEI Number (Optional)</label>
                <input
                  type="text"
                  value={newSerialImei}
                  onChange={(e) => setNewSerialImei(e.target.value)}
                  placeholder="e.g. 356891094821950"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty (Months)</label>
                <input
                  type="number"
                  min="0"
                  value={newSerialWarranty}
                  onChange={(e) => setNewSerialWarranty(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-slate-800 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1F2E4D]">
              <button
                type="button"
                onClick={() => setShowAddSerialModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Save Serial
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
