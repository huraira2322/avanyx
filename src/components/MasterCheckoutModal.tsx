import React, { useState, useEffect } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import {
  SubscriptionPlanConfig,
  PaymentGatewayProvider,
} from '../types';
import { DEFAULT_SUBSCRIPTION_PLANS } from '../data/paymentPlans';
import {
  X,
  CheckCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  CreditCard,
  Building,
  Smartphone,
  Globe,
  Tag,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Check,
  Info,
} from 'lucide-react';
import { PlanDetailsModal } from './PlanDetailsModal';

export const MasterCheckoutModal: React.FC = () => {
  const {
    isCheckoutModalOpen,
    checkoutSelectedPlanId,
    closeCheckoutModal,
    subscriptionPlans,
    activeSubscription,
    initiateCheckoutSession,
    confirmOrderPayment,
    activeUser,
    activeBusiness,
  } = useAvanyx();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(checkoutSelectedPlanId || 'tier_pro');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [viewingDetailPlan, setViewingDetailPlan] = useState<SubscriptionPlanConfig | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'PKR' | 'EUR' | 'GBP' | 'AED' | 'SAR'>('USD');
  const [selectedProvider, setSelectedProvider] = useState<PaymentGatewayProvider>('stripe');

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    transactionId: string;
    itemTitle: string;
    amountPaid: string;
    receiptMessage: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial selections
  useEffect(() => {
    if (isCheckoutModalOpen) {
      if (checkoutSelectedPlanId) setSelectedPlanId(checkoutSelectedPlanId);
      setPaymentSuccessData(null);
      setErrorMessage(null);
    }
  }, [isCheckoutModalOpen, checkoutSelectedPlanId]);

  if (!isCheckoutModalOpen) return null;

  const availablePlans = (subscriptionPlans && subscriptionPlans.length > 0) ? subscriptionPlans : DEFAULT_SUBSCRIPTION_PLANS;

  const currentPlan = availablePlans.find(p => p.id === selectedPlanId) || availablePlans[1] || availablePlans[0];

  // Price Calculation
  const calculatePlanPrice = (plan: SubscriptionPlanConfig) => {
    if (selectedCurrency === 'USD') {
      return billingInterval === 'annual' ? plan.annualPriceUSD : plan.monthlyPriceUSD;
    }
    if (plan.currencyPricing && plan.currencyPricing[selectedCurrency]) {
      return billingInterval === 'annual'
        ? plan.currencyPricing[selectedCurrency].annual
        : plan.currencyPricing[selectedCurrency].monthly;
    }
    return billingInterval === 'annual' ? plan.annualPriceUSD : plan.monthlyPriceUSD;
  };

  const handleExecutePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const price = calculatePlanPrice(currentPlan);

      // Step 1: Create session intent on authoritative backend
      const sessionRes = await initiateCheckoutSession({
        itemType: 'SUBSCRIPTION',
        itemId: currentPlan.id,
        billingInterval,
        currency: selectedCurrency,
        provider: selectedProvider,
      });

      if (!sessionRes.success) {
        throw new Error(sessionRes.error || 'Failed to initialize secure checkout session.');
      }

      // Step 2: Confirm order through authoritative backend
      const res = await confirmOrderPayment({
        transactionType: 'SUBSCRIPTION',
        planId: currentPlan.id,
        billingInterval,
        amount: price,
        currency: selectedCurrency,
        provider: selectedProvider,
        paymentMethodDetails: `${selectedProvider.toUpperCase()} Authoritative Payment Gateway`,
      });

      if (res.success) {
        setPaymentSuccessData({
          transactionId: res.transaction?.transactionId || sessionRes.session?.orderId || `tx_${Date.now()}`,
          itemTitle: `${currentPlan.name} (${billingInterval === 'annual' ? 'Annual Plan' : 'Monthly Plan'})`,
          amountPaid: `${selectedCurrency} ${price.toLocaleString()}`,
          receiptMessage: `Your ${currentPlan.name} subscription is now active! All multi-workstation and cloud features are unlocked.`,
        });
      } else {
        setErrorMessage(res.error || 'Failed to complete subscription payment.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Avanyx Payment & Billing Portal
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  Secure Checkout
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cloud multi-workstation subscriptions & multi-currency billing
              </p>
            </div>
          </div>
          <button
            onClick={closeCheckoutModal}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {paymentSuccessData ? (
          /* Success Screen */
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">Payment Confirmed & Verified!</h3>
            <p className="max-w-md text-sm text-slate-300">
              {paymentSuccessData.receiptMessage}
            </p>

            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-4 text-left space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-mono text-slate-200">{paymentSuccessData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Item Purchased:</span>
                <span className="font-semibold text-slate-200">{paymentSuccessData.itemTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount Paid:</span>
                <span className="font-semibold text-emerald-400">{paymentSuccessData.amountPaid}</span>
              </div>
            </div>

            <button
              onClick={closeCheckoutModal}
              className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* Checkout Body */
          <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">

            {/* Currency Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-bold text-white">Choose Your Plan</span>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center gap-2 text-xs">
                <Globe className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Currency:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e: any) => setSelectedCurrency(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-semibold text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs.)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SAR">SAR (﷼)</option>
                </select>
              </div>
            </div>

            {/* SUBSCRIPTIONS */}
            <div className="space-y-4">
              {/* Billing Interval Toggle */}
              <div className="flex items-center justify-center gap-3">
                <span className={`text-xs font-semibold ${billingInterval === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
                  Monthly Billing
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'annual' : 'monthly')}
                  className={`relative h-6 w-11 rounded-full transition ${billingInterval === 'annual' ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <span
                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      billingInterval === 'annual' ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingInterval === 'annual' ? 'text-white' : 'text-slate-400'}`}>
                  Annual Billing
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    2 Months Free
                  </span>
                </span>
              </div>

              {/* Subscription Plans Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePlans.map((plan) => {
                  const price = calculatePlanPrice(plan);
                  const isSelected = selectedPlanId === plan.id;
                  const isCurrent = activeSubscription?.planId === plan.id && activeSubscription?.status === 'active';

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-600/10'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                          Most Popular
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 shadow">
                          Current Plan
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{plan.tagline}</p>

                        <div className="my-3">
                          <span className="text-2xl font-black text-white">
                            {selectedCurrency === 'USD' ? '$' : selectedCurrency + ' '}
                            {price.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400">/{billingInterval === 'annual' ? 'yr' : 'mo'}</span>
                        </div>

                        <div className="rounded-lg bg-slate-900 p-2 text-xs space-y-1 mb-3 border border-slate-800/80">
                          <div className="flex justify-between text-slate-300">
                            <span>Monthly AI Tokens:</span>
                            <span className="font-bold text-amber-400">{plan.tokensIncludedMonthly.toLocaleString()} Tokens</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Workstations:</span>
                            <span>{plan.maxWorkstations === 999 ? 'Unlimited' : plan.maxWorkstations}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Staff Accounts:</span>
                            <span>{plan.maxSubusers || 5} Staff</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingDetailPlan(plan);
                            }}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition cursor-pointer py-1"
                          >
                            <Info className="w-3 h-3" />
                            <span>View All Features</span>
                          </button>
                          {plan.features.length > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {plan.features.length} features
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          className={`w-full rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select Plan'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Plan Details Modal */}
              <PlanDetailsModal
                isOpen={!!viewingDetailPlan}
                onClose={() => setViewingDetailPlan(null)}
                plan={viewingDetailPlan}
                billingInterval={billingInterval}
                currencySymbol={selectedCurrency === 'USD' ? '$' : selectedCurrency + ' '}
                selectedCurrency={selectedCurrency}
                onSelectPlan={(p) => setSelectedPlanId(p.id)}
                selectButtonText="Select This Plan For Checkout"
              />

            </div>

            {/* Enterprise Security Guarantee Section */}
            <div className="pt-2 border-t border-slate-800">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Secure Cloud Activation</h4>
                    <p className="text-[10px] text-slate-400">TLS-secured checkout with instant plan provisioning</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-semibold bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Zero setup fees • Instant feature unlock</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {!paymentSuccessData && (
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
            <div className="text-xs text-slate-400">
              <span>
                Total Due: <strong className="text-white font-mono text-sm">{selectedCurrency} {calculatePlanPrice(currentPlan).toLocaleString()}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeCheckoutModal}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white transition shadow-lg bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    Confirm & Complete Checkout
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
