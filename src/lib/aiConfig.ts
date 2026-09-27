/**
 * Avanyx AI Central Configuration — Single Source of Truth
 * ----------------------------------------------------------------
 * Owns ALL user-facing AI model definitions, billing rates (credits per 1k
 * tokens — used by the server-side credit engine), USD per-1k-token display
 * pricing (Wallet & AI Router), availability, and per-user usage limits.
 *
 * ONE edit in the Super Admin "AI Models & Pricing" panel propagates to:
 *   - Server billing       (creditManager.ts -> calculateMaxCost)
 *   - Chat model selector  (AskAvanyxChat.tsx)
 *   - Wallet pricing       (WalletView.tsx)
 *   - Usage-limit enforcement (reserveCredits)
 *
 * Firestore contract: system/ai_config -> { version, updatedAt, updatedBy,
 * models: {...}, global: {...} }. Server keeps a TTL cache + merges overrides
 * over DEFAULT_AI_CONFIG. Client holds a real-time snapshot via context.
 */

export type AiEngineCapability =
  | 'fast_text'
  | 'deep_reasoning'
  | 'multimodal'
  | 'financial'
  | 'image_generation'
  | 'video_generation'
  | 'creative';

export type AiModelCategory = 'Core' | 'Fast & Direct' | 'Reasoning' | 'Multimodal' | 'Specialized';
export type AiModelAvailability = 'active' | 'standby' | 'maintenance';
export type AiModelTier = 'free' | 'pro' | 'pro_max' | 'all';

/** Billing + availability + limits for a single Avanyx AI engine. */
export interface AiModelConfig {
  modelId: string;
  name: string;
  tagline: string;
  description: string;
  provider: 'Avanyx AI' | 'Avanyx AI';
  capability: AiEngineCapability;
  category: AiModelCategory;
  contextWindow: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  baseFee: number;
  inputPer1k: number;
  outputPer1k: number;
  fixedCost?: number;
  usdPer1kTokens: number;
  tier: AiModelTier;
  availability: AiModelAvailability;
  enabled: boolean;
  dailyLimitPerUser: number;
  monthlyLimitPerUser: number;
  rateLimitPerMinute: number;
  capabilities: string[];
  backendCandidates: string[];
}

export interface AiConfigGlobal {
  defaultMonthlyQuota: number;
  enableAIPurchases: boolean;
  maintenanceMode: boolean;
  aiKillSwitch: boolean;
}

export interface AIConfig {
  version: number;
  updatedAt: string;
  updatedBy: string;
  models: Record<string, AiModelConfig>;
  global: AiConfigGlobal;
}

/** Firestore document (collection 'system', doc 'ai_config') */
export const AI_CONFIG_DOC = { collection: 'system', id: 'ai_config' } as const;

/** Strip 'avanyx-' or 'avanyx-' prefix so 'avanyx-chat' / 'avanyx-chat' resolves like 'chat'. */
export function normalizeModelId(raw: string | undefined | null): string {
  if (!raw) return 'chat';
  const s = String(raw).toLowerCase();
  if (s.startsWith('avanyx-')) return s.slice('avanyx-'.length);
  return s.startsWith('avanyx-') ? s.slice('avanyx-'.length) : s;
}

/** Deep-merge an override doc over defaults (partial models + global only). */
export function mergeAIConfig(base: AIConfig, override: Partial<AIConfig> | null | undefined): AIConfig {
  if (!override) return base;
  const merged: AIConfig = {
    version: override.version ?? base.version,
    updatedAt: override.updatedAt ?? base.updatedAt,
    updatedBy: override.updatedBy ?? base.updatedBy,
    global: { ...base.global, ...(override.global || {}) },
    models: { ...base.models },
  };
  if (override.models) {
    for (const [key, patch] of Object.entries(override.models)) {
      if (!patch) continue;
      const norm = normalizeModelId(key);
      const baseEntry = merged.models[norm] ?? merged.models[key] ?? null;
      merged.models[norm] = { ...(baseEntry as AiModelConfig), ...(patch as AiModelConfig) };
      if (key !== norm) merged.models[key] = { ...merged.models[norm] };
    }
  }
  return merged;
}

export function findModelConfig(config: AIConfig | null, rawModelId: string): AiModelConfig | undefined {
  const norm = normalizeModelId(rawModelId);
  return config?.models[norm] ?? config?.models[rawModelId];
}

export interface IbRate {
  fixedCost?: number;
  baseFee: number;
  inputPer1k: number;
  outputPer1k: number;
  usdPer1kTokens: number;
  tier: AiModelTier;
  availability: AiModelAvailability;
  enabled: boolean;
  dailyLimitPerUser: number;
  monthlyLimitPerUser: number;
  rateLimitPerMinute: number;
}
export function getEngineBilling(config: AIConfig | null, rawModelId: string): IbRate {
  const m = findModelConfig(config, rawModelId);
  if (!m) {
    return { baseFee: 1, inputPer1k: 15, outputPer1k: 15, usdPer1kTokens: 0, tier: 'free', availability: 'active', enabled: true, dailyLimitPerUser: 0, monthlyLimitPerUser: 0, rateLimitPerMinute: 0 };
  }
  return {
    fixedCost: m.fixedCost,
    baseFee: m.baseFee,
    inputPer1k: m.inputPer1k,
    outputPer1k: m.outputPer1k,
    usdPer1kTokens: m.usdPer1kTokens,
    tier: m.tier,
    availability: m.availability,
    enabled: m.enabled,
    dailyLimitPerUser: m.dailyLimitPerUser,
    monthlyLimitPerUser: m.monthlyLimitPerUser,
    rateLimitPerMinute: m.rateLimitPerMinute,
  };
}

/** The 4 router-facing cards, in display order. */
export const ROUTER_MODEL_IDS = ['chat', 'flash', 'omni', 'axiom'] as const;
export type RouterModelId = (typeof ROUTER_MODEL_IDS)[number];

export function routerModelsList(config: AIConfig | null): AiModelConfig[] {
  const cfg = config ?? DEFAULT_AI_CONFIG;
  return ROUTER_MODEL_IDS.map((id) => findModelConfig(cfg, id)!).filter(Boolean) as AiModelConfig[];
}

/** DEFAULT_AI_CONFIG — authoritative seed (billing mirrors creditManager, display mirrors modelRegistry). */
export const DEFAULT_AI_CONFIG: AIConfig = {
  version: 1,
  updatedAt: '2026-09-13T00:00:00.000Z',
  updatedBy: 'hurairahussain667@gmail.com',
  global: {
    defaultMonthlyQuota: 0,
    enableAIPurchases: true,
    maintenanceMode: false,
    aiKillSwitch: false,
  },
  models: {
    chat: {
      modelId: 'chat', name: 'Chat', tagline: 'Avanyx Neural • Everyday conversational assistant',
      description: 'Everyday conversational AI for general questions, quick assistance, and basic business inquiries. Optimized for speed and minimal cost.',
      provider: 'Avanyx AI', capability: 'fast_text', category: 'Core', contextWindow: '1,000,000',
      maxInputTokens: 200000, maxOutputTokens: 8192, baseFee: 1, inputPer1k: 1, outputPer1k: 4,
      usdPer1kTokens: 0, tier: 'all', availability: 'active', enabled: true,
      dailyLimitPerUser: 0, monthlyLimitPerUser: 0, rateLimitPerMinute: 12,
      capabilities: ['text', 'image understanding', 'document Q&A'],
      backendCandidates: ['deepseek-v4-flash', 'gemini-2.5-flash-lite'],
    },
    flash: {
      modelId: 'flash', name: 'Flash', tagline: 'Avanyx Neural • Fast reasoning',
      description: 'Fast reasoning AI for business analysis, data analysis, and more complex questions. Balances low latency with strong reasoning.',
      provider: 'Avanyx AI', capability: 'deep_reasoning', category: 'Fast & Direct', contextWindow: '1,000,000',
      maxInputTokens: 200000, maxOutputTokens: 8192, baseFee: 1, inputPer1k: 2, outputPer1k: 8,
      usdPer1kTokens: 0.00015, tier: 'free', availability: 'active', enabled: true,
      dailyLimitPerUser: 0, monthlyLimitPerUser: 0, rateLimitPerMinute: 10,
      capabilities: ['fast responses', 'business analysis', 'data crunching'],
      backendCandidates: ['deepseek-v4-flash'],
    },
    omni: {
      modelId: 'omni', name: 'Avanyx Nexus', tagline: 'Avanyx Neural • Advanced Reasoning',
      description: "Avanyx Nexus is Avanyx's advanced conversational AI model, designed for fast, intelligent, and natural interactions.",
      provider: 'Avanyx AI', capability: 'deep_reasoning', category: 'Reasoning', contextWindow: '1,000,000',
      maxInputTokens: 200000, maxOutputTokens: 16384, baseFee: 1, inputPer1k: 4, outputPer1k: 16,
      usdPer1kTokens: 0.0008, tier: 'pro', availability: 'active', enabled: true,
      dailyLimitPerUser: 0, monthlyLimitPerUser: 0, rateLimitPerMinute: 6,
      capabilities: ['multi-step analysis', 'historical data', 'recommendations'],
      backendCandidates: ['deepseek-v4-pro'],
    },
    axiom: {
      modelId: 'axiom', name: 'Axioms', tagline: 'Avanyx Neural • Financial & deep reasoning',
      description: 'Specialized financial analysis for revenue, profit/loss, expenses, cash flow, margins, and budget analysis. NEVER invents numbers — retrieves real data only.',
      provider: 'Avanyx AI', capability: 'financial', category: 'Reasoning', contextWindow: '1,000,000',
      maxInputTokens: 200000, maxOutputTokens: 16384, baseFee: 1, inputPer1k: 4, outputPer1k: 16,
      usdPer1kTokens: 0.001, tier: 'pro_max', availability: 'active', enabled: true,
      dailyLimitPerUser: 0, monthlyLimitPerUser: 0, rateLimitPerMinute: 4,
      capabilities: ['financial analysis', 'real numbers only', 'budget reports'],
      backendCandidates: ['deepseek-v4-pro'],
    },
    
  },
};
