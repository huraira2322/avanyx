import React, { useState, useEffect, useCallback } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import { getApiUrl } from '../lib/apiConfig';
import { Wallet, Coins, RefreshCw, ArrowDownRight, ArrowUpRight, CreditCard, Sparkles, Receipt, AlertCircle } from 'lucide-react';

interface WalletData {
  userId: string;
  availableCredits: number;
  includedCredits: number;
  purchasedCredits: number;
  usedCredits: number;
  updatedAt: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  isSuspended?: boolean;
}

interface LedgerEntry {
  id: string;
  type: 'grant' | 'reservation' | 'settlement' | 'refund' | 'purchase';
  amount: number;
  modelId?: string;
  requestId?: string;
  packageId?: string;
  timestamp: string;
  previousBalance: number;
  resultingBalance: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  metadata?: any;
}

const fmt = (n: number | undefined) => (typeof n === 'number' ? n.toLocaleString() : '0');

const typeMeta: Record<string, { label: string; tone: string }> = {
  grant: { label: 'Included quota', tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  purchase: { label: 'Token purchase', tone: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' },
  refund: { label: 'Refund', tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  settlement: { label: 'AI usage', tone: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/20' },
  reservation: { label: 'Reserved', tone: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export const WalletView: React.FC = () => {
  const { activeUser, tokenPackages, openCheckoutModal, currency, aiModels } = useAvanyx();
  const [data, setData] = useState<{ wallet: WalletData | null; ledger: LedgerEntry[] }>({ wallet: null, ledger: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/credits/wallet'), {
        headers: { 'x-user-id': activeUser?.id || 'default-user' },
      });
      const json = await res.json();
      if (json.success) {
        setData({ wallet: json.wallet || null, ledger: Array.isArray(json.ledger) ? json.ledger : [] });
      } else {
        setError(json.error || 'Unable to load wallet.');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error while loading wallet.');
    } finally {
      setLoading(false);
    }
  }, [activeUser?.id]);

  useEffect(() => { load(); }, [load]);

  const w = data.wallet;
  const available = w?.availableCredits || 0;
  const used = w?.usedCredits || 0;
  const totalPurchased = (w?.purchasedCredits || 0) + (w?.includedCredits || 0);
  const pctUsed = totalPurchased > 0 ? Math.min(100, Math.round((used / totalPurchased) * 100)) : 0;

  return (
    <section className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-[#0B0E17]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1424]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">Wallet</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Manage your credits</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {tokenPackages && tokenPackages.length > 0 && (
            <button onClick={() => openCheckoutModal?.()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition">
              <CreditCard className="w-3.5 h-3.5" />
              Buy Credits
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Balance Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-[#0F1424] dark:to-slate-900 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Balance</span>
              <Coins className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-4xl font-black mb-2">{fmt(available)}</div>
            <div className="text-sm text-slate-400">credits remaining</div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Usage</span>
                <span className="text-slate-300 font-semibold">{pctUsed}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all" style={{ width: `${pctUsed}%` }} />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Used</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{fmt(used)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Included</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{fmt(w?.includedCredits)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Purchased</span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{fmt(w?.purchasedCredits)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            {(['overview', 'history'] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-md text-xs font-semibold transition capitalize ${activeTab === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              {tokenPackages && tokenPackages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Buy Credits</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tokenPackages.filter(p => p.isActive).map((pkg) => (
                      <button key={pkg.id} onClick={() => openCheckoutModal?.('tokens', pkg.id)} className="text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{pkg.name}</span>
                          {pkg.bonusTokens > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">+{pkg.bonusTokens} bonus</span>}
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{fmt(pkg.tokens)} <span className="text-sm font-medium text-slate-500">credits</span></div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">≈ ${(pkg.priceUSD || 0).toFixed(2)} USD</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Transaction History</span>
              </div>
              {loading ? (
                <div className="p-10 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : data.ledger.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">No transactions yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.ledger.slice(0, 50).map((entry) => {
                    const meta = typeMeta[entry.type] || { label: entry.type, tone: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
                    const isDebit = entry.type === 'settlement' || entry.type === 'reservation';
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{meta.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${isDebit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {isDebit ? '-' : '+'}{fmt(Math.abs(entry.amount))}
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] text-slate-400">{entry.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WalletView;