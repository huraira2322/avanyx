import React, { useState, useMemo } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import {
  BedDouble,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Search,
  Sparkles,
  Receipt,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Key,
  Car,
  Activity,
  Wrench,
  Package,
  Coffee,
  ShoppingBag,
  ChevronRight,
  Printer,
  X,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { BusinessResourceItem, BusinessBookingRecord, OperationalTaskRecord } from '../types';

export const UniversalBusinessEngine: React.FC = () => {
  const {
    activeBusiness,
    currency,
    currencySymbol,
    primaryColor,
    setCurrentModule,
    authUser,
    activeUser
  } = useAvanyx();

  const opModel = activeBusiness?.catalogSchema?.operationalModel || activeBusiness?.operationalModel;
  const terminology = opModel?.terminology || {
    resourceName: 'Room / Unit',
    resourcePlural: 'Rooms & Suites',
    clientName: 'Guest',
    clientPlural: 'Guests',
    transactionName: 'Reservation',
    transactionPlural: 'Reservations & Folios',
    primaryAction: 'Book Room / Check In',
    secondaryAction: 'Check Out & Settle Folio'
  };

  const domain = opModel?.domain || 'hospitality';

  // Persistent Local State with Seed Data
  const [activeTab, setActiveTab] = useState<'board' | 'bookings' | 'folios' | 'tasks' | 'pos' | 'analytics'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Operational Resource State
  const [resources, setResources] = useState<BusinessResourceItem[]>(() => {
    try {
      const saved = localStorage.getItem(`avanyx_op_resources_${activeBusiness.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return opModel?.resourceBoard?.initialResources || [
      { id: 'res-101', name: 'Deluxe King Suite 101', type: 'Deluxe King', status: 'available', rate: 350, capacity: 2, floorOrLocation: '1st Floor - East Wing' },
      { id: 'res-102', name: 'Deluxe Twin Suite 102', type: 'Deluxe Twin', status: 'occupied', rate: 320, capacity: 4, currentGuestOrClient: 'Alexander Vance', checkInDate: '2026-09-28', checkOutDate: '2026-10-01' },
      { id: 'res-201', name: 'Executive Ocean Suite 201', type: 'Executive', status: 'available', rate: 550, capacity: 2, floorOrLocation: '2nd Floor - Ocean Front' },
      { id: 'res-202', name: 'Executive Ocean Suite 202', type: 'Executive', status: 'reserved', rate: 550, capacity: 2, currentGuestOrClient: 'Dr. Evelyn Reed', checkInDate: '2026-09-29', checkOutDate: '2026-10-02' },
      { id: 'res-301', name: 'Presidential Penthouse 301', type: 'Presidential', status: 'available', rate: 1200, capacity: 6, floorOrLocation: 'Penthouse Floor' },
      { id: 'res-302', name: 'Royal Heritage Suite 302', type: 'Royal Suite', status: 'cleaning', rate: 950, capacity: 4, floorOrLocation: 'Penthouse Floor' }
    ];
  });

  // Bookings / Folios State
  const [bookings, setBookings] = useState<BusinessBookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`avanyx_op_bookings_${activeBusiness.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return opModel?.initialBookings || [
      {
        id: 'bk-001',
        businessId: activeBusiness.id,
        resourceId: 'res-102',
        resourceName: 'Deluxe Twin Suite 102',
        clientName: 'Alexander Vance',
        clientEmail: 'alex.vance@venture.com',
        clientPhone: '+1 (555) 982-1142',
        checkInDate: '2026-09-28',
        checkOutDate: '2026-10-01',
        rate: 320,
        totalNightsOrUnits: 3,
        depositAmount: 500,
        totalAmount: 1120,
        paidAmount: 500,
        status: 'checked_in',
        notes: 'VIP Guest. Prefers hypoallergenic pillows and late 2:00 PM checkout.',
        folioCharges: [
          { id: 'chg-1', description: 'Room Rate (3 Nights @ $320)', amount: 960, category: 'Accommodation', date: '2026-09-28' },
          { id: 'chg-2', description: 'Room Service: Wagyu Ribeye & Vintage Red', amount: 160, category: 'Dining', date: '2026-09-28' }
        ],
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Tasks State
  const [tasks, setTasks] = useState<OperationalTaskRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`avanyx_op_tasks_${activeBusiness.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return opModel?.initialTasks || [
      { id: 'tsk-1', resourceId: 'res-302', resourceName: 'Royal Heritage Suite 302', title: 'Deep Turnover Cleaning & Linen Restock', priority: 'high', status: 'in_progress', assignedTo: 'Housekeeping Team A', createdAt: new Date().toISOString() },
      { id: 'tsk-2', resourceId: 'res-101', resourceName: 'Deluxe King Suite 101', title: 'Welcome Fruit Basket & Champagne Setup', priority: 'medium', status: 'pending', assignedTo: 'Guest Relations', createdAt: new Date().toISOString() }
    ];
  });

  // Helper to persist state updates
  const updateAndSaveResources = (updated: BusinessResourceItem[]) => {
    setResources(updated);
    try { localStorage.setItem(`avanyx_op_resources_${activeBusiness.id}`, JSON.stringify(updated)); } catch {}
  };

  const updateAndSaveBookings = (updated: BusinessBookingRecord[]) => {
    setBookings(updated);
    try { localStorage.setItem(`avanyx_op_bookings_${activeBusiness.id}`, JSON.stringify(updated)); } catch {}
  };

  const updateAndSaveTasks = (updated: OperationalTaskRecord[]) => {
    setTasks(updated);
    try { localStorage.setItem(`avanyx_op_tasks_${activeBusiness.id}`, JSON.stringify(updated)); } catch {}
  };

  // Modals
  const [selectedBookingForFolio, setSelectedBookingForFolio] = useState<BusinessBookingRecord | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
  const [newCharge, setNewCharge] = useState({ description: '', amount: 50, category: 'Service' });

  // Booking Form Modal State
  const [newBooking, setNewBooking] = useState({
    resourceId: resources[0]?.id || '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    depositAmount: 100,
    notes: ''
  });

  // Analytics Calculations
  const metrics = useMemo(() => {
    const total = resources.length || 1;
    const occupied = resources.filter(r => r.status === 'occupied').length;
    const reserved = resources.filter(r => r.status === 'reserved').length;
    const cleaning = resources.filter(r => r.status === 'cleaning').length;
    const available = resources.filter(r => r.status === 'available').length;
    const occupancyRate = Math.round((occupied / total) * 100);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const collectedRevenue = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const pendingBalance = totalRevenue - collectedRevenue;
    const avgRate = Math.round(resources.reduce((sum, r) => sum + (r.rate || 0), 0) / total);

    return { total, occupied, reserved, cleaning, available, occupancyRate, totalRevenue, collectedRevenue, pendingBalance, avgRate };
  }, [resources, bookings]);

  // Handle Resource Status Changes
  const handleSetResourceStatus = (resId: string, status: BusinessResourceItem['status']) => {
    const updated = resources.map(r => {
      if (r.id === resId) {
        return {
          ...r,
          status,
          currentGuestOrClient: status === 'available' || status === 'cleaning' ? '' : r.currentGuestOrClient
        };
      }
      return r;
    });
    updateAndSaveResources(updated);
  };

  // Handle Booking Creation with Validation
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.clientName.trim() || !newBooking.resourceId) return;

    const res = resources.find(r => r.id === newBooking.resourceId);
    if (!res) return;

    const d1 = new Date(newBooking.checkInDate).getTime();
    const d2 = new Date(newBooking.checkOutDate).getTime();
    const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    const totalAmount = res.rate * diffDays;

    const bookingRecord: BusinessBookingRecord = {
      id: `bk-${Date.now().toString().slice(-5)}`,
      businessId: activeBusiness.id,
      resourceId: res.id,
      resourceName: res.name,
      clientName: newBooking.clientName,
      clientEmail: newBooking.clientEmail,
      clientPhone: newBooking.clientPhone,
      checkInDate: newBooking.checkInDate,
      checkOutDate: newBooking.checkOutDate,
      rate: res.rate,
      totalNightsOrUnits: diffDays,
      depositAmount: Number(newBooking.depositAmount) || 0,
      totalAmount,
      paidAmount: Number(newBooking.depositAmount) || 0,
      status: 'confirmed',
      notes: newBooking.notes,
      folioCharges: [
        {
          id: `chg-${Date.now()}`,
          description: `${terminology.resourceName} Rate (${diffDays} units @ ${currencySymbol || '$'}${res.rate})`,
          amount: totalAmount,
          category: 'Primary Fee',
          date: newBooking.checkInDate
        }
      ],
      createdAt: new Date().toISOString()
    };

    updateAndSaveBookings([bookingRecord, ...bookings]);

    // Update resource status to reserved or occupied
    const updatedRes = resources.map(r => {
      if (r.id === res.id) {
        return {
          ...r,
          status: 'reserved',
          currentGuestOrClient: newBooking.clientName,
          checkInDate: newBooking.checkInDate,
          checkOutDate: newBooking.checkOutDate
        };
      }
      return r;
    });
    updateAndSaveResources(updatedRes);

    setIsBookingModalOpen(false);
    setNewBooking({
      resourceId: resources[0]?.id || '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      depositAmount: 100,
      notes: ''
    });
  };

  // Check In Handler
  const handleCheckIn = (bookingId: string) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    const updatedBookings = bookings.map(b => (b.id === bookingId ? { ...b, status: 'checked_in' as const } : b));
    updateAndSaveBookings(updatedBookings);

    const updatedRes = resources.map(r => {
      if (r.id === target.resourceId) {
        return { ...r, status: 'occupied', currentGuestOrClient: target.clientName };
      }
      return r;
    });
    updateAndSaveResources(updatedRes);
  };

  // Check Out & Settle Folio Handler
  const handleCheckOutAndSettle = (bookingId: string) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    const updatedBookings = bookings.map(b => (b.id === bookingId ? { ...b, status: 'checked_out' as const, paidAmount: b.totalAmount } : b));
    updateAndSaveBookings(updatedBookings);

    // Free the resource and move to cleaning
    const updatedRes = resources.map(r => {
      if (r.id === target.resourceId) {
        return { ...r, status: 'cleaning', currentGuestOrClient: '' };
      }
      return r;
    });
    updateAndSaveResources(updatedRes);

    // Auto-create a turnover task
    const newTask: OperationalTaskRecord = {
      id: `tsk-${Date.now().toString().slice(-4)}`,
      resourceId: target.resourceId,
      resourceName: target.resourceName,
      title: `Turnover & Sanitization following ${target.clientName}'s departure`,
      priority: 'high',
      status: 'pending',
      assignedTo: 'Operations Team',
      createdAt: new Date().toISOString()
    };
    updateAndSaveTasks([newTask, ...tasks]);

    if (selectedBookingForFolio && selectedBookingForFolio.id === bookingId) {
      setSelectedBookingForFolio({ ...selectedBookingForFolio, status: 'checked_out', paidAmount: target.totalAmount });
    }
  };

  // Add Charge to Folio
  const handleAddFolioCharge = () => {
    if (!selectedBookingForFolio || !newCharge.description.trim()) return;

    const chargeItem = {
      id: `chg-${Date.now().toString().slice(-4)}`,
      description: newCharge.description,
      amount: Number(newCharge.amount) || 0,
      category: newCharge.category,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedCharges = [...(selectedBookingForFolio.folioCharges || []), chargeItem];
    const newTotal = updatedCharges.reduce((sum, c) => sum + c.amount, 0);

    const updatedBooking = {
      ...selectedBookingForFolio,
      folioCharges: updatedCharges,
      totalAmount: newTotal
    };

    setSelectedBookingForFolio(updatedBooking);
    const updatedBookings = bookings.map(b => (b.id === selectedBookingForFolio.id ? updatedBooking : b));
    updateAndSaveBookings(updatedBookings);

    setIsAddChargeModalOpen(false);
    setNewCharge({ description: '', amount: 50, category: 'Service' });
  };

  // Complete Task
  const handleCompleteTask = (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const updatedTasks = tasks.map(t => (t.id === taskId ? { ...t, status: 'completed' as const } : t));
    updateAndSaveTasks(updatedTasks);

    // If task was on a cleaning room, mark room available!
    if (targetTask?.resourceId) {
      const updatedRes = resources.map(r => {
        if (r.id === targetTask.resourceId && r.status === 'cleaning') {
          return { ...r, status: 'available' };
        }
        return r;
      });
      updateAndSaveResources(updatedRes);
    }
  };

  const domainIcon = useMemo(() => {
    switch (domain) {
      case 'hospitality': return <BedDouble className="w-5 h-5 text-indigo-500" />;
      case 'healthcare': return <Activity className="w-5 h-5 text-rose-500" />;
      case 'rental': return <Car className="w-5 h-5 text-amber-500" />;
      case 'manufacturing': return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'food_dining': return <Coffee className="w-5 h-5 text-emerald-500" />;
      default: return <Building className="w-5 h-5 text-primary" />;
    }
  }, [domain]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Universal Business Command Header */}
      <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#162238] border border-slate-200 dark:border-[#233554] shadow-xs">
              {domainIcon}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeBusiness.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                  {domain.replace('_', ' ')} Platform
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>{activeBusiness.catalogSchema?.summary || 'Tailored enterprise operations and client billing engine.'}</span>
              </p>
            </div>
          </div>

          {/* Quick Universal Operational Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{terminology.primaryAction}</span>
            </button>
            <button
              onClick={() => setCurrentModule('pos')}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#162238] hover:bg-slate-200 dark:hover:bg-[#1E2E4A] text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-[#233554] transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>POS Amenities Register</span>
            </button>
          </div>
        </div>

        {/* Live Operational KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-[#1F2E4D]">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200/80 dark:border-[#1F2E4D]">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total {terminology.resourcePlural}</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{metrics.total}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Occupied / Active</div>
            <div className="text-lg font-black text-blue-700 dark:text-blue-300 mt-0.5">{metrics.occupied} <span className="text-xs font-bold text-blue-500">({metrics.occupancyRate}%)</span></div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Available / Ready</div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{metrics.available}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Advance {terminology.transactionPlural}</div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">{metrics.reserved}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Turnover / Cleaning</div>
            <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5">{metrics.cleaning}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Active Folio Value</div>
            <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5">{currencySymbol || '$'}{metrics.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('board')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'board'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111C30] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F2E4D] hover:bg-slate-50 dark:hover:bg-[#162238]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{terminology.resourcePlural} Board</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'bookings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111C30] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F2E4D] hover:bg-slate-50 dark:hover:bg-[#162238]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{terminology.transactionPlural}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{bookings.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('folios')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'folios'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111C30] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F2E4D] hover:bg-slate-50 dark:hover:bg-[#162238]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{terminology.clientName} Folios & Settlement</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111C30] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F2E4D] hover:bg-slate-50 dark:hover:bg-[#162238]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Housekeeping & Operations</span>
          {tasks.filter(t => t.status !== 'completed').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">{tasks.filter(t => t.status !== 'completed').length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111C30] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F2E4D] hover:bg-slate-50 dark:hover:bg-[#162238]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Occupancy & Revenue Metrics</span>
        </button>
      </div>

      {/* TAB 1: VISUAL RESOURCE / ROOM BOARD */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${terminology.resourcePlural.toLowerCase()} or ${terminology.clientName.toLowerCase()} name...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Filter:</span>
              {['all', 'available', 'occupied', 'reserved', 'cleaning'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-[#111C30] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1F2E4D]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Resource Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resources
              .filter(r => {
                if (filterStatus !== 'all' && r.status !== filterStatus) return false;
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  return r.name.toLowerCase().includes(q) || (r.currentGuestOrClient && r.currentGuestOrClient.toLowerCase().includes(q)) || r.type.toLowerCase().includes(q);
                }
                return true;
              })
              .map(res => {
                const statusBg =
                  res.status === 'occupied'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                    : res.status === 'available'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                    : res.status === 'reserved'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                    : 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800';

                const statusBadge =
                  res.status === 'occupied'
                    ? 'bg-blue-600 text-white'
                    : res.status === 'available'
                    ? 'bg-emerald-600 text-white'
                    : res.status === 'reserved'
                    ? 'bg-amber-600 text-white'
                    : 'bg-purple-600 text-white';

                return (
                  <div
                    key={res.id}
                    className={`p-5 rounded-3xl border shadow-xs transition hover:shadow-md flex flex-col justify-between ${statusBg}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{res.name}</h3>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{res.type} • {res.floorOrLocation || 'Main Area'}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider ${statusBadge}`}>
                          {res.status}
                        </span>
                      </div>

                      {/* Guest / Occupant details */}
                      {res.status === 'occupied' && res.currentGuestOrClient && (
                        <div className="mt-4 p-3 rounded-2xl bg-white/80 dark:bg-[#0F172A]/80 border border-blue-200 dark:border-blue-900/60 text-xs">
                          <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 font-bold">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{res.currentGuestOrClient}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                            <span>Check-out: {res.checkOutDate || 'Scheduled'}</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{currencySymbol || '$'}{res.rate}{res.rateUnit || '/night'}</span>
                          </div>
                        </div>
                      )}

                      {res.status === 'reserved' && (
                        <div className="mt-4 p-3 rounded-2xl bg-white/80 dark:bg-[#0F172A]/80 border border-amber-200 dark:border-amber-900/60 text-xs">
                          <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reserved for: {res.currentGuestOrClient || 'VIP Booking'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Arrival: {res.checkInDate || 'Tomorrow'}
                          </div>
                        </div>
                      )}

                      {res.status === 'cleaning' && (
                        <div className="mt-4 p-3 rounded-2xl bg-white/80 dark:bg-[#0F172A]/80 border border-purple-200 dark:border-purple-900/60 text-xs flex items-center justify-between">
                          <span className="text-purple-950 dark:text-purple-200 font-medium">Housekeeping turnover in progress</span>
                          <button
                            onClick={() => handleSetResourceStatus(res.id, 'available')}
                            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition cursor-pointer"
                          >
                            Mark Cleaned & Ready
                          </button>
                        </div>
                      )}

                      {res.status === 'available' && (
                        <div className="mt-4 p-3 rounded-2xl bg-white/80 dark:bg-[#0F172A]/80 border border-emerald-200 dark:border-emerald-900/60 text-xs flex justify-between items-center">
                          <span className="text-emerald-900 dark:text-emerald-200 font-medium">Ready for immediate check-in</span>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{currencySymbol || '$'}{res.rate}{res.rateUnit || '/night'}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Toolbar */}
                    <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                      {res.status === 'available' && (
                        <button
                          onClick={() => {
                            setNewBooking(prev => ({ ...prev, resourceId: res.id }));
                            setIsBookingModalOpen(true);
                          }}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Check In Guest</span>
                        </button>
                      )}

                      {res.status === 'occupied' && (
                        <div className="w-full flex items-center gap-2">
                          <button
                            onClick={() => {
                              const matchingBooking = bookings.find(b => b.resourceId === res.id && b.status === 'checked_in');
                              if (matchingBooking) {
                                setSelectedBookingForFolio(matchingBooking);
                                setActiveTab('folios');
                              }
                            }}
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>View Folio</span>
                          </button>
                          <button
                            onClick={() => {
                              const matchingBooking = bookings.find(b => b.resourceId === res.id && b.status === 'checked_in');
                              if (matchingBooking) handleCheckOutAndSettle(matchingBooking.id);
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            Check Out
                          </button>
                        </div>
                      )}

                      {res.status === 'reserved' && (
                        <button
                          onClick={() => {
                            const matchingBooking = bookings.find(b => b.resourceId === res.id && b.status === 'confirmed');
                            if (matchingBooking) handleCheckIn(matchingBooking.id);
                          }}
                          className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Guest Arrived (Check In)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: RESERVATIONS & BOOKINGS TABLE */}
      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active {terminology.transactionPlural}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">All registered stays, arrivals, and billing folios.</p>
            </div>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New {terminology.transactionName}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1F2E4D] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">ID / Reference</th>
                  <th className="py-3 px-3">{terminology.clientName}</th>
                  <th className="py-3 px-3">{terminology.resourceName}</th>
                  <th className="py-3 px-3">Dates (In - Out)</th>
                  <th className="py-3 px-3">Total Folio</th>
                  <th className="py-3 px-3">Paid Deposit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1F2E4D]/60 text-slate-700 dark:text-slate-200 font-medium">
                {bookings.map(bk => (
                  <tr key={bk.id} className="hover:bg-slate-50/80 dark:hover:bg-[#162238]/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{bk.id}</td>
                    <td className="py-3 px-3 font-bold">{bk.clientName}</td>
                    <td className="py-3 px-3">{bk.resourceName}</td>
                    <td className="py-3 px-3 text-slate-500">{bk.checkInDate} → {bk.checkOutDate}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{currencySymbol || '$'}{bk.totalAmount}</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">{currencySymbol || '$'}{bk.paidAmount}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        bk.status === 'checked_in' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300' :
                        bk.status === 'confirmed' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {bk.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {bk.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(bk.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] transition cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBookingForFolio(bk);
                          setActiveTab('folios');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-[11px] transition cursor-pointer"
                      >
                        Folio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GUEST FOLIOS & CONSOLIDATED BILLING */}
      {activeTab === 'folios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Folio Selector Sidebar */}
          <div className="lg:col-span-4 bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active {terminology.clientName} Stays</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {bookings.map(bk => (
                <div
                  key={bk.id}
                  onClick={() => setSelectedBookingForFolio(bk)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedBookingForFolio?.id === bk.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#0B1220] border-slate-200 dark:border-[#1F2E4D] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{bk.clientName}</div>
                    <span className="text-[10px] font-bold text-slate-500">{bk.resourceName}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                    <span>Folio: {currencySymbol || '$'}{bk.totalAmount}</span>
                    <span className="text-emerald-600 font-bold">Paid: {currencySymbol || '$'}{bk.paidAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Folio Statement View */}
          <div className="lg:col-span-8 bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-6 shadow-sm space-y-5">
            {selectedBookingForFolio ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#1F2E4D]">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-indigo-500" />
                      <span>{terminology.clientName} Folio Statement: {selectedBookingForFolio.clientName}</span>
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {selectedBookingForFolio.resourceName} • Stay: {selectedBookingForFolio.checkInDate} to {selectedBookingForFolio.checkOutDate} ({selectedBookingForFolio.totalNightsOrUnits} Units)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddChargeModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Charge / Service</span>
                    </button>
                    {selectedBookingForFolio.status === 'checked_in' && (
                      <button
                        onClick={() => handleCheckOutAndSettle(selectedBookingForFolio.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Settle & Check Out</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Item Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itemized Account Charges</div>
                  <div className="border border-slate-200 dark:border-[#1F2E4D] rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#0B1220] text-slate-500 font-bold border-b border-slate-200 dark:border-[#1F2E4D]">
                        <tr>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1F2E4D]/60 text-slate-700 dark:text-slate-300">
                        {(selectedBookingForFolio.folioCharges || []).map(chg => (
                          <tr key={chg.id}>
                            <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{chg.date}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{chg.description}</td>
                            <td className="py-2.5 px-4 text-slate-500">{chg.category}</td>
                            <td className="py-2.5 px-4 text-right font-bold">{currencySymbol || '$'}{chg.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Totals */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1F2E4D] flex justify-between items-center text-xs">
                  <div>
                    <div className="text-slate-500 font-medium">Payment Status: <span className="font-bold uppercase text-slate-900 dark:text-white">{selectedBookingForFolio.status}</span></div>
                    <div className="text-slate-500 font-medium mt-0.5">Paid Deposits / Tenders: <span className="text-emerald-600 font-bold">{currencySymbol || '$'}{selectedBookingForFolio.paidAmount.toFixed(2)}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500 font-medium">Outstanding Balance</div>
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {currencySymbol || '$'}{Math.max(0, selectedBookingForFolio.totalAmount - selectedBookingForFolio.paidAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm">
                Select a guest stay from the left list to view and manage their consolidated billing folio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HOUSEKEEPING & OPERATIONS */}
      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operational & Housekeeping Task Queue</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Turnover cleaning, maintenance inspection, and room readiness.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map(tsk => (
              <div
                key={tsk.id}
                className={`p-4 rounded-2xl border flex justify-between items-start ${
                  tsk.status === 'completed'
                    ? 'bg-slate-50/60 dark:bg-[#0B1220]/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-[#152238] border-slate-200 dark:border-[#233554] shadow-2xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      tsk.priority === 'urgent' || tsk.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {tsk.priority}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{tsk.resourceName || 'Facility'}</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">{tsk.title}</div>
                  <div className="text-[11px] text-slate-400">Assigned to: {tsk.assignedTo || 'Staff'}</div>
                </div>

                {tsk.status !== 'completed' ? (
                  <button
                    onClick={() => handleCompleteTask(tsk.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                ) : (
                  <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Done</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: OCCUPANCY & REVENUE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Real-Time Occupancy Rate</span>
            </h4>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{metrics.occupancyRate}%</div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.occupancyRate}%` }} />
            </div>
            <p className="text-xs text-slate-500">{metrics.occupied} of {metrics.total} units currently in active revenue-generating status.</p>
          </div>

          <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              <span>Average Daily Rate (ADR)</span>
            </h4>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{currencySymbol || '$'}{metrics.avgRate}</div>
            <p className="text-xs text-slate-500">Calculated average base rate across all available and occupied inventory.</p>
          </div>

          <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" />
              <span>Outstanding Ledger Balances</span>
            </h4>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{currencySymbol || '$'}{metrics.pendingBalance.toLocaleString()}</div>
            <p className="text-xs text-slate-500">Unsettled room folio charges pending checkout payment.</p>
          </div>
        </div>
      )}

      {/* MODAL: CREATE BOOKING / CHECK IN */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" />
                <span>{terminology.primaryAction}</span>
              </h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select {terminology.resourceName}</label>
                <select
                  value={newBooking.resourceId}
                  onChange={e => setNewBooking({ ...newBooking, resourceId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.id} disabled={r.status === 'occupied'}>
                      {r.name} — {r.type} ({currencySymbol || '$'}{r.rate}) {r.status === 'occupied' ? '[Occupied]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{terminology.clientName} Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newBooking.clientName}
                    onChange={e => setNewBooking({ ...newBooking, clientName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newBooking.clientPhone}
                    onChange={e => setNewBooking({ ...newBooking, clientPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Check-in / Start Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.checkInDate}
                    onChange={e => setNewBooking({ ...newBooking, checkInDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Check-out / End Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.checkOutDate}
                    onChange={e => setNewBooking({ ...newBooking, checkOutDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Advance Deposit ({currency || 'USD'})</label>
                <input
                  type="number"
                  value={newBooking.depositAmount}
                  onChange={e => setNewBooking({ ...newBooking, depositAmount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirm & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FOLIO CHARGE */}
      {isAddChargeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Charge to {selectedBookingForFolio?.clientName}'s Folio</h3>
              <button onClick={() => setIsAddChargeModalOpen(false)} className="p-1 rounded-xl text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Room Service Dinner, Spa Massage, Chauffeur"
                  value={newCharge.description}
                  onChange={e => setNewCharge({ ...newCharge, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ({currencySymbol || '$'})</label>
                  <input
                    type="number"
                    value={newCharge.amount}
                    onChange={e => setNewCharge({ ...newCharge, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newCharge.category}
                    onChange={e => setNewCharge({ ...newCharge, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Dining">In-Room Dining / Restaurant</option>
                    <option value="Spa">Spa & Wellness</option>
                    <option value="Transportation">Valet & Chauffeur</option>
                    <option value="Laundry">Laundry Service</option>
                    <option value="MiniBar">Mini Bar</option>
                    <option value="Other">Other Service</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddChargeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddFolioCharge}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Add to Folio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
