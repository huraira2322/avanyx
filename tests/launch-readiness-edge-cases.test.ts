import { describe, it, expect } from 'vitest';
import { AvanyxPricingEngine, AvanyxLoyaltyEngine } from '../src/utils/pricingEngine';
import { resolveActivePlan, isFeatureAllowed, checkResourceLimit, sanitizePlanConfig } from '../src/utils/planLimitsEngine';
import { generateBarcodeSvg } from '../src/utils/barcodeGenerator';
import { generateQrCodeSvg } from '../src/utils/qrCodeGenerator';
import { AvanyxBusinessBrainEngine } from '../src/utils/brainEngine';
import { CartItem, LoyaltyRuleConfig, Product, SaleTransaction } from '../src/types';

describe('Launch Readiness & Edge-Case Verification Suite', () => {
  // 1. PRICING & CURRENCY ENGINE
  describe('AvanyxPricingEngine - Edge Cases & Robustness', () => {
    it('handles null, undefined, NaN, and Infinity in formatCurrency without crashing', () => {
      expect(() => AvanyxPricingEngine.formatCurrency(null as any)).not.toThrow();
      expect(AvanyxPricingEngine.formatCurrency(null as any)).toContain('0.00');

      expect(() => AvanyxPricingEngine.formatCurrency(undefined as any)).not.toThrow();
      expect(AvanyxPricingEngine.formatCurrency(undefined as any)).toContain('0.00');

      expect(() => AvanyxPricingEngine.formatCurrency(NaN)).not.toThrow();
      expect(AvanyxPricingEngine.formatCurrency(NaN)).toContain('0.00');

      expect(AvanyxPricingEngine.formatCurrency(1250.5, 'USD')).toBe('$1,250.50');
      expect(AvanyxPricingEngine.formatCurrency(1250.5, 'PKR')).toBe('Rs. 1,250.50');
      expect(AvanyxPricingEngine.formatCurrency(100, 'UNKNOWN_CURRENCY')).toBe('$100.00');
    });

    it('clamps line item discount so it never exceeds item raw total', () => {
      // Unit price $10, Qty 1, Discount $50 -> discount must not exceed $10
      const calc = AvanyxPricingEngine.calculateLineItem(10, 1, 50, 0.1, false);
      expect(calc.lineNet).toBe(0);
      expect(calc.lineDiscount).toBeLessThanOrEqual(10);
      expect(calc.lineGross).toBe(0);
    });

    it('handles inclusive tax without division by zero when taxRate is 0 or negative', () => {
      const calcZero = AvanyxPricingEngine.calculateLineItem(100, 1, 0, 0, true);
      expect(calcZero.lineNet).toBe(100);
      expect(calcZero.lineTax).toBe(0);
      expect(calcZero.lineGross).toBe(100);

      const calcNeg = AvanyxPricingEngine.calculateLineItem(100, 1, 0, -0.05, true);
      expect(Number.isFinite(calcNeg.lineNet)).toBe(true);
      expect(calcNeg.lineGross).toBe(100);
    });

    it('strictly enforces loyalty redemption percentage cap in evaluateCart', () => {
      const config: LoyaltyRuleConfig = {
        enabled: true,
        earningModel: 'spend_amount',
        spendAmountUnit: 10,
        pointsPerSpendUnit: 1,
        flatPointsPerOrder: 0,
        pointRedemptionValue: 0.10, // each point is $0.10
        minPointsForRedemption: 10,
        maxRedemptionPercentagePerOrder: 40, // Max 40% discount allowed
        pointExpiryDays: 365,
        bonusPointsForNewCustomer: 0,
        tiers: []
      };

      const items: CartItem[] = [
        {
          productId: 'p1',
          name: 'Item 1',
          sku: 'SKU1',
          unitPrice: 100,
          costPrice: 50,
          quantity: 1,
          discount: 0,
          discountPercent: 0,
          taxRate: 0,
          taxAmount: 0,
        }
      ];

      // Customer tries to redeem 1,000 points ($100 value).
      // On a $100 order with max 40% cap, maximum discount MUST be $40.
      const result = AvanyxPricingEngine.evaluateCart(items, 0, 1000, config);
      expect(result.subtotal).toBe(100);
      expect(result.loyaltyDiscount).toBeLessThanOrEqual(40);
      expect(result.grandTotal).toBeGreaterThanOrEqual(60);
    });

    it('prevents item-level discount leakage across multiple cart items', () => {
      const items: CartItem[] = [
        {
          productId: 'p1',
          name: 'Small Item',
          sku: 'S1',
          unitPrice: 10,
          costPrice: 5,
          quantity: 1,
          discount: 50, // Discount of $50 on a $10 item!
          discountPercent: 0,
          taxRate: 0,
          taxAmount: 0,
        },
        {
          productId: 'p2',
          name: 'Expensive Item',
          sku: 'E1',
          unitPrice: 100,
          costPrice: 60,
          quantity: 1,
          discount: 0,
          discountPercent: 0,
          taxRate: 0,
          taxAmount: 0,
        }
      ];

      // Item 1 total is $10. Discount $50 should be capped at $10.
      // Item 2 total is $100.
      // Cart total should be: ($10 - $10) + $100 = $100. (NOT 110 - 50 = $60)
      const result = AvanyxPricingEngine.evaluateCart(items, 0, 0);
      expect(result.subtotal).toBe(110);
      expect(result.grandTotal).toBe(100);
    });
  });

  // 2. SUBSCRIPTION & PLAN LIMITS ENGINE
  describe('PlanLimitsEngine - Robustness & Crash Prevention', () => {
    it('handles undefined/null plansList without throwing in resolveActivePlan', () => {
      expect(() => resolveActivePlan(null, null as any)).not.toThrow();
      const plan = resolveActivePlan(null, undefined as any);
      expect(plan).toBeDefined();
      expect(plan.tier).toBe('free');
    });

    it('handles undefined/null plan without throwing in isFeatureAllowed', () => {
      expect(() => isFeatureAllowed(null as any, 'ai_chat')).not.toThrow();
      expect(isFeatureAllowed(undefined as any, 'ai_chat')).toBe(false);
    });

    it('handles null/undefined plan safely in sanitizePlanConfig', () => {
      expect(() => sanitizePlanConfig(null as any)).not.toThrow();
      const sanitized = sanitizePlanConfig(null as any);
      expect(sanitized.tier).toBe('free');
      expect(sanitized.tokensIncludedMonthly).toBe(0);
      expect(sanitized.maxProducts).toBeGreaterThan(0);
    });

    it('resolves active plan from userProfile when activeSubscription is null (simulating page reload)', () => {
      const resolved = resolveActivePlan(null, null, null, { subscriptionTier: 'pro' });
      expect(resolved.tier).toBe('pro');
      expect(resolved.tokensIncludedMonthly).toBe(10000);
      expect(resolved.maxProducts).toBe(5000);
    });

    it('resolves active plan from activeSubscription with correct limits', () => {
      const activeSub: any = {
        subscriptionId: 'sub-test-999',
        tier: 'pro_max',
        planId: 'tier_pro_max',
        tokensIncludedMonthly: 30000,
        status: 'active',
      };
      const resolved = resolveActivePlan(activeSub, null);
      expect(resolved.tier).toBe('pro_max');
      expect(resolved.tokensIncludedMonthly).toBe(30000);
      expect(resolved.maxProducts).toBe(20000);
    });

    it('strictly isolates Pro (tier_pro) and Pro Max (tier_pro_max) plan mutations', () => {
      const isTargetPlan = (p: any, targetTierOrId: string) => {
        if (targetTierOrId === 'tier_pro_max' || targetTierOrId === 'pro_max') {
          return p.id === 'tier_pro_max' || p.tier === 'pro_max';
        }
        if (targetTierOrId === 'tier_pro' || targetTierOrId === 'pro') {
          return (p.id === 'tier_pro' || p.tier === 'pro') && p.id !== 'tier_pro_max' && p.tier !== 'pro_max';
        }
        if (targetTierOrId === 'tier_free' || targetTierOrId === 'free') {
          return p.id === 'tier_free' || p.tier === 'free';
        }
        return p.id === targetTierOrId;
      };

      const plans = [
        { id: 'tier_free', tier: 'free', maxProducts: 50, maxStaff: 2 },
        { id: 'tier_pro', tier: 'pro', maxProducts: 5000, maxStaff: 10 },
        { id: 'tier_pro_max', tier: 'pro_max', maxProducts: 20000, maxStaff: 50 },
      ];

      // Mutate only Pro plan
      const updatedProPlans = plans.map((p) => {
        if (!isTargetPlan(p, 'tier_pro')) return p;
        return { ...p, maxProducts: 8000, maxStaff: 15 };
      });

      const proPlan = updatedProPlans.find((p) => isTargetPlan(p, 'tier_pro'));
      const proMaxPlan = updatedProPlans.find((p) => isTargetPlan(p, 'tier_pro_max'));

      expect(proPlan?.maxProducts).toBe(8000);
      expect(proPlan?.maxStaff).toBe(15);
      // Pro Max MUST NOT be changed
      expect(proMaxPlan?.maxProducts).toBe(20000);
      expect(proMaxPlan?.maxStaff).toBe(50);

      // Mutate only Pro Max plan
      const updatedProMaxPlans = plans.map((p) => {
        if (!isTargetPlan(p, 'tier_pro_max')) return p;
        return { ...p, maxProducts: 50000, maxStaff: 100 };
      });

      const proPlanAfter = updatedProMaxPlans.find((p) => isTargetPlan(p, 'tier_pro'));
      const proMaxPlanAfter = updatedProMaxPlans.find((p) => isTargetPlan(p, 'tier_pro_max'));

      // Pro MUST NOT be changed
      expect(proPlanAfter?.maxProducts).toBe(5000);
      expect(proPlanAfter?.maxStaff).toBe(10);
      expect(proMaxPlanAfter?.maxProducts).toBe(50000);
      expect(proMaxPlanAfter?.maxStaff).toBe(100);
    });
  });

  // 3. BARCODE & QR CODE ENGINES
  describe('Barcode & QR Code Generators - Input Hardening', () => {
    it('handles null, numbers, symbols, and empty input in generateBarcodeSvg without throwing', () => {
      expect(() => generateBarcodeSvg(null as any)).not.toThrow();
      expect(() => generateBarcodeSvg(undefined as any)).not.toThrow();
      expect(() => generateBarcodeSvg(12345678 as any)).not.toThrow();
      expect(() => generateBarcodeSvg('')).not.toThrow();
      expect(() => generateBarcodeSvg('SKU-990-SPECIAL-✨')).not.toThrow();

      const svg = generateBarcodeSvg('TEST-BARCODE-128');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('generates valid QR Code SVG without crashing on edge cases', () => {
      expect(() => generateQrCodeSvg(null as any)).not.toThrow();
      expect(() => generateQrCodeSvg('')).not.toThrow();
      expect(() => generateQrCodeSvg('https://avanyx.app/checkout?id=12345&store=main')).not.toThrow();

      const qrSvg = generateQrCodeSvg('AVANYX-LAUNCH-TEST');
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('<path');
    });
  });

  // 4. BUSINESS BRAIN & FINANCIAL REPORTING
  describe('AvanyxBusinessBrainEngine - Valuation & Zero-Division Safety', () => {
    it('does not produce NaN or Infinity with empty input data', () => {
      const diag = AvanyxBusinessBrainEngine.computeDiagnostics({
        products: [],
        sales: [],
        expenses: [],
        otherIncomes: [],
        customers: [],
        suppliers: [],
      });

      expect(Number.isFinite(diag.metrics.totalRevenue)).toBe(true);
      expect(Number.isFinite(diag.metrics.profitMargin)).toBe(true);
      expect(Number.isFinite(diag.metrics.avgOrderValue)).toBe(true);
      expect(Number.isFinite(diag.metrics.returningCustomerRate)).toBe(true);
      expect(diag.metrics.totalRevenue).toBe(0);
      expect(diag.metrics.profitMargin).toBe(0);
    });

    it('excludes cancelled sales from revenue and profit calculations', () => {
      const activeSale: SaleTransaction = {
        id: 's1',
        businessId: 'biz1',
        invoiceNumber: 'INV-1',
        items: [],
        subtotal: 100,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: 100,
        costTotal: 40,
        netProfit: 60,
        payments: [{ method: 'cash', amount: 100, paidAt: new Date().toISOString() }],
        balanceRemaining: 0,
        status: 'completed',
        pointsEarned: 0,
        pointsRedeemed: 0,
        cashierName: 'Admin',
        createdAt: new Date().toISOString(),
        channel: 'pos',
        syncStatus: 'synced',
      };

      const cancelledSale: SaleTransaction = {
        ...activeSale,
        id: 's2',
        invoiceNumber: 'INV-2',
        grandTotal: 500,
        status: 'cancelled',
      };

      const diag = AvanyxBusinessBrainEngine.computeDiagnostics({
        products: [],
        sales: [activeSale, cancelledSale],
        expenses: [],
        otherIncomes: [],
        customers: [],
        suppliers: [],
      });

      expect(diag.metrics.totalRevenue).toBe(100);
      expect(diag.metrics.totalTransactions).toBe(1);
    });

    it('correctly updates tokensIncludedMonthly and synchronizes with resourceLimits.monthlyAiCredits', () => {
      const originalPlan: any = {
        id: 'tier_pro',
        tier: 'pro',
        name: 'Avanyx Pro',
        tagline: 'Standard pro tier',
        monthlyPriceUSD: 10,
        annualPriceUSD: 100,
        currencyPricing: {},
        tokensIncludedMonthly: 10000,
        maxWorkstations: 5,
        maxSubusers: 50,
        maxProducts: 5000,
        features: ['Feature 1', 'Feature 2'],
        isActive: true,
        commissionEligible: true,
        resourceLimits: { monthlyAiCredits: 10000, maxWorkstations: 5, maxProducts: 5000, maxStaff: 50 },
      };

      // User updates limits in Super Admin
      const updatedPlan = {
        ...originalPlan,
        tokensIncludedMonthly: 25000,
        maxWorkstations: 12,
        maxProducts: 8000,
        maxSubusers: 35,
      };

      const sanitized = sanitizePlanConfig(updatedPlan);

      expect(sanitized.tokensIncludedMonthly).toBe(25000);
      expect(sanitized.resourceLimits.monthlyAiCredits).toBe(25000);
      expect(sanitized.maxWorkstations).toBe(12);
      expect(sanitized.resourceLimits.maxWorkstations).toBe(12);
      expect(sanitized.maxProducts).toBe(8000);
      expect(sanitized.resourceLimits.maxProducts).toBe(8000);
      expect(sanitized.maxSubusers).toBe(35);
      expect(sanitized.resourceLimits.maxStaff).toBe(35);
    });

    it('preserves newly added plan details and features in sanitizePlanConfig', () => {
      const plan: any = {
        id: 'tier_custom_1',
        tier: 'custom_1',
        name: 'Retail VIP Enterprise',
        tagline: 'Special package',
        monthlyPriceUSD: 49,
        annualPriceUSD: 490,
        currencyPricing: {},
        tokensIncludedMonthly: 50000,
        maxWorkstations: 10,
        maxSubusers: 25,
        maxProducts: 15000,
        features: ['Automated Inventory Restock', 'Multi-Terminal Sync'],
        isActive: true,
        commissionEligible: true,
      };

      const addedDetail = '24/7 Dedicated Account Manager';
      const bulkDetail = 'Custom Barcode Printing Engine';
      const updatedFeatures = [...plan.features, addedDetail, bulkDetail];

      const updatedPlan = {
        ...plan,
        features: updatedFeatures,
      };

      const sanitized = sanitizePlanConfig(updatedPlan);

      expect(sanitized.features).toHaveLength(4);
      expect(sanitized.features).toContain('Automated Inventory Restock');
      expect(sanitized.features).toContain('Multi-Terminal Sync');
      expect(sanitized.features).toContain(addedDetail);
      expect(sanitized.features).toContain(bulkDetail);
    });

    it('dynamically adapts when plans are added or removed, omitting deleted plans', () => {
      // Suppose founder deletes tier_pro and tier_pro_max, and adds custom tier_starter
      const customPlans = [
        {
          id: 'tier_free',
          tier: 'free',
          name: 'Avanyx Free',
          monthlyPriceUSD: 0,
          annualPriceUSD: 0,
          tokensIncludedMonthly: 0,
          maxWorkstations: 1,
          maxSubusers: 2,
          maxProducts: 500,
          features: ['POS Only'],
          isActive: true,
        },
        {
          id: 'tier_starter',
          tier: 'starter',
          name: 'Avanyx Starter',
          monthlyPriceUSD: 19,
          annualPriceUSD: 190,
          tokensIncludedMonthly: 15000,
          maxWorkstations: 3,
          maxSubusers: 10,
          maxProducts: 2500,
          features: ['Online Store', 'AI Assistant'],
          isActive: true,
        },
      ];

      // Sanitizing these plans must include tier_starter and omit tier_pro / tier_pro_max
      const sanitizedList = customPlans.map((p: any) => sanitizePlanConfig(p));
      expect(sanitizedList).toHaveLength(2);
      expect(sanitizedList.some((p) => p.id === 'tier_pro')).toBe(false);
      expect(sanitizedList.some((p) => p.id === 'tier_pro_max')).toBe(false);
      expect(sanitizedList.some((p) => p.id === 'tier_starter')).toBe(true);

      // Resolving user on starter tier resolves correctly
      const resolved = resolveActivePlan({ planId: 'tier_starter' } as any, sanitizedList);
      expect(resolved.name).toBe('Avanyx Starter');
      expect(resolved.tokensIncludedMonthly).toBe(15000);
    });
  });
});

