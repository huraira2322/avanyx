import React, { useEffect } from 'react';
import {
  X,
  Check,
  Zap,
  Monitor,
  Users,
  Package,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SubscriptionPlanConfig } from '../types';

interface PlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlanConfig | null;
  billingInterval?: 'monthly' | 'annual';
  currencySymbol?: string;
  selectedCurrency?: string;
  onSelectPlan?: (plan: SubscriptionPlanConfig) => void;
  selectButtonText?: string;
  isCurrentPlan?: boolean;
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingInterval = 'monthly',
  currencySymbol = '$',
  selectedCurrency = 'USD',
  onSelectPlan,
  selectButtonText,
  isCurrentPlan = false,
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  const isFree = plan.monthlyPriceUSD === 0;
  
  // Calculate price dynamically based on currency and interval
  let monthlyPrice = plan.monthlyPriceUSD;
  let annualPrice = plan.annualPriceUSD;
  
  if (selectedCurrency && selectedCurrency !== 'USD' && plan.currencyPricing?.[selectedCurrency]) {
    monthlyPrice = plan.currencyPricing[selectedCurrency].monthly;
    annualPrice = plan.currencyPricing[selectedCurrency].annual;
  }

  const effectiveMonthlyRate = isFree
    ? 0
    : billingInterval === 'annual' && annualPrice > 0
    ? Math.round(annualPrice / 12)
    : monthlyPrice;

  // Resolve limits safely
  const workstations = plan.resourceLimits?.maxWorkstations ?? plan.maxWorkstations ?? 1;
  const staff = plan.resourceLimits?.maxStaff ?? plan.maxSubusers ?? 2;
  const products = plan.resourceLimits?.maxProducts ?? plan.maxProducts ?? 500;
  const aiTokens = plan.resourceLimits?.monthlyAiCredits ?? plan.tokensIncludedMonthly ?? 0;

  // Categorize / group features dynamically
  const categorizedFeatures: { [category: string]: string[] } = {};
  
  if (Array.isArray(plan.features) && plan.features.length > 0) {
    plan.features.forEach((feat) => {
      const featLower = feat.toLowerCase();
      let cat = 'Core Features & Inclusions';
      
      if (featLower.includes('ai') || featLower.includes('intelligence') || featLower.includes('neural') || featLower.includes('forecast') || featLower.includes('brain') || featLower.includes('credit') || featLower.includes('token')) {
        cat = 'AI & Intelligence';
      } else if (featLower.includes('pos') || featLower.includes('register') || featLower.includes('terminal') || featLower.includes('billing') || featLower.includes('receipt') || featLower.includes('tax') || featLower.includes('drawer')) {
        cat = 'POS & Billing Operations';
      } else if (featLower.includes('staff') || featLower.includes('workstation') || featLower.includes('subuser') || featLower.includes('pin') || featLower.includes('permission') || featLower.includes('user')) {
        cat = 'Staff & Workstations';
      } else if (featLower.includes('product') || featLower.includes('inventory') || featLower.includes('sku') || featLower.includes('barcode') || featLower.includes('stock') || featLower.includes('catalog') || featLower.includes('store')) {
        cat = 'Inventory & Catalog Management';
      } else if (featLower.includes('support') || featLower.includes('manager') || featLower.includes('api') || featLower.includes('webhook') || featLower.includes('cloud') || featLower.includes('backup') || featLower.includes('sla')) {
        cat = 'Support, Cloud & Enterprise SLA';
      }
      
      if (!categorizedFeatures[cat]) {
        categorizedFeatures[cat] = [];
      }
      categorizedFeatures[cat].push(feat);
    });
  }

  const categoryOrder = [
    'Core Features & Inclusions',
    'POS & Billing Operations',
    'AI & Intelligence',
    'Staff & Workstations',
    'Inventory & Catalog Management',
    'Support, Cloud & Enterprise SLA',
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] bg-[#0B1120] border border-slate-800/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* 1. STICKY MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-6 sm:px-8 border-b border-slate-800/80 bg-gradient-to-r from-[#0F172A] via-[#111C35] to-[#0F172A] relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  Subscription Tier Overview
                </span>
                {plan.isPopular && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                    ★ Most Popular
                  </span>
                )}
                {isCurrentPlan && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    Current Active Plan
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {plan.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {plan.tagline || 'Comprehensive store management, intelligence engines, and multi-terminal sync.'}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pricing Banner inside Header */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-baseline justify-between flex-wrap gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {currencySymbol}{effectiveMonthlyRate.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-medium">
                {isFree
                  ? '/ month (Free Forever)'
                  : billingInterval === 'annual' && annualPrice > 0
                  ? `/ month ($${annualPrice}/year billed annually)`
                  : '/ month'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SCROLLABLE MODAL BODY WITH CATEGORIZED DETAILS */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-[#090D1A] custom-scrollbar max-h-[60vh] sm:max-h-[65vh]">
          
          {/* A. Core Resource Capacity Metrics */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Core Capacity &amp; Resource Quotas
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Workstations */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>Workstations</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {workstations >= 999 ? 'Unlimited' : workstations}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Active POS registers</p>
              </div>

              {/* Staff Accounts */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Staff &amp; PINs</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {staff >= 999 ? 'Unlimited' : staff}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Subuser accounts</p>
              </div>

              {/* Products / SKUs */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span>Catalog SKUs</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {products >= 99999 ? 'Unlimited' : products.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Inventory items</p>
              </div>

              {/* Monthly AI Tokens */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Monthly AI Tokens</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400">
                  {aiTokens.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Included every month</p>
              </div>
            </div>
          </div>

          {/* B. Categorized Feature Matrix */}
          {Object.keys(categorizedFeatures).length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  All Plan Features &amp; Inclusions ({plan.features.length} Details)
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  100% Fully Included
                </span>
              </h3>

              {categoryOrder.map((catKey) => {
                const items = categorizedFeatures[catKey];
                if (!items || items.length === 0) return null;

                return (
                  <div
                    key={catKey}
                    className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3"
                  >
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {catKey}
                      <span className="text-[10px] text-slate-500 font-mono font-normal">
                        ({items.length} item{items.length > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {items.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 text-xs text-slate-300"
                        >
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-relaxed font-medium">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Any remaining unlisted categories */}
              {Object.keys(categorizedFeatures)
                .filter((cat) => !categoryOrder.includes(cat))
                .map((catKey) => (
                  <div
                    key={catKey}
                    className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3"
                  >
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {catKey}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {categorizedFeatures[catKey].map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 text-xs text-slate-300"
                        >
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-relaxed font-medium">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
              No additional feature list specified for this plan.
            </div>
          )}

          {/* C. Enterprise Security & Architecture Guarantees */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-950/80 border border-indigo-500/20 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Standard Platform Guarantees
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>99.99% Cloud Uptime SLA</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>AES-256 Cloud Ledger Backup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Offline-First POS Resilience</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. STICKY MODAL FOOTER WITH CALL TO ACTION */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-5 sm:px-8 border-t border-slate-800/80 bg-[#0B1120] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:block text-xs text-slate-400">
            <span>Selected plan: </span>
            <strong className="text-white">{plan.name}</strong>
            <span className="mx-1.5">•</span>
            <span className="text-indigo-400 font-semibold">
              {currencySymbol}{effectiveMonthlyRate.toLocaleString()}/mo
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer border border-slate-700/60 text-center"
            >
              Close
            </button>

            {onSelectPlan && (
              <button
                type="button"
                onClick={() => {
                  onSelectPlan(plan);
                  onClose();
                }}
                className={`flex-1 sm:flex-initial px-7 py-3 rounded-2xl font-bold text-xs transition cursor-pointer shadow-lg flex items-center justify-center gap-2 text-center ${
                  isCurrentPlan
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : plan.isPopular
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                <span>
                  {selectButtonText || (isCurrentPlan ? 'Current Active Tier' : isFree ? 'Start Free' : `Select ${plan.name}`)}
                </span>
                {!isCurrentPlan && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
