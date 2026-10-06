import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShoppingCart, Package, BarChart3, TrendingUp, Users, DollarSign,
  FileText, ShieldCheck, Globe, MessageSquareText, Sliders,
  BellRing, Scan, Building2, Share2, Check, CheckCircle2,
  ArrowRight, ChevronRight, Star, Award, Lock, RefreshCw,
  Store, ChevronDown, ExternalLink, Wallet, Sparkles, Clock,
  Smartphone, Percent, Printer, Search, Activity, Layers,
  Shield, Zap, CheckCircle, SlidersHorizontal, Menu, X,
  HelpCircle, Cpu, ArrowUpRight, Filter, AlertTriangle,
  Receipt, Play, KeyRound, Coins, Eye, Copy, CheckCheck,
  CreditCard, LayoutDashboard, Tag, Palette, HelpCircle as HelpIcon,
  MousePointerClick, Sparkle, Network, Boxes, GitBranch,
  HardDrive, Wifi, WifiOff, Monitor, Usb, Terminal, Flame, Info,
  CornerDownRight, Server, ArrowDown
} from 'lucide-react';
import { AvanyxWordmark } from './AvanyxWordmark';
import { useAvanyx } from '../context/AvanyxContext';
import { DEFAULT_SUBSCRIPTION_PLANS } from '../data/paymentPlans';
import { SubscriptionPlanConfig } from '../types';
import { PlanDetailsModal } from './PlanDetailsModal';
import { ChatModelLogo, OmniModelLogo, FlashModelLogo, AxiomModelLogo } from './AvanyxAiModelLogos';

interface AvanyxLandingPageProps {
  onLaunchPos: () => void;
  onOpenAuth: (mode?: 'login' | 'signup' | 'phone' | 'staff' | 'demo') => void;
}

export const AvanyxLandingPage: React.FC<AvanyxLandingPageProps> = ({
  onLaunchPos,
  onOpenAuth,
  
}) => {
  const { subscriptionPlans } = useAvanyx();
  const displayPlans = useMemo(() => {
    if (subscriptionPlans && subscriptionPlans.length > 0) {
      return subscriptionPlans.filter((p) => p.isActive !== false);
    }
    try {
      const cached = localStorage.getItem('avanyx_plans_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p: any) => p.isActive !== false);
        }
      }
    } catch {}
    return DEFAULT_SUBSCRIPTION_PLANS;
  }, [subscriptionPlans]);

  // Navigation & Menu States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Billing Interval: Monthly vs Annual
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');

  // Selected Plan Detail Modal State
  const [selectedDetailPlan, setSelectedDetailPlan] = useState<SubscriptionPlanConfig | null>(null);

  // Interactive 3D Hero Mouse Tilt State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveredHero, setIsHoveredHero] = useState(false);
  const heroCardRef = useRef<HTMLDivElement>(null);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setMousePos({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setIsHoveredHero(false);
    setMousePos({ x: 0, y: 0 });
  };

  // Scroll listener for glass navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AI Neural Models Interactive Showcase State
  const [aiActiveModelId, setAiActiveModelId] = useState<'chat' | 'flash' | 'omni' | 'axiom'>('omni');
  const [aiReasoningExpanded, setAiReasoningExpanded] = useState<boolean>(true);
  const [aiActivePromptIndex, setAiActivePromptIndex] = useState<number>(0);

  // Hardware Ecosystem Filter & Interactive Simulator State
  const [hardwareActiveTab, setHardwareActiveTab] = useState<'all' | 'printers' | 'scanners' | 'drawers' | 'cfd' | 'mobile'>('all');
  const [posReceiptModalOpen, setPosReceiptModalOpen] = useState<boolean>(false);
  const [posDrawerAlert, setPosDrawerAlert] = useState<boolean>(false);

  const triggerDrawerKick = () => {
    setPosDrawerAlert(true);
    setTimeout(() => setPosDrawerAlert(false), 3200);
  };

  // Demand Forecaster Interactive Sliders
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [marketingBoost, setMarketingBoost] = useState<number>(15);
  const [seasonalityFactor, setSeasonalityFactor] = useState<number>(10);

  // Module Category Filter
  const [moduleCategory, setModuleCategory] = useState<'all' | 'core' | 'ai' | 'finance' | 'admin'>('all');

  // Product Gallery Active Tab
  const [galleryTab, setGalleryTab] = useState<'dashboard' | 'pos' | 'inventory' | 'brain' | 'forecaster' | 'store'>('dashboard');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // POS Showcase Interactive Cart State
  const [posActiveCategory, setPosActiveCategory] = useState<string>('All');
  const [posCart, setPosCart] = useState<Array<{ name: string; price: number; qty: number; notes: string }>>([
    { name: 'Oat Flat White', price: 4.80, qty: 2, notes: 'Oat Milk • Extra Hot' },
    { name: 'Almond Croissant', price: 4.25, qty: 1, notes: 'Warmed' },
  ]);

  const addPosItem = (name: string, price: number, notes: string) => {
    setPosCart((prev) => {
      const existing = prev.find((item) => item.name === name);
      if (existing) {
        return prev.map((item) => item.name === name ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { name, price, qty: 1, notes }];
    });
  };

  const clearPosCart = () => {
    setPosCart([]);
  };

  const posSubtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [posCart]);

  // Dynamic calculations for Demand Forecaster Simulator
  const simulatedForecast = useMemo(() => {
    const baseWeeklyRevenue = 14250;
    const baseUnits = 480;

    const priceMultiplier = 1 + priceAdjustment / 100;
    const unitElasticity = 1 - (priceAdjustment * 0.4) / 100;
    const marketingMultiplier = 1 + (marketingBoost * 0.5) / 100;
    const seasonalMultiplier = 1 + (seasonalityFactor * 0.3) / 100;

    const projectedUnits = Math.round(baseUnits * unitElasticity * marketingMultiplier * seasonalMultiplier);
    const projectedRevenue = Math.round(baseWeeklyRevenue * priceMultiplier * unitElasticity * marketingMultiplier * seasonalMultiplier);
    const revenueDelta = projectedRevenue - baseWeeklyRevenue;
    const percentChange = ((revenueDelta / baseWeeklyRevenue) * 100).toFixed(1);

    return {
      projectedRevenue,
      projectedUnits,
      revenueDelta,
      percentChange: Number(percentChange) >= 0 ? `+${percentChange}%` : `${percentChange}%`,
      isPositive: Number(percentChange) >= 0,
    };
  }, [priceAdjustment, marketingBoost, seasonalityFactor]);

  // Comprehensive Modules Definition (Every major Avanyx feature)
  const modulesList = [
    {
      id: 'dashboard',
      category: 'core',
      name: 'Executive Dashboard',
      badge: 'Live Telemetry',
      description: 'Unified real-time pulse of multi-store revenue, active registers, stock alerts, and margins.',
      icon: LayoutDashboard,
      color: 'text-blue-600 bg-blue-50 border-blue-200/80',
      metric: 'Sub-second updates',
    },
    {
      id: 'pos',
      category: 'core',
      name: 'POS Register',
      badge: 'Ultra-Fast',
      description: 'Lightning-fast touch & barcode checkout, custom modifiers, split tickets, and digital receipts.',
      icon: ShoppingCart,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      metric: '0.4s transaction speed',
    },
    {
      id: 'catalog',
      category: 'core',
      name: 'Products & Catalog',
      badge: 'Multi-Variant',
      description: 'Hierarchical categories, SKU barcodes, matrix attributes, and image gallery management.',
      icon: Tag,
      color: 'text-sky-600 bg-sky-50 border-sky-200/80',
      metric: 'Unlimited SKUs',
    },
    {
      id: 'inventory',
      category: 'core',
      name: 'Inventory & Stock',
      badge: 'Real-Time Sync',
      description: 'Live stock tracking, automatic reorder threshold triggers, batch lots, and branch transfers.',
      icon: Package,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
      metric: 'Zero overselling',
    },
    {
      id: 'ecommerce',
      category: 'growth',
      name: 'Online Storefront',
      badge: 'Omnichannel',
      description: 'Synchronize POS catalog with digital web store. In-store sales update online stock in 300ms.',
      icon: Globe,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200/80',
      metric: '300ms catalog sync',
    },
    {
      id: 'customers',
      category: 'growth',
      name: 'Customers & Loyalty',
      badge: 'Retention',
      description: 'VIP tiers, lifetime spend analysis, digital points wallet, and automated birthday SMS rewards.',
      icon: Users,
      color: 'text-violet-600 bg-violet-50 border-violet-200/80',
      metric: '+38% repeat visits',
    },
    {
      id: 'finance',
      category: 'finance',
      name: 'Expenses & Finance',
      badge: 'Automated P&L',
      description: 'Automated Cost of Goods Sold (COGS), operating expense tracking, and true net margin waterfalls.',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
      metric: 'Real-time margin calc',
    },
    {
      id: 'reports',
      category: 'finance',
      name: 'Reports & Tax VAT',
      badge: 'Audit-Ready',
      description: 'Daily Z-reports, customizable VAT/GST brackets, 0% default rate, and 1-click accounting CSV export.',
      icon: FileText,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      metric: '1-click PDF/CSV export',
    },
    {
      id: 'staff',
      category: 'admin',
      name: 'Staff & Roles',
      badge: 'Security',
      description: 'Granular permissions matrix, 4-digit rapid PIN lock (0.8s switch), and shift cash balancing.',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200/80',
      metric: 'Role-based access',
    },
    {
      id: 'brain',
      category: 'ai',
      name: 'AI Business Brain',
      badge: 'Autonomous AI',
      description: 'Root-cause diagnostic engine answering why sales fluctuated, finding inventory leaks, and fixing margins.',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 border-purple-200/80',
      metric: 'Deep root-cause BI',
    },
    {
      id: 'chats',
      category: 'ai',
      name: 'Ask Avanyx AI Chats',
      badge: 'Natural Language',
      description: 'Ask any question about your store in plain English: "Which supplier gave the best margin last month?"',
      icon: MessageSquareText,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      metric: 'Conversational BI',
    },
    {
      id: 'studio',
      category: 'admin',
      name: 'Studio & Custom Fields',
      badge: 'Zero-Code',
      description: 'Tailor Avanyx to cafes, boutiques, electronics, or pharmacies with custom attributes and tags.',
      icon: Sliders,
      color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200/80',
      metric: 'Custom schemas',
    },
    {
      id: 'payments_ledger',
      category: 'finance',
      name: 'Unified POS Payments & Ledger',
      badge: 'Live Sync',
      description: 'End-to-end payment reconciliations, cash drawers, multi-currency registers, and audit-proof accounting.',
      icon: CreditCard,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      metric: 'Real-time ledger',
    },
    {
      id: 'notifications',
      category: 'core',
      name: 'Smart Notifications',
      badge: 'Real-Time',
      description: 'Instant multi-channel alerts for stock anomalies, refund spikes, daily cash reconciliations, and shifts.',
      icon: BellRing,
      color: 'text-rose-600 bg-rose-50 border-rose-200/80',
      metric: 'Instant triage alerts',
    },
    {
      id: 'settings',
      category: 'admin',
      name: 'Store Settings',
      badge: 'System Control',
      description: 'Receipt printer ESC/POS configuration, multi-currency formatting, tax rules, and branch details.',
      icon: SlidersHorizontal,
      color: 'text-teal-600 bg-teal-50 border-teal-200/80',
      metric: 'Central control',
    },
    {
      id: 'help',
      category: 'core',
      name: 'Help & Shortcuts',
      badge: 'Productivity',
      description: 'Keyboard shortcuts for rush-hour speed, barcode lookup shortcuts, and interactive tutorials.',
      icon: HelpCircle,
      color: 'text-blue-700 bg-blue-50 border-blue-200/80',
      metric: '100% keyboard nav',
    },
    {
      id: 'forecasting',
      category: 'ai',
      name: 'Demand Forecaster',
      badge: 'Predictive ML',
      description: 'Machine learning forecasting models predicting sales 14 days ahead based on weather, trends, and promos.',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
      metric: '94.2% accuracy',
    },
  ];

  // 4 AI Neural Models Architecture
  const aiNeuralModels = [
    {
      id: 'chat',
      name: 'Normal Chat',
      engine: 'Avanyx Neural Flash',
      badge: 'Sub-400ms Streaming',
      role: 'High-Velocity Conversational Assistant',
      description: 'Everyday conversational intelligence optimized for front-of-house staff, fast product queries, split-ticket rules, and customer inquiries with zero lag.',
      latency: '< 380ms',
      throughput: '120 tokens/sec',
      contextWindow: '64k tokens',
      reasoningMode: 'Direct Streaming',
      accuracy: '99.8%',
      costTier: 'Included in All Plans',
      icon: ChatModelLogo,
      themeGradient: 'from-sky-500 to-blue-600',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      activeBorder: 'border-sky-500 ring-2 ring-sky-500/20',
      prompts: [
        {
          q: 'Check SKU barcode and stock level for Oat Flat White.',
          thought: null,
          answer: '**SKU: OAT-FW-01** (Barcode: `890124500981`). Current on-hand stock: **94 units** across Downtown Flagship (Register #01 & #02). Reorder trigger point: 20 units. No vendor backorders pending.',
          actionLabel: 'View Stock Card',
          statTag: 'Instant Lookup',
        },
        {
          q: 'Can customer Sarah Jenkins redeem Gold VIP 15% discount on bakery?',
          thought: null,
          answer: 'Yes. Sarah Jenkins has **480 loyalty points** (Gold VIP tier). Her 15% discount automatically applies to all Bakery & Beverage items at checkout. Net savings: $1.85 on current cart.',
          actionLabel: 'Apply VIP Discount',
          statTag: 'Loyalty Verified',
        },
        {
          q: 'How do I connect an 80mm Epson thermal printer via USB?',
          thought: null,
          answer: 'Plug in the USB cable, ensure the printer is turned ON, and click **Auto-Detect Printer** in Avanyx Settings. Chrome WebUSB will pair directly without installing separate vendor drivers.',
          actionLabel: 'Open Printer Setup',
          statTag: 'Hardware Guide',
        },
      ],
    },
    {
      id: 'flash',
      name: 'Flash Thinking',
      engine: 'Avanyx Flash + Extended Reasoning',
      badge: '1.1s Rapid Diagnostic',
      role: 'Rush-Hour Root-Cause Diagnostic Engine',
      description: 'Rapid analytical reasoning combining live POS telemetry, peak-hour cashier switchovers, and stockout alerts to immediately explain sales shifts.',
      latency: '1.1s',
      throughput: '95 tokens/sec',
      contextWindow: '128k tokens',
      reasoningMode: 'Dynamic Chain-of-Thought (18 nodes)',
      accuracy: '99.9%',
      costTier: '1 Credit / Prompt',
      icon: FlashModelLogo,
      themeGradient: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      prompts: [
        {
          q: 'Why did 3:00 PM - 5:00 PM ticket volume drop 32% despite standard foot traffic?',
          thought: [
            'Correlating POS terminal event logs for Downtown Flagship between 15:00 and 17:00...',
            'Register #02 logged hardware disconnect at 15:12 (loose USB barcode scanner cable)...',
            'Cashier Emma was forced to ring up items manually on single lane...',
            'Average queue transaction latency surged from 38s to 194s per customer...',
            'CFD camera telemetry recorded ~14 customer walkouts due to wait time.'
          ],
          answer: 'The 32% ticket drop was caused by a hardware bottleneck, not declining demand. Register #02 lost scanner connectivity at 15:12, forcing single-lane manual entry. Queue latency jumped to 3m 14s, causing an estimated 14 patrons to walk out (-$168 gross loss).',
          actionLabel: 'Trigger Terminal Failover',
          statTag: 'Diagnostic Proof',
        },
        {
          q: 'Identify which cashier shift had the highest voided items and why.',
          thought: [
            'Analyzing 1,420 transaction events across morning, afternoon, and evening shifts...',
            'Shift #481 (11:00 - 15:00) recorded 12 item voids totaling $74.50...',
            'Cross-checking SKU IDs: 9 of 12 voids were for Almond Croissant...',
            'Finding: Barcode sticker on fresh pastry batch had inverted checksum.'
          ],
          answer: 'Shift #481 had 12 voids ($74.50 total). Root cause: The kitchen printed a batch of Almond Croissant price stickers with a misaligned barcode checksum, leading to double scans at Register #01.',
          actionLabel: 'Reprint Barcode Labels',
          statTag: 'Anomaly Resolved',
        },
      ],
    },
    {
      id: 'omni',
      name: 'Avanyx Nexus',
      engine: 'Avanyx Nexus + Advanced Reasoning',
      badge: '2.4s Strategic Brain',
      role: 'Autonomous Multi-Branch Strategy & Optimization',
      description: "Avanyx Nexus is Avanyx's advanced conversational AI model, designed for fast, intelligent, and natural interactions.",
      latency: '2.4s',
      throughput: '80 tokens/sec',
      contextWindow: '256k tokens',
      reasoningMode: 'Full Multi-Step Chain-of-Thought (48 nodes)',
      accuracy: '99.95%',
      costTier: '3 Credits / Deep Analysis',
      icon: OmniModelLogo,
      themeGradient: 'from-indigo-600 to-violet-700',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeBorder: 'border-indigo-600 ring-2 ring-indigo-600/20',
      prompts: [
        {
          q: 'Recommend optimal stock rebalancing for Matcha Powder & Bakery items across Downtown & Uptown branches.',
          thought: [
            'Analyzing live telemetry: Downtown has 8 Almond Croissants left (sellout predicted in 42 minutes)...',
            'Uptown branch has 42 Almond Croissants on hand with only 6 projected sales by close (surplus waste risk)...',
            'Weather engine predicts +6°C heat surge downtown tomorrow: cold Matcha Latte orders will jump +44%...',
            'Evaluating inter-branch courier transit cost ($8.50) vs margin recovery ($4.25 x 24 units = $102.00)...',
            'Net gain positive: Autonomous transfer manifest generated.'
          ],
          answer: 'Authorize an immediate branch transfer of **24 Almond Croissants** and **15kg Matcha Powder** from Uptown to Downtown before 11:30 AM. Downtown is facing an imminent stockout, while Uptown has a 65% surplus. Protected net gross profit: **+$248.50**.',
          actionLabel: 'Approve Transfer Manifest',
          statTag: 'Macro Optimization',
        },
        {
          q: 'Our supplier announced a 12% price hike on Arabica beans. How should we adjust retail prices?',
          thought: [
            'Simulating price elasticity across 4,800 espresso sales over 90 days...',
            'Flat 12% price bump across all drinks would drop foot traffic volume by -8.4%...',
            'Alternative strategy: Increase Large drinks by +$0.25 (inelastic) while keeping regular coffee at current price ($3.75)...',
            'Add combo bundling with bakery items (+42% gross margin)...',
            'Net store margin is fully preserved with zero customer churn.'
          ],
          answer: 'Do not institute an across-the-board price increase. Keep regular drip coffee unchanged at $3.75 to preserve morning commuter loyalty. Shift the cost burden by raising Large specialty beverages by +$0.30 and introducing a Coffee + Croissant combo at $7.50 (+38% margin).',
          actionLabel: 'Simulate In Forecaster',
          statTag: 'Elasticity Model',
        },
      ],
    },
    {
      id: 'axiom',
      name: 'Financial Agent',
      engine: 'Avanyx Financial Intelligence Engine',
      badge: 'Zero-Hallucination Verified',
      role: 'Audited Ledger & Margin Waterfall BI',
      description: 'Deterministic accounting intelligence with zero hallucination. Audits real-time COGS, merchant card fees, cash drawer over/short variances, and generates audit-ready VAT/GST statements.',
      latency: '1.8s',
      throughput: '85 tokens/sec',
      contextWindow: '128k tokens',
      reasoningMode: 'Zero-Hallucination Audited Ledger Proofs',
      accuracy: '100% Deterministic',
      costTier: '2 Credits / Report',
      icon: AxiomModelLogo,
      themeGradient: 'from-emerald-600 to-teal-700',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-600/20',
      prompts: [
        {
          q: 'Break down gross-to-net margin waterfall for this week including merchant card fees and operating overheads.',
          thought: [
            'Accessing verified store ledger: Gross sales receipts = $14,250.00 across 1,840 transactions...',
            'Calculating direct COGS (ingredients & packaging) = $4,132.50 (29.00%)...',
            'Aggregating merchant payment processing fees (Stripe/Card 2.2% + $0.10/tx) = $342.10 (2.40%)...',
            'Factoring labor wages ($3,200.00) and rent amortization ($1,150.00) = $4,350.00 (30.53%)...',
            'Auditing 14 cashier shift cash reconciliations: cumulative variance = -$4.20...',
            'Net Operating Profit computed: $5,421.20 (38.04% true net margin).'
          ],
          answer: '### Weekly Financial Performance Audit\n- **Gross POS Revenue:** $14,250.00\n- **COGS (Cost of Goods Sold):** -$4,132.50 (29.00%)\n- **Merchant Processing Fees:** -$342.10 (2.40%)\n- **Operating Overheads & Labor:** -$4,350.00 (30.53%)\n- **Cash Drawer Reconcile Variance:** -$4.20 (0.03%)\n- **True Net Operating Profit:** **$5,421.20 (38.04% Net Margin)**',
          actionLabel: 'Export Audit CSV',
          statTag: 'Audited Ledger',
        },
        {
          q: 'Audit shift #482 cash drawer reconciliation for cashier Emma S.',
          thought: [
            'Opening drawer cash float: $200.00...',
            'Cash sales tendered: $642.00 (28 transactions)...',
            'Cash refunds tendered: $0.00. Paid out from drawer: $12.00 (milk emergency purchase receipt #109)...',
            'Expected drawer total: $830.00. Physical cash counted: $830.00...',
            'Discrepancy: $0.00 exact match. Drawer status: 100% Balanced.'
          ],
          answer: 'Shift #482 is **100% Balanced ($0.00 discrepancy)**. Float: $200.00 + Cash In: $642.00 - Petty Cash Receipt #109: $12.00 = Expected $830.00. Verified physical count: $830.00.',
          actionLabel: 'Sign Off Shift',
          statTag: 'Zero Discrepancy',
        },
      ],
    },
  ];

  // Active selected model object
  const activeAiModel = aiNeuralModels.find((m) => m.id === aiActiveModelId) || aiNeuralModels[2];
  const activeAiPrompt = activeAiModel.prompts[aiActivePromptIndex % activeAiModel.prompts.length];

  // Hardware Ecosystem Definition
  const hardwareItems = [
    {
      id: 'printers',
      category: 'printers',
      title: 'ESC/POS Thermal Receipt Printers',
      badge: '80mm & 58mm Standard',
      specs: 'USB • Network Ethernet (TCP/IP) • Bluetooth • WebUSB',
      speed: '260 mm/sec auto-cutter',
      description: 'Ultra-fast direct thermal printing. Prints crisp 203 DPI receipts, high-contrast store logos, itemized tax VAT breakdowns, and dynamic QR codes for digital receipts and tip portals.',
      compatibility: 'Epson TM-T88 / TM-T20, Star Micronics TSP143, Munbyn, Bixolon, Rongta, Xprinter, Sunmi',
      icon: Printer,
      color: 'from-blue-600 to-indigo-600',
      tag: 'Zero-Driver WebUSB',
      features: ['Auto guillotine paper cut', 'Direct Ethernet IP printing', 'Custom logo bitmap injection', 'Buzzer kitchen chime alert'],
    },
    {
      id: 'scanners',
      category: 'scanners',
      title: 'Omnidirectional 1D & 2D Barcode Scanners',
      badge: 'Sub-50ms Decode',
      specs: 'USB HID • Wireless Bluetooth 5.2 • 2.4GHz Dongle',
      speed: 'Hands-free presentation scan',
      description: 'Instant optical recognition for printed labels, shrink-wrapped barcodes, and smartphone mobile loyalty QR codes. Sub-50ms decoding with zero input delay.',
      compatibility: 'Honeywell Genesis, Zebra DS2208 / DS9308, Datalogic Gryphon, Inateck, Eyoyo',
      icon: Scan,
      color: 'from-indigo-600 to-purple-600',
      tag: 'Plug & Play HID',
      features: ['1D: UPC, EAN, Code 128', '2D: QR Code, DataMatrix', 'Auto-sensing sleep/wake', 'Damaged label reconstruction'],
    },
    {
      id: 'drawers',
      category: 'drawers',
      title: 'Heavy-Duty Electronic Cash Drawers',
      badge: '24V RJ11 / RJ12 Solenoid',
      specs: '5 Bill / 8 Coin Till • Steel Ball Bearings • Dual Key Lock',
      speed: '<80ms kickout trigger',
      description: 'Printer-driven automatic solenoid drawer kick. Built-in microswitch sensor alerts management if a drawer is left ajar or opened without an authorized sales transaction.',
      compatibility: 'APG Vasario, MMF POS, Star Micronics CD3, Avanyx, Standard RJ11 24V Drawers',
      icon: KeyRound,
      color: 'from-amber-600 to-orange-600',
      tag: 'Microswitch Sensor',
      features: ['Printer-driven 24V pulse', 'Removable bill & coin trays', 'Under-counter mount ready', 'Drawer-open audit telemetry'],
    },
    {
      id: 'cfd',
      category: 'cfd',
      title: 'Customer-Facing Displays (CFD)',
      badge: 'Dual-Monitor & Tablet Mirror',
      specs: 'HDMI • USB-C DisplayPort • WiFi Tablet Sync',
      speed: 'Zero-latency live mirroring',
      description: 'Delight customers with full transparency. Shows running subtotal, item photos, modifier notes, tipping options, and on-screen QR code for instant mobile checkout.',
      compatibility: 'Any secondary monitor, iPad, Android tablet, Sunmi dual-screen terminal',
      icon: Eye,
      color: 'from-emerald-600 to-teal-600',
      tag: 'Dynamic QR Tipping',
      features: ['Real-time cart sync', 'Promotional slideshow banner', 'Digital signature capture', 'Instant tip prompt screens'],
    },
    {
      id: 'mobile',
      category: 'mobile',
      title: 'Handheld Smart mPOS Terminals',
      badge: 'Android & iOS mPOS',
      specs: 'Built-in 58mm Printer • NFC Contactless • 4G LTE',
      speed: 'Tableside & Line Buster',
      description: 'Arm your staff with mobile checkout power. Ring up customers in line during morning rushes, take food orders tableside, and perform stock audits straight from the floor.',
      compatibility: 'Sunmi V2 Pro / T2, PAX A920, Clover Flex, iPad Pro, Android 11+ Handhelds',
      icon: Smartphone,
      color: 'from-fuchsia-600 to-pink-600',
      tag: 'Patio & Line Buster',
      features: ['All-in-one printer + scanner', 'Contactless NFC & Apple Pay', 'All-day battery endurance', 'Live branch inventory lookup'],
    },
    {
      id: 'offline',
      category: 'offline',
      title: 'Zero-Downtime Offline-First Engine',
      badge: '100% Uptime Guarantee',
      specs: 'Local IndexedDB Journal • Background Sync Queue',
      speed: '0ms network interruption delay',
      description: 'Never lose a dollar during WiFi drops. Avanyx continues scanning barcodes, adding modifiers, printing physical receipts, and kicking cash drawers offline with zero interruption.',
      compatibility: 'Native Progressive Web App (PWA) engine supported across Windows, Mac, iPad, and Android',
      icon: ShieldCheck,
      color: 'from-cyan-600 to-blue-700',
      tag: 'Zero Transaction Loss',
      features: ['Encrypted local journal', 'Automatic cloud reconciliation', 'Zero duplicate transaction guard', 'Multi-terminal local conflict resolution'],
    },
  ];

  const filteredHardware = hardwareActiveTab === 'all'
    ? hardwareItems
    : hardwareItems.filter((h) => h.category === hardwareActiveTab);

  const filteredModules = moduleCategory === 'all'
    ? modulesList
    : modulesList.filter((m) => m.category === moduleCategory);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 antialiased overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. PREMIUM GLASS NAVBAR */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs shadow-slate-200/40'
            : 'bg-white/95 backdrop-blur-md border-b border-slate-200/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Avanyx
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-slate-600">
            <a href="#pos" className="hover:text-indigo-600 transition">POS Register</a>
            <a href="#hardware" className="hover:text-indigo-600 transition">Hardware</a>
            <a href="#ai-models" className="hover:text-indigo-600 transition">AI Brain</a>
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenAuth('demo')}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current opacity-70" />
              <span>Watch Demo</span>
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-1 text-sm font-medium text-slate-700">
              <a href="#pos" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">POS Register</a>
              <a href="#hardware" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Hardware &amp; ESC/POS</a>
              <a href="#ai-models" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">AI Business Brain</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Features Suite</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-100">Pricing Plans</a>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth('demo'); }}
                className="w-full py-2.5 px-4 text-center rounded-xl bg-slate-100 font-medium text-slate-800 hover:bg-slate-200 cursor-pointer"
              >
                Watch Demo
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth('signup'); }}
                className="w-full py-2.5 px-4 text-center rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO — EXTREMELY GRAPHICAL 3D DASHBOARD ENVIRONMENT */}
      {/* ========================================================================= */}
      <section id="hero" className="relative pt-12 pb-24 sm:pt-20 sm:pb-32 overflow-hidden bg-white border-b border-slate-200/80">
        {/* Subtle geometric dot grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        {/* Ambient Top Glow Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/30 via-blue-200/20 to-purple-200/20 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-semibold text-slate-700 mb-6 shadow-2xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-900 font-bold">Avanyx</span>
            <span className="text-slate-400">•</span>
            <span>Autonomous POS &amp; Business Intelligence</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.1]">
            Run Your Business.<br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
              Let Avanyx Think.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            An intelligent business platform combining POS, inventory, analytics, AI Business Brain and more — all in one beautiful, easy-to-use system.
          </p>

          {/* Primary Call-to-Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-200/60 flex items-center justify-center gap-2 transition cursor-pointer group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onOpenAuth('demo')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Offline-first resilience</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instant cloud synchronization</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SOC-2 certified security</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3D INTERACTIVE FLOATING DASHBOARD ENVIRONMENT */}
          {/* ========================================================================= */}
          <div
            className="mt-14 sm:mt-18 relative max-w-6xl mx-auto perspective-[1400px]"
            onMouseMove={handleHeroMouseMove}
            onMouseEnter={() => setIsHoveredHero(true)}
            onMouseLeave={handleHeroMouseLeave}
          >
            {/* Ambient Multi-Layer Depth Shadows */}
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/10 via-blue-500/15 to-purple-500/10 rounded-3xl blur-2xl pointer-events-none" />

            {/* Main 3D Canvas Card with Smooth Tilt */}
            <div
              ref={heroCardRef}
              style={{
                transform: isHoveredHero
                  ? `perspective(1400px) rotateX(${-mousePos.y * 6}deg) rotateY(${mousePos.x * 6}deg) scale3d(1.01, 1.01, 1.01)`
                  : 'perspective(1400px) rotateX(2deg) rotateY(0deg)',
                transformStyle: 'preserve-3d',
                transition: isHoveredHero ? 'transform 0.1s ease-out' : 'transform 0.8s ease-in-out',
              }}
              className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12),0_10px_30px_-5px_rgba(79,70,229,0.08)] overflow-visible text-left transition-shadow"
            >
              {/* Window macOS Bar */}
              <div className="h-12 bg-slate-50/90 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-semibold text-slate-500 hidden sm:inline-block">
                    Avanyx Operating System • Flagship Edition
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AI Core Active
                  </span>
                  <span className="text-slate-400 hidden md:inline">Sync Latency: 12ms</span>
                </div>
              </div>

              {/* Dashboard Content Interior */}
              <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] space-y-6 rounded-b-2xl sm:rounded-b-3xl">
                {/* 4 Top KPI Cards with depth */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Gross Sales (Today)</span>
                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">+14.2%</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">$24,850.40</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span>184 transactions • Avg $135.05</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Net Operating Margin</span>
                      <span className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">73.8%</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">$18,340.10</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-indigo-500" />
                      <span>COGS: $6,510.30</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Active Customers</span>
                      <span className="text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">91% VIP</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">1,420</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span>38 new profiles this week</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Stock Health</span>
                      <span className="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Optimal</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">98.4%</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Package className="w-3 h-3 text-amber-500" />
                      <span>2 items pending reorder</span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Revenue Area Chart + Realtime Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Revenue Curve Chart */}
                  <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">7-Day Sales Velocity & Peak Traffic</h3>
                        <p className="text-xs text-slate-500">Hourly volume indexed against seasonal averages</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">Weekly</span>
                        <span className="text-xs px-2.5 py-1 rounded-md text-slate-500 hover:bg-slate-50">Monthly</span>
                      </div>
                    </div>

                    {/* SVG Realistic Area Chart */}
                    <div className="h-48 w-full relative">
                      <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="heroRevenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal grid lines */}
                        <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Shaded Area */}
                        <path
                          d="M 0 140 Q 70 120, 120 70 T 250 55 T 380 40 T 500 20 L 500 160 L 0 160 Z"
                          fill="url(#heroRevenueGrad)"
                        />

                        {/* Smooth Line */}
                        <path
                          d="M 0 140 Q 70 120, 120 70 T 250 55 T 380 40 T 500 20"
                          fill="none"
                          stroke="#4F46E5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Interactive Data Points */}
                        <circle cx="120" cy="70" r="4" fill="#4F46E5" className="cursor-pointer hover:r-6 transition-all" />
                        <circle cx="250" cy="55" r="4" fill="#4F46E5" className="cursor-pointer hover:r-6 transition-all" />
                        <circle cx="380" cy="40" r="4" fill="#4F46E5" className="cursor-pointer hover:r-6 transition-all" />
                        <circle cx="500" cy="20" r="5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
                      </svg>

                      {/* X-Axis labels */}
                      <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1 font-medium">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun (Peak $24.8k)</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Autonomous Advisory Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100/90 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">AI Brain Live Insight</h4>
                          <span className="text-[10px] text-indigo-600 font-medium">Generated 4 minutes ago</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/90 border border-indigo-100 text-xs text-slate-700 leading-relaxed space-y-2">
                        <p className="font-semibold text-slate-900">
                          Demand surge detected for <span className="text-indigo-600">Cold Brew Nitro</span>.
                        </p>
                        <p className="text-slate-600">
                          Current velocity is 3.4x higher than standard Wednesday. Stock will deplete by 4:15 PM unless replenishment is triggered.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-indigo-100/80 flex items-center justify-between">
                      <button
                        onClick={onLaunchPos}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Automate Reorder (48 units)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FLOATING 3D ACCENT PANELS (AT Z-DEPTHS) */}
              {/* Floating Top Right Chip */}
              <div
                style={{
                  transform: 'translateZ(60px)',
                }}
                className="hidden lg:flex items-center gap-3 absolute -top-5 -right-5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-xl"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Register Reconciled</div>
                  <div className="text-[10px] text-slate-400">Shift #482 • $0 Discrepancy</div>
                </div>
              </div>

              {/* Floating Bottom Left Chip */}
              <div
                style={{
                  transform: 'translateZ(70px)',
                }}
                className="hidden lg:flex items-center gap-3 absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-100 shadow-xl"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">14-Day Demand Forecast</div>
                  <div className="text-[10px] text-indigo-600 font-semibold">94.2% Confidence Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VISUAL PRODUCT ECOSYSTEM — CONNECTED 3D ARCHITECTURE */}
      {/* ========================================================================= */}
      <section id="ecosystem" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-3 shadow-2xs">
              <Network className="w-3.5 h-3.5" />
              <span>Unified Product Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              One Synchronized Platform. Zero Disconnected Tools.
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Every customer visit, product barcode scan, inventory movement, and online order feeds directly into Avanyx's central intelligence core.
            </p>
          </div>

          {/* Connected Interactive Architecture Map */}
          <div className="relative max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-lg overflow-hidden text-left">
            {/* Background connection grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

            {/* Central Master Hub */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300/50 mb-3">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">AVENYX AUTONOMOUS CORE</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Real-time event broker coordinating transactions, inventory, customers, and AI diagnostics
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Telemetry Active: 12ms Cloud Latency
                </span>
              </div>
            </div>

            {/* Operational Nodes Grid */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
              {[
                { title: 'POS Register', icon: ShoppingCart, tag: '0.4s Checkout', color: 'text-blue-600 bg-blue-50' },
                { title: 'Inventory', icon: Package, tag: 'Stock Telemetry', color: 'text-indigo-600 bg-indigo-50' },
                { title: 'Online Store', icon: Globe, tag: '300ms Parity', color: 'text-sky-600 bg-sky-50' },
                { title: 'Customers', icon: Users, tag: 'VIP Retention', color: 'text-violet-600 bg-violet-50' },
                { title: 'Finance P&L', icon: DollarSign, tag: 'Net Margin', color: 'text-emerald-600 bg-emerald-50' },
                { title: 'Analytics', icon: BarChart3, tag: 'Velocity Curves', color: 'text-amber-600 bg-amber-50' },
              ].map((node, i) => {
                const IconComp = node.icon;
                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:border-indigo-300 hover:shadow-md transition text-center flex flex-col items-center justify-between group cursor-default"
                  >
                    <div className={`w-10 h-10 rounded-xl ${node.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">{node.title}</div>
                    <span className="text-[10px] text-slate-400 font-medium mt-1">{node.tag}</span>
                  </div>
                );
              })}
            </div>

            {/* Radiating AI Business Brain Layer */}
            <div className="relative z-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-blue-50/50 p-5 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-950">AI Business Brain & Predictive Forecaster</h4>
                  <p className="text-xs text-purple-700/80">Transforms transactional telemetry into automated purchasing, margin protection, and root-cause diagnostics.</p>
                </div>
              </div>
              <button
                onClick={() => onOpenAuth()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs cursor-pointer transition flex items-center gap-1"
              >
                <span>Experience Co-Pilot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURES — 18 HIGHLY GRAPHICAL MODULES */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-3 shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
              <span>Complete Operating Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything Your Business Needs
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Each module is built native into the same unified core. No third-party connectors, no sync lags, and zero duplicate data entry.
            </p>

            {/* Category Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { label: 'All 18 Modules', val: 'all' },
                { label: 'Core Operations', val: 'core' },
                { label: 'Autonomous AI', val: 'ai' },
                { label: 'Growth & Loyalty', val: 'growth' },
                { label: 'Finance & Tax', val: 'finance' },
                { label: 'Administration', val: 'admin' },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setModuleCategory(tab.val as any)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    moduleCategory === tab.val
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 18-Module Graphical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModules.map((mod) => {
              const IconComp = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between text-left relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${mod.color} group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {mod.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {mod.name}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 font-mono text-[11px]">{mod.metric}</span>
                    <button
                      onClick={() => onOpenAuth()}
                      className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. POS — 3D PRODUCT SHOWCASE */}
      {/* ========================================================================= */}
      <section id="pos" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-5 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-blue-700 mb-4 shadow-2xs">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Lightning Point-of-Sale</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Sell Faster.<br />Serve Better.
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Engineered for rush hours. Ring up items, scan barcodes, modify orders, apply discounts, and tender payments in under 400 milliseconds.
              </p>

              <div className="mt-6 space-y-3.5">
                {[
                  { title: 'Offline-First Resilience', desc: 'Keep taking orders during WiFi drops. Transactions sync seamlessly the moment connectivity restores.' },
                  { title: 'Multi-Tender Payments', desc: 'Accept credit card, contactless NFC, Apple Pay, cash exact, or split checks across patrons.' },
                  { title: 'Item Modifiers & Custom Notes', desc: 'Easily select milk alternatives, roasting origins, size variations, or kitchen instructions.' },
                  { title: 'Dynamic Camera & USB Scanning', desc: 'Scan items with device camera, Bluetooth ring scanners, or standard USB barcode readers.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => onOpenAuth()}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Live Register Demo</span>
                </button>
              </div>
            </div>

            {/* Right Realistic 3D-Perspective POS Mockup */}
            <div className="lg:col-span-7">
              <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-left">
                {/* Hardware Telemetry Live Status Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 mb-3 rounded-xl bg-slate-900 text-white text-[11px] font-mono">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ESC/POS 80mm: Online
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Scan className="w-3.5 h-3.5" />
                      1D/2D HID: Ready
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <KeyRound className="w-3.5 h-3.5" />
                      Drawer: RJ11 24V
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPosReceiptModalOpen(true)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-[10px] cursor-pointer flex items-center gap-1 transition"
                    >
                      <Receipt className="w-3 h-3" />
                      Test 80mm Print
                    </button>
                    <button
                      onClick={triggerDrawerKick}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-sans font-semibold text-[10px] cursor-pointer flex items-center gap-1 transition border border-slate-700"
                    >
                      <Zap className="w-3 h-3" />
                      Kick Drawer
                    </button>
                  </div>
                </div>

                {/* Animated Drawer Solenoid Alert Banner */}
                {posDrawerAlert && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600 animate-bounce" />
                      <span>⚡ 24V Solenoid Trigger Sent via ESC/POS Printer • Cash Drawer Popped Open!</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-700">Latency: 12ms</span>
                  </div>
                )}

                {/* Simulated Register Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      VP
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Register #01 • Cashier: Emma S.</div>
                      <div className="text-[10px] text-slate-500">Downtown Central Flagship (Shift #482)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Online Mode (0ms delay)
                    </span>
                  </div>
                </div>

                {/* Register Screen Split */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Left: Product Catalog Grid */}
                  <div className="sm:col-span-7 space-y-3">
                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                      {['All', 'Espresso', 'Bakery', 'Matcha', 'Retail'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPosActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition ${
                            posActiveCategory === cat
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Product Tiles */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { name: 'Oat Flat White', price: 4.80, stock: '94 in stock', cat: 'Espresso', color: 'bg-amber-100 text-amber-800', note: 'Oat Milk' },
                        { name: 'Matcha Latte', price: 5.50, stock: '42 in stock', cat: 'Matcha', color: 'bg-emerald-100 text-emerald-800', note: 'Sweetened' },
                        { name: 'Almond Croissant', price: 4.25, stock: '8 left', cat: 'Bakery', color: 'bg-orange-100 text-orange-800', note: 'Warmed' },
                        { name: 'Iced Americano', price: 3.75, stock: '120 in stock', cat: 'Espresso', color: 'bg-blue-100 text-blue-800', note: 'Less Ice' },
                        { name: 'Artisan Sourdough', price: 7.50, stock: '14 in stock', cat: 'Bakery', color: 'bg-amber-100 text-amber-800', note: 'Sliced' },
                        { name: 'Ceramic Tumbler', price: 24.00, stock: '22 in stock', cat: 'Retail', color: 'bg-purple-100 text-purple-800', note: 'Gift Box' },
                      ].map((item, i) => (
                        <div
                          key={i}
                          onClick={() => addPosItem(item.name, item.price, item.note)}
                          className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-indigo-400 hover:bg-white hover:shadow-xs transition cursor-pointer flex flex-col justify-between text-left group"
                        >
                          <div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.color}`}>
                              {item.cat}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 mt-1.5">{item.name}</h5>
                            <span className="text-[10px] text-slate-400">{item.stock}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600">${item.price.toFixed(2)}</span>
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition">
                              +
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Cart & Tender Payment Panel */}
                  <div className="sm:col-span-5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      {/* Customer Attach */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-semibold text-slate-900">Sarah Jenkins</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Gold VIP
                        </span>
                      </div>

                      {/* Cart Items list */}
                      <div className="space-y-2 text-xs max-h-40 overflow-y-auto pr-1">
                        {posCart.length === 0 ? (
                          <div className="py-8 text-center text-slate-400">
                            Cart is empty. Click items on the left to add.
                          </div>
                        ) : (
                          posCart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100">
                              <div>
                                <div className="font-semibold text-slate-800">{item.qty}x {item.name}</div>
                                <div className="text-[10px] text-slate-400">{item.notes}</div>
                              </div>
                              <div className="font-bold text-slate-900">${(item.price * item.qty).toFixed(2)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Cart Totals & Checkout Actions */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Subtotal</span>
                        <span>${posSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Tax VAT (0.0% Default)</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                        <span>Total Due</span>
                        <span className="text-indigo-600">${posSubtotal.toFixed(2)}</span>
                      </div>

                      {/* Payment Tenders */}
                      <div className="grid grid-cols-2 gap-1.5 pt-2">
                        <button
                          onClick={onLaunchPos}
                          className="py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Card / NFC</span>
                        </button>
                        <button
                          onClick={onLaunchPos}
                          className="py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Cash Exact</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <button
                          onClick={() => setPosReceiptModalOpen(true)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          <Printer className="w-3 h-3" /> Preview 80mm Receipt
                        </button>
                        {posCart.length > 0 && (
                          <button
                            onClick={clearPosCart}
                            className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            Clear Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ESC/POS Thermal 80mm Receipt Simulator Modal */}
        {posReceiptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-sm bg-[#FFFDF9] rounded-2xl shadow-2xl border border-amber-200/60 p-6 text-slate-800 font-mono text-xs overflow-hidden">
              {/* Close Button */}
              <button
                onClick={() => setPosReceiptModalOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Receipt Visual Top Perforation */}
              <div className="border-b-2 border-dashed border-slate-300 pb-3 text-center space-y-1">
                <div className="font-bold text-base tracking-widest text-slate-900">AVENYX FLAGSHIP</div>
                <div className="text-[10px] text-slate-500">742 EVERGREEN TERRACE • DOWNTOWN</div>
                <div className="text-[10px] text-slate-500">TEL: +1 (555) 019-2834 • TAX ID: #884-912</div>
                <div className="text-[10px] text-emerald-700 font-semibold pt-1">ESC/POS 80mm THERMAL DIRECT • 203 DPI</div>
              </div>

              {/* Ticket Details */}
              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5 text-slate-600">
                <div className="flex justify-between">
                  <span>TRANS: #482-9014</span>
                  <span>REG: #01 (Emma S.)</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE: 2026-09-20 14:28</span>
                  <span>MODE: IN-STORE</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800 pt-0.5">
                  <span>CUSTOMER: SARAH JENKINS</span>
                  <span className="text-amber-700">GOLD VIP (15% OFF)</span>
                </div>
              </div>

              {/* Itemized Lines */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                {posCart.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{item.qty}x {item.name}</span>
                      <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 italic pl-2">
                      <span>{item.notes}</span>
                      <span>@ ${item.price.toFixed(2)}/ea</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Calculation */}
              <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>SUBTOTAL</span>
                  <span>${posSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TAX VAT (0.0% DEFAULT)</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1">
                  <span>TOTAL DUE</span>
                  <span className="text-indigo-700">${posSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700 font-semibold pt-1">
                  <span>PAID VIA VISA NFC (**** 4891)</span>
                  <span>${posSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>AUTH CODE: 981244</span>
                  <span>CHANGE: $0.00</span>
                </div>
              </div>

              {/* Barcode & Footer */}
              <div className="pt-3 text-center space-y-2">
                <div className="font-mono text-center tracking-[0.25em] text-[11px] text-slate-500">
                  *482901489012*
                </div>
                {/* Simulated Barcode Stripes */}
                <div className="h-9 bg-[repeating-linear-gradient(90deg,#0f172a_0px,#0f172a_2px,transparent_2px,transparent_4px,#0f172a_4px,#0f172a_7px,transparent_7px,transparent_9px,#0f172a_9px,#0f172a_10px)] w-48 mx-auto rounded-xs opacity-80" />
                <div className="text-[10px] text-slate-500 font-sans font-semibold">
                  THANK YOU FOR YOUR BUSINESS!
                </div>
                <div className="text-[9px] text-slate-400">
                  Powered by Avanyx • Zero-Downtime POS
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => setPosReceiptModalOpen(false)}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold text-xs cursor-pointer transition shadow-xs"
                  >
                    Close Receipt Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* ENTERPRISE POS HARDWARE & PERIPHERALS ARCHITECTURE */}
      {/* ========================================================================= */}
      <section id="hardware" className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-blue-700 mb-3 shadow-2xs">
              <Printer className="w-3.5 h-3.5" />
              <span>Countertop Hardware &amp; Peripherals</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Enterprise POS Hardware Architecture
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Zero driver bloat. Plug in standard ESC/POS thermal printers, laser barcode scanners, electronic cash drawers, and dual-screen displays. Communicates via WebUSB, Ethernet LAN, and Bluetooth LE.
            </p>

            {/* Hardware Category Filter Tabs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'all', label: 'All Peripherals (6)' },
                { id: 'printers', label: 'Thermal Printers (80/58mm)' },
                { id: 'scanners', label: 'Barcode Scanners' },
                { id: 'drawers', label: 'Cash Drawers (24V)' },
                { id: 'cfd', label: 'Dual Displays (CFD)' },
                { id: 'mobile', label: 'Mobile mPOS' },
                { id: 'offline', label: 'Offline Resilience' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHardwareActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    hardwareActiveTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hardware Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHardware.map((hw) => {
              const IconComp = hw.icon;
              return (
                <div
                  key={hw.id}
                  className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:border-indigo-300 hover:bg-white hover:shadow-xl transition-all flex flex-col justify-between text-left group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${hw.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {hw.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                      {hw.tag}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {hw.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {hw.description}
                    </p>

                    {/* Features List */}
                    <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-2">
                      {hw.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Interface:</span>
                      <span className="font-mono text-slate-600">{hw.specs}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Latency:</span>
                      <span className="font-mono text-emerald-600 font-semibold">{hw.speed}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 pt-1">
                      <span className="font-semibold text-slate-500">Verified: </span>
                      {hw.compatibility}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hardware Connection Protocol Visualizer */}
          <div className="mt-12 p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl text-left">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-1 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Direct Peripheral Bus Active
                </div>
                <h4 className="text-lg font-bold text-white">
                  Universal Plug-and-Play Hardware Architecture
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Avanyx bypasses proprietary hardware lock-in. Use existing receipt printers and barcode guns from Square, Clover, Shopify, or generic POS vendors with zero hardware replacements needed.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="font-bold text-sky-400">WebUSB</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Zero driver install</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="font-bold text-emerald-400">TCP/IP LAN</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Network printer sync</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="font-bold text-amber-400">Bluetooth LE</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Mobile ring scanners</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="font-bold text-purple-400">IndexedDB</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">100% Offline store</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. INVENTORY — GRAPHICAL STOCK TELEMETRY */}
      {/* ========================================================================= */}
      <section id="inventory" className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-700 mb-3 shadow-2xs">
              <Package className="w-3.5 h-3.5" />
              <span>Real-Time Inventory Control</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Know Your Stock Before It Becomes a Problem.
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Synchronized tracking across physical counters, backroom warehouses, and digital storefronts with automated reorder triggers and weighted cost tracking.
            </p>
          </div>

          {/* Graphical Inventory Showcase Panel */}
          <div className="bg-[#FAFAFA] rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg p-5 sm:p-8 text-left">
            {/* Top Inventory Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 mb-6 border-b border-slate-200">
              <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Tracked SKUs</span>
                <div className="text-xl font-bold text-slate-900 mt-1">1,428</div>
                <span className="text-[11px] text-emerald-600 font-medium">+12 added this month</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Total Inventory Value</span>
                <div className="text-xl font-bold text-slate-900 mt-1">$84,210.00</div>
                <span className="text-[11px] text-slate-400">At weighted unit cost</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Low Stock Triggers</span>
                <div className="text-xl font-bold text-rose-600 mt-1">3 Items</div>
                <span className="text-[11px] text-rose-500 font-medium">Auto-reorder ready</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Inventory Turnover</span>
                <div className="text-xl font-bold text-indigo-600 mt-1">4.6x / yr</div>
                <span className="text-[11px] text-emerald-600 font-medium">Top 10% benchmark</span>
              </div>
            </div>

            {/* Realistic Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="pb-3 px-2">SKU / Item</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2">Stock Level</th>
                    <th className="pb-3 px-2">Unit Cost</th>
                    <th className="pb-3 px-2">Retail</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {[
                    { sku: 'BEV-001', name: 'Ethiopian Single Origin (1kg)', cat: 'Coffee Beans', current: 48, max: 60, cost: '$14.00', retail: '$28.00', status: 'In Stock', statusColor: 'bg-emerald-100 text-emerald-800' },
                    { sku: 'BAK-042', name: 'Artisan Almond Croissant', cat: 'Bakery', current: 6, max: 50, cost: '$1.80', retail: '$4.25', status: 'Low Stock', statusColor: 'bg-rose-100 text-rose-800' },
                    { sku: 'BEV-019', name: 'Oat Milk Barista Edition (1L)', cat: 'Dairy Alt', current: 114, max: 150, cost: '$2.10', retail: '$4.50', status: 'In Stock', statusColor: 'bg-emerald-100 text-emerald-800' },
                    { sku: 'MER-108', name: 'Matte Black Travel Mug 16oz', cat: 'Merchandise', current: 18, max: 40, cost: '$11.50', retail: '$26.00', status: 'Healthy', statusColor: 'bg-blue-100 text-blue-800' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-slate-900">{row.name}</div>
                        <span className="text-[11px] text-slate-400 font-mono">{row.sku}</span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-600">{row.cat}</td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.current < 10 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(row.current / row.max) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs text-slate-900">{row.current}</span>
                          <span className="text-[11px] text-slate-400">/{row.max}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-slate-600">{row.cost}</td>
                      <td className="py-3.5 px-2 font-bold text-slate-900">{row.retail}</td>
                      <td className="py-3.5 px-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={onLaunchPos}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200/60 transition cursor-pointer"
                        >
                          Transfer / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ANALYTICS — REAL DATA VISUALIZATION */}
      {/* ========================================================================= */}
      <section id="analytics" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Visual Analytics Dashboard */}
            <div className="lg:col-span-7">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lg text-left space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Weekly Channel & Tenders Attribution</h4>
                    <span className="text-xs text-slate-500">Real-time revenue settlement</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-semibold text-slate-700">
                    Oct 8 - Oct 15
                  </span>
                </div>

                {/* Visual Channel Progress Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">Physical Counter Registers</span>
                      <span className="text-slate-900 font-bold">$16,840 (68%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">Online Storefront & Pickup</span>
                      <span className="text-slate-900 font-bold">$5,620 (23%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '23%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">Delivery & App Integrations</span>
                      <span className="text-slate-900 font-bold">$2,390 (9%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '9%' }} />
                    </div>
                  </div>
                </div>

                {/* Top Selling Items Table */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Top Velocity Items</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-xs text-slate-500 block">Nitro Cold Brew</span>
                      <span className="text-base font-bold text-indigo-600 mt-1 block">412 Units</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">+22% vs lw</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-xs text-slate-500 block">Avocado Tartine</span>
                      <span className="text-base font-bold text-indigo-600 mt-1 block">284 Units</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">+14% vs lw</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-xs text-slate-500 block">Matcha Latte</span>
                      <span className="text-base font-bold text-indigo-600 mt-1 block">198 Units</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">+8% vs lw</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Narrative */}
            <div className="lg:col-span-5 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200/60 text-xs font-semibold text-violet-700 mb-4 shadow-2xs">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Executive Telemetry</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Turn Business Data<br />Into Decisions.
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Stop guessing which days generate true profit and which hours drain labor. Avanyx continuously evaluates your ticket sizes, customer repeat cadence, and margin efficiency.
              </p>

              <div className="mt-6 space-y-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <Activity className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Hourly Sales Velocity</h4>
                    <p className="text-xs text-slate-500">Pinpoint peak lunch and rush hours to optimize staff scheduling and prep.</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">True Net Margin Tracking</h4>
                    <p className="text-xs text-slate-500">Every product displays gross price, component costs, and net margin in real time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8A. AVENYX AI NEURAL ENGINES MATRIX (4 MODELS) */}
      {/* ========================================================================= */}
      <section id="ai-models" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Multi-Model Neural Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              4 Specialized AI Engines.<br />
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                One Unified Business Intelligence.
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Why settle for a generic chatbot? Avanyx runs 4 purpose-built neural architectures tuned specifically for retail, hospitality, and fast-paced commerce.
            </p>
          </div>

          {/* 4 Models Selector Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {aiNeuralModels.map((model) => {
              const IconLogo = model.icon;
              const isSelected = aiActiveModelId === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    setAiActiveModelId(model.id as any);
                    setAiActivePromptIndex(0);
                  }}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 text-left border ${
                    isSelected
                      ? `bg-white ${model.activeBorder} shadow-lg scale-[1.02]`
                      : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <IconLogo size={22} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${model.badgeColor}`}>
                      {model.latency}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{model.name}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />}
                  </h3>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">{model.engine}</div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{model.contextWindow}</span>
                    <span className="text-indigo-600 font-semibold">{model.reasoningMode.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Model Live Interactive Sandbox Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden text-left">
            {/* Model Terminal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {React.createElement(activeAiModel.icon, { size: 20 })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeAiModel.name} Engine</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${activeAiModel.badgeColor}`}>
                      {activeAiModel.engine}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {activeAiModel.role} • Mode: {activeAiModel.reasoningMode}
                  </div>
                </div>
              </div>

              {/* Live Technical Benchmark Strip */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] text-slate-400">Response Latency</div>
                  <div className="text-emerald-400 font-bold">{activeAiModel.latency}</div>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-[10px] text-slate-400">Throughput</div>
                  <div className="text-sky-400 font-bold">{activeAiModel.throughput}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Accuracy & Verification</div>
                  <div className="text-purple-400 font-bold">{activeAiModel.accuracy}</div>
                </div>
              </div>
            </div>

            {/* Sandbox Body */}
            <div className="p-6 sm:p-8 space-y-6 bg-slate-50/40">
              {/* Sample Question Selector Tabs */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Select Real-World Business Scenario:</span>
                  <span className="text-indigo-600 font-normal lowercase">click to test scenario</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeAiModel.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiActivePromptIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                        aiActivePromptIndex % activeAiModel.prompts.length === idx
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className="line-clamp-1">{p.q}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Prompt Box */}
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 mt-0.5">
                  You
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-sm text-slate-800 font-medium leading-relaxed">
                  {activeAiPrompt.q}
                </div>
              </div>

              {/* Reasoning Chain-of-Thought (when available) */}
              {activeAiPrompt.thought && activeAiPrompt.thought.length > 0 && (
                <div className="max-w-3xl ml-auto">
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>Extended Reasoning Trace ({activeAiModel.engine})</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-200/70 text-amber-800 rounded">
                          {activeAiPrompt.thought.length} steps
                        </span>
                      </div>
                      <button
                        onClick={() => setAiReasoningExpanded(!aiReasoningExpanded)}
                        className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline cursor-pointer"
                      >
                        {aiReasoningExpanded ? 'Collapse Trace' : 'View Trace'}
                      </button>
                    </div>

                    {aiReasoningExpanded && (
                      <div className="pt-2 border-t border-amber-200/60 space-y-1.5 text-xs text-amber-950 font-mono">
                        {activeAiPrompt.thought.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold shrink-0">{sIdx + 1}.</span>
                            <span className="leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Model Response Box */}
              <div className="flex items-start gap-3.5 max-w-3xl ml-auto">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
                  {React.createElement(activeAiModel.icon, { size: 18 })}
                </div>
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-md text-sm text-slate-800 space-y-4 w-full">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{activeAiModel.name} Output</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {activeAiPrompt.statTag}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Verified in {activeAiModel.latency}</span>
                  </div>

                  {/* Render Response */}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                    {activeAiPrompt.answer}
                  </div>

                  {/* 1-Click Action Recommendation */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Actionable POS Integration ready</span>
                    </div>
                    <button
                      onClick={onLaunchPos}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs transition flex items-center gap-1.5"
                    >
                      <span>{activeAiPrompt.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8B. AI BUSINESS BRAIN — HERO FEATURE */}
      {/* ========================================================================= */}
      <section id="ai-brain" className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-700 mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnostic Business Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Your AI Business Brain
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Unlike generic chatbot clones, Avanyx's AI Brain operates with direct access to your POS ledger, weather reports, stockouts, and margin anomalies.
            </p>
          </div>

          {/* Authentic Conversation Preview Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden text-left">
            {/* Window header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Avanyx Autonomous Business Brain</div>
                  <div className="text-[10px] text-slate-400">Model: Avanyx-Business-LLM • Connected to Store POS Ledger</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                Data Confidence: 99.4%
              </span>
            </div>

            {/* Conversation Body */}
            <div className="p-6 sm:p-8 space-y-6 bg-slate-50/50">
              {/* User Prompt */}
              <div className="flex items-start gap-3.5 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                  You
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-sm text-slate-800 font-medium">
                  Why were sales lower this week?
                </div>
              </div>

              {/* AI Brain Deep Diagnostic Response */}
              <div className="flex items-start gap-3.5 max-w-3xl ml-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-indigo-200/80 shadow-md text-sm text-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Diagnostic Root-Cause Breakdown</span>
                    <span className="text-xs text-indigo-600 font-semibold">Variance: -$1,420.00</span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                    Sales decreased compared with last week. The biggest change came from lower sales in your top product category. I correlated 1,840 telemetry data points across stock logs and weather reports:
                  </p>

                  <div className="space-y-3 pt-1">
                    {/* Cause 1 */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>1. Stockout Outage on Top 2 SKUs (-$840 impact)</span>
                      </div>
                      <p className="text-amber-800/90 leading-relaxed">
                        <span className="font-semibold">Matcha Powder</span> and <span className="font-semibold">Gluten-Free Bagels</span> were out of stock from 11:30 AM onward. 46 attempted cart additions were abandoned.
                      </p>
                    </div>

                    {/* Cause 2 */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                        <span>2. Severe Rainstorm Foot-Traffic Slump (-$580 impact)</span>
                      </div>
                      <p className="text-blue-800/90 leading-relaxed">
                        Precipitation between 2:00 PM and 5:00 PM reduced street pedestrian foot traffic by 38%. However, digital pickup orders rose +16%, partially cushioning the drop.
                      </p>
                    </div>
                  </div>

                  {/* AI Automated Recommendation */}
                  <div className="pt-2">
                    <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-2">
                      <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        <span>Recommended Corrective Action:</span>
                      </div>
                      <p className="text-indigo-900/90">
                        Increase Monday safety reorder buffer on Matcha Powder from 5 units to 12 units. Configure automatic push notification promo when rainy weather is detected.
                      </p>
                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={onLaunchPos}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-2xs transition"
                        >
                          Apply Reorder Rule (1-Click)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. DEMAND FORECASTER (INTERACTIVE SLIDERS) */}
      {/* ========================================================================= */}
      <section id="forecaster" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-5 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-700 mb-4 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Predictive Demand Simulation</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Know What Your Business<br />May Need Next.
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Adjust pricing, marketing campaigns, and seasonal factors with live AI-backed feedback. Understand elasticity and prep supply chains with zero guesswork.
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Price elasticity machine learning curves</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Weather and holiday seasonal weighting</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated purchasing order suggestions</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Simulator Card */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-left">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Interactive Demand Simulator</h3>
                    <p className="text-xs text-slate-500">Test hypothetical scenarios in real time</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live Model
                  </span>
                </div>

                {/* 3 Interactive Sliders */}
                <div className="space-y-5">
                  {/* Slider 1: Price Adjustment */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700">Price Adjustment (%)</span>
                      <span className="font-mono text-indigo-600 font-bold">
                        {priceAdjustment > 0 ? `+${priceAdjustment}%` : `${priceAdjustment}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      step="1"
                      value={priceAdjustment}
                      onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>-15% Discount</span>
                      <span>Baseline (0%)</span>
                      <span>+15% Premium</span>
                    </div>
                  </div>

                  {/* Slider 2: Marketing & Foot-Traffic Boost */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700">Marketing & Campaign Boost</span>
                      <span className="font-mono text-emerald-600 font-bold">+{marketingBoost}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={marketingBoost}
                      onChange={(e) => setMarketingBoost(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Organic (0%)</span>
                      <span>Moderate Promo (+25%)</span>
                      <span>Aggressive Blitz (+50%)</span>
                    </div>
                  </div>

                  {/* Slider 3: Seasonal Weight */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700">Seasonal / Weekend Lift</span>
                      <span className="font-mono text-violet-600 font-bold">+{seasonalityFactor}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="5"
                      value={seasonalityFactor}
                      onChange={(e) => setSeasonalityFactor(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                  </div>
                </div>

                {/* Simulated Outcome Display */}
                <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Simulated Weekly Projection
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        ${simulatedForecast.projectedRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Est. Units: <span className="font-bold text-slate-800">{simulatedForecast.projectedUnits} items</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${
                          simulatedForecast.isPositive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {simulatedForecast.percentChange}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-1">vs Baseline ($14,250)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PRODUCT SCREENSHOT GALLERY ("A CLOSER LOOK AT AVANYX") */}
      {/* ========================================================================= */}
      <section id="gallery" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-3 shadow-2xs">
              <Eye className="w-3.5 h-3.5" />
              <span>Interactive Interface Gallery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              A Closer Look at Avanyx
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Explore the actual interfaces crafted for high-performance retail counters, backroom warehouses, and executive intelligence.
            </p>

            {/* Gallery Tabs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'dashboard', label: 'Executive Dashboard' },
                { id: 'pos', label: 'POS Register' },
                { id: 'inventory', label: 'Stock & Inventory' },
                { id: 'brain', label: 'AI Business Brain' },
                { id: 'forecaster', label: 'Demand Forecaster' },
                { id: 'store', label: 'Online Storefront' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGalleryTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    galleryTab === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Gallery Viewport with 3D Depth */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-10 text-left">
            {galleryTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Executive Performance Dashboard</h3>
                    <p className="text-xs text-slate-500">Live operational telemetry across all sales channels</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">Flagship Branch</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-400">Total Net Revenue</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">$62,400.00</div>
                    <span className="text-[11px] text-emerald-600 font-semibold">+14.2% vs last cycle</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-400">Average Ticket Size</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">$48.20</div>
                    <span className="text-[11px] text-blue-600 font-semibold">1,294 Orders</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-400">Net Profit Margin</span>
                    <div className="text-xl font-bold text-indigo-600 mt-1">48.4%</div>
                    <span className="text-[11px] text-slate-400">After all COGS & Opex</span>
                  </div>
                </div>
              </div>
            )}

            {galleryTab === 'pos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Point-of-Sale Register Interface</h3>
                    <p className="text-xs text-slate-500">Sub-second transaction execution for rapid cashiering</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">Offline-First</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-indigo-600" />
                    <div>
                      <div className="font-bold text-sm text-slate-900">Fast Barcode & Touch Checkout</div>
                      <div className="text-xs text-slate-500">Camera scanning, Bluetooth barcode readers, ESC/POS receipt printing</div>
                    </div>
                  </div>
                  <button onClick={() => onOpenAuth()} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">
                    Open Register
                  </button>
                </div>
              </div>
            )}

            {galleryTab === 'inventory' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Inventory & Stock Tracking</h3>
                    <p className="text-xs text-slate-500">Automated safety buffers and batch expiration dates</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700">1,428 Tracked SKUs</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>Artisan Almond Croissant</span>
                    <span className="text-rose-600 font-bold">Low Stock (6 left)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: '12%' }} />
                  </div>
                  <span className="text-[11px] text-slate-400">Reorder point: 10 units • Supplier lead time: 1 day</span>
                </div>
              </div>
            )}

            {galleryTab === 'brain' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">AI Business Brain Diagnostics</h3>
                    <p className="text-xs text-slate-500">Automated root-cause analysis on deviations</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-700">Autonomous</span>
                </div>
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 text-xs text-slate-700 space-y-2">
                  <div className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>AI Brain Insight: Tuesday Sales Anomaly</span>
                  </div>
                  <p>Stockout outage on top 2 items caused -$840 lost opportunity. Recommended Monday reorder safety buffer increase to 12 units.</p>
                </div>
              </div>
            )}

            {galleryTab === 'forecaster' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">14-Day Predictive Demand Forecaster</h3>
                    <p className="text-xs text-slate-500">Machine learning curve weighting weather and promotion velocity</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">94.2% Accuracy</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Projected Next 7 Days</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">$16,380.00</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">+14.9% Lift</span>
                    <span className="block text-[11px] text-slate-400 mt-1">552 Units Expected</span>
                  </div>
                </div>
              </div>
            )}

            {galleryTab === 'store' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Connected Online Storefront</h3>
                    <p className="text-xs text-slate-500">Turn your physical inventory into a digital catalog instantly</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-sky-50 text-sky-700">300ms Webhook Sync</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-bold text-sm text-slate-900">Instant Customer Web Storefront</div>
                      <div className="text-xs text-slate-500">In-store POS counter purchases decrement online stock in 300ms</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Live Parity</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. PRICING SECTION — REAL PROJECT TIERS */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-3 shadow-2xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Transparent Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Predictable, Fair Plans for Every Business
            </h2>
            <p className="mt-4 text-base text-slate-600">
              No hidden transaction markups. No forced hardware leases. Keep what you earn.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  billingInterval === 'annual'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                  SAVE 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards: Real Project Configuration Synced Live from Super Admin */}
          <div className={`grid grid-cols-1 ${displayPlans.length === 1 ? 'max-w-md' : displayPlans.length === 2 ? 'md:grid-cols-2 max-w-4xl' : 'lg:grid-cols-3 max-w-6xl'} gap-8 mx-auto text-left`}>
            {displayPlans.map((plan) => {
              const isPopular = plan.isPopular;
              const isFree = plan.monthlyPriceUSD === 0;
              const monthlyRate = isFree
                ? '0'
                : billingInterval === 'annual' && plan.annualPriceUSD > 0
                  ? (plan.annualPriceUSD / 12).toFixed(2)
                  : plan.monthlyPriceUSD.toFixed(2);

              const hasExtraFeatures = Array.isArray(plan.features) && plan.features.length > 0;

              return (
                <div
                  key={plan.id || plan.tier}
                  className={`relative p-7 rounded-3xl flex flex-col justify-between transition group hover:shadow-xl ${
                    isPopular
                      ? 'bg-white border-2 border-indigo-600 shadow-xl'
                      : 'bg-[#FAFAFA] border border-slate-200/80 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-indigo-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-xs">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isPopular ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {plan.name}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                      {plan.tagline || 'Essential store operations and intelligence package'}
                    </p>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">
                        ${monthlyRate}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {isFree
                          ? '/ month forever'
                          : `/ month ${billingInterval === 'annual' && plan.annualPriceUSD > 0 ? `($${plan.annualPriceUSD}/yr)` : ''}`}
                      </span>
                    </div>

                    {/* Compact Core Highlights */}
                    <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-3 text-xs text-slate-700">
                      <div className="flex items-center gap-2.5 font-semibold">
                        <Check className={`w-4 h-4 shrink-0 ${isPopular ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        <span>
                          {plan.resourceLimits?.maxWorkstations ?? plan.maxWorkstations}{' '}
                          {(plan.resourceLimits?.maxWorkstations ?? plan.maxWorkstations) === 1 ? 'Workstation' : 'Workstations'} (Register Terminal)
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 font-semibold">
                        <Check className={`w-4 h-4 shrink-0 ${isPopular ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        <span>
                          {(plan.resourceLimits?.monthlyAiCredits ?? plan.tokensIncludedMonthly).toLocaleString()} Monthly AI Intelligence Tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 font-semibold">
                        <Check className={`w-4 h-4 shrink-0 ${isPopular ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        <span>
                          {plan.resourceLimits?.maxStaff ?? plan.maxSubusers} Staff Accounts &amp; {(plan.resourceLimits?.maxProducts ?? plan.maxProducts).toLocaleString()} Products
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 font-semibold">
                        <Check className={`w-4 h-4 shrink-0 ${isPopular ? 'text-indigo-600' : 'text-emerald-600'}`} />
                        <span>Universal POS, Tax Ledger &amp; Sync</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View Details + Primary Action */}
                  <div className="mt-8 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailPlan(plan)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50/80 border border-slate-200/90 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      <span>View Complete Plan Details ({hasExtraFeatures ? `${plan.features.length} Features` : 'All Details'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAuth('signup')}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition cursor-pointer text-center shadow-sm ${
                        isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                          : isFree
                            ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isFree ? 'Start Free' : `Get ${plan.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Plan Details Modal */}
          <PlanDetailsModal
            isOpen={!!selectedDetailPlan}
            onClose={() => setSelectedDetailPlan(null)}
            plan={selectedDetailPlan}
            billingInterval={billingInterval}
            currencySymbol="$"
            onSelectPlan={() => onOpenAuth('signup')}
            selectButtonText={selectedDetailPlan?.monthlyPriceUSD === 0 ? 'Start Free' : `Get ${selectedDetailPlan?.name}`}
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FAQ SECTION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-3 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'What happens if our internet connection drops during rush hour?',
                a: 'Avanyx is built with an offline-first architecture. The POS terminal caches your catalog locally in IndexedDB. You can ring up sales, print receipts, and accept cash payments without interruption. The moment internet connectivity restores, all transactions auto-reconcile to the cloud.'
              },
              {
                q: 'Can I connect my existing thermal receipt printers and barcode scanners?',
                a: 'Yes. Avanyx supports standard ESC/POS thermal receipt printers over USB, Bluetooth, or local network IP. USB and Bluetooth barcode scanners work right out of the box with zero drivers required.'
              },
              {
                q: 'How does the AI Demand Forecaster predict future sales?',
                a: 'Our forecasting engine analyzes historical transaction timestamps, item velocity curves, local weather forecasts, calendar holidays, and active promotional campaigns to generate an 85–94% accurate 14-day projection.'
              },
              {
                q: 'Are there hidden transaction fees on our credit card sales?',
                a: 'Zero. Avanyx does not charge basis points or percentage cuts on your sales volume. You connect your standard card processor or payment terminal and keep 100% of your earnings.'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. FINAL HIGH-IMPACT 3D CTA */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-16 text-center overflow-hidden shadow-2xl border border-slate-800">
            {/* Subtle mesh background */}
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="inline-block px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-500/30">
                Setup in 10 Minutes
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Your business is complicated.<br />
                <span className="text-indigo-400">Managing it shouldn't be.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-300">
                Join thousands of modern retail and hospitality merchants using Avanyx to automate checkout, stock, and business decisions.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onOpenAuth()}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white font-semibold text-base border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                <span>✓ Zero credit card required</span>
                <span>✓ Instant catalog import</span>
                <span>✓ 24/7 migration concierge</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 15. PROFESSIONAL FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-[#FAFAFA] border-t border-slate-200 pt-16 pb-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-200">
            {/* Brand Column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Avanyx
                </span>
              </div>
              <p className="text-slate-500 max-w-sm text-xs leading-relaxed">
                Avanyx is the modern autonomous operating platform for commerce enterprises, unifying POS registers, real-time inventory, finance, and predictive demand intelligence.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational (99.99%)
                </span>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h5 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Product</h5>
              <ul className="space-y-2">
                <li><a href="#pos" className="hover:text-indigo-600 transition">POS Register</a></li>
                <li><a href="#inventory" className="hover:text-indigo-600 transition">Inventory & Stock</a></li>
                <li><a href="#analytics" className="hover:text-indigo-600 transition">Analytics & Margin</a></li>
                <li><a href="#gallery" className="hover:text-indigo-600 transition">Online Store Sync</a></li>
                <li><a href="#features" className="hover:text-indigo-600 transition">Operating Modules</a></li>
              </ul>
            </div>

            {/* Features & AI Links */}
            <div>
              <h5 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Features & AI</h5>
              <ul className="space-y-2">
                <li><a href="#ai-brain" className="hover:text-indigo-600 transition">AI Business Brain</a></li>
                <li><a href="#forecaster" className="hover:text-indigo-600 transition">Demand Forecaster</a></li>
                <li><a href="#pricing" className="hover:text-indigo-600 transition">Pricing Plans</a></li>
                <li><a href="#faq" className="hover:text-indigo-600 transition">Support & FAQ</a></li>
              </ul>
            </div>

            {/* Company & Resources */}
            <div>
              <h5 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Resources</h5>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => onOpenAuth('login')} className="hover:text-indigo-600 transition text-left cursor-pointer">
                    Merchant Login
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenAuth('signup')} className="hover:text-indigo-600 transition text-left cursor-pointer">
                    Start Free Trial
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Legal bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} Avanyx Systems Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-600 cursor-pointer">SOC-2 Type II Certified</span>
              <span>•</span>
              <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

