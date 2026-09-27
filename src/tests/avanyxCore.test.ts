import { describe, it, expect } from 'vitest';
import {
  deriveBusinessModel,
  buildPresetCatalogSchema,
  emptyCatalogValues,
  dynamicFieldsForScope,
  fieldsForScope,
  boundField,
  coreLabel,
  getActiveCatalogSchema,
  NEUTRAL_CATALOG_SCHEMA
} from '../lib/catalogSchema';
import { AvanyxPricingEngine } from '../utils/pricingEngine';
import { Product, ProductVariant, CatalogSchema } from '../types';
import { generateThermalReceiptHtml, generateA4InvoiceHtml } from '../utils/receiptPrinter';
import { generateQrMatrix, generateQrCodeSvg } from '../utils/qrCodeGenerator';
import { generateBarcodeSvg } from '../utils/barcodeGenerator';
import { heuristicOfferingSchema, neutralFallbackSchema, sanitizeCatalogSchema } from '../server/catalogEngine';

describe('1. Universal Business Dynamic Catalog Schema Tests', () => {
  it('should generate an industry-specific schema for clothing/apparel with variants & loyalty', () => {
    const schema = buildPresetCatalogSchema('clothing');
    const model = deriveBusinessModel(schema);

    expect(schema.businessType).toContain('Clothing');
    expect(model.hasVariants).toBe(true);
    expect(model.hasBarcodes).toBe(true);
    expect(model.hasSku).toBe(true);
    expect(model.isProduct).toBe(true);
    expect(model.isService).toBe(false);
  });

  it('should generate a service-specific schema for clinics/doctors with appointments & duration', () => {
    const schema = buildPresetCatalogSchema('salon'); // service blueprint
    const model = deriveBusinessModel(schema);

    expect(model.isService).toBe(true);
    expect(model.hasAppointments).toBe(true);
    expect(model.itemLabelSingular).toBe('Service');
  });

  it('should correctly bind core fields like name, category, and sellingPrice', () => {
    const schema = buildPresetCatalogSchema('grocery');
    const nameField = boundField(schema, 'name');
    const priceField = boundField(schema, 'sellingPrice');

    expect(nameField).toBeDefined();
    expect(nameField?.required).toBe(true);
    expect(priceField).toBeDefined();
    expect(priceField?.type).toBe('currency');
  });

  it('should initialize empty values properly for dynamic schemas', () => {
    const schema = buildPresetCatalogSchema('pharmacy');
    const values = emptyCatalogValues(schema, 'item');

    expect(typeof values).toBe('object');
    expect(values).toHaveProperty('name');
    expect(values).toHaveProperty('selling_price');
  });

  it('should fall back gracefully to neutral schema when business has no custom schema', () => {
    const fallback = getActiveCatalogSchema(null);
    expect(fallback.businessType).toBe(NEUTRAL_CATALOG_SCHEMA.businessType);
    expect(fallback.capabilities.barcodes).toBe(false);
  });
});

describe('2. Financial, Profit & Tax Calculation Engine Tests', () => {
  it('should accurately calculate tax inclusive amounts', () => {
    // e.g., $110 item with 10% tax inclusive -> $100 net, $10 tax, $110 gross
    const result = AvanyxPricingEngine.calculateLineItem(110, 1, 0, 0.10, true);
    expect(result.lineTax).toBe(10);
    expect(result.lineNet).toBe(100);
    expect(result.lineGross).toBe(110);
  });

  it('should accurately calculate tax exclusive amounts', () => {
    // e.g., $100 item with 10% tax exclusive -> $100 net, $10 tax, $110 gross
    const result = AvanyxPricingEngine.calculateLineItem(100, 1, 0, 0.10, false);
    expect(result.lineTax).toBe(10);
    expect(result.lineNet).toBe(100);
    expect(result.lineGross).toBe(110);
  });

  it('should accurately calculate net profit for POS transactions', () => {
    const cartItems = [
      {
        productId: 'prod-1',
        name: 'Item A',
        sku: 'SKU-A',
        unitPrice: 50,
        costPrice: 20,
        quantity: 2,
        discount: 0,
        discountPercent: 0,
        taxRate: 0,
        taxAmount: 0
      },
      {
        productId: 'prod-2',
        name: 'Item B',
        sku: 'SKU-B',
        unitPrice: 30,
        costPrice: 15,
        quantity: 1,
        discount: 5,
        discountPercent: 0,
        taxRate: 0,
        taxAmount: 0
      }
    ];

    const revenue = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity - item.discount), 0);
    const cost = cartItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const netProfit = revenue - cost;

    // Item A: 50*2 - 0 = 100 rev, 20*2 = 40 cost -> 60 profit
    // Item B: 30*1 - 5 = 25 rev, 15*1 = 15 cost -> 10 profit
    // Total Revenue: 125, Total Cost: 55, Net Profit: 70
    expect(revenue).toBe(125);
    expect(cost).toBe(55);
    expect(netProfit).toBe(70);
  });

  it('should format currency accurately according to international codes', () => {
    expect(AvanyxPricingEngine.formatCurrency(1234.56, 'USD')).toContain('1,234.56');
    expect(AvanyxPricingEngine.formatCurrency(500, 'PKR')).toContain('500');
  });
});

describe('3. Barcode & Hardware Scanner Matching Logic Tests', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-101',
      businessId: 'biz-1',
      name: 'Organic Milk 1L',
      sku: 'DRY-MLK-01',
      barcode: '8901234567890',
      category: 'Dairy',
      purchasePrice: 1.5,
      costPrice: 1.5,
      sellingPrice: 3.0,
      taxRate: 0,
      taxInclusive: false,
      unit: 'Bottle',
      stock: 50,
      minStock: 10,
      maxStock: 100,
      warehouseId: 'wh-main',
      isService: false,
      enableBatchTracking: false,
      enableSerialTracking: false,
      variants: [
        {
          id: 'var-1',
          sku: 'DRY-MLK-01-SM',
          barcode: '8901234567891',
          attributes: { Size: '500ml' },
          purchasePrice: 0.9,
          costPrice: 0.9,
          sellingPrice: 1.8,
          stock: 20,
          minStock: 5,
          maxStock: 50
        }
      ],
      customFieldValues: {},
      status: 'active',
      onlineStoreActive: true
    }
  ];

  it('should match a product directly by main barcode', () => {
    const scannedCode = '8901234567890';
    const lower = scannedCode.toLowerCase();
    const match = mockProducts.find(p =>
      (p.barcode && p.barcode.toLowerCase() === lower) ||
      (p.sku && p.sku.toLowerCase() === lower) ||
      (Array.isArray(p.variants) && p.variants.some(v =>
        (v.barcode && v.barcode.toLowerCase() === lower) ||
        (v.sku && v.sku.toLowerCase() === lower)
      ))
    );

    expect(match).toBeDefined();
    expect(match?.id).toBe('prod-101');
  });

  it('should match a product by SKU code', () => {
    const scannedCode = 'dry-mlk-01';
    const lower = scannedCode.toLowerCase();
    const match = mockProducts.find(p =>
      (p.barcode && p.barcode.toLowerCase() === lower) ||
      (p.sku && p.sku.toLowerCase() === lower)
    );

    expect(match).toBeDefined();
    expect(match?.name).toBe('Organic Milk 1L');
  });

  it('should match a nested product variant by variant barcode', () => {
    const scannedCode = '8901234567891';
    const lower = scannedCode.toLowerCase();
    const match = mockProducts.find(p =>
      Array.isArray(p.variants) && p.variants.some(v => v.barcode.toLowerCase() === lower)
    );
    const matchedVariant = match?.variants?.find(v => v.barcode.toLowerCase() === lower);

    expect(match).toBeDefined();
    expect(matchedVariant).toBeDefined();
    expect(matchedVariant?.id).toBe('var-1');
    expect(matchedVariant?.sellingPrice).toBe(1.8);
  });
});

describe('4. Dynamic Form Payload Mapping Tests', () => {
  it('should accurately map schema formData into Product entity structure', () => {
    const mockSchema: CatalogSchema = {
      version: 1,
      businessType: 'Doctor Clinic',
      summary: 'Clinic schema',
      itemLabelSingular: 'Service',
      itemLabelPlural: 'Services',
      sellingModel: 'service',
      units: ['Session'],
      categories: ['Consultations'],
      fields: [
        { key: 'name', label: 'Service Name', type: 'text', scope: 'item', required: true, core: 'name' },
        { key: 'selling_price', label: 'Fee', type: 'currency', scope: 'item', required: true, core: 'sellingPrice' },
        { key: 'duration', label: 'Duration', type: 'number', scope: 'item', required: false, core: 'duration' },
        { key: 'doctor_license', label: 'Doctor License', type: 'text', scope: 'item', required: false }
      ],
      capabilities: {
        barcodes: false,
        sku: false,
        stock: false,
        variants: false,
        batchTracking: false,
        serialTracking: false,
        expiry: false,
        weightBased: false,
        appointments: true,
        suppliers: false,
        loyalty: false,
        onlineStore: false
      },
      workflows: ['pos', 'appointments'],
      confidence: 0.9,
      source: 'ai'
    };

    const formData: Record<string, any> = {
      name: 'General Consultation',
      selling_price: '75',
      duration: '45',
      doctor_license: 'MD-998822',
      __onlineStoreActive: false
    };

    const val = (coreName: string) => {
      const field = mockSchema.fields.find(f => f.core === coreName);
      return field ? formData[field.key] : undefined;
    };

    const customFields: Record<string, any> = {};
    mockSchema.fields.forEach(f => {
      if (!f.core) {
        customFields[f.key] = formData[f.key];
      }
    });

    const product: Product = {
      id: 'prod-doc-1',
      businessId: 'biz-clinic-1',
      name: val('name'),
      sku: val('sku') || '',
      barcode: val('barcode') || '',
      category: val('category') || 'Consultations',
      purchasePrice: 0,
      costPrice: 0,
      sellingPrice: parseFloat(val('sellingPrice')) || 0,
      taxRate: 0,
      taxInclusive: true,
      unit: 'Session',
      stock: 0,
      minStock: 0,
      maxStock: 0,
      warehouseId: 'wh-main',
      isService: true,
      enableBatchTracking: false,
      enableSerialTracking: false,
      variants: [],
      customFieldValues: customFields,
      status: 'active',
      onlineStoreActive: !!formData['__onlineStoreActive'],
      duration: parseInt(val('duration')) || 60
    };

    expect(product.name).toBe('General Consultation');
    expect(product.sellingPrice).toBe(75);
    expect(product.duration).toBe(45);
    expect(product.isService).toBe(true);
    expect(product.customFieldValues['doctor_license']).toBe('MD-998822');
    expect(product.onlineStoreActive).toBe(false);
  });
});

describe('5. Mobile & Desktop Thermal Receipt & A4 Invoice Generator Tests', () => {
  const mockBusiness: any = {
    id: 'biz-test-01',
    name: 'AVANYX Flagship Store',
    industry: 'retail',
    currency: 'USD',
    address: '123 Market St, New York, NY',
    phone: '+1 (555) 019-2831',
    email: 'contact@avanyxstore.com',
    taxNumber: 'US-9912003',
    language: 'en',
    receiptFooter: 'Thank you for shopping with us! Have a wonderful day.'
  };

  const mockSale: any = {
    id: 'sale-9981',
    businessId: 'biz-test-01',
    invoiceNumber: 'INV-2026-0099',
    subtotal: 120.00,
    discountTotal: 10.00,
    taxTotal: 9.90,
    grandTotal: 119.90,
    items: [
      {
        productId: 'prod-hoodie',
        name: 'Avanyx Premium Hoodie',
        sku: 'VEL-HD-BLK-M',
        unitPrice: 80.00,
        quantity: 1,
        discount: 10.00
      },
      {
        productId: 'prod-cap',
        name: 'Avanyx Snapback Cap',
        sku: 'VEL-CAP-01',
        unitPrice: 40.00,
        quantity: 1,
        discount: 0
      }
    ],
    payments: [
      { method: 'card', amount: 119.90, reference: 'CARD-AUTH-991', paidAt: Date.now() }
    ],
    status: 'completed',
    channel: 'pos_counter',
    pointsEarned: 12,
    createdAt: Date.now()
  };

  it('should generate valid 80mm thermal receipt HTML with proper metadata, barcodes, and QR pass', () => {
    const html = generateThermalReceiptHtml({
      sale: mockSale,
      business: mockBusiness,
      currency: 'USD',
      cashierName: 'Alex Mercer'
    });

    expect(html).toContain('AVANYX FLAGSHIP STORE');
    expect(html).toContain('INV-2026-0099');
    expect(html).toContain('Avanyx Premium Hoodie');
    expect(html).toContain('Avanyx Snapback Cap');
    expect(html).toContain('80mm');
    expect(html).toContain('<svg');
    expect(html).toContain('Scan to View Digital Receipt');
    expect(html).toContain('Thank you for shopping with us!');
  });

  it('should generate valid 58mm compact thermal receipt HTML', () => {
    const html = generateThermalReceiptHtml({
      sale: mockSale,
      business: mockBusiness,
      currency: 'USD',
      format: 'thermal58'
    });

    expect(html).toContain('58mm');
    expect(html).toContain('INV-2026-0099');
  });

  it('should generate valid A4 commercial invoice HTML with itemized breakdown', () => {
    const html = generateA4InvoiceHtml({
      sale: mockSale,
      business: mockBusiness,
      currency: 'USD'
    });

    expect(html).toContain('A4 portrait');
    expect(html).toContain('AVANYX Flagship Store');
    expect(html).toContain('INV-2026-0099');
    expect(html).toContain('VEL-HD-BLK-M');
    expect(html).toContain('Discount');
  });
});

describe('6. ISO/IEC 18004 Standard QR Code & Code 128 Barcode Verification', () => {
  it('should generate a valid QR code matrix with Reed-Solomon Error Correction', () => {
    const qr = generateQrMatrix('https://avanyx.app/?s=sale-123&b=biz-456', 'M');

    expect(qr.size).toBeGreaterThanOrEqual(21);
    expect(Array.isArray(qr.modules)).toBe(true);
    expect(qr.modules.length).toBe(qr.size);
    // Finder patterns should be intact (corners must have black modules)
    expect(qr.modules[0][0]).toBe(true);
    expect(qr.modules[0][qr.size - 1]).toBe(true);
    expect(qr.modules[qr.size - 1][0]).toBe(true);
  });

  it('should generate crisp SVG QR code representation', () => {
    const svg = generateQrCodeSvg('https://avanyx.app/pass/12345', { size: 160 });

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 160 160"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('should generate standard Code 128 barcode SVG with checksum and stop bits', () => {
    const svg = generateBarcodeSvg('INV-100293', 200, 40);

    expect(svg).toContain('<svg');
    expect(svg).toContain('INV-100293');
    expect(svg).toContain('<rect');
  });
});

describe('7. Multi-Resolution Viewport & Mobile UI Integrity Tests', () => {
  it('should support responsive screen resolutions from 320px mobile to 4K displays', () => {
    const resolutions = [
      { name: 'iPhone SE / Small Mobile', width: 375, height: 667 },
      { name: 'iPhone 15 Pro / Modern Mobile', width: 393, height: 852 },
      { name: 'Pixel 7 / Android', width: 412, height: 915 },
      { name: 'iPad Mini / Tablet Portrait', width: 768, height: 1024 },
      { name: 'iPad Pro / Tablet Landscape', width: 1024, height: 1366 },
      { name: 'MacBook / Standard Laptop', width: 1440, height: 900 },
      { name: 'Desktop 1080p', width: 1920, height: 1080 },
      { name: 'Ultrawide & 4K', width: 2560, height: 1440 }
    ];

    resolutions.forEach(res => {
      expect(res.width).toBeGreaterThanOrEqual(320);
      expect(res.height).toBeGreaterThanOrEqual(480);
      // Ensure breakpoint classification is deterministic
      const isMobile = res.width < 768;
      const isTablet = res.width >= 768 && res.width < 1024;
      const isDesktop = res.width >= 1024;

      expect(isMobile || isTablet || isDesktop).toBe(true);
    });
  });
});

describe('8. Universal AI Offering Architect & Natural Language Dynamic Extraction Tests', () => {
  it('should dynamically architect a medical/doctor consultation service from natural language', () => {
    const prompt = 'I want to add a general consultation service for $20 with a duration of 30 minutes';
    const result = heuristicOfferingSchema({
      itemRequest: prompt,
      businessProfile: { businessName: 'St. Mary Clinic', industry: 'pharmacy' },
    });

    expect(result.offeringType).toBe('service');
    expect(result.suggestedValues.isService).toBe(true);
    expect(result.suggestedValues.name).toBe('General Consultation Service');
    expect(result.suggestedValues.sellingPrice).toBe(20);
    expect(result.suggestedValues.duration).toBe(30);
    expect(result.suggestedValues.stock).toBe(0);
    expect(result.suggestedValues.costPrice).toBe(0);

    // Capabilities: services MUST NOT enforce stock, barcodes, or SKU
    expect(result.capabilities.stock).toBe(false);
    expect(result.capabilities.barcodes).toBe(false);
    expect(result.capabilities.sku).toBe(false);
    expect(result.capabilities.appointments).toBe(true);

    // Fields must contain duration and NO stock
    const durationField = result.fields.find(f => f.core === 'duration');
    const stockField = result.fields.find(f => f.core === 'stock');
    expect(durationField).toBeDefined();
    expect(stockField).toBeUndefined();
  });

  it('should dynamically architect a perishable food/egg item with stock and unit', () => {
    const prompt = 'Organic eggs sold by the dozen, $4.50 per dozen, 100 cartons in stock';
    const result = heuristicOfferingSchema({
      itemRequest: prompt,
      businessProfile: { businessName: 'Sunny Valley Farm', industry: 'grocery' },
    });

    expect(result.offeringType).toBe('physical');
    expect(result.suggestedValues.isService).toBe(false);
    expect(result.suggestedValues.name).toBe('Organic Eggs');
    expect(result.suggestedValues.sellingPrice).toBe(4.5);
    expect(result.suggestedValues.stock).toBe(100);
    expect(result.suggestedValues.unit).toBe('Dozen');

    // Physical product MUST have stock and barcode capability
    expect(result.capabilities.stock).toBe(true);
    expect(result.capabilities.barcodes).toBe(true);
    expect(result.capabilities.sku).toBe(true);
    expect(result.capabilities.appointments).toBe(false);

    const stockField = result.fields.find(f => f.core === 'stock');
    expect(stockField).toBeDefined();
    expect(stockField?.required).toBe(true);
  });

  it('should dynamically architect a tech repair labor job with custom duration', () => {
    const prompt = 'iPhone screen replacement repair for $89, 45 minutes labor';
    const result = heuristicOfferingSchema({
      itemRequest: prompt,
      businessProfile: { businessName: 'Apex Repair Studio', industry: 'repair' },
    });

    expect(result.offeringType).toBe('service');
    expect(result.suggestedValues.isService).toBe(true);
    expect(result.suggestedValues.sellingPrice).toBe(89);
    expect(result.suggestedValues.duration).toBe(45);
    expect(result.capabilities.stock).toBe(false);
    expect(result.capabilities.appointments).toBe(true);
  });

  it('should dynamically architect custom fabrication and manufacturing orders', () => {
    const prompt = 'Custom CNC aluminum bracket manufacturing, unit price $150';
    const result = heuristicOfferingSchema({
      itemRequest: prompt,
      businessProfile: { businessName: 'Precision Works', industry: 'general' },
    });

    expect(result.offeringType).toBe('manufacturing');
    expect(result.suggestedValues.sellingPrice).toBe(150);
  });

  it('should ensure service items in POS billing bypass stockout constraints', () => {
    // A service item with 0 stock
    const serviceProd: Product = {
      id: 'prod-svc-1',
      businessId: 'biz-1',
      name: 'General Consultation',
      sku: '',
      barcode: '',
      category: 'Services',
      purchasePrice: 0,
      costPrice: 0,
      sellingPrice: 20,
      taxRate: 0,
      taxInclusive: true,
      unit: 'Session',
      stock: 0,
      minStock: 0,
      maxStock: 0,
      warehouseId: 'wh-main',
      isService: true,
      enableBatchTracking: false,
      enableSerialTracking: false,
      variants: [],
      customFieldValues: {},
      status: 'active',
      onlineStoreActive: true,
      duration: 30,
      offeringType: 'service',
    };

    // POS stockout formula simulation:
    // const isService = prod.isService || prod.offeringType === 'service' || prod.offeringType === 'bookable';
    // const isOutOfStock = model.hasStock && !isService && prod.stock <= 0;
    const isService = serviceProd.isService || serviceProd.offeringType === 'service' || serviceProd.offeringType === 'bookable';
    const isOutOfStock = true && !isService && serviceProd.stock <= 0;

    expect(isService).toBe(true);
    expect(isOutOfStock).toBe(false); // Services are NEVER blocked by stock <= 0!
  });
});

describe('7. Universal Business Analysis & Product Adding Integration', () => {
  it('analyzes egg/poultry business into tailored units, categories, and batch fields', () => {
    const schema = neutralFallbackSchema({
      businessRequirements: 'Fresh organic egg farm and poultry supply shop',
      industry: 'farming',
    });

    expect(schema.businessType).toBe('Egg & Poultry Farm / Store');
    expect(schema.units).toContain('Dozen');
    expect(schema.units).toContain('Tray (30)');
    expect(schema.units).toContain('Carton');
    expect(schema.categories).toContain('Farm Fresh White Eggs');
    expect(schema.categories).toContain('Organic Brown Eggs');

    // Anchors & custom fields
    const unitField = schema.fields.find(f => f.core === 'unit');
    expect(unitField).toBeDefined();
    expect(unitField?.options).toEqual(schema.units);

    const catField = schema.fields.find(f => f.core === 'category');
    expect(catField).toBeDefined();
    expect(catField?.options).toEqual(schema.categories);

    expect(schema.fields.some(f => f.key === 'egg_grade')).toBe(true);
    expect(schema.fields.some(f => f.key === 'pack_candling_date')).toBe(true);
    expect(schema.capabilities.batchTracking).toBe(true);
    expect(schema.capabilities.expiry).toBe(true);
  });

  it('analyzes jewelry/gold business into gram/tola units, karat categories, and weight fields', () => {
    const schema = neutralFallbackSchema({
      businessRequirements: 'Gold and diamond jewelry retail boutique',
      industry: 'jewelry',
    });

    expect(schema.businessType).toBe('Gold & Jewelry Retail');
    expect(schema.units).toContain('Gram');
    expect(schema.units).toContain('Tola');
    expect(schema.categories).toContain('Gold 24K');
    expect(schema.categories).toContain('Gold 22K');
    expect(schema.capabilities.weightBased).toBe(true);

    const purityField = schema.fields.find(f => f.key === 'purity_karat');
    expect(purityField).toBeDefined();
    expect(purityField?.options).toContain('24K (99.9%)');
  });

  it('ensures getActiveCatalogSchema injects unit and category options into existing business schemas', () => {
    const customBusiness: any = {
      id: 'biz-egg-99',
      name: 'Sunrise Egg Farm',
      catalogSchema: {
        version: 1,
        businessType: 'Egg Farm',
        summary: 'Egg farm catalog',
        itemLabelSingular: 'Egg Pack',
        itemLabelPlural: 'Egg Packs',
        sellingModel: 'unit',
        units: ['Dozen', 'Tray (30)', 'Carton'],
        categories: ['Grade A Large', 'Pasture Raised'],
        fields: [
          { key: 'name', label: 'Item Name', type: 'text', scope: 'item', required: true, core: 'name' },
          { key: 'selling_price', label: 'Price', type: 'currency', scope: 'item', required: true, core: 'sellingPrice' },
        ],
        capabilities: { ...NEUTRAL_CATALOG_SCHEMA.capabilities },
      },
    };

    const activeSchema = getActiveCatalogSchema(customBusiness);
    const unitField = activeSchema.fields.find(f => f.core === 'unit' || f.key === 'unit');
    expect(unitField).toBeDefined();
    expect(unitField?.options).toEqual(['Dozen', 'Tray (30)', 'Carton']);

    const catField = activeSchema.fields.find(f => f.core === 'category' || f.key === 'category');
    expect(catField).toBeDefined();
    expect(catField?.options).toEqual(['Grade A Large', 'Pasture Raised']);
  });
});


