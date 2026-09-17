import { describe, it, expect } from 'vitest';
import { VelcoraPricingEngine, VelcoraLoyaltyEngine } from '../src/utils/pricingEngine';
import { resolveActivePlan, isFeatureAllowed, checkResourceLimit, sanitizePlanConfig } from '../src/utils/planLimitsEngine';
import { generateBarcodeSvg } from '../src/utils/barcodeGenerator';
import { generateQrCodeSvg } from '../src/utils/qrCodeGenerator';
import { VelcoraBusinessBrainEngine } from '../src/utils/brainEngine';
import { CartItem, LoyaltyRuleConfig, Product, SaleTransaction } from '../src/types';

describe('Launch Readiness & Edge-Case Verification Suite', () => {
  // 1. PRICING & CURRENCY ENGINE
  describe('VelcoraPricingEngine - Edge Cases & Robustness', () => {
    it('handles null, undefined, NaN, and Infinity in formatCurrency without crashing', () => {
      expect(() => VelcoraPricingEngine.formatCurrency(null as any)).not.toThrow();
      expect(VelcoraPricingEngine.formatCurrency(null as any)).toContain('0.00');

      expect(() => VelcoraPricingEngine.formatCurrency(undefined as any)).not.toThrow();
      expect(VelcoraPricingEngine.formatCurrency(undefined as any)).toContain('0.00');

      expect(() => VelcoraPricingEngine.formatCurrency(NaN)).not.toThrow();
      expect(VelcoraPricingEngine.formatCurrency(NaN)).toContain('0.00');

      expect(VelcoraPricingEngine.formatCurrency(1250.5, 'USD')).toBe('$1,250.50');
      expect(VelcoraPricingEngine.formatCurrency(1250.5, 'PKR')).toBe('Rs. 1,250.50');
      expect(VelcoraPricingEngine.formatCurrency(100, 'UNKNOWN_CURRENCY')).toBe('$100.00');
    });

    it('clamps line item discount so it never exceeds item raw total', () => {
      // Unit price $10, Qty 1, Discount $50 -> discount must not exceed $10
      const calc = VelcoraPricingEngine.calculateLineItem(10, 1, 50, 0.1, false);
      expect(calc.lineNet).toBe(0);
      expect(calc.lineDiscount).toBeLessThanOrEqual(10);
      expect(calc.lineGross).toBe(0);
    });

    it('handles inclusive tax without division by zero when taxRate is 0 or negative', () => {
      const calcZero = VelcoraPricingEngine.calculateLineItem(100, 1, 0, 0, true);
      expect(calcZero.lineNet).toBe(100);
      expect(calcZero.lineTax).toBe(0);
      expect(calcZero.lineGross).toBe(100);

      const calcNeg = VelcoraPricingEngine.calculateLineItem(100, 1, 0, -0.05, true);
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
      const result = VelcoraPricingEngine.evaluateCart(items, 0, 1000, config);
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
      const result = VelcoraPricingEngine.evaluateCart(items, 0, 0);
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
      expect(sanitized.maxProducts).toBeGreaterThan(0);
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
      expect(() => generateQrCodeSvg('https://velcora.app/checkout?id=12345&store=main')).not.toThrow();

      const qrSvg = generateQrCodeSvg('VELCORA-LAUNCH-TEST');
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('<path');
    });
  });

  // 4. BUSINESS BRAIN & FINANCIAL REPORTING
  describe('VelcoraBusinessBrainEngine - Valuation & Zero-Division Safety', () => {
    it('does not produce NaN or Infinity with empty input data', () => {
      const diag = VelcoraBusinessBrainEngine.computeDiagnostics({
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

      const diag = VelcoraBusinessBrainEngine.computeDiagnostics({
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
  });
});
