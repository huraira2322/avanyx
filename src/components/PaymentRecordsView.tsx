import React, { useState, useMemo } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import { PaymentRecord, SubscriptionPlanConfig } from '../types';
import { DEFAULT_SUBSCRIPTION_PLANS } from '../data/paymentPlans';
import { PlanDetailsModal } from './PlanDetailsModal';
import { useTranslation } from '../context/TranslationContext';
import {
  CreditCard, Banknote,
  Search, Printer,
  Eye, Sparkles, Zap, Wallet,
  Check, ShieldCheck, ArrowRight, Layers, DollarSign,
  Cpu, Bot, Activity, Flame, Award, TrendingUp, Lock, CheckCircle, Info
} from 'lucide-react';

export const PaymentRecordsView: React.FC = () => {
  const {
    paymentsList,
    sales,
    customerCredits,
    activeBusiness,
    openCheckoutModal,
    userProfile,
    activeSubscription,
    subscriptionPlans,
    activeUser,
    paymentsActiveTab,
    setPaymentsActiveTab,
  } = useAvanyx();
  const { t } = useTranslation();

  // Top-level View Mode
  const activeTab = paymentsActiveTab;
  const setActiveTab = setPaymentsActiveTab;

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [planBillingInterval, setPlanBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const currencySymbol = activeBusiness.currencySymbol || '$';

  const availablePlans = (subscriptionPlans && subscriptionPlans.length > 0) ? subscriptionPlans : DEFAULT_SUBSCRIPTION_PLANS;
  const [selectedDetailPlan, setSelectedDetailPlan] = useState<SubscriptionPlanConfig | null>(null);

  // Aggregate all real customer payment records across POS sales, credit settlements, and direct ledger entries
  const allPayments = useMemo<PaymentRecord[]>(() => {
    const recordsMap = new Map<string, PaymentRecord>();

    // 1. Existing direct payments
    (paymentsList || []).forEach(p => {
      recordsMap.set(p.id, p);
    });

    // 2. Real sales payments
    (sales || []).forEach(s => {
      if (s.payments && Array.isArray(s.payments) && s.payments.length > 0) {
        s.payments.forEach((p, idx) => {
          const recId = (p as any).id || `pay-sale-${s.id}-${idx}`;
          if (!recordsMap.has(recId)) {
            recordsMap.set(recId, {
              id: recId,
              businessId: s.businessId,
              orderId: s.id,
              orderNumber: s.invoiceNumber,
              customerName: s.customerName || 'Walk-in Customer',
              amount: p.amount,
              method: p.method,
              status: s.status === 'cancelled' ? 'refunded' : (s.status === 'completed' ? 'completed' : 'pending'),
              referenceNumber: p.reference || s.invoiceNumber,
              notes: s.notes || undefined,
              cashierName: s.cashierName || 'POS Register',
              createdAt: s.createdAt,
            });
          }
        });
      } else if (s.status === 'completed' && s.grandTotal > 0) {
        const recId = `pay-sale-${s.id}-direct`;
        if (!recordsMap.has(recId)) {
          recordsMap.set(recId, {
            id: recId,
            businessId: s.businessId,
            orderId: s.id,
            orderNumber: s.invoiceNumber,
            customerName: s.customerName || 'Walk-in Customer',
            amount: s.grandTotal,
            method: 'cash',
            status: 'completed',
            referenceNumber: s.invoiceNumber,
            notes: s.notes || undefined,
            cashierName: s.cashierName || 'POS Register',
            createdAt: s.createdAt,
          });
        }
      }
    });

    // 3. Real Customer Credit settlements
    (customerCredits || []).forEach(cc => {
      (cc.payments || []).forEach(p => {
        const recId = `pay-credit-${p.id}`;
        if (!recordsMap.has(recId)) {
          recordsMap.set(recId, {
            id: recId,
            businessId: cc.businessId,
            orderId: cc.id,
            orderNumber: cc.invoiceId || 'CREDIT-SETTLE',
            customerName: cc.customerName,
            amount: p.amount,
            method: (p.method || 'cash') as any,
            status: 'completed',
            referenceNumber: cc.invoiceId || `REF-${p.id}`,
            notes: 'Customer credit payment settlement',
            cashierName: 'Accounts Receivable',
            createdAt: p.date || new Date().toISOString(),
          });
        }
      });
    });

    return Array.from(recordsMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [paymentsList, sales, customerCredits]);

  // Metrics dynamically derived from real transactions
  const totalCollected = allPayments
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

  const cashVolume = allPayments
    .filter(p => p.method === 'cash' && p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

  const cardVolume = allPayments
    .filter(p => p.method === 'card' && p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

  const digitalVolume = allPayments
    .filter(p => (p.method === 'mobile_wallet' || p.method === 'bank_transfer') && p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

  const filteredPayments = allPayments.filter(p => {
    const matchesSearch =
      (p.orderNumber && p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.customerName && p.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (new Date(p.createdAt) < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(p.createdAt) > toDate) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Pending
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="avanyx-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Payments & Ledger</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              Real-Time Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Centralized register ledger for store sales transactions, POS payment methods, and cash settlements.
          </p>
        </div>
      </div>

      {/* POS LEDGER */}
      {(activeTab === 'ledger' || true) && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="avanyx-card p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                <span>TOTAL COLLECTED</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {currencySymbol}{totalCollected.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{allPayments.length} total payments processed</div>
            </div>

            <div className="avanyx-card p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                <span>CARD & EMV VOLUME</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {currencySymbol}{cardVolume.toFixed(2)}
              </div>
              <div className="text-xs text-primary/80 mt-1">
                {totalCollected > 0 ? ((cardVolume / totalCollected) * 100).toFixed(0) : 0}% of revenue
              </div>
            </div>

            <div className="avanyx-card p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                <span>CASH IN DRAWER</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {currencySymbol}{cashVolume.toFixed(2)}
              </div>
              <div className="text-xs text-emerald-600/80 mt-1">Physical cash collected</div>
            </div>

            <div className="avanyx-card p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                <span>DIGITAL & TRANSFERS</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {currencySymbol}{digitalVolume.toFixed(2)}
              </div>
              <div className="text-xs text-blue-600/80 mt-1">Wallet & bank transfers</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="avanyx-card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by invoice #, customer, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-ring"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                title="From date"
              />
              <span className="text-xs text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                title="To date"
              />

              <select
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash Only</option>
                <option value="card">Card (Visa/MC)</option>
                <option value="mobile_wallet">{t('wallet')}</option>
                <option value="bank_transfer">{t('bank')}</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>

              <button
                onClick={() => window.print()}
                className="avanyx-btn-secondary flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="avanyx-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">TRANSACTION / INVOICE</th>
                    <th className="py-3 px-4">CUSTOMER</th>
                    <th className="py-3 px-4">PAYMENT METHOD</th>
                    <th className="py-3 px-4">AMOUNT</th>
                    <th className="py-3 px-4">CASHIER</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedPayments.map((pay) => (
                    <tr
                      key={pay.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {pay.orderNumber || 'POS-DIRECT'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {pay.referenceNumber || pay.id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {pay.customerName || t('walk_in')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(pay.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium capitalize text-slate-800 dark:text-slate-200">
                          <span>{pay.method.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {currencySymbol}{pay.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {pay.cashierName || 'Register User'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(pay.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(pay)}
                          className="p-1.5 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No payment records found</p>
                        <p className="text-xs text-slate-500">Transactions processed in POS appear here automatically.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="avanyx-card p-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length} records
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white">
                  {currentPage}
                </span>
                <span className="text-xs text-slate-500">of {totalPages}</span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBSCRIPTION PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Header & Interval Switcher */}
          <div className="avanyx-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Avanyx Store Subscription Tiers</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Unlock enterprise point-of-sale features, multi-terminal sync, and dedicated intelligence bandwidth.
              </p>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
              <button
                onClick={() => setPlanBillingInterval('monthly')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  planBillingInterval === 'monthly'
                    ? 'bg-white dark:bg-[#111C30] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPlanBillingInterval('annual')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  planBillingInterval === 'annual'
                    ? 'bg-white dark:bg-[#111C30] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan, idx) => {
              const isPopular = plan.id === 'tier_pro' || plan.id === 'tier_professional' || idx === 1;
              const isCurrent = activeSubscription?.tier?.toLowerCase() === plan.name.toLowerCase() || (plan.id === 'tier_pro' && !activeSubscription?.tier);
              const price = planBillingInterval === 'annual' 
                ? (plan.annualPriceUSD ? Math.round(plan.annualPriceUSD / 12) : Math.round(plan.monthlyPriceUSD * 0.8))
                : plan.monthlyPriceUSD;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between border ${
                    isPopular
                      ? 'border-indigo-500/60 bg-gradient-to-b from-indigo-500/10 via-white dark:via-[#111C30] to-white dark:to-[#0B101D] ring-2 ring-indigo-500/30 shadow-2xl shadow-indigo-500/15'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1528] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-md">
                      ★ RECOMMENDED TIER
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      CURRENT PLAN
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {plan.id.replace('tier_', '')}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{plan.tagline}</p>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{currencySymbol}{price}</span>
                        <span className="text-xs text-slate-400 font-medium">/ month</span>
                      </div>
                      {planBillingInterval === 'annual' && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          Billed annually (Includes 20% discount)
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span><strong>{plan.tokensIncludedMonthly.toLocaleString()}</strong> Monthly AI Tokens Included</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                        <span>Up to <strong>{plan.maxWorkstations}</strong> POS Workstations</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                        <span>Up to <strong>{plan.maxSubusers}</strong> Staff & Subusers</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                        <span>Multi-currency & offline POS sync</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                        <span>Automated Cloud Backups</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailPlan(plan)}
                      className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      <span>View Full Plan Details ({Array.isArray(plan.features) ? `${plan.features.length} Features` : 'All Details'})</span>
                    </button>

                    <button
                      onClick={() => openCheckoutModal('subscriptions', plan.id)}
                      className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-98 ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          : isPopular
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
                          : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{isCurrent ? 'Manage Billing Tier' : `Upgrade to ${plan.name}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Plan Details Modal */}
          <PlanDetailsModal
            isOpen={!!selectedDetailPlan}
            onClose={() => setSelectedDetailPlan(null)}
            plan={selectedDetailPlan}
            billingInterval={planBillingInterval}
            currencySymbol={currencySymbol}
            onSelectPlan={(p) => openCheckoutModal('subscriptions', p.id)}
            isCurrentPlan={activeSubscription?.tier?.toLowerCase() === selectedDetailPlan?.name.toLowerCase()}
            selectButtonText={
              activeSubscription?.tier?.toLowerCase() === selectedDetailPlan?.name.toLowerCase()
                ? 'Current Active Tier'
                : `Upgrade to ${selectedDetailPlan?.name}`
            }
          />
        </div>
      )}

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="avanyx-card w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Payment Receipt</h2>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Paper Style */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{activeBusiness.name}</div>
                <div className="text-slate-500 text-[11px]">{activeBusiness.address}</div>
                <div className="text-slate-500 text-[11px]">Tel: {activeBusiness.phone}</div>
              </div>

              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-bold">{selectedPayment.orderNumber || 'POS-SALE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Txn Ref:</span>
                  <span>{selectedPayment.referenceNumber || selectedPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span>{selectedPayment.customerName || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <span>{selectedPayment.cashierName || 'Register 1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>
                  <span>{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-2.5">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>TOTAL PAID ({(selectedPayment?.method || '').toUpperCase()}):</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {currencySymbol}{selectedPayment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-emerald-600 mt-1">
                  <span>STATUS:</span>
                  <span className="font-bold uppercase">{selectedPayment.status}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-400 pt-1">
                Thank you for choosing {activeBusiness.name}!
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => window.print()}
                className="avanyx-btn-primary flex items-center gap-1.5 w-full justify-center cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

