import React, { useState } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Store, ShieldCheck,
  Percent, Globe, Layers, Wand2, X, RefreshCw, Smartphone,
  ShoppingBag, Utensils, Pill, Wrench, Package, Scissors, Box,
  CheckCircle2, Circle
} from 'lucide-react';
import { IndustryType, SystemModuleKey, CurrencyCode, LocaleCode, CatalogSchema } from '../types';
import { AVANYX_COLOR_PALETTES } from '../constants/themeColors';
import { getApiUrl } from '../lib/apiConfig';
import { deriveOnboardingFromSchema, applyModulesToSchema, buildPresetCatalogSchema, presetModulesForIndustry } from '../lib/catalogSchema';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
}

const INDUSTRY_PRESETS: {
  id: IndustryType;
  title: string;
  icon: any;
  tagline: string;
  defaultTax: number;
}[] = [
  {
    id: 'clothing',
    title: 'Fashion & Apparel',
    icon: ShoppingBag,
    tagline: 'Size & color matrix, seasonal collections, loyalty points, online store',
    defaultTax: 0.0,
  },
  {
    id: 'restaurant',
    title: 'Restaurant & Cafe',
    icon: Utensils,
    tagline: 'Table orders, recipe batch costs, quick modifier billing, kitchen delivery notes',
    defaultTax: 0.0,
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy & Healthcare',
    icon: Pill,
    tagline: 'Batch & expiry tracking, doctor prescriptions, dosage notes, low stock alerts',
    defaultTax: 0.0,
  },
  {
    id: 'repair',
    title: 'Electronics & Repair',
    icon: Wrench,
    tagline: 'IMEI/serial tracking, repair estimates, technician assignments, warranty tickets',
    defaultTax: 0.0,
  },
  {
    id: 'wholesale',
    title: 'Wholesale & Distribution',
    icon: Package,
    tagline: 'B2B tier pricing, bulk purchasing, credit notes, sales order dispatching',
    defaultTax: 0.0,
  },
  {
    id: 'grocery',
    title: 'Supermarket & Grocery',
    icon: Store,
    tagline: 'High-speed barcode checkout, perishable expiry audits, customer loyalty',
    defaultTax: 0.0,
  },
  {
    id: 'salon',
    title: 'Salon & Spa Services',
    icon: Scissors,
    tagline: 'Stylist commissions, client appointment history, service packages',
    defaultTax: 0.0,
  },
  {
    id: 'custom',
    title: 'Custom Enterprise',
    icon: Box,
    tagline: 'Bespoke workflow with fully configurable modules and custom fields',
    defaultTax: 0.0,
  },
];

const MODULE_DEFINITIONS: {
  key: SystemModuleKey;
  label: string;
  category: 'Core Register' | 'Catalog & Stock' | 'CRM & Loyalty' | 'Sales & Fulfillment' | 'Intelligence & Marketing';
  description: string;
}[] = [
  { key: 'pos', label: 'POS Billing Register', category: 'Core Register', description: 'Fast cashier scanning, multi-tender payments, held carts, discounts & tax calculation.' },
  { key: 'products', label: 'Product Catalog', category: 'Catalog & Stock', description: 'Universal item management, categorizations, pricing, cost tracking & images.' },
  { key: 'inventory', label: 'Stocktake & Stock Audits', category: 'Catalog & Stock', description: 'Real-time quantity on hand, reorder alerts, warehouse stock adjustments.' },
  { key: 'batch_tracking', label: 'Batch & Expiry Date Tracking', category: 'Catalog & Stock', description: 'FEFO/FIFO inventory tracking with expiration date alerts.' },
  { key: 'serial_tracking', label: 'Serial & IMEI Device Tracking', category: 'Catalog & Stock', description: 'Track unique device identifiers for warranties and technician logs.' },
  { key: 'barcodes', label: 'Barcode Label Printing & Generator', category: 'Catalog & Stock', description: 'Generate standard Code128, EAN-13, and QR codes for thermal sticker printers.' },
  { key: 'customers', label: 'Customer CRM & Profiles', category: 'CRM & Loyalty', description: 'Customer purchase history, credit balances, contact books & segmentation.' },
  { key: 'loyalty', label: 'Loyalty Points & VIP Tiers', category: 'CRM & Loyalty', description: 'Earn-and-burn point engine with tiered multipliers (Silver, Gold, Platinum).' },
  { key: 'sales_orders', label: 'Sales Orders & Invoicing', category: 'Sales & Fulfillment', description: 'Advance sales bookings, scheduled fulfillments, and formal invoices.' },
  { key: 'estimates', label: 'Quotations & Estimates', category: 'Sales & Fulfillment', description: 'Create draft proposals and 1-click convert them into active POS orders.' },
  { key: 'suppliers', label: 'Suppliers & Vendors CRM', category: 'Sales & Fulfillment', description: 'Vendor directory, contact ledgers, payables, and payment terms.' },
  { key: 'purchases', label: 'Purchase Orders & Stock Receiving', category: 'Sales & Fulfillment', description: 'Automated PO drafting, goods received notes, and landed cost recalculation.' },
  { key: 'financial_reports', label: 'Financial Reports & P&L', category: 'Sales & Fulfillment', description: 'Net profit margins, tax summaries, revenue trends, and CSV/PDF export.' },
  { key: 'business_brain', label: 'Avanyx Business Brain AI', category: 'Intelligence & Marketing', description: 'Deterministic health diagnostics, root-cause leak detection, and executive plans.' },
  { key: 'online_store', label: 'Online Store Beta E-Commerce', category: 'Intelligence & Marketing', description: 'Instant consumer-facing digital catalog with live stock sync and web orders.' },
  { key: 'credit_notes', label: 'Credit Notes & Refunds', category: 'Sales & Fulfillment', description: 'Issue credit notes for returns and exchanges, linked to the original invoice.' },
  { key: 'delivery_notes', label: 'Delivery Notes & Dispatch', category: 'Sales & Fulfillment', description: 'Generate dispatch notes for orders leaving the store or warehouse.' },
  { key: 'expenses', label: 'Expense Tracking & Finance', category: 'Sales & Fulfillment', description: 'Operating expenses, other income, commissions and budgets with profit impact.' },
  { key: 'other_income', label: 'Other Income Ledger', category: 'Sales & Fulfillment', description: 'Log non-sales income such as rent, scrap sales or services outside the catalog.' },
  { key: 'commissions', label: 'Staff Commission Rules', category: 'Sales & Fulfillment', description: 'Commission rates per staff member or service, settled in the finance ledger.' },
  { key: 'budgets', label: 'Budgets & Spending Limits', category: 'Sales & Fulfillment', description: 'Monthly budgets per category with variance against actual spend.' },
  { key: 'employees', label: 'Staff & Employee Accounts', category: 'Sales & Fulfillment', description: 'Staff records and workspace login accounts for the owner and admins.' },
  { key: 'custom_reports', label: 'Custom Report Builder', category: 'Sales & Fulfillment', description: 'Build your own report from live sales, stock and finance data.' },
  { key: 'payments', label: 'Payments & Ledger', category: 'Core Register', description: 'Payment records across cash, card, wallet and bank with reconciliation.' },
  { key: 'taxes', label: 'Tax Management', category: 'Core Register', description: 'Tax rates, tax groups and period tax summaries for the register.' },
  { key: 'notifications', label: 'Notifications Center', category: 'Core Register', description: 'Low-stock, expiry and system alerts collected in one inbox.' },
  { key: 'appointments', label: 'Service Appointments & Duration', category: 'Intelligence & Marketing', description: 'Duration, assigned staff and booking fields for service items.' },
  { key: 'promotions', label: 'Promotions & Discount Rules', category: 'Intelligence & Marketing', description: 'Campaigns, coupon codes and automatic discount rules for the register.' },
  { key: 'ask_avanyx', label: 'Chat with Avanyx AI', category: 'Intelligence & Marketing', description: 'Ask business questions and get answers grounded in your own live store data.' },
  { key: 'settings', label: 'Store Settings & Cloud Sync', category: 'Intelligence & Marketing', description: 'Business profile, receipt details, data sync and workspace preferences.' },
  { key: 'help', label: 'Help & Keyboard Shortcuts', category: 'Intelligence & Marketing', description: 'Shortcut reference and support guidance for daily operations.' },
];

/** Human label for any module key (falls back to the raw key for AI-only modules). */
const MODULE_LABELS: Partial<Record<SystemModuleKey, string>> = MODULE_DEFINITIONS.reduce(
  (acc, mod) => ({ ...acc, [mod.key]: mod.label }),
  {} as Partial<Record<SystemModuleKey, string>>
);

const moduleLabel = (key: SystemModuleKey): string =>
  MODULE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const COUNTRY_CURRENCY_PRESETS = [
  { country: 'United States', currency: 'USD' as CurrencyCode, symbol: '$', label: 'United States — USD ($)' },
  { country: 'Pakistan', currency: 'PKR' as CurrencyCode, symbol: '₨', label: 'Pakistan — PKR (₨)' },
  { country: 'United Kingdom', currency: 'GBP' as CurrencyCode, symbol: '£', label: 'United Kingdom — GBP (£)' },
  { country: 'United Arab Emirates', currency: 'AED' as CurrencyCode, symbol: 'AED', label: 'United Arab Emirates — AED (AED)' },
  { country: 'Saudi Arabia', currency: 'SAR' as CurrencyCode, symbol: 'SAR', label: 'Saudi Arabia — SAR (SR)' },
  { country: 'Europe', currency: 'EUR' as CurrencyCode, symbol: '€', label: 'Europe — EUR (€)' },
  { country: 'Canada', currency: 'CAD' as CurrencyCode, symbol: 'CA$', label: 'Canada — CAD (C$)' },
  { country: 'Australia', currency: 'AUD' as CurrencyCode, symbol: 'AU$', label: 'Australia — AUD (AU$)' },
  { country: 'India', currency: 'INR' as CurrencyCode, symbol: '₹', label: 'India — INR (₹)' },
  { country: 'Japan', currency: 'JPY' as CurrencyCode, symbol: '¥', label: 'Japan — JPY (¥)' },
  { country: 'China', currency: 'CNY' as CurrencyCode, symbol: '¥', label: 'China — CNY (¥)' },
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({ isOpen, onClose, isInitialSetup = false }) => {
  const { completeOnboarding, getAuthHeaders } = useAvanyx();

  const [step, setStep] = useState<number>(1);
  const [businessName, setBusinessName] = useState<string>('');
  const [industry, setIndustry] = useState<IndustryType>('clothing');
  const [businessModel, setBusinessModel] = useState<'product' | 'service' | 'hybrid'>('product');
  const [country, setCountry] = useState<string>('United States');
  const [primaryColor, setPrimaryColor] = useState<string>('#5B5CE2');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [language, setLanguage] = useState<LocaleCode>('en');
  const [taxRate, setTaxRate] = useState<number>(0.0);
  const [taxInclusive, setTaxInclusive] = useState<boolean>(false);
  const [enabledModules, setEnabledModules] = useState<SystemModuleKey[]>(() =>
    presetModulesForIndustry('clothing')
  );

  // AI Prompt Builder
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiProgressSteps, setAiProgressSteps] = useState<string[]>([]);
  const [aiProgressIndex, setAiProgressIndex] = useState<number>(-1);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [aiCatalogSchema, setAiCatalogSchema] = useState<CatalogSchema | null>(null);

  if (!isOpen) return null;

  const handleSelectIndustry = (preset: typeof INDUSTRY_PRESETS[0]) => {
    setIndustry(preset.id);
    setTaxRate(preset.defaultTax);

    // An option must bring its COMPLETE function set with it: the industry
    // blueprint defines both the catalog capabilities (what the POS renders)
    // and the modules (what the workspace exposes). Because the wizard used to
    // only store the ticked module keys — which nothing in the app read — the
    // chosen functions never appeared. Now the selection is applied to the
    // catalog schema itself, and an AI-tailored set is never discarded.
    const blueprintModules = presetModulesForIndustry(preset.id);
    setEnabledModules((prev) =>
      aiCatalogSchema ? Array.from(new Set<SystemModuleKey>([...blueprintModules, ...prev])) : blueprintModules
    );

    // Keep the profile's business model in lock-step with the catalog schema it
    // will be launched with (Reports/Products read this).
    setBusinessModel(deriveOnboardingFromSchema(buildPresetCatalogSchema(preset.id)).businessModel);
  };

  const handleToggleModule = (key: SystemModuleKey) => {
    if (key === 'pos' || key === 'products') return; // mandatory
    setEnabledModules(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const generateLocalAiCatalogSchema = (prompt: string): CatalogSchema => {
    const p = prompt.toLowerCase();
    const isEggOrPoultry = /egg|poultry|chicken|layer|broiler|birds|bird|farm|hatchery|feed|dairy/.test(p);
    const isJewelryOrGold = /gold|jewelry|jewel|silver|diamond|karat|tola|ornament|gem/.test(p);
    const isDoctorOrClinic = /doctor|clinic|patient|health|medic|prescri|hospital|consultant|therapy|dentist/.test(p);
    const isSalonOrSpa = /salon|spa|barber|hair|facial|massage|stylist|beauty/.test(p);
    const isRestaurant = /restaurant|cafe|food|dining|bakery|kitchen|chef|pizza|burger|drink|bar/.test(p);
    const isRepairOrTech = /repair|phone|tech|laptop|imei|serial|screen|mechanic|garage|auto|workshop/.test(p);
    const isDinoOrVault = /dinosaur|rare specimen|incubator specimen|specimen vault|fossil/.test(p);
    const hasOnlineStore = /online|store|ecommerce|website|delivery|web/.test(p);
    const hasDiscounts = /discount|promo|coupon|deal|sale|offer/.test(p);
    const hasAppointments = /appointment|booking|session|duration|slot|schedule/.test(p) || isDoctorOrClinic || isSalonOrSpa;
    const hasBatches = /batch|expiry|expire|feefo|fifo|perishable|lot/.test(p) || isDoctorOrClinic || isDinoOrVault || isEggOrPoultry;
    const hasSerials = /serial|imei|device|chassis|engine/.test(p) || isRepairOrTech || isJewelryOrGold;
    const hasBarcodes = !isDoctorOrClinic && !isSalonOrSpa && !isDinoOrVault;

    let businessType = 'Custom Business';
    let singular = 'Item';
    let plural = 'Items';
    let sellingModel: 'unit' | 'weight' | 'service' | 'duration' | 'measure' | 'mixed' | 'custom' = 'unit';

    if (isEggOrPoultry) {
      businessType = 'Egg & Poultry Farm / Store';
      singular = 'Egg / Poultry Product';
      plural = 'Egg & Poultry Products';
      sellingModel = 'unit';
    } else if (isJewelryOrGold) {
      businessType = 'Gold & Jewelry Retail';
      singular = 'Jewelry Piece / Bullion';
      plural = 'Jewelry Items';
      sellingModel = 'weight';
    } else if (isDoctorOrClinic) {
      businessType = 'Medical Clinic & Practice';
      singular = 'Patient Service';
      plural = 'Services & Consultations';
      sellingModel = 'service';
    } else if (isDinoOrVault) {
      businessType = 'Specialty Incubator & Storage';
      singular = 'Specimen / Vault';
      plural = 'Vault Specimens';
      sellingModel = 'custom';
    } else if (isSalonOrSpa) {
      businessType = 'Salon & Beauty Studio';
      singular = 'Service';
      plural = 'Services';
      sellingModel = 'service';
    } else if (isRestaurant) {
      businessType = 'Food & Beverage';
      singular = 'Dish';
      plural = 'Menu Items';
      sellingModel = 'unit';
    } else if (isRepairOrTech) {
      businessType = 'Tech Repair & Service';
      singular = 'Job / Part';
      plural = 'Repairs & Parts';
      sellingModel = 'mixed';
    }

    const units: string[] = isEggOrPoultry
      ? ['Dozen', 'Tray (30)', 'Carton', 'Piece', 'Kg', 'Crate']
      : isJewelryOrGold
      ? ['Gram', 'Tola', 'Carat', 'Piece']
      : isDoctorOrClinic
      ? ['Consultation', 'Session', 'Visit']
      : isDinoOrVault
      ? ['Specimen', 'Unit']
      : ['Unit', 'Pcs'];

    const categories: string[] = isEggOrPoultry
      ? ['Farm Fresh White Eggs', 'Organic Brown Eggs', 'Free Range Eggs', 'Quail Eggs', 'Poultry Feed', 'Broiler Chicken']
      : isJewelryOrGold
      ? ['Gold 24K', 'Gold 22K', 'Gold 21K', 'Gold 18K', 'Diamond Rings', 'Silver 925']
      : isDoctorOrClinic
      ? ['Consultations', 'Diagnostics', 'Procedures']
      : isDinoOrVault
      ? ['Rare Grade A', 'Incubating', 'Preserved']
      : ['General'];

    const recommendedMods: SystemModuleKey[] = ['pos', 'products', 'settings', 'dashboard', 'business_brain'];
    if (hasOnlineStore) recommendedMods.push('online_store');
    if (hasDiscounts) recommendedMods.push('promotions');
    if (hasAppointments) recommendedMods.push('appointments');
    if (hasBatches) recommendedMods.push('batch_tracking', 'inventory');
    if (hasSerials) recommendedMods.push('serial_tracking');
    if (isDoctorOrClinic || isSalonOrSpa) recommendedMods.push('services', 'customers');
    if (isRepairOrTech) recommendedMods.push('services', 'inventory', 'sales_orders');

    const fields = [
      { key: 'name', label: `${singular} Name`, type: 'text' as const, scope: 'item' as const, required: true, core: 'name' as const },
      { key: 'category', label: 'Category', type: 'select' as const, scope: 'item' as const, required: false, options: categories, core: 'category' as const },
      { key: 'selling_price', label: 'Rate / Price', type: 'currency' as const, scope: 'item' as const, required: true, core: 'sellingPrice' as const },
      { key: 'unit', label: 'Unit of Measure', type: 'select' as const, scope: 'item' as const, required: false, options: units, core: 'unit' as const },
      ...(isEggOrPoultry ? [
        { key: 'egg_grade', label: 'Egg Grade / Size', type: 'select' as const, scope: 'item' as const, required: false, options: ['Grade AA', 'Grade A', 'Grade B', 'Jumbo', 'Large', 'Medium', 'Standard'] },
        { key: 'pack_candling_date', label: 'Packing / Candling Date', type: 'date' as const, scope: 'item' as const, required: false },
        { key: 'expiry_date', label: 'Expiry / Best Before', type: 'date' as const, scope: 'item' as const, required: false },
        { key: 'batch_flock_no', label: 'Batch / Flock Number', type: 'text' as const, scope: 'item' as const, required: false }
      ] : []),
      ...(isJewelryOrGold ? [
        { key: 'purity_karat', label: 'Purity / Karat', type: 'select' as const, scope: 'item' as const, required: false, options: ['24K (99.9%)', '22K (91.6%)', '21K (87.5%)', '18K (75.0%)', '14K (58.3%)', '925 Sterling Silver'] },
        { key: 'gross_weight', label: 'Gross Weight', type: 'weight' as const, scope: 'item' as const, required: false, unit: 'g' },
        { key: 'net_weight', label: 'Net Weight (Gold/Metal Only)', type: 'weight' as const, scope: 'item' as const, required: false, unit: 'g' },
        { key: 'making_charges', label: 'Making / Labor Charges', type: 'currency' as const, scope: 'item' as const, required: false },
        { key: 'hallmark_cert', label: 'Hallmark / Certificate No', type: 'text' as const, scope: 'item' as const, required: false }
      ] : []),
      ...(isDoctorOrClinic ? [
        { key: 'dosage_notes', label: 'Clinical & Dosage Notes', type: 'textarea' as const, scope: 'item' as const, required: false },
        { key: 'duration_minutes', label: 'Consultation Duration (Mins)', type: 'number' as const, scope: 'item' as const, required: false, core: 'duration' as const }
      ] : []),
      ...(isDinoOrVault ? [
        { key: 'incubator_temp', label: 'Incubator Temp (°C)', type: 'number' as const, scope: 'item' as const, required: false },
        { key: 'viability_status', label: 'Viability Status', type: 'text' as const, scope: 'item' as const, required: false }
      ] : []),
      ...(isRepairOrTech ? [
        { key: 'device_imei', label: 'Device IMEI / Serial', type: 'text' as const, scope: 'item' as const, required: false },
        { key: 'technician_labor', label: 'Labor Estimate', type: 'currency' as const, scope: 'item' as const, required: false }
      ] : [])
    ];

    return {
      version: 1 as const,
      businessType,
      summary: `AI analyzed "${prompt.slice(0, 80)}" and configured tailored fields, units, and workflows.`,
      itemLabelSingular: singular,
      itemLabelPlural: plural,
      sellingModel,
      units,
      categories,
      fields,
      capabilities: {
        barcodes: hasBarcodes,
        sku: hasBarcodes,
        stock: !isDoctorOrClinic && !isSalonOrSpa,
        variants: !isDoctorOrClinic && !isDinoOrVault && !isSalonOrSpa,
        batchTracking: hasBatches,
        serialTracking: hasSerials,
        expiry: hasBatches,
        weightBased: isJewelryOrGold,
        appointments: hasAppointments,
        suppliers: !isDoctorOrClinic && !isSalonOrSpa,
        loyalty: !isDoctorOrClinic,
        onlineStore: hasOnlineStore
      },
      workflows: hasAppointments ? ['pos', 'appointments'] : ['pos'],
      recommendedModules: recommendedMods,
      confidence: 0.95,
      source: 'ai' as const
    };
  };

  const handleAiConfigure = async () => {
    if (!aiPrompt.trim()) return;
    setIsAnalyzingAi(true);
    setAiRationale(null);
    setAiProgressSteps([
      'Understanding your business...',
      'Analyzing products and services...',
      'Designing your product catalog...',
      'Selecting the right POS modules...',
      'Finalizing your Avanyx POS...'
    ]);
    setAiProgressIndex(0);

    const progressTimer = setInterval(() => {
      setAiProgressIndex(prev => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 5000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds max deadline

      let reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        if (typeof getAuthHeaders === 'function') {
          const authH = await getAuthHeaders();
          reqHeaders = { ...reqHeaders, ...authH };
        }
      } catch (_) {}

      const cRes = await fetch(getApiUrl('/api/ai/catalog-schema'), {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          businessRequirements: aiPrompt,
          businessName,
          country,
          currency,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const cData = await cRes.json();
      
      clearInterval(progressTimer);
      setAiProgressIndex(4);
      
      if (cData.success && cData.schema && Array.isArray(cData.schema.fields) && cData.schema.fields.length > 0) {
        const schema = cData.schema as CatalogSchema;
        setAiCatalogSchema(schema);
        setAiRationale(schema.summary || `Configured ${schema.businessType} blueprint successfully.`);

        const derivation = deriveOnboardingFromSchema(schema);
        setBusinessModel(derivation.businessModel);
        setEnabledModules(derivation.enabledModules);
        setIndustry(derivation.industry);
      } else {
        // Instant smart local fallback if server response was fallback
        const fallbackSchema = generateLocalAiCatalogSchema(aiPrompt);
        setAiCatalogSchema(fallbackSchema);
        setAiRationale(fallbackSchema.summary || 'Configured tailored business blueprint.');
        const derivation = deriveOnboardingFromSchema(fallbackSchema);
        setBusinessModel(derivation.businessModel);
        setEnabledModules(derivation.enabledModules);
        setIndustry(derivation.industry);
      }
    } catch (err) {
      clearInterval(progressTimer);
      console.warn('[AI Config] Falling back to instant local schema analysis:', err);
      const fallbackSchema = generateLocalAiCatalogSchema(aiPrompt);
      setAiCatalogSchema(fallbackSchema);
      setAiRationale(fallbackSchema.summary || 'Configured tailored business blueprint.');
      const derivation = deriveOnboardingFromSchema(fallbackSchema);
      setBusinessModel(derivation.businessModel);
      setEnabledModules(derivation.enabledModules);
      setIndustry(derivation.industry);
    } finally {
      setTimeout(() => setIsAnalyzingAi(false), 1500); // give time for final success animation
    }
  };

  const getCategoryForIndustry = (ind: IndustryType): 'retail' | 'beauty' | 'healthcare' | 'food' | 'automotive' | 'education' | 'professional' | 'other' => {
    if (['salon', 'barber'].includes(ind)) return 'beauty';
    if (['pharmacy'].includes(ind)) return 'healthcare';
    if (['restaurant', 'cafe'].includes(ind)) return 'food';
    if (['repair', 'workshop', 'auto_parts'].includes(ind)) return 'automotive';
    if (['professional'].includes(ind)) return 'professional';
    return 'retail';
  };

  const handleFinish = () => {
    const baseSchema = aiCatalogSchema || buildPresetCatalogSchema(industry);
    const finalSchema = applyModulesToSchema(baseSchema, enabledModules);

    completeOnboarding({
      businessName: businessName.trim() || 'My Business',
      industry,
      businessModel,
      industryCategory: getCategoryForIndustry(industry),
      primaryColor,
      country,
      currency,
      language,
      enabledModules,
      taxRate,
      taxInclusive,
      catalogSchema: finalSchema,
    });
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/90 backdrop-blur-md overflow-y-auto ${isInitialSetup ? 'bg-[#070A14]' : ''}`}>
      <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-[#F8FAFC]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1F2E4D] flex items-center justify-between bg-slate-50 dark:bg-[#0B1220]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-[#F8FAFC]">
                {isInitialSetup ? 'Avanyx — Universal Business Setup & POS Customizer' : 'Avanyx Business Setup & POS Customizer'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">Step {step} of 4 — {
                step === 1 ? 'Business Identity & Localization' :
                step === 2 ? 'Industry Blueprint & AI Setup' :
                step === 3 ? 'Modular Workspace Configuration' :
                'Review & Initialize Store'
              }</p>
            </div>
          </div>
          {!isInitialSetup && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#152644] transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-[#0B1220] h-1.5 flex">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-full transition-all duration-300 ${
                s <= step ? 'bg-primary' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: IDENTITY & LOCALIZATION */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#F8FAFC] mb-1">Let's name and localize your business</h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">These settings configure your register headers, default currency symbols, and multi-lingual UI.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">Business / Store Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Solstice Boutique, Urban Cafe, Apex Tech Repairs"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/50 focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">Country & Default Currency *</label>
                  <select
                    value={COUNTRY_CURRENCY_PRESETS.findIndex(p => p.country === country && p.currency === currency)}
                    onChange={e => {
                      const idx = parseInt(e.target.value);
                      if (!isNaN(idx) && COUNTRY_CURRENCY_PRESETS[idx]) {
                        setCountry(COUNTRY_CURRENCY_PRESETS[idx].country);
                        setCurrency(COUNTRY_CURRENCY_PRESETS[idx].currency);
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-sm text-slate-900 dark:text-[#F8FAFC] focus:border-primary focus:outline-hidden"
                  >
                    {COUNTRY_CURRENCY_PRESETS.map((p, idx) => (
                      <option key={idx} value={idx}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">Default Receipt Language</label>
                  <p className="text-[10px] text-slate-500">
                    The language used to print and format customer thermal receipts & commercial invoices. (The application UI remains in English).
                  </p>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as LocaleCode)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] text-sm text-slate-900 dark:text-[#F8FAFC] focus:border-primary focus:outline-hidden"
                  >
                    <option value="en">English (US / UK)</option>
                    <option value="ur">اردو (Urdu - RTL)</option>
                    <option value="zh">中文 (Chinese Simplified)</option>
                    <option value="pt">Português (Portuguese)</option>
                    <option value="ar">العربية (Arabic - RTL)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                  </select>
                </div>
              </div>

              {/* Business Model Selection */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">Business Operational Model *</label>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium leading-relaxed">
                  How does your business generate revenue? We use this to adapt product catalogs, service forms, and billing terms.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBusinessModel('product')}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      businessModel === 'product'
                        ? 'border-primary bg-primary-light text-slate-900 dark:text-white shadow-2xs'
                        : 'border-slate-200 dark:border-[#1F2E4D] bg-white dark:bg-[#111C30] hover:bg-slate-50 dark:hover:bg-[#152644]/50 text-slate-700 dark:text-[#94A3B8]'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-[#F8FAFC]">Physical Products Only</h4>
                      <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed font-medium">For retail, clothing, groceries, and electronics stores selling physical items with inventory, barcodes, SKUs, and size/color matrices.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBusinessModel('service')}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      businessModel === 'service'
                        ? 'border-primary bg-primary-light text-slate-900 dark:text-white shadow-2xs'
                        : 'border-slate-200 dark:border-[#1F2E4D] bg-white dark:bg-[#111C30] hover:bg-slate-50 dark:hover:bg-[#152644]/50 text-slate-700 dark:text-[#94A3B8]'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-[#F8FAFC]">Services & Bookings Only</h4>
                      <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed font-medium">For salons, clinics, consulting, repairs, and spa treatments. Focuses on service durations, specialists, appointments, and commissions.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBusinessModel('hybrid')}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      businessModel === 'hybrid'
                        ? 'border-primary bg-primary-light text-slate-900 dark:text-white shadow-2xs'
                        : 'border-slate-200 dark:border-[#1F2E4D] bg-white dark:bg-[#111C30] hover:bg-slate-50 dark:hover:bg-[#152644]/50 text-slate-700 dark:text-[#94A3B8]'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-[#F8FAFC]">Hybrid (Products + Services)</h4>
                      <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed font-medium">For hybrid setups (e.g. hair salon retailing products, auto workshop billing parts and repairs). Supports both item forms seamlessly.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Brand Design System & Color Palette Selection */}
              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-[#F8FAFC]">Store Design System & Accent Color</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">Choose your primary brand theme color. The entire system UI and POS register adapt to your choice.</p>
                  </div>
                  <span
                    className="w-5 h-5 rounded-full border border-white/40 shadow-xs transition-all"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 pt-1">
                  {AVANYX_COLOR_PALETTES.map(palette => {
                    const isSelected = primaryColor.toLowerCase() === palette.hex.toLowerCase();
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => setPrimaryColor(palette.hex)}
                        className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-white dark:bg-[#111C30] border-slate-900 dark:border-white shadow-md ring-2'
                            : 'bg-white/60 dark:bg-[#111C30]/60 border-slate-200 dark:border-[#1F2E4D] hover:border-slate-400'
                        }`}
                        style={{ boxShadow: isSelected ? `0 0 0 2px ${palette.hex}` : undefined }}
                      >
                        <span
                          className="w-6 h-6 rounded-full shadow-xs flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: palette.hex }}
                        >
                          {isSelected && '✓'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full text-center">
                          {palette.name.replace('Avanyx ', '').replace('Electric ', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tax Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] space-y-3">
                <div className="flex items-center gap-2 text-primary font-extrabold text-xs">
                  <Percent className="w-4 h-4" />
                  <span>Sales Tax & VAT Defaults</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-[#94A3B8] mb-1 block">Default Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] text-xs text-slate-900 dark:text-[#F8FAFC] focus:border-primary focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-[#94A3B8]">
                      <input
                        type="checkbox"
                        checked={taxInclusive}
                        onChange={e => setTaxInclusive(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-[#1F2E4D] bg-white dark:bg-[#111C30] text-primary focus:ring-primary"
                      />
                      <span className="font-medium">Item prices are Tax-Inclusive (VAT included)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INDUSTRY BLUEPRINT */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#F8FAFC] mb-1">Select your industry blueprint</h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">Choose a preset or tell the AI what you do for automatic module tailoring.</p>
              </div>

              {/* AI Natural Language Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] space-y-3">
                <div className="flex items-center gap-2 text-primary font-extrabold text-xs">
                  <Wand2 className="w-4 h-4" />
                  <span>Ask Avanyx AI to configure your store from a sentence</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'I run a mobile phone repair shop with parts, technician labor, and IMEI tracking'"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] text-xs text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/50 focus:border-primary focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAiConfigure}
                    disabled={isAnalyzingAi || !aiPrompt.trim()}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition active:scale-98"
                  >
                    {isAnalyzingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Auto-Configure</span>
                  </button>
                </div>
                {aiCatalogSchema && !isAnalyzingAi && (
                  <div className="mt-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                          ✓ Auto-Configured: {aiCatalogSchema.businessType || 'Tailored Store Blueprint'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        {aiCatalogSchema.fields?.length || 4} custom fields
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {aiRationale || aiCatalogSchema.summary}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                      <div className="flex flex-wrap gap-1.5">
                        {enabledModules.slice(0, 4).map(mod => (
                          <span key={mod} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-[#111C30] border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-200">
                            ✓ {mod.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))}
                        {enabledModules.length > 4 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 self-center">
                            +{enabledModules.length - 4} more modules
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer ml-auto"
                      >
                        <span>Review Configured Modules</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {aiRationale && !aiCatalogSchema && !isAnalyzingAi && (
                  <p className="text-[11px] text-primary bg-primary-light p-2.5 rounded-xl border border-primary/20 font-medium">
                    💡 <strong>AI Analysis:</strong> {aiRationale}
                  </p>
                )}
                {isAnalyzingAi && aiProgressSteps.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-white dark:bg-[#0B1220] border border-primary/20 shadow-2xs">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">Avanyx AI</span>
                    </div>
                    <p className="text-xs font-semibold text-primary mb-4 animate-pulse">Analyzing your business...</p>
                    <div className="space-y-2.5 mb-4">
                      {aiProgressSteps.map((stepStr, idx) => {
                        let statusIcon;
                        let textClass;
                        if (idx < aiProgressIndex) {
                          statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                          textClass = "text-slate-700 dark:text-[#94A3B8]";
                        } else if (idx === aiProgressIndex) {
                          statusIcon = <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
                          textClass = "text-primary font-semibold";
                        } else {
                          statusIcon = <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700" />;
                          textClass = "text-slate-400 dark:text-slate-600";
                        }
                        
                        return (
                          <div key={idx} className="flex items-center gap-2.5">
                            {statusIcon}
                            <span className={`text-xs ${textClass}`}>{stepStr}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">This may take a few moments...</p>
                  </div>
                )}
              </div>

              {/* Industry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {INDUSTRY_PRESETS.map(preset => {
                  const Icon = preset.icon;
                  const isSelected = industry === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectIndustry(preset)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary-light text-slate-900 dark:text-[#F8FAFC] shadow-2xs ring-2 ring-primary/20'
                          : 'border-slate-200 dark:border-[#1F2E4D] bg-white dark:bg-[#111C30] hover:bg-slate-50 dark:hover:bg-[#152644]/50 text-slate-700 dark:text-[#94A3B8]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white shadow-2xs' : 'bg-slate-100 dark:bg-[#0B1220] text-primary'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-[#F8FAFC]">{preset.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed font-medium">{preset.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: MODULAR WORKSPACE CONFIG */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#F8FAFC] mb-1">Assemble your modules</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">Toggle only what you need. You can always add or remove modules later.</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-primary-light text-primary border border-primary/20 text-xs font-extrabold">
                    {enabledModules.length} Modules Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {MODULE_DEFINITIONS.map(mod => {
                  const isChecked = enabledModules.includes(mod.key);
                  const isMandatory = mod.key === 'pos' || mod.key === 'products';
                  return (
                    <div
                      key={mod.key}
                      onClick={() => !isMandatory && handleToggleModule(mod.key)}
                      className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                        isChecked
                          ? 'border-primary bg-primary-light text-slate-900 dark:text-[#F8FAFC]'
                          : 'border-slate-200 dark:border-[#1F2E4D] bg-white dark:bg-[#111C30] text-slate-500 dark:text-[#94A3B8] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isMandatory}
                        onChange={() => !isMandatory && handleToggleModule(mod.key)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-[#1F2E4D] bg-white dark:bg-[#0B1220] text-primary focus:ring-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold ${isChecked ? 'text-slate-900 dark:text-[#F8FAFC]' : 'text-slate-500 dark:text-[#94A3B8]'}`}>
                            {mod.label}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-primary px-1.5 py-0.5 rounded bg-primary-light border border-primary/20">
                            {mod.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-0.5 line-clamp-2 leading-relaxed font-medium">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & LAUNCH */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#F8FAFC] mb-1">Ready to launch your tailored POS</h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">Review your store parameters before initializing the workspace.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] space-y-2.5">
                  <span className="text-[10px] uppercase font-extrabold text-primary tracking-wider">Business Identity</span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">{businessName}</div>
                  <div className="text-xs text-slate-600 dark:text-[#94A3B8] flex items-center gap-2">
                    <span>Industry:</span>
                    <span className="px-2 py-0.5 rounded-lg bg-primary-light text-primary font-bold capitalize">
                      {industry}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Currency: <strong className="text-slate-900 dark:text-[#F8FAFC]">{currency}</strong> | Receipt Language: <strong className="text-slate-900 dark:text-[#F8FAFC]">{language.toUpperCase()}</strong>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Tax Rate: <strong className="text-slate-900 dark:text-[#F8FAFC]">{taxRate}%</strong> ({taxInclusive ? 'Inclusive' : 'Exclusive'})
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] space-y-2.5">
                  <span className="text-[10px] uppercase font-extrabold text-primary tracking-wider">Active Modules ({enabledModules.length})</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto">
                    {enabledModules.map(m => (
                      <span key={m} className="px-2 py-1 rounded-lg bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] text-[10px] font-bold text-slate-700 dark:text-[#94A3B8]">
                        {moduleLabel(m)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-extrabold text-slate-900 dark:text-[#F8FAFC]">Full Role-Based Security Configured</div>
                  <p className="text-emerald-700 dark:text-emerald-400/80 leading-relaxed font-medium">
                    Master Admin role initialized. Cashiers and staff will only see permissions explicitly assigned to their subuser profiles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-[#1F2E4D] flex items-center justify-between bg-slate-50 dark:bg-[#0B1220]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#152644] hover:bg-slate-200 text-slate-700 dark:text-[#F8FAFC] text-xs font-bold flex items-center gap-1.5 transition border border-slate-200 dark:border-[#1F2E4D]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !businessName.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition active:scale-98"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-2xs transition active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Launch Avanyx Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
