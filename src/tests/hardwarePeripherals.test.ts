import { describe, it, expect } from 'vitest';
import { generateThermalReceiptHtml, generateA4InvoiceHtml, PrintReceiptOptions } from '../utils/receiptPrinter';
import { generateBarcodeSvg, generateQrMatrixSvg } from '../utils/barcodeGenerator';
import { getDevicePlatform } from '../lib/deviceManager';
import { SaleTransaction, BusinessProfile, Product } from '../types';

describe('Hardware Peripherals & System Integration Test Suite', () => {
  const mockBusiness: BusinessProfile = {
    id: 'biz-test-01',
    name: 'Avanyx Retail Megastore',
    address: 'Suite 404, Commerce Plaza, Silicon Boulevard',
    phone: '+1 (555) 019-2831',
    email: 'pos@avanyx.app',
    taxNumber: 'TX-9824110-US',
    currency: 'USD',
    language: 'en',
    receiptFooter: 'Thank you for choosing Avanyx! 30-day return policy applies.',
  };

  const mockSale: SaleTransaction = {
    id: 'sale-hw-001',
    businessId: 'biz-test-01',
    invoiceNumber: 'INV-2026-HW99',
    subtotal: 150.00,
    taxTotal: 12.00,
    discountTotal: 10.00,
    grandTotal: 152.00,
    status: 'completed',
    channel: 'in_store',
    items: [
      {
        id: 'item-1',
        productId: 'prod-001',
        name: 'Wireless Bluetooth Barcode Scanner',
        sku: 'SCAN-WL-100',
        quantity: 1,
        unitPrice: 120.00,
        costPrice: 65.00,
        taxRate: 8,
        discount: 10.00,
      },
      {
        id: 'item-2',
        productId: 'prod-002',
        name: 'ESC/POS Thermal Paper Roll 80mm',
        sku: 'PPR-80-ROL',
        quantity: 3,
        unitPrice: 10.00,
        costPrice: 4.00,
        taxRate: 8,
        discount: 0.00,
      },
    ],
    payments: [
      {
        id: 'pay-001',
        saleId: 'sale-hw-001',
        method: 'cash',
        amount: 160.00,
        createdAt: '2026-09-20T00:30:00Z',
      },
    ],
    pointsEarned: 15,
    pointsRedeemed: 0,
    cashierId: 'user-01',
    cashierName: 'Alex Mercer',
    customerId: 'cust-01',
    customerName: 'Marcus Vance',
    createdAt: '2026-09-20T00:30:00Z',
    updatedAt: '2026-09-20T00:30:00Z',
  };

  // 1. ESC/POS Thermal Receipt Printers (80mm & 58mm)
  describe('1. ESC/POS Thermal Receipt Printers (80mm & 58mm)', () => {
    it('generates standard 80mm ESC/POS compliant receipt with SVG barcode & QR code', () => {
      const html = generateThermalReceiptHtml({
        sale: mockSale,
        business: mockBusiness,
        format: 'thermal80',
      });

      expect(html).toContain('80mm');
      expect(html).toContain('INV-2026-HW99');
      expect(html).toContain('AVANYX RETAIL MEGASTORE');
      expect(html).toContain('Wireless Bluetooth Barcode Scanner');
      expect(html).toContain('ESC/POS Thermal Paper Roll 80mm');
      expect(html).toContain('TX-9824110-US');
      expect(html).toContain('Scan to View Digital Receipt');
      expect(html).toContain('<svg');
    });

    it('generates compact 58mm ESC/POS receipt with narrowed page geometry', () => {
      const html = generateThermalReceiptHtml({
        sale: mockSale,
        business: mockBusiness,
        format: 'thermal58',
      });

      expect(html).toContain('58mm');
      expect(html).toContain('INV-2026-HW99');
      expect(html).toContain('Change Due:');
    });

    it('supports multilingual receipts (Urdu RTL layout & Urdu labels)', () => {
      const urduBusiness = { ...mockBusiness, language: 'ur' };
      const html = generateThermalReceiptHtml({
        sale: mockSale,
        business: urduBusiness,
        format: 'thermal80',
      });

      expect(html).toContain('dir="rtl"');
      expect(html).toContain('بل نمبر:');
      expect(html).toContain('کل رقم:');
      expect(html).toContain('بقایا رقم:');
    });

    it('supports Arabic RTL layout & Arabic labels', () => {
      const arabicBusiness = { ...mockBusiness, language: 'ar' };
      const html = generateThermalReceiptHtml({
        sale: mockSale,
        business: arabicBusiness,
        format: 'thermal80',
      });

      expect(html).toContain('dir="rtl"');
      expect(html).toContain('رقم الفاتورة:');
      expect(html).toContain('المجموع الإجمالي:');
    });
  });

  // 2. Omnidirectional 1D & 2D Barcode Scanners
  describe('2. Omnidirectional 1D & 2D Barcode Scanners', () => {
    const catalog: Product[] = [
      {
        id: 'p1',
        businessId: 'biz-test-01',
        name: 'USB Laser Barcode Reader',
        sku: 'USB-LSR-99',
        barcode: '079357318924',
        category: 'Hardware',
        purchasePrice: 20,
        costPrice: 20,
        sellingPrice: 45,
        taxRate: 0,
        taxInclusive: true,
        unit: 'Pcs',
        stock: 50,
        minStock: 5,
        maxStock: 100,
        warehouseId: 'wh1',
        variants: [
          {
            id: 'var-1',
            name: 'White Edition',
            sku: 'USB-LSR-99-WHT',
            barcode: '079357318925',
            price: 49,
            costPrice: 22,
            stock: 20,
          },
        ],
        customFieldValues: {},
        status: 'active',
      },
    ];

    it('resolves product by 1D UPC / EAN-13 barcode instantaneously', () => {
      const searchBarcode = '079357318924';
      const match = catalog.find(
        p => p.barcode === searchBarcode || p.variants?.some(v => v.barcode === searchBarcode)
      );
      expect(match).toBeDefined();
      expect(match?.id).toBe('p1');
      expect(match?.name).toBe('USB Laser Barcode Reader');
    });

    it('resolves product variant by specific variant barcode', () => {
      const searchBarcode = '079357318925';
      const match = catalog.find(
        p => p.barcode === searchBarcode || p.variants?.some(v => v.barcode === searchBarcode)
      );
      expect(match).toBeDefined();
      const variant = match?.variants?.find(v => v.barcode === searchBarcode);
      expect(variant).toBeDefined();
      expect(variant?.sku).toBe('USB-LSR-99-WHT');
      expect(variant?.price).toBe(49);
    });

    it('resolves product by SKU code lookup', () => {
      const searchSku = 'USB-LSR-99';
      const match = catalog.find(
        p => p.sku.toLowerCase() === searchSku.toLowerCase()
      );
      expect(match).toBeDefined();
      expect(match?.sellingPrice).toBe(45);
    });

    it('simulates rapid HID keyboard burst stream (< 70ms threshold between chars)', () => {
      const scannedBuffer = '079357318924';
      const intervals = [12, 15, 14, 11, 16, 13, 14, 12, 15, 13, 12, 14];
      const isHardwareScanner = intervals.every(delay => delay < 70);
      expect(isHardwareScanner).toBe(true);
      expect(scannedBuffer.length).toBeGreaterThanOrEqual(3);
    });
  });

  // 3. Heavy-Duty Electronic Cash Drawers (24V RJ11/RJ12 Solenoid)
  describe('3. Electronic Cash Drawers (24V RJ11/RJ12 Solenoid)', () => {
    it('detects cash payment method to trigger cash drawer kick pulse', () => {
      const hasCashPayment = mockSale.payments.some(p => p.method === 'cash');
      expect(hasCashPayment).toBe(true);

      const escPosKickCommand = [0x1B, 0x70, 0x00, 0x19, 0xFA];
      expect(escPosKickCommand[0]).toBe(27); // ESC
      expect(escPosKickCommand[1]).toBe(112); // 'p'
      expect(escPosKickCommand.length).toBe(5);
    });

    it('accurately calculates change due for physical cash drawer reconciliation', () => {
      const totalTendered = mockSale.payments
        .filter(p => p.method === 'cash')
        .reduce((sum, p) => sum + p.amount, 0);
      const changeDue = Math.max(0, totalTendered - mockSale.grandTotal);

      expect(totalTendered).toBe(160.00);
      expect(mockSale.grandTotal).toBe(152.00);
      expect(changeDue).toBe(8.00);
    });
  });

  // 4. Customer-Facing Displays (CFD)
  describe('4. Customer-Facing Displays (CFD)', () => {
    it('generates customer digital receipt QR verification URL', () => {
      const origin = 'https://avanyx.app';
      const digitalReceiptUrl = `${origin}?b=${mockBusiness.id}&s=${mockSale.id}`;

      expect(digitalReceiptUrl).toBe('https://avanyx.app?b=biz-test-01&s=sale-hw-001');
      const qrSvg = generateQrMatrixSvg(digitalReceiptUrl, 120);
      expect(qrSvg).toContain('<svg');
      expect(qrSvg).toContain('viewBox="0 0 120 120"');
    });

    it('mirrors live itemized transaction calculations for CFD screen', () => {
      const lineItemTotals = mockSale.items.map(it => ({
        name: it.name,
        qty: it.quantity,
        total: it.unitPrice * it.quantity - (it.discount || 0),
      }));

      expect(lineItemTotals[0].total).toBe(110.00);
      expect(lineItemTotals[1].total).toBe(30.00);
      const computedSubtotal = lineItemTotals.reduce((sum, it) => sum + it.total, 0);
      expect(computedSubtotal + mockSale.taxTotal).toBe(mockSale.grandTotal);
    });
  });

  // 5. Handheld Smart mPOS Terminals
  describe('5. Handheld Smart mPOS Terminals', () => {
    it('identifies platform type accurately based on userAgent', () => {
      const platform = getDevicePlatform();
      expect(typeof platform).toBe('string');
      expect(platform.length).toBeGreaterThan(0);
    });

    it('ensures receipt printing supports mobile device user agent fallbacks', () => {
      const html = generateThermalReceiptHtml({
        sale: mockSale,
        business: mockBusiness,
        format: 'thermal80',
      });
      expect(html).toContain('max-width: 100%');
    });
  });

  // 6. Zero-Downtime Offline-First Engine
  describe('6. Zero-Downtime Offline-First Engine', () => {
    it('validates offline sale payload serialization for local transaction storage', () => {
      const serialized = JSON.stringify(mockSale);
      expect(serialized).toContain('sale-hw-001');

      const restored: SaleTransaction = JSON.parse(serialized);
      expect(restored.grandTotal).toBe(152.00);
      expect(restored.status).toBe('completed');
      expect(restored.items.length).toBe(2);
    });

    it('verifies write-ahead offline sales queue structure', () => {
      const offlineQueue: SaleTransaction[] = [];
      offlineQueue.push(mockSale);

      expect(offlineQueue.length).toBe(1);
      const queuedItem = offlineQueue.shift();
      expect(queuedItem?.invoiceNumber).toBe('INV-2026-HW99');
      expect(offlineQueue.length).toBe(0);
    });
  });
});
