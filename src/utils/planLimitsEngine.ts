import { SubscriptionPlanConfig, PlanFeatureAccess, PlanResourceLimits, SubscriptionRecord } from '../types';

export interface FeatureDefinition {
  key: keyof PlanFeatureAccess;
  label: string;
  category: 'Intelligence' | 'E-Commerce' | 'Operations' | 'Finance' | 'Scale';
  description: string;
}

export interface ResourceLimitDefinition {
  key: keyof PlanResourceLimits;
  label: string;
  category: 'Capacity' | 'Compute' | 'Infrastructure';
  unit: string;
  description: string;
  step: number;
  min: number;
}

export const ALL_PLAN_FEATURES: FeatureDefinition[] = [
  {
    key: 'beta_store',
    label: 'Online Store & Digital Catalog',
    category: 'E-Commerce',
    description: 'Publish responsive web storefront, collect direct consumer orders & accept online payments.',
  },
  {
    key: 'ai_chat',
    label: 'Ask Avanyx AI Assistant',
    category: 'Intelligence',
    description: 'Conversational business co-pilot for sales advice, business strategy and real-time guidance.',
  },
  {
    key: 'ai_brain',
    label: 'Neural Demand Forecasting & Brain',
    category: 'Intelligence',
    description: 'Predictive restocking AI algorithms, customer purchase patterns and dead-stock alerts.',
  },
  {
    key: 'advanced_analytics',
    label: 'Advanced Analytics & Telemetry',
    category: 'Intelligence',
    description: 'Deep profit analytics, DAU/WAU/MAU reporting, device telemetry & drill-down metrics.',
  },
  {
    key: 'multi_terminal',
    label: 'Multi-Terminal Register Sync',
    category: 'Operations',
    description: 'Simultaneous cloud POS sync across multiple physical checkout lanes & tablets.',
  },
  {
    key: 'custom_branding',
    label: 'Custom Receipt & Invoice Branding',
    category: 'Operations',
    description: 'Remove default watermarks and brand invoices, digital passes & receipts with custom logos.',
  },
  {
    key: 'bulk_import_export',
    label: 'Bulk CSV Import / Data Export',
    category: 'Operations',
    description: 'Import mass catalog spreadsheets and export financial and inventory reports to CSV.',
  },
  {
    key: 'loyalty_system',
    label: 'Customer Loyalty & Reward Points',
    category: 'Scale',
    description: 'Automated points accumulation, member tier passes and redemption at POS.',
  },
  {
    key: 'accounting_tax',
    label: 'Automated Tax & Financial Ledger',
    category: 'Finance',
    description: 'Automated sales tax computation, expense categorization and net profit balance sheets.',
  },
  {
    key: 'purchase_orders',
    label: 'Purchase Orders & Supplier Invoicing',
    category: 'Finance',
    description: 'Vendor payable tracking, procurement workflows and receiving confirmations.',
  },
  {
    key: 'discounts_promotions',
    label: 'Promotions, Coupons & Discounts',
    category: 'Scale',
    description: 'Create promotional voucher codes, percentage discounts and seasonal POS campaigns.',
  },
  {
    key: 'barcode_generator',
    label: 'Universal Barcode & QR Label Printing',
    category: 'Operations',
    description: 'Print standardized EAN-13, UPC, Code128 barcodes and thermal shelf tags.',
  },
  {
    key: 'pos_refunds_credit_notes',
    label: 'Returns, Exchanges & Credit Notes',
    category: 'Operations',
    description: 'Process product returns, item exchanges and issue formal customer store credit notes.',
  },
  {
    key: 'role_permissions',
    label: 'Custom Staff Roles & Granular PINs',
    category: 'Operations',
    description: 'Create custom roles (cashier, manager, stockist) with fine-grained access control.',
  },
  {
    key: 'api_access',
    label: 'Developer REST API & Webhooks',
    category: 'Scale',
    description: 'External API access for CRM integrations, custom ERP connectors and webhooks.',
  },
  {
    key: 'priority_support',
    label: 'Priority 24/7 Dedicated Support',
    category: 'Scale',
    description: 'VIP direct account manager and expedited response times for business operations.',
  },
];

export const ALL_PLAN_LIMITS: ResourceLimitDefinition[] = [
  {
    key: 'maxStaff',
    label: 'Staff Accounts (Subusers)',
    category: 'Capacity',
    unit: 'accounts',
    description: 'Maximum employee and subuser login accounts that can be created.',
    step: 1,
    min: 1,
  },
  {
    key: 'maxProducts',
    label: 'Products & Inventory Items',
    category: 'Capacity',
    unit: 'items',
    description: 'Maximum SKU catalog capacity for active products and bookable services.',
    step: 50,
    min: 10,
  },
  {
    key: 'maxWorkstations',
    label: 'POS Terminals / Devices',
    category: 'Infrastructure',
    unit: 'terminals',
    description: 'Authorized active POS registers and workstations connected to the cloud.',
    step: 1,
    min: 1,
  },
  {
    key: 'monthlyAiCredits',
    label: 'Monthly AI Intelligence Credits',
    category: 'Compute',
    unit: 'credits/mo',
    description: 'Monthly token quota allocated for AI queries, demand forecasting and chat co-pilot.',
    step: 500,
    min: 100,
  },
  {
    key: 'maxCustomers',
    label: 'Customer Profiles Limit',
    category: 'Capacity',
    unit: 'profiles',
    description: 'Maximum customer CRM records stored with purchase histories and loyalty balances.',
    step: 100,
    min: 50,
  },
  {
    key: 'maxSuppliers',
    label: 'Supplier Directory Capacity',
    category: 'Capacity',
    unit: 'suppliers',
    description: 'Maximum vendor and supplier contacts for procurement and payables.',
    step: 5,
    min: 5,
  },
  {
    key: 'maxWarehouses',
    label: 'Warehouses / Outlets',
    category: 'Infrastructure',
    unit: 'locations',
    description: 'Number of separate physical stores, branches or fulfillment warehouse hubs.',
    step: 1,
    min: 1,
  },
];

export const DEFAULT_FREE_FEATURE_ACCESS: PlanFeatureAccess = {
  beta_store: false,
  ai_chat: false,
  ai_brain: false,
  advanced_analytics: true,
  multi_terminal: false,
  custom_branding: false,
  bulk_import_export: true,
  loyalty_system: true,
  accounting_tax: true,
  purchase_orders: true,
  discounts_promotions: true,
  barcode_generator: true,
  pos_refunds_credit_notes: true,
  role_permissions: false,
  api_access: false,
  priority_support: false,
};

export const DEFAULT_FREE_RESOURCE_LIMITS: PlanResourceLimits = {
  maxStaff: 2,
  maxProducts: 500,
  maxWorkstations: 1,
  monthlyAiCredits: 0,
  maxCustomers: 200,
  maxSuppliers: 10,
  maxWarehouses: 1,
};

export const DEFAULT_PRO_FEATURE_ACCESS: PlanFeatureAccess = {
  beta_store: true,
  ai_chat: true,
  ai_brain: true,
  advanced_analytics: true,
  multi_terminal: true,
  custom_branding: true,
  bulk_import_export: true,
  loyalty_system: true,
  accounting_tax: true,
  purchase_orders: true,
  discounts_promotions: true,
  barcode_generator: true,
  pos_refunds_credit_notes: true,
  role_permissions: true,
  api_access: false,
  priority_support: true,
};

export const DEFAULT_PRO_RESOURCE_LIMITS: PlanResourceLimits = {
  maxStaff: 50,
  maxProducts: 5000,
  maxWorkstations: 5,
  monthlyAiCredits: 10000,
  maxCustomers: 10000,
  maxSuppliers: 250,
  maxWarehouses: 3,
};

export const DEFAULT_PRO_MAX_FEATURE_ACCESS: PlanFeatureAccess = {
  beta_store: true,
  ai_chat: true,
  ai_brain: true,
  advanced_analytics: true,
  multi_terminal: true,
  custom_branding: true,
  bulk_import_export: true,
  loyalty_system: true,
  accounting_tax: true,
  purchase_orders: true,
  discounts_promotions: true,
  barcode_generator: true,
  pos_refunds_credit_notes: true,
  role_permissions: true,
  api_access: true,
  priority_support: true,
};

export const DEFAULT_PRO_MAX_RESOURCE_LIMITS: PlanResourceLimits = {
  maxStaff: 100,
  maxProducts: 20000,
  maxWorkstations: 20,
  monthlyAiCredits: 30000,
  maxCustomers: 100000,
  maxSuppliers: 1000,
  maxWarehouses: 10,
};

/**
 * Normalizes and resolves a plan's featureAccess and resourceLimits, applying standard defaults for any missing properties.
 */
export function sanitizePlanConfig(plan?: SubscriptionPlanConfig | null): SubscriptionPlanConfig {
  if (!plan) {
    return {
      id: 'tier_free',
      tier: 'free',
      name: 'Avanyx Free',
      tagline: 'Essential store operations and standard analytics',
      monthlyPriceUSD: 0,
      annualPriceUSD: 0,
      currencyPricing: {},
      tokensIncludedMonthly: 0,
      maxWorkstations: 1,
      maxSubusers: 2,
      maxProducts: 500,
      features: ['Universal POS', 'Standard Analytics'],
      isActive: true,
      featureAccess: DEFAULT_FREE_FEATURE_ACCESS,
      resourceLimits: { ...DEFAULT_FREE_RESOURCE_LIMITS, monthlyAiCredits: 0 },
    };
  }

  const tierKey = (plan.tier || plan.id || 'free').toLowerCase();
  let defaultFeatures = DEFAULT_FREE_FEATURE_ACCESS;
  let defaultLimits = DEFAULT_FREE_RESOURCE_LIMITS;

  if (tierKey.includes('pro_max') || tierKey.includes('enterprise')) {
    defaultFeatures = DEFAULT_PRO_MAX_FEATURE_ACCESS;
    defaultLimits = DEFAULT_PRO_MAX_RESOURCE_LIMITS;
  } else if (tierKey.includes('pro') || tierKey.includes('starter') || tierKey.includes('professional') || tierKey.includes('plus') || tierKey.includes('premium')) {
    defaultFeatures = DEFAULT_PRO_FEATURE_ACCESS;
    defaultLimits = DEFAULT_PRO_RESOURCE_LIMITS;
  }

  const mergedFeatures: PlanFeatureAccess = {
    ...defaultFeatures,
    ...(plan.featureAccess || {}),
  };

  const rawLimits = plan.resourceLimits || {};
  // Bidirectional resolution: if plan has top-level limits explicitly set, preserve them; otherwise use rawLimits or defaultLimits
  const resolvedProducts = plan.maxProducts !== undefined ? plan.maxProducts : (rawLimits.maxProducts ?? defaultLimits.maxProducts);
  const resolvedStaff = plan.maxSubusers !== undefined ? plan.maxSubusers : (rawLimits.maxStaff ?? defaultLimits.maxStaff);
  const resolvedWorkstations = plan.maxWorkstations !== undefined ? plan.maxWorkstations : (rawLimits.maxWorkstations ?? defaultLimits.maxWorkstations);
  const resolvedAiCredits = plan.tokensIncludedMonthly !== undefined ? plan.tokensIncludedMonthly : (rawLimits.monthlyAiCredits ?? defaultLimits.monthlyAiCredits);

  const mergedLimits: PlanResourceLimits = {
    ...defaultLimits,
    ...rawLimits,
    maxProducts: resolvedProducts,
    maxStaff: resolvedStaff,
    maxWorkstations: resolvedWorkstations,
    monthlyAiCredits: resolvedAiCredits,
  };

  return {
    ...plan,
    maxProducts: resolvedProducts,
    maxSubusers: resolvedStaff,
    maxWorkstations: resolvedWorkstations,
    tokensIncludedMonthly: resolvedAiCredits,
    features: Array.isArray(plan.features) ? plan.features : [],
    featureAccess: mergedFeatures,
    resourceLimits: mergedLimits,
  };
}

/**
 * Resolves the currently active subscription plan from the user's active subscription, user profile, and available plans.
 */
export function resolveActivePlan(
  activeSubscription?: SubscriptionRecord | null | undefined,
  plansList?: SubscriptionPlanConfig[] | null,
  activeBusiness?: { subscriptionTier?: string } | null,
  userProfile?: { subscriptionTier?: string } | null
): SubscriptionPlanConfig {
  const safeList = Array.isArray(plansList) ? plansList : [];
  const tier = (
    activeSubscription?.tier ||
    activeSubscription?.planId ||
    userProfile?.subscriptionTier ||
    activeBusiness?.subscriptionTier ||
    'free'
  ).toLowerCase();

  const found = safeList.find(p => 
    (p.id && p.id.toLowerCase() === tier) || 
    (p.tier && p.tier.toLowerCase() === tier) ||
    (tier.includes('pro_max') && (p.tier === 'pro_max' || p.id === 'tier_pro_max')) ||
    ((tier.includes('pro') || tier.includes('premium') || tier.includes('plus')) && !tier.includes('pro_max') && (p.tier === 'pro' || p.id === 'tier_pro')) ||
    (tier.includes('free') && (p.tier === 'free' || p.id === 'tier_free'))
  );

  if (found) {
    return sanitizePlanConfig(found);
  }

  if (tier.includes('pro_max') || tier.includes('enterprise')) {
    const defaultProMax: SubscriptionPlanConfig = {
      id: 'tier_pro_max',
      tier: 'pro_max',
      name: 'Avanyx Pro Max',
      tagline: 'Enterprise scale, dedicated AI models and maximum capability',
      monthlyPriceUSD: 29.0,
      annualPriceUSD: 290.0,
      currencyPricing: {},
      tokensIncludedMonthly: 30000,
      maxWorkstations: 20,
      maxSubusers: 100,
      maxProducts: 20000,
      features: ['Universal POS', 'Advanced Neural Analytics', 'Unlimited Workstations'],
      isActive: true,
      featureAccess: DEFAULT_PRO_MAX_FEATURE_ACCESS,
      resourceLimits: DEFAULT_PRO_MAX_RESOURCE_LIMITS,
    };
    return sanitizePlanConfig(defaultProMax);
  }

  if (tier.includes('pro') || tier.includes('premium') || tier.includes('plus')) {
    const defaultPro: SubscriptionPlanConfig = {
      id: 'tier_pro',
      tier: 'pro',
      name: 'Avanyx Pro',
      tagline: 'Unlock premium neural engines, multi-terminal and higher limits',
      monthlyPriceUSD: 10.0,
      annualPriceUSD: 100.0,
      currencyPricing: {},
      tokensIncludedMonthly: 10000,
      maxWorkstations: 5,
      maxSubusers: 50,
      maxProducts: 5000,
      features: ['Universal POS', 'Pro Analytics'],
      isActive: true,
      featureAccess: DEFAULT_PRO_FEATURE_ACCESS,
      resourceLimits: DEFAULT_PRO_RESOURCE_LIMITS,
    };
    return sanitizePlanConfig(defaultPro);
  }

  const defaultFree = safeList.find(p => p.tier === 'free' || p.id === 'tier_free') || {
    id: 'tier_free',
    tier: 'free',
    name: 'Avanyx Free',
    tagline: 'Essential store operations and standard analytics',
    monthlyPriceUSD: 0,
    annualPriceUSD: 0,
    currencyPricing: {},
    tokensIncludedMonthly: 0,
    maxWorkstations: 1,
    maxSubusers: 2,
    maxProducts: 500,
    features: ['Universal POS', 'Standard Analytics'],
    isActive: true,
    featureAccess: DEFAULT_FREE_FEATURE_ACCESS,
    resourceLimits: { ...DEFAULT_FREE_RESOURCE_LIMITS, monthlyAiCredits: 0 },
  };

  return sanitizePlanConfig(defaultFree);
}

/**
 * Checks whether a given feature is allowed for the active plan.
 */
export function isFeatureAllowed(plan?: SubscriptionPlanConfig | null, featureKey?: keyof PlanFeatureAccess | string): boolean {
  if (!plan || !featureKey) return false;
  const sanitized = sanitizePlanConfig(plan);
  const val = sanitized.featureAccess?.[featureKey as keyof PlanFeatureAccess];
  return val === true;
}

export interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  planName: string;
  tier: string;
  errorMessage?: string;
}

/**
 * Checks whether adding an item exceeds the plan's resource limits.
 */
export function checkResourceLimit(
  plan: SubscriptionPlanConfig,
  limitKey: keyof PlanResourceLimits,
  currentCount: number
): LimitCheckResult {
  const sanitized = sanitizePlanConfig(plan);
  const limit = sanitized.resourceLimits?.[limitKey] ?? 999999;
  const remaining = Math.max(0, limit - currentCount);
  const allowed = currentCount < limit;

  const limitDef = ALL_PLAN_LIMITS.find(l => l.key === limitKey);
  const label = limitDef?.label || limitKey;

  return {
    allowed,
    limit,
    current: currentCount,
    remaining,
    planName: sanitized.name,
    tier: sanitized.tier,
    errorMessage: allowed
      ? undefined
      : `You have reached your ${sanitized.name} limit of ${limit.toLocaleString()} ${String(label).toLowerCase()}. Upgrade your plan to add more.`,
  };
}
