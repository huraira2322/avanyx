import {
  BusinessProfile,
  CatalogSchema,
  CatalogField,
  CatalogCapabilities,
  CatalogCoreBinding,
  CatalogFieldScope,
  IndustryType,
  SystemModuleKey,
} from '../types';
import { INDUSTRY_PRESETS as CANONICAL_INDUSTRY_PRESETS } from '../data/industryPresets';

export const NEUTRAL_CAPABILITIES: CatalogCapabilities = {
  barcodes: false,
  sku: false,
  stock: false,
  variants: false,
  batchTracking: false,
  serialTracking: false,
  expiry: false,
  weightBased: false,
  appointments: false,
  suppliers: false,
  loyalty: false,
  onlineStore: false,
};

/**
 * Assumption-free catalog used only when a business has no AI-generated schema.
 * It deliberately enables NO retail capability.
 */
export const NEUTRAL_CATALOG_SCHEMA: CatalogSchema = {
  version: 1,
  businessType: 'General Business',
  summary: 'A minimal, industry-neutral catalog. Generate a tailored catalog from your business description.',
  itemLabelSingular: 'Item',
  itemLabelPlural: 'Items',
  sellingModel: 'custom',
  units: ['Unit', 'Pcs'],
  categories: ['General'],
  fields: [
    { key: 'name', label: 'Name', type: 'text', scope: 'item', required: true, core: 'name' },
    { key: 'category', label: 'Category / Group', type: 'select', scope: 'item', required: false, core: 'category', options: ['General'] },
    {
      key: 'selling_price',
      label: 'Selling Price',
      type: 'currency',
      scope: 'item',
      required: true,
      core: 'sellingPrice',
    },
    { key: 'unit', label: 'Unit of Measure', type: 'select', scope: 'item', required: false, core: 'unit', options: ['Unit', 'Pcs'] },
    { key: 'description', label: 'Description', type: 'textarea', scope: 'item', required: false, core: 'description' },
  ],
  capabilities: { ...NEUTRAL_CAPABILITIES },
  workflows: ['pos'],
  confidence: 0.3,
  source: 'fallback',
};

export function getActiveCatalogSchema(business?: BusinessProfile | null): CatalogSchema {
  const s = business?.catalogSchema;
  if (s && Array.isArray(s.fields) && s.fields.length > 0) {
    const units = Array.isArray(s.units) && s.units.length > 0 ? s.units : ['Unit', 'Pcs'];
    const categories = Array.isArray(s.categories) && s.categories.length > 0 ? s.categories : ['General'];
    
    // Ensure unit and category fields exist in fields
    let fields = [...s.fields];
    if (!fields.some((f) => f.core === 'unit' || f.key === 'unit')) {
      fields.push({ key: 'unit', label: 'Unit of Measure', type: 'select', scope: 'item', required: false, core: 'unit', options: units });
    }
    if (!fields.some((f) => f.core === 'category' || f.key === 'category')) {
      fields.push({ key: 'category', label: 'Category / Group', type: 'select', scope: 'item', required: false, core: 'category', options: categories });
    }
    
    // Ensure category and unit options are populated from schema
    fields = fields.map((f) => {
      if ((f.core === 'unit' || f.key === 'unit') && (!f.options || f.options.length === 0)) {
        return { ...f, type: 'select' as const, options: units };
      }
      if ((f.core === 'category' || f.key === 'category') && (!f.options || f.options.length === 0)) {
        return { ...f, type: 'select' as const, options: categories };
      }
      return f;
    });

    return {
      ...s,
      units,
      categories,
      fields,
      capabilities: { ...NEUTRAL_CAPABILITIES, ...(s.capabilities || {}) },
    };
  }
  return NEUTRAL_CATALOG_SCHEMA;
}

export function hasAiCatalog(business?: BusinessProfile | null): boolean {
  return Boolean(business?.catalogSchema && Array.isArray(business.catalogSchema.fields));
}

export function fieldsForScope(schema: CatalogSchema, scope: CatalogFieldScope): CatalogField[] {
  return (schema.fields || []).filter((f) => f.scope === scope);
}

/** Fields that are NOT bound to a core POS column (i.e. free-form dynamic fields). */
export function dynamicFieldsForScope(schema: CatalogSchema, scope: CatalogFieldScope): CatalogField[] {
  return fieldsForScope(schema, scope).filter((f) => !f.core);
}

export function boundField(
  schema: CatalogSchema,
  core: CatalogCoreBinding,
  scope: CatalogFieldScope = 'item'
): CatalogField | undefined {
  return (schema.fields || []).find((f) => f.core === core && f.scope === scope);
}

/** Whether a core POS column should be shown for this business. */
export function isCoreFieldVisible(schema: CatalogSchema, core: CatalogCoreBinding): boolean {
  const c = schema.capabilities || NEUTRAL_CAPABILITIES;
  switch (core) {
    case 'barcode':
      return !!c.barcodes;
    case 'sku':
      return !!c.sku;
    case 'stock':
    case 'minStock':
      return !!c.stock;
    default:
      return true;
  }
}

/** Human label for a core column, using the AI schema when it named it. */
export function coreLabel(schema: CatalogSchema, core: CatalogCoreBinding, fallback: string): string {
  return boundField(schema, core)?.label || fallback;
}

export function emptyCatalogValues(schema: CatalogSchema, scope: CatalogFieldScope = 'item'): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fieldsForScope(schema, scope)) {
    if (f.type === 'boolean') out[f.key] = false;
    else if (f.type === 'multiselect') out[f.key] = [];
    else out[f.key] = '';
  }
  return out;
}

/**
 * A normalized, UI-ready view of a business derived ENTIRELY from its catalog
 * schema. This is the single source of truth for how the POS, product catalog,
 * terminology, columns, and workflows render for a given business. No hardcoded
 * industry list is consulted.
 */
export interface BusinessModelView {
  schema: CatalogSchema;
  itemLabelSingular: string;
  itemLabelPlural: string;
  itemLabelLower: string;
  itemLabelPluralLower: string;
  sellingModel: CatalogSchema['sellingModel'];
  capabilities: CatalogCapabilities;
  workflows: string[];
  /** The business sells time/booking-based services (doctor, salon, plumbing). */
  isService: boolean;
  /** The business sells physical/unit-based goods (retail, wholesale, groceries). */
  isProduct: boolean;
  /** The business mixes products and services, or is custom/unusual. */
  isHybrid: boolean;
  hasAppointments: boolean;
  hasBarcodes: boolean;
  hasSku: boolean;
  hasStock: boolean;
  hasVariants: boolean;
  isWeightBased: boolean;
  hasAiCatalog: boolean;
}

export function deriveBusinessModel(schema: CatalogSchema): BusinessModelView {
  const caps = schema.capabilities || NEUTRAL_CAPABILITIES;
  const sm = schema.sellingModel;
  const workflows = Array.isArray(schema.workflows) ? schema.workflows : [];
  const isService = sm === 'service' || sm === 'duration';
  const isProduct = sm === 'unit' || sm === 'weight' || sm === 'measure';
  const singular = schema.itemLabelSingular || 'Item';
  const plural = schema.itemLabelPlural || 'Items';

  return {
    schema,
    itemLabelSingular: singular,
    itemLabelPlural: plural,
    itemLabelLower: singular.toLowerCase(),
    itemLabelPluralLower: plural.toLowerCase(),
    sellingModel: sm,
    capabilities: caps,
    workflows,
    isService,
    isProduct,
    isHybrid: sm === 'mixed' || sm === 'custom' || (!isService && !isProduct),
    hasAppointments: !!caps.appointments || workflows.includes('appointments'),
    hasBarcodes: !!caps.barcodes,
    hasSku: !!caps.sku,
    hasStock: !!caps.stock,
    hasVariants: !!caps.variants,
    isWeightBased: !!caps.weightBased,
    hasAiCatalog: schema.source === 'ai',
  };
}

export interface OnboardingDerivation {
  businessModel: 'product' | 'service' | 'hybrid';
  industry: IndustryType;
  industryCategory: 'retail' | 'beauty' | 'healthcare' | 'food' | 'automotive' | 'education' | 'professional' | 'other';
  enabledModules: SystemModuleKey[];
}

/**
 * Maps a catalog schema directly to onboarding inputs. This replaces the old
 * hardcoded keyword-matching `/api/ai/recommend-pos` path: a business's
 * capabilities and selling model — not its industry label — determine the
 * modules and model that get enabled.
 */
export function deriveOnboardingFromSchema(schema: CatalogSchema): OnboardingDerivation {
  const m = deriveBusinessModel(schema);
  const caps = m.capabilities;
  const businessType = (schema.businessType || '').toLowerCase();

  const modules: SystemModuleKey[] = [
    'pos',
    'products',
    'customers',
    'business_brain',
    'financial_reports',
    'dashboard',
    'settings',
    'ask_velcora',
  ];
  if (caps.barcodes) modules.push('barcodes');
  if (caps.stock) modules.push('inventory');
  if (caps.batchTracking) modules.push('batch_tracking');
  if (caps.serialTracking) modules.push('serial_tracking');
  if (caps.appointments || m.workflows.includes('appointments')) modules.push('appointments');
  if (caps.suppliers) modules.push('suppliers', 'purchases');
  if (caps.loyalty) modules.push('loyalty');
  if (caps.onlineStore) modules.push('online_store');
  if (m.isService || m.isHybrid) modules.push('services');
  // Expiry monitoring is part of the Batch & Expiry module — without this the
  // module (and therefore the capability round-trip) was silently dropped.
  if (caps.expiry) modules.push('inventory', 'batch_tracking');

  if (Array.isArray(schema.recommendedModules)) {
    for (const rm of schema.recommendedModules) {
      if (typeof rm === 'string' && rm.trim() !== '') {
        modules.push(rm as SystemModuleKey);
      }
    }
  }

  // Coarse, best-effort industry label (the schema — not this label — drives
  // the actual POS/product behaviour). Falls back to 'custom' for anything new.
  let industry: IndustryType = 'custom';
  if (/restaurant|cafe|food|bakery|dining/.test(businessType)) industry = 'restaurant';
  else if (/pharm|medic|drug|clinic|health/.test(businessType)) industry = 'pharmacy';
  else if (/cloth|fashion|apparel|boutique|shoe|footwear|garment/.test(businessType)) industry = 'clothing';
  else if (/groc|mart|supermarket|produce/.test(businessType)) industry = 'grocery';
  else if (/salon|barber|beauty|spa|nails|massage/.test(businessType)) industry = 'salon';
  else if (/repair|phone|tech|electronic|laptop|computer/.test(businessType)) industry = 'electronics';
  else if (/hardware|furniture|tool/.test(businessType)) industry = 'hardware';
  else if (/wholesale|distribut|b2b/.test(businessType)) industry = 'wholesale';
  else if (/service|consult|doctor|dentist|lawyer|accountant|plumb|electric|gym|tutor|coach/.test(businessType))
    industry = 'service';

  const industryCategory = (
    /beauty|salon|spa|barber/.test(businessType)
      ? 'beauty'
      : /pharm|medic|clinic|doctor|dentist|health/.test(businessType)
        ? 'healthcare'
        : /restaurant|cafe|food|bakery/.test(businessType)
          ? 'food'
          : /repair|auto|workshop|mechanic/.test(businessType)
            ? 'automotive'
            : /consult|lawyer|accountant|professional|tutor|coach/.test(businessType)
              ? 'professional'
              : 'retail'
  ) as OnboardingDerivation['industryCategory'];

  return {
    businessModel: m.isService ? 'service' : m.isProduct ? 'product' : 'hybrid',
    industry,
    industryCategory,
    enabledModules: Array.from(new Set(modules)),
  };
}

// ─── Module  capability reconciliation ─────────────────────────────────────
//
// The POS renders features exclusively from `catalogSchema.capabilities`
// (useBusinessModel -> deriveBusinessModel). Selecting a module during
// onboarding therefore only means something if it ALSO switches its capability
// on — otherwise the module is dead data and the function never appears.

/** The capability (or capabilities) a module needs in order to be usable. */
export const MODULE_CAPABILITY_REQUIREMENTS: Partial<Record<SystemModuleKey, (keyof CatalogCapabilities)[]>> = {
  barcodes: ['barcodes'],
  inventory: ['stock'],
  batch_tracking: ['batchTracking', 'expiry'],
  serial_tracking: ['serialTracking'],
  suppliers: ['suppliers'],
  purchases: ['suppliers'],
  loyalty: ['loyalty'],
  online_store: ['onlineStore'],
  appointments: ['appointments'],
};

/**
 * Capabilities no module owns: an SKU column or weight-based pricing is a
 * property of the catalog itself, not a toggle — a module selection must never
 * switch them off.
 */
export const SCHEMA_ONLY_CAPABILITIES: (keyof CatalogCapabilities)[] = ['sku', 'weightBased'];

/** The capability set implied by an explicit module selection. */
export function capabilitiesFromModules(
  modules: SystemModuleKey[],
  schemaCapabilities?: Partial<CatalogCapabilities> | null
): CatalogCapabilities {
  const caps: CatalogCapabilities = { ...NEUTRAL_CAPABILITIES };
  const schemaCaps = schemaCapabilities || {};
  for (const key of SCHEMA_ONLY_CAPABILITIES) caps[key] = !!schemaCaps[key];
  const enabled = new Set<SystemModuleKey>(modules);
  for (const moduleKey of Object.keys(MODULE_CAPABILITY_REQUIREMENTS) as SystemModuleKey[]) {
    if (!enabled.has(moduleKey)) continue;
    for (const cap of MODULE_CAPABILITY_REQUIREMENTS[moduleKey] || []) caps[cap] = true;
  }
  return caps;
}

/** Modules implied by a capability set (the inverse of the map above). */
export function modulesFromCapabilities(caps?: Partial<CatalogCapabilities> | null): SystemModuleKey[] {
  const source = caps || {};
  const out: SystemModuleKey[] = [];
  for (const moduleKey of Object.keys(MODULE_CAPABILITY_REQUIREMENTS) as SystemModuleKey[]) {
    const required = MODULE_CAPABILITY_REQUIREMENTS[moduleKey] || [];
    if (required.some((cap) => !!source[cap])) out.push(moduleKey);
  }
  return out;
}

/**
 * Applies a module selection to a catalog schema: enabling a module turns its
 * capability ON (the function appears), disabling one turns the capability the
 * module owns OFF, and schema-only capabilities are preserved untouched.
 */
export function applyModulesToSchema(schema: CatalogSchema, modules: SystemModuleKey[]): CatalogSchema {
  const capabilities = capabilitiesFromModules(modules, schema.capabilities);
  const reconciled: CatalogSchema = { ...schema, capabilities };
  const workflows = (schema.workflows || []).filter((w) => w !== 'appointments');
  if (modules.includes('appointments')) workflows.push('appointments');
  const fields = (schema.fields || []).filter((f) => !f.core || isCoreFieldVisible(reconciled, f.core));
  return { ...reconciled, fields, workflows };
}

// ─── Industry blueprint  catalog schema ────────────────────────────────────
//
// Picking an industry card during onboarding must immediately produce a real
// catalog schema. Without one `getActiveCatalogSchema` falls back to
// NEUTRAL_CATALOG_SCHEMA (every capability false) and none of the functions the
// user chose — batch tracking, barcodes, expiry, stock, online store … — appear.

export interface PresetCatalogBlueprint {
  businessType: string;
  summary: string;
  itemLabelSingular: string;
  itemLabelPlural: string;
  sellingModel: CatalogSchema['sellingModel'];
  capabilities: Partial<CatalogCapabilities>;
  units: string[];
  categories: string[];
  /** Extra (non-core) fields that make the blueprint's capabilities real. */
  fields: CatalogField[];
  /** Modules the blueprint needs that its capabilities do not already imply. */
  modules: SystemModuleKey[];
}

/** Every business gets these regardless of industry. */
const CORE_ONBOARDING_MODULES: SystemModuleKey[] = [
  'pos', 'products', 'business_brain', 'financial_reports', 'settings', 'ask_velcora',
];

export const PRESET_CATALOG_BLUEPRINTS: Record<string, PresetCatalogBlueprint> = {
  // Bit of a long tail; keep it readable: capabilities drive the POS, modules
  // drive the workspace, and both come from this single table.
  clothing: {
    businessType: 'Clothing, Fashion & Apparel',
    summary: 'Variant-driven apparel catalog with size/colour matrices, barcodes, loyalty and an online store.',
    itemLabelSingular: 'Product',
    itemLabelPlural: 'Products',
    sellingModel: 'unit',
    capabilities: { sku: true, stock: true, variants: true, barcodes: true, loyalty: true, onlineStore: true },
    units: ['Pcs', 'Pair', 'Box'],
    categories: ['T-Shirts & Tops', 'Dresses', 'Jeans & Trousers', 'Jackets & Coats', 'Footwear', 'Accessories'],
    fields: [
      {
        key: 'size',
        label: 'Size',
        type: 'select',
        scope: 'variant',
        required: false,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
      },
      { key: 'color', label: 'Colour', type: 'text', scope: 'variant', required: false },
    ],
    modules: ['customers'],
  },
  retail: {
    businessType: 'Retail Store',
    summary: 'Unit-based retail catalog with SKU codes, barcodes, stock control and supplier records.',
    itemLabelSingular: 'Item',
    itemLabelPlural: 'Items',
    sellingModel: 'unit',
    capabilities: { sku: true, stock: true, barcodes: true, suppliers: true },
    units: ['Pcs', 'Box', 'Pack'],
    categories: ['General Products', 'Accessories', 'Consumables'],
    fields: [],
    modules: ['customers'],
  },
  grocery: {
    businessType: 'Supermarket & Grocery Store',
    summary: 'High-speed barcode checkout with batch/expiry control, weight-based items and supplier receiving.',
    itemLabelSingular: 'Item',
    itemLabelPlural: 'Items',
    sellingModel: 'unit',
    capabilities: {
      sku: true,
      stock: true,
      barcodes: true,
      batchTracking: true,
      expiry: true,
      weightBased: true,
      loyalty: true,
      suppliers: true,
    },
    units: ['Kg', 'Gram', 'Pcs', 'Pack', 'Bottle', 'Litre'],
    categories: [
      'Dairy & Eggs',
      'Bakery & Bread',
      'Fresh Fruits & Veg',
      'Snacks & Confectionery',
      'Beverages',
      'Cleaning & Hygiene',
    ],
    fields: [],
    modules: ['customers'],
  },
  restaurant: {
    businessType: 'Restaurant & Cafe',
    summary: 'Dine-in, takeaway and delivery order flow with recipe-level stock consumption and kitchen notes.',
    itemLabelSingular: 'Dish',
    itemLabelPlural: 'Dishes',
    sellingModel: 'mixed',
    capabilities: { stock: true, loyalty: true, onlineStore: true },
    units: ['Portion', 'Glass', 'Plate', 'Kg'],
    categories: ['Starters & Appetizers', 'Main Courses', 'Beverages & Mocktails', 'Desserts', 'Chef Specials'],
    fields: [],
    modules: ['customers', 'delivery_notes', 'expenses', 'other_income', 'employees'],
  },
  pharmacy: {
    businessType: 'Pharmacy & Medical Store',
    summary: 'Batch- and expiry-controlled medicine catalog with prescription records and supplier reconciliation.',
    itemLabelSingular: 'Medicine',
    itemLabelPlural: 'Medicines',
    sellingModel: 'unit',
    capabilities: { sku: true, stock: true, barcodes: true, batchTracking: true, expiry: true, suppliers: true },
    units: ['Strip', 'Box', 'Bottle', 'Vial', 'Tube'],
    categories: [
      'Antibiotics & Anti-infectives',
      'Pain Relief & Analgesics',
      'Cardiovascular',
      'Vitamins & Supplements',
      'First Aid & Surgical',
      'Personal Care',
    ],
    fields: [],
    modules: ['customers', 'expenses'],
  },
  repair: {
    businessType: 'Repair Shop & Service Center',
    summary: 'Serial/IMEI-tracked device intake with repair estimates, parts stock and delivery notes.',
    itemLabelSingular: 'Repair Job',
    itemLabelPlural: 'Repair Jobs',
    sellingModel: 'mixed',
    capabilities: { sku: true, stock: true, serialTracking: true, suppliers: true },
    units: ['Service', 'Unit', 'Pcs'],
    categories: [
      'Repair Labor & Services',
      'Replacement Displays',
      'Batteries & Charging',
      'Motherboard Components',
      'Accessories & Cases',
    ],
    fields: [],
    modules: ['customers', 'estimates', 'sales_orders', 'delivery_notes', 'expenses'],
  },
  electronics: {
    businessType: 'Consumer Electronics & Gadgets',
    summary: 'Serial/IMEI-tracked device catalog with warranties, accessories and supplier purchasing.',
    itemLabelSingular: 'Device',
    itemLabelPlural: 'Devices',
    sellingModel: 'unit',
    capabilities: { sku: true, stock: true, barcodes: true, serialTracking: true, suppliers: true, onlineStore: true },
    units: ['Unit', 'Pcs', 'Set'],
    categories: [
      'Smartphones & Tablets',
      'Laptops & Computers',
      'Audio & Headphones',
      'Smart Watches & Wearables',
      'Cables & Chargers',
    ],
    fields: [],
    modules: ['customers', 'estimates', 'sales_orders'],
  },
  wholesale: {
    businessType: 'Wholesale & B2B Distribution',
    summary: 'Bulk/tiered pricing with credit terms, sales orders, delivery notes and batch receiving.',
    itemLabelSingular: 'Product',
    itemLabelPlural: 'Products',
    sellingModel: 'unit',
    capabilities: { sku: true, stock: true, batchTracking: true, expiry: true, suppliers: true },
    units: ['Carton', 'Crate', 'Pallet', 'Box', 'Dozens'],
    categories: [
      'Consumer Goods',
      'Packaged Foods',
      'Beverages Bulk',
      'Household Essentials',
      'Stationery Bulk',
    ],
    fields: [],
    modules: ['customers', 'sales_orders', 'estimates', 'credit_notes', 'delivery_notes', 'budgets'],
  },
  salon: {
    businessType: 'Salon, Spa & Personal Care',
    summary: 'Service menu with stylist appointments, commissions, retail products and VIP loyalty.',
    itemLabelSingular: 'Service',
    itemLabelPlural: 'Services',
    sellingModel: 'service',
    capabilities: { stock: true, loyalty: true, appointments: true },
    units: ['Service', 'Session', 'Pcs'],
    categories: [
      'Hair Treatments & Styling',
      'Facial & Skin Care',
      'Manicure & Pedicure',
      'Retail Products',
      'Bridal & Packages',
    ],
    fields: [],
    modules: ['customers', 'commissions', 'expenses', 'appointments'],
  },
  service: {
    businessType: 'Professional & Field Services',
    summary: 'Booking-based service catalog with durations, assigned staff and customer records.',
    itemLabelSingular: 'Service',
    itemLabelPlural: 'Services',
    sellingModel: 'service',
    capabilities: { appointments: true },
    units: ['Hour', 'Session', 'Consultation', 'Job'],
    categories: ['Consultations', 'Standard Service', 'Emergency Call-Out', 'Maintenance Plans'],
    fields: [],
    modules: ['customers', 'estimates', 'expenses', 'appointments'],
  },
  ecommerce: {
    businessType: 'Online Store & E-Commerce',
    summary: 'Web-first catalog with live stock sync, barcodes, promotions and fulfilment notes.',
    itemLabelSingular: 'Product',
    itemLabelPlural: 'Products',
    sellingModel: 'unit',
    capabilities: { sku: true, stock: true, barcodes: true, onlineStore: true },
    units: ['Pcs', 'Pack', 'Box'],
    categories: ['Best Sellers', 'New Arrivals', 'Accessories', 'Bundles & Kits'],
    fields: [],
    modules: ['customers', 'delivery_notes', 'promotions'],
  },
  custom: {
    businessType: 'Universal Custom Business',
    summary: 'Fully configurable catalog: switch on exactly the fields and modules this operation needs.',
    itemLabelSingular: 'Item',
    itemLabelPlural: 'Items',
    sellingModel: 'custom',
    capabilities: { stock: true, suppliers: true },
    units: ['Pcs', 'Kg', 'Unit', 'Hour', 'Pack'],
    categories: ['General Products', 'Services', 'Supplies'],
    fields: [],
    modules: ['customers', 'expenses'],
  },
};

/**
 * Industry ids that reuse an existing blueprint (footwear behaves like apparel,
 * a barber like a salon, and so on) so every IndustryType resolves to a schema.
 */
const BLUEPRINT_ALIASES: Partial<Record<IndustryType, string>> = {
  footwear: 'clothing',
  cafe: 'restaurant',
  barber: 'salon',
  cosmetics: 'salon',
  mobile_shop: 'repair',
  workshop: 'repair',
  auto_parts: 'repair',
  furniture: 'retail',
  hardware: 'retail',
  bookstore: 'retail',
  distributor: 'wholesale',
  manufacturer: 'wholesale',
  professional: 'service',
};

function resolveBlueprint(presetId: string): PresetCatalogBlueprint {
  const key = BLUEPRINT_ALIASES[presetId as IndustryType] || presetId;
  return PRESET_CATALOG_BLUEPRINTS[key] || PRESET_CATALOG_BLUEPRINTS.custom;
}

type PresetCustomField = (typeof CANONICAL_INDUSTRY_PRESETS)[number]['defaultCustomFields'][number];

const CUSTOM_FIELD_SCOPE: Record<PresetCustomField['entity'], CatalogFieldScope> = {
  product: 'item',
  customer: 'customer',
  order: 'order',
  supplier: 'item',
  employee: 'item',
  repair_job: 'item',
};

function presetFieldToCatalogField(field: PresetCustomField): CatalogField | null {
  if (!field || !field.key) return null;
  return {
    key: field.key,
    label: field.name,
    type: field.type,
    scope: CUSTOM_FIELD_SCOPE[field.entity] || 'item',
    required: !!field.isRequired,
    options: field.type === 'select' ? field.options : undefined,
  };
}

/** Core POS columns that must exist whenever the matching capability is on. */
function coreFieldsForCapabilities(
  caps: CatalogCapabilities,
  units: string[] = ['Pcs'],
  categories: string[] = ['General']
): CatalogField[] {
  const fields: CatalogField[] = [
    { key: 'name', label: 'Name', type: 'text', scope: 'item', required: true, core: 'name' },
    {
      key: 'category',
      label: 'Category / Group',
      type: 'select',
      scope: 'item',
      required: false,
      core: 'category',
      options: categories,
    },
    {
      key: 'selling_price',
      label: 'Selling Price',
      type: 'currency',
      scope: 'item',
      required: true,
      core: 'sellingPrice',
    },
    {
      key: 'unit',
      label: 'Unit of Measure',
      type: 'select',
      scope: 'item',
      required: false,
      core: 'unit',
      options: units,
    },
  ];
  if (caps.sku) {
    fields.push({ key: 'sku', label: 'SKU / Item Code', type: 'text', scope: 'item', required: false, core: 'sku' });
  }
  if (caps.barcodes) {
    fields.push({ key: 'barcode', label: 'Barcode', type: 'text', scope: 'item', required: false, core: 'barcode' });
  }
  if (caps.stock) {
    fields.push({ key: 'stock', label: 'Stock On Hand', type: 'number', scope: 'item', required: false, core: 'stock' });
    fields.push({
      key: 'min_stock',
      label: 'Reorder Level',
      type: 'number',
      scope: 'item',
      required: false,
      core: 'minStock',
    });
  }
  if (caps.suppliers) {
    fields.push({
      key: 'cost_price',
      label: 'Cost Price',
      type: 'currency',
      scope: 'item',
      required: false,
      core: 'costPrice',
    });
  }
  if (caps.appointments) {
    fields.push({
      key: 'duration',
      label: 'Duration (Minutes)',
      type: 'number',
      scope: 'item',
      required: false,
      core: 'duration',
    });
    fields.push({
      key: 'assigned_staff',
      label: 'Assigned Staff',
      type: 'text',
      scope: 'item',
      required: false,
      core: 'assignedStaff',
    });
  }
  if (caps.weightBased) {
    fields.push({ key: 'weight', label: 'Weight', type: 'weight', scope: 'item', required: false, unit: 'kg' });
  }
  return fields;
}

/** Keeps the first field for each key / core binding (core columns win). */
function dedupeFields(fields: CatalogField[]): CatalogField[] {
  const seenKeys = new Set<string>();
  const seenCores = new Set<string>();
  const out: CatalogField[] = [];
  for (const field of fields) {
    if (!field || !field.key) continue;
    if (seenKeys.has(field.key)) continue;
    if (field.core && seenCores.has(field.core)) continue;
    seenKeys.add(field.key);
    if (field.core) seenCores.add(field.core);
    out.push(field);
  }
  return out;
}

export interface PresetCatalogOverrides {
  businessType?: string;
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  units?: string[];
  categories?: string[];
}

/**
 * Builds a complete, usable catalog schema from an industry blueprint — no AI
 * call required. Categories, units and industry fields come from the canonical
 * preset data (src/data/industryPresets.ts) so the same option produces the same
 * catalog everywhere.
 */
export function buildPresetCatalogSchema(
  presetId: string,
  overrides: PresetCatalogOverrides = {}
): CatalogSchema {
  const blueprint = resolveBlueprint(presetId);
  const canonical = CANONICAL_INDUSTRY_PRESETS.find((p) => p.id === presetId);
  const capabilities: CatalogCapabilities = { ...NEUTRAL_CAPABILITIES, ...blueprint.capabilities };

  const categories = overrides.categories?.length
    ? overrides.categories
    : canonical?.defaultCategories?.length
      ? canonical.defaultCategories
      : blueprint.categories;
  const units = overrides.units?.length
    ? overrides.units
    : canonical?.unitPresets?.length
      ? canonical.unitPresets
      : blueprint.units;
  const industryFields = (canonical?.defaultCustomFields || [])
    .map(presetFieldToCatalogField)
    .filter((f): f is CatalogField => Boolean(f));

  return {
    version: 1,
    businessType: overrides.businessType || blueprint.businessType,
    summary: blueprint.summary,
    itemLabelSingular: overrides.itemLabelSingular || blueprint.itemLabelSingular,
    itemLabelPlural: overrides.itemLabelPlural || blueprint.itemLabelPlural,
    sellingModel: blueprint.sellingModel,
    units,
    categories,
    fields: dedupeFields([
      ...coreFieldsForCapabilities(capabilities, units, categories),
      ...blueprint.fields,
      ...industryFields,
    ]),
    capabilities,
    workflows: blueprint.capabilities.appointments ? ['pos', 'appointments'] : ['pos'],
    researchNotes: `Built from the "${blueprint.businessType}" industry blueprint selected during onboarding.`,
    confidence: 0.5,
    source: 'fallback',
  };
}

/**
 * The complete module bundle for an industry option: core modules, everything
 * its capabilities imply, and the extra modules the blueprint needs — so
 * choosing an option really does add all of its functions at once.
 */
export function presetModulesForIndustry(presetId: string): SystemModuleKey[] {
  const blueprint = resolveBlueprint(presetId);
  return Array.from(
    new Set<SystemModuleKey>([
      ...CORE_ONBOARDING_MODULES,
      ...blueprint.modules,
      ...modulesFromCapabilities(blueprint.capabilities),
    ])
  );
}
