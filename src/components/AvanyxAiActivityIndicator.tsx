import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  BrainCircuit,
  TrendingUp,
  BarChart3,
  Package,
  DollarSign,
  Users,
  Code,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Activity,
  FileSearch,
  Calculator,
} from 'lucide-react';
import { AvanyxMascot } from './AvanyxMascot';

export interface AvanyxAiActivityIndicatorProps {
  promptText?: string;
  hasAttachment?: boolean;
  activePalette: {
    hex: string;
    lightBg: string;
    ringHex: string;
  };
  modelName?: string;
  startTime?: number;
}

type QueryCategory =
  | 'financial'
  | 'sales_analysis'
  | 'product_inventory'
  | 'customer_crm'
  | 'strategy_ops'
  | 'code_technical'
  | 'general_query';

interface StageDefinition {
  title: string;
  detail: string;
  icon: any;
  durationMs: number;
}

/**
 * Classify user prompt into a truthful, contextually relevant domain category
 */
function classifyPromptCategory(prompt: string = '', hasAttachment: boolean = false): QueryCategory {
  const p = prompt.toLowerCase();

  if (hasAttachment) {
    if (/invoice|receipt|bill|financial|statement/i.test(p)) return 'financial';
    if (/product|barcode|item|stock|catalog|inventory/i.test(p)) return 'product_inventory';
  }

  // Financial Ledger & Accounting
  if (
    /profit|loss|p&l|revenue|cogs|margin|break-even|expense|budget|ledger|tax|cash flow|financial|accounting|valuation|cost price|income/i.test(
      p
    )
  ) {
    return 'financial';
  }

  // Sales Trends, Velocity, Performance
  if (
    /sales|pattern|velocity|trend|forecast|demand|peak hour|transaction|today's sale|yesterday|performance|best seller|daily sales/i.test(
      p
    )
  ) {
    return 'sales_analysis';
  }

  // Products, Catalog, Stock, Variants, Barcodes, POs
  if (
    /product|catalog|item|stock|inventory|variant|sku|barcode|batch|expiry|serial|imei|supplier|vendor|purchase order|reorder|dead stock/i.test(
      p
    )
  ) {
    return 'product_inventory';
  }

  // Customers, VIP Tiers, Loyalty CRM
  if (/customer|client|loyalty|point|tier|vip|retention|frequent|buyer|demographic|churn/i.test(p)) {
    return 'customer_crm';
  }

  // Strategy, Diagnostic, Problem, Goals, Store Operations
  if (/goal|problem|diagnos|strategy|growth|health score|recommend|leak|efficiency|staff|commission/i.test(p)) {
    return 'strategy_ops';
  }

  // Programming, APIs, Database, Tech
  if (/code|javascript|typescript|python|react|html|css|sql|database|api|endpoint|bug|function|component/i.test(p)) {
    return 'code_technical';
  }

  return 'general_query';
}

/**
 * Stage sequences tailored to each domain
 */
const STAGE_CONFIGS: Record<QueryCategory, StageDefinition[]> = {
  sales_analysis: [
    {
      title: 'Understanding sales & trend request',
      detail: 'Parsing query parameters & target timeline...',
      icon: TrendingUp,
      durationMs: 1400,
    },
    {
      title: 'Reviewing POS transaction velocity',
      detail: 'Analyzing recent sales ledger & order volumes...',
      icon: BarChart3,
      durationMs: 2400,
    },
    {
      title: 'Identifying patterns & demand signals',
      detail: 'Computing basket sizes, sales velocity & anomalies...',
      icon: BrainCircuit,
      durationMs: 2800,
    },
    {
      title: 'Formulating strategic business insights',
      detail: 'Preparing executive summary & recommendations...',
      icon: Sparkles,
      durationMs: 3500,
    },
  ],
  financial: [
    {
      title: 'Initializing financial ledger audit',
      detail: 'Resolving verified accounting metrics & currency...',
      icon: DollarSign,
      durationMs: 1400,
    },
    {
      title: 'Reconciling revenue, expenses & margins',
      detail: 'Cross-referencing store ledger with operating costs...',
      icon: Calculator,
      durationMs: 2400,
    },
    {
      title: 'Calculating deterministic ratios & P&L',
      detail: 'Running exact margin formulas & break-even balance...',
      icon: Activity,
      durationMs: 2800,
    },
    {
      title: 'Compiling financial analysis summary',
      detail: 'Finalizing ledger audit and insights...',
      icon: Sparkles,
      durationMs: 3500,
    },
  ],
  product_inventory: [
    {
      title: 'Understanding product & stock request',
      detail: 'Identifying relevant SKUs, categories & stock levels...',
      icon: Package,
      durationMs: 1400,
    },
    {
      title: 'Reviewing live store inventory depth',
      detail: 'Checking quantity on hand, costs & reorder thresholds...',
      icon: Layers,
      durationMs: 2400,
    },
    {
      title: 'Validating catalog parameters & suppliers',
      detail: 'Checking inventory valuation & supplier data...',
      icon: FileSearch,
      durationMs: 2800,
    },
    {
      title: 'Preparing catalog & inventory response',
      detail: 'Formatting product records and actionable guidance...',
      icon: Sparkles,
      durationMs: 3500,
    },
  ],
  customer_crm: [
    {
      title: 'Understanding customer & CRM query',
      detail: 'Analyzing customer segmentation context...',
      icon: Users,
      durationMs: 1400,
    },
    {
      title: 'Reviewing customer profiles & VIP tiers',
      detail: 'Evaluating spending history, visits & loyalty points...',
      icon: Activity,
      durationMs: 2400,
    },
    {
      title: 'Evaluating retention & lifetime value',
      detail: 'Calculating purchase frequency and tier benefits...',
      icon: BrainCircuit,
      durationMs: 2800,
    },
    {
      title: 'Formulating customer recommendations',
      detail: 'Preparing personalized CRM insights...',
      icon: Sparkles,
      durationMs: 3500,
    },
  ],
  strategy_ops: [
    {
      title: 'Analyzing business diagnostic request',
      detail: 'Interpreting operational goals & problem indicators...',
      icon: BrainCircuit,
      durationMs: 1400,
    },
    {
      title: 'Evaluating store health & performance metrics',
      detail: 'Scanning operational bottlenecks and efficiency leaks...',
      icon: Activity,
      durationMs: 2400,
    },
    {
      title: 'Synthesizing Second Brain intelligence',
      detail: 'Cross-checking durable memories & historical benchmarks...',
      icon: Cpu,
      durationMs: 2800,
    },
    {
      title: 'Generating executive action plan',
      detail: 'Preparing structured steps and recommendations...',
      icon: Sparkles,
      durationMs: 3500,
    },
  ],
  code_technical: [
    {
      title: 'Analyzing technical query & architecture',
      detail: 'Parsing language syntax, data structures & logic...',
      icon: Code,
      durationMs: 1400,
    },
    {
      title: 'Evaluating technical implementation patterns',
      detail: 'Validating logic, security & best practices...',
      icon: Cpu,
      durationMs: 2400,
    },
    {
      title: 'Synthesizing code solution & verification',
      detail: 'Generating clean, type-safe implementation...',
      icon: BrainCircuit,
      durationMs: 2800,
    },
    {
      title: 'Formatting code & technical explanation',
      detail: 'Adding syntax highlighting and documentation...',
      icon: Sparkles,
      durationMs: 3500,
    },
  ],
  general_query: [
    {
      title: 'Understanding your request',
      detail: 'Analyzing context and grounding directives...',
      icon: BrainCircuit,
      durationMs: 1400,
    },
    {
      title: 'Reviewing relevant business context',
      detail: 'Consulting active store configuration & knowledge...',
      icon: Layers,
      durationMs: 2400,
    },
    {
      title: 'Working through analytical reasoning',
      detail: 'Evaluating optimal answer formulation...',
      icon: Cpu,
      durationMs: 2800,
    },
    {
      title: 'Preparing your response',
      detail: 'Finalizing response formatting...',
      icon: Sparkles,
      durationMs: 3500,
    },
  ],
};

export const AvanyxAiActivityIndicator: React.FC<AvanyxAiActivityIndicatorProps> = ({
  promptText = '',
  hasAttachment = false,
  activePalette,
  modelName,
  startTime,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  const category = useMemo(
    () => classifyPromptCategory(promptText, hasAttachment),
    [promptText, hasAttachment]
  );

  const stages = useMemo(() => STAGE_CONFIGS[category] || STAGE_CONFIGS.general_query, [category]);

  // Elapsed timer & dynamic stage updater
  useEffect(() => {
    const initTime = startTime || Date.now();

    const interval = setInterval(() => {
      const diffMs = Date.now() - initTime;
      setElapsedSeconds(Math.floor(diffMs / 100) / 10);

      // Determine which stage we should be on based on cumulative durations
      let accMs = 0;
      let targetIdx = 0;
      for (let i = 0; i < stages.length; i++) {
        accMs += stages[i].durationMs;
        if (diffMs >= accMs) {
          targetIdx = Math.min(i + 1, stages.length - 1);
        } else {
          break;
        }
      }
      setCurrentStageIdx(targetIdx);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, stages]);

  const activeStage = stages[currentStageIdx] || stages[0];
  const ActiveStageIcon = activeStage.icon;

  // Extended waiting messages if network or model takes longer (> 8.5s)
  const isExtendedWait = elapsedSeconds >= 8.5;
  const isDeepReasoning = elapsedSeconds >= 16.0;

  const displayTitle = isDeepReasoning
    ? 'Deep multi-step reasoning in progress...'
    : isExtendedWait
    ? 'Still working on your request (waiting for model response)...'
    : activeStage.title;

  const displayDetail = isDeepReasoning
    ? 'Synthesizing complex multi-factor business data with frontier AI...'
    : isExtendedWait
    ? 'Finalizing response transmission from AI provider...'
    : activeStage.detail;

  return (
    <div className="flex gap-3 max-w-3xl mx-auto justify-start w-full animate-fade-in select-none">
      {/* Avanyx Avatar with subtle glowing aura */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 border border-slate-200 dark:border-slate-800 relative shadow-sm"
        style={{
          backgroundColor: activePalette.lightBg,
          color: activePalette.hex,
        }}
      >
        <AvanyxMascot size={22} sparkles={true} />
        <div
          className="absolute inset-0 rounded-xl animate-ping opacity-20 pointer-events-none"
          style={{ backgroundColor: activePalette.hex }}
        />
      </div>

      {/* Main Activity Card */}
      <div
        className="flex-1 max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-xs p-3.5 sm:p-4 border transition-all duration-300 shadow-sm bg-white/90 dark:bg-[#11172A]/90 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80"
        style={{
          boxShadow: `0 4px 20px ${activePalette.ringHex}`,
        }}
      >
        {/* Top Header: Active Processing Indicator & Elapsed Time */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: activePalette.hex }}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {modelName ? `${modelName} • Processing` : 'Avanyx Brain • Thinking'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#18213B] border border-slate-200/60 dark:border-slate-700/60">
            <Clock className="w-3 h-3 text-slate-400 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
              {elapsedSeconds.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Current Active Status Area */}
        <div className="flex items-start gap-3 py-1 min-h-[44px]">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300"
            style={{
              backgroundColor: activePalette.lightBg,
              color: activePalette.hex,
            }}
          >
            <ActiveStageIcon className="w-4 h-4 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white transition-opacity duration-200">
                {displayTitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug transition-opacity duration-200 line-clamp-1">
              {displayDetail}
            </p>
          </div>
        </div>

        {/* Multi-step Visual Progress Pipeline */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 items-center">
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 relative overflow-hidden ${
                      isCompleted
                        ? 'opacity-100'
                        : isCurrent
                        ? 'opacity-100 ring-1'
                        : 'bg-slate-200 dark:bg-slate-800 opacity-60'
                    }`}
                    style={{
                      backgroundColor: isCompleted || isCurrent ? activePalette.hex : undefined,
                      boxShadow: isCurrent ? `0 0 8px ${activePalette.hex}` : undefined,
                    }}
                  >
                    {isCurrent && (
                      <div className="absolute inset-0 bg-white/40 animate-pulse" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-medium truncate hidden sm:block transition-colors duration-200 ${
                      isCurrent
                        ? 'font-bold text-slate-900 dark:text-white'
                        : isCompleted
                        ? 'text-slate-600 dark:text-slate-400'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {idx + 1}. {stage.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

