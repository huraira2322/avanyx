import { IndustryType, SystemModuleKey, CustomFieldDefinition } from '../types';

export interface IndustryPreset {
  id: IndustryType;
  name: string;
  category: string;
  iconName: string;
  description: string;
  keywords: string[];
  recommendedModules: SystemModuleKey[];
  defaultCustomFields: Omit<CustomFieldDefinition, 'id'>[];
  defaultCategories: string[];
  unitPresets: string[];
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'clothing',
    name: 'Clothing & Fashion Boutique',
    category: 'Retail & Apparel',
    iconName: 'Shirt',
    description: 'Apparel, Footwear, Boutiques with Size/Color/Material variants, Barcodes, Loyalty and Online Store.',
    keywords: ['clothing', 'clothes', 'apparel', 'fashion', 'boutique', 'garments', 'shoes', 'footwear', 'fabric', 'dress'],
    recommendedModules: ['pos', 'products', 'inventory', 'customers', 'loyalty', 'online_store', 'barcodes', 'financial_reports', 'business_brain'],
    defaultCustomFields: [
      { entity: 'product', name: 'Size', key: 'size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], isRequired: false },
      { entity: 'product', name: 'Color', key: 'color', type: 'text', isRequired: false },
      { entity: 'product', name: 'Material', key: 'material', type: 'text', isRequired: false },
      { entity: 'product', name: 'Season', key: 'season', type: 'select', options: ['Spring/Summer', 'Autumn/Winter', 'All Season'], isRequired: false },
    ],
    defaultCategories: ['T-Shirts & Tops', 'Dresses', 'Jeans & Trousers', 'Jackets & Coats', 'Footwear', 'Accessories'],
    unitPresets: ['Pcs', 'Pair', 'Box'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Dining',
    category: 'Food & Beverage',
    iconName: 'UtensilsCrossed',
    description: 'Dine-in tables, takeaway, kitchen modifiers, recipes/ingredients, split bills, and fast touch POS.',
    keywords: ['restaurant', 'cafe', 'food', 'dining', 'kitchen', 'bistro', 'eatery', 'burger', 'pizza', 'takeaway', 'dine in'],
    recommendedModules: ['pos', 'products', 'inventory', 'expenses', 'other_income', 'financial_reports', 'employees', 'online_store', 'business_brain'],
    defaultCustomFields: [
      { entity: 'order', name: 'Table Number', key: 'table_no', type: 'text', isRequired: false },
      { entity: 'order', name: 'Dining Type', key: 'dining_type', type: 'select', options: ['Dine-In', 'Takeaway', 'Delivery'], isRequired: true },
      { entity: 'product', name: 'Preparation Time (Mins)', key: 'prep_time', type: 'number', isRequired: false },
      { entity: 'product', name: 'Spice Level', key: 'spice_level', type: 'select', options: ['Mild', 'Medium', 'Hot', 'Extra Hot'], isRequired: false },
    ],
    defaultCategories: ['Starters & Appetizers', 'Main Courses', 'Beverages & Mocktails', 'Desserts', 'Chef Specials'],
    unitPresets: ['Portion', 'Glass', 'Plate', 'Kg'],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Medical Store',
    category: 'Healthcare & Pharma',
    iconName: 'Pill',
    description: 'Batch tracking, Expiry date monitoring, Formulas, Prescription records, and Supplier reconciliation.',
    keywords: ['pharmacy', 'medicine', 'medical', 'chemist', 'drugstore', 'pharma', 'health', 'clinic', 'tablets'],
    recommendedModules: ['pos', 'products', 'inventory', 'batch_tracking', 'suppliers', 'purchases', 'customers', 'barcodes', 'financial_reports', 'business_brain'],
    defaultCustomFields: [
      { entity: 'product', name: 'Generic Formula', key: 'generic_formula', type: 'text', isRequired: false },
      { entity: 'product', name: 'Dosage Form', key: 'dosage_form', type: 'select', options: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops'], isRequired: false },
      { entity: 'product', name: 'Prescription Required', key: 'rx_required', type: 'boolean', isRequired: true, defaultValue: false },
      { entity: 'order', name: 'Doctor / Prescriber', key: 'prescriber_name', type: 'text', isRequired: false },
    ],
    defaultCategories: ['Antibiotics & Anti-infectives', 'Pain Relief & Analgesics', 'Cardiovascular', 'Vitamins & Supplements', 'First Aid & Surgical', 'Personal Care'],
    unitPresets: ['Strip', 'Box', 'Bottle', 'Vial', 'Tube'],
  },
  {
    id: 'repair',
    name: 'Repair Shop & Service Center',
    category: 'Services & Tech',
    iconName: 'Wrench',
    description: 'Device intake tickets, Serial numbers, Repair status, Service labor vs Parts billing, and Delivery notes.',
    keywords: ['repair', 'service center', 'mobile repair', 'laptop repair', 'workshop', 'mechanic', 'electronics repair', 'technician'],
    recommendedModules: ['pos', 'products', 'services', 'inventory', 'serial_tracking', 'customers', 'estimates', 'delivery_notes', 'expenses', 'financial_reports', 'business_brain'],
    defaultCustomFields: [
      { entity: 'order', name: 'Device Model', key: 'device_model', type: 'text', isRequired: true },
      { entity: 'order', name: 'Serial / IMEI Number', key: 'imei_serial', type: 'text', isRequired: true },
      { entity: 'order', name: 'Reported Defect', key: 'defect_description', type: 'text', isRequired: true },
      { entity: 'order', name: 'Job Status', key: 'job_status', type: 'select', options: ['Received', 'Diagnosing', 'Waiting for Parts', 'Repaired', 'Delivered'], isRequired: true },
    ],
    defaultCategories: ['Repair Labor & Services', 'Replacement Displays', 'Batteries & Charging', 'Motherboard Components', 'Accessories & Cases'],
    unitPresets: ['Service', 'Unit', 'Pcs'],
  },
  {
    id: 'wholesale',
    name: 'Wholesale & B2B Distribution',
    category: 'Distribution & Trade',
    iconName: 'Truck',
    description: 'Bulk tiered pricing, Wholesale vs Retail rates, Sales orders, Credit terms, Delivery notes, and Supplier POs.',
    keywords: ['wholesale', 'distributor', 'distribution', 'b2b', 'bulk', 'trader', 'importer', 'warehouse', 'dealer'],
    recommendedModules: ['pos', 'products', 'inventory', 'batch_tracking', 'customers', 'suppliers', 'purchases', 'sales_orders', 'estimates', 'invoices', 'credit_notes', 'delivery_notes', 'budgets', 'financial_reports', 'business_brain'],
    defaultCustomFields: [
      { entity: 'customer', name: 'Business Tax/NTN No', key: 'tax_number', type: 'text', isRequired: false },
      { entity: 'customer', name: 'Credit Limit', key: 'credit_limit', type: 'number', isRequired: false },
      { entity: 'customer', name: 'Payment Term (Days)', key: 'payment_days', type: 'select', options: ['Net 7', 'Net 15', 'Net 30', 'Net 60', 'Cash on Delivery'], isRequired: false },
      { entity: 'product', name: 'Carton / Pack Quantity', key: 'carton_qty', type: 'number', isRequired: false },
    ],
    defaultCategories: ['Consumer Goods', 'Packaged Foods', 'Beverages Bulk', 'Household Essentials', 'Stationery Bulk'],
    unitPresets: ['Carton', 'Crate', 'Pallet', 'Box', 'Dozens'],
  },
  {
    id: 'grocery',
    name: 'Supermarket & Grocery Store',
    category: 'Retail & Food',
    iconName: 'ShoppingCart',
    description: 'High-speed barcode checkout, weight-scale items, fast cash handling, expiry alerts, and supplier receiving.',
    keywords: ['grocery', 'supermarket', 'mart', 'general store', 'kiryana', 'convenience store', 'produce', 'vegetables'],
    recommendedModules: ['pos', 'products', 'inventory', 'batch_tracking', 'customers', 'loyalty', 'suppliers', 'purchases', 'barcodes', 'financial_reports', 'business_brain'],
    defaultCustomFields: [
      { entity: 'product', name: 'Weighing Scale PLU', key: 'scale_plu', type: 'text', isRequired: false },
      { entity: 'product', name: 'Shelf Aisle / Rack', key: 'shelf_location', type: 'text', isRequired: false },
    ],
    defaultCategories: ['Dairy & Eggs', 'Bakery & Bread', 'Fresh Fruits & Veg', 'Snacks & Confectionery', 'Beverages', 'Cleaning & Hygiene'],
    unitPresets: ['Kg', 'Gram', 'Pcs', 'Pack', 'Bottle', 'Litre'],
  },
  {
    id: 'electronics',
    name: 'Consumer Electronics & Gadgets',
    category: 'Retail & Tech',
    iconName: 'Laptop',
    description: 'Serial number and IMEI tracking, manufacturer warranties, installment plans, and supplier management.',
    keywords: ['electronics', 'mobile', 'gadgets', 'computers', 'laptops', 'smartphones', 'accessories', 'tv', 'appliances'],
    recommendedModules: ['pos', 'products', 'inventory', 'serial_tracking', 'customers', 'suppliers', 'purchases', 'invoices', 'online_store', 'barcodes', 'financial_reports', 'business_brain'],
    defaultCustomFields: [
      { entity: 'product', name: 'Warranty Period (Months)', key: 'warranty_months', type: 'number', isRequired: false },
      { entity: 'product', name: 'Model Number', key: 'model_no', type: 'text', isRequired: false },
      { entity: 'order', name: 'Item Serial / IMEI', key: 'sold_serial_no', type: 'text', isRequired: false },
    ],
    defaultCategories: ['Smartphones & Tablets', 'Laptops & Computers', 'Audio & Headphones', 'Smart Watches & Wearables', 'Cables & Chargers'],
    unitPresets: ['Unit', 'Pcs', 'Set'],
  },
  {
    id: 'salon',
    name: 'Salon, Spa & Personal Care',
    category: 'Beauty & Wellness',
    iconName: 'Sparkles',
    description: 'Service menu, appointment tracking, stylist commissions, product retail sales, and VIP customer loyalty.',
    keywords: ['salon', 'spa', 'barber', 'hair', 'beauty', 'makeup', 'nails', 'massage', 'wellness', 'aesthetic'],
    recommendedModules: ['pos', 'products', 'services', 'inventory', 'customers', 'loyalty', 'commissions', 'appointments', 'expenses', 'financial_reports', 'business_brain'],
    defaultCustomFields: [
      { entity: 'order', name: 'Stylist / Specialist', key: 'specialist_name', type: 'text', isRequired: false },
      { entity: 'customer', name: 'Hair / Skin Profile', key: 'beauty_profile', type: 'text', isRequired: false },
    ],
    defaultCategories: ['Hair Treatments & Styling', 'Facial & Skin Care', 'Manicure & Pedicure', 'Retail Products', 'Bridal & Packages'],
    unitPresets: ['Service', 'Session', 'Pcs'],
  },
  {
    id: 'custom',
    name: 'Universal Custom Business',
    category: 'Custom & Flexible',
    iconName: 'Building2',
    description: 'Build from scratch. Select whichever modules, custom fields, and workflows your specific operations require.',
    keywords: ['custom', 'other', 'general', 'enterprise', 'multi', 'unique'],
    recommendedModules: ['pos', 'products', 'inventory', 'customers', 'suppliers', 'purchases', 'expenses', 'financial_reports', 'business_brain'],
    defaultCustomFields: [],
    defaultCategories: ['General Products', 'Services', 'Supplies'],
    unitPresets: ['Pcs', 'Kg', 'Unit', 'Hour', 'Pack'],
  },
];

export class VelcoraIndustryEngine {
  public static parseNaturalLanguageIndustry(query: string): {
    bestMatch: IndustryPreset;
    confidence: number;
    recommendedModules: SystemModuleKey[];
    suggestedName: string;
  } {
    const q = query.toLowerCase().trim();
    let bestMatch = INDUSTRY_PRESETS.find(p => p.id === 'custom') || INDUSTRY_PRESETS[0];
    let highestScore = 0;

    for (const preset of INDUSTRY_PRESETS) {
      let score = 0;
      for (const keyword of preset.keywords) {
        if (q.includes(keyword)) {
          score += 10;
        }
      }
      if (q.includes(preset.name.toLowerCase())) {
        score += 25;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = preset;
      }
    }

    const confidence = highestScore > 0 ? Math.min(0.98, 0.5 + highestScore * 0.05) : 0.4;
    let suggestedName = query.length < 30 ? query.charAt(0).toUpperCase() + query.slice(1) : `${bestMatch.name} Enterprise`;

    return {
      bestMatch,
      confidence,
      recommendedModules: bestMatch.recommendedModules,
      suggestedName,
    };
  }
}
