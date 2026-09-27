import { CatalogSchema, CatalogCapabilities } from './src/types';
import { deriveBusinessModel, deriveOnboardingFromSchema } from './src/lib/catalogSchema';

const BASE_CAPS: CatalogCapabilities = {
  barcodes: false, sku: false, stock: false, variants: false, batchTracking: false,
  serialTracking: false, expiry: false, weightBased: false, appointments: false,
  suppliers: false, loyalty: false, onlineStore: false,
};

type C = Partial<CatalogSchema> & { businessType: string; sellingModel: CatalogSchema['sellingModel']; itemLabelSingular: string; itemLabelPlural: string; capabilities: Partial<CatalogCapabilities> };
function makeSchema(o: C): CatalogSchema {
  return {
    version: 1, businessType: o.businessType, summary: `${o.businessType} schema`,
    itemLabelSingular: o.itemLabelSingular, itemLabelPlural: o.itemLabelPlural,
    sellingModel: o.sellingModel, units: o.units || ['Unit'], categories: o.categories || ['General'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', scope: 'item', required: true, core: 'name' },
      { key: 'selling_price', label: 'Selling Price', type: 'currency', scope: 'item', required: true, core: 'sellingPrice' },
      ...(o.fields || []),
    ],
    capabilities: { ...BASE_CAPS, ...o.capabilities },
    workflows: o.workflows || ['pos'], confidence: 0.9, source: 'ai',
  };
}

interface Case {
  name: string; schema: CatalogSchema;
  expectModel: 'product' | 'service' | 'hybrid';
  expectService: boolean; expectProduct: boolean; expectStock: boolean;
  expectBarcodes: boolean; expectAppointments: boolean; expectWeight: boolean;
  modulesContain: string[]; modulesExclude: string[];
}

const cases: Case[] = [
  {
    name: 'Restaurant (dine-in/takeaway)',
    schema: makeSchema({
      businessType: 'Restaurant & Dining', sellingModel: 'mixed',
      itemLabelSingular: 'Dish', itemLabelPlural: 'Dishes',
      units: ['Portion', 'Glass'], capabilities: { stock: true, loyalty: true, onlineStore: true },
      fields: [
        { key: 'portion_size', label: 'Portion Size', type: 'select', scope: 'item', required: false, options: ['Regular', 'Large'] },
        { key: 'spice_level', label: 'Spice Level', type: 'select', scope: 'item', required: false, options: ['Mild', 'Hot'] },
      ],
    }),
    expectModel: 'hybrid', expectService: false, expectProduct: false, expectStock: true, expectBarcodes: false, expectAppointments: false, expectWeight: false,
    modulesContain: ['inventory', 'loyalty', 'online_store', 'services'], modulesExclude: ['barcodes'],
  },
  {
    name: 'Soap / Manufacturing (batch tracked)',
    schema: makeSchema({
      businessType: 'Handmade Soap Manufacturer', sellingModel: 'unit',
      itemLabelSingular: 'Product', itemLabelPlural: 'Products',
      capabilities: { stock: true, sku: true, batchTracking: true, expiry: true },
    }),
    expectModel: 'product', expectService: false, expectProduct: true, expectStock: true, expectBarcodes: false, expectAppointments: false, expectWeight: false,
    modulesContain: ['inventory', 'batch_tracking'], modulesExclude: ['appointments'],
  },
  {
    name: 'Gold Jewellery (weight-based)',
    schema: makeSchema({
      businessType: 'Gold Jewellery Retailer', sellingModel: 'weight',
      itemLabelSingular: 'Piece', itemLabelPlural: 'Pieces',
      units: ['g', 'tola'], capabilities: { stock: true, weightBased: true, sku: true },
      fields: [{ key: 'purity', label: 'Purity (Karat)', type: 'select', scope: 'item', required: true, options: ['22K', '24K'] }],
    }),
    expectModel: 'product', expectService: false, expectProduct: true, expectStock: true, expectBarcodes: false, expectAppointments: false, expectWeight: true,
    modulesContain: ['inventory'], modulesExclude: ['appointments', 'barcodes'],
  },
  {
    name: 'Footwear (variants + barcodes)',
    schema: makeSchema({
      businessType: 'Footwear & Shoe Boutique', sellingModel: 'unit',
      itemLabelSingular: 'Shoe', itemLabelPlural: 'Shoes',
      capabilities: { stock: true, sku: true, barcodes: true, variants: true, onlineStore: true },
    }),
    expectModel: 'product', expectService: false, expectProduct: true, expectStock: true, expectBarcodes: true, expectAppointments: false, expectWeight: false,
    modulesContain: ['variants', 'barcodes', 'online_store'], modulesExclude: ['appointments'],
  },
  {
    name: 'Meat / Butcher (weight-based)',
    schema: makeSchema({
      businessType: 'Butcher / Meat Shop', sellingModel: 'weight',
      itemLabelSingular: 'Cut', itemLabelPlural: 'Cuts',
      units: ['kg', 'g'], capabilities: { stock: true, weightBased: true },
    }),
    expectModel: 'product', expectService: false, expectProduct: true, expectStock: true, expectBarcodes: false, expectAppointments: false, expectWeight: true,
    modulesContain: ['inventory'], modulesExclude: ['barcodes'],
  },
  {
    name: 'Salon (service + appointments)',
    schema: makeSchema({
      businessType: 'Hair & Beauty Salon', sellingModel: 'service',
      itemLabelSingular: 'Service', itemLabelPlural: 'Services',
      units: ['Session'], capabilities: { appointments: true, loyalty: true },
      fields: [{ key: 'duration', label: 'Duration', type: 'number', scope: 'item', required: true, core: 'duration' }],
      workflows: ['pos', 'appointments'],
    }),
    expectModel: 'service', expectService: true, expectProduct: false, expectStock: false, expectBarcodes: false, expectAppointments: true, expectWeight: false,
    modulesContain: ['appointments', 'services', 'loyalty'], modulesExclude: ['inventory', 'barcodes'],
  },
  {
    name: 'Doctor / Clinic (consultations)',
    schema: makeSchema({
      businessType: 'Medical Clinic', sellingModel: 'service',
      itemLabelSingular: 'Consultation', itemLabelPlural: 'Consultations',
      units: ['Session'], capabilities: { appointments: true },
      fields: [{ key: 'duration', label: 'Duration', type: 'number', scope: 'item', required: true, core: 'duration' }],
      workflows: ['pos', 'appointments'],
    }),
    expectModel: 'service', expectService: true, expectProduct: false, expectStock: false, expectBarcodes: false, expectAppointments: true, expectWeight: false,
    modulesContain: ['appointments', 'services'], modulesExclude: ['inventory', 'barcodes', 'variants'],
  },
  {
    name: 'Plumbing (field service jobs)',
    schema: makeSchema({
      businessType: 'Plumbing Service', sellingModel: 'service',
      itemLabelSingular: 'Job', itemLabelPlural: 'Jobs',
      units: ['Hour'], capabilities: { appointments: true },
      workflows: ['pos', 'appointments'],
    }),
    expectModel: 'service', expectService: true, expectProduct: false, expectStock: false, expectBarcodes: false, expectAppointments: true, expectWeight: false,
    modulesContain: ['appointments', 'services'], modulesExclude: ['inventory', 'barcodes'],
  },
  {
    name: 'UNUSUAL: Urban Mushroom Farm + Mushroom Coffee Truck',
    schema: makeSchema({
      businessType: 'Urban Mushroom Farm & Mushroom Coffee Truck', sellingModel: 'mixed',
      itemLabelSingular: 'Item', itemLabelPlural: 'Items',
      units: ['kg', 'Cup', 'Bag'], capabilities: { stock: true, weightBased: true, appointments: false },
      fields: [
        { key: 'mushroom_variety', label: 'Mushroom Variety', type: 'select', scope: 'item', required: true, options: ['Oyster', 'Shiitake', "Lion's Mane"] },
        { key: 'roast_level', label: 'Roast Level', type: 'select', scope: 'item', required: false, options: ['Light', 'Medium', 'Dark'] },
        { key: 'brew_method', label: 'Brew Method', type: 'select', scope: 'item', required: false, options: ['Pour-over', 'Espresso', 'Cold brew'] },
      ],
    }),
    expectModel: 'hybrid', expectService: false, expectProduct: false, expectStock: true, expectBarcodes: false, expectAppointments: false, expectWeight: true,
    modulesContain: ['inventory', 'services'], modulesExclude: ['barcodes', 'appointments'],
  },
];

let pass = 0, fail = 0;
const errors: string[] = [];
for (const c of cases) {
  const m = deriveBusinessModel(c.schema);
  const d = deriveOnboardingFromSchema(c.schema);
  const checks: [string, boolean][] = [
    ['sellingModel', m.sellingModel === c.schema.sellingModel],
    ['businessModel', d.businessModel === c.expectModel],
    ['isService', m.isService === c.expectService],
    ['isProduct', m.isProduct === c.expectProduct],
    ['hasStock', m.hasStock === c.expectStock],
    ['hasBarcodes', m.hasBarcodes === c.expectBarcodes],
    ['hasAppointments', m.hasAppointments === c.expectAppointments],
    ['isWeightBased', m.isWeightBased === c.expectWeight],
  ];
  for (const mod of c.modulesContain) checks.push([`module+${mod}`, d.enabledModules.includes(mod as any)]);
  for (const mod of c.modulesExclude) checks.push([`module-${mod}`, !d.enabledModules.includes(mod as any)]);
  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length === 0) {
    pass++;
    console.log(`PASS  ${c.name}  → model=${d.businessModel} label="${m.itemLabelSingular}"`);
  } else {
    fail++;
    errors.push(`${c.name}: ${failed.map(([k]) => k).join(', ')}`);
    console.log(`FAIL  ${c.name}  sellingModel=${m.sellingModel} service=${m.isService} product=${m.isProduct} stock=${m.hasStock} barcode=${m.hasBarcodes} appt=${m.hasAppointments} weight=${m.isWeightBased} modules=[${d.enabledModules.join(', ')}]`);
  }
}
console.log(`\n${pass} passed, ${fail} failed, ${cases.length} total`);
if (errors.length) { console.log('\nFailures:\n' + errors.map(e => ' - ' + e).join('\n')); process.exit(1); }

