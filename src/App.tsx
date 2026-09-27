import React, { useState, useEffect } from 'react';
import { TranslationProvider, useTranslation } from './context/TranslationContext';
import { AvanyxProvider, useAvanyx } from './context/AvanyxContext';
import { Header } from './components/Header';
import { PosBillingScreen } from './components/PosBillingScreen';
import { BusinessBrainView } from './components/BusinessBrainView';
import { AskAvanyxChat } from './components/AskAvanyxChat';
import { ProductCatalog } from './components/ProductCatalog';
import { InventoryManagement } from './components/InventoryManagement';
import { CustomerAndLoyalty } from './components/CustomerAndLoyalty';
import { PurchasesAndSuppliers } from './components/PurchasesAndSuppliers';
import { SalesAndOrders } from './components/SalesAndOrders';
import { FinancialManagement } from './components/FinancialManagement';
import { ReportsSuite } from './components/ReportsSuite';
import { OnlineStoreBeta } from './components/OnlineStoreBeta';
import { SubuserManagement } from './components/SubuserManagement';
import { CloudAndSettings } from './components/CloudAndSettings';
import { PromotionsDiscounts } from './components/PromotionsDiscounts';
import { PaymentRecordsView } from './components/PaymentRecordsView';
import { TaxManagementView } from './components/TaxManagementView';
import { NotificationsCenter } from './components/NotificationsCenter';
import { HelpSupportView } from './components/HelpSupportView';
import { WalletView } from './components/WalletView';
import { MasterCheckoutModal } from './components/MasterCheckoutModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthPortal } from './components/AuthPortal';
import { AuthModal } from './components/AuthModal';
import { FounderAdminPanel } from './components/FounderAdminPanel';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';
import { AvanyxMascot } from './components/AvanyxMascot';
import { DigitalReceiptView } from './components/DigitalReceiptView';
import { LivingLine } from './components/LivingLine';
import { AvanyxLandingPage } from './components/AvanyxLandingPage';
import { AVANYX_COLOR_PALETTES } from './constants/themeColors';
import { trackFeatureUsage, updateUserHeartbeat } from './lib/analyticsEngine';
import {
  BrainCircuit,
  Sparkles,
  Cpu,
  Tag,
  Package,
  Users,
  Truck,
  FileText,
  DollarSign,
  BarChart3,
  ShoppingCart,
  ShoppingBag,
  Palette,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Percent,
  CreditCard,
  Receipt,
  Bell,
  HelpCircle,
  X,
  ChevronRight,
  Share2,
  Lock,
  RotateCcw,
  MessageSquare,
  Wallet,
  Globe,
  Layers,
  Clock,
  Smartphone,
  Barcode as BarcodeIcon,
  Award,
  Calculator,
  Building2,
  TrendingUp,
  PiggyBank,
  Sliders,
  Calendar,
} from 'lucide-react';
import { SystemModuleKey } from './types';

const AccessRestrictedView: React.FC<{ moduleName: string; onGoHome: () => void }> = ({ moduleName, onGoHome }) => {
  const { activeUser } = useAvanyx();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg mx-auto my-12 shadow-xl">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20 shadow-lg">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        Your role (<span className="font-semibold text-primary">{activeUser?.roleName || 'Staff Member'}</span>, ID:{' '}
        <span className="font-mono text-slate-700 dark:text-slate-300">{activeUser?.staffId || activeUser?.id}</span>)
        does not have permission to access <strong className="text-slate-800 dark:text-slate-200">{moduleName}</strong>.
      </p>
      <button
        onClick={onGoHome}
        className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
      >
        Return to POS / Dashboard
      </button>
    </div>
  );
};

const AvanyxAppContent: React.FC = () => {
  const {
    currentModule,
    setCurrentModule,
    activeMode,
    activeBusiness,
    brainHealth,
    isOnboardingOpen,
    setIsOnboardingOpen,
    hasCompletedOnboarding,
    activeUser,
    isAuthenticated,
    hasPermission,
    authLoading,
    primaryColor,
    theme,
    
  } = useAvanyx();
  const { t, locale, setLocale } = useTranslation();

  // Public visitor view state ('landing' | 'auth')
  const [publicView, setPublicView] = useState<'landing' | 'auth'>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (search.includes('auth=true') || hash === '#login' || hash === '#signup') return 'auth';
      // If attempting to access a protected route directly while unauthenticated, force login
      if (path !== '/' && path !== '' && !path.startsWith('/r/') && !path.startsWith('/receipt/')) {
        return 'auth';
      }
    }
    return 'landing';
  });

  const activePalette =
    AVANYX_COLOR_PALETTES.find((p) => p.hex.toLowerCase() === (primaryColor || '#5B5CE2').toLowerCase()) ||
    AVANYX_COLOR_PALETTES[0];

  // Dynamic theme calculation
  const isDarkTheme = theme === 'dark';

  // Sync language from cloud business profile on login
  useEffect(() => {
    if (activeBusiness?.language && activeBusiness.language !== locale) {
      setLocale(activeBusiness.language as any);
    }
  }, [activeBusiness?.language]);

  // Real-time telemetry: track feature module navigation
  useEffect(() => {
    if (currentModule) {
      trackFeatureUsage(currentModule, `User opened ${currentModule} module`);
    }
  }, [currentModule]);

  // Real-time telemetry: heartbeat updater
  useEffect(() => {
    if (activeUser?.id) {
      updateUserHeartbeat(activeUser.id, activeUser.email || undefined, activeBusiness?.id);
      const interval = setInterval(
        () => {
          updateUserHeartbeat(activeUser.id, activeUser.email || undefined, activeBusiness?.id);
        },
        3 * 60 * 1000
      );
      return () => clearInterval(interval);
    }
  }, [activeUser?.id, activeUser?.email, activeBusiness?.id]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Check for scannable digital receipt query parameters or path routes (/r/:id, ?s=..., ?receipt=...)
  const [receiptParams, setReceiptParams] = useState<{ b: string; s: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const b = params.get('b') || '';
    const s = params.get('s') || params.get('receipt') || params.get('invoice') || '';
    if (s) {
      return { b, s };
    }
    const match = window.location.pathname.match(/^\/(?:r|receipt|pass)\/([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return { b, s: match[1] };
    }
    return null;
  });

  // Auto-collapse sidebar on very small screens initially
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (receiptParams) {
    return (
      <DigitalReceiptView
        businessId={receiptParams.b}
        saleId={receiptParams.s}
        onBack={
          isAuthenticated
            ? () => {
                const url = new URL(window.location.href);
                url.searchParams.delete('b');
                url.searchParams.delete('s');
                window.history.replaceState({}, '', url.toString());
                setReceiptParams(null);
              }
            : undefined
        }
      />
    );
  }

  // Check for Super Admin route /admin or ?admin=true or #admin
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return path === '/admin' || path.startsWith('/admin/') || search.includes('admin=true') || hash === '#admin';
    }
    return false;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsAdminRoute(
        path === '/admin' || path.startsWith('/admin/') || search.includes('admin=true') || hash === '#admin'
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Standalone Super Admin Portal Route (/admin)
  if (isAdminRoute) {
    return (
      <div className={`h-screen w-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#070A14] text-slate-800 dark:text-white`}>
        <FounderAdminPanel
          isStandalone={true}
          onBackToStore={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
            setIsAdminRoute(false);
          }}
        />
      </div>
    );
  }

  // Auth Guard: If not authenticated, render the dedicated AuthPortal
  if (authLoading) {
    return (
      <div
        className={`h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#070A14] text-slate-800 dark:text-white`}
      >
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <AvanyxMascot size={64} sparkles={true} />
          <div className="text-center">
            <h1 className={`text-xl font-black tracking-tight text-slate-900 dark:text-white`}>Avanyx AI</h1>
            <p className={`text-xs mt-1 text-slate-500 dark:text-slate-400`}>Restoring verified terminal session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (publicView === 'auth') {
      return (
        <AuthPortal onBackToWebsite={() => setPublicView('landing')} />
      );
    }

    return (
      <AvanyxLandingPage
        onLaunchPos={() => setPublicView('auth')}
        onOpenAuth={(mode) => setPublicView('auth')}
        
      />
    );
  }


  const rawNavigationGroups: {
    title: string;
    items: {
      key: SystemModuleKey | 'settings' | 'subusers' | 'help' | 'notifications' | 'wallet';
      label: string;
      icon: any;
      badge?: string;
    }[];
  }[] = [
    {
      title: 'Core Commerce',
      items: [
        { key: 'business_brain', label: 'Dashboard', icon: BrainCircuit },
        { key: 'pos', label: 'POS Register', icon: ShoppingCart },
        { key: 'products', label: 'Products & Catalog', icon: Tag },
        { key: 'inventory', label: 'Inventory & Stock', icon: Package },
        { key: 'barcodes', label: 'Barcode Labels', icon: BarcodeIcon },
        { key: 'batch_tracking', label: 'Batch & Expiry', icon: Clock },
        { key: 'serial_tracking', label: 'Serial & IMEI', icon: Smartphone },
        { key: 'online_store', label: 'Online Store', icon: Globe },
        { key: 'appointments', label: 'Appointments', icon: Calendar },
      ],
    },
    {
      title: 'Sales & Fulfillment',
      items: [
        { key: 'sales_orders', label: 'Sales Orders', icon: FileText },
        { key: 'estimates', label: 'Quotations & Estimates', icon: Calculator },
        { key: 'credit_notes', label: 'Credit Notes & Returns', icon: RotateCcw },
        { key: 'delivery_notes', label: 'Delivery Notes', icon: Truck },
        { key: 'customers', label: 'Customer CRM', icon: Users },
        { key: 'loyalty', label: 'Loyalty Points & VIP', icon: Award },
      ],
    },
    {
      title: 'Operations & Finance',
      items: [
        { key: 'expenses', label: 'Expense Tracking', icon: DollarSign },
        { key: 'other_income', label: 'Other Income', icon: TrendingUp },
        { key: 'budgets', label: 'Budgets & Limits', icon: PiggyBank },
        { key: 'commissions', label: 'Staff Commissions', icon: Sliders },
        { key: 'suppliers', label: 'Suppliers & Vendors', icon: Building2 },
        { key: 'purchases', label: 'Purchase Orders', icon: Truck },
        { key: 'promotions', label: 'Promotions & Discounts', icon: Percent },
        { key: 'taxes', label: 'Tax Management', icon: Receipt },
        { key: 'payments', label: 'Payments & Ledger', icon: CreditCard },
        { key: 'subusers', label: 'Staff & Roles', icon: ShieldCheck },
        { key: 'financial_reports', label: 'Financial Reports & P&L', icon: BarChart3 },
        { key: 'custom_reports', label: 'Custom Report Builder', icon: BarChart3 },
      ],
    },
    {
      title: 'Intelligence & AI',
      items: [
        { key: 'ask_avanyx', label: 'Chat with Avanyx AI', icon: Sparkles, badge: 'AI' },
      ],
    },
    {
      title: 'Administration & System',
      items: [
        { key: 'notifications', label: 'Notifications', icon: Bell },
        { key: 'settings', label: 'Store Settings', icon: Settings },
        { key: 'help', label: 'Help & Shortcuts', icon: HelpCircle },
      ],
    },
  ];

  // ALWAYS visible modules regardless of settings
  const alwaysVisible = ['pos', 'products', 'settings', 'help', 'notifications', 'subusers', 'business_brain'];

  const isModuleEnabled = (key: string) => {
    if (alwaysVisible.includes(key)) return true;
    if (!activeBusiness?.enabledModules) return false;
    if (activeBusiness.enabledModules.includes(key as SystemModuleKey)) return true;
    if (key === 'subusers' && activeBusiness.enabledModules.includes('employees')) return true;
    if (key === 'employees' && activeBusiness.enabledModules.includes('subusers')) return true;
    if (key === 'sales_orders' && (activeBusiness.enabledModules.includes('orders') || activeBusiness.enabledModules.includes('invoices'))) return true;
    if (key === 'financial_reports' && (activeBusiness.enabledModules.includes('reports') || activeBusiness.enabledModules.includes('analytics'))) return true;
    return false;
  };

  const navigationGroups = rawNavigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => isModuleEnabled(item.key))
  })).filter(group => group.items.length > 0);

  const handleSelectModule = (key: SystemModuleKey | 'settings' | 'subusers' | 'help' | 'notifications' | 'wallet') => {
    setCurrentModule(key as SystemModuleKey);
    setMobileDrawerOpen(false);
  };

  const renderActiveModule = () => {
    switch (currentModule) {
      case 'pos':
        return <PosBillingScreen />;
      case 'business_brain':
        return <BusinessBrainView />;
      case 'ask_avanyx':
        return (
          <div className="flex-1 flex flex-col h-full w-full max-w-7xl 2xl:max-w-[1720px] mx-auto min-h-0">
            <AskAvanyxChat />
          </div>
        );
      case 'wallet':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <WalletView />
          </div>
        );

      case 'products':
      case 'appointments':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <ProductCatalog />
          </div>
        );
      case 'inventory':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <InventoryManagement initialTab="all" />
          </div>
        );
      case 'barcodes':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <InventoryManagement initialTab="labels" />
          </div>
        );
      case 'batch_tracking':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <InventoryManagement initialTab="batch_tracking" />
          </div>
        );
      case 'serial_tracking':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <InventoryManagement initialTab="serial_tracking" />
          </div>
        );
      case 'customers':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <CustomerAndLoyalty initialTab="customers" />
          </div>
        );
      case 'loyalty':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <CustomerAndLoyalty initialTab="loyalty_rules" />
          </div>
        );
      case 'sales_orders':
      case 'orders':
      case 'invoices':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <SalesAndOrders initialTab="orders" />
          </div>
        );
      case 'estimates':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <SalesAndOrders initialTab="estimates" />
          </div>
        );
      case 'credit_notes':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <SalesAndOrders initialTab="credit_notes" />
          </div>
        );
      case 'delivery_notes':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <SalesAndOrders initialTab="delivery_notes" />
          </div>
        );
      case 'purchases':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <PurchasesAndSuppliers initialTab="orders" />
          </div>
        );
      case 'suppliers':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <PurchasesAndSuppliers initialTab="suppliers" />
          </div>
        );
      case 'expenses':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <FinancialManagement initialTab="expenses" />
          </div>
        );
      case 'other_income':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <FinancialManagement initialTab="income" />
          </div>
        );
      case 'budgets':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <FinancialManagement initialTab="budgets" />
          </div>
        );
      case 'commissions':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <FinancialManagement initialTab="overview" />
          </div>
        );
      case 'financial_reports':
      case 'reports':
      case 'analytics':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <ReportsSuite initialReport="pnl" />
          </div>
        );
      case 'custom_reports':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <ReportsSuite initialReport="custom" />
          </div>
        );
      case 'promotions':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <PromotionsDiscounts />
          </div>
        );
      case 'payments':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <PaymentRecordsView />
          </div>
        );
      case 'taxes':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <TaxManagementView />
          </div>
        );
      case 'notifications':
        return (
          <div className="w-full max-w-4xl 2xl:max-w-5xl mx-auto">
            <NotificationsCenter />
          </div>
        );
      case 'help':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <HelpSupportView />
          </div>
        );
      case 'online_store':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <OnlineStoreBeta />
          </div>
        );
      case 'employees':
      case 'subusers':
        if (
          !hasPermission('employees:manage') &&
          activeUser?.roleId !== 'role-owner' &&
          activeUser?.roleId !== 'role-admin'
        ) {
          return (
            <AccessRestrictedView
              moduleName="Staff & Roles Management"
              onGoHome={() => setCurrentModule('business_brain')}
            />
          );
        }
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <SubuserManagement />
          </div>
        );
      case 'settings':
        if (
          !hasPermission('settings:manage') &&
          activeUser?.roleId !== 'role-owner' &&
          activeUser?.roleId !== 'role-admin'
        ) {
          return (
            <AccessRestrictedView moduleName="Business Settings" onGoHome={() => setCurrentModule('business_brain')} />
          );
        }
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <CloudAndSettings />
          </div>
        );
      default:
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto">
            <CloudAndSettings />
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] dark:bg-[#070A14] font-sans text-slate-900 dark:text-[#F8FAFC] overflow-hidden selection:bg-primary/20 selection:text-primary transition-colors duration-200">
      {/* Avanyx Master Header */}
      <Header
        onOpenAuth={() => setShowAuthModal(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setMobileDrawerOpen(!mobileDrawerOpen);
          } else {
            setSidebarOpen(!sidebarOpen);
          }
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Navigation Drawer Overlay (for phones and tablets) */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div
              className={`relative w-72 max-w-[80vw] bg-white dark:bg-[#0F1424] text-slate-800 dark:text-white border-slate-200 dark:border-slate-800 border-r h-full flex flex-col p-4 z-50 overflow-y-auto shadow-2xl backdrop-blur-xl`}
            >
              <div
                className={`flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3`}
              >
                <div className="flex items-center gap-2">
                  <AvanyxMascot size={28} sparkles={false} />
                  <span className={`text-sm font-extrabold tracking-wider text-slate-900 dark:text-white uppercase`}>Avanyx</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`p-1 rounded-xl ${isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {navigationGroups.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentModule === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleSelectModule(item.key)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-left transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'text-white shadow-lg scale-[1.01]'
                              : isDarkTheme
                                ? 'text-slate-400 hover:bg-slate-800/80 hover:text-white hover:translate-x-1'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1'
                          }`}
                          style={isActive ? { backgroundColor: activePalette.hex, boxShadow: `0 4px 14px 0 ${activePalette.hex}40` } : {}}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}
                          />
                          <span className="truncate flex-1">{item.label}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Dynamic Colorful Business & User Info (Mobile) */}
              <div className={`mt-auto pt-3 border-t border-slate-200 dark:border-slate-800/80`}>
                <div
                  className="p-3.5 rounded-2xl border flex flex-col gap-2 text-left relative overflow-hidden transition-all duration-300 shadow-md group"
                  style={{
                    background: isDarkTheme
                      ? `linear-gradient(135deg, ${activePalette.hex}22 0%, #0E1528 60%, ${activePalette.hex}15 100%)`
                      : `linear-gradient(135deg, ${activePalette.hex}18 0%, #FFFFFF 60%, ${activePalette.hex}10 100%)`,
                    borderColor: `${activePalette.hex}40`,
                    boxShadow: `0 4px 20px -2px ${activePalette.hex}25`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center p-1 shadow-sm shrink-0 border transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: isDarkTheme ? '#0F172A' : '#FFFFFF',
                        borderColor: `${activePalette.hex}50`,
                        boxShadow: `0 0 10px ${activePalette.hex}30`,
                      }}
                    >
                      <AvanyxMascot size={20} sparkles={true} className="shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                        style={{ color: activePalette.hex }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-ping"
                          style={{ backgroundColor: activePalette.hex }}
                        />
                        <span>ACTIVE OUTLET</span>
                      </span>
                      <h4 className="text-xs font-black truncate text-slate-900 dark:text-white leading-tight">
                        {activeBusiness?.name || 'Avanyx'}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      {activeUser?.name || 'Store Owner'}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize shrink-0"
                      style={{
                        backgroundColor: activePalette.lightBg,
                        color: activePalette.hex,
                      }}
                    >
                      {activeUser?.roleName || 'Owner'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Collapsible Navigation Sidebar (Matches Avanyx Navy Theme) */}
        <nav
          className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-16'} shrink-0 border-r ${
            isDarkTheme ? 'border-slate-800 bg-[#0F1424] text-white' : 'border-slate-200 bg-white text-slate-800'
          } p-3 flex-col gap-1 transition-all duration-200 overflow-y-auto overflow-x-hidden select-none z-20`}
        >
          <div className="space-y-3 flex-1 mt-1">
            {navigationGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-0.5">
                {sidebarOpen && (
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setCurrentModule(item.key as SystemModuleKey)}
                      title={item.label}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 text-xs font-bold text-left cursor-pointer ${
                        isActive
                          ? 'text-white shadow-lg scale-[1.01]'
                          : isDarkTheme
                            ? 'text-slate-400 hover:bg-slate-800/70 hover:text-white hover:translate-x-0.5'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5'
                      }`}
                      style={isActive ? { backgroundColor: activePalette.hex, boxShadow: `0 4px 14px 0 ${activePalette.hex}40` } : {}}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}
                      />
                      {sidebarOpen && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{item.label}</span>
                          {isActive ? (
                            <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : ''}`} />
                          ) : item.badge ? (
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: activePalette.lightBg,
                                color: activePalette.hex,
                              }}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Dynamic Colorful Business & User Info (Desktop) */}
          {sidebarOpen && (
            <div className={`mt-auto pt-3 border-t border-slate-200 dark:border-slate-800/80`}>
              <div
                className="p-3.5 rounded-2xl border flex flex-col gap-2 text-left relative overflow-hidden transition-all duration-300 shadow-md group"
                style={{
                  background: isDarkTheme
                    ? `linear-gradient(135deg, ${activePalette.hex}22 0%, #0E1528 60%, ${activePalette.hex}15 100%)`
                    : `linear-gradient(135deg, ${activePalette.hex}18 0%, #FFFFFF 60%, ${activePalette.hex}10 100%)`,
                  borderColor: `${activePalette.hex}40`,
                  boxShadow: `0 4px 20px -2px ${activePalette.hex}25`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center p-1 shadow-sm shrink-0 border transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: isDarkTheme ? '#0F172A' : '#FFFFFF',
                      borderColor: `${activePalette.hex}50`,
                      boxShadow: `0 0 10px ${activePalette.hex}30`,
                    }}
                  >
                    <AvanyxMascot size={20} sparkles={true} className="shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                      style={{ color: activePalette.hex }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-ping"
                        style={{ backgroundColor: activePalette.hex }}
                      />
                      <span>ACTIVE OUTLET</span>
                    </span>
                    <h4 className="text-xs font-black truncate text-slate-900 dark:text-white leading-tight">
                      {activeBusiness?.name || 'Avanyx'}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px]">
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                    {activeUser?.name || 'Store Owner'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize shrink-0"
                    style={{
                      backgroundColor: activePalette.lightBg,
                      color: activePalette.hex,
                    }}
                  >
                    {activeUser?.roleName || 'Owner'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Dynamic Center Stage */}
        <main
          className={`flex-1 ${
            currentModule === 'ask_avanyx'
              ? 'overflow-hidden p-0 sm:p-4 md:p-6 lg:p-6 2xl:p-8 flex flex-col min-h-0'
              : 'overflow-y-auto p-3.5 sm:p-5 lg:p-6 2xl:p-8'
          } bg-[#F8FAFC] dark:bg-[#070A14] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-200`}
        >
          <ErrorBoundary
            resetKey={currentModule}
            onNavigateHome={() => setCurrentModule('business_brain')}
            onOpenHelp={() => setCurrentModule('help')}
          >
            {renderActiveModule()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Minimalist Status Bar */}
      <footer className="h-7 bg-white dark:bg-[#0B101D] border-t border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 shrink-0 select-none transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] truncate max-w-[160px] sm:max-w-none">
            {activeBusiness?.name || 'Avanyx'}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="hidden sm:inline">{activeUser?.name || 'Operator'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Sync Active
          </span>
        </div>
      </footer>

      {/* Persistent Floating Ask Avanyx AI Assistant */}
      <FloatingAiAssistant />

      {/* Interactive Onboarding Wizard Modal */}
      <OnboardingWizardModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />

      {/* Master Payment & Token Checkout Modal */}
      <MasterCheckoutModal />

      {/* Auth Modal for Staff switching & re-authentication */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <TranslationProvider>
        <AvanyxProvider>
          <ErrorBoundary>
            <AvanyxAppContent />
          </ErrorBoundary>
        </AvanyxProvider>
      </TranslationProvider>
    </ErrorBoundary>
  );
}
