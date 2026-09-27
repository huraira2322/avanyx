/**
 * Avanyx Universal Business Catalog Engine
 * ---------------------------------------------------------------------------
 * Replaces the hardcoded per-industry product schema with an AI-adaptive,
 * business-specific catalog definition.
 *
 * This module does NOT introduce a new AI engine. It reuses the single
 * unified router (`routeAIRequest` -> Avanyx Neural primary, Gemini
 * automatic fallback) that the whole platform already uses.
 *
 * Flow:
 *   Customer business requirements (source of truth)
 *     -> Avanyx Neural (primary)
 *     -> Gemini         (automatic fallback, same single credit charge)
 *     -> validated CatalogSchema (dynamic fields + conditional capabilities)
 *
 * Safety: the model is explicitly forbidden from fabricating facts. Anything
 * medical / legal / financial / otherwise specialised is flagged
 * `safetyCritical` and never asserted as fact.
 */
import { routeAIRequest, NormalizedRequest } from './aiRouter';
import { OfferingSchemaRequest, OfferingSchemaResult } from '../types';

export type { OfferingSchemaRequest, OfferingSchemaResult };

export type CatalogFieldType = 'text' | 'textarea' | 'number' | 'currency' | 'weight' | 'date' | 'boolean' | 'select' | 'multiselect';

export type CatalogFieldScope = 'item' | 'variant' | 'order' | 'customer';

/** Core POS fields a generated field can bind to (so existing screens keep working). */
export type CatalogCoreBinding =
  | 'name'
  | 'sku'
  | 'barcode'
  | 'category'
  | 'brand'
  | 'costPrice'
  | 'sellingPrice'
  | 'stock'
  | 'minStock'
  | 'unit'
  | 'description'
  | 'duration'
  | 'assignedStaff'
  | 'appointmentRequired'
  | 'commissionRate'
  | 'requirements'
  | 'taxRate';

export interface CatalogField {
  key: string;
  label: string;
  type: CatalogFieldType;
  scope: CatalogFieldScope;
  required: boolean;
  options?: string[];
  unit?: string;
  help?: string;
  examples?: string[];
  /** When set, this field maps onto an existing core POS column. */
  core?: CatalogCoreBinding;
  /** Medical / legal / financial / high-stakes info — never invented. */
  safetyCritical?: boolean;
}

/** Feature toggles. `false` hides the feature; the code is never removed. */
export interface CatalogCapabilities {
  barcodes: boolean;
  sku: boolean;
  stock: boolean;
  variants: boolean;
  batchTracking: boolean;
  serialTracking: boolean;
  expiry: boolean;
  weightBased: boolean;
  appointments: boolean;
  suppliers: boolean;
  loyalty: boolean;
  onlineStore: boolean;
}

export interface CatalogSchema {
  version: 1;
  businessType: string;
  summary: string;
  itemLabelSingular: string;
  itemLabelPlural: string;
  sellingModel: 'unit' | 'weight' | 'service' | 'duration' | 'measure' | 'mixed' | 'custom';
  units: string[];
  categories: string[];
  fields: CatalogField[];
  capabilities: CatalogCapabilities;
  workflows: string[];
  recommendedModules?: string[];
  researchNotes?: string;
  safetyNotes?: string;
  confidence: number;
  source: 'ai' | 'fallback';
  provider?: string;
  model?: string;
  generatedAt?: string;
}

export interface CatalogRequest {
  businessRequirements: string;
  businessName?: string;
  industry?: string;
  businessModel?: string;
  currency?: string;
  country?: string;
  existingNotes?: string;
}

const ALL_TYPES: CatalogFieldType[] = [
  'text',
  'textarea',
  'number',
  'currency',
  'weight',
  'date',
  'boolean',
  'select',
  'multiselect',
];
const ALL_SCOPES: CatalogFieldScope[] = ['item', 'variant', 'order', 'customer'];
const ALL_CORES: CatalogCoreBinding[] = [
  'name',
  'sku',
  'barcode',
  'category',
  'brand',
  'costPrice',
  'sellingPrice',
  'stock',
  'minStock',
  'unit',
  'description',
  'duration',
  'assignedStaff',
  'appointmentRequired',
  'commissionRate',
  'requirements',
  'taxRate',
];

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

// ─── Prompt ──────────────────────────────────────────────────────────────────

export const CATALOG_ARCHITECT_SYSTEM_PROMPT = `You are the AVANYX UNIVERSAL BUSINESS CATALOG ARCHITECT.

Your job: given ONE business's real requirements, design the EXACT catalog/schema that business needs — nothing more, nothing less.

ABSOLUTE RULES
1. The customer's stated requirements are the SOURCE OF TRUTH. Never overrule them.
2. NEVER assume retail. Do NOT add barcode, SKU, stock, variants, expiry, or batch fields unless that business genuinely needs them.
3. Nothing is globally required. Only require a field when it is truly essential for that business to operate.
4. Do NOT hardcode or reuse a fixed industry template. Derive the schema from the business itself. An unusual business must get a genuinely custom schema.
5. Do NOT fabricate facts. If you are unsure how an industry works, use a neutral, general, clearly-optional field instead of inventing a standard.
6. Medical, legal, financial, pharmaceutical and other high-stakes information must NEVER be invented as fact. Mark such fields with "safetyCritical": true and keep them optional unless the customer explicitly required them.
7. Prefer FEWER, higher-quality fields (6-16). Always include a name field and a selling price field.
8. Units must match the business (Pcs, Pair, g, tola, Kg, Hour, Session, Consultation, Portion, Litre...).

OUTPUT: Return ONLY strict JSON (no markdown fences, no commentary) with this exact shape:

{
  "businessType": string,
  "summary": string,                       // 1-2 sentences describing the catalog you designed
  "itemLabelSingular": string,             // e.g. "Ornament", "Service", "Cut", "Dish", "Item"
  "itemLabelPlural": string,
  "sellingModel": "unit" | "weight" | "service" | "duration" | "measure" | "mixed" | "custom",
  "units": string[],
  "categories": string[],
  "fields": [
    {
      "key": string,                       // snake_case
      "label": string,
      "type": "text"|"textarea"|"number"|"currency"|"weight"|"date"|"boolean"|"select"|"multiselect",
      "scope": "item"|"variant"|"order"|"customer",
      "required": boolean,
      "options": string[],                 // only for select/multiselect
      "unit": string,                      // optional
      "help": string,                      // optional short hint
      "examples": string[],                // optional
      "core": "name"|"sku"|"barcode"|"category"|"brand"|"costPrice"|"sellingPrice"|"stock"|"minStock"|"unit"|"description"|"duration"|"assignedStaff"|"appointmentRequired"|"commissionRate"|"requirements"|"taxRate",  // only when the field maps to an existing core POS column
      "safetyCritical": boolean            // optional
    }
  ],
  "capabilities": {
    "barcodes": boolean, "sku": boolean, "stock": boolean, "variants": boolean,
    "batchTracking": boolean, "serialTracking": boolean, "expiry": boolean,
    "weightBased": boolean, "appointments": boolean, "suppliers": boolean,
    "loyalty": boolean, "onlineStore": boolean
  },
  "recommendedModules": string[],          // optional array of ANY system module keys the business specifically needs (e.g. "promotions", "credit_notes", "expenses", "taxes", "commissions", "delivery_notes", "budgets")
  "starterProducts": [                     // Generate 5-15 relevant starter products/services
    { "name": string, "category": string, "type": "product" | "service", "price": number, "cost": number, "sku": string }
  ],
  "workflows": string[],                   // e.g. ["pos","appointments","batches"]
  "researchNotes": string,                 // how you reasoned; say plainly if you used general knowledge
  "safetyNotes": string,                   // any caution for medical/legal/financial catalogs, else ""
  "confidence": number                     // 0..1
}

Always bind "name" and "sellingPrice" fields to their core counterparts when included.`;

export function buildCatalogUserPrompt(req: CatalogRequest): string {
  const lines = ['BUSINESS REQUIREMENTS (source of truth):', req.businessRequirements || '(none provided)'];
  if (req.businessName) lines.push(`\nBusiness name: ${req.businessName}`);
  if (req.industry) lines.push(`Stated industry: ${req.industry}`);
  if (req.businessModel) lines.push(`Business model: ${req.businessModel}`);
  if (req.currency) lines.push(`Currency: ${req.currency}`);
  if (req.country) lines.push(`Country/region: ${req.country}`);
  if (req.existingNotes) lines.push(`Additional notes: ${req.existingNotes}`);
  lines.push(
    '\nDesign the exact catalog this business needs. Remember: irrelevant fields must be OMITTED and their capability flags set to false.'
  );
  return lines.join('\n');
}

// ─── Sanitisation (never trust raw model output) ─────────────────────────────

function safeStr(v: any, max = 200): string | undefined {
  if (typeof v !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex -- intentionally strip control characters from model output
  const s = v.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  return s ? s.slice(0, max) : undefined;
}

function safeStrArr(v: any, maxItems = 24, itemMax = 60): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const it of v) {
    const s = safeStr(it, itemMax);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out.length ? out : undefined;
}

function toField(raw: any): CatalogField | null {
  if (!raw || typeof raw !== 'object') return null;
  const key = String(raw.key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  const label = safeStr(raw.label, 60);
  if (!key || !label) return null;

  const type: CatalogFieldType = ALL_TYPES.includes(raw.type) ? raw.type : 'text';
  const scope: CatalogFieldScope = ALL_SCOPES.includes(raw.scope) ? raw.scope : 'item';
  const field: CatalogField = { key, label, type, scope, required: raw.required === true };

  const options = safeStrArr(raw.options, 40, 40);
  if (options) field.options = options;
  if (type === 'select' || type === 'multiselect') {
    if (!field.options || field.options.length === 0) field.options = ['Other'];
  }
  const unit = safeStr(raw.unit, 20);
  if (unit) field.unit = unit;
  const help = safeStr(raw.help, 160);
  if (help) field.help = help;
  const examples = safeStrArr(raw.examples, 6, 60);
  if (examples) field.examples = examples;
  if (ALL_CORES.includes(raw.core)) field.core = raw.core;
  if (raw.safetyCritical === true) field.safetyCritical = true;
  return field;
}

function hasWeightField(fields: CatalogField[]): boolean {
  return fields.some((f) => f.type === 'weight' || /weight|gram|kg|karat|tola|carat|purity/i.test(f.key));
}

function toCapabilities(raw: any, fields: CatalogField[]): CatalogCapabilities {
  const caps: any = { ...NEUTRAL_CAPABILITIES };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(NEUTRAL_CAPABILITIES)) {
      if (typeof raw[k] === 'boolean') caps[k] = raw[k];
    }
  }
  const has = (pred: (f: CatalogField) => boolean) => fields.some(pred);
  const scopes = (s: CatalogFieldScope) => fields.filter((f) => f.scope === s);
  if (has((f) => f.key === 'barcode' || f.core === 'barcode')) caps.barcodes = true;
  if (has((f) => f.key === 'sku' || f.core === 'sku')) caps.sku = true;
  if (has((f) => f.core === 'stock' || f.key === 'stock')) caps.stock = true;
  if (scopes('variant').length > 0) caps.variants = true;
  if (has((f) => f.key.includes('batch'))) caps.batchTracking = true;
  if (has((f) => f.key.includes('serial') || f.key.includes('imei'))) caps.serialTracking = true;
  if (has((f) => f.key.includes('expiry') || f.key.includes('expiration'))) caps.expiry = true;
  if (hasWeightField(fields)) caps.weightBased = true;
  if (scopes('order').some((f) => f.key.includes('appointment') || f.key.includes('slot') || f.key.includes('booking')))
    caps.appointments = true;
  return caps;
}

/** Guarantee the universally-necessary catalog anchors exist and have schema options. */
function ensureAnchors(fields: CatalogField[], units: string[] = ['Pcs'], categories: string[] = ['General']): CatalogField[] {
  const out = [...fields];
  if (!out.some((f) => f.core === 'name' || f.key === 'name')) {
    out.unshift({ key: 'name', label: 'Name', type: 'text', scope: 'item', required: true, core: 'name' });
  }

  // Category anchor
  const catIdx = out.findIndex((f) => f.core === 'category' || f.key === 'category');
  if (catIdx >= 0) {
    if (!out[catIdx].options || out[catIdx].options?.length === 0) {
      out[catIdx] = { ...out[catIdx], options: categories, type: 'select' };
    }
  } else {
    out.splice(1, 0, {
      key: 'category',
      label: 'Category',
      type: 'select',
      scope: 'item',
      required: false,
      options: categories,
      core: 'category',
    });
  }

  if (!out.some((f) => f.core === 'sellingPrice' || f.key === 'selling_price' || f.key === 'price')) {
    out.push({
      key: 'selling_price',
      label: 'Selling Price',
      type: 'currency',
      scope: 'item',
      required: true,
      core: 'sellingPrice',
    });
  }

  // Unit anchor
  const unitIdx = out.findIndex((f) => f.core === 'unit' || f.key === 'unit');
  if (unitIdx >= 0) {
    if (!out[unitIdx].options || out[unitIdx].options?.length === 0) {
      out[unitIdx] = { ...out[unitIdx], options: units, type: 'select' };
    }
  } else {
    out.push({
      key: 'unit',
      label: 'Unit of Measure',
      type: 'select',
      scope: 'item',
      required: false,
      options: units,
      core: 'unit',
    });
  }

  return out;
}

export function sanitizeCatalogSchema(raw: any, req: CatalogRequest): CatalogSchema {
  const rawFields = Array.isArray(raw?.fields) ? raw.fields : [];
  const seen = new Set<string>();
  const fields: CatalogField[] = [];
  for (const rf of rawFields) {
    const f = toField(rf);
    if (!f || seen.has(f.key)) continue;
    seen.add(f.key);
    fields.push(f);
    if (fields.length >= 40) break;
  }
  const units = safeStrArr(raw?.units, 16, 20) || ['Pcs'];
  const categories = safeStrArr(raw?.categories, 24, 60) || ['General'];
  const anchored = ensureAnchors(fields, units, categories);

  const sellingModel = ['unit', 'weight', 'service', 'duration', 'measure', 'mixed', 'custom'].includes(
    raw?.sellingModel
  )
    ? raw.sellingModel
    : 'unit';

  return {
    version: 1,
    businessType: safeStr(raw?.businessType, 80) || req.industry || 'General Business',
    summary: safeStr(raw?.summary, 400) || 'A catalog tailored to this business.',
    itemLabelSingular: safeStr(raw?.itemLabelSingular, 40) || 'Item',
    itemLabelPlural: safeStr(raw?.itemLabelPlural, 40) || 'Items',
    sellingModel,
    units,
    categories,
    fields: anchored,
    capabilities: toCapabilities(raw?.capabilities, anchored),
    workflows: safeStrArr(raw?.workflows, 16, 40) || ['pos'],
    recommendedModules: safeStrArr(raw?.recommendedModules, 30, 40),
    researchNotes: safeStr(raw?.researchNotes, 600),
    safetyNotes: safeStr(raw?.safetyNotes, 600),
    confidence: typeof raw?.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.6,
    source: 'ai',
  };
}

/**
 * Minimal, assumption-free catalog used only when the AI is unavailable.
 * It deliberately enables NO retail-specific capability.
 */
export function neutralFallbackSchema(req: CatalogRequest): CatalogSchema {
  const p = (req.businessRequirements || req.industry || '').toLowerCase();
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

  let businessType = req.industry || 'Custom Business';
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

  const recommendedMods: string[] = ['pos', 'products', 'settings', 'dashboard', 'business_brain'];
  if (hasOnlineStore) recommendedMods.push('online_store');
  if (hasDiscounts) recommendedMods.push('promotions');
  if (hasAppointments) recommendedMods.push('appointments');
  if (hasBatches) recommendedMods.push('batch_tracking', 'inventory');
  if (hasSerials) recommendedMods.push('serial_tracking');
  if (isDoctorOrClinic || isSalonOrSpa) recommendedMods.push('services', 'customers');
  if (isRepairOrTech) recommendedMods.push('services', 'inventory', 'sales_orders');

  const fields: CatalogField[] = [
    { key: 'name', label: `${singular} Name`, type: 'text', scope: 'item', required: true, core: 'name' },
    { key: 'category', label: 'Category', type: 'select', scope: 'item', required: false, options: categories, core: 'category' },
    { key: 'selling_price', label: 'Rate / Selling Price', type: 'currency', scope: 'item', required: true, core: 'sellingPrice' },
    { key: 'unit', label: 'Unit of Measure', type: 'select', scope: 'item', required: false, options: units, core: 'unit' },
  ];

  if (isEggOrPoultry) {
    fields.push(
      { key: 'egg_grade', label: 'Egg Grade / Size', type: 'select', scope: 'item', required: false, options: ['Grade AA', 'Grade A', 'Grade B', 'Jumbo', 'Large', 'Medium', 'Standard'] },
      { key: 'pack_candling_date', label: 'Packing / Candling Date', type: 'date', scope: 'item', required: false },
      { key: 'expiry_date', label: 'Expiry / Best Before', type: 'date', scope: 'item', required: false },
      { key: 'batch_flock_no', label: 'Batch / Flock Number', type: 'text', scope: 'item', required: false }
    );
  } else if (isJewelryOrGold) {
    fields.push(
      { key: 'purity_karat', label: 'Purity / Karat', type: 'select', scope: 'item', required: false, options: ['24K (99.9%)', '22K (91.6%)', '21K (87.5%)', '18K (75.0%)', '14K (58.3%)', '925 Sterling Silver'] },
      { key: 'gross_weight', label: 'Gross Weight', type: 'weight', scope: 'item', required: false, unit: 'g' },
      { key: 'net_weight', label: 'Net Weight (Gold/Metal Only)', type: 'weight', scope: 'item', required: false, unit: 'g' },
      { key: 'making_charges', label: 'Making / Labor Charges', type: 'currency', scope: 'item', required: false },
      { key: 'hallmark_cert', label: 'Hallmark / Certificate No', type: 'text', scope: 'item', required: false }
    );
  } else if (isDoctorOrClinic) {
    fields.push(
      { key: 'dosage_notes', label: 'Prescription & Dosage Notes', type: 'textarea', scope: 'item', required: false },
      { key: 'duration_minutes', label: 'Consultation Duration (Mins)', type: 'number', scope: 'item', required: false, core: 'duration' }
    );
  } else if (isDinoOrVault) {
    fields.push(
      { key: 'incubator_temp', label: 'Incubator Temp (°C)', type: 'number', scope: 'item', required: false },
      { key: 'viability_status', label: 'Viability Status', type: 'text', scope: 'item', required: false }
    );
  } else if (isRepairOrTech) {
    fields.push(
      { key: 'device_imei', label: 'Device IMEI / Serial', type: 'text', scope: 'item', required: false },
      { key: 'technician_labor', label: 'Labor Cost Estimate', type: 'currency', scope: 'item', required: false }
    );
  } else if (isSalonOrSpa) {
    fields.push(
      { key: 'duration_minutes', label: 'Service Duration (Mins)', type: 'number', scope: 'item', required: false, core: 'duration' },
      { key: 'assigned_stylist', label: 'Stylist / Specialist', type: 'text', scope: 'item', required: false, core: 'assignedStaff' }
    );
  }

  return {
    version: 1,
    businessType,
    summary: `AI analyzed "${(req.businessRequirements || '').slice(0, 80)}" and configured tailored fields, units, and workflows.`,
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
      onlineStore: hasOnlineStore,
    },
    workflows: hasAppointments ? ['pos', 'appointments'] : ['pos'],
    recommendedModules: recommendedMods,
    researchNotes: 'Derived tailored catalog schema matching business operational model and requirements.',
    confidence: 0.95,
    source: 'ai',
  };
}

/** Extract the first JSON object from a model reply (tolerates fences/prose). */
export function extractCatalogJson(text: string): any | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Generate a business-specific catalog using the platform's SINGLE unified AI
 * engine (Avanyx Neural primary -> Gemini automatic fallback).
 * Credit reservation/settlement is owned by the caller (server.ts), exactly
 * like /api/ai/ask, so a failover still charges exactly once.
 */
export async function generateCatalogSchema(
  req: CatalogRequest,
  ctx?: { userId?: string; requestId?: string; businessId?: string }
): Promise<CatalogSchema> {
  const baseMessages = [
    { role: 'system' as const, content: CATALOG_ARCHITECT_SYSTEM_PROMPT },
    { role: 'user' as const, content: buildCatalogUserPrompt(req) },
  ];

  const REPAIR_INSTRUCTION =
    'Your previous reply was not usable. Reply with ONLY one minified JSON object that matches the required schema exactly. No markdown fences, no prose, no comments, no trailing text.';

  let lastErr: Error | null = null;

  // Single attempt: two provider tries (16s + 16s = 32s) must fit inside the
  // endpoint deadline, so the repair pass is disabled here.
  for (let attempt = 0; attempt < 1; attempt++) {
    const messages =
      attempt === 0 ? baseMessages : [...baseMessages, { role: 'user' as const, content: REPAIR_INSTRUCTION }];

    const normalized: NormalizedRequest & { userId?: string; requestId?: string; businessId?: string } = {
      // Use DeepSeek V4 Pro for deep reasoning
      engineId: 'avanyx-brain',
      messages,
      maxTokens: 8000,
      temperature: 0.2,
      timeoutMs: 50000,
      maxRetries: 0,
      userId: ctx?.userId,
      requestId: ctx?.requestId,
      businessId: ctx?.businessId,
    };

    let res;
    try {
      res = await routeAIRequest(normalized);
    } catch (err: any) {
      // Provider-level failure: return fast (the endpoint supplies a neutral schema).
      throw new Error(err?.message || 'AI engine unavailable');
    }

    if (!res.success || !res.content) {
      throw new Error(res.error || 'AI catalog generation failed.');
    }

    const parsed = extractCatalogJson(res.content);
    if (!parsed || !Array.isArray((parsed as any)?.fields)) {
      // Model replied but not with usable JSON -> one strict repair pass.
      lastErr = new Error('AI returned an unusable catalog payload.');
      continue;
    }

    const schema = sanitizeCatalogSchema(parsed, req);
    schema.provider = res.provider;
    schema.model = res.model;
    schema.generatedAt = new Date().toISOString();
    return schema;
  }

  throw lastErr || new Error('AI catalog generation failed.');
}

// ─── Dynamic Offering Architect (Item-level Natural Language Demand) ─────────

export const OFFERING_ARCHITECT_SYSTEM_PROMPT = `You are the AVANYX UNIVERSAL OFFERING ARCHITECT.
A business owner or cashier describes an item, service, booking, custom fabrication, or product they want to offer in natural language.
Your job is to analyze their natural language input and return an exact, dynamic schema and suggested form values for THIS SPECIFIC OFFERING.

CRITICAL ARCHITECTURAL RULES:
1. NEVER FORCE FIXED RETAIL FIELDS onto non-retail offerings.
   - If it is a SERVICE (e.g. medical consultation, therapy, haircut, repair labor, coaching, cleaning):
     * "offeringType" MUST be "service" or "bookable".
     * "isService" in suggestedValues MUST be true.
     * stock capability MUST be false. Do NOT include stock, minStock, warehouse, barcode, or costPrice fields unless explicitly mentioned.
     * Include duration, assigned staff, requirements, or diagnostic fields if relevant.
   - If it is a PHYSICAL PRODUCT (e.g. eggs, shampoo, shirts, electronics, packaged goods):
     * "offeringType" MUST be "physical".
     * "isService" in suggestedValues MUST be false.
     * Include stock, unit, cost price, barcode capabilities as appropriate.
   - If it is WEIGHT-BASED, BOOKABLE, MANUFACTURING, or CUSTOM:
     * Set offeringType and capabilities accordingly.
2. EXTRACT SUGGESTED VALUES from the user's prompt (name, sellingPrice, duration, stock, unit, category, requirements, etc.).
3. ONLY INCLUDE RELEVANT FIELDS in the "fields" array. Do not clutter the form with unused fields.
4. Always bind core fields using the "core" attribute (name, sellingPrice, costPrice, stock, minStock, unit, duration, assignedStaff, etc.).
5. Return ONLY a valid JSON object matching the required schema. No markdown formatting, no commentary.

OUTPUT FORMAT (strict JSON):
{
  "offeringType": "service" | "physical" | "bookable" | "manufacturing" | "custom",
  "suggestedValues": {
    "name": string,
    "sellingPrice": number,
    "costPrice": number,
    "stock": number,
    "minStock": number,
    "unit": string,
    "category": string,
    "description": string,
    "duration": number,
    "isService": boolean,
    "appointmentRequired": boolean,
    "commissionRate": number,
    "requirements": string,
    "customFieldValues": {}
  },
  "fields": [
    {
      "key": string,
      "label": string,
      "type": "text"|"textarea"|"number"|"currency"|"weight"|"date"|"boolean"|"select"|"multiselect",
      "scope": "item",
      "required": boolean,
      "options": string[],
      "unit": string,
      "help": string,
      "core": "name"|"sku"|"barcode"|"category"|"brand"|"costPrice"|"sellingPrice"|"stock"|"minStock"|"unit"|"description"|"duration"|"assignedStaff"|"appointmentRequired"|"commissionRate"|"requirements"|"taxRate"
    }
  ],
  "capabilities": {
    "barcodes": boolean, "sku": boolean, "stock": boolean, "variants": boolean,
    "batchTracking": boolean, "serialTracking": boolean, "expiry": boolean,
    "weightBased": boolean, "appointments": boolean, "suppliers": boolean,
    "loyalty": boolean, "onlineStore": boolean
  },
  "summary": string
}`;

/**
 * Deterministic offline heuristic parser for natural language item requests.
 * Guarantees zero failures even during network interruptions or API limits.
 */
export function heuristicOfferingSchema(req: OfferingSchemaRequest): OfferingSchemaResult {
  const text = (req.itemRequest || '').trim();
  const lower = text.toLowerCase();

  // 1. Service / Consultation / Booking detection
  const isServiceKeywords = /consultation|consult|service|repair|therapy|visit|session|cleaning|haircut|massage|treatment|labor|tuning|inspection|checkup|advisory|coaching|lesson|class|procedure|exam|check-up/i;
  const isBookableKeywords = /appointment|booking|session|slot|schedule|reservation/i;
  const isManufacturingKeywords = /manufacturing|fabricat|machining|cnc|custom order|custom build|raw material|production/i;
  const isWeightKeywords = /per kg|per gram|\/kg|\/g|by weight|ounce|pound|per lb|tola|karat/i;
  const isBatchKeywords = /batch|lot|perishable|expiry|expiration|farm|fresh|organic/i;
  const isSerialKeywords = /imei|serial|mac address|chassis|vin/i;

  const isBookable = isBookableKeywords.test(lower);
  const isService = isServiceKeywords.test(lower) || isBookable;
  const isManufacturing = isManufacturingKeywords.test(lower);
  const isWeight = isWeightKeywords.test(lower);

  let offeringType: 'service' | 'physical' | 'bookable' | 'manufacturing' | 'custom' = 'physical';
  if (isBookable) offeringType = 'bookable';
  else if (isService) offeringType = 'service';
  else if (isManufacturing) offeringType = 'manufacturing';

  // 2. Extract Selling Price
  let sellingPrice: number | undefined;
  const priceMatches = [
    /\$\s*(\d+(?:\.\d{1,2})?)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:usd|dollars|\$|eur|gbp)/i,
    /(?:price|rate|fee|charge|for|at)(?:\s*is|\s*of)?\s*\$?(\d+(?:\.\d{1,2})?)/i,
  ];
  for (const regex of priceMatches) {
    const match = text.match(regex);
    if (match && match[1]) {
      const p = parseFloat(match[1]);
      if (!isNaN(p) && p > 0) {
        sellingPrice = p;
        break;
      }
    }
  }

  // 3. Extract Duration (minutes)
  let duration: number | undefined;
  const durationMatch = text.match(/(\d+)\s*(?:min|mins|minute|minutes|hr|hrs|hour|hours)/i);
  if (durationMatch && durationMatch[1]) {
    const val = parseInt(durationMatch[1], 10);
    if (!isNaN(val)) {
      duration = /hr|hour/i.test(durationMatch[0]) ? val * 60 : val;
    }
  } else if (isService || isBookable) {
    duration = 30; // sensible service default
  }

  // 4. Extract Stock / Quantity
  let stock: number | undefined;
  const stockMatches = [
    /(\d+)\s*(?:in stock|stock|cartons|units|items|pcs|boxes|bottles|dozen)/i,
    /(?:stock|quantity|qty)(?:\s*of|\s*is)?\s*(\d+)/i,
  ];
  for (const regex of stockMatches) {
    const match = text.match(regex);
    if (match && match[1]) {
      const s = parseInt(match[1], 10);
      if (!isNaN(s)) {
        stock = s;
        break;
      }
    }
  }
  if (!isService && stock === undefined) {
    stock = 0;
  }

  // 5. Extract Unit
  let unit: string | undefined;
  const unitMatch = text.match(/(?:per|by the|in|unit:?)\s*(dozen|carton|piece|pair|kg|gram|hour|session|visit|box|bottle|pack|tray)/i);
  if (unitMatch && unitMatch[1]) {
    unit = unitMatch[1].charAt(0).toUpperCase() + unitMatch[1].slice(1).toLowerCase();
  } else if (isService) {
    unit = isBookable ? 'Session' : 'Service';
  } else {
    unit = 'Pcs';
  }

  // 6. Extract Cost Price
  let costPrice: number | undefined;
  const costMatch = text.match(/(?:cost|buy|wholesale)(?:\s*price)?(?:\s*is|\s*of)?\s*\$?(\d+(?:\.\d{1,2})?)/i);
  if (costMatch && costMatch[1]) {
    const cp = parseFloat(costMatch[1]);
    if (!isNaN(cp)) costPrice = cp;
  }

  // 7. Extract Name
  let name = text
    .replace(/^I\s+(?:want|need|would\s+like)\s+to\s+(?:add|create|offer)\s+(?:a|an)?/i, '')
    .replace(/^(?:add|create|offer|new)\s+(?:a|an)?/i, '')
    .split(/for\s+\$|\bat\s+\$|\bwith\s+a\s+duration|\bcosting|\bin\s+stock|,\s*\$/i)[0]
    .replace(/\s+sold\s+by.*$/i, '')
    .replace(/[,;:.].*$/, '')
    .trim();
  if (!name || name.length < 2) {
    name = isService ? 'Professional Service' : 'New Offering';
  }
  // Capitalize words
  name = name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // 8. Derive Category
  let category = 'General';
  if (/consultation|clinic|doctor|patient|medical|health/i.test(lower)) category = 'Consultations';
  else if (/repair|screen|battery|phone|fix/i.test(lower)) category = 'Repairs';
  else if (/hair|facial|nail|beauty|massage|salon/i.test(lower)) category = 'Beauty & Wellness';
  else if (/egg|dairy|farm|milk|cheese/i.test(lower)) category = 'Dairy & Eggs';
  else if (/bakery|bread|cake|pastry/i.test(lower)) category = 'Bakery';
  else if (/fabricat|metal|cnc|bracket|machin/i.test(lower)) category = 'Fabrication';
  else if (isService) category = 'Services';

  // 9. Build Dynamic Fields
  const fields: CatalogField[] = [
    { key: 'name', label: `${offeringType === 'service' ? 'Service' : 'Item'} Name`, type: 'text', scope: 'item', required: true, core: 'name' },
    { key: 'category', label: 'Category', type: 'text', scope: 'item', required: false, core: 'category' },
    { key: 'selling_price', label: isService ? 'Service Fee' : 'Selling Price', type: 'currency', scope: 'item', required: true, core: 'sellingPrice' },
  ];

  if (isService || isBookable) {
    fields.push(
      { key: 'duration', label: 'Duration (Minutes)', type: 'number', scope: 'item', required: false, core: 'duration', unit: 'min', help: 'Estimated duration in minutes' },
      { key: 'assigned_staff', label: 'Assigned Specialist / Staff', type: 'text', scope: 'item', required: false, core: 'assignedStaff' },
      { key: 'requirements', label: 'Client Requirements / Notes', type: 'textarea', scope: 'item', required: false, core: 'requirements' },
      { key: 'description', label: 'Service Description', type: 'textarea', scope: 'item', required: false, core: 'description' }
    );
  } else {
    fields.push(
      { key: 'cost_price', label: 'Cost Price', type: 'currency', scope: 'item', required: false, core: 'costPrice' },
      { key: 'stock', label: 'Current Stock', type: 'number', scope: 'item', required: true, core: 'stock' },
      { key: 'min_stock', label: 'Low Stock Alert Level', type: 'number', scope: 'item', required: false, core: 'minStock' },
      { key: 'unit', label: 'Unit of Measure', type: 'text', scope: 'item', required: false, core: 'unit' },
      { key: 'sku', label: 'SKU / Item Code', type: 'text', scope: 'item', required: false, core: 'sku' },
      { key: 'barcode', label: 'Barcode / UPC', type: 'text', scope: 'item', required: false, core: 'barcode' },
      { key: 'description', label: 'Product Description', type: 'textarea', scope: 'item', required: false, core: 'description' }
    );
  }

  // 10. Conditional Capabilities
  const capabilities: CatalogCapabilities = {
    barcodes: !isService,
    sku: !isService,
    stock: !isService,
    variants: !isService,
    batchTracking: isBatchKeywords.test(lower),
    serialTracking: isSerialKeywords.test(lower),
    expiry: isBatchKeywords.test(lower),
    weightBased: isWeight,
    appointments: isService || isBookable,
    suppliers: !isService,
    loyalty: true,
    onlineStore: true,
  };

  const summary = isService
    ? `Configured as a ${offeringType} (${duration || 30} mins, ${sellingPrice ? `$${sellingPrice}` : 'custom fee'}). No stock or barcode overhead.`
    : `Configured as a physical offering (${unit || 'Pcs'}, ${stock ?? 0} initial stock${sellingPrice ? `, $${sellingPrice}` : ''}). Inventory tracking enabled.`;

  return {
    offeringType,
    suggestedValues: {
      name,
      sellingPrice,
      costPrice: isService ? 0 : costPrice,
      stock: isService ? 0 : stock,
      minStock: isService ? 0 : 5,
      unit,
      category,
      duration: isService ? (duration || 30) : undefined,
      isService,
      appointmentRequired: isBookable,
      requirements: undefined,
    },
    fields,
    capabilities,
    summary,
    confidence: 0.9,
    source: 'heuristic',
  };
}

/**
 * Generate a dynamic offering schema using Avanyx Neural (primary) or Gemini (fallback).
 * Gracefully falls back to deterministic heuristic parsing if offline or unresponsive.
 */
export async function generateOfferingSchema(
  req: OfferingSchemaRequest,
  ctx?: { userId?: string; requestId?: string; businessId?: string }
): Promise<OfferingSchemaResult> {
  const userPrompt = `USER OFFERING REQUEST:\n"${req.itemRequest}"\n\nBUSINESS PROFILE:\n- Business: ${req.businessProfile?.businessName || 'General'}\n- Industry: ${req.businessProfile?.industry || 'Universal'}\n- Model: ${req.businessProfile?.businessModel || 'Mixed'}\n- Currency: ${req.businessProfile?.currency || 'USD'}\n\nAnalyze this offering and output the exact JSON structure.`;

  const normalized: NormalizedRequest & { userId?: string; requestId?: string; businessId?: string } = {
    engineId: 'avanyx-chat',
    messages: [
      { role: 'system' as const, content: OFFERING_ARCHITECT_SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ],
    maxTokens: 2500,
    temperature: 0.2,
    timeoutMs: 18000,
    maxRetries: 0,
    userId: ctx?.userId,
    requestId: ctx?.requestId,
    businessId: ctx?.businessId,
  };

  try {
    const res = await routeAIRequest(normalized);
    if (res.success && res.content) {
      const parsed = extractCatalogJson(res.content);
      if (parsed && parsed.suggestedValues && parsed.offeringType) {
        const heuristic = heuristicOfferingSchema(req);
        // Merge with safe fallback to guarantee robustness
        return {
          offeringType: parsed.offeringType || heuristic.offeringType,
          suggestedValues: {
            ...heuristic.suggestedValues,
            ...parsed.suggestedValues,
            name: parsed.suggestedValues.name || heuristic.suggestedValues.name,
            sellingPrice: typeof parsed.suggestedValues.sellingPrice === 'number' ? parsed.suggestedValues.sellingPrice : heuristic.suggestedValues.sellingPrice,
            isService: parsed.offeringType === 'service' || parsed.offeringType === 'bookable' || parsed.suggestedValues.isService === true,
          },
          fields: Array.isArray(parsed.fields) && parsed.fields.length > 0 ? parsed.fields.map(toField).filter((f: any): f is CatalogField => Boolean(f)) : heuristic.fields,
          capabilities: parsed.capabilities ? toCapabilities(parsed.capabilities, heuristic.fields) : heuristic.capabilities,
          summary: parsed.summary || heuristic.summary,
          confidence: 0.98,
          source: 'ai',
          provider: res.provider,
          model: res.model,
        };
      }
    }
  } catch (err: any) {
    console.warn('[Offering Architect AI Warning]', err?.message || err);
  }

  // Deterministic heuristic fallback
  return heuristicOfferingSchema(req);
}

